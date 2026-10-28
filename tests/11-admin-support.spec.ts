import { test, expect } from '@playwright/test';

async function connectAsAdmin(page: any) {
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
}

test.describe('Section 11 : Support Coach, Guide & Administration Plateforme (FT-ADM)', () => {
  test.beforeEach(async ({ page }) => {
    await connectAsAdmin(page);
  });

  test('FT-ADM-01 : Modale du Guide d\'Utilisation Officiel (UserGuideModal)', async ({ page }) => {
    // 1. Ouvrir le menu utilisateur en haut à droite
    const userMenuBtn = page.locator('button').filter({ hasText: 'Coach Principal' }).first();
    await expect(userMenuBtn).toBeVisible({ timeout: 5000 });
    await userMenuBtn.click();

    // 2. Cliquer sur "Guide d'Utilisation"
    const guideItem = page.locator('button').filter({ hasText: "Guide d'Utilisation" }).first();
    await expect(guideItem).toBeVisible({ timeout: 5000 });
    await guideItem.click();

    // 3. Vérifier que la modale du Guide s'affiche avec son titre officiel
    const guideModalHeading = page.locator('h2:has-text("Guide d\'Utilisation Officiel")').first();
    await expect(guideModalHeading).toBeVisible({ timeout: 5000 });

    // 4. Fermer la modale
    const closeBtn = page.locator('button[title="Fermer le guide"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('FT-ADM-03 : Plateforme d\'Administration (AdminPlatform & Gestion des Sports)', async ({ page }) => {
    // 1. Cliquer sur le bouton Coach Principal / Admin Plateforme pour ouvrir le menu déroulant
    const userMenuTrigger = page.locator('button:visible').filter({ hasText: 'ADMIN PLATEFORME' }).first();
    await expect(userMenuTrigger).toBeVisible({ timeout: 5000 });
    await userMenuTrigger.click();

    // 2. Cliquer sur "Console Admin Plateforme" dans le menu déroulant
    const adminConsoleItem = page.locator('button:has-text("Console Admin Plateforme")').first();
    await expect(adminConsoleItem).toBeVisible({ timeout: 5000 });
    await adminConsoleItem.click();

    // 3. Vérifier que la console d'administration s'affiche
    const adminTitle = page.locator('h2:has-text("Console Administrateur")').first();
    await expect(adminTitle).toBeVisible({ timeout: 5000 });

    // 4. Vérifier la présence des contrôles de gestion des sports
    await expect(page.locator('text=GESTION DES ACCÈS SPORTS').first()).toBeVisible({ timeout: 5000 });

    // 5. Fermer la console d'administration
    const closeBtn = page.locator('button:has-text("Fermer la Console Admin")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
