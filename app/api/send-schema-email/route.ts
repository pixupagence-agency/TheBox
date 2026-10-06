import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, subject, body, imageUrl, title, clubLabel } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "L'adresse email du destinataire est requise." }, { status: 400 });
    }

    const club = clubLabel || "The Box";
    const schemaTitle = title || "Schéma Tactique";
    const mailSubject = subject || `[Briefing Tactique] ${schemaTitle} - ${club}`;

    // Prepare attachments if an image is provided (base64 data URL)
    const attachments: any[] = [];
    const hasImage = Boolean(imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image"));

    if (hasImage) {
      const commaIndex = imageUrl.indexOf(",");
      if (commaIndex !== -1) {
        const header = imageUrl.slice(0, commaIndex);
        const base64Data = imageUrl.slice(commaIndex + 1);
        const extMatch = header.match(/^data:image\/(\w+)/);
        const ext = extMatch ? extMatch[1] : "png";
        const buffer = Buffer.from(base64Data, "base64");
        const filename = `Schema_${schemaTitle.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;

        attachments.push({
          filename,
          content: buffer,
          cid: "schemaImage", // Embedded in HTML
        });
      }
    }

    // Build the responsive, professional HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${mailSubject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #07090e;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 650px;
            margin: 20px auto;
            background-color: #0d1117;
            border: 2px solid #00e599;
            border-radius: 16px;
            overflow: hidden;
          }
          .header {
            background-color: #090d14;
            padding: 24px;
            text-align: center;
            border-bottom: 1px solid #1f293d;
          }
          .logo {
            font-size: 19px;
            font-weight: 900;
            color: #00e599;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .content {
            padding: 30px 24px;
          }
          .badge {
            display: inline-block;
            background-color: rgba(0, 229, 153, 0.15);
            color: #00e599;
            font-size: 12px;
            font-weight: 800;
            padding: 5px 14px;
            border-radius: 99px;
            border: 1px solid rgba(0, 229, 153, 0.3);
            margin-bottom: 18px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .transfer-notice {
            background-color: #091a2e;
            border: 1px solid #1e3a5f;
            border-left: 4px solid #3b82f6;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 24px;
            color: #bfdbfe;
            font-size: 13px;
            line-height: 1.5;
          }
          .transfer-notice strong {
            color: #ffffff;
          }
          .schema-card {
            background-color: #070b13;
            border: 1px solid #1f293d;
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 24px;
            text-align: center;
          }
          .schema-card img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            display: block;
            margin: 0 auto;
          }
          .briefing-card {
            background-color: #05080e;
            border: 1px solid #1a2333;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .briefing-title {
            color: #00e599;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #1f293d;
          }
          .briefing-body {
            color: #e2e8f0;
            font-size: 13px;
            line-height: 1.7;
            white-space: pre-wrap;
            font-family: inherit;
            margin: 0;
          }
          .cta-box {
            text-align: center;
            margin: 28px 0 10px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #00e599;
            color: #07090e !important;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 900;
            text-decoration: none;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 0.5px;
          }
          .footer {
            background-color: #090d14;
            padding: 18px;
            text-align: center;
            border-top: 1px solid #1f293d;
            color: #64748b;
            font-size: 11px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">THE BOX - ZONE DE DÉCISION TACTIQUE</div>
          </div>
          <div class="content">
            <div class="badge">📋 BRIEFING TACTIQUE &bull; ${club}</div>

            <div class="transfer-notice">
              ✉️ <strong>Briefing prêt à transférer :</strong> Vous recevez cet e-mail sur votre boîte personnelle. Il vous suffit de cliquer sur <strong>« Transférer »</strong> dans votre messagerie pour l'adresser directement à vos joueurs, à votre adjoint ou à vos dirigeants.
            </div>

            ${hasImage ? `
              <div class="schema-card">
                <img src="cid:schemaImage" alt="${schemaTitle}" />
              </div>
            ` : ""}

            <div class="briefing-card">
              <div class="briefing-title">Détails du Briefing & Consignes</div>
              <pre class="briefing-body">${body}</pre>
            </div>

            <div class="cta-box">
              <a href="https://theboxlarena.com/" class="cta-button">Ouvrir The Box</a>
            </div>
          </div>
          <div class="footer">
            &copy; 2026 The Box - L'outil tactique des coachs d'élite.<br>
            Ce briefing a été généré depuis votre espace tactique The Box.
          </div>
        </div>
      </body>
      </html>
    `;

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
      from: process.env.SMTP_FROM || '"The Box" <no-reply@theboxlarena.com>',
      to: email,
      subject: mailSubject,
      text: `${mailSubject}\n\n${body}\n\n(Ce message vous a été envoyé pour transfert à vos contacts)\n© 2026 The Box`,
      html: htmlContent,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Schema email sent successfully to user! MessageId:", info.messageId);

    return NextResponse.json({ 
      success: true, 
      message: `Le schéma tactique a été envoyé avec succès à ${email}. Vous pouvez désormais le transférer à vos contacts !` 
    });
  } catch (err: any) {
    console.error("Error in send-schema-email API:", err);
    return NextResponse.json({ error: "Échec de l'envoi de l'e-mail", details: err?.message }, { status: 500 });
  }
}
