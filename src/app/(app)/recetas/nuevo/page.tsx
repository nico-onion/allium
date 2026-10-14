import { createClient } from "@/lib/supabase/server";
import { getInsumosParaSelector } from "@/lib/insumos/queries";
import { getRecetasParaCosto, getSubrecetasParaSelector } from "@/lib/recetas/queries";
import { RecetaForm } from "@/components/recetas/RecetaForm";
import { crearReceta } from "../actions";

export default async function NuevaRecetaPage() {
  const supabase = await createClient();
  const [insumos, subrecetas, recetasParaCosto] = await Promise.all([
    getInsumosParaSelector(supabase),
    getSubrecetasParaSelector(supabase),
    getRecetasParaCosto(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nueva receta
      </h1>
      <RecetaForm
        insumos={insumos}
        subrecetas={subrecetas}
        recetasParaCosto={recetasParaCosto}
        action={crearReceta}
        submitLabel="Crear receta"
      />
    </div>
  );
}
