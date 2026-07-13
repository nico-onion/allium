import Link from "next/link";
import { formatFechaCorta } from "@/lib/format";

export type CompraParaLista = {
  id: string;
  fecha: string;
  numeroFactura: string | null;
  proveedorNombre: string | null;
  cantidadItems: number;
  itemsPendientes: number;
};

export function CompraCard({ compra }: { compra: CompraParaLista }) {
  return (
    <Link
      href={`/compras/${compra.id}`}
      className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-zinc-900">
          {compra.proveedorNombre ?? "Sin proveedor"}
        </span>
        {compra.itemsPendientes > 0 && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {compra.itemsPendientes} por verificar
          </span>
        )}
      </div>
      <span className="text-sm text-zinc-500">
        {formatFechaCorta(compra.fecha)}
        {compra.numeroFactura ? ` · Factura ${compra.numeroFactura}` : ""}
      </span>
      <span className="text-sm text-zinc-500">
        {compra.cantidadItems} insumo{compra.cantidadItems === 1 ? "" : "s"}
      </span>
    </Link>
  );
}
