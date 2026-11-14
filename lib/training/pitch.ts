// Module Training : formats de terrain (dimensions réelles en mètres) et tracés des lignes.
import type { PitchConfig, PitchFormatId } from "./types";

export interface PitchFormatOption {
  id: PitchFormatId;
  label: string;
  length: number;
  width: number;
  hint: string;
}

export const PITCH_FORMATS: PitchFormatOption[] = [
  { id: "foot11", label: "Foot à 11", length: 105, width: 68, hint: "105 × 68 m" },
  { id: "foot8", label: "Foot à 8", length: 64, width: 50, hint: "64 × 50 m" },
  { id: "foot5", label: "Foot à 5", length: 40, width: 20, hint: "40 × 20 m" },
  { id: "half", label: "Demi-terrain", length: 52.5, width: 68, hint: "52,5 × 68 m" },
  { id: "quarter", label: "Quart de terrain", length: 52.5, width: 34, hint: "52,5 × 34 m" },
  { id: "free", label: "Zone libre", length: 30, width: 20, hint: "dimensions au choix" },
];

export const FREE_PITCH_LIMITS = { min: 5, max: 120 };

/** Dégagement dessiné autour de l'aire de jeu (m) */
export const PITCH_MARGIN = 3;

export const pitchFormatOption = (id: PitchFormatId): PitchFormatOption =>
  PITCH_FORMATS.find((f) => f.id === id) || PITCH_FORMATS[0];

export const makePitchConfig = (format: PitchFormatId, custom?: { length: number; width: number }): PitchConfig => {
  const option = pitchFormatOption(format);
  if (format === "free" && custom) {
    const clamp = (v: number) => Math.min(FREE_PITCH_LIMITS.max, Math.max(FREE_PITCH_LIMITS.min, Math.round(v * 2) / 2));
    return { format, length: clamp(custom.length), width: clamp(custom.width) };
  }
  return { format, length: option.length, width: option.width };
};

// ---------------------------------------------------------------------------
// Tracés (en mètres, origine en haut à gauche de l'aire de jeu)
// ---------------------------------------------------------------------------

export type PitchMarking =
  | { t: "rect"; x: number; y: number; w: number; h: number }
  | { t: "line"; points: number[] }
  | { t: "circle"; x: number; y: number; r: number }
  /** Arc de cercle : angles en degrés (0 = vers la droite, sens horaire) */
  | { t: "arc"; x: number; y: number; r: number; from: number; to: number }
  | { t: "spot"; x: number; y: number }
  /** But dessiné hors de la ligne : depth > 0 vers la droite, < 0 vers la gauche */
  | { t: "goal"; x: number; y: number; w: number; depth: number };

interface EndSpec {
  goalW: number;
  goalDepth: number;
  area: { depth: number; width: number } | { arcRadius: number };
  box?: { depth: number; width: number };
  spot: number;
  secondSpot?: number;
  penaltyArc?: number;
}

const END_SPECS: Record<"foot11" | "foot8" | "foot5", EndSpec & { centerR: number }> = {
  foot11: { goalW: 7.32, goalDepth: 2, area: { depth: 16.5, width: 40.32 }, box: { depth: 5.5, width: 18.32 }, spot: 11, penaltyArc: 9.15, centerR: 9.15 },
  foot8: { goalW: 6, goalDepth: 1.5, area: { depth: 13, width: 26 }, spot: 9, centerR: 6 },
  foot5: { goalW: 3, goalDepth: 1, area: { arcRadius: 6 }, spot: 6, secondSpot: 10, centerR: 3 },
};

