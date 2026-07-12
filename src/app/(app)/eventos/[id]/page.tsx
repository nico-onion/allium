import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEvento,
  getMenuDeEvento,
  getMenuItems,
  getRecetaInsumosDeRecetas,
  getRecetasParaSelector,
} from "@/lib/eventos/queries";
import { getInsumosParaSelector } from "@/lib/insumos/queries";
import { calcularPackingList } from "@/lib/eventos/packing-list";
import { getOrdenCompra } from "@/lib/ordenes-compra/queries";
import {
  ESTADO_ACCION_RAPIDA_CLASSES,
  ESTADO_ACCION_RAPIDA_LABELS,
  ESTADO_BADGE_CLASSES,
  ESTADO_LABELS,
  TIPO_LABELS,
} from "@/lib/eventos/constants";
import { formatFecha, formatGuaranies } from "@/lib/format";
import { EstadoRapidoBoton } from "@/components/eventos/EstadoRapidoBoton";
import { EliminarEventoForm } from "@/components/eventos/EliminarEventoForm";
import { CrearMenuForm } from "@/components/eventos/CrearMenuForm";
import { AgregarAlMenuForm } from "@/components/eventos/AgregarAlMenuForm";
import { PackingListTable } from "@/components/eventos/PackingListTable";
import { RegenerarOrdenCompraBoton } from "@/components/eventos/RegenerarOrdenCompraBoton";
import { EnviarOrdenPorEmailForm } from "@/components/eventos/EnviarOrdenPorEmailForm";
import {
  cambiarEstadoEvento,
  eliminarEvento,
  regenerarOrdenCompra,
} from "../actions";
import { enviarOrdenCompraPorEmail } from "../email-actions";
import {
  actualizarCantidadMenuItem,
  agregarRecetaAlMenu,
  crearMenu,
  crearRecetaYAgregarAlMenu,
  eliminarMenuItem,
} from "../menu-actions";
import type { EventoEstado } from "@/lib/supabase/database.types";

const ACCIONES_RAPIDAS = Object.keys(
  ESTADO_ACCION_RAPIDA_LABELS,
) as EventoEstado[];

function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span className="text-base text-zinc-900">{value}</span>
    </div>
  );
}

