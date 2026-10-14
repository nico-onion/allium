import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  DIAS_AVISO_VENCIMIENTO,
  getLotesDisponibles,
  type EstadoLote,
  type LoteDisponible,
} from "@/lib/stock/vencimientos";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad, formatFechaCorta, formatGuaranies } from "@/lib/format";
import { ConfirmarAccion } from "@/components/ui/ConfirmarAccion";
import { darDeBajaLote, ponerFechaLote } from "../stock-actions";

const SECCIONES: { estado: EstadoLote; titulo: string; clase: string }[] = [
  { estado: "vencido", titulo: "Vencidos", clase: "border-red-200 bg-red-50" },
  {
    estado: "por_vencer",
    titulo: `Vencen en ${DIAS_AVISO_VENCIMIENTO} días o menos`,
    clase: "border-amber-200 bg-amber-50",
  },
  { estado: "sin_fecha", titulo: "Sin fecha de vencimiento", clase: "border-zinc-200 bg-zinc-50" },
  { estado: "ok", titulo: "En fecha", clase: "border-zinc-200 bg-white" },
];

function LoteFila({ lote }: { lote: LoteDisponible }) {
  return (
    <li className="flex flex-col gap-2 border-b border-zinc-100 px-4 py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <span className="flex flex-col">
          <Link href={`/insumos/${lote.insumoId}/editar`} className="text-sm text-zinc-900">
            {lote.insumoNombre}
          </Link>
          <span className="text-xs text-zinc-500">
            {formatCantidad(lote.cantidad)} {UNIDAD_LABELS_CORTAS[lote.unidad]} · ingresó{" "}
            {formatFechaCorta(lote.fechaIngreso)}
            {lote.nota ? ` · ${lote.nota}` : ""}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end text-sm">
          <span className={lote.estado === "vencido" ? "font-medium text-red-700" : "text-zinc-700"}>
            {lote.fechaVencimiento ? formatFechaCorta(lote.fechaVencimiento) : "—"}
          </span>
          <span className="text-xs text-zinc-400">{formatGuaranies(lote.valor)}</span>
        </span>
      </div>
      {lote.estado === "sin_fecha" && (
        <form action={ponerFechaLote.bind(null, lote.id)} className="flex items-center gap-2">
          <input
            name="fecha_vencimiento"
            type="date"
            required
            aria-label="Fecha de vencimiento"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded-lg bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
            Guardar fecha
          </button>
        </form>
      )}
      {(lote.estado === "vencido" || lote.estado === "por_vencer") && (
        <ConfirmarAccion
          action={darDeBajaLote.bind(null, lote.id)}
          label="Dar de baja (merma)"
          pregunta={`Se descuentan ${formatCantidad(lote.cantidad)} ${UNIDAD_LABELS_CORTAS[lote.unidad]} de ${lote.insumoNombre} como merma.`}
          confirmar="Sí, dar de baja"
          pendiente="Dando de baja..."
          className="self-start rounded-lg border border-red-200 px-3 py-1 text-sm text-red-700"
          claseConfirmar="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white"
        />
      )}
    </li>
  );
}

export default async function VencimientosPage() {
  const supabase = await createClient();
  const lotes = await getLotesDisponibles(supabase);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <div>
        <Link href="/insumos" className="text-sm text-fucsia-600">
          ← Insumos
        </Link>
        <h1 className="font-display text-xl font-semibold text-bordo-600">Vencimientos</h1>
        <p className="text-sm text-zinc-500">
          Lo que hay en el almacén, por fecha de vencimiento. Las salidas usan primero lo que vence antes.
        </p>
      </div>

      {lotes.length === 0 && <p className="text-sm text-zinc-400">No hay stock en el almacén.</p>}

      {SECCIONES.map((seccion) => {
        const deSeccion = lotes.filter((lote) => lote.estado === seccion.estado);
        if (deSeccion.length === 0) return null;
        return (
          <div key={seccion.estado} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-zinc-600">
              {seccion.titulo} ({deSeccion.length})
            </h2>
            <ul className={`flex flex-col rounded-xl border ${seccion.clase}`}>
              {deSeccion.map((lote) => (
                <LoteFila key={lote.id} lote={lote} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
