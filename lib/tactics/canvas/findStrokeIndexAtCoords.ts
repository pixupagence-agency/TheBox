// Tableau tactique : ancien findStrokeIndexAtCoords() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import { bezierAt, curvePointsPx, isCurveTool } from "@/lib/tactics/pitchGeometry";
import { type DrawingAction } from "@/lib/tactics/types";

export interface FindStrokeIndexAtCoordsCtx {
}

export function findStrokeIndexAtCoords(boardCtx: FindStrokeIndexAtCoordsCtx, coords: { x: number; y: number }, actions: DrawingAction[]): number | null {

  if (!actions || actions.length === 0) return null;

  const distToSegment = (p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = v.x + t * (w.x - v.x);
    const projY = v.y + t * (w.y - v.y);
    return Math.hypot(p.x - projX, p.y - projY);
  };

  for (let i = actions.length - 1; i >= 0; i--) {
    const action = actions[i];
    const pts = action.points;
    if (!pts || pts.length === 0) continue;

    const threshold = 3.5 + (action.size || 3) * 0.3;

    if (isCurveTool(action.tool)) {
      const curve = curvePointsPx(pts);
      let prev = curve[0];
      for (let s = 1; s <= 24; s++) {
        const next = bezierAt(curve, s / 24);
        if (distToSegment(coords, prev, next) <= threshold) return i;
        prev = next;
      }
    } else if (action.tool === "brush" || action.tool === "shape-line" || action.tool === "shape-dashed-line" || action.tool.startsWith("arrow")) {
      for (let j = 0; j < pts.length - 1; j++) {
        if (distToSegment(coords, pts[j], pts[j + 1]) <= threshold) return i;
      }
      if (pts.length === 1 && Math.hypot(coords.x - pts[0].x, coords.y - pts[0].y) <= threshold) {
        return i;
      }
    } else if (action.tool === "shape-circle") {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      const distFromCenter = Math.hypot(coords.x - start.x, coords.y - start.y);
      if (Math.abs(distFromCenter - radius) <= threshold || distFromCenter <= radius) {
        return i;
      }
    } else if (action.tool === "shape-rect") {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      if (
        coords.x >= minX - threshold &&
        coords.x <= maxX + threshold &&
        coords.y >= minY - threshold &&
        coords.y <= maxY + threshold
      ) {
        return i;
      }
    }
  }

  return null;
}
