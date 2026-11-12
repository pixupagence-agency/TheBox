// Synchronisation des données du coach (équipes, effectifs, matchs, notes, événements…) avec Firestore.
//
// Le tableau tactique enregistre ces données dans le localStorage via de nombreuses clés.
// Plutôt que de modifier chaque point d'écriture, ce module :
//  1. restaure les données du compte depuis Firestore AVANT l'ouverture du tableau (restoreWorkspaceFromCloud) ;
//  2. surveille ensuite les clés concernées et envoie les changements toutes les quelques secondes
//     (startWorkspaceSync / stopWorkspaceSync).
//
// Stockage (v2, voir lib/cloudModel.ts) : documents structurés sous users/{uid}/teams, players, matches,
// matchData et settings.
//
// Migration depuis la v1 (blocs bruts dans userData/{uid}/entries) : à la première connexion, les blocs
// sont relus puis réécrits dans la nouvelle structure ; le document settings/_migration est alors créé.
// Les blocs v1 sont conservés en lecture seule pendant 60 jours (un onglet resté ouvert sur l'ancienne
// version peut encore y écrire : ses changements plus récents sont repris), puis supprimés.

import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import {
  CLOUD_COLLECTIONS,
  CloudDocRead,
  MIGRATION_DOC_ID,
  docPath,
  docsForKey,
  rebuildKeysFromDocs,
  stableStringify,
} from "./cloudModel";

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

const BATCH_MAX_OPS = 400;
const BATCH_MAX_CHARS = 8_000_000;
const SYNC_INTERVAL_MS = 4000;
const RETRY_DELAY_MS = 60_000;
const LEGACY_RETENTION_MS = 60 * 24 * 60 * 60 * 1000; // 60 jours

export function isSyncedKey(key: string): boolean {
  return SYNCED_EXACT_KEYS.has(key) || SYNCED_KEY_PREFIXES.some((p) => key.startsWith(p));
}

let currentUid: string | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let syncInFlight: Promise<void> | null = null;
let retryAfter = 0;
let needsMigrationMarker = false;

const lastSynced = new Map<string, string>(); // valeur localStorage connue en ligne, par clé
const docState = new Map<string, string>(); // contenu connu en ligne, par chemin de document
const docsOfKey = new Map<string, Set<string>>(); // documents en ligne appartenant à chaque clé

function resetState() {
  lastSynced.clear();
  docState.clear();
  docsOfKey.clear();
  needsMigrationMarker = false;
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
    if (!key || !isSyncedKey(key)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) result.set(key, value);
  }
  return result;
}

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

const canonical = (data: Record<string, any>) => {
  const { updatedAt, ...rest } = data;
  return stableStringify(rest);
};

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

async function readStructuredDocs(uid: string): Promise<{ docs: CloudDocRead[]; migration: Record<string, any> | null }> {
  const snaps = await Promise.all(CLOUD_COLLECTIONS.map((c) => getDocs(collection(db, "users", uid, c))));
  const docs: CloudDocRead[] = [];
  let migration: Record<string, any> | null = null;
  snaps.forEach((snap, i) => {
    const coll = CLOUD_COLLECTIONS[i];
    snap.forEach((d) => {
      if (coll === "settings" && d.id === MIGRATION_DOC_ID) migration = d.data();
      else docs.push({ coll, id: d.id, data: d.data() });
    });
  });
  return { docs, migration };
}

/** Anciennes données v1 : blocs { key, part, parts, value, updatedAt } dans userData/{uid}/entries. */
async function readLegacyEntries(uid: string): Promise<Map<string, { value: string; updatedAt: number }>> {
  const snap = await getDocs(collection(db, "userData", uid, "entries"));
  const grouped = new Map<string, { parts: number; updatedAt: number; values: string[] }>();
  snap.forEach((d) => {
    const data = d.data() as { key?: string; part?: number; parts?: number; value?: string; updatedAt?: number };
    if (!data.key || typeof data.value !== "string" || typeof data.part !== "number" || typeof data.parts !== "number") return;
    const entry = grouped.get(data.key) || { parts: data.parts, updatedAt: data.updatedAt || 0, values: [] };
    entry.values[data.part] = data.value;
    entry.updatedAt = Math.max(entry.updatedAt, data.updatedAt || 0);
    grouped.set(data.key, entry);
  });
  const result = new Map<string, { value: string; updatedAt: number }>();
  for (const [key, entry] of Array.from(grouped.entries())) {
    const complete = entry.values.length === entry.parts && entry.values.every((v) => typeof v === "string");
    if (complete && isSyncedKey(key)) result.set(key, { value: entry.values.join(""), updatedAt: entry.updatedAt });
  }
  return result;
}

