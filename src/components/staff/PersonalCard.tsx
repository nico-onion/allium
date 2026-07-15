import Link from "next/link";
import { ROL_LABELS } from "@/lib/staff/constants";
import type { PersonalRol } from "@/lib/supabase/database.types";

export type PersonalParaLista = {
  id: string;
  nombre: string;
  rol: PersonalRol;
  telefono: string | null;
  cantidadEventos: number;
};

export function PersonalCard({ persona }: { persona: PersonalParaLista }) {
  return (
    <Link
      href={`/staff/${persona.id}`}
      className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-zinc-900">{persona.nombre}</span>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
          {ROL_LABELS[persona.rol]}
        </span>
      </div>
      {persona.telefono && (
        <span className="text-sm text-zinc-500">{persona.telefono}</span>
      )}
      <span className="text-xs text-zinc-400">
        {persona.cantidadEventos} evento
        {persona.cantidadEventos === 1 ? "" : "s"} asignado
        {persona.cantidadEventos === 1 ? "" : "s"}
      </span>
    </Link>
  );
}
