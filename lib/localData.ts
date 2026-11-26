// Données enregistrées sur l'appareil (localStorage) : lecture versionnée, sans perte.
//
// Chaque entrée d'une liste porte un numéro de format. À la lecture, une entrée ancienne est migrée
// pas à pas jusqu'au format courant ; une entrée illisible (corrompue, ou écrite par une version plus
// récente de l'application sur un autre appareil puis synchronisée) n'est pas affichée, mais elle est
// CONSERVÉE telle quelle au prochain enregistrement : rien n'est effacé sans que le coach l'ait vu.
// Si une lecture a dû réparer ou écarter quelque chose, le texte d'origine est en plus copié une fois
// sous « thebox_backup_<clé> » pour pouvoir être récupéré.

/** Migrations d'un format : MIGRATIONS[n] transforme une entrée du format n en format n + 1 */
export type Migrations = Record<number, (item: Record<string, unknown>) => Record<string, unknown>>;

export interface ItemSchema<T> {
  /** Format courant */
  version: number;
  /** Champ qui porte le numéro de format (absent = format 1) */
  versionField: string;
  migrations?: Migrations;
  /** Vérifie et répare une entrée au format courant ; null si elle est inutilisable */
  normalize: (item: Record<string, unknown>) => T | null;
}

export const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
export const optStr = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
export const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
export const optNum = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Migre puis vérifie une entrée ; null si elle est illisible ou d'un format plus récent */
export function readItem<T>(raw: unknown, schema: ItemSchema<T>): T | null {
  if (!isRecord(raw)) return null;
  const declared = raw[schema.versionField];
  let version = declared === undefined ? 1 : declared;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1 || version > schema.version) return null;
  let item = raw;
  const migrated = version < schema.version;
  while (version < schema.version) {
    const step = schema.migrations?.[version];
    if (!step) return null;
    try {
      item = step(item);
    } catch {
      return null;
    }
    version += 1;
  }
  // Le numéro de format n'est écrit que s'il était déjà là ou après une migration (absent = format 1)
  if (migrated || declared !== undefined) item = { ...item, [schema.versionField]: schema.version };
  try {
    return schema.normalize(item);
  } catch {
    return null;
  }
}

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseArray(raw: string | null): unknown[] | null {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const backupKey = (key: string) => `thebox_backup_${key}`;

/** Copie de secours du texte d'origine (une seule par contenu ; ignorée si le stockage est plein) */
export function backupRaw(key: string, raw: string | null) {
  if (!raw || typeof window === "undefined") return;
  try {
    const target = backupKey(key);
    if (localStorage.getItem(target) === raw) return;
    localStorage.setItem(target, raw);
    console.warn(`[localData] Données réparées pour « ${key} » : copie d'origine dans « ${target} ».`);
  } catch {
    /* stockage plein : la copie est abandonnée, les entrées illisibles restent conservées */
  }
}

/** Lit une liste versionnée. `changed` : la lecture a migré, réparé ou écarté au moins une entrée. */
export function parseList<T>(raw: string | null, schema: ItemSchema<T>): { items: T[]; changed: boolean } {
  const arr = parseArray(raw);
  if (!arr) return { items: [], changed: true };
  const items: T[] = [];
  let changed = false;
  for (const entry of arr) {
    const item = readItem(entry, schema);
    if (item) items.push(item);
    // Écartée ou réparée (une simple migration de format n'est pas une réparation)
    if (!item || (isRecord(entry) && entry[schema.versionField] === (item as Record<string, unknown>)[schema.versionField]
      && JSON.stringify(item) !== JSON.stringify(entry))) changed = true;
  }
  return { items, changed };
}

export function loadList<T>(key: string, schema: ItemSchema<T>): T[] {
  const raw = readRaw(key);
  const { items, changed } = parseList(raw, schema);
  if (changed) backupRaw(key, raw);
  return items;
}

/**
 * Enregistre une liste en gardant les entrées illisibles déjà présentes (relues au moment de
 * l'enregistrement, pour tenir compte d'une synchronisation arrivée entre-temps).
 * `keepParts` permet de rattacher à une entrée les sous-éléments illisibles qu'elle contenait.
 * Renvoie false si le stockage est plein ou indisponible.
 */
export function saveList<T extends { id: string }>(
  key: string,
  list: T[],
  schema: ItemSchema<T>,
  keepParts?: (item: T, stored: Record<string, unknown>) => T
): boolean {
  if (typeof window === "undefined") return false;
  const stored = parseArray(readRaw(key)) || [];
  const ids = new Set(list.map((i) => i.id));
  const storedById = new Map<string, Record<string, unknown>>();
  const unreadable: unknown[] = [];
  for (const entry of stored) {
    if (!isRecord(entry)) continue; // rien d'exploitable à conserver
    if (readItem(entry, schema)) {
      if (typeof entry.id === "string") storedById.set(entry.id, entry);
    } else if (typeof entry.id !== "string" || !ids.has(entry.id)) {
      unreadable.push(entry);
    }
  }
  const out = keepParts
    ? list.map((item) => {
        const prev = storedById.get(item.id);
        return prev ? keepParts(item, prev) : item;
      })
    : list;
  try {
    localStorage.setItem(key, JSON.stringify([...out, ...unreadable]));
    return true;
  } catch {
    return false;
  }
}

/** Taille approximative du localStorage de l'application (octets, UTF-16) */
export function localStorageBytes(): number {
  if (typeof window === "undefined") return 0;
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      total += (k.length + (localStorage.getItem(k) || "").length) * 2;
    }
    return total;
  } catch {
    return 0;
  }
}

/** Les navigateurs accordent environ 5 Mo : alerte à partir de 4 Mo */
export const LOCAL_STORAGE_WARN_BYTES = 4 * 1024 * 1024;
let quotaWarned = false;

/** Message à afficher une fois par visite quand le stockage de l'appareil approche de sa limite */
export function nearQuotaWarning(): string | null {
  if (quotaWarned || localStorageBytes() < LOCAL_STORAGE_WARN_BYTES) return null;
  quotaWarned = true;
  return "⚠️ Le stockage de l'appareil est presque plein : supprimez d'anciens éléments (matchs, séances, convocations) pour continuer à enregistrer.";
}
