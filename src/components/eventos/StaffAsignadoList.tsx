import { ROL_LABELS } from "@/lib/staff/constants";
import { formatGuaranies } from "@/lib/format";
import type { PersonalRol } from "@/lib/supabase/database.types";

export type TurnoParaLista = {
  id: string;
  rol_en_evento: string;
  costo: number | null;
  confirmado: boolean;
  personal: { nombre: string; rol: PersonalRol } | null;
};

export function StaffAsignadoList({
  turnos,
  toggleConfirmadoAction,
  eliminarAction,
}: {
  turnos: TurnoParaLista[];
  toggleConfirmadoAction: (turnoId: string) => Promise<void>;
  eliminarAction: (turnoId: string) => Promise<void>;
}) {
  if (turnos.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        Todavía no asignaste a nadie a este evento.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
      {turnos.map((turno) => (
        <li
          key={turno.id}
          className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 last:border-0 last:pb-0"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-900">
              {turno.personal?.nombre ?? "Persona"}
              {turno.personal && (
                <span className="ml-1 text-xs font-normal text-zinc-400">
                  ({ROL_LABELS[turno.personal.rol]})
                </span>
              )}
            </span>
            <span className="text-xs text-zinc-500">
              {turno.rol_en_evento} · {formatGuaranies(turno.costo)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <form action={toggleConfirmadoAction.bind(null, turno.id)}>
              <button
                type="submit"
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  turno.confirmado
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 active:bg-emerald-100"
                    : "border-amber-300 bg-white text-amber-700 active:bg-amber-50"
                }`}
              >
                {turno.confirmado ? "✓ Confirmado" : "Confirmar"}
              </button>
            </form>
            <form action={eliminarAction.bind(null, turno.id)}>
              <button
                type="submit"
                className="px-1 text-zinc-400"
                aria-label="Quitar asignación"
              >
                ✕
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
