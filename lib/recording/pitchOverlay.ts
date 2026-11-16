// Module Recording : couloirs et zones du terrain posés sur la vidéo, en perspective.
// Le terrain réel (105 × 68 m, ligne de touche éloignée en haut, origine au coin loin-gauche) est relié à l'image
// par une homographie calculée à partir de 4 poignées placées sur les coins d'un repère connu du terrain.
// Tout est tracé en mètres puis projeté : les lignes restent droites et fuient comme celles de la pelouse.
import { FOOTBALL_THIRDS_COLOR, FOOTBALL_ZONE_BOUNDS } from "@/lib/gameFormats";
import type { Rect } from "./draw";
import type { PitchOverlay, PitchRefId } from "./types";

export const PITCH_L = 105;
export const PITCH_W = 68;

type Pt = [number, number];

/** Repères proposés pour le calage : coins [loin-gauche, loin-droite, près-droite, près-gauche] en mètres */
export const PITCH_REFS: Array<{ id: PitchRefId; label: string; hint: string; corners: Pt[] }> = [
  { id: "boxLeft", label: "Surface gauche", hint: "4 coins de la surface de réparation de gauche", corners: [[0, 13.84], [16.5, 13.84], [16.5, 54.16], [0, 54.16]] },
  { id: "boxRight", label: "Surface droite", hint: "4 coins de la surface de réparation de droite", corners: [[88.5, 13.84], [105, 13.84], [105, 54.16], [88.5, 54.16]] },
  { id: "halfLeft", label: "Moitié gauche", hint: "coins de la moitié gauche (ligne de but et ligne médiane)", corners: [[0, 0], [52.5, 0], [52.5, 68], [0, 68]] },
  { id: "halfRight", label: "Moitié droite", hint: "coins de la moitié droite (ligne médiane et ligne de but)", corners: [[52.5, 0], [105, 0], [105, 68], [52.5, 68]] },
  { id: "full", label: "Terrain entier", hint: "4 coins du terrain", corners: [[0, 0], [105, 0], [105, 68], [0, 68]] },
];

export const pitchRef = (id: PitchRefId) => PITCH_REFS.find((r) => r.id === id) || PITCH_REFS[0];

/** Calage de départ : un trapèze au centre de l'image, à ajuster sur la vidéo */
export const defaultPitchOverlay = (): PitchOverlay => ({
  ref: "halfLeft",
  quad: [0.3, 0.32, 0.7, 0.32, 0.88, 0.82, 0.12, 0.82],
  zones: false,
  thirds: false,
});

// ---------------------------------------------------------------------------
// Homographie
// ---------------------------------------------------------------------------

export interface Homography {
  h: number[];
  /** Signe du dénominateur du côté visible (devant la caméra) */
  sign: number;
  /** Plus petit dénominateur (en valeur absolue) aux coins du repère : seuil pour l'horizon */
  minDen: number;
}

/** Résout A·x = b (Gauss avec pivot partiel) ; null si le système est dégénéré */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** Homographie qui envoie les 4 points `src` (m) sur les 4 points `dst` (px) */
export function computeHomography(src: Pt[], dst: Pt[]): Homography | null {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [X, Y] = src[i];
    const [u, v] = dst[i];
    A.push([X, Y, 1, 0, 0, 0, -u * X, -u * Y]); b.push(u);
    A.push([0, 0, 0, X, Y, 1, -v * X, -v * Y]); b.push(v);
  }
  const s = solve(A, b);
  if (!s || s.some((v) => !Number.isFinite(v))) return null;
  const h = [...s, 1];
  const dens = src.map(([X, Y]) => h[6] * X + h[7] * Y + 1);
  // Repère valide : ses 4 coins sont du même côté de l'horizon
  if (!(dens.every((d) => d > 0) || dens.every((d) => d < 0))) return null;
  return { h, sign: Math.sign(dens[0]), minDen: Math.min(...dens.map(Math.abs)) };
}

