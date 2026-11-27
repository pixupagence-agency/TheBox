// Guide d'utilisation : publié par le super admin dans app_config/guide (lecture publique, écriture super
// admin : règles Firestore), lu en direct par tous les utilisateurs. Tant qu'aucune version n'a été publiée,
// le guide par défaut (lib/userGuideData.ts) est affiché.
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_GUIDE_SECTIONS, type GuideSectionContentBlock, type GuideSectionItem } from "@/lib/userGuideData";

export interface PublishedGuide {
  sections: GuideSectionItem[];
  updatedAt: string | null;
  updatedBy: string | null;
}

/** Taille maximale du guide enregistré (un document Firestore est limité à 1 Mo) */
export const GUIDE_MAX_BYTES = 900_000;
/** Image importée depuis l'ordinateur (intégrée au guide) : au-delà, utiliser un lien */
export const GUIDE_MAX_UPLOAD_BYTES = 400_000;

const guideRef = () => doc(db, "app_config", "guide");
const str = (v: unknown) => (typeof v === "string" ? v : "");
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function readBlock(v: unknown): GuideSectionContentBlock | null {
  if (!v || typeof v !== "object") return null;
  const b = v as Record<string, unknown>;
  return { subtitle: str(b.subtitle), paragraphs: strList(b.paragraphs), bullets: strList(b.bullets), tip: str(b.tip) };
}

/** Guide lu en base, vérifié champ par champ ; guide par défaut s'il est absent ou vide */
export function readGuide(data: unknown): PublishedGuide {
  const fallback: PublishedGuide = { sections: DEFAULT_GUIDE_SECTIONS, updatedAt: null, updatedBy: null };
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  const sections = (Array.isArray(d.sections) ? d.sections : [])
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object" && typeof (x as { id?: unknown }).id === "string")
    .map((x) => ({
      id: x.id as string,
      number: str(x.number),
      title: str(x.title),
      iconName: str(x.iconName) || undefined,
      summary: str(x.summary),
      badge: str(x.badge) || undefined,
      videoUrl: str(x.videoUrl) || undefined,
      content: (Array.isArray(x.content) ? x.content : []).map(readBlock).filter((b): b is GuideSectionContentBlock => b !== null),
    }));
  if (!sections.length) return fallback;
  return { sections, updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : null, updatedBy: typeof d.updatedBy === "string" ? d.updatedBy : null };
}

/** Suit le guide publié ; guide par défaut si jamais publié ou si la lecture échoue */
export function subscribeGuide(onChange: (guide: PublishedGuide) => void): () => void {
  return onSnapshot(
    guideRef(),
    (snap) => onChange(readGuide(snap.data())),
    (err) => {
      console.warn("[Guide] Lecture du guide impossible :", err?.message);
      onChange(readGuide(null));
    }
  );
}

/** Firestore refuse les champs « undefined » : ils sont retirés avant l'enregistrement */
const clean = (sections: GuideSectionItem[]) =>
  sections.map((s) => ({
    id: s.id,
    number: s.number || "",
    title: s.title || "",
    iconName: s.iconName || "",
    summary: s.summary || "",
    badge: s.badge || "",
    videoUrl: s.videoUrl || "",
    content: s.content.map((b) => ({
      subtitle: b.subtitle || "",
      paragraphs: b.paragraphs || [],
      bullets: b.bullets || [],
      tip: b.tip || "",
    })),
  }));

/** Publie le guide pour tous les utilisateurs (super admin) */
export async function publishGuide(sections: GuideSectionItem[]): Promise<void> {
  if (!sections.length) throw new Error("Le guide doit contenir au moins un article.");
  const payload = {
    sections: clean(sections),
    updatedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.email || null,
  };
  const size = new Blob([JSON.stringify(payload)]).size;
  if (size > GUIDE_MAX_BYTES) {
    throw new Error(
      `Le guide est trop volumineux (${Math.round(size / 1000)} Ko, ${Math.round(GUIDE_MAX_BYTES / 1000)} Ko au maximum) : remplacez les images importées par des liens.`
    );
  }
  await setDoc(guideRef(), payload);
}
