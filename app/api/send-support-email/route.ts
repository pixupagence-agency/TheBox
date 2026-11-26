import { NextRequest, NextResponse } from "next/server";
import { getMailTransporter } from "@/lib/mailer";
import { isBotDetected, isValidEmail, sanitizeSubject, sanitizeText } from "@/lib/security";
import { guardEmailRoute, parisDateTime, readJsonBody } from "@/lib/email/routeHelpers";
import { renderAdminNotification } from "@/lib/email/adminNotification";

// Demande d'assistance envoyée depuis l'application → boîte support de l'équipe The Box
const SUPPORT_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "support@thebox-tactique.com";

export async function POST(req: NextRequest) {
  try {
    // App Check, origine, 5 envois par 5 minutes et par IP
    const refusal = await guardEmailRoute(req, { appCheckRoute: "send-support-email", rateKey: "support", limit: 5, windowMs: 300_000 });
    if (refusal) return refusal;

    const { body, error } = await readJsonBody(req, "Données de formulaire invalides.");
    if (error) return error;

    // Piège à robots : succès apparent, aucun e-mail
    if (isBotDetected(body)) return NextResponse.json({ success: true, message: "Demande transmise." });

    const { name, email, subject, message, club, sport, plan } = body as Record<string, string | undefined>;
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "L'adresse email renseignée n'est pas valide." }, { status: 400 });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Le message ne peut pas être vide." }, { status: 400 });
    }

    const cleanEmail = email.trim().slice(0, 254);
    const senderName = sanitizeText(name, 100) || "Utilisateur The Box";
    const inputSubject = sanitizeSubject(subject, 150) || "Demande d'assistance";
    const finalSubject = sanitizeSubject(inputSubject.startsWith("[Support]") ? inputSubject : `[Support] ${inputSubject}`, 200);
    const sportName = sanitizeText(sport, 50);
    const planName = sanitizeText(plan, 50);
    const date = parisDateTime();

    const { html, text } = renderAdminNotification({
      badge: "Nouveau Ticket Support",
      heading: "The Box • Message d'un utilisateur",
      rows: [
        { label: "Objet / Motif", value: inputSubject },
        { label: "Club", value: sanitizeText(club, 100) },
        { label: "Sport", value: sportName.toUpperCase(), text: sportName },
        { label: "Offre", value: planName.toUpperCase(), text: planName },
        { label: "Date d'envoi", value: date },
      ],
      messageTitle: "Message du Coach / Utilisateur",
      message: sanitizeText(message, 10000),
      senderName,
      replyTo: cleanEmail,
      subject: finalSubject,
      replyLabel: `Répondre directement à ${senderName}`,
      footer: `Notification automatique envoyée à ${SUPPORT_EMAIL}.`,
      textHeading: "NOUVEAU MESSAGE SUPPORT THE BOX",
      date,
    });

    const info = await getMailTransporter().sendMail({
      from: process.env.SMTP_FROM || `"The Box Support" <${SUPPORT_EMAIL}>`,
      to: SUPPORT_EMAIL,
      replyTo: cleanEmail,
      subject: finalSubject,
      text,
      html,
    });
    console.log("Support email sent successfully to", SUPPORT_EMAIL, "MessageId:", info.messageId);

    return NextResponse.json({
      success: true,
      message: `Votre demande d'assistance a été transmise à l'équipe support (${SUPPORT_EMAIL}).`,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("Error in send-support-email API:", err);
    return NextResponse.json(
      { error: "Échec de l'envoi du message au support. Veuillez réessayer ultérieurement." },
      { status: 500 }
    );
  }
}
