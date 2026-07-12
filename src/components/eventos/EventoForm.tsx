"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { TIPO_OPTIONS, ESTADO_OPTIONS } from "@/lib/eventos/constants";
import { toDatetimeLocalValue } from "@/lib/format";
import type { EventoFormState } from "@/app/(app)/eventos/actions";
import type {
  EventoEstado,
  EventoTipo,
} from "@/lib/supabase/database.types";

type ClienteOption = { id: string; nombre: string };

export type EventoFormValues = {
  cliente_id: string;
  nombre: string;
  tipo: EventoTipo;
  fecha: string;
  invitados: number;
  estado: EventoEstado;
  ubicacion: string | null;
  precio_por_persona: number | null;
  precio_total: number | null;
  margen_objetivo: number | null;
  link_cotizacion: string | null;
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

export function EventoForm({
  clientes,
  defaultValues,
  action,
  submitLabel,
}: {
  clientes: ClienteOption[];
  defaultValues?: EventoFormValues;
  action: (
    prevState: EventoFormState,
    formData: FormData,
  ) => Promise<EventoFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [modoCliente, setModoCliente] = useState<"existente" | "nuevo">(
    defaultValues?.cliente_id || clientes.length > 0 ? "existente" : "nuevo",
  );

  const [invitados, setInvitados] = useState(
    defaultValues?.invitados?.toString() ?? "",
  );
  const [precioPorPersona, setPrecioPorPersona] = useState(
    defaultValues?.precio_por_persona?.toString() ?? "",
  );
  const [precioTotal, setPrecioTotal] = useState(
    defaultValues?.precio_total?.toString() ?? "",
  );
  const [precioTotalManual, setPrecioTotalManual] = useState(false);

  function recalcularPrecioTotal(nuevosInvitados: string, nuevoPrecioPorPersona: string) {
    const inv = Number(nuevosInvitados);
    const ppp = Number(nuevoPrecioPorPersona);
    if (inv > 0 && ppp > 0) {
      setPrecioTotal(String(inv * ppp));
    }
  }

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
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="nombre" className={labelClasses}>
          Nombre del evento
        </label>
        <input
          id="nombre"
          name="nombre"
          defaultValue={defaultValues?.nombre}
          required
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="tipo" className={labelClasses}>
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={defaultValues?.tipo}
            required
            className={inputClasses}
          >
            {TIPO_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="estado" className={labelClasses}>
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            defaultValue={defaultValues?.estado ?? "cotizado"}
            required
            className={inputClasses}
          >
            {ESTADO_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="fecha" className={labelClasses}>
          Fecha y hora
        </label>
        <input
          id="fecha"
          name="fecha"
          type="datetime-local"
          defaultValue={
            defaultValues ? toDatetimeLocalValue(defaultValues.fecha) : undefined
          }
          required
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="invitados" className={labelClasses}>
            Invitados
          </label>
          <input
            id="invitados"
            name="invitados"
            type="number"
            min={0}
            value={invitados}
            onChange={(e) => {
              setInvitados(e.target.value);
              if (!precioTotalManual) {
                recalcularPrecioTotal(e.target.value, precioPorPersona);
              }
            }}
            required
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="ubicacion" className={labelClasses}>
            Ubicación
          </label>
          <input
            id="ubicacion"
            name="ubicacion"
            defaultValue={defaultValues?.ubicacion ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="precio_por_persona" className={labelClasses}>
            Precio por persona (Gs.)
          </label>
          <input
            id="precio_por_persona"
            name="precio_por_persona"
            type="number"
            min={0}
            step="1"
            value={precioPorPersona}
            onChange={(e) => {
              setPrecioPorPersona(e.target.value);
              if (!precioTotalManual) {
                recalcularPrecioTotal(invitados, e.target.value);
              }
            }}
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="precio_total" className={labelClasses}>
            Precio total (Gs.)
          </label>
          <input
            id="precio_total"
            name="precio_total"
            type="number"
            min={0}
            step="1"
            value={precioTotal}
            onChange={(e) => {
              setPrecioTotal(e.target.value);
              setPrecioTotalManual(true);
            }}
            className={inputClasses}
          />
          <span className="text-xs text-zinc-400">
            {precioTotalManual
              ? "Editado manualmente."
              : "Se calcula solo: invitados × precio por persona."}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="margen_objetivo" className={labelClasses}>
          Margen objetivo (%)
        </label>
        <input
          id="margen_objetivo"
          name="margen_objetivo"
          type="number"
          min={0}
          step="0.1"
          defaultValue={defaultValues?.margen_objetivo ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="link_cotizacion" className={labelClasses}>
          Link de la cotización
        </label>
        <input
          id="link_cotizacion"
          name="link_cotizacion"
          type="url"
          placeholder="https://drive.google.com/..."
          defaultValue={defaultValues?.link_cotizacion ?? ""}
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
