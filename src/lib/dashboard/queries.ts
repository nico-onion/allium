import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ESTADOS_ACTIVOS } from "@/lib/eventos/constants";
import { calcularCostoReceta, type InsumoParaCosto } from "@/lib/recetas/costo";

export type ResumenMes = {
  confirmados: number;
  cotizados: number;
  realizados: number;
  cancelados: number;
  postergados: number;
};

// Cuenta eventos por estado cuya fecha cae dentro del mes (según su fecha
// de realización, no de creación) — pensado para responder "qué hay este
// mes", no "cuánto se cotizó este mes".
export async function getResumenMes(
  supabase: SupabaseClient<Database>,
  inicioMes: string,
  finMes: string,
): Promise<ResumenMes> {
  const { data, error } = await supabase
    .from("eventos")
    .select("estado")
    .gte("fecha", inicioMes)
    .lt("fecha", finMes);

  if (error) throw new Error(error.message);

  const contar = (estado: string) =>
    data.filter((evento) => evento.estado === estado).length;

  return {
    confirmados: contar("confirmado"),
    cotizados: contar("cotizado"),
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
  // null = todavía no hay ningún evento realizado y reconciliado este mes
  // para poder calcularlo ("Sin datos", no 0%).
  margenPromedio: number | null;
};

// "Ventas del mes" es un proxy basado en eventos (suma de precio_total de
// los realizados), no facturación/cobros real — eso vendrá de BILL más
// adelante. El margen solo se calcula sobre eventos ya reconciliados,
// porque recién ahí se conoce el costo real de insumos usados (no el
// estimado del menú).
export async function getMetricasFinancierasMes(
  supabase: SupabaseClient<Database>,
  inicioMes: string,
  finMes: string,
): Promise<MetricasFinancierasMes> {
  const { data: eventos, error } = await supabase
    .from("eventos")
    .select(
      "precio_total, ordenes_compra(reconciliado, orden_compra_items(cantidad_usada, unidad, insumos(costo_unitario, unidad)))",
    )
    .gte("fecha", inicioMes)
    .lt("fecha", finMes)
    .eq("estado", "realizado");

  if (error) throw new Error(error.message);

  const ventasDelMes = eventos.reduce(
    (acumulado, evento) => acumulado + (Number(evento.precio_total) || 0),
    0,
  );

  // Ponderado por venta: se suman precio_total y costo_real de todos los
  // eventos elegibles por separado, y el margen se calcula una sola vez
  // sobre esos totales (no es el promedio de los porcentajes individuales).
  let precioTotalElegibles = 0;
  let costoRealElegibles = 0;
  let huboElegibles = false;

  for (const evento of eventos) {
    const orden = evento.ordenes_compra;
    if (!orden || !orden.reconciliado) continue;

    const precioTotal = Number(evento.precio_total);
    if (!precioTotal) continue;

    const insumosParaCosto: InsumoParaCosto[] = orden.orden_compra_items
      .filter((item) => item.cantidad_usada !== null)
      .map((item) => ({
        cantidad: Number(item.cantidad_usada),
        unidad: item.unidad,
        insumo: item.insumos
          ? { costo_unitario: item.insumos.costo_unitario, unidad: item.insumos.unidad }
          : null,
      }));

    const { costoTotal } = calcularCostoReceta(insumosParaCosto);

    precioTotalElegibles += precioTotal;
    costoRealElegibles += costoTotal;
    huboElegibles = true;
  }

  const margenPromedio = huboElegibles
    ? (precioTotalElegibles - costoRealElegibles) / precioTotalElegibles
    : null;

  return { ventasDelMes, margenPromedio };
}
