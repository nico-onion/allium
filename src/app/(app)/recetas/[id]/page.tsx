import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRecetasParaCosto } from "@/lib/recetas/queries";
import { armarMapaRecetas, calcularCostoCompleto } from "@/lib/recetas/costo";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad, formatGuaranies } from "@/lib/format";
import { textoMarca } from "@/lib/insumos/marca";

function Dato({
  label,
  value,
  detalle,
  destacado,
}: {
  label: string;
  value: string;
  detalle?: string;
  destacado?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-zinc-400">{label}</span>
      <span
        className={`text-base ${destacado ? "font-medium text-bordo-600" : "text-zinc-900"}`}
      >
        {value}
      </span>
      {detalle && <span className="text-xs text-zinc-400">{detalle}</span>}
    </div>
  );
}

export default async function RecetaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const recetas = await getRecetasParaCosto(supabase);
  const receta = recetas.find((r) => r.id === id);

  if (!receta) notFound();

  const mapa = armarMapaRecetas(recetas);
  const costo = calcularCostoCompleto(receta.id, mapa);
  if (!costo) notFound();

  const unidadRendimiento = receta.rendimiento_unidad
    ? UNIDAD_LABELS_CORTAS[receta.rendimiento_unidad]
    : null;
  const usadaEn = recetas.filter((r) =>
    r.receta_subrecetas.some((rs) => rs.subreceta_id === receta.id),
  );

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          {receta.nombre}
        </h1>
        <span className="text-sm text-zinc-500">
          {receta.es_subreceta ? "Sub-receta" : (receta.categoria ?? "Sin categoría")}
        </span>
      </div>

      {costo.mermasPendientes.length > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Merma pendiente en {costo.mermasPendientes.join(", ")}. El costo real va a ser
          mayor hasta que la midas.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <Dato
          label="Rinde"
          value={`${receta.porcion_base} ${unidadRendimiento ?? "porciones"}`}
        />
        <Dato label="Costo total" value={formatGuaranies(costo.costoTotal)} />
        <Dato
          label={unidadRendimiento ? `Costo por ${unidadRendimiento}` : "Costo por porción"}
          value={formatGuaranies(costo.costoPorPorcion)}
          destacado
        />
        {costo.costoVarios > 0 && (
          <Dato
            label={`Varios ${receta.pct_varios} %`}
            value={formatGuaranies(costo.costoVarios)}
          />
        )}
        {receta.precio_venta !== null && (
          <>
            <Dato
              label="Precio por porción"
              value={formatGuaranies(receta.precio_venta)}
            />
            {costo.foodCostPct !== null && costo.margenPorPorcion !== null && (
              <Dato
                label="Food cost"
                value={`${(costo.foodCostPct * 100).toFixed(1)} %`}
                detalle={`Margen ${formatGuaranies(costo.margenPorPorcion)} por porción`}
                destacado
              />
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">Composición</span>
        {costo.lineas.length === 0 ? (
          <p className="text-sm text-zinc-400">Esta receta no tiene insumos cargados.</p>
        ) : (
          <ul className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
            {costo.lineas.map((linea) => (
              <li
                key={`${linea.tipo}-${linea.id}`}
                className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 text-sm last:border-0 last:pb-0"
              >
                <span className="flex flex-col">
                  {linea.tipo === "subreceta" ? (
                    <Link href={`/recetas/${linea.id}`} className="text-fucsia-600">
                      {linea.nombre}
                    </Link>
                  ) : (
                    <Link href={`/insumos/${linea.id}/editar`} className="text-zinc-900">
                      {linea.nombre}
                    </Link>
                  )}
                  <span className="text-xs text-zinc-400">
                    {formatCantidad(linea.cantidad)} {UNIDAD_LABELS_CORTAS[linea.unidad]}
                    {linea.tipo === "subreceta" && " · sub-receta"}
                    {linea.tipo === "insumo" &&
                      textoMarca(linea.marcaPreferida, linea.marcaAlternativa) &&
                      ` · ${textoMarca(linea.marcaPreferida, linea.marcaAlternativa)}`}
                    {linea.tipo === "insumo" &&
                      (linea.mermaPendiente
                        ? " · merma pendiente"
                        : linea.mermaPct
                          ? ` · merma ${linea.mermaPct} %`
                          : "")}
                  </span>
                </span>
                <span className={linea.costo === null ? "text-amber-600" : "text-zinc-700"}>
                  {linea.costo === null ? "Unidad incompatible" : formatGuaranies(linea.costo)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {usadaEn.length > 0 && (
        <p className="text-sm text-zinc-500">
          Se usa en: {usadaEn.map((r) => r.nombre).join(", ")}
        </p>
      )}

      <Link
        href={`/recetas/${receta.id}/editar`}
        className="w-full rounded-lg bg-fucsia-600 py-3 text-center text-base font-medium text-white"
      >
        Editar receta
      </Link>
    </div>
  );
}
