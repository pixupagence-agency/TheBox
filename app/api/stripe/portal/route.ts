import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { customerId, returnUrl } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID manquant" }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe || !isStripeConfigured) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
    }

    const origin = returnUrl || req.headers.get("origin") || process.env.APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: origin,
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
