"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { TIPO_ALMACENAMIENTO_OPTIONS, UNIDAD_OPTIONS } from "@/lib/insumos/constants";
import type { InsumoFormState } from "@/app/(app)/insumos/actions";
import type {
  InsumoTipoAlmacenamiento,
  InsumoUnidad,
} from "@/lib/supabase/database.types";

type ProveedorOption = { id: string; nombre: string };

export type InsumoFormValues = {
  nombre: string;
  categoria: string | null;
  unidad: InsumoUnidad;
  tipo_almacenamiento: InsumoTipoAlmacenamiento | null;
  costo_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  proveedor_id: string | null;
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

export function InsumoForm({
  proveedores,
  defaultValues,
  action,
  submitLabel,
}: {
  proveedores: ProveedorOption[];
  defaultValues?: InsumoFormValues;
  action: (
    prevState: InsumoFormState,
    formData: FormData,
  ) => Promise<InsumoFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [modoProveedor, setModoProveedor] = useState<"existente" | "nuevo">(
    defaultValues?.proveedor_id || proveedores.length > 0
      ? "existente"
      : "nuevo",
  );

  return (
    <form action={formAction} className="flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="nombre" className={labelClasses}>
          Nombre del insumo
        </label>
        <input
          id="nombre"
          name="nombre"
          defaultValue={defaultValues?.nombre}
          required
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="categoria" className={labelClasses}>
          Categoría
        </label>
        <input
          id="categoria"
          name="categoria"
          placeholder="Ej: Carnes, Verduras, Lácteos (opcional)"
          defaultValue={defaultValues?.categoria ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tipo_almacenamiento" className={labelClasses}>
          Tipo de almacenamiento
        </label>
        <select
          id="tipo_almacenamiento"
          name="tipo_almacenamiento"
          defaultValue={defaultValues?.tipo_almacenamiento ?? ""}
          className={inputClasses}
        >
          <option value="">Sin especificar</option>
          {TIPO_ALMACENAMIENTO_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="unidad" className={labelClasses}>
            Unidad
          </label>
          <select
            id="unidad"
            name="unidad"
            defaultValue={defaultValues?.unidad ?? ""}
            required
            className={inputClasses}
          >
            <option value="" disabled>
              Seleccioná unidad
            </option>
            {UNIDAD_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="costo_unitario" className={labelClasses}>
            Costo unitario (Gs.)
          </label>
          <input
            id="costo_unitario"
            name="costo_unitario"
            type="number"
            min={0}
            step="1"
            defaultValue={defaultValues?.costo_unitario ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="stock_actual" className={labelClasses}>
            Stock actual
          </label>
          <input
            id="stock_actual"
            name="stock_actual"
            type="number"
            min={0}
            step="any"
            defaultValue={defaultValues?.stock_actual ?? ""}
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="stock_minimo" className={labelClasses}>
            Stock mínimo
          </label>
          <input
            id="stock_minimo"
            name="stock_minimo"
            type="number"
            min={0}
            step="any"
            defaultValue={defaultValues?.stock_minimo ?? ""}
            className={inputClasses}
          />
        </div>
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
            <select
              name="proveedor_id"
              defaultValue={defaultValues?.proveedor_id ?? ""}
              className={inputClasses}
            >
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

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
