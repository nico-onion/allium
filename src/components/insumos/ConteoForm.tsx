"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad } from "@/lib/format";
import type { ConteoFormState } from "@/app/(app)/insumos/stock-actions";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type Insumo = { id: string; nombre: string; unidad: InsumoUnidad; stock_actual: number; categoria: string };

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="sticky bottom-4 w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white shadow disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Guardar conteo"}
    </button>
  );
}

export function ConteoForm({
  insumos,
  action,
}: {
  insumos: Insumo[];
  action: (prev: ConteoFormState, formData: FormData) => Promise<ConteoFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const [filtro, setFiltro] = useState("");
  const categorias = [...new Set(insumos.map((i) => i.categoria))];
  const texto = filtro.trim().toLowerCase();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        type="search"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Buscar insumo..."
        className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none"
      />
      {categorias.map((categoria) => {
        const deCategoria = insumos.filter((i) => i.categoria === categoria);
        return (
          <div key={categoria} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-zinc-600">{categoria}</h2>
            <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white">
              {deCategoria.map((insumo) => (
                <li
                  key={insumo.id}
                  className={`grid grid-cols-[1fr_6rem] items-center gap-2 border-b border-zinc-100 px-4 py-2 last:border-0 ${
                    texto && !insumo.nombre.toLowerCase().includes(texto) ? "hidden" : ""
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="text-sm text-zinc-900">{insumo.nombre}</span>
                    <span className="text-xs text-zinc-400">
                      Sistema: {formatCantidad(insumo.stock_actual)} {UNIDAD_LABELS_CORTAS[insumo.unidad]}
                    </span>
                  </span>
                  <input
                    name={`contado_${insumo.id}`}
                    inputMode="decimal"
                    placeholder="Contado"
                    aria-label={`Contado de ${insumo.nombre}`}
                    className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Guardar />
    </form>
  );
}
