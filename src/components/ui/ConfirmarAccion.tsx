"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

// Botón con confirmación dentro de la página, en dos toques. Reemplaza a
// window.confirm, que algunos navegadores del celular bloquean en silencio
// (y entonces el botón parece no hacer nada).
function Confirmar({ label, pendiente, className }: { label: string; pendiente: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? pendiente : label}
    </button>
  );
}

export function ConfirmarAccion({
  action,
  label,
  pregunta,
  confirmar,
  pendiente = "Procesando...",
  className,
  claseConfirmar,
}: {
  action: () => Promise<void>;
  label: string;
  pregunta: string;
  confirmar: string;
  pendiente?: string;
  className: string;
  claseConfirmar: string;
}) {
  const [preguntando, setPreguntando] = useState(false);

  if (!preguntando) {
    return (
      <button type="button" onClick={() => setPreguntando(true)} className={className}>
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-sm text-zinc-700">{pregunta}</p>
      <Confirmar label={confirmar} pendiente={pendiente} className={claseConfirmar} />
      <button type="button" onClick={() => setPreguntando(false)} className="py-1 text-sm text-zinc-500">
        Cancelar
      </button>
    </form>
  );
}
