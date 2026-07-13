import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProveedores } from "@/lib/proveedores/queries";
import { ProveedorCard } from "@/components/proveedores/ProveedorCard";

export default async function ProveedoresPage() {
  const supabase = await createClient();
  const proveedores = await getProveedores(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Proveedores
        </h1>
        <Link
          href="/proveedores/nuevo"
          className="shrink-0 rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nuevo
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        {proveedores.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-400">
            Todavía no cargaste ningún proveedor.
          </p>
        ) : (
          proveedores.map((proveedor) => (
            <ProveedorCard key={proveedor.id} proveedor={proveedor} />
          ))
        )}
      </div>
    </div>
  );
}
