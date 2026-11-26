import { test, expect } from '@playwright/test';
import { backupKey, nearQuotaWarning, readItem, type ItemSchema } from '../lib/localData';
import { readDiagram } from '../lib/training/diagramData';
import { loadSessions, saveSessions, TRAINING_SESSIONS_KEY } from '../lib/training/sessions';
import { loadDraft, TRAINING_DRAFT_KEY } from '../lib/training/storage';
import { loadConvocations, saveConvocations } from '../lib/convocations/storage';
import { CONVOCATIONS_KEY } from '../lib/convocations/model';
import { readRecords } from '../lib/recording/records';
import { COACH, requireTestAccount } from './e2e-credentials';
import { login } from './helpers';

// Données enregistrées sur l'appareil (lib/localData.ts) : formats versionnés, lecture sans plantage,
// entrées illisibles conservées au lieu d'être effacées.

/** localStorage en mémoire pour exercer les modules hors navigateur */
class MemoryStorage {
  private m = new Map<string, string>();
  quota = Infinity;
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) {
    let size = 0;
    for (const [kk, vv] of this.m) if (kk !== k) size += kk.length + vv.length;
    if (size + k.length + v.length > this.quota) throw new Error('QuotaExceededError');
    this.m.set(k, String(v));
  }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

const g = globalThis as unknown as { window?: unknown; localStorage?: MemoryStorage };
let store: MemoryStorage;

const diagram = (elements: unknown[] = [], extra: Record<string, unknown> = {}) => ({
  version: 1, pitch: { format: 'foot11', length: 105, width: 68 }, elements, ...extra,
});
const cone = (id: string) => ({ id, kind: 'flatCone', x: 10, y: 5, rotation: 0, color: '#facc15' });
const exercise = (id: string, d: unknown = diagram([cone(`${id}_c`)])) => ({ id, title: id, duration: 10, players: 8, balls: 4, diagram: d });
const session = (id: string, exercises: unknown[]) => ({ id, title: id, date: '2026-11-26', exercises, createdAt: 'x', updatedAt: 'x' });
const convoc = (id: string, players: unknown[] = [], extra: Record<string, unknown> = {}) => ({
  id, kind: 'training', teamId: 't1', date: '2026-11-30', players, createdAt: 'x', updatedAt: 'x', ...extra,
});
const read = (k: string) => JSON.parse(store.getItem(k) || 'null');

