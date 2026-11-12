import { test, expect } from '@playwright/test';
import { ADMIN, COACH, requireTestAccount } from './e2e-credentials';
import { login, openMoreTools, setSport } from './helpers';

requireTestAccount();

// Fonction utilitaire pour se connecter rapidement au tableau tactique
async function connectToTacticsBoard(page: any) {
  await page.goto('/');
  // Clic sur "Se Connecter"
  const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
  await loginBtn.click();

  // Soumission du formulaire avec un compte coach démo
  const loginForm = page.locator('form').filter({ hasText: /OU AVEC IDENTIFIANTS/i });
  await loginForm.locator('input[type="email"]').fill(COACH.email);
  await loginForm.locator('input[type="password"]').fill(COACH.password);
  await loginForm.locator('button[type="submit"]').click();

  // Attente de l'affichage du terrain de football
  await expect(page.locator('#pitch-football')).toBeVisible({ timeout: 15000 });
}

test.describe('Section 3 : Tableau Tactique 2D & Manipulation des Éléments (FT-TAC)', () => {
  test.beforeEach(async ({ page }) => {
    await connectToTacticsBoard(page);
  });

  test('FT-TAC-01 : Rendu du Terrain Football, Formats de Vue & Zoom', async ({ page }) => {
    // 1. Observer le terrain complet de football
    const pitch = page.locator('#pitch-football');
    await expect(pitch).toBeVisible();

    // 2. Basculer sur le Demi-terrain
    const halfPitchBtn = page.locator('button[title*="Demi-terrain"], button[aria-label*="Demi-terrain"]').first();
    await expect(halfPitchBtn).toBeVisible();
    await halfPitchBtn.click();

    // 3. Revenir en Terrain complet
    const fullPitchBtn = page.locator('button[title*="Terrain complet"], button[aria-label*="Terrain complet"]').first();
    await expect(fullPitchBtn).toBeVisible();
    await fullPitchBtn.click();

    // 4. Contrôles de zoom (+ et -), rangés dans « Plus d'outils » sur les écrans étroits
    await openMoreTools(page);
    const zoomLevel = page.getByRole('button', { name: /^\d+%$/ }).first();
    await expect(zoomLevel).toHaveText('100%');
    await zoomLevel.locator('xpath=following-sibling::button[1]').click();
    // L'indicateur d'échelle augmente
    await expect(zoomLevel).not.toHaveText('100%');
    await zoomLevel.locator('xpath=preceding-sibling::button[1]').click();
    await expect(zoomLevel).toHaveText('100%');
  });

  test('FT-TAC-02 : Présence des Pions Joueurs et du Ballon sur la Pelouse', async ({ page }) => {
    // 1. Vérification que les pions sont présents sur le terrain
    const tokens = page.locator('#pitch-football .cursor-grab, .cursor-grab');
    const tokenCount = await tokens.count();
    expect(tokenCount).toBeGreaterThan(5);

    // 2. Vérification que le premier joueur est interactif
    const firstPlayer = tokens.first();
    await expect(firstPlayer).toBeVisible();

    // 3. Test de déplacement (drag & drop simulé) d'un joueur
    const box = await firstPlayer.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50, { steps: 5 });
      await page.mouse.up();
    }

    // Le joueur reste visible sur la pelouse
    await expect(firstPlayer).toBeVisible();
  });

  test('FT-TAC-03 : Modes de Représentation des Joueurs (Pastille / Buste / Tête)', async ({ page }) => {
    // 1. Bouton Pastille
    const dotBtn = page.locator('button[title*="Pastille"], button[aria-label*="Pastille"]').first();
    if (await dotBtn.isVisible()) {
      await dotBtn.click();
    }

    // 2. Bouton Buste (Maillot)
    const jerseyBtn = page.locator('button[title*="Buste"], button[aria-label*="Buste"]').first();
    if (await jerseyBtn.isVisible()) {
      await jerseyBtn.click();
      // Vérification que les SVG de maillot sont générés
      await expect(page.locator('svg[viewBox="0 0 44 48"]').first()).toBeVisible();
    }
  });
});

// Changement de sport : réservé à un compte admin (les autres sports sont verrouillés pour les coachs).
test.describe('Section 3 : Ballon selon le sport (FT-TAC-04)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test.afterEach(async ({ page }) => {
    // Le sport est enregistré sur le compte : on revient au football pour les tests suivants
    if (!(await page.locator('#pitch-football').isVisible().catch(() => false))) {
      await setSport(page, 'football').catch(() => {});
    }
  });

  test('FT-TAC-04 : Adaptation de la Représentation du Ballon selon le Sport (Football, Rugby, Basket, Hand)', async ({ page }) => {
    test.setTimeout(90000);
    // 1. En football par défaut : vérifier la présence du ballon de football sur le terrain
    const footballBall = page.locator('[data-testid="ball-football"]');
    await expect(footballBall).toBeVisible({ timeout: 10000 });

    // 2. Masquer puis réafficher le ballon (bouton rangé dans « Plus d'outils » sur les écrans étroits)
    await openMoreTools(page);
    await page.getByRole('button', { name: /Masquer le ballon/ }).click();
    await expect(footballBall).not.toBeVisible();

    await openMoreTools(page);
    await page.getByRole('button', { name: /Afficher le ballon/ }).click();
    await expect(footballBall).toBeVisible();

    // 3. Chaque sport affiche son propre ballon
    for (const sport of ['rugby', 'basketball', 'handball'] as const) {
      await setSport(page, sport);
      await expect(page.locator(`[data-testid="ball-${sport}"]`)).toBeVisible({ timeout: 10000 });
    }
  });
});
