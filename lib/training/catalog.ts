// Module Training : catalogue du matériel et des annotations (palette), valeurs par défaut et libellés.
import type {
  ArrowStyle,
  ElementKind,
  PlayerRole,
  TrainingElement,
  ZoneShape,
} from "./types";

export const CONE_COLORS: Array<{ id: string; label: string; hex: string }> = [
  { id: "yellow", label: "Jaune", hex: "#facc15" },
  { id: "red", label: "Rouge", hex: "#ef4444" },
  { id: "blue", label: "Bleu", hex: "#3b82f6" },
  { id: "orange", label: "Orange", hex: "#f97316" },
  { id: "white", label: "Blanc", hex: "#f8fafc" },
];

export const BIB_COLORS: Array<{ id: string; label: string; hex: string }> = [
  { id: "green", label: "Vert", hex: "#00E599" },
  { id: "orange", label: "Orange fluo", hex: "#fb923c" },
  { id: "yellow", label: "Jaune fluo", hex: "#e3f84a" },
  { id: "blue", label: "Bleu", hex: "#3b82f6" },
  { id: "red", label: "Rouge", hex: "#ef4444" },
  { id: "white", label: "Blanc", hex: "#f8fafc" },
  { id: "black", label: "Noir", hex: "#1e293b" },
];

export const ANNOTATION_COLORS: Array<{ id: string; label: string; hex: string }> = [
  { id: "white", label: "Blanc", hex: "#ffffff" },
  { id: "yellow", label: "Jaune", hex: "#facc15" },
  { id: "green", label: "Vert", hex: "#00E599" },
  { id: "blue", label: "Bleu", hex: "#60a5fa" },
  { id: "red", label: "Rouge", hex: "#f87171" },
  { id: "orange", label: "Orange", hex: "#fb923c" },
];

export const GOAL_SIZES: Array<{ size: number; label: string }> = [
  { size: 7.32, label: "Taille réelle (7,32 m)" },
  { size: 6, label: "Foot à 8 (6 m)" },
  { size: 5, label: "Réduit (5 m)" },
  { size: 3, label: "Foot à 5 (3 m)" },
];

export const MINI_GOAL_SIZES: Array<{ size: number; label: string }> = [
  { size: 1.2, label: "Petit (1,2 m)" },
  { size: 1.5, label: "Moyen (1,5 m)" },
  { size: 1.8, label: "Grand (1,8 m)" },
];

export const ARROW_STYLES: Array<{ id: ArrowStyle; label: string; hint: string }> = [
  { id: "run", label: "Course sans ballon", hint: "pointillés" },
  { id: "dribble", label: "Conduite de balle", hint: "ondulée" },
  { id: "pass", label: "Passe", hint: "pleine" },
  { id: "shot", label: "Tir", hint: "épaisse" },
];

export const ZONE_SHAPES: Array<{ id: ZoneShape; label: string }> = [
  { id: "rect", label: "Rectangle" },
  { id: "circle", label: "Cercle" },
  { id: "polygon", label: "Polygone" },
];

export const PLAYER_ROLES: Array<{ id: PlayerRole; label: string }> = [
  { id: "player", label: "Joueur" },
  { id: "goalkeeper", label: "Gardien" },
  { id: "coach", label: "Coach" },
];

export const KIND_LABELS: Record<ElementKind, string> = {
  flatCone: "Coupelle",
  tallCone: "Cône haut",
  pole: "Piquet",
  ladder: "Échelle de rythme",
  hoop: "Cerceau",
  miniGoal: "Mini-but",
  goal: "But",
  mannequin: "Mannequins",
  player: "Joueur",
  ball: "Ballon",
  arrow: "Flèche",
  zone: "Zone",
  text: "Texte",
  step: "Étape",
};

/** Espacement entre deux barreaux d'échelle (m) */
export const LADDER_RUNG_SPACING = 0.45;
export const LADDER_WIDTH = 0.5;

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

/** Élément de palette : un modèle d'élément sans position ni identifiant */
export type ElementTemplate = { [K in TrainingElement as K["kind"]]: Omit<K, "id" | "x" | "y" | "rotation"> }[TrainingElement["kind"]];

