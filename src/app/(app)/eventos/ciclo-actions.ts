"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LINK_RESENA_GOOGLE,
  getCicloEvento,
  resumenCiclo,
  telefonoWhatsApp,
} from "@/lib/eventos/ciclo";
import { categoriaGastoValida } from "@/lib/compras/registrar";
import type { CobroMedio, CobroTipo } from "@/lib/supabase/database.types";

export type CicloFormState = { error?: string; ok?: boolean };

const TIPOS_COBRO: CobroTipo[] = ["sena", "saldo", "otro"];
const MEDIOS_COBRO: CobroMedio[] = ["transferencia", "efectivo", "tarjeta", "qr", "otro"];

// "850.000" → 850000
function leerMonto(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").trim().replace(/\./g, "").replace(",", ".");
  if (!texto) return null;
  const monto = Number(texto);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

function leerTexto(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function leerFecha(valor: FormDataEntryValue | null): string {
  const texto = String(valor ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : new Date().toISOString().slice(0, 10);
}

function refrescar(eventoId: string) {
  revalidatePath(`/eventos/${eventoId}`);
  revalidatePath("/eventos");
}

export async function registrarCobro(
  eventoId: string,
  _prev: CicloFormState,
  formData: FormData,
): Promise<CicloFormState> {
  const monto = leerMonto(formData.get("monto"));
  const tipo = formData.get("tipo") as CobroTipo;
  const medio = formData.get("medio") as CobroMedio;
  if (!monto) return { error: "Indicá el monto cobrado." };
  if (!TIPOS_COBRO.includes(tipo)) return { error: "Elegí si es seña, saldo u otro." };

  const supabase = await createClient();
  const { error } = await supabase.from("cobros").insert({
    evento_id: eventoId,
    tipo,
    monto,
    fecha: leerFecha(formData.get("fecha")),
    medio: MEDIOS_COBRO.includes(medio) ? medio : "transferencia",
    comprobante: leerTexto(formData.get("comprobante")),
    nota: leerTexto(formData.get("nota")),
  });
  if (error) return { error: error.message };

  refrescar(eventoId);
  return { ok: true };
}

export async function eliminarCobro(eventoId: string, cobroId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cobros").delete().eq("id", cobroId);
  if (error) throw new Error(error.message);
  refrescar(eventoId);
}

export async function registrarFacturaVenta(
  eventoId: string,
  _prev: CicloFormState,
  formData: FormData,
): Promise<CicloFormState> {
  const numero = leerTexto(formData.get("numero"));
  const monto = leerMonto(formData.get("monto"));
  if (!numero) return { error: "Indicá el número de factura." };
  if (!monto) return { error: "Indicá el monto facturado." };

  const supabase = await createClient();
  const { error } = await supabase.from("facturas_venta").insert({
    evento_id: eventoId,
    numero,
    monto,
    fecha: leerFecha(formData.get("fecha")),
  });
  if (error) {
    return {
      error: error.code === "23505" ? `La factura ${numero} ya está registrada.` : error.message,
    };
  }

  refrescar(eventoId);
  return { ok: true };
}

export async function eliminarFacturaVenta(eventoId: string, facturaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("facturas_venta").delete().eq("id", facturaId);
  if (error) throw new Error(error.message);
  refrescar(eventoId);
}

export async function registrarGastoEvento(
  eventoId: string,
  _prev: CicloFormState,
  formData: FormData,
): Promise<CicloFormState> {
  const descripcion = leerTexto(formData.get("descripcion"));
  const monto = leerMonto(formData.get("monto"));
  if (!descripcion) return { error: "Describí el gasto." };
  if (!monto) return { error: "Indicá el monto." };

  const supabase = await createClient();
  const { error } = await supabase.from("gastos_evento").insert({
    evento_id: eventoId,
    descripcion,
    monto,
    categoria: categoriaGastoValida(formData.get("categoria") as string),
    fecha: leerFecha(formData.get("fecha")),
  });
  if (error) return { error: error.message };

  refrescar(eventoId);
  return { ok: true };
}

export async function eliminarGastoEvento(eventoId: string, gastoId: string) {
  const supabase = await createClient();
  // Los gastos que vienen de una factura se corrigen desde la compra.
  const { error } = await supabase
    .from("gastos_evento")
    .delete()
    .eq("id", gastoId)
    .is("compra_linea_id", null);
  if (error) throw new Error(error.message);
  refrescar(eventoId);
}

// Marca la reseña como enviada y abre WhatsApp con el mensaje listo.
export async function enviarResena(eventoId: string) {
  const supabase = await createClient();
  const { data: evento, error } = await supabase
    .from("eventos")
    .select("clientes(nombre, telefono)")
    .eq("id", eventoId)
    .maybeSingle();
  if (error || !evento) throw new Error(error?.message ?? "No se encontró el evento.");

  const nombre = evento.clientes?.nombre?.split(" ")[0];
  const mensaje =
    `¡Hola${nombre ? ` ${nombre}` : ""}! Gracias por elegirnos para tu evento. ` +
    `Si te gustó la experiencia, nos ayudaría muchísimo que nos dejes una reseña en Google: ${LINK_RESENA_GOOGLE}`;

  const { error: updateError } = await supabase
    .from("eventos")
    .update({ resena_enviada_en: new Date().toISOString() })
    .eq("id", eventoId);
  if (updateError) throw new Error(updateError.message);
  refrescar(eventoId);

  const telefono = telefonoWhatsApp(evento.clientes?.telefono);
  redirect(
    `https://wa.me/${telefono ?? ""}?text=${encodeURIComponent(mensaje)}`,
  );
}

export async function cerrarEventoCiclo(
  eventoId: string,
  _prev: CicloFormState,
  formData: FormData,
): Promise<CicloFormState> {
  const supabase = await createClient();
  const { data: evento, error } = await supabase
    .from("eventos")
    .select("precio_total, costo_cotizado, resena_enviada_en")
    .eq("id", eventoId)
    .maybeSingle();
  if (error || !evento) return { error: error?.message ?? "No se encontró el evento." };

  const resumen = resumenCiclo(await getCicloEvento(supabase, eventoId), evento);
  const forzar = formData.get("forzar") === "true";
  if (!resumen.listoParaCerrar && !forzar) {
    const faltan = resumen.checklist.filter((item) => !item.ok).map((item) => item.label);
    return { error: `Falta: ${faltan.join(", ")}.` };
  }

  const { error: updateError } = await supabase
    .from("eventos")
    .update({ cerrado_en: new Date().toISOString(), estado: "realizado" })
    .eq("id", eventoId);
  if (updateError) return { error: updateError.message };

  refrescar(eventoId);
  return { ok: true };
}

export async function reabrirEvento(eventoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("eventos").update({ cerrado_en: null }).eq("id", eventoId);
  if (error) throw new Error(error.message);
  refrescar(eventoId);
}
