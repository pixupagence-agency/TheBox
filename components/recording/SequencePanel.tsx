"use client";

// Module Recording : panneau de la séquence ouverte (titre, tags, notes, arrêts sur image, export).
import React, { useState } from "react";
import { Camera, ChevronDown, ChevronsLeft, Clapperboard, Crosshair, Download, ImageDown, Pause, Plus, Scissors, Snowflake, Square, Tag, Trash2, Users, Wand2 } from "lucide-react";
import { formatTime } from "@/lib/recording/sources";
import { DRAW_COLORS, GAME_PHASES, SET_PIECES } from "@/lib/recording/tags";
import { useRecordingTheme } from "@/lib/recording/theme";
import { TRACK_SIZE_MAX, TRACK_SIZE_MIN, type TrackDirection } from "@/lib/recording/tracker";
import type { Freeze, Sequence, SequenceTags, Track } from "@/lib/recording/types";
import type { RosterPlayer } from "@/lib/training/storage";

interface Props {
  sequence: Sequence;
  roster: { teamName: string; players: RosterPlayer[] };
  activeFreezeId: string | null;
  onChange: (patch: Partial<Sequence>) => void;
  onTags: (tags: SequenceTags) => void;
  onGoToFreeze: (f: Freeze) => void;
  onUpdateFreeze: (id: string, patch: Partial<Freeze>) => void;
  onDeleteFreeze: (id: string) => void;
  onExportImage: () => void;
  canExportFrame: boolean;
  onExtractClip: () => void;
  onCaptureImage: () => void;
  /** Export du passage (Entrée → Sortie, ou vidéo entière) en fichier vidéo */
  onExportVideo: () => void;
  exportFormat: "mp4" | "webm" | null;
  tracks: Track[];
  selectedTrackId: string | null;
  tracking: { trackId: string; t: number } | null;
  canAutoTrack: boolean;
  onSelectTrack: (id: string) => void;
  onNewTrack: () => void;
  onUpdateTrack: (id: string, patch: Partial<Track>) => void;
  onDeleteTrack: (id: string) => void;
  onAutoTrack: (id: string, direction: TrackDirection) => void;
  onCancelTracking: () => void;
}

const labelOf = (pl: RosterPlayer) => `${pl.number ? `${pl.number} · ` : ""}${pl.name}`;

/** Taille du marqueur par paliers de 20 % (fin pour les plans larges, où les joueurs sont petits) */
const resize = (size: number, factor: number) => Math.round(Math.min(TRACK_SIZE_MAX, Math.max(TRACK_SIZE_MIN, size * factor)) * 10000) / 10000;

/** Sections repliées, mémorisées sur l'appareil (comme les sections du tableau tactique) */
const COLLAPSED_KEY = "thebox_recording_collapsed_sections";

function readCollapsed(id: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]") as string[]).includes(id);
  } catch {
    return false;
  }
}

function storeCollapsed(id: string, collapsed: boolean) {
  try {
    const list = (JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]") as string[]).filter((x) => x !== id);
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed ? [...list, id] : list));
  } catch {
    /* stockage indisponible : l'état vaut pour la session */
  }
}

