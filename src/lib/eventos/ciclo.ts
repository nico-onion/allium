import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { margenPct } from "@/lib/cotizaciones/margen";

type Supabase = SupabaseClient<Database>;

export const LINK_RESENA_GOOGLE = "https://g.page/r/CRjpfbCbMsgsEAI/review";

// Lo que pasa con la plata de un evento, del presupuesto al cierre: cobros,
// factura, compras y gastos (ejecutado) contra lo cotizado.
export async function getCicloEvento(supabase: Supabase, eventoId: string) {
  const [cobros, facturas, compras, gastos, turnos] = await Promise.all([
    supabase
      .from("cobros")
      .select("id, tipo, monto, fecha, medio, comprobante, nota")
      .eq("evento_id", eventoId)
      .order("fecha"),
    supabase
      .from("facturas_venta")
      .select("id, numero, fecha, monto")
      .eq("evento_id", eventoId)
      .order("fecha"),
    supabase
      .from("compras")
      .select("id, fecha, estado, origen, total, numero_factura, proveedor_texto, proveedores(nombre)")
      .eq("evento_id", eventoId)
      .order("fecha"),
    // Solo los cargados a mano: los que vienen de una factura ya están en el
    // total de esa compra.
    supabase
      .from("gastos_evento")
      .select("id, fecha, categoria, descripcion, monto")
      .eq("evento_id", eventoId)
      .is("compra_linea_id", null)
      .order("fecha"),
    supabase.from("turnos").select("costo, costo_referencia").eq("evento_id", eventoId),
  ]);

  for (const resultado of [cobros, facturas, compras, gastos, turnos]) {
    if (resultado.error) throw new Error(resultado.error.message);
  }

  const lista = {
    cobros: (cobros.data ?? []).map((c) => ({ ...c, monto: Number(c.monto) })),
    facturas: (facturas.data ?? []).map((f) => ({ ...f, monto: Number(f.monto) })),
    compras: (compras.data ?? []).map((c) => ({
      id: c.id,
      fecha: c.fecha,
      estado: c.estado,
      origen: c.origen,
      numeroFactura: c.numero_factura,
      proveedor: c.proveedores?.nombre ?? c.proveedor_texto ?? "Sin proveedor",
      total: c.total === null ? 0 : Number(c.total),
    })),
    gastos: (gastos.data ?? []).map((g) => ({ ...g, monto: Number(g.monto) })),
  };

  const sum = (valores: number[]) => valores.reduce((acc, v) => acc + v, 0);
  const comprasConfirmadas = lista.compras.filter((c) => c.estado === "confirmada");

  // Si el costo del turno todavía no se acordó, cuenta el de referencia.
  const manoDeObra = sum(
    (turnos.data ?? []).map((t) => Number(t.costo ?? t.costo_referencia ?? 0)),
  );

  return {
    ...lista,
    totales: {
      cobrado: sum(lista.cobros.map((c) => c.monto)),
      facturado: sum(lista.facturas.map((f) => f.monto)),
      compras: sum(comprasConfirmadas.map((c) => c.total)),
      gastos: sum(lista.gastos.map((g) => g.monto)),
      manoDeObra,
      borradores: lista.compras.length - comprasConfirmadas.length,
    },
  };
}

export type CicloEvento = Awaited<ReturnType<typeof getCicloEvento>>;

export function resumenCiclo(
  ciclo: CicloEvento,
  evento: {
    precio_total: number | null;
    costo_cotizado: number | null;
    resena_enviada_en: string | null;
  },
) {
  const precio = evento.precio_total === null ? null : Number(evento.precio_total);
  const { cobrado, facturado, compras, gastos, manoDeObra, borradores } = ciclo.totales;
  const ejecutado = compras + gastos + manoDeObra;

  const checklist = [
    {
      clave: "cobrado",
      label: precio ? "Cobrado el 100 %" : "Precio del evento cargado",
      ok: precio !== null && precio > 0 && cobrado >= precio,
    },
    {
      clave: "factura",
      label: "Factura contable registrada",
      ok: precio !== null && precio > 0 && facturado >= precio,
    },
    { clave: "compras", label: "Sin compras por revisar", ok: borradores === 0 },
    { clave: "resena", label: "Link de reseña enviado", ok: evento.resena_enviada_en !== null },
  ];

  return {
    precio,
    cobrado,
    saldo: precio === null ? null : Math.max(precio - cobrado, 0),
    facturado,
    ejecutado,
    presupuestado: evento.costo_cotizado === null ? null : Number(evento.costo_cotizado),
    margenReal: precio ? margenPct(precio, ejecutado) : null,
    gananciaReal: precio === null ? null : Math.round(precio - ejecutado),
    checklist,
    listoParaCerrar: checklist.every((item) => item.ok),
  };
}

// Paraguay: "0981 123 456" → "595981123456" para wa.me.
export function telefonoWhatsApp(telefono: string | null | undefined): string | null {
  const digitos = (telefono ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.startsWith("595")) return digitos;
  if (digitos.startsWith("0")) return `595${digitos.slice(1)}`;
  if (digitos.length === 9) return `595${digitos}`;
  return digitos;
}
