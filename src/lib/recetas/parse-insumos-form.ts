import type { InsumoUnidad } from "@/lib/supabase/database.types";

export type FilaInsumo = {
  insumo_id: string;
  cantidad: number;
  unidad: InsumoUnidad;
};

// Las filas dinámicas de insumos se envían con el mismo nombre de campo
// repetido por fila (insumo_id, cantidad, unidad); FormData.getAll conserva
// el orden, así que se pueden reconstruir emparejando por índice.
export function parseFilasInsumos(formData: FormData): FilaInsumo[] {
  const insumoIds = formData.getAll("insumo_id") as string[];
  const cantidades = formData.getAll("cantidad") as string[];
  const unidades = formData.getAll("unidad") as InsumoUnidad[];

  return insumoIds
    .map((insumo_id, i) => ({
      insumo_id,
      cantidad: Number(cantidades[i]),
      unidad: unidades[i],
    }))
    .filter((fila) => fila.insumo_id && fila.cantidad > 0 && fila.unidad);
}

export function tieneInsumosDuplicados(filas: FilaInsumo[]): boolean {
  const ids = filas.map((fila) => fila.insumo_id);
  return new Set(ids).size !== ids.length;
}

export type FilaSubreceta = {
  subreceta_id: string;
  cantidad: number;
  unidad: InsumoUnidad;
};

// Mismo criterio que los insumos, con sus propios nombres de campo.
export function parseFilasSubrecetas(formData: FormData): FilaSubreceta[] {
  const ids = formData.getAll("subreceta_id") as string[];
  const cantidades = formData.getAll("subreceta_cantidad") as string[];
  const unidades = formData.getAll("subreceta_unidad") as InsumoUnidad[];

  return ids
    .map((subreceta_id, i) => ({
      subreceta_id,
      cantidad: Number(cantidades[i]),
      unidad: unidades[i],
    }))
    .filter((fila) => fila.subreceta_id && fila.cantidad > 0 && fila.unidad);
}

export function tieneSubrecetasDuplicadas(filas: FilaSubreceta[]): boolean {
  const ids = filas.map((fila) => fila.subreceta_id);
  return new Set(ids).size !== ids.length;
}
