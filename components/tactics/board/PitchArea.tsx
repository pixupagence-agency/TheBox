"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import Pitch from "../../Pitch";
import { PitchBallGraphic, getSportBallInfo } from "@/components/tactics/PitchBallGraphic";
import { PlayerLinksOverlay } from "@/components/tactics/PlayerLinksOverlay";
import { CurveArrowIcon, PlayerLinkIcon, ROLE_TONE_CHIP } from "@/components/tactics/icons";
import { type Language, type translations } from "@/lib/i18n";
import { WALL_DEFAULT, WALL_MAX, WALL_MIN, type WallTeam } from "@/lib/setPieceWall";
import { getPlayerRoleCodes } from "@/lib/sportRoles";
import { type DrawingAction, type SetPieceRoleConfig, type Token } from "@/lib/tactics/types";
import { ArrowUpRight, Circle, Columns, Hash, Laptop, Minimize2, MousePointer, Move, Pencil, RotateCcw, RotateCw, Shirt, Smartphone, Tag, Trash2, User, Users, Video, ZoomIn, type Box } from "lucide-react";

export interface PitchAreaProps {
  activeFormat: string;
  activeSport: string;
  activeTool: "select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link";
  aspectRatioMode: "desktop" | "mobile";
  autoTransparentCache: Record<string, string>;
  awayScore: number;
  ballMagnetTargetId: string | null;
  breakShortLabel: "PAUSE" | "MT";
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  clubLogo: string;
  cornerFlagVars: React.CSSProperties;
  currentPitchRatio: number;
  currentTokens: Token[];
  curveHandleIdx: number | null;
  curveToolTitle: string;
  dragEndTimeRef: React.RefObject<number>;
  drawingActions: DrawingAction[];
  drawingTool: "brush" | "arrow-direct" | "arrow-deep" | "arrow-run" | "shape-circle" | "shape-rect" | "shape-line" | "shape-dashed-line" | "curve-arrow" | "curve-arrow-dashed" | "eraser";
  drawSize: number;
  formatLiveTime: (totalSecs: number) => string;
  halftimeSecondsLeft: number;
  handleCanvasMouseDown: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent> | React.TouchEvent<HTMLCanvasElement>) => void;
  handleCanvasMouseMove: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent> | React.TouchEvent<HTMLCanvasElement>) => void;
  handleCanvasMouseUp: () => void;
  handleClearDrawings: () => void;
  handleDeleteLink: (linkId: string) => void;
  handleDeleteSelectedStroke: () => void;
  handleLinkTap: (tokenId: string) => void;
  handlePitchPanStart: (startEvent: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => void;
  handleStartWallRotate: (team: WallTeam, e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => void;
  handleToggleCurveTool: () => void;
  handleToggleLineTool: () => void;
  handleTokenStartDrag: (tokenId: string, startEvent: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => void;
  handleUndo: () => void;
  homeScore: number;
  isAnimationCreatorOpen: boolean;
  isDraggingTokenRef: React.RefObject<boolean>;
  isFootballBoard: boolean;
  isHalftime: boolean;
  isInWall: (t: Token, tokens: Token[]) => boolean;
  isLiveMatchMode: boolean;
  isModernSleek: boolean;
  isPanningPitch: boolean;
  isPeriodOvertime: boolean;
  isPitchFullscreen: boolean;
  isPlaying: boolean;
  isTeamAPanelCollapsed: boolean;
  isTeamBPanelCollapsed: boolean;
  lastTokenTapRef: React.RefObject<{ id: string; at: number; } | null>;
  linkColor: string;
  linkDashed: boolean;
  linkDraft: string[];
  liveTimerSeconds: number;
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  pitchBoxRef: (node: HTMLDivElement | null) => void;
  pitchContainerRef: React.RefObject<HTMLDivElement | null>;
  pitchMaxHeight: "calc(100vh - 215px)" | "calc(100vh - 140px)" | "calc(100vh - 90px)" | "min(54vh, calc(100vh - 200px))" | "min(65vh, calc(100vh - 150px))";
  pitchMaxWidth: string;
  pitchPan: { x: number; y: number; };
  pitchThirdsLabels: [string, string, string];
  pitchWrapperRef: React.RefObject<HTMLDivElement | null>;
  playbackSpeed: number;
  playerRepresentation: "dot" | "jersey" | "head";
  playerRolesToggleLabel: "Hide player roles (captain, set pieces)" | "Masquer les rôles des joueurs (capitaine, coups de pied arrêtés)" | "Show player roles (captain, set pieces)" | "Afficher les rôles des joueurs (capitaine, coups de pied arrêtés)";
  playerScale: number;
  renderAnimationStrip: () => React.JSX.Element;
  renderLiveMatchToolbox: () => React.JSX.Element;
  renderPlayerEditModal: () => React.JSX.Element;
  renderSubstitutionModal: () => React.JSX.Element;
  renderTeamAPanel: (isFullscreenMode?: boolean) => React.JSX.Element;
  renderTeamBPanel: (isFullscreenMode?: boolean) => React.JSX.Element;
  selectedLinkId: string | null;
  selectedStrokeIndex: number | null;
  selectedTokenId: string | null;
  setActiveTool: React.Dispatch<React.SetStateAction<"select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link">>;
  setAspectRatioMode: React.Dispatch<React.SetStateAction<"desktop" | "mobile">>;
  setDrawColor: React.Dispatch<React.SetStateAction<string>>;
  setDrawingTool: React.Dispatch<React.SetStateAction<"brush" | "arrow-direct" | "arrow-deep" | "arrow-run" | "shape-circle" | "shape-rect" | "shape-line" | "shape-dashed-line" | "curve-arrow" | "curve-arrow-dashed" | "eraser">>;
  setDrawSize: React.Dispatch<React.SetStateAction<number>>;
  setEditingToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setIsAnimationCreatorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTeamAPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTeamBPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setLiveActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setPieceRoles: SetPieceRoleConfig;
  setPitchPan: React.Dispatch<React.SetStateAction<{ x: number; y: number; }>>;
  setPlayerRepresentation: React.Dispatch<React.SetStateAction<"dot" | "jersey" | "head">>;
  setPlayerScale: React.Dispatch<React.SetStateAction<number>>;
  setQuickActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSelectedLinkId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedStrokeIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setShowBall: React.Dispatch<React.SetStateAction<boolean>>;
  setShowOpponents: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPlayerNames: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPlayerRoles: React.Dispatch<React.SetStateAction<boolean>>;
  setSubPickerToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setTerrainComplet: React.Dispatch<React.SetStateAction<boolean>>;
  setWallPopover: React.Dispatch<React.SetStateAction<{ team: WallTeam; left: number; top: number; } | null>>;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
  showBall: boolean;
  showClubLogoOnPitch: boolean;
  showOpponents: boolean;
  showPitchThirds: boolean;
  showPitchZones: boolean;
  showPlayerNames: boolean;
  showPlayerRoles: boolean;
  startCurveHandleDrag: (strokeIdx: number, pointIdx: number, e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => void;
  t: (typeof translations)[Language];
  teamAColor: string;
  teamBColor: string;
  terrainComplet: boolean;
  togglePitchFullscreen: () => Promise<void>;
  tokensLayerRef: React.RefObject<HTMLDivElement | null>;
  wallAngleOf: (wall: Token, tokens?: Token[]) => number;
  wallDropTarget: { team: WallTeam; slot: number; } | null;
  wallMembers: (team: WallTeam, count: number, tokens?: Token[]) => (Token | null)[];
  wallPopover: { team: WallTeam; left: number; top: number; } | null;
  zoomedPitchReservedHeight: number | undefined;
  zoomScale: number;
}

export default function PitchArea({
  activeFormat,
  activeSport,
  activeTool,
  aspectRatioMode,
  autoTransparentCache,
  awayScore,
  ballMagnetTargetId,
  breakShortLabel,
  canvasRef,
  clubLogo,
  cornerFlagVars,
  currentPitchRatio,
  currentTokens,
  curveHandleIdx,
  curveToolTitle,
  dragEndTimeRef,
  drawingActions,
  drawingTool,
  drawSize,
  formatLiveTime,
  halftimeSecondsLeft,
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  handleClearDrawings,
  handleDeleteLink,
  handleDeleteSelectedStroke,
  handleLinkTap,
  handlePitchPanStart,
  handleStartWallRotate,
  handleToggleCurveTool,
  handleToggleLineTool,
  handleTokenStartDrag,
  handleUndo,
  homeScore,
  isAnimationCreatorOpen,
  isDraggingTokenRef,
  isFootballBoard,
  isHalftime,
  isInWall,
  isLiveMatchMode,
  isModernSleek,
  isPanningPitch,
  isPeriodOvertime,
  isPitchFullscreen,
  isPlaying,
  isTeamAPanelCollapsed,
  isTeamBPanelCollapsed,
  lastTokenTapRef,
  linkColor,
  linkDashed,
  linkDraft,
  liveTimerSeconds,
  matchEvents,
  pitchBoxRef,
  pitchContainerRef,
  pitchMaxHeight,
  pitchMaxWidth,
  pitchPan,
  pitchThirdsLabels,
  pitchWrapperRef,
  playbackSpeed,
  playerRepresentation,
  playerRolesToggleLabel,
  playerScale,
  renderAnimationStrip,
  renderLiveMatchToolbox,
  renderPlayerEditModal,
  renderSubstitutionModal,
  renderTeamAPanel,
  renderTeamBPanel,
  selectedLinkId,
  selectedStrokeIndex,
  selectedTokenId,
  setActiveTool,
  setAspectRatioMode,
  setDrawColor,
  setDrawingTool,
  setDrawSize,
  setEditingToken,
  setIsAnimationCreatorOpen,
  setIsTeamAPanelCollapsed,
  setIsTeamBPanelCollapsed,
  setLiveActionToken,
  setPieceRoles,
  setPitchPan,
  setPlayerRepresentation,
  setPlayerScale,
  setQuickActionToken,
  setSelectedLinkId,
  setSelectedStrokeIndex,
  setShowBall,
  setShowOpponents,
  setShowPlayerNames,
  setShowPlayerRoles,
  setSubPickerToken,
  setTerrainComplet,
  setWallPopover,
  setZoomScale,
  showBall,
  showClubLogoOnPitch,
  showOpponents,
  showPitchThirds,
  showPitchZones,
  showPlayerNames,
  showPlayerRoles,
  startCurveHandleDrag,
  t,
  teamAColor,
  teamBColor,
  terrainComplet,
  togglePitchFullscreen,
  tokensLayerRef,
  wallAngleOf,
  wallDropTarget,
  wallMembers,
  wallPopover,
  zoomedPitchReservedHeight,
  zoomScale,
}: PitchAreaProps) {
  return (
    <>
              {/* 2. CENTER: THE PITCH ARTIFICIAL GRASS CONTAINER WITH PROPORTIONS LOCK */}
              <div className="flex-1 flex flex-col items-center justify-center min-w-0 w-full pr-1">

                {/* Fullscreen Pitch Wrapper (covers entire screen when isPitchFullscreen is true) */}
                <div
                  ref={pitchWrapperRef}
                  id="pitch-main-viewport"
                  style={isPitchFullscreen && zoomedPitchReservedHeight ? { overflowY: "auto" } : undefined}
                  className={
                    isPitchFullscreen
                      ? isModernSleek
                        ? "fixed inset-0 z-[100] bg-slate-100/98 text-slate-800 backdrop-blur-xl flex flex-col items-center justify-between p-2 sm:p-3 select-none animate-fade-in overflow-hidden h-screen w-screen"
                        : "fixed inset-0 z-[100] bg-[#070b13]/98 text-white backdrop-blur-xl flex flex-col items-center justify-between p-2 sm:p-3 select-none animate-fade-in overflow-hidden h-screen w-screen"
                      : "relative w-full mx-auto flex flex-col items-center justify-center transition-all duration-300 ease-in-out"
                  }
                >
                  {/* Fullscreen Dedicated Top Controls Header with Full Tactics Tools & Animation Button */}
                  {isPitchFullscreen && (
                    <div className={`w-fit max-w-full min-w-0 flex flex-col items-center gap-1.5 px-3 py-1.5 mb-2 rounded-2xl shadow-2xl backdrop-blur-md z-40 shrink-0 border ${isModernSleek
                      ? "bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10"
                      : "bg-[#0d1117]/95 border-[#1f293d] text-white shadow-2xl"
                      }`}>
                    {/* Une seule ligne d'outils, jamais repliée sur deux lignes : défilement horizontal si l'écran est trop étroit
                        (molette ou glissé) ; seuls les contrôles d'animation s'affichent en seconde ligne */}
                    <div
                      data-fullscreen-toolbar-row
                      onWheel={(e) => {
                        // Molette verticale → défilement horizontal de la ligne d'outils
                        const el = e.currentTarget;
                        if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
                        el.scrollLeft += e.deltaY;
                      }}
                      className="max-w-full flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:thin] pb-0.5 [&>*]:shrink-0"
                    >

                      {/* Mode Live Indicator & Score Pill in Top Fullscreen Bar */}
                      {isLiveMatchMode && (
                        <>
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-xl mr-1 shrink-0 border ${isModernSleek
                            ? "bg-rose-50 border-rose-300 text-rose-800"
                            : "bg-rose-950/40 border-rose-800/60 text-rose-300"
                            }`}>
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                            </span>
                            <span className={`text-[8.5px] font-black tracking-wider uppercase ${isModernSleek ? "text-rose-700" : "text-rose-300"}`}>
                              LIVE
                            </span>
                            <div className={`h-4 w-px ${isModernSleek ? "bg-rose-300" : "bg-rose-800/60"}`} />
                            <span className={`text-[9.5px] font-mono font-black ${isModernSleek ? "text-amber-600" : "text-amber-300"}`}>
                              {homeScore} - {awayScore}
                            </span>
                            <div className={`h-4 w-px ${isModernSleek ? "bg-rose-300" : "bg-rose-800/60"}`} />
                            <span className={`text-[9px] font-mono font-bold ${isHalftime
                              ? halftimeSecondsLeft === 0 ? (isModernSleek ? "text-rose-600" : "text-rose-400") : (isModernSleek ? "text-amber-700" : "text-[#e9c349]")
                              : isPeriodOvertime ? (isModernSleek ? "text-rose-600" : "text-rose-400") : (isModernSleek ? "text-slate-600" : "text-slate-300")
                              }`}>
                              {isHalftime ? `${breakShortLabel} ${formatLiveTime(halftimeSecondsLeft)}` : formatLiveTime(liveTimerSeconds)}
                            </span>
                          </div>
                          <div className={`h-6 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1f293d]"}`} />
                        </>
                      )}

                      {/* GROUP 1: Pitch View Modes (Full Pitch & Half Pitch) & Animation Video Toggle */}
                      <div className={`flex items-center gap-1.5 h-11 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
                        <button
                          type="button"
                          onClick={() => setTerrainComplet(true)}
                          className={`h-10 px-3 rounded-lg transition cursor-pointer flex items-center justify-center ${terrainComplet
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
                          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <line x1="12" y1="4" x2="12" y2="20" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTerrainComplet(false)}
                          className={`h-10 px-3 rounded-lg transition cursor-pointer flex items-center justify-center ${!terrainComplet
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
                          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 3h16v18H4z" />
                            <line x1="4" y1="21" x2="20" y2="21" />
                            <path d="M8 3v5h8V3" />
                            <path d="M9 21a3 3 0 0 1 6 0" />
                          </svg>
                        </button>

                        <div className={`h-6 w-px mx-0.5 ${isModernSleek ? "bg-slate-300" : "bg-[#1a2130]"}`} />

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
                          className={`h-10 px-3 rounded-lg transition flex items-center justify-center ${isLiveMatchMode
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
                          <Video className="h-5 w-5 shrink-0" />
                        </button>
                      </div>

                      {/* GROUP 2: Display Device Ratios (Paysage & Portrait) */}
                      <div className={`flex items-center gap-1.5 h-11 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
                        <button
                          type="button"
                          onClick={() => setAspectRatioMode("desktop")}
                          className={`h-10 px-3 rounded-lg transition cursor-pointer flex items-center justify-center ${aspectRatioMode === "desktop"
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
                          <Laptop className="h-5 w-5 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAspectRatioMode("mobile")}
                          className={`h-10 px-3 rounded-lg transition cursor-pointer flex items-center justify-center ${aspectRatioMode === "mobile"
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
                          <Smartphone className="h-5 w-5 shrink-0" />
                        </button>
                      </div>

                      {/* GROUP 3: Pitch Interactive Elements (Ballon & Adversaires & Noms & Volets) */}
                      <div className={`flex items-center gap-1.5 h-11 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
                        <button
                          type="button"
                          onClick={() => setShowBall(!showBall)}
                          className={`h-10 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${showBall
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
                          <span className="text-lg leading-none shrink-0" aria-hidden="true">
                            {getSportBallInfo(activeSport).emoji}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOpponents(!showOpponents)}
                          className={`h-10 px-3 rounded-lg transition cursor-pointer flex items-center justify-center ${showOpponents
                            ? isModernSleek
                              ? "bg-rose-50 border border-rose-400 text-rose-700 shadow-xs font-black"
                              : "bg-[#28131a] border border-rose-500/60 text-rose-400 shadow-xs"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title={showOpponents ? t.tactics.pitchModes.opponentsHide : t.tactics.pitchModes.opponentsShow}
                          aria-label={showOpponents ? t.tactics.pitchModes.opponentsHide : t.tactics.pitchModes.opponentsShow}
                        >
                          <Users className="h-5 w-5 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPlayerNames(!showPlayerNames)}
                          className={`h-10 w-10 rounded-lg transition cursor-pointer flex items-center justify-center ${!showPlayerNames
                            ? isModernSleek
                              ? "bg-amber-50 border border-amber-400 text-amber-800 shadow-xs font-black"
                              : "bg-[#382810] border border-amber-400 text-amber-300 shadow-xs font-black"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title={showPlayerNames ? t.tactics.pitchModes.namesHide : t.tactics.pitchModes.namesShow}
                          aria-label={showPlayerNames ? t.tactics.pitchModes.namesHide : t.tactics.pitchModes.namesShow}
                        >
                          <Hash className="h-5 w-5 shrink-0" />
                        </button>
                        {/* Afficher / masquer les rôles des joueurs (capitaine, coups de pied arrêtés…) */}
                        <button
                          type="button"
                          onClick={() => setShowPlayerRoles(!showPlayerRoles)}
                          aria-pressed={!showPlayerRoles}
                          className={`h-10 w-10 rounded-lg transition cursor-pointer flex items-center justify-center ${!showPlayerRoles
                            ? isModernSleek
                              ? "bg-amber-50 border border-amber-400 text-amber-800 shadow-xs font-black"
                              : "bg-[#382810] border border-amber-400 text-amber-300 shadow-xs font-black"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title={playerRolesToggleLabel}
                          aria-label={playerRolesToggleLabel}
                        >
                          <Tag className="h-5 w-5 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const shouldCollapse = !isTeamAPanelCollapsed || !isTeamBPanelCollapsed;
                            setIsTeamAPanelCollapsed(shouldCollapse);
                            setIsTeamBPanelCollapsed(shouldCollapse);
                          }}
                          className={`h-10 w-10 rounded-lg transition cursor-pointer flex items-center justify-center ${isTeamAPanelCollapsed && isTeamBPanelCollapsed
                            ? isModernSleek
                              ? "bg-purple-50 border border-purple-400 text-purple-700 shadow-xs font-black"
                              : "bg-[#361942] border border-purple-400 text-purple-200 shadow-xs font-black"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
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
                          <Columns className="h-5 w-5 shrink-0" />
                        </button>
                      </div>

                      {/* GROUP 3.5: Représentation des Joueurs (Fullscreen) */}
                      <div
                        className={`flex items-center gap-1.5 h-11 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}
                        title={t.tactics.pitchModes.repTitle}
                      >
                        <button
                          type="button"
                          onClick={() => setPlayerRepresentation("dot")}
                          className={`h-10 w-10 rounded-lg transition cursor-pointer flex items-center justify-center ${playerRepresentation === "dot"
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
                          <Circle className="h-5 w-5 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlayerRepresentation("jersey")}
                          className={`h-10 w-10 rounded-lg transition cursor-pointer flex items-center justify-center ${playerRepresentation === "jersey"
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
                          <Shirt className="h-5 w-5 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPlayerRepresentation("head")}
                          className={`h-10 w-10 rounded-lg transition cursor-pointer flex items-center justify-center ${playerRepresentation === "head"
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
                          <User className="h-5 w-5 shrink-0" />
                        </button>
                      </div>

                      <div className={`h-6 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1f293d]"}`} />

                      {/* GROUP 4: Drawing Tools (Select, Move, Line, Arrow, Draw) */}
                      <div className={`flex items-center gap-1.5 h-11 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
                        {/* Sélecteur */}
                        <button
                          type="button"
                          onClick={() => { setActiveTool("select"); setDrawingTool("brush"); }}
                          className={`h-10 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeTool === "select"
                            ? isModernSleek
                              ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                              : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title={t.tactics.tools.select}
                          aria-label={t.tactics.tools.select}
                        >
                          <MousePointer className="h-5 w-5 shrink-0" />
                        </button>

                        {/* Déplacer */}
                        <button
                          type="button"
                          onClick={() => { setActiveTool("move"); setDrawingTool("brush"); setSelectedStrokeIndex(null); }}
                          className={`h-10 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeTool === "move"
                            ? isModernSleek
                              ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                              : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title={t.tactics.tools.move}
                          aria-label={t.tactics.tools.move}
                        >
                          <Move className="h-5 w-5 shrink-0" />
                        </button>

                        {/* Ligne Pleine & Pointillée */}
                        <button
                          type="button"
                          onClick={handleToggleLineTool}
                          className={`h-10 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeTool === "line"
                            ? isModernSleek
                              ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                              : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
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
                            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="4" y1="20" x2="20" y2="4" strokeDasharray="3 3" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="5" y1="19" x2="19" y2="5" />
                            </svg>
                          )}
                        </button>

                        {/* Lier des joueurs */}
                        <button
                          type="button"
                          onClick={() => { setActiveTool(activeTool === "link" ? "select" : "link"); setSelectedStrokeIndex(null); }}
                          className={`h-10 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeTool === "link"
                            ? isModernSleek
                              ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                              : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title="Lier des joueurs : touchez les joueurs un à un pour les relier par une ligne qui les suit"
                          aria-label="Lier des joueurs"
                          aria-pressed={activeTool === "link"}
                        >
                          <PlayerLinkIcon className="h-5 w-5 shrink-0" />
                        </button>

                        {/* Flèche */}
                        <button
                          type="button"
                          onClick={() => { setActiveTool("arrow"); setDrawingTool("arrow-direct"); setSelectedStrokeIndex(null); }}
                          className={`h-10 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeTool === "arrow"
                            ? isModernSleek
                              ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                              : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title={t.tactics.tools.arrow}
                          aria-label={t.tactics.tools.arrow}
                        >
                          <ArrowUpRight className="h-5 w-5 shrink-0" />
                        </button>

                        {/* Courbe fléchée */}
                        <button
                          type="button"
                          onClick={handleToggleCurveTool}
                          className={`h-10 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeTool === "curve"
                            ? isModernSleek
                              ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                              : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title={curveToolTitle}
                          aria-label="Courbe fléchée"
                          aria-pressed={activeTool === "curve"}
                        >
                          <CurveArrowIcon dashed={activeTool === "curve" && drawingTool === "curve-arrow-dashed"} className="h-5 w-5 shrink-0" />
                        </button>

                        {/* Crayon */}
                        <button
                          type="button"
                          onClick={() => { setActiveTool("draw"); setDrawingTool("brush"); setSelectedStrokeIndex(null); }}
                          className={`h-10 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${activeTool === "draw"
                            ? isModernSleek
                              ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                              : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                            : isModernSleek
                              ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                            }`}
                          title={t.tactics.tools.draw}
                          aria-label={t.tactics.tools.draw}
                        >
                          <Pencil className="h-5 w-5 shrink-0" />
                        </button>
                      </div>

                      <div className={`h-6 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1f293d]"}`} />

                      {/* Couleur de trait bleue */}
                      <button
                        type="button"
                        onClick={() => setDrawColor("#3b82f6")}
                        className={`h-10 w-11 rounded-lg shadow-xs cursor-pointer flex items-center justify-center transition ${isModernSleek
                          ? "bg-slate-100 border border-blue-400 hover:bg-slate-200"
                          : "bg-[#0c1017] border border-[#3b82f6]/50 hover:bg-[#151e2d]"
                          }`}
                        title={`${t.tactics.strokeSection} : #3b82f6`}
                        aria-label={`${t.tactics.strokeSection} : #3b82f6`}
                      >
                        <span className="w-4 h-4 rounded-full bg-[#3b82f6] border border-white/50 ring-2 ring-[#3b82f6]/50 shadow-sm" />
                      </button>

                      {/* Sélecteur d'épaisseur */}
                      <div className={`flex items-center gap-1.5 h-11 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
                        {[
                          { size: 2, label: t.tactics.pitchModes.strokeThin, dot: "w-2 h-2" },
                          { size: 3, label: t.tactics.pitchModes.strokeMedium, dot: "w-3 h-3" },
                          { size: 5, label: t.tactics.pitchModes.strokeThick, dot: "w-4 h-4" }
                        ].map(({ size, label, dot }) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setDrawSize(size)}
                            className={`h-10 w-9 rounded-md transition cursor-pointer flex items-center justify-center ${drawSize === size
                              ? isModernSleek
                                ? "bg-white text-blue-600 border border-blue-300 shadow-xs font-bold"
                                : "bg-[#132338] text-[#3b82f6] border border-[#3b82f6]/50 font-bold"
                              : isModernSleek
                                ? "bg-slate-200/80 border border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-300/80"
                                : "bg-[#0c1017] border border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#151e2d]"
                              }`}
                            title={`${t.tactics.strokeSection}: ${label}`}
                            aria-label={`${t.tactics.strokeSection}: ${label}`}
                          >
                            <span className={`${dot} rounded-full bg-current`} />
                          </button>
                        ))}
                      </div>

                      {/* Effacer tous les tracés */}
                      <button
                        type="button"
                        onClick={handleClearDrawings}
                        disabled={drawingActions.length === 0}
                        className={`h-10 px-3 rounded-lg border flex items-center justify-center transition cursor-pointer ${drawingActions.length > 0
                          ? isModernSleek
                            ? "bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-700 shadow-xs"
                            : "bg-rose-950/80 hover:bg-rose-900 border-rose-800 text-rose-300 hover:text-white shadow-sm"
                          : isModernSleek
                            ? "bg-slate-200/60 border-slate-300 text-slate-400 cursor-not-allowed"
                            : "bg-[#0c1017] border-[#1e293b] text-slate-600 cursor-not-allowed"
                          }`}
                        title={t.tactics.tools.clearDrawings}
                        aria-label={t.tactics.tools.clearDrawings}
                      >
                        <Trash2 className="w-5 h-5 shrink-0" />
                      </button>

                      <div className={`h-6 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1f293d]"}`} />

                      {/* GROUP 5: Zooms (Échelle Terrain & Taille Joueurs) */}
                      <div className={`flex items-center gap-2 h-11 ${isModernSleek ? "bg-slate-100 p-0.5 px-2 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 px-2 rounded-lg border border-[#1a2130]"}`}>
                        {/* Pitch Zoom */}
                        <div title={t.tactics.pitchModes.pitchZoom} className="flex items-center gap-1">
                          <ZoomIn className={`h-5 w-5 shrink-0 ${isModernSleek ? "text-slate-600" : "text-[#718096]"}`} />
                          <button
                            type="button"
                            onClick={() =>
                              setZoomScale((prev) => {
                                const next = Math.max(70, prev - 10);
                                if (next === 100) setPitchPan({ x: 0, y: 0 });
                                return next;
                              })
                            }
                            className={`h-10 w-9 rounded-md flex items-center justify-center text-base font-bold transition cursor-pointer ${isModernSleek
                              ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
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
                            className={`text-xs font-black w-10 text-center font-mono cursor-pointer transition ${isModernSleek ? "text-slate-900 hover:text-emerald-700" : "text-white hover:text-[#00E599]"}`}
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
                            className={`h-10 w-9 rounded-md flex items-center justify-center text-base font-bold transition cursor-pointer ${isModernSleek
                              ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                              }`}
                            title={t.tactics.pitchModes.zoomIn}
                          >
                            +
                          </button>
                        </div>

                        <div className={`h-6 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1a2130]"}`} />

                        {/* Players Scale */}
                        <div title={t.tactics.pitchModes.playerZoom} className="flex items-center gap-1">
                          <User className={`h-5 w-5 shrink-0 ${isModernSleek ? "text-slate-600" : "text-[#718096]"}`} />
                          <button
                            type="button"
                            onClick={() => setPlayerScale(prev => Math.max(20, prev - 10))}
                            className={`h-10 w-9 rounded-md flex items-center justify-center text-base font-bold transition cursor-pointer ${isModernSleek
                              ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                              }`}
                            title={t.tactics.pitchModes.playerZoomOut}
                          >
                            -
                          </button>
                          <span className={`text-xs font-black w-10 text-center font-mono ${isModernSleek ? "text-slate-900" : "text-white"}`}>{playerScale}%</span>
                          <button
                            type="button"
                            onClick={() => setPlayerScale(prev => Math.min(130, prev + 10))}
                            className={`h-10 w-9 rounded-md flex items-center justify-center text-base font-bold transition cursor-pointer ${isModernSleek
                              ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                              : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                              }`}
                            title={t.tactics.pitchModes.playerZoomIn}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className={`h-6 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1f293d]"}`} />

                      {/* GROUP 6: Quitter plein écran */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={togglePitchFullscreen}
                          className="h-11 px-4 bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 font-black text-xs shadow-md shadow-rose-950/50"
                          title={t.tactics.pitchModes.fullscreenExit}
                          aria-label={t.tactics.pitchModes.fullscreenExit}
                        >
                          <Minimize2 className="h-5 w-5 shrink-0 stroke-[2.5]" />
                          <span className="uppercase tracking-wider text-xs">{t.tactics.pitchModes.fullscreenExit}</span>
                        </button>
                      </div>
                    </div>

                      {!isLiveMatchMode && isAnimationCreatorOpen && renderAnimationStrip()}

                    </div>
                  )}

                  {/* PITCH AND FLANKING SIDE PANELS ROW (IN FULLSCREEN: ROW WITH MON EQUIPE & MON ADVERSAIRE) */}
                  <div
                    className={`w-full flex-1 flex ${isPitchFullscreen ? "flex-row items-center justify-center gap-2 xl:gap-3.5 min-h-0 relative my-auto px-1 sm:px-2" : "flex-col items-center justify-center"}`}
                    style={zoomedPitchReservedHeight ? { minHeight: zoomedPitchReservedHeight, flexShrink: 0 } : undefined}
                  >
                    {isPitchFullscreen && renderTeamAPanel(true)}
                    {/* Animation ouverte : le terrain zoomé garde toute sa hauteur ; s'il est déplacé, il reste contenu dans sa zone pour ne jamais passer sur la barre d'outils */}
                    <div
                      className={`${isPitchFullscreen ? "flex-1 flex flex-col items-center justify-center h-full min-w-0 relative z-0" : "w-full flex flex-col items-center justify-center relative z-0"} ${!isLiveMatchMode && isAnimationCreatorOpen && (zoomScale !== 100 || pitchPan.x !== 0 || pitchPan.y !== 0) ? "overflow-y-clip" : ""}`}
                      style={zoomedPitchReservedHeight ? { minHeight: zoomedPitchReservedHeight } : undefined}
                    >
                      {/* Visual Pitch Box */}
                      <div
                        ref={pitchBoxRef}
                        onMouseDown={handlePitchPanStart}
                        onTouchStart={handlePitchPanStart}
                        className={`relative z-0 w-full mx-auto my-auto shrink-0 rounded-3xl overflow-hidden select-none ${isModernSleek
                          ? "tb-pitch-box border border-emerald-600/25 shadow-xl bg-[#032e22]"
                          : "tb-pitch-box border border-[#00E599]/25 shadow-2xl bg-[#06140f]"
                          } ${isPanningPitch
                            ? "cursor-grabbing transition-none"
                            : (zoomScale !== 100 || activeTool === "move") && (activeTool === "select" || activeTool === "move")
                              ? "cursor-grab transition-transform duration-200 ease-out"
                              : "transition-all duration-300 ease-in-out"
                          }`}
                        style={{
                          aspectRatio: `${currentPitchRatio}`,
                          maxWidth: pitchMaxWidth,
                          maxHeight: pitchMaxHeight,
                          transform:
                            zoomScale !== 100 || pitchPan.x !== 0 || pitchPan.y !== 0
                              ? `translate3d(${pitchPan.x}px, ${pitchPan.y}px, 0) scale(${zoomScale / 100})`
                              : undefined,
                          transformOrigin: "center center",
                        }}
                      >

                        {/* Floating Quick Drawing Controls Bar overlay on Pitch - Only shown when a stroke is clicked in SELECT mode */}
                        {activeTool === "select" && selectedStrokeIndex !== null && drawingActions[selectedStrokeIndex] && (
                          <div className="absolute top-2.5 right-12 sm:right-32 z-40 flex items-center gap-1.5 bg-[#0d1117]/95 border border-[#00E599]/60 p-1.5 px-3 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in pointer-events-auto">
                            <span className="text-[10px] font-black text-[#00E599] flex items-center gap-1 mr-1">
                              <Pencil className="w-3.5 h-3.5" />
                              <span>{t.tactics.drawingOverlay.selectedStroke}</span>
                            </span>

                            <div className="h-4 w-px bg-[#2a364f]" />

                            <button
                              onClick={handleDeleteSelectedStroke}
                              className="px-2.5 py-1 bg-rose-950/90 hover:bg-rose-900 border border-rose-700/80 text-rose-200 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-md"
                              title={t.tactics.drawingOverlay.deleteStrokeTooltip}
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>{t.tactics.drawingOverlay.deleteStroke}</span>
                            </button>

                            <button
                              onClick={handleUndo}
                              className="px-2 py-1 bg-[#172233] hover:bg-[#202f4a] border border-[#233149] text-slate-200 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title={t.tactics.drawingOverlay.undoTooltip}
                            >
                              <RotateCcw className="w-3 h-3 text-slate-300" />
                              <span>{t.tactics.drawingOverlay.undo}</span>
                            </button>

                            <button
                              onClick={handleClearDrawings}
                              className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/90 border border-rose-800/60 text-rose-300 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title={t.tactics.drawingOverlay.clearAllTooltip}
                            >
                              <span>{t.tactics.drawingOverlay.clearAll}</span>
                            </button>

                            <button
                              onClick={() => setSelectedStrokeIndex(null)}
                              className="ml-1 p-0.5 hover:bg-[#1f293d] text-slate-400 hover:text-white rounded-lg transition"
                              title={t.tactics.drawingOverlay.closeMenu}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <div
                          ref={pitchContainerRef}
                          className="absolute left-0 top-0 touch-none transition-all duration-300"
                          style={{
                            width: terrainComplet ? "100%" : (aspectRatioMode === "mobile" ? "100%" : "200%"),
                            height: terrainComplet ? "100%" : (aspectRatioMode === "mobile" ? "200%" : "100%"),
                            left: 0,
                            top: 0,
                            ...cornerFlagVars,
                          }}
                        >
                          {/* Ground pitch texture lines rendering */}
                          <Pitch sport={activeSport} format={activeFormat} isPortrait={aspectRatioMode === "mobile"} centerLogo={showClubLogoOnPitch ? clubLogo : undefined} showZones={isFootballBoard && showPitchZones} showThirds={isFootballBoard && showPitchThirds} thirdsLabels={pitchThirdsLabels} />


                          {/* Corner Flags Overlay */}
                          {activeSport === "football" && !(aspectRatioMode === "mobile") && (
                            <>
                              <div className="absolute top-[var(--cf-y)] left-[var(--cf-x)] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" title={t.tactics.pitchBadges.cornerFlag} />
                              <div className="absolute top-[var(--cf-y)] right-[var(--cf-x)] translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" title={t.tactics.pitchBadges.cornerFlag} />
                              <div className="absolute bottom-[var(--cf-y)] left-[var(--cf-x)] -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" title={t.tactics.pitchBadges.cornerFlag} />
                              <div className="absolute bottom-[var(--cf-y)] right-[var(--cf-x)] translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" title={t.tactics.pitchBadges.cornerFlag} />
                            </>
                          )}

                          {activeSport === "football" && aspectRatioMode === "mobile" && (
                            <>
                              {/* Portrait Corner flags */}
                              <div className="absolute top-[var(--cf-x)] left-[var(--cf-y)] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" />
                              <div className="absolute top-[var(--cf-x)] right-[var(--cf-y)] translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" />
                              <div className="absolute bottom-[var(--cf-x)] left-[var(--cf-y)] -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" />
                              <div className="absolute bottom-[var(--cf-x)] right-[var(--cf-y)] translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" />
                            </>
                          )}

                          {/* Dynamic canvas drawing overlay */}
                          <canvas
                            ref={canvasRef}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onTouchStart={handleCanvasMouseDown}
                            onTouchMove={handleCanvasMouseMove}
                            onTouchEnd={handleCanvasMouseUp}
                            className={`absolute inset-0 w-full h-full z-10 ${activeTool === "select"
                              ? (drawingActions.length > 0 ? "pointer-events-auto cursor-pointer" : "pointer-events-none cursor-default")
                              : activeTool === "move"
                                ? "pointer-events-none cursor-default"
                                : "cursor-crosshair pointer-events-auto"
                              }`}
                          />

                          {/* Poignées de la courbe fléchée : départ, 2 points de contrôle, arrivée */}
                          {curveHandleIdx !== null && drawingActions[curveHandleIdx].points.slice(0, 4).map((pt, k) => {
                            const isControl = k === 1 || k === 2;
                            return (
                              <div
                                key={`curve-handle-${k}`}
                                role="button"
                                aria-label={isControl ? `Point de contrôle ${k} de la courbe` : k === 0 ? "Départ de la courbe" : "Arrivée de la courbe"}
                                title={isControl ? "Glissez pour cintrer la courbe" : "Glissez pour déplacer ce bout de la courbe"}
                                onMouseDown={(e) => startCurveHandleDrag(curveHandleIdx, k, e)}
                                onTouchStart={(e) => startCurveHandleDrag(curveHandleIdx, k, e)}
                                className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing border-2 shadow-md ${isControl ? "w-4 h-4 rounded-full bg-white border-[#00E599]" : "w-3.5 h-3.5 rounded-sm bg-[#00E599] border-white"}`}
                                style={{
                                  left: `${aspectRatioMode === "mobile" ? pt.y : pt.x}%`,
                                  top: `${aspectRatioMode === "mobile" ? 100 - pt.x : pt.y}%`,
                                }}
                              />
                            );
                          })}

                          {/* DRAGGABLE TOKENS */}
                          <div ref={tokensLayerRef} className="absolute inset-0 z-20 pointer-events-none">
                            {/* Liaisons entre joueurs (sous les pions) */}
                            <PlayerLinksOverlay
                              links={currentTokens.filter((t) => t.type === "link")}
                              draft={activeTool === "link" ? linkDraft : []}
                              draftColor={linkColor}
                              draftDashed={linkDashed}
                              layerRef={tokensLayerRef}
                              selectedLinkId={selectedLinkId}
                              selectable={activeTool === "select"}
                              onSelect={setSelectedLinkId}
                              onDelete={handleDeleteLink}
                              followMs={(isPlaying ? playbackSpeed : 350) + 150}
                            />
                            {currentTokens.map((token) => {

                              // Liaison : tracée par le calque des liaisons
                              if (token.type === "link") return null;

                              // Handle visibility toggles
                              if (token.type === "ball" && !showBall) return null;
                              if (token.type === "player_b" && !showOpponents) return null;

                              // Joueur placé dans le mur : affiché dans le mur, plus seul sur le terrain
                              if (isInWall(token, currentTokens)) return null;

                              // Mur sur coup franc : rangée de places (numéro du joueur qui l'occupe), glissable d'un bloc.
                              // Un appui ouvre son panneau (places, rotation) ; on y entre en glissant un joueur dessus.
                              if (token.type === "wall") {
                                const team: WallTeam = token.wallTeam === "away" ? "away" : "home";
                                if (team === "away" && !showOpponents) return null;
                                const count = Math.max(WALL_MIN, Math.min(WALL_MAX, token.wallCount || WALL_DEFAULT));
                                const members = wallMembers(team, count);
                                const angle = wallAngleOf(token) - (aspectRatioMode === "mobile" ? 90 : 0);
                                const teamColor = team === "away" ? (teamBColor || "#e11d48") : (teamAColor || "#00E599");
                                const isActive = selectedTokenId === token.id || wallPopover?.team === team;
                                const isDropTarget = wallDropTarget?.team === team;
                                const named = members.filter((m): m is Token => !!m).map((m) => (m.number ? `${m.number}. ${m.name}` : m.name));
                                return (
                                  <div
                                    key={token.id}
                                    onMouseDown={(e) => { e.stopPropagation(); handleTokenStartDrag(token.id, e); }}
                                    onTouchStart={(e) => { e.stopPropagation(); handleTokenStartDrag(token.id, e); }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isDraggingTokenRef.current || Date.now() - dragEndTimeRef.current < 250) return;
                                      const r = e.currentTarget.getBoundingClientRect();
                                      setWallPopover(wallPopover?.team === team ? null : { team, left: r.left + r.width / 2, top: r.bottom + 10 });
                                    }}
                                    className="absolute pointer-events-auto select-none cursor-grab active:cursor-grabbing"
                                    title={`Mur : ${named.length}/${count} joueur${count > 1 ? "s" : ""}${named.length ? ` (${named.join(", ")})` : ""}. Glissez un joueur dessus pour l'ajouter ; appuyez pour régler le mur.`}
                                    style={{
                                      left: `${aspectRatioMode === "mobile" ? token.y : token.x}%`,
                                      top: `${aspectRatioMode === "mobile" ? 100 - token.x : token.y}%`,
                                      transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${playerScale / 100})`,
                                      zIndex: 31,
                                      transition: selectedTokenId === token.id ? "none" : `left 350ms ease-in-out, top 350ms ease-in-out`,
                                    }}
                                    data-wall-team={team}
                                  >
                                    <div className={`relative flex items-center gap-[2px] p-[3px] rounded-full bg-black/45 border shadow-xl transition ${isDropTarget ? "border-white ring-4 ring-white/50 scale-105" : isActive ? "border-white ring-2 ring-white/40" : "border-white/25"}`}>
                                      {members.map((m, i) => (
                                        <span
                                          key={i}
                                          className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-[10px] font-black leading-none ${m ? "" : "border-dashed"} ${isDropTarget && wallDropTarget?.slot === i ? "ring-2 ring-white" : ""}`}
                                          style={m
                                            ? { background: teamColor, borderColor: "#0d131f", color: team === "away" ? "#ffffff" : "#0d131f" }
                                            : { background: "rgba(255,255,255,0.08)", borderColor: teamColor, color: teamColor }}
                                        >
                                          {/* Le numéro reste lisible quel que soit l'angle du mur */}
                                          <span style={{ transform: `rotate(${-angle}deg)` }}>{m ? (m.number ?? "•") : ""}</span>
                                        </span>
                                      ))}
                                      {/* Poignée de rotation (panneau du mur ouvert) : tourner le mur à la main */}
                                      {wallPopover?.team === team && (
                                        <span
                                          role="slider"
                                          aria-label="Tourner le mur"
                                          aria-valuenow={Math.round(wallAngleOf(token))}
                                          title="Glisser pour tourner le mur"
                                          onMouseDown={(e) => handleStartWallRotate(team, e)}
                                          onTouchStart={(e) => handleStartWallRotate(team, e)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-slate-900 shadow-lg flex items-center justify-center cursor-alias"
                                        >
                                          <RotateCw className="w-3 h-3 text-slate-900" />
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }


                              // Custom visual profiles
                              let tokenBg = "bg-[#090d14] border-[#00E599] text-[#00E599]"; // Team A looks like neon green matching layout
                              let iconContent: React.ReactNode = token.number;

                              if (token.type === "player_b") {
                                tokenBg = "bg-rose-950/90 border-rose-500 text-rose-200";
                              } else if (token.type === "referee") {
                                tokenBg = "bg-slate-200 border-slate-400 text-slate-900";
                                iconContent = "🏁";
                              } else if (token.type === "ball") {
                                tokenBg = "bg-transparent";
                                iconContent = getSportBallInfo(activeSport).emoji;
                              }

                              const isSelected = selectedTokenId === token.id;
                              const isPlayer = token.type.startsWith("player");
                              const playerGoals = isPlayer ? matchEvents.filter(e => e.type === "goal" && e.player === token.name).length : 0;
                              const playerAssists = isPlayer ? matchEvents.filter(e => (e.type === "assist" && e.player === token.name) || (e.type === "goal" && e.assister === token.name)).length : 0;
                              const hasYellowCard = isPlayer && ((token.yellowCards && token.yellowCards > 0) || matchEvents.some(e => e.type === "yellow" && e.player === token.name));
                              const isJerseyMode = isPlayer && playerRepresentation === "jersey";
                              const isHeadMode = isPlayer && playerRepresentation === "head";

                              // Transition style for smooth animation of player movement
                              // Ballon porté par le joueur en cours de glisser : il le suit sans retard
                              const isCurrentlyDragging = selectedTokenId === token.id
                                || (token.type === "ball" && !!token.ballCarrierId && selectedTokenId === token.ballCarrierId);
                              const isMagnetTarget = ballMagnetTargetId === token.id;
                              const transitionStyle = isCurrentlyDragging
                                ? "none"
                                : `left ${isPlaying ? playbackSpeed * 0.95 : 350}ms ease-in-out, top ${isPlaying ? playbackSpeed * 0.95 : 350}ms ease-in-out`;

                              return (
                                <div
                                  key={token.id}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleTokenStartDrag(token.id, e);
                                  }}
                                  onTouchStart={(e) => {
                                    e.stopPropagation();
                                    handleTokenStartDrag(token.id, e);
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Outil « Lier » : le joueur touché rejoint la chaîne en cours
                                    if (activeTool === "link") {
                                      if (token.type.startsWith("player")) handleLinkTap(token.id);
                                      return;
                                    }
                                    // Lors du déplacement d'un joueur sur le terrain, ne pas ouvrir la fenêtre de remplacement
                                    if (isDraggingTokenRef.current || Date.now() - dragEndTimeRef.current < 250) {
                                      return;
                                    }
                                    if (token.type.startsWith("player")) {
                                      if (isLiveMatchMode) {
                                        setLiveActionToken(token);
                                        return;
                                      }
                                      // Hors mode live, un simple appui ne fait que sélectionner le joueur :
                                      // la fiche s'ouvre au double appui (le double-clic natif n'est pas fiable sur tablette)
                                      const now = Date.now();
                                      const last = lastTokenTapRef.current;
                                      if (last && last.id === token.id && now - last.at < 350) {
                                        lastTokenTapRef.current = null;
                                        setEditingToken(token);
                                        setQuickActionToken(token);
                                        setSubPickerToken(null);
                                      } else {
                                        lastTokenTapRef.current = { id: token.id, at: now };
                                      }
                                    }
                                  }}
                                  onContextMenu={(e) => {
                                    if (token.type.startsWith("player")) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (isDraggingTokenRef.current || Date.now() - dragEndTimeRef.current < 250) return;
                                      // Clic droit / appui long : fiche du joueur seule (le remplacement passe par « Remplacer ce joueur »)
                                      setEditingToken(token);
                                      setQuickActionToken(token);
                                      setSubPickerToken(null);
                                    }
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (isDraggingTokenRef.current || Date.now() - dragEndTimeRef.current < 250) return;
                                    if (token.type.startsWith("player")) {
                                      setEditingToken(token);
                                      setQuickActionToken(token);
                                      setSubPickerToken(null);
                                    }
                                  }}
                                  data-board-token="true"
                                  className="absolute pointer-events-auto select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center transition-transform"
                                  title={
                                    token.type.startsWith("player")
                                      ? isLiveMatchMode
                                        ? t.tactics.playerCard.tokenHoverLive(token.name)
                                        : t.tactics.playerCard.tokenHoverSub(token.name)
                                      : token.type === "ball"
                                        ? getSportBallInfo(activeSport).hoverTitle
                                        : t.tactics.playerCard.tokenHoverDrag
                                  }
                                  style={{
                                    left: `${aspectRatioMode === "mobile" ? token.y : token.x}%`,
                                    top: `${aspectRatioMode === "mobile" ? 100 - token.x : token.y}%`,
                                    transform: `translate(-50%, -50%) scale(${(isSelected ? 1.2 : 1) * (playerScale / 100)})`,
                                    zIndex: token.type === "ball" ? 40 : 30,
                                    transition: transitionStyle,
                                  }}
                                >
                                  {/* Representation: Ballon spécifique au sport, Buste, Tête ou Pastille */}
                                  {token.type === "ball" ? (
                                    <div
                                      className={`${activeSport === "rugby"
                                          ? "w-8 h-6 sm:w-9 sm:h-7"
                                          : "w-6 h-6 sm:w-7 sm:h-7"
                                        } flex items-center justify-center relative transition-transform ${isSelected ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 rounded-full scale-110" : ""
                                        }`}
                                    >
                                      <PitchBallGraphic sport={activeSport} />
                                    </div>
                                  ) : (
                                    <div
                                      className={`${isJerseyMode || isHeadMode
                                          ? "w-9 h-10 sm:w-10 sm:h-11 flex items-center justify-center relative drop-shadow-xl"
                                          : "w-9 h-9 sm:w-10 sm:h-10 text-xs rounded-full border-2 shadow-xl " + tokenBg
                                        } flex items-center justify-center font-black transition-all relative`}
                                      data-link-anchor={token.id}
                                    >
                                      {/* Outil « Lier » : joueur déjà dans la chaîne en cours (numéro d'ordre) */}
                                      {activeTool === "link" && linkDraft.includes(token.id) && (
                                        <span
                                          aria-hidden
                                          className="pointer-events-none absolute -inset-2 rounded-full border-2"
                                          style={{ borderColor: linkColor, boxShadow: `0 0 12px ${linkColor}` }}
                                        >
                                          <span
                                            className="absolute -top-2 -left-2 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-slate-900"
                                            style={{ background: linkColor }}
                                          >
                                            {linkDraft.indexOf(token.id) + 1}
                                          </span>
                                        </span>
                                      )}
                                      {/* Aimant du ballon : ce joueur recevra le ballon au lâcher */}
                                      {isMagnetTarget && (
                                        <span
                                          aria-hidden
                                          data-testid="ball-magnet-target"
                                          className="pointer-events-none absolute -inset-2 rounded-full border-2 border-amber-300 bg-amber-300/15 shadow-[0_0_14px_rgba(252,211,77,0.8)] animate-pulse"
                                        />
                                      )}
                                      {isJerseyMode ? (
                                        /* 1. BUSTE (Maillot athlétique avec numéro sur la poitrine) */
                                        <svg viewBox="0 0 44 48" className="w-full h-full overflow-visible" fill="none">
                                          <path
                                            d="M 15 4 C 18 8, 26 8, 29 4 L 41 10 L 43 21 L 35 24 L 33 19 L 33 45 C 33 46.5, 32 47.5, 30.5 47.5 L 13.5 47.5 C 12 47.5, 11 46.5, 11 45 L 11 19 L 9 24 L 1 21 L 3 10 Z"
                                            fill={token.type === "player_b" ? (teamBColor || "#e11d48") : (teamAColor || "#00E599")}
                                            stroke={token.type === "player_b" ? "#ffffff" : "#0d131f"}
                                            strokeWidth="1.8"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M 11 25 L 11 46 M 33 25 L 33 46"
                                            stroke={token.type === "player_b" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.22)"}
                                            strokeWidth="2"
                                          />
                                          <path
                                            d="M 15 4 C 18 8, 26 8, 29 4"
                                            fill="none"
                                            stroke={token.type === "player_b" ? "#ffffff" : "#0d131f"}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                          />
                                          <line x1="1" y1="21" x2="9" y2="24" stroke={token.type === "player_b" ? "#ffffff" : "#0d131f"} strokeWidth="1.8" />
                                          <line x1="35" y1="24" x2="43" y2="21" stroke={token.type === "player_b" ? "#ffffff" : "#0d131f"} strokeWidth="1.8" />
                                          <text
                                            x="22"
                                            y="33"
                                            textAnchor="middle"
                                            fontSize="15"
                                            fontWeight="900"
                                            fontFamily="system-ui, -apple-system, sans-serif"
                                            fill={token.type === "player_b" ? "#ffffff" : "#090d14"}
                                          >
                                            {token.number ?? token.role ?? ""}
                                          </text>
                                        </svg>
                                      ) : isHeadMode ? (
                                        /* 2. TÊTE DU JOUEUR (Affichage 3D de base avec maillot vert pour joueurs et jaune pour gardien) */
                                        (() => {
                                          const isGK =
                                            activeSport !== "basketball" &&
                                            activeSport !== "rugby" && (
                                              token.role === "G" ||
                                              token.role === "GK" ||
                                              token.role === "GB" ||
                                              token.role === "Gardien" ||
                                              token.number === 1);
                                          const isTeamB = token.type === "player_b";
                                          const defaultHeadSrc = activeSport === "basketball"
                                            ? isTeamB
                                              ? "/images/avatars/basket_opponent_red.png"
                                              : "/images/avatars/basket_player_green.png"
                                            : activeSport === "handball"
                                              ? isGK
                                                ? isTeamB
                                                  ? "/images/avatars/handball_opponent_goalkeeper.png"
                                                  : "/images/avatars/handball_goalkeeper_yellow.png"
                                                : isTeamB
                                                  ? "/images/avatars/handball_opponent_red.png"
                                                  : "/images/avatars/handball_player_green.png"
                                              : activeSport === "rugby"
                                                ? isTeamB
                                                  ? "/images/avatars/rugby_opponent_red.png"
                                                  : "/images/avatars/rugby_player_green.png"
                                                : isGK
                                                  ? isTeamB
                                                    ? "/images/avatars/opponent_goalkeeper.png"
                                                    : "/images/avatars/goalkeeper_yellow.png"
                                                  : isTeamB
                                                    ? "/images/avatars/opponent_red.png"
                                                    : "/images/avatars/player_green.png";

                                          const photoSrc = token.photo
                                            ? (autoTransparentCache[token.photo] || token.photo)
                                            : defaultHeadSrc;

                                          return (
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center relative">
                                              {/* Joueur détouré, sans vignette ni contour : le maillot de l'avatar suffit à distinguer les équipes.
                                                  L'ombre suit la silhouette pour rester lisible sur le gazon. */}
                                              <div className="w-full h-full">
                                                <img
                                                  src={photoSrc}
                                                  alt={token.name}
                                                  className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)]"
                                                />
                                              </div>
                                              {(token.number ?? null) !== null && (
                                                <span
                                                  className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-0.5 rounded-full flex items-center justify-center text-[9px] font-black leading-none shadow-md"
                                                  style={{
                                                    backgroundColor: isTeamB ? (teamBColor || "#e11d48") : (teamAColor || "#00E599"),
                                                    color: isTeamB ? "#ffffff" : "#04120c",
                                                  }}
                                                >
                                                  {token.number}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })()
                                      ) : (
                                        /* 3. PASTILLE (Classique) */
                                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                                          {token.photo && showPlayerNames ? (
                                            <img src={token.photo} alt={token.name} className="w-full h-full object-cover rounded-full" />
                                          ) : (
                                            iconContent
                                          )}
                                        </div>
                                      )}

                                      {/* TOP BADGES ROW (Match stats: Yellow Cards, Goals, Assists, Fitness status) */}
                                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-0.5 z-30 whitespace-nowrap pointer-events-none">
                                        {/* Yellow Card 🟨 */}
                                        {hasYellowCard && (
                                          <span
                                            className="w-3.5 h-4 bg-amber-400 rounded-[1px] border border-amber-200 shadow-md flex items-center justify-center font-black text-[7px] text-amber-950"
                                            title={t.tactics.pitchBadges.yellowCard}
                                          >
                                            🟨
                                          </span>
                                        )}

                                        {/* Goal Scorer / Point Scorer */}
                                        {playerGoals > 0 && (
                                          <span
                                            className="bg-emerald-500 text-slate-950 rounded-full font-black text-[8.5px] h-4 min-w-[16px] px-1 shadow-md border border-emerald-200 flex items-center justify-center leading-none"
                                            title={t.tactics.pitchBadges.scorer(playerGoals)}
                                          >
                                            {activeSport === "rugby" ? "🏉" : activeSport === "basketball" ? "🏀" : activeSport === "handball" ? "🤾" : "⚽"}{playerGoals > 1 ? playerGoals : ""}
                                          </span>
                                        )}

                                        {/* Assist 👟 */}
                                        {playerAssists > 0 && (
                                          <span
                                            className="bg-cyan-400 text-slate-950 rounded-full font-black text-[8.5px] h-4 min-w-[16px] px-1 shadow-md border border-cyan-200 flex items-center justify-center leading-none"
                                            title={t.tactics.pitchBadges.assist(playerAssists)}
                                          >
                                            👟{playerAssists > 1 ? playerAssists : ""}
                                          </span>
                                        )}

                                        {/* Fitness / Availability Status Badge */}
                                        {token.status && token.status !== "normal" && (
                                          <span
                                            className={`w-3.5 h-3.5 rounded-full border border-black shadow-md flex items-center justify-center text-[7.5px] leading-none shrink-0 ${token.status === "excellent"
                                              ? "bg-emerald-500 text-white font-bold"
                                              : token.status === "tired"
                                                ? "bg-amber-500 text-slate-950 font-bold"
                                                : token.status === "injured"
                                                  ? "bg-rose-600 text-white font-bold"
                                                  : token.status === "suspended"
                                                    ? "bg-red-700 text-white font-bold"
                                                    : token.status === "absent"
                                                      ? "bg-slate-500 text-white font-bold"
                                                    : "bg-rose-500 text-white font-bold"
                                              }`}
                                            title={t.tactics.pitchBadges.fitnessTitle(token.status === "excellent"
                                              ? t.tactics.pitchBadges.fitnessFit
                                              : token.status === "tired"
                                                ? t.tactics.pitchBadges.fitnessTired
                                                : token.status === "injured"
                                                  ? t.tactics.pitchBadges.fitnessInjured
                                                  : token.status === "suspended"
                                                    ? t.tactics.pitchBadges.fitnessSuspended
                                                    : token.status === "absent"
                                                      ? "Absent 🚫"
                                                    : token.status
                                            )}
                                          >
                                            {token.status === "excellent"
                                              ? "⚡"
                                              : token.status === "tired"
                                                ? "🥱"
                                                : token.status === "injured"
                                                  ? "🩹"
                                                  : token.status === "suspended"
                                                    ? "🟥"
                                                    : token.status === "absent"
                                                      ? "🚫"
                                                    : "•"}
                                          </span>
                                        )}
                                      </div>

                                      {/* CAPITAINE : « C » cerclé collé au numéro du joueur
                                          (à droite de la pastille du numéro en mode Tête, en haut à droite du joueur sinon) */}
                                      {showPlayerRoles && token.type === "player_a" && setPieceRoles.captain === token.name && (
                                        <span
                                          className={`absolute ${isHeadMode ? "-top-[5px] -right-[19px]" : "-top-1 -right-1.5"} w-3 h-3 rounded-full border-[1.5px] border-amber-300 bg-[#0b0f17]/85 text-amber-300 font-black text-[7px] leading-none flex items-center justify-center shadow-sm z-30 pointer-events-none`}
                                          title={t.tactics.pitchBadges.captain}
                                          aria-label={t.tactics.pitchBadges.captain}
                                        >
                                          C
                                        </span>
                                      )}

                                      {/* LEFT BADGES : rôles du sport (PK, CF, CK au foot ; BUT, OUV, LAN au rugby ; LF, MEN au basket ; 7M, JF au hand).
                                          Petits et calés en bas à gauche du joueur : ils ne masquent ni le numéro ni le joueur,
                                          et laissent la droite libre pour le ballon quand l'équipe attaque vers la droite. */}
                                      {showPlayerRoles && token.type === "player_a" && (() => {
                                        const codes = getPlayerRoleCodes(activeSport, setPieceRoles, token.name);
                                        if (codes.length === 0) return null;
                                        return (
                                          <div className="absolute right-full -mr-1 bottom-0 flex flex-col items-end justify-end gap-px z-30 whitespace-nowrap pointer-events-none">
                                            {codes.map((c) => (
                                              <span
                                                key={c.code}
                                                className={`${ROLE_TONE_CHIP[c.tone]} rounded-[3px] font-black text-[6px] tracking-tight px-[3px] h-[10px] shadow-sm border flex items-center justify-center leading-none`}
                                                title={c.label}
                                              >
                                                {c.code}
                                              </span>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}

                                  {/* Name Label JUST BELOW the token pastille */}
                                  {token.type.startsWith("player") && showPlayerNames && (
                                    <div className={`absolute top-[100%] mt-1 ${isModernSleek
                                      ? "tb-token-label bg-white/85 rounded px-1 text-slate-900 font-bold text-[9px] flex flex-col items-center leading-tight shadow-sm"
                                      : "tb-token-label bg-[#07090e]/60 rounded px-1 text-white font-bold text-[9px] flex flex-col items-center leading-tight"
                                      } whitespace-nowrap pointer-events-none z-20`}>
                                      <span>{token.name}</span>
                                      {token.type === "player_a" && token.role && isNaN(Number(token.role)) && (
                                        <span className={`${isModernSleek ? "text-emerald-700" : "text-[#00E599]"} text-[8px] font-bold`}>{token.role}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                          </div>

                        </div>

                      </div>

                    </div>
                    {isPitchFullscreen && showOpponents && renderTeamBPanel(true)}
                  </div>

                  {/* Petite Boîte à Outils Live Match sous le terrain (dans le viewport principal du terrain, plein écran ou pas) */}
                  {isLiveMatchMode && renderLiveMatchToolbox()}

                  {/* Modale de remplacement joueur (accessible en plein écran et mode normal) */}
                  {renderSubstitutionModal()}

                  {/* Modale complète de fiche joueur (accessible depuis le bouton de la modale de remplacement ou double-clic) */}
                  {renderPlayerEditModal()}

                </div>

              </div>
    </>
  );
}
