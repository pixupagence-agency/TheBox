import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, isStripeConfigured, getSubscriptionAccessEnd } from "@/lib/stripe";
import { verifyFirebaseIdToken, findCoachProfile, updateCoachPlanInFirestore } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/security";

/**
 * Résilie l'abonnement Stripe du coach connecté à la fin de la période déjà payée.
 * L'e-mail de confirmation est envoyé par le webhook (customer.subscription.updated),
 * ce qui couvre aussi les résiliations faites depuis le portail Stripe.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAllowedOrigin(req)) {
      return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
    }

    const rateCheck = checkRateLimit(`cancel_${getClientIp(req)}`, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes. Veuillez patienter ${rateCheck.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfterSeconds || 60) } }
      );
    }

    const stripe = getStripe();
    if (!stripe || !isStripeConfigured) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
    }

    // Seul le titulaire du compte peut résilier son abonnement.
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const user = await verifyFirebaseIdToken(idToken);
    if (!user) {
      return NextResponse.json(
        { error: "Veuillez vous reconnecter pour résilier votre abonnement.", requiresAuth: true },
        { status: 401 }
      );
    }

    const profile = await findCoachProfile({ coachId: user.uid });
    const knownSubId = profile?.data?.stripeSubscriptionId as string | undefined;
    let customerId = profile?.data?.stripeCustomerId as string | undefined;

    let subscription: Stripe.Subscription | null = null;

    if (knownSubId) {
      try {
        subscription = await stripe.subscriptions.retrieve(knownSubId);
        if (subscription.status === "canceled") subscription = null;
      } catch {
        subscription = null;
      }
    }

    // Repli : client Stripe retrouvé via l'e-mail vérifié du compte
    if (!subscription) {
      if (!customerId && user.email) {
        const customers = await stripe.customers.list({ email: user.email.toLowerCase(), limit: 1 });
        customerId = customers.data[0]?.id;
      }
      if (customerId) {
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
        subscription =
          subs.data.find((s) => ["active", "trialing", "past_due"].includes(s.status)) || null;
      }
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement actif n'a été trouvé pour votre compte." },
        { status: 404 }
      );
    }

    const updated = subscription.cancel_at_period_end
      ? subscription
      : await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });

    const accessEnd = getSubscriptionAccessEnd(updated);

    await updateCoachPlanInFirestore({
      coachId: user.uid,
      stripeCustomerId: typeof updated.customer === "string" ? updated.customer : updated.customer?.id,
      stripeSubscriptionId: updated.id,
      stripeStatus: updated.status === "trialing" ? "trialing" : updated.status === "past_due" ? "past_due" : "active",
      extra: {
        cancelAtPeriodEnd: true,
        accessEndsAt: accessEnd ? accessEnd.toISOString() : null,
      },
    });

    return NextResponse.json({
      success: true,
      accessEndsAt: accessEnd ? accessEnd.toISOString() : null,
    });
  } catch (error: any) {
    console.error("Stripe Cancel Error:", error);
    return NextResponse.json(
      { error: "Impossible de résilier l'abonnement pour le moment. Veuillez réessayer ou passer par le portail Stripe." },
      { status: 500 }
    );
  }
}
