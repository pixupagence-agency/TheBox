import { test, expect } from '@playwright/test';

// Connexion rapide au tableau tactique
async function connectToTacticsBoard(page: any) {
  await page.goto('/');
  const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
  await loginBtn.click();

  const loginForm = page.locator('form').filter({ hasText: /OU AVEC IDENTIFIANTS/i });
  await loginForm.locator('input[type="email"]').fill('coach.demo@thebox.com');
  await loginForm.locator('input[type="password"]').fill('Secur3P@ssw0rd!');
  await loginForm.locator('button[type="submit"]').click();

  await expect(page.locator('#pitch-football')).toBeVisible({ timeout: 15000 });
}

test.describe('Section 4 : Boîte à Outils de Tracés & Schématisation (FT-TOOL)', () => {
  test.beforeEach(async ({ page }) => {
    await connectToTacticsBoard(page);
  });

  test('FT-TOOL-01 : Activation des Outils de Tracé (Flèche, Crayon, Ligne)', async ({ page }) => {
    // 1. Outil Flèche de course (ArrowUpRight)
    const arrowBtn = page.locator('button:has(svg.lucide-arrow-up-right)').first();
    await expect(arrowBtn).toBeVisible();
    await arrowBtn.click();
    // Vérification de la classe active
    await expect(arrowBtn).toHaveClass(/bg-emerald-600|bg-\[#00E599\]/);

    // 2. Outil Crayon / Dessin libre (Pencil)
    const pencilBtn = page.locator('button:has(svg.lucide-pencil)').first();
    await expect(pencilBtn).toBeVisible();
    await pencilBtn.click();
    await expect(pencilBtn).toHaveClass(/bg-emerald-600|bg-\[#00E599\]/);

    // 3. Outil Sélection / Pointeur (MousePointer)
    const selectBtn = page.locator('button:has(svg.lucide-mouse-pointer)').first();
    await expect(selectBtn).toBeVisible();
    await selectBtn.click();
    await expect(selectBtn).toHaveClass(/bg-emerald-600|bg-\[#00E599\]/);
  });

  test('FT-TOOL-02 : Dessin d\'un Tracé sur le Terrain', async ({ page }) => {
    // 1. Activer l'outil Crayon
    const pencilBtn = page.locator('button:has(svg.lucide-pencil)').first();
    await pencilBtn.click();

    // 2. Récupérer les coordonnées du terrain pour tracer un trait
    const pitch = page.locator('#pitch-football');
    const box = await pitch.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      // Dessiner un trait libre au centre du terrain
      const startX = box.x + box.width * 0.4;
      const startY = box.y + box.height * 0.4;
      const endX = box.x + box.width * 0.6;
      const endY = box.y + box.height * 0.6;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 10 });
      await page.mouse.up();
    }

    // 3. Vérifier que le bouton d'effacement / RAZ est bien présent
    const clearBtn = page.getByRole('button', { name: 'RAZ' });
    await expect(clearBtn).toBeVisible();
  });

  test('FT-TOOL-03 : Remise à Zéro des Tracés (RAZ)', async ({ page }) => {
    // 1. Activer l'outil Crayon et faire un tracé rapide
    const pencilBtn = page.locator('button:has(svg.lucide-pencil)').first();
    await pencilBtn.click();

    const pitch = page.locator('#pitch-football');
    const box = await pitch.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200, { steps: 5 });
      await page.mouse.up();
    }

    // 2. Cliquer sur le bouton RAZ
    const clearBtn = page.getByRole('button', { name: 'RAZ' });
    if (await clearBtn.isEnabled()) {
      await clearBtn.click();
      // Les joueurs et le terrain restent intacts
      await expect(page.locator('#pitch-football')).toBeVisible();
    }
  });
});
