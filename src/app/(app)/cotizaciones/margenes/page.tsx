import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getParametrosTipoEvento } from "@/lib/cotizaciones/queries";
import { tipoLabel } from "@/lib/eventos/constants";
import { guardarParametrosTipoEvento } from "../actions";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-right text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

// Margen objetivo e imprevistos por tipo de evento: se precargan en cada
// presupuesto nuevo y se pueden cambiar ahí caso por caso.
export default async function MargenesPage() {
  const supabase = await createClient();
  const parametros = await getParametrosTipoEvento(supabase);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div>
        <Link href="/cotizaciones" className="text-sm text-fucsia-600">
          ← Cotizaciones
        </Link>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Márgenes por tipo de evento
        </h1>
        <p className="text-sm text-zinc-500">
          Se proponen al crear un presupuesto. El margen se mide sobre el precio sin IVA;
          imprevistos suma un colchón al costo.
        </p>
      </div>

      <form action={guardarParametrosTipoEvento} className="flex flex-col gap-3">
        <div className="grid grid-cols-[1fr_5.5rem_5.5rem] gap-2 px-1 text-xs uppercase tracking-wide text-zinc-400">
          <span>Tipo</span>
          <span className="text-right">Margen %</span>
          <span className="text-right">Imprev. %</span>
        </div>
        {parametros.map((fila) => (
          <div
            key={fila.tipo}
            className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2"
          >
            <input type="hidden" name="tipo" value={fila.tipo} />
            <span className="text-sm text-zinc-900">{tipoLabel(fila.tipo)}</span>
            <input
              name="margen_objetivo_pct"
              type="number"
              min={0}
              max={99}
              step="any"
              defaultValue={fila.margen_objetivo_pct}
              aria-label={`Margen de ${tipoLabel(fila.tipo)}`}
              className={inputClasses}
            />
            <input
              name="pct_imprevistos"
              type="number"
              min={0}
              max={100}
              step="any"
              defaultValue={fila.pct_imprevistos}
              aria-label={`Imprevistos de ${tipoLabel(fila.tipo)}`}
              className={inputClasses}
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white"
        >
          Guardar márgenes
        </button>
      </form>
    </div>
  );
}
