"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad, formatGuaranies } from "@/lib/format";
import type { SalidaFormState } from "@/app/(app)/eventos/salida-actions";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type Insumo = {
  id: string;
  nombre: string;
  unidad: InsumoUnidad;
  stock_actual: number;
  costo_unitario: number;
};
type Precarga = { insumoId: string; cantidad: number };
type Fila = { key: number; insumoId: string; cantidad: string };

const inputClasses =
  "w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

function aNumero(texto: string) {
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? "Registrando..." : "Registrar salida"}
    </button>
  );
}

export function SalidaAlmacenForm({
  insumos,
  precargas,
  action,
}: {
  insumos: Insumo[];
  precargas: { comprado: Precarga[]; menu: Precarga[] };
  action: (prev: SalidaFormState, formData: FormData) => Promise<SalidaFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const [siguiente, setSiguiente] = useState(1);
  const [filas, setFilas] = useState<Fila[]>([{ key: 0, insumoId: "", cantidad: "" }]);
  const porId = new Map(insumos.map((insumo) => [insumo.id, insumo]));

  const total = filas.reduce((acc, fila) => {
    const insumo = porId.get(fila.insumoId);
    return acc + (insumo ? aNumero(fila.cantidad) * Number(insumo.costo_unitario) : 0);
  }, 0);

  function precargar(lista: Precarga[]) {
    setFilas(
      lista.map((p, i) => ({
        key: siguiente + i,
        insumoId: p.insumoId,
        cantidad: formatCantidad(p.cantidad).replace(".", ","),
      })),
    );
    setSiguiente((n) => n + lista.length);
  }

  function actualizar(key: number, cambios: Partial<Fila>) {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, ...cambios } : f)));
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {(precargas.comprado.length > 0 || precargas.menu.length > 0) && (
        <div className="flex flex-col gap-2 rounded-xl bg-zinc-50 p-3">
          <span className="text-xs text-zinc-500">
            Precargar y después ajustar (lo que sobró queda en el almacén):
          </span>
          <div className="flex flex-wrap gap-2">
            {precargas.comprado.length > 0 && (
              <button
                type="button"
                onClick={() => precargar(precargas.comprado)}
                className="rounded-lg border border-bordo-200 bg-white px-3 py-1.5 text-sm text-bordo-600"
              >
                Lo comprado para este evento ({precargas.comprado.length})
              </button>
            )}
            {precargas.menu.length > 0 && (
              <button
                type="button"
                onClick={() => precargar(precargas.menu)}
                className="rounded-lg border border-bordo-200 bg-white px-3 py-1.5 text-sm text-bordo-600"
              >
                Lista de compras del menú ({precargas.menu.length})
              </button>
            )}
          </div>
        </div>
      )}

      {filas.map((fila) => {
        const insumo = porId.get(fila.insumoId);
        const cantidad = aNumero(fila.cantidad);
        const falta = insumo && cantidad > Number(insumo.stock_actual);
        return (
          <div key={fila.key} className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-3">
            <div className="grid grid-cols-[1fr_6rem_auto] items-center gap-2">
              <select
                name="insumo_id"
                value={fila.insumoId}
                onChange={(e) => actualizar(fila.key, { insumoId: e.target.value })}
                className={inputClasses}
                aria-label="Insumo"
              >
                <option value="">Insumo…</option>
                {insumos.map((opcion) => (
                  <option key={opcion.id} value={opcion.id}>
                    {opcion.nombre}
                  </option>
                ))}
              </select>
              <input
                name="cantidad"
                inputMode="decimal"
                placeholder="Cant."
                value={fila.cantidad}
                onChange={(e) => actualizar(fila.key, { cantidad: e.target.value })}
                className={inputClasses}
                aria-label="Cantidad"
              />
              <button
                type="button"
                onClick={() => setFilas((prev) => prev.filter((f) => f.key !== fila.key))}
                className="px-1 text-zinc-400"
                aria-label="Quitar"
              >
                ✕
              </button>
            </div>
            {insumo && (
              <span className={`text-xs ${falta ? "text-amber-700" : "text-zinc-400"}`}>
                {UNIDAD_LABELS_CORTAS[insumo.unidad]} · en almacén{" "}
                {formatCantidad(Number(insumo.stock_actual))} · {formatGuaranies(Math.round(cantidad * Number(insumo.costo_unitario)))}
                {falta ? " · sale más de lo que figura en stock" : ""}
              </span>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => {
          setFilas((prev) => [...prev, { key: siguiente, insumoId: "", cantidad: "" }]);
          setSiguiente((n) => n + 1);
        }}
        className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-600"
      >
        + Agregar insumo
      </button>

      <p className="text-right text-sm text-zinc-600">
        Costo de la salida: <span className="font-medium text-bordo-600">{formatGuaranies(Math.round(total))}</span>
      </p>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Guardar />
    </form>
  );
}
