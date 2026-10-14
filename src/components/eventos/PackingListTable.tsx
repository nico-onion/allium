"use client";

import { useState } from "react";
import type { PackingListItem } from "@/lib/eventos/packing-list";
import { formatCantidad as formatearCantidad } from "@/lib/format";
import { textoMarca } from "@/lib/insumos/marca";

export function PackingListTable({ items }: { items: PackingListItem[] }) {
  const [copiado, setCopiado] = useState(false);

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Agregá recetas al menú para ver la lista de insumos a comprar.
      </p>
    );
  }

  async function copiar() {
    const texto = items
      .map(
        (item) =>
        {
          const marca = textoMarca(item.marcaPreferida, item.marcaAlternativa);
          return `${item.insumoNombre}${marca ? ` (${marca})` : ""}: ${formatearCantidad(item.cantidad)} ${item.unidad}`;
        },
      )
      .join("\n");
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-3 py-2">Insumo</th>
              <th className="px-3 py-2 text-right">Cantidad</th>
              <th className="px-3 py-2">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.insumoId}-${item.unidad}`}
                className="border-b border-zinc-100 last:border-0"
              >
                <td className="px-3 py-2 text-zinc-900">
                  {item.insumoNombre}
                  {textoMarca(item.marcaPreferida, item.marcaAlternativa) && (
                    <span className="block text-xs text-zinc-400">
                      {textoMarca(item.marcaPreferida, item.marcaAlternativa)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-zinc-900">
                  {formatearCantidad(item.cantidad)}
                </td>
                <td className="px-3 py-2 text-zinc-500">{item.unidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={copiar}
        className="self-start rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600"
      >
        {copiado ? "Copiado ✓" : "Copiar lista"}
      </button>
    </div>
  );
}
