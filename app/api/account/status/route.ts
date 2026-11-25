import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { refreshAccountStatus } from "@/lib/accountStatus";
import { deleteCoachAccount, isScheduledDeletionDue } from "@/lib/accountDeletion";
import { getClientIp, isAllowedOrigin } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Statut d'accès du coach connecté (essai, formule, masquage des données, suppression programmée).
// Appelé à chaque connexion : il fixe aussi la fin d'essai des nouveaux comptes.
export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
  }
  const rateCheck = await rateLimit(`account_status_${getClientIp(req)}`, 30, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const user = await verifyFirebaseIdToken(authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null);
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
  }

  try {
    const profile = (await db.collection("users").doc(user.uid).get()).data();

    // Suppression programmée arrivée à échéance sans que le webhook Stripe l'ait faite
    if (isScheduledDeletionDue(profile)) {
      await deleteCoachAccount(db, user.uid, user.email);
      console.log(`[Compte] Compte ${user.uid} supprimé (échéance de la suppression programmée).`);
      return NextResponse.json({ deleted: true }, { status: 410 });
    }

    const status = await refreshAccountStatus(db, user.uid, profile, user.email);
    if (!status) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }
    return NextResponse.json({ status });
  } catch (err: any) {
    console.error("[Compte] Calcul du statut impossible :", err?.message || err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
