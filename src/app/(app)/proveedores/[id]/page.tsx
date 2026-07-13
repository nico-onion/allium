import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProveedor, getInsumosDeProveedor } from "@/lib/proveedores/queries";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatGuaranies } from "@/lib/format";

export default async function ProveedorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const proveedor = await getProveedor(supabase, id);

  if (!proveedor) notFound();

  const insumos = await getInsumosDeProveedor(supabase, id);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          {proveedor.nombre}
        </h1>
        {proveedor.contacto && (
          <span className="text-sm text-zinc-500">{proveedor.contacto}</span>
        )}
      </div>

      {proveedor.notas && (
        <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          {proveedor.notas}
        </p>
      )}

      <Link
        href={`/proveedores/${proveedor.id}/editar`}
        className="w-full rounded-lg bg-fucsia-600 py-3 text-center text-base font-medium text-white"
      >
        Editar proveedor
      </Link>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">
          Insumos que provee
        </span>
        {insumos.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Todavía no le asignaste ningún insumo a este proveedor.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {insumos.map((insumo) => (
              <Link
                key={insumo.id}
                href={`/insumos/${insumo.id}/editar`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-900">{insumo.nombre}</span>
                  <span className="text-xs text-zinc-400">
                    {UNIDAD_LABELS_CORTAS[insumo.unidad]}
                  </span>
                </div>
                <span className="text-sm text-zinc-500">
                  {formatGuaranies(insumo.costo_unitario)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
