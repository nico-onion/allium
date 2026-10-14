import Link from "next/link";
import { GASTO_CATEGORIA_LABELS } from "@/lib/compras/constants";
import { categoriaGastoValida } from "@/lib/compras/registrar";
import type { CicloEvento, resumenCiclo } from "@/lib/eventos/ciclo";
import { formatFechaCorta, formatGuaranies } from "@/lib/format";
import {
  CerrarEventoForm,
  CobroForm,
  FacturaVentaForm,
  GastoEventoForm,
} from "@/components/eventos/CicloForms";
import type { CicloFormState } from "@/app/(app)/eventos/ciclo-actions";

type Action = (prev: CicloFormState, formData: FormData) => Promise<CicloFormState>;

const TIPO_COBRO_LABELS = { sena: "Seña", saldo: "Saldo", otro: "Cobro" } as const;

function Titulo({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-lg font-semibold text-bordo-600">{children}</h2>;
}

function Fila({
  izquierda,
  detalle,
  monto,
  eliminar,
}: {
  izquierda: React.ReactNode;
  detalle?: React.ReactNode;
  monto: number;
  eliminar?: () => Promise<void>;
}) {
  return (
    <li className="flex items-start justify-between gap-2 border-b border-zinc-100 px-4 py-2 last:border-0">
      <span className="flex min-w-0 flex-col">
        <span className="text-sm text-zinc-900">{izquierda}</span>
        {detalle && <span className="text-xs text-zinc-400">{detalle}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm text-zinc-700">
        {formatGuaranies(monto)}
        {eliminar && (
          <form action={eliminar}>
            <button type="submit" className="px-1 text-zinc-300" aria-label="Eliminar">
              ✕
            </button>
          </form>
        )}
      </span>
    </li>
  );
}

function Dato({ label, valor, destacado }: { label: string; valor: string; destacado?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-zinc-400">{label}</span>
      <span className={`text-base ${destacado ?? "text-zinc-900"}`}>{valor}</span>
    </div>
  );
}

export function CicloEventoSeccion({
  eventoId,
  ciclo,
  resumen,
  cerrado,
  resenaEnviadaEn,
  acciones,
}: {
  eventoId: string;
  ciclo: CicloEvento;
  resumen: ReturnType<typeof resumenCiclo>;
  cerrado: boolean;
  resenaEnviadaEn: string | null;
  acciones: {
    registrarCobro: Action;
    eliminarCobro: (id: string) => () => Promise<void>;
    registrarFactura: Action;
    eliminarFactura: (id: string) => () => Promise<void>;
    registrarGasto: Action;
    eliminarGasto: (id: string) => () => Promise<void>;
    enviarResena: () => Promise<void>;
    cerrar: Action;
    reabrir: () => Promise<void>;
  };
}) {
  const margen = resumen.margenReal;

  return (
    <>
      <div className="flex flex-col gap-3">
        <Titulo>Cobros</Titulo>
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
          <Dato label="Cobrado" valor={formatGuaranies(resumen.cobrado)} />
          <Dato
            label="Saldo pendiente"
            valor={formatGuaranies(resumen.saldo)}
            destacado={resumen.saldo ? "text-amber-700 font-medium" : "text-emerald-700"}
          />
        </div>
        {ciclo.cobros.length > 0 && (
          <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white">
            {ciclo.cobros.map((cobro) => (
              <Fila
                key={cobro.id}
                izquierda={`${TIPO_COBRO_LABELS[cobro.tipo]} · ${cobro.medio}`}
                detalle={[
                  formatFechaCorta(cobro.fecha),
                  cobro.comprobante ? `comp. ${cobro.comprobante}` : null,
                  cobro.nota,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                monto={cobro.monto}
                eliminar={cerrado ? undefined : acciones.eliminarCobro(cobro.id)}
              />
            ))}
          </ul>
        )}
        {!cerrado && <CobroForm action={acciones.registrarCobro} saldo={resumen.saldo} />}
      </div>

      <div className="flex flex-col gap-3">
        <Titulo>Factura</Titulo>
        {ciclo.facturas.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no se registró la factura contable.</p>
        ) : (
          <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white">
            {ciclo.facturas.map((factura) => (
              <Fila
                key={factura.id}
                izquierda={`Factura ${factura.numero}`}
                detalle={formatFechaCorta(factura.fecha)}
                monto={factura.monto}
                eliminar={cerrado ? undefined : acciones.eliminarFactura(factura.id)}
              />
            ))}
          </ul>
        )}
        {!cerrado && (
          <FacturaVentaForm
            action={acciones.registrarFactura}
            monto={resumen.precio !== null ? Math.max(resumen.precio - resumen.facturado, 0) : null}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <Titulo>Ejecutado vs. presupuestado</Titulo>
          <p className="text-xs text-zinc-400">
            Compras confirmadas del evento + gastos sin factura + staff, todo con
            IVA incluido.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-4">
          <Dato label="Presupuestado" valor={formatGuaranies(resumen.presupuestado)} />
          <Dato
            label="Ejecutado"
            valor={formatGuaranies(resumen.ejecutado)}
            destacado={
              resumen.presupuestado !== null && resumen.ejecutado > resumen.presupuestado
                ? "text-red-600 font-medium"
                : undefined
            }
          />
          <Dato label="Compras" valor={formatGuaranies(ciclo.totales.compras)} />
          <Dato label="Staff" valor={formatGuaranies(ciclo.totales.manoDeObra)} />
          <Dato label="Otros gastos" valor={formatGuaranies(ciclo.totales.gastos)} />
          <Dato
            label="Margen real"
            valor={
              margen === null
                ? "-"
                : `${margen.toFixed(1)} % · ${formatGuaranies(resumen.gananciaReal)}`
            }
            destacado={margen !== null && margen < 0 ? "text-red-600 font-medium" : "text-bordo-600 font-medium"}
          />
        </div>

        {ciclo.compras.length > 0 && (
          <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white">
            {ciclo.compras.map((compra) => (
              <li key={compra.id} className="border-b border-zinc-100 last:border-0">
                <Link
                  href={`/compras/${compra.id}`}
                  className="flex items-start justify-between gap-2 px-4 py-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm text-zinc-900">{compra.proveedor}</span>
                    <span className="text-xs text-zinc-400">
                      {formatFechaCorta(compra.fecha)}
                      {compra.numeroFactura ? ` · ${compra.numeroFactura}` : ""}
                      {compra.origen === "bill" ? " · por WhatsApp" : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end text-sm text-zinc-700">
                    {formatGuaranies(compra.total)}
                    {compra.estado === "borrador" && (
                      <span className="rounded-full bg-amber-100 px-2 text-xs text-amber-800">
                        por revisar
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {ciclo.gastos.length > 0 && (
          <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white">
            {ciclo.gastos.map((gasto) => (
              <Fila
                key={gasto.id}
                izquierda={gasto.descripcion}
                detalle={`${GASTO_CATEGORIA_LABELS[categoriaGastoValida(gasto.categoria)]} · ${formatFechaCorta(gasto.fecha)}`}
                monto={gasto.monto}
                eliminar={cerrado ? undefined : acciones.eliminarGasto(gasto.id)}
              />
            ))}
          </ul>
        )}

        {!cerrado && (
          <div className="flex flex-col gap-2">
            <Link
              href={`/compras/nueva?evento=${eventoId}`}
              className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-center text-sm text-zinc-600"
            >
              + Cargar factura de compra
            </Link>
            <GastoEventoForm action={acciones.registrarGasto} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Titulo>Cierre</Titulo>
        <ul className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
          {resumen.checklist.map((item) => (
            <li key={item.clave} className="flex items-center gap-2">
              <span className={item.ok ? "text-emerald-600" : "text-zinc-300"}>
                {item.ok ? "✓" : "○"}
              </span>
              <span className={item.ok ? "text-zinc-700" : "text-zinc-500"}>{item.label}</span>
            </li>
          ))}
        </ul>

        <form action={acciones.enviarResena}>
          <button
            type="submit"
            className="w-full rounded-lg border border-emerald-300 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-800"
          >
            {resenaEnviadaEn
              ? `Reseña enviada el ${formatFechaCorta(resenaEnviadaEn.slice(0, 10))} · reenviar`
              : "Pedir reseña por WhatsApp"}
          </button>
        </form>

        {cerrado ? (
          <form action={acciones.reabrir}>
            <p className="pb-2 text-sm text-zinc-500">Evento cerrado.</p>
            <button type="submit" className="w-full py-2 text-sm text-zinc-400 underline">
              Reabrir
            </button>
          </form>
        ) : (
          <CerrarEventoForm action={acciones.cerrar} listo={resumen.listoParaCerrar} />
        )}
      </div>
    </>
  );
}
