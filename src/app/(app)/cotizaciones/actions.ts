"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tipoLabel } from "@/lib/eventos/constants";
import { ESTADOS_HABILITAN_EVENTO } from "@/lib/cotizaciones/constants";
import type { Database, PresupuestoEstado } from "@/lib/supabase/database.types";

export type PresupuestoFormState = { error?: string };

async function resolveClienteId(
  supabase: SupabaseClient<Database>,
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

type FilaItem = {
  receta_id: string;
  cantidad: number;
  precio_unitario: number;
};

function parseFilasItems(formData: FormData): FilaItem[] {
  const recetaIds = formData.getAll("receta_id") as string[];
  const cantidades = formData.getAll("item_cantidad") as string[];
  const precios = formData.getAll("precio_unitario") as string[];

  return recetaIds
    .map((receta_id, i) => ({
      receta_id,
      cantidad: Number(cantidades[i]),
      precio_unitario: Number(precios[i]),
    }))
    .filter((fila) => fila.receta_id && fila.cantidad > 0 && fila.precio_unitario >= 0);
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
  };
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
    return { error: "Agregá al menos una receta con cantidad y precio unitario." };
  }

  const payload = buildPresupuestoPayload(
    formData,
    clienteResult.clienteId,
    tipoResult.tipoEvento,
  );

  const { data: presupuesto, error: presupuestoError } = await supabase
    .from("presupuestos")
    .insert(payload)
    .select("id")
    .single();

  if (presupuestoError || !presupuesto) {
    return { error: presupuestoError?.message ?? "No se pudo crear el presupuesto." };
  }

  const { error: itemsError } = await supabase.from("presupuesto_items").insert(
    filas.map((fila) => ({ ...fila, presupuesto_id: presupuesto.id })),
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/cotizaciones");
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
    return { error: "Agregá al menos una receta con cantidad y precio unitario." };
  }

  const payload = buildPresupuestoPayload(
    formData,
    clienteResult.clienteId,
    tipoResult.tipoEvento,
  );

  const { error: presupuestoError } = await supabase
    .from("presupuestos")
    .update(payload)
    .eq("id", presupuestoId);

  if (presupuestoError) return { error: presupuestoError.message };

  // Los items no tienen historia propia: se reemplazan enteros en cada
  // edición, igual que el packing list de una orden de compra regenerada.
  const { error: deleteError } = await supabase
    .from("presupuesto_items")
    .delete()
    .eq("presupuesto_id", presupuestoId);

  if (deleteError) return { error: deleteError.message };

  const { error: itemsError } = await supabase.from("presupuesto_items").insert(
    filas.map((fila) => ({ ...fila, presupuesto_id: presupuestoId })),
  );

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${presupuestoId}`);
  redirect(`/cotizaciones/${presupuestoId}`);
}

export async function cambiarEstadoPresupuesto(
  presupuestoId: string,
  formData: FormData,
) {
  const nuevoEstado = formData.get("estado") as PresupuestoEstado;
  const supabase = await createClient();

  const { error } = await supabase
    .from("presupuestos")
    .update({ estado: nuevoEstado })
    .eq("id", presupuestoId);

  if (error) throw new Error(error.message);

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${presupuestoId}`);
}

export async function crearEventoDesdePresupuesto(presupuestoId: string) {
  const supabase = await createClient();

  const { data: presupuesto, error: presupuestoError } = await supabase
    .from("presupuestos")
    .select(
      "id, cliente_id, tipo_evento, fecha_evento, lugar_direccion, cantidad_personas, estado, evento_id, clientes(nombre)",
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
    .select("receta_id, cantidad, precio_unitario")
    .eq("presupuesto_id", presupuestoId);

  if (itemsError) throw new Error(itemsError.message);
  if (!items || items.length === 0) {
    throw new Error("El presupuesto no tiene ítems cargados.");
  }

  const precioTotal = items.reduce(
    (acc, item) => acc + Number(item.cantidad) * Number(item.precio_unitario),
    0,
  );

  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .insert({
      cliente_id: presupuesto.cliente_id,
      nombre: `${tipoLabel(presupuesto.tipo_evento)} — ${presupuesto.clientes?.nombre ?? "Evento"}`,
      tipo: presupuesto.tipo_evento,
      fecha: presupuesto.fecha_evento,
      invitados: presupuesto.cantidad_personas,
      estado: "confirmado",
      ubicacion: presupuesto.lugar_direccion,
      precio_total: precioTotal,
    })
    .select("id")
    .single();

  if (eventoError || !evento) {
    throw new Error(eventoError?.message ?? "No se pudo crear el evento.");
  }

  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .insert({ evento_id: evento.id, nombre: "Menú principal" })
    .select("id")
    .single();

  if (menuError || !menu) {
    throw new Error(menuError?.message ?? "No se pudo crear el menú del evento.");
  }

  const { error: menuItemsError } = await supabase.from("menu_items").insert(
    items.map((item) => ({
      menu_id: menu.id,
      receta_id: item.receta_id,
      cantidad_porciones: Math.max(1, Math.round(Number(item.cantidad))),
    })),
  );

  if (menuItemsError) throw new Error(menuItemsError.message);

  const { error: updateError } = await supabase
    .from("presupuestos")
    .update({ evento_id: evento.id })
    .eq("id", presupuestoId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${presupuestoId}`);
  revalidatePath("/eventos");
  redirect(`/eventos/${evento.id}`);
}
