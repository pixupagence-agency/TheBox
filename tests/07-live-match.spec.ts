import { test, expect } from '@playwright/test';

// Utilitaire de connexion en mode PRO+ / Admin pour débloquer le Mode Live Match
async function connectAsProCoach(page: any) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('thebox_admin_mode', 'true');
    localStorage.setItem('thebox_tutorial_seen', 'true');
  });

  await page.goto('/');
  const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
  await expect(loginBtn).toBeVisible({ timeout: 10000 });
  await loginBtn.click();

  const loginForm = page.locator('form').filter({ hasText: /OU AVEC IDENTIFIANTS/i });
  if (!(await loginForm.isVisible({ timeout: 2000 }).catch(() => false))) {
    await loginBtn.click();
  }
  await expect(loginForm).toBeVisible({ timeout: 10000 });

  await loginForm.locator('input[type="email"]').fill('pixup.agence@gmail.com');
  await loginForm.locator('input[type="password"]').fill('Secur3P@ssw0rd!');
  await loginForm.locator('button[type="submit"]').click();

  await expect(page.locator('#pitch-football')).toBeVisible({ timeout: 15000 });

  // S'assurer que le volet droit est ouvert
  const openSidebarBtn = page.locator('button:has-text("SCHÉMAS & MATCHS")').first();
  if (await openSidebarBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await openSidebarBtn.click();
    await page.waitForTimeout(400);
  }
}