test.describe('Section 17 : Données locales versionnées (FT-DATA)', () => {
  test.describe('Modules (hors navigateur)', () => {
    test.beforeEach(() => {
      store = new MemoryStorage();
      g.window = globalThis;
      g.localStorage = store;
    });
    test.afterAll(() => {
      delete g.window;
      delete g.localStorage;
    });

    test('FT-DATA-01 : Migration pas à pas, format plus récent refusé', () => {
      const schema: ItemSchema<{ id: string; label: string; v: number }> = {
        version: 3,
        versionField: 'v',
        migrations: { 1: (i) => ({ ...i, name: i.nom }), 2: (i) => ({ ...i, label: String(i.name).toUpperCase() }) },
        normalize: (i) => (typeof i.label === 'string' ? (i as never) : null),
      };
      expect(readItem({ id: 'a', nom: 'léa' }, schema)).toMatchObject({ id: 'a', label: 'LÉA', v: 3 }); // sans numéro = format 1
      expect(readItem({ id: 'b', v: 2, name: 'tom' }, schema)).toMatchObject({ label: 'TOM', v: 3 });
      expect(readItem({ id: 'c', v: 4, label: 'x' }, schema)).toBeNull();
      expect(readItem({ id: 'd', v: 'deux' }, schema)).toBeNull();
      expect(readItem('texte', schema)).toBeNull();
    });

    test('FT-DATA-02 : Schéma Training : éléments mal formés écartés, rotation réparée', () => {
      const valid = diagram([cone('a')]);
      expect(readDiagram(valid)).toEqual(valid);
      const repaired = readDiagram(diagram([
        cone('a'),
        { ...cone('b'), rotation: null },
        { id: 'c', kind: 'inconnu', x: 1, y: 1 },
        { id: 'd', kind: 'arrow', x: 1, y: 1, rotation: 0, points: [0, 0, 'x', 1] },
        { id: 'e', kind: 'text', x: 1, y: 1, rotation: 0 },
        null,
      ]))!;
      expect(repaired.elements.map((e) => e.id)).toEqual(['a', 'b']);
      expect(repaired.elements[1].rotation).toBe(0);
      expect(readDiagram({ ...valid, version: 2 })).toBeNull();
      expect(readDiagram({ ...valid, pitch: { format: 'rugby' } })).toBeNull();
      // Dimensions absentes : terrain du format
      expect(readDiagram({ ...valid, pitch: { format: 'foot8' } })!.pitch).toEqual({ format: 'foot8', length: 64, width: 50 });
    });

    test('FT-DATA-03 : Brouillon corrompu : terrain vide et copie de secours', () => {
      store.setItem(TRAINING_DRAFT_KEY, '{"version":1,"pitch":');
      expect(loadDraft().elements).toEqual([]);
      expect(store.getItem(backupKey(TRAINING_DRAFT_KEY))).toBe('{"version":1,"pitch":');

      const intact = JSON.stringify(diagram([cone('a')]));
      store.setItem(TRAINING_DRAFT_KEY, intact);
      store.removeItem(backupKey(TRAINING_DRAFT_KEY));
      expect(loadDraft().elements).toHaveLength(1);
      expect(store.getItem(backupKey(TRAINING_DRAFT_KEY))).toBeNull(); // rien à sauvegarder
    });

    test('FT-DATA-04 : Séances : exercices et séances illisibles conservés à l\'enregistrement', () => {
      const future = exercise('ex_futur', diagram([cone('z')], { version: 2 }));
      store.setItem(TRAINING_SESSIONS_KEY, JSON.stringify([
        session('s1', [exercise('ex1'), future]),
        session('s2', [exercise('ex2')]),
        { id: 's_futur', v: 2, nouveauChamp: true },
        'déchet',
      ]));

      const loaded = loadSessions();
      expect(loaded.map((s) => s.id)).toEqual(['s1', 's2']);
      expect(loaded[0].exercises.map((e) => e.id)).toEqual(['ex1']);
      expect(store.getItem(backupKey(TRAINING_SESSIONS_KEY))).toBeTruthy();

      // Le coach renomme s1 et supprime s2
      expect(saveSessions([{ ...loaded[0], title: 'Renommée' }])).toBe(true);
      const saved = read(TRAINING_SESSIONS_KEY);
      expect(saved.map((s: { id: string }) => s.id)).toEqual(['s1', 's_futur']);
      expect(saved[0].title).toBe('Renommée');
      expect(saved[0].exercises.map((e: { id: string }) => e.id)).toEqual(['ex1', 'ex_futur']);
      expect(saved[0].exercises[1]).toEqual(future); // intact
      expect(saved[1]).toEqual({ id: 's_futur', v: 2, nouveauChamp: true });

      // Liste illisible en entier (JSON corrompu) : vide, sans planter
      store.setItem(TRAINING_SESSIONS_KEY, '[{"id":');
      expect(loadSessions()).toEqual([]);
    });

    test('FT-DATA-05 : Données intactes : relues et réécrites à l\'identique', () => {
      const sessions = [session('s1', [exercise('ex1')])];
      store.setItem(TRAINING_SESSIONS_KEY, JSON.stringify(sessions));
      expect(saveSessions(loadSessions())).toBe(true);
      expect(read(TRAINING_SESSIONS_KEY)).toEqual(sessions);
      const convocs = [convoc('c1', [{ playerId: 'p1', name: 'Léa', number: 9, response: 'present' }])];
      store.setItem(CONVOCATIONS_KEY, JSON.stringify(convocs));
      expect(saveConvocations(loadConvocations())).toBe(true);
      expect(read(CONVOCATIONS_KEY)).toEqual(convocs);
      expect(store.getItem(backupKey(TRAINING_SESSIONS_KEY))).toBeNull();
      expect(store.getItem(backupKey(CONVOCATIONS_KEY))).toBeNull();
    });

    test('FT-DATA-06 : Convocations : joueurs réparés, convocations illisibles conservées', () => {
      store.setItem(CONVOCATIONS_KEY, JSON.stringify([
        convoc('c1', [{ playerId: 'p1', response: 'peut-être' }, { name: 'sans identifiant' }, { playerId: 'p2', name: 'Tom', response: 'absent' }]),
        convoc('c_futur', [], { v: 2 }),
        { id: 'c_casse', kind: 'match' },
      ]));
      const loaded = loadConvocations();
      expect(loaded.map((c) => c.id)).toEqual(['c1']);
      expect(loaded[0].players).toEqual([
        { playerId: 'p1', name: 'Joueur', response: 'pending' },
        { playerId: 'p2', name: 'Tom', response: 'absent' },
      ]);
      expect(saveConvocations([...loaded, convoc('c2') as never])).toBe(true);
      expect(read(CONVOCATIONS_KEY).map((c: { id: string }) => c.id)).toEqual(['c1', 'c2', 'c_futur', 'c_casse']);
    });

    test('FT-DATA-07 : Stockage plein : échec signalé, alerte à l\'approche de la limite', () => {
      store.quota = 50;
      expect(saveConvocations([convoc('c1') as never])).toBe(false);
      store.quota = Infinity;
      expect(nearQuotaWarning()).toBeNull();
      store.setItem('gros', 'x'.repeat(2.2 * 1024 * 1024)); // ≈ 4,4 Mo en UTF-16
      expect(nearQuotaWarning()).toMatch(/presque plein/);
      expect(nearQuotaWarning()).toBeNull(); // une seule fois par visite
    });

    test('FT-DATA-08 : Bibliothèque Recording : fiches illisibles ignorées, arrêts mal formés écartés', () => {
      const seq = {
        id: 'q1', version: 1, title: 'But', createdAt: 'a', updatedAt: 'b', fps: 25,
        source: { kind: 'youtube', ref: 'abc', url: 'u' }, tags: { players: [], custom: [] },
        freezes: [{ id: 'f1', time: 3, shapes: [] }, { id: 'f2', time: 'x' }],
      };
      const list = readRecords<{ id: string; freezes: unknown[] }>(
        [seq, { ...seq, id: 'q2', version: 2 }, { id: 'q3', version: 1 }, null],
        'sequence'
      );
      expect(list.map((s) => s.id)).toEqual(['q1']);
      expect(list[0].freezes).toHaveLength(1);
    });
  });

  test('FT-DATA-09 : Training s\'ouvre avec des données locales abîmées', async ({ page }) => {
    requireTestAccount();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await login(page, COACH);
    await page.evaluate(([draftKey, d]) => {
      localStorage.setItem(draftKey, JSON.stringify(d));
    }, [TRAINING_DRAFT_KEY, diagram([cone('ok'), { id: 'abime', kind: 'arrow', x: 1, y: 1, points: 'x' }])] as const);
    await page.goto('/training');
    await expect(page.getByTestId('training-canvas').locator('canvas').first()).toBeVisible({ timeout: 60000 });
    const backup = await page.evaluate((k) => localStorage.getItem(k), backupKey(TRAINING_DRAFT_KEY));
    expect(backup).toContain('abime');
    expect(errors).toEqual([]);
  });
});
