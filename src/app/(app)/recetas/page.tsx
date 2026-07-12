import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecetas } from "@/lib/recetas/queries";
import { calcularCostoReceta } from "@/lib/recetas/costo";
import { formatGuaranies } from "@/lib/format";

export default async function RecetasPage() {
  const supabase = await createClient();
  const recetas = await getRecetas(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Recetas
        </h1>
        <Link
          href="/recetas/nuevo"
          className="shrink-0 rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nueva
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        {recetas.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-400">
            Todavía no cargaste ninguna receta.
          </p>
        )}

        {recetas.map((receta) => {
          const { costoTotal } = calcularCostoReceta(
            receta.receta_insumos.map((ri) => ({
              cantidad: ri.cantidad,
              unidad: ri.unidad,
              insumo: ri.insumos,
            })),
          );

          return (
            <Link
              key={receta.id}
              href={`/recetas/${receta.id}`}
              className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-zinc-900">
                  {receta.nombre}
                </span>
                <span className="text-xs text-zinc-400">
                  {receta.receta_insumos.length} insumo
                  {receta.receta_insumos.length === 1 ? "" : "s"}
                </span>
              </div>
              <span className="text-sm text-zinc-500">
                {receta.categoria ?? "Sin categoría"} · porción base{" "}
                {receta.porcion_base}
              </span>
              <span className="text-sm font-medium text-bordo-600">
                {formatGuaranies(costoTotal)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
