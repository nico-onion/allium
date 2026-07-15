import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPersonalLista } from "@/lib/staff/queries";
import { PersonalCard } from "@/components/staff/PersonalCard";

export default async function StaffPage() {
  const supabase = await createClient();
  const personal = await getPersonalLista(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="font-display text-xl font-semibold text-bordo-600">
          Staff
        </h1>
        <Link
          href="/staff/nuevo"
          className="shrink-0 rounded-lg bg-fucsia-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Nuevo
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        {personal.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-400">
            Todavía no cargaste a nadie del staff.
          </p>
        ) : (
          personal.map((persona) => (
            <PersonalCard key={persona.id} persona={persona} />
          ))
        )}
      </div>
    </div>
  );
}
