import type { GastoCategoria } from "@/lib/supabase/database.types";

export const GASTO_CATEGORIA_LABELS: Record<GastoCategoria, string> = {
  mercaderia: "Mercadería (sin receta)",
  descartables: "Descartables",
  combustible: "Carbón / leña / gas",
  mano_obra: "Mano de obra",
  transporte: "Transporte / flete",
  alquiler: "Alquiler",
  imprevisto: "Imprevisto",
  otro: "Otro",
};

export const GASTO_CATEGORIAS = Object.keys(GASTO_CATEGORIA_LABELS) as GastoCategoria[];
