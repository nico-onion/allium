import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCompras } from "@/lib/compras/queries";
import { CompraCard } from "@/components/compras/CompraCard";

export default async function ComprasPage() {
  const supabase = await createClient();
  const compras = await getCompras(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Compras
        </h1>
        <Link
          href="/compras/nueva"
          className="shrink-0 rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nueva
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        {compras.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-400">
            Todavía no cargaste ninguna compra.
          </p>
        ) : (
          compras.map((compra) => <CompraCard key={compra.id} compra={compra} />)
        )}
      </div>
    </div>
  );
}
