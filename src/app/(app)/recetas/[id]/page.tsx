import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReceta, getRecetaInsumos } from "@/lib/recetas/queries";
import { calcularCostoReceta } from "@/lib/recetas/costo";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatGuaranies } from "@/lib/format";

export default async function RecetaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const receta = await getReceta(supabase, id);

  if (!receta) notFound();

  const insumos = await getRecetaInsumos(supabase, receta.id);
  const { costoTotal, insumosNoConvertibles } = calcularCostoReceta(
    insumos.map((item) => ({
      cantidad: item.cantidad,
      unidad: item.unidad,
      insumo: item.insumos,
    })),
  );

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          {receta.nombre}
        </h1>
        <span className="text-sm text-zinc-500">
          {receta.categoria ?? "Sin categoría"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-zinc-400">
            Porción base
          </span>
          <span className="text-base text-zinc-900">{receta.porcion_base}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-zinc-400">
            Costo estimado
          </span>
          <span className="text-base text-zinc-900">
            {formatGuaranies(costoTotal)}
          </span>
          {insumosNoConvertibles > 0 && (
            <span className="text-xs text-amber-600">
              {insumosNoConvertibles} insumo(s) no incluido(s) por unidad
              incompatible
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">Insumos</span>
        {insumos.length === 0 ? (
          <p className="text-sm text-zinc-400">Esta receta no tiene insumos cargados.</p>
        ) : (
          <ul className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
            {insumos.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 text-sm last:border-0 last:pb-0"
              >
                <span className="text-zinc-900">
                  {item.insumos?.nombre ?? "Insumo"}
                </span>
                <span className="text-zinc-500">
                  {item.cantidad} {UNIDAD_LABELS_CORTAS[item.unidad]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href={`/recetas/${receta.id}/editar`}
        className="w-full rounded-lg bg-fucsia-600 py-3 text-center text-base font-medium text-white"
      >
        Editar receta
      </Link>
    </div>
  );
}
