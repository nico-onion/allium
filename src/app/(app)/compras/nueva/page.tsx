import { createClient } from "@/lib/supabase/server";
import { getProveedoresParaSelector } from "@/lib/insumos/queries";
import { CompraForm } from "@/components/compras/CompraForm";
import { getEventosParaSelector } from "@/lib/eventos/queries";
import { crearCompra } from "../actions";

export default async function NuevaCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string }>;
}) {
  const { evento } = await searchParams;
  const supabase = await createClient();
  const [proveedores, eventos] = await Promise.all([
    getProveedoresParaSelector(supabase),
    getEventosParaSelector(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nueva compra
      </h1>
      <CompraForm
        proveedores={proveedores}
        eventos={eventos}
        eventoIdInicial={eventos.some((e) => e.id === evento) ? evento : undefined}
        action={crearCompra}
      />
    </div>
  );
}
