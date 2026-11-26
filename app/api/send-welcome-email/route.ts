import { NextRequest, NextResponse } from "next/server";
import { getMailTransporter, DEFAULT_FROM_EMAIL, ADMIN_NOTIFICATION_EMAIL } from "@/lib/mailer";
import { escapeHtml, isValidEmail, sanitizeText } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";
import { guardEmailRoute, readJsonBody, requireUser } from "@/lib/email/routeHelpers";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";

/** Au-delà, un compte ne reçoit plus l'e-mail de bienvenue (il est seulement marqué comme traité) */
const WELCOME_MAX_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60_000;

export async function POST(req: NextRequest) {
  // Annule la réservation de l'indicateur si l'envoi n'aboutit pas
  let releaseClaim: (() => Promise<unknown>) | null = null;
  try {
    // Origine, 10 envois par minute et par IP
    const refusal = await guardEmailRoute(req, { rateKey: "welcome", limit: 10, windowMs: 60_000 });
    if (refusal) return refusal;

    const parsed = await readJsonBody(req, "Données de bienvenue invalides.");
    if (parsed.error) return parsed.error;

    // Seul un coach connecté peut déclencher l'e-mail, et uniquement vers sa propre adresse :
    // l'adresse envoyée par le navigateur est ignorée (sinon la route servirait à envoyer du spam).
    const auth = await requireUser(req, "Connexion requise.");
    if (auth.error) return auth.error;
    const { user } = auth;

    const { firstName, lastName } = parsed.body as Record<string, string | undefined>;
    const email = user.email || user.unverifiedEmail;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Aucune adresse e-mail valide sur ce compte." }, { status: 400 });
    }

    // Un seul e-mail de bienvenue par compte, décidé ici et non par le navigateur :
    // l'indicateur welcomeEmailSent est réservé avant l'envoi (deux onglets ne déclenchent qu'un envoi)
    // et libéré si l'envoi échoue (nouvel essai à la connexion suivante).
    const adminDb = getAdminFirestore();
    if (!adminDb) {
      return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
    }
    const profileRef = adminDb.collection("users").doc(user.uid);
    const claim = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(profileRef);
      // Profil pas encore enregistré par le navigateur : on ne crée pas de document partiel
      if (!snap.exists) return "no_profile" as const;
      if (snap.get("welcomeEmailSent") === true) return "already_sent" as const;
      tx.update(profileRef, { welcomeEmailSent: true });
      return "claimed" as const;
    });
    if (claim === "no_profile") {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 409 });
    }
    if (claim === "already_sent") {
      return NextResponse.json({ success: true, alreadySent: true });
    }

    // Compte déjà ancien (créé avant l'indicateur, ou envoi resté en échec plusieurs jours) :
    // l'e-mail « Bienvenue, 14 jours d'essai » n'a plus de sens, le compte est simplement marqué.
    const createdAt = Date.parse((await getAuth().getUser(user.uid)).metadata.creationTime);
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > WELCOME_MAX_ACCOUNT_AGE_MS) {
      return NextResponse.json({ success: true, skipped: "account_too_old" });
    }

    releaseClaim = () =>
      profileRef.update({ welcomeEmailSent: false }).catch((e) => console.error("[welcome] Libération de l'indicateur impossible :", e));

    const userCheck = await rateLimit(`welcome_uid_${user.uid}`, 3, 24 * 60 * 60_000);
    if (!userCheck.allowed) {
      await releaseClaim();
      return NextResponse.json({ error: "E-mail de bienvenue déjà envoyé récemment." }, { status: 429 });
    }

    const cleanEmail = email.trim().slice(0, 254);
    const cleanFirst = sanitizeText(firstName, 50);
    const cleanLast = sanitizeText(lastName, 50);
    const rawName = cleanFirst ? `${cleanFirst}${cleanLast ? ` ${cleanLast}` : ""}` : "Coach";
    const safeName = escapeHtml(rawName);

    // Gabarit HTML de l'e-mail de bienvenue The Box
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
            <h1>Bienvenue dans The Box, Coach ${safeName} !</h1>
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
            
            <a href="https://thebox-tactic.com/" class="cta-button">Accéder à ma Planche Tactique</a>
          </div>
          <div class="footer">
            &copy; 2026 The Box - L'outil tactique des coachs d'élite.<br>
            Vous recevez cet e-mail suite à votre inscription sur l'application The Box.
          </div>
        </div>
      </body>
      </html>
    `;

    // Configure SMTP transport using resilient mailer
    const transporter = getMailTransporter();

    const textContent = `THE BOX - ZONE DE DÉCISION TACTIQUE
THE BOX - ZONE DE DÉCISION TACTIQUE

Bienvenue dans The Box, Coach ${rawName} !

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

Accéder à ma Planche Tactique : https://thebox-tactic.com/

© 2026 The Box - L'outil tactique des coachs d'élite.
Vous recevez cet e-mail suite à votre inscription sur l'application The Box.`;

    const mailOptions = {
      from: DEFAULT_FROM_EMAIL,
      to: cleanEmail,
      bcc: ADMIN_NOTIFICATION_EMAIL || undefined,
      subject: "Bienvenue sur The Box - Activation de votre compte Coach",
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully! MessageId:", info.messageId);

    return NextResponse.json({ success: true, message: "Welcome email sent successfully", messageId: info.messageId });
  } catch (err: any) {
    console.error("Error in welcome email API:", err);
    await releaseClaim?.();
    return NextResponse.json({ error: "Échec de l'envoi de l'e-mail de bienvenue. Veuillez réessayer ultérieurement." }, { status: 500 });
  }
}
