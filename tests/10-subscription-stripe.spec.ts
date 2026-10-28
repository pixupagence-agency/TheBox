import { test, expect } from '@playwright/test';

// Connexion en coach standard avec période d'essai active (14 jours)
async function connectAsStandardCoach(page: any) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.addInitScript(() => {
    localStorage.removeItem('thebox_admin_mode');
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

  await loginForm.locator('input[type="email"]').fill('coach.demo@thebox.com');
  await loginForm.locator('input[type="password"]').fill('Secur3P@ssw0rd!');
  await loginForm.locator('button[type="submit"]').click();

  await expect(page.locator('#pitch-football')).toBeVisible({ timeout: 15000 });
}

test.describe('Section 10 : Abonnements, Période d\'Essai & Paiement Stripe (FT-SUB)', () => {
  test.beforeEach(async ({ page }) => {
    await connectAsStandardCoach(page);
  });

  test('FT-SUB-01 : Badge de Décompte d\'Essai & Modale TrialCountdownModal', async ({ page }) => {
    // 1. Repérer le badge du compte à rebours d'essai dans le header
    const trialBadge = page.locator('button[title*="Période d\'essai"], button:has-text("Démo Pro")').first();
    await expect(trialBadge).toBeVisible({ timeout: 5000 });

    // 2. Cliquer sur le badge pour ouvrir la modale TrialCountdownModal
    await trialBadge.click();

    // 3. Vérifier les informations de la modale d'essai
    const trialModalHeading = page.locator('text=Période d\'Essai Pro').first();
    await expect(trialModalHeading).toBeVisible({ timeout: 5000 });

    // 4. Fermer la modale
    const closeBtn = page.locator('button:has-text("Continuer mon entraînement"), button:has(svg.lucide-x)').last();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('FT-SUB-02 : Consultation des Offres et Plans d\'Abonnement PRO & PRO+', async ({ page }) => {
    // 1. Ouvrir la modale d'essai
    const trialBadge = page.locator('button[title*="Période d\'essai"], button:has-text("Démo Pro")').first();
    await expect(trialBadge).toBeVisible({ timeout: 5000 });
    await trialBadge.click();

    // 2. Cliquer sur le CTA vers les offres Pro (intercepter la boîte de dialogue d'information)
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    const choosePlanBtn = page.locator('button:has-text("Découvrir les Offres Pro")').first();
    await expect(choosePlanBtn).toBeVisible({ timeout: 5000 });
    await choosePlanBtn.click();

    // 3. Cliquer sur le badge Formule PRO dans le header pour ouvrir la modale d'abonnements
    const proBadge = page.locator('button:has-text("Formule PRO")').first();
    await expect(proBadge).toBeVisible({ timeout: 5000 });
    await proBadge.click();

    // 4. Vérification de l'ouverture de la modale d'abonnements
    await expect(page.locator('text=ABONNEMENTS & FORMULES THE BOX').first()).toBeVisible({ timeout: 5000 });
  });
});
