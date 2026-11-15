// Module Recording : export d'un passage (Entrée → Sortie) en fichier vidéo, sur l'appareil.
// La vidéo est rejouée dans une copie cachée et réenregistrée (MediaRecorder) avec les joueurs suivis incrustés ;
// chaque arrêt sur image annoté est tenu quelques secondes avec ses consignes, comme lors de la causerie.
// MP4 (H.264 + AAC) quand le navigateur sait l'enregistrer (Chrome, Edge, Safari), sinon WebM (Firefox).
import { renderShapes, renderTracks } from "./draw";
import type { Freeze, Track } from "./types";

export interface ClipExportOptions {
  /** URL du fichier vidéo (fichier importé) */
  src: string;
  start: number;
  end: number;
  tracks: Track[];
  freezes: Freeze[];
  /** Durée d'affichage d'un arrêt sur image annoté (s) */
  holdSeconds?: number;
  /** Largeur maximale de l'image exportée */
  maxWidth?: number;
  isCancelled: () => boolean;
  /** Avancement (0 → 1) */
  onProgress?: (p: number) => void;
}

export interface ClipExportResult {
  blob: Blob;
  extension: "mp4" | "webm";
}

const MIME_CANDIDATES: Array<{ mime: string; extension: "mp4" | "webm" }> = [
  { mime: "video/mp4;codecs=avc1.640028,mp4a.40.2", extension: "mp4" },
  { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", extension: "mp4" },
  { mime: "video/mp4;codecs=avc1,opus", extension: "mp4" },
  { mime: "video/mp4", extension: "mp4" },
  { mime: "video/webm;codecs=vp9,opus", extension: "webm" },
  { mime: "video/webm", extension: "webm" },
];

/** Format d'enregistrement disponible (null : export vidéo impossible sur ce navigateur) */
export function clipExportFormat(): { mime: string; extension: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement.prototype.captureStream !== "function") return null;
  return MIME_CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.mime)) || null;
}

function once(el: HTMLMediaElement, event: string, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("timeout")); }, timeoutMs);
    const ok = () => { cleanup(); resolve(); };
    const ko = () => { cleanup(); reject(new Error("error")); };
    const cleanup = () => { window.clearTimeout(timer); el.removeEventListener(event, ok); el.removeEventListener("error", ko); };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", ko, { once: true });
  });
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export async function exportClip(opts: ClipExportOptions): Promise<ClipExportResult | null> {
  const format = clipExportFormat();
  if (!format) throw new Error("Ce navigateur ne sait pas enregistrer de vidéo : utilisez Chrome, Edge ou Safari.");
  const hold = opts.holdSeconds ?? 3;

  const video = document.createElement("video");
  video.playsInline = true;
  video.preload = "auto";
  video.src = opts.src;
  let audio: AudioContext | null = null;
  let recorder: MediaRecorder | null = null;
  try {
    await once(video, "loadeddata", 15000).catch(() => { throw new Error("Lecture de la vidéo impossible pour l'export."); });
    const scale = Math.min(1, (opts.maxWidth ?? 1920) / video.videoWidth);
    // Dimensions paires (exigées par l'encodeur H.264)
    const W = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
    const H = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas non supporté.");
    const rect = { x: 0, y: 0, w: W, h: H };
    const start = Math.max(0, opts.start);
    const end = Math.min(opts.end, video.duration || opts.end);
    const freezes = opts.freezes
      .filter((f) => f.shapes.length > 0 && f.time >= start - 0.001 && f.time <= end + 0.001)
      .sort((a, b) => a.time - b.time);
    const total = end - start + freezes.length * hold;

    const draw = (t: number, shapes: Freeze["shapes"] | null) => {
      ctx.drawImage(video, 0, 0, W, H);
      if (opts.tracks.length) renderTracks(ctx, opts.tracks, rect, t);
      if (shapes) renderShapes(ctx, shapes, rect);
    };

    // Son : capté par Web Audio (sans passer par les haut-parleurs) ; vidéo muette si le navigateur le refuse
    const stream = canvas.captureStream(30);
    try {
      audio = new AudioContext();
      const dest = audio.createMediaStreamDestination();
      audio.createMediaElementSource(video).connect(dest);
      await audio.resume();
      dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    } catch {
      audio = null;
      video.muted = true;
    }

    video.currentTime = start;
    await once(video, "seeked", 5000);
    draw(start, null);

    const chunks: Blob[] = [];
    recorder = new MediaRecorder(stream, { mimeType: format.mime, videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise<void>((resolve) => { recorder!.onstop = () => resolve(); });
    recorder.start(1000);

    try {
      await video.play();
    } catch {
      // Lecture avec le son refusée : on enregistre l'image seule
      video.muted = true;
      await video.play();
    }

    let held = 0;
    let next = 0;
    let cancelled = false;
    while (true) {
      if (opts.isCancelled()) { cancelled = true; break; }
      const t = video.currentTime;
      const freeze = freezes[next];
      if (freeze && t >= freeze.time - 0.001) {
        // Arrêt sur image : l'action se fige sur l'image annotée
        next++;
        video.pause();
        video.currentTime = freeze.time;
        await once(video, "seeked", 5000).catch(() => undefined);
        const until = performance.now() + hold * 1000;
        while (performance.now() < until && !opts.isCancelled()) {
          draw(freeze.time, freeze.shapes);
          opts.onProgress?.(Math.min(1, (freeze.time - start + held + (hold - (until - performance.now()) / 1000)) / total));
          await nextFrame();
        }
        held += hold;
        if (opts.isCancelled()) { cancelled = true; break; }
        await video.play().catch(() => undefined);
        continue;
      }
      if (t >= end || video.ended) break;
      draw(t, null);
      opts.onProgress?.(Math.min(1, (t - start + held) / total));
      await nextFrame();
    }
    video.pause();
    recorder.stop();
    await stopped;
    if (cancelled) return null;
    opts.onProgress?.(1);
    return { blob: new Blob(chunks, { type: format.mime.split(";")[0] }), extension: format.extension };
  } finally {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    video.pause();
    video.removeAttribute("src");
    video.load();
    void audio?.close().catch(() => undefined);
  }
}
