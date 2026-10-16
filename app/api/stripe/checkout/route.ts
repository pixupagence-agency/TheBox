import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PLANS, isStripeConfigured } from "@/lib/stripe";
import { 
  validateSafeReturnUrl, 
  isValidEmail, 
  sanitizeText,
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

    // IP Rate Limiting (15 checkout sessions per minute per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`checkout_${clientIp}`, 15, 60000);
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
      return NextResponse.json({ error: "Paramètres de paiement invalides." }, { status: 400 });
    }

    const { planId, coachId, coachEmail, returnUrl } = body;

    if (!planId || typeof planId !== "string" || !STRIPE_PLANS[planId]) {
      return NextResponse.json(
        { error: `Formule invalide ou introuvable : ${planId}` },
        { status: 400 }
      );
    }

    const plan = STRIPE_PLANS[planId];
    const stripe = getStripe();

    // Check if Stripe is configured on the server
    if (!stripe || !isStripeConfigured) {
      return NextResponse.json(
        { 
          error: "Stripe n'est pas encore configuré sur le serveur (STRIPE_SECRET_KEY absente).",
          requiresConfig: true,
          mode: "demo"
        },
        { status: 503 }
      );
    }

    // Determine safe host origin to prevent open redirect vulnerabilities
    const fallbackOrigin = req.headers.get("origin") || process.env.APP_URL || req.nextUrl.origin || "http://localhost:3000";
    const safeBaseUrl = validateSafeReturnUrl(returnUrl, fallbackOrigin).replace(/\/$/, "");

    const successUrl = `${safeBaseUrl}/?stripe_status=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(planId)}`;
    const cancelUrl = `${safeBaseUrl}/?stripe_status=cancel&plan=${encodeURIComponent(planId)}`;

    // Line items: use configured Stripe Price ID if set, otherwise generate on-the-fly recurring subscription item
    const lineItems = plan.priceEnvVar
      ? [{ price: plan.priceEnvVar, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: plan.name,
                description: plan.description,
                tax_code: "txcd_10000000",
              },
              unit_amount: plan.amountCents,
              recurring: {
                interval: "month" as const,
              },
            },
            quantity: 1,
          },
        ];

    const sessionParams: any = {
      mode: "subscription",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: coachId || undefined,
      metadata: {
        coachId: coachId || "",
        coachEmail: coachEmail || "",
        planId: planId,
        source: "the_box_tactics",
      },
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    };

    if (coachEmail && coachEmail.includes("@")) {
      sessionParams.customer_email = coachEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur interne lors de la création de la session de paiement Stripe." },
      { status: 500 }
    );
  }
}
