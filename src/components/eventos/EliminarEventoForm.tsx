"use client";

export function EliminarEventoForm({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const confirmado = window.confirm(
          "¿Seguro que querés borrar este evento? Esta acción no se puede deshacer.",
        );
        if (!confirmado) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="w-full rounded-lg border border-red-200 py-3 text-sm font-medium text-red-600"
      >
        Borrar evento
      </button>
    </form>
  );
}
