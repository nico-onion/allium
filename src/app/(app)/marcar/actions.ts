"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MarcacionTipo } from "@/lib/supabase/database.types";

export type MarcarFormState = { error?: string; success?: boolean };

export async function marcarAsistencia(
  _prevState: MarcarFormState,
  formData: FormData,
): Promise<MarcarFormState> {
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

    if (uploadError) return { error: uploadError.message };
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
