import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { verifyFirebaseIdToken, findCoachProfile } from "@/lib/firebase-admin";
import {
  validateSafeReturnUrl,
  checkRateLimit,
  getClientIp,
  isAllowedOrigin
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    // CSRF Protection
    if (!isAllowedOrigin(req)) {
      return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
    }

    // IP Rate Limiting (15 portal sessions per minute per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`portal_${clientIp}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes. Veuillez patienter ${rateCheck.retryAfterSeconds} secondes avant de réessayer.` },
        { 
          status: 429, 
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds || 60) } 
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    // Seuls le jeton de connexion et l'URL de retour sont utilisés : l'identifiant client et l'e-mail
    // envoyés par le navigateur sont ignorés, pour qu'on ne puisse pas ouvrir le portail d'un autre coach.
    const { returnUrl } = body;

    const stripe = getStripe();
    if (!stripe || !isStripeConfigured) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await verifyFirebaseIdToken(idToken);
    if (!user) {
      return NextResponse.json(
        { error: "Veuillez vous reconnecter pour accéder à la gestion de votre abonnement.", requiresAuth: true },
        { status: 401 }
      );
    }

    const profile = await findCoachProfile({ coachId: user.uid });
    let targetCustomerId = (profile?.data?.stripeCustomerId as string | undefined) || null;

    if (!targetCustomerId && user.email) {
      try {
        const existingCustomers = await stripe.customers.list({
          email: user.email.trim().toLowerCase(),
          limit: 1,
        });
        if (existingCustomers.data && existingCustomers.data.length > 0) {
          targetCustomerId = existingCustomers.data[0].id;
        }
      } catch (e) {
        console.warn("Could not query Stripe customers by email", e);
      }
    }

    if (!targetCustomerId) {
      return NextResponse.json(
        { error: "Aucun profil client Stripe trouvé pour votre adresse email. Vous pouvez vous désabonner directement dans l'application." },
        { status: 404 }
      );
    }

    const fallbackOrigin = req.headers.get("origin") || process.env.APP_URL || req.nextUrl.origin || "http://localhost:3000";
    const safeReturnUrl = validateSafeReturnUrl(returnUrl, fallbackOrigin);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: safeReturnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la redirection vers le portail client Stripe" },
      { status: 500 }
    );
  }
}
