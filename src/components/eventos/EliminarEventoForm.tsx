"use client";

import { ConfirmarAccion } from "@/components/ui/ConfirmarAccion";

export function EliminarEventoForm({ action }: { action: () => Promise<void> }) {
  return (
    <ConfirmarAccion
      action={action}
      label="Borrar evento"
      pregunta="¿Seguro que querés borrar este evento? Esta acción no se puede deshacer."
      confirmar="Sí, borrar"
      pendiente="Borrando..."
      className="w-full rounded-lg border border-red-200 py-3 text-sm font-medium text-red-600"
      claseConfirmar="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white"
    />
  );
}
