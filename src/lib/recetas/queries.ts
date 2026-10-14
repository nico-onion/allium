import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { RecetaParaCosto } from "@/lib/recetas/costo";

// Todas las recetas con lo necesario para calcular su costo completo
// (insumos con merma y sub-recetas). Son pocas, así que se traen de una vez
// y el costo se resuelve en memoria con calcularCostoCompleto.
export async function getRecetasParaCosto(
  supabase: SupabaseClient<Database>,
): Promise<(RecetaParaCosto & { categoria: string | null; es_subreceta: boolean })[]> {
  const { data, error } = await supabase
    .from("recetas")
    .select(
      "id, nombre, categoria, porcion_base, es_subreceta, rendimiento_unidad, pct_varios, precio_venta, receta_insumos(cantidad, unidad, insumos(id, nombre, costo_unitario, unidad, merma_pct)), receta_subrecetas!receta_subrecetas_receta_id_fkey(cantidad, unidad, subreceta_id)",
    )
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data.map((receta) => ({
    ...receta,
    porcion_base: Number(receta.porcion_base),
    pct_varios: Number(receta.pct_varios),
    precio_venta: receta.precio_venta === null ? null : Number(receta.precio_venta),
    receta_insumos: receta.receta_insumos.map((ri) => ({
      cantidad: Number(ri.cantidad),
      unidad: ri.unidad,
      insumos: ri.insumos
        ? {
            ...ri.insumos,
            costo_unitario: Number(ri.insumos.costo_unitario),
            merma_pct:
              ri.insumos.merma_pct === null ? null : Number(ri.insumos.merma_pct),
          }
        : null,
    })),
    receta_subrecetas: receta.receta_subrecetas.map((rs) => ({
      ...rs,
      cantidad: Number(rs.cantidad),
    })),
  }));
}

export async function getReceta(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("recetas")
    .select(
      "id, nombre, categoria, porcion_base, es_subreceta, rendimiento_unidad, pct_varios, precio_venta",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getRecetaInsumos(
  supabase: SupabaseClient<Database>,
  recetaId: string,
) {
  const { data, error } = await supabase
    .from("receta_insumos")
    .select(
      "id, insumo_id, cantidad, unidad, insumos(nombre, costo_unitario, unidad)",
    )
    .eq("receta_id", recetaId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getRecetaSubrecetas(
  supabase: SupabaseClient<Database>,
  recetaId: string,
) {
  const { data, error } = await supabase
    .from("receta_subrecetas")
    .select("id, subreceta_id, cantidad, unidad")
    .eq("receta_id", recetaId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// Sub-recetas disponibles para usar dentro de otra receta.
export async function getSubrecetasParaSelector(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("recetas")
    .select("id, nombre, rendimiento_unidad, porcion_base")
    .eq("es_subreceta", true)
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
