import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Supabase = SupabaseClient<Database>;

// Todas las entradas y salidas del almacén pasan por acá, para que stock,
// lotes y movimientos queden siempre de acuerdo.

const redondear = (n: number) => Math.round(n * 1000) / 1000;

// Descuenta `cantidad` de los lotes de un insumo, primero lo que vence antes
// (los lotes sin fecha al final). Si se pasa `loteId`, descuenta solo de
// ese lote. Lo que no alcance a cubrirse con lotes se ignora: el stock del
// insumo manda y el conteo físico corrige.
async function consumirLotes(
  supabase: Supabase,
  insumoId: string,
  cantidad: number,
  loteId?: string,
): Promise<{ error?: string }> {
  let consulta = supabase
    .from("lotes_stock")
    .select("id, cantidad_restante")
    .eq("insumo_id", insumoId)
    .gt("cantidad_restante", 0);
  consulta = loteId
    ? consulta.eq("id", loteId)
    : consulta
        .order("fecha_vencimiento", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

  const { data: lotes, error } = await consulta;
  if (error) return { error: error.message };

  let pendiente = cantidad;
  for (const lote of lotes ?? []) {
    if (pendiente <= 0) break;
    const disponible = Number(lote.cantidad_restante);
    const usado = Math.min(disponible, pendiente);
    const { error: updateError } = await supabase
      .from("lotes_stock")
      .update({ cantidad_restante: redondear(disponible - usado) })
      .eq("id", lote.id);
    if (updateError) return { error: updateError.message };
    pendiente = redondear(pendiente - usado);
  }
  return {};
}

export type TipoSalida = "uso_evento" | "merma" | "ajuste";

// Salida del almacén (uso en un evento, merma o ajuste negativo). `cantidad`
// es positiva y está en la unidad del insumo. Guarda el costo promedio del
// momento, que es lo que la salida le cuesta al evento.
export async function registrarSalida(
  supabase: Supabase,
  salida: {
    insumoId: string;
    cantidad: number;
    tipo: TipoSalida;
    eventoId?: string | null;
    nota?: string | null;
    loteId?: string;
  },
): Promise<{ error?: string; costo?: number }> {
  if (!(salida.cantidad > 0)) return { error: "La cantidad tiene que ser mayor a 0." };

  const { data: insumo, error } = await supabase
    .from("insumos")
    .select("stock_actual, unidad, costo_unitario")
    .eq("id", salida.insumoId)
    .maybeSingle();
  if (error || !insumo) return { error: error?.message ?? "No se encontró el insumo." };

  const costoUnitario = Number(insumo.costo_unitario);
  const { error: movError } = await supabase.from("movimientos_stock").insert({
    insumo_id: salida.insumoId,
    tipo: salida.tipo,
    cantidad: -redondear(salida.cantidad),
    unidad: insumo.unidad,
    evento_id: salida.eventoId ?? null,
    nota: salida.nota ?? null,
    costo_unitario: costoUnitario,
  });
  if (movError) return { error: movError.message };

  // El stock nunca baja de 0: si salió más de lo registrado, el movimiento
  // guarda lo real y el conteo físico corrige después.
  const { error: stockError } = await supabase
    .from("insumos")
    .update({ stock_actual: Math.max(0, redondear(Number(insumo.stock_actual) - salida.cantidad)) })
    .eq("id", salida.insumoId);
  if (stockError) return { error: stockError.message };

  const lotes = await consumirLotes(supabase, salida.insumoId, salida.cantidad, salida.loteId);
  if (lotes.error) return lotes;

  return { costo: costoUnitario * salida.cantidad };
}

// Lote nuevo para una entrada (compra, ajuste positivo o conteo).
export async function crearLote(
  supabase: Supabase,
  lote: {
    insumoId: string;
    cantidad: number;
    fechaVencimiento?: string | null;
    compraLineaId?: string | null;
    nota?: string | null;
  },
): Promise<{ error?: string }> {
  if (!(lote.cantidad > 0)) return {};
  const { error } = await supabase.from("lotes_stock").insert({
    insumo_id: lote.insumoId,
    compra_linea_id: lote.compraLineaId ?? null,
    fecha_vencimiento: lote.fechaVencimiento ?? null,
    cantidad_inicial: redondear(lote.cantidad),
    cantidad_restante: redondear(lote.cantidad),
    nota: lote.nota ?? null,
  });
  return error ? { error: error.message } : {};
}

// Entrada sin compra (ajuste positivo, conteo con más de lo registrado). No
// cambia el costo promedio.
export async function registrarEntradaAjuste(
  supabase: Supabase,
  entrada: { insumoId: string; cantidad: number; nota?: string | null; fechaVencimiento?: string | null },
): Promise<{ error?: string }> {
  if (!(entrada.cantidad > 0)) return { error: "La cantidad tiene que ser mayor a 0." };

  const { data: insumo, error } = await supabase
    .from("insumos")
    .select("stock_actual, unidad, costo_unitario")
    .eq("id", entrada.insumoId)
    .maybeSingle();
  if (error || !insumo) return { error: error?.message ?? "No se encontró el insumo." };

  const { error: movError } = await supabase.from("movimientos_stock").insert({
    insumo_id: entrada.insumoId,
    tipo: "ajuste",
    cantidad: redondear(entrada.cantidad),
    unidad: insumo.unidad,
    nota: entrada.nota ?? null,
    costo_unitario: Number(insumo.costo_unitario),
  });
  if (movError) return { error: movError.message };

  const { error: stockError } = await supabase
    .from("insumos")
    .update({ stock_actual: redondear(Number(insumo.stock_actual) + entrada.cantidad) })
    .eq("id", entrada.insumoId);
  if (stockError) return { error: stockError.message };

  return crearLote(supabase, {
    insumoId: entrada.insumoId,
    cantidad: entrada.cantidad,
    fechaVencimiento: entrada.fechaVencimiento,
    nota: entrada.nota,
  });
}
