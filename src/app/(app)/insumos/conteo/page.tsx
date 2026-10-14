import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { categoriaDe } from "@/lib/insumos/categorias";
import { ConteoForm } from "@/components/insumos/ConteoForm";
import { guardarConteo } from "../stock-actions";

export default async function ConteoPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insumos")
    .select("id, nombre, unidad, stock_actual, categoria")
    .order("nombre");
  if (error) throw new Error(error.message);

  const insumos = data
    .map((i) => ({ ...i, stock_actual: Number(i.stock_actual), categoria: categoriaDe(i) }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre));

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <div>
        <Link href="/insumos" className="text-sm text-fucsia-600">
          ← Insumos
        </Link>
        <h1 className="font-display text-xl font-semibold text-bordo-600">Conteo físico</h1>
        <p className="text-sm text-zinc-500">
          Anotá lo que hay realmente en la cocina, en la unidad de cada insumo. Solo se ajustan los
          que completes; la diferencia queda registrada como ajuste por conteo.
        </p>
      </div>
      <ConteoForm insumos={insumos} action={guardarConteo} />
    </div>
  );
}
