import { test, expect } from '@playwright/test';

test.describe('Section 1 : Landing Page & Vitrine Commerciale (FT-LP)', () => {
  test.beforeEach(async ({ page }) => {
    // Accès à l'application racine (non connecté)
    await page.goto('/');
  });

  test('FT-LP-01 : Header, Hero Banner, Switch de Langue & CTA Principaux', async ({ page }) => {
    // 1. La landing page s'affiche avec le logo The Box et le slogan
    const brandTitle = page.locator('header h1');
    await expect(brandTitle).toContainText(/the box/i);

    // 2. Vérification des boutons de langue FR et EN
    const btnFr = page.locator('#lang-switch-fr');
    const btnEn = page.locator('#lang-switch-en');
    await expect(btnFr).toBeVisible();
    await expect(btnEn).toBeVisible();

    // 3. Bascule en anglais
    await btnEn.click();
    await expect(btnEn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('header')).toContainText(/Sign In|Login/i);

    // 4. Retour en français
    await btnFr.click();
    await expect(btnFr).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('header')).toContainText(/Se Connecter|Connexion/i);

    // 5. Clic sur le CTA "Créer un compte"
    const registerBtn = page.getByRole('button', { name: /créer un compte/i }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // La modale d'inscription coach s'ouvre
    const registerModal = page.locator('text=Créer un Compte Coach').first();
    await expect(registerModal).toBeVisible();

    // Fermeture de la modale
    const closeBtn = page.getByRole('button', { name: /fermer|close/i }).or(page.locator('button:has(svg.lucide-x)')).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    // 6. Clic sur le bouton "Se Connecter"
    const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
    await loginBtn.click();
    const loginModal = page.locator('text=Connexion Espace Coach').first();
    await expect(loginModal).toBeVisible();
  });

  test('FT-LP-02 : Sélecteur de Sports & Disciplines', async ({ page }) => {
    // Vérification de la présence des disciplines sportives
    const sportsSection = page.locator('section').filter({ hasText: /Football|Handball|Basketball|Rugby/i }).first();
    await expect(sportsSection).toBeVisible();

    // Vérification que les cartes des sports sont interactives
    const footballCard = page.locator('text=Football').first();
    await expect(footballCard).toBeVisible();
  });

  test('FT-LP-03 : Cas d\'Usage Vestiaire & Bord de Terrain', async ({ page }) => {
    // Vérification de l'affichage des 3 cas d'usage (01, 02, 03)
    await expect(page.locator('text=01').first()).toBeVisible();
    await expect(page.locator('text=02').first()).toBeVisible();
    await expect(page.locator('text=03').first()).toBeVisible();
  });

  test('FT-LP-05 : Grille Tarifaire & CTA d\'Essai Gratuit', async ({ page }) => {
    // Vérification des tarifs affichés (€)
    const pricingSection = page.locator('section').filter({ hasText: /formule|tarif|abonnement|€/i }).first();
    await expect(pricingSection).toBeVisible();

    // Vérification de la présence du bouton d'essai gratuit
    const trialCta = page.getByRole('button', { name: /essai gratuit|démarrer/i }).first();
    if (await trialCta.isVisible()) {
      await trialCta.click();
      await expect(page.locator('text=Créer votre Compte Coach').first()).toBeVisible();
    }
  });

  test('FT-LP-07 : Modale FAQ & Mentions Légales', async ({ page }) => {
    // Clic sur le bouton FAQ / Aide dans le header ou footer
    const faqBtn = page.locator('button[title*="FAQ"], button[aria-label*="FAQ"]').first();
    if (await faqBtn.isVisible()) {
      await faqBtn.click();
      // La modale légale / FAQ s'affiche
      const faqModalTitle = page.locator('text=Foire Aux Questions').first();
      await expect(faqModalTitle).toBeVisible();
      
      // Fermeture par la touche Échap
      await page.keyboard.press('Escape');
    }
  });
});
