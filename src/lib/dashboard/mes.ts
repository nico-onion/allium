export type MesSeleccionado = { year: number; month: number };

const FORMATO_MES = /^(\d{4})-(\d{2})$/;

// `month` siempre 0-indexado (0 = enero), como Date.
export function parseMesParam(
  mesParam: string | undefined,
  ahora: Date,
): MesSeleccionado {
  if (mesParam) {
    const match = FORMATO_MES.exec(mesParam);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      if (month >= 0 && month <= 11) return { year, month };
    }
  }
  return { year: ahora.getFullYear(), month: ahora.getMonth() };
}

export function formatMesParam({ year, month }: MesSeleccionado): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function esMismoMes(a: MesSeleccionado, b: MesSeleccionado): boolean {
  return a.year === b.year && a.month === b.month;
}

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatNombreMes(mes: MesSeleccionado): string {
  const fecha = new Date(mes.year, mes.month, 1);
  return capitalizar(new Intl.DateTimeFormat("es-PY", { month: "long" }).format(fecha));
}

export type OpcionMes = { value: string; label: string };

// Rango de meses alrededor de `centro` (pensado para centrarse en el mes
// actual real, no en el seleccionado, así la lista de opciones no se corre
// a medida que uno navega).
export function generarOpcionesMes(
  centro: MesSeleccionado,
  rango: number,
): OpcionMes[] {
  const opciones: OpcionMes[] = [];

  for (let i = -rango; i <= rango; i++) {
    const totalMeses = centro.year * 12 + centro.month + i;
    const mes: MesSeleccionado = {
      year: Math.floor(totalMeses / 12),
      month: ((totalMeses % 12) + 12) % 12,
    };
    opciones.push({
      value: formatMesParam(mes),
      label: `${formatNombreMes(mes)} ${mes.year}`,
    });
  }

  return opciones;
}
