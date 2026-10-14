import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InsumoUnidad } from "@/lib/supabase/database.types";
import { cantidadEnUnidadInsumo } from "@/lib/compras/registrar";
import { armarMapaRecetas, convertirUnidad } from "@/lib/recetas/costo";
import { calcularPackingList } from "@/lib/eventos/packing-list";
import { getMenuDeEvento, getMenuItems } from "@/lib/eventos/queries";
import { getRecetasParaCosto } from "@/lib/recetas/queries";

type Supabase = SupabaseClient<Database>;

export type SalidaEvento = {
  id: string;
  insumoId: string;
  insumoNombre: string;
  unidad: InsumoUnidad;
  cantidad: number;
  costoUnitario: number;
  valor: number;
  fecha: string;
};

// Lo que salió del almacén para un evento, valorizado al costo del momento
// (si un movimiento viejo no lo tiene, al costo promedio actual).
export async function getSalidasEvento(supabase: Supabase, eventoId: string): Promise<SalidaEvento[]> {
  const { data, error } = await supabase
    .from("movimientos_stock")
    .select("id, insumo_id, cantidad, unidad, costo_unitario, created_at, insumos(nombre, costo_unitario)")
    .eq("evento_id", eventoId)
    .eq("tipo", "uso_evento")
    .order("created_at");
  if (error) throw new Error(error.message);

  return data.map((mov) => {
    const cantidad = Math.abs(Number(mov.cantidad));
    const costoUnitario = Number(mov.costo_unitario ?? mov.insumos?.costo_unitario ?? 0);
    return {
      id: mov.id,
      insumoId: mov.insumo_id,
      insumoNombre: mov.insumos?.nombre ?? "Insumo",
      unidad: mov.unidad,
      cantidad,
      costoUnitario,
      valor: Math.round(cantidad * costoUnitario),
      fecha: mov.created_at,
    };
  });
}

export type FilaPrecarga = { insumoId: string; cantidad: number };

function sumar(filas: FilaPrecarga[]): FilaPrecarga[] {
  const mapa = new Map<string, number>();
  for (const fila of filas) mapa.set(fila.insumoId, (mapa.get(fila.insumoId) ?? 0) + fila.cantidad);
  return [...mapa.entries()]
    .map(([insumoId, cantidad]) => ({ insumoId, cantidad: Math.round(cantidad * 1000) / 1000 }))
    .filter((fila) => fila.cantidad > 0);
}

// Propuestas para la salida de un evento, en la unidad de cada insumo y
// descontando lo que ya salió:
// - comprado: lo que se compró para este evento (compras directas)
// - menu: la lista de compras del menú (insumos brutos de las recetas)
export async function getPrecargasSalida(supabase: Supabase, eventoId: string) {
  const [lineas, salidas, menu] = await Promise.all([
    supabase
      .from("compra_lineas")
      .select("insumo_id, cantidad, unidad, factor, compras!inner(evento_id, estado), insumos(unidad)")
      .eq("compras.evento_id", eventoId)
      .eq("compras.estado", "confirmada")
      .eq("destino", "insumo"),
    getSalidasEvento(supabase, eventoId),
    getMenuDeEvento(supabase, eventoId),
  ]);
  if (lineas.error) throw new Error(lineas.error.message);

  const comprado = sumar(
    (lineas.data ?? []).flatMap((linea) => {
      if (!linea.insumo_id || !linea.insumos) return [];
      const cantidad = cantidadEnUnidadInsumo(
        Number(linea.cantidad),
        linea.unidad,
        linea.insumos.unidad,
        linea.factor === null ? null : Number(linea.factor),
      );
      return cantidad === null ? [] : [{ insumoId: linea.insumo_id, cantidad }];
    }),
  );

  let delMenu: FilaPrecarga[] = [];
  if (menu) {
    const items = await getMenuItems(supabase, menu.id);
    if (items.length > 0) {
      const { data: insumos } = await supabase.from("insumos").select("id, unidad");
      const unidadDe = new Map((insumos ?? []).map((i) => [i.id, i.unidad]));
      const packing = calcularPackingList(items, armarMapaRecetas(await getRecetasParaCosto(supabase)));
      delMenu = sumar(
        packing.flatMap((item) => {
          const unidad = unidadDe.get(item.insumoId);
          const cantidad = unidad ? convertirUnidad(item.cantidad, item.unidad, unidad) : null;
          return cantidad === null ? [] : [{ insumoId: item.insumoId, cantidad }];
        }),
      );
    }
  }

  // Lo que ya salió no se vuelve a proponer.
  const yaSalio = new Map<string, number>();
  for (const salida of salidas) {
    yaSalio.set(salida.insumoId, (yaSalio.get(salida.insumoId) ?? 0) + salida.cantidad);
  }
  const restar = (filas: FilaPrecarga[]) =>
    sumar(filas.map((f) => ({ insumoId: f.insumoId, cantidad: f.cantidad - (yaSalio.get(f.insumoId) ?? 0) })));

  return { comprado: restar(comprado), menu: restar(delMenu) };
}
