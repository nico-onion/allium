"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type VerificacionFormState = { error?: string };

export async function verificarMovimientoStock(
  movimientoId: string,
  insumoId: string,
  compraId: string,
  _prevState: VerificacionFormState,
  formData: FormData,
): Promise<VerificacionFormState> {
  const nota = (formData.get("nota_verificacion") as string)?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("movimientos_stock")
    .update({ verificado: true, nota_verificacion: nota })
    .eq("id", movimientoId);

  if (error) return { error: error.message };

  revalidatePath(`/compras/${compraId}`);
  revalidatePath("/compras");
  revalidatePath(`/insumos/${insumoId}/editar`);
  revalidatePath("/insumos");
  revalidatePath("/");
  return {};
}
