import { test, expect } from '@playwright/test';

// Route de santé suivie par la sonde de surveillance externe (app/api/health/route.ts)
test.describe('Section 15 : Surveillance (FT-HEALTH)', () => {
  test('FT-HEALTH-01 : /api/health répond 200 quand Firestore répond, avec un cache CDN de 60 s', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, firestore: 'ok' });
    expect(res.headers()['cache-control']).toContain('s-maxage=60');
  });
});
