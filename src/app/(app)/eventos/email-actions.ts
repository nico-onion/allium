"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { getEvento } from "@/lib/eventos/queries";
import { getOrdenCompra } from "@/lib/ordenes-compra/queries";
import {
  construirAsuntoOrdenCompra,
  construirHtmlOrdenCompra,
} from "@/lib/ordenes-compra/email";

export type EnviarOrdenFormState = { error?: string; enviado?: boolean };

// Remitente de prueba de Resend (resend.dev), válido sin verificar dominio
// propio. Cuando se verifique onion.com.py en Resend, cambiar por algo como
// "Allium <compras@onion.com.py>".
const REMITENTE = "Allium <onboarding@resend.dev>";

export async function enviarOrdenCompraPorEmail(
  eventoId: string,
  _prevState: EnviarOrdenFormState,
  formData: FormData,
): Promise<EnviarOrdenFormState> {
  const destinatario = (formData.get("destinatario") as string)?.trim();
  if (!destinatario) return { error: "Ingresá un destinatario." };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { error: "Falta configurar RESEND_API_KEY en el servidor." };
  }

  const supabase = await createClient();
  const [evento, orden] = await Promise.all([
    getEvento(supabase, eventoId),
    getOrdenCompra(supabase, eventoId),
  ]);

  if (!evento) return { error: "No se encontró el evento." };
  if (!orden || orden.items.length === 0) {
    return {
      error: "Este evento todavía no tiene una orden de compra generada.",
    };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: REMITENTE,
    to: destinatario,
    subject: construirAsuntoOrdenCompra(evento),
    html: construirHtmlOrdenCompra(evento, orden),
  });

  if (error) return { error: error.message };

  return { enviado: true };
}
