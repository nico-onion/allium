"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProveedorFormState = { error?: string };

function buildProveedorPayload(formData: FormData) {
  return {
    nombre: (formData.get("nombre") as string).trim(),
    contacto: (formData.get("contacto") as string)?.trim() || null,
    notas: (formData.get("notas") as string)?.trim() || null,
  };
}

export async function crearProveedor(
  _prevState: ProveedorFormState,
  formData: FormData,
): Promise<ProveedorFormState> {
  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("proveedores")
    .insert(buildProveedorPayload(formData));

  if (error) return { error: error.message };

  revalidatePath("/proveedores");
  redirect("/proveedores");
}

export async function actualizarProveedor(
  proveedorId: string,
  _prevState: ProveedorFormState,
  formData: FormData,
): Promise<ProveedorFormState> {
  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("proveedores")
    .update(buildProveedorPayload(formData))
    .eq("id", proveedorId);

  if (error) return { error: error.message };

  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${proveedorId}`);
  redirect(`/proveedores/${proveedorId}`);
}
