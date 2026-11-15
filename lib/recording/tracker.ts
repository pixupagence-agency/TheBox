// Module Recording : suivi automatique d'un joueur dans une vidéo importée (calcul local, rien n'est envoyé).
//
// Principe (famille des suiveurs « Staple » / « DAT ») :
// - chaque image est lue sur une copie cachée de la vidéo, en ne gardant qu'une FENÊTRE autour du joueur, remise
//   à une échelle où il mesure toujours ~40 px : un joueur minuscule en plan large garde tout son détail ;
// - apparence = gabarit couleur du joueur (corrélation normalisée pondérée : buste > jambes > pelouse)
//   + couleurs du joueur opposées à celles de son entourage (robuste aux changements de posture) ;
// - mouvement : la recherche se centre là où le joueur se dirige et un candidat qui s'écarte de la trajectoire
//   est pénalisé (évite de sauter sur un coéquipier qui croise) ;
// - joueur masqué : la position est extrapolée quelques images et le suivi reprend dès qu'il réapparaît ;
// - échelle réajustée en continu (zoom, joueur qui s'approche), position au sous-pixel puis lissée.
import type { TrackKey } from "./types";

export type TrackDirection = 1 | -1;

export interface AutoTrackProgress {
  /** Instant de l'image analysée (s) */
  t: number;
  /** Position trouvée (null : joueur masqué ou incertain, position extrapolée) */
  key: TrackKey | null;
  /** Ressemblance avec le joueur suivi (0 → 1) */
  confidence: number;
  /** Avancement (0 → 1) */
  progress: number;
  /** Copie de travail de la vidéo, calée sur l'image analysée (affichage du suivi en direct) */
  frame: HTMLVideoElement;
}

export interface AutoTrackOptions {
  /** Images par seconde utilisées pour avancer */
  fps: number;
  /** Position de départ (pieds du joueur) */
  from: TrackKey;
  /** Rayon du marqueur, rapporté à la largeur de l'image (indique la taille du joueur) */
  size: number;
  /** Instant limite (s) : après `from.t` en avant, avant en arrière */
  until: number;
  /** 1 : vers la suite de la vidéo, -1 : vers le début */
  direction?: TrackDirection;
  /** Une clé enregistrée toutes les N images */
  keyEvery?: number;
  isCancelled: () => boolean;
  onProgress?: (p: AutoTrackProgress) => void;
}

export interface AutoTrackResult {
  /** Positions lissées, sans la position de départ, dans l'ordre chronologique */
  keys: TrackKey[];
  reason: "end" | "lost" | "edge" | "cancel";
  /** Dernier instant où le joueur a été retrouvé avec certitude (s) */
  lastT: number;
  /** Dernière image analysée (s) : fin de la partie recalculée */
  endT: number;
}

/** Bornes du rayon de marqueur (rapporté à la largeur de l'image) */
export const TRACK_SIZE_MIN = 0.004;
export const TRACK_SIZE_MAX = 0.08;

// ---------------------------------------------------------------------------
// Géométrie (pixels de l'image de travail)
// ---------------------------------------------------------------------------
/** Hauteur canonique du joueur */
const P = 40;
/** Gabarit : tête (ligne 0) → pieds (ligne P) + 1 ligne sous les pieds */
const TW = 20;
const TH = P + 2;
const TN = TW * TH * 3;
/** Ancre (pieds) dans le gabarit */
const AX = (TW - 1) / 2;
const AY = P;
/** Marge autour de la zone de recherche : entourage du joueur (couleurs du fond) */
const MB = 12;
/** Boîte du corps (couleurs du joueur), dans le gabarit */
const CB_X0 = 5, CB_X1 = 15, CB_Y0 = 3, CB_Y1 = P - 2;
const CB_AREA = (CB_X1 - CB_X0) * (CB_Y1 - CB_Y0);
/** Rayon de recherche (px de travail) */
const R_MIN = Math.round(P * 0.33);
const R_MAX = Math.round(P * 0.9);
const SIDE_MAX = Math.max(TW, TH) + 2 * (R_MAX + MB) + 8;

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------
/** Poids des couleurs dans le score d'apparence */
const COLOR_WEIGHT = 0.4;
/** Pénalité d'écart à la position prédite (valeur à 1 écart type) */
const MOTION_WEIGHT = 0.1;
/** Corrélation minimale pour accepter une position */
const ACCEPT = 0.42;
/** Corrélation minimale pour adapter le modèle du joueur */
const UPDATE = 0.62;
/** Un autre candidat à moins de cet écart de score = situation ambiguë (coéquipier proche) */
const AMBIGUITY = 0.05;
const TEMPLATE_RATE = 0.08;
const COLOR_RATE = 0.05;
/** Part du gabarit de départ dans le gabarit courant (évite la dérive vers le décor) */
const ANCHOR_SHARE = 0.4;
/** Durée maximale d'extrapolation quand le joueur est masqué (s) */
const COAST_SECONDS = 0.7;
const SCALE_STEP = 1.05;

function waitFor(el: HTMLMediaElement, event: string, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("timeout")); }, timeoutMs);
    const ok = () => { cleanup(); resolve(); };
    const ko = () => { cleanup(); reject(new Error("error")); };
    const cleanup = () => { window.clearTimeout(timer); el.removeEventListener(event, ok); el.removeEventListener("error", ko); };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", ko, { once: true });
  });
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const binOf = (r: number, g: number, b: number) => ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);

// ---------------------------------------------------------------------------
// Image de travail : une fenêtre de la vidéo, remise à l'échelle
// ---------------------------------------------------------------------------
interface Work {
  W: number;
  H: number;
  /** R, G, B entrelacés */
  rgb: Float32Array;
  /** Case de couleur (16 niveaux par canal) */
  bins: Uint16Array;
  /** Pixels entièrement couverts par l'image vidéo : [vx0, vx1) × [vy0, vy1) */
  vx0: number;
  vy0: number;
  vx1: number;
  vy1: number;
  /** Pixel de travail i ↔ abscisse vidéo sx + (i + 0.5) / k */
  sx: number;
  sy: number;
  k: number;
}

class Grabber {
  readonly VW: number;
  readonly VH: number;
  private ctx: CanvasRenderingContext2D;
  private rgb = new Float32Array(SIDE_MAX * SIDE_MAX * 3);
  private bins = new Uint16Array(SIDE_MAX * SIDE_MAX);

