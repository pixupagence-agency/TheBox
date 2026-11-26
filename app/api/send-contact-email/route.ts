import { NextRequest, NextResponse } from "next/server";
import { getMailTransporter } from "@/lib/mailer";
import { isBotDetected, isValidEmail, sanitizeSubject, sanitizeText } from "@/lib/security";
import { guardEmailRoute, parisDateTime, readJsonBody } from "@/lib/email/routeHelpers";
import { renderAdminNotification } from "@/lib/email/adminNotification";

// Formulaire de contact de la page d'accueil (visiteurs sans compte) → boîte de l'équipe The Box
const TARGET_CONTACT_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "contact@thebox-tactique.com";

export async function POST(req: NextRequest) {
  try {
    // App Check, origine, 5 envois par 5 minutes et par IP
    const refusal = await guardEmailRoute(req, { appCheckRoute: "send-contact-email", rateKey: "contact", limit: 5, windowMs: 300_000 });
    if (refusal) return refusal;

    const { body, error } = await readJsonBody(req, "Données de formulaire invalides.");
    if (error) return error;

    // Piège à robots : succès apparent, aucun e-mail
    if (isBotDetected(body)) return NextResponse.json({ success: true, message: "Message transmis." });

    const { name, email, subject, message, club, sport, phone } = body as Record<string, string | undefined>;
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "L'adresse email renseignée n'est pas valide." }, { status: 400 });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Le message ne peut pas être vide." }, { status: 400 });
    }

    const cleanEmail = email.trim().slice(0, 254);
    const senderName = sanitizeText(name, 100) || "Visiteur Landing Page";
    const inputSubject = sanitizeSubject(subject, 150) || "Demande de contact";
    const finalSubject = sanitizeSubject(inputSubject.startsWith("[Contact]") ? inputSubject : `[Contact] ${inputSubject}`, 200);
    const sportName = sanitizeText(sport, 50);
    const date = parisDateTime();

    const { html, text } = renderAdminNotification({
      badge: "Nouveau Contact Landing Page",
      heading: "The Box • Message de Contact",
      rows: [
        { label: "Téléphone", value: sanitizeText(phone, 30) },
        { label: "Objet / Motif", value: inputSubject },
        { label: "Club / Structure", value: sanitizeText(club, 100) },
        { label: "Discipline", value: sportName.toUpperCase(), text: sportName },
        { label: "Date de réception", value: date },
      ],
      messageTitle: "Message transmis",
      message: sanitizeText(message, 10000),
      senderName,
      replyTo: cleanEmail,
      subject: finalSubject,
      replyLabel: `Répondre à ${senderName}`,
      footer: `Message reçu directement depuis le formulaire de contact de la landing page sur ${TARGET_CONTACT_EMAIL}.`,
      textHeading: "NOUVEAU MESSAGE CONTACT THE BOX (LANDING PAGE)",
      date,
    });

    const info = await getMailTransporter().sendMail({
      from: process.env.SMTP_FROM || `"The Box Contact" <${TARGET_CONTACT_EMAIL}>`,
      to: TARGET_CONTACT_EMAIL,
      replyTo: cleanEmail,
      subject: finalSubject,
      text,
      html,
    });
    console.log("Contact email sent successfully to", TARGET_CONTACT_EMAIL, "MessageId:", info.messageId);

    return NextResponse.json({
      success: true,
      message: `Votre message a été envoyé avec succès à l'équipe The Box (${TARGET_CONTACT_EMAIL}). Nous vous répondrons rapidement.`,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("Error in send-contact-email API:", err);
    return NextResponse.json(
      { error: "Échec de l'envoi du message de contact. Veuillez réessayer ultérieurement." },
      { status: 500 }
    );
  }
}
