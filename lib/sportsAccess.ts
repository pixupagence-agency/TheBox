// Accès aux sports : sports ouverts au public ou verrouillés par l'administrateur, avec la note affichée.
// Stocké dans app_config/sports (lecture publique, écriture super admin : règles Firestore), appliqué à
// tous les visiteurs. Les administrateurs gardent l'accès à tous les sports.
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface SportAccessConfig {
  id: string;
  name: string;
  icon: string;
  isBlocked: boolean;
  statusNote: string;
  category: string;
}

export const defaultBlockedSports: string[] = ["basketball", "rugby", "handball"];

export const defaultSportsConfig: SportAccessConfig[] = [
  {
    id: "football",
    name: "Football",
    icon: "⚽",
    isBlocked: false,
    statusNote: "Totalement opérationnel (11v11, 8v8, 5v5)",
    category: "Outdoor"
  },
  {
    id: "basketball",
    name: "Basketball",
    icon: "🏀",
    isBlocked: true,
    statusNote: "Disponible sur activation administrateur",
    category: "Indoor"
  },
  {
    id: "rugby",
    name: "Rugby",
    icon: "🏉",
    isBlocked: true,
    statusNote: "Disponible sur activation administrateur",
    category: "Outdoor"
  },
  {
    id: "handball",
    name: "Handball",
    icon: "🤾",
    isBlocked: true,
    statusNote: "Disponible sur activation administrateur",
    category: "Indoor"
  }
];

export interface SportsAccess {
  blockedSports: string[];
  sportsConfig: SportAccessConfig[];
  updatedAt: string | null;
}

export const DEFAULT_SPORTS_ACCESS: SportsAccess = {
  blockedSports: defaultBlockedSports,
  sportsConfig: defaultSportsConfig,
  updatedAt: null,
};

const SUPPORTED = defaultSportsConfig.map((s) => s.id);
const sportsRef = () => doc(db, "app_config", "sports");

/** Contenu lu en base, limité aux sports pris en charge (valeurs par défaut pour le reste) */
export function readSportsAccess(data: unknown): SportsAccess {
  if (!data || typeof data !== "object") return DEFAULT_SPORTS_ACCESS;
  const d = data as Record<string, unknown>;
  const blocked = Array.isArray(d.blockedSports)
    ? d.blockedSports.filter((id): id is string => typeof id === "string" && SUPPORTED.includes(id))
    : defaultBlockedSports;
  const saved = Array.isArray(d.sportsConfig) ? (d.sportsConfig as Partial<SportAccessConfig>[]) : [];
  const sportsConfig = defaultSportsConfig.map((def) => {
    const found = saved.find((s) => s && s.id === def.id);
    return {
      ...def,
      statusNote: typeof found?.statusNote === "string" ? found.statusNote.slice(0, 200) : def.statusNote,
      isBlocked: blocked.includes(def.id),
    };
  });
  return { blockedSports: blocked, sportsConfig, updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : null };
}

/** Suit l'accès aux sports en direct ; valeurs par défaut si jamais enregistré ou illisible */
export function subscribeSportsAccess(onChange: (access: SportsAccess) => void): () => void {
  return onSnapshot(
    sportsRef(),
    (snap) => onChange(readSportsAccess(snap.data())),
    (err) => {
      console.warn("[Sports] Lecture de l'accès aux sports impossible :", err?.message);
      onChange(DEFAULT_SPORTS_ACCESS);
    }
  );
}

/** Enregistre l'accès aux sports pour toute la plateforme (super admin, contrôlé par les règles) */
export async function saveSportsAccess(blockedSports: string[], sportsConfig: SportAccessConfig[]): Promise<void> {
  const clean = readSportsAccess({ blockedSports, sportsConfig });
  await setDoc(sportsRef(), {
    blockedSports: clean.blockedSports,
    sportsConfig: clean.sportsConfig.map(({ id, statusNote }) => ({ id, statusNote })),
    updatedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.email || null,
  });
}
