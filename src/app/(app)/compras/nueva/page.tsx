import { createClient } from "@/lib/supabase/server";
import { getProveedoresParaSelector, getInsumosParaSelector } from "@/lib/insumos/queries";
import { CompraForm } from "@/components/compras/CompraForm";
import { crearCompra } from "../actions";

export default async function NuevaCompraPage() {
  const supabase = await createClient();
  const [proveedores, insumos] = await Promise.all([
    getProveedoresParaSelector(supabase),
    getInsumosParaSelector(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nueva compra
      </h1>
      <CompraForm proveedores={proveedores} insumos={insumos} action={crearCompra} />
    </div>
  );
}
