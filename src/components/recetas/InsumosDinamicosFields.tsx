"use client";

import { useRef, useState } from "react";
import { UNIDAD_LABELS_CORTAS, UNIDAD_OPTIONS } from "@/lib/insumos/constants";
import { calcularCostoReceta, type InsumoParaCosto } from "@/lib/recetas/costo";
import { formatGuaranies } from "@/lib/format";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type InsumoOption = {
  id: string;
  nombre: string;
  unidad: InsumoUnidad;
  costo_unitario: number;
};
type FilaInicial = { insumo_id: string; cantidad: number; unidad: InsumoUnidad };
type FilaEstado = {
  key: number;
  insumo_id: string;
  cantidad: string;
  unidad: InsumoUnidad | "";
};

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

function filasIniciales(valoresIniciales?: FilaInicial[]): FilaEstado[] {
  if (!valoresIniciales || valoresIniciales.length === 0) {
    return [{ key: 0, insumo_id: "", cantidad: "", unidad: "" }];
  }
  return valoresIniciales.map((valor, i) => ({
    key: i,
    insumo_id: valor.insumo_id,
    cantidad: String(valor.cantidad),
    unidad: valor.unidad,
  }));
}

// Filas dinámicas para elegir insumo + cantidad + unidad. Se renderiza dentro
// de un <form> del componente padre: usa los mismos nombres de campo
// (insumo_id, cantidad, unidad) repetidos por fila, para que el server action
// los reconstruya con FormData.getAll. Además calcula en vivo el costo
// estimado de la receta a partir del costo_unitario de cada insumo elegido.
export function InsumosDinamicosFields({
  insumos,
  valoresIniciales,
}: {
  insumos: InsumoOption[];
  valoresIniciales?: FilaInicial[];
}) {
  const nextKeyRef = useRef(valoresIniciales?.length ?? 1);
  const [filas, setFilas] = useState<FilaEstado[]>(
    filasIniciales(valoresIniciales),
  );

  function agregarFila() {
    setFilas((prev) => [
      ...prev,
      { key: nextKeyRef.current++, insumo_id: "", cantidad: "", unidad: "" },
    ]);
  }

  function quitarFila(key: number) {
    setFilas((prev) => prev.filter((f) => f.key !== key));
  }

  function actualizarFila(key: number, cambios: Partial<FilaEstado>) {
    setFilas((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...cambios } : f)),
    );
  }

  if (insumos.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Todavía no hay insumos cargados en el sistema — necesitás al menos
        uno para poder definir los ingredientes de la receta.
      </p>
    );
  }

  const insumosPorId = new Map(insumos.map((insumo) => [insumo.id, insumo]));

  const insumosParaCosto: InsumoParaCosto[] = filas
    .filter((f) => f.insumo_id && f.cantidad && f.unidad)
    .map((f) => {
      const insumo = insumosPorId.get(f.insumo_id);
      return {
        cantidad: Number(f.cantidad),
        unidad: f.unidad as InsumoUnidad,
        insumo: insumo
          ? { costo_unitario: insumo.costo_unitario, unidad: insumo.unidad }
          : null,
      };
    });

  const { costoTotal, insumosNoConvertibles } =
    calcularCostoReceta(insumosParaCosto);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-600">Insumos</span>
      {filas.map((fila) => (
        <div key={fila.key} className="flex items-center gap-2">
          <select
            name="insumo_id"
            required
            value={fila.insumo_id}
            onChange={(e) =>
              actualizarFila(fila.key, { insumo_id: e.target.value })
            }
            className={`${inputClasses} flex-[2]`}
          >
            <option value="" disabled>
              Insumo
            </option>
            {insumos.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre}
              </option>
            ))}
          </select>
          <input
            name="cantidad"
            type="number"
            min={0}
            step="0.01"
            placeholder="Cant."
            required
            value={fila.cantidad}
            onChange={(e) =>
              actualizarFila(fila.key, { cantidad: e.target.value })
            }
            className={`${inputClasses} w-20`}
          />
          <select
            name="unidad"
            required
            value={fila.unidad}
            onChange={(e) =>
              actualizarFila(fila.key, {
                unidad: e.target.value as InsumoUnidad,
              })
            }
            className={`${inputClasses} w-24`}
          >
            <option value="" disabled>
              Unidad
            </option>
            {UNIDAD_OPTIONS.map(([value]) => (
              <option key={value} value={value}>
                {UNIDAD_LABELS_CORTAS[value]}
              </option>
            ))}
          </select>
          {filas.length > 1 && (
            <button
              type="button"
              onClick={() => quitarFila(fila.key)}
              className="px-1 text-zinc-400"
              aria-label="Quitar insumo"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={agregarFila}
        className="self-start text-sm text-fucsia-600"
      >
        + Agregar insumo
      </button>

      <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm">
        <span className="text-zinc-500">Costo estimado: </span>
        <span className="font-medium text-bordo-600">
          {formatGuaranies(costoTotal)}
        </span>
        {insumosNoConvertibles > 0 && (
          <p className="mt-1 text-xs text-amber-600">
            {insumosNoConvertibles} insumo(s) con unidad incompatible con la
            del insumo — no se incluyeron en el cálculo.
          </p>
        )}
      </div>
    </div>
  );
}
