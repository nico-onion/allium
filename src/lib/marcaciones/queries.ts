import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getPersonaVinculada(
  supabase: SupabaseClient<Database>,
  authUserId: string,
) {
  const { data, error } = await supabase
    .from("personal")
    .select("id, nombre")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getUltimaMarcacion(
  supabase: SupabaseClient<Database>,
  personalId: string,
) {
  const { data, error } = await supabase
    .from("marcaciones")
    .select("tipo, marcado_en")
    .eq("personal_id", personalId)
    .order("marcado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getHistorialMarcaciones(
  supabase: SupabaseClient<Database>,
  personalId: string,
  limite = 20,
) {
  const { data, error } = await supabase
    .from("marcaciones")
    .select("id, tipo, marcado_en, foto_url, latitud, longitud")
    .eq("personal_id", personalId)
    .order("marcado_en", { ascending: false })
    .limit(limite);

  if (error) throw new Error(error.message);
  return data;
}
