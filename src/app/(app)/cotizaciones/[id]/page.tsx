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
import { formatFecha, formatFechaCorta, formatGuaranies } from "@/lib/format";
import { calcularTotales, CATEGORIA_LABELS, margenPct } from "@/lib/cotizaciones/margen";
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
  const totales = calcularTotales(
    items.map((item) => ({
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precio_unitario),
      costoUnitario: item.costo_unitario === null ? null : Number(item.costo_unitario),
    })),
    Number(presupuesto.pct_imprevistos),
    presupuesto.cantidad_personas,
  );
  const total = totales.precioTotal;
  const margenObjetivo =
    presupuesto.margen_objetivo_pct === null ? null : Number(presupuesto.margen_objetivo_pct);

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
          {presupuesto.clientes ? (
            <Link href={`/clientes/${presupuesto.clientes.id}`} className="text-sm text-fucsia-600">
              {presupuesto.clientes.nombre}
            </Link>
          ) : (
            <span className="text-sm text-zinc-500">Sin cliente</span>
          )}
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
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-600">Detalle de costos</span>
          {presupuesto.costo_congelado_en && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              Costo congelado {formatFecha(presupuesto.costo_congelado_en)}
            </span>
          )}
        </div>
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const cantidad = Number(item.cantidad);
            const precio = Number(item.precio_unitario);
            const costo = item.costo_unitario === null ? null : Number(item.costo_unitario);
            const margenLinea = costo !== null ? margenPct(precio, costo) : null;
            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2 text-sm last:border-0 last:pb-0"
              >
                <span className="flex flex-col">
                  <span className="text-zinc-900">
                    {item.recetas?.nombre ?? item.descripcion ?? "Ítem"} × {cantidad}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {item.receta_id ? "Receta" : CATEGORIA_LABELS[item.categoria]} · costo{" "}
                    {costo === null ? "sin cargar" : formatGuaranies(costo * cantidad)}
                  </span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="text-zinc-700">{formatGuaranies(cantidad * precio)}</span>
                  {margenLinea !== null && (
                    <span
                      className={`text-xs ${
                        margenObjetivo !== null && margenLinea < margenObjetivo
                          ? "text-amber-700"
                          : "text-emerald-700"
                      }`}
                    >
                      margen {margenLinea.toFixed(1)} %
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <Campo label="Total a cobrar" value={formatGuaranies(totales.precioTotal)} />
        <Campo label="Sin IVA" value={formatGuaranies(totales.precioSinIva)} />
        <Campo
          label={
            Number(presupuesto.pct_imprevistos) > 0
              ? `Costo (+${Number(presupuesto.pct_imprevistos)} % imprev.)`
              : "Costo"
          }
          value={formatGuaranies(totales.costoTotal)}
        />
        <Campo
          label={margenObjetivo !== null ? `Margen (objetivo ${margenObjetivo} %)` : "Margen"}
          value={
            <span
              className={
                margenObjetivo !== null &&
                totales.margenPct !== null &&
                totales.margenPct < margenObjetivo
                  ? "text-amber-700"
                  : "text-emerald-700"
              }
            >
              {formatGuaranies(totales.margenBruto)}
              {totales.margenPct !== null && ` · ${totales.margenPct.toFixed(1)} %`}
            </span>
          }
        />
        {totales.costoPorInvitado !== null && (
          <Campo
            label="Por invitado"
            value={`${formatGuaranies(totales.precioPorInvitado)} (costo ${formatGuaranies(totales.costoPorInvitado)})`}
          />
        )}
        {totales.lineasSinCosto > 0 && (
          <p className="col-span-2 text-xs text-amber-600">
            {totales.lineasSinCosto} línea(s) sin costo cargado: el margen real va a ser menor.
            Editá y guardá el presupuesto para costearlas.
          </p>
        )}
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
