import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompra } from "@/lib/compras/queries";
import { formatFechaCorta } from "@/lib/format";
import { ItemsCompraTable } from "@/components/compras/ItemsCompraTable";

export default async function CompraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const compra = await getCompra(supabase, id);

  if (!compra) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          {compra.proveedorNombre ?? "Sin proveedor"}
        </h1>
        <span className="text-sm text-zinc-500">
          {formatFechaCorta(compra.fecha)}
          {compra.numeroFactura ? ` · Factura ${compra.numeroFactura}` : ""}
        </span>
      </div>

      <ItemsCompraTable items={compra.items} compraId={compra.id} />
    </div>
  );
}
