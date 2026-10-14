import Link from "next/link";
import { TIPO_ALMACENAMIENTO_LABELS, UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { estaBajoStockMinimo } from "@/lib/insumos/categorias";
import { formatGuaranies } from "@/lib/format";
import { textoMarca } from "@/lib/insumos/marca";
import type {
  InsumoTipoAlmacenamiento,
  InsumoUnidad,
} from "@/lib/supabase/database.types";

export type InsumoParaCard = {
  id: string;
  nombre: string;
  unidad: InsumoUnidad;
  tipo_almacenamiento: InsumoTipoAlmacenamiento | null;
  costo_unitario: number;
  merma_pct: number | null;
  marca_preferida: string | null;
  marca_alternativa: string | null;
  stock_actual: number;
  stock_minimo: number;
  proveedores: { nombre: string } | null;
};

export function InsumoCard({ insumo }: { insumo: InsumoParaCard }) {
  const enAlerta = estaBajoStockMinimo(insumo);

  return (
    <Link
      href={`/insumos/${insumo.id}/editar`}
      className={`flex flex-col gap-1 rounded-xl border p-4 active:bg-zinc-50 ${
        enAlerta ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-zinc-900">{insumo.nombre}</span>
        <div className="flex shrink-0 items-center gap-2">
          {insumo.merma_pct === null && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Merma pendiente
            </span>
          )}
          {enAlerta && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Bajo stock
            </span>
          )}
          {insumo.tipo_almacenamiento && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
              {TIPO_ALMACENAMIENTO_LABELS[insumo.tipo_almacenamiento]}
            </span>
          )}
          <span className="text-xs text-zinc-400">
            {UNIDAD_LABELS_CORTAS[insumo.unidad]}
          </span>
        </div>
      </div>
      <span className="text-sm text-zinc-500">
        {textoMarca(insumo.marca_preferida, insumo.marca_alternativa) ?? "Sin marca definida"} ·{" "}
        {insumo.proveedores?.nombre ?? "Sin proveedor"}
        {insumo.merma_pct !== null && ` · merma ${Number(insumo.merma_pct)} %`}
      </span>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className={enAlerta ? "text-red-600" : "text-zinc-500"}>
          Stock: {insumo.stock_actual} {UNIDAD_LABELS_CORTAS[insumo.unidad]}
          {" "}
          (mín. {insumo.stock_minimo} {UNIDAD_LABELS_CORTAS[insumo.unidad]})
        </span>
        <span className="font-medium text-bordo-600">
          {formatGuaranies(insumo.costo_unitario)} /{" "}
          {UNIDAD_LABELS_CORTAS[insumo.unidad]}
        </span>
      </div>
    </Link>
  );
}
