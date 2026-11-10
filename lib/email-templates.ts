// Templates des e-mails transactionnels liés à l'abonnement (résiliation).
// Volontairement sans import pour pouvoir être prévisualisés hors de Next.js.

export const APP_PUBLIC_URL = "https://theboxlarena.com/";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

export function planDisplayName(planId?: string | null): string {
  switch ((planId || "").toLowerCase()) {
    case "club":
    case "pro_plus":
      return "PRO+";
    case "pro":
      return "PRO";
    default:
      return "payante";
  }
}

function layout(opts: { title: string; badge: string; accent: string; body: string }): string {
  const { title, badge, accent, body } = opts;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#07090e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07090e;">
    <tr><td align="center" style="padding:40px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#0d1117;border:2px solid ${accent};border-radius:16px;overflow:hidden;">
        <tr><td style="background-color:#090d14;padding:28px 30px;text-align:center;border-bottom:1px solid #1f293d;">
          <div style="font-size:20px;font-weight:900;color:#00e599;text-transform:uppercase;letter-spacing:1.5px;">THE BOX</div>
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;">Zone de décision tactique</div>
        </td></tr>
        <tr><td style="padding:36px 30px;">
          <div style="display:inline-block;background-color:#111827;color:${accent};font-size:12px;font-weight:bold;padding:6px 14px;border-radius:99px;border:1px solid ${accent};margin-bottom:20px;text-transform:uppercase;letter-spacing:1px;">${esc(badge)}</div>
          ${body}
        </td></tr>
        <tr><td style="background-color:#090d14;padding:20px;text-align:center;border-top:1px solid #1f293d;color:#64748b;font-size:11px;line-height:1.6;">
          &copy; ${new Date().getFullYear()} The Box - L'outil tactique des coachs.<br>
          Vous recevez cet e-mail car vous disposez d'un compte sur l'application The Box.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const P = 'style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 16px 0;"';
const H1 = 'style="color:#ffffff;font-size:22px;font-weight:800;margin:0 0 18px 0;text-transform:uppercase;"';
const BOX = 'style="background-color:#090d14;border:1px solid #1f293d;border-radius:12px;padding:18px 20px;margin:22px 0;"';
const LI = 'style="color:#e2e8f0;font-size:14px;line-height:1.5;margin:0 0 8px 0;"';

function cta(label: string, href: string): string {
  return `<a href="${href}" style="display:block;background-color:#00e599;color:#07090e;text-align:center;padding:14px 24px;border-radius:10px;font-weight:900;text-decoration:none;text-transform:uppercase;letter-spacing:1px;margin:28px 0 8px 0;font-size:14px;">${esc(label)}</a>`;
}

/**
 * E-mail n°1 — envoyé dès que le coach demande la résiliation
 * (depuis l'application ou le portail Stripe). L'accès reste actif jusqu'à la fin de la période payée.
 */
export function cancellationScheduledEmail(params: {
  name: string;
  planId?: string | null;
  accessUntil: Date;
}): RenderedEmail {
  const plan = planDisplayName(params.planId);
  const date = formatDateFr(params.accessUntil);
  const name = params.name || "Coach";

  const subject = `Confirmation de votre résiliation - The Box ${plan}`;

  const html = layout({
    title: subject,
    badge: "Résiliation confirmée",
    accent: "#f59e0b",
    body: `
      <h1 ${H1}>Votre résiliation est bien enregistrée</h1>
      <p ${P}>Bonjour ${esc(name)},</p>
      <p ${P}>Nous confirmons la résiliation de votre abonnement <strong style="color:#ffffff;">The Box ${esc(plan)}</strong>. Aucun nouveau prélèvement ne sera effectué.</p>
      <div ${BOX}>
        <p style="color:#f59e0b;font-size:13px;font-weight:900;text-transform:uppercase;margin:0 0 10px 0;">Ce qui se passe maintenant</p>
        <p ${LI}>✓ Vous gardez toutes les fonctions ${esc(plan)} jusqu'au <strong>${esc(date)}</strong>.</p>
        <p ${LI}>✓ À cette date, votre compte repassera automatiquement en Version Gratuite.</p>
        <p ${LI}>✓ Vos équipes, effectifs et schémas restent sauvegardés.</p>
      </div>
      <p ${P}>Vous avez changé d'avis ? Vous pouvez réactiver votre abonnement à tout moment avant le ${esc(date)} depuis votre espace « Abonnement » dans l'application, sans rien perdre.</p>
      ${cta("Ouvrir The Box", APP_PUBLIC_URL)}
      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:18px 0 0 0;">Une remarque sur l'application ? Répondez simplement à cet e-mail, votre retour nous aide à progresser.</p>
    `,
  });

  const text = `THE BOX - Résiliation confirmée

Bonjour ${name},

Nous confirmons la résiliation de votre abonnement The Box ${plan}. Aucun nouveau prélèvement ne sera effectué.

Ce qui se passe maintenant :
- Vous gardez toutes les fonctions ${plan} jusqu'au ${date}.
- À cette date, votre compte repassera automatiquement en Version Gratuite.
- Vos équipes, effectifs et schémas restent sauvegardés.

Vous avez changé d'avis ? Vous pouvez réactiver votre abonnement à tout moment avant le ${date} depuis votre espace « Abonnement » dans l'application, sans rien perdre.

Ouvrir The Box : ${APP_PUBLIC_URL}

Une remarque sur l'application ? Répondez simplement à cet e-mail.`;

  return { subject, html, text };
}

/**
 * E-mail n°2 — envoyé quand l'abonnement prend réellement fin
 * (fin de période après résiliation, ou après échecs de paiement répétés).
 */
export function subscriptionEndedEmail(params: {
  name: string;
  planId?: string | null;
  reason: "canceled" | "payment_failed";
}): RenderedEmail {
  const plan = planDisplayName(params.planId);
  const name = params.name || "Coach";
  const paymentIssue = params.reason === "payment_failed";

  const subject = paymentIssue
    ? `Votre abonnement The Box ${plan} a été suspendu`
    : `Votre abonnement The Box ${plan} est terminé`;

  const intro = paymentIssue
    ? `Malgré plusieurs tentatives, nous n'avons pas pu encaisser le paiement de votre abonnement <strong style="color:#ffffff;">The Box ${esc(plan)}</strong>. Il a donc été arrêté.`
    : `Votre abonnement <strong style="color:#ffffff;">The Box ${esc(plan)}</strong> est arrivé à son terme, comme vous l'aviez demandé.`;
  const introText = paymentIssue
    ? `Malgré plusieurs tentatives, nous n'avons pas pu encaisser le paiement de votre abonnement The Box ${plan}. Il a donc été arrêté.`
    : `Votre abonnement The Box ${plan} est arrivé à son terme, comme vous l'aviez demandé.`;

  const html = layout({
    title: subject,
    badge: paymentIssue ? "Abonnement suspendu" : "Abonnement terminé",
    accent: paymentIssue ? "#f43f5e" : "#64748b",
    body: `
      <h1 ${H1}>${paymentIssue ? "Votre abonnement est suspendu" : "Merci d'avoir coaché avec nous"}</h1>
      <p ${P}>Bonjour ${esc(name)},</p>
      <p ${P}>${intro}</p>
      <div ${BOX}>
        <p style="color:#00e599;font-size:13px;font-weight:900;text-transform:uppercase;margin:0 0 10px 0;">Votre compte reste actif en Version Gratuite</p>
        <p ${LI}>✓ Tableau tactique 2D et tracés</p>
        <p ${LI}>✓ Votre effectif et l'export PNG</p>
        <p ${LI}>✓ Toutes vos données restent sauvegardées</p>
      </div>
      <p ${P}>Les fonctions ${esc(plan)} (multi-équipes, gestion des matchs, enregistrements vocaux${params.planId === "club" || params.planId === "pro_plus" ? ", Mode Live Match" : ""}) seront à nouveau disponibles dès que vous reprendrez un abonnement.</p>
      ${cta(paymentIssue ? "Reprendre mon abonnement" : "Revenir sur The Box", APP_PUBLIC_URL)}
    `,
  });

  const text = `THE BOX - ${paymentIssue ? "Abonnement suspendu" : "Abonnement terminé"}

Bonjour ${name},

${introText}

Votre compte reste actif en Version Gratuite :
- Tableau tactique 2D et tracés
- Votre effectif et l'export PNG
- Toutes vos données restent sauvegardées

Les fonctions ${plan} seront à nouveau disponibles dès que vous reprendrez un abonnement.

${paymentIssue ? "Reprendre mon abonnement" : "Revenir sur The Box"} : ${APP_PUBLIC_URL}`;

  return { subject, html, text };
}
