"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { InsumosDinamicosFields } from "@/components/recetas/InsumosDinamicosFields";
import type { MenuFormState } from "@/app/(app)/eventos/menu-actions";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type RecetaOption = { id: string; nombre: string };
type InsumoOption = {
  id: string;
  nombre: string;
  unidad: InsumoUnidad;
  costo_unitario: number;
};

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

export function AgregarAlMenuForm({
  recetas,
  insumos,
  cantidadPorDefecto,
  agregarExistenteAction,
  crearNuevaAction,
}: {
  recetas: RecetaOption[];
  insumos: InsumoOption[];
  cantidadPorDefecto: number;
  agregarExistenteAction: (
    prevState: MenuFormState,
    formData: FormData,
  ) => Promise<MenuFormState>;
  crearNuevaAction: (
    prevState: MenuFormState,
    formData: FormData,
  ) => Promise<MenuFormState>;
}) {
  const [modo, setModo] = useState<"existente" | "nueva">(
    recetas.length > 0 ? "existente" : "nueva",
  );
  const [existenteState, existenteFormAction] = useActionState(
    agregarExistenteAction,
    {},
  );
  const [nuevaState, nuevaFormAction] = useActionState(crearNuevaAction, {});

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModo("existente")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            modo === "existente"
              ? "bg-bordo-600 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Receta existente
        </button>
        <button
          type="button"
          onClick={() => setModo("nueva")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            modo === "nueva"
              ? "bg-bordo-600 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Receta nueva
        </button>
      </div>

      {modo === "existente" ? (
        recetas.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No hay recetas cargadas todavía. Creá una nueva, o cargala en el
            catálogo de Recetas.
          </p>
        ) : (
          <form action={existenteFormAction} className="flex flex-col gap-3">
            <select
              name="receta_id"
              required
              defaultValue=""
              className={inputClasses}
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
            <input
              name="cantidad_porciones"
              type="number"
              min={1}
              defaultValue={cantidadPorDefecto}
              required
              placeholder="Porciones"
              className={inputClasses}
            />
            {existenteState.error && (
              <p className="text-sm text-red-600">{existenteState.error}</p>
            )}
            <SubmitButton label="Agregar al menú" />
          </form>
        )
      ) : (
        <form action={nuevaFormAction} className="flex flex-col gap-3">
          <input
            name="nombre"
            placeholder="Nombre de la receta"
            required
            className={inputClasses}
          />
          <input
            name="categoria"
            placeholder="Categoría (opcional)"
            className={inputClasses}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Porción base</label>
              <input
                name="porcion_base"
                type="number"
                min={1}
                step="1"
                defaultValue={1}
                required
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">
                Porciones para este evento
              </label>
              <input
                name="cantidad_porciones"
                type="number"
                min={1}
                defaultValue={cantidadPorDefecto}
                required
                className={inputClasses}
              />
            </div>
          </div>

          <InsumosDinamicosFields insumos={insumos} />

          {nuevaState.error && (
            <p className="text-sm text-red-600">{nuevaState.error}</p>
          )}
          <SubmitButton label="Crear y agregar al menú" />
        </form>
      )}
    </div>
  );
}
