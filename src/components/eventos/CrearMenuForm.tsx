"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { MenuFormState } from "@/app/(app)/eventos/menu-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Creando..." : "Crear menú"}
    </button>
  );
}

export function CrearMenuForm({
  action,
}: {
  action: (
    prevState: MenuFormState,
    formData: FormData,
  ) => Promise<MenuFormState>;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="nombre"
        placeholder="Nombre del menú (opcional)"
        className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
