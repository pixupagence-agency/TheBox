// Garde-fou des tests e2e : ils ne tournent que contre les émulateurs Firebase locaux, jamais contre
// la base de production (quota gratuit épuisé le 2026-11-25 par des passages répétés).
// Lancer les tests avec « npm run test:e2e » (démarre les émulateurs, crée les comptes, lance Playwright).
async function reachable(url: string) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_TEST_BASE_URL) return; // cible explicite (ex. préproduction), sous la responsabilité du lanceur
  const [firestore, auth] = await Promise.all([reachable("http://127.0.0.1:8080"), reachable("http://127.0.0.1:9099")]);
  if (!firestore || !auth) {
    throw new Error(
      "Émulateurs Firebase introuvables (Firestore 8080, Auth 9099). Lancez les tests avec « npm run test:e2e »."
    );
  }
}
