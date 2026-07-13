"use client";

import { useRef, useState } from "react";
import { UNIDAD_LABELS_CORTAS, UNIDAD_OPTIONS } from "@/lib/insumos/constants";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type InsumoOption = {
  id: string;
  nombre: string;
  unidad: InsumoUnidad;
  costo_unitario: number;
};

type FilaEstado = {
  key: number;
  insumo_id: string;
  cantidad: string;
  unidad: InsumoUnidad | "";
  costo_unitario: string;
};

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

const FILA_VACIA: Omit<FilaEstado, "key"> = {
  insumo_id: "",
  cantidad: "",
  unidad: "",
  costo_unitario: "",
};

export function ItemsCompraFields({ insumos }: { insumos: InsumoOption[] }) {
  const nextKeyRef = useRef(1);
  const [filas, setFilas] = useState<FilaEstado[]>([{ key: 0, ...FILA_VACIA }]);

  function actualizarFila(key: number, cambios: Partial<FilaEstado>) {
    setFilas((prev) =>
      prev.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila)),
    );
  }

  function alElegirInsumo(key: number, insumoId: string) {
    const insumo = insumos.find((i) => i.id === insumoId);
    actualizarFila(key, {
      insumo_id: insumoId,
      unidad: insumo?.unidad ?? "",
      costo_unitario: insumo ? String(insumo.costo_unitario) : "",
    });
  }

  function agregarFila() {
    setFilas((prev) => [...prev, { key: nextKeyRef.current++, ...FILA_VACIA }]);
  }

  function quitarFila(key: number) {
    setFilas((prev) => prev.filter((f) => f.key !== key));
  }

  if (insumos.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Todavía no hay insumos cargados — creá alguno primero en /insumos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-zinc-600">Insumos</span>
      {filas.map((fila) => (
        <div
          key={fila.key}
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3"
        >
          <div className="flex items-center gap-2">
            <select
              name="insumo_id"
              required
              value={fila.insumo_id}
              onChange={(e) => alElegirInsumo(fila.key, e.target.value)}
              className={`${inputClasses} flex-1`}
            >
              <option value="" disabled>
                Seleccioná un insumo
              </option>
              {insumos.map((insumo) => (
                <option key={insumo.id} value={insumo.id}>
                  {insumo.nombre}
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
          <div className="grid grid-cols-3 gap-2">
            <input
              name="cantidad"
              type="number"
              min={0}
              step="any"
              placeholder="Cantidad"
              required
              value={fila.cantidad}
              onChange={(e) => actualizarFila(fila.key, { cantidad: e.target.value })}
              className={inputClasses}
            />
            <select
              name="unidad"
              required
              value={fila.unidad}
              onChange={(e) =>
                actualizarFila(fila.key, { unidad: e.target.value as InsumoUnidad })
              }
              className={inputClasses}
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
            <input
              name="costo_unitario"
              type="number"
              min={0}
              step="1"
              placeholder="Costo unit."
              required
              value={fila.costo_unitario}
              onChange={(e) =>
                actualizarFila(fila.key, { costo_unitario: e.target.value })
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
        + Agregar insumo
      </button>
    </div>
  );
}
