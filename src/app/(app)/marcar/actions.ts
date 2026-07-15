"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MarcacionTipo } from "@/lib/supabase/database.types";

export type MarcarFormState = { error?: string; success?: boolean };

export async function marcarAsistencia(
  _prevState: MarcarFormState,
  formData: FormData,
): Promise<MarcarFormState> {
  try {
    return await guardarMarcacion(formData);
  } catch (err) {
    // Cualquier excepción no prevista (ej. timeout de red al subir la
    // foto) tiene que volver como estado, nunca como throw sin capturar:
    // si esto tira, useActionState no actualiza el estado y el botón
    // queda "colgado" en el cliente sin ningún mensaje.
    console.error("marcarAsistencia: error inesperado", err);
    return {
      error: err instanceof Error ? err.message : "No se pudo guardar la marcación.",
    };
  }
}

async function guardarMarcacion(formData: FormData): Promise<MarcarFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No estás logueado." };

  const { data: persona, error: personaError } = await supabase
    .from("personal")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (personaError) return { error: personaError.message };
  if (!persona) {
    return { error: "Tu cuenta no está asociada a ningún perfil de staff." };
  }

  const tipo = formData.get("tipo") as MarcacionTipo;
  if (tipo !== "entrada" && tipo !== "salida") {
    return { error: "Tipo de marcación inválido." };
  }

  const latitudRaw = formData.get("latitud") as string;
  const longitudRaw = formData.get("longitud") as string;
  const foto = formData.get("foto") as File | null;

  let fotoUrl: string | null = null;

  if (foto && foto.size > 0) {
    const extension = foto.name.split(".").pop() || "jpg";
    const ruta = `${user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("marcaciones")
      .upload(ruta, foto, { contentType: foto.type || "image/jpeg" });

    if (uploadError) {
      console.error("marcarAsistencia: falló la subida de la foto", {
        nombre: foto.name,
        tipo: foto.type,
        bytes: foto.size,
        error: uploadError.message,
      });
      return { error: `No se pudo subir la foto: ${uploadError.message}` };
    }
    fotoUrl = ruta;
  }

  const { error: insertError } = await supabase.from("marcaciones").insert({
    personal_id: persona.id,
    tipo,
    latitud: latitudRaw ? Number(latitudRaw) : null,
    longitud: longitudRaw ? Number(longitudRaw) : null,
    foto_url: fotoUrl,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/marcar");
  return { success: true };
}
