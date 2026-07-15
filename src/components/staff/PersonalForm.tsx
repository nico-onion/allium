"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ROL_OPTIONS } from "@/lib/staff/constants";
import type { PersonalFormState } from "@/app/(app)/staff/actions";
import type { PersonalRol } from "@/lib/supabase/database.types";

export type PersonalFormValues = {
  nombre: string;
  rol: PersonalRol;
  telefono: string | null;
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

export function PersonalForm({
  defaultValues,
  action,
  submitLabel,
}: {
  defaultValues?: PersonalFormValues;
  action: (
    prevState: PersonalFormState,
    formData: FormData,
  ) => Promise<PersonalFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="nombre" className={labelClasses}>
          Nombre
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
        <label htmlFor="rol" className={labelClasses}>
          Rol
        </label>
        <select
          id="rol"
          name="rol"
          defaultValue={defaultValues?.rol ?? ""}
          required
          className={inputClasses}
        >
          <option value="" disabled>
            Seleccioná un rol
          </option>
          {ROL_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="telefono" className={labelClasses}>
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          placeholder="Opcional"
          defaultValue={defaultValues?.telefono ?? ""}
          className={inputClasses}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
