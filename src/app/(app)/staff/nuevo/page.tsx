import { PersonalForm } from "@/components/staff/PersonalForm";
import { crearPersonal } from "../actions";

export default function NuevoPersonalPage() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="px-4 pt-4 font-display text-xl font-semibold text-bordo-600">
        Nueva persona
      </h1>
      <PersonalForm action={crearPersonal} submitLabel="Crear" />
    </div>
  );
}
