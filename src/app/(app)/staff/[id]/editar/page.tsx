import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPersona } from "@/lib/staff/queries";
import { PersonalForm } from "@/components/staff/PersonalForm";
import { actualizarPersonal } from "../../actions";

export default async function EditarPersonalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const persona = await getPersona(supabase, id);

  if (!persona) notFound();

  const actualizarEstaPersona = actualizarPersonal.bind(null, persona.id);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar persona
      </h1>
      <PersonalForm
        defaultValues={{
          nombre: persona.nombre,
          rol: persona.rol,
          telefono: persona.telefono,
          costo_referencia:
            persona.costo_referencia === null ? null : Number(persona.costo_referencia),
        }}
        action={actualizarEstaPersona}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
