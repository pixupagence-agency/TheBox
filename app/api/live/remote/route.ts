import { NextRequest, NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  applyLiveOp,
  normalizeCode,
  sanitizeOp,
  sha256Hex,
  stripUndefined,
  type LiveMatchDoc,
} from "@/lib/live/model";
import { getClientIp } from "@/lib/security";
import { isRateLimited, recordRateLimitHit, type RateLimitResult } from "@/lib/rateLimit";

// Télécommande du mode Live (adjoint, sans compte) : l'accès se fait par le lien secret (QR adjoint)
// ou le code à 6 caractères. Les écritures passent par le serveur (Admin SDK) : le document public
// du match reste en lecture seule pour tout le monde.

const ID_RE = /^[a-z0-9]{6,32}$/;
const CMD_RE = /^[a-zA-Z0-9_-]{6,48}$/;

// Essais de code ratés : au-delà, le code est refusé pendant la fenêtre (le lien secret reste valable).
// Par adresse (un appareil qui essaie des codes au hasard) et par match (essais répartis sur plusieurs adresses).
const CODE_FAIL_WINDOW_MS = 10 * 60_000;
const MAX_CODE_FAILS_PER_IP = 10;
const MAX_CODE_FAILS_PER_MATCH = 30;
const ipFailKey = (ip: string) => `live_code_ip_${ip}`;
const matchFailKey = (id: string) => `live_code_match_${id}`;

/** Fenêtre bloquée pour les codes (adresse ou match), sinon null */
async function codeAttemptsBlocked(ip: string, id?: string): Promise<RateLimitResult | null> {
  const byIp = await isRateLimited(ipFailKey(ip), MAX_CODE_FAILS_PER_IP, CODE_FAIL_WINDOW_MS);
  if (!byIp.allowed) return byIp;
  if (id) {
    const byMatch = await isRateLimited(matchFailKey(id), MAX_CODE_FAILS_PER_MATCH, CODE_FAIL_WINDOW_MS);
    if (!byMatch.allowed) return byMatch;
  }
  return null;
}

async function recordCodeFailure(ip: string, id?: string) {
  await Promise.all([
    recordRateLimitHit(ipFailKey(ip), CODE_FAIL_WINDOW_MS),
    id ? recordRateLimitHit(matchFailKey(id), CODE_FAIL_WINDOW_MS) : Promise.resolve(),
  ]);
}

const tooManyAttempts = (blocked: RateLimitResult) => {
  const minutes = Math.max(1, Math.ceil((blocked.retryAfterSeconds || 60) / 60));
  return NextResponse.json(
    { ok: false, error: `Trop d'essais de code. Réessayez dans ${minutes} min ou utilisez le QR adjoint.` },
    { status: 429, headers: { "Retry-After": String(blocked.retryAfterSeconds || 60) } }
  );
};

const fail = async (status: number, error: string, slow = false) => {
  // Ralentit les essais de code au hasard
  if (slow) await new Promise((r) => setTimeout(r, 600));
  return NextResponse.json({ ok: false, error }, { status });
};

type Credentials = { id?: unknown; token?: unknown; code?: unknown };

const isExpired = (key: Record<string, unknown>) => typeof key.expiresAt === "number" && key.expiresAt < Date.now();

/**
 * @param codeBlocked appelé seulement si le lien secret ne convient pas : renvoie la fenêtre bloquée
 * pour les codes (seul le lien secret est alors accepté), sinon null
 */
