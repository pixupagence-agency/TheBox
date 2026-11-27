import { test, expect, type Page } from '@playwright/test';
import { ADMIN, COACH, requireTestAccount } from './e2e-credentials';
import { login, openUserMenuItem } from './helpers';

requireTestAccount();

/** Ouvre la console sur un onglet (le compte admin est déjà connecté) */
async function openAdmin(page: Page, tab?: string) {
  await page.goto(tab ? `/admin?tab=${tab}` : '/admin');
  await expect(page.getByRole('navigation', { name: 'Rubriques de la console' })).toBeVisible({ timeout: 45000 });
}

/** Valide la fenêtre de confirmation */
async function confirm(page: Page, label: string) {
  await page.getByRole('button', { name: label, exact: true }).last().click();
}

test.describe('Section 19 : Page d\'administration /admin (FT-ADM)', () => {
  test('FT-ADM-04 : La console est réservée aux super admins', async ({ page }) => {
    // Visiteur sans compte
    await page.goto('/admin');
    await expect(page.getByTestId('admin-denied')).toBeVisible({ timeout: 45000 });
    await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();

    // Coach connecté, non administrateur
    await login(page, COACH);
    await page.goto('/admin');
    const denied = page.getByTestId('admin-denied');
    await expect(denied).toBeVisible({ timeout: 45000 });
    await expect(denied).toContainText(COACH.email);
    await expect(page.getByRole('navigation', { name: 'Rubriques de la console' })).toHaveCount(0);
  });

  test.describe('Compte super admin', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1600, height: 900 });
      await login(page, ADMIN);
    });

    test('FT-ADM-05 : Tableau de bord et indicateurs', async ({ page }) => {
      await openAdmin(page);
      const dashboard = page.getByTestId('admin-dashboard');
      await expect(page.getByRole('heading', { name: 'Tableau de bord', level: 2 })).toBeVisible();
      // Le coach de test est compté, le compte administrateur est exclu
      const total = dashboard.getByTestId('kpi-value').first(); // « Coachs inscrits », premier indicateur
      await expect(total).toHaveText('1', { timeout: 20000 });
      await expect(dashboard.getByText('Essais en cours')).toBeVisible();
      await expect(dashboard.getByRole('region', { name: 'Inscriptions par semaine' })).toBeVisible();
      // État des contenus : lien vers l'édition
      const contents = dashboard.getByRole('region', { name: 'Contenus publiés' });
      await expect(contents.getByText('FAQ', { exact: true })).toBeVisible();
      await contents.getByRole('button', { name: /^FAQ/ }).click();
      await expect(page.getByRole('heading', { name: 'Foire aux questions', level: 2 })).toBeVisible();
      await expect(page).toHaveURL(/\/admin\?tab=faq$/);
    });

    test('FT-ADM-06 : FAQ modifiée et publiée, visible par les visiteurs', async ({ page, browser }) => {
      test.setTimeout(120000);
      await openAdmin(page, 'faq');
      const editor = page.getByTestId('faq-editor');
      await expect(editor).toBeVisible({ timeout: 15000 });
      await editor.getByLabel('Question 1', { exact: true }).fill('Question modifiée par le test e2e ?');
      await editor.getByRole('button', { name: 'Publier' }).click();
      await confirm(page, 'Publier');
      await expect(editor.getByText('FAQ publiée.')).toBeVisible({ timeout: 15000 });

      const visitor = await browser.newPage();
      await visitor.goto('/');
      await visitor.getByRole('button', { name: 'FAQ & Aide' }).first().click();
      await expect(visitor.getByText('Question modifiée par le test e2e ?')).toBeVisible({ timeout: 15000 });
      await visitor.close();
    });

    test('FT-ADM-07 : Guide modifié et publié, visible par les coachs', async ({ page, browser }) => {
      test.setTimeout(180000);
      await openAdmin(page, 'guide');
      const title = page.getByLabel("Titre de l'article");
      await expect(title).toBeVisible({ timeout: 15000 });
      await title.fill('Prise en main (test e2e)');
      await page.getByRole('button', { name: 'Publier le guide' }).click();
      await confirm(page, 'Publier');
      await expect(page.getByText('Guide publié : tous les coachs voient cette version.')).toBeVisible({ timeout: 15000 });

      const coachPage = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
      await login(coachPage, COACH);
      await openUserMenuItem(coachPage, /Guide d'Utilisation/);
      await expect(coachPage.getByRole('heading', { name: 'Prise en main (test e2e)', level: 2 })).toBeVisible({ timeout: 15000 });
      await coachPage.context().close();
    });

    test('FT-ADM-08 : Accès aux sports enregistré pour toute la plateforme', async ({ page }) => {
      await openAdmin(page, 'sports');
      const rugby = page.getByRole('switch', { name: 'Accès public à Rugby' });
      await expect(rugby).toHaveAttribute('aria-checked', 'false', { timeout: 15000 });
      await rugby.click();
      await expect(rugby).toHaveAttribute('aria-checked', 'true');

      // Rien n'est gardé sur l'appareil : l'état relu après rechargement vient de la base
      await page.evaluate(() => {
        localStorage.removeItem('thebox_blocked_sports');
        localStorage.removeItem('thebox_sports_config');
      });
      await openAdmin(page, 'sports');
      await expect(page.getByRole('switch', { name: 'Accès public à Rugby' })).toHaveAttribute('aria-checked', 'true', { timeout: 15000 });

      // Remise en état
      await page.getByRole('switch', { name: 'Accès public à Rugby' }).click();
      await expect(page.getByRole('switch', { name: 'Accès public à Rugby' })).toHaveAttribute('aria-checked', 'false');
      await openAdmin(page, 'sports');
      await expect(page.getByRole('switch', { name: 'Accès public à Rugby' })).toHaveAttribute('aria-checked', 'false', { timeout: 15000 });
    });
  });
});
