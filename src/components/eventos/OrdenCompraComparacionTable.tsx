import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad } from "@/lib/format";
import type { OrdenCompraItem } from "@/lib/ordenes-compra/queries";

export function OrdenCompraComparacionTable({
  items,
}: {
  items: OrdenCompraItem[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
            <th className="px-3 py-2">Insumo</th>
            <th className="px-3 py-2 text-right">Pedido</th>
            <th className="px-3 py-2 text-right">Usado</th>
            <th className="px-3 py-2">Unidad</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-zinc-100 last:border-0">
              <td className="px-3 py-2 text-zinc-900">{item.insumoNombre}</td>
              <td className="px-3 py-2 text-right text-zinc-500">
                {formatCantidad(item.cantidad)}
              </td>
              <td className="px-3 py-2 text-right font-medium text-zinc-900">
                {item.cantidadUsada !== null
                  ? formatCantidad(item.cantidadUsada)
                  : "-"}
              </td>
              <td className="px-3 py-2 text-zinc-500">
                {UNIDAD_LABELS_CORTAS[item.unidad]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
