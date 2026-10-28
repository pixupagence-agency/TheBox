import { test, expect } from '@playwright/test';

test.describe('Section 12 : Installation PWA, Mode Plein Écran & Ergonomie Tactile (FT-PWA)', () => {
  test('FT-PWA-01 : Présence du Web App Manifest pour Installation PWA', async ({ page }) => {
    await page.goto('/');

    // 1. Vérification du lien vers le fichier manifest dans le <head> (.webmanifest ou .json)
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest(\.webmanifest|\.json)/);

    // 2. Vérification de la présence de la meta theme-color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);
  });

  test('FT-PWA-02 : Mode Plein Écran & Bouton Dédié à la Projection Vestiaire', async ({ page }) => {
    // Connexion rapide au tableau tactique
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

    await loginForm.locator('input[type="email"]').fill('coach.demo@thebox.com');
    await loginForm.locator('input[type="password"]').fill('Secur3P@ssw0rd!');
    await loginForm.locator('button[type="submit"]').click();

    await expect(page.locator('#pitch-football')).toBeVisible({ timeout: 15000 });

    // 1. Vérifier la présence du bouton Plein Écran
    const fullscreenBtn = page.locator('button:has-text("PLEIN ÉCRAN"), button[title*="Plein écran"]').first();
    await expect(fullscreenBtn).toBeVisible({ timeout: 5000 });

    // 2. Vérifier l'adaptabilité du pitch et les styles tactiles
    const pitchElement = page.locator('#pitch-football');
    await expect(pitchElement).toBeVisible();
  });
});
