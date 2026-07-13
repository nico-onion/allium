import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProveedor } from "@/lib/proveedores/queries";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";
import { actualizarProveedor } from "../../actions";

export default async function EditarProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const proveedor = await getProveedor(supabase, id);

  if (!proveedor) notFound();

  const actualizarEsteProveedor = actualizarProveedor.bind(null, proveedor.id);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar proveedor
      </h1>
      <ProveedorForm
        defaultValues={{
          nombre: proveedor.nombre,
          contacto: proveedor.contacto,
          notas: proveedor.notas,
        }}
        action={actualizarEsteProveedor}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
