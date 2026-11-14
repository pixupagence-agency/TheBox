import { test, expect, Page } from '@playwright/test';
import { COACH, requireTestAccount } from './e2e-credentials';
import { login } from './helpers';

requireTestAccount();

const DRAFT_KEY = 'thebox_training_draft_v1';

/** Éléments du brouillon enregistré sur l'appareil */
async function draftElements(page: Page): Promise<Array<{ kind: string; x: number; y: number }>> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{"elements":[]}').elements, DRAFT_KEY);
}

async function openTraining(page: Page) {
  await login(page, COACH);
  await page.evaluate((key) => localStorage.removeItem(key), DRAFT_KEY);
  await page.goto('/training');
  await expect(page.getByTestId('training-canvas').locator('canvas').first()).toBeVisible({ timeout: 60000 });
}

test.describe('Section 13 : Module Training — éditeur 2D (FT-TRN)', () => {
  test.beforeEach(async ({ page }) => {
    await openTraining(page);
  });

  test('FT-TRN-01 : Poser du matériel, annuler et rétablir', async ({ page }) => {
    const canvas = page.getByTestId('training-canvas');
    const box = (await canvas.boundingBox())!;
    await page.getByRole('button', { name: 'Coupelle jaune', exact: true }).click();
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4);
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.4);
    await expect.poll(async () => (await draftElements(page)).length).toBe(2);

    await page.getByRole('button', { name: 'Annuler', exact: true }).click();
    await expect.poll(async () => (await draftElements(page)).length).toBe(1);
    await page.getByRole('button', { name: 'Rétablir' }).click();
    await expect.poll(async () => (await draftElements(page)).length).toBe(2);
  });

  test('FT-TRN-02 : Outil série — 6 piquets espacés de 1,5 m', async ({ page }) => {
    await page.getByRole('button', { name: 'Poser une série' }).click();
    await expect(page.getByText(/6 piquets espacés de 1,5 m/)).toBeVisible();
    await page.getByRole('button', { name: 'Poser au centre de la vue' }).click();
    await expect.poll(async () => (await draftElements(page)).filter((e) => e.kind === 'pole').length).toBe(6);
    const poles = (await draftElements(page)).filter((e) => e.kind === 'pole').sort((a, b) => a.x - b.x);
    expect(poles[1].x - poles[0].x).toBeCloseTo(1.5, 1);
    await expect(page.getByText('6 éléments sélectionnés')).toBeVisible();
  });

  test('FT-TRN-03 : Formats de terrain et zone libre', async ({ page }) => {
    await page.getByRole('button', { name: /Foot à 5/ }).click();
    await expect(page.getByText('Foot à 5').first()).toBeVisible();
    // La zone libre reprend les dimensions du terrain affiché, puis se règle au mètre près
    await page.getByRole('button', { name: /Zone libre/ }).click();
    await expect(page.getByText(/Zone libre · 40 × 20 m/)).toBeVisible();
    await page.getByRole('button', { name: 'Augmenter' }).first().click();
    await expect(page.getByText(/Zone libre · 41 × 20 m/)).toBeVisible();
  });
});
