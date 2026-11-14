"use client";

// Module Training : rendu Konva d'un élément du schéma (unités = mètres, l'échelle est portée par le calque).
import React from "react";
import { Arrow, Circle, Ellipse, Group, Line, Rect, RegularPolygon, Text } from "react-konva";
import type Konva from "konva";
import { LADDER_RUNG_SPACING, LADDER_WIDTH } from "@/lib/training/catalog";
import type { ArrowElement, TrainingElement, ZoneElement } from "@/lib/training/types";

/** Agrandit un symbole trop petit à l'écran (taille minimale en pixels) sans toucher à ses dimensions réelles */
export const boostFor = (pxPerMeter: number, minPx: number, meters: number) => Math.max(1, minPx / (pxPerMeter * meters));

/** Courbe passant par le point milieu (quadratique), échantillonnée ; ondulée pour la conduite de balle */
export function arrowPath(points: number[], style: ArrowElement["style"], waveAmp = 0.35): number[] {
  const [x0, y0, xm, ym, x1, y1] = points.length >= 6 ? points : [points[0], points[1], (points[0] + points[2]) / 2, (points[1] + points[3]) / 2, points[2], points[3]];
  const cx = 2 * xm - (x0 + x1) / 2;
  const cy = 2 * ym - (y0 + y1) / 2;
  const at = (t: number) => {
    const u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 };
  };
  const length = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(cx - (x0 + x1) / 2, cy - (y0 + y1) / 2);
  const samples = Math.max(16, Math.min(160, Math.round(length * 4)));
  const out: number[] = [];
  const waves = Math.max(2, Math.round(length / 1.6));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = at(t);
    if (style === "dribble" && i > 0 && i < samples - 2) {
      const q = at(Math.min(1, t + 0.001));
      const nx = -(q.y - p.y);
      const ny = q.x - p.x;
      const n = Math.hypot(nx, ny) || 1;
      const off = Math.sin(t * waves * 2 * Math.PI) * waveAmp;
      out.push(p.x + (nx / n) * off, p.y + (ny / n) * off);
    } else {
      out.push(p.x, p.y);
    }
  }
  return out;
}

const ARROW_WIDTH: Record<ArrowElement["style"], number> = { run: 0.16, dribble: 0.14, pass: 0.18, shot: 0.38 };

export function ZoneBody({ zone, boost }: { zone: ZoneElement; boost: number }) {
  const fill = zone.color;
  const common = { fill, opacity: 1, stroke: zone.color, strokeWidth: 0.1 * boost, dash: [0.5 * boost, 0.3 * boost] };
  const labelSize = Math.max(0.8, Math.min(zone.width, zone.height || zone.width) * 0.12) * Math.min(boost, 2);
  return (
    <>
      {zone.shape === "rect" && (
        <Rect x={-zone.width / 2} y={-zone.height / 2} width={zone.width} height={zone.height} {...common} fill={hexToRgba(fill, 0.22)} />
      )}
      {zone.shape === "circle" && <Circle radius={zone.width / 2} {...common} fill={hexToRgba(fill, 0.22)} />}
      {zone.shape === "polygon" && zone.points && zone.points.length >= 6 && (
        <Line points={zone.points} closed {...common} fill={hexToRgba(fill, 0.22)} />
      )}
      {zone.label ? (
        <Text
          text={zone.label}
          fontSize={labelSize}
          fontStyle="bold"
          fill="#ffffff"
          width={Math.max(zone.width, 4)}
          offsetX={Math.max(zone.width, 4) / 2}
          offsetY={labelSize / 2}
          align="center"
          shadowColor="#000"
          shadowBlur={0.3}
          shadowOpacity={0.6}
          listening={false}
        />
      ) : null}
    </>
  );
}

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Zone de contact invisible, assez grande pour le doigt */
const HitArea = ({ radius }: { radius: number }) => <Circle radius={radius} fill="rgba(0,0,0,0.01)" />;

