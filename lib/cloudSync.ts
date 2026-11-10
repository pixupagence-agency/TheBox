// Synchronisation des données du coach (équipes, effectifs, matchs, notes, événements…) avec Firestore.
//
// Le tableau tactique enregistre ces données dans le localStorage via de nombreuses clés.
// Plutôt que de modifier chaque point d'écriture, ce module :
//  1. restaure les données du compte depuis Firestore AVANT l'ouverture du tableau (restoreWorkspaceFromCloud) ;
//  2. surveille ensuite les clés concernées et envoie les changements toutes les quelques secondes
//     (startWorkspaceSync / stopWorkspaceSync).
//
// Stockage : users/{uid} n'est pas utilisé ; chaque clé est un ou plusieurs documents
// userData/{uid}/entries/{clé}__{n° de partie} (découpage pour rester sous la limite de 1 Mo par document).

import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

const SYNCED_EXACT_KEYS = new Set([
  "thebox_teams",
  "thebox_team_rosters",
  "thebox_matches_list",
  "thebox_active_match_id",
  "thebox_active_team_id",
  "thebox_tactical_notes",
]);

const SYNCED_KEY_PREFIXES = [
  "thebox_match_events_",
  "thebox_match_notes_",
  "thebox_match_state_",
  "thebox_pitch_state_",
  "thebox_setpiece_roles_",
  "thebox_opp_setpiece_roles_",
  "thebox_substitutes_",
  "thebox_opp_substitutes_",
  "thebox_team_config_done_",
];

const OWNER_KEY = "thebox_sync_owner"; // uid du compte auquel appartiennent les données locales
const META_KEY = "thebox_sync_meta"; // { clé: date (ms) de la dernière synchro réussie depuis cet appareil }

// Caractères par document : la limite Firestore est de 1 Mio par document, et un caractère accentué
// occupe 2 octets ; 450 000 caractères restent donc sous la limite dans tous les cas.
const PART_SIZE = 450_000;
const BATCH_MAX_OPS = 400;
const BATCH_MAX_CHARS = 8_000_000;
const SYNC_INTERVAL_MS = 4000;
const RETRY_DELAY_MS = 60_000;

export function isSyncedKey(key: string): boolean {
  return SYNCED_EXACT_KEYS.has(key) || SYNCED_KEY_PREFIXES.some((p) => key.startsWith(p));
}

// Les identifiants de document Firestore autorisés par les règles : lettres, chiffres, _ et -
const isStorableKey = (key: string) => /^[a-zA-Z0-9_\-]+$/.test(key) && key.length <= 110;

let currentUid: string | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let syncInFlight: Promise<void> | null = null;
let retryAfter = 0;
const lastSynced = new Map<string, string>(); // valeur connue en ligne pour chaque clé
const lastParts = new Map<string, number>(); // nombre de parties en ligne pour chaque clé

function entriesCollection(uid: string) {
  return collection(db, "userData", uid, "entries");
}

function readMeta(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeMeta(meta: Record<string, number>) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* stockage plein : sans conséquence, la méta sert seulement à arbitrer les conflits */
  }
}

function localSyncedEntries(): Map<string, string> {
  const result = new Map<string, string>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !isSyncedKey(key) || !isStorableKey(key)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) result.set(key, value);
  }
  return result;
}

function splitParts(value: string): string[] {
  if (value.length === 0) return [""];
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += PART_SIZE) parts.push(value.slice(i, i + PART_SIZE));
  return parts;
}

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

/**
 * Restaure les données du compte depuis Firestore dans le localStorage.
 * À appeler avant l'affichage du tableau tactique (qui lit le localStorage à son ouverture).
 */
export async function restoreWorkspaceFromCloud(
  uid: string,
  timeoutMs = 10_000
): Promise<{ ownerChanged: boolean }> {
  if (typeof window === "undefined") return { ownerChanged: false };

  const previousOwner = localStorage.getItem(OWNER_KEY);
  const ownerChanged = Boolean(previousOwner && previousOwner !== uid);

  // Données locales d'un autre compte : on ne les mélange pas (elles sont déjà sauvegardées sur son compte)
  if (ownerChanged) {
    for (const key of Array.from(localSyncedEntries().keys())) localStorage.removeItem(key);
    localStorage.removeItem(META_KEY);
    localStorage.setItem(OWNER_KEY, uid);
  }
  lastSynced.clear();
  lastParts.clear();

  let snap;
  try {
    snap = await withTimeout(getDocs(entriesCollection(uid)), timeoutMs);
  } catch (err) {
    // Hors ligne / règles non publiées : on garde les données de l'appareil
    if (!previousOwner) localStorage.setItem(OWNER_KEY, uid);
    console.warn("[Synchro en ligne] Restauration impossible, utilisation des données de l'appareil :", (err as any)?.code || (err as any)?.message || err);
    return { ownerChanged };
  }

  // Regroupement des parties par clé
  const grouped = new Map<string, { parts: number; updatedAt: number; values: string[] }>();
  snap.forEach((d) => {
    const data = d.data() as { key?: string; part?: number; parts?: number; value?: string; updatedAt?: number };
    if (!data.key || typeof data.value !== "string" || typeof data.part !== "number" || typeof data.parts !== "number") return;
    const entry = grouped.get(data.key) || { parts: data.parts, updatedAt: data.updatedAt || 0, values: [] };
    entry.values[data.part] = data.value;
    entry.updatedAt = Math.max(entry.updatedAt, data.updatedAt || 0);
    grouped.set(data.key, entry);
  });

  const meta = previousOwner === uid ? readMeta() : {};
  const local = localSyncedEntries();

  for (const [key, entry] of Array.from(grouped.entries())) {
    if (!isSyncedKey(key)) continue;
    const complete = entry.values.length === entry.parts && entry.values.every((v) => typeof v === "string");
    if (!complete) continue; // envoi interrompu en cours d'écriture : on garde la version locale
    const cloudValue = entry.values.join("");
    lastParts.set(key, entry.parts);

    const localValue = local.get(key);
    if (localValue === cloudValue) {
      lastSynced.set(key, cloudValue);
    } else if (localValue === undefined || entry.updatedAt > (meta[key] || 0)) {
      // Version en ligne plus récente (modifiée depuis un autre appareil) : elle remplace la version locale
      localStorage.setItem(key, cloudValue);
      lastSynced.set(key, cloudValue);
      meta[key] = entry.updatedAt;
    }
    // Sinon : modification locale plus récente, elle sera envoyée par la synchro
  }

  // Clés déjà synchronisées depuis cet appareil mais absentes en ligne : supprimées depuis un autre appareil
  if (previousOwner === uid) {
    for (const key of Array.from(local.keys())) {
      if (!grouped.has(key) && meta[key]) {
        localStorage.removeItem(key);
        delete meta[key];
      }
    }
  }

  writeMeta(meta);
  localStorage.setItem(OWNER_KEY, uid);
  return { ownerChanged };
}

