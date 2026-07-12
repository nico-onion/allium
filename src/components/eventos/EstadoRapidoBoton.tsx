"use client";

import { useFormStatus } from "react-dom";

export function EstadoRapidoBoton({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full rounded-lg border py-2 text-sm font-medium disabled:opacity-50 ${className}`}
    >
      {pending ? "..." : label}
    </button>
  );
}
