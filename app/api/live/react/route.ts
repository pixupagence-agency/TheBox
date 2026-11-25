import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { LiveReactionId } from "@/lib/live/model";
import { getClientIp } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";

// Réactions des suiveurs d'un match en direct (visiteurs sans compte).
// Le document public du match reste en lecture seule : le serveur (Admin SDK) incrémente le compteur.
// Les touches sont regroupées côté client (plusieurs par envoi) ; ici, plafond par envoi et par adresse
// (compteur partagé entre les instances du serveur : lib/rateLimit.ts).

const ID_RE = /^[a-z0-9]{6,32}$/;
const MAX_PER_REQUEST = 20;
const MAX_PER_MINUTE = 120;
// Mêmes identifiants que LIVE_REACTIONS (lib/live/model.ts)
const REACTION_IDS: readonly LiveReactionId[] = ["clap", "fire", "muscle", "wow", "heart", "sad"];
const isReactionId = (v: unknown): v is LiveReactionId => typeof v === "string" && (REACTION_IDS as readonly string[]).includes(v);

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

  const limit = await rateLimit(`live_react_${getClientIp(req)}_${id}`, MAX_PER_MINUTE, 60_000, count);
  if (!limit.allowed) return fail(429, "Trop de réactions, patientez un instant");

  const ref = db.collection("liveMatches").doc(id);
  try {
    // update() échoue si le match n'existe pas : aucun document n'est créé
    await ref.update({ [`reactions.${reaction}`]: FieldValue.increment(count) });
  } catch {
    return fail(404, "Match introuvable");
  }
  return NextResponse.json({ ok: true });
}
