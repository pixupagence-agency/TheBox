"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { getSportBallInfo } from "@/components/tactics/PitchBallGraphic";
import { CurveArrowIcon, PlayerLinkIcon } from "@/components/tactics/icons";
import { getGameFormatOptions } from "@/lib/gameFormats";
import { type Language, type translations } from "@/lib/i18n";
import { type WallTeam } from "@/lib/setPieceWall";
import { type DrawingAction, type Token } from "@/lib/tactics/types";
import { ArrowUpRight, BrickWall, Circle, Columns, Download, Hash, Laptop, MousePointer, Move, Pencil, Scan, Shirt, Smartphone, Sparkles, Tag, Trash2, User, Users, Video, ZoomIn } from "lucide-react";

export interface PitchToolbarProps {
  activeFormat: string;
  activeSport: string;
  activeTool: "select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link";
  aspectRatioMode: "desktop" | "mobile";
  currentLang: Language;
  currentTokens: Token[];
  curveToolTitle: string;
  drawColor: string;
  drawingActions: DrawingAction[];
  drawingTool: "brush" | "arrow-direct" | "arrow-deep" | "arrow-run" | "shape-circle" | "shape-rect" | "shape-line" | "shape-dashed-line" | "curve-arrow" | "curve-arrow-dashed" | "eraser";
  handleClearDrawings: () => void;
  handleOpenExportModal: () => void;
  handleSwitchBoardFormat: (format: string) => Promise<void>;
  handleToggleCurveTool: () => void;
  handleToggleLineTool: () => void;
  isAnimationCreatorOpen: boolean;
  isCompactUI: boolean;
  isFootballBoard: boolean;
  isLiveMatchMode: boolean;
  isModernSleek: boolean;
  isPitchFullscreen: boolean;
  isProOrAdmin: boolean;
  isTeamAPanelCollapsed: boolean;
  isTeamBPanelCollapsed: boolean;
  playerRepresentation: "dot" | "jersey" | "head";
  playerRolesToggleLabel: "Hide player roles (captain, set pieces)" | "Masquer les rôles des joueurs (capitaine, coups de pied arrêtés)" | "Show player roles (captain, set pieces)" | "Afficher les rôles des joueurs (capitaine, coups de pied arrêtés)";
  playerScale: number;
  renderAnimationStrip: () => React.JSX.Element;
  renderToolbarGroup: (key: "view" | "display" | "drawing" | "color" | "export" | "zoom", withSeparator: boolean, node: React.ReactNode) => React.JSX.Element;
  renderToolbarScrollArrow: (side: "left" | "right") => React.JSX.Element | null;
  setActiveTool: React.Dispatch<React.SetStateAction<"select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link">>;
  setAspectRatioMode: React.Dispatch<React.SetStateAction<"desktop" | "mobile">>;
  setDrawColor: React.Dispatch<React.SetStateAction<string>>;
  setDrawingTool: React.Dispatch<React.SetStateAction<"brush" | "arrow-direct" | "arrow-deep" | "arrow-run" | "shape-circle" | "shape-rect" | "shape-line" | "shape-dashed-line" | "curve-arrow" | "curve-arrow-dashed" | "eraser">>;
  setIsAnimationCreatorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTeamAPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTeamBPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setPitchPan: React.Dispatch<React.SetStateAction<{ x: number; y: number; }>>;
  setPlayerRepresentation: React.Dispatch<React.SetStateAction<"dot" | "jersey" | "head">>;
  setPlayerScale: React.Dispatch<React.SetStateAction<number>>;
  setSelectedStrokeIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setShowBall: React.Dispatch<React.SetStateAction<boolean>>;
  setShowOpponents: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPitchThirds: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPitchZones: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPlayerNames: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPlayerRoles: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSquad3DModal: React.Dispatch<React.SetStateAction<boolean>>;
  setTerrainComplet: React.Dispatch<React.SetStateAction<boolean>>;
  setWallPopover: React.Dispatch<React.SetStateAction<{ team: WallTeam; left: number; top: number; } | null>>;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
  showBall: boolean;
  showOpponents: boolean;
  showPitchThirds: boolean;
  showPitchZones: boolean;
  showPlayerNames: boolean;
  showPlayerRoles: boolean;
  t: (typeof translations)[Language];
  terrainComplet: boolean;
  toolbarScroll: { scrollerRef: React.RefObject<HTMLDivElement | null>; canScrollLeft: boolean; canScrollRight: boolean; scrollByPage: (direction: 1 | -1) => void; onWheel: (e: React.WheelEvent<HTMLDivElement>) => void; };
  topToolBtnClass: (isActive: boolean) => string;
  topToolGroupClass: string;
  wallPopover: { team: WallTeam; left: number; top: number; } | null;
  zoomScale: number;
}

