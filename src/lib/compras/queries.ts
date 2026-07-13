import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getCompras(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("compras")
    .select(
      "id, fecha, numero_factura, proveedores(nombre), movimientos_stock(id, verificado)",
    )
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((compra) => ({
    id: compra.id,
    fecha: compra.fecha,
    numeroFactura: compra.numero_factura,
    proveedorNombre: compra.proveedores?.nombre ?? null,
    cantidadItems: compra.movimientos_stock.length,
    itemsPendientes: compra.movimientos_stock.filter((item) => !item.verificado)
      .length,
  }));
}

export async function getCompra(supabase: SupabaseClient<Database>, id: string) {
  const { data: compra, error } = await supabase
    .from("compras")
    .select("id, fecha, numero_factura, proveedores(nombre)")
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
    proveedorNombre: compra.proveedores?.nombre ?? null,
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
