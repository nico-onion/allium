import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getResumenMes,
  getProximoEvento,
  getMetricasFinancierasMes,
} from "@/lib/dashboard/queries";
import {
  esMismoMes,
  formatMesParam,
  generarOpcionesMes,
  parseMesParam,
} from "@/lib/dashboard/mes";
import { SelectorMes } from "@/components/dashboard/SelectorMes";
import { getInsumos } from "@/lib/insumos/queries";
import { estaBajoStockMinimo } from "@/lib/insumos/categorias";
import { formatFecha, formatGuaranies } from "@/lib/format";

const RANGO_MESES = 12;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const supabase = await createClient();

  const ahora = new Date();
  const mesActual = { year: ahora.getFullYear(), month: ahora.getMonth() };
  const mesSeleccionado = parseMesParam(mesParam, ahora);

  const inicioMes = new Date(mesSeleccionado.year, mesSeleccionado.month, 1);
  const finMes = new Date(mesSeleccionado.year, mesSeleccionado.month + 1, 1);

  const [resumenMes, metricasFinancieras, proximoEvento, insumos] = await Promise.all([
    getResumenMes(supabase, inicioMes.toISOString(), finMes.toISOString()),
    getMetricasFinancierasMes(supabase, inicioMes.toISOString(), finMes.toISOString()),
    getProximoEvento(supabase, ahora.toISOString()),
    getInsumos(supabase),
  ]);

  const insumosEnAlerta = insumos.filter(estaBajoStockMinimo).length;
  const opcionesMes = generarOpcionesMes(mesActual, RANGO_MESES);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-1">
          <SelectorMes
            opciones={opcionesMes}
            seleccionado={formatMesParam(mesSeleccionado)}
          />
          {!esMismoMes(mesSeleccionado, mesActual) && (
            <Link
              href="/"
              className="text-xs text-fucsia-600 underline-offset-2 hover:underline"
            >
              Volver a hoy
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <span className="block text-3xl font-semibold text-bordo-600">
              {resumenMes.confirmados}
            </span>
            <span className="text-sm text-zinc-500">Confirmados</span>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <span className="block text-3xl font-semibold text-bordo-600">
              {resumenMes.cotizados}
            </span>
            <span className="text-sm text-zinc-500">Cotizados</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <span className="block text-2xl font-semibold text-bordo-600">
              {formatGuaranies(metricasFinancieras.ventasDelMes)}
            </span>
            <span className="text-sm text-zinc-500">Ventas del mes</span>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <span className="block text-2xl font-semibold text-bordo-600">
              {metricasFinancieras.margenPromedio !== null
                ? `${Math.round(metricasFinancieras.margenPromedio * 100)}%`
                : "Sin datos"}
            </span>
            <span className="text-sm text-zinc-500">Margen promedio</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <Link
            href="/eventos/archivo?estado=realizado"
            className="flex flex-col items-center gap-0.5 rounded-lg py-1 active:bg-zinc-100"
          >
            <span className="text-lg font-semibold text-emerald-700">
              {resumenMes.realizados}
            </span>
            <span className="text-xs text-zinc-500">Realizados</span>
          </Link>
          <Link
            href="/eventos/archivo?estado=cancelado"
            className="flex flex-col items-center gap-0.5 rounded-lg py-1 active:bg-zinc-100"
          >
            <span className="text-lg font-semibold text-red-700">
              {resumenMes.cancelados}
            </span>
            <span className="text-xs text-zinc-500">Cancelados</span>
          </Link>
          <Link
            href="/eventos/archivo?estado=postergado"
            className="flex flex-col items-center gap-0.5 rounded-lg py-1 active:bg-zinc-100"
          >
            <span className="text-lg font-semibold text-sky-700">
              {resumenMes.postergados}
            </span>
            <span className="text-xs text-zinc-500">Postergados</span>
          </Link>
        </div>

        {proximoEvento ? (
          <Link
            href={`/eventos/${proximoEvento.id}`}
            className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
          >
            <span className="text-xs uppercase tracking-wide text-zinc-400">
              Próximo evento
            </span>
            <span className="font-medium text-zinc-900">
              {proximoEvento.nombre}
            </span>
            <span className="text-sm text-zinc-500">
              {formatFecha(proximoEvento.fecha)}
              {proximoEvento.clienteNombre
                ? ` · ${proximoEvento.clienteNombre}`
                : ""}
            </span>
          </Link>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <span className="text-xs uppercase tracking-wide text-zinc-400">
              Próximo evento
            </span>
            <p className="text-sm text-zinc-400">No hay eventos próximos.</p>
          </div>
        )}

        <Link
          href="/insumos"
          className={`flex items-center justify-between rounded-xl border p-4 active:bg-zinc-50 ${
            insumosEnAlerta > 0
              ? "border-red-200 bg-red-50"
              : "border-zinc-200 bg-white"
          }`}
        >
          <span
            className={`text-sm ${insumosEnAlerta > 0 ? "text-red-700" : "text-zinc-500"}`}
          >
            Insumos por debajo del stock mínimo
          </span>
          <span
            className={`text-2xl font-semibold ${
              insumosEnAlerta > 0 ? "text-red-700" : "text-zinc-400"
            }`}
          >
            {insumosEnAlerta}
          </span>
        </Link>
      </div>
    </div>
  );
}
