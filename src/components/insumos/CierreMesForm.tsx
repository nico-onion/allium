"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CierreMesFormState } from "@/app/(app)/insumos/cierre/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-fucsia-600 px-4 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? "Cerrando..." : "Cerrar mes"}
    </button>
  );
}

export function CierreMesForm({
  action,
  mesSugerido,
}: {
  action: (prevState: CierreMesFormState, formData: FormData) => Promise<CierreMesFormState>;
  mesSugerido: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Cerrar el mes congela el costo contable de todos los insumos. No se puede deshacer. ¿Seguir?")) {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <div className="flex gap-2">
        <input
          type="month"
          name="mes"
          defaultValue={mesSugerido}
          required
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none"
        />
        <SubmitButton />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}
    </form>
  );
}
