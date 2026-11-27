import { test, expect } from '@playwright/test';
import { ADMIN, requireTestAccount } from './e2e-credentials';
import { login, openUserMenuItem } from './helpers';

requireTestAccount();

test.describe('Section 11 : Support Coach, Guide & Administration Plateforme (FT-ADM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await login(page, ADMIN);
  });

  test('FT-ADM-01 : Modale du Guide d\'Utilisation (UserGuideModal)', async ({ page }) => {
    // 1. Menu profil > Guide d'Utilisation
    await openUserMenuItem(page, /Guide d'Utilisation/);

    // 2. Le guide s'ouvre sur sa première section, avec la recherche et le sommaire
    await expect(page.getByRole('heading', { name: 'Prise en main & Compte Coach', level: 2 })).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder(/Rechercher \(pressing/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Mode Live Match/ }).first()).toBeVisible();

    // 3. Fermeture
    await page.getByRole('button', { name: 'Fermer le guide' }).click();
    await expect(page.getByRole('heading', { name: 'Prise en main & Compte Coach', level: 2 })).not.toBeVisible();
  });

  test('FT-ADM-03 : Console d\'administration (page /admin)', async ({ page }) => {
    // 1. Menu profil > Console Admin Plateforme : ouvre la page /admin sur le tableau de bord
    await openUserMenuItem(page, /Console Admin Plateforme/);
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: 'Tableau de bord', level: 2 })).toBeVisible({ timeout: 30000 });

    // 2. Onglet de gestion des accès aux sports (adresse mise à jour)
    await page.getByRole('button', { name: /^Accès aux sports/ }).filter({ visible: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Accès aux sports', level: 2 })).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/admin\?tab=sports$/);

    // 3. Retour à l'application
    await page.getByRole('button', { name: /Retour à l'application/ }).click();
    await expect(page.locator('#pitch-football')).toBeVisible({ timeout: 45000 });
  });
});
