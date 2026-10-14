import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ESTADOS_ACTIVOS } from "@/lib/eventos/constants";

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
// Margen: el mismo criterio que la página del evento — lo que salió del
// almacén para el evento (al costo del momento) + gastos + staff, contra el
// precio, todo con IVA incluido, ponderado por venta. Solo cuentan los
// eventos con algún costo de insumos o gastos cargado.
export async function getMetricasFinancierasMes(
  supabase: SupabaseClient<Database>,
  inicioMes: string,
  finMes: string,
): Promise<MetricasFinancierasMes> {
  const { data: eventos, error } = await supabase
    .from("eventos")
    .select("id, precio_total, turnos(costo, costo_referencia)")
    .gte("fecha", inicioMes)
    .lt("fecha", finMes)
    .eq("estado", "realizado");

  if (error) throw new Error(error.message);

  const ventasDelMes = eventos.reduce(
    (acumulado, evento) => acumulado + (Number(evento.precio_total) || 0),
    0,
  );

  const ids = eventos.map((evento) => evento.id);
  const [salidas, gastos] = ids.length
    ? await Promise.all([
        supabase
          .from("movimientos_stock")
          .select("evento_id, cantidad, costo_unitario, insumos(costo_unitario)")
          .in("evento_id", ids)
          .eq("tipo", "uso_evento"),
        supabase.from("gastos_evento").select("evento_id, monto").in("evento_id", ids),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (salidas.error) throw new Error(salidas.error.message);
  if (gastos.error) throw new Error(gastos.error.message);

  const costoPorEvento = new Map<string, number>();
  const sumar = (eventoId: string | null, monto: number) => {
    if (!eventoId) return;
    costoPorEvento.set(eventoId, (costoPorEvento.get(eventoId) ?? 0) + monto);
  };
  for (const mov of salidas.data ?? []) {
    const costo = Number(mov.costo_unitario ?? mov.insumos?.costo_unitario ?? 0);
    sumar(mov.evento_id, Math.abs(Number(mov.cantidad)) * costo);
  }
  for (const gasto of gastos.data ?? []) sumar(gasto.evento_id, Number(gasto.monto) || 0);

  let ventasElegibles = 0;
  let costoRealElegibles = 0;
  let eventosConMargen = 0;

  for (const evento of eventos) {
    const precioTotal = Number(evento.precio_total);
    const costoMercaderia = costoPorEvento.get(evento.id) ?? 0;
    if (!precioTotal || costoMercaderia === 0) continue;

    const costoStaff = evento.turnos.reduce(
      (acumulado, turno) => acumulado + (Number(turno.costo ?? turno.costo_referencia) || 0),
      0,
    );

    ventasElegibles += precioTotal;
    costoRealElegibles += costoMercaderia + costoStaff;
    eventosConMargen += 1;
  }

  const margenPromedio =
    eventosConMargen > 0 ? (ventasElegibles - costoRealElegibles) / ventasElegibles : null;

  return { ventasDelMes, margenPromedio, eventosConMargen };
}
