// Module Recording : suivi automatique d'un joueur dans une vidéo locale (corrélation normalisée image par image).
// Le calcul se fait sur une copie cachée de la vidéo, en niveaux de gris et en basse résolution :
// rapide, sans envoi de données, et sans faire sauter la vidéo affichée.
import type { TrackKey } from "./types";

export interface AutoTrackOptions {
  /** Images par seconde utilisées pour avancer */
  fps: number;
  /** Position de départ (pieds du joueur) */
  from: TrackKey;
  /** Rayon du marqueur, rapporté à la largeur de l'image */
  size: number;
  /** Instant maximal (s) */
  until: number;
  /** Une clé enregistrée toutes les N images */
  keyEvery?: number;
  isCancelled: () => boolean;
  onProgress: (key: TrackKey) => void;
}

export interface AutoTrackResult {
  keys: TrackKey[];
  reason: "end" | "lost" | "cancel";
}

const WORK_WIDTH = 360;
const MIN_CONFIDENCE = 0.42;

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

interface Patch { data: Float32Array; mean: number; std: number; size: number }

// Image de travail en COULEUR (R, G, B entrelacés) : en niveaux de gris, un maillot rouge et la pelouse verte
// ont presque la même luminosité et le suivi glisserait sur les lignes du terrain.
function makePatch(img: Float32Array, W: number, H: number, cx: number, cy: number, half: number): Patch | null {
  const size = half * 2 + 1;
  if (cx - half < 0 || cy - half < 0 || cx + half >= W || cy + half >= H) return null;
  const data = new Float32Array(size * size * 3);
  let sum = 0;
  for (let y = 0; y < size; y++) {
    const row = ((cy - half + y) * W + (cx - half)) * 3;
    const out = y * size * 3;
    for (let i = 0; i < size * 3; i++) {
      const v = img[row + i];
      data[out + i] = v;
      sum += v;
    }
  }
  const mean = sum / data.length;
  let sq = 0;
  for (let i = 0; i < data.length; i++) sq += (data[i] - mean) ** 2;
  return { data, mean, std: Math.sqrt(sq / data.length) || 1, size };
}

/** Meilleure correspondance (corrélation normalisée en couleur) autour de la position prédite */
function match(img: Float32Array, W: number, H: number, tpl: Patch, cx: number, cy: number, radius: number) {
  const half = (tpl.size - 1) / 2;
  const n = tpl.size * tpl.size * 3;
  const rowLen = tpl.size * 3;
  let best = { x: cx, y: cy, score: -1, raw: -1 };
  for (let dy = -radius; dy <= radius; dy++) {
    const py = cy + dy;
    if (py - half < 0 || py + half >= H) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      const px = cx + dx;
      if (px - half < 0 || px + half >= W) continue;
      let sum = 0;
      let sq = 0;
      let cross = 0;
      for (let y = 0; y < tpl.size; y++) {
        const row = ((py - half + y) * W + (px - half)) * 3;
        const trow = y * rowLen;
        for (let i = 0; i < rowLen; i++) {
          const v = img[row + i];
          sum += v;
          sq += v * v;
          cross += v * tpl.data[trow + i];
        }
      }
      const mean = sum / n;
      const variance = sq / n - mean * mean;
      if (variance <= 1) continue;
      const score = (cross / n - mean * tpl.mean) / (Math.sqrt(variance) * tpl.std);
      // Léger avantage aux positions proches de la prédiction (le joueur ne se téléporte pas)
      const penalized = score - (0.06 * (dx * dx + dy * dy)) / (radius * radius);
      if (penalized > best.score) best = { x: px, y: py, score: penalized, raw: score };
    }
  }
  return best;
}

