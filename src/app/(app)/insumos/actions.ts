"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InsumoUnidad } from "@/lib/supabase/database.types";

export type InsumoFormState = { error?: string };

async function resolveProveedorId(
  supabase: SupabaseClient<Database>,
  formData: FormData,
): Promise<{ proveedorId: string | null } | { error: string }> {
  if (formData.get("modo_proveedor") === "nuevo") {
    const nombre = (formData.get("proveedor_nombre") as string)?.trim();
    if (!nombre) {
      return { error: "El nombre del proveedor nuevo es obligatorio." };
    }

    const { data, error } = await supabase
      .from("proveedores")
      .insert({
        nombre,
        contacto: (formData.get("proveedor_contacto") as string)?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "No se pudo crear el proveedor." };
    }
    return { proveedorId: data.id };
  }

  const proveedorId = (formData.get("proveedor_id") as string) || null;
  return { proveedorId };
}

function buildInsumoPayload(formData: FormData, proveedorId: string | null) {
  return {
    nombre: (formData.get("nombre") as string).trim(),
    categoria: (formData.get("categoria") as string)?.trim() || null,
    unidad: formData.get("unidad") as InsumoUnidad,
    costo_unitario: Number(formData.get("costo_unitario")) || 0,
    stock_actual: Number(formData.get("stock_actual")) || 0,
    stock_minimo: Number(formData.get("stock_minimo")) || 0,
    proveedor_id: proveedorId,
  };
}

export async function crearInsumo(
  _prevState: InsumoFormState,
  formData: FormData,
): Promise<InsumoFormState> {
  const supabase = await createClient();

  const proveedorResult = await resolveProveedorId(supabase, formData);
  if ("error" in proveedorResult) return proveedorResult;

  const payload = buildInsumoPayload(formData, proveedorResult.proveedorId);

  const { error } = await supabase.from("insumos").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/insumos");
  redirect("/insumos");
}

export async function actualizarInsumo(
  insumoId: string,
  _prevState: InsumoFormState,
  formData: FormData,
): Promise<InsumoFormState> {
  const supabase = await createClient();

  const proveedorResult = await resolveProveedorId(supabase, formData);
  if ("error" in proveedorResult) return proveedorResult;

  const payload = buildInsumoPayload(formData, proveedorResult.proveedorId);

  const { error } = await supabase
    .from("insumos")
    .update(payload)
    .eq("id", insumoId);

  if (error) return { error: error.message };

  revalidatePath("/insumos");
  redirect("/insumos");
}
