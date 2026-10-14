"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type RendimientoFormState = { error?: string; ok?: boolean };

function leerPeso(formData: FormData, campo: string): number {
  const texto = ((formData.get(campo) as string) ?? "").trim().replace(",", ".");
  return texto === "" ? 0 : Number(texto);
}

// Guarda una prueba de rendimiento (Calculadora de mermas). La merma del
// insumo se recalcula sola en la base con el promedio de todas sus pruebas.
export async function crearRendimiento(
  insumoId: string,
  _prevState: RendimientoFormState,
  formData: FormData,
): Promise<RendimientoFormState> {
  const pesoInicial = leerPeso(formData, "peso_inicial");
  const pesoPerdida = leerPeso(formData, "peso_perdida");
  const pesoAprovechado = leerPeso(formData, "peso_aprovechado");
  const fecha = (formData.get("fecha") as string) || undefined;
  const nota = (formData.get("nota") as string)?.trim() || null;

  if (![pesoInicial, pesoPerdida, pesoAprovechado].every(Number.isFinite)) {
    return { error: "Los pesos tienen que ser números." };
  }
  if (pesoInicial <= 0) return { error: "El peso inicial debe ser mayor a 0." };
  if (pesoPerdida < 0 || pesoAprovechado < 0) {
    return { error: "Los pesos no pueden ser negativos." };
  }
  if (pesoPerdida > pesoInicial) {
    return { error: "La pérdida de limpieza no puede ser mayor al peso inicial." };
  }
  if (pesoAprovechado > pesoPerdida) {
    return { error: "Lo aprovechado no puede ser mayor a la pérdida de limpieza." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("rendimientos").insert({
    insumo_id: insumoId,
    fecha,
    peso_inicial: pesoInicial,
    peso_perdida: pesoPerdida,
    peso_aprovechado: pesoAprovechado,
    nota,
  });

  if (error) return { error: error.message };

  revalidatePath(`/insumos/${insumoId}/editar`);
  revalidatePath("/insumos");
  revalidatePath("/recetas");
  return { ok: true };
}

export async function eliminarRendimiento(
  rendimientoId: string,
  insumoId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("rendimientos").delete().eq("id", rendimientoId);
  if (error) throw new Error(error.message);

  revalidatePath(`/insumos/${insumoId}/editar`);
  revalidatePath("/insumos");
  revalidatePath("/recetas");
}
