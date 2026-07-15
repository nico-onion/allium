import type { PersonalRol } from "@/lib/supabase/database.types";

export const ROL_LABELS: Record<PersonalRol, string> = {
  cocina: "Cocina",
  mozo: "Mozo",
  logistica: "Logística",
};

export const ROL_OPTIONS = Object.entries(ROL_LABELS) as [PersonalRol, string][];
