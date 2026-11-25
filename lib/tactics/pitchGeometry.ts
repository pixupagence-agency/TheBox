// Tableau tactique : géométrie du terrain (ballon aimanté, courbes fléchées, proportions par sport).
import { getFormatPitchRatio } from "@/lib/gameFormats";
import type { Token } from "./types";

/** Distance (px à l'écran) sous laquelle le ballon est attiré par un joueur */
export const BALL_MAGNET_PX = 36;

/** Retire l'aimantation d'un ballon (il redevient libre) */
export const detachBall = (t: Token): Token => {
  if (!t.ballCarrierId) return t;
  const { ballCarrierId: _c, ballOffsetX: _x, ballOffsetY: _y, ...rest } = t;
  return rest;
};

/** Courbe de Bézier fléchée (pleine ou en pointillé) : points = [départ, contrôle 1, contrôle 2, arrivée] */
export const isCurveTool = (tool: string) => tool === "curve-arrow" || tool === "curve-arrow-dashed";

/** Opacité du remplissage d'une zone rectangulaire (couleur du trait, presque invisible) */
export const ZONE_FILL_ALPHA = 0.12;

export type Pt = { x: number; y: number };

/**
 * Les 4 points (en pixels) d'une courbe. Une courbe en cours de tracé n'a que départ et arrivée :
 * ses points de contrôle sont alors placés pour former un arc léger, côté gauche du sens de tracé.
 */
export const curvePointsPx = (pts: Pt[]): [Pt, Pt, Pt, Pt] => {
  const p0 = pts[0];
  const p3 = pts[pts.length - 1];
  if (pts.length >= 4) return [p0, pts[1], pts[2], p3];
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  const bend = 0.3;
  const nx = dy * bend;
  const ny = -dx * bend;
  return [
    p0,
    { x: p0.x + dx * 0.25 + nx, y: p0.y + dy * 0.25 + ny },
    { x: p0.x + dx * 0.75 + nx, y: p0.y + dy * 0.75 + ny },
    p3,
  ];
};

/** Point d'une Bézier cubique à t ∈ [0, 1] */
export const bezierAt = ([a, b, c, d]: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
};

/** Trace une courbe fléchée sur un canvas (points déjà en pixels) */
export const strokeCurveArrow = (ctx: CanvasRenderingContext2D, ptsPx: Pt[], dashed: boolean, dash: number[], headLen: number) => {
  const [a, b, c, d] = curvePointsPx(ptsPx);
  // Direction de la pointe : tangente en fin de courbe (dernier point de contrôle distinct de l'arrivée)
  const from = Math.hypot(d.x - c.x, d.y - c.y) > 1 ? c : Math.hypot(d.x - b.x, d.y - b.y) > 1 ? b : a;
  const angle = Math.atan2(d.y - from.y, d.x - from.x);
  // La ligne s'arrête dans la pointe pour ne pas dépasser de la flèche
  const endX = d.x - Math.cos(angle) * headLen * 0.6;
  const endY = d.y - Math.sin(angle) * headLen * 0.6;
  ctx.beginPath();
  ctx.setLineDash(dashed ? dash : []);
  ctx.moveTo(a.x, a.y);
  ctx.bezierCurveTo(b.x, b.y, c.x, c.y, endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(d.x, d.y);
  ctx.lineTo(d.x - headLen * Math.cos(angle - Math.PI / 6), d.y - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(d.x - headLen * Math.cos(angle + Math.PI / 6), d.y - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
};

export const getSportRatioNum = (sport: string, format?: string): number => {
  const formatRatio = getFormatPitchRatio(sport, format);
  if (formatRatio) return formatRatio;
  if (sport === "basketball") return 28 / 15; // 1.866 (matches 28x15 viewBox)
  if (sport === "rugby") return 144 / 70; // 2.057 (matches 144x70 viewBox)
  if (sport === "handball") return 40 / 20; // 2.0 (matches 40x20 viewBox)
  return 110 / 73; // football standard FIFA ratio with 2.5m perimeter (~1.5068, matches 110x73 viewBox exactly)
};