export async function autoTrack(src: string, opts: AutoTrackOptions): Promise<AutoTrackResult> {
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

  const W = WORK_WIDTH;
  const H = Math.max(2, Math.round((video.videoHeight / video.videoWidth) * W));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas non supporté.");
  const img = new Float32Array(W * H * 3);

  const grab = async (t: number) => {
    video.currentTime = Math.max(0, t);
    await waitFor(video, "seeked", 5000);
    ctx.drawImage(video, 0, 0, W, H);
    const px = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0, j = 0; i < img.length; i += 3, j += 4) { img[i] = px[j]; img[i + 1] = px[j + 1]; img[i + 2] = px[j + 2]; }
  };

  // Le modèle couvre le corps du joueur, au-dessus du point au sol (les pieds)
  const radiusPx = Math.max(3, opts.size * W);
  const half = Math.round(Math.min(22, Math.max(6, radiusPx * 1.5)));
  const lift = Math.round(Math.max(half * 0.8, radiusPx * 1.6));
  const searchRadius = Math.round(Math.max(8, half * 1.4));
  const step = 1 / opts.fps;
  const keyEvery = Math.max(1, opts.keyEvery ?? 2);
  const end = Math.min(opts.until, (video.duration && Number.isFinite(video.duration)) ? video.duration - step : opts.until);

  let t = opts.from.t;
  await grab(t);
  let cx = Math.round(opts.from.x * W);
  let cy = Math.round(opts.from.y * H) - lift;
  let tpl: Patch | null = makePatch(img, W, H, cx, cy, half);
  // Vitesse estimée (px par image), lissée : la recherche se centre là où le joueur se dirige
  let vx = 0;
  let vy = 0;
  if (!tpl) throw new Error("Joueur trop près du bord de l'image pour un suivi automatique.");

  const keys: TrackKey[] = [];
  let frame = 0;
  let reason: AutoTrackResult["reason"] = "end";
  while (t + step <= end + 1e-6) {
    if (opts.isCancelled()) { reason = "cancel"; break; }
    t += step;
    frame++;
    try {
      await grab(t);
    } catch {
      reason = "lost";
      break;
    }
    const predX = Math.round(cx + vx);
    const predY = Math.round(cy + vy);
    const found = match(img, W, H, tpl, predX, predY, searchRadius);
    if (found.raw < MIN_CONFIDENCE) { reason = "lost"; break; }
    vx = vx * 0.6 + (found.x - cx) * 0.4;
    vy = vy * 0.6 + (found.y - cy) * 0.4;
    cx = found.x;
    cy = found.y;
    // Le modèle s'adapte progressivement (le joueur tourne, change de posture)
    // … seulement quand la correspondance est sûre, pour ne pas dériver vers le décor
    const fresh = found.raw > 0.75 ? makePatch(img, W, H, cx, cy, half) : null;
    if (fresh) {
      const blended: Float32Array = new Float32Array(tpl.data.length);
      let sum = 0;
      for (let i = 0; i < blended.length; i++) { blended[i] = tpl.data[i] * 0.9 + fresh.data[i] * 0.1; sum += blended[i]; }
      const mean = sum / blended.length;
      let sq = 0;
      for (let i = 0; i < blended.length; i++) sq += (blended[i] - mean) ** 2;
      tpl = { data: blended, mean, std: Math.sqrt(sq / blended.length) || 1, size: tpl.size };
    }
    const key: TrackKey = { t: Math.round(t * 1000) / 1000, x: cx / W, y: Math.min(1, (cy + lift) / H) };
    if (frame % keyEvery === 0) {
      keys.push(key);
      opts.onProgress(key);
    }
  }
  // Dernière position connue (fin du suivi), même hors cadence
  const lastT = Math.round(t * 1000) / 1000;
  if (reason !== "lost" && (!keys.length || keys[keys.length - 1].t !== lastT) && t > opts.from.t) {
    keys.push({ t: lastT, x: cx / W, y: Math.min(1, (cy + lift) / H) });
  }
  video.removeAttribute("src");
  video.load();
  return { keys, reason };
}
