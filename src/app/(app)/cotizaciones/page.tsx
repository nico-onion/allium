import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPresupuestos } from "@/lib/cotizaciones/queries";
import { PresupuestoCard } from "@/components/cotizaciones/PresupuestoCard";

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const presupuestos = await getPresupuestos(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Cotizaciones
        </h1>
        <Link
          href="/cotizaciones/nueva"
          className="shrink-0 rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nueva
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        {presupuestos.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-400">
            Todavía no cargaste ninguna cotización.
          </p>
        ) : (
          presupuestos.map((presupuesto) => (
            <PresupuestoCard
              key={presupuesto.id}
              presupuesto={{
                id: presupuesto.id,
                numero: presupuesto.numero,
                tipo_evento: presupuesto.tipo_evento,
                fecha_evento: presupuesto.fecha_evento,
                estado: presupuesto.estado,
                total: presupuesto.total,
                clienteNombre: presupuesto.clientes?.nombre ?? null,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
