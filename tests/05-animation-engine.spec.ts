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

test.describe('Section 5 : Moteur d\'Animation & Séquençage Multi-Étapes (FT-ANIM)', () => {
  test.beforeEach(async ({ page }) => {
    await connectToTacticsBoard(page);
  });

  test('FT-ANIM-01 : Création & Enchaînement des Étapes (Keyframes)', async ({ page }) => {
    // 1. Ouvrir le panneau du créateur d'animation vidéo
    const animToggleBtn = page.locator('button:has(svg.lucide-video)').first();
    await expect(animToggleBtn).toBeVisible();
    await animToggleBtn.click();

    // 2. Vérifier l'apparition du panneau d'animation
    const animPanel = page.locator('#animation-creator-panel');
    await expect(animPanel).toBeVisible();

    // 3. L'étape 1 est présente par défaut
    const step1Btn = animPanel.locator('button:has-text("1")').first();
    await expect(step1Btn).toBeVisible();

    // 4. Cliquer sur le bouton "Nouvelle étape" (+)
    const addStepBtn = animPanel.locator('button:has(svg.lucide-plus)').first();
    await expect(addStepBtn).toBeVisible();
    await addStepBtn.click();

    // 5. L'étape 2 apparaît dans la timeline
    const step2Btn = animPanel.locator('button:has-text("2")').first();
    await expect(step2Btn).toBeVisible();

    // 6. Navigation fluide entre les étapes 1 et 2
    await step1Btn.click();
    await expect(step1Btn).toBeVisible();
    await step2Btn.click();
    await expect(step2Btn).toBeVisible();
  });

  test('FT-ANIM-02 : Lecture Fluide (Play/Pause) & Vitesse', async ({ page }) => {
    // 1. Ouvrir le panneau d'animation
    const animToggleBtn = page.locator('button:has(svg.lucide-video)').first();
    await animToggleBtn.click();
    const animPanel = page.locator('#animation-creator-panel');
    await expect(animPanel).toBeVisible();

    // 2. Ajouter une deuxième étape pour permettre l'animation
    const addStepBtn = animPanel.locator('button:has(svg.lucide-plus)').first();
    await addStepBtn.click();

    // 3. Bouton Lecture / Play
    const playBtn = animPanel.locator('button:has(svg.lucide-play)').first();
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // 4. Le bouton passe en état Pause
    const pauseBtn = animPanel.locator('button:has(svg.lucide-pause)').first();
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    // 5. Sélection de la vitesse de lecture (ex: 0.5s ou 1s)
    const speedBtn = animPanel.locator('button:has-text("0.5s")').first();
    if (await speedBtn.isVisible()) {
      await speedBtn.click();
      await expect(speedBtn).toHaveClass(/bg-emerald-600|bg-\[#00E599\]/);
    }
  });
});
