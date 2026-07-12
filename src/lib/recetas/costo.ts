import type { InsumoUnidad } from "@/lib/supabase/database.types";

// Cada unidad se expresa como un factor respecto de una unidad "base" de su
// misma dimensión (peso, volumen, o conteo). Dos unidades solo son
// convertibles entre sí si comparten la misma base.
const FACTOR_A_BASE: Record<InsumoUnidad, { base: string; factor: number }> = {
  kg: { base: "peso", factor: 1 },
  g: { base: "peso", factor: 0.001 },
  l: { base: "volumen", factor: 1 },
  ml: { base: "volumen", factor: 0.001 },
  unidad: { base: "conteo", factor: 1 },
  docena: { base: "conteo", factor: 12 },
};

// Convierte `cantidad` de `desde` a `hacia`; null si no son compatibles
// (ej. querer pasar litros a kilogramos).
export function convertirUnidad(
  cantidad: number,
  desde: InsumoUnidad,
  hacia: InsumoUnidad,
): number | null {
  const origen = FACTOR_A_BASE[desde];
  const destino = FACTOR_A_BASE[hacia];
  if (origen.base !== destino.base) return null;
  return (cantidad * origen.factor) / destino.factor;
}

export type InsumoParaCosto = {
  cantidad: number;
  unidad: InsumoUnidad;
  insumo: { costo_unitario: number; unidad: InsumoUnidad } | null;
};

export type CostoRecetaResultado = {
  costoTotal: number;
  insumosNoConvertibles: number;
};

// Suma cantidad_insumo × costo_unitario para cada insumo de la receta,
// convirtiendo la cantidad a la unidad en la que está cargado el costo del
// insumo. Los insumos con unidad incompatible (ej. litros vs. kilos) no se
// pueden convertir y se excluyen del total, pero se cuentan aparte para
// poder avisar que el costo puede estar incompleto.
export function calcularCostoReceta(
  insumos: InsumoParaCosto[],
): CostoRecetaResultado {
  let costoTotal = 0;
  let insumosNoConvertibles = 0;

  for (const item of insumos) {
    if (!item.insumo) continue;

    const cantidadConvertida = convertirUnidad(
      item.cantidad,
      item.unidad,
      item.insumo.unidad,
    );

    if (cantidadConvertida === null) {
      insumosNoConvertibles += 1;
      continue;
    }

    costoTotal += cantidadConvertida * item.insumo.costo_unitario;
  }

  return { costoTotal, insumosNoConvertibles };
}
