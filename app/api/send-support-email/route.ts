import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SUPPORT_EMAIL = "pixup.agence@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, club, sport, plan } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "L'adresse email est requise." },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Le message ne peut pas être vide." },
        { status: 400 }
      );
    }

    const senderName = name?.trim() || "Utilisateur The Box";
    const rawSubject = subject?.trim() || "Demande d'assistance";
    
    // Ensure the subject strictly starts with [Support]
    const finalSubject = rawSubject.startsWith("[Support]")
      ? rawSubject
      : `[Support] ${rawSubject}`;

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
                <td class="value">${senderName}</td>
              </tr>
              <tr>
                <td class="label">Email de réponse :</td>
                <td class="value"><a href="mailto:${email}" style="color: #00e599; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td class="label">Objet / Motif :</td>
                <td class="value">${rawSubject}</td>
              </tr>
              ${club ? `<tr><td class="label">Club :</td><td class="value">${club}</td></tr>` : ""}
              ${sport ? `<tr><td class="label">Sport :</td><td class="value">${sport.toUpperCase()}</td></tr>` : ""}
              ${plan ? `<tr><td class="label">Offre :</td><td class="value">${plan.toUpperCase()}</td></tr>` : ""}
              <tr>
                <td class="label">Date d'envoi :</td>
                <td class="value">${dateStr}</td>
              </tr>
            </table>

            <div class="message-box">
              <div class="message-title">Message du Coach / Utilisateur</div>
              <p class="message-body">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>

            <div class="cta-box">
              <a href="mailto:${email}?subject=Re:%20${encodeURIComponent(finalSubject)}" class="cta-button">
                Répondre directement à ${senderName}
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
- Nom: ${senderName}
- Email: ${email}
${club ? `- Club: ${club}\n` : ""}${sport ? `- Sport: ${sport}\n` : ""}${plan ? `- Offre: ${plan}\n` : ""}

MESSAGE:
----------------------------------------
${message}
----------------------------------------

Pour répondre: ${email}
    `.trim();

    // Configure SMTP transport
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"The Box Support" <${SUPPORT_EMAIL}>`,
      to: SUPPORT_EMAIL,
      replyTo: email,
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
      { error: "Échec de l'envoi du message au support.", details: err?.message },
      { status: 500 }
    );
  }
}
