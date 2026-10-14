import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente con la service role key: saltea RLS. Solo para integraciones de
// servidor que no tienen un usuario logueado (BILL), nunca desde el
// navegador ni en código que corre en el cliente.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
