"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  InsumoTipoAlmacenamiento,
  InsumoUnidad,
} from "@/lib/supabase/database.types";

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

// Vacío = merma todavía sin medir (pendiente). 0 = medida y sin merma.
function parseMerma(valor: FormDataEntryValue | null): number | null {
  const texto = (valor as string | null)?.trim();
  if (!texto) return null;
  const merma = Number(texto.replace(",", "."));
  return Number.isFinite(merma) ? merma : null;
}

function validarMerma(merma: number | null): string | null {
  if (merma === null) return null;
  if (merma < 0 || merma >= 100) return "La merma tiene que estar entre 0 y 99,99 %.";
  return null;
}

function buildInsumoPayload(formData: FormData, proveedorId: string | null) {
  const tipoAlmacenamiento = (formData.get("tipo_almacenamiento") as string) || null;

  return {
    nombre: (formData.get("nombre") as string).trim(),
    categoria: (formData.get("categoria") as string)?.trim() || null,
    unidad: formData.get("unidad") as InsumoUnidad,
    tipo_almacenamiento: tipoAlmacenamiento as InsumoTipoAlmacenamiento | null,
    costo_unitario: Number(formData.get("costo_unitario")) || 0,
    stock_actual: Number(formData.get("stock_actual")) || 0,
    stock_minimo: Number(formData.get("stock_minimo")) || 0,
    merma_pct: parseMerma(formData.get("merma_pct")),
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
  const errorMerma = validarMerma(payload.merma_pct);
  if (errorMerma) return { error: errorMerma };

  const { error } = await supabase
    .from("insumos")
    .insert({ ...payload, costo_contable: payload.costo_unitario });
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
  const errorMerma = validarMerma(payload.merma_pct);
  if (errorMerma) return { error: errorMerma };

  const { data: anterior, error: anteriorError } = await supabase
    .from("insumos")
    .select("costo_unitario")
    .eq("id", insumoId)
    .maybeSingle();

  if (anteriorError || !anterior) {
    return { error: anteriorError?.message ?? "No se encontró el insumo." };
  }

  const { error } = await supabase
    .from("insumos")
    .update(payload)
    .eq("id", insumoId);

  if (error) return { error: error.message };

  // Un cambio de costo a mano también queda en el historial.
  const costoAnterior = Number(anterior.costo_unitario);
  if (costoAnterior !== payload.costo_unitario) {
    const { error: historialError } = await supabase.from("costo_historial").insert({
      insumo_id: insumoId,
      costo_anterior: costoAnterior,
      costo_nuevo: payload.costo_unitario,
      origen: "manual",
    });
    if (historialError) return { error: historialError.message };
  }

  revalidatePath("/recetas");

  revalidatePath("/insumos");
  redirect("/insumos");
}
