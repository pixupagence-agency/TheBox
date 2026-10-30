import { test, expect } from '@playwright/test';

// Connexion rapide au tableau tactique
async function connectToTacticsBoard(page: any) {
  await page.goto('/');
  const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
  await loginBtn.click();

  const loginForm = page.locator('form').filter({ hasText: /OU AVEC IDENTIFIANTS/i });
  await loginForm.locator('input[type="email"]').fill('coach.demo@thebox.com');
  await loginForm.locator('input[type="password"]').fill('Secur3P@ssw0rd!');
  await loginForm.locator('button[type="submit"]').click();

  await expect(page.locator('#pitch-football')).toBeVisible({ timeout: 15000 });
}

test.describe('Section 6 : Gestion de l\'Effectif, Formations & Causerie Vocale (FT-ROST)', () => {
  test.beforeEach(async ({ page }) => {
    await connectToTacticsBoard(page);
  });

  test('FT-ROST-01 : Choix de Formation Prédéfinie (4-3-3, 4-4-2, 3-5-2)', async ({ page }) => {
    // 1. Bouton de formation 4-3-3
    const formation433Btn = page.getByRole('button', { name: '4-3-3', exact: true }).first();
    await expect(formation433Btn).toBeVisible();
    await formation433Btn.click();

    // 2. Basculer vers la formation 4-4-2
    const formation442Btn = page.getByRole('button', { name: '4-4-2', exact: true }).first();
    await expect(formation442Btn).toBeVisible();
    await formation442Btn.click();

    // 3. Basculer vers la formation 3-5-2
    const formation352Btn = page.getByRole('button', { name: '3-5-2', exact: true }).first();
    await expect(formation352Btn).toBeVisible();
    await formation352Btn.click();

    // 4. Vérifier que les joueurs sont toujours disposés sur le terrain
    const tokens = page.locator('#pitch-football .cursor-grab, .cursor-grab');
    expect(await tokens.count()).toBeGreaterThan(5);
  });

  test('FT-ROST-02 : Panneau d\'Effectif & Rôles (Affichage des têtes de joueurs par défaut)', async ({ page }) => {
    // 1. Ouvrir le panneau d'effectif ("Rôles" / "Effectif")
    const rosterBtn = page.locator('button:has-text("Rôles"), button:has-text("Effectif")').first();
    await expect(rosterBtn).toBeVisible();
    await rosterBtn.click();

    // 2. La modale d'effectif et rôles s'affiche
    const rosterModalTitle = page.locator('h3:has-text("EFFECTIF & RÔLES")').first();
    await expect(rosterModalTitle).toBeVisible();

    // 3. Vérifier que la tête du joueur par défaut s'affiche sur chaque joueur (titulaires + remplaçants)
    const defaultAvatars = page.locator('img[src*="/images/avatars/"]');
    const avatarCount = await defaultAvatars.count();
    expect(avatarCount).toBeGreaterThanOrEqual(11);
    await expect(defaultAvatars.first()).toBeVisible();

    // 4. Fermeture par le bouton Fermer
    const closeBtn = page.locator('button[title="Fermer"]').last();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('FT-ROST-03 : Bloc-Notes Tactique & Consignes du Coach', async ({ page }) => {
    // 1. Localiser le champ de notes tactiques
    const notesArea = page.locator('textarea[placeholder*="STRATÉGIE"], textarea[placeholder*="NOTES"]').first();
    await expect(notesArea).toBeVisible();

    // 2. Saisir une consigne tactique
    const testNote = "Pressing haut dès la perte de balle. Chercher les diagonales rapides.";
    await notesArea.fill(testNote);

    // 3. Vérifier que la note est bien prise en compte
    await expect(notesArea).toHaveValue(testNote);
  });
});
