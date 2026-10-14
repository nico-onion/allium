"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PersonalRol } from "@/lib/supabase/database.types";

export type PersonalFormState = { error?: string };

// Vacío = sin referencia cargada.
function leerMonto(valor: FormDataEntryValue | null): number | null {
  const texto = (valor as string | null)?.trim().replace(/\./g, "");
  if (!texto) return null;
  const monto = Number(texto);
  return Number.isFinite(monto) && monto >= 0 ? monto : null;
}

function buildPersonalPayload(formData: FormData) {
  return {
    nombre: (formData.get("nombre") as string).trim(),
    rol: formData.get("rol") as PersonalRol,
    telefono: (formData.get("telefono") as string)?.trim() || null,
    costo_referencia: leerMonto(formData.get("costo_referencia")),
  };
}

export async function crearPersonal(
  _prevState: PersonalFormState,
  formData: FormData,
): Promise<PersonalFormState> {
  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("personal").insert(buildPersonalPayload(formData));

  if (error) return { error: error.message };

  revalidatePath("/staff");
  redirect("/staff");
}

export async function actualizarPersonal(
  personalId: string,
  _prevState: PersonalFormState,
  formData: FormData,
): Promise<PersonalFormState> {
  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("personal")
    .update(buildPersonalPayload(formData))
    .eq("id", personalId);

  if (error) return { error: error.message };

  revalidatePath("/staff");
  revalidatePath(`/staff/${personalId}`);
  redirect(`/staff/${personalId}`);
}
