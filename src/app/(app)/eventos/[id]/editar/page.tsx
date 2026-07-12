import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvento, getClientesParaSelector } from "@/lib/eventos/queries";
import { EventoForm } from "@/components/eventos/EventoForm";
import { actualizarEvento } from "../../actions";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [evento, clientes] = await Promise.all([
    getEvento(supabase, id),
    getClientesParaSelector(supabase),
  ]);

  if (!evento) notFound();

  const actualizarEsteEvento = actualizarEvento.bind(null, evento.id);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar evento
      </h1>
      <EventoForm
        clientes={clientes}
        defaultValues={{
          cliente_id: evento.cliente_id,
          nombre: evento.nombre,
          tipo: evento.tipo,
          fecha: evento.fecha,
          invitados: evento.invitados,
          estado: evento.estado,
          ubicacion: evento.ubicacion,
          precio_total: evento.precio_total,
          margen_objetivo: evento.margen_objetivo,
        }}
        action={actualizarEsteEvento}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
