import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InsumoUnidad } from "@/lib/supabase/database.types";

export type OrdenCompraItem = {
  id: string;
  insumoId: string;
  insumoNombre: string;
  cantidad: number;
  cantidadUsada: number | null;
  unidad: InsumoUnidad;
  insumoUnidad: InsumoUnidad;
  insumoStockActual: number;
};

export type OrdenCompra = {
  id: string;
  generadaEn: string;
  reconciliado: boolean;
  reconciliadoEn: string | null;
  items: OrdenCompraItem[];
};

export async function getOrdenCompra(
  supabase: SupabaseClient<Database>,
  eventoId: string,
): Promise<OrdenCompra | null> {
  const { data: orden, error } = await supabase
    .from("ordenes_compra")
    .select("id, updated_at, reconciliado, reconciliado_en")
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!orden) return null;

  const { data: items, error: itemsError } = await supabase
    .from("orden_compra_items")
    .select(
      "id, insumo_id, cantidad, cantidad_usada, unidad, insumos(nombre, unidad, stock_actual)",
    )
    .eq("orden_compra_id", orden.id);

  if (itemsError) throw new Error(itemsError.message);

  return {
    id: orden.id,
    generadaEn: orden.updated_at,
    reconciliado: orden.reconciliado,
    reconciliadoEn: orden.reconciliado_en,
    items: items.map((item) => ({
      id: item.id,
      insumoId: item.insumo_id,
      insumoNombre: item.insumos?.nombre ?? "Insumo",
      cantidad: item.cantidad,
      cantidadUsada: item.cantidad_usada,
      unidad: item.unidad,
      insumoUnidad: item.insumos?.unidad ?? item.unidad,
      insumoStockActual: item.insumos?.stock_actual ?? 0,
    })),
  };
}
