"use client";

import { useRef } from "react";
import { formatGuaranies } from "@/lib/format";
import {
  CATEGORIA_LABELS,
  CATEGORIAS_SIN_RECETA,
  margenPct,
  precioSugerido,
} from "@/lib/cotizaciones/margen";
import type { PresupuestoItemCategoria } from "@/lib/supabase/database.types";

export type RecetaParaPresupuesto = {
  id: string;
  nombre: string;
  // costo por porción de hoy (null si no se pudo calcular)
  costoPorPorcion: number | null;
  mermaPendiente: boolean;
};

export type PersonalParaPresupuesto = {
  id: string;
  nombre: string;
  costo_referencia: number | null;
};

export type FilaPresupuesto = {
  key: number;
  tipo: "receta" | "otro";
  receta_id: string;
  descripcion: string;
  categoria: PresupuestoItemCategoria;
  personal_id: string;
  cantidad: string;
  precio_unitario: string;
  // solo líneas sin receta: costo cargado a mano
  costo: string;
};

const inputClasses =
  "w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";
const etiqueta = "text-xs text-zinc-500";

export function filaVacia(key: number, tipo: "receta" | "otro"): FilaPresupuesto {
  return {
    key,
    tipo,
    receta_id: "",
    descripcion: "",
    categoria: tipo === "receta" ? "comida" : "personal",
    personal_id: "",
    cantidad: "",
    precio_unitario: "",
    costo: "",
  };
}

// Costo por unidad de una fila: receta → costo congelado (si el presupuesto
// ya fue aceptado) o el de hoy; resto → lo cargado a mano.
export function costoDeFila(
  fila: FilaPresupuesto,
  recetasPorId: Map<string, RecetaParaPresupuesto>,
  congelados: Map<string, number>,
): number | null {
  if (fila.tipo === "receta") {
    if (!fila.receta_id) return null;
    return congelados.get(fila.receta_id) ?? recetasPorId.get(fila.receta_id)?.costoPorPorcion ?? null;
  }
  return fila.costo === "" ? null : Number(fila.costo);
}

