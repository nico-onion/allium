import { formatFechaCorta, formatHora } from "@/lib/format";
import type { MarcacionTipo } from "@/lib/supabase/database.types";

export type MarcacionParaHistorial = {
  id: string;
  tipo: MarcacionTipo;
  marcado_en: string;
  foto_url?: string | null;
  latitud?: number | null;
  longitud?: number | null;
};

export function HistorialMarcacionesTable({
  marcaciones,
  mostrarIndicadores = false,
}: {
  marcaciones: MarcacionParaHistorial[];
  mostrarIndicadores?: boolean;
}) {
  if (marcaciones.length === 0) {
    return <p className="text-sm text-zinc-400">Todavía no hay marcaciones.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Hora</th>
            {mostrarIndicadores && <th className="px-3 py-2">Foto</th>}
            {mostrarIndicadores && <th className="px-3 py-2">Ubicación</th>}
          </tr>
        </thead>
        <tbody>
          {marcaciones.map((marcacion) => (
            <tr key={marcacion.id} className="border-b border-zinc-100 last:border-0">
              <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                {formatFechaCorta(marcacion.marcado_en)}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    marcacion.tipo === "entrada"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {marcacion.tipo === "entrada" ? "Entrada" : "Salida"}
                </span>
              </td>
              <td className="px-3 py-2 text-zinc-900">
                {formatHora(marcacion.marcado_en)}
              </td>
              {mostrarIndicadores && (
                <td className="px-3 py-2 text-zinc-500">
                  {marcacion.foto_url ? "✓" : "-"}
                </td>
              )}
              {mostrarIndicadores && (
                <td className="px-3 py-2 text-zinc-500">
                  {marcacion.latitud != null && marcacion.longitud != null ? "✓" : "-"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
