"use client";

// Module Recording (phase 1) : import d'une séquence vidéo, analyse image par image, consignes dessinées
// sur des arrêts sur image, bibliothèque taguée enregistrée sur l'appareil et export d'image annotée.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, ChevronsLeft, Circle, Crosshair, Download, Eraser, Film, Focus, Link2, Moon, MousePointer2, PenTool, Plus, Save,
  SlidersHorizontal, Spline, Square, Sun, Trash2, Type, Undo2, Upload, Wand2, X,
} from "lucide-react";
import LogoIcon from "@/components/LogoIcon";
import { confirmAction } from "@/components/ConfirmDialog";
import VideoStage, { type PlayerHandle, type StageSource } from "./VideoStage";
import Transport from "./Transport";
import LibraryPanel from "./LibraryPanel";
import SequencePanel from "./SequencePanel";
import {
  deleteImage, deleteSequence, listImages, listSequences, loadImageFile, loadVideoBlob, newId, requestPersistentStorage, saveImage, saveSequence,
  saveVideoBlob, storageEstimate,
} from "@/lib/recording/db";
import { renderShapes, renderTracks, trackPosition } from "@/lib/recording/draw";
import { PITCH_REFS, defaultPitchOverlay, pitchRef, renderPitchOverlay } from "@/lib/recording/pitchOverlay";
import { autoTrack, measurePlayer, type TrackDirection } from "@/lib/recording/tracker";
import { clipExportFormat, exportClip } from "@/lib/recording/exportVideo";
import { formatTime, parseVideoLink } from "@/lib/recording/sources";
import { DRAW_COLORS, DRAW_WIDTHS, TOOL_LABELS } from "@/lib/recording/tags";
import { RecordingThemeContext, getRecordingTheme, readThemePreference, storeThemePreference } from "@/lib/recording/theme";
import {
  emptyTags, type Freeze, type LibraryImage, type PitchOverlay, type Sequence, type Shape, type SequenceTags, type StageTool, type Track, type TrackKey,
} from "@/lib/recording/types";
import { readActiveRoster } from "@/lib/training/storage";

/** Boutons de la barre d'outils : même gabarit compact que la barre d'outils du tableau tactique */
const barBtn = "h-7 min-w-7 sm:min-w-8 px-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed";
const toolBtn = "h-11 min-w-11 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-black transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed";

const TOOLS: Array<{ id: StageTool; icon: React.ElementType; label: string; key: string }> = [
  { id: "select", icon: MousePointer2, label: "Sélectionner / déplacer", key: "V" },
  { id: "track", icon: Crosshair, label: "Suivi de joueur", key: "P" },
  { id: "arrow", icon: ArrowUpRight, label: TOOL_LABELS.arrow, key: "A" },
  { id: "curve", icon: Spline, label: TOOL_LABELS.curve, key: "C" },
  { id: "circle", icon: Circle, label: TOOL_LABELS.circle, key: "R" },
  { id: "free", icon: PenTool, label: TOOL_LABELS.free, key: "F" },
  { id: "text", icon: Type, label: TOOL_LABELS.text, key: "T" },
  { id: "spotlight", icon: Focus, label: TOOL_LABELS.spotlight, key: "S" },
];

const fileTitle = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 80) || "Séquence";

/** Rayon de marqueur par défaut d'un joueur suivi (rapporté à la largeur de l'image) */
const DEFAULT_TRACK_SIZE = 0.022;
/** Durée maximale d'un suivi automatique (s) : au-delà, on relance depuis la dernière position */
const MAX_TRACK_SECONDS = 30;

interface TrackingState {
  trackId: string;
  /** Instant de l'image analysée */
  t: number;
  direction: TrackDirection;
  progress: number;
  /** Joueur momentanément introuvable (masqué) : position extrapolée */
  searching: boolean;
}

/** Nom de fichier sûr à partir d'un titre */
const fileName = (title: string) => `TheBox_${title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "export"}`;

const downloadFile = (url: string, name: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
};

/** Insère une position en gardant l'ordre chronologique (remplace celle du même instant) */
const insertKey = (keys: TrackKey[], key: TrackKey): TrackKey[] => {
  const out = keys.filter((k) => Math.abs(k.t - key.t) > 0.0005);
  let i = out.length;
  while (i > 0 && out[i - 1].t > key.t) i--;
  out.splice(i, 0, key);
  return out;
};

