"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  parseFilasInsumos,
  tieneInsumosDuplicados,
} from "@/lib/recetas/parse-insumos-form";

export type MenuFormState = { error?: string };

export async function crearMenu(
  eventoId: string,
  _prevState: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const supabase = await createClient();
  const nombre = (formData.get("nombre") as string)?.trim() || "Menú principal";

  const { error } = await supabase
    .from("menus")
    .insert({ evento_id: eventoId, nombre });

  if (error) return { error: error.message };

  revalidatePath(`/eventos/${eventoId}`);
  return {};
}

export async function agregarRecetaAlMenu(
  eventoId: string,
  menuId: string,
  _prevState: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const recetaId = formData.get("receta_id") as string;
  const cantidadPorciones = Number(formData.get("cantidad_porciones"));

  if (!recetaId) return { error: "Seleccioná una receta." };
  if (!cantidadPorciones || cantidadPorciones <= 0) {
    return { error: "La cantidad de porciones debe ser mayor a 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").insert({
    menu_id: menuId,
    receta_id: recetaId,
    cantidad_porciones: cantidadPorciones,
  });

  if (error) return { error: error.message };

  revalidatePath(`/eventos/${eventoId}`);
  return {};
}

export async function crearRecetaYAgregarAlMenu(
  eventoId: string,
  menuId: string,
  _prevState: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const nombre = (formData.get("nombre") as string)?.trim();
  const categoria = (formData.get("categoria") as string)?.trim() || null;
  const porcionBase = Number(formData.get("porcion_base"));
  const cantidadPorciones = Number(formData.get("cantidad_porciones"));

  if (!nombre) return { error: "El nombre de la receta es obligatorio." };
  if (!porcionBase || porcionBase <= 0) {
    return { error: "La porción base debe ser mayor a 0." };
  }
  if (!cantidadPorciones || cantidadPorciones <= 0) {
    return { error: "La cantidad de porciones debe ser mayor a 0." };
  }

  const filasInsumos = parseFilasInsumos(formData);

  if (filasInsumos.length === 0) {
    return { error: "Agregá al menos un insumo con cantidad y unidad." };
  }
  if (tieneInsumosDuplicados(filasInsumos)) {
    return { error: "No repitas el mismo insumo en dos filas." };
  }

  const supabase = await createClient();

  const { data: receta, error: recetaError } = await supabase
    .from("recetas")
    .insert({ nombre, categoria, porcion_base: porcionBase })
    .select("id")
    .single();

  if (recetaError || !receta) {
    return { error: recetaError?.message ?? "No se pudo crear la receta." };
  }

  const { error: insumosError } = await supabase
    .from("receta_insumos")
    .insert(filasInsumos.map((fila) => ({ ...fila, receta_id: receta.id })));

  if (insumosError) return { error: insumosError.message };

  const { error: menuItemError } = await supabase.from("menu_items").insert({
    menu_id: menuId,
    receta_id: receta.id,
    cantidad_porciones: cantidadPorciones,
  });

  if (menuItemError) return { error: menuItemError.message };

  revalidatePath(`/eventos/${eventoId}`);
  return {};
}

export async function actualizarCantidadMenuItem(
  eventoId: string,
  menuItemId: string,
  formData: FormData,
) {
  const cantidadPorciones = Number(formData.get("cantidad_porciones"));
  if (!cantidadPorciones || cantidadPorciones <= 0) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ cantidad_porciones: cantidadPorciones })
    .eq("id", menuItemId);

  if (error) throw new Error(error.message);
  revalidatePath(`/eventos/${eventoId}`);
}

export async function eliminarMenuItem(eventoId: string, menuItemId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", menuItemId);

  if (error) throw new Error(error.message);
  revalidatePath(`/eventos/${eventoId}`);
}
