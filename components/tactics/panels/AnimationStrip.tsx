"use client";

// Tableau tactique : ancien renderAnimationStrip() de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { type Language, type translations } from "@/lib/i18n";
import { type DrawingAction, type Token } from "@/lib/tactics/types";
import { ChevronLeft, ChevronRight, Pause, Play, Plus, RotateCcw, Save, Share2, Trash } from "lucide-react";

export interface AnimationStripProps {
  activeMatchId: string;
  activeSport: string;
  currentFrameIdx: number;
  drawingActions: DrawingAction[];
  getDefaultPlayersForSport: (sport: string, format?: string) => Token[];
  handleOpenShareSchema: (schema?: any) => Promise<void>;
  isModernSleek: boolean;
  isPlaying: boolean;
  isProOrAdmin: boolean;
  keyframes: Token[][];
  playbackSpeed: number;
  selectedFormationA: string;
  setCurrentFrameIdx: React.Dispatch<React.SetStateAction<number>>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaveAnimationMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaveModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setPlaybackSpeed: React.Dispatch<React.SetStateAction<number>>;
  setSaveTacticMatchId: React.Dispatch<React.SetStateAction<string>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setTacticName: React.Dispatch<React.SetStateAction<string>>;
  t: (typeof translations)[Language];
}

