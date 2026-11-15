// Module Recording : rendu des consignes dessinées (écran et export), en coordonnées normalisées.
import type { Shape, Track } from "./types";

export interface Rect { x: number; y: number; w: number; h: number }

/** Taille d'affichage de la vidéo dans un cadre (équivalent d'object-fit: contain) */
export function fitRect(boxW: number, boxH: number, videoW: number, videoH: number): Rect {
  if (!videoW || !videoH || !boxW || !boxH) return { x: 0, y: 0, w: boxW, h: boxH };
  const scale = Math.min(boxW / videoW, boxH / videoH);
  const w = videoW * scale;
  const h = videoH * scale;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}

/** Point de contrôle d'une courbe quadratique passant par le point du tracé le plus éloigné de la corde */
export function curveControl(path: number[]): [number, number] {
  const x0 = path[0], y0 = path[1];
  const x1 = path[path.length - 2], y1 = path[path.length - 1];
  let best = { d: -1, x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  for (let i = 2; i < path.length - 2; i += 2) {
    const d = Math.abs((x1 - x0) * (y0 - path[i + 1]) - (x0 - path[i]) * (y1 - y0)) / len;
    if (d > best.d) best = { d, x: path[i], y: path[i + 1] };
  }
  return [2 * best.x - (x0 + x1) / 2, 2 * best.y - (y0 + y1) / 2];
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.55);
  ctx.lineTo(-size * 0.78, 0);
  ctx.lineTo(-size, size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function withShadow(ctx: CanvasRenderingContext2D, k: number) {
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 6 * k;
  ctx.shadowOffsetY = 1.5 * k;
}

/** Dessine les consignes dans le rectangle de l'image ; `selectedId` reçoit un liseré de sélection */
export function renderShapes(ctx: CanvasRenderingContext2D, shapes: Shape[], rect: Rect, selectedId?: string | null) {
  const k = rect.w / 1000;
  const P = (pts: number[], i: number): [number, number] => [rect.x + pts[i] * rect.w, rect.y + pts[i + 1] * rect.h];

  // Les spotlights assombrissent d'abord l'image, les autres consignes passent par-dessus
  const spots = shapes.filter((s) => s.tool === "spotlight" && s.points.length >= 4);
  if (spots.length) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    for (const s of spots) {
      const [cx, cy] = P(s.points, 0);
      const [ex, ey] = P(s.points, 2);
      const rx = Math.max(8, Math.hypot(ex - cx, ey - cy));
      ctx.moveTo(cx + rx, cy);
      ctx.ellipse(cx, cy, rx, rx * 0.75, 0, 0, Math.PI * 2, true);
    }
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fill("evenodd");
    ctx.restore();
  }

  for (const s of shapes) {
    const color = s.color;
    const lw = Math.max(1.5, s.width * k);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (s.dashed) ctx.setLineDash([lw * 2.6, lw * 2]);
    withShadow(ctx, k);

    switch (s.tool) {
      case "arrow": {
        if (s.points.length < 4) break;
        const [x0, y0] = P(s.points, 0);
        const [x1, y1] = P(s.points, s.points.length - 2);
        const angle = Math.atan2(y1 - y0, x1 - x0);
        const head = lw * 3.6;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1 - Math.cos(angle) * head * 0.7, y1 - Math.sin(angle) * head * 0.7);
        ctx.stroke();
        ctx.setLineDash([]);
        arrowHead(ctx, x1, y1, angle, head, color);
        break;
      }
      case "curve": {
        if (s.points.length < 6) break;
        const [x0, y0] = P(s.points, 0);
        const [cx, cy] = P(s.points, 2);
        const [x1, y1] = P(s.points, 4);
        const angle = Math.atan2(y1 - cy, x1 - cx);
        const head = lw * 3.6;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cx, cy, x1 - Math.cos(angle) * head * 0.7, y1 - Math.sin(angle) * head * 0.7);
        ctx.stroke();
        ctx.setLineDash([]);
        arrowHead(ctx, x1, y1, angle, head, color);
        break;
      }
      case "circle": {
        // Anneau au sol sous le joueur (ellipse aplatie par la perspective)
        if (s.points.length < 4) break;
        const [cx, cy] = P(s.points, 0);
        const [ex, ey] = P(s.points, 2);
        const rx = Math.max(6, Math.hypot(ex - cx, ey - cy));
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, rx * 0.42, 0, 0, Math.PI * 2);
        ctx.globalAlpha = 0.22;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
      }
      case "free": {
        if (s.points.length < 4) break;
        ctx.beginPath();
        const [sx, sy] = P(s.points, 0);
        ctx.moveTo(sx, sy);
        for (let i = 2; i < s.points.length - 2; i += 2) {
          const [ax, ay] = P(s.points, i);
          const [bx, by] = P(s.points, i + 2);
          ctx.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2);
        }
        const [lx, ly] = P(s.points, s.points.length - 2);
        ctx.lineTo(lx, ly);
        ctx.stroke();
        break;
      }
      case "text": {
        if (!s.text || s.points.length < 2) break;
        const [x, y] = P(s.points, 0);
        const size = Math.max(12, s.width * 5 * k);
        ctx.font = `800 ${size}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;
        ctx.textBaseline = "middle";
        const lines = s.text.split("\n");
        const w = Math.max(...lines.map((l) => ctx.measureText(l).width));
        const pad = size * 0.4;
        const lh = size * 1.2;
        ctx.shadowColor = "transparent";
        ctx.fillStyle = "rgba(7,9,14,0.78)";
        ctx.beginPath();
        ctx.roundRect(x - pad, y - lh / 2 - pad * 0.6, w + pad * 2, lh * lines.length + pad * 1.2, size * 0.3);
        ctx.fill();
        ctx.fillStyle = color;
        lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
        break;
      }
      case "spotlight": {
        if (s.points.length < 4) break;
        const [cx, cy] = P(s.points, 0);
        const [ex, ey] = P(s.points, 2);
        const rx = Math.max(8, Math.hypot(ex - cx, ey - cy));
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, rx * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
    }

    if (selectedId && s.id === selectedId) {
      const b = shapeBounds(s, rect, ctx);
      ctx.setLineDash([5, 4]);
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
    }
    ctx.restore();
  }
}

/** Boîte englobante (px) d'une consigne, pour la sélection et la gomme */
export function shapeBounds(s: Shape, rect: Rect, ctx?: CanvasRenderingContext2D): Rect {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < s.points.length; i += 2) {
    xs.push(rect.x + s.points[i] * rect.w);
    ys.push(rect.y + s.points[i + 1] * rect.h);
  }
  if ((s.tool === "circle" || s.tool === "spotlight") && xs.length >= 2) {
    const r = Math.hypot(xs[1] - xs[0], ys[1] - ys[0]);
    const ry = r * (s.tool === "circle" ? 0.42 : 0.75);
    return { x: xs[0] - r, y: ys[0] - ry, w: r * 2, h: ry * 2 };
  }
  if (s.tool === "text" && s.text) {
    const k = rect.w / 1000;
    const size = Math.max(12, s.width * 5 * k);
    let w = s.text.length * size * 0.6;
    if (ctx) {
      ctx.save();
      ctx.font = `800 ${size}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;
      w = Math.max(...s.text.split("\n").map((l) => ctx.measureText(l).width));
      ctx.restore();
    }
    return { x: xs[0], y: ys[0] - size * 0.6, w, h: size * 1.2 * s.text.split("\n").length };
  }
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Consigne sous le point (px), la plus récente en premier */
export function hitShape(shapes: Shape[], px: number, py: number, rect: Rect): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const b = shapeBounds(shapes[i], rect);
    if (px >= b.x - 10 && px <= b.x + b.w + 10 && py >= b.y - 10 && py <= b.y + b.h + 10) return shapes[i];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Suivi de joueurs
