"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tipoLabel } from "@/lib/eventos/constants";
import { ESTADOS_HABILITAN_EVENTO } from "@/lib/cotizaciones/constants";
import { calcularTotales } from "@/lib/cotizaciones/margen";
import { getRecetasParaCosto } from "@/lib/recetas/queries";
import { armarMapaRecetas, calcularCostoCompleto } from "@/lib/recetas/costo";
import type {
  ClienteOrigen,
  ClienteTipo,
  Database,
  PresupuestoEstado,
  PresupuestoItemCategoria,
} from "@/lib/supabase/database.types";

export type PresupuestoFormState = { error?: string };

type Supabase = SupabaseClient<Database>;

async function resolveClienteId(
  supabase: Supabase,
  formData: FormData,
): Promise<{ clienteId: string } | { error: string }> {
  if (formData.get("modo_cliente") === "nuevo") {
    const nombre = (formData.get("cliente_nombre") as string)?.trim();
    if (!nombre) {
      return { error: "El nombre del cliente nuevo es obligatorio." };
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre,
        telefono: (formData.get("cliente_telefono") as string)?.trim() || null,
        email: (formData.get("cliente_email") as string)?.trim() || null,
        ruc_ci: (formData.get("cliente_ruc_ci") as string)?.trim() || null,
        tipo: ((formData.get("cliente_tipo") as string) || "persona") as ClienteTipo,
        origen: ((formData.get("cliente_origen") as string) || null) as ClienteOrigen | null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "No se pudo crear el cliente." };
    }
    return { clienteId: data.id };
  }

  const clienteId = formData.get("cliente_id") as string;
  if (!clienteId) return { error: "Seleccioná un cliente." };
  return { clienteId };
}

function resolveTipoEvento(
  formData: FormData,
): { tipoEvento: string } | { error: string } {
  const tipoSeleccionado = formData.get("tipo_evento_seleccionado") as string;
  const tipoEvento =
    tipoSeleccionado === "__otro__"
      ? (formData.get("tipo_evento_nuevo") as string)?.trim()
      : tipoSeleccionado;

  if (!tipoEvento) return { error: "Seleccioná o escribí un tipo de evento." };
  return { tipoEvento };
}

