// fecha_emision es una columna `date` (sin hora): se ancla a medianoche UTC
// para sumar los días de validez sin corrimientos de huso horario.
export function calcularVencimiento(fechaEmision: string, validezDias: number): string {
  const fecha = new Date(`${fechaEmision}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + validezDias);
  return fecha.toISOString().slice(0, 10);
}
