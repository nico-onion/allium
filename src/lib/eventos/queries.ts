import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EventoEstado } from "@/lib/supabase/database.types";
import { TIPOS_BASE } from "@/lib/eventos/constants";

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
      "id, nombre, tipo, fecha, invitados, estado, ubicacion, precio_por_persona, precio_total, margen_objetivo, costo_cotizado, link_cotizacion, cliente_id, codigo, resena_enviada_en, cerrado_en, clientes(id, nombre, telefono)",
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

// tipo es texto libre: el selector combina los tipos base conocidos del
// negocio (siempre disponibles, aunque no se haya cargado ningún evento
// todavía con ese tipo) con cualquier otro valor que ya se haya escrito a
// mano vía "+ Otro" en eventos existentes.
export async function getTiposDeEventoUsados(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data, error } = await supabase.from("eventos").select("tipo");

  if (error) throw new Error(error.message);

  const tipos = new Set([...TIPOS_BASE, ...data.map((evento) => evento.tipo)]);
  return Array.from(tipos).sort((a, b) => a.localeCompare(b));
}

export async function getMenuDeEvento(
  supabase: SupabaseClient<Database>,
  eventoId: string,
) {
  const { data, error } = await supabase
    .from("menus")
    .select("id, nombre")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMenuItems(
  supabase: SupabaseClient<Database>,
  menuId: string,
) {
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, cantidad_porciones, receta_id, recetas(nombre, porcion_base)")
    .eq("menu_id", menuId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getRecetasParaSelector(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("recetas")
    .select("id, nombre, porcion_base")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// Eventos a los que se les puede asignar una compra o un gasto: los no
// cerrados, de los últimos 60 días en adelante.
export async function getEventosParaSelector(supabase: SupabaseClient<Database>) {
  const desde = new Date(Date.now() - 60 * 864e5).toISOString();
  const { data, error } = await supabase
    .from("eventos")
    .select("id, nombre, codigo, fecha")
    .is("cerrado_en", null)
    .neq("estado", "cancelado")
    .gte("fecha", desde)
    .order("fecha", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
