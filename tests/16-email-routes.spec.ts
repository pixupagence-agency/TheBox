import { test, expect, type APIRequestContext } from '@playwright/test';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { renderAdminNotification } from '../lib/email/adminNotification';
import { ADMIN } from './e2e-credentials';

// Routes d'envoi d'e-mails (app/api/send-*-email) et leurs contrôles communs (lib/email/routeHelpers.ts).
// Serveur de test : MAIL_TRANSPORT=json, les e-mails sont construits mais jamais envoyés.
// Chaque test a sa propre « adresse IP » (X-Forwarded-For) pour ne pas partager les compteurs de limitation.

let ipCounter = 0;
const freshIp = () => `10.0.${Math.floor(Math.random() * 250)}.${++ipCounter}`;

const contact = {
  name: 'Léa Martin',
  email: 'lea@example.com',
  subject: 'Question',
  message: 'Bonjour, une question sur The Box.',
  club: 'FC Test',
  sport: 'football',
};

function post(request: APIRequestContext, route: string, data: unknown, headers: Record<string, string> = {}) {
  return request.post(`/api/${route}`, { data, headers: { 'x-forwarded-for': freshIp(), ...headers } });
}

test.describe('Section 16 : Routes e-mail (FT-MAIL)', () => {
  test('FT-MAIL-01 : Contact et support envoient le message, les données invalides sont refusées', async ({ request }) => {
    for (const route of ['send-contact-email', 'send-support-email']) {
      const ok = await post(request, route, contact);
      expect(ok.status(), route).toBe(200);
      expect((await ok.json()).success).toBe(true);

      expect((await post(request, route, { ...contact, email: 'pas-un-email' })).status()).toBe(400);
      expect((await post(request, route, { ...contact, message: '   ' })).status()).toBe(400);
      expect((await post(request, route, 'texte brut')).status()).toBe(400);
      // Requête venue d'un autre site (CSRF)
      expect((await post(request, route, contact, { origin: 'https://pirate.example' })).status()).toBe(403);
      // Piège à robots : succès apparent
      const bot = await post(request, route, { ...contact, website_url: 'http://spam' });
      expect(bot.status()).toBe(200);
      expect((await bot.json()).messageId).toBeUndefined();
    }
  });

  test('FT-MAIL-02 : Limite de 5 messages de contact par 5 minutes et par IP', async ({ request }) => {
    const ip = freshIp();
    for (let i = 0; i < 5; i++) {
      expect((await post(request, 'send-contact-email', contact, { 'x-forwarded-for': ip })).status()).toBe(200);
    }
    const blocked = await post(request, 'send-contact-email', contact, { 'x-forwarded-for': ip });
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()['retry-after'])).toBeGreaterThan(0);
  });

  test('FT-MAIL-03 : Bienvenue et schéma réservés aux coachs connectés', async ({ request }) => {
    for (const route of ['send-welcome-email', 'send-schema-email']) {
      const res = await post(request, route, { email: 'lea@example.com', firstName: 'Léa' });
      expect(res.status(), route).toBe(401);
      expect((await res.json()).requiresAuth).toBe(true);
      const forged = await post(request, route, {}, { authorization: 'Bearer faux-jeton' });
      expect(forged.status(), route).toBe(401);
    }
  });

  test('FT-MAIL-05 : Coach connecté : schéma et bienvenue envoyés', async ({ request }) => {
    test.skip(!process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Émulateur Auth requis (npm run test:e2e)');
    // Jeton du compte admin de test, obtenu auprès de l'émulateur Auth (formule PRO+)
    const signIn = await request.post(
      `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e`,
      { data: { email: ADMIN.email, password: ADMIN.password, returnSecureToken: true } }
    );
    const { idToken } = await signIn.json();
    expect(idToken).toBeTruthy();
    const authorization = `Bearer ${idToken}`;

    const schema = await post(request, 'send-schema-email', {
      email: 'adjoint@example.com',
      title: 'Pressing haut',
      body: 'Bloc équipe à 30 m',
      imageUrl: 'data:image/png;base64,iVBORw0KGgo=',
    }, { authorization });
    expect(schema.status(), await schema.text()).toBe(200);

    const welcome = await post(request, 'send-welcome-email', { firstName: 'Admin' }, { authorization });
    expect(welcome.status(), await welcome.text()).toBe(200);
  });

  test('FT-MAIL-06 : Un seul e-mail de bienvenue par compte, indicateur tenu par le serveur', async ({ request }) => {
    test.skip(!process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Émulateur Auth requis (npm run test:e2e)');
    const app = getApps()[0] || initializeApp({ projectId: 'thebox-tactique' });
    const db = getFirestore(app);
    const auth = getAuth(app);
    const tokenFor = async (email: string, password: string) => {
      const res = await request.post(
        `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e`,
        { data: { email, password, returnSecureToken: true } }
      );
      return `Bearer ${(await res.json()).idToken}`;
    };

    // Compte tout juste créé : profil présent, e-mail pas encore envoyé
    const email = `bienvenue-${Date.now()}@example.com`;
    const user = await auth.createUser({ email, password: 'motdepasse-e2e', emailVerified: true });
    const authorization = await tokenFor(email, 'motdepasse-e2e');
    try {
      // Pas encore de profil : rien n'est envoyé, aucun document partiel créé
      const early = await post(request, 'send-welcome-email', { firstName: 'Léa' }, { authorization });
      expect(early.status()).toBe(409);
      expect((await db.doc(`users/${user.uid}`).get()).exists).toBe(false);

      await db.doc(`users/${user.uid}`).set({ id: user.uid, email, createdAt: new Date().toISOString() });
      // Deux connexions simultanées (deux onglets) : un seul envoi
      const [a, b] = await Promise.all([
        post(request, 'send-welcome-email', { firstName: 'Léa' }, { authorization }),
        post(request, 'send-welcome-email', { firstName: 'Léa' }, { authorization }),
      ]);
      const bodies = [await a.json(), await b.json()];
      expect(bodies.filter((r) => r.messageId)).toHaveLength(1);
      expect(bodies.filter((r) => r.alreadySent)).toHaveLength(1);
      expect((await db.doc(`users/${user.uid}`).get()).get('welcomeEmailSent')).toBe(true);

      // Connexions suivantes : succès sans nouvel envoi
      const again = await (await post(request, 'send-welcome-email', { firstName: 'Léa' }, { authorization })).json();
      expect(again).toMatchObject({ success: true, alreadySent: true });
      expect(again.messageId).toBeUndefined();
    } finally {
      await db.doc(`users/${user.uid}`).delete();
      await auth.deleteUser(user.uid);
    }

    // Compte créé il y a 30 jours, jamais marqué (créé avant l'indicateur) : marqué, aucun e-mail
    const oldUid = `ancien-${Date.now()}`;
    const oldEmail = `${oldUid}@example.com`;
    await auth.importUsers([{ uid: oldUid, email: oldEmail, emailVerified: true, metadata: { creationTime: new Date(Date.now() - 30 * 86400_000).toUTCString(), lastSignInTime: new Date().toUTCString() } }]);
    try {
      await db.doc(`users/${oldUid}`).set({ id: oldUid, email: oldEmail });
      const signIn = await request.post(
        `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=e2e`,
        { data: { token: await auth.createCustomToken(oldUid), returnSecureToken: true } }
      );
      const oldAuth = `Bearer ${(await signIn.json()).idToken}`;
      const res = await (await post(request, 'send-welcome-email', {}, { authorization: oldAuth })).json();
      expect(res).toMatchObject({ success: true, skipped: 'account_too_old' });
      expect(res.messageId).toBeUndefined();
      expect((await db.doc(`users/${oldUid}`).get()).get('welcomeEmailSent')).toBe(true);
    } finally {
      await db.doc(`users/${oldUid}`).delete();
      await auth.deleteUser(oldUid);
    }
  });

  test('FT-MAIL-04 : Gabarit des notifications : valeurs échappées, lignes vides omises', () => {
    const { html, text } = renderAdminNotification({
      badge: 'Nouveau Ticket Support',
      heading: 'The Box',
      rows: [
        { label: 'Club', value: '<b>FC</b>' },
        { label: 'Téléphone', value: '' },
        { label: 'Sport', value: 'FOOTBALL', text: 'football' },
      ],
      messageTitle: 'Message',
      message: '<script>alert(1)</script>',
      senderName: 'Léa "L" Martin',
      replyTo: 'lea@example.com',
      subject: '[Support] <img src=x onerror=alert(1)>',
      replyLabel: 'Répondre',
      footer: 'Pied',
      textHeading: 'NOUVEAU MESSAGE',
      date: '26/11/2026 09:00',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;b&gt;FC&lt;/b&gt;');
    expect(html).not.toContain('Téléphone');
    expect(text).toContain('- Sport: football');
    expect(text).toContain('<script>alert(1)</script>'); // version texte brute
    expect(text).not.toContain('Téléphone');
  });
});
