import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvento } from "@/lib/eventos/queries";
import {
  ESTADO_ACCION_RAPIDA_CLASSES,
  ESTADO_ACCION_RAPIDA_LABELS,
  ESTADO_BADGE_CLASSES,
  ESTADO_LABELS,
  TIPO_LABELS,
} from "@/lib/eventos/constants";
import { formatFecha, formatGuaranies } from "@/lib/format";
import { EstadoRapidoBoton } from "@/components/eventos/EstadoRapidoBoton";
import { EliminarEventoForm } from "@/components/eventos/EliminarEventoForm";
import { cambiarEstadoEvento, eliminarEvento } from "../actions";
import type { EventoEstado } from "@/lib/supabase/database.types";

const ACCIONES_RAPIDAS = Object.keys(
  ESTADO_ACCION_RAPIDA_LABELS,
) as EventoEstado[];

function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span className="text-base text-zinc-900">{value}</span>
    </div>
  );
}

export default async function EventoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const evento = await getEvento(supabase, id);

  if (!evento) notFound();

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-bordo-600">
            {evento.nombre}
          </h1>
          <span className="text-sm text-zinc-500">
            {evento.clientes?.nombre ?? "Sin cliente"}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE_CLASSES[evento.estado]}`}
        >
          {ESTADO_LABELS[evento.estado]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <Campo label="Tipo" value={TIPO_LABELS[evento.tipo]} />
        <Campo label="Fecha" value={formatFecha(evento.fecha)} />
        <Campo label="Invitados" value={evento.invitados} />
        <Campo label="Ubicación" value={evento.ubicacion ?? "-"} />
        <Campo
          label="Precio por persona"
          value={formatGuaranies(evento.precio_por_persona)}
        />
        <Campo label="Precio total" value={formatGuaranies(evento.precio_total)} />
        <Campo
          label="Margen objetivo"
          value={
            evento.margen_objetivo !== null ? `${evento.margen_objetivo}%` : "-"
          }
        />
        <Campo
          label="Cotización"
          value={
            evento.link_cotizacion ? (
              <a
                href={evento.link_cotizacion}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fucsia-600 underline-offset-2 hover:underline"
              >
                Ver cotización
              </a>
            ) : (
              "-"
            )
          }
        />
      </div>

      <Link
        href={`/eventos/${evento.id}/editar`}
        className="w-full rounded-lg bg-fucsia-600 py-3 text-center text-base font-medium text-white"
      >
        Editar evento
      </Link>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-400">
          Cambiar estado
        </span>
        <div className="flex gap-2">
          {ACCIONES_RAPIDAS.filter((estado) => estado !== evento.estado).map(
            (estado) => (
              <form
                key={estado}
                action={cambiarEstadoEvento.bind(null, evento.id, estado)}
                className="flex-1"
              >
                <EstadoRapidoBoton
                  label={ESTADO_ACCION_RAPIDA_LABELS[estado]!}
                  className={ESTADO_ACCION_RAPIDA_CLASSES[estado]!}
                />
              </form>
            ),
          )}
        </div>
      </div>

      <EliminarEventoForm action={eliminarEvento.bind(null, evento.id)} />
    </div>
  );
}
