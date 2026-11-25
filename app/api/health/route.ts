import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// Route de santé pour la sonde de surveillance externe (UptimeRobot, Better Stack…) :
// 200 si l'application et Firestore répondent, 503 sinon (quota épuisé, base injoignable, Admin SDK absent).
//
// Une lecture Firestore par vérification : le résultat est gardé 60 s en mémoire et en cache CDN,
// pour qu'un appel répété (ou malveillant) ne puisse pas épuiser le quota de lectures.

const CACHE_MS = 60_000;
const TIMEOUT_MS = 8_000;

type Health = { ok: boolean; firestore: "ok" | "quota" | "error" | "not_configured"; checkedAt: string };
let cached: { at: number; health: Health } | null = null;

async function check(): Promise<Health> {
  const checkedAt = new Date().toISOString();
  const db = getAdminFirestore();
  if (!db) return { ok: false, firestore: "not_configured", checkedAt };
  try {
    await Promise.race([
      db.doc("app_config/maintenance").get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);
    return { ok: true, firestore: "ok", checkedAt };
  } catch (err) {
    const e = err as { code?: number; message?: string };
    // Code gRPC 8 = RESOURCE_EXHAUSTED (quota gratuit de la journée épuisé)
    const quota = e?.code === 8 || /RESOURCE_EXHAUSTED|quota/i.test(e?.message || "");
    console.error("❌ [Health] Firestore :", e?.message);
    return { ok: false, firestore: quota ? "quota" : "error", checkedAt };
  }
}

export async function GET() {
  if (!cached || Date.now() - cached.at > CACHE_MS) {
    cached = { at: Date.now(), health: await check() };
  }
  const { health } = cached;
  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
    headers: { "Cache-Control": "public, max-age=0, s-maxage=60" },
  });
}
