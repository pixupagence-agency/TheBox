import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured,
    hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
    mode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "test" : (process.env.STRIPE_SECRET_KEY ? "live" : "unconfigured"),
  });
}
