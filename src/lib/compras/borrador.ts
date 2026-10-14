import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompraOrigen, Database, InsumoUnidad } from "@/lib/supabase/database.types";
import { claveProveedor, normalizarDescripcion } from "@/lib/compras/normalizar";
import type { TasaIva } from "@/lib/compras/iva";

type Supabase = SupabaseClient<Database>;

export type LineaFactura = {
  descripcion: string;
  cantidad: number;
  unidad: InsumoUnidad;
  subtotal: number;
  tasaIva: TasaIva;
  fechaVencimiento?: string | null;
};

export type DatosFactura = {
  origen: CompraOrigen;
  fecha: string;
  numeroFactura: string | null;
  proveedorId: string | null;
  // como figura en la factura; si hay proveedorId se usa su nombre
  proveedorTexto: string | null;
  ruc: string | null;
  eventoId: string | null;
  comprobanteUrl: string | null;
  total: number | null;
  lineas: LineaFactura[];
};

export type ResultadoBorrador =
  | { duplicada: true; compraId: string; estado: string }
  | { duplicada: false; compraId: string; pendientes: string[] }
  | { error: string };

// Guarda una factura de compra tal cual viene (renglón por renglón) en
// borrador. Lo que ya se conoce de ese proveedor se asigna solo; el resto
// queda pendiente para la pantalla de revisión. Lo usan la carga manual y
// la entrada de BILL.
export async function crearCompraBorrador(
  supabase: Supabase,
  datos: DatosFactura,
): Promise<ResultadoBorrador> {
  const lineas = datos.lineas.filter(
    (linea) => linea.descripcion.trim() && linea.cantidad > 0 && linea.subtotal >= 0,
  );
  if (lineas.length === 0) return { error: "La factura no tiene renglones válidos." };

  // La misma factura cargada dos veces no se duplica.
  if (datos.numeroFactura) {
    let consulta = supabase
      .from("compras")
      .select("id, estado")
      .eq("numero_factura", datos.numeroFactura);
    if (datos.ruc) consulta = consulta.eq("ruc_proveedor", datos.ruc);
    else if (datos.proveedorId) consulta = consulta.eq("proveedor_id", datos.proveedorId);
    const { data: existente } = await consulta.limit(1).maybeSingle();
    if (existente) return { duplicada: true, compraId: existente.id, estado: existente.estado };
  }

  let nombreProveedor = datos.proveedorTexto;
  if (datos.proveedorId) {
    const { data } = await supabase
      .from("proveedores")
      .select("nombre")
      .eq("id", datos.proveedorId)
      .maybeSingle();
    nombreProveedor = data?.nombre ?? nombreProveedor;
  }

  const total = datos.total ?? lineas.reduce((acc, linea) => acc + linea.subtotal, 0);

  const { data: compra, error: compraError } = await supabase
    .from("compras")
    .insert({
      fecha: datos.fecha,
      numero_factura: datos.numeroFactura,
      proveedor_id: datos.proveedorId,
      proveedor_texto: datos.proveedorTexto,
      ruc_proveedor: datos.ruc,
      comprobante_url: datos.comprobanteUrl,
      evento_id: datos.eventoId,
      total,
      estado: "borrador",
      origen: datos.origen,
    })
    .select("id")
    .single();

  if (compraError || !compra) {
    return { error: compraError?.message ?? "No se pudo crear la compra." };
  }

  const { data: alias } = await supabase
    .from("alias_compras")
    .select("descripcion_normalizada, destino, insumo_id, categoria_gasto, factor")
    .eq("clave_proveedor", claveProveedor(datos.ruc, nombreProveedor));
  const conocidos = new Map((alias ?? []).map((fila) => [fila.descripcion_normalizada, fila]));

  const filas = lineas.map((linea, i) => {
    const conocido = conocidos.get(normalizarDescripcion(linea.descripcion));
    return {
      compra_id: compra.id,
      orden: i,
      descripcion: linea.descripcion.trim(),
      cantidad: linea.cantidad,
      unidad: linea.unidad,
      subtotal: linea.subtotal,
      tasa_iva: linea.tasaIva,
      fecha_vencimiento: linea.fechaVencimiento ?? null,
      precio_unitario: Math.round((linea.subtotal / linea.cantidad) * 100) / 100,
      destino: conocido?.destino ?? null,
      insumo_id: conocido?.insumo_id ?? null,
      categoria_gasto: conocido?.categoria_gasto ?? null,
      factor: conocido?.factor ?? null,
    };
  });

  const { error: lineasError } = await supabase.from("compra_lineas").insert(filas);
  if (lineasError) {
    await supabase.from("compras").delete().eq("id", compra.id);
    return { error: lineasError.message };
  }

  return {
    duplicada: false,
    compraId: compra.id,
    pendientes: filas.filter((fila) => !fila.destino).map((fila) => fila.descripcion),
  };
}
