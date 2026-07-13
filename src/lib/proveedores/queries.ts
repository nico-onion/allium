import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getProveedores(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("proveedores")
    .select("id, nombre, contacto, notas, insumos(id)")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);

  return data.map((proveedor) => ({
    id: proveedor.id,
    nombre: proveedor.nombre,
    contacto: proveedor.contacto,
    notas: proveedor.notas,
    cantidadInsumos: proveedor.insumos.length,
  }));
}

export async function getProveedor(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const { data, error } = await supabase
    .from("proveedores")
    .select("id, nombre, contacto, notas")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getInsumosDeProveedor(
  supabase: SupabaseClient<Database>,
  proveedorId: string,
) {
  const { data, error } = await supabase
    .from("insumos")
    .select("id, nombre, unidad, costo_unitario")
    .eq("proveedor_id", proveedorId)
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
