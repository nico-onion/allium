import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EventoEstado } from "@/lib/supabase/database.types";

export async function getEventos(
  supabase: SupabaseClient<Database>,
  options: {
    estados: readonly EventoEstado[];
    estado?: EventoEstado;
    ascending?: boolean;
  },
) {
  const { estados, estado, ascending = true } = options;

  let query = supabase
    .from("eventos")
    .select(
      "id, nombre, tipo, fecha, invitados, estado, precio_por_persona, precio_total, link_cotizacion, clientes(nombre)",
    )
    .order("fecha", { ascending });

  query = estado ? query.eq("estado", estado) : query.in("estado", estados as EventoEstado[]);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getEvento(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("eventos")
    .select(
      "id, nombre, tipo, fecha, invitados, estado, ubicacion, precio_por_persona, precio_total, margen_objetivo, link_cotizacion, cliente_id, clientes(id, nombre)",
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
