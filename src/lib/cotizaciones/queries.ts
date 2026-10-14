import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { TIPOS_BASE } from "@/lib/eventos/constants";
import { calcularTotales } from "@/lib/cotizaciones/margen";

export async function getPresupuestos(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("presupuestos")
    .select(
      "id, numero, tipo_evento, fecha_evento, estado, pct_imprevistos, clientes(nombre), presupuesto_items(cantidad, precio_unitario, costo_unitario)",
    )
    .order("numero", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((presupuesto) => {
    const totales = calcularTotales(
      presupuesto.presupuesto_items.map((item) => ({
        cantidad: Number(item.cantidad),
        precioUnitario: Number(item.precio_unitario),
        costoUnitario: item.costo_unitario === null ? null : Number(item.costo_unitario),
      })),
      Number(presupuesto.pct_imprevistos),
      null,
    );
    return {
      ...presupuesto,
      total: totales.precioTotal,
      // Solo si todas las líneas tienen costo; si no, el margen sería engañoso.
      margenPct: totales.lineasSinCosto === 0 ? totales.margenPct : null,
    };
  });
}

export async function getPresupuesto(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const { data, error } = await supabase
    .from("presupuestos")
    .select(
      "id, numero, cliente_id, fecha_emision, validez_dias, tipo_evento, fecha_evento, horario, lugar_direccion, cantidad_personas, incluye, no_incluye, estado, evento_id, margen_objetivo_pct, pct_imprevistos, costo_congelado_en, clientes(id, nombre, email, telefono)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getPresupuestoItems(
  supabase: SupabaseClient<Database>,
  presupuestoId: string,
) {
  const { data, error } = await supabase
    .from("presupuesto_items")
    .select(
      "id, receta_id, cantidad, precio_unitario, descripcion, categoria, costo_unitario, personal_id, recetas(nombre)",
    )
    .eq("presupuesto_id", presupuestoId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// tipo_evento es texto libre, igual que eventos.tipo: el selector combina los
// tipos base conocidos del negocio con cualquier otro valor ya usado a mano,
// tanto en eventos como en presupuestos previos.
export async function getTiposEventoUsados(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const [eventosResult, presupuestosResult] = await Promise.all([
    supabase.from("eventos").select("tipo"),
    supabase.from("presupuestos").select("tipo_evento"),
  ]);

  if (eventosResult.error) throw new Error(eventosResult.error.message);
  if (presupuestosResult.error) throw new Error(presupuestosResult.error.message);

  const tipos = new Set([
    ...TIPOS_BASE,
    ...eventosResult.data.map((evento) => evento.tipo),
    ...presupuestosResult.data.map((presupuesto) => presupuesto.tipo_evento),
  ]);
  return Array.from(tipos).sort((a, b) => a.localeCompare(b));
}

// Margen objetivo e imprevistos por tipo de evento.
export async function getParametrosTipoEvento(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("parametros_tipo_evento")
    .select("tipo, margen_objetivo_pct, pct_imprevistos")
    .order("tipo", { ascending: true });

  if (error) throw new Error(error.message);
  return data.map((fila) => ({
    tipo: fila.tipo,
    margen_objetivo_pct: Number(fila.margen_objetivo_pct),
    pct_imprevistos: Number(fila.pct_imprevistos),
  }));
}
