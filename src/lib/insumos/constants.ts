import type {
  InsumoTipoAlmacenamiento,
  InsumoUnidad,
  TipoMovimientoStock,
} from "@/lib/supabase/database.types";

export const UNIDAD_LABELS: Record<InsumoUnidad, string> = {
  kg: "Kilogramo (kg)",
  g: "Gramo (g)",
  l: "Litro (l)",
  ml: "Mililitro (ml)",
  unidad: "Unidad",
  docena: "Docena",
};

export const UNIDAD_LABELS_CORTAS: Record<InsumoUnidad, string> = {
  kg: "kg",
  g: "g",
  l: "l",
  ml: "ml",
  unidad: "u.",
  docena: "doc.",
};

export const UNIDAD_OPTIONS = Object.entries(UNIDAD_LABELS) as [
  InsumoUnidad,
  string,
][];

export const TIPO_ALMACENAMIENTO_LABELS: Record<InsumoTipoAlmacenamiento, string> = {
  seco: "Seco",
  refrigerado: "Refrigerado",
};

export const TIPO_ALMACENAMIENTO_OPTIONS = Object.entries(
  TIPO_ALMACENAMIENTO_LABELS,
) as [InsumoTipoAlmacenamiento, string][];

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimientoStock, string> = {
  compra: "Compra",
  uso_evento: "Uso en evento",
  ajuste: "Ajuste",
  merma: "Merma",
};

// uso_evento no es seleccionable a mano (lo genera el sistema al reconciliar
// el cierre de un evento), y compra tampoco (se carga desde /compras, no
// desde la ficha del insumo).
export const TIPOS_MOVIMIENTO_MANUAL = ["ajuste", "merma"] as const;

