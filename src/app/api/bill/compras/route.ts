import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { claveProveedor, normalizarDescripcion } from "@/lib/compras/normalizar";
import { confirmarCompra } from "@/lib/compras/registrar";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

// Entrada de facturas de compra leídas por BILL (WhatsApp → n8n → Claude).
//
// POST /api/bill/compras
// Authorization: Bearer <BILL_API_TOKEN>
// {
//   "proveedor": "Alimentos Especiales S.A.", "ruc_proveedor": "80003296-9",
//   "numero_factura": "007-011-0331144", "fecha": "2026-10-11", "total": 265013,
//   "evento_codigo": "EV-OCT26-001", "comprobante_url": "https://drive.google.com/...",
//   "lineas": [{ "descripcion": "LECHUGA COMUN X UN", "cantidad": 2,
//                "unidad": "un", "precio_unitario": 3650, "subtotal": 7300 }]
// }
//
// Las líneas que el sistema ya conoce para ese proveedor se asignan solas. Si
// todas se reconocen, la compra queda confirmada (stock, costos y ejecutado
// del evento al día); si no, queda en borrador y la respuesta lista las
// pendientes para que BILL avise por WhatsApp.

type LineaEntrada = {
  descripcion?: unknown;
  cantidad?: unknown;
  unidad?: unknown;
  precio_unitario?: unknown;
  subtotal?: unknown;
};

const UNIDADES: Record<string, InsumoUnidad> = {
  kg: "kg", kilo: "kg", kilos: "kg", kgs: "kg",
  g: "g", gr: "g", grs: "g", gramos: "g",
  l: "l", lt: "l", lts: "l", litro: "l", litros: "l",
  ml: "ml", cc: "ml",
  un: "unidad", unid: "unidad", unidad: "unidad", unidades: "unidad", u: "unidad",
  docena: "docena", doc: "docena",
};

