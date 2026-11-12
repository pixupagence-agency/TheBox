import { expect, Page } from '@playwright/test';

export type Sport = 'football' | 'rugby' | 'basketball' | 'handball';

const SPORT_LABEL: Record<Sport, RegExp> = {
  football: /Football/,
  rugby: /Rugby/,
  basketball: /Basketball/,
  handball: /Handball/,
};

/** Connexion avec un compte e-mail / mot de passe, tutoriel masqué. Le terrain attendu dépend du sport du compte. */
export async function login(page: Page, creds: { email: string; password: string }, pitch: Sport = 'football') {
  await page.addInitScript(() => localStorage.setItem('thebox_tutorial_seen', 'true'));
  await page.goto('/');
  const loginBtn = page.getByRole('button', { name: /Se Connecter/i }).first();
  await expect(loginBtn).toBeVisible({ timeout: 10000 });
  await loginBtn.click();

  const loginForm = page.locator('form').filter({ hasText: /OU AVEC IDENTIFIANTS/i });
  if (!(await loginForm.isVisible({ timeout: 2000 }).catch(() => false))) {
    await loginBtn.click();
  }
  await expect(loginForm).toBeVisible({ timeout: 10000 });
  await loginForm.locator('input[type="email"]').fill(creds.email);
  await loginForm.locator('input[type="password"]').fill(creds.password);
  await loginForm.locator('button[type="submit"]').click();

  await expect(page.locator(`#pitch-${pitch}`)).toBeVisible({ timeout: 20000 });
}

/** Ouvre le menu « Plus d'outils » de la barre d'outils s'il est replié (écrans étroits). */
export async function openMoreTools(page: Page) {
  const more = page.getByRole('button', { name: "Plus d'outils" });
  if (await more.isVisible().catch(() => false)) {
    await more.click();
  }
}

/** Ouvre une entrée du menu profil (en haut à droite). */
export async function openUserMenuItem(page: Page, item: RegExp) {
  await page.getByRole('button', { name: 'Menu profil utilisateur' }).click();
  const entry = page.getByRole('button', { name: item }).first();
  await expect(entry).toBeVisible({ timeout: 5000 });
  await entry.click();
}

/**
 * Change le sport du compte via Paramètres > Sport (compte admin : tous les sports sont ouverts).
 * Le choix est enregistré sur le compte : remettre le football en fin de test.
 */
export async function setSport(page: Page, sport: Sport) {
  await openUserMenuItem(page, /Configuration Profil & Sport/);
  await page.getByRole('button', { name: 'Sport', exact: true }).click();
  await page.getByRole('button', { name: SPORT_LABEL[sport] }).first().click();
  await page.getByRole('button', { name: 'Enregistrer' }).last().click();
  await expect(page.locator(`#pitch-${sport}`)).toBeVisible({ timeout: 10000 });
}

/** Crée un nouveau match (les matchs sont facultatifs) puis active le mode Live. */
export async function startLiveMatch(page: Page) {
  await page.getByRole('button', { name: 'Gérer ou ajouter des matchs' }).click();
  await page.getByRole('button', { name: 'Nouveau match' }).click();
  await page.getByRole('button', { name: 'Valider' }).click();
  await page.getByRole('button', { name: 'Fermer', exact: true }).first().click();

  const liveToggleBtn = page.getByRole('button', { name: 'MODE LIVE', exact: true });
  await expect(liveToggleBtn).toBeVisible({ timeout: 5000 });
  await liveToggleBtn.click();
  await expect(page.locator('text=⏱️').first()).toBeVisible({ timeout: 5000 });
}
