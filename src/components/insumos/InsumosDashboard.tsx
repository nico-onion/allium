"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { InsumoCard, type InsumoParaCard } from "@/components/insumos/InsumoCard";
import {
  agruparPorCategoria,
  categoriaDe,
  estaBajoStockMinimo,
  ordenarPorAlerta,
  SIN_CATEGORIA_LABEL,
} from "@/lib/insumos/categorias";

type InsumoDashboard = InsumoParaCard & { categoria: string | null };

export function InsumosDashboard({
  insumos,
  categoriaInicial,
}: {
  insumos: InsumoDashboard[];
  categoriaInicial?: string;
}) {
  const [query, setQuery] = useState("");

  const buscando = query.trim().length > 0;

  const resultadosBusqueda = useMemo(() => {
    if (!buscando) return [];
    const texto = query.trim().toLowerCase();
    return ordenarPorAlerta(
      insumos.filter((i) => i.nombre.toLowerCase().includes(texto)),
    );
  }, [insumos, query, buscando]);

  const insumosEnAlerta = useMemo(
    () => ordenarPorAlerta(insumos.filter(estaBajoStockMinimo)),
    [insumos],
  );

  const grupos = useMemo(() => agruparPorCategoria(insumos), [insumos]);

  const categoriaActiva = !buscando ? categoriaInicial : undefined;
  const insumosDeCategoria = useMemo(() => {
    if (!categoriaActiva) return [];
    return ordenarPorAlerta(
      insumos.filter((i) => categoriaDe(i) === categoriaActiva),
    );
  }, [insumos, categoriaActiva]);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar insumo por nombre..."
        className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none"
      />

      {buscando ? (
        <div className="flex flex-col gap-3">
          {resultadosBusqueda.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-400">
              Sin resultados para &quot;{query.trim()}&quot;.
            </p>
          ) : (
            resultadosBusqueda.map((insumo) => (
              <InsumoCard key={insumo.id} insumo={insumo} />
            ))
          )}
        </div>
      ) : categoriaActiva ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-bordo-600">
              {categoriaActiva}
            </h2>
            <Link href="/insumos" className="text-sm text-zinc-500 underline-offset-2 hover:underline">
              ← Categorías
            </Link>
          </div>
          {insumosDeCategoria.length === 0 ? (
            <p className="mt-4 text-center text-sm text-zinc-400">
              No hay insumos en esta categoría.
            </p>
          ) : (
            insumosDeCategoria.map((insumo) => (
              <InsumoCard key={insumo.id} insumo={insumo} />
            ))
          )}
        </div>
      ) : (
        <>
          {insumos.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-400">
              Todavía no cargaste ningún insumo.
            </p>
          ) : (
            <>
              {insumosEnAlerta.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">
                    {insumosEnAlerta.length} insumo
                    {insumosEnAlerta.length === 1 ? "" : "s"} por debajo del
                    stock mínimo
                  </p>
                  <div className="flex flex-col gap-2">
                    {insumosEnAlerta.map((insumo) => (
                      <InsumoCard key={insumo.id} insumo={insumo} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-600">
                  Categorías
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {grupos.map((grupo) => (
                    <Link
                      key={grupo.categoria}
                      href={`/insumos?categoria=${encodeURIComponent(grupo.categoria)}`}
                      className={`flex items-center justify-between rounded-xl border p-4 active:bg-zinc-50 ${
                        grupo.categoria === SIN_CATEGORIA_LABEL
                          ? "border-dashed border-zinc-300 bg-zinc-50"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      <span className="font-medium text-zinc-900">
                        {grupo.categoria}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                        {grupo.cantidad}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
