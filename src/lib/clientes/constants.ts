import type { ClienteOrigen, ClienteTipo } from "@/lib/supabase/database.types";

export const ORIGEN_LABELS: Record<ClienteOrigen, string> = {
  instagram: "Instagram",
  meta_ads: "Meta Ads",
  whatsapp: "WhatsApp",
  referido: "Referido",
  google: "Google",
  evento: "Lo conoció en un evento",
  otro: "Otro",
};

export const TIPO_CLIENTE_LABELS: Record<ClienteTipo, string> = {
  persona: "Persona",
  empresa: "Empresa",
};
