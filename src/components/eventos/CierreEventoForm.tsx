"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UNIDAD_LABELS_CORTAS } from "@/lib/insumos/constants";
import type { OrdenCompraItem } from "@/lib/ordenes-compra/queries";
import type { CierreFormState } from "@/app/(app)/eventos/cierre-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? "Confirmando..." : "Confirmar cierre"}
    </button>
  );
}

export function CierreEventoForm({
  items,
  action,
}: {
  items: OrdenCompraItem[];
  action: (
    prevState: CierreFormState,
    formData: FormData,
  ) => Promise<CierreFormState>;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 last:border-0 last:pb-0"
          >
            <input type="hidden" name="item_id" value={item.id} />
            <div className="flex flex-col">
              <span className="text-sm text-zinc-900">{item.insumoNombre}</span>
              <span className="text-xs text-zinc-400">
                Pedido: {item.cantidad} {UNIDAD_LABELS_CORTAS[item.unidad]}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input
                name="cantidad_usada"
                type="number"
                min={0}
                step="any"
                defaultValue={item.cantidad}
                required
                className="w-20 rounded-lg border border-zinc-200 px-2 py-1 text-right text-sm"
              />
              <span className="text-xs text-zinc-400">
                {UNIDAD_LABELS_CORTAS[item.unidad]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
