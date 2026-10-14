import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClientes } from "@/lib/clientes/queries";
import { ORIGEN_LABELS, TIPO_CLIENTE_LABELS } from "@/lib/clientes/constants";
import { formatGuaranies } from "@/lib/format";

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const todos = await getClientes(supabase);
  const busqueda = q?.trim() ? normalizar(q.trim()) : null;
  const clientes = busqueda
    ? todos.filter(
        (cliente) =>
          normalizar(cliente.nombre).includes(busqueda) ||
          (cliente.telefono ?? "").includes(busqueda),
      )
    : todos;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="shrink-0 rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nuevo
        </Link>
      </div>

      <form className="px-4 pt-3" action="/clientes">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o teléfono"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none"
        />
      </form>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        {clientes.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-400">
            {busqueda ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes."}
          </p>
        ) : (
          clientes.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-zinc-900">{cliente.nombre}</span>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {TIPO_CLIENTE_LABELS[cliente.tipo]}
                </span>
              </div>
              <span className="text-sm text-zinc-500">
                {cliente.cantidadPresupuestos} presupuesto
                {cliente.cantidadPresupuestos === 1 ? "" : "s"} · {cliente.cantidadEventos} evento
                {cliente.cantidadEventos === 1 ? "" : "s"}
                {cliente.origen && ` · ${ORIGEN_LABELS[cliente.origen]}`}
              </span>
              {cliente.totalVendido > 0 && (
                <span className="text-sm font-medium text-bordo-600">
                  {formatGuaranies(cliente.totalVendido)} vendido
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
