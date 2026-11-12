import { test, expect } from '@playwright/test';
import { COACH, requireTestAccount } from './e2e-credentials';

requireTestAccount();

// Connexion rapide au tableau tactique
async function connectToTacticsBoard(page: any) {
  await page.goto('/');
  const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
  await loginBtn.click();

  const loginForm = page.locator('form').filter({ hasText: /OU AVEC IDENTIFIANTS/i });
  await loginForm.locator('input[type="email"]').fill(COACH.email);
  await loginForm.locator('input[type="password"]').fill(COACH.password);
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
    // 1. Ouvrir le panneau d'effectif (bouton « Effectif (26) » du panneau Mon Équipe)
    const rosterBtn = page.getByRole('button', { name: /^Effectif/ }).first();
    await expect(rosterBtn).toBeVisible();
    await rosterBtn.click();

    // 2. La modale d'effectif s'affiche, avec ses filtres Titulaires / Banc
    const rosterModalTitle = page.getByRole('heading', { name: 'Effectif', exact: true });
    await expect(rosterModalTitle).toBeVisible();
    await expect(page.getByRole('button', { name: /^Titulaires \d+$/ }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Banc \d+$/ }).filter({ visible: true }).first()).toBeVisible();

    // 3. Vérifier que la tête du joueur par défaut s'affiche sur chaque joueur (titulaires + remplaçants)
    const defaultAvatars = page.locator('img[src*="/images/avatars/"]');
    const avatarCount = await defaultAvatars.count();
    expect(avatarCount).toBeGreaterThanOrEqual(11);
    await expect(defaultAvatars.first()).toBeVisible();

    // 4. Fermeture par le bouton Fermer
    await page.getByRole('button', { name: 'Fermer', exact: true }).first().click();
    await expect(rosterModalTitle).not.toBeVisible();
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
