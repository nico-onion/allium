import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReceta, getRecetaInsumos } from "@/lib/recetas/queries";
import { getInsumosParaSelector } from "@/lib/insumos/queries";
import { RecetaForm } from "@/components/recetas/RecetaForm";
import { actualizarReceta } from "../../actions";

export default async function EditarRecetaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const receta = await getReceta(supabase, id);

  if (!receta) notFound();

  const [insumosDeLaReceta, insumos] = await Promise.all([
    getRecetaInsumos(supabase, receta.id),
    getInsumosParaSelector(supabase),
  ]);

  const actualizarEstaReceta = actualizarReceta.bind(null, receta.id);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar receta
      </h1>
      <RecetaForm
        insumos={insumos}
        defaultValues={{
          nombre: receta.nombre,
          categoria: receta.categoria,
          porcion_base: receta.porcion_base,
        }}
        insumosIniciales={insumosDeLaReceta.map((item) => ({
          insumo_id: item.insumo_id,
          cantidad: item.cantidad,
          unidad: item.unidad,
        }))}
        action={actualizarEstaReceta}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
