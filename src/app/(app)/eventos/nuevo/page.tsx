import { createClient } from "@/lib/supabase/server";
import { getClientesParaSelector } from "@/lib/eventos/queries";
import { EventoForm } from "@/components/eventos/EventoForm";
import { crearEvento } from "../actions";

export default async function NuevoEventoPage() {
  const supabase = await createClient();
  const clientes = await getClientesParaSelector(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nuevo evento
      </h1>
      <EventoForm
        clientes={clientes}
        action={crearEvento}
        submitLabel="Crear evento"
      />
    </div>
  );
}
