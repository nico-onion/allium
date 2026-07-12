import type { EventoEstado, EventoTipo } from "@/lib/supabase/database.types";

export const TIPO_LABELS: Record<EventoTipo, string> = {
  cena_pasos: "Cena de pasos",
  asado: "Asado",
  finger_food: "Finger food",
  combo: "Combo",
  maridaje: "Maridaje",
  pizzas: "Pizzas",
  box: "Box",
};

export const TIPO_OPTIONS = Object.entries(TIPO_LABELS) as [
  EventoTipo,
  string,
][];

export const ESTADO_LABELS: Record<EventoEstado, string> = {
  cotizado: "Cotizado",
  confirmado: "Confirmado",
  en_curso: "En curso",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

export const ESTADO_OPTIONS = Object.entries(ESTADO_LABELS) as [
  EventoEstado,
  string,
][];

export const ESTADO_BADGE_CLASSES: Record<EventoEstado, string> = {
  cotizado: "bg-zinc-100 text-zinc-600",
  confirmado: "bg-fucsia-100 text-fucsia-700",
  en_curso: "bg-amber-100 text-amber-700",
  cerrado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};
