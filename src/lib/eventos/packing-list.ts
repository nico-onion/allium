import {
  expandirInsumosBrutos,
  type InsumoBruto,
  type MapaRecetas,
} from "@/lib/recetas/costo";

export type MenuItemParaCalculo = {
  receta_id: string;
  cantidad_porciones: number;
  recetas: { porcion_base: number } | null;
};

export type PackingListItem = InsumoBruto;

// Suma, insumo por insumo (agrupado también por unidad, ya que no convertimos
// unidades entre sí), lo que hace falta comprar para cubrir todas las recetas
// del menú, escalado según cuántas porciones de cada una se van a preparar.
// Abre las sub-recetas en sus insumos y suma la merma de cada insumo: la
// receta pide peso limpio, la compra es en peso bruto.
export function calcularPackingList(
  menuItems: MenuItemParaCalculo[],
  mapaRecetas: MapaRecetas,
): PackingListItem[] {
  const acumulado = new Map<string, InsumoBruto>();

  for (const item of menuItems) {
    const porcionBase = item.recetas?.porcion_base;
    if (!porcionBase) continue;
    expandirInsumosBrutos(
      item.receta_id,
      item.cantidad_porciones / Number(porcionBase),
      mapaRecetas,
      acumulado,
    );
  }

  return Array.from(acumulado.values()).sort((a, b) =>
    a.insumoNombre.localeCompare(b.insumoNombre),
  );
}
