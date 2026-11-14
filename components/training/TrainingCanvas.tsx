"use client";

// Module Training : canevas Konva de l'éditeur (vue de dessus).
// Unités du monde = mètres. La scène porte l'échelle (pixels par mètre) et le décalage de la vue.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Circle, Group, Layer, Line, Rect, Shape, Stage, Transformer } from "react-konva";
import { ElementShape, ZoneBody, arrowPath, boostFor } from "./ElementShape";
import { createElement, type PaletteItem } from "@/lib/training/catalog";
import { isElementVisible, round2, snapValue, type EditorAction, type EditorState } from "@/lib/training/editorState";
import { PITCH_MARGIN, pitchMarkings } from "@/lib/training/pitch";
import type { ArrowElement, PitchConfig, TrainingElement, ZoneElement } from "@/lib/training/types";

Konva.dragDistance = 4;
Konva.hitOnDragEnabled = true;

export type CanvasMode = "select" | "pan";

export interface TrainingCanvasHandle {
  fit: () => void;
  zoomBy: (factor: number) => void;
  /** Centre de la vue, en mètres */
  viewCenter: () => { x: number; y: number };
  /** Point de l'écran → mètres (null si hors du canevas) */
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number } | null;
  /** Image PNG du schéma (export, phase 3) */
  toDataURL: () => string | null;
}

interface Props {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  mode: CanvasMode;
  multiSelect: boolean;
  armed: PaletteItem | null;
  /** Pose un élément de palette à une position (m) — partagé avec le glisser-déposer */
  onPlace: (item: PaletteItem, x: number, y: number) => void;
  onPolygonProgress?: (points: number) => void;
  polygonCommand?: { id: number; action: "finish" | "cancel" } | null;
}

type Gesture =
  | { type: "none" }
  | { type: "marquee"; x0: number; y0: number; sx: number; sy: number; additive: boolean }
  | { type: "pan"; sx: number; sy: number; vx: number; vy: number }
  | { type: "tap"; sx: number; sy: number }
  | { type: "arrow"; x0: number; y0: number }
  | { type: "zone"; x0: number; y0: number }
  | { type: "pinch"; dist: number; cx: number; cy: number };

const ORDER: Record<TrainingElement["kind"], number> = {
  zone: 0, ladder: 1, hoop: 1, goal: 1, miniGoal: 1, flatCone: 2, tallCone: 2, pole: 2, mannequin: 2, ball: 3,
  player: 4, arrow: 5, step: 6, text: 6,
};

/** Dessine l'herbe et les lignes du terrain (une seule forme, sans interaction) */
function drawPitch(ctx: Konva.Context, pitch: PitchConfig, scale: number) {
  const L = pitch.length, W = pitch.width, M = PITCH_MARGIN;
  const c = ctx._context;
  c.fillStyle = "#0a3d2b";
  c.fillRect(-M, -M, L + 2 * M, W + 2 * M);
  const stripes = Math.max(6, Math.round(L / 5.25));
  const sw = L / stripes;
  for (let i = 0; i < stripes; i++) {
    c.fillStyle = i % 2 === 0 ? "#0f4a33" : "#0c432e";
    c.fillRect(i * sw, 0, sw, W);
  }
  const lw = Math.max(0.12, 1.4 / scale);
  c.strokeStyle = "rgba(255,255,255,0.88)";
  c.fillStyle = "rgba(255,255,255,0.9)";
  c.lineWidth = lw;
  c.lineJoin = "miter";
  for (const m of pitchMarkings(pitch)) {
    c.beginPath();
    switch (m.t) {
      case "rect": c.rect(m.x, m.y, m.w, m.h); c.stroke(); break;
      case "line": c.moveTo(m.points[0], m.points[1]); for (let i = 2; i < m.points.length; i += 2) c.lineTo(m.points[i], m.points[i + 1]); c.stroke(); break;
      case "circle": c.arc(m.x, m.y, m.r, 0, Math.PI * 2); c.stroke(); break;
      case "arc": c.arc(m.x, m.y, m.r, (m.from * Math.PI) / 180, (m.to * Math.PI) / 180); c.stroke(); break;
      case "spot": c.arc(m.x, m.y, Math.max(0.2, 2 / scale), 0, Math.PI * 2); c.fill(); break;
      case "goal": {
        const x = m.depth < 0 ? m.x + m.depth : m.x;
        c.save();
        c.fillStyle = "rgba(255,255,255,0.12)";
        c.fillRect(x, m.y, Math.abs(m.depth), m.w);
        c.restore();
        c.rect(x, m.y, Math.abs(m.depth), m.w);
        c.stroke();
        break;
      }
    }
  }
}

