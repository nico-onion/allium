import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getCompras(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("compras")
    .select(
      "id, fecha, numero_factura, estado, origen, total, proveedor_texto, proveedores(nombre), eventos(codigo, nombre), movimientos_stock(id, verificado), compra_lineas(id, destino)",
    )
    .order("estado", { ascending: true })
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((compra) => ({
    id: compra.id,
    fecha: compra.fecha,
    numeroFactura: compra.numero_factura,
    estado: compra.estado,
    origen: compra.origen,
    total: compra.total === null ? null : Number(compra.total),
    proveedorNombre: compra.proveedores?.nombre ?? compra.proveedor_texto ?? null,
    eventoCodigo: compra.eventos?.codigo ?? null,
    eventoNombre: compra.eventos?.nombre ?? null,
    cantidadItems: Math.max(compra.compra_lineas.length, compra.movimientos_stock.length),
    lineasSinAsignar: compra.compra_lineas.filter((linea) => !linea.destino).length,
    itemsPendientes: compra.movimientos_stock.filter((item) => !item.verificado).length,
  }));
}

export async function getCompra(supabase: SupabaseClient<Database>, id: string) {
  const { data: compra, error } = await supabase
    .from("compras")
    .select(
      "id, fecha, numero_factura, estado, origen, total, proveedor_texto, ruc_proveedor, comprobante_url, evento_id, proveedores(nombre), eventos(id, codigo, nombre), compra_lineas(id, orden, descripcion, cantidad, unidad, precio_unitario, subtotal, destino, insumo_id, factor, categoria_gasto, insumos(nombre, unidad))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!compra) return null;

  const { data: items, error: itemsError } = await supabase
    .from("movimientos_stock")
    .select("id, insumo_id, cantidad, unidad, verificado, nota_verificacion, insumos(nombre)")
    .eq("compra_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) throw new Error(itemsError.message);

  return {
    id: compra.id,
    fecha: compra.fecha,
    numeroFactura: compra.numero_factura,
    estado: compra.estado,
    origen: compra.origen,
    total: compra.total === null ? null : Number(compra.total),
    proveedorNombre: compra.proveedores?.nombre ?? compra.proveedor_texto ?? null,
    rucProveedor: compra.ruc_proveedor,
    comprobanteUrl: compra.comprobante_url,
    eventoId: compra.evento_id,
    evento: compra.eventos,
    lineas: [...compra.compra_lineas]
      .sort((a, b) => a.orden - b.orden)
      .map((linea) => ({
        ...linea,
        cantidad: Number(linea.cantidad),
        precio_unitario: Number(linea.precio_unitario),
        subtotal: Number(linea.subtotal),
        factor: linea.factor === null ? null : Number(linea.factor),
      })),
    items: items.map((item) => ({
      id: item.id,
      insumoId: item.insumo_id,
      insumoNombre: item.insumos?.nombre ?? "Insumo",
      cantidad: item.cantidad,
      unidad: item.unidad,
      verificado: item.verificado,
      notaVerificacion: item.nota_verificacion,
    })),
  };
}
