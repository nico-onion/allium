import { IVA_TASA } from "@/lib/recetas/costo";
import type { PresupuestoItemCategoria } from "@/lib/supabase/database.types";

// Margen por defecto cuando un tipo de evento todavía no tiene parámetros.
export const MARGEN_OBJETIVO_DEFAULT = 50;

// Los precios al cliente se cotizan con IVA incluido; el margen se mide sobre
// el precio sin IVA, que es lo que efectivamente queda.
export function precioSinIva(precioConIva: number): number {
  return precioConIva / (1 + IVA_TASA);
}

// Precio con IVA que deja `margenPct` de margen sobre un costo dado.
// Ej. costo 6.000 y margen 50 % → neto 12.000 → con IVA 13.200 (redondeado
// hacia arriba a la centena).
export function precioSugerido(costo: number, margenPct: number): number {
  if (margenPct >= 100) return 0;
  const neto = costo / (1 - margenPct / 100);
  // Se redondea a guaraníes enteros antes de subir a la centena, para que un
  // resto de coma flotante (13.200,0000001) no salte a la centena siguiente.
  const conIva = Math.round(neto * (1 + IVA_TASA));
  return Math.ceil(conIva / 100) * 100;
}

// Margen sobre el precio sin IVA: (neto − costo) ÷ neto. null sin precio.
export function margenPct(precioConIva: number, costo: number): number | null {
  const neto = precioSinIva(precioConIva);
  if (neto <= 0) return null;
  return ((neto - costo) / neto) * 100;
}

export type LineaParaTotales = {
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number | null;
};

export type TotalesPresupuesto = {
  precioTotal: number;
  precioSinIva: number;
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
  const neto = precioSinIva(precioTotal);
  const margenBruto = neto - costoTotal;

  return {
    precioTotal,
    precioSinIva: neto,
    costoLineas,
    costoImprevistos,
    costoTotal,
    margenBruto,
    margenPct: neto > 0 ? (margenBruto / neto) * 100 : null,
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
