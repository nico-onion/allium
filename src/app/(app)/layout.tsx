import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-bordo-100 bg-white px-4 py-3">
        <Link
          href="/eventos"
          className="font-display text-lg font-semibold text-bordo-600"
        >
          ERP Allium
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          <Link
            href="/recetas"
            className="text-sm text-zinc-500 underline-offset-2 hover:underline"
          >
            Recetas
          </Link>
          <Link
            href="/insumos"
            className="text-sm text-zinc-500 underline-offset-2 hover:underline"
          >
            Insumos
          </Link>
          <Link
            href="/eventos/archivo"
            className="text-sm text-zinc-500 underline-offset-2 hover:underline"
          >
            Archivo
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-zinc-400 underline-offset-2 hover:underline"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
