import { test, expect } from '@playwright/test';

test.describe('Section 2 : Authentification, Onboarding & Profil Coach (FT-AUTH)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('FT-AUTH-01 : Validation du formulaire d\'inscription Coach', async ({ page }) => {
    // 1. Ouvrir la modale d'inscription
    const registerBtn = page.getByRole('button', { name: /créer un compte/i }).first();
    await registerBtn.click();
    await expect(page.locator('text=Créer un Compte Coach').first()).toBeVisible();

    // 2. Remplir les champs avec un mot de passe court (< 6 caractères)
    await page.fill('input[placeholder="Jean"]', 'TestPrénom');
    await page.fill('input[placeholder="Dupont"]', 'TestNom');
    await page.fill('input[placeholder*="The Box FC"]', 'TestClub FC');
    await page.fill('input[placeholder="coach@monclub.com"]', 'test-court@thebox-test.com');
    await page.fill('input[placeholder="Min. 6 caractères"]', '123'); // Trop court
    await page.fill('input[placeholder="Répétez le mot de passe"]', '123');

    // 3. Soumettre le formulaire
    const submitBtn = page.getByRole('button', { name: /créer mon compte/i }).first();
    await submitBtn.click();

    // Vérification : le mot de passe court doit empêcher la validation (min 6 caractères)
    // Le formulaire ne doit pas avoir validé et la modale reste ouverte
    await expect(page.locator('text=Créer un Compte Coach').first()).toBeVisible();
  });

  test('FT-AUTH-02 : Modale de connexion & champs requis', async ({ page }) => {
    // 1. Ouvrir la modale de connexion
    const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
    await loginBtn.click();

    // 2. Vérifier que la modale s'affiche avec les champs Email et Mot de passe
    await expect(page.locator('text=Connexion Espace Coach').first()).toBeVisible();
    const loginForm = page.locator('form').filter({ hasText: /OU AVEC IDENTIFIANTS/i });
    await expect(loginForm.locator('input[type="email"]')).toBeVisible();
    await expect(loginForm.locator('input[type="password"]')).toBeVisible();

    // 3. Fermer la modale
    await page.locator('button[title="Fermer"]').click();
    await expect(page.locator('text=Connexion Espace Coach')).not.toBeVisible();
  });
});
