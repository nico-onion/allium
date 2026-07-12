import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvento } from "@/lib/eventos/queries";
import { getOrdenCompra } from "@/lib/ordenes-compra/queries";
import { formatFecha } from "@/lib/format";
import { CierreEventoForm } from "@/components/eventos/CierreEventoForm";
import { OrdenCompraComparacionTable } from "@/components/eventos/OrdenCompraComparacionTable";
import { reconciliarCierreEvento } from "../../cierre-actions";

export default async function CerrarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const evento = await getEvento(supabase, id);

  if (!evento) notFound();

  const orden = await getOrdenCompra(supabase, id);
  if (!orden) {
    // No hay nada que reconciliar sin una orden de compra generada.
    redirect(`/eventos/${id}`);
  }

  if (orden.reconciliado) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Cierre del evento
        </h1>
        <p className="text-sm text-zinc-500">
          Este evento ya fue reconciliado
          {orden.reconciliadoEn ? ` el ${formatFecha(orden.reconciliadoEn)}` : ""}
          .
        </p>
        <OrdenCompraComparacionTable items={orden.items} />
        <Link
          href={`/eventos/${id}`}
          className="text-center text-sm text-zinc-500 underline-offset-2 hover:underline"
        >
          ← Volver al evento
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Cierre del evento
        </h1>
        <p className="text-sm text-zinc-500">{evento.nombre}</p>
      </div>
      <p className="text-sm text-zinc-400">
        Revisá cuánto se usó realmente de cada insumo (por defecto asume que
        se usó todo lo pedido). Al confirmar, se descuenta del stock según
        estas cantidades y el evento pasa a &quot;Realizado&quot;.
      </p>
      <CierreEventoForm
        items={orden.items}
        action={reconciliarCierreEvento.bind(null, evento.id)}
      />
    </div>
  );
}