/** Point du terrain (m) → point de l'image (px), null s'il est derrière l'horizon */
export function project(H: Homography, X: number, Y: number): Pt | null {
  const { h } = H;
  const d = h[6] * X + h[7] * Y + 1;
  if (d * H.sign < H.minDen * 0.02) return null;
  const u = (h[0] * X + h[1] * Y + h[2]) / d;
  const v = (h[3] * X + h[4] * Y + h[5]) / d;
  if (Math.abs(u) > 1e5 || Math.abs(v) > 1e5) return null;
  return [u, v];
}

/** Homographie du calage, exprimée en pixels du rectangle de l'image */
export function overlayHomography(o: PitchOverlay, rect: Rect): Homography | null {
  const ref = pitchRef(o.ref);
  const dst: Pt[] = [0, 1, 2, 3].map((i) => [rect.x + o.quad[i * 2] * rect.w, rect.y + o.quad[i * 2 + 1] * rect.h]);
  return computeHomography(ref.corners, dst);
}

// ---------------------------------------------------------------------------
// Tracés
// ---------------------------------------------------------------------------

/** Ajoute au chemin un segment du terrain, échantillonné (coupé là où il passe derrière l'horizon) */
function tracePolyline(ctx: CanvasRenderingContext2D, H: Homography, pts: Pt[], steps = 40) {
  let pen = false;
  for (let s = 0; s < pts.length - 1; s++) {
    const [x0, y0] = pts[s];
    const [x1, y1] = pts[s + 1];
    for (let i = s === 0 ? 0 : 1; i <= steps; i++) {
      const t = i / steps;
      const p = project(H, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
      if (!p) { pen = false; continue; }
      if (pen) ctx.lineTo(p[0], p[1]);
      else { ctx.moveTo(p[0], p[1]); pen = true; }
    }
  }
}

/** Remplit un rectangle du terrain (ignoré s'il touche l'horizon) */
function fillPitchRect(ctx: CanvasRenderingContext2D, H: Homography, x0: number, y0: number, x1: number, y1: number) {
  const ring: Pt[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
  const out: Pt[] = [];
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < 24; i++) {
      const t = i / 24;
      const p = project(H, ring[s][0] + (ring[s + 1][0] - ring[s][0]) * t, ring[s][1] + (ring[s + 1][1] - ring[s][1]) * t);
      if (!p) return;
      out.push(p);
    }
  }
  ctx.beginPath();
  out.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
  ctx.closePath();
  ctx.fill();
}