export default function AnimationStrip({
  activeMatchId,
  activeSport,
  currentFrameIdx,
  drawingActions,
  getDefaultPlayersForSport,
  handleOpenShareSchema,
  isModernSleek,
  isPlaying,
  isProOrAdmin,
  keyframes,
  playbackSpeed,
  selectedFormationA,
  setCurrentFrameIdx,
  setIsCheckoutOpen,
  setIsPlaying,
  setIsSaveAnimationMode,
  setIsSaveModalOpen,
  setKeyframes,
  setPlaybackSpeed,
  setSaveTacticMatchId,
  setSleekToastMessage,
  setTacticName,
  t,
}: AnimationStripProps) {
  return (
  <div id="animation-creator-panel" className="basis-full w-full text-xs animate-fade-in">
                  {/* Main Animation Toolbar Row - Compact & Icon-only */}
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl border transition-colors ${isModernSleek
                      ? "bg-slate-50 border-slate-200"
                      : "bg-[#121926] border-[#1f293d]/80"
                      }`}
                  >

                    {/* Left: Section Badge & Speed Pills */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${isModernSleek ? "text-purple-700" : "text-purple-300"
                          }`}
                      >
                        <span>🎬</span>
                        <span className="hidden sm:inline">ANIMATION</span>
                      </span>

                      <div className={`h-4 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1f293d]"}`} />

                      {/* Vitesse de lecture */}
                      <div
                        className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${isModernSleek
                          ? "bg-white border-slate-200 shadow-2xs"
                          : "bg-[#090d14] border-[#1a2130]"
                          }`}
                      >
                        <span
                          className={`text-[9px] font-black uppercase px-1 ${isModernSleek ? "text-slate-400" : "text-slate-500"
                            }`}
                        >
                          ⚡
                        </span>
                        {[500, 1000, 1500, 2000].map((speed) => {
                          const active = playbackSpeed === speed;
                          return (
                            <button
                              key={speed}
                              onClick={() => setPlaybackSpeed(speed)}
                              className={`h-6 px-1.5 text-[8.5px] font-black rounded-md transition cursor-pointer ${active
                                ? isModernSleek
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-[#00E599] text-[#0d1117] shadow-xs"
                                : isModernSleek
                                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                  : "text-slate-400 hover:text-white"
                                }`}
                              title={`Vitesse : ${speed / 1000}s par étape`}
                            >
                              {speed / 1000}s
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Center: Playback Controls & Sequence Timeline */}
                    <div className="flex-1 flex items-center gap-2 min-w-fit justify-center">

                      {/* Playback Controls (Prev, Play/Pause, Next) - Icon Only */}
                      <div
                        className={`flex items-center gap-1 p-0.5 rounded-lg border shrink-0 ${isModernSleek
                          ? "bg-white border-slate-200 shadow-2xs"
                          : "bg-[#090d14] border-[#1a2130]"
                          }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCurrentFrameIdx((prev) => Math.max(0, prev - 1))}
                          disabled={currentFrameIdx === 0}
                          className={`h-7 w-7 disabled:opacity-25 disabled:pointer-events-none rounded-md border transition cursor-pointer flex items-center justify-center ${isModernSleek
                            ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-[#0c1017] hover:bg-[#1b253b] text-slate-300 border-[#1f293d]"
                            }`}
                          title={t.tactics.animation.prevStep}
                          aria-label={t.tactics.animation.prevStep}
                        >
                          <ChevronLeft className="w-4 h-4 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          className={`h-7 px-2.5 rounded-md transition cursor-pointer flex items-center justify-center shadow-md ${isPlaying
                            ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 animate-pulse border border-rose-400/50"
                            : isModernSleek
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/15 border border-emerald-500 font-bold"
                              : "bg-[#00E599] hover:bg-emerald-400 text-slate-950 shadow-[#00e599]/15 border border-emerald-300"
                            }`}
                          title={isPlaying ? t.tactics.animation.pause : t.tactics.animation.play}
                          aria-label={isPlaying ? t.tactics.animation.pause : t.tactics.animation.play}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0 fill-current" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setCurrentFrameIdx((prev) => Math.min(keyframes.length - 1, prev + 1))}
                          disabled={currentFrameIdx === keyframes.length - 1}
                          className={`h-7 w-7 disabled:opacity-25 disabled:pointer-events-none rounded-md border transition cursor-pointer flex items-center justify-center ${isModernSleek
                            ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-[#0c1017] hover:bg-[#1b253b] text-slate-300 border-[#1f293d]"
                            }`}
                          title={t.tactics.animation.nextStep}
                          aria-label={t.tactics.animation.nextStep}
                        >
                          <ChevronRight className="w-4 h-4 shrink-0" />
                        </button>
                      </div>

                      <div className={`h-4 w-px shrink-0 ${isModernSleek ? "bg-slate-300" : "bg-[#1f293d]"}`} />

                      {/* Sequence Timeline Steps Navigation */}
                      <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-thin">
                        {keyframes.map((_, idx) => {
                          const isActive = idx === currentFrameIdx;
                          return (
                            <div key={idx} className="flex items-center shrink-0 gap-1">
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setCurrentFrameIdx(idx)}
                                  className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all cursor-pointer text-xs font-black ${isActive
                                    ? isModernSleek
                                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                                      : "bg-gradient-to-br from-[#11241f] to-[#0a1815] border-[#00E599] text-[#00E599] shadow-xs"
                                    : isModernSleek
                                      ? "bg-white border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900"
                                      : "bg-[#0c1017] border-[#1f293d] hover:border-slate-500 text-slate-400 hover:text-white"
                                    }`}
                                  title={t.tactics.animation.stepNumber(idx + 1)}
                                >
                                  <span>{idx + 1}</span>
                                </button>
                                {keyframes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const deletedIdx = idx;
                                      setKeyframes((prev) => prev.filter((_, i) => i !== deletedIdx));
                                      if (currentFrameIdx >= deletedIdx && currentFrameIdx > 0) {
                                        setCurrentFrameIdx((prev) => prev - 1);
                                      }
                                      setSleekToastMessage(t.tactics.animation.stepDeletedToast(deletedIdx + 1));
                                      setTimeout(() => setSleekToastMessage(null), 2500);
                                    }}
                                    className={`ml-0.5 p-0.5 rounded transition cursor-pointer text-[9px] font-black ${isModernSleek
                                      ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                      : "text-slate-500 hover:text-rose-400 hover:bg-rose-950/60"
                                      }`}
                                    title={t.tactics.animation.deleteStepTooltip(idx + 1)}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              {idx < keyframes.length - 1 && (
                                <div
                                  className={`w-2 h-0.5 shrink-0 ${isActive
                                    ? isModernSleek
                                      ? "bg-emerald-500"
                                      : "bg-[#00E599]"
                                    : isModernSleek
                                      ? "bg-slate-300"
                                      : "bg-[#1f293d]"
                                    }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* Right: Operations Buttons - ICON ONLY */}
                    <div
                      className={`flex items-center gap-1 shrink-0 p-0.5 rounded-lg border ${isModernSleek
                        ? "bg-white border-slate-200 shadow-2xs"
                        : "bg-[#090d14] border-[#1a2130]"
                        }`}
                    >
                      {/* Partager l'animation (GIF animé & Vidéo) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isProOrAdmin) {
                            setSleekToastMessage("🔒 Le partage d'animations tactiques est réservé aux formules PRO & PRO+.");
                            setIsCheckoutOpen(true);
                            return;
                          }
                          handleOpenShareSchema({
                            name: `Animation ${activeSport.toUpperCase()} (${keyframes.length} étapes)`,
                            sport: activeSport,
                            keyframes: keyframes,
                            isAnimation: true,
                            playbackSpeed: playbackSpeed,
                            formation: selectedFormationA,
                            drawings: drawingActions,
                          });
                        }}
                        className={`h-7 w-8 rounded-md transition cursor-pointer flex items-center justify-center shadow-xs ${isModernSleek
                          ? "bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800"
                          : "bg-[#102420] hover:bg-[#16332c] border border-[#00E599]/50 text-[#00E599]"
                          }`}
                        title="Partager l'animation (GIF animé, Vidéo, WhatsApp, E-mail)"
                        aria-label="Partager l'animation"
                      >
                        <Share2 className="w-4 h-4 shrink-0" />
                      </button>

                      {/* Sauvegarder (Disquette) */}
                      <button
                        type="button"
                        onClick={() => {
                          setTacticName(`Animation ${activeSport.toUpperCase()} - ${new Date().toLocaleDateString(undefined)}`);
                          setSaveTacticMatchId(activeMatchId);
                          setIsSaveAnimationMode(true);
                          setIsSaveModalOpen(true);
                        }}
                        className={`h-7 w-8 rounded-md transition cursor-pointer flex items-center justify-center shadow-xs ${isModernSleek
                          ? "bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 shadow-purple-600/15"
                          : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40"
                          }`}
                        title={t.tactics.animation.saveAnimation}
                        aria-label={t.tactics.animation.saveAnimation}
                      >
                        <Save className="w-4 h-4 shrink-0" />
                      </button>

                      {/* Nouvelle Étape */}
                      <button
                        type="button"
                        onClick={() => {
                          const activeFrame = keyframes[currentFrameIdx] || keyframes[0];
                          const newFrame = activeFrame.map((t) => ({ ...t }));
                          setKeyframes((prev) => {
                            const copy = [...prev];
                            copy.splice(currentFrameIdx + 1, 0, newFrame);
                            return copy;
                          });
                          setCurrentFrameIdx(currentFrameIdx + 1);
                        }}
                        className={`h-7 w-8 rounded-md transition cursor-pointer flex items-center justify-center ${isModernSleek
                          ? "bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-700 hover:text-cyan-900"
                          : "bg-[#0c1017] hover:bg-[#121c2e] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white"
                          }`}
                        title={t.tactics.animation.newStep}
                        aria-label={t.tactics.animation.newStep}
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                      </button>

                      {/* Supprimer l'étape actuelle */}
                      <button
                        type="button"
                        onClick={() => {
                          if (keyframes.length <= 1) {
                            setSleekToastMessage(t.tactics.animation.atLeastOneStepToast);
                            setTimeout(() => setSleekToastMessage(null), 3000);
                            return;
                          }
                          const deletedIdx = currentFrameIdx;
                          setKeyframes((prev) => prev.filter((_, idx) => idx !== deletedIdx));
                          setCurrentFrameIdx((prev) => Math.max(0, prev - 1));
                          setSleekToastMessage(t.tactics.animation.stepDeletedToast(deletedIdx + 1));
                          setTimeout(() => setSleekToastMessage(null), 2500);
                        }}
                        disabled={keyframes.length <= 1}
                        className={`h-7 w-8 disabled:opacity-20 disabled:pointer-events-none rounded-md transition cursor-pointer flex items-center justify-center ${isModernSleek
                          ? "bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 hover:text-rose-900"
                          : "bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 hover:border-rose-500 text-rose-300 hover:text-white"
                          }`}
                        title={t.tactics.animation.deleteCurrentStep}
                        aria-label={t.tactics.animation.deleteCurrentStep}
                      >
                        <Trash className="w-4 h-4 shrink-0" />
                      </button>

                      {/* Réinitialiser */}
                      <button
                        type="button"
                        onClick={() => {
                          const defaultTokens = getDefaultPlayersForSport(activeSport);
                          setKeyframes([defaultTokens]);
                          setCurrentFrameIdx(0);
                          setIsPlaying(false);
                          setSleekToastMessage(t.tactics.animation.resetAnimationToast);
                          setTimeout(() => setSleekToastMessage(null), 2500);
                        }}
                        className={`h-7 w-8 rounded-md transition cursor-pointer flex items-center justify-center ${isModernSleek
                          ? "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900"
                          : "bg-[#0c1017] hover:bg-[#1b253b] border border-[#1f293d] hover:border-slate-500 text-slate-400 hover:text-white"
                          }`}
                        title={t.tactics.animation.resetAnimation}
                        aria-label={t.tactics.animation.resetAnimation}
                      >
                        <RotateCcw className="w-4 h-4 shrink-0" />
                      </button>
                    </div>

                  </div>
  </div>
);
}
