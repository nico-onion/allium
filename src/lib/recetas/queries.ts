import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getRecetas(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("recetas")
    .select(
      "id, nombre, categoria, porcion_base, receta_insumos(cantidad, unidad, insumos(costo_unitario, unidad))",
    )
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getReceta(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("recetas")
    .select("id, nombre, categoria, porcion_base")
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
