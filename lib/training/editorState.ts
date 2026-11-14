// Module Training : état de l'éditeur de schéma (reducer pur, avec annuler / rétablir).
// Seul `diagram` fait partie de l'historique ; sélection, presse-papiers et calques n'y sont pas.
import { newElementId } from "./catalog";
import { makePitchConfig } from "./pitch";
import { LAYER_OF, type LayerId, type PitchConfig, type TrainingDiagram, type TrainingElement } from "./types";

const HISTORY_LIMIT = 100;

export interface EditorState {
  diagram: TrainingDiagram;
  past: TrainingDiagram[];
  future: TrainingDiagram[];
  selectedIds: string[];
  clipboard: TrainingElement[];
  /** Nombre de collages successifs (décalage croissant) */
  pasteCount: number;
  hiddenLayers: LayerId[];
  grid: { visible: boolean; snap: boolean; size: number };
}

export type EditorAction =
  | { type: "add"; elements: TrainingElement[]; select?: boolean }
  | { type: "update"; id: string; patch: Partial<TrainingElement>; /** fusionne avec la dernière entrée d'historique (saisie continue) */ merge?: boolean }
  | { type: "updateMany"; patches: Array<{ id: string; patch: Partial<TrainingElement> }> }
  | { type: "moveBy"; ids: string[]; dx: number; dy: number }
  | { type: "delete"; ids?: string[] }
  | { type: "duplicate" }
  | { type: "copy" }
  | { type: "paste" }
  | { type: "select"; ids: string[]; additive?: boolean }
  | { type: "toggleLock"; ids?: string[] }
  | { type: "align"; mode: AlignMode }
  | { type: "setPitch"; pitch: PitchConfig }
  | { type: "setGrid"; grid: Partial<EditorState["grid"]> }
  | { type: "toggleLayer"; layer: LayerId }
  | { type: "clear" }
  | { type: "load"; diagram: TrainingDiagram }
  | { type: "undo" }
  | { type: "redo" };

export type AlignMode = "left" | "centerX" | "right" | "top" | "centerY" | "bottom" | "distributeX" | "distributeY";

export const emptyDiagram = (): TrainingDiagram => ({ version: 1, pitch: makePitchConfig("foot11"), elements: [] });

export const initialEditorState = (diagram: TrainingDiagram = emptyDiagram()): EditorState => ({
  diagram,
  past: [],
  future: [],
  selectedIds: [],
  clipboard: [],
  pasteCount: 0,
  hiddenLayers: [],
  grid: { visible: false, snap: false, size: 1 },
});

/** Remplace le schéma en enregistrant l'état précédent dans l'historique */
function commit(state: EditorState, diagram: TrainingDiagram, extra: Partial<EditorState> = {}): EditorState {
  return {
    ...state,
    ...extra,
    diagram,
    past: [...state.past, state.diagram].slice(-HISTORY_LIMIT),
    future: [],
  };
}

const withElements = (d: TrainingDiagram, elements: TrainingElement[]): TrainingDiagram => ({ ...d, elements });

export const isElementVisible = (state: Pick<EditorState, "hiddenLayers">, el: TrainingElement) =>
  !state.hiddenLayers.includes(LAYER_OF[el.kind]);

/** Éléments sélectionnés, visibles et non verrouillés (ceux que l'on peut modifier) */
const editableSelection = (state: EditorState) =>
  state.diagram.elements.filter((e) => state.selectedIds.includes(e.id) && !e.locked && isElementVisible(state, e));

