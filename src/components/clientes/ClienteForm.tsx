"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ORIGEN_LABELS, TIPO_CLIENTE_LABELS } from "@/lib/clientes/constants";
import type { ClienteFormState } from "@/app/(app)/clientes/actions";
import type { ClienteOrigen, ClienteTipo } from "@/lib/supabase/database.types";

export type ClienteFormValues = {
  nombre: string;
  tipo: ClienteTipo;
  origen: ClienteOrigen | null;
  telefono: string | null;
  email: string | null;
  instagram: string | null;
  ruc_ci: string | null;
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

function Campo({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className={labelClasses}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className={inputClasses}
      />
    </div>
  );
}

export function ClienteForm({
  defaultValues,
  action,
  submitLabel,
}: {
  defaultValues?: ClienteFormValues;
  action: (prevState: ClienteFormState, formData: FormData) => Promise<ClienteFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="nombre" className={labelClasses}>
          Nombre o razón social
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={defaultValues?.nombre}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="tipo" className={labelClasses}>
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={defaultValues?.tipo ?? "persona"}
            className={inputClasses}
          >
            {Object.entries(TIPO_CLIENTE_LABELS).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="origen" className={labelClasses}>
            Cómo llegó
          </label>
          <select
            id="origen"
            name="origen"
            defaultValue={defaultValues?.origen ?? ""}
            className={inputClasses}
          >
            <option value="">Sin dato</option>
            {Object.entries(ORIGEN_LABELS).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo name="telefono" label="Teléfono" defaultValue={defaultValues?.telefono} />
        <Campo name="ruc_ci" label="RUC o CI" defaultValue={defaultValues?.ruc_ci} />
      </div>
      <Campo name="email" label="Email" type="email" defaultValue={defaultValues?.email} />
      <Campo
        name="instagram"
        label="Instagram"
        placeholder="@usuario"
        defaultValue={defaultValues?.instagram}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="notas" className={labelClasses}>
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          placeholder="Preferencias, cómo le gusta que lo contacten, quién decide..."
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
