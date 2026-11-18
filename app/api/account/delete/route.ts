import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { deleteCoachAccount } from "@/lib/accountDeletion";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONFIRMATION_WORD = "SUPPRIMER";

// Suppression définitive du compte du coach connecté (droit à l'effacement, RGPD art. 17).
export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
  }
  const rateCheck = checkRateLimit(`account_delete_${getClientIp(req)}`, 3, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const user = await verifyFirebaseIdToken(authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null);
  if (!user) {
    return NextResponse.json({ error: "Veuillez vous reconnecter pour supprimer votre compte." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (String(body?.confirm || "").trim().toUpperCase() !== CONFIRMATION_WORD) {
    return NextResponse.json({ error: `Tapez ${CONFIRMATION_WORD} pour confirmer la suppression.` }, { status: 400 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Service indisponible. Contactez le support." }, { status: 503 });
  }

  try {
    await deleteCoachAccount(db, user.uid, user.email);
    console.log(`[Compte] Compte ${user.uid} supprimé à la demande de son titulaire.`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[Compte] Échec de la suppression du compte ${user.uid} :`, err?.message || err);
    return NextResponse.json(
      { error: "La suppression n'a pas pu aboutir. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }
}
