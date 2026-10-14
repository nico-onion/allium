import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearCompraBorrador } from "@/lib/compras/borrador";
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
      };
    })
    .filter((linea) => linea.descripcion && linea.cantidad > 0 && linea.subtotal >= 0);

  if (lineas.length === 0) {
    return respuesta(400, { ok: false, error: "La factura no trae líneas válidas." });
  }

  const supabase = createAdminClient();

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

  const resultado = await crearCompraBorrador(supabase, {
    origen: "bill",
    fecha,
    numeroFactura,
    proveedorId: proveedorExistente?.id ?? null,
    proveedorTexto: proveedor,
    ruc,
    eventoId: evento?.id ?? null,
    comprobanteUrl: texto(body.comprobante_url),
    total: aNumero(body.total),
    lineas,
  });

  if ("error" in resultado) return respuesta(500, { ok: false, error: resultado.error });
  if (resultado.duplicada) {
    return respuesta(200, {
      ok: true,
      duplicada: true,
      compra_id: resultado.compraId,
      estado: resultado.estado,
      mensaje: "Esta factura ya estaba cargada.",
    });
  }

  const { compraId, pendientes } = resultado;
  let estado: "borrador" | "confirmada" = "borrador";
  if (pendientes.length === 0) {
    const confirmacion = await confirmarCompra(supabase, compraId);
    if (!confirmacion.error) estado = "confirmada";
  }

  const base = process.env.APP_URL ?? "https://somosallium.com";
  return respuesta(201, {
    ok: true,
    compra_id: compraId,
    estado,
    evento: evento ? { codigo: evento.codigo, nombre: evento.nombre } : null,
    evento_no_encontrado: eventoCodigo && !evento ? eventoCodigo : null,
    pendientes,
    url: `${base}/compras/${compraId}`,
    mensaje:
      estado === "confirmada"
        ? `Compra registrada${evento ? ` en ${evento.codigo}` : ""}.`
        : `Quedó en borrador: ${pendientes.length} ítem(s) nuevos para revisar.`,
  });
}