/** Suppression des données v1 (blocs userData et schémas « tactics ») après la période de conservation. */
async function cleanupLegacyData(uid: string): Promise<void> {
  try {
    const [entries, tactics] = await Promise.all([
      getDocs(collection(db, "userData", uid, "entries")),
      getDocs(query(collection(db, "tactics"), where("userId", "==", uid))),
    ]);
    const refs = [...entries.docs.map((d) => d.ref), ...tactics.docs.map((d) => d.ref)];
    for (let i = 0; i < refs.length; i += BATCH_MAX_OPS) {
      const batch = writeBatch(db);
      refs.slice(i, i + BATCH_MAX_OPS).forEach((r) => batch.delete(r));
      await batch.commit();
    }
    const batch = writeBatch(db);
    batch.set(doc(db, "users", uid, "settings", MIGRATION_DOC_ID), { legacyCleanedAt: Date.now() }, { merge: true });
    await batch.commit();
  } catch (err: any) {
    console.warn("[Synchro en ligne] Nettoyage des anciennes données reporté :", err?.code || err?.message || err);
  }
}

// ---------------------------------------------------------------------------
// Restauration
// ---------------------------------------------------------------------------

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
  resetState();

  let structured: { docs: CloudDocRead[]; migration: Record<string, any> | null };
  let legacy = new Map<string, { value: string; updatedAt: number }>();
  try {
    structured = await withTimeout(readStructuredDocs(uid), timeoutMs);
    const migratedAt: number = structured.migration?.migratedAt || 0;
    const keepReadingLegacy = !structured.migration || Date.now() - migratedAt < LEGACY_RETENTION_MS;
    if (keepReadingLegacy) {
      try {
        legacy = await withTimeout(readLegacyEntries(uid), timeoutMs);
      } catch {
        if (!structured.migration) throw new Error("legacy-unavailable"); // migration impossible sans les blocs v1
      }
    } else if (!structured.migration?.legacyCleanedAt) {
      void cleanupLegacyData(uid);
    }
  } catch (err) {
    // Hors ligne / règles non publiées : on garde les données de l'appareil
    if (!previousOwner) localStorage.setItem(OWNER_KEY, uid);
    console.warn("[Synchro en ligne] Restauration impossible, utilisation des données de l'appareil :", (err as any)?.code || (err as any)?.message || err);
    return { ownerChanged };
  }

  needsMigrationMarker = !structured.migration;

  // État connu en ligne (structure v2)
  for (const d of structured.docs) {
    docState.set(docPath(d.coll, d.id), canonical(d.data));
  }
  const cloudKeys = rebuildKeysFromDocs(structured.docs);
  for (const [key, entry] of Array.from(cloudKeys.entries())) docsOfKey.set(key, new Set(entry.paths));
  // Documents dont la clé n'a pas pu être reconstruite (parties manquantes) : rattachés pour être réécrits
  for (const d of structured.docs) {
    const key = d.data?.key;
    if (typeof key === "string" && !docsOfKey.has(key)) docsOfKey.set(key, new Set());
    if (typeof key === "string") docsOfKey.get(key)!.add(docPath(d.coll, d.id));
  }

  // Candidats par clé : la version la plus récente entre v2 et v1 (v2 l'emporte à égalité)
  const candidates = new Map<string, { value: string; updatedAt: number; fromLegacy: boolean }>();
  for (const [key, entry] of Array.from(cloudKeys.entries())) {
    if (isSyncedKey(key)) candidates.set(key, { value: entry.value, updatedAt: entry.updatedAt, fromLegacy: false });
  }
  for (const [key, entry] of Array.from(legacy.entries())) {
    const current = candidates.get(key);
    if (!current || entry.updatedAt > current.updatedAt) {
      candidates.set(key, { value: entry.value, updatedAt: entry.updatedAt, fromLegacy: true });
    }
  }

  const meta = previousOwner === uid ? readMeta() : {};
  const local = localSyncedEntries();

  for (const [key, cand] of Array.from(candidates.entries())) {
    const localValue = local.get(key);
    if (localValue === cand.value) {
      // Une valeur issue de la v1 n'est pas encore dans la v2 : on la laisse « à envoyer »
      if (!cand.fromLegacy) lastSynced.set(key, cand.value);
      meta[key] = Math.max(meta[key] || 0, cand.updatedAt);
    } else if (localValue === undefined || cand.updatedAt > (meta[key] || 0)) {
      // Version en ligne plus récente (modifiée depuis un autre appareil) : elle remplace la version locale
      localStorage.setItem(key, cand.value);
      if (!cand.fromLegacy) lastSynced.set(key, cand.value);
      meta[key] = cand.updatedAt;
    }
    // Sinon : modification locale plus récente, elle sera envoyée par la synchro
  }

  // Clés déjà synchronisées depuis cet appareil mais absentes en ligne : supprimées depuis un autre appareil
  if (previousOwner === uid) {
    for (const key of Array.from(local.keys())) {
      if (!candidates.has(key) && meta[key]) {
        localStorage.removeItem(key);
        delete meta[key];
      }
    }
  }

  writeMeta(meta);
  localStorage.setItem(OWNER_KEY, uid);
  return { ownerChanged };
}

