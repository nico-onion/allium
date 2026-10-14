// Cómo se reconoce un renglón de factura la próxima vez: por proveedor y por
// descripción normalizada (minúsculas, sin tildes, sin espacios repetidos).

export function normalizarDescripcion(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// El RUC identifica mejor al proveedor que el nombre, que cambia según el
// ticket ("FORTIS MAYORISTA" vs "Muster S.A.").
export function claveProveedor(ruc: string | null | undefined, nombre: string | null | undefined): string {
  const rucLimpio = (ruc ?? "").replace(/[^0-9-]/g, "");
  if (rucLimpio) return `ruc:${rucLimpio}`;
  return `nombre:${normalizarDescripcion(nombre ?? "sin proveedor")}`;
}
