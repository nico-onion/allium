import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEventos } from "@/lib/eventos/queries";
import {
  ESTADO_BADGE_CLASSES,
  ESTADO_LABELS,
  ESTADO_OPTIONS_ARCHIVO,
  ESTADOS_ARCHIVO,
  isEventoEstado,
  tipoLabel,
} from "@/lib/eventos/constants";
import { formatFecha, formatGuaranies } from "@/lib/format";
import { FileIcon } from "@/components/icons/FileIcon";
import type { EventoEstado } from "@/lib/supabase/database.types";

export default async function ArchivoEventosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado: estadoParam } = await searchParams;
  const estado: EventoEstado | undefined =
    estadoParam &&
    isEventoEstado(estadoParam) &&
    ESTADOS_ARCHIVO.includes(estadoParam)
      ? estadoParam
      : undefined;

  const supabase = await createClient();
  const eventos = await getEventos(supabase, {
    estados: ESTADOS_ARCHIVO,
    estado,
    ascending: false,
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Archivo
        </h1>
        <p className="text-sm text-zinc-400">
          Eventos realizados, cancelados o postergados.
        </p>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
        <Link
          href="/eventos/archivo"
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            !estado
              ? "bg-bordo-600 text-white"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          Todos
        </Link>
        {ESTADO_OPTIONS_ARCHIVO.map(([value, label]) => (
          <Link
            key={value}
            href={`/eventos/archivo?estado=${value}`}
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
              <div className="flex shrink-0 items-center gap-2">
                <FileIcon
                  className={`h-4 w-4 ${
                    evento.link_cotizacion ? "text-fucsia-600" : "text-zinc-200"
                  }`}
                />
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE_CLASSES[evento.estado]}`}
                >
                  {ESTADO_LABELS[evento.estado]}
                </span>
              </div>
            </div>
            <span className="text-sm text-zinc-500">
              {tipoLabel(evento.tipo)} · {evento.invitados} invitados
            </span>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-zinc-500">{formatFecha(evento.fecha)}</span>
              <span className="text-right">
                <span className="block text-xs text-zinc-400">
                  {formatGuaranies(evento.precio_por_persona)} / persona
                </span>
                <span className="font-medium text-bordo-600">
                  {formatGuaranies(evento.precio_total)}
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
