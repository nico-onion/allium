import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEventos } from "@/lib/eventos/queries";
import {
  ESTADO_BADGE_CLASSES,
  ESTADO_LABELS,
  ESTADO_OPTIONS,
  TIPO_LABELS,
} from "@/lib/eventos/constants";
import { formatFecha, formatGuaranies } from "@/lib/format";
import type { EventoEstado } from "@/lib/supabase/database.types";

const ESTADO_VALUES = ESTADO_OPTIONS.map(([value]) => value);

function isEventoEstado(value: string): value is EventoEstado {
  return (ESTADO_VALUES as string[]).includes(value);
}

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado: estadoParam } = await searchParams;
  const estado =
    estadoParam && isEventoEstado(estadoParam) ? estadoParam : undefined;

  const supabase = await createClient();
  const eventos = await getEventos(supabase, estado);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Eventos
        </h1>
        <Link
          href="/eventos/nuevo"
          className="shrink-0 rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nuevo
        </Link>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
        <Link
          href="/eventos"
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            !estado
              ? "bg-bordo-600 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Todos
        </Link>
        {ESTADO_OPTIONS.map(([value, label]) => (
          <Link
            key={value}
            href={`/eventos?estado=${value}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              estado === value
                ? "bg-bordo-600 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        {eventos.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-400">
            No hay eventos{estado ? ` en estado "${ESTADO_LABELS[estado]}"` : ""}.
          </p>
        )}

        {eventos.map((evento) => (
          <Link
            key={evento.id}
            href={`/eventos/${evento.id}`}
            className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-zinc-900">
                {evento.clientes?.nombre ?? "Sin cliente"}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE_CLASSES[evento.estado]}`}
              >
                {ESTADO_LABELS[evento.estado]}
              </span>
            </div>
            <span className="text-sm text-zinc-500">
              {TIPO_LABELS[evento.tipo]} · {evento.invitados} invitados
            </span>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-zinc-500">{formatFecha(evento.fecha)}</span>
              <span className="font-medium text-bordo-600">
                {formatGuaranies(evento.precio_total)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
