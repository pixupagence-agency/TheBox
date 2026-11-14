"use client";

// Module Training : palette du matériel et des annotations.
// Un appui arme l'outil (poses répétées sur le terrain) ; un glissement vers le terrain dépose l'élément.
import React, { useEffect, useRef, useState } from "react";
import { PALETTE, PALETTE_GROUPS, type PaletteItem } from "@/lib/training/catalog";

export function PaletteIcon({ item, size = 34 }: { item: PaletteItem; size?: number }) {
  const t = item.template;
  const d = item.drawTool;
  const common = { width: size, height: size, viewBox: "0 0 40 40", "aria-hidden": true } as const;
  if (d?.kind === "arrow") {
    const color = d.style === "shot" ? "#facc15" : "#ffffff";
    const path = d.style === "dribble" ? "M6 30 q4 -8 8 -4 t8 -4 t8 -4" : "M6 32 L30 10";
    return (
      <svg {...common}>
        <path d={path} fill="none" stroke={color} strokeWidth={d.style === "shot" ? 5 : 2.6} strokeDasharray={d.style === "run" ? "4 3" : undefined} strokeLinecap="round" />
        <path d="M24 8 L33 7 L31 16 Z" fill={color} />
      </svg>
    );
  }
  if (d?.kind === "zone") {
    return (
      <svg {...common}>
        {d.shape === "rect" && <rect x="7" y="10" width="26" height="20" fill="rgba(250,204,21,0.25)" stroke="#facc15" strokeWidth="2" strokeDasharray="4 3" />}
        {d.shape === "circle" && <circle cx="20" cy="20" r="13" fill="rgba(250,204,21,0.25)" stroke="#facc15" strokeWidth="2" strokeDasharray="4 3" />}
        {d.shape === "polygon" && <polygon points="8,28 14,9 30,12 33,30" fill="rgba(250,204,21,0.25)" stroke="#facc15" strokeWidth="2" strokeDasharray="4 3" />}
      </svg>
    );
  }
  if (!t) return null;
  switch (t.kind) {
    case "flatCone":
      return <svg {...common}><circle cx="20" cy="20" r="11" fill={t.color} stroke="#0f172a" strokeWidth="2" /><circle cx="20" cy="20" r="4" fill="rgba(0,0,0,0.35)" /></svg>;
    case "tallCone":
      return <svg {...common}><polygon points="20,5 30,32 10,32" fill={t.color} stroke="#0f172a" strokeWidth="1.5" /><rect x="13" y="18" width="14" height="4" fill="#fff" /><rect x="7" y="32" width="26" height="3" rx="1" fill={t.color} /></svg>;
    case "pole":
      return <svg {...common}><rect x="18" y="4" width="4" height="30" rx="2" fill={t.color} stroke="#0f172a" strokeWidth="1" /><ellipse cx="20" cy="35" rx="8" ry="2.5" fill="#334155" /></svg>;
    case "ladder":
      return <svg {...common}><path d="M6 13 H34 M6 27 H34" stroke="#facc15" strokeWidth="2.4" />{[8, 14, 20, 26, 32].map((x) => <path key={x} d={`M${x} 13 V27`} stroke="#facc15" strokeWidth="2.4" />)}</svg>;
    case "hoop":
      return <svg {...common}><circle cx="20" cy="20" r="12" fill="none" stroke={t.color} strokeWidth="3.5" /></svg>;
    case "miniGoal":
      return <svg {...common}><path d="M8 28 V14 H32 V28" fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth="2.6" /><path d="M8 14 L13 22 H27 L32 14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" /></svg>;
    case "goal":
      return <svg {...common}><path d="M4 30 V11 H36 V30" fill="rgba(255,255,255,0.12)" stroke="#fff" strokeWidth="3" />{[10, 16, 22, 28].map((x) => <path key={x} d={`M${x} 11 V30`} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />)}</svg>;
    case "mannequin":
      return <svg {...common}>{[9, 20, 31].map((x) => <g key={x}><circle cx={x} cy="11" r="3.5" fill="#f1f5f9" /><rect x={x - 4} y="15" width="8" height="18" rx="3" fill="#2563eb" /></g>)}</svg>;
    case "ball":
      return <svg {...common}><circle cx="20" cy="20" r="12" fill="#fff" stroke="#0f172a" strokeWidth="2" /><polygon points="20,15 24.5,18.5 23,23.5 17,23.5 15.5,18.5" fill="#0f172a" /></svg>;
    case "player": {
      const label = t.role === "coach" ? "C" : t.role === "goalkeeper" ? "G" : "";
      return (
        <svg {...common}>
          {t.role === "coach" ? <rect x="8" y="8" width="24" height="24" rx="5" fill={t.color} stroke="#fff" strokeWidth="2.5" /> : <circle cx="20" cy="20" r="12" fill={t.color} stroke={t.role === "goalkeeper" ? "#0f172a" : "#fff"} strokeWidth="2.5" />}
          {label && <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="800" fill={t.role === "coach" ? "#fff" : "#0f172a"}>{label}</text>}
        </svg>
      );
    }
    case "text":
      return <svg {...common}><text x="20" y="27" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff">Aa</text></svg>;
    case "step":
      return <svg {...common}><circle cx="20" cy="20" r="12" fill="#facc15" stroke="#0f172a" strokeWidth="2" /><text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">1</text></svg>;
    default:
      return null;
  }
}

