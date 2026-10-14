"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { TIPO_MOVIMIENTO_LABELS, TIPOS_MOVIMIENTO_MANUAL } from "@/lib/insumos/constants";
import type { MovimientoStockFormState } from "@/app/(app)/insumos/movimientos-actions";

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Cargar movimiento"}
    </button>
  );
}

export function MovimientoStockForm({
  action,
}: {
  action: (
    prevState: MovimientoStockFormState,
    formData: FormData,
  ) => Promise<MovimientoStockFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const [tipo, setTipo] = useState<(typeof TIPOS_MOVIMIENTO_MANUAL)[number]>("ajuste");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
          className={inputClasses}
        >
          {TIPOS_MOVIMIENTO_MANUAL.map((valor) => (
            <option key={valor} value={valor}>
              {TIPO_MOVIMIENTO_LABELS[valor]}
            </option>
          ))}
        </select>
        <input
          name="cantidad"
          type="number"
          min={0}
          step="any"
          placeholder="Cantidad"
          required
          className={inputClasses}
        />
      </div>

      {tipo === "ajuste" && (
        <div className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
            <input type="radio" name="direccion" value="sumar" defaultChecked />
            Sumar al stock
          </label>
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
            <input type="radio" name="direccion" value="restar" />
            Restar del stock
          </label>
        </div>
      )}
      {tipo === "ajuste" && (
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Vencimiento (si sumás stock)
          <input name="fecha_vencimiento" type="date" className={inputClasses} />
        </label>
      )}

      <input
        name="nota"
        placeholder="Nota (opcional)"
        className={inputClasses}
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
