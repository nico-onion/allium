import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InsumoUnidad } from "@/lib/supabase/database.types";

type Supabase = SupabaseClient<Database>;

// Con cuántos días de anticipación avisar que algo vence.
export const DIAS_AVISO_VENCIMIENTO = 3;

// Hoy en Paraguay, como AAAA-MM-DD.
export function hoyPy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Asuncion" }).format(new Date());
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export type EstadoLote = "vencido" | "por_vencer" | "sin_fecha" | "ok";

export type LoteDisponible = {
  id: string;
  insumoId: string;
  insumoNombre: string;
  unidad: InsumoUnidad;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string | null;
  nota: string | null;
  estado: EstadoLote;
  valor: number;
};

export function estadoLote(fechaVencimiento: string | null, hoy = hoyPy()): EstadoLote {
  if (!fechaVencimiento) return "sin_fecha";
  if (fechaVencimiento < hoy) return "vencido";
  if (fechaVencimiento <= sumarDias(hoy, DIAS_AVISO_VENCIMIENTO)) return "por_vencer";
  return "ok";
}

// Lotes con algo adentro, del que vence antes al que vence después.
export async function getLotesDisponibles(supabase: Supabase): Promise<LoteDisponible[]> {
  const { data, error } = await supabase
    .from("lotes_stock")
    .select(
      "id, insumo_id, cantidad_restante, fecha_ingreso, fecha_vencimiento, nota, insumos(nombre, unidad, costo_unitario)",
    )
    .gt("cantidad_restante", 0)
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false })
    .order("fecha_ingreso", { ascending: true });
  if (error) throw new Error(error.message);

  const hoy = hoyPy();
  return data.map((lote) => {
    const cantidad = Number(lote.cantidad_restante);
    return {
      id: lote.id,
      insumoId: lote.insumo_id,
      insumoNombre: lote.insumos?.nombre ?? "Insumo",
      unidad: lote.insumos?.unidad ?? "unidad",
      cantidad,
      fechaIngreso: lote.fecha_ingreso,
      fechaVencimiento: lote.fecha_vencimiento,
      nota: lote.nota,
      estado: estadoLote(lote.fecha_vencimiento, hoy),
      valor: Math.round(cantidad * Number(lote.insumos?.costo_unitario ?? 0)),
    };
  });
}

export async function getResumenVencimientos(supabase: Supabase) {
  const lotes = await getLotesDisponibles(supabase);
  const contar = (estado: EstadoLote) => lotes.filter((lote) => lote.estado === estado).length;
  return { vencidos: contar("vencido"), porVencer: contar("por_vencer"), sinFecha: contar("sin_fecha") };
}
