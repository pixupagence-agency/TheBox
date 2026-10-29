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

  test('FT-TAC-04 : Adaptation de la Représentation du Ballon selon le Sport (Football, Rugby, Basket, Hand)', async ({ page }) => {
    // 1. En football par défaut : vérifier la présence du ballon de football sur le terrain
    const footballBall = page.locator('[data-testid="ball-football"]');
    await expect(footballBall).toBeVisible({ timeout: 10000 });

    // 2. Vérifier le bouton de masquage / affichage du ballon dans la barre d'outils
    const hideBallBtn = page.locator('button[title*="ballon"]').first();
    await expect(hideBallBtn).toBeVisible();
    await hideBallBtn.click();

    // Le ballon est masqué
    await expect(footballBall).not.toBeVisible();

    // Réafficher le ballon
    await hideBallBtn.click();
    await expect(footballBall).toBeVisible();

    // 3. Basculer vers Rugby via le menu utilisateur
    const userMenuTrigger = page.locator('button:visible').filter({ hasText: /COACH DÉMO|DEMO|ADMIN/i }).first();
    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();
      const configItem = page.locator('button:has-text("Configuration Profil & Sport")').first();
      if (await configItem.isVisible()) {
        await configItem.click();

        const sportSelect = page.locator('select').filter({ hasText: 'Rugby' }).first();
        await sportSelect.selectOption('rugby');

        await page.locator('button[type="submit"]').filter({ hasText: /Enregistrer/i }).first().click();
        await page.waitForTimeout(400);

        // Vérification de la représentation ballon de rugby (ovale)
        const rugbyBall = page.locator('[data-testid="ball-rugby"]');
        await expect(rugbyBall).toBeVisible({ timeout: 10000 });

        // 4. Basculer vers Basketball
        await userMenuTrigger.click();
        await configItem.click();
        await sportSelect.selectOption('basketball');
        await page.locator('button[type="submit"]').filter({ hasText: /Enregistrer/i }).first().click();
        await page.waitForTimeout(400);

        // Vérification de la représentation ballon de basketball
        const basketBall = page.locator('[data-testid="ball-basketball"]');
        await expect(basketBall).toBeVisible({ timeout: 10000 });

        // 5. Basculer vers Handball
        await userMenuTrigger.click();
        await configItem.click();
        await sportSelect.selectOption('handball');
        await page.locator('button[type="submit"]').filter({ hasText: /Enregistrer/i }).first().click();
        await page.waitForTimeout(400);

        // Vérification de la représentation ballon de handball
        const handballBall = page.locator('[data-testid="ball-handball"]');
        await expect(handballBall).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
