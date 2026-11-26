// Module Training : format enregistré d'un schéma d'atelier (brouillon, exercices des séances).
// Lecture versionnée (lib/localData.ts) : un schéma ancien est migré, un élément mal formé est écarté
// au lieu de faire planter l'éditeur. Pour changer le format : incrémenter DIAGRAM_VERSION (et le type
// TrainingDiagram.version), puis ajouter DIAGRAM_MIGRATIONS[ancienne version].
import { isRecord, readItem, type ItemSchema, type Migrations } from "../localData";
import { PITCH_FORMATS, makePitchConfig } from "./pitch";
import { LAYER_OF, type PitchConfig, type PitchFormatId, type TrainingDiagram, type TrainingElement } from "./types";

export const DIAGRAM_VERSION = 1;
const DIAGRAM_MIGRATIONS: Migrations = {};

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const numberList = (v: unknown, min: number) => Array.isArray(v) && v.length >= min && v.length % 2 === 0 && v.every(finite);

function readPitch(raw: unknown): PitchConfig | null {
  if (!isRecord(raw)) return null;
  const format = raw.format as PitchFormatId;
  if (!PITCH_FORMATS.some((f) => f.id === format)) return null;
  if (finite(raw.length) && raw.length > 0 && finite(raw.width) && raw.width > 0) return raw as unknown as PitchConfig;
  return makePitchConfig(format);
}

/** Élément utilisable tel quel, réparé (rotation), ou null s'il ferait planter l'affichage */
function readElement(raw: unknown): TrainingElement | null {
  if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.kind !== "string" || !(raw.kind in LAYER_OF)) return null;
  if (!finite(raw.x) || !finite(raw.y)) return null;
  if (raw.kind === "arrow" && !numberList(raw.points, 4)) return null;
  if (raw.kind === "zone" && (!finite(raw.width) || !finite(raw.height) || (raw.shape === "polygon" && !numberList(raw.points, 6)))) return null;
  if (raw.kind === "text" && typeof raw.text !== "string") return null;
  return (finite(raw.rotation) ? raw : { ...raw, rotation: 0 }) as unknown as TrainingElement;
}

export const DIAGRAM_SCHEMA: ItemSchema<TrainingDiagram> = {
  version: DIAGRAM_VERSION,
  versionField: "version",
  migrations: DIAGRAM_MIGRATIONS,
  normalize: (d) => {
    const pitch = readPitch(d.pitch);
    if (!pitch || !Array.isArray(d.elements)) return null;
    const elements = d.elements.map(readElement).filter((e): e is TrainingElement => !!e);
    return { ...d, pitch, elements } as unknown as TrainingDiagram;
  },
};

export const readDiagram = (raw: unknown): TrainingDiagram | null => readItem(raw, DIAGRAM_SCHEMA);