async function checkAccess(db: Firestore, body: Credentials, codeBlocked: () => Promise<RateLimitResult | null>) {
  const id = typeof body.id === "string" ? body.id : "";
  if (!ID_RE.test(id)) return { error: "Match introuvable" as const };
  const keySnap = await db.collection("liveEditorKeys").doc(id).get();
  if (!keySnap.exists) return { error: "Accès éditeur introuvable" as const };
  const key = keySnap.data() || {};
  if (key.revoked) return { error: "Cet accès a été révoqué par le coach" as const };
  if (isExpired(key)) return { error: "Cet accès a expiré" as const };
  const token = typeof body.token === "string" ? body.token : "";
  const code = typeof body.code === "string" ? normalizeCode(body.code) : "";
  const tokenOk = token.length >= 20 && key.tokenHash === (await sha256Hex(token));
  if (tokenOk) return { id };
  const blocked = await codeBlocked();
  if (blocked) return { error: "Trop d'essais" as const, blocked };
  if (code.length === 6 && key.code === code) return { id };
  return { error: "Lien ou code invalide" as const, id, invalid: true };
}

export async function POST(req: NextRequest) {
  const db = getAdminFirestore();
  if (!db) return fail(503, "Service indisponible (configuration serveur)");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Requête invalide");
  }

  const ip = getClientIp(req);

  // Saisie du code seul : retrouve le match correspondant
  if (body.action === "redeem") {
    const code = typeof body.code === "string" ? normalizeCode(body.code) : "";
    if (code.length !== 6) return fail(400, "Le code contient 6 caractères", true);
    const blocked = await codeAttemptsBlocked(ip);
    if (blocked) return tooManyAttempts(blocked);
    const q = await db.collection("liveEditorKeys").where("code", "==", code).limit(1).get();
    if (q.empty) {
      await recordCodeFailure(ip);
      return fail(404, "Code inconnu", true);
    }
    const key = q.docs[0].data();
    if (key.revoked) return fail(403, "Ce code a été révoqué par le coach", true);
    if (isExpired(key)) return fail(403, "Ce code a expiré", true);
    const match = await db.collection("liveMatches").doc(q.docs[0].id).get();
    if (!match.exists) return fail(404, "Match introuvable");
    if ((match.data() as LiveMatchDoc).status === "finished") return fail(403, "Le match est terminé : la télécommande est fermée");
    return NextResponse.json({ ok: true, id: q.docs[0].id });
  }

  const access = await checkAccess(db, body, () => codeAttemptsBlocked(ip, typeof body.id === "string" ? body.id : undefined));
  if ("error" in access) {
    if ("blocked" in access && access.blocked) return tooManyAttempts(access.blocked);
    if ("invalid" in access) await recordCodeFailure(ip, access.id);
    return fail(403, access.error || "Accès refusé", true);
  }
  const matchRef = db.collection("liveMatches").doc(access.id);

  if (body.action === "check") {
    const snap = await matchRef.get();
    if (!snap.exists) return fail(404, "Match introuvable");
    return NextResponse.json({ ok: true });
  }

  const cmdId = typeof body.cmdId === "string" ? body.cmdId : "";
  if (!CMD_RE.test(cmdId)) return fail(400, "Action invalide");
  const op = sanitizeOp(body.op);
  if (!op) return fail(400, "Action invalide");

  try {
    const result = await db.runTransaction(async (tx) => {
      const cmdRef = matchRef.collection("commands").doc(cmdId);
      const [snap, cmdSnap] = await Promise.all([tx.get(matchRef), tx.get(cmdRef)]);
      if (!snap.exists) return { status: 404, error: "Match introuvable" };
      // Action déjà reçue (renvoi après une coupure réseau) : rien à refaire
      if (cmdSnap.exists) return { status: 200 };
      const doc = snap.data() as LiveMatchDoc;
      if (doc.status === "finished" && op.kind !== "undo") return { status: 403, error: "Le match est terminé : la télécommande est fermée" };
      const now = Date.now();
      const patch = applyLiveOp(doc, op, cmdId, now);
      tx.create(cmdRef, stripUndefined({ op, createdAt: now, applied: false }));
      if (patch) tx.update(matchRef, stripUndefined({ ...patch, updatedAt: now }));
      return { status: 200 };
    });
    if (result.status !== 200) return fail(result.status, result.error || "Erreur");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ [Live remote]", err);
    return fail(500, "Erreur serveur, réessayez");
  }
}
