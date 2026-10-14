import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getReceta,
  getRecetaInsumos,
  getRecetaSubrecetas,
  getRecetasParaCosto,
  getSubrecetasParaSelector,
} from "@/lib/recetas/queries";
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

  const [insumosDeLaReceta, subrecetasDeLaReceta, insumos, subrecetas, recetasParaCosto] =
    await Promise.all([
      getRecetaInsumos(supabase, receta.id),
      getRecetaSubrecetas(supabase, receta.id),
      getInsumosParaSelector(supabase),
      getSubrecetasParaSelector(supabase),
      getRecetasParaCosto(supabase),
    ]);

  const actualizarEstaReceta = actualizarReceta.bind(null, receta.id);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar receta
      </h1>
      <RecetaForm
        recetaId={receta.id}
        insumos={insumos}
        subrecetas={subrecetas}
        recetasParaCosto={recetasParaCosto}
        defaultValues={{
          nombre: receta.nombre,
          categoria: receta.categoria,
          porcion_base: Number(receta.porcion_base),
          es_subreceta: receta.es_subreceta,
          rendimiento_unidad: receta.rendimiento_unidad,
          pct_varios: Number(receta.pct_varios),
          precio_venta: receta.precio_venta === null ? null : Number(receta.precio_venta),
        }}
        insumosIniciales={insumosDeLaReceta.map((item) => ({
          insumo_id: item.insumo_id,
          cantidad: Number(item.cantidad),
          unidad: item.unidad,
        }))}
        subrecetasIniciales={subrecetasDeLaReceta.map((item) => ({
          subreceta_id: item.subreceta_id,
          cantidad: Number(item.cantidad),
          unidad: item.unidad,
        }))}
        action={actualizarEstaReceta}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
