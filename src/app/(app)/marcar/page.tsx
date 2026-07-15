import { createClient } from "@/lib/supabase/server";
import {
  getHistorialMarcaciones,
  getPersonaVinculada,
  getUltimaMarcacion,
} from "@/lib/marcaciones/queries";
import { MarcarForm } from "@/components/marcaciones/MarcarForm";
import { HistorialMarcacionesTable } from "@/components/marcaciones/HistorialMarcacionesTable";
import { formatHora } from "@/lib/format";
import { marcarAsistencia } from "./actions";

export default async function MarcarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <p className="text-center text-sm text-zinc-400">
          Necesitás iniciar sesión para marcar tu asistencia.
        </p>
      </div>
    );
  }

  const persona = await getPersonaVinculada(supabase, user.id);

  if (!persona) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <p className="max-w-xs text-center text-sm text-zinc-400">
          Tu cuenta no está asociada a ningún perfil de staff. Pedile a un
          administrador que vincule tu usuario desde /staff.
        </p>
      </div>
    );
  }

  const [ultimaMarcacion, historial] = await Promise.all([
    getUltimaMarcacion(supabase, persona.id),
    getHistorialMarcaciones(supabase, persona.id),
  ]);

  const estaDentro = ultimaMarcacion?.tipo === "entrada";
  const siguienteTipo = estaDentro ? "salida" : "entrada";

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          {persona.nombre}
        </h1>
        <p
          className={`mt-1 text-sm font-medium ${
            estaDentro ? "text-emerald-600" : "text-zinc-500"
          }`}
        >
          {estaDentro && ultimaMarcacion
            ? `Estás dentro desde las ${formatHora(ultimaMarcacion.marcado_en)}`
            : "Estás afuera"}
        </p>
      </div>

      <MarcarForm siguienteTipo={siguienteTipo} action={marcarAsistencia} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-600">
          Últimas marcaciones
        </span>
        <HistorialMarcacionesTable marcaciones={historial} />
      </div>
    </div>
  );
}