export default function PitchToolbar({
  activeFormat,
  activeSport,
  activeTool,
  aspectRatioMode,
  currentLang,
  currentTokens,
  curveToolTitle,
  drawColor,
  drawingActions,
  drawingTool,
  handleClearDrawings,
  handleOpenExportModal,
  handleSwitchBoardFormat,
  handleToggleCurveTool,
  handleToggleLineTool,
  isAnimationCreatorOpen,
  isCompactUI,
  isFootballBoard,
  isLiveMatchMode,
  isModernSleek,
  isPitchFullscreen,
  isProOrAdmin,
  isTeamAPanelCollapsed,
  isTeamBPanelCollapsed,
  playerRepresentation,
  playerRolesToggleLabel,
  playerScale,
  renderAnimationStrip,
  renderToolbarGroup,
  renderToolbarScrollArrow,
  setActiveTool,
  setAspectRatioMode,
  setDrawColor,
  setDrawingTool,
  setIsAnimationCreatorOpen,
  setIsTeamAPanelCollapsed,
  setIsTeamBPanelCollapsed,
  setPitchPan,
  setPlayerRepresentation,
  setPlayerScale,
  setSelectedStrokeIndex,
  setShowBall,
  setShowOpponents,
  setShowPitchThirds,
  setShowPitchZones,
  setShowPlayerNames,
  setShowPlayerRoles,
  setShowSquad3DModal,
  setTerrainComplet,
  setWallPopover,
  setZoomScale,
  showBall,
  showOpponents,
  showPitchThirds,
  showPitchZones,
  showPlayerNames,
  showPlayerRoles,
  t,
  terrainComplet,
  toolbarScroll,
  topToolBtnClass,
  topToolGroupClass,
  wallPopover,
  zoomScale,
}: PitchToolbarProps) {
  return (
    <>
            {/* Pitch Area Main Toolbar */}
            <div
              id="tour-pitch-controllers"
              className={`relative z-30 flex flex-wrap items-center justify-start ${isCompactUI ? "py-1.5 px-3 gap-1.5 mb-2 text-[90%]" : "py-2 px-4 gap-2 mb-3"
                } tb-toolbar ${isModernSleek ? "text-slate-800" : ""} transition-all duration-300`}
            >
              {/* Ligne unique : tous les outils sont affichés, la zone des groupes défile horizontalement si besoin */}
              <div className="flex items-center flex-nowrap gap-[inherit] w-full basis-full min-w-0">
              <div className="relative flex-1 min-w-0 flex items-center">
              {renderToolbarScrollArrow("left")}
              {/* Zone des groupes : défilement au doigt, à la molette ou par les flèches de bord */}
              <div
                ref={toolbarScroll.scrollerRef}
                onWheel={toolbarScroll.onWheel}
                className="flex items-center flex-nowrap gap-[inherit] flex-1 min-w-0 py-1 -my-1 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >

              {/* GROUP 1: Vue du terrain (complet / demi-terrain, paysage / portrait) */}
              {renderToolbarGroup("view", false,
              <div className={`flex items-center gap-1 h-8 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
                <button
                  type="button"
                  onClick={() => setTerrainComplet(true)}
                  className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${terrainComplet
                    ? isModernSleek
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={t.tactics.pitchModes.fullPitch}
                  aria-label={t.tactics.pitchModes.fullPitch}
                >
                  <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setTerrainComplet(false)}
                  className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${!terrainComplet
                    ? isModernSleek
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={t.tactics.pitchModes.halfPitch}
                  aria-label={t.tactics.pitchModes.halfPitch}
                >
                  <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 3h16v18H4z" />
                    <line x1="4" y1="21" x2="20" y2="21" />
                    <path d="M8 3v5h8V3" />
                    <path d="M9 21a3 3 0 0 1 6 0" />
                  </svg>
                </button>

                <div className={`h-4 w-px mx-0.5 ${isModernSleek ? "bg-slate-300" : "bg-[#1a2130]"}`} />

                <button
                  type="button"
                  onClick={() => setAspectRatioMode("desktop")}
                  className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${aspectRatioMode === "desktop"
                    ? isModernSleek
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={t.tactics.pitchModes.aspectDesktop}
                  aria-label={t.tactics.pitchModes.aspectDesktop}
                >
                  <Laptop className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatioMode("mobile")}
                  className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${aspectRatioMode === "mobile"
                    ? isModernSleek
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={t.tactics.pitchModes.aspectMobile}
                  aria-label={t.tactics.pitchModes.aspectMobile}
                >
                  <Smartphone className="h-[18px] w-[18px] shrink-0" />
                </button>

                {/* Format de jeu du terrain : foot à 11 / 8 / 5 (rugby à XV / 7).
                    Formule gratuite uniquement : en PRO, le format est celui de l'équipe, choisi à sa création. */}
                {!isProOrAdmin && getGameFormatOptions(activeSport).length > 1 && (
                  <>
                    <div className={`h-4 w-px mx-0.5 ${isModernSleek ? "bg-slate-300" : "bg-[#1a2130]"}`} />
                    <div
                      role="group"
                      aria-label={currentLang === "en" ? "Game format" : "Format de jeu"}
                      className="flex items-center gap-1"
                    >
                      <Users className={`h-3.5 w-3.5 shrink-0 mx-0.5 ${isModernSleek ? "text-slate-500" : "text-[#6c7d99]"}`} aria-hidden="true" />
                      {getGameFormatOptions(activeSport).map((opt) => {
                        const isOn = opt.id === activeFormat;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSwitchBoardFormat(opt.id)}
                            aria-pressed={isOn}
                            className={`h-7 min-w-[34px] px-2 rounded-lg transition cursor-pointer flex items-center justify-center text-[12px] font-black tabular-nums ${isOn
                              ? isModernSleek
                                ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs"
                                : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                              : isModernSleek
                                ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                                : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                              }`}
                            title={`${currentLang === "en" ? opt.labelEn : opt.label} (${opt.players} ${currentLang === "en" ? "players" : "joueurs"})`}
                            aria-label={currentLang === "en" ? opt.labelEn : opt.label}
                          >
                            {opt.short}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              )}

              {/* GROUP 2: Affichage (ballon, adversaires, noms, volets, représentation des joueurs) */}
              {renderToolbarGroup("display", true,
              <div className={`flex items-center gap-1 h-8 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
                <button
                  type="button"
                  onClick={() => setShowBall(!showBall)}
                  className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${showBall
                    ? isModernSleek
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={showBall
                    ? (activeSport === "rugby" ? "Masquer le ballon de rugby" : activeSport === "basketball" ? "Masquer le ballon de basketball" : activeSport === "handball" ? "Masquer le ballon de handball" : t.tactics.pitchModes.ballHide)
                    : (activeSport === "rugby" ? "Afficher le ballon de rugby" : activeSport === "basketball" ? "Afficher le ballon de basketball" : activeSport === "handball" ? "Afficher le ballon de handball" : t.tactics.pitchModes.ballShow)
                  }
                  aria-label={showBall ? t.tactics.pitchModes.ballHide : t.tactics.pitchModes.ballShow}
                >
                  <span className="text-base leading-none shrink-0" aria-hidden="true">
                    {getSportBallInfo(activeSport).emoji}
                  </span>
                </button>
                {/* Football uniquement : afficher / masquer les 5 couloirs du terrain */}
                {isFootballBoard && (
                  <button
                    type="button"
                    onClick={() => setShowPitchZones((v) => !v)}
                    aria-pressed={showPitchZones}
                    className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${showPitchZones
                      ? isModernSleek
                        ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                        : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                      : isModernSleek
                        ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                        : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                    title={showPitchZones
                      ? (currentLang === "en" ? "Hide the 5 pitch lanes" : "Masquer les 5 couloirs du terrain")
                      : (currentLang === "en" ? "Show the 5 pitch lanes" : "Afficher les 5 couloirs du terrain")}
                    aria-label={currentLang === "en" ? "5 pitch lanes" : "5 couloirs du terrain"}
                  >
                    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="8" x2="22" y2="8" strokeWidth="1.5" strokeDasharray="2 2" />
                      <line x1="2" y1="10.5" x2="22" y2="10.5" strokeWidth="1.5" strokeDasharray="2 2" />
                      <line x1="2" y1="13.5" x2="22" y2="13.5" strokeWidth="1.5" strokeDasharray="2 2" />
                      <line x1="2" y1="16" x2="22" y2="16" strokeWidth="1.5" strokeDasharray="2 2" />
                    </svg>
                  </button>
                )}
                {/* Football uniquement : afficher / masquer les 3 zones (défense, milieu, attaque) */}
                {isFootballBoard && (
                  <button
                    type="button"
                    onClick={() => setShowPitchThirds((v) => !v)}
                    aria-pressed={showPitchThirds}
                    className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${showPitchThirds
                      ? isModernSleek
                        ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                        : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                      : isModernSleek
                        ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                        : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                    title={showPitchThirds
                      ? (currentLang === "en" ? "Hide the 3 zones (defence, midfield, attack)" : "Masquer les 3 zones (défense, milieu, attaque)")
                      : (currentLang === "en" ? "Show the 3 zones (defence, midfield, attack)" : "Afficher les 3 zones (défense, milieu, attaque)")}
                    aria-label={currentLang === "en" ? "3 pitch zones" : "3 zones du terrain"}
                  >
                    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="8.7" y1="4" x2="8.7" y2="20" strokeWidth="1.5" strokeDasharray="2 2" />
                      <line x1="15.3" y1="4" x2="15.3" y2="20" strokeWidth="1.5" strokeDasharray="2 2" />
                    </svg>
                  </button>
                )}
                {/* Football uniquement : mur sur coup franc (nombre de joueurs, équipe, composition) */}
                {isFootballBoard && (() => {
                  const hasWall = currentTokens.some((t) => t.type === "wall");
                  const isOpen = wallPopover !== null;
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        if (isOpen) { setWallPopover(null); return; }
                        const r = e.currentTarget.getBoundingClientRect();
                        const existing = currentTokens.find((t) => t.type === "wall");
                        setWallPopover({ team: existing?.wallTeam === "away" ? "away" : "home", left: r.left + r.width / 2, top: r.bottom + 8 });
                      }}
                      aria-pressed={hasWall}
                      aria-expanded={isOpen}
                      className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${hasWall || isOpen
                        ? isModernSleek
                          ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                          : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                        : isModernSleek
                          ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                        }`}
                      data-wall-button="true"
                      title={currentLang === "en" ? "Free-kick wall" : "Mur (coup franc)"}
                      aria-label={currentLang === "en" ? "Free-kick wall" : "Mur (coup franc)"}
                    >
                      <BrickWall className="h-[18px] w-[18px] shrink-0" />
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setShowOpponents(!showOpponents)}
                  className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${showOpponents
                    ? isModernSleek
                      ? "bg-white border border-rose-400 text-rose-700 shadow-xs font-black"
                      : "bg-[#28131a] border border-rose-500/60 text-rose-400 shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={showOpponents ? t.tactics.pitchModes.opponentsHide : t.tactics.pitchModes.opponentsShow}
                  aria-label={showOpponents ? t.tactics.pitchModes.opponentsHide : t.tactics.pitchModes.opponentsShow}
                >
                  <Users className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlayerNames(!showPlayerNames)}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${!showPlayerNames
                    ? isModernSleek
                      ? "bg-amber-500 border border-amber-600 text-white shadow-xs font-black"
                      : "bg-[#382810] border border-amber-400 text-amber-300 shadow-xs font-black"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={showPlayerNames ? t.tactics.pitchModes.namesHide : t.tactics.pitchModes.namesShow}
                  aria-label={showPlayerNames ? t.tactics.pitchModes.namesHide : t.tactics.pitchModes.namesShow}
                >
                  <Hash className="h-[18px] w-[18px] shrink-0" />
                </button>
                {/* Afficher / masquer les rôles des joueurs (capitaine, coups de pied arrêtés…) */}
                <button
                  type="button"
                  onClick={() => setShowPlayerRoles(!showPlayerRoles)}
                  aria-pressed={!showPlayerRoles}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${!showPlayerRoles
                    ? isModernSleek
                      ? "bg-amber-500 border border-amber-600 text-white shadow-xs font-black"
                      : "bg-[#382810] border border-amber-400 text-amber-300 shadow-xs font-black"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={playerRolesToggleLabel}
                  aria-label={playerRolesToggleLabel}
                >
                  <Tag className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const shouldCollapse = !isTeamAPanelCollapsed || !isTeamBPanelCollapsed;
                    setIsTeamAPanelCollapsed(shouldCollapse);
                    setIsTeamBPanelCollapsed(shouldCollapse);
                  }}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${isTeamAPanelCollapsed && isTeamBPanelCollapsed
                    ? isModernSleek
                      ? "bg-purple-600 border border-purple-700 text-white shadow-xs font-black"
                      : "bg-[#361942] border border-purple-400 text-purple-200 shadow-xs font-black"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={
                    isTeamAPanelCollapsed && isTeamBPanelCollapsed
                      ? t.tactics.pitchModes.panelsUnfold
                      : t.tactics.pitchModes.panelsCollapse
                  }
                  aria-label={
                    isTeamAPanelCollapsed && isTeamBPanelCollapsed
                      ? t.tactics.pitchModes.panelsUnfold
                      : t.tactics.pitchModes.panelsCollapse
                  }
                >
                  <Columns className="h-[18px] w-[18px] shrink-0" />
                </button>

                <div className={`h-4 w-px mx-0.5 ${isModernSleek ? "bg-slate-300" : "bg-[#1a2130]"}`} />

                {/* Représentation des Joueurs (Pastille / Buste / Tête) */}
                <div className="flex items-center gap-1" title={t.tactics.pitchModes.repTitle}>
                <button
                  type="button"
                  onClick={() => setPlayerRepresentation("dot")}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${playerRepresentation === "dot"
                    ? isModernSleek
                      ? "bg-white border border-emerald-500 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs font-black"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={t.tactics.pitchModes.repPastille}
                  aria-label={t.tactics.pitchModes.repPastille}
                >
                  <Circle className="h-[18px] w-[18px] shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setPlayerRepresentation("jersey")}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${playerRepresentation === "jersey"
                    ? isModernSleek
                      ? "bg-white border border-emerald-500 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs font-black"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={t.tactics.pitchModes.repBuste}
                  aria-label={t.tactics.pitchModes.repBuste}
                >
                  <Shirt className="h-[18px] w-[18px] shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setPlayerRepresentation("head")}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${playerRepresentation === "head"
                    ? isModernSleek
                      ? "bg-white border border-emerald-500 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs font-black"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                    }`}
                  title={t.tactics.pitchModes.repTete}
                  aria-label={t.tactics.pitchModes.repTete}
                >
                  <User className="h-[18px] w-[18px] shrink-0" />
                </button>
                </div>
              </div>
              )}

              {/* GROUP 6: Outils de dessin */}
              {renderToolbarGroup("drawing", true,
              <div id="tour-drawing-tools" className={topToolGroupClass} title={t.tactics.toolsSection}>
                <button
                  type="button"
                  onClick={() => { setActiveTool("select"); setDrawingTool("brush"); }}
                  className={topToolBtnClass(activeTool === "select")}
                  title={t.tactics.tools.select}
                  aria-label={t.tactics.tools.select}
                >
                  <MousePointer className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTool("move"); setDrawingTool("brush"); setSelectedStrokeIndex(null); }}
                  className={topToolBtnClass(activeTool === "move")}
                  title={t.tactics.tools.move}
                  aria-label={t.tactics.tools.move}
                >
                  <Move className="h-[18px] w-[18px] shrink-0" />
                </button>
                {/* Ligne Tactique (Pleine & Pointillée sur le même bouton) */}
                <button
                  type="button"
                  onClick={handleToggleLineTool}
                  className={topToolBtnClass(activeTool === "line")}
                  title={
                    activeTool === "line"
                      ? drawingTool === "shape-dashed-line"
                        ? t.tactics.tools.lineTooltipDashedActive
                        : t.tactics.tools.lineTooltipSolidActive
                      : t.tactics.tools.lineTooltipDefault
                  }
                  aria-label={t.tactics.tools.line}
                >
                  {activeTool === "line" && drawingTool === "shape-dashed-line" ? (
                    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="4" y1="20" x2="20" y2="4" strokeDasharray="3 3" />
                    </svg>
                  ) : (
                    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="19" x2="19" y2="5" />
                    </svg>
                  )}
                </button>
                {/* Lier des joueurs : lignes qui suivent les joueurs reliés */}
                <button
                  type="button"
                  onClick={() => { setActiveTool(activeTool === "link" ? "select" : "link"); setSelectedStrokeIndex(null); }}
                  className={topToolBtnClass(activeTool === "link")}
                  title="Lier des joueurs : touchez les joueurs un à un pour les relier par une ligne qui les suit"
                  aria-label="Lier des joueurs"
                  aria-pressed={activeTool === "link"}
                >
                  <PlayerLinkIcon className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTool("arrow"); setDrawingTool("arrow-direct"); setSelectedStrokeIndex(null); }}
                  className={topToolBtnClass(activeTool === "arrow")}
                  title={t.tactics.tools.arrow}
                  aria-label={t.tactics.tools.arrow}
                >
                  <ArrowUpRight className="h-[18px] w-[18px] shrink-0" />
                </button>
                {/* Courbe fléchée (Bézier), pleine ou pointillée sur le même bouton */}
                <button
                  type="button"
                  onClick={handleToggleCurveTool}
                  className={topToolBtnClass(activeTool === "curve")}
                  title={curveToolTitle}
                  aria-label="Courbe fléchée"
                  aria-pressed={activeTool === "curve"}
                >
                  <CurveArrowIcon dashed={activeTool === "curve" && drawingTool === "curve-arrow-dashed"} className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTool("draw"); setDrawingTool("shape-rect"); setSelectedStrokeIndex(null); }}
                  className={topToolBtnClass(activeTool === "draw" && drawingTool === "shape-rect")}
                  title={t.tactics.tools.zoneTooltip}
                  aria-label={t.tactics.tools.zoneTooltip}
                >
                  <Scan className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTool("draw"); setDrawingTool("brush"); setSelectedStrokeIndex(null); }}
                  className={topToolBtnClass(activeTool === "draw" && drawingTool !== "shape-rect")}
                  title={t.tactics.tools.draw}
                  aria-label={t.tactics.tools.draw}
                >
                  <Pencil className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={handleClearDrawings}
                  disabled={drawingActions.length === 0}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition flex items-center justify-center border ${drawingActions.length > 0
                    ? isModernSleek
                      ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-400 cursor-pointer"
                      : "bg-[#0c1017] border-[#1e293b] text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    : isModernSleek
                      ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                      : "bg-[#0c1017] border-[#1e293b] text-slate-600 cursor-not-allowed"
                    }`}
                  title={t.tactics.tools.clearDrawings}
                  aria-label={t.tactics.tools.clearDrawings}
                >
                  <Trash2 className="h-[18px] w-[18px] shrink-0" />
                </button>
              </div>
              )}

              {/* GROUP 7: Couleur du tracé */}
              {renderToolbarGroup("color", false,
              <div className={`${topToolGroupClass} px-1.5 gap-1.5`} title={t.tactics.tools.strokeOptions}>
                {["#00E599", "#ef4444", "#3b82f6", "#1e293b", "#eab308"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDrawColor(c)}
                    className={`w-4 h-4 rounded-full border transition cursor-pointer ${drawColor === c ? (isModernSleek ? "ring-2 ring-emerald-600 scale-110 shadow-sm" : "ring-2 ring-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]") : "hover:scale-105 opacity-80 hover:opacity-100"}`}
                    style={{ backgroundColor: c, borderColor: isModernSleek ? "rgba(0,0,0,0.15)" : undefined }}
                    title={`${t.tactics.strokeSection} ${c}`}
                    aria-label={`${t.tactics.strokeSection} ${c}`}
                  />
                ))}
              </div>
              )}

              {/* GROUP 8: Export PNG & Vue 3D */}
              {renderToolbarGroup("export", true,
              <div id="tour-export-actions" className={topToolGroupClass}>
                <button
                  type="button"
                  onClick={handleOpenExportModal}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center border ${isModernSleek
                    ? "bg-amber-400 hover:bg-amber-300 border-amber-400 text-amber-950"
                    : "bg-[#e9c349] hover:bg-[#f2d469] border-[#e9c349] text-[#241a00]"
                    }`}
                  title={t.tactics.tools.exportPng}
                  aria-label={t.tactics.tools.exportPng}
                >
                  <Download className="h-[18px] w-[18px] shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowSquad3DModal(true)}
                  className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center border ${isModernSleek
                    ? "bg-slate-200/80 border-slate-300 text-amber-600 hover:bg-slate-300/80"
                    : "bg-[#0c1017] border-[#1e293b] text-[#e9c349] hover:bg-[#151e2d]"
                    }`}
                  title={t.tactics.tools.cardView3D}
                  aria-label={t.tactics.tools.cardView3D}
                >
                  <Sparkles className="h-[18px] w-[18px] shrink-0" />
                </button>
              </div>
              )}

              {/* GROUP 4: Zooms (Échelle Terrain & Taille Joueurs) — calés à droite, collés au bouton Animation */}
              {renderToolbarGroup("zoom", false,
              <div className={`flex items-center gap-2 h-8 ${isModernSleek ? "bg-slate-100 p-0.5 px-2 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 px-2 rounded-lg border border-[#1a2130]"}`}>
                {/* Pitch Zoom */}
                <div title={t.tactics.pitchModes.pitchZoom} className="flex items-center gap-1">
                  <ZoomIn className={`h-[18px] w-[18px] shrink-0 ${isModernSleek ? "text-slate-600" : "text-[#718096]"}`} />
                  <button
                    type="button"
                    onClick={() =>
                      setZoomScale((prev) => {
                        const next = Math.max(70, prev - 10);
                        if (next === 100) setPitchPan({ x: 0, y: 0 });
                        return next;
                      })
                    }
                    className={`h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer ${isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-800"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                      }`}
                    title={t.tactics.pitchModes.zoomOut}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(100);
                      setPitchPan({ x: 0, y: 0 });
                    }}
                    className={`text-[10px] font-black ${isModernSleek ? "text-slate-900 hover:text-emerald-700" : "text-white hover:text-[#00E599]"} w-7 text-center font-mono cursor-pointer transition`}
                    title="Réinitialiser le zoom et centrer le terrain (100%)"
                  >
                    {zoomScale}%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setZoomScale((prev) => {
                        const next = Math.min(150, prev + 10);
                        if (next === 100) setPitchPan({ x: 0, y: 0 });
                        return next;
                      })
                    }
                    className={`h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer ${isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-800"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                      }`}
                    title={t.tactics.pitchModes.zoomIn}
                  >
                    +
                  </button>
                </div>

                <div className={`h-4 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1a2130]"}`} />

                {/* Players Scale */}
                <div title={t.tactics.pitchModes.playerZoom} className="flex items-center gap-1">
                  <User className={`h-[18px] w-[18px] shrink-0 ${isModernSleek ? "text-slate-600" : "text-[#718096]"}`} />
                  <button
                    type="button"
                    onClick={() => setPlayerScale(prev => Math.max(20, prev - 10))}
                    className={`h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer ${isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-800"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                      }`}
                    title={t.tactics.pitchModes.playerZoomOut}
                  >
                    -
                  </button>
                  <span className={`text-[10px] font-black ${isModernSleek ? "text-slate-900" : "text-white"} w-7 text-center font-mono`}>{playerScale}%</span>
                  <button
                    type="button"
                    onClick={() => setPlayerScale(prev => Math.min(130, prev + 10))}
                    className={`h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer ${isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-800"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                      }`}
                    title={t.tactics.pitchModes.playerZoomIn}
                  >
                    +
                  </button>
                </div>
              </div>
              )}

              </div>
              {renderToolbarScrollArrow("right")}
              </div>

              {/* GROUP 5: Animation (ouvre les contrôles en seconde ligne) — reste à droite, ouvert ou fermé */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`flex items-center h-8 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
                  <button
                    type="button"
                    disabled={isLiveMatchMode}
                    onClick={() => {
                      if (isLiveMatchMode) return;
                      const nextState = !isAnimationCreatorOpen;
                      setIsAnimationCreatorOpen(nextState);
                      if (nextState) {
                        setTimeout(() => {
                          const animationEl = document.getElementById("animation-creator-panel");
                          if (animationEl) {
                            animationEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                          }
                        }, 100);
                      }
                    }}
                    className={`h-7 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 ${isLiveMatchMode
                      ? "opacity-30 cursor-not-allowed bg-[#0c1017] border border-[#1e293b] text-slate-500"
                      : isAnimationCreatorOpen
                        ? isModernSleek
                          ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black cursor-pointer"
                          : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs cursor-pointer"
                        : isModernSleek
                          ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80 cursor-pointer"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d] cursor-pointer"
                      }`}
                    title={isLiveMatchMode ? t.tactics.pitchModes.animationLiveDisabled : (isAnimationCreatorOpen ? t.tactics.pitchModes.animationVideoActive : t.tactics.pitchModes.animationVideoInactive)}
                    aria-label={t.tactics.pitchModes.animationVideoInactive}
                  >
                    <Video className="h-[18px] w-[18px] shrink-0" />
                    {/* Libellé masqué sur smartphone pour laisser la place aux outils */}
                    <span className="hidden sm:inline text-[10.5px] font-bold whitespace-nowrap">Animation</span>
                  </button>
                  </div>
              </div>
              </div>

              {!isPitchFullscreen && !isLiveMatchMode && isAnimationCreatorOpen && renderAnimationStrip()}

            </div>
    </>
  );
}
