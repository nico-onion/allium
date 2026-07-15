import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getPersonalLista(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("personal")
    .select("id, nombre, rol, telefono, turnos(id)")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);

  return data.map((persona) => ({
    id: persona.id,
    nombre: persona.nombre,
    rol: persona.rol,
    telefono: persona.telefono,
    cantidadEventos: persona.turnos.length,
  }));
}

export async function getPersona(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("personal")
    .select("id, nombre, rol, telefono")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPersonalParaSelector(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("personal")
    .select("id, nombre, rol")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getEventosDePersona(
  supabase: SupabaseClient<Database>,
  personalId: string,
) {
  const { data, error } = await supabase
    .from("turnos")
    .select("id, rol_en_evento, costo, confirmado, eventos(id, nombre, fecha, estado)")
    .eq("personal_id", personalId)
    .order("fecha", { foreignTable: "eventos", ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getTurnosDeEvento(
  supabase: SupabaseClient<Database>,
  eventoId: string,
) {
  const { data, error } = await supabase
    .from("turnos")
    .select("id, rol_en_evento, costo, confirmado, personal_id, personal(nombre, rol)")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