export interface PaletteItem {
  id: string;
  label: string;
  group: "equipment" | "players" | "annotations";
  /** Éléments posés par un simple appui sur le terrain */
  template?: ElementTemplate;
  /** Outils de tracé (flèches, zones) : posés par glissement sur le terrain */
  drawTool?: { kind: "arrow"; style: ArrowStyle } | { kind: "zone"; shape: ZoneShape };
}

const cone = (id: string): PaletteItem => {
  const c = CONE_COLORS.find((x) => x.id === id)!;
  return { id: `flatCone-${id}`, label: `Coupelle ${c.label.toLowerCase()}`, group: "equipment", template: { kind: "flatCone", color: c.hex } };
};

export const PALETTE: PaletteItem[] = [
  cone("yellow"),
  cone("red"),
  cone("blue"),
  cone("orange"),
  cone("white"),
  { id: "tallCone", label: "Cône haut", group: "equipment", template: { kind: "tallCone", color: "#f97316" } },
  { id: "pole", label: "Piquet", group: "equipment", template: { kind: "pole", color: "#facc15", height: 1.5 } },
  { id: "ladder", label: "Échelle de rythme", group: "equipment", template: { kind: "ladder", rungs: 8 } },
  { id: "hoop", label: "Cerceau", group: "equipment", template: { kind: "hoop", color: "#ef4444", diameter: 0.7 } },
  { id: "miniGoal", label: "Mini-but", group: "equipment", template: { kind: "miniGoal", size: 1.5 } },
  { id: "goal", label: "But", group: "equipment", template: { kind: "goal", size: 7.32 } },
  { id: "mannequin", label: "Mur / mannequins", group: "equipment", template: { kind: "mannequin", count: 4 } },
  { id: "ball", label: "Ballon", group: "equipment", template: { kind: "ball" } },

  { id: "player-a", label: "Joueur (chasuble verte)", group: "players", template: { kind: "player", color: "#00E599", role: "player" } },
  { id: "player-b", label: "Joueur (chasuble orange)", group: "players", template: { kind: "player", color: "#fb923c", role: "player" } },
  { id: "goalkeeper", label: "Gardien", group: "players", template: { kind: "player", color: "#e3f84a", role: "goalkeeper" } },
  { id: "coach", label: "Coach", group: "players", template: { kind: "player", color: "#1e293b", role: "coach" } },

  { id: "arrow-run", label: "Course sans ballon", group: "annotations", drawTool: { kind: "arrow", style: "run" } },
  { id: "arrow-dribble", label: "Conduite de balle", group: "annotations", drawTool: { kind: "arrow", style: "dribble" } },
  { id: "arrow-pass", label: "Passe", group: "annotations", drawTool: { kind: "arrow", style: "pass" } },
  { id: "arrow-shot", label: "Tir", group: "annotations", drawTool: { kind: "arrow", style: "shot" } },
  { id: "zone-rect", label: "Zone rectangle", group: "annotations", drawTool: { kind: "zone", shape: "rect" } },
  { id: "zone-circle", label: "Zone cercle", group: "annotations", drawTool: { kind: "zone", shape: "circle" } },
  { id: "zone-polygon", label: "Zone polygone", group: "annotations", drawTool: { kind: "zone", shape: "polygon" } },
  { id: "text", label: "Texte", group: "annotations", template: { kind: "text", text: "Consigne", color: "#ffffff", size: 1.6 } },
  { id: "step", label: "Numéro d'étape", group: "annotations", template: { kind: "step", value: 1, color: "#facc15" } },
];

export const PALETTE_GROUPS: Array<{ id: PaletteItem["group"]; label: string }> = [
  { id: "equipment", label: "Matériel" },
  { id: "players", label: "Joueurs" },
  { id: "annotations", label: "Annotations" },
];

let idCounter = 0;
export const newElementId = (kind: string) =>
  `${kind}_${Date.now().toString(36)}_${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Crée un élément à partir d'un modèle de palette */
export function createElement(template: ElementTemplate, x: number, y: number, rotation = 0): TrainingElement {
  return { ...template, id: newElementId(template.kind), x, y, rotation } as TrainingElement;
}

/** Équipements pouvant être posés en série (outil « série ») */
export const SERIES_ITEMS = PALETTE.filter(
  (p) => p.template && ["flatCone", "tallCone", "pole", "hoop", "ball", "mannequin", "player", "miniGoal"].includes(p.template.kind)
);
