import { ROL_LABELS } from "@/lib/staff/constants";
import { formatGuaranies } from "@/lib/format";
import type { PersonalRol } from "@/lib/supabase/database.types";

export type TurnoParaLista = {
  id: string;
  rol_en_evento: string;
  costo: number | null;
  costo_referencia: number | null;
  confirmado: boolean;
  personal: { nombre: string; rol: PersonalRol } | null;
};

export function StaffAsignadoList({
  turnos,
  toggleConfirmadoAction,
  eliminarAction,
  actualizarCostoAction,
}: {
  turnos: TurnoParaLista[];
  toggleConfirmadoAction: (turnoId: string) => Promise<void>;
  eliminarAction: (turnoId: string) => Promise<void>;
  actualizarCostoAction: (turnoId: string, formData: FormData) => Promise<void>;
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
            <span className="text-xs text-zinc-500">{turno.rol_en_evento}</span>
            <form
              action={actualizarCostoAction.bind(null, turno.id)}
              className="mt-1 flex items-center gap-1"
            >
              <input
                name="costo"
                type="number"
                min={0}
                step="1"
                defaultValue={turno.costo === null ? "" : Number(turno.costo)}
                placeholder="Costo"
                aria-label="Costo acordado"
                className="w-28 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-900 focus:border-fucsia-400 focus:outline-none"
              />
              <button type="submit" className="text-xs font-medium text-fucsia-600">
                Guardar
              </button>
            </form>
            {turno.costo_referencia !== null && (
              <span className="text-xs text-zinc-400">
                Ref. {formatGuaranies(Number(turno.costo_referencia))}
                {turno.costo !== null &&
                  Number(turno.costo) !== Number(turno.costo_referencia) &&
                  ` · ${Number(turno.costo) < Number(turno.costo_referencia) ? "−" : "+"}${formatGuaranies(Math.abs(Number(turno.costo) - Number(turno.costo_referencia)))} vs referencia`}
              </span>
            )}
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
