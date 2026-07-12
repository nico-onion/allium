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

export function formatCantidad(n: number): string {
  return Number(n.toFixed(2)).toString();
}
