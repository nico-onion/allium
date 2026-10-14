import Link from "next/link";
import { formatFechaCorta, formatGuaranies } from "@/lib/format";
import type { CompraEstado, CompraOrigen } from "@/lib/supabase/database.types";

export type CompraParaLista = {
  id: string;
  fecha: string;
  numeroFactura: string | null;
  estado: CompraEstado;
  origen: CompraOrigen;
  total: number | null;
  proveedorNombre: string | null;
  eventoCodigo: string | null;
  eventoNombre: string | null;
  cantidadItems: number;
  lineasSinAsignar: number;
  itemsPendientes: number;
};

export function CompraCard({ compra }: { compra: CompraParaLista }) {
  const esBorrador = compra.estado === "borrador";

  return (
    <Link
      href={`/compras/${compra.id}`}
      className={`flex flex-col gap-1 rounded-xl border p-4 active:bg-zinc-50 ${
        esBorrador ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-zinc-900">
          {compra.proveedorNombre ?? "Sin proveedor"}
        </span>
        {esBorrador ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {compra.lineasSinAsignar > 0
              ? `${compra.lineasSinAsignar} ítem(s) por revisar`
              : "Por confirmar"}
          </span>
        ) : (
          compra.itemsPendientes > 0 && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {compra.itemsPendientes} por verificar
            </span>
          )
        )}
      </div>
      <span className="text-sm text-zinc-500">
        {formatFechaCorta(compra.fecha)}
        {compra.numeroFactura ? ` · Factura ${compra.numeroFactura}` : ""}
        {compra.origen === "bill" ? " · por WhatsApp" : ""}
      </span>
      {compra.eventoCodigo && (
        <span className="text-sm text-fucsia-700">
          {compra.eventoCodigo} · {compra.eventoNombre}
        </span>
      )}
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-zinc-500">
          {compra.cantidadItems} ítem{compra.cantidadItems === 1 ? "" : "s"}
        </span>
        {compra.total !== null && (
          <span className="font-medium text-bordo-600">{formatGuaranies(compra.total)}</span>
        )}
      </div>
    </Link>
  );
}
