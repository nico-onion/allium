import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InsumoUnidad } from "@/lib/supabase/database.types";
import {
  getMenuDeEvento,
  getMenuItems,
  getRecetaInsumosDeRecetas,
} from "@/lib/eventos/queries";
import { calcularPackingList } from "@/lib/eventos/packing-list";

export type GenerarOrdenResultado = { error?: string };

// Genera (o reemplaza por completo) la orden de compra "vigente" de un
// evento, a partir del packing list calculado con el menú actual. Es una
// foto: una vez generada, no vuelve a tocarse sola aunque el menú cambie
// después — solo se reemplaza si se vuelve a llamar a esta función.
export async function generarOrdenCompra(
  supabase: SupabaseClient<Database>,
  eventoId: string,
): Promise<GenerarOrdenResultado> {
  const menu = await getMenuDeEvento(supabase, eventoId);
  if (!menu) {
    return { error: "El evento todavía no tiene un menú armado." };
  }

  const items = await getMenuItems(supabase, menu.id);
  if (items.length === 0) {
    return { error: "El menú todavía no tiene recetas cargadas." };
  }

  const recetaIds = [...new Set(items.map((item) => item.receta_id))];
  const recetaInsumos = await getRecetaInsumosDeRecetas(supabase, recetaIds);
  const packingList = calcularPackingList(items, recetaInsumos);

  if (packingList.length === 0) {
    return {
      error: "No se pudo calcular ningún insumo a partir del menú actual.",
    };
  }

  const { data: orden, error: ordenError } = await supabase
    .from("ordenes_compra")
    .upsert({ evento_id: eventoId }, { onConflict: "evento_id" })
    .select("id")
    .single();

  if (ordenError || !orden) {
    return {
      error: ordenError?.message ?? "No se pudo generar la orden de compra.",
    };
  }

  const { error: deleteError } = await supabase
    .from("orden_compra_items")
    .delete()
    .eq("orden_compra_id", orden.id);

  if (deleteError) return { error: deleteError.message };

  const { error: insertError } = await supabase.from("orden_compra_items").insert(
    packingList.map((item) => ({
      orden_compra_id: orden.id,
      insumo_id: item.insumoId,
      cantidad: item.cantidad,
      unidad: item.unidad as InsumoUnidad,
    })),
  );

  if (insertError) return { error: insertError.message };

  return {};
}
