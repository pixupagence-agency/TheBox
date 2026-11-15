// Module Recording : vocabulaire des tags (phases de jeu, coups de pied arrêtés) et outils de dessin.
import type { DrawTool } from "./types";

export const GAME_PHASES = [
  "Construction",
  "Attaque placée",
  "Finition",
  "Transition offensive",
  "Transition défensive",
  "Pressing",
  "Bloc défensif",
  "Défense de surface",
];

export const SET_PIECES = [
  "Corner offensif",
  "Corner défensif",
  "Coup franc direct",
  "Coup franc indirect",
  "Penalty",
  "Touche",
  "Engagement",
  "Sortie de but",
];

export const DRAW_COLORS: Array<{ id: string; label: string; hex: string }> = [
  { id: "yellow", label: "Jaune", hex: "#facc15" },
  { id: "white", label: "Blanc", hex: "#ffffff" },
  { id: "coral", label: "Corail", hex: "#ff5a4e" },
  { id: "cyan", label: "Cyan", hex: "#22d3ee" },
  { id: "green", label: "Vert", hex: "#4ade80" },
  { id: "blue", label: "Bleu", hex: "#60a5fa" },
];

export const DRAW_WIDTHS: Array<{ value: number; label: string }> = [
  { value: 3, label: "Fin" },
  { value: 5, label: "Moyen" },
  { value: 8, label: "Épais" },
];

export const TOOL_LABELS: Record<DrawTool, string> = {
  arrow: "Flèche",
  curve: "Courbe",
  circle: "Cercle joueur",
  free: "Tracé libre",
  text: "Texte",
  spotlight: "Spotlight",
};

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.5, 2];

export const FPS_OPTIONS = [25, 30, 50, 60];
