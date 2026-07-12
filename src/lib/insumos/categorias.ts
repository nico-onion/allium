export const SIN_CATEGORIA_LABEL = "Sin categoría";

export function categoriaDe(insumo: { categoria: string | null }): string {
  return insumo.categoria?.trim() || SIN_CATEGORIA_LABEL;
}

export function estaBajoStockMinimo(insumo: {
  stock_actual: number;
  stock_minimo: number;
}): boolean {
  // Postgres devuelve las columnas numeric como string vía PostgREST; se
  // fuerza a número para que la comparación sea numérica y no lexicográfica.
  return Number(insumo.stock_actual) < Number(insumo.stock_minimo);
}

export type GrupoCategoria = { categoria: string; cantidad: number };

export function agruparPorCategoria<T extends { categoria: string | null }>(
  insumos: T[],
): GrupoCategoria[] {
  const conteo = new Map<string, number>();

  for (const insumo of insumos) {
    const categoria = categoriaDe(insumo);
    conteo.set(categoria, (conteo.get(categoria) ?? 0) + 1);
  }

  return Array.from(conteo.entries())
    .map(([categoria, cantidad]) => ({ categoria, cantidad }))
    .sort((a, b) => {
      // "Sin categoría" siempre al final, el resto alfabético.
      if (a.categoria === SIN_CATEGORIA_LABEL) return 1;
      if (b.categoria === SIN_CATEGORIA_LABEL) return -1;
      return a.categoria.localeCompare(b.categoria);
    });
}

// Alertas primero; dentro de cada grupo, orden alfabético.
export function ordenarPorAlerta<
  T extends { stock_actual: number; stock_minimo: number; nombre: string },
>(insumos: T[]): T[] {
  return [...insumos].sort((a, b) => {
    const alertaA = estaBajoStockMinimo(a);
    const alertaB = estaBajoStockMinimo(b);
    if (alertaA !== alertaB) return alertaA ? -1 : 1;
    return a.nombre.localeCompare(b.nombre);
  });
}
