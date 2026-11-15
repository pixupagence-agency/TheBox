"use client";

// Module Recording (phase 1) : import d'une séquence vidéo, analyse image par image, consignes dessinées
// sur des arrêts sur image, bibliothèque taguée enregistrée sur l'appareil et export d'image annotée.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, Circle, Crosshair, Eraser, Focus, Link2, Moon, MousePointer2, PenTool, Plus, Save, SlidersHorizontal,
  Spline, Sun, Type, Undo2, Upload, X,
} from "lucide-react";
import LogoIcon from "@/components/LogoIcon";
import { confirmAction } from "@/components/ConfirmDialog";
import VideoStage, { type PlayerHandle, type StageSource } from "./VideoStage";
import Transport from "./Transport";
import LibraryPanel from "./LibraryPanel";
import SequencePanel from "./SequencePanel";
import {
  deleteSequence, listSequences, loadVideoBlob, newId, requestPersistentStorage, saveSequence, saveVideoBlob, storageEstimate,
} from "@/lib/recording/db";
import { renderShapes, renderTracks, trackPosition } from "@/lib/recording/draw";
import { autoTrack } from "@/lib/recording/tracker";
import { formatTime, parseVideoLink } from "@/lib/recording/sources";
import { DRAW_COLORS, DRAW_WIDTHS, TOOL_LABELS } from "@/lib/recording/tags";
import { RecordingThemeContext, getRecordingTheme, readThemePreference, storeThemePreference } from "@/lib/recording/theme";
import { emptyTags, type Freeze, type Sequence, type Shape, type SequenceTags, type StageTool, type Track } from "@/lib/recording/types";
import { readActiveRoster } from "@/lib/training/storage";

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

