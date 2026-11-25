import { test, expect, type Browser } from '@playwright/test';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ADMIN, requireTestAccount } from './e2e-credentials';
import { login, startLiveMatch } from './helpers';

requireTestAccount();

// Publication réelle d'un live (règles Firestore de liveMatches, liveClubs, liveEditorKeys et index du club),
// puis page publique sans compte et télécommande de l'adjoint (route /api/live/remote).
// Lecture des documents publiés avec l'Admin SDK branché sur l'émulateur (jamais la production).
test.skip(!process.env.FIRESTORE_EMULATOR_HOST, 'Émulateur Firestore requis (npm run test:e2e)');

function adminDb() {
  const app = getApps()[0] || initializeApp({ projectId: 'thebox-tactique' });
  return { db: getFirestore(app), auth: getAuth(app) };
}

async function anonymousPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

test.describe('Section 14 : Publication du live, page publique et télécommande (FT-LIVEPUB)', () => {
  test('FT-LIVEPUB-01 : Le coach publie le live, les suiveurs le voient, l’adjoint le pilote', async ({ page, browser }) => {
    test.setTimeout(150000);
    const denied: string[] = [];
    page.on('console', (msg) => {
      if (/permission|insufficient/i.test(msg.text())) denied.push(msg.text());
    });

    await page.setViewportSize({ width: 1600, height: 900 });
    await login(page, ADMIN);
    await startLiveMatch(page);

    // 1. Publication depuis la carte du match : attestation RGPD puis « Publier »
    await page.getByRole('button', { name: /Publier le live/ }).first().click();
    const share = page.getByRole('dialog', { name: 'Partager le live' });
    await expect(share).toBeVisible({ timeout: 10000 });
    const attestation = share.getByTestId('live-attestation');
    if (await attestation.isVisible().catch(() => false)) await attestation.check();
    await share.getByRole('button', { name: 'Publier le live de ce match' }).click();
    await expect(share.getByText('QR de ce match')).toBeVisible({ timeout: 20000 });
    const code = ((await share.locator('p.font-mono').first().textContent()) || '').replace(/\s/g, '');
    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    // 2. Documents publiés : match, club et index du club, au nom du coach
    const { db, auth } = adminDb();
    const uid = (await auth.getUserByEmail(ADMIN.email)).uid;
    const matches = await db.collection('liveMatches').where('ownerUid', '==', uid).get();
    expect(matches.size).toBeGreaterThan(0);
    const latest = matches.docs.sort((a, b) => (b.get('createdAt') || 0) - (a.get('createdAt') || 0))[0];
    const publicId = latest.id;
    const clubSlug = latest.get('clubSlug') as string;
    expect((await db.doc(`liveClubs/${clubSlug}`).get()).get('ownerUid')).toBe(uid);
    expect((await db.doc(`liveClubs/${clubSlug}/matches/${publicId}`).get()).exists).toBe(true);
    expect((await db.doc(`liveEditorKeys/${publicId}`).get()).get('code')).toBe(code);

    // 3. Page publique du match et page du club, sans compte
    const follower = await anonymousPage(browser);
    await follower.goto(`/live/${publicId}`);
    await expect(follower.getByText('Match introuvable')).toHaveCount(0);
    await expect(follower.getByText(/Coup d.envoi|À venir|En direct|Compo/i).first()).toBeVisible({ timeout: 20000 });
    await follower.goto(`/club/${clubSlug}`);
    await expect(follower.locator(`a[href*="${publicId}"]`).first()).toBeVisible({ timeout: 20000 });

    // 4. Télécommande : code saisi, note de l'adjoint → inscrite dans le match et dans l'index du club
    // (le chrono tourne déjà : le mode Live a été lancé côté coach)
    const remote = await anonymousPage(browser);
    await remote.goto('/telecommande');
    await remote.getByPlaceholder('CODE').fill(code);
    await remote.getByRole('button', { name: 'Ouvrir la télécommande' }).click();
    await expect(remote.getByRole('region', { name: 'Score et chrono' })).toBeVisible({ timeout: 20000 });
    await remote.getByRole('button', { name: 'Note' }).click();
    const note = 'Note e2e adjoint';
    await remote.locator('#remote-note').fill(note);
    await remote.getByRole('button', { name: 'OK', exact: true }).click();
    const hasNote = (events: unknown) => Array.isArray(events) && events.some((e) => (e as { note?: string }).note === note);
    await expect
      .poll(async () => hasNote((await db.doc(`liveMatches/${publicId}`).get()).get('events')), { timeout: 20000 })
      .toBe(true);
    await expect
      .poll(async () => hasNote((await db.doc(`liveClubs/${clubSlug}/matches/${publicId}`).get()).get('events')), { timeout: 20000 })
      .toBe(true);
    // 5. L'app du coach applique la commande et republie sans refus des règles
    await expect
      .poll(async () => (await db.collection(`liveMatches/${publicId}/commands`).where('applied', '==', false).get()).size, { timeout: 30000 })
      .toBe(0);
    expect(denied, denied.join('\n')).toEqual([]);

    await follower.context().close();
    await remote.context().close();
  });
});
