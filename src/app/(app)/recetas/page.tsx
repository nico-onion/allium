import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecetasParaCosto } from "@/lib/recetas/queries";
import { armarMapaRecetas, calcularCostoCompleto } from "@/lib/recetas/costo";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatGuaranies } from "@/lib/format";

export default async function RecetasPage() {
  const supabase = await createClient();
  const recetas = await getRecetasParaCosto(supabase);
  const mapa = armarMapaRecetas(recetas);
  const memo = new Map();

  const platos = recetas.filter((receta) => !receta.es_subreceta);
  const subrecetas = recetas.filter((receta) => receta.es_subreceta);

  function tarjeta(receta: (typeof recetas)[number]) {
    const costo = calcularCostoCompleto(receta.id, mapa, memo);
    const lineas = receta.receta_insumos.length + receta.receta_subrecetas.length;
    const unidadRendimiento = receta.rendimiento_unidad
      ? UNIDAD_LABELS_CORTAS[receta.rendimiento_unidad]
      : null;

    return (
      <Link
        key={receta.id}
        href={`/recetas/${receta.id}`}
        className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-zinc-900">{receta.nombre}</span>
          {costo && costo.mermasPendientes.length > 0 ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Merma pendiente
            </span>
          ) : (
            <span className="shrink-0 text-xs text-zinc-400">
              {lineas} línea{lineas === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <span className="text-sm text-zinc-500">
          {receta.categoria ?? "Sin categoría"} · rinde {receta.porcion_base}
          {unidadRendimiento ? ` ${unidadRendimiento}` : " porc."}
        </span>
        {costo && (
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-bordo-600">
              {formatGuaranies(costo.costoPorPorcion)}
              <span className="font-normal text-zinc-400">
                {" "}
                / {unidadRendimiento ?? "porción"}
              </span>
            </span>
            {costo.foodCostPct !== null && (
              <span className="text-zinc-500">
                Food cost {(costo.foodCostPct * 100).toFixed(1)} %
              </span>
            )}
          </div>
        )}
      </Link>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">Recetas</h1>
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

        {platos.map(tarjeta)}

        {subrecetas.length > 0 && (
          <>
            <h2 className="mt-2 text-sm font-medium uppercase tracking-wide text-zinc-400">
              Sub-recetas
            </h2>
            {subrecetas.map(tarjeta)}
          </>
        )}
      </div>
    </div>
  );
}
