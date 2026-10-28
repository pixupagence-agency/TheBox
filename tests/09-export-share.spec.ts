import { test, expect } from '@playwright/test';

async function connectToTacticsBoard(page: any) {
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

  const openSidebarBtn = page.locator('button:has-text("SCHÉMAS & MATCHS")').first();
  if (await openSidebarBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await openSidebarBtn.click();
    await page.waitForTimeout(400);
  }
}

test.describe('Section 9 : Export Haute Définition, Impression & Partage (FT-SHARE)', () => {
  test.beforeEach(async ({ page }) => {
    await connectToTacticsBoard(page);
  });

  test('FT-SHARE-01 : Export Image PNG du Terrain Tactique', async ({ page }) => {
    // 1. Bouton d'export PNG direct dans la barre d'outils gauche
    const pngExportBtn = page.locator('button:has-text("PNG")').first();
    await expect(pngExportBtn).toBeVisible({ timeout: 5000 });

    // 2. Intercepter le téléchargement du fichier PNG
    const downloadPromise = page.waitForEvent('download');
    await pngExportBtn.click();
    const download = await downloadPromise;

    // 3. Vérifier que le fichier téléchargé est bien un PNG
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });

  test('FT-SHARE-02 : Ouverture de la Modale de Partage & Options WhatsApp / Email', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // 1. Ouvrir la modale de partage depuis le volet droit (icône Partager)
    const shareTriggerBtn = page.locator('button[title*="Partager le schéma actuel"], button[title*="Partager"]').first();
    await expect(shareTriggerBtn).toBeVisible({ timeout: 5000 });
    await shareTriggerBtn.click();

    // 2. Vérifier que la modale de partage est affichée
    await expect(page.locator('text=Partager le Briefing Tactique').first()).toBeVisible({ timeout: 5000 });
    const whatsappBtn = page.locator('button:has-text("Partager sur WhatsApp")').first();
    const emailBtn = page.locator('button:has-text("E-mail")').first();
    const copyTextBtn = page.locator('button:has-text("Copier le texte du message")').first();

    await expect(whatsappBtn).toBeVisible({ timeout: 5000 });
    await expect(emailBtn).toBeVisible({ timeout: 5000 });
    await expect(copyTextBtn).toBeVisible({ timeout: 5000 });

    // 3. Tester la copie du texte du briefing
    await copyTextBtn.click();
    await expect(page.locator('button').filter({ hasText: /copié/i }).first()).toBeVisible({ timeout: 5000 });

    // 4. Fermer la modale
    const closeBtn = page.locator('button:has-text("Fermer")').last();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
