"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { registrarEntradaAjuste, registrarSalida } from "@/lib/stock/movimientos";

export type MovimientoStockFormState = { error?: string };

export async function crearMovimientoStockManual(
  insumoId: string,
  _prevState: MovimientoStockFormState,
  formData: FormData,
): Promise<MovimientoStockFormState> {
  const tipo = formData.get("tipo") as "ajuste" | "merma";
  const magnitud = Number(formData.get("cantidad"));
  const direccion = formData.get("direccion") as string;
  const nota = (formData.get("nota") as string)?.trim() || null;

  if (tipo !== "ajuste" && tipo !== "merma") {
    return { error: "Tipo de movimiento inválido." };
  }
  if (!magnitud || magnitud <= 0) {
    return { error: "La cantidad debe ser mayor a 0." };
  }

  const supabase = await createClient();
  const resta = tipo === "merma" || direccion === "restar";
  const resultado = resta
    ? await registrarSalida(supabase, { insumoId, cantidad: magnitud, tipo, nota })
    : await registrarEntradaAjuste(supabase, {
        insumoId,
        cantidad: magnitud,
        nota,
        fechaVencimiento: (formData.get("fecha_vencimiento") as string) || null,
      });
  if (resultado.error) return { error: resultado.error };

  revalidatePath(`/insumos/${insumoId}/editar`);
  revalidatePath("/insumos");
  revalidatePath("/insumos/vencimientos");
  return {};
}