interface ElementShapeProps {
  el: TrainingElement;
  pxPerMeter: number;
  draggable: boolean;
  dimmed?: boolean;
  onPointerDown?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

function ElementShapeInner({ el, pxPerMeter, draggable, dimmed, onPointerDown, onDragStart, onDragMove, onDragEnd }: ElementShapeProps) {
  const hit = 20 / pxPerMeter; // rayon de contact ≈ 20 px
  let body: React.ReactNode = null;

  switch (el.kind) {
    case "flatCone": {
      const b = boostFor(pxPerMeter, 7, 0.2);
      body = (
        <>
          <HitArea radius={Math.max(hit, 0.3)} />
          <Circle radius={0.2 * b} fill={el.color} stroke="rgba(0,0,0,0.55)" strokeWidth={0.035 * b} />
          <Circle radius={0.07 * b} fill="rgba(0,0,0,0.35)" />
        </>
      );
      break;
    }
    case "tallCone": {
      const b = boostFor(pxPerMeter, 8, 0.24);
      body = (
        <>
          <HitArea radius={Math.max(hit, 0.35)} />
          <Circle radius={0.24 * b} fill={el.color} stroke="rgba(0,0,0,0.55)" strokeWidth={0.035 * b} shadowColor="#000" shadowBlur={0.15 * b} shadowOpacity={0.4} />
          <Circle radius={0.15 * b} stroke="#ffffff" strokeWidth={0.045 * b} />
          <Circle radius={0.05 * b} fill={el.color} stroke="rgba(0,0,0,0.4)" strokeWidth={0.02 * b} />
        </>
      );
      break;
    }
    case "pole": {
      const b = boostFor(pxPerMeter, 7, 0.16);
      body = (
        <>
          <HitArea radius={Math.max(hit, 0.3)} />
          <Circle radius={0.16 * b} fill="rgba(15,23,42,0.55)" stroke={el.color} strokeWidth={0.03 * b} />
          <Circle radius={0.06 * b} fill={el.color} stroke="rgba(0,0,0,0.6)" strokeWidth={0.02 * b} />
        </>
      );
      break;
    }
    case "ladder": {
      const length = Math.max(1, el.rungs - 1) * LADDER_RUNG_SPACING;
      const w = LADDER_WIDTH;
      const sw = 0.05 * boostFor(pxPerMeter, 1.5, 0.05);
      body = (
        <>
          <Rect x={-length / 2 - 0.2} y={-w / 2 - 0.2} width={length + 0.4} height={w + 0.4} fill="rgba(0,0,0,0.01)" />
          <Line points={[-length / 2, -w / 2, length / 2, -w / 2]} stroke="#facc15" strokeWidth={sw} />
          <Line points={[-length / 2, w / 2, length / 2, w / 2]} stroke="#facc15" strokeWidth={sw} />
          {Array.from({ length: el.rungs }, (_, i) => {
            const x = -length / 2 + i * LADDER_RUNG_SPACING;
            return <Line key={i} points={[x, -w / 2, x, w / 2]} stroke="#facc15" strokeWidth={sw * 1.2} />;
          })}
        </>
      );
      break;
    }
    case "hoop": {
      const r = el.diameter / 2;
      const sw = 0.045 * boostFor(pxPerMeter, 2, 0.045);
      body = (
        <>
          <HitArea radius={Math.max(r + 0.1, hit)} />
          <Circle radius={r} stroke={el.color} strokeWidth={sw} fill="rgba(0,0,0,0.01)" />
        </>
      );
      break;
    }
    case "miniGoal":
    case "goal": {
      const w = el.size;
      const depth = el.kind === "goal" ? (el.size >= 6 ? 2 : 1.2) : 0.8;
      const b = boostFor(pxPerMeter, 2.5, 0.08);
      body = (
        <>
          <Rect x={-depth - 0.2} y={-w / 2 - 0.3} width={depth + 0.6} height={w + 0.6} fill="rgba(0,0,0,0.01)" />
          <Rect x={-depth} y={-w / 2} width={depth} height={w} fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.7)" strokeWidth={0.04 * b} dash={[0.15 * b, 0.1 * b]} />
          <Line points={[0, -w / 2, 0, w / 2]} stroke="#ffffff" strokeWidth={0.1 * b} lineCap="round" />
          <Circle x={0} y={-w / 2} radius={0.08 * b} fill="#ffffff" />
          <Circle x={0} y={w / 2} radius={0.08 * b} fill="#ffffff" />
        </>
      );
      break;
    }
    case "mannequin": {
      const b = boostFor(pxPerMeter, 6, 0.22);
      const gap = 0.6 * Math.min(b, 1.6);
      const total = (el.count - 1) * gap;
      body = (
        <>
          <Rect x={-0.5 * b} y={-total / 2 - 0.5 * b} width={b} height={total + b} fill="rgba(0,0,0,0.01)" />
          {Array.from({ length: el.count }, (_, i) => (
            <Group key={i} y={-total / 2 + i * gap}>
              <Ellipse radiusX={0.14 * b} radiusY={0.24 * b} fill="#2563eb" stroke="#0f172a" strokeWidth={0.03 * b} />
              <Circle radius={0.09 * b} fill="#f1f5f9" stroke="#0f172a" strokeWidth={0.02 * b} />
            </Group>
          ))}
        </>
      );
      break;
    }
    case "player": {
      const b = boostFor(pxPerMeter, 13, 0.5);
      const r = 0.5 * b;
      const isCoach = el.role === "coach";
      const dark = isLight(el.color) ? "#0f172a" : "#ffffff";
      body = (
        <>
          <HitArea radius={Math.max(r * 1.3, hit)} />
          {/* Orientation : petit triangle devant le joueur */}
          <RegularPolygon x={r * 1.05} sides={3} radius={r * 0.32} rotation={90} fill={el.color} stroke="rgba(0,0,0,0.5)" strokeWidth={0.03 * b} />
          {isCoach ? (
            <Rect x={-r} y={-r} width={2 * r} height={2 * r} cornerRadius={0.2 * b} fill={el.color} stroke="#ffffff" strokeWidth={0.06 * b} />
          ) : (
            <Circle
              radius={r}
              fill={el.color}
              stroke={el.role === "goalkeeper" ? "#0f172a" : "#ffffff"}
              strokeWidth={(el.role === "goalkeeper" ? 0.1 : 0.06) * b}
              shadowColor="#000"
              shadowBlur={0.25 * b}
              shadowOpacity={0.45}
            />
          )}
          <Text
            text={isCoach ? "C" : el.role === "goalkeeper" && !el.number ? "G" : el.number ? String(el.number) : ""}
            fontSize={0.55 * b}
            fontStyle="bold"
            fill={dark}
            width={2 * r}
            offsetX={r}
            offsetY={0.28 * b}
            align="center"
            rotation={-el.rotation}
            listening={false}
          />
          {el.name ? (
            <Text
              text={el.name}
              fontSize={0.42 * b}
              fontStyle="bold"
              fill="#ffffff"
              width={6 * b}
              offsetX={3 * b}
              y={r + 0.12 * b}
              align="center"
              shadowColor="#000"
              shadowBlur={0.2 * b}
              shadowOpacity={0.8}
              rotation={-el.rotation}
              listening={false}
            />
          ) : null}
        </>
      );
      break;
    }
    case "ball": {
      const b = boostFor(pxPerMeter, 6, 0.2);
      body = (
        <>
          <HitArea radius={Math.max(hit, 0.3)} />
          <Circle radius={0.2 * b} fill="#ffffff" stroke="#0f172a" strokeWidth={0.035 * b} shadowColor="#000" shadowBlur={0.12 * b} shadowOpacity={0.5} />
          <RegularPolygon sides={5} radius={0.075 * b} fill="#0f172a" />
        </>
      );
      break;
    }
    case "arrow": {
      const b = boostFor(pxPerMeter, 2.5, ARROW_WIDTH[el.style]);
      const sw = ARROW_WIDTH[el.style] * b;
      const path = arrowPath(el.points, el.style, 0.3 * Math.min(b, 2));
      const head = (el.style === "shot" ? 1.1 : 0.75) * Math.min(b, 2.5);
      body = (
        <>
          <Line points={path} stroke="rgba(0,0,0,0.01)" strokeWidth={Math.max(sw * 4, hit)} />
          <Arrow
            points={path}
            stroke={el.color}
            fill={el.color}
            strokeWidth={sw}
            pointerLength={head}
            pointerWidth={head * 0.9}
            dash={el.style === "run" ? [0.55 * b, 0.4 * b] : undefined}
            lineCap="round"
            lineJoin="round"
            shadowColor="#000"
            shadowBlur={el.style === "shot" ? 0.3 : 0.15}
            shadowOpacity={0.4}
          />
        </>
      );
      break;
    }
    case "zone":
      body = <ZoneBody zone={el} boost={boostFor(pxPerMeter, 1.5, 0.1)} />;
      break;
    case "text": {
      const b = boostFor(pxPerMeter, 11, el.size);
      const size = el.size * b;
      const width = Math.max(2, el.text.length * size * 0.62);
      body = (
        <Text
          text={el.text}
          fontSize={size}
          fontStyle="bold"
          fill={el.color}
          width={width}
          offsetX={width / 2}
          offsetY={size / 2}
          align="center"
          shadowColor="#000"
          shadowBlur={0.25 * b}
          shadowOpacity={0.7}
        />
      );
      break;
    }
    case "step": {
      const b = boostFor(pxPerMeter, 11, 0.6);
      const r = 0.6 * b;
      body = (
        <>
          <HitArea radius={Math.max(r, hit)} />
          <Circle radius={r} fill={el.color} stroke="#0f172a" strokeWidth={0.08 * b} />
          <Text
            text={String(el.value)}
            fontSize={0.75 * b}
            fontStyle="bold"
            fill={isLight(el.color) ? "#0f172a" : "#ffffff"}
            width={2 * r}
            offsetX={r}
            offsetY={0.37 * b}
            align="center"
            rotation={-el.rotation}
            listening={false}
          />
        </>
      );
      break;
    }
  }

  return (
    <Group
      id={el.id}
      name="training-element"
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      draggable={draggable}
      opacity={dimmed ? 0.55 : 1}
      onPointerDown={onPointerDown}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      {body}
    </Group>
  );
}

export function isLight(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  if (Number.isNaN(n)) return false;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, bl = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * bl > 160;
}

export const ElementShape = React.memo(ElementShapeInner);
