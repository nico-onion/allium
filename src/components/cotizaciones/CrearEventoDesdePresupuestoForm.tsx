"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-bordo-600 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? "Creando evento..." : "Crear evento a partir de esta cotización"}
    </button>
  );
}

export function CrearEventoDesdePresupuestoForm({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const confirmado = window.confirm(
          "¿Crear el evento a partir de esta cotización? Se va a crear el evento y su menú con las recetas cotizadas.",
        );
        if (!confirmado) e.preventDefault();
      }}
    >
      <SubmitButton />
    </form>
  );
}
