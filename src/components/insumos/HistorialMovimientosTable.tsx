import { Fragment } from "react";
import Link from "next/link";
import { TIPO_MOVIMIENTO_LABELS, UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad, formatFecha } from "@/lib/format";
import type { InsumoUnidad, TipoMovimientoStock } from "@/lib/supabase/database.types";

export type MovimientoParaHistorial = {
  id: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  unidad: InsumoUnidad;
  nota: string | null;
  createdAt: string;
  eventoId: string | null;
  eventoNombre: string | null;
  compraId: string | null;
  verificado: boolean;
  notaVerificacion: string | null;
};

// Historial de solo lectura: la verificación de compras se hace en
// /compras/[id], acá solo se muestra el estado y un link para ir a resolverla.
export function HistorialMovimientosTable({
  movimientos,
}: {
  movimientos: MovimientoParaHistorial[];
}) {
  if (movimientos.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Todavía no hay movimientos de stock para este insumo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2 text-right">Cantidad</th>
            <th className="px-3 py-2">Nota</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((mov) => {
            const esCompra = mov.tipo === "compra";

            return (
              <Fragment key={mov.id}>
                <tr className="border-b border-zinc-100 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                    {formatFecha(mov.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-zinc-900">
                    {TIPO_MOVIMIENTO_LABELS[mov.tipo]}
                    {esCompra &&
                      (mov.verificado ? (
                        <span
                          className="ml-1 text-emerald-600"
                          title="Recepción verificada"
                        >
                          ✓
                        </span>
                      ) : (
                        <span className="ml-1 text-xs text-amber-600">
                          (pendiente)
                        </span>
                      ))}
                    {mov.eventoId && (
                      <>
                        {" "}
                        <Link
                          href={`/eventos/${mov.eventoId}`}
                          className="text-fucsia-600 underline-offset-2 hover:underline"
                        >
                          ({mov.eventoNombre ?? "ver evento"})
                        </Link>
                      </>
                    )}
                    {mov.compraId && (
                      <>
                        {" "}
                        <Link
                          href={`/compras/${mov.compraId}`}
                          className="text-fucsia-600 underline-offset-2 hover:underline"
                        >
                          (ver compra)
                        </Link>
                      </>
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      mov.cantidad < 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {mov.cantidad > 0 ? "+" : ""}
                    {formatCantidad(mov.cantidad)} {UNIDAD_LABELS_CORTAS[mov.unidad]}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{mov.nota ?? "-"}</td>
                </tr>

                {esCompra && mov.verificado && mov.notaVerificacion && (
                  <tr className="border-b border-zinc-100 bg-amber-50">
                    <td colSpan={4} className="px-3 py-2 text-xs text-amber-800">
                      Discrepancia reportada: {mov.notaVerificacion}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
