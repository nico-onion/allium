import type { PresupuestoItemCategoria } from "@/lib/supabase/database.types";

// Margen por defecto cuando un tipo de evento todavía no tiene parámetros.
export const MARGEN_OBJETIVO_DEFAULT = 50;

// Todo se maneja con IVA incluido: precios al cliente y costos. El margen
// es (precio − costo) ÷ precio, ambos con IVA.

// Precio que deja `margenPct` de margen sobre un costo dado, redondeado
// hacia arriba a la centena. Ej. costo 6.000 y margen 50 % → 12.000.
export function precioSugerido(costo: number, margenPct: number): number {
  if (margenPct >= 100) return 0;
  // Se redondea a guaraníes enteros antes de subir a la centena, para que un
  // resto de coma flotante (12.000,0000001) no salte a la centena siguiente.
  const precio = Math.round(costo / (1 - margenPct / 100));
  return Math.ceil(precio / 100) * 100;
}

// Margen sobre el precio: (precio − costo) ÷ precio, en %. null sin precio.
export function margenPct(precio: number, costo: number): number | null {
  if (precio <= 0) return null;
  return ((precio - costo) / precio) * 100;
}

export type LineaParaTotales = {
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number | null;
};

export type TotalesPresupuesto = {
  precioTotal: number;
  costoLineas: number;
  costoImprevistos: number;
  costoTotal: number;
  margenBruto: number;
  margenPct: number | null;
  costoPorInvitado: number | null;
  precioPorInvitado: number | null;
  lineasSinCosto: number;
};

// Totales internos del presupuesto. Los imprevistos son un colchón de costo
// (no una línea que se cobra): suben el costo y bajan el margen.
export function calcularTotales(
  lineas: LineaParaTotales[],
  pctImprevistos: number,
  invitados: number | null,
): TotalesPresupuesto {
  let precioTotal = 0;
  let costoLineas = 0;
  let lineasSinCosto = 0;

  for (const linea of lineas) {
    precioTotal += linea.cantidad * linea.precioUnitario;
    if (linea.costoUnitario === null) {
      lineasSinCosto += 1;
    } else {
      costoLineas += linea.cantidad * linea.costoUnitario;
    }
  }

  const costoImprevistos = costoLineas * (pctImprevistos / 100);
  const costoTotal = costoLineas + costoImprevistos;
  const margenBruto = precioTotal - costoTotal;

  return {
    precioTotal,
    costoLineas,
    costoImprevistos,
    costoTotal,
    margenBruto,
    margenPct: precioTotal > 0 ? (margenBruto / precioTotal) * 100 : null,
    costoPorInvitado: invitados ? costoTotal / invitados : null,
    precioPorInvitado: invitados ? precioTotal / invitados : null,
    lineasSinCosto,
  };
}

export const CATEGORIA_LABELS: Record<PresupuestoItemCategoria, string> = {
  comida: "Comida",
  bebida: "Bebida",
  personal: "Personal",
  alquiler: "Alquiler",
  logistica: "Logística",
  decoracion: "Decoración",
  otro: "Otro",
};

// Categorías para líneas sin receta (la comida va siempre por receta).
export const CATEGORIAS_SIN_RECETA = (
  Object.keys(CATEGORIA_LABELS) as PresupuestoItemCategoria[]
).filter((categoria) => categoria !== "comida");
