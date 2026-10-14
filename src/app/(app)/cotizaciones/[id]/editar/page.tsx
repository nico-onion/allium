import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPresupuesto, getPresupuestoItems } from "@/lib/cotizaciones/queries";
import { getDatosFormularioPresupuesto } from "@/lib/cotizaciones/datos-formulario";
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

  const [datos, items] = await Promise.all([
    getDatosFormularioPresupuesto(supabase),
    getPresupuestoItems(supabase, id),
  ]);

  // Un presupuesto aceptado conserva el costo con el que se aceptó.
  const costosCongelados: [string, number][] = presupuesto.costo_congelado_en
    ? items
        .filter((item) => item.receta_id && item.costo_unitario !== null)
        .map((item) => [item.receta_id as string, Number(item.costo_unitario)])
    : [];

  const actualizarEstaCotizacion = actualizarPresupuesto.bind(null, presupuesto.id);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar cotización N° {presupuesto.numero}
      </h1>
      {presupuesto.costo_congelado_en && (
        <p className="mx-4 mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">
          Este presupuesto ya fue aceptado: las recetas mantienen el costo con el que se
          aceptó. Las que agregues se costean con los precios de hoy.
        </p>
      )}
      <PresupuestoForm
        {...datos}
        costosCongelados={costosCongelados}
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
          margen_objetivo_pct:
            presupuesto.margen_objetivo_pct === null
              ? null
              : Number(presupuesto.margen_objetivo_pct),
          pct_imprevistos: Number(presupuesto.pct_imprevistos),
          items: items.map((item) => ({
            receta_id: item.receta_id,
            descripcion: item.descripcion,
            categoria: item.categoria,
            personal_id: item.personal_id,
            cantidad: Number(item.cantidad),
            precio_unitario: Number(item.precio_unitario),
            costo_unitario: item.costo_unitario === null ? null : Number(item.costo_unitario),
          })),
        }}
        action={actualizarEstaCotizacion}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
