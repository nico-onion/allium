"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { InsumosDinamicosFields } from "@/components/recetas/InsumosDinamicosFields";
import type { RecetaFormState } from "@/app/(app)/recetas/actions";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type InsumoOption = {
  id: string;
  nombre: string;
  unidad: InsumoUnidad;
  costo_unitario: number;
};
type FilaInicial = { insumo_id: string; cantidad: number; unidad: InsumoUnidad };

export type RecetaFormValues = {
  nombre: string;
  categoria: string | null;
  porcion_base: number;
};

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none";
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

export function RecetaForm({
  insumos,
  defaultValues,
  insumosIniciales,
  action,
  submitLabel,
}: {
  insumos: InsumoOption[];
  defaultValues?: RecetaFormValues;
  insumosIniciales?: FilaInicial[];
  action: (
    prevState: RecetaFormState,
    formData: FormData,
  ) => Promise<RecetaFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});

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
        <label htmlFor="porcion_base" className={labelClasses}>
          Porción base
        </label>
        <input
          id="porcion_base"
          name="porcion_base"
          type="number"
          min={1}
          step="1"
          defaultValue={defaultValues?.porcion_base ?? 1}
          required
          className={inputClasses}
        />
      </div>

      <InsumosDinamicosFields
        insumos={insumos}
        valoresIniciales={insumosIniciales}
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
