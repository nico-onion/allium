import Link from "next/link";

export type ProveedorParaLista = {
  id: string;
  nombre: string;
  contacto: string | null;
  notas: string | null;
  cantidadInsumos: number;
};

export function ProveedorCard({ proveedor }: { proveedor: ProveedorParaLista }) {
  return (
    <Link
      href={`/proveedores/${proveedor.id}`}
      className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 active:bg-zinc-50"
    >
      <span className="font-medium text-zinc-900">{proveedor.nombre}</span>
      {proveedor.contacto && (
        <span className="text-sm text-zinc-500">{proveedor.contacto}</span>
      )}
      {proveedor.notas && (
        <span className="truncate text-xs text-zinc-400">{proveedor.notas}</span>
      )}
      <span className="text-xs text-zinc-400">
        {proveedor.cantidadInsumos} insumo
        {proveedor.cantidadInsumos === 1 ? "" : "s"}
      </span>
    </Link>
  );
}