interface PaletteProps {
  armedId: string | null;
  onArm: (item: PaletteItem | null) => void;
  /** Dépôt par glisser : coordonnées écran du lâcher */
  onDrop: (item: PaletteItem, clientX: number, clientY: number) => void;
}

export default function Palette({ armedId, onArm, onDrop }: PaletteProps) {
  const [ghost, setGhost] = useState<{ item: PaletteItem; x: number; y: number } | null>(null);
  const press = useRef<{ item: PaletteItem; x: number; y: number; dragging: boolean; pointerId: number; mouse: boolean } | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = press.current;
      if (!p || e.pointerId !== p.pointerId) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      // Souris : tout glissement est un dépôt. Doigt : glissement plutôt horizontal (vers le terrain) = dépôt,
      // vertical = défilement de la palette
      if (!p.dragging && Math.hypot(dx, dy) > 10 && (p.mouse || Math.abs(dx) > Math.abs(dy) * 0.7)) p.dragging = true;
      if (p.dragging) setGhost({ item: p.item, x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => {
      const p = press.current;
      if (!p || e.pointerId !== p.pointerId) return;
      press.current = null;
      setGhost(null);
      if (p.dragging) onDrop(p.item, e.clientX, e.clientY);
      else if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 10) onArm(armedId === p.item.id ? null : p.item);
    };
    const cancel = () => { press.current = null; setGhost(null); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [armedId, onArm, onDrop]);

  return (
    <>
      <nav aria-label="Matériel et annotations" className="h-full overflow-y-auto overscroll-contain scrollbar-thin px-1.5 py-2 space-y-3" style={{ touchAction: "pan-y" }}>
        {PALETTE_GROUPS.map((group) => (
          <section key={group.id}>
            <h2 className="px-1 pb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#62728f]">{group.label}</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTE.filter((p) => p.group === group.id).map((item) => {
                const isArmed = armedId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={`${item.label} — appuyer pour poser, ou glisser vers le terrain`}
                    aria-label={item.label}
                    aria-pressed={isArmed}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      press.current = { item, x: e.clientX, y: e.clientY, dragging: false, pointerId: e.pointerId, mouse: e.pointerType === "mouse" };
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onArm(isArmed ? null : item); }
                    }}
                    className={`h-[58px] rounded-xl border flex flex-col items-center justify-center gap-0.5 transition cursor-pointer select-none ${isArmed
                      ? "bg-[#00E599]/15 border-[#00E599] shadow-[0_0_0_2px_rgba(0,229,153,0.25)]"
                      : "bg-[#0b0f17] border-[#1a2130] hover:border-[#00E599]/50 hover:bg-[#101722]"}`}
                  >
                    <PaletteIcon item={item} size={30} />
                    <span className="text-[8.5px] leading-none font-bold text-slate-300 px-0.5 truncate max-w-full">{shortLabel(item)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
      {ghost && (
        <div className="fixed z-[80] pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-xl" style={{ left: ghost.x, top: ghost.y }}>
          <PaletteIcon item={ghost.item} size={44} />
        </div>
      )}
    </>
  );
}

function shortLabel(item: PaletteItem) {
  const map: Record<string, string> = {
    "flatCone-yellow": "Jaune", "flatCone-red": "Rouge", "flatCone-blue": "Bleue", "flatCone-orange": "Orange", "flatCone-white": "Blanche",
    tallCone: "Cône", pole: "Piquet", ladder: "Échelle", hoop: "Cerceau", miniGoal: "Mini-but", goal: "But", mannequin: "Mur", ball: "Ballon",
    "player-a": "Vert", "player-b": "Orange", goalkeeper: "Gardien", coach: "Coach",
    "arrow-run": "Course", "arrow-dribble": "Conduite", "arrow-pass": "Passe", "arrow-shot": "Tir",
    "zone-rect": "Rectangle", "zone-circle": "Cercle", "zone-polygon": "Polygone", text: "Texte", step: "Étape",
  };
  return map[item.id] || item.label;
}
