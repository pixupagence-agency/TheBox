"use client";

// Module Training : éditeur d'ateliers (phase 1 — vue de dessus 2D).
// État dédié (useReducer) : aucune donnée partagée avec le tableau tactique, à part la lecture de l'effectif.
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, BoxSelect, ClipboardPaste, Copy, Dumbbell, FilePlus2, Grid3x3, Hand, Magnet, Maximize, Moon, MousePointer2, Redo2, Rows3,
  SlidersHorizontal, Sun, Undo2, X, ZoomIn, ZoomOut,
} from "lucide-react";
import LogoIcon from "@/components/LogoIcon";
import TrainingCanvas, { type CanvasMode, type TrainingCanvasHandle } from "./TrainingCanvas";
import Palette from "./Palette";
import PropertiesPanel from "./PropertiesPanel";
import SeriesDialog, { type SeriesRequest } from "./SeriesDialog";
import { confirmAction } from "@/components/ConfirmDialog";
import { createElement, type PaletteItem } from "@/lib/training/catalog";
import { editorReducer, initialEditorState, round2, seriesPositions, snapValue } from "@/lib/training/editorState";
import { pitchFormatOption } from "@/lib/training/pitch";
import { loadDraft, readActiveRoster, saveDraft } from "@/lib/training/storage";
import type { TrainingElement } from "@/lib/training/types";
import { TrainingThemeContext, getTrainingTheme, readThemePreference, storeThemePreference } from "@/lib/training/theme";

// Boutons de la barre d'outils : même forme que ceux du tableau tactique, en plus grand (usage tactile au bord du terrain)
const toolBtn = "h-11 min-w-11 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-black transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed";

