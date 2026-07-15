"use client";

import { useActionState, useRef, useState } from "react";
import type { MarcarFormState } from "@/app/(app)/marcar/actions";
import type { MarcacionTipo } from "@/lib/supabase/database.types";

type Paso = "idle" | "ubicacion" | "foto" | "guardando";

const PASO_LABELS: Record<Paso, string> = {
  idle: "",
  ubicacion: "Obteniendo ubicación...",
  foto: "Abriendo cámara...",
  guardando: "Guardando...",
};

export function MarcarForm({
  siguienteTipo,
  action,
}: {
  siguienteTipo: MarcacionTipo;
  action: (
    prevState: MarcarFormState,
    formData: FormData,
  ) => Promise<MarcarFormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  const [paso, setPaso] = useState<Paso>("idle");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [avisoUbicacion, setAvisoUbicacion] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const procesando = paso !== "idle";

  // navigator.geolocation (y getUserMedia) exigen un contexto seguro
  // (HTTPS); localhost tiene una excepción especial que una IP de red
  // local por HTTP no tiene, así que probar desde el celular vía
  // http://192.168.x.x falla acá aunque funcione desde la compu.
  function obtenerUbicacion(): Promise<{ lat: string; lng: string } | null> {
    return new Promise((resolve) => {
      if (!window.isSecureContext || !navigator.geolocation) {
        resolve(null);
        return;
      }

      let resuelto = false;
      const terminar = (valor: { lat: string; lng: string } | null) => {
        if (resuelto) return;
        resuelto = true;
        resolve(valor);
      };

      try {
        navigator.geolocation.getCurrentPosition(
          (posicion) =>
            terminar({
              lat: String(posicion.coords.latitude),
              lng: String(posicion.coords.longitude),
            }),
          () => terminar(null),
          { timeout: 8000 },
        );
      } catch {
        terminar(null);
      }
      // salvavidas manual: algunos navegadores no respetan el timeout de
      // la API cuando el permiso queda bloqueado por contexto inseguro.
      setTimeout(() => terminar(null), 9000);
    });
  }

  function esperarFoto(): Promise<void> {
    return new Promise((resolve) => {
      const input = fotoInputRef.current;
      if (!input) {
        resolve();
        return;
      }

      let resuelto = false;
      const terminar = () => {
        if (resuelto) return;
        resuelto = true;
        window.removeEventListener("focus", alVolverElFoco);
        resolve();
      };
      const alVolverElFoco = () => {
        // dar tiempo a que el navegador termine de poblar input.files
        setTimeout(terminar, 300);
      };

      window.addEventListener("focus", alVolverElFoco);
      // salvavidas por si el evento focus no llega (ej. algunos navegadores de escritorio)
      setTimeout(terminar, 120000);
      input.click();
    });
  }

  async function iniciarMarcacion() {
    setErrorLocal(null);
    setAvisoUbicacion(null);
    // input.click() tiene que ser la primera acción síncrona de este
    // handler, sin ningún await antes: iOS Safari bloquea en silencio la
    // apertura de la cámara si no ocurre dentro del mismo gesto de click
    // del usuario. Por eso la ubicación se pide DESPUÉS de la foto, no
    // antes (esperarFoto() dispara el click de forma síncrona porque el
    // executor de `new Promise` corre sincrónicamente).
    setPaso("foto");

    try {
      await esperarFoto();

      setPaso("ubicacion");
      const ubicacion = await obtenerUbicacion();

      if (ubicacion) {
        if (latRef.current) latRef.current.value = ubicacion.lat;
        if (lngRef.current) lngRef.current.value = ubicacion.lng;
      } else if (!window.isSecureContext) {
        setAvisoUbicacion(
          "Se marcó sin ubicación: esta conexión no es segura (HTTPS). Desde el celular, accedé por una URL https:// para poder capturarla.",
        );
      } else {
        setAvisoUbicacion("Se marcó sin ubicación (permiso no concedido).");
      }

      setPaso("guardando");
      formRef.current?.requestSubmit();
    } catch (err) {
      setErrorLocal(
        err instanceof Error ? err.message : "No se pudo completar la marcación.",
      );
    } finally {
      setPaso("idle");
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="tipo" value={siguienteTipo} />
      <input type="hidden" name="latitud" ref={latRef} />
      <input type="hidden" name="longitud" ref={lngRef} />
      <input
        type="file"
        name="foto"
        accept="image/*"
        capture="environment"
        ref={fotoInputRef}
        className="hidden"
      />

      <button
        type="button"
        onClick={iniciarMarcacion}
        disabled={procesando}
        className="w-full rounded-xl bg-fucsia-600 py-6 text-lg font-semibold text-white disabled:opacity-60"
      >
        {procesando
          ? PASO_LABELS[paso]
          : siguienteTipo === "entrada"
            ? "Marcar entrada"
            : "Marcar salida"}
      </button>

      {errorLocal && (
        <p role="alert" className="text-sm text-red-600">
          {errorLocal}
        </p>
      )}
      {avisoUbicacion && (
        <p className="text-sm text-amber-600">{avisoUbicacion}</p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm font-medium text-emerald-600">
          ✓ Marcación guardada
        </p>
      )}
    </form>
  );
}
