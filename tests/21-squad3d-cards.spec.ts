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

  test('FT-3D-02 : On tourne autour du terrain, les cartes suivent et restent déplaçables', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1600, height: 1000 });
    await login(page, COACH);
    await openSquad3D(page);
    const camera = page.getByTestId('squad3d-camera');
    const id = (await page.locator('[data-squad3d-card]').first().getAttribute('data-squad3d-card'))!;
    const before = await center(page, id);

    // Rotation au curseur : la carte change de place à l'écran, « Vue de face » apparaît
    await camera.getByLabel('Rotation autour du terrain').fill('60');
    await expect(camera).toContainText('60°');
    await expect.poll(async () => {
      const c = await center(page, id);
      return Math.hypot(c.x - before.x, c.y - before.y);
    }).toBeGreaterThan(30);
    await expect(camera.getByRole('button', { name: /Vue de face/ })).toBeVisible();

    // Vue tournée : la carte glissée suit toujours le pointeur (carte non recouverte par une voisine)
    await page.waitForTimeout(400);
    const free = await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-squad3d-card]'))) {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (hit && el.contains(hit)) return el.dataset.squad3dCard!;
      }
      return null;
    });
    expect(free).not.toBeNull();
    const start = await center(page, free!);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x - 50, start.y + 35, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => {
      const c = await center(page, free!);
      return Math.hypot(c.x - (start.x - 50), c.y - (start.y + 35));
    }).toBeLessThan(10);
    await expect(camera).toContainText('60°'); // la caméra n'a pas bougé pendant le déplacement de la carte

    // Glisser le fond de la scène tourne autour du terrain et l'incline
    const scene = (await page.getByTestId('squad3d-scene').boundingBox())!;
    await page.mouse.move(scene.x + 20, scene.y + 20);
    await page.mouse.down();
    await page.mouse.move(scene.x + 120, scene.y + 60, { steps: 6 });
    await page.mouse.up();
    await expect(camera).toContainText('100°');

    // Export de la vue tournée
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger PNG HD' }).first().click();
    const file = await download;
    if (process.env.SHOT_DIR) await file.saveAs(`${process.env.SHOT_DIR}/squad3d-rotated.png`);

    // Noms jamais recouverts par la pelouse, même en vue rasante, en mode Têtes comme en mode Cartes
    for (const mode of [/Têtes 3D/, /Cartes 3D/]) {
      await page.getByRole('button', { name: mode }).first().click();
      await camera.getByLabel(/Inclinaison de la caméra/).fill('70');
      await page.waitForTimeout(500);
      const hidden = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('[data-squad3d-name]')).filter((el) => {
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * 0.75);
          return !hit?.closest('[data-squad3d-card]');
        }).length
      );
      expect(hidden, `noms recouverts (${mode})`).toBe(0);
    }

    // Retour à la vue de face
    await camera.getByRole('button', { name: /Vue de face/ }).click();
    await expect(camera).toContainText('0°');
    await expect(camera.getByRole('button', { name: /Vue de face/ })).toHaveCount(0);
  });
});
