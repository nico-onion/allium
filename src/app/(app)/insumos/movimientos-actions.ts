"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TipoMovimientoStock } from "@/lib/supabase/database.types";

export type MovimientoStockFormState = { error?: string };

export async function crearMovimientoStockManual(
  insumoId: string,
  _prevState: MovimientoStockFormState,
  formData: FormData,
): Promise<MovimientoStockFormState> {
  const tipo = formData.get("tipo") as TipoMovimientoStock;
  const magnitud = Number(formData.get("cantidad"));
  const direccion = formData.get("direccion") as string;
  const nota = (formData.get("nota") as string)?.trim() || null;

  if (!["ajuste", "merma"].includes(tipo)) {
    return { error: "Tipo de movimiento inválido." };
  }
  if (!magnitud || magnitud <= 0) {
    return { error: "La cantidad debe ser mayor a 0." };
  }

  const cantidad =
    tipo === "merma"
      ? -magnitud
      : direccion === "restar"
        ? -magnitud
        : magnitud;

  const supabase = await createClient();

  const { data: insumo, error: insumoError } = await supabase
    .from("insumos")
    .select("stock_actual, unidad")
    .eq("id", insumoId)
    .maybeSingle();

  if (insumoError || !insumo) {
    return { error: insumoError?.message ?? "No se encontró el insumo." };
  }

  const { error: movimientoError } = await supabase.from("movimientos_stock").insert({
    insumo_id: insumoId,
    tipo,
    cantidad,
    unidad: insumo.unidad,
    nota,
  });

  if (movimientoError) return { error: movimientoError.message };

  const nuevoStock = Math.max(0, Number(insumo.stock_actual) + cantidad);

  const { error: stockError } = await supabase
    .from("insumos")
    .update({ stock_actual: nuevoStock })
    .eq("id", insumoId);

  if (stockError) return { error: stockError.message };

  revalidatePath(`/insumos/${insumoId}/editar`);
  revalidatePath("/insumos");
  return {};
}
