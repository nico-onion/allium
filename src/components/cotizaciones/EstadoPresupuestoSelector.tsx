"use client";

import { useFormStatus } from "react-dom";
import { ESTADO_OPTIONS } from "@/lib/cotizaciones/constants";
import type { PresupuestoEstado } from "@/lib/supabase/database.types";

function EstadoSelect({ estadoActual }: { estadoActual: PresupuestoEstado }) {
  const { pending } = useFormStatus();
  return (
    <select
      name="estado"
      defaultValue={estadoActual}
      disabled={pending}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60"
    >
      {ESTADO_OPTIONS.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function EstadoPresupuestoSelector({
  estadoActual,
  action,
}: {
  estadoActual: PresupuestoEstado;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <EstadoSelect estadoActual={estadoActual} />
    </form>
  );
}