  constructor(private source: HTMLVideoElement) {
    this.VW = source.videoWidth;
    this.VH = source.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = SIDE_MAX;
    canvas.height = SIDE_MAX;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas non supporté.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    this.ctx = ctx;
  }

  /** Fenêtre W × H dont le pixel (0, 0) correspond au point vidéo (sx, sy), à k px de travail par px vidéo */
  grab(sx: number, sy: number, k: number, W: number, H: number): Work | null {
    const { ctx, VW, VH } = this;
    const cx0 = Math.max(0, sx), cy0 = Math.max(0, sy);
    const cx1 = Math.min(VW, sx + W / k), cy1 = Math.min(VH, sy + H / k);
    if (cx1 - cx0 < 4 / k || cy1 - cy0 < 4 / k) return null;
    const dx = (cx0 - sx) * k, dy = (cy0 - sy) * k, dw = (cx1 - cx0) * k, dh = (cy1 - cy0) * k;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this.source, cx0, cy0, cx1 - cx0, cy1 - cy0, dx, dy, dw, dh);
    const data = ctx.getImageData(0, 0, W, H).data;
    const { rgb, bins } = this;
    for (let i = 0, j = 0, n = W * H; i < n; i++, j += 4) {
      const r = data[j], g = data[j + 1], b = data[j + 2];
      rgb[i * 3] = r;
      rgb[i * 3 + 1] = g;
      rgb[i * 3 + 2] = b;
      bins[i] = binOf(r, g, b);
    }
    return {
      W, H, rgb, bins, sx, sy, k,
      vx0: Math.ceil(dx - 1e-3), vy0: Math.ceil(dy - 1e-3),
      vx1: Math.floor(dx + dw + 1e-3), vy1: Math.floor(dy + dh + 1e-3),
    };
  }
}