const cloneWithOffset = (els: TrainingElement[], offset: number): TrainingElement[] =>
  els.map((e) => ({ ...e, id: newElementId(e.kind), x: e.x + offset, y: e.y + offset, locked: false }) as TrainingElement);

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const els = state.diagram.elements;
  switch (action.type) {
    case "add": {
      if (action.elements.length === 0) return state;
      return commit(state, withElements(state.diagram, [...els, ...action.elements]), action.select ? { selectedIds: action.elements.map((e) => e.id) } : {});
    }
    case "update": {
      const target = els.find((e) => e.id === action.id);
      if (!target) return state;
      const next = els.map((e) => (e.id === action.id ? ({ ...e, ...action.patch } as TrainingElement) : e));
      if (action.merge && state.past.length > 0) return { ...state, diagram: withElements(state.diagram, next), future: [] };
      return commit(state, withElements(state.diagram, next));
    }
    case "updateMany": {
      if (action.patches.length === 0) return state;
      const byId = new Map(action.patches.map((p) => [p.id, p.patch]));
      return commit(state, withElements(state.diagram, els.map((e) => (byId.has(e.id) ? ({ ...e, ...byId.get(e.id) } as TrainingElement) : e))));
    }
    case "moveBy": {
      if (action.dx === 0 && action.dy === 0) return state;
      const ids = new Set(action.ids);
      return commit(state, withElements(state.diagram, els.map((e) => (ids.has(e.id) && !e.locked ? { ...e, x: e.x + action.dx, y: e.y + action.dy } : e))));
    }
    case "delete": {
      const ids = new Set(action.ids || editableSelection(state).map((e) => e.id));
      if (ids.size === 0) return state;
      return commit(state, withElements(state.diagram, els.filter((e) => !ids.has(e.id))), { selectedIds: state.selectedIds.filter((id) => !ids.has(id)) });
    }
    case "duplicate": {
      const source = state.diagram.elements.filter((e) => state.selectedIds.includes(e.id) && isElementVisible(state, e));
      if (source.length === 0) return state;
      const copies = cloneWithOffset(source, 1);
      return commit(state, withElements(state.diagram, [...els, ...copies]), { selectedIds: copies.map((e) => e.id) });
    }
    case "copy": {
      const source = state.diagram.elements.filter((e) => state.selectedIds.includes(e.id) && isElementVisible(state, e));
      if (source.length === 0) return state;
      return { ...state, clipboard: source, pasteCount: 0 };
    }
    case "paste": {
      if (state.clipboard.length === 0) return state;
      const count = state.pasteCount + 1;
      const copies = cloneWithOffset(state.clipboard, count);
      return commit(state, withElements(state.diagram, [...els, ...copies]), { selectedIds: copies.map((e) => e.id), pasteCount: count });
    }
    case "select": {
      const visible = new Set(els.filter((e) => isElementVisible(state, e)).map((e) => e.id));
      const ids = action.ids.filter((id) => visible.has(id));
      if (!action.additive) return { ...state, selectedIds: ids };
      const current = new Set(state.selectedIds);
      ids.forEach((id) => (current.has(id) ? current.delete(id) : current.add(id)));
      return { ...state, selectedIds: [...current] };
    }
    case "toggleLock": {
      const ids = new Set(action.ids || state.selectedIds);
      const targets = els.filter((e) => ids.has(e.id));
      if (targets.length === 0) return state;
      const lock = !targets.every((e) => e.locked);
      return commit(state, withElements(state.diagram, els.map((e) => (ids.has(e.id) ? { ...e, locked: lock } : e))));
    }
    case "align": {
      const sel = editableSelection(state);
      if (sel.length < 2) return state;
      const xs = sel.map((e) => e.x);
      const ys = sel.map((e) => e.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const patch = new Map<string, Partial<TrainingElement>>();
      const distribute = (axis: "x" | "y") => {
        const sorted = [...sel].sort((a, b) => a[axis] - b[axis]);
        const first = sorted[0][axis];
        const step = (sorted[sorted.length - 1][axis] - first) / (sorted.length - 1);
        sorted.forEach((e, i) => patch.set(e.id, { [axis]: first + i * step }));
      };
      switch (action.mode) {
        case "left": sel.forEach((e) => patch.set(e.id, { x: minX })); break;
        case "right": sel.forEach((e) => patch.set(e.id, { x: maxX })); break;
        case "centerX": sel.forEach((e) => patch.set(e.id, { x: (minX + maxX) / 2 })); break;
        case "top": sel.forEach((e) => patch.set(e.id, { y: minY })); break;
        case "bottom": sel.forEach((e) => patch.set(e.id, { y: maxY })); break;
        case "centerY": sel.forEach((e) => patch.set(e.id, { y: (minY + maxY) / 2 })); break;
        case "distributeX": if (sel.length > 2) distribute("x"); break;
        case "distributeY": if (sel.length > 2) distribute("y"); break;
      }
      if (patch.size === 0) return state;
      return commit(state, withElements(state.diagram, els.map((e) => (patch.has(e.id) ? ({ ...e, ...patch.get(e.id) } as TrainingElement) : e))));
    }
    case "setPitch":
      return commit(state, { ...state.diagram, pitch: action.pitch });
    case "setGrid":
      return { ...state, grid: { ...state.grid, ...action.grid } };
    case "toggleLayer": {
      const hidden = state.hiddenLayers.includes(action.layer)
        ? state.hiddenLayers.filter((l) => l !== action.layer)
        : [...state.hiddenLayers, action.layer];
      const stillVisible = new Set(els.filter((e) => !hidden.includes(LAYER_OF[e.kind])).map((e) => e.id));
      return { ...state, hiddenLayers: hidden, selectedIds: state.selectedIds.filter((id) => stillVisible.has(id)) };
    }
    case "clear":
      if (els.length === 0) return state;
      return commit(state, withElements(state.diagram, []), { selectedIds: [] });
    case "load":
      return { ...initialEditorState(action.diagram), grid: state.grid, hiddenLayers: state.hiddenLayers };
    case "undo": {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      const ids = new Set(prev.elements.map((e) => e.id));
      return { ...state, diagram: prev, past: state.past.slice(0, -1), future: [state.diagram, ...state.future], selectedIds: state.selectedIds.filter((id) => ids.has(id)) };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      const ids = new Set(next.elements.map((e) => e.id));
      return { ...state, diagram: next, past: [...state.past, state.diagram], future: state.future.slice(1), selectedIds: state.selectedIds.filter((id) => ids.has(id)) };
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Outils de série et magnétisme
// ---------------------------------------------------------------------------

export type SeriesShape = "line" | "circle" | "square";

/**
 * Positions (m) de N éléments espacés de `spacing` mètres, centrées sur (cx, cy).
 * line : alignés selon `angle` (degrés) ; circle : sur un cercle dont la corde vaut l'écartement ;
 * square : sur le périmètre d'un carré, répartis à intervalle constant.
 */
export function seriesPositions(shape: SeriesShape, count: number, spacing: number, cx: number, cy: number, angle = 0): Array<{ x: number; y: number }> {
  const n = Math.max(1, Math.floor(count));
  const s = Math.max(0.1, spacing);
  if (shape === "line" || n === 1) {
    const rad = (angle * Math.PI) / 180;
    const total = (n - 1) * s;
    return Array.from({ length: n }, (_, i) => {
      const d = -total / 2 + i * s;
      return { x: cx + Math.cos(rad) * d, y: cy + Math.sin(rad) * d };
    });
  }
  if (shape === "circle") {
    const r = n === 2 ? s / 2 : s / (2 * Math.sin(Math.PI / n));
    return Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
  }
  // Carré : périmètre = n × écartement
  const side = (n * s) / 4;
  const half = side / 2;
  return Array.from({ length: n }, (_, i) => {
    const d = i * s; // distance parcourue depuis le coin haut gauche, sens horaire
    const edge = Math.floor(d / side) % 4;
    const t = d - Math.floor(d / side) * side;
    switch (edge) {
      case 0: return { x: cx - half + t, y: cy - half };
      case 1: return { x: cx + half, y: cy - half + t };
      case 2: return { x: cx + half - t, y: cy + half };
      default: return { x: cx - half, y: cy + half - t };
    }
  });
}

export const snapValue = (v: number, grid: EditorState["grid"]) => (grid.snap ? Math.round(v / grid.size) * grid.size : v);

/** Arrondi d'affichage / d'enregistrement au centimètre */
export const round2 = (v: number) => Math.round(v * 100) / 100;
