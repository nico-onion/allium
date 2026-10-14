export function formatGuaranies(amount: number | null): string {
  if (amount === null) return "-";
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Convierte un valor ISO (con o sin offset) al formato que espera
// <input type="datetime-local">: "YYYY-MM-DDTHH:mm".
export function toDatetimeLocalValue(iso: string): string {
  return iso.slice(0, 16);
}

// Para columnas `date` (sin hora), donde formatFecha mostraría "00:00"
// engañosamente.
export function formatFechaCorta(fecha: string): string {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(
    // "2026-10-11" se interpreta como medianoche UTC, que en Paraguay es el
    // día anterior: se ancla al mediodía para mostrar el día correcto.
    new Date(/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T12:00:00` : fecha),
  );
}

export function formatCantidad(n: number): string {
  return Number(n.toFixed(2)).toString();
}

export function formatHora(iso: string): string {
  return new Intl.DateTimeFormat("es-PY", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
