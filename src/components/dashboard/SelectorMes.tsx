"use client";

import { useRouter } from "next/navigation";
import type { OpcionMes } from "@/lib/dashboard/mes";

export function SelectorMes({
  opciones,
  seleccionado,
}: {
  opciones: OpcionMes[];
  seleccionado: string;
}) {
  const router = useRouter();

  return (
    <select
      value={seleccionado}
      onChange={(e) => router.push(`/?mes=${e.target.value}`)}
      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center font-display text-xl font-semibold text-bordo-600 focus:border-fucsia-400 focus:outline-none"
      aria-label="Mes y año"
    >
      {opciones.map((opcion) => (
        <option key={opcion.value} value={opcion.value}>
          {opcion.label}
        </option>
      ))}
    </select>
  );
}