test.describe('Section 7 : Mode Live Match & Banc de Touche Connecté (FT-LIVE)', () => {
  test.beforeEach(async ({ page }) => {
    await connectAsProCoach(page);
  });

  test('FT-LIVE-01 : Activation du Mode Live Match, Chronomètre & Gestion des Périodes', async ({ page }) => {
    // 1. Localiser et cliquer sur le bouton "MODE LIVE"
    const liveToggleBtn = page.locator('button:has-text("MODE LIVE")').first();
    await expect(liveToggleBtn).toBeVisible({ timeout: 5000 });
    await liveToggleBtn.click();

    // 2. Vérifier que le mode Live est actif (affichage du chronomètre et des périodes)
    const chronoDisplay = page.locator('text=⏱️');
    await expect(chronoDisplay).toBeVisible({ timeout: 5000 });

    // Vérifier les boutons de périodes (1MT, PAUSE, 2MT)
    const firstHalfBtn = page.getByRole('button', { name: '1MT', exact: true }).first();
    const pauseBtn = page.getByRole('button', { name: 'PAUSE', exact: true }).first();
    const secondHalfBtn = page.getByRole('button', { name: '2MT', exact: true }).first();
    await expect(firstHalfBtn).toBeVisible();
    await expect(pauseBtn).toBeVisible();
    await expect(secondHalfBtn).toBeVisible();

    // 3. Contrôler le chronomètre (START / PAUSE)
    const startPauseBtn = page.locator('button:has-text("START"), button:has-text("PAUSE")').last();
    await expect(startPauseBtn).toBeVisible();

    // 4. Réinitialiser le chronomètre (bouton 🔄)
    const resetTimerBtn = page.locator('button[title*="Réinitialiser le chrono"]').first();
    await expect(resetTimerBtn).toBeVisible();
    await resetTimerBtn.click();
    await expect(chronoDisplay).toContainText('00:00');
  });

  test('FT-LIVE-02 : Enregistrement des Buts et Événements du Match', async ({ page }) => {
    test.setTimeout(90000);
    // 1. Activer le Mode Live
    const liveToggleBtn = page.locator('button:has-text("MODE LIVE")').first();
    await expect(liveToggleBtn).toBeVisible({ timeout: 5000 });
    await liveToggleBtn.click();
    await expect(page.locator('text=⏱️')).toBeVisible({ timeout: 5000 });

    // 2. Sélectionner un pion joueur sur le terrain pour ouvrir la boîte à outils Live
    const firstPlayerToken = page.locator('.cursor-grab').first();
    await expect(firstPlayerToken).toBeVisible({ timeout: 5000 });
    await firstPlayerToken.click();

    // 3. Vérifier que la toolbox Live Match s'ouvre
    const liveToolbox = page.locator('#live-match-player-toolbox');
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });

    // 4. Cliquer sur le bouton ⚽ But pour ouvrir la modale d'attribution de passeur / buteur
    const goalBtn = liveToolbox.locator('button:has-text("But")').first();
    await expect(goalBtn).toBeVisible();
    await goalBtn.click();

    // 5. Valider le but dans la modale
    const confirmGoalBtn = page.locator('button:has-text("VALIDER LE BUT")').first();
    await expect(confirmGoalBtn).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(300);
    await confirmGoalBtn.click();

    // 6. Vérifier que le score passe à 1 - 0
    await expect(page.locator('text=1 - 0').first()).toBeVisible({ timeout: 5000 });
  });

  test('FT-LIVE-03 : Discipline en Direct (Attribution Cartons Jaune et Rouge)', async ({ page }) => {
    // 1. Activer le Mode Live
    const liveToggleBtn = page.locator('button:has-text("MODE LIVE")').first();
    await expect(liveToggleBtn).toBeVisible({ timeout: 5000 });
    await liveToggleBtn.click();
    await expect(page.locator('text=⏱️')).toBeVisible({ timeout: 5000 });

    // 2. Sélectionner un joueur sur le terrain
    const playerToken = page.locator('.cursor-grab').first();
    await expect(playerToken).toBeVisible({ timeout: 5000 });
    await playerToken.click();

    const liveToolbox = page.locator('#live-match-player-toolbox');
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });

    // 3. Attribuer un carton jaune (🟨)
    const yellowBtn = liveToolbox.locator('button:has-text("Jaune")').first();
    await expect(yellowBtn).toBeVisible();
    await yellowBtn.click();

    // 4. Vérifier la présence de l'indicateur d'avertissement 🟨 (1/2)
    await expect(page.locator('text=🟨 (1/2)').first()).toBeVisible();
  });

  test('FT-LIVE-05 : Clôture Officielle du Match et Affichage du Récapitulatif', async ({ page }) => {
    // 1. Activer le Mode Live
    const liveToggleBtn = page.locator('button:has-text("MODE LIVE")').first();
    await expect(liveToggleBtn).toBeVisible({ timeout: 5000 });
    await liveToggleBtn.click();
    await expect(page.locator('text=⏱️')).toBeVisible({ timeout: 5000 });

    // 2. Cliquer sur "TERMINER LE MATCH"
    const finishMatchBtn = page.locator('button:has-text("TERMINER LE MATCH")').first();
    await expect(finishMatchBtn).toBeVisible({ timeout: 5000 });
    await finishMatchBtn.click();

    // 3. Vérifier l'apparition de la modale de récapitulatif final
    const recapModal = page.locator('text=MATCH TERMINÉ — SCORE FINAL');
    await expect(recapModal).toBeVisible({ timeout: 5000 });

    // 4. Fermer la modale
    const closeBtn = page.locator('button:has-text("✕")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(recapModal).not.toBeVisible();
    }
  });

  test('FT-LIVE-06 : Comptage des points spécifiques selon la discipline (Rugby, Basket, Hand)', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Ouvrir la configuration pour basculer en mode RUGBY
    const userMenuTrigger = page.locator('button:visible').filter({ hasText: 'ADMIN PLATEFORME' }).first();
    await userMenuTrigger.click();

    const configItem = page.locator('button:has-text("Configuration Profil & Sport")').first();
    await expect(configItem).toBeVisible({ timeout: 5000 });
    await configItem.click();

    // Sélectionner Rugby
    const sportSelect = page.locator('select').filter({ hasText: 'Rugby' }).first();
    await sportSelect.selectOption('rugby');

    // Remplir prénom si nécessaire pour satisfaire la validation HTML5
    const nameInputs = page.locator('div:has-text("CONFIGURATION DE L\'UTILISATEUR") input[type="text"]');
    const count = await nameInputs.count();
    for (let i = 0; i < count; i++) {
      const val = await nameInputs.nth(i).inputValue();
      if (!val) {
        await nameInputs.nth(i).fill('Admin');
      }
    }

    await page.locator('button[type="submit"]').filter({ hasText: /Enregistrer/i }).first().click();
    await expect(page.locator('text=CONFIGURATION DE L\'UTILISATEUR')).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(400);

    // 2. Activer le Mode Live
    const liveToggleBtn = page.locator('button:has-text("MODE LIVE")').first();
    await expect(liveToggleBtn).toBeVisible({ timeout: 5000 });
    await liveToggleBtn.click();

    // 3. Sélectionner un joueur de rugby sur le terrain
    const playerToken = page.locator('.cursor-grab').first();
    await expect(playerToken).toBeVisible({ timeout: 5000 });
    await playerToken.click();

    const liveToolbox = page.locator('#live-match-player-toolbox');
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });

    // 4. Vérifier la présence des 3 boutons de scoring Rugby : Essai (+5), Transfo (+2), Pénalité (+3)
    const essaiBtn = liveToolbox.locator('button:has-text("Essai (+5)")').first();
    const transfoBtn = liveToolbox.locator('button:has-text("Transfo (+2)")').first();
    const penaliteBtn = liveToolbox.locator('button:has-text("Pénalité (+3)")').first();

    await expect(essaiBtn).toBeVisible();
    await expect(transfoBtn).toBeVisible();
    await expect(penaliteBtn).toBeVisible();

    // 5. Attribuer une Pénalité (3 points directs)
    await penaliteBtn.click();
    await expect(page.locator('text=3 - 0').first()).toBeVisible({ timeout: 5000 });

    // 6. Attribuer une Transformation (2 points directs -> 5 - 0)
    await playerToken.click();
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });
    await liveToolbox.locator('button:has-text("Transfo (+2)")').first().click();
    await expect(page.locator('text=5 - 0').first()).toBeVisible({ timeout: 5000 });

    // 7. Attribuer un Essai (5 points avec validation -> 10 - 0)
    await playerToken.click();
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });
    await liveToolbox.locator('button:has-text("Essai (+5)")').first().click();
    const confirmEssaiBtn = page.locator('button:has-text("VALIDER ESSAI (+5)")').first();
    await expect(confirmEssaiBtn).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(300);
    await confirmEssaiBtn.click();
    await expect(page.locator('text=10 - 0').first()).toBeVisible({ timeout: 5000 });
  });

  test('FT-LIVE-07 : Comptage des points spécifiques Basketball (3 Pts, 2 Pts, LF)', async ({ page }) => {
    test.setTimeout(90000);
    // 1. Ouvrir la configuration pour basculer en mode BASKETBALL
    const userMenuTrigger = page.locator('button:visible').filter({ hasText: 'ADMIN PLATEFORME' }).first();
    await userMenuTrigger.click();

    const configItem = page.locator('button:has-text("Configuration Profil & Sport")').first();
    await expect(configItem).toBeVisible({ timeout: 5000 });
    await configItem.click();

    // Sélectionner Basketball
    const sportSelect = page.locator('select').filter({ hasText: 'Basketball' }).first();
    await sportSelect.selectOption('basketball');

    // Remplir prénom si nécessaire pour satisfaire la validation HTML5
    const nameInputs = page.locator('div:has-text("CONFIGURATION DE L\'UTILISATEUR") input[type="text"]');
    const count = await nameInputs.count();
    for (let i = 0; i < count; i++) {
      const val = await nameInputs.nth(i).inputValue();
      if (!val) {
        await nameInputs.nth(i).fill('Admin');
      }
    }

    await page.locator('button[type="submit"]').filter({ hasText: /Enregistrer/i }).first().click();
    await expect(page.locator('text=CONFIGURATION DE L\'UTILISATEUR')).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(400);

    // 2. Activer le Mode Live
    const liveToggleBtn = page.locator('button:has-text("MODE LIVE")').first();
    await expect(liveToggleBtn).toBeVisible({ timeout: 5000 });
    await liveToggleBtn.click();

    // 3. Sélectionner un joueur sur le terrain
    const playerToken = page.locator('.cursor-grab').first();
    await expect(playerToken).toBeVisible({ timeout: 5000 });
    await playerToken.click();

    const liveToolbox = page.locator('#live-match-player-toolbox');
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });

    // 4. Vérifier la présence des 3 boutons de scoring Basketball : 3 Pts (+3), 2 Pts (+2), LF (+1)
    const threePtBtn = liveToolbox.locator('button:has-text("3 Pts (+3)")').first();
    const twoPtBtn = liveToolbox.locator('button:has-text("2 Pts (+2)")').first();
    const lfBtn = liveToolbox.locator('button:has-text("LF (+1)")').first();

    await expect(threePtBtn).toBeVisible();
    await expect(twoPtBtn).toBeVisible();
    await expect(lfBtn).toBeVisible();

    // 5. Attribuer un Lancer Franc (+1 direct -> 1 - 0)
    await lfBtn.click();
    await expect(page.locator('text=1 - 0').first()).toBeVisible({ timeout: 5000 });

    // 6. Attribuer un Panier à 2 Points (+2 pts -> 3 - 0)
    await playerToken.click();
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });
    await liveToolbox.locator('button:has-text("2 Pts (+2)")').first().click();
    const confirmTwoPtBtn = page.locator('button:has-text("VALIDER 2 POINTS (+2)")').first();
    await expect(confirmTwoPtBtn).toBeVisible({ timeout: 5000 });
    await confirmTwoPtBtn.click({ force: true });
    await expect(page.locator('text=3 - 0').first()).toBeVisible({ timeout: 5000 });

    // 7. Attribuer un Tir à 3 Points (+3 pts -> 6 - 0)
    await playerToken.click();
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });
    await liveToolbox.locator('button:has-text("3 Pts (+3)")').first().click();
    const confirmThreePtBtn = page.locator('button:has-text("VALIDER 3 POINTS (+3)")').first();
    await expect(confirmThreePtBtn).toBeVisible({ timeout: 5000 });
    await confirmThreePtBtn.click({ force: true });
    await expect(page.locator('text=6 - 0').first()).toBeVisible({ timeout: 5000 });
  });

  test('FT-LIVE-08 : Comptage des points Handball (But +1 identique au football)', async ({ page }) => {
    test.setTimeout(90000);
    // 1. Ouvrir la configuration pour basculer en mode HANDBALL
    const userMenuTrigger = page.locator('button:visible').filter({ hasText: 'ADMIN PLATEFORME' }).first();
    await userMenuTrigger.click();

    const configItem = page.locator('button:has-text("Configuration Profil & Sport")').first();
    await expect(configItem).toBeVisible({ timeout: 5000 });
    await configItem.click();

    // Sélectionner Handball
    const sportSelect = page.locator('select').filter({ hasText: 'Handball' }).first();
    await sportSelect.selectOption('handball');

    // Remplir prénom si nécessaire pour satisfaire la validation HTML5
    const nameInputs = page.locator('div:has-text("CONFIGURATION DE L\'UTILISATEUR") input[type="text"]');
    const count = await nameInputs.count();
    for (let i = 0; i < count; i++) {
      const val = await nameInputs.nth(i).inputValue();
      if (!val) {
        await nameInputs.nth(i).fill('Admin');
      }
    }

    await page.locator('button[type="submit"]').filter({ hasText: /Enregistrer/i }).first().click();
    await expect(page.locator('text=CONFIGURATION DE L\'UTILISATEUR')).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(400);

    // 2. Activer le Mode Live
    const liveToggleBtn = page.locator('button:has-text("MODE LIVE")').first();
    await expect(liveToggleBtn).toBeVisible({ timeout: 5000 });
    await liveToggleBtn.click();

    // 3. Sélectionner un joueur sur le terrain
    const playerToken = page.locator('.cursor-grab').first();
    await expect(playerToken).toBeVisible({ timeout: 5000 });
    await playerToken.click();

    const liveToolbox = page.locator('#live-match-player-toolbox');
    await expect(liveToolbox).toBeVisible({ timeout: 5000 });

    // 4. Vérifier la présence du bouton But Handball (🤾 But)
    const goalBtn = liveToolbox.locator('button:has-text("But")').first();
    await expect(goalBtn).toBeVisible();

    // 5. Attribuer un But (+1 pt avec validation -> 1 - 0)
    await goalBtn.click();
    const confirmGoalBtn = page.locator('button:has-text("VALIDER LE BUT")').first();
    await expect(confirmGoalBtn).toBeVisible({ timeout: 5000 });
    await confirmGoalBtn.click({ force: true });
    await expect(page.locator('text=1 - 0').first()).toBeVisible({ timeout: 5000 });
  });
});
