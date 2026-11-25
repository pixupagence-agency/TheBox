import { test } from '@playwright/test';

// Identifiants des comptes de test, lus dans .env.local (jamais écrits dans le code) :
//   E2E_EMAIL / E2E_PASSWORD             → compte coach de test (période d'essai)
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD → compte admin (facultatif, sinon le compte coach est utilisé)
// Les comptes n'existent que dans les émulateurs Firebase : scripts/e2e-seed.mjs les crée à chaque
// passage (mêmes valeurs par défaut qu'ici si .env.local ne les définit pas).
try {
  process.loadEnvFile('.env.local');
} catch {
  // Pas de .env.local : les variables peuvent venir de l'environnement (CI).
}

export const COACH = {
  email: process.env.E2E_EMAIL || 'coach@e2e.test',
  password: process.env.E2E_PASSWORD || 'e2e-coach-password',
};

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || (process.env.E2E_EMAIL ? COACH.email : 'admin@e2e.test'),
  password: process.env.E2E_ADMIN_PASSWORD || (process.env.E2E_PASSWORD ? COACH.password : 'e2e-admin-password'),
};

/** À appeler en tête des fichiers qui ont besoin d'un compte : saute les tests si aucun compte n'est configuré. */
export function requireTestAccount() {
  test.skip(!COACH.email || !COACH.password, 'Compte de test non configuré (E2E_EMAIL / E2E_PASSWORD dans .env.local)');
}
