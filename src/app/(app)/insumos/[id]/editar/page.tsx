import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInsumo, getProveedoresParaSelector } from "@/lib/insumos/queries";
import { InsumoForm } from "@/components/insumos/InsumoForm";
import { actualizarInsumo } from "../../actions";

export default async function EditarInsumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [insumo, proveedores] = await Promise.all([
    getInsumo(supabase, id),
    getProveedoresParaSelector(supabase),
  ]);

  if (!insumo) notFound();

  const actualizarEsteInsumo = actualizarInsumo.bind(null, insumo.id);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Editar insumo
      </h1>
      <InsumoForm
        proveedores={proveedores}
        defaultValues={{
          nombre: insumo.nombre,
          categoria: insumo.categoria,
          unidad: insumo.unidad,
          costo_unitario: insumo.costo_unitario,
          stock_actual: insumo.stock_actual,
          stock_minimo: insumo.stock_minimo,
          proveedor_id: insumo.proveedor_id,
        }}
        action={actualizarEsteInsumo}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