function leerNumero(valor: FormDataEntryValue | null): number | null {
  const texto = (valor as string | null)?.trim();
  if (!texto) return null;
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Cada fila del formulario manda los mismos campos (vacíos si no aplican),
// así se reconstruyen emparejando por índice con FormData.getAll.
type FilaItem = {
  receta_id: string | null;
  descripcion: string | null;
  categoria: PresupuestoItemCategoria;
  personal_id: string | null;
  cantidad: number;
  precio_unitario: number;
  // costo cargado a mano (solo líneas sin receta)
  costo_manual: number | null;
};

function parseFilasItems(formData: FormData): FilaItem[] {
  const tipos = formData.getAll("item_tipo") as string[];
  const recetaIds = formData.getAll("receta_id") as string[];
  const descripciones = formData.getAll("item_descripcion") as string[];
  const categorias = formData.getAll("item_categoria") as string[];
  const personalIds = formData.getAll("item_personal_id") as string[];
  const cantidades = formData.getAll("item_cantidad") as string[];
  const precios = formData.getAll("precio_unitario") as string[];
  const costos = formData.getAll("item_costo") as string[];

  return tipos
    .map((tipo, i): FilaItem => {
      const esReceta = tipo === "receta";
      return {
        receta_id: esReceta ? recetaIds[i] || null : null,
        descripcion: esReceta ? null : descripciones[i]?.trim() || null,
        categoria: esReceta
          ? "comida"
          : ((categorias[i] || "otro") as PresupuestoItemCategoria),
        personal_id: esReceta ? null : personalIds[i] || null,
        cantidad: Number(cantidades[i]),
        precio_unitario: Number(precios[i]) || 0,
        costo_manual: esReceta ? null : leerNumero(costos[i]),
      };
    })
    .filter(
      (fila) =>
        (fila.receta_id || fila.descripcion) &&
        fila.cantidad > 0 &&
        fila.precio_unitario >= 0,
    );
}

function buildPresupuestoPayload(
  formData: FormData,
  clienteId: string,
  tipoEvento: string,
) {
  const fechaEvento = (formData.get("fecha_evento") as string) || null;
  const horario = (formData.get("horario") as string)?.trim();
  const lugarDireccion = (formData.get("lugar_direccion") as string)?.trim();
  const cantidadPersonasRaw = formData.get("cantidad_personas") as string;
  const incluye = (formData.get("incluye") as string)?.trim();
  const noIncluye = (formData.get("no_incluye") as string)?.trim();

  return {
    cliente_id: clienteId,
    fecha_emision: formData.get("fecha_emision") as string,
    validez_dias: Number(formData.get("validez_dias")),
    tipo_evento: tipoEvento,
    fecha_evento: fechaEvento,
    horario: horario || null,
    lugar_direccion: lugarDireccion || null,
    cantidad_personas: cantidadPersonasRaw ? Number(cantidadPersonasRaw) : null,
    incluye: incluye || null,
    no_incluye: noIncluye || "",
    margen_objetivo_pct: leerNumero(formData.get("margen_objetivo_pct")),
    pct_imprevistos: leerNumero(formData.get("pct_imprevistos")) ?? 0,
  };
}

function validarPayload(payload: ReturnType<typeof buildPresupuestoPayload>): string | null {
  const margen = payload.margen_objetivo_pct;
  if (margen !== null && (margen < 0 || margen >= 100)) {
    return "El margen objetivo tiene que estar entre 0 y 99 %.";
  }
  if (payload.pct_imprevistos < 0 || payload.pct_imprevistos > 100) {
    return "Imprevistos tiene que estar entre 0 y 100 %.";
  }
  return null;
}

// Costo por unidad de cada línea: las recetas con el costo de hoy (merma,
// sub-recetas y varios incluidos); el resto con lo cargado a mano.
// `congelados` trae los costos de un presupuesto ya aceptado, que se
// respetan para las recetas que ya estaban cotizadas.
async function costearFilas(
  supabase: Supabase,
  filas: FilaItem[],
  congelados: Map<string, number> | null,
) {
  const necesitaRecetas = filas.some((fila) => fila.receta_id);
  const mapa = necesitaRecetas
    ? armarMapaRecetas(await getRecetasParaCosto(supabase))
    : armarMapaRecetas([]);
  const memo = new Map();

  return filas.map((fila) => {
    let costo: number | null = fila.costo_manual;
    if (fila.receta_id) {
      const congelado = congelados?.get(fila.receta_id);
      if (congelado !== undefined) {
        costo = congelado;
      } else {
        const resultado = calcularCostoCompleto(fila.receta_id, mapa, memo);
        costo = resultado ? Math.round(resultado.costoPorPorcion * 100) / 100 : null;
      }
    }
    const { costo_manual: _ignorado, ...resto } = fila;
    void _ignorado;
    return { ...resto, costo_unitario: costo };
  });
}

// Si es un tipo nuevo, se registra con los parámetros por defecto (50 %),
// así aparece en la pantalla de márgenes para ajustarlo.
async function registrarTipoEvento(supabase: Supabase, tipo: string) {
  await supabase
    .from("parametros_tipo_evento")
    .upsert({ tipo }, { onConflict: "tipo", ignoreDuplicates: true });
}

export async function crearPresupuesto(
  _prevState: PresupuestoFormState,
  formData: FormData,
): Promise<PresupuestoFormState> {
  const supabase = await createClient();

  const clienteResult = await resolveClienteId(supabase, formData);
  if ("error" in clienteResult) return clienteResult;

  const tipoResult = resolveTipoEvento(formData);
  if ("error" in tipoResult) return tipoResult;

  const filas = parseFilasItems(formData);
  if (filas.length === 0) {
    return { error: "Agregá al menos una línea con cantidad y precio." };
  }

  const payload = buildPresupuestoPayload(
    formData,
    clienteResult.clienteId,
    tipoResult.tipoEvento,
  );
  const errorPayload = validarPayload(payload);
  if (errorPayload) return { error: errorPayload };

  await registrarTipoEvento(supabase, tipoResult.tipoEvento);
  const filasCosteadas = await costearFilas(supabase, filas, null);

  const { data: presupuesto, error: presupuestoError } = await supabase
    .from("presupuestos")
    .insert(payload)
    .select("id")
    .single();

  if (presupuestoError || !presupuesto) {
    return { error: presupuestoError?.message ?? "No se pudo crear el presupuesto." };
  }

  const { error: itemsError } = await supabase.from("presupuesto_items").insert(
    filasCosteadas.map((fila) => ({ ...fila, presupuesto_id: presupuesto.id })),
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/cotizaciones");
  revalidatePath("/clientes");
  redirect(`/cotizaciones/${presupuesto.id}`);
}

export async function actualizarPresupuesto(
  presupuestoId: string,
  _prevState: PresupuestoFormState,
  formData: FormData,
): Promise<PresupuestoFormState> {
  const supabase = await createClient();

  const clienteResult = await resolveClienteId(supabase, formData);
  if ("error" in clienteResult) return clienteResult;

  const tipoResult = resolveTipoEvento(formData);
  if ("error" in tipoResult) return tipoResult;

  const filas = parseFilasItems(formData);
  if (filas.length === 0) {
    return { error: "Agregá al menos una línea con cantidad y precio." };
  }

  const payload = buildPresupuestoPayload(
    formData,
    clienteResult.clienteId,
    tipoResult.tipoEvento,
  );
  const errorPayload = validarPayload(payload);
  if (errorPayload) return { error: errorPayload };

  // Un presupuesto aceptado mantiene el costo con el que se aceptó para las
  // recetas que ya tenía; solo se costean al día las que se agreguen.
  const { data: actual, error: actualError } = await supabase
    .from("presupuestos")
    .select("costo_congelado_en, presupuesto_items(receta_id, costo_unitario)")
    .eq("id", presupuestoId)
    .maybeSingle();

  if (actualError || !actual) {
    return { error: actualError?.message ?? "No se encontró el presupuesto." };
  }

  const congelados = actual.costo_congelado_en
    ? new Map(
        actual.presupuesto_items
          .filter((item) => item.receta_id && item.costo_unitario !== null)
          .map((item) => [item.receta_id as string, Number(item.costo_unitario)]),
      )
    : null;

  await registrarTipoEvento(supabase, tipoResult.tipoEvento);
  const filasCosteadas = await costearFilas(supabase, filas, congelados);

  const { error: presupuestoError } = await supabase
    .from("presupuestos")
    .update(payload)
    .eq("id", presupuestoId);

  if (presupuestoError) return { error: presupuestoError.message };

  // Las líneas no tienen historia propia: se reemplazan enteras en cada
  // edición, igual que el packing list de una orden de compra regenerada.
  const { error: deleteError } = await supabase
    .from("presupuesto_items")
    .delete()
    .eq("presupuesto_id", presupuestoId);

  if (deleteError) return { error: deleteError.message };

  const { error: itemsError } = await supabase.from("presupuesto_items").insert(
    filasCosteadas.map((fila) => ({ ...fila, presupuesto_id: presupuestoId })),
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${presupuestoId}`);
  revalidatePath("/clientes");
  redirect(`/cotizaciones/${presupuestoId}`);
}

export async function cambiarEstadoPresupuesto(
  presupuestoId: string,
  formData: FormData,
) {
  const nuevoEstado = formData.get("estado") as PresupuestoEstado;
  const supabase = await createClient();

  const { data: actual, error: actualError } = await supabase
    .from("presupuestos")
    .select("costo_congelado_en, presupuesto_items(id, receta_id, costo_unitario)")
    .eq("id", presupuestoId)
    .maybeSingle();

  if (actualError || !actual) {
    throw new Error(actualError?.message ?? "No se encontró el presupuesto.");
  }

  const seAcepta = ESTADOS_HABILITAN_EVENTO.includes(nuevoEstado);

  // Al aceptarse, el costo de las recetas se recalcula una última vez con los
  // precios del día y queda congelado: es el costo contra el que después se
  // compara el costo real del evento.
  if (seAcepta && !actual.costo_congelado_en) {
    const recetaIds = actual.presupuesto_items
      .filter((item) => item.receta_id)
      .map((item) => item.receta_id as string);

    if (recetaIds.length > 0) {
      const mapa = armarMapaRecetas(await getRecetasParaCosto(supabase));
      const memo = new Map();
      for (const item of actual.presupuesto_items) {
        if (!item.receta_id) continue;
        const resultado = calcularCostoCompleto(item.receta_id, mapa, memo);
        if (!resultado) continue;
        const { error } = await supabase
          .from("presupuesto_items")
          .update({ costo_unitario: Math.round(resultado.costoPorPorcion * 100) / 100 })
          .eq("id", item.id);
        if (error) throw new Error(error.message);
      }
    }
  }

  const { error } = await supabase
    .from("presupuestos")
    .update({
      estado: nuevoEstado,
      // Volver a un estado no aceptado libera el costo para que se recalcule.
      costo_congelado_en: seAcepta
        ? (actual.costo_congelado_en ?? new Date().toISOString())
        : null,
    })
    .eq("id", presupuestoId);

  if (error) throw new Error(error.message);

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${presupuestoId}`);
  revalidatePath("/clientes");
}

export async function crearEventoDesdePresupuesto(presupuestoId: string) {
  const supabase = await createClient();

  const { data: presupuesto, error: presupuestoError } = await supabase
    .from("presupuestos")
    .select(
      "id, cliente_id, tipo_evento, fecha_evento, lugar_direccion, cantidad_personas, estado, evento_id, margen_objetivo_pct, pct_imprevistos, clientes(nombre)",
    )
    .eq("id", presupuestoId)
    .maybeSingle();

  if (presupuestoError) throw new Error(presupuestoError.message);
  if (!presupuesto) throw new Error("No se encontró el presupuesto.");
  if (presupuesto.evento_id) throw new Error("Este presupuesto ya tiene un evento generado.");
  if (!ESTADOS_HABILITAN_EVENTO.includes(presupuesto.estado)) {
    throw new Error("Solo se puede crear el evento si el presupuesto fue aceptado.");
  }
  if (!presupuesto.cliente_id) {
    throw new Error("El presupuesto no tiene un cliente asignado.");
  }
  if (!presupuesto.fecha_evento) {
    throw new Error("El presupuesto no tiene fecha de evento cargada.");
  }
  if (!presupuesto.cantidad_personas) {
    throw new Error("El presupuesto no tiene cantidad de personas cargada.");
  }

  const { data: items, error: itemsError } = await supabase
    .from("presupuesto_items")
    .select("receta_id, cantidad, precio_unitario, costo_unitario")
    .eq("presupuesto_id", presupuestoId);

  if (itemsError) throw new Error(itemsError.message);
  if (!items || items.length === 0) {
    throw new Error("El presupuesto no tiene ítems cargados.");
  }

  const totales = calcularTotales(
    items.map((item) => ({
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precio_unitario),
      costoUnitario: item.costo_unitario === null ? null : Number(item.costo_unitario),
    })),
    Number(presupuesto.pct_imprevistos),
    presupuesto.cantidad_personas,
  );

  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .insert({
      cliente_id: presupuesto.cliente_id,
      nombre: `${tipoLabel(presupuesto.tipo_evento)} — ${presupuesto.clientes?.nombre ?? "Evento"}`,
      tipo: presupuesto.tipo_evento,
      // La cotización tiene solo el día: sin hora, Postgres lo toma como
      // medianoche UTC, que en Paraguay es el día anterior. Se fija el
      // mediodía de Asunción y la hora se ajusta después en el evento.
      fecha: `${presupuesto.fecha_evento}T12:00:00-03:00`,
      invitados: presupuesto.cantidad_personas,
      estado: "confirmado",
      ubicacion: presupuesto.lugar_direccion,
      precio_total: totales.precioTotal,
      margen_objetivo: presupuesto.margen_objetivo_pct,
      costo_cotizado: Math.round(totales.costoTotal),
    })
    .select("id")
    .single();

  if (eventoError || !evento) {
    throw new Error(eventoError?.message ?? "No se pudo crear el evento.");
  }

  // Al menú pasan solo las líneas de comida (recetas); personal, alquileres
  // y demás quedan en el presupuesto y en el costo cotizado del evento.
  const itemsDeReceta = items.filter((item) => item.receta_id);

  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .insert({ evento_id: evento.id, nombre: "Menú principal" })
    .select("id")
    .single();

  if (menuError || !menu) {
    throw new Error(menuError?.message ?? "No se pudo crear el menú del evento.");
  }

  if (itemsDeReceta.length > 0) {
    const { error: menuItemsError } = await supabase.from("menu_items").insert(
      itemsDeReceta.map((item) => ({
        menu_id: menu.id,
        receta_id: item.receta_id as string,
        cantidad_porciones: Math.max(1, Math.round(Number(item.cantidad))),
      })),
    );

    if (menuItemsError) throw new Error(menuItemsError.message);
  }

  const { error: updateError } = await supabase
    .from("presupuestos")
    .update({ evento_id: evento.id })
    .eq("id", presupuestoId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${presupuestoId}`);
  revalidatePath("/eventos");
  revalidatePath("/clientes");
  redirect(`/eventos/${evento.id}`);
}

// Ajuste de márgenes e imprevistos por tipo de evento.
export async function guardarParametrosTipoEvento(formData: FormData) {
  const tipos = formData.getAll("tipo") as string[];
  const margenes = formData.getAll("margen_objetivo_pct") as string[];
  const imprevistos = formData.getAll("pct_imprevistos") as string[];

  const filas = tipos.map((tipo, i) => ({
    tipo,
    margen_objetivo_pct: Math.min(99, Math.max(0, leerNumero(margenes[i]) ?? 50)),
    pct_imprevistos: Math.min(100, Math.max(0, leerNumero(imprevistos[i]) ?? 0)),
  }));

  const supabase = await createClient();
  const { error } = await supabase
    .from("parametros_tipo_evento")
    .upsert(filas, { onConflict: "tipo" });

  if (error) throw new Error(error.message);

  revalidatePath("/cotizaciones/margenes");
  revalidatePath("/cotizaciones/nueva");
}
