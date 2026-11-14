"use client";

// Module Training : outil de série — pose N éléments en ligne, en cercle ou en carré avec un écartement en mètres.
import React, { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { PaletteIcon } from "./Palette";
import { SERIES_ITEMS, type PaletteItem } from "@/lib/training/catalog";
import type { SeriesShape } from "@/lib/training/editorState";

export interface SeriesRequest {
  item: PaletteItem;
  count: number;
  shape: SeriesShape;
  spacing: number;
  angle: number;
}

const SHAPES: Array<{ id: SeriesShape; label: string }> = [
  { id: "line", label: "En ligne" },
  { id: "circle", label: "En cercle" },
  { id: "square", label: "En carré" },
];

const btn = "h-12 rounded-xl border text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5";
const idle = "border-[#1f2937] bg-[#0f141d] text-slate-200 hover:border-[#00E599]/50";
const on = "border-[#00E599] bg-[#00E599]/12 text-[#00E599]";

function plural(item: PaletteItem, n: number) {
  const base = item.label.toLowerCase().replace(/\s*\(.*\)$/, "");
  if (n <= 1) return base;
  return base.split(" ").map((w, i) => (i === 0 ? (w.endsWith("s") ? w : `${w}s`) : w)).join(" ");
}

export default function SeriesDialog({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (r: SeriesRequest) => void }) {
  const [item, setItem] = useState<PaletteItem>(() => SERIES_ITEMS.find((p) => p.id === "pole") || SERIES_ITEMS[0]);
  const [count, setCount] = useState(6);
  const [shape, setShape] = useState<SeriesShape>("line");
  const [spacing, setSpacing] = useState(1.5);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const fmt = (v: number) => String(v).replace(".", ",");
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="series-title" className="w-full max-w-xl max-h-[94vh] overflow-y-auto rounded-3xl border border-[#1a2130] bg-[#0b0f17] p-4 sm:p-5 space-y-4 text-white">
        <div className="flex items-center justify-between">
          <h2 id="series-title" className="text-base font-black">Poser une série</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-11 h-11 rounded-xl border border-[#1f2937] flex items-center justify-center cursor-pointer hover:border-[#00E599]/50"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#62728f] mb-1.5">Élément</p>
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
            {SERIES_ITEMS.map((p) => (
              <button key={p.id} type="button" title={p.label} aria-label={p.label} aria-pressed={p.id === item.id} onClick={() => setItem(p)} className={`h-14 rounded-xl border flex items-center justify-center cursor-pointer ${p.id === item.id ? on : idle}`}>
                <PaletteIcon item={p} size={30} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#62728f] mb-1.5">Nombre</p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Moins" onClick={() => setCount((c) => Math.max(2, c - 1))} className={`${btn} ${idle} w-12`}><Minus className="w-4 h-4" /></button>
              <span className="flex-1 text-center text-lg font-black tabular-nums">{count}</span>
              <button type="button" aria-label="Plus" onClick={() => setCount((c) => Math.min(40, c + 1))} className={`${btn} ${idle} w-12`}><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#62728f] mb-1.5">Écartement</p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Réduire l'écartement" onClick={() => setSpacing((s) => Math.max(0.5, Math.round((s - 0.5) * 10) / 10))} className={`${btn} ${idle} w-12`}><Minus className="w-4 h-4" /></button>
              <span className="flex-1 text-center text-lg font-black tabular-nums">{fmt(spacing)} m</span>
              <button type="button" aria-label="Augmenter l'écartement" onClick={() => setSpacing((s) => Math.min(30, Math.round((s + 0.5) * 10) / 10))} className={`${btn} ${idle} w-12`}><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#62728f] mb-1.5">Disposition</p>
          <div className="grid grid-cols-3 gap-1.5">
            {SHAPES.map((s) => (
              <button key={s.id} type="button" aria-pressed={s.id === shape} onClick={() => setShape(s.id)} className={`${btn} ${s.id === shape ? on : idle}`}>{s.label}</button>
            ))}
          </div>
        </div>

        {shape === "line" && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#62728f] mb-1.5">Orientation</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[{ a: 0, l: "→ Longueur" }, { a: 90, l: "↓ Largeur" }, { a: 45, l: "↘ 45°" }, { a: 135, l: "↙ 135°" }].map((o) => (
                <button key={o.a} type="button" aria-pressed={angle === o.a} onClick={() => setAngle(o.a)} className={`${btn} text-xs ${angle === o.a ? on : idle}`}>{o.l}</button>
              ))}
            </div>
          </div>
        )}

        <p className="rounded-xl bg-[#00E599]/8 border border-[#00E599]/25 px-3 py-2.5 text-sm font-semibold text-[#9ff5d6]">
          {count} {plural(item, count)} espacé{count > 1 ? "s" : ""} de {fmt(spacing)} m, {SHAPES.find((s) => s.id === shape)!.label.toLowerCase()}.
        </p>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className={`${btn} ${idle} px-5`}>Annuler</button>
          <button type="button" onClick={() => onApply({ item, count, shape, spacing, angle })} className={`${btn} px-6 border-[#00E599] bg-[#00E599] text-[#04120c] hover:bg-[#2df0ae]`}>Poser au centre de la vue</button>
        </div>
      </div>
    </div>
  );
}