export default function RecordingEditor() {
  const [isLight, setIsLight] = useState<boolean>(() => readThemePreference());
  const th = getRecordingTheme(isLight);
  const roster = useMemo(() => readActiveRoster(), []);
  const playerRef = useRef<PlayerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [library, setLibrary] = useState<Sequence[]>([]);
  const [images, setImages] = useState<LibraryImage[]>([]);
  /** Aperçu d'une image de la bibliothèque */
  const [imageView, setImageView] = useState<{ image: LibraryImage; url: string } | null>(null);
  /** Export vidéo en cours (titre, avancement) */
  const [exporting, setExporting] = useState<{ title: string; progress: number } | null>(null);
  const exportCancel = useRef(false);
  /** Format du fichier vidéo exporté (MP4, ou WebM sur Firefox ; null si impossible) */
  const videoFormat = useMemo(() => clipExportFormat()?.extension ?? null, []);
  /** Instant où placer la vidéo à l'ouverture d'une séquence (retour depuis une image) */
  const pendingSeek = useRef<number | null>(null);
  const [storage, setStorage] = useState<{ usedMb: number; quotaMb: number } | null>(null);
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [dirty, setDirty] = useState(false);
  const [source, setSource] = useState<StageSource | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const [ready, setReady] = useState(false);

  const [tool, setTool] = useState<StageTool>("arrow");
  const [color, setColor] = useState(DRAW_COLORS[0].hex);
  const [width, setWidth] = useState(5);
  const [dashed, setDashed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Calage en perspective des couloirs / zones du terrain (poignées sur la vidéo)
  const [calibrating, setCalibrating] = useState(false);
  type Snapshot = { freezes: Freeze[]; tracks: Track[] };
  const history = useRef<Snapshot[]>([]);
  const moveSnapshot = useRef<Snapshot | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  /** Glissé en cours sur un joueur suivi : point d'appui, pour ignorer les micro-mouvements du doigt */
  const trackDrag = useRef<{ id: string; t: number; x: number; y: number; moved: boolean } | null>(null);
  const [tracking, setTracking] = useState<TrackingState | null>(null);
  const trackingCancel = useRef(false);
  /** Image analysée par le suivi automatique, affichée en direct par-dessus la vidéo */
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const pendingFreezeId = useRef<string | null>(null);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fps = seq?.fps || 25;
  const tolerance = Math.max(0.5 / fps, 0.06);

  const toastTimer = useRef<number | null>(null);
  const showToast = (msg: string | null) => {
    setToast(msg);
    // Un nouveau message remplace le précédent (son minuteur ne doit pas l'effacer en avance)
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = msg ? window.setTimeout(() => setToast(null), 2600) : null;
  };

  const refreshLibrary = useCallback(async () => {
    try {
      const [sequences, stills] = await Promise.all([listSequences(), listImages()]);
      setLibrary(sequences);
      setImages(stills);
      setStorage(await storageEstimate());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bibliothèque indisponible.");
    }
  }, []);

  useEffect(() => {
    void refreshLibrary();
    void requestPersistentStorage();
  }, [refreshLibrary]);

  // Libère l'URL du fichier vidéo
  const setFileUrl = (blob: Blob | null) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = blob ? URL.createObjectURL(blob) : null;
    return objectUrlRef.current;
  };
  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  // Avertit avant de quitter une séquence non enregistrée
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const activeFreeze = useMemo(() => {
    if (!seq || !paused) return null;
    let best: Freeze | null = null;
    for (const f of seq.freezes) {
      const d = Math.abs(f.time - time);
      if (d <= tolerance && (!best || d < Math.abs(best.time - time))) best = f;
    }
    return best;
  }, [seq, paused, time, tolerance]);

  // Lecture : suivi de la position, pause automatique sur les arrêts sur image, boucle du clip
  const seqRef = useRef(seq);
  seqRef.current = seq;
  // Une autre séquence (ou aucune) : le calage en cours se referme
  useEffect(() => { setCalibrating(false); }, [seq?.id]);
  const loopRef = useRef(loop);
  loopRef.current = loop;
  useEffect(() => {
    let raf = 0;
    let prev = 0;
    const tick = () => {
      const pl = playerRef.current;
      if (pl && ready) {
        const t = pl.getTime();
        const isPaused = pl.isPaused();
        const s = seqRef.current;
        if (!isPaused && s) {
          const crossed = s.freezes.find((f) => f.autoPause && prev < f.time - 0.001 && t >= f.time - 0.001 && t - prev < 1.5);
          if (crossed) {
            pl.pause();
            pl.seek(crossed.time);
            prev = crossed.time;
            setTime(crossed.time);
            setPaused(true);
            raf = requestAnimationFrame(tick);
            return;
          }
          if (loopRef.current && s.outPoint !== undefined && t >= s.outPoint) {
            pl.seek(s.inPoint ?? 0);
            prev = s.inPoint ?? 0;
            raf = requestAnimationFrame(tick);
            return;
          }
        }
        prev = t;
        setTime((old) => (Math.abs(old - t) > 0.004 ? t : old));
        setPaused((old) => (old !== isPaused ? isPaused : old));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // ---------------------------------------------------------------------------
  // Séquence courante
  // ---------------------------------------------------------------------------
  const updateSeq = useCallback((patch: Partial<Sequence> | ((s: Sequence) => Partial<Sequence>)) => {
    setSeq((s) => (s ? { ...s, ...(typeof patch === "function" ? patch(s) : patch) } : s));
    setDirty(true);
  }, []);

  // Couloirs / zones du terrain : réglages enregistrés avec la séquence
  const patchOverlay = useCallback((patch: Partial<PitchOverlay>) => {
    updateSeq((s) => ({ pitchOverlay: { ...(s.pitchOverlay || defaultPitchOverlay()), ...patch } }));
  }, [updateSeq]);

  /** Affiche / masque les couloirs ou les zones ; le premier affichage ouvre le calage */
  const toggleOverlay = (key: "zones" | "thirds") => {
    const current = seqRef.current?.pitchOverlay;
    const next = !(current?.[key] ?? false);
    patchOverlay({ [key]: next });
    if (next && !current) setCalibrating(true);
  };

  const setFreezes = useCallback((fn: (f: Freeze[]) => Freeze[], recordHistory = true) => {
    // Historique enregistré hors du « updater » (exécuté deux fois en mode strict)
    const current = seqRef.current;
    if (recordHistory && current) history.current = [...history.current.slice(-49), { freezes: current.freezes, tracks: current.tracks || [] }];
    setSeq((s) => (s ? { ...s, freezes: fn(s.freezes) } : s));
    setDirty(true);
  }, []);

  const setTracks = useCallback((fn: (t: Track[]) => Track[], recordHistory = true) => {
    const current = seqRef.current;
    if (recordHistory && current) history.current = [...history.current.slice(-49), { freezes: current.freezes, tracks: current.tracks || [] }];
    setSeq((s) => (s ? { ...s, tracks: fn(s.tracks || []) } : s));
    setDirty(true);
  }, []);

  const confirmLeave = async () => {
    if (!dirty) return true;
    return confirmAction({
      title: "Quitter sans enregistrer ?",
      message: "Les consignes et tags de la séquence ouverte n'ont pas été enregistrés dans la bibliothèque.",
      confirmLabel: "Quitter",
      tone: "warning",
    });
  };

  const resetPlayback = () => {
    setReady(false);
    setTime(0);
    setDuration(0);
    setPaused(true);
    setRate(1);
    setLoop(false);
    setSelectedId(null);
    setSelectedTrackId(null);
    trackingCancel.current = true;
    setTracking(null);
    setError(null);
    history.current = [];
  };

  const startSequence = (s: Sequence, src: StageSource, blob: Blob | null) => {
    resetPlayback();
    setSeq(s);
    setSource(src);
    setPendingBlob(blob);
    setDirty(Boolean(blob) || !library.some((l) => l.id === s.id));
  };

  const importFile = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Ce fichier n'est pas une vidéo (formats conseillés : MP4, WebM, MOV).");
      return;
    }
    if (!(await confirmLeave())) return;
    const videoId = newId("video");
    const now = new Date().toISOString();
    const url = setFileUrl(file)!;
    startSequence(
      {
        id: newId("seq"), version: 1, title: fileTitle(file.name), createdAt: now, updatedAt: now,
        source: { kind: "file", videoId, fileName: file.name, mime: file.type }, fps: 25, tags: emptyTags(), freezes: [],
      },
      { kind: "file", url },
      file
    );
  };

  const importLink = async () => {
    const parsed = parseVideoLink(linkValue);
    if (!parsed.ok) { setLinkError(parsed.reason); return; }
    if (!(await confirmLeave())) return;
    setFileUrl(null);
    const now = new Date().toISOString();
    startSequence(
      {
        id: newId("seq"), version: 1, title: parsed.source.kind === "youtube" ? "Séquence YouTube" : "Séquence Vimeo",
        createdAt: now, updatedAt: now, source: parsed.source, fps: 25, tags: emptyTags(), freezes: [], thumbnail: parsed.thumbnail,
      },
      { kind: parsed.source.kind, ref: parsed.source.ref },
      null
    );
    setLinkOpen(false);
    setLinkValue("");
    setLinkError(null);
  };

  /** `at` : instant où placer la vidéo une fois prête (sinon le début du clip) */
  const openSequence = async (s: Sequence, at?: number) => {
    if (seq?.id === s.id) return;
    if (!(await confirmLeave())) return;
    if (s.source.kind === "file") {
      try {
        const blob = await loadVideoBlob(s.source.videoId);
        if (!blob) { setError("La vidéo de cette séquence n'est plus sur cet appareil."); return; }
        const url = setFileUrl(blob)!;
        pendingSeek.current = at ?? null;
        startSequence(s, { kind: "file", url }, null);
      } catch {
        setError("Lecture de la vidéo impossible depuis la bibliothèque.");
        return;
      }
    } else {
      setFileUrl(null);
      pendingSeek.current = at ?? null;
      startSequence(s, { kind: s.source.kind, ref: s.source.ref }, null);
    }
    setDirty(false);
    setPanelOpen(false);
  };

  const closeSequence = async () => {
    if (!(await confirmLeave())) return;
    setFileUrl(null);
    resetPlayback();
    setSeq(null);
    setSource(null);
    setPendingBlob(null);
    setDirty(false);
  };

  const removeSequence = async (s: Sequence) => {
    const source = s.source;
    const shared = source.kind === "file" && library.some((o) => o.id !== s.id && o.source.kind === "file" && o.source.videoId === source.videoId);
    const ok = await confirmAction({
      title: s.parentId ? "Supprimer l'extrait ?" : "Supprimer la séquence ?",
      subject: s.title,
      message: source.kind !== "file"
        ? "La séquence et ses consignes seront effacées de cet appareil."
        : shared
          ? "Ses consignes seront effacées. La vidéo est conservée : d'autres séquences ou extraits l'utilisent."
          : "La séquence et sa vidéo seront effacées de cet appareil.",
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    await deleteSequence(s);
    if (seq?.id === s.id) {
      setFileUrl(null);
      resetPlayback();
      setSeq(null);
      setSource(null);
      setDirty(false);
    }
    await refreshLibrary();
  };

  // Vignette : image affichée réduite (fichier local) ou aperçu fourni par la plateforme
  const makeThumbnail = (): string | undefined => {
    const video = playerRef.current?.videoElement();
    if (!video || !video.videoWidth) return seq?.thumbnail;
    const w = 320;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return seq?.thumbnail;
    ctx.drawImage(video, 0, 0, w, h);
    renderPitchOverlay(ctx, seq?.pitchOverlay, { x: 0, y: 0, w, h });
    if (seq?.tracks?.length) renderTracks(ctx, seq.tracks, { x: 0, y: 0, w, h }, time);
    if (activeFreeze) renderShapes(ctx, activeFreeze.shapes, { x: 0, y: 0, w, h });
    return canvas.toDataURL("image/jpeg", 0.72);
  };

  const save = async () => {
    if (!seq) return;
    try {
      if (seq.source.kind === "file" && pendingBlob) await saveVideoBlob(seq.source.videoId, pendingBlob);
      const saved: Sequence = { ...seq, title: seq.title.trim() || "Séquence", updatedAt: new Date().toISOString(), thumbnail: makeThumbnail() };
      await saveSequence(saved);
      setSeq(saved);
      setPendingBlob(null);
      setDirty(false);
      await refreshLibrary();
      showToast("Séquence enregistrée dans la bibliothèque");
    } catch (e) {
      setError(e instanceof Error && /quota|plein/i.test(e.message) ? "Espace de stockage plein sur cet appareil : supprimez d'anciennes séquences." : "Enregistrement impossible sur cet appareil.");
    }
  };

  // ---------------------------------------------------------------------------
  // Lecture
  // ---------------------------------------------------------------------------
  const snap = (t: number) => Math.max(0, Math.round(t * fps) / fps);
  const seek = (t: number) => {
    const pl = playerRef.current;
    if (!pl) return;
    const target = Math.min(Math.max(0, t), duration || t);
    pl.seek(target);
    setTime(target);
  };
  const togglePlay = () => {
    const pl = playerRef.current;
    if (!pl || !ready) return;
    if (pl.isPaused()) {
      // Reprise depuis un arrêt sur image : on repart juste après pour ne pas s'y arrêter à nouveau
      if (activeFreeze) pl.seek(activeFreeze.time + 0.5 / fps + 0.01);
      else if (loop && seq?.outPoint !== undefined && time >= seq.outPoint - 0.01) pl.seek(seq.inPoint ?? 0);
      pl.play();
    } else pl.pause();
  };
  const step = (frames: number) => {
    const pl = playerRef.current;
    if (!pl || !ready) return;
    pl.pause();
    seek(snap(pl.getTime()) + frames / fps);
  };
  const changeRate = async (r: number) => {
    const ok = await playerRef.current?.setRate(r);
    if (ok === false) showToast("Ralenti indisponible pour cette vidéo Vimeo");
    else setRate(r);
  };

  // ---------------------------------------------------------------------------
  // Consignes
  // ---------------------------------------------------------------------------
  const onBeginDraw = () => {
    const pl = playerRef.current;
    if (!pl || !seq) return;
    pl.pause();
    setPaused(true);
    if (activeFreeze) { pendingFreezeId.current = activeFreeze.id; return; }
    const t = snap(pl.getTime());
    const freeze: Freeze = { id: newId("freeze"), time: t, shapes: [], autoPause: true };
    pendingFreezeId.current = freeze.id;
    pl.seek(t);
    setTime(t);
    setFreezes((list) => [...list, freeze]);
  };

  const onAddShape = (shape: Shape) => {
    const target = pendingFreezeId.current || activeFreeze?.id;
    if (!target) return;
    setFreezes((list) => list.map((f) => (f.id === target ? { ...f, shapes: [...f.shapes, shape] } : f)));
    setSelectedId(shape.id);
  };

  const onMoveShape = (id: string, dx: number, dy: number, commit: boolean) => {
    if (commit) {
      if (moveSnapshot.current) history.current = [...history.current.slice(-49), moveSnapshot.current];
      moveSnapshot.current = null;
      return;
    }
    if (!moveSnapshot.current && seq) moveSnapshot.current = { freezes: seq.freezes, tracks: seq.tracks || [] };
    setFreezes(
      (list) => list.map((f) => ({
        ...f,
        shapes: f.shapes.map((s) => (s.id === id ? { ...s, points: s.points.map((v, i) => Math.min(1, Math.max(0, v + (i % 2 === 0 ? dx : dy)))) } : s)),
      })),
      false
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setFreezes((list) => list.map((f) => ({ ...f, shapes: f.shapes.filter((s) => s.id !== selectedId) })));
    setSelectedId(null);
  };

  const undo = () => {
    const last = history.current.pop();
    if (!last) return;
    setSeq((s) => (s ? { ...s, freezes: last.freezes, tracks: last.tracks } : s));
    setDirty(true);
    setSelectedId(null);
  };

  const clearFreeze = async () => {
    if (!activeFreeze) return;
    const ok = await confirmAction({
      title: "Effacer cet arrêt sur image ?",
      message: `Les ${activeFreeze.shapes.length} consigne(s) de l'image ${formatTime(activeFreeze.time, true, fps)} seront effacées (annulable avec Ctrl+Z).`,
      confirmLabel: "Effacer",
      tone: "warning",
    });
    if (ok) setFreezes((list) => list.filter((f) => f.id !== activeFreeze.id));
  };

  // ---------------------------------------------------------------------------
  // Suivi de joueurs
  // ---------------------------------------------------------------------------
  const tracks = seq?.tracks || [];
  const upsertKey = (tr: Track, t: number, x: number, y: number): Track => {
    const tol = 0.5 / fps;
    const keys = tr.keys.filter((k) => Math.abs(k.t - t) > tol);
    keys.push({ t, x, y });
    keys.sort((a, b) => a.t - b.t);
    return { ...tr, keys };
  };

  const onTrackPointer = (p: { x: number; y: number }, phase: "down" | "move" | "up", hitId: string | null) => {
    const pl = playerRef.current;
    if (!pl || !seq || tracking) return;
    if (phase === "down") {
      pl.pause();
      setPaused(true);
      const t = snap(pl.getTime());
      if (hitId) {
        // Appui sur un joueur suivi : sélection, et glisser corrige sa position à cet instant
        setSelectedTrackId(hitId);
        trackDrag.current = { id: hitId, t, x: p.x, y: p.y, moved: false };
        history.current = [...history.current.slice(-49), { freezes: seq.freezes, tracks }];
        return;
      }
      const selected = tracks.find((tr) => tr.id === selectedTrackId);
      if (selected) {
        // Joueur sélectionné : nouvelle position à cet instant (correction manuelle)
        setTracks((list) => list.map((tr) => (tr.id === selected.id ? upsertKey(tr, t, p.x, p.y) : tr)));
        trackDrag.current = { id: selected.id, t, x: p.x, y: p.y, moved: false };
        return;
      }
      // Nouveau joueur : marqueur calé sous ses pieds et à sa taille quand sa silhouette se détache nettement
      const video = pl.videoElement();
      const measured = video ? measurePlayer(video, p, DEFAULT_TRACK_SIZE) : null;
      const start = measured ? { x: measured.x, y: measured.y } : { x: p.x, y: p.y };
      const track: Track = { id: newId("track"), color, style: "ring", size: measured?.size ?? DEFAULT_TRACK_SIZE, trail: true, keys: [{ t, ...start }] };
      setTracks((list) => [...list, track]);
      setSelectedTrackId(track.id);
      trackDrag.current = { id: track.id, t, x: p.x, y: p.y, moved: false };
      showToast(seq.source.kind === "file" ? "Joueur placé : lancez « Suivi auto » ou placez-le à d'autres instants" : "Joueur placé : placez-le à d'autres instants pour suivre sa course");
      return;
    }
    const drag = trackDrag.current;
    if (phase === "move" && drag) {
      // Glissé volontaire uniquement (un doigt bouge toujours un peu en appuyant)
      if (!drag.moved && Math.hypot(p.x - drag.x, p.y - drag.y) < 0.006) return;
      drag.moved = true;
      setTracks((list) => list.map((tr) => (tr.id === drag.id ? upsertKey(tr, drag.t, p.x, p.y) : tr)), false);
      return;
    }
    if (phase === "up") trackDrag.current = null;
  };

  /** Affiche en direct l'image analysée par le suivi (la vidéo principale reste à son instant) */
  const drawLiveFrame = (frame: HTMLVideoElement) => {
    const canvas = liveCanvasRef.current;
    if (!canvas || !frame.videoWidth) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    canvas.getContext("2d")?.drawImage(frame, 0, 0, w, h);
  };

  const runAutoTrack = async (trackId: string, direction: TrackDirection = 1) => {
    const tr = tracks.find((x) => x.id === trackId);
    const pl = playerRef.current;
    const src = objectUrlRef.current;
    if (!tr || !tr.keys.length || !pl || !seq || !src || tracking) return;
    pl.pause();
    setPaused(true);
    const now = snap(pl.getTime());
    // Départ : position du joueur à l'instant affiché, sinon l'extrémité de sa trajectoire dans le sens du suivi
    const here = trackPosition(tr, now);
    const from: TrackKey = here ? { t: now, ...here } : direction > 0 ? tr.keys[tr.keys.length - 1] : tr.keys[0];
    const until = direction > 0
      ? Math.min(seq.outPoint ?? duration, from.t + MAX_TRACK_SECONDS)
      : Math.max(seq.inPoint ?? 0, from.t - MAX_TRACK_SECONDS);
    if (direction > 0 ? until - from.t < 1 / fps : from.t - until < 1 / fps) {
      showToast(direction > 0 ? "Placez-vous avant la fin de la vidéo (ou du clip) pour suivre le joueur" : "Placez-vous après le début de la vidéo (ou du clip) pour suivre le joueur vers l'arrière");
      return;
    }
    const seqId = seq.id;
    const tol = 0.5 / fps;
    const original = tr.keys;
    history.current = [...history.current.slice(-49), { freezes: seq.freezes, tracks }];
    // Les positions situées au-delà du point de départ (dans le sens du suivi) sont recalculées
    const kept = (keys: TrackKey[]) => insertKey(keys.filter((k) => (direction > 0 ? k.t < from.t - tol : k.t > from.t + tol)), { t: from.t, x: from.x, y: from.y });
    setTracks((list) => list.map((x) => (x.id === trackId ? { ...x, keys: kept(x.keys) } : x)), false);
    setSelectedTrackId(trackId);
    setTool("track");
    showToast(null); // le bouton « Arrêter » de la bannière doit rester visible
    trackingCancel.current = false;
    setTracking({ trackId, t: from.t, direction, progress: 0, searching: false });
    let endT = from.t;
    // Affichage en direct ~15 fois par seconde : image, marqueur et progression restent synchrones
    const pending: TrackKey[] = [];
    let shownAt = 0;
    try {
      const result = await autoTrack(src, {
        fps,
        from,
        size: tr.size,
        until,
        direction,
        keyEvery: 2,
        isCancelled: () => trackingCancel.current,
        onProgress: ({ t, key, progress, frame }) => {
          if (key) pending.push(key);
          const now = performance.now();
          if (now - shownAt < 66) return;
          shownAt = now;
          drawLiveFrame(frame);
          const batch = pending.splice(0);
          setTracking((cur) => (cur ? { ...cur, t, progress, searching: !key } : cur));
          if (batch.length) setTracks((list) => list.map((x) => (x.id === trackId ? { ...x, keys: batch.reduce(insertKey, x.keys) } : x)), false);
        },
      });
      if (seqRef.current?.id !== seqId) return;
      // Les positions provisoires sont remplacées par la trajectoire lissée. Arrêt manuel ou plage atteinte :
      // les positions d'origine au-delà de la partie recalculée sont conservées (joueur perdu : elles sont douteuses)
      const restore = result.reason === "cancel" || result.reason === "end";
      const beyond = restore ? original.filter((k) => (direction > 0 ? k.t > result.endT + tol : k.t < result.endT - tol)) : [];
      setTracks((list) => list.map((x) => (x.id === trackId ? { ...x, keys: [...kept(x.keys), ...result.keys, ...beyond].sort((a, b) => a.t - b.t) } : x)), false);
      endT = result.lastT;
      const at = formatTime(endT, true, fps);
      if (result.reason === "lost") showToast(`Joueur perdu vers ${at} : replacez-le d'un clic puis relancez le suivi`);
      else if (result.reason === "edge") showToast(`Joueur sorti de l'image à ${at}`);
      else if (result.reason === "cancel") showToast(`Suivi arrêté à ${at}`);
      else if (Math.abs(until - from.t) >= MAX_TRACK_SECONDS - 0.01) showToast(`${MAX_TRACK_SECONDS} s suivies (${at}) : relancez pour continuer`);
      else showToast(`Suivi terminé jusqu'à ${at}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suivi automatique impossible.");
    } finally {
      if (seqRef.current?.id === seqId) {
        // La vidéo se cale là où le joueur a été vu en dernier (vérification / correction) ;
        // l'image en direct reste affichée le temps que la vidéo principale y arrive
        pl.seek(endT);
        setTime(endT);
        const video = pl.videoElement();
        if (video?.seeking) {
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, 600);
            video.addEventListener("seeked", () => { window.clearTimeout(timer); resolve(); }, { once: true });
          });
        }
      }
      setTracking(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------
  /** Image affichée (jusqu'à 1920 px de large) avec ses joueurs suivis et ses consignes */
  const renderAnnotatedFrame = (): HTMLCanvasElement | null => {
    if (!seq) return null;
    const video = playerRef.current?.videoElement();
    const hasFrame = Boolean(video && video.videoWidth);
    const scale = hasFrame ? Math.min(1, 1920 / video!.videoWidth) : 1;
    const w = hasFrame ? Math.round(video!.videoWidth * scale) : 1600;
    const h = hasFrame ? Math.round(video!.videoHeight * scale) : 900;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (hasFrame) ctx.drawImage(video!, 0, 0, w, h);
    else {
      ctx.fillStyle = "#07090e";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      ctx.fillText(`Consignes de « ${seq.title} » (image de la vidéo non exportable depuis ${seq.source.kind === "youtube" ? "YouTube" : "Vimeo"})`, 32, h - 32);
    }
    renderPitchOverlay(ctx, seq.pitchOverlay, { x: 0, y: 0, w, h });
    if (seq.tracks?.length) renderTracks(ctx, seq.tracks, { x: 0, y: 0, w, h }, time);
    if (activeFreeze) renderShapes(ctx, activeFreeze.shapes, { x: 0, y: 0, w, h });
    return canvas;
  };

  const exportImage = () => {
    if (!seq) return;
    const canvas = renderAnnotatedFrame();
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width: w, height: h } = canvas;
    // Signature
    const label = `The Box - Recording · ${seq.title} · ${formatTime(time, true, fps)}`;
    ctx.font = `800 ${Math.round(w / 70)}px Inter, system-ui, sans-serif`;
    const tw = ctx.measureText(label).width;
    const pad = Math.round(w / 120);
    ctx.fillStyle = "rgba(7,9,14,0.72)";
    ctx.fillRect(w - tw - pad * 3, h - Math.round(w / 70) - pad * 3, tw + pad * 2, Math.round(w / 70) + pad * 2);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    ctx.fillText(label, w - tw - pad * 2, h - Math.round(w / 70) - pad * 2);
    try {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `TheBox_${seq.title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_")}_${formatTime(time, true, fps).replace(/[:.]/g, "-")}.png`;
      a.click();
      showToast("Image annotée exportée");
    } catch {
      setError("Export impossible : l'image de cette vidéo est protégée.");
    }
  };

  // ---------------------------------------------------------------------------
  // Bibliothèque : extraits vidéo (Entrée → Sortie) et images
  // ---------------------------------------------------------------------------
  const storageError = (e: unknown, what: string) =>
    setError(e instanceof Error && /quota|plein/i.test(e.message) ? "Espace de stockage plein sur cet appareil : supprimez d'anciennes séquences ou images." : `${what} impossible sur cet appareil.`);

  /**
   * Extrait = nouvelle séquence de la bibliothèque limitée à Entrée → Sortie. La vidéo n'est pas copiée : l'extrait
   * partage le fichier de la séquence d'origine (il reste disponible tant qu'une séquence l'utilise).
   */
  const extractClip = async () => {
    if (!seq || tracking) return;
    if (seq.inPoint === undefined && seq.outPoint === undefined) {
      showToast("Placez l'Entrée (I) et la Sortie (O) du passage à extraire");
      return;
    }
    const start = seq.inPoint ?? 0;
    const end = seq.outPoint ?? duration;
    if (end - start < 0.2) {
      showToast("Extrait trop court : écartez l'Entrée et la Sortie");
      return;
    }
    const tol = 0.5 / fps;
    const inRange = (t: number) => t >= start - tol && t <= end + tol;
    // Joueurs suivis : positions de la plage, avec la position exacte aux bornes s'il était déjà en course
    const tracksIn = (seq.tracks || [])
      .map((tr) => {
        let keys = tr.keys.filter((k) => inRange(k.t));
        for (const t of [start, end]) {
          const p = trackPosition(tr, t);
          if (p && !keys.some((k) => Math.abs(k.t - t) <= tol)) keys = insertKey(keys, { t, x: p.x, y: p.y });
        }
        return { ...tr, keys };
      })
      .filter((tr) => tr.keys.length > 0);
    const now = new Date().toISOString();
    const base = seq.title.trim() || "Séquence";
    const clip: Sequence = {
      ...seq,
      id: newId("seq"),
      title: `${base} · ${formatTime(start)}–${formatTime(end)}`.slice(0, 80),
      createdAt: now,
      updatedAt: now,
      inPoint: start,
      outPoint: end,
      tags: { ...seq.tags, players: [...seq.tags.players], custom: [...seq.tags.custom] },
      freezes: seq.freezes.filter((f) => inRange(f.time)),
      tracks: tracksIn,
      thumbnail: inRange(time) ? makeThumbnail() : seq.thumbnail,
      parentId: seq.parentId ?? seq.id,
      parentTitle: seq.parentTitle ?? base,
    };
    try {
      // Vidéo pas encore enregistrée (import en cours) : elle l'est maintenant, pour l'extrait
      if (seq.source.kind === "file" && pendingBlob) {
        await saveVideoBlob(seq.source.videoId, pendingBlob);
        setPendingBlob(null);
      }
      await saveSequence(clip);
      await refreshLibrary();
      showToast(`Extrait ${formatTime(start, true, fps)} → ${formatTime(end, true, fps)} ajouté à la bibliothèque`);
    } catch (e) {
      storageError(e, "Extraction");
    }
  };

  /** Image affichée (avec joueurs suivis et consignes) rangée dans la bibliothèque */
  const captureImage = async () => {
    if (!seq || tracking) return;
    if (seq.source.kind !== "file") {
      showToast("YouTube et Vimeo ne permettent pas de capturer l'image : importez le fichier vidéo");
      return;
    }
    const canvas = renderAnnotatedFrame();
    if (!canvas) return;
    try {
      const file = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!file) throw new Error("capture");
      const thumb = document.createElement("canvas");
      thumb.width = 320;
      thumb.height = Math.round((canvas.height / canvas.width) * 320);
      thumb.getContext("2d")?.drawImage(canvas, 0, 0, thumb.width, thumb.height);
      const base = seq.title.trim() || "Séquence";
      await saveImage(
        {
          id: newId("img"),
          version: 1,
          title: `${base} · ${formatTime(time, true, fps)}`.slice(0, 80),
          createdAt: new Date().toISOString(),
          sequenceId: seq.id,
          sequenceTitle: base,
          time,
          fps,
          width: canvas.width,
          height: canvas.height,
          tags: { ...seq.tags, players: [...seq.tags.players], custom: [...seq.tags.custom] },
          thumbnail: thumb.toDataURL("image/jpeg", 0.72),
        },
        file
      );
      await refreshLibrary();
      showToast(`Image ${formatTime(time, true, fps)} ajoutée à la bibliothèque`);
    } catch (e) {
      if (e instanceof Error && e.name === "SecurityError") setError("Capture impossible : l'image de cette vidéo est protégée.");
      else storageError(e, "Capture");
    }
  };

  const closeImageView = () => setImageView((v) => { if (v) URL.revokeObjectURL(v.url); return null; });
  const openImage = async (image: LibraryImage) => {
    try {
      const file = await loadImageFile(image.id);
      if (!file) { setError("Le fichier de cette image n'est plus sur cet appareil."); return; }
      setImageView((v) => { if (v) URL.revokeObjectURL(v.url); return { image, url: URL.createObjectURL(file) }; });
    } catch {
      setError("Lecture de l'image impossible depuis la bibliothèque.");
    }
  };
  const downloadImage = (view: { image: LibraryImage; url: string }) => downloadFile(view.url, `${fileName(view.image.title)}.jpg`);
  /** Téléchargement direct depuis la bibliothèque (sans ouvrir l'aperçu) */
  const downloadImageFile = async (image: LibraryImage) => {
    try {
      const file = await loadImageFile(image.id);
      if (!file) { setError("Le fichier de cette image n'est plus sur cet appareil."); return; }
      const url = URL.createObjectURL(file);
      downloadFile(url, `${fileName(image.title)}.jpg`);
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setError("Lecture de l'image impossible depuis la bibliothèque.");
    }
  };

  /**
   * Export d'une séquence ou d'un extrait en fichier vidéo (passage Entrée → Sortie, joueurs suivis incrustés,
   * arrêts sur image annotés tenus 3 s). L'enregistrement dure à peu près le temps du passage.
   */
  const exportVideoFile = async (s: Sequence) => {
    if (exporting || tracking) return;
    if (s.source.kind !== "file") {
      showToast("YouTube et Vimeo ne permettent pas d'exporter la vidéo : importez le fichier");
      return;
    }
    if (!clipExportFormat()) {
      setError("Ce navigateur ne sait pas enregistrer de vidéo : utilisez Chrome, Edge ou Safari.");
      return;
    }
    const isOpen = seq?.id === s.id;
    // Séquence ouverte : son état actuel (même non enregistré) ; sinon la version de la bibliothèque
    const current = isOpen && seq ? seq : s;
    let src = isOpen ? objectUrlRef.current : null;
    let ownUrl: string | null = null;
    try {
      if (!src && s.source.kind === "file") {
        const blob = await loadVideoBlob(s.source.videoId);
        if (!blob) { setError("La vidéo de cette séquence n'est plus sur cet appareil."); return; }
        ownUrl = URL.createObjectURL(blob);
        src = ownUrl;
      }
      if (!src) return;
      if (isOpen) { playerRef.current?.pause(); setPaused(true); }
      exportCancel.current = false;
      setExporting({ title: current.title, progress: 0 });
      const result = await exportClip({
        src,
        start: current.inPoint ?? 0,
        end: current.outPoint ?? Infinity,
        tracks: current.tracks || [],
        freezes: current.freezes,
        pitchOverlay: current.pitchOverlay,
        isCancelled: () => exportCancel.current,
        onProgress: (progress) => setExporting((e) => (e && Math.abs(e.progress - progress) > 0.005 ? { ...e, progress } : e)),
      });
      if (!result) { showToast("Export de la vidéo annulé"); return; }
      const url = URL.createObjectURL(result.blob);
      downloadFile(url, `${fileName(current.title)}.${result.extension}`);
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      showToast(`Vidéo ${result.extension.toUpperCase()} exportée (${Math.max(1, Math.round(result.blob.size / 1048576))} Mo)`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export de la vidéo impossible.");
    } finally {
      if (ownUrl) URL.revokeObjectURL(ownUrl);
      setExporting(null);
    }
  };
  const removeImage = async (image: LibraryImage) => {
    const ok = await confirmAction({ title: "Supprimer l'image ?", subject: image.title, message: "L'image sera effacée de cet appareil.", confirmLabel: "Supprimer" });
    if (!ok) return;
    try {
      await deleteImage(image.id);
    } catch {
      setError("Suppression impossible sur cet appareil.");
    }
    if (imageView?.image.id === image.id) closeImageView();
    await refreshLibrary();
  };
  /** Retour à la séquence d'origine, à l'instant de l'image */
  const goToImageSource = async (image: LibraryImage) => {
    const source = library.find((s) => s.id === image.sequenceId);
    if (!source) return;
    closeImageView();
    if (seq?.id === source.id) {
      playerRef.current?.pause();
      seek(image.time);
      return;
    }
    await openSequence(source, image.time);
  };

  // ---------------------------------------------------------------------------
  // Raccourcis clavier
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (exporting) {
        // Export vidéo en cours : seule Échap (annuler) est active
        if (e.key === "Escape") { e.preventDefault(); exportCancel.current = true; }
        return;
      }
      if (imageView) {
        // Aperçu d'image ouvert : seule Échap (fermer) est active
        if (e.key === "Escape") { e.preventDefault(); closeImageView(); }
        return;
      }
      if (!seq) return;
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (tracking) {
        // Pendant le suivi automatique, seule Échap (arrêter) est active
        if (key === "escape") { e.preventDefault(); trackingCancel.current = true; }
        return;
      }
      if (key === " ") { e.preventDefault(); togglePlay(); }
      else if (key === "arrowleft") { e.preventDefault(); if (e.shiftKey) seek(time - 5); else step(-1); }
      else if (key === "arrowright") { e.preventDefault(); if (e.shiftKey) seek(time + 5); else step(1); }
      else if (mod && key === "z") { e.preventDefault(); undo(); }
      else if (mod && key === "s") { e.preventDefault(); void save(); }
      else if ((key === "delete" || key === "backspace") && selectedId) { e.preventDefault(); deleteSelected(); }
      else if (key === "escape" && calibrating) setCalibrating(false);
      else if (key === "escape") { setSelectedId(null); setSelectedTrackId(null); if (tool !== "track") setTool("select"); }
      else if (!mod && key === "i") updateSeq({ inPoint: snap(time) });
      else if (!mod && key === "o") updateSeq({ outPoint: snap(time) });
      else if (!mod && key === "e") void extractClip();
      else if (!mod && key === "l") setLoop((v) => !v);
      else if (!mod) {
        const t = TOOLS.find((x) => x.key.toLowerCase() === key);
        if (t) setTool(t.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toolIdle = th.toolIdle;
  const toolOn = th.toolOn;
  const pitchOverlay = seq?.pitchOverlay;
  const separator = <span aria-hidden="true" className={`h-6 w-px mx-0.5 shrink-0 ${th.separator}`} />;
  const stageShapes = activeFreeze ? activeFreeze.shapes : null;

  return (
    <RecordingThemeContext.Provider value={th}>
      <div id="recording-command-center" className={`fixed inset-0 flex flex-col transition-colors duration-300 ${th.page}`} style={{ fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif' }}>
        {/* En-tête : identique au tableau tactique, signature « zone d'analyse vidéo » en rouge corail */}
        <header className={`h-16 shrink-0 px-3 sm:px-6 border-b flex items-center justify-between gap-3 relative z-40 ${th.header}`}>
          <div className="flex items-center gap-3 min-w-0">
            <LogoIcon className={`w-10 h-10 shrink-0 ${th.logo}`} />
            <div className="text-left select-none min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-black tracking-wider leading-none lowercase whitespace-nowrap ${th.brand}`}>the box</h1>
                <span className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${th.accentChip}`}>
                  <span className="w-2 h-2 rounded-full bg-[#FF5A4E] animate-pulse" aria-hidden="true" />Recording
                </span>
              </div>
              <p className={`whitespace-nowrap text-[8.5px] font-black uppercase tracking-[0.22em] leading-none mt-1 ${th.accentText}`}>zone d&apos;analyse vidéo</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {dirty && <span className={`hidden md:inline text-xs font-bold ${th.accentText}`}>● Non enregistré</span>}
            <button type="button" onClick={() => setIsLight((v) => { storeThemePreference(!v); return !v; })} className={`${toolBtn} ${toolIdle}`} title={isLight ? "Passer au thème sombre" : "Passer au thème clair"} aria-label={isLight ? "Thème sombre" : "Thème clair"}>
              {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Link href="/" className={`${toolBtn} ${toolIdle}`} title="Retour au tableau tactique" aria-label="Retour au tableau tactique">
              <ArrowLeft className="w-5 h-5" /><span className="hidden lg:inline">Tableau tactique</span>
            </Link>
            <button type="button" className={`${toolBtn} ${panelOpen ? toolOn : toolIdle} xl:hidden`} onClick={() => setPanelOpen((v) => !v)} title="Bibliothèque et séquence" aria-label="Bibliothèque et séquence" aria-pressed={panelOpen}><SlidersHorizontal className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Barre d'outils */}
        <div className={`shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-1.5 border-b overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${th.toolbar}`}>
          <div className={`flex items-center gap-1 h-8 shrink-0 ${th.toolGroup}`}>
            <button type="button" className={`${barBtn} ${toolIdle}`} onClick={() => fileInputRef.current?.click()} title="Importer un fichier vidéo de l'appareil" aria-label="Importer une vidéo"><Upload className="h-[18px] w-[18px] shrink-0" /><span className="hidden sm:inline">Importer</span></button>
            <button type="button" className={`${barBtn} ${toolIdle}`} onClick={() => { setLinkOpen(true); setLinkError(null); }} title="Lien YouTube ou Vimeo" aria-label="Lien vidéo"><Link2 className="h-[18px] w-[18px] shrink-0" /><span className="hidden sm:inline">Lien</span></button>
          </div>
          {separator}
          <div className={`flex items-center gap-1 h-8 shrink-0 ${th.toolGroup}`} role="group" aria-label="Outils de dessin">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" disabled={!seq || Boolean(tracking)} className={`${barBtn} ${tool === t.id ? toolOn : toolIdle}`} onClick={() => setTool(t.id)} aria-pressed={tool === t.id} title={`${t.label} (${t.key})`} aria-label={t.label}>
                <t.icon className="h-[18px] w-[18px] shrink-0" />
              </button>
            ))}
          </div>
          {separator}
          <div className={`flex items-center gap-1.5 h-8 shrink-0 px-1.5 ${th.toolGroup}`} role="group" aria-label="Couleur">
            {DRAW_COLORS.map((c) => (
              <button key={c.id} type="button" onClick={() => setColor(c.hex)} aria-pressed={color === c.hex} title={c.label} aria-label={`Couleur ${c.label.toLowerCase()}`} className={`w-4 h-4 rounded-full border cursor-pointer transition ${color === c.hex ? `${th.swatchOn} ring-2 ring-offset-1 ${th.light ? "ring-rose-500 ring-offset-white" : "ring-white ring-offset-[#090d14]"} scale-110` : th.swatchIdle}`} style={{ background: c.hex }} />
            ))}
          </div>
          <div className={`flex items-center gap-1 h-8 shrink-0 ${th.toolGroup}`} role="group" aria-label="Épaisseur">
            {DRAW_WIDTHS.map((wd) => (
              <button key={wd.value} type="button" onClick={() => setWidth(wd.value)} aria-pressed={width === wd.value} title={`Trait ${wd.label.toLowerCase()}`} aria-label={`Trait ${wd.label.toLowerCase()}`} className={`${barBtn} ${width === wd.value ? toolOn : toolIdle}`}>
                <span className="block w-4 rounded-full bg-current" style={{ height: Math.max(1.5, wd.value * 0.5) }} />
              </button>
            ))}
            <button type="button" onClick={() => setDashed((v) => !v)} aria-pressed={dashed} title="Trait en pointillés (course sans ballon)" aria-label="Pointillés" className={`${barBtn} ${dashed ? toolOn : toolIdle}`}>
              <span className="block w-4 border-t-2 border-dashed border-current" />
            </button>
          </div>
          {separator}
          <div className={`flex items-center gap-1 h-8 shrink-0 ${th.toolGroup}`}>
            <button type="button" disabled={!seq || Boolean(tracking) || history.current.length === 0} className={`${barBtn} ${toolIdle}`} onClick={undo} title="Annuler (Ctrl+Z)" aria-label="Annuler"><Undo2 className="h-[18px] w-[18px] shrink-0" /></button>
            <button type="button" disabled={!activeFreeze} className={`${barBtn} ${toolIdle}`} onClick={clearFreeze} title="Effacer les consignes de cette image" aria-label="Effacer l'image"><Eraser className="h-[18px] w-[18px] shrink-0" /></button>
          </div>
          {separator}
          {/* Repères du terrain en perspective : 5 couloirs, 3 zones, calage sur la pelouse */}
          <div className={`flex items-center gap-1 h-8 shrink-0 ${th.toolGroup}`} role="group" aria-label="Repères du terrain">
            <button type="button" disabled={!seq || Boolean(tracking)} className={`${barBtn} ${pitchOverlay?.zones ? toolOn : toolIdle}`} onClick={() => toggleOverlay("zones")} aria-pressed={Boolean(pitchOverlay?.zones)} title={pitchOverlay?.zones ? "Masquer les 5 couloirs du terrain" : "Afficher les 5 couloirs du terrain"} aria-label="5 couloirs du terrain">
              <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="8" x2="22" y2="8" strokeWidth="1.5" strokeDasharray="2 2" />
                <line x1="2" y1="10.5" x2="22" y2="10.5" strokeWidth="1.5" strokeDasharray="2 2" />
                <line x1="2" y1="13.5" x2="22" y2="13.5" strokeWidth="1.5" strokeDasharray="2 2" />
                <line x1="2" y1="16" x2="22" y2="16" strokeWidth="1.5" strokeDasharray="2 2" />
              </svg>
            </button>
            <button type="button" disabled={!seq || Boolean(tracking)} className={`${barBtn} ${pitchOverlay?.thirds ? toolOn : toolIdle}`} onClick={() => toggleOverlay("thirds")} aria-pressed={Boolean(pitchOverlay?.thirds)} title={pitchOverlay?.thirds ? "Masquer les 3 zones (défense, milieu, attaque)" : "Afficher les 3 zones (défense, milieu, attaque)"} aria-label="3 zones du terrain">
              <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="8.7" y1="4" x2="8.7" y2="20" strokeWidth="1.5" strokeDasharray="2 2" />
                <line x1="15.3" y1="4" x2="15.3" y2="20" strokeWidth="1.5" strokeDasharray="2 2" />
              </svg>
            </button>
            <button type="button" disabled={!seq || Boolean(tracking)} className={`${barBtn} ${calibrating ? toolOn : toolIdle}`} onClick={() => { if (!seqRef.current?.pitchOverlay) patchOverlay({}); setCalibrating((v) => !v); }} aria-pressed={calibrating} title="Caler la perspective : placer 4 poignées sur la pelouse pour que les couloirs et les zones suivent le terrain filmé" aria-label="Caler la perspective du terrain">
              <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 6h10l5 13H2z" />
                <circle cx="7" cy="6" r="1.6" fill="currentColor" />
                <circle cx="17" cy="6" r="1.6" fill="currentColor" />
                <circle cx="22" cy="19" r="1.6" fill="currentColor" />
                <circle cx="2" cy="19" r="1.6" fill="currentColor" />
              </svg>
              <span className="hidden md:inline">Caler</span>
            </button>
          </div>
          <span className="flex-1" />
          <div className={`flex items-center gap-1 h-8 shrink-0 ${th.toolGroup}`}>
            <button type="button" disabled={!seq} className={`${barBtn} ${toolIdle}`} onClick={closeSequence} title="Fermer la séquence" aria-label="Nouvelle séquence"><Plus className="h-[18px] w-[18px] shrink-0" /><span className="hidden md:inline">Nouvelle</span></button>
            <button type="button" disabled={!seq || Boolean(tracking)} className={`${barBtn} border ${dirty ? th.primaryBtn : toolIdle}`} onClick={() => void save()} title="Enregistrer dans la bibliothèque (Ctrl+S)" aria-label="Enregistrer"><Save className="h-[18px] w-[18px] shrink-0" /><span className="hidden md:inline">Enregistrer</span></button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void importFile(f); }}
        />

        <div className="relative flex-1 flex min-h-0">
          {/* Bibliothèque */}
          <aside className={`w-[250px] shrink-0 border-r ${th.sidebar} max-xl:hidden`}>
            <LibraryPanel sequences={library} images={images} activeId={seq?.id ?? null} storage={storage} onOpen={(s) => void openSequence(s)} onDelete={(s) => void removeSequence(s)} onOpenImage={(i) => void openImage(i)} onDeleteImage={(i) => void removeImage(i)} onExport={(s) => void exportVideoFile(s)} onDownloadImage={(i) => void downloadImageFile(i)} exportFormat={videoFormat} />
          </aside>

          {/* Scène + lecture */}
          <main className="relative flex-1 min-w-0 flex flex-col">
            <div
              className={`relative flex-1 min-h-0 ${th.stage}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) void importFile(f); }}
            >
              {source ? (
                <VideoStage
                  ref={playerRef}
                  source={source}
                  shapes={stageShapes}
                  tool={tool}
                  tracks={tracks}
                  time={tracking ? tracking.t : time}
                  live={Boolean(tracking)}
                  liveCanvasRef={liveCanvasRef}
                  selectedTrackId={selectedTrackId}
                  onTrackPointer={onTrackPointer}
                  color={color}
                  width={width}
                  dashed={dashed}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onBeginDraw={onBeginDraw}
                  onAddShape={onAddShape}
                  onMoveShape={onMoveShape}
                  pitchOverlay={pitchOverlay}
                  calibrating={calibrating && Boolean(pitchOverlay)}
                  onCalibrate={(quad) => patchOverlay({ quad })}
                  onReady={({ duration: d }) => {
                    setDuration(d);
                    setReady(true);
                    const at = pendingSeek.current ?? seqRef.current?.inPoint;
                    pendingSeek.current = null;
                    if (at !== undefined) {
                      playerRef.current?.seek(at);
                      setTime(at);
                    }
                  }}
                  onError={(m) => setError(m)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className={`max-w-lg w-full rounded-3xl border-2 border-dashed p-8 text-center space-y-4 ${dragOver ? "border-[#FF5A4E] bg-[#FF5A4E]/5" : th.hint}`}>
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-[#FF5A4E]/15 flex items-center justify-center"><span className="w-5 h-5 rounded-full bg-[#FF5A4E]" /></div>
                    <h2 className={`text-xl font-black ${th.text}`}>Analysez une séquence vidéo</h2>
                    <p className={`text-sm leading-relaxed ${th.sub}`}>
                      Glissez une vidéo ici, importez un fichier de l&apos;appareil ou collez un lien YouTube / Vimeo.
                      Lisez au ralenti ou image par image, figez l&apos;action et dessinez vos consignes.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className={`h-12 px-5 rounded-xl border text-sm font-black flex items-center gap-2 cursor-pointer ${th.primaryBtn}`}><Upload className="w-5 h-5" />Importer une vidéo</button>
                      <button type="button" onClick={() => setLinkOpen(true)} className={`h-12 px-5 rounded-xl border text-sm font-black flex items-center gap-2 cursor-pointer ${th.idleBtn}`}><Link2 className="w-5 h-5" />Lien YouTube / Vimeo</button>
                    </div>
                    <p className={`text-[12px] ${th.faint}`}>Les vidéos restent sur cet appareil : rien n&apos;est envoyé en ligne.</p>
                  </div>
                </div>
              )}

              {seq && ready && tool === "track" && !calibrating && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-3 z-10 rounded-2xl border px-3 py-2 text-sm font-bold shadow-xl pointer-events-none max-w-[calc(100%-24px)] text-center ${th.banner}`}>
                  {tracking ? (
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5" role="status">
                      <span className="tabular-nums">
                        {tracking.searching ? "Joueur masqué, recherche…" : tracking.direction > 0 ? "Suivi automatique…" : "Suivi vers l'arrière…"} {formatTime(tracking.t, true, fps)}
                      </span>
                      <span className={`relative h-1.5 w-24 rounded-full overflow-hidden ${th.light ? "bg-slate-200" : "bg-white/15"}`} aria-hidden="true">
                        <span className="absolute inset-y-0 left-0 bg-[#FF5A4E]" style={{ width: `${Math.round(tracking.progress * 100)}%` }} />
                      </span>
                      <button type="button" onClick={() => { trackingCancel.current = true; }} className={`pointer-events-auto h-9 px-3 rounded-lg border text-[13px] font-black flex items-center gap-1.5 cursor-pointer ${th.dangerBtn}`}>
                        <Square className="w-3.5 h-3.5" />Arrêter<span className="hidden sm:inline opacity-70">(Échap)</span>
                      </button>
                    </div>
                  ) : selectedTrackId ? (
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
                      <span>Cliquez sur les pieds du joueur pour corriger sa position à cet instant (Échap : nouveau joueur)</span>
                      {seq.source.kind === "file" && (
                        <span className="flex gap-1.5">
                          <button type="button" onClick={() => void runAutoTrack(selectedTrackId, -1)} title="Suivre le joueur vers le début de la vidéo, à partir de cet instant" className={`pointer-events-auto h-9 px-2.5 rounded-lg border text-[13px] font-black flex items-center gap-1 cursor-pointer ${th.idleBtn}`}>
                            <ChevronsLeft className="w-4 h-4" />Arrière
                          </button>
                          <button type="button" onClick={() => void runAutoTrack(selectedTrackId, 1)} title="Suivre le joueur automatiquement à partir de cet instant" className={`pointer-events-auto h-9 px-3 rounded-lg border text-[13px] font-black flex items-center gap-1.5 cursor-pointer ${th.primaryBtn}`}>
                            <Wand2 className="w-4 h-4" />Suivi auto
                          </button>
                        </span>
                      )}
                    </div>
                  ) : (
                    "Suivi : cliquez sur les pieds d'un joueur pour le suivre"
                  )}
                </div>
              )}
              {seq && !activeFreeze && paused && ready && tool !== "select" && tool !== "track" && !calibrating && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-3 z-10 rounded-2xl border px-3 py-2 text-sm font-bold shadow-xl pointer-events-none ${th.banner}`}>
                  {TOOL_LABELS[tool as keyof typeof TOOL_LABELS]} : tracez sur l&apos;image pour créer un arrêt sur image
                </div>
              )}
              {seq && calibrating && pitchOverlay && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-3 z-10 rounded-2xl border px-3 py-2 shadow-xl w-max max-w-[calc(100%-24px)] ${th.banner}`} role="dialog" aria-label="Calage de la perspective">
                  <p className="text-sm font-bold text-center">
                    Placez les poignées 1 à 4 sur les {pitchRef(pitchOverlay.ref).hint} : 1 = loin à gauche, 2 = loin à droite, 3 = près à droite, 4 = près à gauche.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                    {PITCH_REFS.map((r) => (
                      <button key={r.id} type="button" onClick={() => patchOverlay({ ref: r.id })} aria-pressed={pitchOverlay.ref === r.id} className={`h-9 px-2.5 rounded-lg border text-[13px] font-black cursor-pointer ${pitchOverlay.ref === r.id ? th.primaryBtn : th.idleBtn}`}>
                        {r.label}
                      </button>
                    ))}
                    <span aria-hidden="true" className={`h-6 w-px mx-0.5 ${th.separator}`} />
                    <button type="button" onClick={() => patchOverlay({ attackLeft: !pitchOverlay.attackLeft })} title="Sens d'attaque de l'équipe : inverse Défense et Attaque" className={`h-9 px-2.5 rounded-lg border text-[13px] font-black cursor-pointer ${th.idleBtn}`}>
                      {pitchOverlay.attackLeft ? "Attaque ← gauche" : "Attaque → droite"}
                    </button>
                    <button type="button" onClick={() => setCalibrating(false)} className={`h-9 px-3 rounded-lg border text-[13px] font-black cursor-pointer ${th.primaryBtn}`}>
                      Terminé
                    </button>
                  </div>
                </div>
              )}
              {activeFreeze && (
                <div className="absolute left-3 top-3 z-10 h-8 px-2.5 rounded-lg bg-[#FF5A4E] text-white text-xs font-black flex items-center gap-1.5 shadow-lg pointer-events-none">
                  ❚❚ Arrêt sur image · {formatTime(activeFreeze.time, true, fps)}
                </div>
              )}
              {error && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-20 max-w-[min(560px,calc(100%-24px))] flex items-start gap-2 rounded-xl border border-rose-400/50 bg-[#1a0b0d]/95 px-3 py-2.5 text-sm font-semibold text-rose-100 shadow-xl">
                  <span className="flex-1">{error}</span>
                  <button type="button" onClick={() => setError(null)} aria-label="Fermer le message" className="shrink-0 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              )}
              {toast && (
                <div className="absolute left-1/2 -translate-x-1/2 top-3 z-30 rounded-2xl bg-white/95 border border-[#FF5A4E] px-4 py-2 text-sm font-black text-slate-900 shadow-2xl pointer-events-none">{toast}</div>
              )}
            </div>

            <Transport
              disabled={!seq || !ready || Boolean(tracking)}
              time={time}
              duration={duration}
              paused={paused}
              rate={rate}
              fps={fps}
              inPoint={seq?.inPoint}
              outPoint={seq?.outPoint}
              loop={loop}
              freezes={seq?.freezes || []}
              activeFreezeId={activeFreeze?.id ?? null}
              onTogglePlay={togglePlay}
              onStep={step}
              onJump={(s) => seek(time + s)}
              onSeek={(t) => { playerRef.current?.pause(); seek(t); }}
              onRate={(r) => void changeRate(r)}
              onFps={(f) => updateSeq({ fps: f })}
              onSetIn={() => updateSeq((s) => ({ inPoint: snap(time), outPoint: s.outPoint !== undefined && s.outPoint <= time ? undefined : s.outPoint }))}
              onSetOut={() => updateSeq((s) => ({ outPoint: snap(time), inPoint: s.inPoint !== undefined && s.inPoint >= time ? undefined : s.inPoint }))}
              onClearClip={() => updateSeq({ inPoint: undefined, outPoint: undefined })}
              onToggleLoop={() => setLoop((v) => !v)}
              onExtract={() => void extractClip()}
              onCapture={() => void captureImage()}
              canCapture={seq?.source.kind === "file"}
            />
          </main>

          {/* Séquence (et bibliothèque sur petit écran) */}
          <aside
            className={`border-l overflow-y-auto overscroll-contain w-[340px] shrink-0 ${th.sidebar}
              max-xl:absolute max-xl:right-0 max-xl:top-0 max-xl:bottom-0 max-xl:z-40 max-xl:w-[min(380px,92vw)] max-xl:shadow-2xl max-xl:transition-transform
              ${panelOpen ? "max-xl:translate-x-0" : "max-xl:translate-x-full max-xl:pointer-events-none"}`}
            aria-label="Séquence"
          >
            <div className="xl:hidden flex justify-end p-2">
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Fermer le panneau" className={`h-9 w-9 rounded-lg flex items-center justify-center cursor-pointer ${toolIdle}`}><X className="w-4 h-4" /></button>
            </div>
            {seq ? (
              <SequencePanel
                sequence={seq}
                roster={roster}
                activeFreezeId={activeFreeze?.id ?? null}
                onChange={(patch) => updateSeq(patch)}
                onTags={(tags: SequenceTags) => updateSeq({ tags })}
                onGoToFreeze={(f) => { playerRef.current?.pause(); seek(f.time); }}
                onUpdateFreeze={(id, patch) => setFreezes((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)))}
                onDeleteFreeze={(id) => setFreezes((list) => list.filter((f) => f.id !== id))}
                onExportImage={exportImage}
                onExtractClip={() => void extractClip()}
                onCaptureImage={() => void captureImage()}
                onExportVideo={() => void exportVideoFile(seq)}
                exportFormat={videoFormat}
                canExportFrame={seq.source.kind === "file"}
                tracks={tracks}
                selectedTrackId={selectedTrackId}
                tracking={tracking}
                canAutoTrack={seq.source.kind === "file"}
                onSelectTrack={(id) => { setSelectedTrackId(id); setTool("track"); }}
                onNewTrack={() => { setSelectedTrackId(null); setTool("track"); }}
                onUpdateTrack={(id, patch) => setTracks((list) => list.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr)))}
                onDeleteTrack={(id) => { setTracks((list) => list.filter((tr) => tr.id !== id)); if (selectedTrackId === id) setSelectedTrackId(null); }}
                onAutoTrack={(id, direction) => void runAutoTrack(id, direction)}
                onCancelTracking={() => { trackingCancel.current = true; }}
              />
            ) : (
              <p className={`m-3 rounded-xl border border-dashed p-3 text-[13px] leading-relaxed ${th.hint}`}>
                Importez une vidéo ou ouvrez une séquence de la bibliothèque pour la taguer et l&apos;annoter.
              </p>
            )}
            <div className="xl:hidden border-t h-[60vh]">
              <LibraryPanel sequences={library} images={images} activeId={seq?.id ?? null} storage={storage} onOpen={(s) => void openSequence(s)} onDelete={(s) => void removeSequence(s)} onOpenImage={(i) => void openImage(i)} onDeleteImage={(i) => void removeImage(i)} onExport={(s) => void exportVideoFile(s)} onDownloadImage={(i) => void downloadImageFile(i)} exportFormat={videoFormat} />
            </div>
          </aside>
        </div>

        {/* Export vidéo en cours */}
        {exporting && (
          <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3">
            <div role="dialog" aria-modal="true" aria-labelledby="export-title" className={`w-full max-w-md rounded-3xl border p-5 space-y-4 shadow-2xl ${th.dialog}`}>
              <div>
                <h2 id="export-title" className="text-lg font-black">Export de la vidéo…</h2>
                <p className={`text-[13px] font-semibold truncate ${th.sub}`}>{exporting.title}</p>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${th.light ? "bg-slate-200" : "bg-white/10"}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(exporting.progress * 100)}>
                <div className="h-full bg-[#FF5A4E] transition-[width] duration-200" style={{ width: `${Math.round(exporting.progress * 100)}%` }} />
              </div>
              <p className={`text-[12px] leading-relaxed ${th.faint}`}>
                Le passage est rejoué puis enregistré avec les joueurs suivis et les arrêts sur image annotés : l&apos;export dure
                environ le temps du passage. Gardez cet onglet affiché.
              </p>
              <div className="flex justify-end">
                <button type="button" onClick={() => { exportCancel.current = true; }} className={`h-11 px-5 rounded-xl border text-sm font-black cursor-pointer ${th.idleBtn}`}>Annuler (Échap)</button>
              </div>
            </div>
          </div>
        )}

        {/* Image de la bibliothèque */}
        {imageView && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3" onPointerDown={(e) => { if (e.target === e.currentTarget) closeImageView(); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="image-title" className={`w-full max-w-5xl max-h-full flex flex-col rounded-3xl border p-4 gap-3 shadow-2xl ${th.dialog}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="image-title" className="text-lg font-black truncate">{imageView.image.title}</h2>
                  <p className={`text-[13px] font-semibold ${th.sub}`}>
                    « {imageView.image.sequenceTitle} » à {formatTime(imageView.image.time, true, imageView.image.fps)} · {new Date(imageView.image.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <button type="button" onClick={closeImageView} aria-label="Fermer" className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center cursor-pointer ${th.idleBtn}`}><X className="w-5 h-5" /></button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageView.url} alt={imageView.image.title} className="min-h-0 w-full object-contain rounded-xl bg-black" style={{ maxHeight: "calc(100vh - 220px)" }} />
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => void removeImage(imageView.image)} className={`h-11 px-4 rounded-xl border text-sm font-black flex items-center gap-2 cursor-pointer ${th.dangerBtn}`}><Trash2 className="w-4 h-4" />Supprimer</button>
                {library.some((s) => s.id === imageView.image.sequenceId) && (
                  <button type="button" onClick={() => void goToImageSource(imageView.image)} className={`h-11 px-4 rounded-xl border text-sm font-black flex items-center gap-2 cursor-pointer ${th.idleBtn}`}><Film className="w-4 h-4" />Ouvrir la séquence à cet instant</button>
                )}
                <button type="button" onClick={() => downloadImage(imageView)} className={`h-11 px-5 rounded-xl border text-sm font-black flex items-center gap-2 cursor-pointer ${th.primaryBtn}`}><Download className="w-4 h-4" />Télécharger</button>
              </div>
            </div>
          </div>
        )}

        {/* Lien YouTube / Vimeo */}
        {linkOpen && (
          <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onPointerDown={(e) => { if (e.target === e.currentTarget) setLinkOpen(false); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="link-title" className={`w-full max-w-lg rounded-3xl border p-5 space-y-4 shadow-2xl ${th.dialog}`}>
              <div className="flex items-center justify-between">
                <h2 id="link-title" className="text-lg font-black">Lien vidéo</h2>
                <button type="button" onClick={() => setLinkOpen(false)} aria-label="Fermer" className={`w-11 h-11 rounded-xl border flex items-center justify-center cursor-pointer ${th.idleBtn}`}><X className="w-5 h-5" /></button>
              </div>
              <input
                autoFocus
                value={linkValue}
                onChange={(e) => { setLinkValue(e.target.value); setLinkError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") void importLink(); e.stopPropagation(); }}
                placeholder="https://www.youtube.com/watch?v=… ou https://vimeo.com/…"
                aria-label="Lien de la vidéo"
                className={th.input}
              />
              {linkError ? (
                <p className="text-sm font-semibold text-rose-400">{linkError}</p>
              ) : (
                <p className={`text-[13px] leading-relaxed ${th.sub}`}>
                  YouTube et Vimeo se lisent ici avec le ralenti et l&apos;avance image par image. Pour Veo, téléchargez le clip puis importez le fichier.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setLinkOpen(false)} className={`h-12 px-5 rounded-xl border text-sm font-black cursor-pointer ${th.idleBtn}`}>Annuler</button>
                <button type="button" onClick={() => void importLink()} className={`h-12 px-6 rounded-xl border text-sm font-black cursor-pointer ${th.primaryBtn}`}>Ouvrir la vidéo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RecordingThemeContext.Provider>
  );
}
