import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { validateSafeReturnUrl, isValidEmail, sanitizeText } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { customerId, coachEmail, returnUrl } = await req.json();

    const stripe = getStripe();
    if (!stripe || !isStripeConfigured) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
    }

    let targetCustomerId = typeof customerId === "string" ? sanitizeText(customerId, 100) : null;

    if (!targetCustomerId && coachEmail && isValidEmail(coachEmail)) {
      try {
        const existingCustomers = await stripe.customers.list({
          email: coachEmail.trim().toLowerCase(),
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
