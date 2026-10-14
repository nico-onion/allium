"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ingresarInsumoComprado } from "@/lib/compras/registrar";
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

type FilaCompra = {
  insumo_id: string;
  cantidad: number;
  unidad: InsumoUnidad;
  costo_unitario: number;
};

function parseFilasCompra(formData: FormData): FilaCompra[] {
  const insumoIds = formData.getAll("insumo_id") as string[];
  const cantidades = formData.getAll("cantidad") as string[];
  const unidades = formData.getAll("unidad") as InsumoUnidad[];
  const costos = formData.getAll("costo_unitario") as string[];

  return insumoIds
    .map((insumo_id, i) => ({
      insumo_id,
      cantidad: Number(cantidades[i]),
      unidad: unidades[i],
      costo_unitario: Number(costos[i]),
    }))
    .filter(
      (fila) =>
        fila.insumo_id && fila.cantidad > 0 && fila.unidad && fila.costo_unitario >= 0,
    );
}

export async function crearCompra(
  _prevState: CompraFormState,
  formData: FormData,
): Promise<CompraFormState> {
  const supabase = await createClient();

  const proveedorResult = await resolveProveedorId(supabase, formData);
  if ("error" in proveedorResult) return proveedorResult;

  const fecha = formData.get("fecha") as string;
  const numeroFactura = (formData.get("numero_factura") as string)?.trim() || null;

  const filas = parseFilasCompra(formData);
  if (filas.length === 0) {
    return { error: "Agregá al menos un insumo con cantidad, unidad y costo." };
  }

  const idsUnicos = new Set(filas.map((fila) => fila.insumo_id));
  if (idsUnicos.size !== filas.length) {
    return { error: "No repitas el mismo insumo en dos filas." };
  }

  const eventoId = (formData.get("evento_id") as string) || null;
  const total = filas.reduce((acc, fila) => acc + fila.cantidad * fila.costo_unitario, 0);

  const { data: compra, error: compraError } = await supabase
    .from("compras")
    .insert({
      proveedor_id: proveedorResult.proveedorId,
      fecha,
      numero_factura: numeroFactura,
      evento_id: eventoId,
      total,
      estado: "confirmada",
      confirmada_en: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (compraError || !compra) {
    return { error: compraError?.message ?? "No se pudo crear la compra." };
  }

  // Cada fila queda también como línea de la compra (para el ejecutado del
  // evento) y entra al stock con el costo por promedio ponderado.
  const { data: insumos, error: insumosError } = await supabase
    .from("insumos")
    .select("id, nombre")
    .in("id", filas.map((fila) => fila.insumo_id));
  if (insumosError) return { error: insumosError.message };
  const nombres = new Map(insumos.map((insumo) => [insumo.id, insumo.nombre]));

  const { error: lineasError } = await supabase.from("compra_lineas").insert(
    filas.map((fila, i) => ({
      compra_id: compra.id,
      orden: i,
      descripcion: nombres.get(fila.insumo_id) ?? "Insumo",
      cantidad: fila.cantidad,
      unidad: fila.unidad,
      precio_unitario: fila.costo_unitario,
      subtotal: fila.cantidad * fila.costo_unitario,
      destino: "insumo",
      insumo_id: fila.insumo_id,
    })),
  );
  if (lineasError) return { error: lineasError.message };

  for (const fila of filas) {
    const resultado = await ingresarInsumoComprado(supabase, {
      compraId: compra.id,
      insumoId: fila.insumo_id,
      cantidad: fila.cantidad,
      unidad: fila.unidad,
      subtotal: fila.cantidad * fila.costo_unitario,
      factor: null,
    });
    if (resultado.error) return { error: resultado.error };
  }

  revalidatePath("/compras");
  revalidatePath("/recetas");
  revalidatePath("/eventos");
  revalidatePath("/insumos");
  revalidatePath("/");
  redirect(`/compras/${compra.id}`);
}
