import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { refreshAccountStatus } from "@/lib/accountStatus";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

// Statut d'accès du coach connecté (essai, formule, masquage et suppression des données).
// Appelé à chaque connexion : il fixe aussi la fin d'essai des nouveaux comptes.
export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
  }
  const rateCheck = checkRateLimit(`account_status_${getClientIp(req)}`, 30, 60_000);
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
    const status = await refreshAccountStatus(db, user.uid);
    if (!status) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }
    return NextResponse.json({ status });
  } catch (err: any) {
    console.error("[Compte] Calcul du statut impossible :", err?.message || err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
