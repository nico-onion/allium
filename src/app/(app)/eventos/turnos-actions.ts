"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatFecha } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";

export type TurnoFormState = { error?: string; warning?: string };

function leerMonto(valor: FormDataEntryValue | null): number | null {
  const texto = (valor as string | null)?.trim().replace(/\./g, "");
  if (!texto) return null;
  const monto = Number(texto);
  return Number.isFinite(monto) && monto >= 0 ? monto : null;
}

// Busca si esa persona ya tiene un turno asignado en OTRO evento el mismo
// día (comparando por fecha calendario, no timestamp exacto) — es una
// advertencia, no un bloqueo: el usuario puede confirmar igual.
async function buscarChoqueDeFecha(
  supabase: SupabaseClient<Database>,
  personalId: string,
  eventoId: string,
  fechaEvento: string,
) {
  const { data, error } = await supabase
    .from("turnos")
    .select("eventos(id, nombre, fecha)")
    .eq("personal_id", personalId)
    .neq("evento_id", eventoId);

  if (error) throw new Error(error.message);

  const diaEvento = fechaEvento.slice(0, 10);
  const choque = data.find(
    (turno) => turno.eventos && turno.eventos.fecha.slice(0, 10) === diaEvento,
  );

  return choque?.eventos ?? null;
}

export async function asignarPersonalAEvento(
  eventoId: string,
  _prevState: TurnoFormState,
  formData: FormData,
): Promise<TurnoFormState> {
  const personalId = formData.get("personal_id") as string;
  const rolEnEvento = (formData.get("rol_en_evento") as string)?.trim();
  const costoIngresado = leerMonto(formData.get("costo"));
  const forzar = formData.get("forzar") === "true";

  if (!personalId) return { error: "Seleccioná una persona." };
  if (!rolEnEvento) return { error: "Indicá el rol en el evento." };

  const supabase = await createClient();

  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .select("fecha")
    .eq("id", eventoId)
    .maybeSingle();

  if (eventoError || !evento) {
    return { error: eventoError?.message ?? "No se encontró el evento." };
  }

  if (!forzar) {
    const choque = await buscarChoqueDeFecha(
      supabase,
      personalId,
      eventoId,
      evento.fecha,
    );

    if (choque) {
      return {
        warning: `Ya está asignada a "${choque.nombre}" el mismo día (${formatFecha(choque.fecha)}). ¿Confirmar igual?`,
      };
    }
  }

  // Se guarda la referencia vigente de la persona como foto, para comparar
  // después con lo acordado aunque la referencia cambie más adelante. Si no
  // se cargó un costo, se asume la referencia.
  const { data: persona, error: personaError } = await supabase
    .from("personal")
    .select("costo_referencia")
    .eq("id", personalId)
    .maybeSingle();

  if (personaError || !persona) {
    return { error: personaError?.message ?? "No se encontró la persona." };
  }

  const costoReferencia =
    persona.costo_referencia === null ? null : Number(persona.costo_referencia);

  const { error } = await supabase.from("turnos").insert({
    evento_id: eventoId,
    personal_id: personalId,
    rol_en_evento: rolEnEvento,
    costo: costoIngresado ?? costoReferencia,
    costo_referencia: costoReferencia,
  });

  if (error) return { error: error.message };

  revalidatePath(`/eventos/${eventoId}`);
  return {};
}

export async function toggleConfirmadoTurno(eventoId: string, turnoId: string) {
  const supabase = await createClient();

  const { data: turno, error: turnoError } = await supabase
    .from("turnos")
    .select("confirmado")
    .eq("id", turnoId)
    .maybeSingle();

  if (turnoError || !turno) {
    throw new Error(turnoError?.message ?? "No se encontró el turno.");
  }

  const { error } = await supabase
    .from("turnos")
    .update({ confirmado: !turno.confirmado })
    .eq("id", turnoId);

  if (error) throw new Error(error.message);

  revalidatePath(`/eventos/${eventoId}`);
}

// Lo que se acordó finalmente con la persona para este evento (ej. la
// referencia era 250.000 y se negoció 200.000).
export async function actualizarCostoTurno(
  eventoId: string,
  turnoId: string,
  formData: FormData,
) {
  const costo = leerMonto(formData.get("costo"));

  const supabase = await createClient();
  const { error } = await supabase.from("turnos").update({ costo }).eq("id", turnoId);
  if (error) throw new Error(error.message);

  revalidatePath(`/eventos/${eventoId}`);
  revalidatePath("/");
}

export async function eliminarTurno(eventoId: string, turnoId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("turnos").delete().eq("id", turnoId);
  if (error) throw new Error(error.message);

  revalidatePath(`/eventos/${eventoId}`);
}
