import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { PackingListItem } from "@/lib/eventos/packing-list";

export type OrdenCompra = {
  id: string;
  generadaEn: string;
  items: PackingListItem[];
};

export async function getOrdenCompra(
  supabase: SupabaseClient<Database>,
  eventoId: string,
): Promise<OrdenCompra | null> {
  const { data: orden, error } = await supabase
    .from("ordenes_compra")
    .select("id, updated_at")
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!orden) return null;

  const { data: items, error: itemsError } = await supabase
    .from("orden_compra_items")
    .select("insumo_id, cantidad, unidad, insumos(nombre)")
    .eq("orden_compra_id", orden.id);

  if (itemsError) throw new Error(itemsError.message);

  return {
    id: orden.id,
    generadaEn: orden.updated_at,
    items: items.map((item) => ({
      insumoId: item.insumo_id,
      insumoNombre: item.insumos?.nombre ?? "Insumo",
      unidad: item.unidad,
      cantidad: item.cantidad,
    })),
  };
}
