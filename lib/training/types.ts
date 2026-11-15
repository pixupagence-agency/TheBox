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
  | "hurdle"
  | "numberCone"
  | "popupGoal"
  | "rebounder"
  | "net"
  | "ballBag"
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
export interface PoleElement extends BaseElement { kind: "pole"; color: string; /** hauteur (m) */ height: number; /** piquet avec drapeau */ flag?: boolean }
export interface LadderElement extends BaseElement { kind: "ladder"; rungs: number }
export interface HoopElement extends BaseElement { kind: "hoop"; color: string; /** diamètre (m) */ diameter: number }
export interface MiniGoalElement extends BaseElement { kind: "miniGoal"; /** largeur (m) */ size: number }
export interface GoalElement extends BaseElement { kind: "goal"; /** largeur (m) : 7,32 / 6 / 5 / 3 */ size: number }
export interface MannequinElement extends BaseElement { kind: "mannequin"; count: number }
/** Haie de coordination : largeur 0,9 m, hauteur 15 / 30 / 50 cm */
export interface HurdleElement extends BaseElement { kind: "hurdle"; color: string; /** hauteur (m) */ height: number }
/** Plot (coupelle) numéroté */
export interface NumberConeElement extends BaseElement { kind: "numberCone"; color: string; value: number }
/** But pliable (pop-up) */
export interface PopupGoalElement extends BaseElement { kind: "popupGoal"; /** largeur (m) */ size: number }
/** Rebondisseur (cadre à filet tendu) */
export interface RebounderElement extends BaseElement { kind: "rebounder"; /** largeur (m) */ size: number }
/** Filet de tennis-ballon / mini-filet */
export interface NetElement extends BaseElement { kind: "net"; /** longueur (m) */ length: number }
/** Réserve de ballons (sac ou caisse) */
export interface BallBagElement extends BaseElement { kind: "ballBag"; count: number }

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
  | HurdleElement
  | NumberConeElement
  | PopupGoalElement
  | RebounderElement
  | NetElement
  | BallBagElement
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
  hurdle: "equipment",
  numberCone: "equipment",
  popupGoal: "equipment",
  rebounder: "equipment",
  net: "equipment",
  ballBag: "equipment",
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
