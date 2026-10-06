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
