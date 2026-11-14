// Module Training : modèle de données d'un schéma d'atelier.
// Toutes les positions et tailles sont en MÈTRES, origine en haut à gauche de l'aire dessinée
// (x vers la droite, le long de la longueur ; y vers le bas, le long de la largeur).
// Ce même état alimentera la vue 2D (phase 1) et la vue 3D (phase 2).

export type PitchFormatId = "foot11" | "foot8" | "foot5" | "half" | "quarter" | "free";

export interface PitchConfig {
  format: PitchFormatId;
  /** Longueur de l'aire de jeu (m), axe x */
  length: number;
  /** Largeur de l'aire de jeu (m), axe y */
  width: number;
}

export type LayerId = "equipment" | "players" | "annotations";

export type EquipmentKind =
  | "flatCone"
  | "tallCone"
  | "pole"
  | "ladder"
  | "hoop"
  | "miniGoal"
  | "goal"
  | "mannequin"
  | "player"
  | "ball";

export type AnnotationKind = "arrow" | "zone" | "text" | "step";

export type ElementKind = EquipmentKind | AnnotationKind;

interface BaseElement {
  id: string;
  kind: ElementKind;
  /** Position (m) */
  x: number;
  y: number;
  /** Rotation en degrés, sens horaire */
  rotation: number;
  locked?: boolean;
}

export interface FlatConeElement extends BaseElement { kind: "flatCone"; color: string }
export interface TallConeElement extends BaseElement { kind: "tallCone"; color: string }
export interface PoleElement extends BaseElement { kind: "pole"; color: string; /** hauteur (m) */ height: number }
export interface LadderElement extends BaseElement { kind: "ladder"; rungs: number }
export interface HoopElement extends BaseElement { kind: "hoop"; color: string; /** diamètre (m) */ diameter: number }
export interface MiniGoalElement extends BaseElement { kind: "miniGoal"; /** largeur (m) */ size: number }
export interface GoalElement extends BaseElement { kind: "goal"; /** largeur (m) : 7,32 / 6 / 5 / 3 */ size: number }
export interface MannequinElement extends BaseElement { kind: "mannequin"; count: number }

export type PlayerRole = "player" | "goalkeeper" | "coach";
export interface PlayerElement extends BaseElement {
  kind: "player";
  /** Couleur de chasuble */
  color: string;
  number?: number;
  name?: string;
  /** Joueur de l'effectif existant (identifiant de TeamRosterPlayer) */
  rosterId?: string;
  role: PlayerRole;
}
export interface BallElement extends BaseElement { kind: "ball" }

export type ArrowStyle = "run" | "dribble" | "pass" | "shot";
export interface ArrowElement extends BaseElement {
  kind: "arrow";
  style: ArrowStyle;
  color: string;
  /** Points relatifs à (x, y), en mètres : [x0, y0, x1, y1, ...] */
  points: number[];
}

export type ZoneShape = "rect" | "circle" | "polygon";
export interface ZoneElement extends BaseElement {
  kind: "zone";
  shape: ZoneShape;
  color: string;
  label?: string;
  /** rect : largeur / hauteur (m) ; circle : width = diamètre */
  width: number;
  height: number;
  /** polygon : sommets relatifs à (x, y) */
  points?: number[];
}
export interface TextElement extends BaseElement { kind: "text"; text: string; color: string; /** taille (m) */ size: number }
export interface StepElement extends BaseElement { kind: "step"; value: number; color: string }

export type TrainingElement =
  | FlatConeElement
  | TallConeElement
  | PoleElement
  | LadderElement
  | HoopElement
  | MiniGoalElement
  | GoalElement
  | MannequinElement
  | PlayerElement
  | BallElement
  | ArrowElement
  | ZoneElement
  | TextElement
  | StepElement;

export interface TrainingDiagram {
  version: 1;
  pitch: PitchConfig;
  elements: TrainingElement[];
}

export const LAYER_OF: Record<ElementKind, LayerId> = {
  flatCone: "equipment",
  tallCone: "equipment",
  pole: "equipment",
  ladder: "equipment",
  hoop: "equipment",
  miniGoal: "equipment",
  goal: "equipment",
  mannequin: "equipment",
  ball: "equipment",
  player: "players",
  arrow: "annotations",
  zone: "annotations",
  text: "annotations",
  step: "annotations",
};

export const LAYER_LABELS: Record<LayerId, string> = {
  equipment: "Matériel",
  players: "Joueurs",
  annotations: "Annotations",
};
