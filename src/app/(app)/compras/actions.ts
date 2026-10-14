"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  convertirPrecio,
  convertirUnidad,
  costoPromedioPonderado,
} from "@/lib/recetas/costo";
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

  const { data: compra, error: compraError } = await supabase
    .from("compras")
    .insert({
      proveedor_id: proveedorResult.proveedorId,
      fecha,
      numero_factura: numeroFactura,
    })
    .select("id")
    .single();

  if (compraError || !compra) {
    return { error: compraError?.message ?? "No se pudo crear la compra." };
  }

  for (const fila of filas) {
    const { data: insumo, error: insumoError } = await supabase
      .from("insumos")
      .select("stock_actual, unidad, costo_unitario")
      .eq("id", fila.insumo_id)
      .maybeSingle();

    if (insumoError || !insumo) {
      return { error: insumoError?.message ?? "No se encontró un insumo de la compra." };
    }

    const { error: movError } = await supabase.from("movimientos_stock").insert({
      insumo_id: fila.insumo_id,
      tipo: "compra",
      cantidad: fila.cantidad,
      unidad: fila.unidad,
      compra_id: compra.id,
    });

    if (movError) return { error: movError.message };

    // La cantidad y el precio pueden venir en una unidad distinta a la del
    // insumo (ej. compra en gramos, insumo en kilos): se convierten las dos
    // antes de sumar stock y promediar el costo. Si no son compatibles, el
    // movimiento igual queda registrado pero no se tocan stock ni costo.
    const cantidadEnUnidadDeStock = convertirUnidad(
      fila.cantidad,
      fila.unidad,
      insumo.unidad,
    );
    const precioEnUnidadDeStock = convertirPrecio(
      fila.costo_unitario,
      fila.unidad,
      insumo.unidad,
    );

    if (cantidadEnUnidadDeStock === null || precioEnUnidadDeStock === null) {
      continue;
    }

    const stockPrevio = Number(insumo.stock_actual);
    const costoPrevio = Number(insumo.costo_unitario);
    const nuevoStock = stockPrevio + cantidadEnUnidadDeStock;

    // Costo vivo = promedio ponderado entre lo que había y lo que entra.
    const nuevoCosto =
      Math.round(
        costoPromedioPonderado(
          stockPrevio,
          costoPrevio,
          cantidadEnUnidadDeStock,
          precioEnUnidadDeStock,
        ) * 100,
      ) / 100;

    const { error: updateError } = await supabase
      .from("insumos")
      .update({ stock_actual: nuevoStock, costo_unitario: nuevoCosto })
      .eq("id", fila.insumo_id);

    if (updateError) return { error: updateError.message };

    if (nuevoCosto !== costoPrevio) {
      const { error: historialError } = await supabase.from("costo_historial").insert({
        insumo_id: fila.insumo_id,
        costo_anterior: costoPrevio,
        costo_nuevo: nuevoCosto,
        origen: "compra",
        compra_id: compra.id,
      });
      if (historialError) return { error: historialError.message };
    }
  }

  revalidatePath("/compras");
  revalidatePath("/recetas");
  revalidatePath("/insumos");
  revalidatePath("/");
  redirect(`/compras/${compra.id}`);
}
