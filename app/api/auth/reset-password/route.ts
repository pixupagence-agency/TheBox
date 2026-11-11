import { NextRequest, NextResponse } from "next/server";
import { getMailTransporter, DEFAULT_FROM_EMAIL } from "@/lib/mailer";
import { isValidEmail, checkRateLimit, getClientIp, isAllowedOrigin } from "@/lib/security";
import { generatePasswordResetLinkFor } from "@/lib/firebase-admin";
import { passwordResetEmail, APP_PUBLIC_URL } from "@/lib/email-templates";

/**
 * « Mot de passe oublié ? » — envoie un e-mail de réinitialisation aux couleurs de The Box.
 *
 * Réponses :
 *  - 200 { success: true } : traité (on ne révèle jamais si le compte existe) ;
 *  - 503 { fallback: true } : envoi personnalisé indisponible (Admin SDK / SMTP),
 *    le client bascule alors sur l'e-mail standard de Firebase.
 */
export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
  }

  const clientIp = getClientIp(req);
  const ipCheck = checkRateLimit(`pwreset_ip_${clientIp}`, 5, 10 * 60_000);
  if (!ipCheck.allowed) {
    return NextResponse.json(
      { error: `Trop de demandes. Patientez ${ipCheck.retryAfterSeconds} secondes avant de réessayer.` },
      { status: 429, headers: { "Retry-After": String(ipCheck.retryAfterSeconds || 60) } }
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  // Limite par adresse : évite d'inonder une boîte mail
  const emailCheck = checkRateLimit(`pwreset_email_${email}`, 3, 15 * 60_000);
  if (!emailCheck.allowed) {
    return NextResponse.json({ success: true });
  }

  let result: { link: string | null; name: string | null };
  try {
    result = await generatePasswordResetLinkFor(email, APP_PUBLIC_URL);
  } catch (err: any) {
    console.error("[reset-password] Génération du lien impossible :", err?.message || err);
    return NextResponse.json({ fallback: true }, { status: 503 });
  }

  // Aucun compte : on répond comme si l'e-mail était parti
  if (!result.link) {
    return NextResponse.json({ success: true });
  }

  try {
    const { subject, html, text } = passwordResetEmail({ name: result.name, resetLink: result.link });
    const transporter = getMailTransporter();
    await transporter.sendMail({ from: DEFAULT_FROM_EMAIL, to: email, subject, html, text });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[reset-password] Envoi de l'e-mail impossible :", err?.message || err);
    return NextResponse.json({ fallback: true }, { status: 503 });
  }
}