// ---------------------------------------------------------------------------

/** Position interpolée d'un joueur suivi à l'instant t (null hors de la plage suivie) */
export function trackPosition(track: Track, t: number): { x: number; y: number } | null {
  const keys = track.keys;
  if (keys.length === 0) return null;
  const first = keys[0];
  const last = keys[keys.length - 1];
  const margin = 0.02;
  if (t < first.t - margin || t > last.t + margin) return null;
  if (t <= first.t) return { x: first.x, y: first.y };
  if (t >= last.t) return { x: last.x, y: last.y };
  let lo = 0;
  let hi = keys.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (keys[mid].t <= t) lo = mid; else hi = mid;
  }
  const a = keys[lo];
  const b = keys[hi];
  const u = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}

/** Marqueurs des joueurs suivis (anneau au sol ou spotlight), nom et traînée */
export function renderTracks(ctx: CanvasRenderingContext2D, tracks: Track[], rect: Rect, time: number, selectedId?: string | null) {
  const k = rect.w / 1000;
  const visible = tracks
    .map((tr) => ({ tr, pos: trackPosition(tr, time) }))
    .filter((v): v is { tr: Track; pos: { x: number; y: number } } => v.pos !== null);
  if (!visible.length) return;
  const px = (x: number) => rect.x + x * rect.w;
  const py = (y: number) => rect.y + y * rect.h;

  // Spotlights : l'image est assombrie autour des joueurs concernés
  const spots = visible.filter((v) => v.tr.style === "spotlight");
  if (spots.length) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    for (const { tr, pos } of spots) {
      const r = tr.size * rect.w * 1.6;
      ctx.moveTo(px(pos.x) + r, py(pos.y) - r * 0.6);
      ctx.ellipse(px(pos.x), py(pos.y) - r * 0.6, r, r * 1.35, 0, 0, Math.PI * 2, true);
    }
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill("evenodd");
    ctx.restore();
  }

  for (const { tr, pos } of visible) {
    const cx = px(pos.x);
    const cy = py(pos.y);
    const r = Math.max(8, tr.size * rect.w);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 6 * k;

    if (tr.trail) {
      const pts: Array<[number, number]> = [];
      for (let s = 2; s >= 0; s -= 0.08) {
        const p = trackPosition(tr, time - s);
        if (p) pts.push([px(p.x), py(p.y)]);
      }
      if (pts.length > 1) {
        ctx.strokeStyle = tr.color;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = Math.max(2, 3.5 * k);
        ctx.setLineDash([Math.max(4, 8 * k), Math.max(4, 7 * k)]);
        ctx.lineCap = "round";
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }

    // Anneau au sol, sous les pieds du joueur
    ctx.strokeStyle = tr.color;
    ctx.fillStyle = tr.color;
    ctx.lineWidth = Math.max(2.5, 5 * k);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.42, 0, 0, Math.PI * 2);
    ctx.globalAlpha = 0.2;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    if (selectedId === tr.id) {
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(cx, cy, r + 6, r * 0.42 + 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Étiquette au-dessus de la tête (taille d'un joueur ≈ 4 rayons)
    if (tr.label) {
      const size = Math.max(11, 15 * k);
      ctx.font = `800 ${size}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;
      const tw = ctx.measureText(tr.label).width;
      const pad = size * 0.45;
      const ty = cy - r * 3.6;
      ctx.shadowColor = "transparent";
      ctx.fillStyle = tr.color;
      ctx.beginPath();
      ctx.roundRect(cx - tw / 2 - pad, ty - size * 0.7, tw + pad * 2, size * 1.4, size * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.35, ty + size * 0.7);
      ctx.lineTo(cx + size * 0.35, ty + size * 0.7);
      ctx.lineTo(cx, ty + size * 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isLightColor(tr.color) ? "#0f172a" : "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tr.label, cx, ty + size * 0.04);
    }
    ctx.restore();
  }
}

/** Joueur suivi le plus proche du point (px) à l'instant t */
export function hitTrack(tracks: Track[], pxX: number, pxY: number, rect: Rect, time: number): Track | null {
  let best: { tr: Track; d: number } | null = null;
  for (const tr of tracks) {
    const p = trackPosition(tr, time);
    if (!p) continue;
    const d = Math.hypot(rect.x + p.x * rect.w - pxX, rect.y + p.y * rect.h - pxY);
    const reach = Math.max(28, tr.size * rect.w * 1.6);
    if (d <= reach && (!best || d < best.d)) best = { tr, d };
  }
  return best ? best.tr : null;
}

function isLightColor(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  if (Number.isNaN(n)) return false;
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160;
}