// ---------------------------------------------------------------------------
// Envoi
// ---------------------------------------------------------------------------

type Op = { kind: "set" | "delete"; path: string; coll: string; id: string; data?: any; size: number; canon?: string };

/** Envoie en ligne les clés modifiées / supprimées depuis la dernière synchro. */
async function pushChanges(): Promise<void> {
  const uid = currentUid;
  if (!uid || Date.now() < retryAfter) return;

  const current = localSyncedEntries();
  const changed = Array.from(current.entries()).filter(([key, value]) => lastSynced.get(key) !== value);
  const removed = Array.from(docsOfKey.keys()).filter((key) => !current.has(key));
  if (changed.length === 0 && removed.length === 0 && !needsMigrationMarker) return;

  const now = Date.now();
  const ops: Op[] = [];
  const nextPathsByKey = new Map<string, Set<string>>();

  for (const [key, value] of changed) {
    const specs = docsForKey(key, value);
    const nextPaths = new Set<string>();
    for (const spec of specs) {
      const path = docPath(spec.coll, spec.id);
      nextPaths.add(path);
      const canon = canonical(spec.data);
      if (docState.get(path) !== canon) {
        ops.push({ kind: "set", path, coll: spec.coll, id: spec.id, data: { ...spec.data, updatedAt: now }, size: (spec.data.raw || "").length, canon });
      }
    }
    for (const path of Array.from(docsOfKey.get(key) || [])) {
      if (!nextPaths.has(path)) {
        const [coll, id] = path.split("/");
        ops.push({ kind: "delete", path, coll, id, size: 0 });
      }
    }
    nextPathsByKey.set(key, nextPaths);
  }
  for (const key of removed) {
    for (const path of Array.from(docsOfKey.get(key) || [])) {
      const [coll, id] = path.split("/");
      ops.push({ kind: "delete", path, coll, id, size: 0 });
    }
  }
  if (needsMigrationMarker) {
    ops.push({
      kind: "set",
      path: docPath("settings", MIGRATION_DOC_ID),
      coll: "settings",
      id: MIGRATION_DOC_ID,
      data: { dataVersion: 2, migratedAt: now },
      size: 0,
    });
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
      const ref = doc(db, "users", uid, op.coll, op.id);
      if (op.kind === "set") batch.set(ref, op.data);
      else batch.delete(ref);
      count++;
      chars += op.size;
    }
    if (count > 0) await batch.commit();

    if (uid !== currentUid) return; // déconnexion pendant l'envoi
    for (const op of ops) {
      if (op.kind === "set" && op.canon !== undefined) docState.set(op.path, op.canon);
      if (op.kind === "delete") docState.delete(op.path);
    }
    const meta = readMeta();
    for (const [key, value] of changed) {
      lastSynced.set(key, value);
      docsOfKey.set(key, nextPathsByKey.get(key) || new Set());
      meta[key] = now;
    }
    for (const key of removed) {
      lastSynced.delete(key);
      docsOfKey.delete(key);
      delete meta[key];
    }
    needsMigrationMarker = false;
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
