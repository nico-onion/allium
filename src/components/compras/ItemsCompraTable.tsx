import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad } from "@/lib/format";
import { AccionesVerificacionMovimiento } from "@/components/compras/AccionesVerificacionMovimiento";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

export type ItemCompra = {
  id: string;
  insumoId: string;
  insumoNombre: string;
  cantidad: number;
  unidad: InsumoUnidad;
  verificado: boolean;
  notaVerificacion: string | null;
};

export function ItemsCompraTable({
  items,
  compraId,
}: {
  items: ItemCompra[];
  compraId: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-400">Esta compra no tiene insumos cargados.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-zinc-900">{item.insumoNombre}</span>
            <span className="text-sm text-zinc-500">
              {formatCantidad(item.cantidad)} {UNIDAD_LABELS_CORTAS[item.unidad]}
            </span>
          </div>

          {item.verificado ? (
            <span className="text-sm text-emerald-600">✓ Recepción verificada</span>
          ) : (
            <AccionesVerificacionMovimiento
              movimientoId={item.id}
              insumoId={item.insumoId}
              compraId={compraId}
            />
          )}

          {item.verificado && item.notaVerificacion && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Discrepancia: {item.notaVerificacion}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
