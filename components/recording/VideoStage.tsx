"use client";

// Module Recording : scène vidéo = lecteur (fichier local, YouTube ou Vimeo) + calque de dessin aligné sur l'image.
// Le lecteur est piloté par l'éditeur (pas de commandes natives) pour un contrôle image par image.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { curveControl, fitRect, hitShape, hitTrack, renderShapes, renderTracks, type Rect } from "@/lib/recording/draw";
import type { PitchOverlay, Shape, StageTool, Track } from "@/lib/recording/types";
import { hitHandle, renderPitchCalibration, renderPitchOverlay } from "@/lib/recording/pitchOverlay";
import { newId } from "@/lib/recording/db";

declare global {
  interface Window {
    YT?: any;
    Vimeo?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type StageSource =
  | { kind: "file"; url: string }
  | { kind: "youtube"; ref: string }
  | { kind: "vimeo"; ref: string };

export interface PlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  getTime: () => number;
  getDuration: () => number;
  isPaused: () => boolean;
  setRate: (r: number) => Promise<boolean>;
  /** Élément vidéo (fichier local uniquement) pour l'export d'image */
  videoElement: () => HTMLVideoElement | null;
  /** Rectangle de l'image dans la scène (px) */
  contentRect: () => Rect;
}

let ytLoader: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytLoader) {
    ytLoader = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => { ytLoader = null; reject(new Error("Lecteur YouTube indisponible (connexion ?)")); };
      document.head.appendChild(script);
    });
  }
  return ytLoader;
}

let vimeoLoader: Promise<any> | null = null;
function loadVimeoApi(): Promise<any> {
  if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo);
  if (!vimeoLoader) {
    vimeoLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://player.vimeo.com/api/player.js";
      script.async = true;
      script.onload = () => resolve(window.Vimeo);
      script.onerror = () => { vimeoLoader = null; reject(new Error("Lecteur Vimeo indisponible (connexion ?)")); };
      document.head.appendChild(script);
    });
  }
  return vimeoLoader;
}

interface Props {
  source: StageSource | null;
  /** Consignes affichées (arrêt sur image courant), null = rien à afficher */
  shapes: Shape[] | null;
  tool: StageTool;
  /** Joueurs suivis, affichés à l'instant `time` (pendant la lecture comme à l'arrêt) */
  tracks: Track[];
  time: number;
  /** Suivi automatique en cours : l'image analysée (dessinée par l'éditeur) recouvre la vidéo, la scène est verrouillée */
  live?: boolean;
  liveCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  selectedTrackId: string | null;
  /** Outil de suivi : appui / glissé / relâché sur l'image (coordonnées normalisées) */
  onTrackPointer: (p: { x: number; y: number }, phase: "down" | "move" | "up", hitTrackId: string | null) => void;
  color: string;
  width: number;
  dashed: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Début d'un tracé : l'éditeur fige la vidéo et prépare l'arrêt sur image */
  onBeginDraw: () => void;
  onAddShape: (shape: Shape) => void;
  onMoveShape: (id: string, dx: number, dy: number, commit: boolean) => void;
  onReady: (info: { duration: number }) => void;
  onError: (message: string) => void;
  /** Couloirs / zones du terrain calés en perspective */
  pitchOverlay?: PitchOverlay;
  /** Calage en cours : les poignées se déplacent, les outils de dessin sont suspendus */
  calibrating?: boolean;
  /** Nouvelle position des poignées (commit = relâchement) */
  onCalibrate?: (quad: number[], commit: boolean) => void;
}

