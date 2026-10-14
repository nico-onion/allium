import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCostoHistorial,
  getInsumo,
  getMovimientosStock,
  getProveedoresParaSelector,
  getRendimientos,
} from "@/lib/insumos/queries";
import { RendimientoForm } from "@/components/insumos/RendimientoForm";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatFecha, formatFechaCorta, formatGuaranies } from "@/lib/format";
import { InsumoForm } from "@/components/insumos/InsumoForm";
import { HistorialMovimientosTable } from "@/components/insumos/HistorialMovimientosTable";
import { MovimientoStockForm } from "@/components/insumos/MovimientoStockForm";
import { actualizarInsumo } from "../../actions";
import { crearMovimientoStockManual } from "../../movimientos-actions";
import { crearRendimiento, eliminarRendimiento } from "../../rendimientos-actions";

export default async function EditarInsumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [insumo, proveedores, movimientos, rendimientos, historialCosto] =
    await Promise.all([
      getInsumo(supabase, id),
      getProveedoresParaSelector(supabase),
      getMovimientosStock(supabase, id),
      getRendimientos(supabase, id),
      getCostoHistorial(supabase, id),
    ]);

  if (!insumo) notFound();

  const actualizarEsteInsumo = actualizarInsumo.bind(null, insumo.id);
  const crearMovimientoParaEsteInsumo = crearMovimientoStockManual.bind(null, insumo.id);
  const crearRendimientoParaEsteInsumo = crearRendimiento.bind(null, insumo.id);
  const unidad = UNIDAD_LABELS_CORTAS[insumo.unidad];
  const merma = insumo.merma_pct === null ? null : Number(insumo.merma_pct);

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
            tipo_almacenamiento: insumo.tipo_almacenamiento,
            costo_unitario: insumo.costo_unitario,
            stock_actual: insumo.stock_actual,
            stock_minimo: insumo.stock_minimo,
            merma_pct: merma,
            proveedor_id: insumo.proveedor_id,
          }}
          action={actualizarEsteInsumo}
          submitLabel="Guardar cambios"
        />
      </div>

      <div className="flex flex-col gap-3 px-4">
        <h2 className="font-display text-lg font-semibold text-bordo-600">
          Costo
        </h2>
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-zinc-400">
              Costo vivo
            </span>
            <span className="text-base text-zinc-900">
              {formatGuaranies(Number(insumo.costo_unitario))} / {unidad}
            </span>
            <span className="text-xs text-zinc-400">Promedio con cada compra</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-zinc-400">
              Costo contable
            </span>
            <span className="text-base text-zinc-900">
              {formatGuaranies(Number(insumo.costo_contable))} / {unidad}
            </span>
            <span className="text-xs text-zinc-400">Del último cierre mensual</span>
          </div>
          {merma !== null && merma > 0 && (
            <div className="col-span-2 flex flex-col gap-0.5 border-t border-zinc-100 pt-3">
              <span className="text-xs uppercase tracking-wide text-zinc-400">
                Costo útil (con merma {merma} %)
              </span>
              <span className="text-base font-medium text-bordo-600">
                {formatGuaranies(Number(insumo.costo_unitario) / (1 - merma / 100))} /{" "}
                {unidad}
              </span>
            </div>
          )}
        </div>

        {historialCosto.length > 0 && (
          <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white text-sm">
            {historialCosto.map((cambio) => {
              const anterior = Number(cambio.costo_anterior);
              const nuevo = Number(cambio.costo_nuevo);
              const variacion = anterior > 0 ? ((nuevo - anterior) / anterior) * 100 : null;
              return (
                <li
                  key={cambio.id}
                  className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2 last:border-0"
                >
                  <span className="text-zinc-500">
                    {formatFecha(cambio.created_at)} ·{" "}
                    {cambio.origen === "compra" ? "compra" : "a mano"}
                  </span>
                  <span className="text-right text-zinc-900">
                    {formatGuaranies(anterior)} → {formatGuaranies(nuevo)}
                    {variacion !== null && (
                      <span
                        className={`ml-1 text-xs ${variacion > 0 ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {variacion > 0 ? "+" : ""}
                        {variacion.toFixed(1)} %
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4">
        <h2 className="font-display text-lg font-semibold text-bordo-600">
          Merma y rendimiento
        </h2>
        <p className="text-sm text-zinc-500">
          {merma === null
            ? "Merma pendiente: cargá una prueba para que el costo de las recetas sea real."
            : rendimientos.length > 0
              ? `Merma ${merma} %, promedio de ${rendimientos.length} prueba${rendimientos.length === 1 ? "" : "s"}.`
              : `Merma ${merma} %, cargada a mano.`}
        </p>

        {rendimientos.length > 0 && (
          <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white text-sm">
            {rendimientos.map((prueba) => {
              const inicial = Number(prueba.peso_inicial);
              const mermaPrueba =
                ((Number(prueba.peso_perdida) - Number(prueba.peso_aprovechado)) / inicial) *
                100;
              const eliminar = eliminarRendimiento.bind(null, prueba.id, insumo.id);
              return (
                <li
                  key={prueba.id}
                  className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2 last:border-0"
                >
                  <span className="flex flex-col">
                    <span className="text-zinc-900">
                      {mermaPrueba.toFixed(1)} % · {formatFechaCorta(prueba.fecha)}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {inicial} inicial, {Number(prueba.peso_perdida)} pérdida,{" "}
                      {Number(prueba.peso_aprovechado)} aprovechado
                      {prueba.nota ? ` · ${prueba.nota}` : ""}
                    </span>
                  </span>
                  <form action={eliminar}>
                    <button type="submit" className="text-xs text-zinc-400 underline">
                      Borrar
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <RendimientoForm action={crearRendimientoParaEsteInsumo} />
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
            compraId: mov.compra_id,
            verificado: mov.verificado,
            notaVerificacion: mov.nota_verificacion,
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