/** Envoie en ligne les clés modifiées / supprimées depuis la dernière synchro. */
async function pushChanges(): Promise<void> {
  const uid = currentUid;
  if (!uid || Date.now() < retryAfter) return;

  const current = localSyncedEntries();
  const changed = Array.from(current.entries()).filter(([key, value]) => lastSynced.get(key) !== value);
  const removed = Array.from(lastSynced.keys()).filter((key) => !current.has(key));
  if (changed.length === 0 && removed.length === 0) return;

  const now = Date.now();
  const ops: Array<{ kind: "set" | "delete"; id: string; data?: any; size: number }> = [];

  for (const [key, value] of changed) {
    const parts = splitParts(value);
    parts.forEach((partValue, part) =>
      ops.push({
        kind: "set",
        id: `${key}__${part}`,
        data: { key, part, parts: parts.length, value: partValue, updatedAt: now },
        size: partValue.length,
      })
    );
    for (let part = parts.length; part < (lastParts.get(key) || 0); part++) {
      ops.push({ kind: "delete", id: `${key}__${part}`, size: 0 });
    }
  }
  for (const key of removed) {
    for (let part = 0; part < (lastParts.get(key) || 1); part++) {
      ops.push({ kind: "delete", id: `${key}__${part}`, size: 0 });
    }
  }

  try {
    let batch = writeBatch(db);
    let count = 0;
    let chars = 0;
    for (const op of ops) {
      if (count >= BATCH_MAX_OPS || chars + op.size > BATCH_MAX_CHARS) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
        chars = 0;
      }
      const ref = doc(db, "userData", uid, "entries", op.id);
      if (op.kind === "set") batch.set(ref, op.data);
      else batch.delete(ref);
      count++;
      chars += op.size;
    }
    if (count > 0) await batch.commit();

    if (uid !== currentUid) return; // déconnexion pendant l'envoi
    const meta = readMeta();
    for (const [key, value] of changed) {
      lastSynced.set(key, value);
      lastParts.set(key, splitParts(value).length);
      meta[key] = now;
    }
    for (const key of removed) {
      lastSynced.delete(key);
      lastParts.delete(key);
      delete meta[key];
    }
    writeMeta(meta);
  } catch (err: any) {
    // Hors ligne, règles non publiées… : nouvel essai plus tard, les données restent sur l'appareil
    retryAfter = Date.now() + RETRY_DELAY_MS;
    console.warn("[Synchro en ligne] Échec de l'envoi, nouvel essai dans 1 minute :", err?.code || err?.message || err);
  }
}

export function syncWorkspaceNow(): Promise<void> {
  if (!syncInFlight) {
    syncInFlight = pushChanges().finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}

const handlePageHide = () => {
  void syncWorkspaceNow();
};
const handleVisibilityChange = () => {
  if (document.visibilityState === "hidden") void syncWorkspaceNow();
};

/** Démarre la surveillance et l'envoi automatique des changements pour ce compte. */
export function startWorkspaceSync(uid: string) {
  if (typeof window === "undefined") return;
  if (currentUid === uid && intervalId) return;
  if (intervalId) clearInterval(intervalId);
  currentUid = uid;
  retryAfter = 0;
  intervalId = setInterval(() => void syncWorkspaceNow(), SYNC_INTERVAL_MS);
  window.addEventListener("pagehide", handlePageHide);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

/** Envoie les derniers changements puis arrête la synchro (à appeler avant la déconnexion). */
export async function stopWorkspaceSync(): Promise<void> {
  if (typeof window === "undefined") return;
  if (currentUid) {
    retryAfter = 0;
    try {
      await withTimeout(syncWorkspaceNow(), 5000);
    } catch {
      /* hors ligne : les données restent sur l'appareil et seront envoyées à la prochaine connexion */
    }
  }
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  currentUid = null;
  window.removeEventListener("pagehide", handlePageHide);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
}
