import { test, expect } from '@playwright/test';
import { ADMIN, COACH, requireTestAccount } from './e2e-credentials';
import { login } from './helpers';

requireTestAccount();

// Ces tests demandent un coach standard en période d'essai : un compte admin n'a ni décompte ni offres à souscrire.
test.skip(
  COACH.email === ADMIN.email,
  'E2E_EMAIL doit être un compte coach non admin (distinct de E2E_ADMIN_EMAIL)'
);

test.describe('Section 10 : Abonnements, Période d\'Essai & Paiement Stripe (FT-SUB)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await login(page, COACH);
  });

  test('FT-SUB-01 : Badge de Décompte d\'Essai & Modale TrialCountdownModal', async ({ page }) => {
    // 1. Badge « Démo Pro : 13j 23h… » dans l'en-tête
    const trialBadge = page.locator('button:has-text("Démo Pro")').first();
    await expect(trialBadge).toBeVisible({ timeout: 5000 });
    await trialBadge.click();

    // 2. Modale de période d'essai
    await expect(page.getByRole('heading', { name: "Période d'Essai Pro" })).toBeVisible({ timeout: 5000 });

    // 3. Fermeture
    await page.getByRole('button', { name: /Continuer mon entraînement|Commencer à utiliser THE BOX/ }).click();
    await expect(page.getByRole('heading', { name: "Période d'Essai Pro" })).not.toBeVisible();
  });

  test('FT-SUB-02 : Consultation des Offres et Plans d\'Abonnement PRO & PRO+', async ({ page }) => {
    // 1. Ouvrir la modale d'essai
    await page.locator('button:has-text("Démo Pro")').first().click();

    // 2. « Découvrir les Offres Pro » ouvre les formules
    const choosePlanBtn = page.getByRole('button', { name: /Découvrir les Offres Pro/ });
    await expect(choosePlanBtn).toBeVisible({ timeout: 5000 });
    await choosePlanBtn.click();

    // 3. Les deux formules sont proposées
    await expect(page.getByText(/Abonnements & (Licences Club|Formules The Box)/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Formule PRO', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Formule PRO+', { exact: true }).first()).toBeVisible();
  });
});
