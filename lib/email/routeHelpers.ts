// Contrôles communs des routes d'envoi d'e-mails (app/api/send-*-email) :
// App Check, origine, limitation par IP, lecture du corps JSON, coach connecté.
// Chaque fonction renvoie la réponse d'erreur à retourner telle quelle, ou null si tout va bien.
import { NextRequest, NextResponse } from "next/server";
import { requireAppCheck } from "@/lib/appCheck";
import { getClientIp, isAllowedOrigin } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";

export type AuthUser = NonNullable<Awaited<ReturnType<typeof verifyFirebaseIdToken>>>;

/** Réponse 429 avec l'en-tête Retry-After */
export function tooManyRequests(retryAfterSeconds: number | undefined, message?: string) {
  const retry = retryAfterSeconds || 60;
  return NextResponse.json(
    { error: message || `Trop de requêtes. Veuillez patienter ${retry} secondes avant de réessayer.` },
    { status: 429, headers: { "Retry-After": String(retry) } }
  );
}

/**
 * Contrôles d'entrée : App Check (routes publiques, si `appCheckRoute`), origine (CSRF),
 * puis `limit` envois par `windowMs` et par adresse IP.
 */
export async function guardEmailRoute(
  req: NextRequest,
  opts: { rateKey: string; limit: number; windowMs: number; appCheckRoute?: string }
): Promise<NextResponse | null> {
  if (opts.appCheckRoute) {
    const refusal = await requireAppCheck(req, opts.appCheckRoute);
    if (refusal) return refusal;
  }
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
  }
  const check = await rateLimit(`${opts.rateKey}_${getClientIp(req)}`, opts.limit, opts.windowMs);
  return check.allowed ? null : tooManyRequests(check.retryAfterSeconds);
}

/** Corps JSON (objet) de la requête, ou réponse 400 */
export async function readJsonBody(
  req: NextRequest,
  invalidMessage: string
): Promise<{ body: Record<string, unknown>; error?: never } | { body?: never; error: NextResponse }> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: NextResponse.json({ error: invalidMessage }, { status: 400 }) };
  }
  return { body: body as Record<string, unknown> };
}

/** Coach connecté (jeton Firebase « Authorization: Bearer … »), ou réponse 401 */
export async function requireUser(
  req: NextRequest,
  message: string
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: NextResponse }> {
  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const user = await verifyFirebaseIdToken(idToken);
  if (!user) return { error: NextResponse.json({ error: message, requiresAuth: true }, { status: 401 }) };
  return { user };
}

/** Date et heure de Paris, ex. « 26/11/2026 09:15 » */
export function parisDateTime(date = new Date()): string {
  return date.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
