import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const name = firstName ? `${firstName} ${lastName}` : "Coach";

    // Build the gorgeous HTML template for "The Box" applet
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenue sur The Box - Votre période d'essai PRO+</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #07090e;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0d1117;
            border: 2px solid #00e599;
            border-radius: 16px;
            overflow: hidden;
            margin-top: 40px;
            margin-bottom: 40px;
          }
          .header {
            background-color: #090d14;
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #1f293d;
          }
          .logo {
            font-size: 20px;
            font-weight: 900;
            color: #00e599;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .content {
            padding: 40px 30px;
          }
          h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 800;
            margin-top: 0;
            text-transform: uppercase;
          }
          p {
            color: #94a3b8;
            font-size: 15px;
            line-height: 1.6;
          }
          .badge {
            display: inline-block;
            background-color: rgba(0, 229, 153, 0.15);
            color: #00e599;
            font-size: 13px;
            font-weight: bold;
            padding: 6px 16px;
            border-radius: 99px;
            border: 1px solid rgba(0, 229, 153, 0.3);
            margin-bottom: 20px;
          }
          .features-box {
            background-color: #090d14;
            border: 1px solid #1f293d;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
          }
          .feature-item {
            margin-bottom: 15px;
            display: flex;
            align-items: flex-start;
          }
          .feature-icon {
            color: #00e599;
            margin-right: 12px;
            font-size: 18px;
          }
          .feature-text {
            color: #e2e8f0;
            font-size: 14px;
            font-weight: bold;
          }
          .feature-desc {
            color: #64748b;
            font-size: 12px;
            margin-top: 2px;
          }
          .cta-button {
            display: block;
            background-color: #00e599;
            color: #07090e !important;
            text-align: center;
            padding: 14px 24px;
            border-radius: 10px;
            font-weight: 900;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 30px 0 10px 0;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0, 229, 153, 0.3);
          }
          .footer {
            background-color: #090d14;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #1f293d;
            color: #64748b;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">THE BOX - ZONE DE DÉCISION TACTIQUE</div>
          </div>
          <div class="content">
            <div class="badge">THE BOX - ZONE DE DÉCISION TACTIQUE</div>
            <h1>Bienvenue dans The Box, Coach ${name} !</h1>
            <p>
              Votre compte a été créé avec succès sur l'application <strong>The Box</strong>. Pour fêter votre arrivée dans l'équipe, nous avons le plaisir de vous offrir <strong>14 jours d'accès gratuit et illimité à notre formule d'élite PRO+</strong>.
            </p>
            <p>
              Préparez-vous à révolutionner vos causeries d'avant-match et vos consignes durant les matchs grâce aux outils tactiques les plus performants.
            </p>
            
            <div class="features-box">
              <h2 style="color: #00e599; font-size: 14px; text-transform: uppercase; margin-top: 0; margin-bottom: 15px; font-weight: 900;">⭐ VOS AVANTAGES PRO+ ACTIVÉS :</h2>
              
              <div class="feature-item">
                <span class="feature-icon">📋</span>
                <div>
                  <div class="feature-text">Planches Tactiques HD</div>
                  <div class="feature-desc">Tous vos tracés en haute définition.</div>
                </div>
              </div>

              <div class="feature-item">
                <span class="feature-icon">📸</span>
                <div>
                  <div class="feature-text">Téléchargement & Exports Illimités</div>
                  <div class="feature-desc">Sauvegardez vos compositions et vos schémas en HD d'un clic pour les partager à vos joueurs.</div>
                </div>
              </div>

              <div class="feature-item">
                <span class="feature-icon">⏱️</span>
                <div>
                  <div class="feature-text">Chronomètre & Coaching Live</div>
                  <div class="feature-desc">Gérez votre match en direct : remplacements, scores, cartons (jaunes/rouges), buts et historique d'événements.</div>
                </div>
              </div>

              <div class="feature-item">
                <span class="feature-icon">👑</span>
                <div>
                  <div class="feature-text">Attribution des Rôles Clés</div>
                  <div class="feature-desc">Désignez vos Capitaines, Tireurs de Penalties, Tireurs de Coups Francs, Corners G/D et gardez-les en mémoire.</div>
                </div>
              </div>

              <div class="feature-item">
                <span class="feature-icon">📲</span>
                <div>
                  <div class="feature-text">Partage Rapide WhatsApp & Réseaux</div>
                  <div class="feature-desc">Générez un bilan complet de votre match et partagez-le instantanément sur la boite de messagerie de vos équipes.</div>
                </div>
              </div>
            </div>

            <p style="margin-bottom: 0;">
              Aucune carte de crédit n'est requise pour votre essai de 14 jours. Vous disposez de la pleine puissance de l'application dès maintenant.
            </p>
            
            <a href="https://theboxlarena.com/" class="cta-button">Accéder à ma Planche Tactique</a>
          </div>
          <div class="footer">
            &copy; 2026 The Box - L'outil tactique des coachs d'élite.<br>
            Vous recevez cet e-mail suite à votre inscription sur l'application The Box.
          </div>
        </div>
      </body>
      </html>
    `;

    // Configure SMTP transport with environment secrets, falling back to an automatic Ethereal test account
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
      // Create test Ethereal credentials on-the-fly so it works out-of-the-box seamlessly
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
      console.log("No SMTP settings in environment. Used test Ethereal account:", testAccount.user);
    }

    const textContent = `THE BOX - ZONE DE DÉCISION TACTIQUE
THE BOX - ZONE DE DÉCISION TACTIQUE

Bienvenue dans The Box, Coach ${name} !

Votre compte a été créé avec succès sur l'application The Box. Pour fêter votre arrivée dans l'équipe, nous avons le plaisir de vous offrir 14 jours d'accès gratuit et illimité à notre formule d'élite PRO+.

Préparez-vous à révolutionner vos causeries d'avant-match et vos consignes durant les matchs grâce aux outils tactiques les plus performants.

VOS AVANTAGES PRO+ ACTIVÉS :

• Planches Tactiques HD
  Tous vos tracés en haute définition.

• Téléchargement & Exports Illimités
  Sauvegardez vos compositions et vos schémas en HD d'un clic pour les partager à vos joueurs.

• Chronomètre & Coaching Live
  Gérez votre match en direct : remplacements, scores, cartons (jaunes/rouges), buts et historique d'événements.

• Attribution des Rôles Clés
  Désignez vos Capitaines, Tireurs de Penalties, Tireurs de Coups Francs, Corners G/D et gardez-les en mémoire.

• Partage Rapide WhatsApp & Réseaux
  Générez un bilan complet de votre match et partagez-le instantanément sur la boite de messagerie de vos équipes.

Aucune carte de crédit n'est requise pour votre essai de 14 jours. Vous disposez de la pleine puissance de l'application dès maintenant.

Accéder à ma Planche Tactique : https://theboxlarena.com/

© 2026 The Box - L'outil tactique des coachs d'élite.
Vous recevez cet e-mail suite à votre inscription sur l'application The Box.`;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"The Box" <no-reply@theboxlarena.com>',
      to: email,
      bcc: process.env.ADMIN_NOTIFICATION_EMAIL || undefined,
      subject: "⚡ Bienvenue sur The Box - Vos 14 jours d'essai PRO+ activés !",
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully! MessageId:", info.messageId);

    // If using Ethereal, log the test inbox preview URL for easy testing
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Ethereal test email preview URL:", previewUrl);
      return NextResponse.json({ success: true, message: "Welcome email sent (Ethereal test mode)", previewUrl });
    }

    return NextResponse.json({ success: true, message: "Welcome email sent successfully" });
  } catch (err: any) {
    console.error("Error in welcome email API:", err);
    return NextResponse.json({ error: "Failed to send email", details: err?.message }, { status: 500 });
  }
}
