import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPresupuesto, getPresupuestoItems } from "@/lib/cotizaciones/queries";
import {
  ESTADOS_HABILITAN_EVENTO,
  ESTADO_BADGE_CLASSES,
  ESTADO_LABELS,
} from "@/lib/cotizaciones/constants";
import { calcularVencimiento } from "@/lib/cotizaciones/fecha";
import { tipoLabel } from "@/lib/eventos/constants";
import { formatFechaCorta, formatGuaranies } from "@/lib/format";
import { EstadoPresupuestoSelector } from "@/components/cotizaciones/EstadoPresupuestoSelector";
import { CrearEventoDesdePresupuestoForm } from "@/components/cotizaciones/CrearEventoDesdePresupuestoForm";
import {
  cambiarEstadoPresupuesto,
  crearEventoDesdePresupuesto,
} from "../actions";

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

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const presupuesto = await getPresupuesto(supabase, id);

  if (!presupuesto) notFound();

  const items = await getPresupuestoItems(supabase, id);
  const total = items.reduce(
    (acc, item) => acc + Number(item.cantidad) * Number(item.precio_unitario),
    0,
  );

  const vencimiento = calcularVencimiento(
    presupuesto.fecha_emision,
    presupuesto.validez_dias,
  );

  const puedeCrearEvento =
    !presupuesto.evento_id && ESTADOS_HABILITAN_EVENTO.includes(presupuesto.estado);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-bordo-600">
            Cotización N° {presupuesto.numero}
          </h1>
          <span className="text-sm text-zinc-500">
            {presupuesto.clientes?.nombre ?? "Sin cliente"}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE_CLASSES[presupuesto.estado]}`}
        >
          {ESTADO_LABELS[presupuesto.estado]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <Campo label="Tipo de evento" value={tipoLabel(presupuesto.tipo_evento)} />
        <Campo
          label="Fecha del evento"
          value={
            presupuesto.fecha_evento ? formatFechaCorta(presupuesto.fecha_evento) : "-"
          }
        />
        <Campo label="Horario" value={presupuesto.horario ?? "-"} />
        <Campo label="Cantidad de personas" value={presupuesto.cantidad_personas ?? "-"} />
        <Campo label="Lugar / Dirección" value={presupuesto.lugar_direccion ?? "-"} />
        <Campo label="Emisión" value={formatFechaCorta(presupuesto.fecha_emision)} />
        <Campo
          label="Validez"
          value={`${presupuesto.validez_dias} días (vence ${formatFechaCorta(vencimiento)})`}
        />
        <Campo label="Total" value={formatGuaranies(total)} />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
        <span className="text-sm font-medium text-zinc-600">Detalle de costos</span>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 text-sm last:border-0 last:pb-0"
            >
              <span className="text-zinc-900">
                {item.recetas?.nombre ?? "Receta"} × {item.cantidad}
              </span>
              <span className="text-zinc-500">
                {formatGuaranies(Number(item.cantidad) * Number(item.precio_unitario))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {presupuesto.incluye && (
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
          <span className="text-sm font-medium text-zinc-600">Incluye</span>
          <p className="whitespace-pre-line text-sm text-zinc-700">
            {presupuesto.incluye}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
        <span className="text-sm font-medium text-zinc-600">No incluye</span>
        <p className="whitespace-pre-line text-sm text-zinc-700">
          {presupuesto.no_incluye}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-400">Estado</span>
        <EstadoPresupuestoSelector
          estadoActual={presupuesto.estado}
          action={cambiarEstadoPresupuesto.bind(null, presupuesto.id)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <a
          href={`/cotizaciones/${presupuesto.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-lg border border-bordo-200 py-3 text-center text-base font-medium text-bordo-600"
        >
          Exportar PDF
        </a>
        <Link
          href={`/cotizaciones/${presupuesto.id}/editar`}
          className="w-full rounded-lg bg-fucsia-600 py-3 text-center text-base font-medium text-white"
        >
          Editar cotización
        </Link>
      </div>

      {presupuesto.evento_id ? (
        <Link
          href={`/eventos/${presupuesto.evento_id}`}
          className="w-full rounded-lg border border-emerald-200 py-3 text-center text-base font-medium text-emerald-700"
        >
          Ver evento →
        </Link>
      ) : (
        puedeCrearEvento && (
          <CrearEventoDesdePresupuestoForm
            action={crearEventoDesdePresupuesto.bind(null, presupuesto.id)}
          />
        )
      )}
    </div>
  );
}
