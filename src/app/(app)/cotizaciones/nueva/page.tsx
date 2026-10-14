import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDatosFormularioPresupuesto } from "@/lib/cotizaciones/datos-formulario";
import { PresupuestoForm } from "@/components/cotizaciones/PresupuestoForm";
import { crearPresupuesto } from "../actions";

export default async function NuevaCotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const datos = await getDatosFormularioPresupuesto(supabase);
  const clienteInicial = datos.clientes.some((c) => c.id === cliente) ? cliente : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Nueva cotización
        </h1>
        <Link href="/cotizaciones/margenes" className="text-sm text-fucsia-600">
          Márgenes
        </Link>
      </div>
      <PresupuestoForm
        {...datos}
        clienteInicial={clienteInicial}
        action={crearPresupuesto}
        submitLabel="Crear cotización"
      />
    </div>
  );
}
