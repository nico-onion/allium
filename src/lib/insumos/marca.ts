// Texto de marca para mostrar a quien compra: "Natura (si no hay: Hellmann's)".
export function textoMarca(
  preferida: string | null | undefined,
  alternativa: string | null | undefined,
): string | null {
  if (preferida && alternativa) return `${preferida} (si no hay: ${alternativa})`;
  if (preferida) return preferida;
  if (alternativa) return `Cualquier marca, ej. ${alternativa}`;
  return null;
}
