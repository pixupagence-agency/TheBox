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

/** Repère du terrain sur lequel on cale les 4 poignées de perspective */
export type PitchRefId = "full" | "halfLeft" | "halfRight" | "boxLeft" | "boxRight";

/**
 * Repères tactiques posés sur la vidéo en perspective : le terrain (105 × 68 m) est calé sur l'image
 * par 4 poignées placées sur les coins d'un repère connu (homographie terrain → image).
 */
export interface PitchOverlay {
  ref: PitchRefId;
  /** Coins du repère dans l'image (normalisés) : [loin-gauche, loin-droite, près-droite, près-gauche] → x0, y0, … x3, y3 */
  quad: number[];
  /** 5 couloirs (latéraux, demi-espaces, axe) */
  zones: boolean;
  /** 3 zones dans la longueur (défense, milieu, attaque) */
  thirds: boolean;
  /** L'équipe attaque vers la gauche de l'image (défense à droite) */
  attackLeft?: boolean;
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
  /** Couloirs / zones du terrain calés en perspective (absent tant qu'ils n'ont jamais été affichés) */
  pitchOverlay?: PitchOverlay;
  /** Vignette (data URL JPEG) ou URL d'aperçu */
  thumbnail?: string;
  /** Extrait : séquence d'origine (la vidéo est partagée, seule la plage Entrée → Sortie est gardée) */
  parentId?: string;
  parentTitle?: string;
}

/** Image extraite d'une séquence (image annotée), rangée dans la bibliothèque */
export interface LibraryImage {
  id: string;
  version: 1;
  title: string;
  createdAt: string;
  /** Séquence et instant d'origine */
  sequenceId: string;
  sequenceTitle: string;
  time: number;
  fps: number;
  width: number;
  height: number;
  tags: SequenceTags;
  /** Vignette (data URL JPEG) ; l'image complète est stockée à part */
  thumbnail: string;
}

export const emptyTags = (): SequenceTags => ({ players: [], custom: [] });
