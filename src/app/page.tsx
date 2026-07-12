export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-b from-bordo-700 to-bordo-500 px-6 py-16 text-center">
      <span className="rounded-full bg-fucsia-500/20 px-4 py-1 text-xs font-medium uppercase tracking-widest text-fucsia-200">
        Allium E.A.S. &middot; Paraguay
      </span>
      <h1 className="font-display text-4xl font-semibold text-white">
        ERP Allium
      </h1>
      <p className="max-w-sm text-sm text-fucsia-100">
        Sistema interno de gestión para Onion, catering &amp; eventos.
      </p>
    </div>
  );
}
