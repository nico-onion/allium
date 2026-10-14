import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PresupuestoEstado } from "@/lib/supabase/database.types";
import { ESTADOS_HABILITAN_EVENTO } from "@/lib/cotizaciones/constants";

type PresupuestoResumen = {
  estado: PresupuestoEstado;
  presupuesto_items: { cantidad: number; precio_unitario: number }[];
};
type EventoResumen = { estado: string; precio_total: number | null };

function totalPresupuesto(presupuesto: PresupuestoResumen): number {
  return presupuesto.presupuesto_items.reduce(
    (acc, item) => acc + Number(item.cantidad) * Number(item.precio_unitario),
    0,
  );
}

// Indicadores comerciales de un cliente a partir de sus presupuestos y eventos.
export function resumirCliente(presupuestos: PresupuestoResumen[], eventos: EventoResumen[]) {
  const aceptados = presupuestos.filter((p) => ESTADOS_HABILITAN_EVENTO.includes(p.estado));
  const rechazados = presupuestos.filter((p) => p.estado === "rechazado");
  // La tasa se mide sobre los presupuestos ya decididos (aceptados o rechazados).
  const decididos = aceptados.length + rechazados.length;
  const eventosValidos = eventos.filter((e) => e.estado !== "cancelado");

  return {
    cantidadPresupuestos: presupuestos.length,
    cantidadAceptados: aceptados.length,
    tasaAceptacion: decididos > 0 ? aceptados.length / decididos : null,
    totalCotizado: presupuestos.reduce((acc, p) => acc + totalPresupuesto(p), 0),
    cantidadEventos: eventosValidos.length,
    totalVendido: eventosValidos.reduce((acc, e) => acc + (Number(e.precio_total) || 0), 0),
  };
}

export async function getClientes(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("clientes")
    .select(
      "id, nombre, tipo, origen, telefono, presupuestos(estado, presupuesto_items(cantidad, precio_unitario)), eventos(estado, precio_total)",
    )
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data.map((cliente) => ({
    id: cliente.id,
    nombre: cliente.nombre,
    tipo: cliente.tipo,
    origen: cliente.origen,
    telefono: cliente.telefono,
    ...resumirCliente(cliente.presupuestos, cliente.eventos),
  }));
}

export async function getCliente(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select(
      "id, nombre, tipo, origen, telefono, email, instagram, ruc_ci, notas, creado_en, presupuestos(id, numero, estado, tipo_evento, fecha_evento, presupuesto_items(cantidad, precio_unitario)), eventos(id, nombre, estado, fecha, invitados, precio_total)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
