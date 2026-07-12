import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getInsumos } from "@/lib/insumos/queries";
import { InsumosDashboard } from "@/components/insumos/InsumosDashboard";

export default async function InsumosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();
  const insumos = await getInsumos(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Insumos
        </h1>
        <Link
          href="/insumos/nuevo"
          className="shrink-0 rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nuevo
        </Link>
      </div>

      <InsumosDashboard insumos={insumos} categoriaInicial={categoria} />
    </div>
  );
}
