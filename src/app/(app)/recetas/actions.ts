"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InsumoUnidad } from "@/lib/supabase/database.types";
import {
  parseFilasInsumos,
  parseFilasSubrecetas,
  tieneInsumosDuplicados,
  tieneSubrecetasDuplicadas,
} from "@/lib/recetas/parse-insumos-form";

export type RecetaFormState = { error?: string };

function numeroOpcional(valor: FormDataEntryValue | null): number | null {
  const texto = (valor as string | null)?.trim();
  if (!texto) return null;
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function buildRecetaPayload(formData: FormData) {
  const esSubreceta = formData.get("es_subreceta") === "true";
  return {
    nombre: (formData.get("nombre") as string).trim(),
    categoria: (formData.get("categoria") as string)?.trim() || null,
    porcion_base: Number(formData.get("porcion_base")),
    es_subreceta: esSubreceta,
    rendimiento_unidad: esSubreceta
      ? ((formData.get("rendimiento_unidad") as InsumoUnidad) || null)
      : null,
    pct_varios: numeroOpcional(formData.get("pct_varios")) ?? 0,
    // Una sub-receta no se vende sola: no lleva precio.
    precio_venta: esSubreceta ? null : numeroOpcional(formData.get("precio_venta")),
  };
}

type Validado =
  | { error: string }
  | {
      payload: ReturnType<typeof buildRecetaPayload>;
      filasInsumos: ReturnType<typeof parseFilasInsumos>;
      filasSubrecetas: ReturnType<typeof parseFilasSubrecetas>;
    };

function validar(formData: FormData, recetaId?: string): Validado {
  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre de la receta es obligatorio." };

  const payload = buildRecetaPayload(formData);
  if (!payload.porcion_base || payload.porcion_base <= 0) {
    return { error: "Lo que rinde la receta debe ser mayor a 0." };
  }
  if (payload.es_subreceta && !payload.rendimiento_unidad) {
    return { error: "Indicá en qué unidad rinde la sub-receta (ej. ml)." };
  }
  if (payload.pct_varios < 0 || payload.pct_varios > 100) {
    return { error: "Varios tiene que estar entre 0 y 100 %." };
  }
  if (payload.precio_venta !== null && payload.precio_venta < 0) {
    return { error: "El precio no puede ser negativo." };
  }

  const filasInsumos = parseFilasInsumos(formData);
  const filasSubrecetas = parseFilasSubrecetas(formData);

  if (filasInsumos.length === 0 && filasSubrecetas.length === 0) {
    return { error: "Agregá al menos un insumo o una sub-receta." };
  }
  if (tieneInsumosDuplicados(filasInsumos)) {
    return { error: "No repitas el mismo insumo en dos filas." };
  }
  if (tieneSubrecetasDuplicadas(filasSubrecetas)) {
    return { error: "No repitas la misma sub-receta en dos filas." };
  }
  if (recetaId && filasSubrecetas.some((fila) => fila.subreceta_id === recetaId)) {
    return { error: "Una receta no puede usarse a sí misma como sub-receta." };
  }

  return { payload, filasInsumos, filasSubrecetas };
}

function mensajeError(mensaje: string): string {
  if (mensaje.includes("ciclo")) {
    return "Esa combinación de sub-recetas forma un ciclo (una termina conteniéndose a sí misma).";
  }
  return mensaje;
}

export async function crearReceta(
  _prevState: RecetaFormState,
  formData: FormData,
): Promise<RecetaFormState> {
  const validado = validar(formData);
  if ("error" in validado) return validado;
  const { payload, filasInsumos, filasSubrecetas } = validado;

  const supabase = await createClient();

  const { data: receta, error: recetaError } = await supabase
    .from("recetas")
    .insert(payload)
    .select("id")
    .single();

  if (recetaError || !receta) {
    return { error: recetaError?.message ?? "No se pudo crear la receta." };
  }

  if (filasInsumos.length > 0) {
    const { error } = await supabase
      .from("receta_insumos")
      .insert(filasInsumos.map((fila) => ({ ...fila, receta_id: receta.id })));
    if (error) return { error: error.message };
  }

  if (filasSubrecetas.length > 0) {
    const { error } = await supabase
      .from("receta_subrecetas")
      .insert(filasSubrecetas.map((fila) => ({ ...fila, receta_id: receta.id })));
    if (error) return { error: mensajeError(error.message) };
  }

  revalidatePath("/recetas");
  redirect(`/recetas/${receta.id}`);
}

export async function actualizarReceta(
  recetaId: string,
  _prevState: RecetaFormState,
  formData: FormData,
): Promise<RecetaFormState> {
  const validado = validar(formData, recetaId);
  if ("error" in validado) return validado;
  const { payload, filasInsumos, filasSubrecetas } = validado;

  const supabase = await createClient();

  // Si deja de ser sub-receta pero otras recetas la usan, sus costos quedarían
  // incompletos: hay que sacarla de esas recetas primero.
  if (!payload.es_subreceta) {
    const { count, error } = await supabase
      .from("receta_subrecetas")
      .select("id", { count: "exact", head: true })
      .eq("subreceta_id", recetaId);
    if (error) return { error: error.message };
    if (count && count > 0) {
      return {
        error: `Esta receta se usa como sub-receta en ${count} receta(s). Sacala de ahí antes de cambiarla a plato.`,
      };
    }
  }

  const { error: recetaError } = await supabase
    .from("recetas")
    .update(payload)
    .eq("id", recetaId);

  if (recetaError) return { error: recetaError.message };

  const { error: deleteInsumosError } = await supabase
    .from("receta_insumos")
    .delete()
    .eq("receta_id", recetaId);
  if (deleteInsumosError) return { error: deleteInsumosError.message };

  const { error: deleteSubrecetasError } = await supabase
    .from("receta_subrecetas")
    .delete()
    .eq("receta_id", recetaId);
  if (deleteSubrecetasError) return { error: deleteSubrecetasError.message };

  if (filasInsumos.length > 0) {
    const { error } = await supabase
      .from("receta_insumos")
      .insert(filasInsumos.map((fila) => ({ ...fila, receta_id: recetaId })));
    if (error) return { error: error.message };
  }

  if (filasSubrecetas.length > 0) {
    const { error } = await supabase
      .from("receta_subrecetas")
      .insert(filasSubrecetas.map((fila) => ({ ...fila, receta_id: recetaId })));
    if (error) return { error: mensajeError(error.message) };
  }

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${recetaId}`);
  redirect(`/recetas/${recetaId}`);
}
