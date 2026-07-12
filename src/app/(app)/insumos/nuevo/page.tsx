import { createClient } from "@/lib/supabase/server";
import { getProveedoresParaSelector } from "@/lib/insumos/queries";
import { InsumoForm } from "@/components/insumos/InsumoForm";
import { crearInsumo } from "../actions";

export default async function NuevoInsumoPage() {
  const supabase = await createClient();
  const proveedores = await getProveedoresParaSelector(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nuevo insumo
      </h1>
      <InsumoForm
        proveedores={proveedores}
        action={crearInsumo}
        submitLabel="Crear insumo"
      />
    </div>
  );
}
