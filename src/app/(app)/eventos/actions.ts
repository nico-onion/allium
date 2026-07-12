"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generarOrdenCompra } from "@/lib/ordenes-compra/generar";
import type {
  Database,
  EventoEstado,
  EventoTipo,
} from "@/lib/supabase/database.types";

export type OrdenCompraFormState = { error?: string };

export type EventoFormState = { error?: string };

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

function buildEventoPayload(formData: FormData, clienteId: string) {
  const precioPorPersonaRaw = formData.get("precio_por_persona") as string;
  const precioRaw = formData.get("precio_total") as string;
  const margenRaw = formData.get("margen_objetivo") as string;
  const ubicacion = (formData.get("ubicacion") as string)?.trim();
  const linkCotizacion = (formData.get("link_cotizacion") as string)?.trim();

  return {
    cliente_id: clienteId,
    nombre: (formData.get("nombre") as string).trim(),
    tipo: formData.get("tipo") as EventoTipo,
    fecha: formData.get("fecha") as string,
    invitados: Number(formData.get("invitados")),
    estado: formData.get("estado") as EventoEstado,
    ubicacion: ubicacion || null,
    precio_por_persona: precioPorPersonaRaw ? Number(precioPorPersonaRaw) : null,
    precio_total: precioRaw ? Number(precioRaw) : null,
    margen_objetivo: margenRaw ? Number(margenRaw) : null,
    link_cotizacion: linkCotizacion || null,
  };
}

export async function crearEvento(
  _prevState: EventoFormState,
  formData: FormData,
): Promise<EventoFormState> {
  const supabase = await createClient();

  const clienteResult = await resolveClienteId(supabase, formData);
  if ("error" in clienteResult) return clienteResult;

  const payload = buildEventoPayload(formData, clienteResult.clienteId);

  const { data, error } = await supabase
    .from("eventos")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear el evento." };
  }

  revalidatePath("/eventos");
  redirect(`/eventos/${data.id}`);
}

export async function actualizarEvento(
  eventoId: string,
  _prevState: EventoFormState,
  formData: FormData,
): Promise<EventoFormState> {
  const supabase = await createClient();

  const clienteResult = await resolveClienteId(supabase, formData);
  if ("error" in clienteResult) return clienteResult;

  const payload = buildEventoPayload(formData, clienteResult.clienteId);

  const { error } = await supabase
    .from("eventos")
    .update(payload)
    .eq("id", eventoId);

  if (error) return { error: error.message };

  revalidatePath("/eventos");
  revalidatePath(`/eventos/${eventoId}`);
  redirect(`/eventos/${eventoId}`);
}

export async function cambiarEstadoEvento(
  eventoId: string,
  nuevoEstado: EventoEstado,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("eventos")
    .update({ estado: nuevoEstado })
    .eq("id", eventoId);

  if (error) throw new Error(error.message);

  // Al confirmar, se genera la orden de compra automáticamente a partir del
  // packing list actual. Si todavía no hay menú/insumos calculables, se
  // omite en silencio: no bloquea el cambio de estado, que es lo que el
  // usuario pidió explícitamente al tocar este botón.
  if (nuevoEstado === "confirmado") {
    await generarOrdenCompra(supabase, eventoId);
  }

  revalidatePath("/eventos");
  revalidatePath("/eventos/archivo");
  revalidatePath(`/eventos/${eventoId}`);
}

export async function regenerarOrdenCompra(
  eventoId: string,
  _prevState: OrdenCompraFormState,
  _formData: FormData,
): Promise<OrdenCompraFormState> {
  const supabase = await createClient();

  const resultado = await generarOrdenCompra(supabase, eventoId);
  if (resultado.error) return resultado;

  revalidatePath(`/eventos/${eventoId}`);
  return {};
}

export async function eliminarEvento(eventoId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("eventos").delete().eq("id", eventoId);
  if (error) throw new Error(error.message);

  revalidatePath("/eventos");
  revalidatePath("/eventos/archivo");
  redirect("/eventos");
}
