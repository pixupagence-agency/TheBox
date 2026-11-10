import Stripe from "stripe";

// Check if Stripe secret key is defined in environment variables
export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

// Lazy singleton Stripe instance
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil" as any,
      typescript: true,
    });
  }
  return stripeInstance;
}

export interface PlanConfig {
  id: string;
  name: string;
  priceEur: number;
  amountCents: number;
  description: string;
  priceEnvVar?: string;
}

export const STRIPE_PLANS: Record<string, PlanConfig> = {
  pro: {
    id: "pro",
    name: "The Box - Formule PRO",
    priceEur: 9.90,
    amountCents: 990,
    description: "Multi-équipes, gestion des matchs, schémas avancés et enregistrements vocaux",
    priceEnvVar: process.env.STRIPE_PRICE_PRO,
  },
  club: {
    id: "club",
    name: "The Box - Formule PRO+",
    priceEur: 14.90,
    amountCents: 1490,
    description: "Toutes les fonctions PRO + Mode Live Match interactif le jour de match",
    priceEnvVar: process.env.STRIPE_PRICE_PRO_PLUS,
  },
};

/**
 * Déduit l'identifiant de formule ("pro" / "club") d'un abonnement Stripe :
 * 1) métadonnées posées au checkout, 2) identifiant de prix configuré, 3) montant mensuel.
 */
export function resolvePlanFromSubscription(sub: Stripe.Subscription | null | undefined): string | null {
  if (!sub) return null;
  const metaPlan = sub.metadata?.planId;
  if (metaPlan && STRIPE_PLANS[metaPlan]) return metaPlan;

  const price = sub.items?.data?.[0]?.price;
  if (price) {
    for (const plan of Object.values(STRIPE_PLANS)) {
      if (plan.priceEnvVar && plan.priceEnvVar === price.id) return plan.id;
    }
    for (const plan of Object.values(STRIPE_PLANS)) {
      if (price.unit_amount === plan.amountCents) return plan.id;
    }
  }
  return null;
}

/**
 * Date de fin d'accès d'un abonnement (cancel_at si résiliation programmée, sinon fin de la période en cours).
 * Depuis l'API "basil", current_period_end est porté par les items de l'abonnement.
 */
export function getSubscriptionAccessEnd(sub: Stripe.Subscription): Date | null {
  const anySub = sub as any;
  const ts: number | undefined =
    anySub.cancel_at ||
    anySub.items?.data?.[0]?.current_period_end ||
    anySub.current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

/** Identifiant d'abonnement d'une facture (ancien champ `subscription` ou nouveau `parent.subscription_details`). */
export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const anyInv = invoice as any;
  const raw = anyInv.parent?.subscription_details?.subscription ?? anyInv.subscription;
  if (!raw) return null;
  return typeof raw === "string" ? raw : raw.id || null;
}
