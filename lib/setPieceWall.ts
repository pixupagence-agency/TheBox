// Mur sur coup franc (football) : composition, placement et orientation sur le tableau tactique.
// Le mur est un jeton du terrain (type « wall ») : sa position est en % du terrain affiché, comme les joueurs.
// Les joueurs qui le composent sont les joueurs du terrain glissés dessus : ils portent leur place dans le mur
// (wallSlot) et sont alors affichés dans le mur au lieu d'être affichés seuls.
import { getFootballFieldRect, getSmallPitchSpec, smallPitchBox } from "./gameFormats";

export const WALL_MIN = 1;
export const WALL_MAX = 7;
export const WALL_DEFAULT = 4;

export type WallTeam = "home" | "away";

/** Équipe d'un joueur (mon équipe = player_a, adversaire = player_b) ; null pour le reste */
export const playerWallTeam = (type: string): WallTeam | null => (type === "player_a" ? "home" : type === "player_b" ? "away" : null);

/** Angle de la ligne du mur : angle choisi par l'utilisateur, sinon face au ballon */
export function effectiveWallAngle(
  wall: { x: number; y: number; wallAngle?: number },
  ball: { x: number; y: number } | null,
  sport: string,
  format?: string | null
): number {
  return typeof wall.wallAngle === "number" ? wall.wallAngle : wallAngleDeg(wall, ball, sport, format);
}

/** Angle ramené dans ]-180, 180] et arrondi au pas donné */
export const normalizeAngle = (deg: number, step = 1) => {
  const a = Math.round(deg / step) * step;
  return ((((a + 180) % 360) + 360) % 360) - 180;
};

/** Postes préférés pour l'attribution rapide du mur (joueurs grands et habitués aux duels), gardien exclu */
export const WALL_PREFERRED_ROLES = ["DC", "MDC", "BU", "AC", "MC", "DD", "DG", "MOC"];
const GOALKEEPER_ROLES = ["GB", "GK", "G", "GARDIEN"];
export const isGoalkeeperRole = (role?: string) => GOALKEEPER_ROLES.includes((role || "").toUpperCase().trim());

/** Terrain affiché (marges comprises) en mètres, en paysage */
function pitchBoxMeters(sport: string, format?: string | null): { W: number; H: number } {
  const small = getSmallPitchSpec(sport, format);
  return small ? smallPitchBox(small) : { W: 110, H: 73 };
}

/** Distance réglementaire du mur au ballon (m) : 9,15 m à 11, 6 m à 8, 5 m à 5 */
export function wallDistanceMeters(sport: string, format?: string | null): number {
  const small = getSmallPitchSpec(sport, format);
  if (!small) return 9.15;
  return small.length <= 45 ? 5 : 6;
}

/**
 * Angle (degrés, sens horaire, repère paysage) de la ligne du mur : perpendiculaire à la direction du ballon,
 * pour que le mur fasse face au tireur. Sans ballon, le mur est vertical (face à un tir venant de l'axe).
 */
export function wallAngleDeg(wall: { x: number; y: number }, ball: { x: number; y: number } | null, sport: string, format?: string | null): number {
  if (!ball) return 90;
  const { W, H } = pitchBoxMeters(sport, format);
  const dx = ((ball.x - wall.x) / 100) * W;
  const dy = ((ball.y - wall.y) / 100) * H;
  if (Math.hypot(dx, dy) < 0.5) return 90;
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

/**
 * Position du mur : à la distance réglementaire du ballon, sur la ligne ballon → centre du but défendu
 * (mon équipe défend le but de gauche, l'adversaire celui de droite).
 */
export function wallPlacement(ball: { x: number; y: number } | null, team: WallTeam, sport: string, format?: string | null): { x: number; y: number } {
  const field = getFootballFieldRect(sport, format);
  const goal = { x: team === "home" ? field.x * 100 : (field.x + field.w) * 100, y: 50 };
  if (!ball) return { x: team === "home" ? 22 : 78, y: 50 };
  const { W, H } = pitchBoxMeters(sport, format);
  const dxM = ((goal.x - ball.x) / 100) * W;
  const dyM = ((goal.y - ball.y) / 100) * H;
  const dist = Math.hypot(dxM, dyM);
  const d = wallDistanceMeters(sport, format);
  // Ballon déjà tout près du but : mur à mi-chemin
  const k = dist > d + 1 ? d / dist : 0.5;
  return {
    x: Math.max(1, Math.min(99, ball.x + ((dxM * k) / W) * 100)),
    y: Math.max(1, Math.min(99, ball.y + ((dyM * k) / H) * 100)),
  };
}
