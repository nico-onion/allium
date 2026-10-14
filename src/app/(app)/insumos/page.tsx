import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCantidadDiscrepancias, getInsumos } from "@/lib/insumos/queries";
import { InsumosDashboard } from "@/components/insumos/InsumosDashboard";
import { getResumenVencimientos } from "@/lib/stock/vencimientos";

export default async function InsumosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; conteo?: string }>;
}) {
  const { categoria, conteo } = await searchParams;
  const supabase = await createClient();
  const [insumos, cantidadDiscrepancias, vencimientos] = await Promise.all([
    getInsumos(supabase),
    getCantidadDiscrepancias(supabase),
    getResumenVencimientos(supabase),
  ]);
  const alertasVencimiento = vencimientos.vencidos + vencimientos.porVencer;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Insumos
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/insumos/cierre"
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700"
          >
            Cierre mensual
          </Link>
          <Link
            href="/insumos/nuevo"
            className="rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
          >
            + Nuevo
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 pt-4">
        {conteo !== undefined && (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
            Conteo guardado: {conteo} insumo{conteo === "1" ? "" : "s"} ajustado
            {conteo === "1" ? "" : "s"}.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/insumos/vencimientos"
            className={`flex flex-col rounded-xl border p-3 active:bg-zinc-50 ${
              alertasVencimiento > 0 ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"
            }`}
          >
            <span className={`text-sm font-medium ${alertasVencimiento > 0 ? "text-red-700" : "text-zinc-700"}`}>
              Vencimientos
            </span>
            <span className="text-xs text-zinc-500">
              {vencimientos.vencidos} vencido{vencimientos.vencidos === 1 ? "" : "s"} ·{" "}
              {vencimientos.porVencer} por vencer · {vencimientos.sinFecha} sin fecha
            </span>
          </Link>
          <Link
            href="/insumos/conteo"
            className="flex flex-col rounded-xl border border-zinc-200 bg-white p-3 active:bg-zinc-50"
          >
            <span className="text-sm font-medium text-zinc-700">Conteo físico</span>
            <span className="text-xs text-zinc-500">Ajustar el stock a lo que hay</span>
          </Link>
        </div>
      </div>

      <InsumosDashboard
        insumos={insumos}
        categoriaInicial={categoria}
        cantidadDiscrepancias={cantidadDiscrepancias}
      />
    </div>
  );
}
