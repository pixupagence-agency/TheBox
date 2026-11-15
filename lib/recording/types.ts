// Module Recording : modèle de données d'une séquence vidéo annotée.
// Les tracés sont en coordonnées NORMALISÉES (0 → 1) dans l'image de la vidéo, pour rester justes
// quelle que soit la taille d'affichage (ordinateur, tablette, export).

export type DrawTool = "arrow" | "curve" | "circle" | "free" | "text" | "spotlight";

/** Outils de la scène : dessin, sélection, suivi de joueur */
export type StageTool = DrawTool | "select" | "track";

export interface Shape {
  id: string;
  tool: DrawTool;
  color: string;
  /** Épaisseur de base (px pour une image de 1000 px de large) */
  width: number;
  /** Points normalisés [x0, y0, x1, y1, …] */
  points: number[];
  dashed?: boolean;
  text?: string;
}

/** Arrêt sur image : un instant de la vidéo et ses consignes dessinées */
export interface Freeze {
  id: string;
  /** Instant (s) */
  time: number;
  shapes: Shape[];
  /** La lecture s'arrête automatiquement sur cet instant */
  autoPause: boolean;
  label?: string;
}

/** Position d'un joueur suivi à un instant (coordonnées normalisées) */
export interface TrackKey {
  t: number;
  x: number;
  y: number;
}

/** Suivi d'un joueur : un marqueur qui le suit pendant l'action (positions interpolées entre les clés) */
export interface Track {
  id: string;
  /** Nom affiché au-dessus du joueur (ex. « 7 · Dupont ») */
  label?: string;
  color: string;
  style: "ring" | "spotlight";
  /** Rayon du marqueur, rapporté à la largeur de l'image */
  size: number;
  /** Traînée des 2 dernières secondes */
  trail: boolean;
  keys: TrackKey[];
}

export type VideoSource =
  | { kind: "file"; videoId: string; fileName: string; mime: string }
  | { kind: "youtube"; ref: string; url: string }
  | { kind: "vimeo"; ref: string; url: string };

export interface SequenceTags {
  /** Joueurs concernés (noms de l'effectif) */
  players: string[];
  phase?: string;
  setPiece?: string;
  custom: string[];
}

export interface Sequence {
  id: string;
  version: 1;
  title: string;
  createdAt: string;
  updatedAt: string;
  source: VideoSource;
  /** Clip : points d'entrée / de sortie (s) */
  inPoint?: number;
  outPoint?: number;
  /** Images par seconde utilisées pour l'avance image par image */
  fps: number;
  tags: SequenceTags;
  notes?: string;
  freezes: Freeze[];
  /** Joueurs suivis (absent sur les séquences enregistrées avant l'outil de suivi) */
  tracks?: Track[];
  /** Vignette (data URL JPEG) ou URL d'aperçu */
  thumbnail?: string;
}

export const emptyTags = (): SequenceTags => ({ players: [], custom: [] });
