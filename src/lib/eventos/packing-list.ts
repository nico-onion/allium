export type MenuItemParaCalculo = {
  receta_id: string;
  cantidad_porciones: number;
  recetas: { porcion_base: number } | null;
};

export type RecetaInsumoParaCalculo = {
  receta_id: string;
  insumo_id: string;
  cantidad: number;
  unidad: string;
  insumos: { nombre: string } | null;
};

export type PackingListItem = {
  insumoId: string;
  insumoNombre: string;
  unidad: string;
  cantidad: number;
};

// Suma, insumo por insumo (agrupado también por unidad, ya que no convertimos
// unidades entre sí), lo que hace falta comprar para cubrir todas las recetas
// del menú, escalado según cuántas porciones de cada una se van a preparar.
export function calcularPackingList(
  menuItems: MenuItemParaCalculo[],
  recetaInsumos: RecetaInsumoParaCalculo[],
): PackingListItem[] {
  const acumulado = new Map<string, PackingListItem>();

  for (const item of menuItems) {
    const porcionBase = item.recetas?.porcion_base;
    if (!porcionBase) continue;
    const factor = item.cantidad_porciones / porcionBase;

    for (const ri of recetaInsumos) {
      if (ri.receta_id !== item.receta_id) continue;

      const necesario = ri.cantidad * factor;
      const key = `${ri.insumo_id}|${ri.unidad}`;
      const existente = acumulado.get(key);

      if (existente) {
        existente.cantidad += necesario;
      } else {
        acumulado.set(key, {
          insumoId: ri.insumo_id,
          insumoNombre: ri.insumos?.nombre ?? "Insumo",
          unidad: ri.unidad,
          cantidad: necesario,
        });
      }
    }
  }

  return Array.from(acumulado.values()).sort((a, b) =>
    a.insumoNombre.localeCompare(b.insumoNombre),
  );
}
