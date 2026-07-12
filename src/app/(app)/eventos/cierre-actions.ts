"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrdenCompra } from "@/lib/ordenes-compra/queries";
import { convertirUnidad } from "@/lib/recetas/costo";

export type CierreFormState = { error?: string };

export async function reconciliarCierreEvento(
  eventoId: string,
  _prevState: CierreFormState,
  formData: FormData,
): Promise<CierreFormState> {
  const supabase = await createClient();

  const orden = await getOrdenCompra(supabase, eventoId);
  if (!orden) {
    return { error: "Este evento no tiene una orden de compra generada." };
  }
  if (orden.reconciliado) {
    return { error: "Esta orden ya fue reconciliada." };
  }

  const itemIds = formData.getAll("item_id") as string[];
  const cantidadesUsadas = formData.getAll("cantidad_usada") as string[];

  if (itemIds.length === 0) {
    return { error: "No hay insumos para reconciliar." };
  }

  const itemsPorId = new Map(orden.items.map((item) => [item.id, item]));
  const actualizacionesCantidadUsada: { id: string; cantidad_usada: number }[] = [];
  const deduccionesPorInsumo = new Map<string, number>();

  for (let i = 0; i < itemIds.length; i++) {
    const item = itemsPorId.get(itemIds[i]);
    if (!item) continue;

    const cantidadUsada = Number(cantidadesUsadas[i]);
    if (!Number.isFinite(cantidadUsada) || cantidadUsada < 0) {
      return {
        error: "Todas las cantidades usadas deben ser números válidos, mayores o iguales a 0.",
      };
    }

    actualizacionesCantidadUsada.push({ id: item.id, cantidad_usada: cantidadUsada });

    // La cantidad usada está en la unidad del pedido, pero el stock del
    // insumo puede estar en otra unidad compatible (ej. pedido en gramos,
    // stock llevado en kilos) — hay que convertir antes de descontar.
    const cantidadEnUnidadDeStock = convertirUnidad(
      cantidadUsada,
      item.unidad,
      item.insumoUnidad,
    );
    if (cantidadEnUnidadDeStock === null) continue;

    deduccionesPorInsumo.set(
      item.insumoId,
      (deduccionesPorInsumo.get(item.insumoId) ?? 0) + cantidadEnUnidadDeStock,
    );
  }

  for (const actualizacion of actualizacionesCantidadUsada) {
    const { error } = await supabase
      .from("orden_compra_items")
      .update({ cantidad_usada: actualizacion.cantidad_usada })
      .eq("id", actualizacion.id);

    if (error) return { error: error.message };
  }

  // El stock nunca baja de 0: si se usó más de lo que había registrado,
  // queda en 0 en vez de fallar por el CHECK (stock_actual >= 0) o quedar
  // en negativo. El movimiento igual registra la deducción real, no la
  // recortada, para no perder el dato de lo que efectivamente se usó.
  for (const [insumoId, deduccion] of deduccionesPorInsumo) {
    const item = orden.items.find((i) => i.insumoId === insumoId);
    if (!item) continue;
    // Si se indicó "cantidad usada" 0, no hay nada que descontar ni que
    // registrar (el CHECK de movimientos_stock exige cantidad < 0 para
    // uso_evento).
    if (deduccion <= 0) continue;

    const { error: movimientoError } = await supabase.from("movimientos_stock").insert({
      insumo_id: insumoId,
      tipo: "uso_evento",
      cantidad: -deduccion,
      unidad: item.insumoUnidad,
      evento_id: eventoId,
    });

    if (movimientoError) return { error: movimientoError.message };

    const nuevoStock = Math.max(0, Number(item.insumoStockActual) - deduccion);

    const { error } = await supabase
      .from("insumos")
      .update({ stock_actual: nuevoStock })
      .eq("id", insumoId);

    if (error) return { error: error.message };
  }

  const { error: ordenError } = await supabase
    .from("ordenes_compra")
    .update({ reconciliado: true, reconciliado_en: new Date().toISOString() })
    .eq("id", orden.id);

  if (ordenError) return { error: ordenError.message };

  const { error: eventoError } = await supabase
    .from("eventos")
    .update({ estado: "realizado" })
    .eq("id", eventoId);

  if (eventoError) return { error: eventoError.message };

  revalidatePath("/eventos");
  revalidatePath("/eventos/archivo");
  revalidatePath(`/eventos/${eventoId}`);
  revalidatePath(`/eventos/${eventoId}/cerrar`);
  redirect(`/eventos/${eventoId}`);
}
