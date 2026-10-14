import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCliente, resumirCliente } from "@/lib/clientes/queries";
import { ORIGEN_LABELS, TIPO_CLIENTE_LABELS } from "@/lib/clientes/constants";
import {
  ESTADO_BADGE_CLASSES as ESTADO_PRESUPUESTO_BADGE,
  ESTADO_LABELS as ESTADO_PRESUPUESTO_LABELS,
} from "@/lib/cotizaciones/constants";
import {
  ESTADO_BADGE_CLASSES as ESTADO_EVENTO_BADGE,
  ESTADO_LABELS as ESTADO_EVENTO_LABELS,
  tipoLabel,
} from "@/lib/eventos/constants";
import { formatFecha, formatFechaCorta, formatGuaranies } from "@/lib/format";

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-zinc-400">{label}</span>
      <span className="text-base text-zinc-900">{value}</span>
    </div>
  );
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const cliente = await getCliente(supabase, id);

  if (!cliente) notFound();

  const resumen = resumirCliente(cliente.presupuestos, cliente.eventos);
  const presupuestos = [...cliente.presupuestos].sort((a, b) => b.numero - a.numero);
  const eventos = [...cliente.eventos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const contacto = [cliente.telefono, cliente.email, cliente.instagram, cliente.ruc_ci].filter(
    Boolean,
  );

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-bordo-600">{cliente.nombre}</h1>
        <span className="text-sm text-zinc-500">
          {TIPO_CLIENTE_LABELS[cliente.tipo]}
          {cliente.origen && ` · llegó por ${ORIGEN_LABELS[cliente.origen]}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <Dato label="Vendido" value={formatGuaranies(resumen.totalVendido)} />
        <Dato label="Eventos" value={String(resumen.cantidadEventos)} />
        <Dato label="Cotizado" value={formatGuaranies(resumen.totalCotizado)} />
        <Dato
          label="Aceptación"
          value={
            resumen.tasaAceptacion === null
              ? `${resumen.cantidadAceptados} de ${resumen.cantidadPresupuestos}`
              : `${Math.round(resumen.tasaAceptacion * 100)} % (${resumen.cantidadAceptados} de ${resumen.cantidadPresupuestos})`
          }
        />
      </div>

      {(contacto.length > 0 || cliente.notas) && (
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          {cliente.telefono && <span>{cliente.telefono}</span>}
          {cliente.email && <span>{cliente.email}</span>}
          {cliente.instagram && <span>{cliente.instagram}</span>}
          {cliente.ruc_ci && <span>RUC/CI {cliente.ruc_ci}</span>}
          {cliente.notas && <p className="mt-1 whitespace-pre-line text-zinc-500">{cliente.notas}</p>}
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={`/clientes/${cliente.id}/editar`}
          className="flex-1 rounded-lg border border-bordo-200 py-3 text-center text-base font-medium text-bordo-600"
        >
          Editar
        </Link>
        <Link
          href={`/cotizaciones/nueva?cliente=${cliente.id}`}
          className="flex-1 rounded-lg bg-fucsia-600 py-3 text-center text-base font-medium text-white"
        >
          Nueva cotización
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">Presupuestos</span>
        {presupuestos.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no tiene presupuestos.</p>
        ) : (
          presupuestos.map((presupuesto) => {
            const total = presupuesto.presupuesto_items.reduce(
              (acc, item) => acc + Number(item.cantidad) * Number(item.precio_unitario),
              0,
            );
            return (
              <Link
                key={presupuesto.id}
                href={`/cotizaciones/${presupuesto.id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-3 active:bg-zinc-50"
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-900">
                    N° {presupuesto.numero} · {tipoLabel(presupuesto.tipo_evento)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {presupuesto.fecha_evento
                      ? formatFechaCorta(presupuesto.fecha_evento)
                      : "Sin fecha"}{" "}
                    · {formatGuaranies(total)}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_PRESUPUESTO_BADGE[presupuesto.estado]}`}
                >
                  {ESTADO_PRESUPUESTO_LABELS[presupuesto.estado]}
                </span>
              </Link>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">Eventos</span>
        {eventos.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no tiene eventos.</p>
        ) : (
          eventos.map((evento) => (
            <Link
              key={evento.id}
              href={`/eventos/${evento.id}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-3 active:bg-zinc-50"
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium text-zinc-900">{evento.nombre}</span>
                <span className="text-xs text-zinc-500">
                  {formatFecha(evento.fecha)} · {evento.invitados} invitados ·{" "}
                  {formatGuaranies(evento.precio_total)}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_EVENTO_BADGE[evento.estado]}`}
              >
                {ESTADO_EVENTO_LABELS[evento.estado]}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
