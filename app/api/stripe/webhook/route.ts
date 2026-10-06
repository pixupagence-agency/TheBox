import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
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
    } else {
      // In development without webhook secret, fallback to direct json parse
      console.warn("⚠️ Stripe Webhook: Signature verification skipped because STRIPE_WEBHOOK_SECRET is not configured.");
      event = JSON.parse(rawBody) as Stripe.Event;
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
        const customerEmail = session.customer_details?.email || session.customer_email;

        console.log(`✅ [Stripe Webhook] Paiement réussi pour coachId=${coachId}, email=${customerEmail}, plan=${planId}`);
        // At this point, the coach's plan is updated to planId ("pro" or "club")
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        console.log(`⚠️ [Stripe Webhook] Résiliation d'abonnement reçue pour customer=${customerId}`);
        // Reset coach plan to "free"
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`💳 [Stripe Webhook] Renouvellement paiement réussi pour facture #${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.warn(`🚨 [Stripe Webhook] Échec du paiement pour facture #${failedInvoice.id}`);
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
