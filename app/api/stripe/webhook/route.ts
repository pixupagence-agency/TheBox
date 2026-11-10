import { NextRequest, NextResponse } from "next/server";
import {
  getStripe,
  resolvePlanFromSubscription,
  getSubscriptionAccessEnd,
  getInvoiceSubscriptionId,
} from "@/lib/stripe";
import {
  updateCoachPlanInFirestore,
  findCoachProfile,
  claimStripeEvent,
  releaseStripeEvent,
} from "@/lib/firebase-admin";
import { getMailTransporter, DEFAULT_FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL } from "@/lib/mailer";
import {
  cancellationScheduledEmail,
  subscriptionEndedEmail,
  RenderedEmail,
} from "@/lib/email-templates";
import Stripe from "stripe";

function idOf(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return (value as any).id || null;
}

/**
 * Envoie un e-mail lié à l'abonnement au client Stripe. Un échec d'envoi est journalisé
 * mais ne fait pas échouer le webhook (la mise à jour du compte reste prioritaire).
 */
async function sendSubscriptionEmail(
  stripe: Stripe,
  customerId: string | null,
  build: (name: string) => RenderedEmail
): Promise<void> {
  if (!customerId) return;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as any).deleted) return;
    const email = (customer as Stripe.Customer).email;
    if (!email) {
      console.warn(`⚠️ [Stripe Webhook] Aucun e-mail pour le client ${customerId}, e-mail non envoyé.`);
      return;
    }

    const profile = await findCoachProfile({ stripeCustomerId: customerId, email });
    const name =
      (profile?.data?.firstName as string | undefined) ||
      (customer as Stripe.Customer).name?.split(" ")[0] ||
      "Coach";

    const mail = build(name);
    const info = await getMailTransporter().sendMail({
      from: DEFAULT_FROM_EMAIL,
      to: email,
      bcc: ADMIN_NOTIFICATION_EMAIL || undefined,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    console.log(`📧 [Stripe Webhook] E-mail "${mail.subject}" envoyé à ${email} (${info.messageId})`);
  } catch (err) {
    console.error("❌ [Stripe Webhook] Échec d'envoi de l'e-mail d'abonnement:", err);
  }
}

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

  // Stripe peut livrer plusieurs fois le même événement : on ne le traite qu'une fois.
  const firstDelivery = await claimStripeEvent(event.id);
  if (!firstDelivery) {
    console.log(`ℹ️ [Stripe Webhook] Événement ${event.id} déjà traité, ignoré.`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const coachId = session.client_reference_id || session.metadata?.coachId;
        const planId = session.metadata?.planId || "pro";
        const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.coachEmail;
        const customerId = idOf(session.customer);
        const subscriptionId = idOf(session.subscription);

        console.log(`✅ [Stripe Webhook] Paiement réussi pour coachId=${coachId}, email=${customerEmail}, plan=${planId}`);

        const result = await updateCoachPlanInFirestore({
          coachId,
          email: customerEmail,
          planId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeStatus: "active",
          extra: { cancelAtPeriodEnd: false, accessEndsAt: null },
        });

        console.log(`📦 [Stripe Webhook -> Firestore Result]:`, result);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const previous = (event.data.previous_attributes || {}) as Record<string, any>;
        const customerId = idOf(subscription.customer);
        const planId = resolvePlanFromSubscription(subscription);

        const isScheduled = Boolean(subscription.cancel_at_period_end || subscription.cancel_at);
        const prevCancelAtPeriodEnd = "cancel_at_period_end" in previous ? previous.cancel_at_period_end : subscription.cancel_at_period_end;
        const prevCancelAt = "cancel_at" in previous ? previous.cancel_at : subscription.cancel_at;
        const wasScheduled = Boolean(prevCancelAtPeriodEnd || prevCancelAt);
        const accessEnd = getSubscriptionAccessEnd(subscription);

        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const status = (["active", "trialing", "past_due", "canceled"] as const).find((s) => s === subscription.status);

        await updateCoachPlanInFirestore({
          planId: isActive ? planId : null, // suit aussi les changements de formule faits dans le portail
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripeStatus: status,
          extra: {
            cancelAtPeriodEnd: isScheduled,
            accessEndsAt: isScheduled && accessEnd ? accessEnd.toISOString() : null,
          },
        });

        if (isScheduled && !wasScheduled) {
          console.log(`🛑 [Stripe Webhook] Résiliation programmée pour customer=${customerId} (fin: ${accessEnd?.toISOString()})`);
          await sendSubscriptionEmail(stripe, customerId, (name) =>
            cancellationScheduledEmail({ name, planId, accessUntil: accessEnd || new Date() })
          );
        } else if (!isScheduled && wasScheduled) {
          console.log(`🔄 [Stripe Webhook] Résiliation annulée (abonnement réactivé) pour customer=${customerId}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = idOf(subscription.customer);
        const planId = resolvePlanFromSubscription(subscription);
        const reason = subscription.cancellation_details?.reason === "payment_failed" ? "payment_failed" : "canceled";

        console.log(`⚠️ [Stripe Webhook] Fin d'abonnement pour customer=${customerId} (raison: ${reason})`);

        const result = await updateCoachPlanInFirestore({
          planId: "free",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripeStatus: "canceled",
          extra: { cancelAtPeriodEnd: false, accessEndsAt: null },
        });
        console.log(`📦 [Stripe Webhook -> Firestore Result]:`, result);

        await sendSubscriptionEmail(stripe, customerId, (name) =>
          subscriptionEndedEmail({ name, planId, reason })
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = idOf(invoice.customer);
        const subscriptionId = getInvoiceSubscriptionId(invoice);

        console.log(`💳 [Stripe Webhook] Paiement réussi pour facture #${invoice.id} (customer=${customerId})`);

        if (customerId && subscriptionId) {
          // On conserve la formule réellement souscrite (PRO ou PRO+), au lieu de forcer "pro".
          let planId: string | null = null;
          try {
            planId = resolvePlanFromSubscription(await stripe.subscriptions.retrieve(subscriptionId));
          } catch (e) {
            console.warn("⚠️ [Stripe Webhook] Impossible de lire l'abonnement de la facture:", e);
          }

          await updateCoachPlanInFirestore({
            email: invoice.customer_email,
            planId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeStatus: "active",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const customerId = idOf(failedInvoice.customer);
        console.warn(`🚨 [Stripe Webhook] Échec du paiement pour facture #${failedInvoice.id} (customer=${customerId})`);

        // Stripe va retenter le prélèvement : on garde l'accès, on signale seulement le retard.
        // Si toutes les tentatives échouent, Stripe arrête l'abonnement -> customer.subscription.deleted.
        if (customerId) {
          await updateCoachPlanInFirestore({
            stripeCustomerId: customerId,
            stripeStatus: "past_due",
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
    await releaseStripeEvent(event.id);
    return NextResponse.json({ error: "Erreur de traitement du webhook" }, { status: 500 });
  }
}
