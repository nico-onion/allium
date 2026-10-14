import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getClientesParaSelector } from "@/lib/eventos/queries";
import { getParametrosTipoEvento, getTiposEventoUsados } from "@/lib/cotizaciones/queries";
import { getRecetasParaCosto } from "@/lib/recetas/queries";
import { getPersonalParaSelector } from "@/lib/staff/queries";
import { armarMapaRecetas, calcularCostoCompleto } from "@/lib/recetas/costo";
import type { RecetaParaPresupuesto } from "@/components/cotizaciones/ItemsPresupuestoFields";

// Todo lo que necesita el formulario de presupuesto, con el costo por
// porción de cada receta ya calculado (platos primero, sub-recetas después).
export async function getDatosFormularioPresupuesto(supabase: SupabaseClient<Database>) {
  const [clientes, recetasParaCosto, personal, parametros, tiposUsados] = await Promise.all([
    getClientesParaSelector(supabase),
    getRecetasParaCosto(supabase),
    getPersonalParaSelector(supabase),
    getParametrosTipoEvento(supabase),
    getTiposEventoUsados(supabase),
  ]);

  const mapa = armarMapaRecetas(recetasParaCosto);
  const memo = new Map();
  const recetas: RecetaParaPresupuesto[] = [...recetasParaCosto]
    .sort((a, b) => Number(a.es_subreceta) - Number(b.es_subreceta))
    .map((receta) => {
      const costo = calcularCostoCompleto(receta.id, mapa, memo);
      return {
        id: receta.id,
        nombre: receta.es_subreceta ? `${receta.nombre} (sub-receta)` : receta.nombre,
        costoPorPorcion: costo ? Math.round(costo.costoPorPorcion * 100) / 100 : null,
        mermaPendiente: (costo?.mermasPendientes.length ?? 0) > 0,
      };
    });

  // Los tipos con parámetros también se ofrecen en el selector.
  const tipos = Array.from(new Set([...tiposUsados, ...parametros.map((p) => p.tipo)])).sort(
    (a, b) => a.localeCompare(b),
  );

  return {
    clientes,
    recetas,
    personal: personal.map((persona) => ({
      id: persona.id,
      nombre: persona.nombre,
      costo_referencia:
        persona.costo_referencia === null ? null : Number(persona.costo_referencia),
    })),
    parametros,
    tiposUsados: tipos,
  };
}
