"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { EnviarOrdenFormState } from "@/app/(app)/eventos/email-actions";

const DESTINATARIO_POR_DEFECTO = "compras@onion.com.py";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Enviar"}
    </button>
  );
}

export function EnviarOrdenPorEmailForm({
  action,
}: {
  action: (
    prevState: EnviarOrdenFormState,
    formData: FormData,
  ) => Promise<EnviarOrdenFormState>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction] = useActionState(action, {});

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600"
      >
        Enviar por email
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <label htmlFor="destinatario" className="text-sm font-medium text-zinc-600">
        Enviar a
      </label>
      <input
        id="destinatario"
        name="destinatario"
        type="email"
        required
        defaultValue={DESTINATARIO_POR_DEFECTO}
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none"
      />
      <div className="flex gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg px-4 py-2 text-sm text-zinc-500"
        >
          Cancelar
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.enviado && (
        <p className="text-sm text-emerald-600">Enviado correctamente.</p>
      )}
    </form>
  );
}
