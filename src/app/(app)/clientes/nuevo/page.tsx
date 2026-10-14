import { ClienteForm } from "@/components/clientes/ClienteForm";
import { crearCliente } from "../actions";

export default function NuevoClientePage() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nuevo cliente
      </h1>
      <ClienteForm action={crearCliente} submitLabel="Crear cliente" />
    </div>
  );
}
