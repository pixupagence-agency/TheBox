import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
/**
 * Tests e2e contre les émulateurs Firebase (jamais la base de production) : lancer « npm run test:e2e ».
 * Serveur de test dédié : port 3100 et dossier de compilation .next-e2e (le `next dev` du développeur,
 * sur le port 3000 avec .next, n'est pas touché).
 */
const E2E_PORT = 3100;
const E2E_SERVER_ENV: Record<string, string> = {
  ...(process.env as Record<string, string>),
  NEXT_DIST_DIR: '.next-e2e',
  NEXT_PUBLIC_FIREBASE_EMULATORS: 'true',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  GCLOUD_PROJECT: 'thebox-tactique',
  // Aucun e-mail réel ni App Check pendant les tests
  MAIL_TRANSPORT: 'json',
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: '',
  APPCHECK_ENFORCE: 'false',
};

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Worker limitation for dev server stability */
  workers: 1,
  /* Global timeout per test (60s) */
  timeout: 60000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${E2E_PORT}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Serveur de test branché sur les émulateurs (toujours relancé : jamais un serveur relié à la production) */
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : {
        command: `npx next dev --port ${E2E_PORT}`,
        url: `http://localhost:${E2E_PORT}`,
        reuseExistingServer: false,
        timeout: 180000,
        env: E2E_SERVER_ENV,
      },
});