export default function RecordingEditor() {
  const [isLight, setIsLight] = useState<boolean>(() => readThemePreference());
  const th = getRecordingTheme(isLight);
  const roster = useMemo(() => readActiveRoster(), []);
  const playerRef = useRef<PlayerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [library, setLibrary] = useState<Sequence[]>([]);
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
  type Snapshot = { freezes: Freeze[]; tracks: Track[] };
  const history = useRef<Snapshot[]>([]);
  const moveSnapshot = useRef<Snapshot | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const trackDrag = useRef<{ id: string; t: number } | null>(null);
  const [tracking, setTracking] = useState<{ trackId: string; t: number } | null>(null);
  const trackingCancel = useRef(false);
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

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const refreshLibrary = useCallback(async () => {
    try {
      setLibrary(await listSequences());
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

  const openSequence = async (s: Sequence) => {
    if (seq?.id === s.id) return;
    if (!(await confirmLeave())) return;
    if (s.source.kind === "file") {
      try {
        const blob = await loadVideoBlob(s.source.videoId);
        if (!blob) { setError("La vidéo de cette séquence n'est plus sur cet appareil."); return; }
        const url = setFileUrl(blob)!;
        startSequence(s, { kind: "file", url }, null);
      } catch {
        setError("Lecture de la vidéo impossible depuis la bibliothèque.");
        return;
      }
    } else {
      setFileUrl(null);
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
    const ok = await confirmAction({
      title: "Supprimer la séquence ?",
      subject: s.title,
      message: s.source.kind === "file" ? "La séquence et sa vidéo seront effacées de cet appareil." : "La séquence et ses consignes seront effacées de cet appareil.",
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
        trackDrag.current = { id: hitId, t };
        history.current = [...history.current.slice(-49), { freezes: seq.freezes, tracks }];
        return;
      }
      const selected = tracks.find((tr) => tr.id === selectedTrackId);
      if (selected) {
        // Joueur sélectionné : nouvelle position à cet instant (correction manuelle)
        setTracks((list) => list.map((tr) => (tr.id === selected.id ? upsertKey(tr, t, p.x, p.y) : tr)));
        trackDrag.current = { id: selected.id, t };
        return;
      }
      const track: Track = { id: newId("track"), color, style: "ring", size: 0.022, trail: true, keys: [{ t, x: p.x, y: p.y }] };
      setTracks((list) => [...list, track]);
      setSelectedTrackId(track.id);
      trackDrag.current = { id: track.id, t };
      showToast("Joueur suivi : lancez le suivi automatique ou placez-le à d'autres instants");
      return;
    }
    if (phase === "move" && trackDrag.current) {
      const { id, t } = trackDrag.current;
      setTracks((list) => list.map((tr) => (tr.id === id ? upsertKey(tr, t, p.x, p.y) : tr)), false);
      return;
    }
    if (phase === "up") trackDrag.current = null;
  };

  const runAutoTrack = async (trackId: string) => {
    const tr = tracks.find((x) => x.id === trackId);
    const pl = playerRef.current;
    if (!tr || !pl || !seq || !objectUrlRef.current || tracking) return;
    pl.pause();
    const now = snap(pl.getTime());
    const from = trackPosition(tr, now) ? { t: now, ...trackPosition(tr, now)! } : tr.keys[tr.keys.length - 1];
    const until = Math.min(seq.outPoint ?? duration, from.t + 30);
    if (until - from.t < 1 / fps) { showToast("Placez-vous avant la fin de la vidéo pour suivre le joueur"); return; }
    history.current = [...history.current.slice(-49), { freezes: seq.freezes, tracks }];
    // Les positions déjà présentes après le point de départ sont recalculées
    setTracks((list) => list.map((x) => (x.id === trackId ? { ...x, keys: [...x.keys.filter((k) => k.t < from.t - 0.5 / fps), { t: from.t, x: from.x, y: from.y }] } : x)), false);
    trackingCancel.current = false;
    setTracking({ trackId, t: from.t });
    try {
      const result = await autoTrack(objectUrlRef.current, {
        fps,
        from,
        size: tr.size,
        until,
        keyEvery: 2,
        isCancelled: () => trackingCancel.current,
        onProgress: (key) => {
          setTracking({ trackId, t: key.t });
          setTracks((list) => list.map((x) => (x.id === trackId ? { ...x, keys: [...x.keys, key] } : x)), false);
        },
      });
      const last = result.keys[result.keys.length - 1];
      if (last) setTracks((list) => list.map((x) => (x.id === trackId && x.keys[x.keys.length - 1]?.t !== last.t ? { ...x, keys: [...x.keys, last] } : x)), false);
      const reached = last ? formatTime(last.t, true, fps) : formatTime(from.t, true, fps);
      if (result.reason === "lost") showToast(`Joueur perdu à ${reached} : replacez-le puis relancez le suivi`);
      else if (result.reason === "cancel") showToast(`Suivi arrêté à ${reached}`);
      else showToast(`Suivi terminé jusqu'à ${reached}`);
      if (last) { pl.seek(last.t); setTime(last.t); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suivi automatique impossible.");
    } finally {
      setTracking(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------
  const exportImage = () => {
    if (!seq) return;
    const video = playerRef.current?.videoElement();
    const hasFrame = Boolean(video && video.videoWidth);
    const scale = hasFrame ? Math.min(1, 1920 / video!.videoWidth) : 1;
    const w = hasFrame ? Math.round(video!.videoWidth * scale) : 1600;
    const h = hasFrame ? Math.round(video!.videoHeight * scale) : 900;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (hasFrame) ctx.drawImage(video!, 0, 0, w, h);
    else {
      ctx.fillStyle = "#07090e";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "700 22px Inter, system-ui, sans-serif";
      ctx.fillText(`Consignes de « ${seq.title} » (image de la vidéo non exportable depuis ${seq.source.kind === "youtube" ? "YouTube" : "Vimeo"})`, 32, h - 32);
    }
    if (seq.tracks?.length) renderTracks(ctx, seq.tracks, { x: 0, y: 0, w, h }, time);
    if (activeFreeze) renderShapes(ctx, activeFreeze.shapes, { x: 0, y: 0, w, h });
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
  // Raccourcis clavier
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (!seq) return;
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (key === " ") { e.preventDefault(); togglePlay(); }
      else if (key === "arrowleft") { e.preventDefault(); if (e.shiftKey) seek(time - 5); else step(-1); }
      else if (key === "arrowright") { e.preventDefault(); if (e.shiftKey) seek(time + 5); else step(1); }
      else if (mod && key === "z") { e.preventDefault(); undo(); }
      else if (mod && key === "s") { e.preventDefault(); void save(); }
      else if ((key === "delete" || key === "backspace") && selectedId) { e.preventDefault(); deleteSelected(); }
      else if (key === "escape") { setSelectedId(null); setSelectedTrackId(null); if (tool !== "track") setTool("select"); }
      else if (!mod && key === "i") updateSeq({ inPoint: snap(time) });
      else if (!mod && key === "o") updateSeq({ outPoint: snap(time) });
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
        <div className={`shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-2 border-b overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${th.toolbar}`}>
          <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
            <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => fileInputRef.current?.click()} title="Importer un fichier vidéo de l'appareil" aria-label="Importer une vidéo"><Upload className="w-5 h-5" /><span className="hidden sm:inline">Importer</span></button>
            <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => { setLinkOpen(true); setLinkError(null); }} title="Lien YouTube ou Vimeo" aria-label="Lien vidéo"><Link2 className="w-5 h-5" /><span className="hidden sm:inline">Lien</span></button>
          </div>
          {separator}
          <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`} role="group" aria-label="Outils de dessin">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" disabled={!seq} className={`${toolBtn} ${tool === t.id ? toolOn : toolIdle}`} onClick={() => setTool(t.id)} aria-pressed={tool === t.id} title={`${t.label} (${t.key})`} aria-label={t.label}>
                <t.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
          {separator}
          <div className={`flex items-center gap-1 shrink-0 px-1 ${th.toolGroup}`} role="group" aria-label="Couleur">
            {DRAW_COLORS.map((c) => (
              <button key={c.id} type="button" onClick={() => setColor(c.hex)} aria-pressed={color === c.hex} title={c.label} aria-label={`Couleur ${c.label.toLowerCase()}`} className={`w-8 h-8 m-0.5 rounded-full border-2 cursor-pointer transition ${color === c.hex ? `${th.swatchOn} scale-110` : th.swatchIdle}`} style={{ background: c.hex }} />
            ))}
          </div>
          <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`} role="group" aria-label="Épaisseur">
            {DRAW_WIDTHS.map((wd) => (
              <button key={wd.value} type="button" onClick={() => setWidth(wd.value)} aria-pressed={width === wd.value} title={`Trait ${wd.label.toLowerCase()}`} aria-label={`Trait ${wd.label.toLowerCase()}`} className={`${toolBtn} ${width === wd.value ? toolOn : toolIdle}`}>
                <span className="block w-6 rounded-full bg-current" style={{ height: wd.value * 0.7 }} />
              </button>
            ))}
            <button type="button" onClick={() => setDashed((v) => !v)} aria-pressed={dashed} title="Trait en pointillés (course sans ballon)" aria-label="Pointillés" className={`${toolBtn} ${dashed ? toolOn : toolIdle}`}>
              <span className="block w-6 border-t-[3px] border-dashed border-current" />
            </button>
          </div>
          {separator}
          <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
            <button type="button" disabled={!seq || history.current.length === 0} className={`${toolBtn} ${toolIdle}`} onClick={undo} title="Annuler (Ctrl+Z)" aria-label="Annuler"><Undo2 className="w-5 h-5" /></button>
            <button type="button" disabled={!activeFreeze} className={`${toolBtn} ${toolIdle}`} onClick={clearFreeze} title="Effacer les consignes de cette image" aria-label="Effacer l'image"><Eraser className="w-5 h-5" /></button>
          </div>
          <span className="flex-1" />
          <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
            <button type="button" disabled={!seq} className={`${toolBtn} ${toolIdle}`} onClick={closeSequence} title="Fermer la séquence" aria-label="Nouvelle séquence"><Plus className="w-5 h-5" /><span className="hidden md:inline">Nouvelle</span></button>
            <button type="button" disabled={!seq} className={`${toolBtn} border ${dirty ? th.primaryBtn : toolIdle}`} onClick={() => void save()} title="Enregistrer dans la bibliothèque (Ctrl+S)" aria-label="Enregistrer"><Save className="w-5 h-5" /><span className="hidden md:inline">Enregistrer</span></button>
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
            <LibraryPanel sequences={library} activeId={seq?.id ?? null} storage={storage} onOpen={(s) => void openSequence(s)} onDelete={(s) => void removeSequence(s)} />
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
                  time={time}
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
                  onReady={({ duration: d }) => {
                    setDuration(d);
                    setReady(true);
                    if (seqRef.current?.inPoint !== undefined) playerRef.current?.seek(seqRef.current.inPoint);
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

              {seq && ready && tool === "track" && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-3 z-10 rounded-2xl border px-3 py-2 text-sm font-bold shadow-xl pointer-events-none max-w-[calc(100%-24px)] text-center ${th.banner}`}>
                  {tracking
                    ? `Suivi automatique en cours… ${formatTime(tracking.t, true, fps)}`
                    : selectedTrackId
                      ? "Cliquez sur les pieds du joueur pour corriger sa position à cet instant (Échap : nouveau joueur)"
                      : "Suivi : cliquez sur les pieds d'un joueur pour le suivre"}
                </div>
              )}
              {seq && !activeFreeze && paused && ready && tool !== "select" && tool !== "track" && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-3 z-10 rounded-2xl border px-3 py-2 text-sm font-bold shadow-xl pointer-events-none ${th.banner}`}>
                  {TOOL_LABELS[tool as keyof typeof TOOL_LABELS]} : tracez sur l&apos;image pour créer un arrêt sur image
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
              disabled={!seq || !ready}
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
                canExportFrame={seq.source.kind === "file"}
                tracks={tracks}
                selectedTrackId={selectedTrackId}
                tracking={tracking}
                canAutoTrack={seq.source.kind === "file"}
                onSelectTrack={(id) => { setSelectedTrackId(id); setTool("track"); }}
                onNewTrack={() => { setSelectedTrackId(null); setTool("track"); }}
                onUpdateTrack={(id, patch) => setTracks((list) => list.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr)))}
                onDeleteTrack={(id) => { setTracks((list) => list.filter((tr) => tr.id !== id)); if (selectedTrackId === id) setSelectedTrackId(null); }}
                onAutoTrack={(id) => void runAutoTrack(id)}
                onCancelTracking={() => { trackingCancel.current = true; }}
              />
            ) : (
              <p className={`m-3 rounded-xl border border-dashed p-3 text-[13px] leading-relaxed ${th.hint}`}>
                Importez une vidéo ou ouvrez une séquence de la bibliothèque pour la taguer et l&apos;annoter.
              </p>
            )}
            <div className="xl:hidden border-t h-[60vh]">
              <LibraryPanel sequences={library} activeId={seq?.id ?? null} storage={storage} onOpen={(s) => void openSequence(s)} onDelete={(s) => void removeSequence(s)} />
            </div>
          </aside>
        </div>

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
