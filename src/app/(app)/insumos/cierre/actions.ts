"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CierreMesFormState = { error?: string; ok?: string };

// Congela el costo vivo de todos los insumos como costo contable del mes.
// La validación (solo admins, un mes no se cierra dos veces) vive en la
// función de la base, que corre todo en una sola transacción.
export async function cerrarMesCostos(
  _prevState: CierreMesFormState,
  formData: FormData,
): Promise<CierreMesFormState> {
  const mes = formData.get("mes") as string; // "YYYY-MM"
  if (!/^\d{4}-\d{2}$/.test(mes ?? "")) return { error: "Elegí un mes válido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cerrar_mes_costos", { p_periodo: `${mes}-01` });
  if (error) return { error: error.message };

  revalidatePath("/insumos/cierre");
  revalidatePath("/insumos");
  return { ok: `Mes ${mes.slice(5)}/${mes.slice(0, 4)} cerrado.` };
}
