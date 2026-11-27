import { test, expect, type Page } from '@playwright/test';
import { COACH, requireTestAccount } from './e2e-credentials';
import { login } from './helpers';

requireTestAccount();

async function openSquad3D(page: Page) {
  await page.getByRole('button', { name: 'Vue Carte 3D' }).first().click();
  await expect(page.getByText('VUE EXPORT 3D')).toBeVisible({ timeout: 10000 });
}

const center = async (page: Page, id: string) => {
  const b = (await page.locator(`[data-squad3d-card="${id}"]`).boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

test.describe('Section 21 : Vue Export 3D (FT-3D)', () => {
  test('FT-3D-01 : Les cartes se déplacent dans la vue 3D, sans changer le terrain tactique', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1600, height: 1000 });
    await login(page, COACH);
    await openSquad3D(page);

    const placement = page.getByTestId('squad3d-placement');
    await expect(placement).toContainText('Glissez les cartes pour les placer');
    const first = page.locator('[data-squad3d-card]').first();
    const id = (await first.getAttribute('data-squad3d-card'))!;
    const before = await center(page, id);

    // Glisser-déposer à la souris
    await page.mouse.move(before.x, before.y);
    await page.mouse.down();
    await page.mouse.move(before.x + 60, before.y + 40, { steps: 8 });
    await page.mouse.up();
    const after = await center(page, id);
    expect(Math.abs(after.x - (before.x + 60))).toBeLessThan(8);
    expect(Math.abs(after.y - (before.y + 40))).toBeLessThan(8);
    await expect(placement).toContainText('1 carte déplacée');

    // Clavier : flèche droite avec Maj (5 %)
    await page.locator(`[data-squad3d-card="${id}"]`).focus();
    await page.keyboard.press('Shift+ArrowRight');
    await expect.poll(async () => (await center(page, id)).x - after.x).toBeGreaterThan(10);

    // L'export PNG fonctionne avec une carte déplacée
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger PNG HD' }).first().click();
    expect((await download).suggestedFilename()).toMatch(/^squad_3d_.*\.png$/);

    // Replacer : la carte revient à la position du joueur sur le terrain
    await placement.getByRole('button', { name: /Replacer/ }).click();
    await expect(placement).toContainText('Glissez les cartes pour les placer');
    await expect.poll(async () => {
      const c = await center(page, id);
      return Math.abs(c.x - before.x) < 2 && Math.abs(c.y - before.y) < 2;
    }).toBe(true);

    // Le terrain tactique n'a pas bougé : rouvrir la vue redonne la même position
    await page.getByRole('button', { name: 'Fermer', exact: true }).last().click();
    await openSquad3D(page);
    const reopened = await center(page, id);
    expect(Math.abs(reopened.x - before.x)).toBeLessThan(2);
  });
});
