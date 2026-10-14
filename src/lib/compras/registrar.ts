import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InsumoUnidad } from "@/lib/supabase/database.types";
import { convertirUnidad, costoPromedioPonderado } from "@/lib/recetas/costo";
import { crearLote } from "@/lib/stock/movimientos";

type Supabase = SupabaseClient<Database>;

// Cantidad y precio por unidad del insumo a partir de una línea de compra.
// Con factor: cada unidad de la línea trae `factor` unidades del insumo
// (1 frasco = 0,25 kg). Sin factor: conversión directa (g → kg). null si las
// unidades no son compatibles y no hay factor.
export function cantidadEnUnidadInsumo(
  cantidad: number,
  unidad: InsumoUnidad,
  unidadInsumo: InsumoUnidad,
  factor: number | null,
): number | null {
  if (factor !== null && factor > 0) return cantidad * factor;
  return convertirUnidad(cantidad, unidad, unidadInsumo);
}

// Entrada de un insumo comprado: movimiento de stock, stock nuevo, costo vivo
// por promedio ponderado e historial del cambio. `subtotal` es lo pagado por
// la línea entera; el precio por unidad del insumo sale de ahí.
export async function ingresarInsumoComprado(
  supabase: Supabase,
  linea: {
    compraId: string;
    insumoId: string;
    cantidad: number;
    unidad: InsumoUnidad;
    subtotal: number;
    factor: number | null;
    fechaVencimiento?: string | null;
    compraLineaId?: string | null;
  },
): Promise<{ error?: string; sinConversion?: boolean }> {
  const { data: insumo, error: insumoError } = await supabase
    .from("insumos")
    .select("stock_actual, unidad, costo_unitario")
    .eq("id", linea.insumoId)
    .maybeSingle();

  if (insumoError || !insumo) {
    return { error: insumoError?.message ?? "No se encontró un insumo de la compra." };
  }

  const cantidadInsumo = cantidadEnUnidadInsumo(
    linea.cantidad,
    linea.unidad,
    insumo.unidad,
    linea.factor,
  );

  // Sin conversión posible se registra el movimiento tal cual, pero no se
  // tocan stock ni costo (mismo criterio que antes).
  const precioPorUnidad =
    cantidadInsumo !== null && cantidadInsumo > 0 ? linea.subtotal / cantidadInsumo : null;
  const { error: movError } = await supabase.from("movimientos_stock").insert({
    insumo_id: linea.insumoId,
    tipo: "compra",
    costo_unitario: precioPorUnidad,
    cantidad: cantidadInsumo ?? linea.cantidad,
    unidad: cantidadInsumo !== null ? insumo.unidad : linea.unidad,
    compra_id: linea.compraId,
  });
  if (movError) return { error: movError.message };

  if (cantidadInsumo === null || cantidadInsumo <= 0) return { sinConversion: true };

  const precioInsumo = linea.subtotal / cantidadInsumo;
  const stockPrevio = Number(insumo.stock_actual);
  const costoPrevio = Number(insumo.costo_unitario);
  const nuevoCosto =
    Math.round(
      costoPromedioPonderado(stockPrevio, costoPrevio, cantidadInsumo, precioInsumo) * 100,
    ) / 100;

  const { error: updateError } = await supabase
    .from("insumos")
    .update({ stock_actual: stockPrevio + cantidadInsumo, costo_unitario: nuevoCosto })
    .eq("id", linea.insumoId);
  if (updateError) return { error: updateError.message };

  const lote = await crearLote(supabase, {
    insumoId: linea.insumoId,
    cantidad: cantidadInsumo,
    fechaVencimiento: linea.fechaVencimiento ?? null,
    compraLineaId: linea.compraLineaId ?? null,
  });
  if (lote.error) return lote;

  if (nuevoCosto !== costoPrevio) {
    const { error: historialError } = await supabase.from("costo_historial").insert({
      insumo_id: linea.insumoId,
      costo_anterior: costoPrevio,
      costo_nuevo: nuevoCosto,
      origen: "compra",
      compra_id: linea.compraId,
    });
    if (historialError) return { error: historialError.message };
  }

  return {};
}

// Confirma una compra en borrador cuyas líneas ya tienen destino: los
// insumos entran al stock y actualizan su costo; los gastos se cargan como
// gasto del evento (si la compra tiene evento).
export async function confirmarCompra(
  supabase: Supabase,
  compraId: string,
): Promise<{ error?: string; lineasSinConversion?: string[] }> {
  const { data: compra, error: compraError } = await supabase
    .from("compras")
    .select(
      "id, estado, evento_id, fecha, total, compra_lineas(id, descripcion, cantidad, unidad, subtotal, destino, insumo_id, factor, categoria_gasto, fecha_vencimiento)",
    )
    .eq("id", compraId)
    .maybeSingle();

  if (compraError || !compra) {
    return { error: compraError?.message ?? "No se encontró la compra." };
  }
  if (compra.estado !== "borrador") return { error: "La compra ya estaba confirmada." };

  const pendientes = compra.compra_lineas.filter((linea) => !linea.destino);
  if (pendientes.length > 0) {
    return { error: `Faltan asignar ${pendientes.length} línea(s).` };
  }

  const sinConversion: string[] = [];

  for (const linea of compra.compra_lineas) {
    if (linea.destino === "insumo" && linea.insumo_id) {
      const resultado = await ingresarInsumoComprado(supabase, {
        compraId,
        insumoId: linea.insumo_id,
        cantidad: Number(linea.cantidad),
        unidad: linea.unidad,
        subtotal: Number(linea.subtotal),
        factor: linea.factor === null ? null : Number(linea.factor),
        fechaVencimiento: linea.fecha_vencimiento,
        compraLineaId: linea.id,
      });
      if (resultado.error) return { error: resultado.error };
      if (resultado.sinConversion) sinConversion.push(linea.descripcion);
    } else if (linea.destino === "gasto" && compra.evento_id) {
      const { error } = await supabase.from("gastos_evento").insert({
        evento_id: compra.evento_id,
        fecha: compra.fecha,
        categoria: categoriaGastoValida(linea.categoria_gasto),
        descripcion: linea.descripcion,
        monto: Number(linea.subtotal),
        compra_linea_id: linea.id,
      });
      if (error) return { error: error.message };
    }
  }

  const total =
    compra.total ??
    compra.compra_lineas.reduce((acc, linea) => acc + Number(linea.subtotal), 0);

  const { error: updateError } = await supabase
    .from("compras")
    .update({ estado: "confirmada", confirmada_en: new Date().toISOString(), total })
    .eq("id", compraId);
  if (updateError) return { error: updateError.message };

  return { lineasSinConversion: sinConversion };
}

const CATEGORIAS_GASTO = [
  "mercaderia",
  "descartables",
  "combustible",
  "mano_obra",
  "transporte",
  "alquiler",
  "imprevisto",
  "otro",
] as const;

export function categoriaGastoValida(valor: string | null | undefined) {
  return (CATEGORIAS_GASTO as readonly string[]).includes(valor ?? "")
    ? (valor as (typeof CATEGORIAS_GASTO)[number])
    : "otro";
}
