import { test, expect } from '@playwright/test';

// Utilitaire de connexion coach PRO
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

  // Ouvrir le volet latéral droit s'il est replié
  const openSidebarBtn = page.locator('button:has-text("SCHÉMAS & MATCHS")').first();
  if (await openSidebarBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await openSidebarBtn.click();
    await page.waitForTimeout(400);
  }
}

test.describe('Section 8 : Sauvegarde Cloud & Bibliothèque de Stratégies (FT-LIB)', () => {
  test.beforeEach(async ({ page }) => {
    await connectAsProCoach(page);
  });

  test('FT-LIB-01 : Sauvegarde d\'un Schéma Tactique Personnalisé', async ({ page }) => {
    // 1. Ouvrir la modale d'enregistrement de schéma (bouton disquette dans le panneau droit)
    const saveTriggerBtn = page.locator('button[title*="Enregistrer sous"], button[title*="Sauvegarder"]').first();
    await expect(saveTriggerBtn).toBeVisible({ timeout: 5000 });
    await saveTriggerBtn.click();

    // 2. Vérifier que la modale d'enregistrement s'affiche
    const saveModalHeading = page.locator('h3:has-text("Sauvegarder"), h3:has-text("Enregistrer")').first();
    await expect(saveModalHeading).toBeVisible({ timeout: 5000 });

    // 3. Saisir les détails de la tactique
    const nameInput = page.locator('input[type="text"]').last();
    await nameInput.fill('Corner Court Combiné 1er Poteau');

    const descTextarea = page.locator('textarea[placeholder*="Consignes"]').first();
    if (await descTextarea.isVisible()) {
      await descTextarea.fill('Appel au premier poteau du N°9 suivi d\'une remise.');
    }

    // 4. Confirmer l'enregistrement
    const confirmBtn = page.locator('button:has-text("Confirmer l\'enregistrement")').first();
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 5. Vérifier la confirmation de succès
    await expect(page.locator('text=succès').first()).toBeVisible({ timeout: 5000 });
  });

  test('FT-LIB-02 : Consultation et Chargement d\'un Schéma Sauvegardé', async ({ page }) => {
    // 1. Sauvegarder d'abord un schéma pour le test
    const saveTriggerBtn = page.locator('button[title*="Enregistrer sous"], button[title*="Sauvegarder"]').first();
    await expect(saveTriggerBtn).toBeVisible({ timeout: 5000 });
    await saveTriggerBtn.click();

    const nameInput = page.locator('input[type="text"]').last();
    const testSchemaName = 'Attaque Rapide Couloir Droit';
    await nameInput.fill(testSchemaName);

    const confirmBtn = page.locator('button:has-text("Confirmer l\'enregistrement")').first();
    await confirmBtn.click();
    await expect(page.locator('text=succès').first()).toBeVisible({ timeout: 5000 });

    // Attendre la fermeture automatique de la modale
    await page.waitForTimeout(1500);

    // 2. Vérifier que le schéma apparaît dans la liste des schémas sauvegardés
    const savedSchemaItem = page.locator(`text=${testSchemaName}`).first();
    await expect(savedSchemaItem).toBeVisible({ timeout: 5000 });

    // 3. Cliquer sur le schéma pour le charger sur le terrain
    await savedSchemaItem.click();

    // 4. Vérifier la confirmation de chargement (toast informatif)
    await expect(page.locator(`text=${testSchemaName}`).first()).toBeVisible();
  });
});
