import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getInsumo,
  getMovimientosStock,
  getProveedoresParaSelector,
} from "@/lib/insumos/queries";
import { InsumoForm } from "@/components/insumos/InsumoForm";
import { HistorialMovimientosTable } from "@/components/insumos/HistorialMovimientosTable";
import { MovimientoStockForm } from "@/components/insumos/MovimientoStockForm";
import { actualizarInsumo } from "../../actions";
import { crearMovimientoStockManual } from "../../movimientos-actions";

export default async function EditarInsumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [insumo, proveedores, movimientos] = await Promise.all([
    getInsumo(supabase, id),
    getProveedoresParaSelector(supabase),
    getMovimientosStock(supabase, id),
  ]);

  if (!insumo) notFound();

  const actualizarEsteInsumo = actualizarInsumo.bind(null, insumo.id);
  const crearMovimientoParaEsteInsumo = crearMovimientoStockManual.bind(null, insumo.id);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div>
        <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
          Editar insumo
        </h1>
        <InsumoForm
          proveedores={proveedores}
          defaultValues={{
            nombre: insumo.nombre,
            categoria: insumo.categoria,
            unidad: insumo.unidad,
            costo_unitario: insumo.costo_unitario,
            stock_actual: insumo.stock_actual,
            stock_minimo: insumo.stock_minimo,
            proveedor_id: insumo.proveedor_id,
          }}
          action={actualizarEsteInsumo}
          submitLabel="Guardar cambios"
        />
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <h2 className="font-display text-lg font-semibold text-bordo-600">
          Historial de movimientos
        </h2>

        <HistorialMovimientosTable
          movimientos={movimientos.map((mov) => ({
            id: mov.id,
            tipo: mov.tipo,
            cantidad: mov.cantidad,
            unidad: mov.unidad,
            nota: mov.nota,
            createdAt: mov.created_at,
            eventoId: mov.evento_id,
            eventoNombre: mov.eventos?.nombre ?? null,
          }))}
        />

        <span className="text-sm font-medium text-zinc-600">
          Cargar movimiento manual
        </span>
        <MovimientoStockForm action={crearMovimientoParaEsteInsumo} />
      </div>
    </div>
  );
}
