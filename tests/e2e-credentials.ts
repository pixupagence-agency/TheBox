import { test } from '@playwright/test';

// Identifiants des comptes de test, lus dans .env.local (jamais écrits dans le code) :
//   E2E_EMAIL / E2E_PASSWORD             → compte coach de test (obligatoire)
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD → compte admin (facultatif, sinon le compte coach est utilisé)
try {
  process.loadEnvFile('.env.local');
} catch {
  // Pas de .env.local : les variables peuvent venir de l'environnement (CI).
}

export const COACH = {
  email: process.env.E2E_EMAIL || '',
  password: process.env.E2E_PASSWORD || '',
};

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || COACH.email,
  password: process.env.E2E_ADMIN_PASSWORD || COACH.password,
};

/** À appeler en tête des fichiers qui ont besoin d'un compte : saute les tests si aucun compte n'est configuré. */
export function requireTestAccount() {
  test.skip(!COACH.email || !COACH.password, 'Compte de test non configuré (E2E_EMAIL / E2E_PASSWORD dans .env.local)');
}
