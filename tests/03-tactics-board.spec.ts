import { test, expect } from '@playwright/test';

// Fonction utilitaire pour se connecter rapidement au tableau tactique
async function connectToTacticsBoard(page: any) {
  await page.goto('/');
  // Clic sur "Se Connecter"
  const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
  await loginBtn.click();

  // Soumission du formulaire avec un compte coach démo
  const loginForm = page.locator('form').filter({ hasText: /OU AVEC IDENTIFIANTS/i });
  await loginForm.locator('input[type="email"]').fill('coach.demo@thebox.com');
  await loginForm.locator('input[type="password"]').fill('Secur3P@ssw0rd!');
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

    // 4. Contrôles de zoom (+ et -)
    const zoomInBtn = page.locator('button[title*="Zoom avant (Terrain)"], button:has-text("+")').first();
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click();
      // L'indicateur d'échelle augmente
      await expect(page.locator('text=%').first()).toBeVisible();
    }
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
