"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { OrdenCompraFormState } from "@/app/(app)/eventos/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 disabled:opacity-60"
    >
      {pending ? "Generando..." : label}
    </button>
  );
}

export function RegenerarOrdenCompraBoton({
  action,
  label = "Regenerar orden de compra",
}: {
  action: (
    prevState: OrdenCompraFormState,
    formData: FormData,
  ) => Promise<OrdenCompraFormState>;
  label?: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton label={label} />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
