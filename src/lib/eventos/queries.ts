import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EventoEstado } from "@/lib/supabase/database.types";

export async function getEventos(
  supabase: SupabaseClient<Database>,
  estado?: EventoEstado,
) {
  let query = supabase
    .from("eventos")
    .select(
      "id, nombre, tipo, fecha, invitados, estado, precio_total, clientes(nombre)",
    )
    .order("fecha", { ascending: true });

  if (estado) {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getEvento(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("eventos")
    .select(
      "id, nombre, tipo, fecha, invitados, estado, ubicacion, precio_total, margen_objetivo, cliente_id, clientes(id, nombre)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getClientesParaSelector(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