/** Texte « posé » sur la pelouse : repère local affine de la perspective au point (X, Y) */
function groundText(ctx: CanvasRenderingContext2D, H: Homography, text: string, X: number, Y: number, sizeM: number, maxWidthM: number) {
  const p = project(H, X, Y);
  const px = project(H, X + 1, Y);
  const py = project(H, X, Y + 1);
  if (!p || !px || !py) return;
  const a = px[0] - p[0], b = px[1] - p[1], c = py[0] - p[0], d = py[1] - p[1];
  if (a * d - b * c <= 0) return;
  ctx.save();
  ctx.transform(a, b, c, d, p[0], p[1]);
  ctx.scale(0.1, 0.1); // police en dixièmes de mètre : évite les tailles de police minuscules
  ctx.font = `900 ${Math.round(sizeM * 10)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0, maxWidthM * 10);
  ctx.restore();
}

const inside = (p: Pt | null, r: Rect, m: number) => !!p && p[0] > r.x + m && p[0] < r.x + r.w - m && p[1] > r.y + m && p[1] < r.y + r.h - m;

/** Couloirs et zones affichés (calage fait) */
export function renderPitchOverlay(ctx: CanvasRenderingContext2D, o: PitchOverlay | undefined, rect: Rect) {
  if (!o || (!o.zones && !o.thirds)) return;
  const H = overlayHomography(o, rect);
  if (!H) return;
  const k = rect.w / 1000;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.lineCap = "butt";

  if (o.zones) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    for (let i = 1; i < FOOTBALL_ZONE_BOUNDS.length - 1; i += 2) {
      fillPitchRect(ctx, H, 0, PITCH_W * FOOTBALL_ZONE_BOUNDS[i], PITCH_L, PITCH_W * FOOTBALL_ZONE_BOUNDS[i + 1]);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = Math.max(1, 2.2 * k);
    ctx.setLineDash([12 * k, 8 * k]);
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 3 * k;
    ctx.beginPath();
    FOOTBALL_ZONE_BOUNDS.slice(1, -1).forEach((f) => tracePolyline(ctx, H, [[0, PITCH_W * f], [PITCH_L, PITCH_W * f]]));
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (o.thirds) {
    ctx.strokeStyle = FOOTBALL_THIRDS_COLOR;
    ctx.lineWidth = Math.max(1.5, 3.2 * k);
    ctx.setLineDash([14 * k, 9 * k]);
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 3 * k;
    ctx.beginPath();
    [1, 2].forEach((n) => tracePolyline(ctx, H, [[(PITCH_L * n) / 3, 0], [(PITCH_L * n) / 3, PITCH_W]]));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    // Libellés couchés sur la pelouse, à la première hauteur visible depuis la touche éloignée
    const labels = o.attackLeft ? ["Attaque", "Milieu", "Défense"] : ["Défense", "Milieu", "Attaque"];
    ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
    const third = PITCH_L / 3;
    labels.forEach((label, i) => {
      const xs = [0.5, 0.35, 0.65, 0.2, 0.8].map((f) => third * (i + f));
      for (const Y of [5, 12, 20, 30, 42, 56]) {
        const X = xs.find((x) => inside(project(H, x, Y), rect, 12 * k));
        if (X !== undefined) { groundText(ctx, H, label.toUpperCase(), X, Y, 5.5, third * 0.8); break; }
      }
    });
  }
  ctx.restore();
}

/** Calage en cours : lignes du terrain projetées (pour viser la pelouse), repère et poignées */
export function renderPitchCalibration(ctx: CanvasRenderingContext2D, o: PitchOverlay, rect: Rect, activeHandle: number | null) {
  const H = overlayHomography(o, rect);
  const pts = handlePoints(o, rect);
  ctx.save();
  if (H) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.strokeStyle = "rgba(250, 204, 21, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 2;
    ctx.beginPath();
    const rectM = (x0: number, y0: number, x1: number, y1: number) => tracePolyline(ctx, H, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]);
    rectM(0, 0, PITCH_L, PITCH_W);
    tracePolyline(ctx, H, [[52.5, 0], [52.5, 68]]);
    rectM(0, 13.84, 16.5, 54.16);
    rectM(PITCH_L - 16.5, 13.84, PITCH_L, 54.16);
    rectM(0, 24.84, 5.5, 43.16);
    rectM(PITCH_L - 5.5, 24.84, PITCH_L, 43.16);
    const circle: Pt[] = Array.from({ length: 49 }, (_, i) => [52.5 + 9.15 * Math.cos((i / 48) * Math.PI * 2), 34 + 9.15 * Math.sin((i / 48) * Math.PI * 2)]);
    tracePolyline(ctx, H, circle, 2);
    ctx.stroke();
    ctx.restore();
  }
  // Repère calé : quadrilatère des poignées
  ctx.strokeStyle = H ? "#FF5A4E" : "#ef4444";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p[0], p[1], activeHandle === i ? 11 : 9, 0, Math.PI * 2);
    ctx.fillStyle = activeHandle === i ? "#FF5A4E" : "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FF5A4E";
    ctx.stroke();
    ctx.fillStyle = activeHandle === i ? "#ffffff" : "#FF5A4E";
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), p[0], p[1] + 0.5);
  });
  ctx.restore();
}

/** Poignées du calage en px */
export const handlePoints = (o: PitchOverlay, rect: Rect): Pt[] =>
  [0, 1, 2, 3].map((i) => [rect.x + o.quad[i * 2] * rect.w, rect.y + o.quad[i * 2 + 1] * rect.h]);

/** Poignée sous le pointeur (-1 si aucune) ; rayon large pour le tactile */
export function hitHandle(o: PitchOverlay, rect: Rect, px: number, py: number): number {
  let best = -1;
  let bestD = 24;
  handlePoints(o, rect).forEach((p, i) => {
    const d = Math.hypot(p[0] - px, p[1] - py);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}