const VideoStage = forwardRef<PlayerHandle, Props>(function VideoStage(
  { source, shapes, tool, tracks, time, live = false, liveCanvasRef, selectedTrackId, onTrackPointer, color, width, dashed, selectedId, onSelect, onBeginDraw, onAddShape, onMoveShape, onReady, onError, pitchOverlay, calibrating = false, onCalibrate },
  ref
) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const embedHostRef = useRef<HTMLDivElement>(null);
  const ytRef = useRef<any>(null);
  const vimeoRef = useRef<any>(null);
  const vimeoState = useRef({ time: 0, stamp: 0, paused: true, duration: 0, rate: 1 });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState({ w: 16, h: 9 });
  const [draft, setDraft] = useState<Shape | null>(null);
  const draftRef = useRef<Shape | null>(null);
  draftRef.current = draft;
  const [textEdit, setTextEdit] = useState<{ x: number; y: number; value: string } | null>(null);
  const drag = useRef<{ kind: "draw" | "move" | "track" | "calib"; startX: number; startY: number; id?: string; handle?: number; lastX: number; lastY: number } | null>(null);
  const [activeHandle, setActiveHandle] = useState<number | null>(null);

  const rect = fitRect(box.w, box.h, natural.w, natural.h);
  const rectRef = useRef(rect);
  rectRef.current = rect;

  // Taille de la scène
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Lecteurs YouTube / Vimeo
  useEffect(() => {
    if (!source || source.kind === "file") return;
    const host = embedHostRef.current;
    if (!host) return;
    let cancelled = false;
    setNatural({ w: 16, h: 9 });
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    host.appendChild(mount);

    if (source.kind === "youtube") {
      loadYouTubeApi()
        .then((YT) => {
          if (cancelled) return;
          ytRef.current = new YT.Player(mount, {
            videoId: source.ref,
            width: "100%",
            height: "100%",
            playerVars: { controls: 0, rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, iv_load_policy: 3, fs: 0 },
            events: {
              onReady: (e: any) => onReady({ duration: e.target.getDuration() || 0 }),
              onError: () => onError("Cette vidéo YouTube ne peut pas être lue dans un autre site (lecture intégrée désactivée par son auteur)."),
            },
          });
        })
        .catch((e) => onError(e.message));
    } else {
      loadVimeoApi()
        .then((Vimeo) => {
          if (cancelled) return;
          const [id, hash] = source.ref.split(":");
          const player = new Vimeo.Player(mount, {
            url: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`,
            controls: false,
            responsive: true,
            playsinline: true,
            dnt: true,
          });
          vimeoRef.current = player;
          const st = vimeoState.current;
          st.time = 0; st.paused = true; st.stamp = performance.now();
          player.on("timeupdate", (d: any) => { st.time = d.seconds; st.stamp = performance.now(); });
          player.on("seeked", (d: any) => { st.time = d.seconds; st.stamp = performance.now(); });
          player.on("play", () => { st.paused = false; st.stamp = performance.now(); });
          player.on("pause", () => { st.paused = true; });
          player.on("ended", () => { st.paused = true; });
          player.ready()
            .then(() => player.getDuration())
            .then((d: number) => { st.duration = d; onReady({ duration: d }); })
            .catch(() => onError("Cette vidéo Vimeo ne peut pas être lue ici (vidéo privée ou intégration interdite)."));
        })
        .catch((e) => onError(e.message));
    }
    return () => {
      cancelled = true;
      try { ytRef.current?.destroy?.(); } catch { /* lecteur déjà détruit */ }
      try { vimeoRef.current?.destroy?.(); } catch { /* lecteur déjà détruit */ }
      ytRef.current = null;
      vimeoRef.current = null;
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.kind, source && source.kind !== "file" ? source.ref : null]);

  useImperativeHandle(ref, (): PlayerHandle => ({
    play: () => {
      if (source?.kind === "file") void videoRef.current?.play().catch(() => undefined);
      else if (source?.kind === "youtube") ytRef.current?.playVideo?.();
      else if (source?.kind === "vimeo") void vimeoRef.current?.play().catch(() => undefined);
    },
    pause: () => {
      if (source?.kind === "file") videoRef.current?.pause();
      else if (source?.kind === "youtube") ytRef.current?.pauseVideo?.();
      else if (source?.kind === "vimeo") { vimeoState.current.paused = true; void vimeoRef.current?.pause().catch(() => undefined); }
    },
    seek: (t: number) => {
      const time = Math.max(0, t);
      if (source?.kind === "file" && videoRef.current) videoRef.current.currentTime = time;
      else if (source?.kind === "youtube") ytRef.current?.seekTo?.(time, true);
      else if (source?.kind === "vimeo") {
        vimeoState.current.time = time;
        vimeoState.current.stamp = performance.now();
        void vimeoRef.current?.setCurrentTime(time).catch(() => undefined);
      }
    },
    getTime: () => {
      if (source?.kind === "file") return videoRef.current?.currentTime || 0;
      if (source?.kind === "youtube") return ytRef.current?.getCurrentTime?.() || 0;
      if (source?.kind === "vimeo") {
        const st = vimeoState.current;
        return st.paused ? st.time : st.time + ((performance.now() - st.stamp) / 1000) * st.rate;
      }
      return 0;
    },
    getDuration: () => {
      if (source?.kind === "file") return videoRef.current?.duration || 0;
      if (source?.kind === "youtube") return ytRef.current?.getDuration?.() || 0;
      if (source?.kind === "vimeo") return vimeoState.current.duration;
      return 0;
    },
    isPaused: () => {
      if (source?.kind === "file") return videoRef.current?.paused ?? true;
      if (source?.kind === "youtube") return ytRef.current?.getPlayerState?.() !== 1;
      if (source?.kind === "vimeo") return vimeoState.current.paused;
      return true;
    },
    setRate: async (r: number) => {
      if (source?.kind === "file" && videoRef.current) { videoRef.current.playbackRate = r; return true; }
      if (source?.kind === "youtube") { ytRef.current?.setPlaybackRate?.(r); return true; }
      if (source?.kind === "vimeo") {
        try { await vimeoRef.current?.setPlaybackRate(r); vimeoState.current.rate = r; return true; } catch { return false; }
      }
      return false;
    },
    videoElement: () => (source?.kind === "file" ? videoRef.current : null),
    contentRect: () => rectRef.current,
  }), [source]);

  // Rendu du calque de dessin
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(box.w * dpr);
    canvas.height = Math.round(box.h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);
    if (pitchOverlay) renderPitchOverlay(ctx, pitchOverlay, rect);
    if (pitchOverlay && calibrating) renderPitchCalibration(ctx, pitchOverlay, rect, activeHandle);
    if (tracks.length) renderTracks(ctx, tracks, rect, time, tool === "track" ? selectedTrackId : null);
    const list = [...(shapes || []), ...(draft ? [draft] : [])];
    if (list.length) renderShapes(ctx, list, rect, tool === "select" ? selectedId : null);
  }, [shapes, draft, box, rect.x, rect.y, rect.w, rect.h, selectedId, tool, tracks, time, selectedTrackId, pitchOverlay, calibrating, activeHandle]); // eslint-disable-line react-hooks/exhaustive-deps

  const toNorm = useCallback((clientX: number, clientY: number) => {
    const b = boxRef.current!.getBoundingClientRect();
    const r = rectRef.current;
    const px = clientX - b.left;
    const py = clientY - b.top;
    return { px, py, x: Math.min(1, Math.max(0, (px - r.x) / r.w)), y: Math.min(1, Math.max(0, (py - r.y) / r.h)) };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!source || e.button !== 0 || textEdit || live) return;
    const p = toNorm(e.clientX, e.clientY);
    if (calibrating) {
      if (!pitchOverlay) return;
      const handle = hitHandle(pitchOverlay, rectRef.current, p.px, p.py);
      if (handle < 0) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      drag.current = { kind: "calib", handle, startX: p.x, startY: p.y, lastX: p.x, lastY: p.y };
      setActiveHandle(handle);
      return;
    }
    if (tool === "track") {
      const hit = hitTrack(tracks, p.px, p.py, rectRef.current, time);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      drag.current = { kind: "track", startX: p.x, startY: p.y, lastX: p.x, lastY: p.y };
      onTrackPointer({ x: p.x, y: p.y }, "down", hit ? hit.id : null);
      return;
    }
    if (tool === "select") {
      const hit = shapes ? hitShape(shapes, p.px, p.py, rectRef.current) : null;
      onSelect(hit ? hit.id : null);
      if (hit) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = { kind: "move", startX: p.x, startY: p.y, id: hit.id, lastX: p.x, lastY: p.y };
      }
      return;
    }
    onBeginDraw();
    if (tool === "text") {
      setTextEdit({ x: p.x, y: p.y, value: "" });
      return;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind: "draw", startX: p.x, startY: p.y, lastX: p.x, lastY: p.y };
    setDraft({ id: newId("shape"), tool, color, width, dashed, points: [p.x, p.y, p.x, p.y] });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toNorm(e.clientX, e.clientY);
    if (d.kind === "calib" && d.handle !== undefined && pitchOverlay) {
      // Poignée libre jusqu'aux bords de la scène (un coin du repère peut être hors de l'image)
      const r = rectRef.current;
      const b = boxRef.current!.getBoundingClientRect();
      const nx = Math.min((b.width - r.x) / r.w, Math.max(-r.x / r.w, (p.px - r.x) / r.w));
      const ny = Math.min((b.height - r.y) / r.h, Math.max(-r.y / r.h, (p.py - r.y) / r.h));
      const quad = [...pitchOverlay.quad];
      quad[d.handle * 2] = nx;
      quad[d.handle * 2 + 1] = ny;
      d.lastX = nx; d.lastY = ny;
      onCalibrate?.(quad, false);
      return;
    }
    if (d.kind === "track") { onTrackPointer({ x: p.x, y: p.y }, "move", null); return; }
    if (d.kind === "move" && d.id) {
      onMoveShape(d.id, p.x - d.lastX, p.y - d.lastY, false);
      d.lastX = p.x; d.lastY = p.y;
      return;
    }
    setDraft((prev) => {
      if (!prev) return prev;
      if (prev.tool === "free" || prev.tool === "curve") {
        const last = prev.points.slice(-2);
        if (Math.hypot(p.x - last[0], p.y - last[1]) < 0.003) return prev;
        return { ...prev, points: [...prev.points, p.x, p.y] };
      }
      return { ...prev, points: [prev.points[0], prev.points[1], p.x, p.y] };
    });
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.kind === "calib") {
      setActiveHandle(null);
      if (pitchOverlay) onCalibrate?.(pitchOverlay.quad, true);
      return;
    }
    if (d.kind === "track") { onTrackPointer({ x: d.lastX, y: d.lastY }, "up", null); return; }
    if (d.kind === "move" && d.id) { onMoveShape(d.id, 0, 0, true); return; }
    // Le tracé est lu depuis la référence (et non dans un « updater » de state, exécuté deux fois en mode strict)
    const prev = draftRef.current;
    setDraft(null);
    if (!prev) return;
    const pts = prev.points;
    const span = Math.hypot(pts[pts.length - 2] - pts[0], pts[pts.length - 1] - pts[1]);
    if (span < 0.008 && prev.tool !== "free") return; // simple appui : rien à tracer
    if (prev.tool === "free" && pts.length < 6) return;
    let shape = prev;
    if (prev.tool === "curve") {
      const [cx, cy] = curveControl(pts);
      shape = { ...prev, points: [pts[0], pts[1], cx, cy, pts[pts.length - 2], pts[pts.length - 1]] };
    }
    onAddShape(shape);
  };

  const commitText = () => {
    if (!textEdit) return;
    const value = textEdit.value.trim();
    if (value) onAddShape({ id: newId("shape"), tool: "text", color, width, points: [textEdit.x, textEdit.y], text: value });
    setTextEdit(null);
  };

  const cursor = !source ? "default" : live ? "progress" : calibrating ? (activeHandle !== null ? "grabbing" : "grab") : tool === "select" ? "default" : tool === "text" ? "text" : tool === "track" ? "cell" : "crosshair";

  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden bg-black select-none" data-testid="recording-stage">
      {source?.kind === "file" && (
        <video
          ref={videoRef}
          src={source.url}
          className="absolute"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setNatural({ w: v.videoWidth || 16, h: v.videoHeight || 9 });
            onReady({ duration: v.duration || 0 });
          }}
          onError={() => onError("Ce fichier vidéo ne peut pas être lu par le navigateur (formats conseillés : MP4 H.264, WebM).")}
        />
      )}
      {source && source.kind !== "file" && (
        <div ref={embedHostRef} className="absolute pointer-events-none" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />
      )}
      {live && liveCanvasRef && (
        <canvas ref={liveCanvasRef} aria-hidden="true" className="absolute pointer-events-none" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {textEdit && (
        <div className="absolute z-10" style={{ left: rect.x + textEdit.x * rect.w, top: rect.y + textEdit.y * rect.h - 22 }}>
          <input
            autoFocus
            value={textEdit.value}
            maxLength={80}
            onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitText();
              if (e.key === "Escape") setTextEdit(null);
              e.stopPropagation();
            }}
            onBlur={commitText}
            placeholder="Consigne… (Entrée)"
            className="h-11 min-w-[220px] rounded-lg border-2 border-[#FF5A4E] bg-[#07090e]/90 px-3 text-base font-bold text-white outline-none"
            style={{ color }}
          />
        </div>
      )}
    </div>
  );
});

export default VideoStage;
