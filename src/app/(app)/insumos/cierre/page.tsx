import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CierreMesForm } from "@/components/insumos/CierreMesForm";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatFecha, formatGuaranies } from "@/lib/format";
import { cerrarMesCostos } from "./actions";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function nombreMes(periodo: string): string {
  const [anio, mes] = periodo.split("-");
  return `${MESES.at(Number(mes) - 1)} ${anio}`;
}

export default async function CierreMensualPage() {
  const supabase = await createClient();
  const [{ data: cierres, error: cierresError }, { data: insumos, error: insumosError }] =
    await Promise.all([
      supabase
        .from("cierres_mensuales")
        .select("id, periodo, cerrado_en")
        .order("periodo", { ascending: false })
        .limit(12),
      supabase
        .from("insumos")
        .select("id, nombre, unidad, costo_unitario, costo_contable")
        .order("nombre", { ascending: true }),
    ]);

  if (cierresError) throw new Error(cierresError.message);
  if (insumosError) throw new Error(insumosError.message);

  // Sugerencia: el mes anterior al actual, que es el que se cierra normalmente.
  const hoy = new Date();
  const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const mesSugerido = `${anterior.getFullYear()}-${String(anterior.getMonth() + 1).padStart(2, "0")}`;

  // Insumos cuyo costo vivo ya se movió respecto del último cierre.
  const cambios = insumos
    .map((insumo) => {
      const vivo = Number(insumo.costo_unitario);
      const contable = Number(insumo.costo_contable);
      const variacion = contable > 0 ? (vivo - contable) / contable : null;
      return { ...insumo, vivo, contable, variacion };
    })
    .filter((insumo) => insumo.vivo !== insumo.contable)
    .sort((a, b) => Math.abs(b.variacion ?? 0) - Math.abs(a.variacion ?? 0));

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div>
        <Link href="/insumos" className="text-sm text-fucsia-600">
          ← Insumos
        </Link>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Cierre mensual de costos
        </h1>
        <p className="text-sm text-zinc-500">
          Copia el costo vivo de cada insumo a su costo contable. Los reportes del mes
          usan el contable; recetas y presupuestos siguen usando el vivo.
        </p>
      </div>

      <CierreMesForm action={cerrarMesCostos} mesSugerido={mesSugerido} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">
          Cambios desde el último cierre ({cambios.length})
        </span>
        {cambios.length === 0 ? (
          <p className="text-sm text-zinc-400">Ningún costo cambió todavía.</p>
        ) : (
          <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white text-sm">
            {cambios.map((insumo) => (
              <li
                key={insumo.id}
                className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2 last:border-0"
              >
                <Link href={`/insumos/${insumo.id}/editar`} className="text-zinc-900">
                  {insumo.nombre}
                </Link>
                <span className="text-right text-zinc-700">
                  {formatGuaranies(insumo.contable)} → {formatGuaranies(insumo.vivo)} /{" "}
                  {UNIDAD_LABELS_CORTAS[insumo.unidad]}
                  {insumo.variacion !== null && (
                    <span
                      className={`ml-1 text-xs ${insumo.variacion > 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {insumo.variacion > 0 ? "+" : ""}
                      {(insumo.variacion * 100).toFixed(1)} %
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">Meses cerrados</span>
        {cierres.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no se cerró ningún mes.</p>
        ) : (
          <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white text-sm">
            {cierres.map((cierre) => (
              <li
                key={cierre.id}
                className="flex justify-between gap-2 border-b border-zinc-100 px-4 py-2 capitalize last:border-0"
              >
                <span className="text-zinc-900">{nombreMes(cierre.periodo)}</span>
                <span className="normal-case text-zinc-400">
                  {formatFecha(cierre.cerrado_en)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
