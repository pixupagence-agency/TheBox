import { test, expect } from '@playwright/test';
import { COACH, requireTestAccount } from './e2e-credentials';
import { login } from './helpers';

requireTestAccount();

/** Éléments mis en lumière, dans l'ordre des étapes du tutoriel */
const TARGETS = [
  'tour-top-header',
  'tour-team-panel',
  'pitch-main-viewport',
  'tour-pitch-controllers',
  'tour-view-tools',
  'tour-display-tools',
  'tour-drawing-tools',
  'tour-color-tools',
  'tour-export-actions',
  'tour-zoom-tools',
  'tour-animation-tool',
  'tour-right-sidebar',
];

test.describe('Section 20 : Tuto Coach (FT-TUTO)', () => {
  test('FT-TUTO-01 : Chaque étape met en lumière son élément, barre d\'outils détaillée groupe par groupe', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1600, height: 900 });
    await login(page, COACH);
    await page.getByTitle('Ouvrir le guide interactif et tutoriel du coach').click();

    const highlight = page.getByTestId('tour-highlight');
    for (const [i, target] of TARGETS.entries()) {
      await expect(page.getByText(new RegExp(`^Étape ${i + 1}/${TARGETS.length} •`))).toBeVisible();
      await expect(highlight).toHaveAttribute('data-target', target);
      // La zone mise en lumière (animée) finit par recouvrir l'élément visé, visible à l'écran
      await expect.poll(async () => {
        const box = await page.locator(`#${target}`).boundingBox();
        const hl = await highlight.boundingBox();
        if (!box || !hl) return 'introuvable';
        const covers = hl.x <= box.x && hl.x + hl.width >= box.x + box.width - 1 && hl.y <= box.y;
        const onScreen = box.x >= 0 && box.x + box.width <= 1600;
        return covers && onScreen ? 'ok' : `élément ${Math.round(box.x)}-${Math.round(box.x + box.width)}, surbrillance ${Math.round(hl.x)}-${Math.round(hl.x + hl.width)}`;
      }, { message: target }).toBe('ok');
      // Fiches boutons : chacune désigne un bouton présent dans le groupe, entouré au survol de la fiche
      const rows = page.locator('[data-tour-row]');
      for (const row of await rows.all()) {
        const key = await row.getAttribute('data-tour-row');
        await expect(page.locator(`#${target} [data-tour-btn="${key}"], #${target}[data-tour-btn="${key}"]`), `${target} › ${key}`).toHaveCount(1);
        await row.hover();
        await expect(page.getByTestId('tour-button-spot')).toHaveAttribute('data-button', key!);
      }
      await page.getByRole('button', { name: i === TARGETS.length - 1 ? 'FIN' : 'Suivant', exact: true }).click();
    }
    await expect(highlight).toHaveCount(0);
  });
});
