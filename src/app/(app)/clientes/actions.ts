"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClienteOrigen, ClienteTipo } from "@/lib/supabase/database.types";

export type ClienteFormState = { error?: string };

function texto(formData: FormData, campo: string): string | null {
  return (formData.get(campo) as string | null)?.trim() || null;
}

function buildClientePayload(formData: FormData) {
  return {
    nombre: (formData.get("nombre") as string).trim(),
    tipo: ((formData.get("tipo") as string) || "persona") as ClienteTipo,
    origen: (texto(formData, "origen") as ClienteOrigen | null) ?? null,
    telefono: texto(formData, "telefono"),
    email: texto(formData, "email"),
    instagram: texto(formData, "instagram"),
    ruc_ci: texto(formData, "ruc_ci"),
    notas: texto(formData, "notas"),
  };
}

export async function crearCliente(
  _prevState: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  if (!texto(formData, "nombre")) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert(buildClientePayload(formData))
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear el cliente." };

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function actualizarCliente(
  clienteId: string,
  _prevState: ClienteFormState,
  formData: FormData,
): Promise<ClienteFormState> {
  if (!texto(formData, "nombre")) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update(buildClientePayload(formData))
    .eq("id", clienteId);

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}
