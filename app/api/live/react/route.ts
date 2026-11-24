import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { LiveReactionId } from "@/lib/live/model";

// Réactions des suiveurs d'un match en direct (visiteurs sans compte).
// Le document public du match reste en lecture seule : le serveur (Admin SDK) incrémente le compteur.
// Les touches sont regroupées côté client (plusieurs par envoi) ; ici, plafond par envoi et par adresse.

const ID_RE = /^[a-z0-9]{6,32}$/;
const MAX_PER_REQUEST = 20;
const MAX_PER_MINUTE = 120;
// Mêmes identifiants que LIVE_REACTIONS (lib/live/model.ts)
const REACTION_IDS: readonly LiveReactionId[] = ["clap", "fire", "muscle", "wow", "heart", "sad"];
const isReactionId = (v: unknown): v is LiveReactionId => typeof v === "string" && (REACTION_IDS as readonly string[]).includes(v);

// Limite approximative par adresse (mémoire de l'instance serveur)
const hits = new Map<string, { windowStart: number; count: number }>();
const allow = (key: string, n: number) => {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.windowStart > 60_000) {
    if (hits.size > 5000) hits.clear();
    hits.set(key, { windowStart: now, count: n });
    return true;
  }
  if (h.count + n > MAX_PER_MINUTE) return false;
  h.count += n;
  return true;
};

const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: NextRequest) {
  const db = getAdminFirestore();
  if (!db) return fail(503, "Service indisponible");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Requête invalide");
  }

  const id = typeof body.id === "string" ? body.id : "";
  const reaction = body.reaction;
  const count = Math.min(MAX_PER_REQUEST, Math.max(1, Math.floor(Number(body.count) || 1)));
  if (!ID_RE.test(id) || !isReactionId(reaction)) return fail(400, "Réaction invalide");

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (!allow(`${ip}:${id}`, count)) return fail(429, "Trop de réactions, patientez un instant");

  const ref = db.collection("liveMatches").doc(id);
  try {
    // update() échoue si le match n'existe pas : aucun document n'est créé
    await ref.update({ [`reactions.${reaction}`]: FieldValue.increment(count) });
  } catch {
    return fail(404, "Match introuvable");
  }
  return NextResponse.json({ ok: true });
}