export function Section({ id, icon: Icon, title, children }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  const th = useRecordingTheme();
  const [collapsed, setCollapsed] = useState(() => readCollapsed(id));
  const toggle = () => setCollapsed((v) => { storeCollapsed(id, !v); return !v; });
  const label = `${collapsed ? "Déplier" : "Réduire"} la section ${title.split(" (")[0]}`;
  return (
    <section className={`px-3 py-2.5 border-b ${th.sectionBorder}`}>
      <div className={`flex items-center gap-1.5 ${collapsed ? "" : "mb-2.5"}`}>
        <button type="button" onClick={toggle} className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer select-none" aria-expanded={!collapsed} title={label}>
          <Icon className={`w-4 h-4 shrink-0 ${th.sectionIcon}`} aria-hidden="true" />
          <span className={`text-xs font-black uppercase tracking-wider truncate ${th.sectionTitle}`}>{title}</span>
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={label}
          title={label}
          className={`h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer transition ${th.idleBtn}`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
        </button>
      </div>
      {!collapsed && children}
    </section>
  );
}

export default function SequencePanel(p: Props) {
  const th = useRecordingTheme();
  const { sequence: seq } = p;
  const [customDraft, setCustomDraft] = useState("");
  const chip = (on: boolean) => `h-9 px-2.5 rounded-lg border text-[13px] font-bold cursor-pointer transition ${on ? th.activeBtn : th.idleBtn}`;

  const togglePlayer = (name: string) => {
    const players = seq.tags.players.includes(name) ? seq.tags.players.filter((n) => n !== name) : [...seq.tags.players, name];
    p.onTags({ ...seq.tags, players });
  };
  const addCustom = () => {
    const v = customDraft.trim().slice(0, 30);
    if (v && !seq.tags.custom.includes(v)) p.onTags({ ...seq.tags, custom: [...seq.tags.custom, v] });
    setCustomDraft("");
  };

  return (
    <div>
      <Section id="sequence" icon={Clapperboard} title="Séquence">
        <label className={th.label} htmlFor="rec-title">Titre</label>
        <input id="rec-title" className={th.input} maxLength={80} value={seq.title} onChange={(e) => p.onChange({ title: e.target.value })} />
        <label className={`${th.label} mt-3`} htmlFor="rec-notes">Notes / causerie</label>
        <textarea
          id="rec-notes"
          rows={3}
          maxLength={1000}
          value={seq.notes || ""}
          onChange={(e) => p.onChange({ notes: e.target.value })}
          placeholder="Ce qu'il faut retenir de l'action…"
          className={`${th.input} h-auto py-2.5 text-sm leading-relaxed resize-y`}
        />
        {seq.parentTitle && (
          <p className={`mt-2 text-[12px] font-semibold ${th.accentText}`}>Extrait de « {seq.parentTitle} »</p>
        )}
        <p className={`mt-2 text-[12px] font-semibold ${th.faint}`}>
          Clip : {seq.inPoint !== undefined || seq.outPoint !== undefined
            ? `${formatTime(seq.inPoint ?? 0, true, seq.fps)} → ${seq.outPoint !== undefined ? formatTime(seq.outPoint, true, seq.fps) : "fin"}`
            : "vidéo entière (boutons Entrée / Sortie pour découper)"}
        </p>
      </Section>

      <Section id="tags" icon={Tag} title="Tags">
        <span className={th.label}>Phase de jeu</span>
        <div className="flex flex-wrap gap-1.5">
          {GAME_PHASES.map((ph) => (
            <button key={ph} type="button" aria-pressed={seq.tags.phase === ph} onClick={() => p.onTags({ ...seq.tags, phase: seq.tags.phase === ph ? undefined : ph })} className={chip(seq.tags.phase === ph)}>{ph}</button>
          ))}
        </div>
        <span className={`${th.label} mt-3`}>Coup de pied arrêté</span>
        <div className="flex flex-wrap gap-1.5">
          {SET_PIECES.map((sp) => (
            <button key={sp} type="button" aria-pressed={seq.tags.setPiece === sp} onClick={() => p.onTags({ ...seq.tags, setPiece: seq.tags.setPiece === sp ? undefined : sp })} className={chip(seq.tags.setPiece === sp)}>{sp}</button>
          ))}
        </div>
        <span className={`${th.label} mt-3`}>Autres tags</span>
        <div className="flex gap-1.5">
          <input
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } e.stopPropagation(); }}
            placeholder="Ex : U17, à revoir…"
            aria-label="Nouveau tag"
            className={`${th.input} h-10 text-sm`}
          />
          <button type="button" onClick={addCustom} className={`h-10 px-3 rounded-xl border text-sm font-black cursor-pointer ${th.idleBtn}`}>Ajouter</button>
        </div>
        {seq.tags.custom.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {seq.tags.custom.map((c) => (
              <button key={c} type="button" onClick={() => p.onTags({ ...seq.tags, custom: seq.tags.custom.filter((x) => x !== c) })} className={`h-8 px-2 rounded-lg border text-[12px] font-bold cursor-pointer ${th.accentChip}`} title="Retirer ce tag">
                {c} ✕
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section id="players" icon={Users} title={`Joueurs${p.roster.teamName ? ` · ${p.roster.teamName}` : ""}`}>
        {p.roster.players.length === 0 ? (
          <p className={`text-[13px] ${th.sub}`}>L&apos;effectif de l&apos;équipe active du tableau tactique apparaîtra ici.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {p.roster.players.map((pl) => (
              <button key={pl.id} type="button" aria-pressed={seq.tags.players.includes(pl.name)} onClick={() => togglePlayer(pl.name)} className={chip(seq.tags.players.includes(pl.name))}>
                {pl.number ? `${pl.number} · ` : ""}{pl.name}
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section id="freezes" icon={Snowflake} title={`Arrêts sur image (${seq.freezes.length})`}>
        {seq.freezes.length === 0 ? (
          <p className={`text-[13px] leading-relaxed ${th.sub}`}>
            Choisissez un outil de dessin puis tracez sur l&apos;image : la vidéo se fige et un arrêt sur image est créé à cet instant.
          </p>
        ) : (
          <div className="space-y-1.5">
            {[...seq.freezes].sort((a, b) => a.time - b.time).map((f) => (
              <div key={f.id} className={`flex items-center gap-1.5 rounded-xl border p-1.5 ${f.id === p.activeFreezeId ? th.activeBtn : th.idleBtn}`}>
                <button type="button" onClick={() => p.onGoToFreeze(f)} className="flex-1 min-w-0 text-left px-1.5 cursor-pointer" title="Aller à cet instant">
                  <span className="block text-sm font-black tabular-nums">{formatTime(f.time, true, seq.fps)}</span>
                  <span className="block text-[11px] font-semibold opacity-75">{f.shapes.length} consigne{f.shapes.length > 1 ? "s" : ""}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={f.autoPause}
                  onClick={() => p.onUpdateFreeze(f.id, { autoPause: !f.autoPause })}
                  title={f.autoPause ? "La lecture s'arrête sur cette image" : "La lecture ne s'arrête pas sur cette image"}
                  className={`h-9 px-2 rounded-lg border text-[11px] font-black flex items-center gap-1 cursor-pointer ${f.autoPause ? th.activeBtn : th.idleBtn}`}
                >
                  <Pause className="w-3.5 h-3.5" />{f.autoPause ? "Pause auto" : "Sans pause"}
                </button>
                <button type="button" onClick={() => p.onDeleteFreeze(f.id)} aria-label="Supprimer cet arrêt sur image" className={`h-9 w-9 rounded-lg border flex items-center justify-center cursor-pointer ${th.dangerBtn}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="tracks" icon={Crosshair} title={`Suivi de joueurs (${p.tracks.length})`}>
        <button type="button" onClick={p.onNewTrack} disabled={Boolean(p.tracking)} className={`w-full h-11 rounded-xl border text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 ${th.idleBtn}`}>
          <Plus className="w-4 h-4" />Suivre un joueur
        </button>
        <p className={`mt-2 text-[12px] leading-relaxed ${th.faint}`}>
          {p.canAutoTrack
            ? "Cliquez sur les pieds du joueur, puis « Suivi auto » : son marqueur le suit image par image, même masqué un court instant. S'il décroche, replacez-le d'un clic et relancez ; « Arrière » le suit vers le début de l'action."
            : "Placez le joueur à plusieurs instants (clic sur ses pieds) : son déplacement est calculé entre ces positions. Le suivi automatique demande un fichier vidéo importé."}
        </p>
        {p.tracks.length > 0 && (
          <div className="mt-2.5 space-y-2">
            {p.tracks.map((tr) => {
              const isSel = tr.id === p.selectedTrackId;
              const isRunning = p.tracking?.trackId === tr.id;
              const span = tr.keys.length ? `${formatTime(tr.keys[0].t, true, seq.fps)} → ${formatTime(tr.keys[tr.keys.length - 1].t, true, seq.fps)}` : "";
              return (
                <div key={tr.id} className={`rounded-xl border p-2.5 space-y-2 ${isSel ? th.activeBtn : th.idleBtn}`}>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => p.onSelectTrack(tr.id)} className="w-6 h-6 rounded-full border-2 border-white/70 shrink-0 cursor-pointer" style={{ background: tr.color }} aria-label="Sélectionner ce joueur suivi" title="Sélectionner (pour corriger sa position)" />
                    <select
                      value={tr.label || ""}
                      onChange={(e) => p.onUpdateTrack(tr.id, { label: e.target.value || undefined })}
                      className={`flex-1 min-w-0 h-9 rounded-lg border px-2 text-[13px] font-bold cursor-pointer ${th.idleBtn} ${th.option}`}
                      aria-label="Nom du joueur suivi"
                    >
                      <option value="">Sans nom</option>
                      {tr.label && !p.roster.players.some((pl) => labelOf(pl) === tr.label) && <option value={tr.label}>{tr.label}</option>}
                      {p.roster.players.map((pl) => <option key={pl.id} value={labelOf(pl)}>{labelOf(pl)}</option>)}
                    </select>
                    <button type="button" onClick={() => p.onDeleteTrack(tr.id)} disabled={isRunning} aria-label="Supprimer ce joueur suivi" className={`h-9 w-9 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer disabled:opacity-40 ${th.dangerBtn}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold opacity-75">{tr.keys.length} position{tr.keys.length > 1 ? "s" : ""} · {span}</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {DRAW_COLORS.map((c) => (
                      <button key={c.id} type="button" onClick={() => p.onUpdateTrack(tr.id, { color: c.hex })} aria-label={`Couleur ${c.label.toLowerCase()}`} className={`w-6 h-6 rounded-full border-2 cursor-pointer ${tr.color === c.hex ? th.swatchOn : th.swatchIdle}`} style={{ background: c.hex }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button type="button" aria-pressed={tr.style === "ring"} onClick={() => p.onUpdateTrack(tr.id, { style: "ring" })} className={`h-8 rounded-lg border text-[12px] font-bold cursor-pointer ${tr.style === "ring" ? th.activeBtn : th.idleBtn}`}>Anneau</button>
                    <button type="button" aria-pressed={tr.style === "spotlight"} onClick={() => p.onUpdateTrack(tr.id, { style: "spotlight" })} className={`h-8 rounded-lg border text-[12px] font-bold cursor-pointer ${tr.style === "spotlight" ? th.activeBtn : th.idleBtn}`}>Spotlight</button>
                    <button type="button" aria-pressed={tr.trail} onClick={() => p.onUpdateTrack(tr.id, { trail: !tr.trail })} className={`h-8 rounded-lg border text-[12px] font-bold cursor-pointer ${tr.trail ? th.activeBtn : th.idleBtn}`}>Traînée</button>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={tr.size <= TRACK_SIZE_MIN} onClick={() => p.onUpdateTrack(tr.id, { size: resize(tr.size, 1 / 1.2) })} className={`h-8 flex-1 rounded-lg border text-[13px] font-black cursor-pointer disabled:opacity-40 ${th.idleBtn}`} aria-label="Marqueur plus petit">−</button>
                      <button type="button" disabled={tr.size >= TRACK_SIZE_MAX} onClick={() => p.onUpdateTrack(tr.id, { size: resize(tr.size, 1.2) })} className={`h-8 flex-1 rounded-lg border text-[13px] font-black cursor-pointer disabled:opacity-40 ${th.idleBtn}`} aria-label="Marqueur plus grand">+</button>
                    </div>
                  </div>
                  {isRunning ? (
                    <button type="button" onClick={p.onCancelTracking} className={`w-full h-10 rounded-lg border text-[13px] font-black flex items-center justify-center gap-1.5 cursor-pointer ${th.dangerBtn}`}>
                      <Square className="w-4 h-4" />Arrêter ({formatTime(p.tracking!.t, true, seq.fps)})
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={!p.canAutoTrack || Boolean(p.tracking)}
                        onClick={() => p.onAutoTrack(tr.id, -1)}
                        title={p.canAutoTrack ? "Suivre le joueur vers le début de la vidéo, à partir de l'instant affiché" : "Disponible avec un fichier vidéo importé"}
                        aria-label="Suivi automatique vers l'arrière"
                        className={`h-10 px-2.5 rounded-lg border text-[13px] font-black flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${th.idleBtn}`}
                      >
                        <ChevronsLeft className="w-4 h-4" />Arrière
                      </button>
                      <button
                        type="button"
                        disabled={!p.canAutoTrack || Boolean(p.tracking)}
                        onClick={() => p.onAutoTrack(tr.id, 1)}
                        title={p.canAutoTrack ? "Suivre le joueur automatiquement à partir de l'instant affiché" : "Disponible avec un fichier vidéo importé"}
                        className={`flex-1 h-10 rounded-lg border text-[13px] font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${th.primaryBtn}`}
                      >
                        <Wand2 className="w-4 h-4" />Suivi auto depuis cet instant
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section id="export" icon={ImageDown} title="Extraits et export">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={seq.inPoint === undefined && seq.outPoint === undefined}
            onClick={p.onExtractClip}
            title="Ranger le passage Entrée → Sortie dans la bibliothèque (E)"
            className={`h-12 rounded-xl border text-[13px] font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${th.idleBtn}`}
          >
            <Scissors className="w-4 h-4" />Extrait vidéo
          </button>
          <button
            type="button"
            disabled={!p.canExportFrame}
            onClick={p.onCaptureImage}
            title="Ranger l'image affichée (avec ses consignes) dans la bibliothèque"
            className={`h-12 rounded-xl border text-[13px] font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${th.idleBtn}`}
          >
            <Camera className="w-4 h-4" />Image
          </button>
        </div>
        <p className={`mt-2 mb-3 text-[12px] leading-relaxed ${th.faint}`}>
          Placez l&apos;Entrée (I) et la Sortie (O) pour extraire un passage : il rejoint la bibliothèque avec ses consignes,
          sans copier la vidéo. L&apos;image rangée reprend les consignes et joueurs suivis affichés.
        </p>
        <button
          type="button"
          disabled={!p.canExportFrame || !p.exportFormat}
          onClick={p.onExportVideo}
          title={!p.canExportFrame ? "YouTube et Vimeo ne permettent pas d'exporter la vidéo : importez le fichier" : !p.exportFormat ? "Ce navigateur ne sait pas enregistrer de vidéo" : "Enregistrer le passage dans un fichier vidéo, avec joueurs suivis et arrêts sur image"}
          className={`w-full h-12 mb-1.5 rounded-xl border text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${th.primaryBtn}`}
        >
          <Download className="w-5 h-5" />{seq.inPoint !== undefined || seq.outPoint !== undefined ? "Vidéo du passage" : "Vidéo entière"} ({(p.exportFormat || "mp4").toUpperCase()})
        </button>
        <button type="button" onClick={p.onExportImage} className={`w-full h-12 rounded-xl border text-sm font-black flex items-center justify-center gap-2 cursor-pointer ${th.primaryBtn}`}>
          <ImageDown className="w-5 h-5" />Télécharger l&apos;image annotée (PNG)
        </button>
        <p className={`mt-2 text-[12px] leading-relaxed ${th.faint}`}>
          {p.canExportFrame
            ? "Exporte l'image affichée avec ses consignes, prête à partager avec le staff et les joueurs."
            : "YouTube et Vimeo ne permettent pas de capturer l'image : seules les consignes sont exportées. Importez le fichier vidéo pour un export complet."}
        </p>
      </Section>
    </div>
  );
}
