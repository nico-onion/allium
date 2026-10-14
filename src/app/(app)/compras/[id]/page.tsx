import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompra } from "@/lib/compras/queries";
import { getEventosParaSelector } from "@/lib/eventos/queries";
import { GASTO_CATEGORIA_LABELS } from "@/lib/compras/constants";
import { categoriaGastoValida } from "@/lib/compras/registrar";
import { TASAS_IVA, TASA_IVA_LABELS, liquidacionIva, tasaIvaValida } from "@/lib/compras/iva";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad, formatFechaCorta, formatGuaranies } from "@/lib/format";
import { ItemsCompraTable } from "@/components/compras/ItemsCompraTable";
import { RevisionCompraForm } from "@/components/compras/RevisionCompraForm";
import { actualizarIvaCompra, descartarBorrador, resolverYConfirmarCompra } from "../revision-actions";

export default async function CompraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const compra = await getCompra(supabase, id);

  if (!compra) notFound();

  const esBorrador = compra.estado === "borrador";
  const iva = liquidacionIva(compra.lineas);

  const [insumos, eventos] = esBorrador
    ? await Promise.all([
        supabase.from("insumos").select("id, nombre, unidad").order("nombre"),
        getEventosParaSelector(supabase),
      ])
    : [null, []];
  if (insumos?.error) throw new Error(insumos.error.message);

  // El evento actual se ofrece aunque ya no esté en la lista de activos.
  const opcionesEvento =
    compra.evento && !eventos.some((evento) => evento.id === compra.evento?.id)
      ? [{ id: compra.evento.id, nombre: compra.evento.nombre, codigo: compra.evento.codigo }, ...eventos]
      : eventos;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          {compra.proveedorNombre ?? "Sin proveedor"}
        </h1>
        <span className="text-sm text-zinc-500">
          {formatFechaCorta(compra.fecha)}
          {compra.numeroFactura ? ` · Factura ${compra.numeroFactura}` : ""}
          {compra.rucProveedor ? ` · RUC ${compra.rucProveedor}` : ""}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
          {compra.total !== null && (
            <span className="font-medium text-bordo-600">{formatGuaranies(compra.total)}</span>
          )}
          {compra.evento && (
            <Link href={`/eventos/${compra.evento.id}`} className="text-fucsia-600">
              {compra.evento.codigo} · {compra.evento.nombre}
            </Link>
          )}
          {compra.comprobanteUrl && (
            <a
              href={compra.comprobanteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fucsia-600"
            >
              Ver comprobante
            </a>
          )}
        </div>
      </div>

      {esBorrador ? (
        <>
          <RevisionCompraForm
            lineas={compra.lineas}
            insumos={insumos?.data ?? []}
            eventos={opcionesEvento}
            eventoIdInicial={compra.eventoId}
            action={resolverYConfirmarCompra.bind(null, compra.id)}
          />
          <form action={descartarBorrador.bind(null, compra.id)}>
            <button type="submit" className="w-full py-2 text-sm text-zinc-400 underline">
              Descartar este borrador
            </button>
          </form>
        </>
      ) : (
        <>
          {compra.lineas.length > 0 && (
            <form action={actualizarIvaCompra.bind(null, compra.id)} className="flex flex-col gap-2">
              <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white text-sm">
                {compra.lineas.map((linea) => (
                  <li
                    key={linea.id}
                    className="flex items-start justify-between gap-2 border-b border-zinc-100 px-4 py-2 last:border-0"
                  >
                    <span className="flex flex-col">
                      <span className="text-zinc-900">{linea.descripcion}</span>
                      <span className="text-xs text-zinc-400">
                        {formatCantidad(linea.cantidad)} {UNIDAD_LABELS_CORTAS[linea.unidad]} ·{" "}
                        {linea.destino === "gasto"
                          ? `gasto: ${GASTO_CATEGORIA_LABELS[categoriaGastoValida(linea.categoria_gasto)]}`
                          : `insumo: ${linea.insumos?.nombre ?? "-"}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-zinc-700">{formatGuaranies(linea.subtotal)}</span>
                      <select
                        name={`iva_${linea.id}`}
                        defaultValue={tasaIvaValida(linea.tasa_iva)}
                        aria-label="Tasa de IVA"
                        className="rounded-md border border-zinc-200 bg-white px-1 py-0.5 text-xs text-zinc-600"
                      >
                        {TASAS_IVA.map((tasa) => (
                          <option key={tasa} value={tasa}>
                            IVA {TASA_IVA_LABELS[tasa]}
                          </option>
                        ))}
                      </select>
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="submit"
                className="self-end rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600"
              >
                Guardar IVA
              </button>
            </form>
          )}
          {compra.lineas.length > 0 && (
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-400">IVA 10 %</span>
                <span>{formatGuaranies(iva.iva10)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-400">IVA 5 %</span>
                <span>{formatGuaranies(iva.iva5)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-400">Exentas</span>
                <span>{formatGuaranies(iva.exentas)}</span>
              </div>
            </div>
          )}
          {compra.items.length > 0 && (
            <ItemsCompraTable items={compra.items} compraId={compra.id} />
          )}
        </>
      )}
    </div>
  );
}
