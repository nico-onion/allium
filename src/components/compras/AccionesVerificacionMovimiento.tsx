"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { verificarMovimientoStock } from "@/app/(app)/compras/verificacion-actions";

function BotonEnviar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-60"
    >
      {pending ? "..." : label}
    </button>
  );
}

export function AccionesVerificacionMovimiento({
  movimientoId,
  insumoId,
  compraId,
}: {
  movimientoId: string;
  insumoId: string;
  compraId: string;
}) {
  const action = verificarMovimientoStock.bind(null, movimientoId, insumoId, compraId);
  const [state, formAction] = useActionState(action, {});
  const [reportando, setReportando] = useState(false);

  if (reportando) {
    return (
      <form action={formAction} className="flex flex-col gap-2">
        <input
          name="nota_verificacion"
          placeholder="Describí la discrepancia (ej: faltaron 2 kg)"
          required
          autoFocus
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none"
        />
        <div className="flex gap-2">
          <BotonEnviar label="Confirmar discrepancia" />
          <button
            type="button"
            onClick={() => setReportando(false)}
            className="text-xs text-zinc-500 underline-offset-2 hover:underline"
          >
            Cancelar
          </button>
        </div>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <form action={formAction}>
          <BotonEnviar label="Recibido OK" />
        </form>
        <button
          type="button"
          onClick={() => setReportando(true)}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700"
        >
          Reportar discrepancia
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
