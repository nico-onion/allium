import { createClient } from "@/lib/supabase/server";
import { getClientesParaSelector, getTiposDeEventoUsados } from "@/lib/eventos/queries";
import { EventoForm } from "@/components/eventos/EventoForm";
import { crearEvento } from "../actions";

export default async function NuevoEventoPage() {
  const supabase = await createClient();
  const [clientes, tiposUsados] = await Promise.all([
    getClientesParaSelector(supabase),
    getTiposDeEventoUsados(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nuevo evento
      </h1>
      <EventoForm
        clientes={clientes}
        tiposUsados={tiposUsados}
        action={crearEvento}
        submitLabel="Crear evento"
      />
    </div>
  );
}
