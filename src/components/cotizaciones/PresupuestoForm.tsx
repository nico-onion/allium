"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { tipoLabel } from "@/lib/eventos/constants";
import { NO_INCLUYE_DEFAULT } from "@/lib/cotizaciones/constants";
import { ItemsPresupuestoFields } from "@/components/cotizaciones/ItemsPresupuestoFields";
import type { PresupuestoFormState } from "@/app/(app)/cotizaciones/actions";

type ClienteOption = { id: string; nombre: string };
type RecetaOption = { id: string; nombre: string };

const OTRO_TIPO = "__otro__";

export type PresupuestoFormValues = {
  cliente_id: string | null;
  fecha_emision: string;
  validez_dias: number;
  tipo_evento: string;
  fecha_evento: string | null;
  horario: string | null;
  lugar_direccion: string | null;
  cantidad_personas: number | null;
  incluye: string | null;
  no_incluye: string;
  items: { receta_id: string; cantidad: number; precio_unitario: number }[];
};

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none";
const labelClasses = "text-sm font-medium text-zinc-600";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

export function PresupuestoForm({
  clientes,
  recetas,
  tiposUsados,
  defaultValues,
  action,
  submitLabel,
}: {
  clientes: ClienteOption[];
  recetas: RecetaOption[];
  tiposUsados: string[];
  defaultValues?: PresupuestoFormValues;
  action: (
    prevState: PresupuestoFormState,
    formData: FormData,
  ) => Promise<PresupuestoFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [modoCliente, setModoCliente] = useState<"existente" | "nuevo">(
    defaultValues?.cliente_id || clientes.length > 0 ? "existente" : "nuevo",
  );

  const [tipoSeleccionado, setTipoSeleccionado] = useState(
    defaultValues?.tipo_evento ?? "",
  );
  const esTipoOtro = tipoSeleccionado === OTRO_TIPO;

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-col gap-2">
        <span className={labelClasses}>Cliente</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModoCliente("existente")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              modoCliente === "existente"
                ? "bg-bordo-600 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            Existente
          </button>
          <button
            type="button"
            onClick={() => setModoCliente("nuevo")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              modoCliente === "nuevo"
                ? "bg-bordo-600 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            Nuevo cliente
          </button>
        </div>
        <input type="hidden" name="modo_cliente" value={modoCliente} />

        {modoCliente === "existente" ? (
          <select
            name="cliente_id"
            defaultValue={defaultValues?.cliente_id ?? ""}
            required
            className={inputClasses}
          >
            <option value="" disabled>
              Seleccioná un cliente
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-3">
            <input
              name="cliente_nombre"
              placeholder="Nombre del cliente"
              required
              className={inputClasses}
            />
            <input
              name="cliente_telefono"
              placeholder="Teléfono (opcional)"
              className={inputClasses}
            />
            <input
              name="cliente_email"
              type="email"
              placeholder="Email (opcional)"
              className={inputClasses}
            />
            <input
              name="cliente_ruc_ci"
              placeholder="RUC o CI (opcional)"
              className={inputClasses}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="fecha_emision" className={labelClasses}>
            Fecha de emisión
          </label>
          <input
            id="fecha_emision"
            name="fecha_emision"
            type="date"
            defaultValue={defaultValues?.fecha_emision ?? hoy}
            required
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="validez_dias" className={labelClasses}>
            Válido por (días)
          </label>
          <input
            id="validez_dias"
            name="validez_dias"
            type="number"
            min={1}
            defaultValue={defaultValues?.validez_dias ?? 7}
            required
            className={inputClasses}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tipo_evento" className={labelClasses}>
          Tipo de evento
        </label>
        <select
          id="tipo_evento"
          name="tipo_evento_seleccionado"
          value={tipoSeleccionado}
          onChange={(e) => setTipoSeleccionado(e.target.value)}
          required
          className={inputClasses}
        >
          <option value="" disabled>
            Seleccioná un tipo
          </option>
          {tiposUsados.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipoLabel(tipo)}
            </option>
          ))}
          <option value={OTRO_TIPO}>+ Otro</option>
        </select>
        {esTipoOtro && (
          <input
            name="tipo_evento_nuevo"
            placeholder="Nombre del tipo nuevo"
            required
            className={inputClasses}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="fecha_evento" className={labelClasses}>
            Fecha del evento
          </label>
          <input
            id="fecha_evento"
            name="fecha_evento"
            type="date"
            defaultValue={defaultValues?.fecha_evento ?? ""}
            required
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="horario" className={labelClasses}>
            Horario
          </label>
          <input
            id="horario"
            name="horario"
            placeholder="Ej: 20:00hs"
            defaultValue={defaultValues?.horario ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="lugar_direccion" className={labelClasses}>
            Lugar / Dirección
          </label>
          <input
            id="lugar_direccion"
            name="lugar_direccion"
            defaultValue={defaultValues?.lugar_direccion ?? ""}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="cantidad_personas" className={labelClasses}>
            Cantidad de personas
          </label>
          <input
            id="cantidad_personas"
            name="cantidad_personas"
            type="number"
            min={1}
            defaultValue={defaultValues?.cantidad_personas ?? ""}
            required
            className={inputClasses}
          />
        </div>
      </div>

      <ItemsPresupuestoFields recetas={recetas} defaultItems={defaultValues?.items} />

      <div className="flex flex-col gap-2">
        <label htmlFor="incluye" className={labelClasses}>
          Incluye
        </label>
        <textarea
          id="incluye"
          name="incluye"
          rows={3}
          placeholder={"Un ítem por línea, ej:\nMesas y sillas\nVajilla completa"}
          defaultValue={defaultValues?.incluye ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="no_incluye" className={labelClasses}>
          No incluye
        </label>
        <textarea
          id="no_incluye"
          name="no_incluye"
          rows={4}
          defaultValue={defaultValues?.no_incluye ?? NO_INCLUYE_DEFAULT}
          className={inputClasses}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
