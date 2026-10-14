// IVA incluido en un monto que ya lo tiene (las facturas de Paraguay
// muestran precios con IVA): 10 % → monto ÷ 11; 5 % → monto ÷ 21.
export type TasaIva = 0 | 5 | 10;

export const TASAS_IVA: TasaIva[] = [10, 5, 0];

export const TASA_IVA_LABELS: Record<TasaIva, string> = {
  10: "10 %",
  5: "5 %",
  0: "Exenta",
};

export function tasaIvaValida(valor: unknown): TasaIva {
  const n = Number(valor);
  return n === 0 || n === 5 ? n : 10;
}

export function ivaIncluido(montoConIva: number, tasa: TasaIva): number {
  return tasa === 0 ? 0 : (montoConIva * tasa) / (100 + tasa);
}

// Liquidación del IVA como el pie de una factura.
export function liquidacionIva(lineas: { subtotal: number; tasa_iva: number }[]) {
  const porTasa = (tasa: TasaIva) =>
    lineas.filter((linea) => tasaIvaValida(linea.tasa_iva) === tasa).reduce((acc, l) => acc + l.subtotal, 0);
  const exentas = porTasa(0);
  const gravadas5 = porTasa(5);
  const gravadas10 = porTasa(10);
  const iva5 = Math.round(ivaIncluido(gravadas5, 5));
  const iva10 = Math.round(ivaIncluido(gravadas10, 10));
  return { exentas, gravadas5, gravadas10, iva5, iva10, totalIva: iva5 + iva10 };
}
