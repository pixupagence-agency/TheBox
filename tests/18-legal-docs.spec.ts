import { test, expect, type Page } from '@playwright/test';
import { ADMIN, requireTestAccount } from './e2e-credentials';
import { login, openUserMenuItem } from './helpers';

requireTestAccount();

/** Ouvre la fenêtre « Aide & informations » depuis le pied de page de l'accueil, sur un document */
async function openFromFooter(page: Page, label: RegExp) {
  await page.goto('/');
  const link = page.locator('footer').getByRole('button', { name: label });
  await link.scrollIntoViewIfNeeded();
  await link.click();
}

test.describe('Section 18 : Documents légaux (FT-LEG)', () => {
  test('FT-LEG-01 : Les 5 documents légaux sont consultables depuis l\'accueil', async ({ page }) => {
    await openFromFooter(page, /^Mentions légales$/);

    // Texte par défaut (jamais publié), informations à compléter surlignées
    const mentions = page.getByTestId('legal-doc-mentions');
    await expect(mentions).toBeVisible({ timeout: 15000 });
    await expect(mentions).toContainText('Version initiale');
    await expect(mentions.getByRole('heading', { name: /Directeur de la publication/ })).toBeVisible();
    await expect(mentions.locator('mark').first()).toContainText('À COMPLÉTER');

    // Chaque rubrique s'ouvre (barre latérale sur grand écran, onglets sur mobile)
    for (const [label, id, heading] of [
      [/Conditions d'utilisation|^CGU$/, 'cgu', /Objet et présentation du service/],
      [/Conditions de vente|^CGV$/, 'cgv', /Droit de rétractation/],
      [/^Confidentialité$/, 'privacy', /Durées de conservation/],
      [/Sous-traitance des données|^DPA$/, 'dpa', /Sous-traitants ultérieurs/],
    ] as const) {
      await page.getByRole('dialog', { name: 'Aide & informations' }).getByRole('button', { name: label }).filter({ visible: true }).first().click();
      await expect(page.getByTestId(`legal-doc-${id}`).getByRole('heading', { name: heading })).toBeVisible({ timeout: 15000 });
    }
  });

  test('FT-LEG-02 : L\'admin modifie et publie un document, visible ensuite par tous', async ({ page, browser }) => {
    test.setTimeout(120000);
    await login(page, ADMIN);
    await openUserMenuItem(page, /Console Admin Plateforme/);
    await page.getByRole('button', { name: /^Documents légaux/ }).filter({ visible: true }).first().click();
    const editor = page.getByTestId('legal-docs-editor');
    await expect(editor).toBeVisible();

    // Document CGU : nouveau titre pour la première section, et une section ajoutée
    await editor.getByRole('tab', { name: /Conditions d'utilisation/ }).click();
    await expect(editor.getByText(/Texte par défaut de The Box, jamais publié/)).toBeVisible({ timeout: 15000 });
    await editor.getByLabel('Titre de la section 1').fill('Éditeur du service (test e2e)');
    await editor.getByRole('button', { name: 'Ajouter une section' }).click();
    const count = await editor.getByTestId('legal-section').count();
    await editor.getByLabel(`Titre de la section ${count}`).fill('Section ajoutée');
    await editor.getByLabel(`Texte de la section ${count}`).fill('Texte avec **gras**.\n\n- premier point\n- second point');
    await expect(editor.getByText('● Modifications non publiées')).toBeVisible();

    // Aperçu : mise en forme appliquée
    await editor.getByRole('button', { name: 'Aperçu' }).click();
    await expect(editor.locator('strong', { hasText: 'gras' })).toBeVisible();
    await expect(editor.getByText('second point')).toBeVisible();

    // Publication (confirmation)
    await editor.getByRole('button', { name: 'Publier' }).click();
    await page.getByRole('button', { name: 'Publier' }).last().click();
    await expect(editor.getByText('Version 1 publiée.')).toBeVisible({ timeout: 15000 });
    await expect(editor.getByText(/Version 1 publiée le/)).toBeVisible();

    // Un visiteur (navigateur sans compte) voit la nouvelle version
    const visitor = await browser.newPage();
    await openFromFooter(visitor, /^CGU$/);
    const cgu = visitor.getByTestId('legal-doc-cgu');
    await expect(cgu.getByRole('heading', { name: /Éditeur du service \(test e2e\)/ })).toBeVisible({ timeout: 15000 });
    await expect(cgu.getByRole('heading', { name: /Section ajoutée/ })).toBeVisible();
    await expect(cgu).toContainText('version 1');
    await visitor.close();
  });
});
