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
};

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
          {movimientos.map((mov) => (
            <tr key={mov.id} className="border-b border-zinc-100 last:border-0">
              <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                {formatFecha(mov.createdAt)}
              </td>
              <td className="px-3 py-2 text-zinc-900">
                {TIPO_MOVIMIENTO_LABELS[mov.tipo]}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
