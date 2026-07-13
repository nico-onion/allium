import Link from "next/link";
import { tipoLabel } from "@/lib/eventos/constants";
import { ESTADO_BADGE_CLASSES, ESTADO_LABELS } from "@/lib/cotizaciones/constants";
import { formatFechaCorta, formatGuaranies } from "@/lib/format";
import type { PresupuestoEstado } from "@/lib/supabase/database.types";

export type PresupuestoParaLista = {
  id: string;
  numero: number;
  tipo_evento: string;
  fecha_evento: string | null;
  estado: PresupuestoEstado;
  total: number;
  clienteNombre: string | null;
};

export function PresupuestoCard({
  presupuesto,
}: {
  presupuesto: PresupuestoParaLista;
}) {
  return (
    <Link
      href={`/cotizaciones/${presupuesto.id}`}
      className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900">
            N° {presupuesto.numero} · {presupuesto.clienteNombre ?? "Sin cliente"}
          </span>
          <span className="text-sm text-zinc-500">
            {tipoLabel(presupuesto.tipo_evento)}
            {presupuesto.fecha_evento
              ? ` · ${formatFechaCorta(presupuesto.fecha_evento)}`
              : ""}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE_CLASSES[presupuesto.estado]}`}
        >
          {ESTADO_LABELS[presupuesto.estado]}
        </span>
      </div>
      <span className="text-sm font-medium text-bordo-600">
        {formatGuaranies(presupuesto.total)}
      </span>
    </Link>
  );
}
