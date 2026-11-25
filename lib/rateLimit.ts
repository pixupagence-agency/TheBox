/**
 * Limitation du nombre de requêtes, partagée entre toutes les instances du serveur.
 *
 * Sur Vercel, chaque requête peut tomber sur une instance différente (et les instances redémarrent
 * souvent) : un compteur gardé en mémoire ne suffit pas. Les compteurs sont donc tenus dans
 * Firestore (collection `rateLimits`, écrite uniquement par l'Admin SDK : les règles la ferment
 * aux clients). Fenêtre fixe : un document par clé et par fenêtre de temps.
 *
 * Un compteur en mémoire sert de premier filtre (refus immédiat sans lecture Firestore) et de
 * secours si l'Admin SDK n'est pas configuré ou ne répond pas : on ne bloque jamais un coach
 * à cause d'une panne du limiteur.
 *
 * Nettoyage : chaque document porte `expiresAt` ; la tâche planifiée Vercel
 * app/api/cron/purge-rate-limits (vercel.json, chaque nuit) supprime les compteurs expirés.
 *
 * Réservé au serveur (routes /api).
 */
import { createHash } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

const COLLECTION = "rateLimits";
/** Marge conservée après la fin d'une fenêtre avant suppression par le TTL */
const TTL_MARGIN_MS = 10 * 60_000;

// --- Compteurs locaux (mémoire de l'instance) ---

const memory = new Map<string, { windowStart: number; count: number }>();

function windowOf(windowMs: number, now: number) {
  const start = Math.floor(now / windowMs) * windowMs;
  return { start, retryAfterSeconds: Math.max(1, Math.ceil((start + windowMs - now) / 1000)) };
}

function memoryKey(key: string, windowMs: number) {
  return `${windowMs}:${key}`;
}

function memoryCount(key: string, windowMs: number, start: number): number {
  const rec = memory.get(memoryKey(key, windowMs));
  return rec && rec.windowStart === start ? rec.count : 0;
}

function memoryAdd(key: string, windowMs: number, start: number, cost: number) {
  if (memory.size > 10_000) {
    // Purge des fenêtres terminées (et filet de sécurité si la carte grossit trop)
    const now = Date.now();
    for (const [k, rec] of memory) {
      const w = Number(k.slice(0, k.indexOf(":")));
      if (rec.windowStart + w < now) memory.delete(k);
    }
    if (memory.size > 10_000) memory.clear();
  }
  const k = memoryKey(key, windowMs);
  const rec = memory.get(k);
  if (rec && rec.windowStart === start) rec.count += cost;
  else memory.set(k, { windowStart: start, count: cost });
}

// --- Compteurs partagés (Firestore) ---

function docRef(key: string, windowMs: number, start: number) {
  const db = getAdminFirestore();
  if (!db) return null;
  // Empreinte de la clé : pas d'adresse IP ni d'e-mail en clair dans la base, et un identifiant valide
  const hash = createHash("sha256").update(`${windowMs}:${key}`).digest("hex").slice(0, 40);
  return { db, ref: db.collection(COLLECTION).doc(`${hash}_${start}`) };
}

/**
 * Compte une requête (ou `cost` unités) et indique si elle est autorisée.
 * @param key  identifiant du compteur, ex. `contact_${ip}` ou `schema_uid_${uid}`
 * @param limit nombre maximal d'unités par fenêtre
 * @param windowMs durée de la fenêtre
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  cost = 1
): Promise<RateLimitResult> {
  const now = Date.now();
  const { start, retryAfterSeconds } = windowOf(windowMs, now);

  const local = memoryCount(key, windowMs, start);
  if (local + cost > limit) return { allowed: false, remaining: 0, retryAfterSeconds };
  memoryAdd(key, windowMs, start, cost);
  const localResult: RateLimitResult = { allowed: true, remaining: Math.max(0, limit - local - cost) };

  const target = docRef(key, windowMs, start);
  if (!target) return localResult;

  try {
    return await target.db.runTransaction(async (tx) => {
      const snap = await tx.get(target.ref);
      const count = snap.exists ? Number(snap.get("count")) || 0 : 0;
      if (count + cost > limit) return { allowed: false, remaining: 0, retryAfterSeconds };
      tx.set(target.ref, {
        count: count + cost,
        expiresAt: Timestamp.fromMillis(start + windowMs + TTL_MARGIN_MS),
      });
      return { allowed: true, remaining: Math.max(0, limit - count - cost) };
    });
  } catch (err) {
    console.warn("⚠️ [RateLimit] Compteur partagé indisponible, limite locale appliquée :", (err as Error)?.message || err);
    return localResult;
  }
}

/**
 * Indique si un compteur a déjà atteint sa limite, sans le faire avancer.
 * À utiliser avec `recordRateLimitHit` pour ne compter que les échecs (ex. mauvais code saisi).
 */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const { start, retryAfterSeconds } = windowOf(windowMs, now);
  if (memoryCount(key, windowMs, start) >= limit) return { allowed: false, remaining: 0, retryAfterSeconds };

  const target = docRef(key, windowMs, start);
  if (!target) return { allowed: true, remaining: limit - memoryCount(key, windowMs, start) };
  try {
    const snap = await target.ref.get();
    const count = snap.exists ? Number(snap.get("count")) || 0 : 0;
    if (count >= limit) return { allowed: false, remaining: 0, retryAfterSeconds };
    return { allowed: true, remaining: limit - count };
  } catch {
    return { allowed: true, remaining: limit - memoryCount(key, windowMs, start) };
  }
}

/** Fait avancer un compteur (sans vérifier la limite), voir `isRateLimited`. */
export async function recordRateLimitHit(key: string, windowMs: number): Promise<void> {
  const now = Date.now();
  const { start } = windowOf(windowMs, now);
  memoryAdd(key, windowMs, start, 1);
  const target = docRef(key, windowMs, start);
  if (!target) return;
  try {
    await target.ref.set(
      { count: FieldValue.increment(1), expiresAt: Timestamp.fromMillis(start + windowMs + TTL_MARGIN_MS) },
      { merge: true }
    );
  } catch {
    /* compteur local déjà mis à jour */
  }
}
