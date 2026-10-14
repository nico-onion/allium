"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { crearCompraBorrador, type LineaFactura } from "@/lib/compras/borrador";
import { tasaIvaValida } from "@/lib/compras/iva";
import type { Database, InsumoUnidad } from "@/lib/supabase/database.types";

export type CompraFormState = { error?: string };

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

// "1.250.000" o "1250000" → 1250000; "0,5" → 0.5
function leerNumero(valor: FormDataEntryValue | undefined): number {
  const texto = String(valor ?? "").trim();
  if (!texto) return NaN;
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(texto)
      ? texto.replace(/\./g, "")
      : texto;
  return Number(normalizado);
}

const UNIDADES: InsumoUnidad[] = ["kg", "g", "l", "ml", "unidad", "docena"];

function parseLineas(formData: FormData): LineaFactura[] {
  const descripciones = formData.getAll("linea_descripcion") as string[];
  const cantidades = formData.getAll("linea_cantidad");
  const unidades = formData.getAll("linea_unidad") as string[];
  const subtotales = formData.getAll("linea_subtotal");
  const tasas = formData.getAll("linea_iva");

  return descripciones
    .map((descripcion, i) => ({
      descripcion: descripcion.trim(),
      cantidad: leerNumero(cantidades[i]),
      unidad: (UNIDADES.includes(unidades[i] as InsumoUnidad) ? unidades[i] : "unidad") as InsumoUnidad,
      subtotal: leerNumero(subtotales[i]),
      tasaIva: tasaIvaValida(tasas[i]),
    }))
    .filter((linea) => linea.descripcion || linea.subtotal > 0);
}

// La factura se carga tal cual (renglón por renglón) y pasa a la pantalla
// de revisión, igual que las que llegan por BILL: ahí se decide qué es cada
// renglón y queda recordado para ese proveedor.
export async function crearCompra(
  _prevState: CompraFormState,
  formData: FormData,
): Promise<CompraFormState> {
  const lineas = parseLineas(formData);
  if (lineas.length === 0) return { error: "Agregá al menos un renglón de la factura." };
  const invalida = lineas.find(
    (linea) => !linea.descripcion || !(linea.cantidad > 0) || !(linea.subtotal >= 0),
  );
  if (invalida) {
    return {
      error: `Revisá el renglón "${invalida.descripcion || "sin descripción"}": necesita descripción, cantidad y subtotal.`,
    };
  }

  const supabase = await createClient();
  const proveedorResult = await resolveProveedorId(supabase, formData);
  if ("error" in proveedorResult) return proveedorResult;

  const fecha = formData.get("fecha") as string;
  const total = leerNumero(formData.get("total") ?? undefined);

  const resultado = await crearCompraBorrador(supabase, {
    origen: "manual",
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : new Date().toISOString().slice(0, 10),
    numeroFactura: (formData.get("numero_factura") as string)?.trim() || null,
    proveedorId: proveedorResult.proveedorId,
    proveedorTexto: null,
    ruc: (formData.get("ruc_proveedor") as string)?.trim() || null,
    eventoId: (formData.get("evento_id") as string) || null,
    comprobanteUrl: null,
    total: Number.isFinite(total) && total > 0 ? total : null,
    lineas,
  });

  if ("error" in resultado) return { error: resultado.error };

  revalidatePath("/compras");
  revalidatePath("/eventos");
  redirect(`/compras/${resultado.compraId}`);
}
