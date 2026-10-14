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

// true si dos unidades se pueden convertir entre sí (g ↔ kg, ml ↔ l).
export function mismaDimension(a: InsumoUnidad, b: InsumoUnidad): boolean {
  return FACTOR_A_BASE[a].base === FACTOR_A_BASE[b].base;
}

// Pasa un precio expresado por `desde` (ej. ₲ por gramo) a precio por
// `hacia` (ej. ₲ por kilo). null si las unidades no son compatibles.
export function convertirPrecio(
  precio: number,
  desde: InsumoUnidad,
  hacia: InsumoUnidad,
): number | null {
  const unaUnidadDestinoEnOrigen = convertirUnidad(1, hacia, desde);
  if (unaUnidadDestinoEnOrigen === null) return null;
  return precio * unaUnidadDestinoEnOrigen;
}

// Promedio ponderado entre el stock que había y lo que entra. Sin stock
// previo (o negativo), el costo nuevo es directamente el precio de compra.
export function costoPromedioPonderado(
  stockActual: number,
  costoActual: number,
  cantidadComprada: number,
  precioCompra: number,
): number {
  if (stockActual <= 0) return precioCompra;
  const total = stockActual + cantidadComprada;
  if (total <= 0) return precioCompra;
  return (stockActual * costoActual + cantidadComprada * precioCompra) / total;
}

// Factor de rendimiento: qué parte de lo comprado llega al plato. Con 25 %
// de merma, de 1 kg comprado se usan 0,75 kg. merma null = todavía sin medir.
export function factorRendimiento(mermaPct: number | null): number {
  if (mermaPct === null) return 1;
  return 1 - mermaPct / 100;
}

// ---------------------------------------------------------------------------
// Costo simple (sin merma ni sub-recetas): para valorizar cantidades reales
// ya usadas, como en el cierre de un evento.
// ---------------------------------------------------------------------------

export type InsumoParaCosto = {
  cantidad: number;
  unidad: InsumoUnidad;
  insumo: { costo_unitario: number; unidad: InsumoUnidad } | null;
};

export type CostoRecetaResultado = {
  costoTotal: number;
  insumosNoConvertibles: number;
};

// Suma cantidad × costo_unitario, convirtiendo la cantidad a la unidad en la
// que está cargado el costo del insumo. Las unidades incompatibles se
// excluyen del total y se cuentan aparte para avisar.
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

// ---------------------------------------------------------------------------
// Costo completo de una receta: merma, sub-recetas, % de varios y precio.
// ---------------------------------------------------------------------------

export type InsumoDeReceta = {
  id: string;
  nombre: string;
  costo_unitario: number;
  unidad: InsumoUnidad;
  merma_pct: number | null;
  marca_preferida?: string | null;
  marca_alternativa?: string | null;
};

export type RecetaParaCosto = {
  id: string;
  nombre: string;
  porcion_base: number;
  rendimiento_unidad: InsumoUnidad | null;
  pct_varios: number;
  precio_venta: number | null;
  receta_insumos: {
    cantidad: number;
    unidad: InsumoUnidad;
    insumos: InsumoDeReceta | null;
  }[];
  receta_subrecetas: {
    cantidad: number;
    unidad: InsumoUnidad;
    subreceta_id: string;
  }[];
};

export type LineaCosto = {
  tipo: "insumo" | "subreceta";
  id: string;
  nombre: string;
  cantidad: number;
  unidad: InsumoUnidad;
  // ₲ de la línea; null si no se pudo calcular (unidad incompatible o
  // sub-receta sin unidad de rendimiento).
  costo: number | null;
  mermaPct: number | null;
  mermaPendiente: boolean;
  marcaPreferida: string | null;
  marcaAlternativa: string | null;
};

export type CostoCompleto = {
  lineas: LineaCosto[];
  costoInsumos: number;
  costoVarios: number;
  costoTotal: number;
  costoPorPorcion: number;
  // Insumos (también dentro de sub-recetas) con merma sin medir.
  mermasPendientes: string[];
  lineasSinCalcular: number;
  precioPorcion: number | null;
  foodCostPct: number | null;
  margenPorPorcion: number | null;
};

export type MapaRecetas = Map<string, RecetaParaCosto>;

export function armarMapaRecetas(recetas: RecetaParaCosto[]): MapaRecetas {
  return new Map(recetas.map((receta) => [receta.id, receta]));
}

