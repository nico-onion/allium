"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ItemsCompraFields } from "@/components/compras/ItemsCompraFields";
import type { CompraFormState } from "@/app/(app)/compras/actions";
import type { InsumoUnidad } from "@/lib/supabase/database.types";

type ProveedorOption = { id: string; nombre: string };
type EventoOption = { id: string; nombre: string; codigo: string | null; fecha: string };
type InsumoOption = {
  id: string;
  nombre: string;
  unidad: InsumoUnidad;
  costo_unitario: number;
};

const inputClasses =
  "rounded-lg border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-fucsia-400 focus:outline-none";
const labelClasses = "text-sm font-medium text-zinc-600";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Crear compra"}
    </button>
  );
}

export function CompraForm({
  proveedores,
  insumos,
  eventos,
  eventoIdInicial,
  action,
}: {
  proveedores: ProveedorOption[];
  eventos: EventoOption[];
  eventoIdInicial?: string;
  insumos: InsumoOption[];
  action: (
    prevState: CompraFormState,
    formData: FormData,
  ) => Promise<CompraFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const [modoProveedor, setModoProveedor] = useState<"existente" | "nuevo">(
    proveedores.length > 0 ? "existente" : "nuevo",
  );
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="evento_id" className={labelClasses}>
          Evento
        </label>
        <select id="evento_id" name="evento_id" defaultValue={eventoIdInicial ?? ""} className={inputClasses}>
          <option value="">Sin evento (compra general)</option>
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.codigo ? `${evento.codigo} · ` : ""}
              {evento.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClasses}>Proveedor</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModoProveedor("existente")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              modoProveedor === "existente"
                ? "bg-bordo-600 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            Existente
          </button>
          <button
            type="button"
            onClick={() => setModoProveedor("nuevo")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              modoProveedor === "nuevo"
                ? "bg-bordo-600 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            Nuevo proveedor
          </button>
        </div>
        <input type="hidden" name="modo_proveedor" value={modoProveedor} />

        {modoProveedor === "existente" ? (
          proveedores.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No hay proveedores cargados. Podés dejar esto sin asignar o
              crear uno nuevo.
            </p>
          ) : (
            <select name="proveedor_id" defaultValue="" className={inputClasses}>
              <option value="">Sin proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          )
        ) : (
          <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-3">
            <input
              name="proveedor_nombre"
              placeholder="Nombre del proveedor"
              required
              className={inputClasses}
            />
            <input
              name="proveedor_contacto"
              placeholder="Contacto (opcional)"
              className={inputClasses}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="fecha" className={labelClasses}>
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={hoy}
            required
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="numero_factura" className={labelClasses}>
            N° de factura
          </label>
          <input
            id="numero_factura"
            name="numero_factura"
            placeholder="Opcional"
            className={inputClasses}
          />
        </div>
      </div>

      <ItemsCompraFields insumos={insumos} />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