export default function TrainingEditor() {
  const [state, dispatch] = useReducer(editorReducer, undefined, () => initialEditorState(loadDraft()));
  const [mode, setMode] = useState<CanvasMode>("select");
  const [multiSelect, setMultiSelect] = useState(false);
  const [armed, setArmed] = useState<PaletteItem | null>(null);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState(0);
  // Repères tactiques sur le terrain, comme sur le tableau tactique : 5 couloirs, 3 zones (défense, milieu, attaque)
  const [showZones, setShowZones] = useState(false);
  const [showThirds, setShowThirds] = useState(false);
  const [polygonCommand, setPolygonCommand] = useState<{ id: number; action: "finish" | "cancel" } | null>(null);
  const canvasRef = useRef<TrainingCanvasHandle>(null);
  const roster = useMemo(() => readActiveRoster(), []);
  // Même thème (sombre « cockpit » / clair) que le tableau tactique, accent bleu
  const [isLight, setIsLight] = useState<boolean>(() => readThemePreference());
  const th = getTrainingTheme(isLight);
  const toolIdle = th.toolIdle;
  const toolOn = th.toolOn;
  const toggleTheme = () => setIsLight((v) => { storeThemePreference(!v); return !v; });

  // Brouillon enregistré sur l'appareil (le schéma reste disponible hors ligne au bord du terrain)
  useEffect(() => {
    const t = setTimeout(() => saveDraft(state.diagram), 400);
    return () => clearTimeout(t);
  }, [state.diagram]);

  // Une sélection ouvre le panneau des propriétés sur petit écran
  useEffect(() => {
    if (state.selectedIds.length > 0 && !armed) setPanelOpen(true);
  }, [state.selectedIds, armed]);

  const placeItem = useCallback((item: PaletteItem, x: number, y: number) => {
    if (!item.template) return;
    let template = item.template;
    const els = state.diagram.elements;
    if (template.kind === "step") {
      const max = els.reduce((m, e) => (e.kind === "step" ? Math.max(m, e.value) : m), 0);
      template = { ...template, value: max + 1 };
    } else if (template.kind === "player" && template.role === "player") {
      const color = template.color;
      const used = els.filter((e): e is Extract<TrainingElement, { kind: "player" }> => e.kind === "player" && e.color === color).map((e) => e.number || 0);
      template = { ...template, number: (used.length ? Math.max(...used) : 0) + 1 };
    }
    const el = createElement(template, round2(x), round2(y));
    dispatch({ type: "add", elements: [el], select: !armed });
  }, [state.diagram.elements, armed]);

  const onDrop = useCallback((item: PaletteItem, clientX: number, clientY: number) => {
    const w = canvasRef.current?.clientToWorld(clientX, clientY);
    if (!w) return;
    if (item.drawTool) { setArmed(item); return; }
    placeItem(item, snapValue(w.x, state.grid), snapValue(w.y, state.grid));
  }, [placeItem, state.grid]);

  const onArm = useCallback((item: PaletteItem | null) => {
    setArmed(item);
    if (item) {
      setMode("select");
      dispatch({ type: "select", ids: [] });
    }
  }, []);

  const applySeries = (r: SeriesRequest) => {
    setSeriesOpen(false);
    const c = canvasRef.current?.viewCenter() || { x: state.diagram.pitch.length / 2, y: state.diagram.pitch.width / 2 };
    const positions = seriesPositions(r.shape, r.count, r.spacing, c.x, c.y, r.angle);
    if (!r.item.template) return;
    const template = r.item.template;
    const els = positions.map((p, i) => {
      const t = template.kind === "player" && template.role === "player" ? { ...template, number: i + 1 } : template;
      return createElement(t, round2(p.x), round2(p.y), template.kind === "ladder" ? r.angle : 0);
    });
    setArmed(null);
    dispatch({ type: "add", elements: els, select: true });
  };

  const onPolygonProgress = useCallback((n: number) => setPolygonPoints(n), []);

  const newDiagram = async () => {
    if (state.diagram.elements.length === 0) return;
    const ok = await confirmAction({
      title: "Nouveau schéma ?",
      message: "Tous les éléments du terrain seront effacés. Vous pourrez annuler avec « Annuler » (Ctrl+Z).",
      confirmLabel: "Tout effacer",
      tone: "warning",
    });
    if (ok) dispatch({ type: "clear" });
  };

  // Raccourcis clavier (ordinateur / tablette avec clavier)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z" && !e.shiftKey) { e.preventDefault(); dispatch({ type: "undo" }); }
      else if ((mod && key === "y") || (mod && key === "z" && e.shiftKey)) { e.preventDefault(); dispatch({ type: "redo" }); }
      else if (mod && key === "c") { dispatch({ type: "copy" }); }
      else if (mod && key === "v") { e.preventDefault(); dispatch({ type: "paste" }); }
      else if (mod && key === "d") { e.preventDefault(); dispatch({ type: "duplicate" }); }
      else if (mod && key === "a") { e.preventDefault(); dispatch({ type: "select", ids: state.diagram.elements.map((x) => x.id) }); }
      else if (key === "delete" || key === "backspace") { if (state.selectedIds.length) { e.preventDefault(); dispatch({ type: "delete" }); } }
      else if (key === "escape") {
        if (polygonPoints > 0) setPolygonCommand({ id: Date.now(), action: "cancel" });
        else if (armed) setArmed(null);
        else dispatch({ type: "select", ids: [] });
      } else if (key === "enter" && polygonPoints >= 3) {
        setPolygonCommand({ id: Date.now(), action: "finish" });
      } else if (key.startsWith("arrow") && state.selectedIds.length) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.1;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        dispatch({ type: "moveBy", ids: state.selectedIds, dx, dy });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.diagram.elements, state.selectedIds, armed, polygonPoints]);

  const pitchLabel = pitchFormatOption(state.diagram.pitch.format).label;
  const isFree = state.diagram.pitch.format === "free";
  const separator = <span aria-hidden="true" className={`h-6 w-px mx-0.5 shrink-0 ${th.separator}`} />;

  return (
    <TrainingThemeContext.Provider value={th}>
    <div id="training-command-center" className={`fixed inset-0 flex flex-col transition-colors duration-300 ${th.page}`} style={{ fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif' }}>
      {/* En-tête : identique au tableau tactique (logo the box), signature « zone d'entraînement » en bleu */}
      <header className={`h-16 shrink-0 px-3 sm:px-6 border-b flex items-center justify-between gap-3 relative z-40 ${th.header}`}>
        <div className="flex items-center gap-3 min-w-0">
          <LogoIcon className={`w-10 h-10 shrink-0 ${th.logo}`} />
          <div className="text-left select-none min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-black tracking-wider leading-none lowercase whitespace-nowrap ${th.brand}`}>the box</h1>
              <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${th.accentChip}`}>
                <Dumbbell className="w-3 h-3" aria-hidden="true" />Training
              </span>
            </div>
            <p className={`whitespace-nowrap text-[8.5px] font-black uppercase tracking-[0.22em] leading-none mt-1 ${th.accentText}`}>zone d&apos;entraînement</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className={`hidden md:inline text-sm font-bold whitespace-nowrap ${th.sub}`}>{pitchLabel}{isFree ? ` · ${state.diagram.pitch.length} × ${state.diagram.pitch.width} m` : ""}</span>
          <button type="button" onClick={toggleTheme} className={`${toolBtn} ${toolIdle}`} title={isLight ? "Passer au thème sombre" : "Passer au thème clair"} aria-label={isLight ? "Thème sombre" : "Thème clair"}>
            {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <Link href="/" className={`${toolBtn} ${toolIdle}`} title="Retour au tableau tactique" aria-label="Retour au tableau tactique">
            <ArrowLeft className="w-5 h-5" /><span className="hidden lg:inline">Tableau tactique</span>
          </Link>
          <button type="button" className={`${toolBtn} ${panelOpen ? toolOn : toolIdle} lg:hidden`} onClick={() => setPanelOpen((v) => !v)} title="Propriétés et terrain" aria-label="Propriétés et terrain" aria-pressed={panelOpen}><SlidersHorizontal className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Barre d'outils : groupes d'outils comme sur le tableau tactique */}
      <div className={`shrink-0 flex items-center gap-1.5 px-2 sm:px-3 py-2 border-b overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${th.toolbar}`}>
        <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => dispatch({ type: "undo" })} disabled={state.past.length === 0} title="Annuler (Ctrl+Z)" aria-label="Annuler"><Undo2 className="w-5 h-5" /></button>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => dispatch({ type: "redo" })} disabled={state.future.length === 0} title="Rétablir (Ctrl+Y)" aria-label="Rétablir"><Redo2 className="w-5 h-5" /></button>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => dispatch({ type: "copy" })} disabled={state.selectedIds.length === 0} title="Copier la sélection (Ctrl+C)" aria-label="Copier"><Copy className="w-5 h-5" /></button>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => dispatch({ type: "paste" })} disabled={state.clipboard.length === 0} title="Coller (Ctrl+V)" aria-label="Coller"><ClipboardPaste className="w-5 h-5" /></button>
        </div>
        {separator}
        <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
          <button type="button" className={`${toolBtn} ${mode === "select" && !armed ? toolOn : toolIdle}`} onClick={() => { setArmed(null); setMode("select"); }} title="Sélectionner et déplacer" aria-label="Outil sélection" aria-pressed={mode === "select" && !armed}><MousePointer2 className="w-5 h-5" /></button>
          <button type="button" className={`${toolBtn} ${mode === "pan" && !armed ? toolOn : toolIdle}`} onClick={() => { setArmed(null); setMode("pan"); }} title="Déplacer la vue" aria-label="Outil déplacement de la vue" aria-pressed={mode === "pan" && !armed}><Hand className="w-5 h-5" /></button>
          <button type="button" className={`${toolBtn} ${multiSelect ? toolOn : toolIdle}`} onClick={() => setMultiSelect((v) => !v)} title="Sélection multiple : chaque appui ajoute ou retire un élément ; glisser dans le vide trace un cadre" aria-label="Sélection multiple" aria-pressed={multiSelect}><BoxSelect className="w-5 h-5" /><span className="hidden sm:inline">Multi</span></button>
        </div>
        {separator}
        <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => setSeriesOpen(true)} title="Poser une série d'éléments" aria-label="Poser une série"><Rows3 className="w-5 h-5" /><span className="hidden sm:inline">Série</span></button>
          <button type="button" className={`${toolBtn} ${state.grid.visible ? toolOn : toolIdle}`} onClick={() => dispatch({ type: "setGrid", grid: { visible: !state.grid.visible } })} title="Afficher la grille" aria-label="Grille" aria-pressed={state.grid.visible}><Grid3x3 className="w-5 h-5" /></button>
          <button type="button" className={`${toolBtn} ${showZones ? toolOn : toolIdle}`} onClick={() => setShowZones((v) => !v)} title={showZones ? "Masquer les 5 couloirs du terrain" : "Afficher les 5 couloirs du terrain"} aria-label="5 couloirs du terrain" aria-pressed={showZones}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="8" x2="22" y2="8" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="2" y1="10.5" x2="22" y2="10.5" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="2" y1="13.5" x2="22" y2="13.5" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="2" y1="16" x2="22" y2="16" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>
          </button>
          <button type="button" className={`${toolBtn} ${showThirds ? toolOn : toolIdle}`} onClick={() => setShowThirds((v) => !v)} title={showThirds ? "Masquer les 3 zones (défense, milieu, attaque)" : "Afficher les 3 zones (défense, milieu, attaque)"} aria-label="3 zones du terrain" aria-pressed={showThirds}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="8.7" y1="4" x2="8.7" y2="20" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="15.3" y1="4" x2="15.3" y2="20" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>
          </button>
          <button type="button" className={`${toolBtn} ${state.grid.snap ? toolOn : toolIdle}`} onClick={() => dispatch({ type: "setGrid", grid: { snap: !state.grid.snap } })} title={`Magnétisme (pas de ${String(state.grid.size).replace(".", ",")} m)`} aria-label="Magnétisme" aria-pressed={state.grid.snap}><Magnet className="w-5 h-5" /></button>
        </div>
        {separator}
        <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => canvasRef.current?.zoomBy(1 / 1.25)} title="Dézoomer" aria-label="Dézoomer"><ZoomOut className="w-5 h-5" /></button>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => canvasRef.current?.fit()} title="Voir tout le terrain" aria-label="Voir tout le terrain"><Maximize className="w-5 h-5" /></button>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={() => canvasRef.current?.zoomBy(1.25)} title="Zoomer" aria-label="Zoomer"><ZoomIn className="w-5 h-5" /></button>
        </div>
        <span className="flex-1" />
        <div className={`flex items-center gap-1 shrink-0 ${th.toolGroup}`}>
          <button type="button" className={`${toolBtn} ${toolIdle}`} onClick={newDiagram} disabled={state.diagram.elements.length === 0} title="Nouveau schéma" aria-label="Nouveau schéma"><FilePlus2 className="w-5 h-5" /><span className="hidden md:inline">Nouveau</span></button>
        </div>
      </div>

      <div className="relative flex-1 flex min-h-0">
        {/* Palette : sections repliables comme la colonne du tableau tactique */}
        <aside className={`shrink-0 w-[172px] sm:w-[200px] border-r ${th.sidebar}`}>
          <Palette armedId={armed?.id ?? null} onArm={onArm} onDrop={onDrop} />
        </aside>

        {/* Terrain */}
        <main className={`relative flex-1 min-w-0 ${th.stage}`}>
          <TrainingCanvas
            ref={canvasRef}
            state={state}
            dispatch={dispatch}
            mode={mode}
            multiSelect={multiSelect}
            armed={armed}
            onPlace={placeItem}
            onPolygonProgress={onPolygonProgress}
            polygonCommand={polygonCommand}
            showZones={showZones}
            showThirds={showThirds}
          />

          {armed && (
            <div className={`absolute left-1/2 -translate-x-1/2 top-2 z-10 flex items-center gap-2 rounded-2xl border px-3 py-2 shadow-xl max-w-[calc(100%-16px)] ${th.banner}`}>
              <span className="text-sm font-bold truncate">
                {armed.drawTool?.kind === "arrow" && `${armed.label} : glissez sur le terrain`}
                {armed.drawTool?.kind === "zone" && armed.drawTool.shape !== "polygon" && `${armed.label} : glissez pour tracer`}
                {armed.drawTool?.kind === "zone" && armed.drawTool.shape === "polygon" && (polygonPoints === 0 ? "Polygone : appuyez pour placer les sommets" : `${polygonPoints} sommet${polygonPoints > 1 ? "s" : ""}`)}
                {armed.template && `${armed.label} : appuyez sur le terrain pour poser`}
              </span>
              {armed.drawTool?.kind === "zone" && armed.drawTool.shape === "polygon" && polygonPoints >= 3 && (
                <button type="button" onClick={() => setPolygonCommand({ id: Date.now(), action: "finish" })} className={`h-11 px-4 rounded-xl border text-sm font-black cursor-pointer ${th.primaryBtn}`}>Terminer</button>
              )}
              <button type="button" onClick={() => { setPolygonCommand({ id: Date.now(), action: "cancel" }); setArmed(null); }} aria-label="Arrêter de poser" className={`h-11 w-11 rounded-xl border flex items-center justify-center cursor-pointer ${th.idleBtn}`}><X className="w-5 h-5" /></button>
            </div>
          )}
        </main>

        {/* Propriétés : colonne sur grand écran, tiroir sur tablette et téléphone */}
        <aside
          className={`border-l overflow-y-auto overscroll-contain w-[340px] shrink-0 ${th.sidebar}
            max-lg:absolute max-lg:right-0 max-lg:top-0 max-lg:bottom-0 max-lg:z-40 max-lg:w-[min(380px,90vw)] max-lg:shadow-2xl max-lg:transition-transform
            ${panelOpen ? "max-lg:translate-x-0" : "max-lg:translate-x-full max-lg:pointer-events-none"}`}
          aria-label="Propriétés"
        >
          <div className={`sticky top-0 z-10 px-3 py-2.5 border-b flex items-center gap-1.5 ${th.sidebar}`}>
            <SlidersHorizontal className={`w-4 h-4 shrink-0 ${th.sectionIcon}`} aria-hidden="true" />
            <span className={`flex-1 text-xs font-black uppercase tracking-wider ${th.sectionTitle}`}>
              {state.selectedIds.length === 0 ? "Terrain & affichage" : state.selectedIds.length === 1 ? "Élément sélectionné" : "Sélection"}
            </span>
            <button type="button" onClick={() => setPanelOpen(false)} aria-label="Fermer le panneau" className={`lg:hidden h-9 w-9 rounded-lg flex items-center justify-center cursor-pointer ${toolIdle}`}><X className="w-4 h-4" /></button>
          </div>
          <div className="p-3">
            <PropertiesPanel state={state} dispatch={dispatch} roster={roster} />
          </div>
        </aside>
      </div>

      <SeriesDialog open={seriesOpen} onClose={() => setSeriesOpen(false)} onApply={applySeries} />
    </div>
    </TrainingThemeContext.Provider>
  );
}
