import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrecargasSalida } from "@/lib/stock/salidas";
import { SalidaAlmacenForm } from "@/components/eventos/SalidaAlmacenForm";
import { registrarSalidaEvento } from "../../salida-actions";

export default async function SalidaAlmacenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: evento, error } = await supabase
    .from("eventos")
    .select("id, nombre, codigo")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!evento) notFound();

  const [insumos, precargas] = await Promise.all([
    supabase.from("insumos").select("id, nombre, unidad, stock_actual, costo_unitario").order("nombre"),
    getPrecargasSalida(supabase, evento.id),
  ]);
  if (insumos.error) throw new Error(insumos.error.message);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <div>
        <Link href={`/eventos/${evento.id}`} className="text-sm text-fucsia-600">
          ← {evento.codigo ? `${evento.codigo} · ` : ""}
          {evento.nombre}
        </Link>
        <h1 className="font-display text-xl font-semibold text-bordo-600">Salida de almacén</h1>
        <p className="text-sm text-zinc-500">
          Lo que sale del almacén para este evento, en la unidad de cada insumo. Sale al costo
          promedio de hoy y descuenta primero lo que vence antes.
        </p>
      </div>

      <SalidaAlmacenForm
        insumos={insumos.data.map((i) => ({
          ...i,
          stock_actual: Number(i.stock_actual),
          costo_unitario: Number(i.costo_unitario),
        }))}
        precargas={precargas}
        action={registrarSalidaEvento.bind(null, evento.id)}
      />
    </div>
  );
}
