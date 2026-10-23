import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { updateCoachPlanInFirestore } from "@/lib/firebase-admin";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else if (process.env.NODE_ENV !== "production" && !webhookSecret) {
      // In local development only without webhook secret, fallback to direct json parse with explicit warning
      console.warn("⚠️ Stripe Webhook: Signature verification skipped in non-production because STRIPE_WEBHOOK_SECRET is not configured.");
      event = JSON.parse(rawBody) as Stripe.Event;
    } else {
      console.error("❌ Stripe Webhook: STRIPE_WEBHOOK_SECRET and stripe-signature header are required.");
      return NextResponse.json(
        { error: "Webhook verification failed: signature and secret are required." },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("❌ Stripe Webhook Signature Verification Failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle specific Stripe events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const coachId = session.client_reference_id || session.metadata?.coachId;
        const planId = session.metadata?.planId || "pro";
        const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.coachEmail;
        const customerId = typeof session.customer === "string" ? session.customer : (session.customer as any)?.id;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription as any)?.id;

        console.log(`✅ [Stripe Webhook] Paiement réussi pour coachId=${coachId}, email=${customerEmail}, plan=${planId}`);

        // Update coach's plan directly in Firestore
        const result = await updateCoachPlanInFirestore({
          coachId,
          email: customerEmail,
          planId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeStatus: "active",
        });

        console.log(`📦 [Stripe Webhook -> Firestore Result]:`, result);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : (subscription.customer as any)?.id;
        const subscriptionId = subscription.id;

        console.log(`⚠️ [Stripe Webhook] Résiliation d'abonnement reçue pour customer=${customerId}`);

        // Reset coach plan to "free" in Firestore
        const result = await updateCoachPlanInFirestore({
          planId: "free",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeStatus: "canceled",
        });

        console.log(`📦 [Stripe Webhook -> Firestore Result]:`, result);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as any)?.id;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : (invoice.subscription as any)?.id;
        const customerEmail = invoice.customer_email;

        console.log(`💳 [Stripe Webhook] Renouvellement paiement réussi pour facture #${invoice.id} (customer=${customerId})`);

        if (customerId) {
          await updateCoachPlanInFirestore({
            email: customerEmail,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeStatus: "active",
            planId: "pro", // keeps active status on renewal
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const customerId = typeof failedInvoice.customer === "string" ? failedInvoice.customer : (failedInvoice.customer as any)?.id;
        console.warn(`🚨 [Stripe Webhook] Échec du paiement pour facture #${failedInvoice.id} (customer=${customerId})`);

        if (customerId) {
          await updateCoachPlanInFirestore({
            stripeCustomerId: customerId,
            stripeStatus: "past_due",
            planId: "free",
          });
        }
        break;
      }

      default:
        console.log(`ℹ️ [Stripe Webhook] Événement ignoré: ${event.type}`);
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (err: any) {
    console.error("❌ [Stripe Webhook Handler Error]:", err);
    return NextResponse.json({ error: "Erreur de traitement du webhook" }, { status: 500 });
  }
}