/** Gabarit échantillonné autour de l'ancre (ax, ay) en px de travail ; s > 1 couvre une zone plus grande */
function extract(w: Work, ax: number, ay: number, s: number, out: Float32Array) {
  const { rgb, W } = w;
  const xlo = w.vx0, xhi = w.vx1 - 1, ylo = w.vy0, yhi = w.vy1 - 1;
  let o = 0;
  for (let b = 0; b < TH; b++) {
    const y = clamp(ay + (b - AY) * s, ylo, yhi);
    const y0 = Math.min(Math.floor(y), yhi - 1 < ylo ? ylo : yhi - 1);
    const fy = Math.min(1, y - y0);
    for (let a = 0; a < TW; a++) {
      const x = clamp(ax + (a - AX) * s, xlo, xhi);
      const x0 = Math.min(Math.floor(x), xhi - 1 < xlo ? xlo : xhi - 1);
      const fx = Math.min(1, x - x0);
      const i00 = (y0 * W + x0) * 3, i10 = i00 + W * 3;
      for (let c = 0; c < 3; c++, o++) {
        const top = rgb[i00 + c] + (rgb[i00 + 3 + c] - rgb[i00 + c]) * fx;
        const bot = rgb[i10 + c] + (rgb[i10 + 3 + c] - rgb[i10 + c]) * fx;
        out[o] = top + (bot - top) * fy;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Apparence : gabarit pondéré + couleurs joueur / entourage
// ---------------------------------------------------------------------------
class Template {
  /** Poids de chaque valeur (buste > jambes > bords ; pixels de pelouse atténués) */
  private wel = new Float32Array(TN);
  /** Gabarit de départ (ancre anti-dérive) et gabarit adaptatif */
  private anchor = new Float32Array(TN);
  private adapt = new Float32Array(TN);
  /** Gabarit courant centré et pondéré */
  private wtc = new Float32Array(TN);
  private wsum = 1;
  private tnorm = 1;

  constructor(patch: Float32Array, pixelWeights: Float32Array) {
    for (let p = 0; p < TW * TH; p++) {
      this.wel[p * 3] = this.wel[p * 3 + 1] = this.wel[p * 3 + 2] = pixelWeights[p];
    }
    this.anchor.set(patch);
    this.adapt.set(patch);
    this.refresh();
  }

  private refresh() {
    const { wel, anchor, adapt, wtc } = this;
    let sw = 0, s = 0;
    for (let e = 0; e < TN; e++) {
      const t = anchor[e] * ANCHOR_SHARE + adapt[e] * (1 - ANCHOR_SHARE);
      wtc[e] = t;
      sw += wel[e];
      s += wel[e] * t;
    }
    const mean = s / sw;
    let n = 0;
    for (let e = 0; e < TN; e++) {
      const d = wtc[e] - mean;
      wtc[e] = wel[e] * d;
      n += wel[e] * d * d;
    }
    this.wsum = sw;
    this.tnorm = n || 1;
  }

  update(patch: Float32Array, rate: number) {
    const { adapt } = this;
    for (let e = 0; e < TN; e++) adapt[e] += (patch[e] - adapt[e]) * rate;
    this.refresh();
  }

  /** Corrélation normalisée pondérée, gabarit posé avec son coin haut-gauche en (x0, y0) */
  score(w: Work, x0: number, y0: number): number {
    const { wel, wtc } = this;
    const img = w.rgb;
    const row = TW * 3;
    let s1 = 0, s2 = 0, c = 0, e = 0;
    for (let y = 0; y < TH; y++) {
      let p = ((y0 + y) * w.W + x0) * 3;
      const end = p + row;
      for (; p < end; p++, e++) {
        const v = img[p];
        const wv = wel[e] * v;
        s1 += wv;
        s2 += wv * v;
        c += wtc[e] * v;
      }
    }
    const varI = s2 - (s1 * s1) / this.wsum;
    // Zone presque uniforme (pelouse sans détail) : aucune information
    if (varI < 4 * this.wsum) return 0;
    return c / Math.sqrt(varI * this.tnorm);
  }

  /** Corrélation avec un gabarit déjà échantillonné */
  scorePatch(patch: Float32Array): number {
    const { wel, wtc } = this;
    let s1 = 0, s2 = 0, c = 0;
    for (let e = 0; e < TN; e++) {
      const v = patch[e];
      const wv = wel[e] * v;
      s1 += wv;
      s2 += wv * v;
      c += wtc[e] * v;
    }
    const varI = s2 - (s1 * s1) / this.wsum;
    if (varI < 4 * this.wsum) return 0;
    return c / Math.sqrt(varI * this.tnorm);
  }
}

class ColorModel {
  private fg = new Float32Array(4096);
  private bg = new Float32Array(4096);
  private tf = new Float32Array(4096);
  private tb = new Float32Array(4096);
  /** Probabilité « joueur » de chaque case de couleur */
  readonly lut = new Float32Array(4096);

  /** Couleurs du joueur (boîte du corps, gabarit en (x0, y0)) et de son entourage (reste de la fenêtre) */
  learn(w: Work, x0: number, y0: number, rate: number) {
    const { tf, tb, fg, bg } = this;
    tf.fill(0);
    tb.fill(0);
    let nf = 0, nb = 0;
    const ex0 = x0 - 2, ex1 = x0 + TW + 2, ey0 = y0 - 2, ey1 = y0 + TH + 2;
    for (let y = w.vy0; y < w.vy1; y++) {
      for (let x = w.vx0; x < w.vx1; x++) {
        const bin = w.bins[y * w.W + x];
        if (x >= x0 + CB_X0 && x < x0 + CB_X1 && y >= y0 + CB_Y0 && y < y0 + CB_Y1) { tf[bin]++; nf++; }
        else if (x < ex0 || x >= ex1 || y < ey0 || y >= ey1) { tb[bin]++; nb++; }
      }
    }
    if (!nf || !nb) return;
    for (let i = 0; i < 4096; i++) {
      fg[i] += (tf[i] / nf - fg[i]) * rate;
      bg[i] += (tb[i] / nb - bg[i]) * rate;
      this.lut[i] = (fg[i] + 1e-5) / (fg[i] + bg[i] + 2e-5);
    }
  }
}

/**
 * Ressemblance du joueur à l'échelle s (s > 1 : joueur plus grand que prévu), avec la meilleure position des pieds
 * autour de (ax, ay) : à une autre taille, le gabarit se cale un peu plus haut ou plus bas.
 */
function scaleFit(w: Work, tpl: Template, ax: number, ay: number, s: number, buf: Float32Array) {
  let best = { n: -Infinity, dx: 0, dy: 0 };
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      extract(w, ax + dx, ay + dy, s, buf);
      const n = tpl.scorePatch(buf);
      if (n > best.n) best = { n, dx, dy };
    }
  }
  return best;
}

/** Poids des pixels du gabarit : colonne centrale et buste privilégiés, pixels « pelouse » atténués */
function pixelWeights(patch: Float32Array, lut: Float32Array): Float32Array {
  const out = new Float32Array(TW * TH);
  for (let b = 0; b < TH; b++) {
    const v = (AY - b) / P; // 0 aux pieds, 1 en haut de la tête
    const wy = 0.45 + 0.55 * Math.exp(-(((v - 0.62) / 0.3) ** 2));
    for (let a = 0; a < TW; a++) {
      const u = (a - AX) / (TW / 2);
      const o = (b * TW + a) * 3;
      const bin = binOf(clamp(Math.round(patch[o]), 0, 255), clamp(Math.round(patch[o + 1]), 0, 255), clamp(Math.round(patch[o + 2]), 0, 255));
      out[b * TW + a] = Math.exp(-1.1 * u * u) * wy * (0.35 + 0.65 * lut[bin]);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Silhouette sous le clic : pieds et taille réels du joueur
// ---------------------------------------------------------------------------
interface Silhouette {
  /** Pieds (px vidéo) */
  x: number;
  y: number;
  /** Hauteur du joueur (px vidéo) */
  h: number;
}

/** Teinte (r, g normalisés), saturation et luminosité d'un pixel : repère les ombres portées sur la pelouse */
function chromaAt(rgb: Float32Array, i: number) {
  const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
  const s = r + g + b + 1;
  return { bin: Math.min(31, Math.floor((r / s) * 32)) * 32 + Math.min(31, Math.floor((g / s) * 32)), sat: (Math.max(r, g, b) - Math.min(r, g, b)) / s, lum: s / 3 };
}

/** Cherche la silhouette (pixels dont la couleur est absente du pourtour) qui contient le point (cx, cy) */
function silhouetteIn(w: Work, cx: number, cy: number): { x: number; y: number; h: number } | null {
  const { W, bins, rgb, vx0, vx1, vy0, vy1 } = w;
  const band = Math.round(P * 0.3);
  if (vx1 - vx0 < band * 3 || vy1 - vy0 < band * 3) return null;

  // 1) Couleurs du fond : bande le long du bord de la fenêtre
  const hist = new Float32Array(4096);
  const chroma = new Float32Array(32 * 32);
  let nb = 0, lumSum = 0;
  for (let y = vy0; y < vy1; y++) {
    for (let x = vx0; x < vx1; x++) {
      if (x >= vx0 + band && x < vx1 - band && y >= vy0 + band && y < vy1 - band) continue;
      const i = y * W + x;
      hist[bins[i]]++;
      const c = chromaAt(rgb, i);
      chroma[c.bin]++;
      lumSum += c.lum;
      nb++;
    }
  }
  const spread = spreadBins(hist);
  const rare = Math.max(2, nb * 0.004);
  const lumBg = lumSum / nb;

  // 2) Premier plan : couleur rare dans le fond, hors ombres (teinte de la pelouse, plus sombre)
  const n = w.W * w.H;
  const fg = new Uint8Array(n);
  for (let y = vy0; y < vy1; y++) {
    for (let x = vx0; x < vx1; x++) {
      const i = y * W + x;
      if (spread[bins[i]] >= rare) continue;
      const c = chromaAt(rgb, i);
      if (c.sat > 0.12 && c.lum < lumBg && chroma[c.bin] >= rare) continue;
      fg[i] = 1;
    }
  }
  // Pixels isolés = bruit
  const clean = new Uint8Array(n);
  for (let y = vy0 + 1; y < vy1 - 1; y++) {
    for (let x = vx0 + 1; x < vx1 - 1; x++) {
      const i = y * W + x;
      if (!fg[i]) continue;
      const around = fg[i - 1] + fg[i + 1] + fg[i - W] + fg[i + W] + fg[i - W - 1] + fg[i - W + 1] + fg[i + W - 1] + fg[i + W + 1];
      if (around >= 2) clean[i] = 1;
    }
  }

  // 3) Composante connexe (trous de 1-2 px tolérés) la plus présente autour du clic
  const label = new Int32Array(n);
  const stack = new Int32Array(n);
  const sx0 = Math.max(vx0, Math.round(cx - 0.2 * P)), sx1 = Math.min(vx1 - 1, Math.round(cx + 0.2 * P));
  const sy0 = Math.max(vy0, Math.round(cy - 0.7 * P)), sy1 = Math.min(vy1 - 1, Math.round(cy + 0.25 * P));
  let best: { id: number; seeds: number; minx: number; maxx: number; miny: number; maxy: number; count: number; touches: boolean } | null = null;
  let next = 1;
  for (let y = sy0; y <= sy1; y++) {
    for (let x = sx0; x <= sx1; x++) {
      const start = y * W + x;
      if (!clean[start] || label[start]) continue;
      const id = next++;
      let sp = 0;
      stack[sp++] = start;
      label[start] = id;
      const comp = { id, seeds: 0, minx: x, maxx: x, miny: y, maxy: y, count: 0, touches: false };
      while (sp) {
        const i = stack[--sp];
        const px = i % W, py = (i - px) / W;
        comp.count++;
        if (px >= sx0 && px <= sx1 && py >= sy0 && py <= sy1) comp.seeds++;
        if (px < comp.minx) comp.minx = px;
        if (px > comp.maxx) comp.maxx = px;
        if (py < comp.miny) comp.miny = py;
        if (py > comp.maxy) comp.maxy = py;
        if (px <= vx0 + 1 || px >= vx1 - 2 || py <= vy0 + 1 || py >= vy1 - 2) comp.touches = true;
        for (let dy = -2; dy <= 2; dy++) {
          const qy = py + dy;
          if (qy < vy0 || qy >= vy1) continue;
          for (let dx = -2; dx <= 2; dx++) {
            const qx = px + dx;
            if (qx < vx0 || qx >= vx1) continue;
            const q = qy * W + qx;
            if (clean[q] && !label[q]) { label[q] = id; stack[sp++] = q; }
          }
        }
      }
      if (!best || comp.seeds > best.seeds) best = comp;
    }
  }
  if (!best || best.touches) return null;

  // 4) Vraisemblance d'une silhouette de joueur
  const hc = best.maxy - best.miny + 1;
  const wc = best.maxx - best.minx + 1;
  if (hc < 0.3 * P || hc > 2.3 * P) return null;
  if (wc < 0.12 * hc || wc > 1.1 * hc) return null;
  if (best.count < 0.15 * wc * hc) return null;
  if (cx < best.minx - 0.15 * hc || cx > best.maxx + 0.15 * hc) return null;
  if (cy < best.miny + 0.35 * hc || cy > best.maxy + 0.3 * hc) return null;

  // Pieds : milieu des pixels du bas de la silhouette
  const xs: number[] = [];
  for (let y = Math.round(best.maxy - 0.2 * hc); y <= best.maxy; y++) {
    for (let x = best.minx; x <= best.maxx; x++) if (label[y * W + x] === best.id) xs.push(x);
  }
  xs.sort((a, b) => a - b);
  const fx = xs.length ? xs[xs.length >> 1] : (best.minx + best.maxx) / 2;
  return { x: fx, y: best.maxy + 0.5, h: hc };
}

/**
 * Repli quand la silhouette se confond avec une ligne du terrain ou un voisin : détecteur de tache multi-échelle.
 * On cherche la boîte « joueur » (taille, pieds) qui se détache le plus de son entourage immédiat sur la carte des
 * couleurs inhabituelles (une ligne fine pèse peu dans une moyenne), puis on affine tête et pieds rangée par rangée.
 */
function blobIn(w: Work, cx: number, cy: number): { x: number; y: number; h: number; contrast: number } | null {
  const { W, H, bins, rgb, vx0, vx1, vy0, vy1 } = w;
  const hist = new Float32Array(4096);
  const chroma = new Float32Array(32 * 32);
  let n = 0, lumSum = 0;
  for (let y = vy0; y < vy1; y++) {
    for (let x = vx0; x < vx1; x++) {
      const i = y * W + x;
      hist[bins[i]]++;
      const c = chromaAt(rgb, i);
      chroma[c.bin]++;
      lumSum += c.lum;
      n++;
    }
  }
  if (n < 400) return null;
  const common = spreadBins(hist);
  const lumBg = lumSum / n;
  // Probabilité « premier plan » : couleur rare dans la fenêtre (la pelouse occupe l'essentiel de la surface),
  // ombres exclues (teinte fréquente de la pelouse, en plus sombre)
  const W1 = W + 1;
  const ii = new Float64Array(W1 * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) {
      if (y >= vy0 && y < vy1 && x >= vx0 && x < vx1) {
        const i = y * W + x;
        const c = chromaAt(rgb, i);
        const shadow = c.sat > 0.12 && c.lum < lumBg && chroma[c.bin] >= n * 0.01;
        if (!shadow) row += 1 - Math.min(1, common[bins[i]] / (n * 0.01));
      }
      ii[(y + 1) * W1 + x + 1] = ii[y * W1 + x + 1] + row;
    }
  }
  const sum = (x0: number, y0: number, x1: number, y1: number) => ii[y1 * W1 + x1] - ii[y0 * W1 + x1] - ii[y1 * W1 + x0] + ii[y0 * W1 + x0];

  let best: { contrast: number; x: number; y: number; hb: number; wb: number } | null = null;
  for (const f of [0.5, 0.71, 1, 1.41, 2]) {
    const hb = f * P, wb = 0.32 * hb;
    const ystep = Math.max(1, hb / 16), xstep = Math.max(1, wb / 6);
    for (let fy = cy - 0.15 * hb; fy <= cy + 0.7 * hb; fy += ystep) {
      for (let x = cx - 0.3 * wb; x <= cx + 0.3 * wb; x += xstep) {
        const bx0 = Math.round(x - wb / 2), bx1 = Math.round(x + wb / 2), by0 = Math.round(fy - hb), by1 = Math.round(fy);
        const rx0 = Math.round(x - wb), rx1 = Math.round(x + wb), ry0 = Math.round(fy - 1.12 * hb), ry1 = Math.round(fy + 0.12 * hb);
        if (rx0 < vx0 || ry0 < vy0 || rx1 > vx1 || ry1 > vy1 || bx1 <= bx0 || by1 <= by0) continue;
        const inner = sum(bx0, by0, bx1, by1);
        const ai = (bx1 - bx0) * (by1 - by0);
        const ao = (rx1 - rx0) * (ry1 - ry0) - ai;
        const contrast = inner / ai - (sum(rx0, ry0, rx1, ry1) - inner) / ao;
        if (!best || contrast > best.contrast) best = { contrast, x, y: fy, hb, wb };
      }
    }
  }
  if (!best || best.contrast < 0.25) return null;

  // Affinage : on remonte / descend depuis le milieu de la boîte jusqu'à ce que la tache s'arrête
  const c0 = Math.max(vx0, Math.round(best.x - best.wb / 2)), c1 = Math.min(vx1, Math.round(best.x + best.wb / 2));
  const rowFill = (y: number) => (sum(c0, y, c1, y + 1)) / Math.max(1, c1 - c0);
  const mid = Math.round(best.y - best.hb / 2);
  let top = mid, bottom = mid;
  for (let y = mid, gap = 0; y >= vy0; y--) { if (rowFill(y) >= 0.12) { top = y; gap = 0; } else if (++gap > 1) break; }
  for (let y = mid, gap = 0; y < vy1; y++) { if (rowFill(y) >= 0.12) { bottom = y; gap = 0; } else if (++gap > 1) break; }
  const h = bottom - top + 1;
  if (h < 0.4 * best.hb || h > 1.6 * best.hb || h < 0.3 * P) return null;
  return { x: best.x, y: bottom + 0.5, h, contrast: best.contrast };
}

/** Lissage d'un histogramme de couleurs : chaque case reçoit la moitié de ses voisines (bruit, compression) */
function spreadBins(hist: Float32Array): Float32Array {
  const out = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) {
    if (!hist[i]) continue;
    out[i] += hist[i];
    const r = i >> 8, g = (i >> 4) & 15, b = i & 15;
    if (r > 0) out[i - 256] += hist[i] / 2;
    if (r < 15) out[i + 256] += hist[i] / 2;
    if (g > 0) out[i - 16] += hist[i] / 2;
    if (g < 15) out[i + 16] += hist[i] / 2;
    if (b > 0) out[i - 1] += hist[i] / 2;
    if (b < 15) out[i + 1] += hist[i] / 2;
  }
  return out;
}

/** Silhouette du joueur sous le point (X, Y) de la vidéo, en partant d'une taille supposée */
function locatePlayer(g: Grabber, X: number, Y: number, hint: number): Silhouette | null {
  const AW = 3 * P, AH = Math.round(3.4 * P);
  const cxw = AW / 2, cyw = 2.4 * P;
  const region = (h: number) => {
    const k = P / h;
    return g.grab(X - (cxw + 0.5) / k, Y - (cyw + 0.5) / k, k, AW, AH);
  };
  const toVideo = (w: Work, s: { x: number; y: number; h: number }) => ({ x: w.sx + (s.x + 0.5) / w.k, y: w.sy + (s.y + 0.5) / w.k, h: s.h / w.k });
  const attempt = (h: number) => {
    const w = region(h);
    const s = w && silhouetteIn(w, cxw, cyw);
    return w && s ? toVideo(w, s) : null;
  };
  const h0 = clamp(hint, 8, g.VH);
  let found = attempt(h0) || attempt(h0 / 2) || attempt(h0 / 4) || attempt(h0 * 2);
  if (!found) {
    // Joueur collé à une ligne ou à un voisin : détecteur de tache (de 1/8 à 2 fois la taille supposée)
    let best: (Silhouette & { contrast: number }) | null = null;
    for (const h of [h0, h0 / 4]) {
      const w = region(h);
      const b = w && blobIn(w, cxw, cyw);
      if (w && b && (!best || b.contrast > best.contrast)) best = { ...toVideo(w, b), contrast: b.contrast };
    }
    if (best) found = { x: best.x, y: best.y, h: best.h };
  }
  // Taille très différente de l'hypothèse : nouvelle mesure à la bonne échelle, plus précise
  if (found && (found.h > h0 * 1.4 || found.h < h0 / 1.4)) found = attempt(found.h) || found;
  return found;
}

/**
 * Mesure le joueur sous le point cliqué sur l'image affichée : position de ses pieds et rayon de marqueur
 * adapté à sa taille. null si la silhouette n'est pas nette (joueurs collés, ligne, image protégée…).
 */
export function measurePlayer(video: HTMLVideoElement, at: { x: number; y: number }, size: number): { x: number; y: number; size: number } | null {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return null;
  try {
    const g = new Grabber(video);
    const s = locatePlayer(g, at.x * g.VW, at.y * g.VH, 4 * size * g.VW);
    if (!s) return null;
    return {
      x: clamp(s.x / g.VW, 0, 1),
      y: clamp(s.y / g.VH, 0, 1),
      size: Math.round(clamp(s.h / 4 / g.VW, TRACK_SIZE_MIN, TRACK_SIZE_MAX) * 10000) / 10000,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Lissage final : régression linéaire locale (noyau gaussien) — supprime le tremblement sans retard
// ---------------------------------------------------------------------------
interface Sample { t: number; x: number; y: number }

function smoothPath(pts: Sample[], sigma: number, pinned: number): Sample[] {
  const reach = sigma * 3;
  return pts.map((p, i) => {
    if (i === pinned) return p;
    let sw = 0, st = 0, stt = 0, sx = 0, sy = 0, stx = 0, sty = 0;
    const add = (q: Sample, j: number) => {
      const dt = q.t - p.t;
      const wgt = Math.exp(-(dt * dt) / (2 * sigma * sigma)) * (j === pinned ? 4 : 1);
      sw += wgt; st += wgt * dt; stt += wgt * dt * dt;
      sx += wgt * q.x; sy += wgt * q.y; stx += wgt * dt * q.x; sty += wgt * dt * q.y;
    };
    for (let j = i; j >= 0 && Math.abs(pts[j].t - p.t) <= reach; j--) add(pts[j], j);
    for (let j = i + 1; j < pts.length && Math.abs(pts[j].t - p.t) <= reach; j++) add(pts[j], j);
    const det = sw * stt - st * st;
    if (det < 1e-12) return { t: p.t, x: sx / sw, y: sy / sw };
    return { t: p.t, x: (stt * sx - st * stx) / det, y: (stt * sy - st * sty) / det };
  });
}

// ---------------------------------------------------------------------------
// Images à analyser : lecture accélérée de la copie de travail (rapide), ou recherche image par image
// (repli universel, et seul moyen de remonter le temps)
// ---------------------------------------------------------------------------
async function seekTo(video: HTMLVideoElement, t: number) {
  video.currentTime = Math.max(0, t);
  await waitFor(video, "seeked", 5000);
}

interface FrameSource {
  /**
   * Instant de l'image suivante, prête à être lue ; null à la fin ; « stall » si la lecture n'avance plus
   * (ou s'est terminée avant la limite) : on poursuit alors par recherche image par image
   */
  next(): Promise<number | null | "stall">;
  close(): void;
}

/** Chaque image de la grille de l'éditeur est recherchée : fonctionne partout, mais la vidéo est redécodée à chaque fois */
class SeekFrames implements FrameSource {
  private index: number;

  constructor(private video: HTMLVideoElement, after: number, private limit: number, private dir: TrackDirection, private fps: number) {
    const f = after * fps;
    this.index = dir > 0 ? Math.floor(f + 1e-6) : Math.ceil(f - 1e-6);
  }

  async next() {
    this.index += this.dir;
    const t = this.index / this.fps;
    if (this.dir > 0 ? t > this.limit + 1e-6 : t < this.limit - 1e-6) return null;
    await seekTo(this.video, t);
    return t;
  }

  close() {
    /* rien à libérer */
  }
}

/**
 * La copie de travail est lue en accéléré et chaque image affichée est analysée : plusieurs fois plus rapide que la
 * recherche. La vitesse s'ajuste à la puissance de l'appareil pour ne sauter qu'exceptionnellement une image.
 */
class PlaybackFrames implements FrameSource {
  private last: number;
  private rate = 1.5;
  private started = false;
  private gaps: number[] = [];
  private minGap = Infinity;

  constructor(private video: HTMLVideoElement, start: number, private limit: number) {
    this.last = start;
  }

  static supported(video: HTMLVideoElement) {
    return typeof video.requestVideoFrameCallback === "function";
  }

  /** Fin de la vidéo atteinte avant d'avoir analysé les dernières images (lecture plus rapide que l'analyse) */
  private endedEarly(): "stall" | null {
    return this.last < this.limit - 1e-3 ? "stall" : null;
  }

  async next(): Promise<number | null | "stall"> {
    const v = this.video;
    if (v.ended) return this.endedEarly();
    if (!this.started || v.paused) {
      this.started = true;
      v.playbackRate = this.rate;
      try {
        await v.play();
      } catch {
        return "stall"; // lecture refusée (mode économie d'énergie…) : recherche image par image
      }
    }
    return new Promise((resolve) => {
      let handle = 0;
      const finish = (value: number | null | "stall") => {
        window.clearTimeout(timer);
        v.removeEventListener("ended", onEnded);
        resolve(value);
      };
      const onEnded = () => {
        v.cancelVideoFrameCallback(handle);
        finish(this.endedEarly());
      };
      // Plus aucune image affichée (onglet en arrière-plan…) : on continue par recherche image par image
      const timer = window.setTimeout(() => {
        v.cancelVideoFrameCallback(handle);
        v.pause();
        finish("stall");
      }, 2500);
      const onFrame = (_now: number, meta: VideoFrameCallbackMetadata) => {
        const t = meta.mediaTime;
        if (t <= this.last + 1e-4) {
          handle = v.requestVideoFrameCallback(onFrame);
          return;
        }
        if (t > this.limit + 1e-6) {
          v.pause();
          finish(null);
          return;
        }
        this.adapt(t - this.last);
        this.last = t;
        finish(t);
      };
      v.addEventListener("ended", onEnded);
      handle = v.requestVideoFrameCallback(onFrame);
    });
  }

  /** Images sautées (analyse plus lente que la lecture) : on ralentit ; aucune : on accélère */
  private adapt(gap: number) {
    this.minGap = Math.min(this.minGap, gap);
    this.gaps.push(gap);
    if (this.gaps.length < 8) return;
    const mean = this.gaps.reduce((a, b) => a + b, 0) / this.gaps.length / this.minGap;
    this.gaps = [];
    if (mean > 1.5) this.rate = Math.max(0.5, this.rate * 0.75);
    else if (mean < 1.15) this.rate = Math.min(2.5, this.rate * 1.2);
    this.video.playbackRate = this.rate;
  }

  close() {
    this.video.pause();
  }
}

// ---------------------------------------------------------------------------
// Suivi
// ---------------------------------------------------------------------------
export async function autoTrack(src: string, opts: AutoTrackOptions): Promise<AutoTrackResult> {
  const dir: TrackDirection = opts.direction === -1 ? -1 : 1;
  const fps = opts.fps;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = src;
  try {
    await waitFor(video, "loadeddata", 15000);
  } catch {
    throw new Error("Lecture de la vidéo impossible pour le suivi.");
  }

  let frames: FrameSource | null = null;
  try {
    const g = new Grabber(video);
    const { VW, VH } = g;
    if (!VW || !VH) throw new Error("Lecture de la vidéo impossible pour le suivi.");

    // Départ sur la grille d'images de l'éditeur (même image que l'avance image par image)
    const t0 = Math.round(opts.from.t * fps) / fps;
    const duration = video.duration && Number.isFinite(video.duration) ? video.duration : Infinity;
    const limit = dir > 0 ? Math.min(opts.until, duration - 0.5 / fps) : Math.max(opts.until, 0);
    const span = Math.max(1 / fps, Math.abs(limit - t0));
    await seekTo(video, t0);

    // Taille et pieds du joueur : silhouette sous le clic, sinon taille du marqueur
    const clickX = opts.from.x * VW;
    const clickY = opts.from.y * VH;
    const hint = clamp(4 * opts.size * VW, 10, VH * 0.9);
    const found = locatePlayer(g, clickX, clickY, hint);
    let X = found ? found.x : clickX;
    let Y = found ? found.y : clickY;
    let h = found ? found.h : hint;
    const hMin = Math.max(8, h / 3), hMax = Math.min(VH, h * 3);
    // Le marqueur garde l'écart choisi par l'utilisateur par rapport aux pieds (en hauteurs de joueur)
    const offX = (clickX - X) / h;
    const offY = (clickY - Y) / h;

    // Fenêtre de travail centrée sur la position prédite (pieds)
    const grabAround = (px: number, py: number, R: number) => {
      const k = P / h;
      const side = R + MB;
      return g.grab(px - (side + AX + 0.5) / k, py - (side + AY + 0.5) / k, k, TW + 2 * side, TH + 2 * side);
    };

    let R = R_MIN;
    let w = grabAround(X, Y, R);
    const inside = (wk: Work | null, x0: number, y0: number) => Boolean(wk && x0 >= wk.vx0 && y0 >= wk.vy0 && x0 + TW <= wk.vx1 && y0 + TH <= wk.vy1);
    if (!w || !inside(w, R + MB, R + MB)) throw new Error("Joueur trop près du bord de l'image pour un suivi automatique.");

    const patch = new Float32Array(TN);
    const patchS = new Float32Array(TN);
    const patchL = new Float32Array(TN);
    extract(w, R + MB + AX, R + MB + AY, 1, patch);
    const colors = new ColorModel();
    colors.learn(w, R + MB, R + MB, 1);
    const tpl = new Template(patch, pixelWeights(patch, colors.lut));

    // Probabilité « joueur » cumulée sur la fenêtre (score de couleur d'une position en temps constant)
    const integral = new Float64Array((SIDE_MAX + 1) * (SIDE_MAX + 1));
    const buildIntegral = (wk: Work) => {
      const W1 = wk.W + 1;
      integral.fill(0, 0, W1 * (wk.H + 1));
      for (let y = 0; y < wk.H; y++) {
        let row = 0;
        const inY = y >= wk.vy0 && y < wk.vy1;
        for (let x = 0; x < wk.W; x++) {
          if (inY && x >= wk.vx0 && x < wk.vx1) row += colors.lut[wk.bins[y * wk.W + x]];
          integral[(y + 1) * W1 + x + 1] = integral[y * W1 + x + 1] + row;
        }
      }
    };
    const colorAt = (wk: Work, x0: number, y0: number) => {
      const W1 = wk.W + 1;
      const a = (y0 + CB_Y0) * W1 + x0 + CB_X0, b = (y0 + CB_Y0) * W1 + x0 + CB_X1;
      const c = (y0 + CB_Y1) * W1 + x0 + CB_X0, d = (y0 + CB_Y1) * W1 + x0 + CB_X1;
      return (integral[d] - integral[b] - integral[c] + integral[a]) / CB_AREA;
    };
    buildIntegral(w);
    // Score de couleur de référence (joueur bien visible)
    let colorRef = Math.max(0.3, colorAt(w, R + MB, R + MB));

    // Cartes de score de la zone de recherche
    const MAP = (2 * R_MAX + 1) ** 2;
    const nccMap = new Float32Array(MAP);
    const appMap = new Float32Array(MAP);
    const totMap = new Float32Array(MAP);
    const done = new Uint8Array(MAP);

    const samples: Array<Sample & { c: number }> = [{ t: t0, x: X, y: Y, c: 1 }];
    /** Vitesse lissée, en px vidéo par image de l'éditeur */
    let vx = 0, vy = 0;
    let misses = 0;
    let edgeMisses = 0;
    let lastGoodT = t0;
    let prevT = t0;
    let reason: AutoTrackResult["reason"] = "end";
    frames = dir > 0 && PlaybackFrames.supported(video) ? new PlaybackFrames(video, t0, limit) : new SeekFrames(video, t0, limit, dir, fps);

    for (;;) {
      if (opts.isCancelled()) { reason = "cancel"; break; }
      let next: number | null | "stall";
      try {
        next = await frames.next();
      } catch {
        reason = "lost";
        break;
      }
      if (next === "stall") {
        frames.close();
        frames = new SeekFrames(video, prevT, limit, dir, fps);
        continue;
      }
      if (next === null) { reason = "end"; break; }
      const t = next;
      // Écart avec l'image analysée précédente, en images de l'éditeur (la lecture accélérée peut en sauter)
      const steps = clamp(Math.abs(t - prevT) * fps, 0.25, 4);
      prevT = t;

      // Prédiction (vitesse lissée) et zone de recherche, élargie si le joueur vient d'être masqué
      const px = X + vx * steps, py = Y + vy * steps;
      const k = P / h;
      const speed = Math.hypot(vx, vy) * k * steps;
      const lapse = Math.sqrt(Math.max(1, steps));
      R = Math.round(clamp((R_MIN * lapse + 0.5 * speed) * (1 + 0.25 * Math.min(misses, 6)), R_MIN, R_MAX));
      const widen = lapse * (1 + 0.3 * Math.min(misses, 6));
      const sigX = P * 0.3 * widen;
      const sigY = P * 0.22 * widen;
      w = grabAround(px, py, R);

      const c0 = R + MB; // coin haut-gauche prédit
      let xmin = c0 - R, xmax = c0 + R, ymin = c0 - R, ymax = c0 + R;
      if (w) {
        xmin = Math.max(xmin, w.vx0); ymin = Math.max(ymin, w.vy0);
        xmax = Math.min(xmax, w.vx1 - TW); ymax = Math.min(ymax, w.vy1 - TH);
      }
      let accepted = false;
      let conf = 0;
      const nearEdge = !w || xmin > xmax || ymin > ymax;

      if (w && !nearEdge) {
        const wk = w;
        buildIntegral(wk);
        const mw = 2 * R + 1;
        done.fill(0, 0, mw * mw);
        const evalAt = (x0: number, y0: number) => {
          const m = (y0 - (c0 - R)) * mw + (x0 - (c0 - R));
          if (done[m]) return m;
          done[m] = 1;
          const ncc = tpl.score(wk, x0, y0);
          const app = ncc + COLOR_WEIGHT * colorAt(wk, x0, y0);
          const dx = (x0 - c0) / sigX, dy = (y0 - c0) / sigY;
          nccMap[m] = ncc;
          appMap[m] = app;
          totMap[m] = app - MOTION_WEIGHT * (dx * dx + dy * dy);
          return m;
        };
        // Recherche (grossière si la zone est grande), puis affinage autour du meilleur
        const stride = R > 18 ? 2 : 1;
        let bx = c0, by = c0, bm = -1;
        for (let y0 = ymin; y0 <= ymax; y0 += stride) {
          for (let x0 = xmin; x0 <= xmax; x0 += stride) {
            const m = evalAt(x0, y0);
            if (bm < 0 || totMap[m] > totMap[bm]) { bm = m; bx = x0; by = y0; }
          }
        }
        if (stride > 1) {
          const cx = bx, cy = by;
          for (let y0 = Math.max(ymin, cy - 2); y0 <= Math.min(ymax, cy + 2); y0++) {
            for (let x0 = Math.max(xmin, cx - 2); x0 <= Math.min(xmax, cx + 2); x0++) {
              const m = evalAt(x0, y0);
              if (totMap[m] > totMap[bm]) { bm = m; bx = x0; by = y0; }
            }
          }
        }
        // Sous-pixel : parabole sur les voisins
        const vertex = (a: number, b: number, c: number) => {
          const den = a - 2 * b + c;
          return den < 0 ? clamp((0.5 * (a - c)) / den, -0.5, 0.5) : 0;
        };
        let fx = 0, fy = 0;
        if (bx > xmin && bx < xmax) fx = vertex(totMap[evalAt(bx - 1, by)], totMap[bm], totMap[evalAt(bx + 1, by)]);
        if (by > ymin && by < ymax) fy = vertex(totMap[evalAt(bx, by - 1)], totMap[bm], totMap[evalAt(bx, by + 1)]);

        // Autre candidat presque aussi ressemblant ailleurs dans la zone : coéquipier proche
        let second = -Infinity;
        for (let y0 = ymin; y0 <= ymax; y0++) {
          const ey = (y0 - by) / (0.35 * TH);
          for (let x0 = xmin; x0 <= xmax; x0++) {
            const m = (y0 - (c0 - R)) * mw + (x0 - (c0 - R));
            if (!done[m]) continue;
            const ex = (x0 - bx) / (0.55 * TW);
            if (ex * ex + ey * ey > 1 && appMap[m] > second) second = appMap[m];
          }
        }
        const ambiguous = second > appMap[bm] - AMBIGUITY;
        conf = nccMap[bm];
        const color = colorAt(wk, bx, by);
        const ddx = (bx - c0) / sigX, ddy = (by - c0) / sigY;
        const level = ACCEPT + 0.04 * Math.min(misses, 5);
        accepted = conf >= level && color >= 0.4 * colorRef && ddx * ddx + ddy * ddy <= 6.25;

        if (accepted) {
          let ax = bx + fx + AX, ay = by + fy + AY;
          const nx = wk.sx + (ax + 0.5) / wk.k;
          const ny = wk.sy + (ay + 0.5) / wk.k;
          // Coéquipier proche : la vitesse change peu (on garde la course du joueur suivi)
          const beta = ambiguous ? 0.15 : 0.4;
          vx += ((nx - px) / steps) * beta;
          vy += ((ny - py) / steps) * beta;
          const vmax = 0.6 * h;
          const vn = Math.hypot(vx, vy);
          if (vn > vmax) { vx *= vmax / vn; vy *= vmax / vn; }
          X = nx;
          Y = ny;
          misses = 0;
          edgeMisses = 0;
          lastGoodT = t;
          if (conf >= UPDATE && !ambiguous) {
            // Échelle (zoom, joueur qui s'approche) : chaque taille candidate avec sa meilleure position des pieds.
            // Pas amorti (racine du pas) pour ne pas osciller ; les pieds suivent à mi-chemin.
            const fit1 = scaleFit(wk, tpl, ax, ay, 1, patch);
            const fitS = scaleFit(wk, tpl, ax, ay, 1 / SCALE_STEP, patchS);
            const fitL = scaleFit(wk, tpl, ax, ay, SCALE_STEP, patchL);
            let grow = 1;
            let fit = fit1;
            if (fitL.n > fit1.n + 0.003 && fitL.n >= fitS.n) { grow = Math.sqrt(SCALE_STEP); fit = fitL; }
            else if (fitS.n > fit1.n + 0.003) { grow = 1 / Math.sqrt(SCALE_STEP); fit = fitS; }
            if (grow !== 1 && h * grow >= hMin && h * grow <= hMax) {
              h *= grow;
              ax += fit.dx / 2;
              ay += fit.dy / 2;
              X = wk.sx + (ax + 0.5) / wk.k;
              Y = wk.sy + (ay + 0.5) / wk.k;
            } else {
              grow = 1;
            }
            // Le modèle s'adapte (le joueur tourne, change de posture), à la taille corrigée
            extract(wk, ax, ay, grow, patch);
            tpl.update(patch, TEMPLATE_RATE);
            colors.learn(wk, bx, by, COLOR_RATE);
            colorRef += (color - colorRef) * 0.05;
          }
          samples.push({ t, x: X, y: Y, c: conf });
        }
      }

      if (!accepted) {
        // Joueur masqué ou hors de la zone : on prolonge sa course quelques instants
        X = px;
        Y = py;
        const damp = Math.pow(0.85, steps);
        vx *= damp;
        vy *= damp;
        misses++;
        if (nearEdge) edgeMisses++;
        if (Math.abs(t - lastGoodT) > COAST_SECONDS) { reason = edgeMisses * 2 >= misses ? "edge" : "lost"; break; }
      }

      const out = (x: number, y: number): TrackKey => ({ t: Math.round(t * 1000) / 1000, x: clamp((x + offX * h) / VW, 0, 1), y: clamp((y + offY * h) / VH, 0, 1) });
      opts.onProgress?.({
        t,
        key: accepted ? out(X, Y) : null,
        confidence: clamp(conf, 0, 1),
        progress: clamp(Math.abs(t - t0) / span, 0, 1),
        frame: video,
      });
    }

    // Fin de suivi incertaine (joueur perdu) : on ne garde que les positions sûres
    if (reason === "lost" || reason === "edge") {
      while (samples.length > 1 && samples[samples.length - 1].c < UPDATE) samples.pop();
    }
    lastGoodT = samples[samples.length - 1].t;

    // Lissage, puis une clé environ toutes les N images de l'éditeur (et toujours la dernière position)
    const ordered = dir > 0 ? samples : [...samples].reverse();
    const smooth = smoothPath(ordered, 1.5 / fps, dir > 0 ? 0 : ordered.length - 1);
    const travel = dir > 0 ? smooth : smooth.reverse();
    const spacing = (Math.max(1, opts.keyEvery ?? 2) - 0.5) / fps;
    const keys: TrackKey[] = [];
    let lastKept = t0;
    travel.forEach((s, idx) => {
      if (idx === 0) return; // position de départ, déjà connue
      if (idx < travel.length - 1 && Math.abs(s.t - lastKept) < spacing) return;
      lastKept = s.t;
      keys.push({
        t: Math.round(s.t * 1000) / 1000,
        x: Math.round(clamp((s.x + offX * h) / VW, 0, 1) * 10000) / 10000,
        y: Math.round(clamp((s.y + offY * h) / VH, 0, 1) * 10000) / 10000,
      });
    });
    keys.sort((a, b) => a.t - b.t);
    return { keys, reason, lastT: Math.round(lastGoodT * 1000) / 1000, endT: Math.round(prevT * 1000) / 1000 };
  } finally {
    frames?.close();
    video.removeAttribute("src");
    video.load();
  }
}
