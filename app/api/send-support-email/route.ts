import { NextRequest, NextResponse } from "next/server";
import { getMailTransporter } from "@/lib/mailer";
import { 
  escapeHtml, 
  sanitizeSubject, 
  isValidEmail, 
  sanitizeText,
  checkRateLimit,
  getClientIp,
  isAllowedOrigin,
  isBotDetected
} from "@/lib/security";

const SUPPORT_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "support@thebox-tactique.com";

export async function POST(req: NextRequest) {
  try {
    // CSRF Protection
    if (!isAllowedOrigin(req)) {
      return NextResponse.json({ error: "Requête non autorisée (origine invalide)." }, { status: 403 });
    }

    // IP Rate Limiting (5 requests per 5 minutes per IP)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`support_${clientIp}`, 5, 300000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes. Veuillez patienter ${rateCheck.retryAfterSeconds} secondes avant de réessayer.` },
        { 
          status: 429, 
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds || 60) } 
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Données de formulaire invalides." }, { status: 400 });
    }

    // Bot Honeypot Trap Check
    if (isBotDetected(body)) {
      return NextResponse.json({ success: true, message: "Demande transmise." });
    }

    const { name, email, subject, message, club, sport, plan } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "L'adresse email renseignée n'est pas valide." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Le message ne peut pas être vide." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().slice(0, 254);
    const rawSenderName = sanitizeText(name, 100) || "Utilisateur The Box";
    const rawMessage = sanitizeText(message, 10000);
    const rawClub = sanitizeText(club, 100);
    const rawSport = sanitizeText(sport, 50);
    const rawPlan = sanitizeText(plan, 50);
    const inputSubject = sanitizeSubject(subject, 150) || "Demande d'assistance";
    
    // Ensure the subject strictly starts with [Support] and contains no CRLF
    const finalSubject = sanitizeSubject(
      inputSubject.startsWith("[Support]") ? inputSubject : `[Support] ${inputSubject}`,
      200
    );

    const safeSenderName = escapeHtml(rawSenderName);
    const safeEmail = escapeHtml(cleanEmail);
    const safeSubject = escapeHtml(inputSubject);
    const safeClub = escapeHtml(rawClub);
    const safeSport = escapeHtml(rawSport);
    const safePlan = escapeHtml(rawPlan);
    const safeMessage = escapeHtml(rawMessage);

    const dateStr = new Date().toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>${finalSubject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #07090e;
            color: #ffffff;
            margin: 0;
            padding: 20px 0;
          }
          .container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #0d1117;
            border: 2px solid #00e599;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .header {
            background: linear-gradient(135deg, #0f141d 0%, #161f2e 100%);
            padding: 25px 30px;
            border-bottom: 1px solid #1f293d;
            text-align: center;
          }
          .badge {
            display: inline-block;
            background-color: rgba(0, 229, 153, 0.15);
            color: #00e599;
            border: 1px solid #00e599;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 30px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #121824;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 25px;
            border: 1px solid #1e293b;
          }
          .info-table td {
            padding: 12px 16px;
            font-size: 13px;
            border-bottom: 1px solid #1a2233;
          }
          .info-table tr:last-child td {
            border-bottom: none;
          }
          .info-table td.label {
            color: #94a3b8;
            font-weight: 600;
            width: 35%;
          }
          .info-table td.value {
            color: #ffffff;
            font-weight: 700;
          }
          .message-box {
            background-color: #161c28;
            border-left: 4px solid #00e599;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
          }
          .message-title {
            font-size: 12px;
            font-weight: 800;
            color: #00e599;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
          }
          .message-body {
            font-size: 14px;
            line-height: 1.6;
            color: #e2e8f0;
            white-space: pre-wrap;
            margin: 0;
            font-family: inherit;
          }
          .cta-box {
            text-align: center;
            margin: 30px 0 10px;
          }
          .cta-button {
            display: inline-block;
            background-color: #00e599;
            color: #07090e;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 900;
            text-decoration: none;
            border-radius: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer {
            background-color: #0a0d14;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #1a2233;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">Nouveau Ticket Support</span>
            <h1>The Box • Message d'un utilisateur</h1>
          </div>
          <div class="content">
            <table class="info-table">
              <tr>
                <td class="label">Expéditeur :</td>
                <td class="value">${safeSenderName}</td>
              </tr>
              <tr>
                <td class="label">Email de réponse :</td>
                <td class="value"><a href="mailto:${safeEmail}" style="color: #00e599; text-decoration: none;">${safeEmail}</a></td>
              </tr>
              <tr>
                <td class="label">Objet / Motif :</td>
                <td class="value">${safeSubject}</td>
              </tr>
              ${rawClub ? `<tr><td class="label">Club :</td><td class="value">${safeClub}</td></tr>` : ""}
              ${rawSport ? `<tr><td class="label">Sport :</td><td class="value">${safeSport.toUpperCase()}</td></tr>` : ""}
              ${rawPlan ? `<tr><td class="label">Offre :</td><td class="value">${safePlan.toUpperCase()}</td></tr>` : ""}
              <tr>
                <td class="label">Date d'envoi :</td>
                <td class="value">${dateStr}</td>
              </tr>
            </table>

            <div class="message-box">
              <div class="message-title">Message du Coach / Utilisateur</div>
              <p class="message-body">${safeMessage}</p>
            </div>

            <div class="cta-box">
              <a href="mailto:${safeEmail}?subject=Re:%20${encodeURIComponent(finalSubject)}" class="cta-button">
                Répondre directement à ${safeSenderName}
              </a>
            </div>
          </div>
          <div class="footer">
            &copy; 2026 The Box - Plateforme de coaching et décision tactique.<br>
            Notification automatique envoyée à ${SUPPORT_EMAIL}.
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
=== NOUVEAU MESSAGE SUPPORT THE BOX ===
Objet: ${finalSubject}
Date: ${dateStr}

EXPÉDITEUR:
- Nom: ${rawSenderName}
- Email: ${cleanEmail}
${rawClub ? `- Club: ${rawClub}\n` : ""}${rawSport ? `- Sport: ${rawSport}\n` : ""}${rawPlan ? `- Offre: ${rawPlan}\n` : ""}

MESSAGE:
----------------------------------------
${rawMessage}
----------------------------------------

Pour répondre: ${cleanEmail}
    `.trim();

    // Configure SMTP transport
    const transporter = getMailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || `"The Box Support" <${SUPPORT_EMAIL}>`,
      to: SUPPORT_EMAIL,
      replyTo: cleanEmail,
      subject: finalSubject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Support email sent successfully to", SUPPORT_EMAIL, "MessageId:", info.messageId);

    return NextResponse.json({
      success: true,
      message: `Votre demande d'assistance a été transmise à l'équipe support (${SUPPORT_EMAIL}).`,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error("Error in send-support-email API:", err);
    return NextResponse.json(
      { error: "Échec de l'envoi du message au support. Veuillez réessayer ultérieurement." },
      { status: 500 }
    );
  }
}
