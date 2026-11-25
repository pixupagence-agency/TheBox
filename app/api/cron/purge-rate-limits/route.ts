import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Tâche planifiée Vercel (vercel.json > crons) : supprime les compteurs de limitation expirés
// (collection rateLimits, voir lib/rateLimit.ts). Vercel appelle la route en GET avec
// « Authorization: Bearer <CRON_SECRET> » ; sans CRON_SECRET configuré, la route refuse tout appel.

const BATCH_SIZE = 400;
/** Marge sous maxDuration : on s'arrête avant d'être coupé, le reste partira à la prochaine exécution */
const TIME_BUDGET_MS = 45_000;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const db = getAdminFirestore();
  if (!db) return NextResponse.json({ error: "Firebase Admin non configuré." }, { status: 503 });

  const started = Date.now();
  const now = Timestamp.now();
  let deleted = 0;
  let done = false;

  try {
    while (Date.now() - started < TIME_BUDGET_MS) {
      const snap = await db.collection("rateLimits").where("expiresAt", "<", now).limit(BATCH_SIZE).get();
      if (snap.empty) {
        done = true;
        break;
      }
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deleted += snap.size;
      if (snap.size < BATCH_SIZE) {
        done = true;
        break;
      }
    }
  } catch (err) {
    console.error("❌ [Cron rateLimits] Échec du nettoyage :", (err as Error)?.message || err);
    return NextResponse.json({ error: "Nettoyage interrompu.", deleted }, { status: 500 });
  }

  console.log(`🧹 [Cron rateLimits] ${deleted} compteur(s) expiré(s) supprimé(s)${done ? "" : " (suite à la prochaine exécution)"}.`);
  return NextResponse.json({ ok: true, deleted, done });
}
