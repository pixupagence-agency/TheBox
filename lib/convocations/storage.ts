// Module Convocations : enregistrement sur l'appareil (clé synchronisée en ligne par lib/cloudSync.ts).
import { CONVOCATIONS_KEY, parseConvocations, type Convocation } from "./model";

export function loadConvocations(): Convocation[] {
  if (typeof window === "undefined") return [];
  try {
    return parseConvocations(localStorage.getItem(CONVOCATIONS_KEY));
  } catch {
    return [];
  }
}

/** Enregistre la liste ; renvoie false si le stockage est plein ou indisponible. */
export function saveConvocations(list: Convocation[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(CONVOCATIONS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
