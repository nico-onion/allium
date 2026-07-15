"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { ROL_LABELS } from "@/lib/staff/constants";
import type { TurnoFormState } from "@/app/(app)/eventos/turnos-actions";
import type { PersonalRol } from "@/lib/supabase/database.types";

type PersonalOption = { id: string; nombre: string; rol: PersonalRol };

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-fucsia-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

export function AsignarStaffForm({
  personal,
  action,
}: {
  personal: PersonalOption[];
  action: (
    prevState: TurnoFormState,
    formData: FormData,
  ) => Promise<TurnoFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const forzarRef = useRef<HTMLInputElement>(null);

  if (personal.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Todavía no hay nadie cargado en /staff.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3">
      <select name="personal_id" required defaultValue="" className={inputClasses}>
        <option value="" disabled>
          Seleccioná una persona
        </option>
        {personal.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.nombre} · {ROL_LABELS[persona.rol]}
          </option>
        ))}
      </select>
      <input
        name="rol_en_evento"
        placeholder="Rol en el evento (ej: mozo principal)"
        required
        className={inputClasses}
      />
      <input
        name="costo"
        type="number"
        min={0}
        step="1"
        placeholder="Costo (Gs., opcional)"
        className={inputClasses}
      />
      <input type="hidden" name="forzar" ref={forzarRef} defaultValue="" />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {state.warning ? (
        <div className="flex flex-col gap-2 rounded-lg bg-amber-50 p-2">
          <p className="text-sm text-amber-800">{state.warning}</p>
          <button
            type="submit"
            onClick={() => {
              if (forzarRef.current) forzarRef.current.value = "true";
            }}
            className="w-full rounded-lg border border-amber-300 py-2 text-sm font-medium text-amber-800"
          >
            Confirmar igual
          </button>
        </div>
      ) : (
        <SubmitButton label="Asignar" />
      )}
    </form>
  );
}
