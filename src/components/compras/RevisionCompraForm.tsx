"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { UNIDAD_LABELS_CORTAS, UNIDAD_OPTIONS } from "@/lib/insumos/constants";
import { GASTO_CATEGORIA_LABELS, GASTO_CATEGORIAS } from "@/lib/compras/constants";
import { mismaDimension } from "@/lib/recetas/costo";
import { formatCantidad, formatGuaranies } from "@/lib/format";
import type { RevisionCompraState } from "@/app/(app)/compras/revision-actions";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type Linea = {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: InsumoUnidad;
  subtotal: number;
  destino: "insumo" | "gasto" | null;
  insumo_id: string | null;
  factor: number | null;
  categoria_gasto: string | null;
};
type InsumoOption = { id: string; nombre: string; unidad: InsumoUnidad };
type EventoOption = { id: string; nombre: string; codigo: string | null };
type Modo = "existente" | "nuevo" | "gasto";

const inputClasses =
  "w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? "Confirmando..." : "Confirmar compra"}
    </button>
  );
}

// "LECHUGA MORADA X UN" → "Lechuga morada"
function nombreSugerido(descripcion: string): string {
  const limpio = descripcion
    .replace(/\s+x\s*(kg|un|unid|gr?|lt?)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function FilaLinea({
  linea,
  insumos,
}: {
  linea: Linea;
  insumos: InsumoOption[];
}) {
  const [modo, setModo] = useState<Modo>(linea.destino === "gasto" ? "gasto" : "existente");
  const [insumoId, setInsumoId] = useState(linea.insumo_id ?? "");
  const [unidadNueva, setUnidadNueva] = useState<InsumoUnidad>(linea.unidad);
  const insumo = insumos.find((opcion) => opcion.id === insumoId);
  const unidadDestino = modo === "nuevo" ? unidadNueva : insumo?.unidad;
  const necesitaFactor =
    modo !== "gasto" && unidadDestino !== undefined && !mismaDimension(linea.unidad, unidadDestino);
  const reconocida = linea.destino !== null;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 ${
        reconocida ? "border-zinc-200 bg-white" : "border-amber-200 bg-amber-50"
      }`}
    >
      <input type="hidden" name={`modo_${linea.id}`} value={modo} />
      <div className="flex items-start justify-between gap-2">
        <span className="flex flex-col">
          <span className="text-sm font-medium text-zinc-900">{linea.descripcion}</span>
          <span className="text-xs text-zinc-500">
            {formatCantidad(linea.cantidad)} {UNIDAD_LABELS_CORTAS[linea.unidad]} ·{" "}
            {formatGuaranies(linea.subtotal)}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            reconocida ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
          }`}
        >
          {reconocida ? "Reconocido" : "Nuevo"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {(
          [
            ["existente", "Insumo existente"],
            ["nuevo", "Insumo nuevo"],
            ["gasto", "Gasto del evento"],
          ] as [Modo, string][]
        ).map(([valor, label]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setModo(valor)}
            className={`rounded-lg px-1 py-1.5 text-xs font-medium ${
              modo === valor ? "bg-bordo-600 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {modo === "existente" && (
        <select
          name={`insumo_${linea.id}`}
          required
          value={insumoId}
          onChange={(e) => setInsumoId(e.target.value)}
          className={inputClasses}
        >
          <option value="" disabled>
            ¿Qué insumo es?
          </option>
          {insumos.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>
              {opcion.nombre} ({UNIDAD_LABELS_CORTAS[opcion.unidad]})
            </option>
          ))}
        </select>
      )}

      {modo === "nuevo" && (
        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <input
            name={`nuevo_nombre_${linea.id}`}
            required
            defaultValue={nombreSugerido(linea.descripcion)}
            aria-label="Nombre del insumo nuevo"
            className={inputClasses}
          />
          <select
            name={`nuevo_unidad_${linea.id}`}
            value={unidadNueva}
            onChange={(e) => setUnidadNueva(e.target.value as InsumoUnidad)}
            aria-label="Unidad del insumo nuevo"
            className={inputClasses}
          >
            {UNIDAD_OPTIONS.map(([valor]) => (
              <option key={valor} value={valor}>
                {UNIDAD_LABELS_CORTAS[valor]}
              </option>
            ))}
          </select>
          <input
            name={`nuevo_categoria_${linea.id}`}
            placeholder="Categoría (ej. Carnes)"
            aria-label="Categoría del insumo nuevo"
            className={`${inputClasses} col-span-2`}
          />
        </div>
      )}

      {modo === "gasto" && (
        <select
          name={`gasto_${linea.id}`}
          defaultValue={linea.categoria_gasto ?? "otro"}
          className={inputClasses}
        >
          {GASTO_CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {GASTO_CATEGORIA_LABELS[categoria]}
            </option>
          ))}
        </select>
      )}

      {necesitaFactor && unidadDestino && (
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          Cada {UNIDAD_LABELS_CORTAS[linea.unidad]} trae
          <input
            name={`factor_${linea.id}`}
            type="number"
            min={0}
            step="any"
            required
            defaultValue={linea.factor ?? ""}
            className={`${inputClasses} w-24`}
          />
          {UNIDAD_LABELS_CORTAS[unidadDestino]}
        </label>
      )}

      <label className="flex items-center gap-2 text-xs text-zinc-500">
        <input type="checkbox" name={`recordar_${linea.id}`} defaultChecked={!reconocida} />
        Recordar para este proveedor
      </label>
    </div>
  );
}

export function RevisionCompraForm({
  lineas,
  insumos,
  eventos,
  eventoIdInicial,
  action,
}: {
  lineas: Linea[];
  insumos: InsumoOption[];
  eventos: EventoOption[];
  eventoIdInicial: string | null;
  action: (prevState: RevisionCompraState, formData: FormData) => Promise<RevisionCompraState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const pendientes = lineas.filter((linea) => !linea.destino).length;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="evento_id" className="text-sm font-medium text-zinc-600">
          Evento
        </label>
        <select
          id="evento_id"
          name="evento_id"
          defaultValue={eventoIdInicial ?? ""}
          className={inputClasses}
        >
          <option value="">Sin evento (compra general)</option>
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.codigo ? `${evento.codigo} · ` : ""}
              {evento.nombre}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-zinc-500">
        {pendientes > 0
          ? `${pendientes} ítem(s) nuevos: indicá qué es cada uno. La próxima vez que este proveedor los facture, se reconocen solos.`
          : "Todos los ítems están reconocidos. Revisalos y confirmá."}
      </p>

      {lineas.map((linea) => (
        <FilaLinea key={linea.id} linea={linea} insumos={insumos} />
      ))}

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