/** Tracés d'une extrémité (côté gauche si dir = 1, droit si dir = -1) */
function endMarkings(spec: EndSpec, lineX: number, cy: number, dir: 1 | -1): PitchMarking[] {
  const out: PitchMarking[] = [];
  const at = (d: number) => lineX + dir * d;
  out.push({ t: "goal", x: lineX, y: cy - spec.goalW / 2, w: spec.goalW, depth: -dir * spec.goalDepth });
  if ("depth" in spec.area) {
    const a = spec.area;
    out.push({ t: "rect", x: dir === 1 ? lineX : lineX - a.depth, y: cy - a.width / 2, w: a.depth, h: a.width });
  } else {
    const r = spec.area.arcRadius;
    const g = spec.goalW / 2;
    if (dir === 1) {
      out.push({ t: "arc", x: lineX, y: cy - g, r, from: -90, to: 0 });
      out.push({ t: "line", points: [at(r), cy - g, at(r), cy + g] });
      out.push({ t: "arc", x: lineX, y: cy + g, r, from: 0, to: 90 });
    } else {
      out.push({ t: "arc", x: lineX, y: cy - g, r, from: 180, to: 270 });
      out.push({ t: "line", points: [at(r), cy - g, at(r), cy + g] });
      out.push({ t: "arc", x: lineX, y: cy + g, r, from: 90, to: 180 });
    }
  }
  if (spec.box) {
    const b = spec.box;
    out.push({ t: "rect", x: dir === 1 ? lineX : lineX - b.depth, y: cy - b.width / 2, w: b.depth, h: b.width });
  }
  out.push({ t: "spot", x: at(spec.spot), y: cy });
  if (spec.secondSpot) out.push({ t: "spot", x: at(spec.secondSpot), y: cy });
  if (spec.penaltyArc && "depth" in spec.area) {
    // Arc de la surface : partie du cercle (centre = point de penalty) située hors de la surface
    const dx = spec.area.depth - spec.spot;
    const half = (Math.acos(dx / spec.penaltyArc) * 180) / Math.PI;
    if (dir === 1) out.push({ t: "arc", x: at(spec.spot), y: cy, r: spec.penaltyArc, from: -half, to: half });
    else out.push({ t: "arc", x: at(spec.spot), y: cy, r: spec.penaltyArc, from: 180 - half, to: 180 + half });
  }
  return out;
}

function cornerArcs(L: number, W: number, corners: Array<"tl" | "tr" | "bl" | "br">): PitchMarking[] {
  const r = 1;
  const map = {
    tl: { t: "arc" as const, x: 0, y: 0, r, from: 0, to: 90 },
    tr: { t: "arc" as const, x: L, y: 0, r, from: 90, to: 180 },
    br: { t: "arc" as const, x: L, y: W, r, from: 180, to: 270 },
    bl: { t: "arc" as const, x: 0, y: W, r, from: 270, to: 360 },
  };
  return corners.map((c) => map[c]);
}

/** Tracés du terrain configuré */
export function pitchMarkings(pitch: PitchConfig): PitchMarking[] {
  const L = pitch.length;
  const W = pitch.width;
  const out: PitchMarking[] = [{ t: "rect", x: 0, y: 0, w: L, h: W }];

  if (pitch.format === "foot11" || pitch.format === "foot8" || pitch.format === "foot5") {
    const spec = END_SPECS[pitch.format];
    out.push({ t: "line", points: [L / 2, 0, L / 2, W] });
    out.push({ t: "circle", x: L / 2, y: W / 2, r: spec.centerR });
    out.push({ t: "spot", x: L / 2, y: W / 2 });
    out.push(...endMarkings(spec, 0, W / 2, 1), ...endMarkings(spec, L, W / 2, -1));
    out.push(...cornerArcs(L, W, ["tl", "tr", "bl", "br"]));
  } else if (pitch.format === "half") {
    // Moitié d'un terrain à 11 : but à gauche, ligne médiane à droite
    out.push(...endMarkings(END_SPECS.foot11, 0, W / 2, 1));
    out.push({ t: "arc", x: L, y: W / 2, r: 9.15, from: 90, to: 270 });
    out.push({ t: "spot", x: L, y: W / 2 });
    out.push(...cornerArcs(L, W, ["tl", "bl"]));
  } else if (pitch.format === "quarter") {
    // Quart de terrain à 11 (côté gauche, moitié haute) : la moitié de la surface est visible
    const spec = END_SPECS.foot11;
    const cy = W; // l'axe du but est sur le bord bas
    out.push({ t: "line", points: [0, cy - 40.32 / 2, 16.5, cy - 40.32 / 2, 16.5, cy] });
    out.push({ t: "line", points: [0, cy - 18.32 / 2, 5.5, cy - 18.32 / 2, 5.5, cy] });
    out.push({ t: "goal", x: 0, y: cy - spec.goalW / 2, w: spec.goalW / 2, depth: -spec.goalDepth });
    out.push({ t: "spot", x: 11, y: cy - 0.01 });
    const half = (Math.acos((16.5 - 11) / 9.15) * 180) / Math.PI;
    out.push({ t: "arc", x: 11, y: cy, r: 9.15, from: -half, to: 0 });
    out.push(...cornerArcs(L, W, ["tl"]));
  }
  return out;
}
