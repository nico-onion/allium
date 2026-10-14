import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPersona, getEventosDePersona } from "@/lib/staff/queries";
import { getHistorialMarcaciones } from "@/lib/marcaciones/queries";
import { ROL_LABELS } from "@/lib/staff/constants";
import { ESTADO_BADGE_CLASSES, ESTADO_LABELS } from "@/lib/eventos/constants";
import { formatFecha, formatGuaranies } from "@/lib/format";
import { HistorialMarcacionesTable } from "@/components/marcaciones/HistorialMarcacionesTable";

export default async function PersonalDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const persona = await getPersona(supabase, id);

  if (!persona) notFound();

  const [turnos, marcaciones] = await Promise.all([
    getEventosDePersona(supabase, id),
    getHistorialMarcaciones(supabase, id),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          {persona.nombre}
        </h1>
        <span className="text-sm text-zinc-500">{ROL_LABELS[persona.rol]}</span>
      </div>

      {(persona.telefono || persona.costo_referencia !== null) && (
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          {persona.telefono && <span>{persona.telefono}</span>}
          {persona.costo_referencia !== null && (
            <span>
              Costo de referencia:{" "}
              <strong className="text-zinc-900">
                {formatGuaranies(Number(persona.costo_referencia))}
              </strong>{" "}
              por evento
            </span>
          )}
        </div>
      )}

      <Link
        href={`/staff/${persona.id}/editar`}
        className="w-full rounded-lg bg-fucsia-600 py-3 text-center text-base font-medium text-white"
      >
        Editar persona
      </Link>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">
          Eventos asignados
        </span>
        {turnos.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Todavía no está asignada a ningún evento.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {turnos.map((turno) =>
              turno.eventos ? (
                <Link
                  key={turno.id}
                  href={`/eventos/${turno.eventos.id}`}
                  className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-zinc-900">
                      {turno.eventos.nombre}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE_CLASSES[turno.eventos.estado]}`}
                    >
                      {ESTADO_LABELS[turno.eventos.estado]}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {turno.rol_en_evento} · {formatFecha(turno.eventos.fecha)}
                  </span>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={
                        turno.confirmado ? "text-emerald-600" : "text-amber-600"
                      }
                    >
                      {turno.confirmado ? "Confirmado" : "Sin confirmar"}
                    </span>
                    <span className="text-zinc-500">
                      {formatGuaranies(turno.costo)}
                      {turno.costo_referencia !== null &&
                        turno.costo !== null &&
                        Number(turno.costo) !== Number(turno.costo_referencia) && (
                          <span className="ml-1 text-xs text-zinc-400">
                            (ref. {formatGuaranies(Number(turno.costo_referencia))})
                          </span>
                        )}
                    </span>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">Marcaciones</span>
        <HistorialMarcacionesTable marcaciones={marcaciones} mostrarIndicadores />
      </div>
    </div>
  );
}
