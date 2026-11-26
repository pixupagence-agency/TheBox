// Lecture et publication des documents légaux (legalDocs/{id} ; historique legalDocs/{id}/history/{version}).
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  type LegalDocId,
  type LegalDocument,
  defaultLegalDocument,
  readLegalDocument,
  validateLegalDocument,
} from "@/lib/legal/documents";

const legalRef = (id: LegalDocId) => doc(db, "legalDocs", id);

/** Suit un document en direct ; texte par défaut s'il n'a jamais été publié ou si la lecture échoue */
export function subscribeLegalDocument(id: LegalDocId, onChange: (doc: LegalDocument) => void): () => void {
  return onSnapshot(
    legalRef(id),
    (snap) => onChange(readLegalDocument(id, snap.data())),
    (err) => {
      console.warn(`[Légal] Lecture de ${id} impossible :`, err?.message);
      onChange(defaultLegalDocument(id));
    }
  );
}

/**
 * Publie une nouvelle version (super admin, contrôlé par les règles Firestore) : le document public est
 * remplacé et une copie est gardée dans l'historique, sous son numéro de version.
 */
export async function publishLegalDocument(draft: Pick<LegalDocument, "id" | "intro" | "sections">): Promise<LegalDocument> {
  const problem = validateLegalDocument(draft);
  if (problem) throw new Error(problem);
  const ref = legalRef(draft.id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const previous = snap.exists() && typeof snap.data()?.version === "number" ? (snap.data()!.version as number) : 0;
    const published = {
      intro: draft.intro.trim(),
      sections: draft.sections.map((sec) => ({ id: sec.id, title: sec.title.trim(), body: sec.body.trim() })),
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || null,
      version: previous + 1,
    };
    tx.set(ref, published);
    tx.set(doc(db, "legalDocs", draft.id, "history", String(published.version)), published);
    return { id: draft.id, ...published };
  });
}
