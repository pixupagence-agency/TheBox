// Tableau tactique : ancien drawAllStrokes() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { ZONE_FILL_ALPHA, isCurveTool, strokeCurveArrow, type Pt } from "@/lib/tactics/pitchGeometry";
import { type DrawingAction } from "@/lib/tactics/types";

export interface DrawAllStrokesCtx {
  activeTool: "select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link";
  aspectRatioMode: "desktop" | "mobile";
  brushPointsRef: React.RefObject<{ x: number; y: number; }[]>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  currentActionPoints: { x: number; y: number; }[];
  curveHandleIdx: number | null;
  drawArrowhead: (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => void;
  drawColor: string;
  drawingActions: DrawingAction[];
  drawingTool: "brush" | "arrow-direct" | "arrow-deep" | "arrow-run" | "shape-circle" | "shape-rect" | "shape-line" | "shape-dashed-line" | "curve-arrow" | "curve-arrow-dashed" | "eraser";
  drawSize: number;
  isDrawing: boolean;
  selectedStrokeIndex: number | null;
}

export function drawAllStrokes(boardCtx: DrawAllStrokesCtx) {
  const { activeTool, aspectRatioMode, brushPointsRef, canvasRef, currentActionPoints, curveHandleIdx, drawArrowhead, drawColor, drawingActions, drawingTool, drawSize, isDrawing, selectedStrokeIndex } = boardCtx;
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;

  const renderStroke = (action: DrawingAction) => {
    if (action.points.length < 2) return;

    ctx.strokeStyle = action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);

    const start = action.points[0];
    const end = action.points[action.points.length - 1];

    const getPtX = (pt: { x: number; y: number }) => {
      if (aspectRatioMode === "mobile") {
        return (pt.y / 100) * w;
      }
      return (pt.x / 100) * w;
    };

    const getPtY = (pt: { x: number; y: number }) => {
      if (aspectRatioMode === "mobile") {
        return ((100 - pt.x) / 100) * h;
      }
      return (pt.y / 100) * h;
    };

    const startX = getPtX(start);
    const startY = getPtY(start);
    const endX = getPtX(end);
    const endY = getPtY(end);

    if (action.tool === "brush") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (let i = 1; i < action.points.length; i++) {
        const ptX = getPtX(action.points[i]);
        const ptY = getPtY(action.points[i]);
        ctx.lineTo(ptX, ptY);
      }
      ctx.stroke();
    } else if (action.tool === "arrow-direct" || action.tool === "arrow-deep" || action.tool === "arrow-run") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      if (action.tool === "arrow-deep") {
        ctx.setLineDash([8, 6]);
      } else if (action.tool === "arrow-run") {
        ctx.setLineDash([2, 5]);
      }

      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.setLineDash([]);
      drawArrowhead(ctx, startX, startY, endX, endY);
    } else if (action.tool === "shape-circle") {
      ctx.beginPath();
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (action.tool === "shape-rect") {
      ctx.beginPath();
      ctx.rect(startX, startY, endX - startX, endY - startY);
      ctx.save();
      ctx.globalAlpha = ZONE_FILL_ALPHA;
      ctx.fill();
      ctx.restore();
      ctx.stroke();
    } else if (isCurveTool(action.tool)) {
      const ptsPx = action.points.map((p) => ({ x: getPtX(p), y: getPtY(p) }));
      strokeCurveArrow(ctx, ptsPx, action.tool === "curve-arrow-dashed", [10, 8], 12 + action.size);
    } else if (action.tool === "shape-line" || action.tool === "shape-dashed-line") {
      ctx.beginPath();
      if (action.tool === "shape-dashed-line") {
        ctx.setLineDash([8, 6]);
      }
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      if (action.tool === "shape-dashed-line") {
        ctx.setLineDash([]);
      }
    }
  };

  // Bras des poignées de la courbe en cours d'édition (départ → contrôle 1, arrivée → contrôle 2)
  const editedCurve = curveHandleIdx !== null ? drawingActions[curveHandleIdx] : null;
  const drawCurveArms = () => {
    if (!editedCurve || editedCurve.points.length < 4) return;
    const px = (p: Pt) =>
      aspectRatioMode === "mobile" ? { x: (p.y / 100) * w, y: ((100 - p.x) / 100) * h } : { x: (p.x / 100) * w, y: (p.y / 100) * h };
    const [a, b, c, d] = editedCurve.points.map(px);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(c.x, c.y);
    ctx.stroke();
    ctx.restore();
  };

  drawingActions.forEach((action, idx) => {
    renderStroke(action);
    if (activeTool === "select" && idx === selectedStrokeIndex) {
      ctx.save();
      ctx.strokeStyle = "#00E599";
      ctx.shadowColor = "#00E599";
      ctx.shadowBlur = 12;
      ctx.lineWidth = (action.size || 3) + 4;
      renderStroke({ ...action, color: "#00E599", size: (action.size || 3) + 4 });
      ctx.restore();
    }
  });
  drawCurveArms();

  const inProgressPoints = drawingTool === "brush" ? brushPointsRef.current : currentActionPoints;
  if (isDrawing && inProgressPoints.length > 0) {
    renderStroke({
      tool: drawingTool,
      color: drawColor,
      size: drawSize,
      points: inProgressPoints,
    });
  }
}
