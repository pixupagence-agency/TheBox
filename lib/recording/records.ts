// Module Recording : format des fiches de la bibliothèque (IndexedDB, lib/recording/db.ts).
// Chaque fiche porte « version ». À la lecture, une fiche ancienne est migrée ; une fiche illisible
// (corrompue ou d'un format plus récent) n'est pas listée mais reste dans la base, intacte.
// Pour changer un format : incrémenter la version (et le type), puis ajouter la migration correspondante.
import { isRecord, readItem, type ItemSchema, type Migrations } from "../localData";
import { emptyTags, type LibraryImage, type Sequence } from "./types";

export const SEQUENCE_VERSION = 1;
const SEQUENCE_MIGRATIONS: Migrations = {};
export const IMAGE_VERSION = 1;
const IMAGE_MIGRATIONS: Migrations = {};

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function validSource(s: unknown): boolean {
  if (!isRecord(s)) return false;
  if (s.kind === "file") return typeof s.videoId === "string";
  return (s.kind === "youtube" || s.kind === "vimeo") && typeof s.ref === "string";
}

const tagsOk = (t: unknown) => isRecord(t) && Array.isArray(t.players) && Array.isArray(t.custom);

const SEQUENCE_SCHEMA: ItemSchema<Sequence> = {
  version: SEQUENCE_VERSION,
  versionField: "version",
  migrations: SEQUENCE_MIGRATIONS,
  normalize: (s) => {
    if (typeof s.id !== "string" || !validSource(s.source)) return null;
    return {
      ...s,
      title: typeof s.title === "string" ? s.title : "Séquence",
      createdAt: typeof s.createdAt === "string" ? s.createdAt : "",
      updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : typeof s.createdAt === "string" ? s.createdAt : "",
      fps: finite(s.fps) && s.fps > 0 ? s.fps : 25,
      tags: tagsOk(s.tags) ? s.tags : emptyTags(),
      freezes: Array.isArray(s.freezes) ? s.freezes.filter((f) => isRecord(f) && finite(f.time) && Array.isArray(f.shapes)) : [],
      ...(s.tracks !== undefined ? { tracks: Array.isArray(s.tracks) ? s.tracks.filter(isRecord) : [] } : {}),
    } as unknown as Sequence;
  },
};

const IMAGE_SCHEMA: ItemSchema<LibraryImage> = {
  version: IMAGE_VERSION,
  versionField: "version",
  migrations: IMAGE_MIGRATIONS,
  normalize: (i) => {
    if (typeof i.id !== "string" || typeof i.thumbnail !== "string") return null;
    return {
      ...i,
      title: typeof i.title === "string" ? i.title : "Image",
      createdAt: typeof i.createdAt === "string" ? i.createdAt : "",
      tags: tagsOk(i.tags) ? i.tags : emptyTags(),
    } as unknown as LibraryImage;
  },
};

/** Fiches lisibles (migrées si besoin) ; les autres sont ignorées sans être supprimées */
export function readRecords<T>(raw: unknown[], kind: "sequence" | "image"): T[] {
  const schema = (kind === "sequence" ? SEQUENCE_SCHEMA : IMAGE_SCHEMA) as unknown as ItemSchema<T>;
  const out: T[] = [];
  let skipped = 0;
  for (const r of raw) {
    const item = readItem(r, schema);
    if (item) out.push(item);
    else skipped++;
  }
  if (skipped) console.warn(`[recording] ${skipped} fiche(s) illisible(s) ignorée(s) dans la bibliothèque (conservées).`);
  return out;
}
