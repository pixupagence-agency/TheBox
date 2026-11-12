import { test, expect, Page } from '@playwright/test';
import { ADMIN, requireTestAccount } from './e2e-credentials';
import { login } from './helpers';

requireTestAccount();

/** Ouvre « Enregistrer sous », nomme le schéma et l'enregistre. Vérifie aussi que la copie en ligne n'a pas échoué. */
async function saveSchema(page: Page, name: string, notes?: string) {
  await page.getByRole('button', { name: /Enregistrer sous/ }).click();
  await expect(page.getByRole('heading', { name: 'Sauvegarder ce schéma' })).toBeVisible({ timeout: 5000 });

  const nameInput = page.locator('input[type="text"]').last();
  await nameInput.fill(name);
  if (notes) {
    await page.getByPlaceholder(/Consignes, objectifs/).fill(notes);
  }

  await page.getByRole('button', { name: 'Enregistrer', exact: true }).last().click();
  await expect(page.locator('text=sauvegardé avec succès').first()).toBeVisible({ timeout: 5000 });

  // La sauvegarde en ligne (Firestore) ne doit pas avoir échoué
  await page.waitForTimeout(2000);
  await expect(page.locator('text=La sauvegarde en ligne du schéma a échoué')).toHaveCount(0);
  await expect(page.locator('text=trop volumineux pour la sauvegarde en ligne')).toHaveCount(0);
}

test.describe('Section 8 : Sauvegarde Cloud & Bibliothèque de Stratégies (FT-LIB)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await login(page, ADMIN);
  });

  test('FT-LIB-01 : Sauvegarde d\'un Schéma Tactique Personnalisé', async ({ page }) => {
    await saveSchema(page, 'Corner Court Combiné 1er Poteau', 'Appel au premier poteau du N°9 suivi d\'une remise.');
  });

  test('FT-LIB-02 : Consultation et Chargement d\'un Schéma Sauvegardé', async ({ page }) => {
    const testSchemaName = `Attaque Rapide ${Date.now()}`;
    await saveSchema(page, testSchemaName);

    // Le schéma apparaît dans la liste des schémas du panneau droit
    const savedSchemaItem = page.getByText(testSchemaName).first();
    await expect(savedSchemaItem).toBeVisible({ timeout: 8000 });

    // On le recharge sur le terrain
    await savedSchemaItem.click();
    await expect(page.getByText(testSchemaName).first()).toBeVisible();
  });
});
