import { test, expect } from '@playwright/test';

test.describe('Section 1 : Landing Page TheBox FC (FT-LP)', () => {
  test.beforeEach(async ({ page }) => {
    // Accès à l'application racine (non connecté)
    await page.goto('/');
  });

  test('FT-LP-01 : En-tête TheBox FC, hero et boutons de connexion / inscription', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header).toContainText(/thebox fc/i);
    await expect(page.locator('h1')).toContainText('Préparer, entraîner, analyser, convoquer.');
    await expect(page.locator('video')).toHaveAttribute('src', '/landing/hero-video.mp4');

    // Essai gratuit : la modale d'inscription coach s'ouvre
    await header.getByRole('button', { name: /Essai gratuit 14 jours/ }).click();
    await expect(page.locator('text=Créer un Compte Coach').first()).toBeVisible();
    await page.keyboard.press('Escape');
    const closeBtn = page.getByRole('button', { name: /fermer|close/i }).first();
    if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();

    // Se connecter : la modale de connexion s'ouvre
    await page.getByRole('button', { name: /Se Connecter/i }).first().click();
    await expect(page.locator('text=Connexion Espace Coach').first()).toBeVisible();
  });

  test('FT-LP-02 : Les cinq modules et le Pack Staff', async ({ page }) => {
    const modules = page.locator('#modules');
    for (const id of ['tactic', 'training', 'recording', 'convocations', 'live', 'pack']) {
      await expect(modules.locator(`[data-module="${id}"]`)).toHaveCount(1);
    }
    await expect(modules.locator('[data-module="training"]')).toContainText('+ 7,90 € / mois');
    await expect(modules.locator('[data-module="recording"]')).toContainText('+ 9,90 € / mois');
    await expect(modules.locator('[data-module="pack"]')).toContainText('29,90 €');
    await expect(modules.locator('[data-module="pack"]')).toContainText('2,80 € économisés chaque mois');

    // Les flèches font défiler la rangée des modules
    const track = page.locator('#fc-track-modules');
    const before = await track.evaluate((el) => el.scrollLeft);
    await page.getByRole('button', { name: 'Modules suivants' }).click();
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
  });

  test('FT-LP-03 : La semaine du coach en cinq moments', async ({ page }) => {
    const week = page.locator('#fc-track-week > li');
    await expect(week).toHaveCount(5);
    await expect(week.first()).toContainText('LUNDI – MERCREDI');
    await expect(week.last()).toContainText('DIMANCHE');
  });

  test('FT-LP-05 : Grille tarifaire, facturation annuelle et calculateur', async ({ page }) => {
    const pricing = page.locator('#tarifs');
    await expect(pricing.locator('[data-plan="pro"]')).toContainText('9,90 €');
    await expect(pricing.locator('[data-plan="plus"]')).toContainText('14,90 €');
    await expect(pricing.locator('[data-plan="pack"]')).toContainText('29,90 €');

    // Annuel : 2 mois offerts
    await pricing.getByRole('button', { name: /Annuel/ }).click();
    await expect(pricing.getByRole('button', { name: /Annuel/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(pricing.locator('[data-plan="pack"]')).toContainText('Facturé 299 € par an');
    await expect(pricing.locator('[data-plan="pro"]')).toContainText('Facturé 99 € par an');
    await pricing.getByRole('button', { name: 'Mensuel' }).click();

    // Calculateur : PRO+ et Training par défaut
    const calc = page.getByTestId('landing-calculator');
    const total = page.getByTestId('landing-total');
    await expect(total).toContainText('22,80 €');
    // Avec Recording : le Pack Staff s'applique
    await calc.getByLabel(/Module Recording/).check();
    await expect(total).toContainText('29,90 €');
    await expect(calc).toContainText('Pack Staff appliqué : 2,80 € économisés par mois.');
    // Base PRO avec les deux options : 27,70 €, le Pack ajoute Live pour 2,20 €
    await calc.getByRole('button', { name: /PRO · Tactic/ }).click();
    await expect(total).toContainText('27,70 €');
    await expect(calc).toContainText('Pour 2,20 € de plus par mois, le Pack Staff ajoute le module Live.');

    // Un bouton d'offre ouvre l'inscription (essai de 14 jours)
    await pricing.locator('[data-plan="pack"]').getByRole('button', { name: 'Choisir le Pack Staff' }).click();
    await expect(page.locator('text=Créer un Compte Coach').first()).toBeVisible();
  });

  test('FT-LP-07 : FAQ des modules et FAQ complète', async ({ page }) => {
    const faq = page.locator('#faq');
    await expect(faq.locator('details')).toHaveCount(4);
    await faq.getByText('Que comprend le Pack Staff ?').click();
    await expect(faq).toContainText('29,90 € par mois au lieu de 32,70 €');

    await page.getByRole('button', { name: 'Ouvrir la FAQ complète' }).click();
    await expect(page.locator('text=Foire Aux Questions').first()).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