export default async function EventoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const evento = await getEvento(supabase, id);

  if (!evento) notFound();

  const menu = await getMenuDeEvento(supabase, evento.id);
  const menuItems = menu ? await getMenuItems(supabase, menu.id) : [];
  const recetaInsumos = menu
    ? await getRecetaInsumosDeRecetas(
        supabase,
        [...new Set(menuItems.map((item) => item.receta_id))],
      )
    : [];
  const packingList = calcularPackingList(menuItems, recetaInsumos);
  const ordenCompra = await getOrdenCompra(supabase, evento.id);

  const [recetas, insumos] = await Promise.all([
    getRecetasParaSelector(supabase),
    getInsumosParaSelector(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-bordo-600">
            {evento.nombre}
          </h1>
          <span className="text-sm text-zinc-500">
            {evento.clientes?.nombre ?? "Sin cliente"}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ESTADO_BADGE_CLASSES[evento.estado]}`}
        >
          {ESTADO_LABELS[evento.estado]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
        <Campo label="Tipo" value={TIPO_LABELS[evento.tipo]} />
        <Campo label="Fecha" value={formatFecha(evento.fecha)} />
        <Campo label="Invitados" value={evento.invitados} />
        <Campo label="Ubicación" value={evento.ubicacion ?? "-"} />
        <Campo
          label="Precio por persona"
          value={formatGuaranies(evento.precio_por_persona)}
        />
        <Campo label="Precio total" value={formatGuaranies(evento.precio_total)} />
        <Campo
          label="Margen objetivo"
          value={
            evento.margen_objetivo !== null ? `${evento.margen_objetivo}%` : "-"
          }
        />
        <Campo
          label="Cotización"
          value={
            evento.link_cotizacion ? (
              <a
                href={evento.link_cotizacion}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fucsia-600 underline-offset-2 hover:underline"
              >
                Ver cotización
              </a>
            ) : (
              "-"
            )
          }
        />
      </div>

      <Link
        href={`/eventos/${evento.id}/editar`}
        className="w-full rounded-lg bg-fucsia-600 py-3 text-center text-base font-medium text-white"
      >
        Editar evento
      </Link>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-bordo-600">
          Menú
        </h2>

        {!menu ? (
          <CrearMenuForm action={crearMenu.bind(null, evento.id)} />
        ) : (
          <>
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
              <span className="text-sm font-medium text-zinc-600">
                {menu.nombre}
              </span>
              {menuItems.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  Todavía no agregaste recetas a este menú.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {menuItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-zinc-900">
                        {item.recetas?.nombre ?? "Receta"}
                      </span>
                      <div className="flex items-center gap-2">
                        <form
                          action={actualizarCantidadMenuItem.bind(
                            null,
                            evento.id,
                            item.id,
                          )}
                          className="flex items-center gap-1"
                        >
                          <input
                            name="cantidad_porciones"
                            type="number"
                            min={1}
                            defaultValue={item.cantidad_porciones}
                            className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                          />
                          <button
                            type="submit"
                            className="text-xs text-zinc-500 underline-offset-2 hover:underline"
                          >
                            Guardar
                          </button>
                        </form>
                        <form
                          action={eliminarMenuItem.bind(
                            null,
                            evento.id,
                            item.id,
                          )}
                        >
                          <button
                            type="submit"
                            className="px-1 text-zinc-400"
                            aria-label="Quitar receta del menú"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <AgregarAlMenuForm
              recetas={recetas}
              insumos={insumos}
              cantidadPorDefecto={evento.invitados}
              agregarExistenteAction={agregarRecetaAlMenu.bind(
                null,
                evento.id,
                menu.id,
              )}
              crearNuevaAction={crearRecetaYAgregarAlMenu.bind(
                null,
                evento.id,
                menu.id,
              )}
            />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-600">
                Lista de compras
              </span>
              <PackingListTable items={packingList} />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-bordo-600">
            Orden de compra
          </h2>
          <p className="text-xs text-zinc-400">
            Es una foto del packing list al momento de confirmar el evento —
            no se actualiza sola si el menú cambia después.
          </p>
        </div>

        {!ordenCompra ? (
          <p className="text-sm text-zinc-400">
            Todavía no se generó una orden de compra. Se genera sola al
            marcar el evento como confirmado, o podés generarla ahora con el
            menú actual.
          </p>
        ) : (
          <>
            <span className="text-xs text-zinc-400">
              Generada el {formatFecha(ordenCompra.generadaEn)}
            </span>
            <PackingListTable items={ordenCompra.items} />
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <RegenerarOrdenCompraBoton
            action={regenerarOrdenCompra.bind(null, evento.id)}
            label={ordenCompra ? "Regenerar orden de compra" : "Generar orden de compra"}
          />
          {ordenCompra && (
            <EnviarOrdenPorEmailForm
              action={enviarOrdenCompraPorEmail.bind(null, evento.id)}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-400">
          Cambiar estado
        </span>
        <div className="flex gap-2">
          {ACCIONES_RAPIDAS.filter((estado) => estado !== evento.estado).map(
            (estado) => (
              <form
                key={estado}
                action={cambiarEstadoEvento.bind(null, evento.id, estado)}
                className="flex-1"
              >
                <EstadoRapidoBoton
                  label={ESTADO_ACCION_RAPIDA_LABELS[estado]!}
                  className={ESTADO_ACCION_RAPIDA_CLASSES[estado]!}
                />
              </form>
            ),
          )}
        </div>
      </div>

      <EliminarEventoForm action={eliminarEvento.bind(null, evento.id)} />
    </div>
  );
}
