import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCliente } from "@/lib/clientes/queries";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { actualizarCliente } from "../../actions";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const cliente = await getCliente(supabase, id);

  if (!cliente) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar cliente
      </h1>
      <ClienteForm
        defaultValues={{
          nombre: cliente.nombre,
          tipo: cliente.tipo,
          origen: cliente.origen,
          telefono: cliente.telefono,
          email: cliente.email,
          instagram: cliente.instagram,
          ruc_ci: cliente.ruc_ci,
          notas: cliente.notas,
        }}
        action={actualizarCliente.bind(null, cliente.id)}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
