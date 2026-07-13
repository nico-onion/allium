"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ProveedorFormState } from "@/app/(app)/proveedores/actions";

export type ProveedorFormValues = {
  nombre: string;
  contacto: string | null;
  notas: string | null;
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

export function ProveedorForm({
  defaultValues,
  action,
  submitLabel,
}: {
  defaultValues?: ProveedorFormValues;
  action: (
    prevState: ProveedorFormState,
    formData: FormData,
  ) => Promise<ProveedorFormState>;
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
        <label htmlFor="contacto" className={labelClasses}>
          Contacto
        </label>
        <input
          id="contacto"
          name="contacto"
          placeholder="Teléfono, email, etc. (opcional)"
          defaultValue={defaultValues?.contacto ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notas" className={labelClasses}>
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          placeholder="Opcional"
          defaultValue={defaultValues?.notas ?? ""}
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
