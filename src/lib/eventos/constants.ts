import type { EventoEstado } from "@/lib/supabase/database.types";

// tipo es texto libre (podés escribir uno nuevo desde el form), así que esto
// ya no es un Record exhaustivo — solo etiquetas "lindas" para los tipos
// originales; cualquier otro valor se muestra tal cual se cargó.
export const TIPO_LABELS: Record<string, string> = {
  cena_pasos: "Cena de pasos",
  asado: "Asado",
  finger_food: "Finger food",
  combo: "Combo",
  maridaje: "Maridaje",
  pizzas: "Pizzas",
  box: "Box",
};

export function tipoLabel(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo;
}

// Tipos base conocidos del negocio: siempre seleccionables aunque todavía no
// haya ningún evento cargado con ese tipo.
export const TIPOS_BASE = Object.keys(TIPO_LABELS);

export const ESTADO_LABELS: Record<EventoEstado, string> = {
  cotizado: "Cotizado",
  confirmado: "Confirmado",
  en_curso: "En curso",
  realizado: "Realizado",
  cancelado: "Cancelado",
  postergado: "Postergado",
};

export const ESTADO_OPTIONS = Object.entries(ESTADO_LABELS) as [
  EventoEstado,
  string,
][];

export const ESTADO_BADGE_CLASSES: Record<EventoEstado, string> = {
  cotizado: "bg-zinc-100 text-zinc-600",
  confirmado: "bg-fucsia-100 text-fucsia-700",
  en_curso: "bg-amber-100 text-amber-700",
  realizado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
  postergado: "bg-sky-100 text-sky-700",
};

// Eventos "activos": lo que se ve en /eventos día a día.
export const ESTADOS_ACTIVOS: EventoEstado[] = [
  "cotizado",
  "confirmado",
  "en_curso",
];

// Eventos que ya salieron del flujo activo: se revisan en /eventos/archivo.
export const ESTADOS_ARCHIVO: EventoEstado[] = [
  "realizado",
  "cancelado",
  "postergado",
];

export const ESTADO_OPTIONS_ACTIVOS = ESTADO_OPTIONS.filter(([value]) =>
  ESTADOS_ACTIVOS.includes(value),
);

export const ESTADO_OPTIONS_ARCHIVO = ESTADO_OPTIONS.filter(([value]) =>
  ESTADOS_ARCHIVO.includes(value),
);

const TODOS_LOS_ESTADOS = ESTADO_OPTIONS.map(([value]) => value);

export function isEventoEstado(value: string): value is EventoEstado {
  return (TODOS_LOS_ESTADOS as string[]).includes(value);
}

// Acciones rápidas de cambio de estado desde el detalle del evento.
export const ESTADO_ACCION_RAPIDA_LABELS: Partial<Record<EventoEstado, string>> = {
  realizado: "Marcar como realizado",
  cancelado: "Cancelar",
  postergado: "Postergar",
};

export const ESTADO_ACCION_RAPIDA_CLASSES: Partial<Record<EventoEstado, string>> = {
  realizado: "border-emerald-200 text-emerald-700",
  cancelado: "border-red-200 text-red-700",
  postergado: "border-sky-200 text-sky-700",
};
