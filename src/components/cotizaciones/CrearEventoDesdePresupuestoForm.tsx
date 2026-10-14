"use client";

import { ConfirmarAccion } from "@/components/ui/ConfirmarAccion";

export function CrearEventoDesdePresupuestoForm({ action }: { action: () => Promise<void> }) {
  const boton = "w-full rounded-lg bg-bordo-600 py-3 text-base font-medium text-white";
  return (
    <ConfirmarAccion
      action={action}
      label="Crear evento a partir de esta cotización"
      pregunta="Se va a crear el evento confirmado, con su menú a partir de las recetas cotizadas."
      confirmar="Sí, crear el evento"
      pendiente="Creando evento..."
      className={boton}
      claseConfirmar={boton}
    />
  );
}
