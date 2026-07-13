"use client";

import { useRef, useState } from "react";
import { formatGuaranies } from "@/lib/format";

type RecetaOption = { id: string; nombre: string };

type FilaEstado = {
  key: number;
  receta_id: string;
  cantidad: string;
  precio_unitario: string;
};

type FilaInicial = {
  receta_id: string;
  cantidad: number;
  precio_unitario: number;
};

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

const FILA_VACIA: Omit<FilaEstado, "key"> = {
  receta_id: "",
  cantidad: "",
  precio_unitario: "",
};

export function ItemsPresupuestoFields({
  recetas,
  defaultItems,
}: {
  recetas: RecetaOption[];
  defaultItems?: FilaInicial[];
}) {
  const filasIniciales: FilaEstado[] =
    defaultItems && defaultItems.length > 0
      ? defaultItems.map((item, i) => ({
          key: i,
          receta_id: item.receta_id,
          cantidad: String(item.cantidad),
          precio_unitario: String(item.precio_unitario),
        }))
      : [{ key: 0, ...FILA_VACIA }];

  const nextKeyRef = useRef(filasIniciales.length);
  const [filas, setFilas] = useState<FilaEstado[]>(filasIniciales);

  function actualizarFila(key: number, cambios: Partial<FilaEstado>) {
    setFilas((prev) =>
      prev.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila)),
    );
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { key: nextKeyRef.current++, ...FILA_VACIA }]);
  }

  function quitarFila(key: number) {
    setFilas((prev) => prev.filter((f) => f.key !== key));
  }

  const total = filas.reduce(
    (acc, fila) => acc + (Number(fila.cantidad) || 0) * (Number(fila.precio_unitario) || 0),
    0,
  );

  if (recetas.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Todavía no hay recetas cargadas — creá alguna primero en /recetas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-zinc-600">Detalle de costos</span>
      {filas.map((fila) => (
        <div
          key={fila.key}
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3"
        >
          <div className="flex items-center gap-2">
            <select
              name="receta_id"
              required
              value={fila.receta_id}
              onChange={(e) => actualizarFila(fila.key, { receta_id: e.target.value })}
              className={`${inputClasses} flex-1`}
            >
              <option value="" disabled>
                Seleccioná una receta
              </option>
              {recetas.map((receta) => (
                <option key={receta.id} value={receta.id}>
                  {receta.nombre}
                </option>
              ))}
            </select>
            {filas.length > 1 && (
              <button
                type="button"
                onClick={() => quitarFila(fila.key)}
                className="px-1 text-zinc-400"
                aria-label="Quitar receta"
              >
                ✕
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="item_cantidad"
              type="number"
              min={0}
              step="1"
              placeholder="Cantidad"
              required
              value={fila.cantidad}
              onChange={(e) => actualizarFila(fila.key, { cantidad: e.target.value })}
              className={inputClasses}
            />
            <input
              name="precio_unitario"
              type="number"
              min={0}
              step="1"
              placeholder="Precio unit. (Gs.)"
              required
              value={fila.precio_unitario}
              onChange={(e) =>
                actualizarFila(fila.key, { precio_unitario: e.target.value })
              }
              className={inputClasses}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={agregarFila}
        className="self-start text-sm text-fucsia-600"
      >
        + Agregar receta
      </button>

      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
        <span className="text-sm font-medium text-zinc-600">Total</span>
        <span className="font-display text-lg font-semibold text-bordo-600">
          {formatGuaranies(total)}
        </span>
      </div>
    </div>
  );
}
