import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getInsumos(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("insumos")
    .select(
      "id, nombre, categoria, unidad, tipo_almacenamiento, costo_unitario, merma_pct, marca_preferida, marca_alternativa, stock_actual, stock_minimo, proveedores(nombre)",
    )
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getInsumo(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("insumos")
    .select(
      "id, nombre, categoria, unidad, tipo_almacenamiento, costo_unitario, costo_contable, merma_pct, marca_preferida, marca_alternativa, stock_actual, stock_minimo, proveedor_id, proveedores(id, nombre)",
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
    .select("id, nombre, unidad, costo_unitario, merma_pct, marca_preferida, marca_alternativa")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getMovimientosStock(
  supabase: SupabaseClient<Database>,
  insumoId: string,
) {
  const { data, error } = await supabase
    .from("movimientos_stock")
    .select(
      "id, tipo, cantidad, unidad, nota, created_at, evento_id, compra_id, verificado, nota_verificacion, eventos(nombre)",
    )
    .eq("insumo_id", insumoId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Compras con una discrepancia reportada (nota_verificacion cargada), en
// cualquier insumo — para no perderlas de vista en el dashboard/lista.
export async function getCantidadDiscrepancias(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await supabase
    .from("movimientos_stock")
    .select("id", { count: "exact", head: true })
    .eq("tipo", "compra")
    .not("nota_verificacion", "is", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getRendimientos(
  supabase: SupabaseClient<Database>,
  insumoId: string,
) {
  const { data, error } = await supabase
    .from("rendimientos")
    .select("id, fecha, peso_inicial, peso_perdida, peso_aprovechado, nota")
    .eq("insumo_id", insumoId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCostoHistorial(
  supabase: SupabaseClient<Database>,
  insumoId: string,
) {
  const { data, error } = await supabase
    .from("costo_historial")
    .select("id, costo_anterior, costo_nuevo, origen, compra_id, created_at")
    .eq("insumo_id", insumoId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data;
}
