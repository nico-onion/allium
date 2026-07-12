import { logout } from "@/app/login/actions";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-bordo-100 bg-white px-4 py-3">
        <span className="font-display text-lg font-semibold text-bordo-600">
          ERP Allium
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-bordo-400 underline-offset-2 hover:underline"
          >
            Salir
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
