"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseFilasInsumos,
  tieneInsumosDuplicados,
} from "@/lib/recetas/parse-insumos-form";

export type RecetaFormState = { error?: string };

function buildRecetaPayload(formData: FormData) {
  return {
    nombre: (formData.get("nombre") as string).trim(),
    categoria: (formData.get("categoria") as string)?.trim() || null,
    porcion_base: Number(formData.get("porcion_base")),
  };
}

export async function crearReceta(
  _prevState: RecetaFormState,
  formData: FormData,
): Promise<RecetaFormState> {
  const nombre = (formData.get("nombre") as string)?.trim();
  const porcionBase = Number(formData.get("porcion_base"));

  if (!nombre) return { error: "El nombre de la receta es obligatorio." };
  if (!porcionBase || porcionBase <= 0) {
    return { error: "La porción base debe ser mayor a 0." };
  }

  const filasInsumos = parseFilasInsumos(formData);
  if (filasInsumos.length === 0) {
    return { error: "Agregá al menos un insumo con cantidad y unidad." };
  }
  if (tieneInsumosDuplicados(filasInsumos)) {
    return { error: "No repitas el mismo insumo en dos filas." };
  }

  const supabase = await createClient();
  const payload = buildRecetaPayload(formData);

  const { data: receta, error: recetaError } = await supabase
    .from("recetas")
    .insert(payload)
    .select("id")
    .single();

  if (recetaError || !receta) {
    return { error: recetaError?.message ?? "No se pudo crear la receta." };
  }

  const { error: insumosError } = await supabase
    .from("receta_insumos")
    .insert(filasInsumos.map((fila) => ({ ...fila, receta_id: receta.id })));

  if (insumosError) return { error: insumosError.message };

  revalidatePath("/recetas");
  redirect(`/recetas/${receta.id}`);
}

export async function actualizarReceta(
  recetaId: string,
  _prevState: RecetaFormState,
  formData: FormData,
): Promise<RecetaFormState> {
  const nombre = (formData.get("nombre") as string)?.trim();
  const porcionBase = Number(formData.get("porcion_base"));

  if (!nombre) return { error: "El nombre de la receta es obligatorio." };
  if (!porcionBase || porcionBase <= 0) {
    return { error: "La porción base debe ser mayor a 0." };
  }

  const filasInsumos = parseFilasInsumos(formData);
  if (filasInsumos.length === 0) {
    return { error: "Agregá al menos un insumo con cantidad y unidad." };
  }
  if (tieneInsumosDuplicados(filasInsumos)) {
    return { error: "No repitas el mismo insumo en dos filas." };
  }

  const supabase = await createClient();
  const payload = buildRecetaPayload(formData);

  const { error: recetaError } = await supabase
    .from("recetas")
    .update(payload)
    .eq("id", recetaId);

  if (recetaError) return { error: recetaError.message };

  const { error: deleteError } = await supabase
    .from("receta_insumos")
    .delete()
    .eq("receta_id", recetaId);

  if (deleteError) return { error: deleteError.message };

  const { error: insumosError } = await supabase
    .from("receta_insumos")
    .insert(filasInsumos.map((fila) => ({ ...fila, receta_id: recetaId })));

  if (insumosError) return { error: insumosError.message };

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${recetaId}`);
  redirect(`/recetas/${recetaId}`);
}