export function ItemsPresupuestoFields({
  recetas,
  personal,
  filas,
  setFilas,
  margenObjetivo,
  pctImprevistos,
  congelados,
}: {
  recetas: RecetaParaPresupuesto[];
  personal: PersonalParaPresupuesto[];
  filas: FilaPresupuesto[];
  setFilas: (actualizar: (prev: FilaPresupuesto[]) => FilaPresupuesto[]) => void;
  margenObjetivo: number;
  pctImprevistos: number;
  congelados: Map<string, number>;
}) {
  const nextKeyRef = useRef(filas.reduce((max, f) => Math.max(max, f.key), 0) + 1);
  const recetasPorId = new Map(recetas.map((receta) => [receta.id, receta]));
  const personalPorId = new Map(personal.map((persona) => [persona.id, persona]));

  function actualizar(key: number, cambios: Partial<FilaPresupuesto>) {
    setFilas((prev) => prev.map((f) => (f.key === key ? { ...f, ...cambios } : f)));
  }

  function agregar(tipo: "receta" | "otro") {
    setFilas((prev) => [...prev, filaVacia(nextKeyRef.current++, tipo)]);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-zinc-600">Detalle de costos</span>

      {filas.map((fila) => {
        const costo = costoDeFila(fila, recetasPorId, congelados);
        // El precio sugerido incluye el colchón de imprevistos.
        const sugerido =
          costo !== null ? precioSugerido(costo * (1 + pctImprevistos / 100), margenObjetivo) : null;
        const precio = Number(fila.precio_unitario) || 0;
        const margen = costo !== null && precio > 0 ? margenPct(precio, costo) : null;
        const cantidad = Number(fila.cantidad) || 0;
        const receta = fila.receta_id ? recetasPorId.get(fila.receta_id) : undefined;
        const esCongelado = fila.tipo === "receta" && congelados.has(fila.receta_id);

        return (
          <div
            key={fila.key}
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3"
          >
            {/* Todas las filas mandan todos los campos, en el mismo orden. */}
            <input type="hidden" name="item_tipo" value={fila.tipo} />

            <div className="flex items-start gap-2">
              {fila.tipo === "receta" ? (
                <>
                  <select
                    name="receta_id"
                    required
                    value={fila.receta_id}
                    onChange={(e) => actualizar(fila.key, { receta_id: e.target.value })}
                    className={`${inputClasses} flex-1`}
                  >
                    <option value="" disabled>
                      Seleccioná una receta
                    </option>
                    {recetas.map((opcion) => (
                      <option key={opcion.id} value={opcion.id}>
                        {opcion.nombre}
                      </option>
                    ))}
                  </select>
                  <input type="hidden" name="item_descripcion" value="" />
                  <input type="hidden" name="item_categoria" value="comida" />
                  <input type="hidden" name="item_personal_id" value="" />
                </>
              ) : (
                <div className="flex flex-1 flex-col gap-2">
                  <input type="hidden" name="receta_id" value="" />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      name="item_categoria"
                      value={fila.categoria}
                      onChange={(e) =>
                        actualizar(fila.key, {
                          categoria: e.target.value as PresupuestoItemCategoria,
                          personal_id: "",
                        })
                      }
                      className={inputClasses}
                    >
                      {CATEGORIAS_SIN_RECETA.map((categoria) => (
                        <option key={categoria} value={categoria}>
                          {CATEGORIA_LABELS[categoria]}
                        </option>
                      ))}
                    </select>
                    {fila.categoria === "personal" && personal.length > 0 ? (
                      <select
                        name="item_personal_id"
                        value={fila.personal_id}
                        onChange={(e) => {
                          const persona = personalPorId.get(e.target.value);
                          actualizar(fila.key, {
                            personal_id: e.target.value,
                            descripcion: persona ? persona.nombre : fila.descripcion,
                            costo:
                              persona?.costo_referencia !== null &&
                              persona?.costo_referencia !== undefined
                                ? String(Number(persona.costo_referencia))
                                : fila.costo,
                          });
                        }}
                        className={inputClasses}
                      >
                        <option value="">Persona (opcional)</option>
                        {personal.map((persona) => (
                          <option key={persona.id} value={persona.id}>
                            {persona.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input type="hidden" name="item_personal_id" value="" />
                    )}
                  </div>
                  <input
                    name="item_descripcion"
                    required
                    placeholder={
                      fila.categoria === "personal" ? "Ej. Mozo, parrillero" : "Descripción"
                    }
                    value={fila.descripcion}
                    onChange={(e) => actualizar(fila.key, { descripcion: e.target.value })}
                    className={inputClasses}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setFilas((prev) => prev.filter((f) => f.key !== fila.key))}
                className="px-1 pt-2 text-zinc-400"
                aria-label="Quitar línea"
              >
                ✕
              </button>
            </div>

            <div className={`grid gap-2 ${fila.tipo === "otro" ? "grid-cols-3" : "grid-cols-2"}`}>
              <label className="flex flex-col gap-1">
                <span className={etiqueta}>Cantidad</span>
                <input
                  name="item_cantidad"
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={fila.cantidad}
                  onChange={(e) => actualizar(fila.key, { cantidad: e.target.value })}
                  className={inputClasses}
                />
              </label>
              {fila.tipo === "otro" ? (
                <label className="flex flex-col gap-1">
                  <span className={etiqueta}>Costo unit.</span>
                  <input
                    name="item_costo"
                    type="number"
                    min={0}
                    step="1"
                    value={fila.costo}
                    onChange={(e) => actualizar(fila.key, { costo: e.target.value })}
                    className={inputClasses}
                  />
                </label>
              ) : (
                <input type="hidden" name="item_costo" value="" />
              )}
              <label className="flex flex-col gap-1">
                <span className={etiqueta}>Precio unit. (con IVA)</span>
                <input
                  name="precio_unitario"
                  type="number"
                  min={0}
                  step="1"
                  required
                  value={fila.precio_unitario}
                  onChange={(e) => actualizar(fila.key, { precio_unitario: e.target.value })}
                  className={inputClasses}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
              <span className="text-zinc-500">
                {costo !== null ? (
                  <>
                    Costo {formatGuaranies(costo)}
                    {esCongelado && " (congelado)"}
                    {cantidad > 0 && ` · subtotal ${formatGuaranies(costo * cantidad)}`}
                  </>
                ) : fila.tipo === "receta" && fila.receta_id ? (
                  <span className="text-amber-600">Sin costo calculable</span>
                ) : (
                  "Sin costo"
                )}
              </span>
              {margen !== null && (
                <span
                  className={
                    margen < margenObjetivo ? "font-medium text-amber-700" : "text-emerald-700"
                  }
                >
                  Margen {margen.toFixed(1)} %
                </span>
              )}
            </div>
            {sugerido !== null && sugerido !== precio && (
              <button
                type="button"
                onClick={() => actualizar(fila.key, { precio_unitario: String(sugerido) })}
                className="self-start text-xs font-medium text-fucsia-600"
              >
                Usar precio sugerido {formatGuaranies(sugerido)} ({margenObjetivo} % de margen)
              </button>
            )}
            {receta?.mermaPendiente && (
              <span className="text-xs text-amber-600">
                Tiene insumos con merma pendiente: el costo real puede ser mayor.
              </span>
            )}
          </div>
        );
      })}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => agregar("receta")}
          className="text-sm text-fucsia-600"
        >
          + Receta
        </button>
        <button type="button" onClick={() => agregar("otro")} className="text-sm text-fucsia-600">
          + Personal, alquiler u otro
        </button>
      </div>
    </div>
  );
}