function aUnidad(valor: unknown): InsumoUnidad {
  const clave = String(valor ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return UNIDADES[clave] ?? "unidad";
}

function aNumero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;
  // "1.234,5" o "1234.5"
  const texto = valor.trim();
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function tokenValido(request: Request): boolean {
  const esperado = process.env.BILL_API_TOKEN;
  if (!esperado) return false;
  const recibido = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

function respuesta(status: number, cuerpo: Record<string, unknown>) {
  return Response.json(cuerpo, { status });
}

export async function POST(request: Request) {
  if (!tokenValido(request)) return respuesta(401, { ok: false, error: "No autorizado." });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return respuesta(400, { ok: false, error: "El cuerpo no es JSON válido." });
  }

  const proveedor = texto(body.proveedor);
  const ruc = texto(body.ruc_proveedor);
  const numeroFactura = texto(body.numero_factura);
  const fecha = texto(body.fecha) ?? new Date().toISOString().slice(0, 10);
  const eventoCodigo = texto(body.evento_codigo)?.toUpperCase() ?? null;
  const lineasEntrada = Array.isArray(body.lineas) ? (body.lineas as LineaEntrada[]) : [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return respuesta(400, { ok: false, error: "fecha tiene que venir como AAAA-MM-DD." });
  }

  const lineas = lineasEntrada
    .map((linea) => {
      const cantidad = aNumero(linea.cantidad) ?? 1;
      const subtotal = aNumero(linea.subtotal);
      const precio = aNumero(linea.precio_unitario);
      return {
        descripcion: texto(linea.descripcion) ?? "",
        cantidad,
        unidad: aUnidad(linea.unidad),
        subtotal: subtotal ?? (precio ?? 0) * cantidad,
        precio_unitario: precio ?? (subtotal ?? 0) / (cantidad || 1),
      };
    })
    .filter((linea) => linea.descripcion && linea.cantidad > 0 && linea.subtotal >= 0);

  if (lineas.length === 0) {
    return respuesta(400, { ok: false, error: "La factura no trae líneas válidas." });
  }

  const supabase = createAdminClient();

  // Una misma factura enviada dos veces no se duplica.
  if (numeroFactura) {
    let consulta = supabase
      .from("compras")
      .select("id, estado")
      .eq("numero_factura", numeroFactura);
    consulta = ruc ? consulta.eq("ruc_proveedor", ruc) : consulta;
    const { data: existente } = await consulta.maybeSingle();
    if (existente) {
      return respuesta(200, {
        ok: true,
        duplicada: true,
        compra_id: existente.id,
        estado: existente.estado,
        mensaje: "Esta factura ya estaba cargada.",
      });
    }
  }

  let evento: { id: string; codigo: string | null; nombre: string } | null = null;
  if (eventoCodigo) {
    const { data } = await supabase
      .from("eventos")
      .select("id, codigo, nombre")
      .eq("codigo", eventoCodigo)
      .maybeSingle();
    evento = data;
  }

  const { data: proveedorExistente } = proveedor
    ? await supabase.from("proveedores").select("id").ilike("nombre", proveedor).maybeSingle()
    : { data: null };

  const total = aNumero(body.total) ?? lineas.reduce((acc, linea) => acc + linea.subtotal, 0);

  const { data: compra, error: compraError } = await supabase
    .from("compras")
    .insert({
      fecha,
      numero_factura: numeroFactura,
      proveedor_id: proveedorExistente?.id ?? null,
      proveedor_texto: proveedor,
      ruc_proveedor: ruc,
      comprobante_url: texto(body.comprobante_url),
      evento_id: evento?.id ?? null,
      total,
      estado: "borrador",
      origen: "bill",
    })
    .select("id")
    .single();

  if (compraError || !compra) {
    return respuesta(500, { ok: false, error: compraError?.message ?? "No se pudo crear la compra." });
  }

  // Lo que ya se conoce de este proveedor se asigna solo.
  const clave = claveProveedor(ruc, proveedor);
  const { data: alias } = await supabase
    .from("alias_compras")
    .select("descripcion_normalizada, destino, insumo_id, categoria_gasto, factor")
    .eq("clave_proveedor", clave);
  const aliasPorDescripcion = new Map(
    (alias ?? []).map((fila) => [fila.descripcion_normalizada, fila]),
  );

  const filas = lineas.map((linea, i) => {
    const conocido = aliasPorDescripcion.get(normalizarDescripcion(linea.descripcion));
    return {
      compra_id: compra.id,
      orden: i,
      ...linea,
      destino: conocido?.destino ?? null,
      insumo_id: conocido?.insumo_id ?? null,
      categoria_gasto: conocido?.categoria_gasto ?? null,
      factor: conocido?.factor ?? null,
    };
  });

  const { error: lineasError } = await supabase.from("compra_lineas").insert(filas);
  if (lineasError) {
    await supabase.from("compras").delete().eq("id", compra.id);
    return respuesta(500, { ok: false, error: lineasError.message });
  }

  const pendientes = filas.filter((fila) => !fila.destino).map((fila) => fila.descripcion);
  let estado: "borrador" | "confirmada" = "borrador";

  if (pendientes.length === 0) {
    const resultado = await confirmarCompra(supabase, compra.id);
    if (!resultado.error) estado = "confirmada";
  }

  const base = process.env.APP_URL ?? "https://somosallium.com";
  return respuesta(201, {
    ok: true,
    compra_id: compra.id,
    estado,
    evento: evento ? { codigo: evento.codigo, nombre: evento.nombre } : null,
    evento_no_encontrado: eventoCodigo && !evento ? eventoCodigo : null,
    pendientes,
    url: `${base}/compras/${compra.id}`,
    mensaje:
      estado === "confirmada"
        ? `Compra registrada${evento ? ` en ${evento.codigo}` : ""}.`
        : `Quedó en borrador: ${pendientes.length} ítem(s) nuevos para revisar.`,
  });
}
