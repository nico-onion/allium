import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getInsumos(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("insumos")
    .select(
      "id, nombre, categoria, unidad, costo_unitario, stock_actual, stock_minimo, proveedores(nombre)",
    )
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getInsumo(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("insumos")
    .select(
      "id, nombre, categoria, unidad, costo_unitario, stock_actual, stock_minimo, proveedor_id, proveedores(id, nombre)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getProveedoresParaSelector(
  supabase: SupabaseClient<Database>,
) {
  const { data, error } = await supabase
    .from("proveedores")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getInsumosParaSelector(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("insumos")
    .select("id, nombre, unidad, costo_unitario")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
