"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

type NavItem = {
  href: string;
  label: string;
  proximamente?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Panel de control" },
  { href: "/insumos", label: "Insumos" },
  { href: "/compras", label: "Compras" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/cotizaciones", label: "Cotizaciones" },
  { href: "/eventos", label: "Eventos" },
  { href: "/staff", label: "Staff" },
  { href: "/recetas", label: "Recetas" },
  { href: "/eventos/archivo", label: "Archivo" },
];

function IconoMenu({ abierto }: { abierto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      {abierto ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </>
      )}
    </svg>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        if (item.proximamente) {
          return (
            <span
              key={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-300"
            >
              {item.label}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400">
                Próximamente
              </span>
            </span>
          );
        }

        const activo =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              activo
                ? "bg-fucsia-50 text-fucsia-700"
                : "text-zinc-600 active:bg-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-bordo-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarAbierto(true)}
            className="text-zinc-500 lg:hidden"
            aria-label="Abrir menú"
          >
            <IconoMenu abierto={false} />
          </button>
          <Link href="/" className="font-display text-lg font-semibold text-bordo-600">
            ERP Allium
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden truncate text-sm text-zinc-500 sm:inline">
              {userEmail}
            </span>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-zinc-500 underline-offset-2 hover:underline"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden shrink-0 border-r border-zinc-200 bg-white p-3 lg:block lg:w-56">
          <NavLinks />
        </aside>

        {sidebarAbierto && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setSidebarAbierto(false)}
            />
            <div className="relative flex h-full w-64 flex-col bg-white p-3 shadow-lg">
              <button
                type="button"
                onClick={() => setSidebarAbierto(false)}
                className="mb-2 self-end text-zinc-500"
                aria-label="Cerrar menú"
              >
                <IconoMenu abierto={true} />
              </button>
              <NavLinks onNavigate={() => setSidebarAbierto(false)} />
            </div>
          </div>
        )}

        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
