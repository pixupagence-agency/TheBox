// Module Training : séances d'entraînement (comme la section « Match » du tableau tactique, pour les entraînements).
// Une séance regroupe des exercices ; chaque exercice garde son schéma, sa durée, le nombre de joueurs
// et le nombre de ballons utiles. Clé « thebox_training_sessions », synchronisée en ligne (lib/cloudSync.ts).
import { isRecord, loadList, num, saveList, str, type ItemSchema, type Migrations } from "../localData";
import { readDiagram } from "./diagramData";
import type { TrainingDiagram } from "./types";

export const TRAINING_SESSIONS_KEY = "thebox_training_sessions";
export const ACTIVE_SESSION_KEY = "thebox_training_active_session";

export interface SessionExercise {
  id: string;
  title: string;
  /** Durée (minutes) */
  duration: number;
  /** Joueurs utiles */
  players: number;
  /** Ballons utiles */
  balls: number;
  diagram: TrainingDiagram;
}

export interface TrainingSession {
  id: string;
  title: string;
  /** AAAA-MM-JJ */
  date: string;
  /** HH:MM */
  time?: string;
  /** Objectif de la séance */
  theme?: string;
  exercises: SessionExercise[];
  createdAt: string;
  updatedAt: string;
}

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const isValidIsoDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function sessionDateLabel(date: string, time?: string): string {
  if (!isValidIsoDate(date)) return "Date à définir";
  const d = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return time ? `${d} • ${time}` : d;
}

export const totalDuration = (s: TrainingSession) => s.exercises.reduce((sum, e) => sum + (Number(e.duration) || 0), 0);

export const formatMinutes = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
};

/** Valeurs proposées pour un nouvel exercice, d'après le schéma (joueurs et ballons posés sur le terrain) */
export function suggestedCounts(diagram: TrainingDiagram): { players: number; balls: number } {
  let players = 0;
  let balls = 0;
  for (const e of diagram.elements) {
    if (e.kind === "player" && (e as { role?: string }).role !== "coach") players += 1;
    else if (e.kind === "ball") balls += 1;
    else if (e.kind === "ballBag") balls += Math.max(0, Number((e as { count?: number }).count) || 0);
  }
  return { players, balls };
}

/** Séances triées : la plus proche à venir d'abord, puis les passées (plus récentes d'abord) */
export function sortSessions(list: TrainingSession[]): TrainingSession[] {
  const today = todayIso();
  const key = (s: TrainingSession) => `${s.date || "9999-99-99"} ${s.time || "99:99"}`;
  const upcoming = list.filter((s) => (s.date || "9999") >= today).sort((a, b) => key(a).localeCompare(key(b)));
  const past = list.filter((s) => (s.date || "9999") < today).sort((a, b) => key(b).localeCompare(key(a)));
  return [...upcoming, ...past];
}

// --- Format enregistré (lecture versionnée, lib/localData.ts) ---
// Pour changer le format d'une séance : incrémenter SESSION_VERSION, ajouter SESSION_MIGRATIONS[ancienne
// version] et écrire « v: SESSION_VERSION » dans les séances créées. Les schémas des exercices ont leur
// propre version (lib/training/diagramData.ts).
export const SESSION_VERSION = 1;
const SESSION_MIGRATIONS: Migrations = {};

/** Exercice lisible, ou null (identifiant manquant, schéma illisible ou d'un format plus récent) */
function readExercise(raw: unknown): SessionExercise | null {
  if (!isRecord(raw) || typeof raw.id !== "string") return null;
  const diagram = readDiagram(raw.diagram);
  if (!diagram) return null;
  const ok = typeof raw.title === "string" && finiteNum(raw.duration) && finiteNum(raw.players) && finiteNum(raw.balls);
  return {
    ...(ok ? raw : { ...raw, title: str(raw.title, "Exercice"), duration: num(raw.duration), players: num(raw.players), balls: num(raw.balls) }),
    diagram,
  } as SessionExercise;
}
const finiteNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);

const SESSION_SCHEMA: ItemSchema<TrainingSession> = {
  version: SESSION_VERSION,
  versionField: "v",
  migrations: SESSION_MIGRATIONS,
  normalize: (s) => {
    if (typeof s.id !== "string") return null;
    const exercises = (Array.isArray(s.exercises) ? s.exercises : []).map(readExercise).filter((e): e is SessionExercise => !!e);
    const repairs: Record<string, unknown> = { exercises };
    if (typeof s.title !== "string") repairs.title = "Séance";
    if (typeof s.date !== "string") repairs.date = "";
    if (typeof s.createdAt !== "string") repairs.createdAt = "";
    if (typeof s.updatedAt !== "string") repairs.updatedAt = str(s.createdAt);
    return { ...s, ...repairs } as unknown as TrainingSession;
  },
};

export function loadSessions(): TrainingSession[] {
  return loadList(TRAINING_SESSIONS_KEY, SESSION_SCHEMA);
}

/**
 * Enregistre les séances ; false si le stockage est plein ou indisponible.
 * Les séances et exercices illisibles sur cette version de l'application sont conservés tels quels.
 */
export function saveSessions(list: TrainingSession[]): boolean {
  return saveList(TRAINING_SESSIONS_KEY, list, SESSION_SCHEMA, (session, stored) => {
    const shown = new Set(session.exercises.map((e) => e.id));
    const hidden = (Array.isArray(stored.exercises) ? stored.exercises : []).filter(
      (e) => isRecord(e) && !readExercise(e) && (typeof e.id !== "string" || !shown.has(e.id))
    );
    return hidden.length ? { ...session, exercises: [...session.exercises, ...(hidden as SessionExercise[])] } : session;
  });
}

export function readActiveSessionId(): string | null {
  try { return localStorage.getItem(ACTIVE_SESSION_KEY); } catch { return null; }
}

export function storeActiveSessionId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_SESSION_KEY, id);
    else localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch { /* indisponible */ }
}
