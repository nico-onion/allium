import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEvento,
  getClientesParaSelector,
  getTiposDeEventoUsados,
} from "@/lib/eventos/queries";
import { EventoForm } from "@/components/eventos/EventoForm";
import { actualizarEvento } from "../../actions";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [evento, clientes, tiposUsados] = await Promise.all([
    getEvento(supabase, id),
    getClientesParaSelector(supabase),
    getTiposDeEventoUsados(supabase),
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
        tiposUsados={tiposUsados}
        defaultValues={{
          cliente_id: evento.cliente_id,
          nombre: evento.nombre,
          tipo: evento.tipo,
          fecha: evento.fecha,
          invitados: evento.invitados,
          estado: evento.estado,
          ubicacion: evento.ubicacion,
          precio_por_persona: evento.precio_por_persona,
          precio_total: evento.precio_total,
          margen_objetivo: evento.margen_objetivo,
          link_cotizacion: evento.link_cotizacion,
        }}
        action={actualizarEsteEvento}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