function drawGrid(ctx: Konva.Context, pitch: PitchConfig, size: number, scale: number) {
  const c = ctx._context;
  const M = PITCH_MARGIN;
  const x0 = -M, x1 = pitch.length + M, y0 = -M, y1 = pitch.width + M;
  c.lineWidth = 1 / scale;
  const strongEvery = Math.max(1, Math.round(5 / size));
  let k = 0;
  for (let x = 0; x <= x1; x += size, k++) {
    c.strokeStyle = k % strongEvery === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)";
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
  }
  k = 1;
  for (let x = -size; x >= x0; x -= size, k++) {
    c.strokeStyle = k % strongEvery === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)";
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
  }
  k = 0;
  for (let y = 0; y <= y1; y += size, k++) {
    c.strokeStyle = k % strongEvery === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)";
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  }
  k = 1;
  for (let y = -size; y >= y0; y -= size, k++) {
    c.strokeStyle = k % strongEvery === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)";
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  }
}

/** Points absolus (m) d'une flèche ou d'un polygone */
const absPoints = (el: { x: number; y: number }, pts: number[]) => pts.map((v, i) => (i % 2 === 0 ? v + el.x : v + el.y));

const TrainingCanvas = forwardRef<TrainingCanvasHandle, Props>(function TrainingCanvas(
  { state, dispatch, mode, multiSelect, armed, onPlace, onPolygonProgress, polygonCommand },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState({ scale: 8, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const stateRef = useRef(state);
  stateRef.current = state;

  const gesture = useRef<Gesture>({ type: "none" });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [draft, setDraft] = useState<TrainingElement | null>(null);
  const [polygon, setPolygon] = useState<number[]>([]);
  const [pointOverride, setPointOverride] = useState<{ id: string; points: number[] } | null>(null);
  const dragStarts = useRef<Map<string, { x: number; y: number }> | null>(null);

  const { pitch } = state.diagram;
  const { grid } = state;

  // --- Taille du conteneur ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fitScale = useMemo(() => {
    if (!size.w || !size.h) return 8;
    return Math.min(size.w / (pitch.length + 2 * PITCH_MARGIN), size.h / (pitch.width + 2 * PITCH_MARGIN));
  }, [size.w, size.h, pitch.length, pitch.width]);

  const fit = useCallback(() => {
    if (!size.w || !size.h) return;
    const s = fitScale;
    setView({ scale: s, x: (size.w - pitch.length * s) / 2, y: (size.h - pitch.width * s) / 2 });
  }, [fitScale, size.w, size.h, pitch.length, pitch.width]);

  // Recadrage quand le terrain ou la taille de l'écran change
  useEffect(() => { fit(); }, [fit]);

  const clampScale = useCallback((s: number) => Math.min(150, Math.max(fitScale * 0.4, s)), [fitScale]);

  const zoomAt = useCallback((factor: number, sx: number, sy: number) => {
    setView((v) => {
      const scale = clampScale(v.scale * factor);
      const wx = (sx - v.x) / v.scale;
      const wy = (sy - v.y) / v.scale;
      return { scale, x: sx - wx * scale, y: sy - wy * scale };
    });
  }, [clampScale]);

  const toWorld = useCallback((sx: number, sy: number) => {
    const v = viewRef.current;
    return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale };
  }, []);

  useImperativeHandle(ref, () => ({
    fit,
    zoomBy: (f) => zoomAt(f, size.w / 2, size.h / 2),
    viewCenter: () => toWorld(size.w / 2, size.h / 2),
    clientToWorld: (cx, cy) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || cx < rect.left || cx > rect.right || cy < rect.top || cy > rect.bottom) return null;
      return toWorld(cx - rect.left, cy - rect.top);
    },
    toDataURL: () => stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? null,
  }), [fit, zoomAt, toWorld, size.w, size.h]);

  // --- Éléments affichés ---
  const visible = useMemo(
    () => state.diagram.elements.filter((e) => isElementVisible(state, e)).sort((a, b) => ORDER[a.kind] - ORDER[b.kind]),
    [state]
  );
  const selected = useMemo(() => new Set(state.selectedIds), [state.selectedIds]);
  const singleSelected = state.selectedIds.length === 1 ? visible.find((e) => e.id === state.selectedIds[0]) : undefined;
  const pointEditable =
    singleSelected && !singleSelected.locked && (singleSelected.kind === "arrow" || (singleSelected.kind === "zone" && singleSelected.shape === "polygon"))
      ? singleSelected
      : undefined;

  const canEdit = !armed && mode === "select";

  // --- Transformer (rotation, redimensionnement des zones) ---
  const transformable = useMemo(
    () => (canEdit ? visible.filter((e) => selected.has(e.id) && !e.locked && e.kind !== "arrow" && !(e.kind === "zone" && e.shape === "polygon")) : []),
    [visible, selected, canEdit]
  );
  const resizable = transformable.length === 1 && transformable[0].kind === "zone";

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = transformable.map((e) => stage.findOne(`#${e.id}`)).filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [transformable, state.diagram.elements]);

  const onTransformEnd = useCallback(() => {
    const tr = trRef.current;
    if (!tr) return;
    const patches = tr.nodes().map((node) => {
      const el = stateRef.current.diagram.elements.find((e) => e.id === node.id());
      const patch: Partial<TrainingElement> = { x: round2(node.x()), y: round2(node.y()), rotation: Math.round(((node.rotation() % 360) + 360) % 360) };
      if (el && el.kind === "zone" && (node.scaleX() !== 1 || node.scaleY() !== 1)) {
        const z = el as ZoneElement;
        const sx = Math.abs(node.scaleX()), sy = Math.abs(node.scaleY());
        (patch as Partial<ZoneElement>).width = round2(Math.max(0.5, z.width * sx));
        (patch as Partial<ZoneElement>).height = round2(Math.max(0.5, z.shape === "circle" ? z.width * sx : z.height * sy));
      }
      node.scaleX(1);
      node.scaleY(1);
      return { id: node.id(), patch };
    });
    dispatch({ type: "updateMany", patches });
  }, [dispatch]);

  // --- Interactions sur les éléments ---
  const onElementPointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (armed || mode !== "select" || pointers.current.size > 1) return;
    e.cancelBubble = true;
    const id = e.currentTarget.id();
    const additive = multiSelect || e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    if (additive) dispatch({ type: "select", ids: [id], additive: true });
    else if (!stateRef.current.selectedIds.includes(id)) dispatch({ type: "select", ids: [id] });
  }, [armed, mode, multiSelect, dispatch]);

  const onElementDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const id = e.target.id();
    const ids = stateRef.current.selectedIds.includes(id) ? stateRef.current.selectedIds : [id];
    const starts = new Map<string, { x: number; y: number }>();
    ids.forEach((oid) => {
      const el = stateRef.current.diagram.elements.find((x) => x.id === oid);
      if (el && !el.locked) starts.set(oid, { x: el.x, y: el.y });
    });
    dragStarts.current = starts;
  }, []);

  const onElementDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current;
    const starts = dragStarts.current;
    if (!stage || !starts) return;
    const node = e.target;
    const start = starts.get(node.id());
    if (!start) return;
    const g = stateRef.current.grid;
    if (g.snap) node.position({ x: snapValue(node.x(), g), y: snapValue(node.y(), g) });
    const dx = node.x() - start.x;
    const dy = node.y() - start.y;
    starts.forEach((p, oid) => {
      if (oid === node.id()) return;
      stage.findOne(`#${oid}`)?.position({ x: p.x + dx, y: p.y + dy });
    });
  }, []);

  const onElementDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const starts = dragStarts.current;
    dragStarts.current = null;
    if (!starts) return;
    const start = starts.get(e.target.id());
    if (!start) return;
    dispatch({ type: "moveBy", ids: [...starts.keys()], dx: round2(e.target.x() - start.x), dy: round2(e.target.y() - start.y) });
  }, [dispatch]);

  // --- Polygone en cours ---
  const finishPolygon = useCallback((pts: number[]) => {
    if (pts.length >= 6 && armed?.drawTool?.kind === "zone") {
      const n = pts.length / 2;
      let cx = 0, cy = 0;
      for (let i = 0; i < pts.length; i += 2) { cx += pts[i]; cy += pts[i + 1]; }
      cx /= n; cy /= n;
      const rel = pts.map((v, i) => round2(i % 2 === 0 ? v - cx : v - cy));
      const xs = rel.filter((_, i) => i % 2 === 0), ys = rel.filter((_, i) => i % 2 === 1);
      const zone: ZoneElement = {
        ...(createElement({ kind: "zone", shape: "polygon", color: "#facc15", width: 1, height: 1 }, round2(cx), round2(cy)) as ZoneElement),
        width: round2(Math.max(...xs) - Math.min(...xs)),
        height: round2(Math.max(...ys) - Math.min(...ys)),
        points: rel,
      };
      dispatch({ type: "add", elements: [zone], select: true });
    }
    setPolygon([]);
    onPolygonProgress?.(0);
  }, [armed, dispatch, onPolygonProgress]);

  useEffect(() => {
    if (!polygonCommand) return;
    if (polygonCommand.action === "finish") finishPolygon(polygon);
    else { setPolygon([]); onPolygonProgress?.(0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygonCommand]);

  // Changement d'outil : on abandonne le polygone en cours
  useEffect(() => { setPolygon([]); onPolygonProgress?.(0); setDraft(null); }, [armed, onPolygonProgress]);

  // --- Interactions sur la scène ---
  const pointerPos = () => stageRef.current?.getPointerPosition() || { x: 0, y: 0 };

  const startPinch = () => {
    const [a, b] = [...pointers.current.values()];
    stageRef.current?.find(".training-element").forEach((n) => { if (n.isDragging()) n.stopDrag(); });
    setMarquee(null);
    setDraft(null);
    gesture.current = { type: "pinch", dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  };

  const onStagePointerDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    const p = pointerPos();
    pointers.current.set(e.evt.pointerId, p);
    if (pointers.current.size === 2) { startPinch(); return; }
    if (pointers.current.size > 2) return;

    const g = state.grid;
    const w = toWorld(p.x, p.y);
    if (armed) {
      if (armed.drawTool?.kind === "arrow") gesture.current = { type: "arrow", x0: snapValue(w.x, g), y0: snapValue(w.y, g) };
      else if (armed.drawTool?.kind === "zone" && armed.drawTool.shape !== "polygon") gesture.current = { type: "zone", x0: snapValue(w.x, g), y0: snapValue(w.y, g) };
      else gesture.current = { type: "tap", sx: p.x, sy: p.y };
      return;
    }
    const isEmpty = e.target === stageRef.current;
    if (mode === "pan" || (isEmpty && e.evt.pointerType === "touch" && !multiSelect)) {
      // Au doigt, glisser dans le vide déplace la vue (le cadre de sélection reste accessible en mode multi-sélection)
      gesture.current = { type: "pan", sx: p.x, sy: p.y, vx: view.x, vy: view.y };
      return;
    }
    if (isEmpty) {
      gesture.current = { type: "marquee", x0: w.x, y0: w.y, sx: p.x, sy: p.y, additive: multiSelect || e.evt.shiftKey };
    }
  };

  const onStagePointerMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!pointers.current.has(e.evt.pointerId)) return;
    const p = pointerPos();
    pointers.current.set(e.evt.pointerId, p);
    const gst = gesture.current;
    if (gst.type === "pinch" && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      setView((v) => {
        const scale = clampScale(v.scale * (dist / (gst.dist || dist)));
        const wx = (gst.cx - v.x) / v.scale, wy = (gst.cy - v.y) / v.scale;
        return { scale, x: cx - wx * scale, y: cy - wy * scale };
      });
      gesture.current = { type: "pinch", dist, cx, cy };
      return;
    }
    const w = toWorld(p.x, p.y);
    const g = state.grid;
    switch (gst.type) {
      case "pan":
        setView((v) => ({ ...v, x: gst.vx + (p.x - gst.sx), y: gst.vy + (p.y - gst.sy) }));
        break;
      case "marquee":
        if (Math.hypot(p.x - gst.sx, p.y - gst.sy) > 4) {
          setMarquee({ x: Math.min(gst.x0, w.x), y: Math.min(gst.y0, w.y), w: Math.abs(w.x - gst.x0), h: Math.abs(w.y - gst.y0) });
        }
        break;
      case "arrow": {
        const x1 = snapValue(w.x, g), y1 = snapValue(w.y, g);
        const dx = x1 - gst.x0, dy = y1 - gst.y0;
        const style = armed?.drawTool?.kind === "arrow" ? armed.drawTool.style : "pass";
        setDraft({ id: "draft", kind: "arrow", x: gst.x0, y: gst.y0, rotation: 0, style, color: "#ffffff", points: [0, 0, dx / 2, dy / 2, dx, dy] });
        break;
      }
      case "zone": {
        const x1 = snapValue(w.x, g), y1 = snapValue(w.y, g);
        const shape = armed?.drawTool?.kind === "zone" ? armed.drawTool.shape : "rect";
        if (shape === "circle") {
          const r = Math.hypot(x1 - gst.x0, y1 - gst.y0);
          setDraft({ id: "draft", kind: "zone", shape, x: gst.x0, y: gst.y0, rotation: 0, color: "#facc15", width: 2 * r, height: 2 * r });
        } else {
          setDraft({ id: "draft", kind: "zone", shape: "rect", x: (gst.x0 + x1) / 2, y: (gst.y0 + y1) / 2, rotation: 0, color: "#facc15", width: Math.abs(x1 - gst.x0), height: Math.abs(y1 - gst.y0) });
        }
        break;
      }
    }
  };

  const endPointer = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!pointers.current.has(e.evt.pointerId)) return;
    const p = pointers.current.get(e.evt.pointerId)!;
    pointers.current.delete(e.evt.pointerId);
    const gst = gesture.current;
    if (gst.type === "pinch") {
      if (pointers.current.size === 0) gesture.current = { type: "none" };
      return;
    }
    gesture.current = { type: "none" };
    const w = toWorld(p.x, p.y);
    const g = state.grid;

    switch (gst.type) {
      case "tap": {
        if (!armed || Math.hypot(p.x - gst.sx, p.y - gst.sy) > 10) return;
        if (armed.drawTool?.kind === "zone" && armed.drawTool.shape === "polygon") {
          const x = snapValue(w.x, g), y = snapValue(w.y, g);
          // Appui près du premier sommet : on ferme le polygone
          if (polygon.length >= 6 && Math.hypot(x - polygon[0], y - polygon[1]) * view.scale < 22) { finishPolygon(polygon); return; }
          const next = [...polygon, round2(x), round2(y)];
          setPolygon(next);
          onPolygonProgress?.(next.length / 2);
          return;
        }
        onPlace(armed, snapValue(w.x, g), snapValue(w.y, g));
        return;
      }
      case "arrow": {
        const d = draft as ArrowElement | null;
        setDraft(null);
        if (!d) return;
        const [, , , , dx, dy] = d.points;
        if (Math.hypot(dx, dy) < 0.6) return;
        const el = createElement({ kind: "arrow", style: d.style, color: d.style === "shot" ? "#facc15" : "#ffffff", points: d.points.map(round2) }, round2(d.x), round2(d.y));
        dispatch({ type: "add", elements: [el] });
        return;
      }
      case "zone": {
        const d = draft as ZoneElement | null;
        setDraft(null);
        if (!d || d.width < 0.5 || (d.shape === "rect" && d.height < 0.5)) return;
        const el = createElement({ kind: "zone", shape: d.shape, color: "#facc15", width: round2(d.width), height: round2(d.height) }, round2(d.x), round2(d.y));
        dispatch({ type: "add", elements: [el] });
        return;
      }
      case "marquee": {
        const m = marquee;
        setMarquee(null);
        if (!m) {
          if (!gst.additive) dispatch({ type: "select", ids: [] });
          return;
        }
        const ids = visible.filter((el) => el.x >= m.x && el.x <= m.x + m.w && el.y >= m.y && el.y <= m.y + m.h).map((el) => el.id);
        dispatch({ type: "select", ids, additive: gst.additive });
        return;
      }
      case "pan": {
        // Simple appui dans le vide (sans déplacement) : on désélectionne
        if (mode === "select" && Math.hypot(p.x - gst.sx, p.y - gst.sy) < 6) dispatch({ type: "select", ids: [] });
        return;
      }
    }
  };

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const p = pointerPos();
    zoomAt(e.evt.deltaY < 0 ? 1.12 : 1 / 1.12, p.x, p.y);
  };

  // --- Poignées (flèches et polygones) ---
  const handleRadius = 11 / view.scale;
  const editPoints = pointEditable ? (pointOverride?.id === pointEditable.id ? pointOverride.points : (pointEditable as ArrowElement | ZoneElement).points || []) : [];
  const onHandleDrag = (index: number, node: Konva.Node, done: boolean) => {
    if (!pointEditable) return;
    const g = state.grid;
    const nx = snapValue(node.x(), g), ny = snapValue(node.y(), g);
    if (g.snap) node.position({ x: nx, y: ny });
    const pts = [...editPoints];
    pts[index * 2] = round2(nx - pointEditable.x);
    pts[index * 2 + 1] = round2(ny - pointEditable.y);
    if (done) {
      setPointOverride(null);
      dispatch({ type: "update", id: pointEditable.id, patch: { points: pts } as Partial<TrainingElement> });
    } else {
      setPointOverride({ id: pointEditable.id, points: pts });
    }
  };

  const renderEl = (el: TrainingElement) => {
    const shown = pointOverride && pointOverride.id === el.id ? ({ ...el, points: pointOverride.points } as TrainingElement) : el;
    return (
      <ElementShape
        key={el.id}
        el={shown}
        pxPerMeter={view.scale}
        draggable={canEdit && !el.locked}
        dimmed={el.locked && selected.has(el.id)}
        onPointerDown={onElementPointerDown}
        onDragStart={onElementDragStart}
        onDragMove={onElementDragMove}
        onDragEnd={onElementDragEnd}
      />
    );
  };

  const selectionRings = visible.filter((e) => selected.has(e.id) && (e.kind === "arrow" || (e.kind === "zone" && e.shape === "polygon") || e.locked));

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none select-none"
      style={{ cursor: armed ? "crosshair" : mode === "pan" ? "grab" : "default" }}
      data-testid="training-canvas"
    >
      {size.w > 0 && (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          scaleX={view.scale}
          scaleY={view.scale}
          x={view.x}
          y={view.y}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={(e) => { if (e.evt.pointerType === "mouse") endPointer(e); }}
          onWheel={onWheel}
        >
          <Layer listening={false}>
            <Shape sceneFunc={(ctx) => drawPitch(ctx, pitch, view.scale)} />
            {grid.visible && <Shape sceneFunc={(ctx) => drawGrid(ctx, pitch, grid.size, view.scale)} />}
          </Layer>
          <Layer>
            {visible.map(renderEl)}

            {/* Repères de sélection des éléments sans cadre de transformation */}
            {selectionRings.map((el) =>
              el.kind === "arrow" ? (
                <Line key={`sel-${el.id}`} points={absPoints(el, arrowPath(el.points, el.style, 0))} stroke="#00E599" strokeWidth={3 / view.scale} dash={[6 / view.scale, 5 / view.scale]} opacity={0.9} listening={false} />
              ) : el.kind === "zone" && el.points ? (
                <Line key={`sel-${el.id}`} points={absPoints(el, el.points)} closed stroke="#00E599" strokeWidth={3 / view.scale} dash={[6 / view.scale, 5 / view.scale]} listening={false} />
              ) : (
                <Circle key={`sel-${el.id}`} x={el.x} y={el.y} radius={24 / view.scale} stroke="#f59e0b" strokeWidth={2 / view.scale} dash={[5 / view.scale, 4 / view.scale]} listening={false} />
              )
            )}

            {/* Tracé en cours */}
            {draft && draft.kind === "arrow" && (
              <ElementShape el={draft} pxPerMeter={view.scale} draggable={false} />
            )}
            {draft && draft.kind === "zone" && (
              <ZoneBodyPreview zone={draft} boost={boostFor(view.scale, 1.5, 0.1)} />
            )}
            {polygon.length > 0 && (
              <>
                <Line points={polygon} stroke="#facc15" strokeWidth={3 / view.scale} dash={[8 / view.scale, 6 / view.scale]} listening={false} />
                {Array.from({ length: polygon.length / 2 }, (_, i) => (
                  <Circle key={i} x={polygon[i * 2]} y={polygon[i * 2 + 1]} radius={(i === 0 ? 9 : 6) / view.scale} fill={i === 0 ? "#00E599" : "#facc15"} listening={false} />
                ))}
              </>
            )}

            {/* Poignées de modification des points */}
            {canEdit && pointEditable &&
              Array.from({ length: editPoints.length / 2 }, (_, i) => (
                <Circle
                  key={`h-${pointEditable.id}-${i}`}
                  x={pointEditable.x + editPoints[i * 2]}
                  y={pointEditable.y + editPoints[i * 2 + 1]}
                  radius={handleRadius}
                  fill={pointEditable.kind === "arrow" && i === 1 ? "#0f172a" : "#00E599"}
                  stroke={pointEditable.kind === "arrow" && i === 1 ? "#00E599" : "#0f172a"}
                  strokeWidth={2 / view.scale}
                  draggable
                  onPointerDown={(e) => { e.cancelBubble = true; }}
                  onDragMove={(e) => onHandleDrag(i, e.target, false)}
                  onDragEnd={(e) => onHandleDrag(i, e.target, true)}
                />
              ))}

            <Transformer
              ref={trRef}
              rotateEnabled
              resizeEnabled={resizable}
              enabledAnchors={resizable ? ["top-left", "top-right", "bottom-left", "bottom-right"] : []}
              keepRatio={resizable && transformable[0]?.kind === "zone" && (transformable[0] as ZoneElement).shape === "circle"}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              rotationSnapTolerance={6}
              anchorSize={16}
              anchorCornerRadius={8}
              anchorStroke="#00E599"
              anchorFill="#0f172a"
              borderStroke="#00E599"
              borderDash={[6, 4]}
              rotateAnchorOffset={28}
              ignoreStroke
              flipEnabled={false}
              onTransformEnd={onTransformEnd}
            />

            {marquee && (
              <Rect x={marquee.x} y={marquee.y} width={marquee.w} height={marquee.h} fill="rgba(0,229,153,0.08)" stroke="#00E599" strokeWidth={1.5 / view.scale} dash={[6 / view.scale, 4 / view.scale]} listening={false} />
            )}
          </Layer>
        </Stage>
      )}
    </div>
  );
});

/** Aperçu de zone pendant le tracé */
function ZoneBodyPreview({ zone, boost }: { zone: ZoneElement; boost: number }) {
  return (
    <GroupAt x={zone.x} y={zone.y}>
      <ZoneBody zone={zone} boost={boost} />
    </GroupAt>
  );
}

const GroupAt = ({ x, y, children }: { x: number; y: number; children: React.ReactNode }) => (
  <Group x={x} y={y} listening={false}>{children}</Group>
);

export default TrainingCanvas;
