"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { tipoLabel } from "@/lib/eventos/constants";
import { NO_INCLUYE_DEFAULT } from "@/lib/cotizaciones/constants";
import { calcularTotales, MARGEN_OBJETIVO_DEFAULT } from "@/lib/cotizaciones/margen";
import { ORIGEN_LABELS } from "@/lib/clientes/constants";
import { formatGuaranies } from "@/lib/format";
import {
  costoDeFila,
  filaVacia,
  ItemsPresupuestoFields,
  type FilaPresupuesto,
  type PersonalParaPresupuesto,
  type RecetaParaPresupuesto,
} from "@/components/cotizaciones/ItemsPresupuestoFields";
import type { PresupuestoFormState } from "@/app/(app)/cotizaciones/actions";
import type { PresupuestoItemCategoria } from "@/lib/supabase/database.types";

type ClienteOption = { id: string; nombre: string };
type ParametrosTipo = { tipo: string; margen_objetivo_pct: number; pct_imprevistos: number };

export type ItemInicial = {
  receta_id: string | null;
  descripcion: string | null;
  categoria: PresupuestoItemCategoria;
  personal_id: string | null;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number | null;
};

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
  margen_objetivo_pct: number | null;
  pct_imprevistos: number;
  items: ItemInicial[];
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

function filasDesdeItems(items: ItemInicial[] | undefined): FilaPresupuesto[] {
  if (!items || items.length === 0) return [filaVacia(0, "receta")];
  return items.map((item, i) => ({
    key: i,
    tipo: item.receta_id ? "receta" : "otro",
    receta_id: item.receta_id ?? "",
    descripcion: item.descripcion ?? "",
    categoria: item.categoria,
    personal_id: item.personal_id ?? "",
    cantidad: String(item.cantidad),
    precio_unitario: String(item.precio_unitario),
    costo: !item.receta_id && item.costo_unitario !== null ? String(item.costo_unitario) : "",
  }));
}

export function PresupuestoForm({
  clientes,
  recetas,
  personal,
  parametros,
  costosCongelados,
  tiposUsados,
  clienteInicial,
  defaultValues,
  action,
  submitLabel,
}: {
  // cliente preseleccionado al venir desde su ficha
  clienteInicial?: string;
  clientes: ClienteOption[];
  recetas: RecetaParaPresupuesto[];
  personal: PersonalParaPresupuesto[];
  parametros: ParametrosTipo[];
  // costo por receta de un presupuesto ya aceptado (se respeta al editar)
  costosCongelados?: [string, number][];
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

  const parametrosPorTipo = new Map(parametros.map((p) => [p.tipo, p]));
  const [margen, setMargen] = useState(
    String(
      defaultValues?.margen_objetivo_pct ??
        parametrosPorTipo.get(defaultValues?.tipo_evento ?? "")?.margen_objetivo_pct ??
        MARGEN_OBJETIVO_DEFAULT,
    ),
  );
  const [imprevistos, setImprevistos] = useState(
    String(defaultValues?.pct_imprevistos ?? 0),
  );
  const [invitados, setInvitados] = useState(
    defaultValues?.cantidad_personas ? String(defaultValues.cantidad_personas) : "",
  );
  const [filas, setFilas] = useState<FilaPresupuesto[]>(() =>
    filasDesdeItems(defaultValues?.items),
  );

  // Al elegir un tipo, se proponen su margen e imprevistos (editables).
  function elegirTipo(tipo: string) {
    setTipoSeleccionado(tipo);
    const params = parametrosPorTipo.get(tipo);
    setMargen(String(params?.margen_objetivo_pct ?? MARGEN_OBJETIVO_DEFAULT));
    setImprevistos(String(params?.pct_imprevistos ?? 0));
  }

  const margenNumero = Math.min(99, Math.max(0, Number(margen) || 0));
  const imprevistosNumero = Math.min(100, Math.max(0, Number(imprevistos) || 0));
  const congelados = new Map(costosCongelados ?? []);
  const recetasPorId = new Map(recetas.map((r) => [r.id, r]));
  const totales = calcularTotales(
    filas.map((fila) => ({
      cantidad: Number(fila.cantidad) || 0,
      precioUnitario: Number(fila.precio_unitario) || 0,
      costoUnitario: costoDeFila(fila, recetasPorId, congelados),
    })),
    imprevistosNumero,
    Number(invitados) || null,
  );

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
            defaultValue={defaultValues?.cliente_id ?? clienteInicial ?? ""}
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
            <div className="grid grid-cols-2 gap-2">
              <select name="cliente_tipo" defaultValue="persona" className={inputClasses}>
                <option value="persona">Persona</option>
                <option value="empresa">Empresa</option>
              </select>
              <select name="cliente_origen" defaultValue="" className={inputClasses}>
                <option value="">¿Cómo llegó?</option>
                {Object.entries(ORIGEN_LABELS).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
          onChange={(e) => elegirTipo(e.target.value)}
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
            value={invitados}
            onChange={(e) => setInvitados(e.target.value)}
            required
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="margen_objetivo_pct" className={labelClasses}>
            Margen objetivo (%)
          </label>
          <input
            id="margen_objetivo_pct"
            name="margen_objetivo_pct"
            type="number"
            min={0}
            max={99}
            step="any"
            value={margen}
            onChange={(e) => setMargen(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pct_imprevistos" className={labelClasses}>
            Imprevistos (%)
          </label>
          <input
            id="pct_imprevistos"
            name="pct_imprevistos"
            type="number"
            min={0}
            max={100}
            step="any"
            value={imprevistos}
            onChange={(e) => setImprevistos(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>
      <span className="-mt-3 text-xs text-zinc-400">
        Precios, costos y margen con IVA incluido. Imprevistos suma un colchón al costo; no se cobra
        como línea aparte.
      </span>

      <ItemsPresupuestoFields
        recetas={recetas}
        personal={personal}
        filas={filas}
        setFilas={setFilas}
        margenObjetivo={margenNumero}
        pctImprevistos={imprevistosNumero}
        congelados={congelados}
      />

      <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 px-3 py-3 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-zinc-600">Total a cobrar</span>
          <span className="font-display text-lg font-semibold text-bordo-600">
            {formatGuaranies(totales.precioTotal)}
          </span>
        </div>
        <div className="flex justify-between text-zinc-500">
          <span>
            Costo{totales.costoImprevistos > 0 ? " (con imprevistos)" : ""}
          </span>
          <span>{formatGuaranies(totales.costoTotal)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-zinc-600">Margen bruto</span>
          <span
            className={
              totales.margenPct !== null && totales.margenPct < margenNumero
                ? "text-amber-700"
                : "text-emerald-700"
            }
          >
            {formatGuaranies(totales.margenBruto)}
            {totales.margenPct !== null && ` · ${totales.margenPct.toFixed(1)} %`}
          </span>
        </div>
        {totales.costoPorInvitado !== null && (
          <div className="flex justify-between text-zinc-500">
            <span>Por invitado</span>
            <span>
              costo {formatGuaranies(totales.costoPorInvitado)} · precio{" "}
              {formatGuaranies(totales.precioPorInvitado)}
            </span>
          </div>
        )}
        {totales.lineasSinCosto > 0 && (
          <p className="text-xs text-amber-600">
            {totales.lineasSinCosto} línea(s) sin costo: el margen real va a ser menor.
          </p>
        )}
      </div>

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
