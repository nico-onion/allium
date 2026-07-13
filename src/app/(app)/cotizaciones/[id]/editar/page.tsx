import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientesParaSelector, getRecetasParaSelector } from "@/lib/eventos/queries";
import {
  getPresupuesto,
  getPresupuestoItems,
  getTiposEventoUsados,
} from "@/lib/cotizaciones/queries";
import { PresupuestoForm } from "@/components/cotizaciones/PresupuestoForm";
import { actualizarPresupuesto } from "../../actions";

export default async function EditarCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const presupuesto = await getPresupuesto(supabase, id);

  if (!presupuesto) notFound();

  const [clientes, recetas, tiposUsados, items] = await Promise.all([
    getClientesParaSelector(supabase),
    getRecetasParaSelector(supabase),
    getTiposEventoUsados(supabase),
    getPresupuestoItems(supabase, id),
  ]);

  const actualizarEstaCotizacion = actualizarPresupuesto.bind(null, presupuesto.id);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar cotización N° {presupuesto.numero}
      </h1>
      <PresupuestoForm
        clientes={clientes}
        recetas={recetas}
        tiposUsados={tiposUsados}
        defaultValues={{
          cliente_id: presupuesto.cliente_id,
          fecha_emision: presupuesto.fecha_emision,
          validez_dias: presupuesto.validez_dias,
          tipo_evento: presupuesto.tipo_evento,
          fecha_evento: presupuesto.fecha_evento,
          horario: presupuesto.horario,
          lugar_direccion: presupuesto.lugar_direccion,
          cantidad_personas: presupuesto.cantidad_personas,
          incluye: presupuesto.incluye,
          no_incluye: presupuesto.no_incluye,
          items: items.map((item) => ({
            receta_id: item.receta_id,
            cantidad: Number(item.cantidad),
            precio_unitario: Number(item.precio_unitario),
          })),
        }}
        action={actualizarEstaCotizacion}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
