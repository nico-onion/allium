import { createClient } from "@/lib/supabase/server";
import { getInsumosParaSelector } from "@/lib/insumos/queries";
import { RecetaForm } from "@/components/recetas/RecetaForm";
import { crearReceta } from "../actions";

export default async function NuevaRecetaPage() {
  const supabase = await createClient();
  const insumos = await getInsumosParaSelector(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nueva receta
      </h1>
      <RecetaForm
        insumos={insumos}
        action={crearReceta}
        submitLabel="Crear receta"
      />
    </div>
  );
}
