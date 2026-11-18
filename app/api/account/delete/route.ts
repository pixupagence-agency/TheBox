import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { cancelScheduledDeletion, requestCoachAccountDeletion } from "@/lib/accountDeletion";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONFIRMATION_WORD = "SUPPRIMER";

/** Contrôles communs : origine, débit, connexion, base disponible. */
async function authorize(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return { error: NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 }) };
  }
  const rateCheck = checkRateLimit(`account_delete_${getClientIp(req)}`, 3, 60_000);
  if (!rateCheck.allowed) {
    return { error: NextResponse.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429 }) };
  }
  const authHeader = req.headers.get("authorization") || "";
  const user = await verifyFirebaseIdToken(authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null);
  if (!user) {
    return { error: NextResponse.json({ error: "Veuillez vous reconnecter pour gérer votre compte." }, { status: 401 }) };
  }
  const db = getAdminFirestore();
  if (!db) {
    return { error: NextResponse.json({ error: "Service indisponible. Contactez le support." }, { status: 503 }) };
  }
  return { user, db };
}

// Suppression du compte du coach connecté (droit à l'effacement, RGPD art. 17).
// Abonnement payé en cours : suppression programmée à la fin de la période payée (accès conservé d'ici là).
// Sinon : suppression immédiate.
export async function POST(req: NextRequest) {
  const auth = await authorize(req);
  if ("error" in auth) return auth.error;
  const { user, db } = auth;

  const body = await req.json().catch(() => null);
  if (String(body?.confirm || "").trim().toUpperCase() !== CONFIRMATION_WORD) {
    return NextResponse.json({ error: `Tapez ${CONFIRMATION_WORD} pour confirmer la suppression.` }, { status: 400 });
  }

  try {
    const result = await requestCoachAccountDeletion(db, user.uid, user.email);
    console.log(
      result.mode === "scheduled"
        ? `[Compte] Suppression du compte ${user.uid} programmée au ${result.deletionAt}.`
        : `[Compte] Compte ${user.uid} supprimé à la demande de son titulaire.`
    );
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error(`[Compte] Échec de la suppression du compte ${user.uid} :`, err?.message || err);
    return NextResponse.json(
      { error: "La suppression n'a pas pu aboutir. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }
}

// Annulation d'une suppression programmée (l'abonnement reprend s'il avait été arrêté par la demande).
export async function DELETE(req: NextRequest) {
  const auth = await authorize(req);
  if ("error" in auth) return auth.error;
  const { user, db } = auth;

  try {
    await cancelScheduledDeletion(db, user.uid);
    console.log(`[Compte] Suppression programmée du compte ${user.uid} annulée par son titulaire.`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[Compte] Échec de l'annulation de la suppression du compte ${user.uid} :`, err?.message || err);
    return NextResponse.json(
      { error: "L'annulation n'a pas pu aboutir. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }
}
