"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { UNIDAD_LABELS_CORTAS, UNIDAD_OPTIONS } from "@/lib/insumos/constants";
import {
  armarMapaRecetas,
  calcularCostoCompleto,
  type InsumoDeReceta,
  type RecetaParaCosto,
} from "@/lib/recetas/costo";
import { formatGuaranies } from "@/lib/format";
import type { RecetaFormState } from "@/app/(app)/recetas/actions";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type SubrecetaOption = {
  id: string;
  nombre: string;
  rendimiento_unidad: InsumoUnidad | null;
  porcion_base: number;
};
type FilaInicialInsumo = { insumo_id: string; cantidad: number; unidad: InsumoUnidad };
type FilaInicialSubreceta = {
  subreceta_id: string;
  cantidad: number;
  unidad: InsumoUnidad;
};
type Fila = { key: number; id: string; cantidad: string; unidad: InsumoUnidad | "" };

export type RecetaFormValues = {
  nombre: string;
  categoria: string | null;
  porcion_base: number;
  es_subreceta: boolean;
  rendimiento_unidad: InsumoUnidad | null;
  pct_varios: number;
  precio_venta: number | null;
};

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none";
const filaInputClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";
const labelClasses = "text-sm font-medium text-zinc-600";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

function aFilas(iniciales: { id: string; cantidad: number; unidad: InsumoUnidad }[]): Fila[] {
  return iniciales.map((valor, i) => ({
    key: i,
    id: valor.id,
    cantidad: String(valor.cantidad),
    unidad: valor.unidad,
  }));
}

function porcentaje(valor: number): string {
  return `${(valor * 100).toFixed(1)} %`;
}

