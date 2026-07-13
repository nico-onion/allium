import { ProveedorForm } from "@/components/proveedores/ProveedorForm";
import { crearProveedor } from "../actions";

export default function NuevoProveedorPage() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nuevo proveedor
      </h1>
      <ProveedorForm action={crearProveedor} submitLabel="Crear proveedor" />
    </div>
  );
}
