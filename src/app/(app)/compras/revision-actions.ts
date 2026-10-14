"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { claveProveedor, normalizarDescripcion } from "@/lib/compras/normalizar";
import { tasaIvaValida } from "@/lib/compras/iva";
import { categoriaGastoValida, confirmarCompra } from "@/lib/compras/registrar";
import { mismaDimension } from "@/lib/recetas/costo";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

export type RevisionCompraState = { error?: string };

const UNIDADES: InsumoUnidad[] = ["kg", "g", "l", "ml", "unidad", "docena"];

function leerFactor(valor: FormDataEntryValue | null): number | null {
  const texto = (valor as string | null)?.trim().replace(",", ".");
  if (!texto) return null;
  const n = Number(texto);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Resuelve cada línea de una compra en borrador (insumo existente, insumo
// nuevo o gasto del evento), recuerda la elección para ese proveedor y
// confirma la compra: stock, costos y ejecutado del evento quedan al día.
export async function resolverYConfirmarCompra(
  compraId: string,
  _prevState: RevisionCompraState,
  formData: FormData,
): Promise<RevisionCompraState> {
  const supabase = await createClient();

  const { data: compra, error: compraError } = await supabase
    .from("compras")
    .select(
      "id, estado, ruc_proveedor, proveedor_texto, proveedores(nombre), compra_lineas(id, descripcion, unidad)",
    )
    .eq("id", compraId)
    .maybeSingle();

  if (compraError || !compra) {
    return { error: compraError?.message ?? "No se encontró la compra." };
  }
  if (compra.estado !== "borrador") return { error: "Esta compra ya está confirmada." };

  const eventoId = (formData.get("evento_id") as string) || null;
  const clave = claveProveedor(
    compra.ruc_proveedor,
    compra.proveedores?.nombre ?? compra.proveedor_texto,
  );

  const { data: insumos, error: insumosError } = await supabase
    .from("insumos")
    .select("id, unidad");
  if (insumosError) return { error: insumosError.message };
  const unidadDeInsumo = new Map(insumos.map((insumo) => [insumo.id, insumo.unidad]));

  for (const linea of compra.compra_lineas) {
    const modo = formData.get(`modo_${linea.id}`) as string;
    const recordar = formData.get(`recordar_${linea.id}`) === "on";
    const factorIngresado = leerFactor(formData.get(`factor_${linea.id}`));

    let cambios:
      | {
          destino: "insumo";
          insumo_id: string;
          factor: number | null;
          categoria_gasto: null;
          fecha_vencimiento: string;
        }
      | {
          destino: "gasto";
          insumo_id: null;
          factor: null;
          categoria_gasto: string;
          fecha_vencimiento: null;
        };

    if (modo === "gasto") {
      cambios = {
        destino: "gasto",
        insumo_id: null,
        factor: null,
        categoria_gasto: categoriaGastoValida(formData.get(`gasto_${linea.id}`) as string),
        fecha_vencimiento: null,
      };
    } else {
      let insumoId: string;
      let unidadInsumo: InsumoUnidad;

      if (modo === "nuevo") {
        const nombre = (formData.get(`nuevo_nombre_${linea.id}`) as string)?.trim();
        const unidad = formData.get(`nuevo_unidad_${linea.id}`) as InsumoUnidad;
        if (!nombre) return { error: `Poné un nombre para el insumo nuevo de "${linea.descripcion}".` };
        if (!UNIDADES.includes(unidad)) return { error: `Elegí la unidad de "${nombre}".` };

        const { data: nuevo, error } = await supabase
          .from("insumos")
          .insert({
            nombre,
            unidad,
            costo_unitario: 0,
            costo_contable: 0,
            categoria: ((formData.get(`nuevo_categoria_${linea.id}`) as string) || "").trim() || null,
          })
          .select("id")
          .single();
        if (error || !nuevo) return { error: error?.message ?? "No se pudo crear el insumo." };
        insumoId = nuevo.id;
        unidadInsumo = unidad;
      } else {
        insumoId = formData.get(`insumo_${linea.id}`) as string;
        const unidad = insumoId ? unidadDeInsumo.get(insumoId) : undefined;
        if (!insumoId || !unidad) {
          return { error: `Elegí a qué insumo corresponde "${linea.descripcion}".` };
        }
        unidadInsumo = unidad;
      }

      // Si la factura viene en otra dimensión (unidades vs kg), hace falta
      // saber cuánto trae cada unidad para poder costear.
      const necesitaFactor = !mismaDimension(linea.unidad, unidadInsumo);
      if (necesitaFactor && factorIngresado === null) {
        return {
          error: `"${linea.descripcion}" viene en ${linea.unidad} y el insumo se lleva en ${unidadInsumo}: indicá cuánto trae cada ${linea.unidad}.`,
        };
      }

      const vence = String(formData.get(`vence_${linea.id}`) ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(vence)) {
        return { error: `Poné la fecha de vencimiento de "${linea.descripcion}".` };
      }

      cambios = {
        destino: "insumo",
        insumo_id: insumoId,
        factor: necesitaFactor ? factorIngresado : null,
        categoria_gasto: null,
        fecha_vencimiento: vence,
      };
    }

    const { error: lineaError } = await supabase
      .from("compra_lineas")
      .update({ ...cambios, tasa_iva: tasaIvaValida(formData.get(`iva_${linea.id}`)) })
      .eq("id", linea.id);
    if (lineaError) return { error: lineaError.message };

    if (recordar) {
      const { error: aliasError } = await supabase.from("alias_compras").upsert(
        {
          clave_proveedor: clave,
          descripcion_normalizada: normalizarDescripcion(linea.descripcion),
          destino: cambios.destino,
          insumo_id: cambios.insumo_id,
          factor: cambios.factor,
          categoria_gasto: cambios.categoria_gasto,
        },
        { onConflict: "clave_proveedor,descripcion_normalizada" },
      );
      if (aliasError) return { error: aliasError.message };
    }
  }

  const { error: eventoError } = await supabase
    .from("compras")
    .update({ evento_id: eventoId })
    .eq("id", compraId);
  if (eventoError) return { error: eventoError.message };

  const resultado = await confirmarCompra(supabase, compraId);
  if (resultado.error) return { error: resultado.error };

  revalidatePath("/compras");
  revalidatePath(`/compras/${compraId}`);
  revalidatePath("/insumos");
  revalidatePath("/recetas");
  revalidatePath("/eventos");
  if (eventoId) {
    revalidatePath(`/eventos/${eventoId}`);
    redirect(`/eventos/${eventoId}`);
  }
  redirect(`/compras/${compraId}`);
}

// Descarta una compra que todavía está en borrador (ej. una foto repetida).
export async function descartarBorrador(compraId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("compras")
    .delete()
    .eq("id", compraId)
    .eq("estado", "borrador");
  if (error) throw new Error(error.message);

  revalidatePath("/compras");
  redirect("/compras");
}

// La tasa de IVA de una compra ya confirmada se puede corregir: no toca
// stock ni costos (que se llevan con IVA incluido), solo la liquidación.
export async function actualizarIvaCompra(compraId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: lineas, error } = await supabase
    .from("compra_lineas")
    .select("id, tasa_iva")
    .eq("compra_id", compraId);
  if (error) throw new Error(error.message);

  for (const linea of lineas) {
    const valor = formData.get(`iva_${linea.id}`);
    if (valor === null) continue;
    const tasa = tasaIvaValida(valor);
    if (tasa === linea.tasa_iva) continue;
    const { error: updateError } = await supabase
      .from("compra_lineas")
      .update({ tasa_iva: tasa })
      .eq("id", linea.id);
    if (updateError) throw new Error(updateError.message);
  }

  revalidatePath(`/compras/${compraId}`);
}
