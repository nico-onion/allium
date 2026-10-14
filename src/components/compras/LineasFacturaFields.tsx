"use client";

import { useState } from "react";
import { UNIDAD_LABELS_CORTAS, UNIDAD_OPTIONS } from "@/lib/insumos/constants";
import { formatGuaranies } from "@/lib/format";
import { TASAS_IVA, TASA_IVA_LABELS, liquidacionIva } from "@/lib/compras/iva";

type Fila = { key: number; descripcion: string; cantidad: string; unidad: string; subtotal: string; iva: string };

const inputClasses =
  "w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";
const etiqueta = "text-xs text-zinc-500";

function vacia(key: number): Fila {
  return { key, descripcion: "", cantidad: "1", unidad: "unidad", subtotal: "", iva: "10" };
}

function aNumero(texto: string): number {
  const limpio = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto.replace(/\.(?=\d{3}(\D|$))/g, "");
  const n = Number(limpio);
  return Number.isFinite(n) ? n : 0;
}

// Renglones de la factura tal cual figuran: no hace falta saber todavía a qué
// insumo corresponde cada uno, eso se decide en la revisión.
export function LineasFacturaFields() {
  const [filas, setFilas] = useState<Fila[]>([vacia(0)]);
  const [siguiente, setSiguiente] = useState(1);
  const suma = filas.reduce((acc, fila) => acc + aNumero(fila.subtotal), 0);
  const iva = liquidacionIva(
    filas.map((fila) => ({ subtotal: aNumero(fila.subtotal), tasa_iva: Number(fila.iva) })),
  );

  function actualizar(key: number, cambios: Partial<Fila>) {
    setFilas((prev) => prev.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-sm font-medium text-zinc-600">Renglones de la factura</span>
        <p className="text-xs text-zinc-400">
          Copialos como figuran en la factura. En el paso siguiente indicás qué es cada uno.
        </p>
      </div>

      {filas.map((fila, i) => (
        <div key={fila.key} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{i + 1}</span>
            <input
              name="linea_descripcion"
              required
              placeholder="Ej. LECHUGA MORADA X UN"
              value={fila.descripcion}
              onChange={(e) => actualizar(fila.key, { descripcion: e.target.value })}
              className={inputClasses}
            />
            {filas.length > 1 && (
              <button
                type="button"
                onClick={() => setFilas((prev) => prev.filter((f) => f.key !== fila.key))}
                className="px-1 text-zinc-400"
                aria-label="Quitar renglón"
              >
                ✕
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={etiqueta}>Cantidad</span>
              <input
                name="linea_cantidad"
                inputMode="decimal"
                required
                value={fila.cantidad}
                onChange={(e) => actualizar(fila.key, { cantidad: e.target.value })}
                className={inputClasses}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={etiqueta}>Unidad</span>
              <select
                name="linea_unidad"
                value={fila.unidad}
                onChange={(e) => actualizar(fila.key, { unidad: e.target.value })}
                className={inputClasses}
              >
                {UNIDAD_OPTIONS.map(([valor]) => (
                  <option key={valor} value={valor}>
                    {UNIDAD_LABELS_CORTAS[valor]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={etiqueta}>IVA</span>
              <select
                name="linea_iva"
                value={fila.iva}
                onChange={(e) => actualizar(fila.key, { iva: e.target.value })}
                className={inputClasses}
              >
                {TASAS_IVA.map((tasa) => (
                  <option key={tasa} value={tasa}>
                    {TASA_IVA_LABELS[tasa]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={etiqueta}>Subtotal</span>
              <input
                name="linea_subtotal"
                inputMode="numeric"
                required
                placeholder="Gs."
                value={fila.subtotal}
                onChange={(e) => actualizar(fila.key, { subtotal: e.target.value })}
                className={inputClasses}
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          setFilas((prev) => [...prev, vacia(siguiente)]);
          setSiguiente((n) => n + 1);
        }}
        className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-600"
      >
        + Agregar renglón
      </button>

      <div className="flex flex-col items-end gap-0.5 text-sm text-zinc-600">
        <span>
          Suma de renglones: <span className="font-medium text-bordo-600">{formatGuaranies(suma)}</span>
        </span>
        <span className="text-xs text-zinc-400">
          IVA 5 %: {formatGuaranies(iva.iva5)} · IVA 10 %: {formatGuaranies(iva.iva10)} · Exentas:{" "}
          {formatGuaranies(iva.exentas)}
        </span>
      </div>
    </div>
  );
}
