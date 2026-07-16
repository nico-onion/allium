"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { MarcarFormState } from "@/app/(app)/marcar/actions";
import type { MarcacionTipo } from "@/lib/supabase/database.types";

type Paso = "idle" | "foto" | "procesando" | "guardando";

const PASO_LABELS: Record<Paso, string> = {
  idle: "",
  foto: "Abriendo cámara...",
  procesando: "Preparando...",
  guardando: "Guardando...",
};

// Una foto de verificación de asistencia no necesita la resolución
// completa de la cámara del celular (que puede pesar varios MB, sobre
// todo en HEIC/RAW) — la redimensionamos y recomprimimos del lado del
// cliente antes de subir, tanto para que sea más rápido como para no
// depender del límite de tamaño del servidor.
const MAX_ANCHO_FOTO = 1280;
const CALIDAD_JPEG = 0.75;

// Debe quedar por debajo de experimental.serverActions.bodySizeLimit en
// next.config.ts (15mb) — con la compresión de arriba esto casi nunca se
// alcanza, pero queda como red de seguridad por si la compresión falla y
// se sube el archivo original sin tocar.
const LIMITE_FOTO_BYTES = 12 * 1024 * 1024;

// Salvavidas: si por lo que sea el estado de la Server Action nunca
// vuelve (ej. problema de red a mitad de la subida), no dejar el botón
// colgado en "Guardando..." para siempre.
const TIMEOUT_GUARDADO_MS = 25000;

// Redimensiona a un ancho máximo y recomprime a JPEG. Si el navegador no
// puede decodificar el formato original (raro) devuelve el archivo tal
// cual — mejor subir sin comprimir que no subir nada.
async function comprimirFoto(archivo: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, MAX_ANCHO_FOTO / bitmap.width);
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;

    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG),
    );
    if (!blob) return archivo;

    return new File([blob], "marcacion.jpg", { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
    />
  );
}

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
  // isPending queda en true desde que se dispara el submit (incluido vía
  // requestSubmit, no solo un <button type="submit"> normal) hasta que la
  // Server Action resuelve — evita tener que reinventar ese seguimiento a
  // mano con estado propio.
  const [state, formAction, isPending] = useActionState(action, {});
  const [paso, setPaso] = useState<Paso>("idle");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [avisoUbicacion, setAvisoUbicacion] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const procesando = paso !== "idle" || isPending;
  const etiquetaBoton =
    isPending && paso === "idle" ? PASO_LABELS.guardando : PASO_LABELS[paso];

  // Salvavidas: si la Server Action nunca resuelve (ej. problema de red a
  // mitad de la subida), no dejar el botón colgado en "Guardando..." sin
  // ningún mensaje para siempre.
  useEffect(() => {
    if (!isPending) return;
    const timeoutId = setTimeout(() => {
      setErrorLocal(
        "No se pudo confirmar que la marcación se haya guardado. Revisá tu conexión e intentá de nuevo.",
      );
    }, TIMEOUT_GUARDADO_MS);
    return () => clearTimeout(timeoutId);
  }, [isPending]);

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
    // del usuario. Por eso todo lo demás (ubicación, compresión) se pide
    // DESPUÉS de la foto, no antes (esperarFoto() dispara el click de
    // forma síncrona porque el executor de `new Promise` corre
    // sincrónicamente).
    setPaso("foto");

    try {
      await esperarFoto();

      const archivoOriginal = fotoInputRef.current?.files?.[0] ?? null;

      // Comprimir la foto y pedir la ubicación no dependen una de la otra
      // — van en paralelo en vez de en serie para no sumar sus tiempos.
      setPaso("procesando");
      const [archivoComprimido, ubicacion] = await Promise.all([
        archivoOriginal ? comprimirFoto(archivoOriginal) : Promise.resolve(null),
        obtenerUbicacion(),
      ]);

      if (archivoComprimido && fotoInputRef.current) {
        if (archivoComprimido.size > LIMITE_FOTO_BYTES) {
          setErrorLocal(
            `La foto pesa ${(archivoComprimido.size / (1024 * 1024)).toFixed(1)}MB, demasiado para subir. Probá sacarla de nuevo.`,
          );
          return;
        }
        // Reemplaza el archivo del input por la versión comprimida, así
        // el <form> sube esa en vez de la original de la cámara.
        const dt = new DataTransfer();
        dt.items.add(archivoComprimido);
        fotoInputRef.current.files = dt.files;
      }

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
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-fucsia-600 py-6 text-lg font-semibold text-white disabled:opacity-60"
      >
        {procesando ? (
          <>
            <Spinner />
            {etiquetaBoton}
          </>
        ) : siguienteTipo === "entrada" ? (
          "Marcar entrada"
        ) : (
          "Marcar salida"
        )}
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
