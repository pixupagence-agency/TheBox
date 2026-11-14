"use client";

// Module Training : panneau de propriétés (élément sélectionné, sélection multiple ou réglages du terrain).
import React, { useMemo, useRef } from "react";
import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalSpaceAround,
  AlignStartHorizontal, AlignStartVertical, AlignVerticalSpaceAround, Copy, Eye, EyeOff, Lock, Minus, Plus,
  RotateCcw, RotateCw, Trash2, Unlock,
} from "lucide-react";
import {
  ANNOTATION_COLORS, ARROW_STYLES, BIB_COLORS, CONE_COLORS, GOAL_SIZES, KIND_LABELS, MINI_GOAL_SIZES, PLAYER_ROLES,
} from "@/lib/training/catalog";
import type { AlignMode, EditorAction, EditorState } from "@/lib/training/editorState";
import { FREE_PITCH_LIMITS, PITCH_FORMATS, makePitchConfig } from "@/lib/training/pitch";
import type { RosterPlayer } from "@/lib/training/storage";
import { LAYER_LABELS, LAYER_OF, type LayerId, type PitchFormatId, type TrainingElement } from "@/lib/training/types";

const card = "rounded-2xl border border-[#1a2130] bg-[#0b0f17] p-3 space-y-3";
const label = "block text-[10px] font-black uppercase tracking-[0.14em] text-[#62728f] mb-1.5";
const input = "w-full h-11 rounded-xl border border-[#1f2937] bg-[#070a10] px-3 text-sm font-semibold text-white outline-none focus:border-[#00E599]/70";
const bigBtn = "h-11 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5";
const idleBtn = "border-[#1f2937] bg-[#0f141d] text-slate-200 hover:border-[#00E599]/50";
const activeBtn = "border-[#00E599] bg-[#00E599]/12 text-[#00E599]";

