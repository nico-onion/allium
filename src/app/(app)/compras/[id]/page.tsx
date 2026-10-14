import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompra } from "@/lib/compras/queries";
import { getEventosParaSelector } from "@/lib/eventos/queries";
import { GASTO_CATEGORIA_LABELS } from "@/lib/compras/constants";
import { categoriaGastoValida } from "@/lib/compras/registrar";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import { formatCantidad, formatFechaCorta, formatGuaranies } from "@/lib/format";
import { ItemsCompraTable } from "@/components/compras/ItemsCompraTable";
import { RevisionCompraForm } from "@/components/compras/RevisionCompraForm";
import { descartarBorrador, resolverYConfirmarCompra } from "../revision-actions";

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
                  <span className="text-zinc-700">{formatGuaranies(linea.subtotal)}</span>
                </li>
              ))}
            </ul>
          )}
          {compra.items.length > 0 && (
            <ItemsCompraTable items={compra.items} compraId={compra.id} />
          )}
        </>
      )}
    </div>
  );
}
