import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ESTADOS_ACTIVOS } from "@/lib/eventos/constants";
import { calcularCostoReceta, type InsumoParaCosto } from "@/lib/recetas/costo";
import { precioSinIva } from "@/lib/cotizaciones/margen";

export type ResumenMes = {
  confirmados: number;
  cotizados: number;
  realizados: number;
  cancelados: number;
  postergados: number;
};

// Embudo del mes según la fecha del evento (no la de creación):
// - cotizados: cotizaciones con fecha de evento en el mes (salvo rechazadas)
// - confirmados: eventos vendidos del mes (confirmados + ya realizados)
// El resto cuenta eventos por estado.
export async function getResumenMes(
  supabase: SupabaseClient<Database>,
  inicioMes: string,
  finMes: string,
): Promise<ResumenMes> {
  const [eventos, presupuestos] = await Promise.all([
    supabase.from("eventos").select("estado").gte("fecha", inicioMes).lt("fecha", finMes),
    supabase
      .from("presupuestos")
      .select("estado")
      .gte("fecha_evento", inicioMes.slice(0, 10))
      .lt("fecha_evento", finMes.slice(0, 10))
      .neq("estado", "rechazado"),
  ]);

  if (eventos.error) throw new Error(eventos.error.message);
  if (presupuestos.error) throw new Error(presupuestos.error.message);

  const contar = (estado: string) =>
    eventos.data.filter((evento) => evento.estado === estado).length;

  return {
    confirmados: contar("confirmado") + contar("realizado"),
    // eventos cargados como "cotizado" antes de existir las cotizaciones
    cotizados: presupuestos.data.length + contar("cotizado"),
    realizados: contar("realizado"),
    cancelados: contar("cancelado"),
    postergados: contar("postergado"),
  };
}

export type ProximoEvento = {
  id: string;
  nombre: string;
  fecha: string;
  clienteNombre: string | null;
};

export async function getProximoEvento(
  supabase: SupabaseClient<Database>,
  ahora: string,
): Promise<ProximoEvento | null> {
  const { data, error } = await supabase
    .from("eventos")
    .select("id, nombre, fecha, clientes(nombre)")
    .in("estado", ESTADOS_ACTIVOS)
    .gte("fecha", ahora)
    .order("fecha", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    nombre: data.nombre,
    fecha: data.fecha,
    clienteNombre: data.clientes?.nombre ?? null,
  };
}

export type MetricasFinancierasMes = {
  ventasDelMes: number;
  // null = todavía no hay eventos realizados con costo real cargado este mes
  // ("Sin datos", no 0 %).
  margenPromedio: number | null;
  eventosConMargen: number;
};

// Ventas del mes: precio de los eventos realizados del mes.
// Margen: el mismo criterio que la página del evento — costo real
// (compras confirmadas del evento + gastos sin factura + staff) contra el
// precio sin IVA, ponderado por venta. Para eventos sin compras cargadas se
// usa, si existe, la orden de compra reconciliada (método anterior).
export async function getMetricasFinancierasMes(
  supabase: SupabaseClient<Database>,
  inicioMes: string,
  finMes: string,
): Promise<MetricasFinancierasMes> {
  const { data: eventos, error } = await supabase
    .from("eventos")
    .select(
      "id, precio_total, ordenes_compra(reconciliado, orden_compra_items(cantidad_usada, unidad, insumos(costo_unitario, unidad))), turnos(costo, costo_referencia)",
    )
    .gte("fecha", inicioMes)
    .lt("fecha", finMes)
    .eq("estado", "realizado");

  if (error) throw new Error(error.message);

  const ventasDelMes = eventos.reduce(
    (acumulado, evento) => acumulado + (Number(evento.precio_total) || 0),
    0,
  );

  const ids = eventos.map((evento) => evento.id);
  const [compras, gastos] = ids.length
    ? await Promise.all([
        supabase
          .from("compras")
          .select("evento_id, total")
          .in("evento_id", ids)
          .eq("estado", "confirmada"),
        supabase
          .from("gastos_evento")
          .select("evento_id, monto")
          .in("evento_id", ids)
          .is("compra_linea_id", null),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (compras.error) throw new Error(compras.error.message);
  if (gastos.error) throw new Error(gastos.error.message);

  const sumarPorEvento = (filas: { evento_id: string | null; monto: number }[]) => {
    const mapa = new Map<string, number>();
    for (const fila of filas) {
      if (!fila.evento_id) continue;
      mapa.set(fila.evento_id, (mapa.get(fila.evento_id) ?? 0) + fila.monto);
    }
    return mapa;
  };
  const comprasPorEvento = sumarPorEvento(
    (compras.data ?? []).map((c) => ({ evento_id: c.evento_id, monto: Number(c.total) || 0 })),
  );
  const gastosPorEvento = sumarPorEvento(
    (gastos.data ?? []).map((g) => ({ evento_id: g.evento_id, monto: Number(g.monto) || 0 })),
  );

  let ventasNetasElegibles = 0;
  let costoRealElegibles = 0;
  let eventosConMargen = 0;

  for (const evento of eventos) {
    const precioTotal = Number(evento.precio_total);
    if (!precioTotal) continue;

    const costoStaff = evento.turnos.reduce(
      (acumulado, turno) => acumulado + (Number(turno.costo ?? turno.costo_referencia) || 0),
      0,
    );

    let costoMercaderia =
      (comprasPorEvento.get(evento.id) ?? 0) + (gastosPorEvento.get(evento.id) ?? 0);

    if (costoMercaderia === 0) {
      const orden = evento.ordenes_compra;
      if (!orden || !orden.reconciliado) continue;
      const insumosParaCosto: InsumoParaCosto[] = orden.orden_compra_items
        .filter((item) => item.cantidad_usada !== null)
        .map((item) => ({
          cantidad: Number(item.cantidad_usada),
          unidad: item.unidad,
          insumo: item.insumos
            ? { costo_unitario: item.insumos.costo_unitario, unidad: item.insumos.unidad }
            : null,
        }));
      costoMercaderia = calcularCostoReceta(insumosParaCosto).costoTotal;
    }

    ventasNetasElegibles += precioSinIva(precioTotal);
    costoRealElegibles += costoMercaderia + costoStaff;
    eventosConMargen += 1;
  }

  const margenPromedio =
    eventosConMargen > 0
      ? (ventasNetasElegibles - costoRealElegibles) / ventasNetasElegibles
      : null;

  return { ventasDelMes, margenPromedio, eventosConMargen };
}