// Filas dinámicas (insumos o sub-recetas). Los campos se repiten por fila con
// el mismo nombre para que el server action los reconstruya con getAll.
function FilasDinamicas({
  titulo,
  ayuda,
  filas,
  setFilas,
  opciones,
  nombreId,
  nombreCantidad,
  nombreUnidad,
  textoAgregar,
  placeholder,
}: {
  titulo: string;
  ayuda?: string;
  filas: Fila[];
  setFilas: (actualizar: (prev: Fila[]) => Fila[]) => void;
  opciones: { id: string; nombre: string }[];
  nombreId: string;
  nombreCantidad: string;
  nombreUnidad: string;
  textoAgregar: string;
  placeholder: string;
}) {
  const nextKeyRef = useRef(filas.length + 1000);

  function actualizar(key: number, cambios: Partial<Fila>) {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, ...cambios } : f)));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClasses}>{titulo}</span>
      {ayuda && <span className="-mt-1 text-xs text-zinc-400">{ayuda}</span>}
      {filas.map((fila) => (
        <div key={fila.key} className="flex items-center gap-2">
          <select
            name={nombreId}
            required
            value={fila.id}
            onChange={(e) => actualizar(fila.key, { id: e.target.value })}
            className={`${filaInputClasses} min-w-0 flex-[2]`}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {opciones.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </select>
          <input
            name={nombreCantidad}
            type="number"
            min={0}
            step="any"
            placeholder="Cant."
            required
            value={fila.cantidad}
            onChange={(e) => actualizar(fila.key, { cantidad: e.target.value })}
            className={`${filaInputClasses} w-20`}
          />
          <select
            name={nombreUnidad}
            required
            value={fila.unidad}
            onChange={(e) => actualizar(fila.key, { unidad: e.target.value as InsumoUnidad })}
            className={`${filaInputClasses} w-20`}
          >
            <option value="" disabled>
              Un.
            </option>
            {UNIDAD_OPTIONS.map(([value]) => (
              <option key={value} value={value}>
                {UNIDAD_LABELS_CORTAS[value]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFilas((prev) => prev.filter((f) => f.key !== fila.key))}
            className="px-1 text-zinc-400"
            aria-label="Quitar fila"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setFilas((prev) => [
            ...prev,
            { key: nextKeyRef.current++, id: "", cantidad: "", unidad: "" },
          ])
        }
        className="self-start text-sm text-fucsia-600"
      >
        {textoAgregar}
      </button>
    </div>
  );
}

export function RecetaForm({
  recetaId,
  insumos,
  subrecetas,
  recetasParaCosto,
  defaultValues,
  insumosIniciales,
  subrecetasIniciales,
  action,
  submitLabel,
}: {
  recetaId?: string;
  insumos: InsumoDeReceta[];
  subrecetas: SubrecetaOption[];
  recetasParaCosto: RecetaParaCosto[];
  defaultValues?: RecetaFormValues;
  insumosIniciales?: FilaInicialInsumo[];
  subrecetasIniciales?: FilaInicialSubreceta[];
  action: (prevState: RecetaFormState, formData: FormData) => Promise<RecetaFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [esSubreceta, setEsSubreceta] = useState(defaultValues?.es_subreceta ?? false);
  const [porcionBase, setPorcionBase] = useState(String(defaultValues?.porcion_base ?? 1));
  const [rendimientoUnidad, setRendimientoUnidad] = useState<InsumoUnidad | "">(
    defaultValues?.rendimiento_unidad ?? "",
  );
  const [pctVarios, setPctVarios] = useState(String(defaultValues?.pct_varios ?? 0));
  const [precioVenta, setPrecioVenta] = useState(
    defaultValues?.precio_venta !== null && defaultValues?.precio_venta !== undefined
      ? String(defaultValues.precio_venta)
      : "",
  );
  const [filasInsumos, setFilasInsumos] = useState<Fila[]>(() => {
    const iniciales = aFilas(
      (insumosIniciales ?? []).map((f) => ({ ...f, id: f.insumo_id })),
    );
    return iniciales.length > 0 ? iniciales : [{ key: 0, id: "", cantidad: "", unidad: "" }];
  });
  const [filasSubrecetas, setFilasSubrecetas] = useState<Fila[]>(() =>
    aFilas((subrecetasIniciales ?? []).map((f) => ({ ...f, id: f.subreceta_id }))),
  );

  // Vista previa del costo con el mismo cálculo que usa todo el sistema:
  // se arma la receta "en edición" y se resuelve junto con las demás.
  const insumosPorId = new Map(insumos.map((insumo) => [insumo.id, insumo]));
  const idPreview = recetaId ?? "__nueva__";
  const recetaEnEdicion: RecetaParaCosto = {
    id: idPreview,
    nombre: "Esta receta",
    porcion_base: Number(porcionBase) > 0 ? Number(porcionBase) : 1,
    rendimiento_unidad: esSubreceta && rendimientoUnidad ? rendimientoUnidad : null,
    pct_varios: Number(pctVarios) || 0,
    precio_venta: !esSubreceta && precioVenta ? Number(precioVenta) : null,
    receta_insumos: filasInsumos
      .filter((f) => f.id && Number(f.cantidad) > 0 && f.unidad)
      .map((f) => ({
        cantidad: Number(f.cantidad),
        unidad: f.unidad as InsumoUnidad,
        insumos: insumosPorId.get(f.id) ?? null,
      })),
    receta_subrecetas: filasSubrecetas
      .filter((f) => f.id && Number(f.cantidad) > 0 && f.unidad)
      .map((f) => ({
        subreceta_id: f.id,
        cantidad: Number(f.cantidad),
        unidad: f.unidad as InsumoUnidad,
      })),
  };
  const mapa = armarMapaRecetas([
    ...recetasParaCosto.filter((r) => r.id !== idPreview),
    recetaEnEdicion,
  ]);
  const costo = calcularCostoCompleto(idPreview, mapa);
  const subrecetasElegibles = subrecetas.filter((s) => s.id !== recetaId);

  return (
    <form action={formAction} className="flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="nombre" className={labelClasses}>
          Nombre de la receta
        </label>
        <input
          id="nombre"
          name="nombre"
          defaultValue={defaultValues?.nombre}
          required
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="categoria" className={labelClasses}>
          Categoría
        </label>
        <input
          id="categoria"
          name="categoria"
          placeholder="Opcional"
          defaultValue={defaultValues?.categoria ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClasses}>Tipo</span>
        <input type="hidden" name="es_subreceta" value={esSubreceta ? "true" : "false"} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEsSubreceta(false)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              !esSubreceta ? "bg-bordo-600 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            Plato
          </button>
          <button
            type="button"
            onClick={() => setEsSubreceta(true)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              esSubreceta ? "bg-bordo-600 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            Sub-receta
          </button>
        </div>
        {esSubreceta && (
          <span className="text-xs text-zinc-400">
            Una salsa, marinado o base que se usa dentro de otras recetas.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="porcion_base" className={labelClasses}>
          {esSubreceta ? "Cuánto rinde" : "Porciones que rinde"}
        </label>
        <div className="flex gap-2">
          <input
            id="porcion_base"
            name="porcion_base"
            type="number"
            min={0.001}
            step="any"
            value={porcionBase}
            onChange={(e) => setPorcionBase(e.target.value)}
            required
            className={`${inputClasses} min-w-0 flex-1`}
          />
          {esSubreceta && (
            <select
              name="rendimiento_unidad"
              required
              value={rendimientoUnidad}
              onChange={(e) => setRendimientoUnidad(e.target.value as InsumoUnidad)}
              className={`${inputClasses} w-28`}
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
          )}
        </div>
      </div>

      {insumos.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Todavía no hay insumos cargados: necesitás al menos uno para armar la receta.
        </p>
      ) : (
        <FilasDinamicas
          titulo="Insumos"
          ayuda="Cantidades en peso limpio, lo que va al plato. La merma se suma sola."
          filas={filasInsumos}
          setFilas={setFilasInsumos}
          opciones={insumos}
          nombreId="insumo_id"
          nombreCantidad="cantidad"
          nombreUnidad="unidad"
          textoAgregar="+ Agregar insumo"
          placeholder="Insumo"
        />
      )}

      {subrecetasElegibles.length > 0 && (
        <FilasDinamicas
          titulo="Sub-recetas"
          filas={filasSubrecetas}
          setFilas={setFilasSubrecetas}
          opciones={subrecetasElegibles}
          nombreId="subreceta_id"
          nombreCantidad="subreceta_cantidad"
          nombreUnidad="subreceta_unidad"
          textoAgregar="+ Agregar sub-receta"
          placeholder="Sub-receta"
        />
      )}

      <div className={`grid gap-3 ${esSubreceta ? "grid-cols-1" : "grid-cols-2"}`}>
        <div className="flex flex-col gap-2">
          <label htmlFor="pct_varios" className={labelClasses}>
            Varios (%)
          </label>
          <input
            id="pct_varios"
            name="pct_varios"
            type="number"
            min={0}
            max={100}
            step="any"
            value={pctVarios}
            onChange={(e) => setPctVarios(e.target.value)}
            className={inputClasses}
          />
        </div>
        {!esSubreceta && (
          <div className="flex flex-col gap-2">
            <label htmlFor="precio_venta" className={labelClasses}>
              Precio por porción
            </label>
            <input
              id="precio_venta"
              name="precio_venta"
              type="number"
              min={0}
              step="1"
              placeholder="Con IVA"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              className={inputClasses}
            />
          </div>
        )}
      </div>
      <span className="-mt-3 text-xs text-zinc-400">
        Varios cubre lo que se usa sin medir: aceite de plancha, sal de cocción, film.
      </span>

      {costo && (
        <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 px-3 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Insumos y sub-recetas</span>
            <span className="text-zinc-900">{formatGuaranies(costo.costoInsumos)}</span>
          </div>
          {costo.costoVarios > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Varios</span>
              <span className="text-zinc-900">{formatGuaranies(costo.costoVarios)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span className="text-zinc-600">Costo total</span>
            <span className="text-bordo-600">{formatGuaranies(costo.costoTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">
              {esSubreceta && rendimientoUnidad
                ? `Por ${UNIDAD_LABELS_CORTAS[rendimientoUnidad]}`
                : "Por porción"}
            </span>
            <span className="text-zinc-900">{formatGuaranies(costo.costoPorPorcion)}</span>
          </div>
          {costo.foodCostPct !== null && costo.margenPorPorcion !== null && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Food cost · margen</span>
              <span className="text-zinc-900">
                {porcentaje(costo.foodCostPct)} · {formatGuaranies(costo.margenPorPorcion)}
              </span>
            </div>
          )}
          {costo.mermasPendientes.length > 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Merma pendiente en {costo.mermasPendientes.join(", ")}: el costo real va a ser
              mayor.
            </p>
          )}
          {costo.lineasSinCalcular > 0 && (
            <p className="mt-1 text-xs text-amber-600">
              {costo.lineasSinCalcular} línea(s) con unidad incompatible quedaron fuera del
              costo.
            </p>
          )}
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
