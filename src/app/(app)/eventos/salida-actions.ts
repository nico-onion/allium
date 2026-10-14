"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { crearLote, registrarSalida } from "@/lib/stock/movimientos";

export type SalidaFormState = { error?: string };

function leerCantidad(valor: FormDataEntryValue | undefined): number {
  const texto = String(valor ?? "").trim().replace(",", ".");
  const n = Number(texto);
  return Number.isFinite(n) ? n : NaN;
}

function refrescar(eventoId: string) {
  revalidatePath(`/eventos/${eventoId}`);
  revalidatePath("/insumos");
  revalidatePath("/insumos/vencimientos");
  revalidatePath("/");
}

// Retira del almacén lo que usa un evento. Cada insumo sale al costo
// promedio del momento y descuenta primero los lotes que vencen antes.
export async function registrarSalidaEvento(
  eventoId: string,
  _prev: SalidaFormState,
  formData: FormData,
): Promise<SalidaFormState> {
  const insumoIds = formData.getAll("insumo_id") as string[];
  const cantidades = formData.getAll("cantidad");

  const porInsumo = new Map<string, number>();
  for (let i = 0; i < insumoIds.length; i++) {
    if (!insumoIds[i]) continue;
    const cantidad = leerCantidad(cantidades[i]);
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      return { error: "Revisá las cantidades: tienen que ser números (con coma para decimales)." };
    }
    if (cantidad === 0) continue;
    porInsumo.set(insumoIds[i], (porInsumo.get(insumoIds[i]) ?? 0) + cantidad);
  }
  if (porInsumo.size === 0) return { error: "Agregá al menos un insumo con cantidad." };

  const supabase = await createClient();
  for (const [insumoId, cantidad] of porInsumo) {
    const resultado = await registrarSalida(supabase, {
      insumoId,
      cantidad,
      tipo: "uso_evento",
      eventoId,
    });
    if (resultado.error) return { error: resultado.error };
  }

  refrescar(eventoId);
  redirect(`/eventos/${eventoId}`);
}

// Deshace una salida cargada por error: vuelve al stock como un lote sin
// fecha (la fecha original no se puede recuperar) y deja de sumar al evento.
export async function anularSalida(eventoId: string, movimientoId: string) {
  const supabase = await createClient();
  const { data: mov, error } = await supabase
    .from("movimientos_stock")
    .select("id, insumo_id, cantidad, tipo, evento_id, insumos(stock_actual)")
    .eq("id", movimientoId)
    .maybeSingle();
  if (error || !mov) throw new Error(error?.message ?? "No se encontró la salida.");
  if (mov.tipo !== "uso_evento" || mov.evento_id !== eventoId) {
    throw new Error("Solo se pueden anular salidas de este evento.");
  }

  const cantidad = Math.abs(Number(mov.cantidad));
  const { error: deleteError } = await supabase.from("movimientos_stock").delete().eq("id", mov.id);
  if (deleteError) throw new Error(deleteError.message);

  const { error: stockError } = await supabase
    .from("insumos")
    .update({ stock_actual: Number(mov.insumos?.stock_actual ?? 0) + cantidad })
    .eq("id", mov.insumo_id);
  if (stockError) throw new Error(stockError.message);

  const lote = await crearLote(supabase, {
    insumoId: mov.insumo_id,
    cantidad,
    nota: "Devuelto de una salida anulada",
  });
  if (lote.error) throw new Error(lote.error);

  refrescar(eventoId);
}
