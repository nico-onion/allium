"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { GASTO_CATEGORIA_LABELS, GASTO_CATEGORIAS } from "@/lib/compras/constants";
import type { CicloFormState } from "@/app/(app)/eventos/ciclo-actions";

type Action = (prev: CicloFormState, formData: FormData) => Promise<CicloFormState>;

const inputClasses =
  "w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-fucsia-400 focus:outline-none";

function hoy() {
  // fecha local de Paraguay, no UTC
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Asuncion" }).format(new Date());
}

function Enviar({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "w-full rounded-lg bg-fucsia-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      }
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

// Formulario plegado detrás de un botón; se limpia y se cierra al guardar.
function Plegable({
  titulo,
  action,
  children,
}: {
  titulo: string;
  action: Action;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(async (prev: CicloFormState, formData: FormData) => {
    const resultado = await action(prev, formData);
    if (resultado.ok) {
      formRef.current?.reset();
      setAbierto(false);
    }
    return resultado;
  }, {});

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-600"
      >
        + {titulo}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3"
    >
      {children}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Enviar label="Guardar" />
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="px-3 text-sm text-zinc-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function CobroForm({ action, saldo }: { action: Action; saldo: number | null }) {
  return (
    <Plegable titulo="Registrar cobro" action={action}>
      <div className="grid grid-cols-2 gap-2">
        <select name="tipo" defaultValue={saldo === null ? "sena" : "saldo"} className={inputClasses} aria-label="Tipo de cobro">
          <option value="sena">Seña</option>
          <option value="saldo">Saldo</option>
          <option value="otro">Otro</option>
        </select>
        <select name="medio" defaultValue="transferencia" className={inputClasses} aria-label="Medio de pago">
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="qr">QR</option>
          <option value="otro">Otro</option>
        </select>
        <input
          name="monto"
          inputMode="numeric"
          required
          placeholder="Monto"
          defaultValue={saldo ? String(saldo) : ""}
          aria-label="Monto"
          className={inputClasses}
        />
        <input name="fecha" type="date" defaultValue={hoy()} aria-label="Fecha" className={inputClasses} />
      </div>
      <input name="comprobante" placeholder="N° de comprobante / transferencia" className={inputClasses} />
      <input name="nota" placeholder="Nota (opcional)" className={inputClasses} />
    </Plegable>
  );
}

export function FacturaVentaForm({ action, monto }: { action: Action; monto: number | null }) {
  return (
    <Plegable titulo="Registrar factura" action={action}>
      <input name="numero" required placeholder="N° de factura (001-001-0000123)" className={inputClasses} />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="monto"
          inputMode="numeric"
          required
          placeholder="Monto"
          defaultValue={monto ? String(monto) : ""}
          aria-label="Monto facturado"
          className={inputClasses}
        />
        <input name="fecha" type="date" defaultValue={hoy()} aria-label="Fecha" className={inputClasses} />
      </div>
    </Plegable>
  );
}

export function GastoEventoForm({ action }: { action: Action }) {
  return (
    <Plegable titulo="Agregar gasto sin factura" action={action}>
      <input name="descripcion" required placeholder="Ej. carbón, hielo, flete" className={inputClasses} />
      <div className="grid grid-cols-2 gap-2">
        <select name="categoria" defaultValue="imprevisto" className={inputClasses} aria-label="Categoría">
          {GASTO_CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {GASTO_CATEGORIA_LABELS[categoria]}
            </option>
          ))}
        </select>
        <input name="monto" inputMode="numeric" required placeholder="Monto" aria-label="Monto" className={inputClasses} />
      </div>
      <input name="fecha" type="date" defaultValue={hoy()} aria-label="Fecha" className={inputClasses} />
    </Plegable>
  );
}

export function CerrarEventoForm({ action, listo }: { action: Action; listo: boolean }) {
  const [state, formAction] = useActionState(action, {});
  const [forzar, setForzar] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {!listo && (
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            name="forzar"
            value="true"
            checked={forzar}
            onChange={(e) => setForzar(e.target.checked)}
          />
          Cerrar igual aunque falten pasos
        </label>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Enviar
        label="Cerrar evento"
        className={`w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 ${
          listo || forzar ? "bg-bordo-600 text-white" : "bg-zinc-100 text-zinc-400"
        }`}
      />
    </form>
  );
}

export function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const timer = setTimeout(() => setCopiado(false), 1500);
    return () => clearTimeout(timer);
  }, [copiado]);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(codigo).then(() => setCopiado(true), () => {});
      }}
      className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600"
      title="Copiar código para el caption de WhatsApp"
    >
      {copiado ? "¡Copiado!" : codigo}
    </button>
  );
}
