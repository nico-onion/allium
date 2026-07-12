import type { InsumoUnidad } from "@/lib/supabase/database.types";

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
