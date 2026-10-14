"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarEntradaAjuste, registrarSalida } from "@/lib/stock/movimientos";

function refrescar() {
  revalidatePath("/insumos");
  revalidatePath("/insumos/vencimientos");
  revalidatePath("/insumos/conteo");
  revalidatePath("/");
}

// Da de baja lo que queda de un lote (vencido o en mal estado) como merma.
export async function darDeBajaLote(loteId: string) {
  const supabase = await createClient();
  const { data: lote, error } = await supabase
    .from("lotes_stock")
    .select("id, insumo_id, cantidad_restante, fecha_vencimiento")
    .eq("id", loteId)
    .maybeSingle();
  if (error || !lote) throw new Error(error?.message ?? "No se encontró el lote.");

  const cantidad = Number(lote.cantidad_restante);
  if (cantidad > 0) {
    const resultado = await registrarSalida(supabase, {
      insumoId: lote.insumo_id,
      cantidad,
      tipo: "merma",
      loteId: lote.id,
      nota: lote.fecha_vencimiento ? `Vencido el ${lote.fecha_vencimiento}` : "Dado de baja",
    });
    if (resultado.error) throw new Error(resultado.error);
  }
  refrescar();
}

export async function ponerFechaLote(loteId: string, formData: FormData) {
  const fecha = String(formData.get("fecha_vencimiento") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("lotes_stock")
    .update({ fecha_vencimiento: fecha })
    .eq("id", loteId);
  if (error) throw new Error(error.message);
  refrescar();
}

export type ConteoFormState = { error?: string };

// Conteo físico: para cada insumo contado, la diferencia con el sistema se
// registra como ajuste (y se descuenta de los lotes que vencen antes, o
// entra como lote sin fecha si hay más de lo registrado).
export async function guardarConteo(
  _prev: ConteoFormState,
  formData: FormData,
): Promise<ConteoFormState> {
  const supabase = await createClient();
  const { data: insumos, error } = await supabase.from("insumos").select("id, nombre, stock_actual");
  if (error) return { error: error.message };

  let ajustes = 0;
  for (const insumo of insumos) {
    const valor = String(formData.get(`contado_${insumo.id}`) ?? "").trim().replace(",", ".");
    if (valor === "") continue;
    const contado = Number(valor);
    if (!Number.isFinite(contado) || contado < 0) {
      return { error: `Revisá lo contado de "${insumo.nombre}".` };
    }
    const diferencia = Math.round((contado - Number(insumo.stock_actual)) * 1000) / 1000;
    if (diferencia === 0) continue;

    const resultado =
      diferencia < 0
        ? await registrarSalida(supabase, {
            insumoId: insumo.id,
            cantidad: -diferencia,
            tipo: "ajuste",
            nota: "Conteo físico",
          })
        : await registrarEntradaAjuste(supabase, {
            insumoId: insumo.id,
            cantidad: diferencia,
            nota: "Conteo físico",
          });
    if (resultado.error) return { error: `${insumo.nombre}: ${resultado.error}` };
    ajustes += 1;
  }

  refrescar();
  redirect(`/insumos?conteo=${ajustes}`);
}
