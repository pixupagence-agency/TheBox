import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { deleteCoachData, isSuperAdminUser } from "@/lib/accountDeletion";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Plateforme admin : supprime les données d'un coach (équipes, joueurs, matchs, notes, schémas).
// Le compte, le profil et l'abonnement du coach sont conservés.
export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
  }
  const rateCheck = checkRateLimit(`admin_delete_data_${getClientIp(req)}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const user = await verifyFirebaseIdToken(authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null);
  const db = getAdminFirestore();
  if (!user || !db || !(await isSuperAdminUser(db, user.uid, user.email))) {
    return NextResponse.json({ error: "Réservé au super administrateur." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const coachId = typeof body?.coachId === "string" ? body.coachId.trim() : "";
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(coachId)) {
    return NextResponse.json({ error: "Identifiant de coach invalide." }, { status: 400 });
  }

  try {
    await deleteCoachData(db, coachId);
    console.log(`[Admin] Données du coach ${coachId} supprimées par ${user.uid}.`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[Admin] Échec de la suppression des données du coach ${coachId} :`, err?.message || err);
    return NextResponse.json({ error: "La suppression n'a pas pu aboutir." }, { status: 500 });
  }
}