// Calcula el costo de una receta usando el mapa de todas las recetas (para
// resolver sub-recetas). `memo` evita recalcular sub-recetas compartidas y
// `enCurso` corta un ciclo si llegara a existir en los datos.
export function calcularCostoCompleto(
  recetaId: string,
  mapa: MapaRecetas,
  memo: Map<string, CostoCompleto> = new Map(),
  enCurso: Set<string> = new Set(),
): CostoCompleto | null {
  const cache = memo.get(recetaId);
  if (cache) return cache;

  const receta = mapa.get(recetaId);
  if (!receta || enCurso.has(recetaId)) return null;
  enCurso.add(recetaId);

  const lineas: LineaCosto[] = [];
  const mermasPendientes = new Set<string>();
  let costoInsumos = 0;
  let lineasSinCalcular = 0;

  for (const ri of receta.receta_insumos) {
    const insumo = ri.insumos;
    if (!insumo) continue;

    const cantidadEnUnidadInsumo = convertirUnidad(ri.cantidad, ri.unidad, insumo.unidad);
    const mermaPendiente = insumo.merma_pct === null;
    if (mermaPendiente) mermasPendientes.add(insumo.nombre);

    let costo: number | null = null;
    if (cantidadEnUnidadInsumo !== null) {
      // La receta indica peso limpio: para tenerlo hay que comprar más.
      costo =
        (cantidadEnUnidadInsumo * insumo.costo_unitario) /
        factorRendimiento(insumo.merma_pct);
      costoInsumos += costo;
    } else {
      lineasSinCalcular += 1;
    }

    lineas.push({
      tipo: "insumo",
      id: insumo.id,
      nombre: insumo.nombre,
      cantidad: ri.cantidad,
      unidad: ri.unidad,
      costo,
      mermaPct: insumo.merma_pct,
      mermaPendiente,
      marcaPreferida: insumo.marca_preferida ?? null,
      marcaAlternativa: insumo.marca_alternativa ?? null,
    });
  }

  for (const rs of receta.receta_subrecetas) {
    const sub = mapa.get(rs.subreceta_id);
    if (!sub) continue;

    const costoSub = calcularCostoCompleto(sub.id, mapa, memo, enCurso);
    let costo: number | null = null;

    if (costoSub && sub.rendimiento_unidad) {
      const cantidadEnUnidadRendimiento = convertirUnidad(
        rs.cantidad,
        rs.unidad,
        sub.rendimiento_unidad,
      );
      if (cantidadEnUnidadRendimiento !== null) {
        costo = (cantidadEnUnidadRendimiento / sub.porcion_base) * costoSub.costoTotal;
        costoInsumos += costo;
      }
      for (const nombre of costoSub.mermasPendientes) mermasPendientes.add(nombre);
    }
    if (costo === null) lineasSinCalcular += 1;

    lineas.push({
      tipo: "subreceta",
      id: sub.id,
      nombre: sub.nombre,
      cantidad: rs.cantidad,
      unidad: rs.unidad,
      costo,
      mermaPct: null,
      mermaPendiente: false,
      marcaPreferida: null,
      marcaAlternativa: null,
    });
  }

  const costoVarios = costoInsumos * (Number(receta.pct_varios) / 100);
  const costoTotal = costoInsumos + costoVarios;
  const costoPorPorcion = costoTotal / receta.porcion_base;

  // con IVA incluido, igual que el costo
  const precioPorcion = receta.precio_venta !== null ? Number(receta.precio_venta) : null;
  const foodCostPct = precioPorcion ? costoPorPorcion / precioPorcion : null;
  const margenPorPorcion = precioPorcion !== null ? precioPorcion - costoPorPorcion : null;

  const resultado: CostoCompleto = {
    lineas,
    costoInsumos,
    costoVarios,
    costoTotal,
    costoPorPorcion,
    mermasPendientes: [...mermasPendientes].sort((a, b) => a.localeCompare(b)),
    lineasSinCalcular,
    precioPorcion,
    foodCostPct,
    margenPorPorcion,
  };

  enCurso.delete(recetaId);
  memo.set(recetaId, resultado);
  return resultado;
}

// ---------------------------------------------------------------------------
// Insumos brutos a comprar para una receta (packing list / orden de compra):
// abre las sub-recetas y suma la merma, porque hay que comprar el peso
// sucio para obtener el peso limpio que pide la receta.
// ---------------------------------------------------------------------------

export type InsumoBruto = {
  insumoId: string;
  insumoNombre: string;
  unidad: InsumoUnidad;
  cantidad: number;
  marcaPreferida: string | null;
  marcaAlternativa: string | null;
};

export function expandirInsumosBrutos(
  recetaId: string,
  escala: number,
  mapa: MapaRecetas,
  acumulado: Map<string, InsumoBruto> = new Map(),
  enCurso: Set<string> = new Set(),
): Map<string, InsumoBruto> {
  const receta = mapa.get(recetaId);
  if (!receta || enCurso.has(recetaId)) return acumulado;
  enCurso.add(recetaId);

  for (const ri of receta.receta_insumos) {
    const insumo = ri.insumos;
    if (!insumo) continue;
    const cantidad = (ri.cantidad * escala) / factorRendimiento(insumo.merma_pct);
    const key = `${insumo.id}|${ri.unidad}`;
    const existente = acumulado.get(key);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      acumulado.set(key, {
        insumoId: insumo.id,
        insumoNombre: insumo.nombre,
        unidad: ri.unidad,
        cantidad,
        marcaPreferida: insumo.marca_preferida ?? null,
        marcaAlternativa: insumo.marca_alternativa ?? null,
      });
    }
  }

  for (const rs of receta.receta_subrecetas) {
    const sub = mapa.get(rs.subreceta_id);
    if (!sub?.rendimiento_unidad) continue;
    const cantidadEnRendimiento = convertirUnidad(rs.cantidad, rs.unidad, sub.rendimiento_unidad);
    if (cantidadEnRendimiento === null) continue;
    expandirInsumosBrutos(
      sub.id,
      (escala * cantidadEnRendimiento) / sub.porcion_base,
      mapa,
      acumulado,
      enCurso,
    );
  }

  enCurso.delete(recetaId);
  return acumulado;
}
