import { createClient } from "@/lib/supabase/server";
import { getClientesParaSelector, getRecetasParaSelector } from "@/lib/eventos/queries";
import { getTiposEventoUsados } from "@/lib/cotizaciones/queries";
import { PresupuestoForm } from "@/components/cotizaciones/PresupuestoForm";
import { crearPresupuesto } from "../actions";

export default async function NuevaCotizacionPage() {
  const supabase = await createClient();
  const [clientes, recetas, tiposUsados] = await Promise.all([
    getClientesParaSelector(supabase),
    getRecetasParaSelector(supabase),
    getTiposEventoUsados(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nueva cotización
      </h1>
      <PresupuestoForm
        clientes={clientes}
        recetas={recetas}
        tiposUsados={tiposUsados}
        action={crearPresupuesto}
        submitLabel="Crear cotización"
      />
    </div>
  );
}