function Swatches({ colors, value, onChange }: { colors: Array<{ id: string; label: string; hex: string }>; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.label}
          aria-label={c.label}
          aria-pressed={value.toLowerCase() === c.hex.toLowerCase()}
          onClick={() => onChange(c.hex)}
          className={`w-10 h-10 rounded-full border-2 cursor-pointer transition ${value.toLowerCase() === c.hex.toLowerCase() ? "border-[#00E599] scale-110" : "border-[#1f2937]"}`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

function Stepper({ value, min, max, step = 1, suffix, onChange }: { value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Diminuer" onClick={() => set(value - step)} disabled={value <= min} className={`${bigBtn} ${idleBtn} w-11 disabled:opacity-40`}><Minus className="w-4 h-4" /></button>
      <span className="flex-1 text-center text-base font-black text-white tabular-nums">{String(value).replace(".", ",")}{suffix ? ` ${suffix}` : ""}</span>
      <button type="button" aria-label="Augmenter" onClick={() => set(value + step)} disabled={value >= max} className={`${bigBtn} ${idleBtn} w-11 disabled:opacity-40`}><Plus className="w-4 h-4" /></button>
    </div>
  );
}

function Choice<T extends string | number>({ options, value, onChange, cols = 2 }: { options: Array<{ value: T; label: string }>; value: T; onChange: (v: T) => void; cols?: number }) {
  return (
    <div className={`grid gap-1.5 ${cols === 3 ? "grid-cols-3" : cols === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)} className={`${bigBtn} px-2 ${o.value === value ? activeBtn : idleBtn}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface Props {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  roster: { teamName: string; players: RosterPlayer[] };
}

export default function PropertiesPanel({ state, dispatch, roster }: Props) {
  const selected = useMemo(() => state.diagram.elements.filter((e) => state.selectedIds.includes(e.id)), [state.diagram.elements, state.selectedIds]);
  // Saisie continue (texte, nom) : une seule entrée d'historique par champ
  const lastEdit = useRef<{ key: string; at: number } | null>(null);

  const update = (el: TrainingElement, patch: Partial<TrainingElement>, field?: string) => {
    const key = `${el.id}:${field || ""}`;
    const now = Date.now();
    const merge = Boolean(field && lastEdit.current && lastEdit.current.key === key && now - lastEdit.current.at < 1500);
    lastEdit.current = field ? { key, at: now } : null;
    dispatch({ type: "update", id: el.id, patch, merge });
  };

  if (selected.length === 0) return <PitchSettings state={state} dispatch={dispatch} />;

  const actions = (
    <div className="grid grid-cols-3 gap-1.5">
      <button type="button" onClick={() => dispatch({ type: "duplicate" })} className={`${bigBtn} ${idleBtn}`} title="Dupliquer (Ctrl+D)"><Copy className="w-4 h-4" />Dupliquer</button>
      <button type="button" onClick={() => dispatch({ type: "toggleLock" })} className={`${bigBtn} ${idleBtn}`} title="Verrouiller / déverrouiller">
        {selected.every((e) => e.locked) ? <><Unlock className="w-4 h-4" />Déverr.</> : <><Lock className="w-4 h-4" />Verrouiller</>}
      </button>
      <button type="button" onClick={() => dispatch({ type: "delete" })} disabled={selected.every((e) => e.locked)} className={`${bigBtn} border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 disabled:opacity-40`} title="Supprimer (Suppr)"><Trash2 className="w-4 h-4" />Suppr.</button>
    </div>
  );

  if (selected.length > 1) {
    const align: Array<{ mode: AlignMode; label: string; icon: React.ElementType }> = [
      { mode: "left", label: "Aligner à gauche", icon: AlignStartVertical },
      { mode: "centerX", label: "Centrer horizontalement", icon: AlignCenterVertical },
      { mode: "right", label: "Aligner à droite", icon: AlignEndVertical },
      { mode: "top", label: "Aligner en haut", icon: AlignStartHorizontal },
      { mode: "centerY", label: "Centrer verticalement", icon: AlignCenterHorizontal },
      { mode: "bottom", label: "Aligner en bas", icon: AlignEndHorizontal },
      { mode: "distributeX", label: "Répartir horizontalement", icon: AlignHorizontalSpaceAround },
      { mode: "distributeY", label: "Répartir verticalement", icon: AlignVerticalSpaceAround },
    ];
    return (
      <div className="space-y-3">
        <div className={card}>
          <p className="text-sm font-black text-white">{selected.length} éléments sélectionnés</p>
          {actions}
        </div>
        <div className={card}>
          <span className={label}>Alignement</span>
          <div className="grid grid-cols-4 gap-1.5">
            {align.map((a) => (
              <button key={a.mode} type="button" title={a.label} aria-label={a.label} onClick={() => dispatch({ type: "align", mode: a.mode })} disabled={a.mode.startsWith("distribute") && selected.length < 3} className={`${bigBtn} ${idleBtn} disabled:opacity-40`}>
                <a.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const el = selected[0];
  const rotationEditable = !(el.kind === "arrow" || (el.kind === "zone" && el.shape === "polygon"));

  return (
    <div className="space-y-3">
      <div className={card}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black text-white">{KIND_LABELS[el.kind]}</p>
          <span className="text-[10px] font-bold text-[#62728f]">{LAYER_LABELS[LAYER_OF[el.kind]]} · {String(el.x.toFixed(1)).replace(".", ",")} ; {String(el.y.toFixed(1)).replace(".", ",")} m</span>
        </div>
        {el.locked && <p className="text-[11px] font-semibold text-amber-300">Élément verrouillé : déverrouillez-le pour le déplacer ou le modifier.</p>}
        {actions}
      </div>

      <fieldset disabled={el.locked} className="space-y-3 disabled:opacity-50">
        {(el.kind === "flatCone" || el.kind === "tallCone" || el.kind === "pole" || el.kind === "hoop") && (
          <div className={card}>
            <span className={label}>Couleur</span>
            <Swatches colors={CONE_COLORS} value={el.color} onChange={(color) => update(el, { color })} />
          </div>
        )}
        {el.kind === "pole" && (
          <div className={card}>
            <span className={label}>Hauteur</span>
            <Stepper value={el.height} min={0.5} max={2} step={0.1} suffix="m" onChange={(height) => update(el, { height })} />
          </div>
        )}
        {el.kind === "ladder" && (
          <div className={card}>
            <span className={label}>Nombre de barreaux</span>
            <Stepper value={el.rungs} min={3} max={20} onChange={(rungs) => update(el, { rungs })} />
            <p className="text-[11px] text-slate-400">Longueur : {String(((el.rungs - 1) * 0.45).toFixed(2)).replace(".", ",")} m — orientation avec la rotation.</p>
          </div>
        )}
        {el.kind === "hoop" && (
          <div className={card}>
            <span className={label}>Diamètre</span>
            <Stepper value={el.diameter} min={0.4} max={1.2} step={0.1} suffix="m" onChange={(diameter) => update(el, { diameter })} />
          </div>
        )}
        {el.kind === "miniGoal" && (
          <div className={card}>
            <span className={label}>Taille</span>
            <Choice cols={1} options={MINI_GOAL_SIZES.map((g) => ({ value: g.size, label: g.label }))} value={el.size} onChange={(size) => update(el, { size })} />
          </div>
        )}
        {el.kind === "goal" && (
          <div className={card}>
            <span className={label}>Format</span>
            <Choice cols={1} options={GOAL_SIZES.map((g) => ({ value: g.size, label: g.label }))} value={el.size} onChange={(size) => update(el, { size })} />
          </div>
        )}
        {el.kind === "mannequin" && (
          <div className={card}>
            <span className={label}>Nombre de mannequins</span>
            <Stepper value={el.count} min={1} max={8} onChange={(count) => update(el, { count })} />
          </div>
        )}
        {el.kind === "player" && (
          <>
            <div className={card}>
              <span className={label}>Rôle</span>
              <Choice cols={3} options={PLAYER_ROLES.map((r) => ({ value: r.id, label: r.label }))} value={el.role} onChange={(role) => update(el, { role })} />
              <span className={label}>Chasuble</span>
              <Swatches colors={BIB_COLORS} value={el.color} onChange={(color) => update(el, { color })} />
            </div>
            <div className={card}>
              <span className={label}>Joueur de l&apos;effectif{roster.teamName ? ` (${roster.teamName})` : ""}</span>
              <select
                className={`${input} cursor-pointer`}
                value={el.rosterId || ""}
                onChange={(e) => {
                  const p = roster.players.find((x) => x.id === e.target.value);
                  update(el, p ? { rosterId: p.id, name: p.name, number: p.number || undefined } : { rosterId: undefined });
                }}
              >
                <option value="">— Joueur libre —</option>
                {roster.players.map((p) => (
                  <option key={p.id} value={p.id}>{p.number ? `${p.number} · ` : ""}{p.name}{p.role ? ` (${p.role})` : ""}</option>
                ))}
              </select>
              <div className="grid grid-cols-[88px_1fr] gap-2">
                <div>
                  <label className={label} htmlFor="tr-num">Numéro</label>
                  <input id="tr-num" className={input} inputMode="numeric" value={el.number ?? ""} onChange={(e) => {
                    const n = parseInt(e.target.value.replace(/\D/g, "").slice(0, 2), 10);
                    update(el, { number: Number.isNaN(n) ? undefined : n }, "number");
                  }} />
                </div>
                <div>
                  <label className={label} htmlFor="tr-name">Nom</label>
                  <input id="tr-name" className={input} maxLength={30} value={el.name ?? ""} onChange={(e) => update(el, { name: e.target.value, rosterId: undefined }, "name")} placeholder="Facultatif" />
                </div>
              </div>
            </div>
          </>
        )}
        {el.kind === "arrow" && (
          <div className={card}>
            <span className={label}>Type de flèche</span>
            <Choice options={ARROW_STYLES.map((s) => ({ value: s.id, label: s.label }))} value={el.style} onChange={(style) => update(el, { style })} />
            <span className={label}>Couleur</span>
            <Swatches colors={ANNOTATION_COLORS} value={el.color} onChange={(color) => update(el, { color })} />
            <p className="text-[11px] text-slate-400">Déplacez les poignées vertes pour les extrémités, la poignée centrale pour courber la flèche.</p>
          </div>
        )}
        {el.kind === "zone" && (
          <div className={card}>
            <label className={label} htmlFor="tr-zone-label">Libellé</label>
            <input id="tr-zone-label" className={input} maxLength={40} value={el.label ?? ""} onChange={(e) => update(el, { label: e.target.value }, "label")} placeholder="Ex : zone de finition" />
            <span className={label}>Couleur</span>
            <Swatches colors={ANNOTATION_COLORS} value={el.color} onChange={(color) => update(el, { color })} />
            {el.shape === "rect" && (
              <div className="grid grid-cols-2 gap-2">
                <div><span className={label}>Longueur</span><Stepper value={el.width} min={0.5} max={120} step={0.5} suffix="m" onChange={(width) => update(el, { width })} /></div>
                <div><span className={label}>Largeur</span><Stepper value={el.height} min={0.5} max={120} step={0.5} suffix="m" onChange={(height) => update(el, { height })} /></div>
              </div>
            )}
            {el.shape === "circle" && (
              <div><span className={label}>Diamètre</span><Stepper value={el.width} min={0.5} max={120} step={0.5} suffix="m" onChange={(width) => update(el, { width, height: width })} /></div>
            )}
            {el.shape === "polygon" && <p className="text-[11px] text-slate-400">Déplacez les sommets avec les poignées vertes.</p>}
          </div>
        )}
        {el.kind === "text" && (
          <div className={card}>
            <label className={label} htmlFor="tr-text">Texte</label>
            <input id="tr-text" className={input} maxLength={60} value={el.text} onChange={(e) => update(el, { text: e.target.value }, "text")} />
            <span className={label}>Taille</span>
            <Stepper value={el.size} min={0.6} max={6} step={0.2} suffix="m" onChange={(size) => update(el, { size })} />
            <span className={label}>Couleur</span>
            <Swatches colors={ANNOTATION_COLORS} value={el.color} onChange={(color) => update(el, { color })} />
          </div>
        )}
        {el.kind === "step" && (
          <div className={card}>
            <span className={label}>Numéro d&apos;étape</span>
            <Stepper value={el.value} min={1} max={30} onChange={(value) => update(el, { value })} />
            <span className={label}>Couleur</span>
            <Swatches colors={ANNOTATION_COLORS} value={el.color} onChange={(color) => update(el, { color })} />
          </div>
        )}

        {rotationEditable && (
          <div className={card}>
            <span className={label}>Rotation : {el.rotation}°</span>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Pivoter de 15° à gauche" onClick={() => update(el, { rotation: (el.rotation + 345) % 360 })} className={`${bigBtn} ${idleBtn} w-11`}><RotateCcw className="w-4 h-4" /></button>
              <input type="range" min={0} max={359} value={el.rotation} onChange={(e) => update(el, { rotation: Number(e.target.value) }, "rotation")} className="flex-1 accent-[#00E599] h-11" aria-label="Rotation" />
              <button type="button" aria-label="Pivoter de 15° à droite" onClick={() => update(el, { rotation: (el.rotation + 15) % 360 })} className={`${bigBtn} ${idleBtn} w-11`}><RotateCw className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </fieldset>
    </div>
  );
}

function PitchSettings({ state, dispatch }: { state: EditorState; dispatch: React.Dispatch<EditorAction> }) {
  const { pitch } = state.diagram;
  const counts = useMemo(() => {
    const c: Record<LayerId, number> = { equipment: 0, players: 0, annotations: 0 };
    state.diagram.elements.forEach((e) => { c[LAYER_OF[e.kind]] += 1; });
    return c;
  }, [state.diagram.elements]);

  const setFormat = (format: PitchFormatId) => dispatch({ type: "setPitch", pitch: makePitchConfig(format, format === "free" ? { length: pitch.length, width: pitch.width } : undefined) });
  const setFree = (dims: { length: number; width: number }) => dispatch({ type: "setPitch", pitch: makePitchConfig("free", dims) });

  return (
    <div className="space-y-3">
      <div className={card}>
        <span className={label}>Terrain</span>
        <div className="grid grid-cols-2 gap-1.5">
          {PITCH_FORMATS.map((f) => (
            <button key={f.id} type="button" aria-pressed={pitch.format === f.id} onClick={() => setFormat(f.id)} className={`${bigBtn} h-14 flex-col gap-0 px-2 ${pitch.format === f.id ? activeBtn : idleBtn}`}>
              <span>{f.label}</span>
              <span className="text-[10px] font-semibold opacity-70">{f.hint}</span>
            </button>
          ))}
        </div>
        {pitch.format === "free" && (
          <div className="grid grid-cols-1 gap-2">
            <div><span className={label}>Longueur</span><Stepper value={pitch.length} min={FREE_PITCH_LIMITS.min} max={FREE_PITCH_LIMITS.max} step={1} suffix="m" onChange={(length) => setFree({ length, width: pitch.width })} /></div>
            <div><span className={label}>Largeur</span><Stepper value={pitch.width} min={FREE_PITCH_LIMITS.min} max={FREE_PITCH_LIMITS.max} step={1} suffix="m" onChange={(width) => setFree({ length: pitch.length, width })} /></div>
          </div>
        )}
      </div>

      <div className={card}>
        <span className={label}>Grille et magnétisme</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" aria-pressed={state.grid.visible} onClick={() => dispatch({ type: "setGrid", grid: { visible: !state.grid.visible } })} className={`${bigBtn} ${state.grid.visible ? activeBtn : idleBtn}`}>Grille</button>
          <button type="button" aria-pressed={state.grid.snap} onClick={() => dispatch({ type: "setGrid", grid: { snap: !state.grid.snap } })} className={`${bigBtn} ${state.grid.snap ? activeBtn : idleBtn}`}>Magnétisme</button>
        </div>
        <span className={label}>Pas de la grille</span>
        <Choice cols={3} options={[0.5, 1, 2, 5, 10].map((v) => ({ value: v, label: `${String(v).replace(".", ",")} m` }))} value={state.grid.size} onChange={(size) => dispatch({ type: "setGrid", grid: { size } })} />
      </div>

      <div className={card}>
        <span className={label}>Calques</span>
        {(Object.keys(LAYER_LABELS) as LayerId[]).map((layer) => {
          const hidden = state.hiddenLayers.includes(layer);
          return (
            <button key={layer} type="button" aria-pressed={!hidden} onClick={() => dispatch({ type: "toggleLayer", layer })} className={`${bigBtn} w-full justify-between px-3 ${hidden ? idleBtn : activeBtn}`}>
              <span className="flex items-center gap-2">{hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{LAYER_LABELS[layer]}</span>
              <span className="text-[11px] opacity-70">{counts[layer]}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-[#1a2130] p-3 text-[11px] leading-relaxed text-slate-400 space-y-1">
        <p><b className="text-slate-200">Poser :</b> appuyez sur un élément de la palette puis sur le terrain (ou glissez-le).</p>
        <p><b className="text-slate-200">Tracer :</b> flèches et zones se dessinent en glissant ; le polygone, point par point.</p>
        <p><b className="text-slate-200">Vue :</b> pincez pour zoomer ; glissez dans le vide pour déplacer le terrain.</p>
      </div>
    </div>
  );
}
