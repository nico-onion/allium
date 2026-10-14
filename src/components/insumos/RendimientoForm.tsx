"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { RendimientoFormState } from "@/app/(app)/insumos/rendimientos-actions";

const inputClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Guardar prueba"}
    </button>
  );
}

function aNumero(texto: string): number {
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Calculadora de mermas: pesar el producto antes de limpiarlo, pesar lo que
// se descarta y anotar si algo de eso se aprovecha (ej. recortes para un
// fondo). Muestra el resultado antes de guardar.
export function RendimientoForm({
  action,
}: {
  action: (
    prevState: RendimientoFormState,
    formData: FormData,
  ) => Promise<RendimientoFormState>;
}) {
  const [inicial, setInicial] = useState("");
  const [perdida, setPerdida] = useState("");
  const [aprovechado, setAprovechado] = useState("");

  // Al guardar bien, se vacían los pesos para cargar la próxima prueba (los
  // campos no controlados, fecha y nota, los vacía React solo).
  const [state, formAction] = useActionState(
    async (prevState: RendimientoFormState, formData: FormData) => {
      const resultado = await action(prevState, formData);
      if (resultado.ok) {
        setInicial("");
        setPerdida("");
        setAprovechado("");
      }
      return resultado;
    },
    {},
  );

  const pesoInicial = aNumero(inicial);
  const pesoPerdida = aNumero(perdida);
  const pesoAprovechado = aNumero(aprovechado);
  const valido =
    pesoInicial > 0 && pesoPerdida <= pesoInicial && pesoAprovechado <= pesoPerdida;
  const merma = valido ? ((pesoPerdida - pesoAprovechado) / pesoInicial) * 100 : null;
  const factor = merma !== null ? 1 - merma / 100 : null;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Peso inicial
          <input
            name="peso_inicial"
            inputMode="decimal"
            required
            value={inicial}
            onChange={(e) => setInicial(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Pérdida limpieza
          <input
            name="peso_perdida"
            inputMode="decimal"
            required
            value={perdida}
            onChange={(e) => setPerdida(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Aprovechado
          <input
            name="peso_aprovechado"
            inputMode="decimal"
            placeholder="0"
            value={aprovechado}
            onChange={(e) => setAprovechado(e.target.value)}
            className={inputClasses}
          />
        </label>
      </div>
      <span className="text-xs text-zinc-400">
        Los tres pesos en la misma unidad (g o kg, la de la balanza).
      </span>

      <div className="grid grid-cols-2 gap-2">
        <input name="fecha" type="date" className={inputClasses} />
        <input name="nota" placeholder="Nota (opcional)" className={inputClasses} />
      </div>

      {merma !== null && (
        <div className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
          <span className="text-zinc-500">
            Merma <strong className="text-zinc-900">{merma.toFixed(1)} %</strong>
          </span>
          <span className="text-zinc-500">
            Rendimiento <strong className="text-zinc-900">{factor!.toFixed(2)}</strong>
          </span>
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
