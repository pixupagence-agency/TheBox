import { test, expect, Page } from '@playwright/test';
import { ADMIN, requireTestAccount } from './e2e-credentials';
import { login, setSport, startLiveMatch } from './helpers';

requireTestAccount();

// Le mode Live demande un match : chaque test crée le sien (les matchs sont facultatifs).
// Compte admin : accès PRO+ et à tous les sports.

/** Sélectionne le premier joueur de l'équipe et renvoie sa boîte à outils Live. */
async function openPlayerToolbox(page: Page) {
  const playerToken = page.locator('.cursor-grab').first();
  await expect(playerToken).toBeVisible({ timeout: 5000 });
  await playerToken.click();
  const liveToolbox = page.locator('#live-match-player-toolbox');
  await expect(liveToolbox).toBeVisible({ timeout: 5000 });
  return liveToolbox;
}

test.describe('Section 7 : Mode Live Match & Banc de Touche Connecté (FT-LIVE)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await login(page, ADMIN);
  });

  test.afterEach(async ({ page }) => {
    // Le sport est enregistré sur le compte : on revient au football pour les tests suivants
    if (!(await page.locator('#pitch-football').isVisible().catch(() => false))) {
      await setSport(page, 'football').catch(() => {});
    }
  });

  test('FT-LIVE-01 : Activation du Mode Live Match, Chronomètre & Gestion des Périodes', async ({ page }) => {
    // 1. Créer un match et activer le mode Live
    await startLiveMatch(page);
    const chronoDisplay = page.locator('text=⏱️').first();

    // 2. Boutons de périodes (1MT, PAUSE, 2MT)
    await expect(page.getByRole('button', { name: '1MT', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'PAUSE', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '2MT', exact: true }).first()).toBeVisible();

    // 3. Contrôle du chronomètre (START / PAUSE)
    await expect(page.locator('button:has-text("START"), button:has-text("PAUSE")').last()).toBeVisible();

    // 4. Réinitialiser le chronomètre
    const resetTimerBtn = page.locator('button[title*="Réinitialiser le chrono"]').first();
    await expect(resetTimerBtn).toBeVisible();
    await resetTimerBtn.click();
    await expect(chronoDisplay).toContainText('00:00');
  });

  test('FT-LIVE-02 : Enregistrement des Buts et Événements du Match', async ({ page }) => {
    test.setTimeout(90000);
    await startLiveMatch(page);

    // Sélectionner un joueur, puis « ⚽ But » et valider
    const liveToolbox = await openPlayerToolbox(page);
    await liveToolbox.locator('button:has-text("But")').first().click();

    const confirmGoalBtn = page.locator('button:has-text("VALIDER LE BUT")').first();
    await expect(confirmGoalBtn).toBeVisible({ timeout: 5000 });
    await confirmGoalBtn.click({ force: true });

    // Le score passe à 1 - 0
    await expect(page.locator('text=1 - 0').first()).toBeVisible({ timeout: 5000 });
  });

  test('FT-LIVE-03 : Discipline en Direct (Attribution Cartons Jaune et Rouge)', async ({ page }) => {
    await startLiveMatch(page);

    // Carton jaune au premier joueur
    const liveToolbox = await openPlayerToolbox(page);
    await liveToolbox.locator('button:has-text("carton jaune")').first().click();

    // Indicateur d'avertissement 🟨 (1/2)
    await expect(page.locator('text=🟨 (1/2)').first()).toBeVisible();
  });

  test('FT-LIVE-05 : Clôture Officielle du Match et Affichage du Récapitulatif', async ({ page }) => {
    await startLiveMatch(page);

    // Terminer le match
    const finishMatchBtn = page.locator('button:has-text("TERMINER LE MATCH")').first();
    await expect(finishMatchBtn).toBeVisible({ timeout: 5000 });
    await finishMatchBtn.click();

    // Récapitulatif final
    const recapModal = page.locator('text=MATCH TERMINÉ — SCORE FINAL');
    await expect(recapModal).toBeVisible({ timeout: 5000 });

    const closeBtn = page.locator('button:has-text("✕")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(recapModal).not.toBeVisible();
    }
  });

  test('FT-LIVE-06 : Comptage des points spécifiques au Rugby (Drop, Essai, Transformation)', async ({ page }) => {
    test.setTimeout(120000);
    await setSport(page, 'rugby');
    await startLiveMatch(page);

    // Les 3 boutons de score rugby
    let liveToolbox = await openPlayerToolbox(page);
    await expect(liveToolbox.locator('button:has-text("Drop (+3)")').first()).toBeVisible();
    await expect(liveToolbox.locator('button:has-text("Essai (+5)")').first()).toBeVisible();
    await expect(liveToolbox.locator('button:has-text("Transformation (+2)")').first()).toBeVisible();

    // Drop : 3 - 0
    await liveToolbox.locator('button:has-text("Drop (+3)")').first().click();
    await expect(page.locator('text=3 - 0').first()).toBeVisible({ timeout: 5000 });

    // Essai : 8 - 0
    liveToolbox = await openPlayerToolbox(page);
    await liveToolbox.locator('button:has-text("Essai (+5)")').first().click();
    await expect(page.locator('text=8 - 0').first()).toBeVisible({ timeout: 5000 });

    // Transformation : 10 - 0
    liveToolbox = await openPlayerToolbox(page);
    await liveToolbox.locator('button:has-text("Transformation (+2)")').first().click();
    await expect(page.locator('text=10 - 0').first()).toBeVisible({ timeout: 5000 });
  });

  test('FT-LIVE-07 : Comptage des points spécifiques Basketball (3 Pts, 2 Pts, LF)', async ({ page }) => {
    test.setTimeout(120000);
    await setSport(page, 'basketball');
    await startLiveMatch(page);

    let liveToolbox = await openPlayerToolbox(page);
    await expect(liveToolbox.locator('button:has-text("3 points (+3)")').first()).toBeVisible();
    await expect(liveToolbox.locator('button:has-text("2 points (+2)")').first()).toBeVisible();
    await expect(liveToolbox.locator('button:has-text("Lancer franc (+1)")').first()).toBeVisible();

    // Lancer franc : 1 - 0
    await liveToolbox.locator('button:has-text("Lancer franc (+1)")').first().click();
    await expect(page.locator('text=1 - 0').first()).toBeVisible({ timeout: 5000 });

    // Panier à 2 points : 3 - 0
    liveToolbox = await openPlayerToolbox(page);
    await liveToolbox.locator('button:has-text("2 points (+2)")').first().click();
    await expect(page.locator('text=3 - 0').first()).toBeVisible({ timeout: 5000 });

    // Tir à 3 points : 6 - 0
    liveToolbox = await openPlayerToolbox(page);
    await liveToolbox.locator('button:has-text("3 points (+3)")').first().click();
    await expect(page.locator('text=6 - 0').first()).toBeVisible({ timeout: 5000 });
  });

  test('FT-LIVE-08 : Comptage des points Handball (But +1 identique au football)', async ({ page }) => {
    test.setTimeout(120000);
    await setSport(page, 'handball');
    await startLiveMatch(page);

    const liveToolbox = await openPlayerToolbox(page);
    const goalBtn = liveToolbox.locator('button:has-text("But")').first();
    await expect(goalBtn).toBeVisible();

    // But : 1 - 0 après validation
    await goalBtn.click();
    const confirmGoalBtn = page.locator('button:has-text("VALIDER LE BUT")').first();
    await expect(confirmGoalBtn).toBeVisible({ timeout: 5000 });
    await confirmGoalBtn.click({ force: true });
    await expect(page.locator('text=1 - 0').first()).toBeVisible({ timeout: 5000 });
  });
});
