// Module Convocations : enregistrement sur l'appareil (clé synchronisée en ligne par lib/cloudSync.ts).
// Lecture versionnée et sans perte : voir lib/localData.ts et CONVOCATION_SCHEMA.
import { loadList, saveList } from "../localData";
import { CONVOCATIONS_KEY, CONVOCATION_SCHEMA, type Convocation } from "./model";

export function loadConvocations(): Convocation[] {
  return loadList(CONVOCATIONS_KEY, CONVOCATION_SCHEMA);
}

/** Enregistre la liste (les convocations illisibles sur cette version sont conservées) ; false si le stockage est plein ou indisponible. */
export function saveConvocations(list: Convocation[]): boolean {
  return saveList(CONVOCATIONS_KEY, list, CONVOCATION_SCHEMA);
}
