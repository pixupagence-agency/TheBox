"use client";

// Module Recording : barre de lecture (lecture, image par image, ralenti, clip entrée / sortie, boucle, frise).
import React, { useRef } from "react";
import {
  ChevronFirst, ChevronLast, Pause, Play, Repeat, SkipBack, SkipForward, StepBack, StepForward,
} from "lucide-react";
import { formatTime } from "@/lib/recording/sources";
import { FPS_OPTIONS, PLAYBACK_RATES } from "@/lib/recording/tags";
import { useRecordingTheme } from "@/lib/recording/theme";
import type { Freeze } from "@/lib/recording/types";

interface Props {
  disabled: boolean;
  time: number;
  duration: number;
  paused: boolean;
  rate: number;
  fps: number;
  inPoint?: number;
  outPoint?: number;
  loop: boolean;
  freezes: Freeze[];
  activeFreezeId: string | null;
  onTogglePlay: () => void;
  onStep: (frames: number) => void;
  onJump: (seconds: number) => void;
  onSeek: (t: number) => void;
  onRate: (r: number) => void;
  onFps: (fps: number) => void;
  onSetIn: () => void;
  onSetOut: () => void;
  onClearClip: () => void;
  onToggleLoop: () => void;
}

export default function Transport(p: Props) {
  const th = useRecordingTheme();
  const barRef = useRef<HTMLDivElement>(null);
  const btn = `h-11 min-w-11 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-black transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed`;
  const pct = (t: number) => (p.duration > 0 ? `${Math.min(100, Math.max(0, (t / p.duration) * 100))}%` : "0%");

  const seekFromPointer = (clientX: number) => {
    const el = barRef.current;
    if (!el || p.duration <= 0) return;
    const b = el.getBoundingClientRect();
    p.onSeek(((clientX - b.left) / b.width) * p.duration);
  };

  return (
    <div className={`shrink-0 border-t px-2 sm:px-3 pt-2.5 pb-2 space-y-2 ${th.toolbar}`}>
      {/* Frise : position, clip et arrêts sur image */}
      <div
        ref={barRef}
        role="slider"
        aria-label="Position dans la vidéo"
        aria-valuemin={0}
        aria-valuemax={Math.round(p.duration)}
        aria-valuenow={Math.round(p.time)}
        tabIndex={0}
        className={`relative h-9 rounded-lg cursor-pointer touch-none ${th.light ? "bg-slate-200" : "bg-[#0b0e13]"} ${p.disabled ? "opacity-40 pointer-events-none" : ""}`}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); seekFromPointer(e.clientX); }}
        onPointerMove={(e) => { if (e.buttons === 1) seekFromPointer(e.clientX); }}
      >
        {p.inPoint !== undefined || p.outPoint !== undefined ? (
          <div
            className="absolute top-0 bottom-0 bg-[#FF5A4E]/20 border-x-2 border-[#FF5A4E]"
            style={{ left: pct(p.inPoint ?? 0), width: `calc(${pct(p.outPoint ?? p.duration)} - ${pct(p.inPoint ?? 0)})` }}
          />
        ) : null}
        <div className="absolute left-0 top-0 bottom-0 rounded-l-lg bg-[#FF5A4E]/35" style={{ width: pct(p.time) }} />
        {p.freezes.map((f) => (
          <button
            key={f.id}
            type="button"
            title={`Arrêt sur image ${formatTime(f.time, true, p.fps)} · ${f.shapes.length} consigne${f.shapes.length > 1 ? "s" : ""}`}
            aria-label={`Aller à l'arrêt sur image ${formatTime(f.time, true, p.fps)}`}
            onPointerDown={(e) => { e.stopPropagation(); p.onSeek(f.time); }}
            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 border-2 cursor-pointer ${f.id === p.activeFreezeId ? "bg-white border-[#FF5A4E]" : "bg-[#facc15] border-[#0f172a]"}`}
            style={{ left: pct(f.time) }}
          />
        ))}
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.8)] pointer-events-none" style={{ left: pct(p.time) }} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
          <button type="button" disabled={p.disabled} className={`${btn} ${th.toolIdle}`} onClick={() => p.onJump(-5)} title="Reculer de 5 s (Maj + ←)" aria-label="Reculer de 5 secondes"><SkipBack className="w-5 h-5" /></button>
          <button type="button" disabled={p.disabled} className={`${btn} ${th.toolIdle}`} onClick={() => p.onStep(-1)} title="Image précédente (←)" aria-label="Image précédente"><StepBack className="w-5 h-5" /></button>
          <button type="button" disabled={p.disabled} className={`${btn} min-w-14 ${th.primaryBtn} border`} onClick={p.onTogglePlay} title="Lecture / pause (Espace)" aria-label={p.paused ? "Lecture" : "Pause"}>
            {p.paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button type="button" disabled={p.disabled} className={`${btn} ${th.toolIdle}`} onClick={() => p.onStep(1)} title="Image suivante (→)" aria-label="Image suivante"><StepForward className="w-5 h-5" /></button>
          <button type="button" disabled={p.disabled} className={`${btn} ${th.toolIdle}`} onClick={() => p.onJump(5)} title="Avancer de 5 s (Maj + →)" aria-label="Avancer de 5 secondes"><SkipForward className="w-5 h-5" /></button>
        </div>

        <span className={`shrink-0 px-2 text-sm font-black tabular-nums ${th.text}`}>
          {formatTime(p.time, true, p.fps)} <span className={th.faint}>/ {formatTime(p.duration)}</span>
        </span>

        <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
          {PLAYBACK_RATES.map((r) => (
            <button key={r} type="button" disabled={p.disabled} aria-pressed={p.rate === r} onClick={() => p.onRate(r)} className={`${btn} min-w-10 px-1.5 tabular-nums ${p.rate === r ? th.toolOn : th.toolIdle}`} title={`Vitesse ×${String(r).replace(".", ",")}`}>
              ×{String(r).replace(".", ",")}
            </button>
          ))}
        </div>

        <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
          <button type="button" disabled={p.disabled} className={`${btn} ${th.toolIdle}`} onClick={p.onSetIn} title="Début du clip à la position actuelle (I)" aria-label="Début du clip"><ChevronFirst className="w-5 h-5" /><span className="hidden xl:inline">Entrée</span></button>
          <button type="button" disabled={p.disabled} className={`${btn} ${th.toolIdle}`} onClick={p.onSetOut} title="Fin du clip à la position actuelle (O)" aria-label="Fin du clip"><ChevronLast className="w-5 h-5" /><span className="hidden xl:inline">Sortie</span></button>
          <button type="button" disabled={p.disabled} className={`${btn} ${p.loop ? th.toolOn : th.toolIdle}`} onClick={p.onToggleLoop} aria-pressed={p.loop} title="Lire le clip en boucle (L)" aria-label="Boucle"><Repeat className="w-5 h-5" /><span className="hidden xl:inline">Boucle</span></button>
          {(p.inPoint !== undefined || p.outPoint !== undefined) && (
            <button type="button" className={`${btn} text-xs ${th.toolIdle}`} onClick={p.onClearClip} title="Retirer les points d'entrée et de sortie">Clip ✕</button>
          )}
        </div>

        <label className={`ml-auto shrink-0 flex items-center gap-1.5 text-xs font-bold ${th.sub}`}>
          Images/s
          <select value={p.fps} onChange={(e) => p.onFps(Number(e.target.value))} className={`h-11 rounded-lg border px-2 text-sm font-black cursor-pointer ${th.idleBtn} ${th.option}`} aria-label="Images par seconde">
            {FPS_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
