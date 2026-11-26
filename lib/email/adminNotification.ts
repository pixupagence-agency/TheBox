// Gabarit des e-mails reçus par l'équipe The Box (formulaire de contact, demande d'assistance) :
// tableau des coordonnées, message, bouton « Répondre ». Les valeurs sont échappées ici.
import { escapeHtml } from "@/lib/security";

export interface AdminNotification {
  /** Pastille en haut de l'e-mail, ex. « Nouveau Ticket Support » */
  badge: string;
  heading: string;
  /** Lignes du tableau (les valeurs vides sont omises) */
  rows: Array<{ label: string; value: string; text?: string }>;
  messageTitle: string;
  message: string;
  senderName: string;
  replyTo: string;
  subject: string;
  replyLabel: string;
  footer: string;
  /** Titre de la version texte, ex. « NOUVEAU MESSAGE SUPPORT THE BOX » */
  textHeading: string;
  date: string;
}

const STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #07090e; color: #ffffff; margin: 0; padding: 20px 0; }
  .container { max-width: 650px; margin: 0 auto; background-color: #0d1117; border: 2px solid #00e599; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
  .header { background: linear-gradient(135deg, #0f141d 0%, #161f2e 100%); padding: 25px 30px; border-bottom: 1px solid #1f293d; text-align: center; }
  .badge { display: inline-block; background-color: rgba(0, 229, 153, 0.15); color: #00e599; border: 1px solid #00e599; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
  .content { padding: 30px; }
  .info-table { width: 100%; border-collapse: collapse; background-color: #121824; border-radius: 12px; overflow: hidden; margin-bottom: 25px; border: 1px solid #1e293b; }
  .info-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #1a2233; }
  .info-table tr:last-child td { border-bottom: none; }
  .info-table td.label { color: #94a3b8; font-weight: 600; width: 35%; }
  .info-table td.value { color: #ffffff; font-weight: 700; }
  .message-box { background-color: #161c28; border-left: 4px solid #00e599; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
  .message-title { font-size: 12px; font-weight: 800; color: #00e599; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  .message-body { font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; margin: 0; font-family: inherit; }
  .cta-box { text-align: center; margin: 30px 0 10px; }
  .cta-button { display: inline-block; background-color: #00e599; color: #07090e; padding: 12px 28px; font-size: 14px; font-weight: 900; text-decoration: none; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer { background-color: #0a0d14; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1a2233; }
`;

export function renderAdminNotification(n: AdminNotification): { html: string; text: string } {
  const email = escapeHtml(n.replyTo);
  const rows = n.rows.filter((r) => r.value);
  const htmlRows = [
    `<tr><td class="label">Expéditeur :</td><td class="value">${escapeHtml(n.senderName)}</td></tr>`,
    `<tr><td class="label">Email de réponse :</td><td class="value"><a href="mailto:${email}" style="color: #00e599; text-decoration: none;">${email}</a></td></tr>`,
    ...rows.map((r) => `<tr><td class="label">${escapeHtml(r.label)} :</td><td class="value">${escapeHtml(r.value)}</td></tr>`),
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(n.subject)}</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">${escapeHtml(n.badge)}</span>
      <h1>${escapeHtml(n.heading)}</h1>
    </div>
    <div class="content">
      <table class="info-table">
${htmlRows}
      </table>
      <div class="message-box">
        <div class="message-title">${escapeHtml(n.messageTitle)}</div>
        <p class="message-body">${escapeHtml(n.message)}</p>
      </div>
      <div class="cta-box">
        <a href="mailto:${email}?subject=Re:%20${encodeURIComponent(n.subject)}" class="cta-button">${escapeHtml(n.replyLabel)}</a>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 The Box - Plateforme de coaching et décision tactique.<br>
      ${escapeHtml(n.footer)}
    </div>
  </div>
</body>
</html>`;

  const text = [
    `=== ${n.textHeading} ===`,
    `Objet: ${n.subject}`,
    `Date: ${n.date}`,
    "",
    "EXPÉDITEUR:",
    `- Nom: ${n.senderName}`,
    `- Email: ${n.replyTo}`,
    ...rows.map((r) => `- ${r.label}: ${r.text ?? r.value}`),
    "",
    "MESSAGE:",
    "----------------------------------------",
    n.message,
    "----------------------------------------",
    "",
    `Pour répondre: ${n.replyTo}`,
  ].join("\n");

  return { html, text };
}
