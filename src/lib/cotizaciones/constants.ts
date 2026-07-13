import type { PresupuestoEstado } from "@/lib/supabase/database.types";

export const ESTADO_LABELS: Record<PresupuestoEstado, string> = {
  enviado: "Enviado",
  aceptado: "Aceptado",
  aceptado_con_cambios: "Aceptado con cambios",
  en_evaluacion: "En evaluación",
  rechazado: "Rechazado",
};

export const ESTADO_OPTIONS = Object.entries(ESTADO_LABELS) as [
  PresupuestoEstado,
  string,
][];

export const ESTADO_BADGE_CLASSES: Record<PresupuestoEstado, string> = {
  enviado: "bg-zinc-100 text-zinc-600",
  aceptado: "bg-emerald-100 text-emerald-700",
  aceptado_con_cambios: "bg-sky-100 text-sky-700",
  en_evaluacion: "bg-amber-100 text-amber-700",
  rechazado: "bg-red-100 text-red-700",
};

// Estados desde los que se puede generar el evento: la cotización fue
// aceptada, con o sin cambios respecto a lo enviado originalmente.
export const ESTADOS_HABILITAN_EVENTO: PresupuestoEstado[] = [
  "aceptado",
  "aceptado_con_cambios",
];

// Precargado en el formulario (editable antes de guardar), no en el PDF —
// el PDF siempre imprime lo que quedó guardado en no_incluye.
export const NO_INCLUYE_DEFAULT = `• Mozos: Gs. 280.000 por mozo.
• Bebidas. Solicitar presupuesto.
• Alquileres: Mobiliarios para eventos (mesas, sillas, servilletas, deco y otros). Solicitar presupuesto.`;

// Secciones fijas del PDF: mismo texto siempre, no se editan por presupuesto.
export const CONDICIONES_PAGO = [
  "50% de anticipo para confirmar la reserva de la fecha.",
  "50% restante a liquidar el día del evento, antes del inicio del servicio.",
  "Formas de pago: transferencia bancaria o efectivo.",
];

export const POLITICA_CANCELACION = [
  "Más de 7 días de anticipación: devolución del 100% del anticipo.",
  "Entre 3 y 7 días: devolución del 50% del anticipo.",
  "Menos de 72 horas: sin devolución del anticipo.",
  "Fuerza mayor debidamente justificada: se evalúa caso a caso.",
];
