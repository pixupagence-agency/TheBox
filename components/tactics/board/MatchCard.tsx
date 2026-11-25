"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import type { useRouter } from "next/navigation";
import { confirmAction } from "@/components/ConfirmDialog";
import { MarqueeText } from "@/components/tactics/MarqueeText";
import { getSportBallInfo } from "@/components/tactics/PitchBallGraphic";
import { formatMatchDateTime } from "@/lib/dateFormat";
import { getSportScoreActions, type SportScoreAction } from "@/lib/sportScoring";
import { HALFTIME_BREAK_SECONDS, type LivePeriod } from "@/lib/tactics/livePeriods";
import { type Token } from "@/lib/tactics/types";
import { Award, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clapperboard, ClipboardCheck, Plus, QrCode, type Pause } from "lucide-react";

export interface MatchCardProps {
  activeLivePublicId: string | null;
  activeMatch: any;
  activeMatchId: string;
  activeSport: string;
  activeTeamId: string;
  awayScore: number;
  breakLongLabel: "Pause" | "Mi-temps";
  clubLogo: string;
  currentPeriod: LivePeriod;
  currentTokens: Token[];
  filteredMatches: any[];
  formatLiveTime: (totalSecs: number) => string;
  halftimeSecondsLeft: number;
  handleAddNewMatch: (assignedTeamId?: any) => void;
  handleDeleteMatchEvent: (eventId: string) => void;
  handleFinishLiveMatch: (isAuto?: boolean) => void;
  handleNextMatch: () => void;
  handlePrevMatch: () => void;
  handleRecordScore: (targetToken: Token, action: SportScoreAction, explicitAssister?: string | undefined) => void;
  handleSelectLivePeriod: (period: LivePeriod) => void;
  hasActiveMatch: boolean;
  homeScore: number;
  isClubTeamName: (name?: string | undefined) => boolean;
  isHalftime: boolean;
  isHalftimeRunning: boolean;
  isLiveMatchMode: boolean;
  isLiveTimerRunning: boolean;
  isMatchSectionCollapsed: boolean;
  isModernSleek: boolean;
  isPeriodOvertime: boolean;
  isProOrAdmin: boolean;
  isProPlusOrAdmin: boolean;
  liveActionToken: Token | null;
  livePeriodButtons: LivePeriod[];
  liveTimerSeconds: number;
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  openLiveShare: () => Promise<void>;
  openMatchConvocation: () => void;
  router: ReturnType<typeof useRouter>;
  setAwayScore: React.Dispatch<React.SetStateAction<number>>;
  setHalftimeSecondsLeft: React.Dispatch<React.SetStateAction<number>>;
  setHomeScore: React.Dispatch<React.SetStateAction<number>>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsHalftimeRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveMatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveMatchUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMatchEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMatchFinishedModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMatchSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNotesSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSchemasSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setLiveActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setLiveTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  setMatchEvents: React.Dispatch<React.SetStateAction<{ id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[]>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  teamInitials: (name?: string | undefined) => string;
}

export default function MatchCard({
  activeLivePublicId,
  activeMatch,
  activeMatchId,
  activeSport,
  activeTeamId,
  awayScore,
  breakLongLabel,
  clubLogo,
  currentPeriod,
  currentTokens,
  filteredMatches,
  formatLiveTime,
  halftimeSecondsLeft,
  handleAddNewMatch,
  handleDeleteMatchEvent,
  handleFinishLiveMatch,
  handleNextMatch,
  handlePrevMatch,
  handleRecordScore,
  handleSelectLivePeriod,
  hasActiveMatch,
  homeScore,
  isClubTeamName,
  isHalftime,
  isHalftimeRunning,
  isLiveMatchMode,
  isLiveTimerRunning,
  isMatchSectionCollapsed,
  isModernSleek,
  isPeriodOvertime,
  isProOrAdmin,
  isProPlusOrAdmin,
  liveActionToken,
  livePeriodButtons,
  liveTimerSeconds,
  matchEvents,
  openLiveShare,
  openMatchConvocation,
  router,
  setAwayScore,
  setHalftimeSecondsLeft,
  setHomeScore,
  setIsCheckoutOpen,
  setIsHalftimeRunning,
  setIsLiveMatchMode,
  setIsLiveMatchUpgradeModalOpen,
  setIsLiveTimerRunning,
  setIsMatchEditOpen,
  setIsMatchFinishedModalOpen,
  setIsMatchSectionCollapsed,
  setIsNotesSectionCollapsed,
  setIsSchemasSectionCollapsed,
  setLiveActionToken,
  setLiveTimerSeconds,
  setMatchEvents,
  setSleekToastMessage,
  teamInitials,
}: MatchCardProps) {
  return (
    <>
              {/* MATCH CARD (MATCH À VENIR / MATCH EN COURS) */}
              <div className={`tb-section ${isModernSleek ? "text-slate-800" : ""} rounded-xl p-2.5 shrink-0`}>
                <div className={`tb-section-head flex items-center justify-between ${isMatchSectionCollapsed ? "" : `mb-2 border-b ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/60"} pb-1.5`}`}>
                  <div
                    onClick={() => setIsMatchSectionCollapsed(!isMatchSectionCollapsed)}
                    className="flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    {isLiveMatchMode ? (
                      <span className={`${isModernSleek ? "text-slate-900" : "text-slate-200"} text-xs font-black flex items-center gap-1.5 uppercase`}>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        MATCH EN DIRECT
                      </span>
                    ) : (
                      <span className={`${isModernSleek ? "text-slate-600 font-extrabold" : "text-[#62728f]"} text-xs font-black uppercase flex items-center gap-1`}>
                        <CalendarDays className={`w-5 h-5 ${isModernSleek ? "text-amber-600" : "text-[#e9c349]"} shrink-0`} /> MATCH
                      </span>
                    )}
                    <span className="tb-pro-badge text-[9px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1 py-0.2 rounded uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5" /> PRO
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (!isProOrAdmin) {
                          setSleekToastMessage("🔒 La gestion des matchs est réservée aux abonnés PRO & PRO+.");
                          setIsCheckoutOpen(true);
                          return;
                        }
                        setIsMatchEditOpen(true);
                      }}
                      className={`relative h-8 w-8 flex items-center justify-center ${isModernSleek ? "bg-white hover:bg-slate-200 border-slate-200 text-emerald-800" : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-[#00E599]"} border rounded transition cursor-pointer shrink-0`}
                      title="Gérer ou ajouter des matchs"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      onClick={handlePrevMatch}
                      disabled={filteredMatches.findIndex(m => m.id === activeMatchId) <= 0}
                      className={`h-8 w-8 flex items-center justify-center rounded border ${isModernSleek ? "bg-white hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-900" : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-[#62728f] hover:text-brand-cream"} disabled:opacity-30 transition cursor-pointer shrink-0`}
                      title="Match précédent"
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      onClick={handleNextMatch}
                      disabled={filteredMatches.findIndex(m => m.id === activeMatchId) >= filteredMatches.length - 1 || filteredMatches.length === 0}
                      className={`h-8 w-8 flex items-center justify-center rounded border ${isModernSleek ? "bg-white hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-900" : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-[#62728f] hover:text-brand-cream"} disabled:opacity-30 transition cursor-pointer shrink-0`}
                      title="Match suivant"
                    >
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMatchSectionCollapsed(!isMatchSectionCollapsed)}
                      className={`h-8 px-2 rounded border text-[11px] font-bold transition cursor-pointer inline-flex items-center justify-center gap-0.5 whitespace-nowrap ${isModernSleek
                        ? "bg-white hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900"
                        : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-slate-400 hover:text-white"
                        }`}
                      title={isMatchSectionCollapsed ? "Déplier la section Match" : "Réduire la section Match"}
                      aria-label={isMatchSectionCollapsed ? "Déplier la section Match" : "Réduire la section Match"}
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isMatchSectionCollapsed ? "-rotate-90" : ""}`} />
                      <span className="sr-only">{isMatchSectionCollapsed ? "Ouvrir" : "Réduire"}</span>
                    </button>
                  </div>
                </div>

                {!isMatchSectionCollapsed && !hasActiveMatch && (
                  <div className={`rounded-lg border border-dashed p-3 text-center ${isModernSleek ? "border-slate-300 text-slate-500" : "border-[#1f293d] text-[#62728f]"}`}>
                    <p className="text-[11px] font-bold uppercase tracking-wider">Aucun match</p>
                    <p className="text-[11px] mt-1 leading-snug font-medium">
                      Les matchs sont facultatifs. Créez-en un pour suivre un adversaire, vos notes ou le mode live.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isProOrAdmin) {
                          setSleekToastMessage("🔒 La gestion des matchs est réservée aux abonnés PRO & PRO+.");
                          setIsCheckoutOpen(true);
                          return;
                        }
                        handleAddNewMatch();
                        setIsMatchEditOpen(true);
                      }}
                      className={`mt-2 h-8 px-3 rounded-lg text-xs font-black inline-flex items-center gap-1 transition cursor-pointer ${isModernSleek ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#00E599] hover:bg-[#00cc88] text-[#0d1117]"}`}
                    >
                      <Plus className="w-4 h-4" /> Créer un match
                    </button>
                  </div>
                )}

                {!isMatchSectionCollapsed && hasActiveMatch && (
                  /* Match details & Live controls card */
                  <div
                    className={`tb-match-card ${isModernSleek ? "text-slate-800" : "text-white"} border rounded-xl ${isLiveMatchMode ? "p-3" : "p-2.5"} text-center relative overflow-hidden transition ${!isLiveMatchMode
                        ? isModernSleek ? "hover:border-slate-300 group cursor-pointer" : "group cursor-pointer hover:border-[#354563]"
                        : ""
                      }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      {/* Home Team */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <span className={`w-11 h-11 rounded-full border-2 overflow-hidden flex items-center justify-center text-xs font-black mb-1.5 ${isModernSleek ? "border-emerald-500/60 bg-emerald-50 text-emerald-700" : "border-[#00E599]/60 bg-[#00E599]/10 text-[#00E599]"}`}>
                          {clubLogo && !(isClubTeamName(activeMatch.awayTeam) && !isClubTeamName(activeMatch.homeTeam))
                            ? <img src={clubLogo} alt={activeMatch.homeTeam} className="w-full h-full object-contain p-1 rounded-full" />
                            : teamInitials(activeMatch.homeTeam)}
                        </span>
                        {isLiveMatchMode ? (
                          <MarqueeText
                            text={activeMatch.homeTeam || ""}
                            className={`text-[11px] w-full max-w-[85px] text-center font-black ${isModernSleek ? "text-slate-800" : "text-white"} uppercase`}
                          />
                        ) : (
                          <span className={`text-[10.5px] max-w-[80px] font-black ${isModernSleek ? "text-slate-800" : "text-white"} truncate uppercase`}>
                            {activeMatch.homeTeam}
                          </span>
                        )}
                        {isLiveMatchMode && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setHomeScore(Math.max(0, homeScore - 1)); }}
                              className={`w-8 h-8 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center border ${isModernSleek
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                : "bg-[#161f2e] hover:bg-[#1e293b] text-slate-300 border-[#26354d]"
                                }`}
                              title="Diminuer le score domicile"
                            >
                              -
                            </button>
                            <span className={`text-sm font-black px-0.5 font-mono ${isModernSleek ? "text-slate-900" : "text-white"}`}>{homeScore}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setHomeScore(homeScore + 1); }}
                              className={`w-8 h-8 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center border ${isModernSleek
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                : "bg-[#161f2e] hover:bg-[#1e293b] text-slate-300 border-[#26354d]"
                                }`}
                              title="Augmenter le score domicile"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Score or VS center column with MODE LIVE button */}
                      <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
                        {activeMatch?.isFinished || currentPeriod === "FIN" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSleekToastMessage("🔒 Match terminé : Le mode Live est désactivé.");
                              setTimeout(() => setSleekToastMessage(null), 3500);
                              setIsMatchFinishedModalOpen(true);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11.5px] font-black transition cursor-pointer flex items-center gap-1 border shadow-2xs ${isModernSleek
                              ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              : "bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800"
                              }`}
                            title="Match terminé - Cliquez pour ouvrir le bilan du match"
                          >
                            <span>🏁 MATCH TERMINÉ</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isLiveMatchMode && !isProPlusOrAdmin) {
                                setIsLiveMatchUpgradeModalOpen(true);
                                return;
                              }
                              const nextState = !isLiveMatchMode;
                              setIsLiveMatchMode(nextState);
                              if (nextState) {
                                // Reprise pendant la mi-temps : c'est le compte à rebours qui repart, pas le chrono du match
                                if (currentPeriod === "MI-TEMPS") setIsHalftimeRunning(true);
                                else setIsLiveTimerRunning(true);
                                setIsSchemasSectionCollapsed(true);
                                setIsNotesSectionCollapsed(true);
                                setIsMatchSectionCollapsed(false);
                              } else {
                                setIsLiveTimerRunning(false);
                                setIsHalftimeRunning(false);
                                setLiveActionToken(null);
                                setIsSchemasSectionCollapsed(false);
                                setIsNotesSectionCollapsed(false);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11.5px] font-black transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${isLiveMatchMode
                              ? isModernSleek
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                                : "bg-[#161f2e] hover:bg-[#1e293b] text-white border-[#26354d]"
                              : isModernSleek
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                : "bg-[#131d2b] hover:bg-[#1a283b] text-slate-200 border-[#26354d]"
                              }`}
                            title={isLiveMatchMode ? "Désactiver le mode Live Match" : (!isProPlusOrAdmin ? "Mode Live Match (Exclusivité PRO+)" : "Lancer le mode Live Match")}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{isLiveMatchMode ? "LIVE" : "MODE LIVE"}</span>
                            {!isProPlusOrAdmin && (
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded-sm ml-0.5">PRO+</span>
                            )}
                          </button>
                        )}

                        {isLiveMatchMode ? (
                          <div className="text-center">
                            <div className={`text-lg font-black font-mono px-3 py-1 rounded-xl border ${isModernSleek
                              ? "bg-slate-50 text-slate-900 border-slate-200 shadow-2xs"
                              : "bg-[#111827] text-white border-[#26354d]"
                              }`}>
                              {homeScore} - {awayScore}
                            </div>
                          </div>
                        ) : (
                          <span className={`text-[11.5px] ${isModernSleek ? "text-slate-400" : "text-[#62728f]"} font-black uppercase`}>VS</span>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <span className={`w-11 h-11 rounded-full border-2 overflow-hidden flex items-center justify-center text-xs font-black mb-1.5 ${isModernSleek ? "border-rose-400/60 bg-rose-50 text-rose-600" : "border-rose-400/60 bg-rose-500/10 text-rose-300"}`}>
                          {clubLogo && isClubTeamName(activeMatch.awayTeam) && !isClubTeamName(activeMatch.homeTeam)
                            ? <img src={clubLogo} alt={activeMatch.awayTeam} className="w-full h-full object-contain p-1 rounded-full" />
                            : teamInitials(activeMatch.awayTeam)}
                        </span>
                        {isLiveMatchMode ? (
                          <MarqueeText
                            text={activeMatch.awayTeam || ""}
                            className={`text-[11px] w-full max-w-[85px] text-center font-black ${isModernSleek ? "text-slate-800" : "text-white"} uppercase`}
                          />
                        ) : (
                          <span className={`text-[10.5px] max-w-[80px] font-black ${isModernSleek ? "text-slate-800" : "text-white"} truncate uppercase`}>
                            {activeMatch.awayTeam}
                          </span>
                        )}
                        {isLiveMatchMode && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); setAwayScore(Math.max(0, awayScore - 1)); }}
                              className={`w-8 h-8 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center border ${isModernSleek
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                : "bg-[#161f2e] hover:bg-[#1e293b] text-slate-300 border-[#26354d]"
                                }`}
                              title="Diminuer le score extérieur"
                            >
                              -
                            </button>
                            <span className={`text-sm font-black px-0.5 font-mono ${isModernSleek ? "text-slate-900" : "text-white"}`}>{awayScore}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setAwayScore(awayScore + 1); }}
                              className={`w-8 h-8 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center border ${isModernSleek
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                : "bg-[#161f2e] hover:bg-[#1e293b] text-slate-300 border-[#26354d]"
                                }`}
                              title="Augmenter le score extérieur"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chrono, Period & Events section */}
                    {isLiveMatchMode ? (
                      <div className={`mt-3 pt-2.5 border-t flex flex-col items-center gap-2 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                        {/* Boutons rapides de points en mode BASKETBALL et RUGBY */}
                        {(activeSport === "basketball" || activeSport === "rugby") && (
                          <div className={`w-full p-2 rounded-xl border space-y-2 ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1f293d]"}`}>
                            <div className={`text-[11.5px] font-extrabold uppercase tracking-wider text-center ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                              {getSportBallInfo(activeSport).emoji} Noter les points ({activeMatch.homeTeam})
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 w-full">
                              {getSportScoreActions(activeSport).map((action) => (
                                <button
                                  key={`quick-home-${action.id}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const targetToken: Token =
                                      (liveActionToken && liveActionToken.type === "player_a" ? liveActionToken : null) ||
                                      currentTokens.find((tk) => tk.type === "player_a") || {
                                        id: `home_team_${activeSport}`,
                                        type: "player_a",
                                        x: 50,
                                        y: 50,
                                        name: activeMatch.homeTeam,
                                        role: "Équipe",
                                      };
                                    handleRecordScore(targetToken, action);
                                  }}
                                  className={`py-1.5 px-1 rounded-lg border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center leading-snug shadow-2xs ${isModernSleek
                                    ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
                                    : "bg-[#111827] hover:bg-[#1a2333] border-[#26354d] text-slate-200"
                                    }`}
                                  title={`Ajouter ${action.label} (+${action.points} sur le score)`}
                                >
                                  <span>{action.icon} {action.label}</span>
                                  <span className={`text-[11.5px] font-black ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>+{action.points}</span>
                                </button>
                              ))}
                            </div>
                            <div className={`flex items-center justify-between gap-1.5 pt-1.5 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                              <span className={`text-[11px] font-bold uppercase truncate max-w-[90px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                                Adv. ({activeMatch.awayTeam}) :
                              </span>
                              <div className="flex items-center gap-1">
                                {getSportScoreActions(activeSport).map((action) => (
                                  <button
                                    key={`quick-away-${action.id}`}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const targetToken: Token =
                                        (liveActionToken && liveActionToken.type === "player_b" ? liveActionToken : null) ||
                                        currentTokens.find((tk) => tk.type === "player_b") || {
                                          id: `away_team_${activeSport}`,
                                          type: "player_b",
                                          x: 50,
                                          y: 50,
                                          name: activeMatch.awayTeam,
                                          role: "Équipe",
                                        };
                                      handleRecordScore(targetToken, action);
                                    }}
                                    className={`px-2 py-1 rounded-md border text-[11.5px] font-bold transition cursor-pointer ${isModernSleek
                                      ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                                      : "bg-[#111827] hover:bg-[#1a2333] border-[#26354d] text-slate-300"
                                      }`}
                                    title={`Adversaire : ${action.label} (+${action.points} sur le score)`}
                                  >
                                    +{action.points}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Period Selector Buttons (football : 1MT | PAUSE | 2MT ; basket : QT1 | QT2 | PAUSE | QT3 | QT4) */}
                        <div className={`flex items-center justify-between gap-1 w-full p-1 rounded-xl border ${isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#080d14] border-[#1f293d]"}`}>
                          {livePeriodButtons.map((periodKey) => (
                            <button
                              key={periodKey}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLivePeriod(periodKey);
                              }}
                              title={periodKey === "MI-TEMPS" ? `${breakLongLabel} : lance un compte à rebours de 15 minutes` : undefined}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center uppercase tracking-tight ${currentPeriod === periodKey
                                ? isModernSleek
                                  ? "bg-white text-slate-900 border border-slate-300 shadow-2xs"
                                  : "bg-[#1e293b] text-white border border-slate-600"
                                : isModernSleek
                                  ? "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                                  : "bg-[#111827] text-slate-400 hover:text-white hover:bg-[#1a2333]"
                                }`}
                            >
                              {periodKey === "MI-TEMPS" ? "PAUSE" : periodKey}
                            </button>
                          ))}
                        </div>

                        {/* Timer Bar */}
                        <div className={`flex items-center justify-between gap-1.5 w-full p-2 rounded-xl border ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1f293d]"}`}>
                          {isHalftime ? (
                            // Pause (mi-temps) : compte à rebours de 15 minutes
                            <span
                              className={`text-sm font-mono font-black px-2.5 py-1 rounded-lg border ${halftimeSecondsLeft === 0
                                ? isModernSleek ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-rose-500/10 text-rose-400 border-rose-500/40"
                                : isModernSleek ? "bg-amber-50 text-amber-700 border-amber-200 shadow-2xs" : "bg-[#d4af37]/10 text-[#e9c349] border-[#d4af37]/30"
                                }`}
                              title="Temps restant avant la reprise"
                            >
                              ☕ {formatLiveTime(halftimeSecondsLeft)}
                            </span>
                          ) : (
                            <span
                              className={`text-sm font-mono font-black px-2.5 py-1 rounded-lg border transition-colors ${isPeriodOvertime
                                ? isModernSleek ? "bg-rose-50 text-rose-600 border-rose-200 shadow-2xs" : "bg-rose-500/10 text-rose-400 border-rose-500/40"
                                : isModernSleek ? "bg-white text-slate-900 border-slate-200 shadow-2xs" : "bg-[#111827] text-slate-200 border-[#26354d]"
                                }`}
                              title={isPeriodOvertime ? "Temps réglementaire de la période dépassé (temps additionnel)" : undefined}
                            >
                              ⏱️ {formatLiveTime(liveTimerSeconds)}
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isHalftime) setIsHalftimeRunning(!isHalftimeRunning);
                                else setIsLiveTimerRunning(!isLiveTimerRunning);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer border ${isModernSleek
                                ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs"
                                : "bg-[#161f2e] hover:bg-[#1e293b] text-slate-200 border-[#26354d]"
                                }`}
                            >
                              {(isHalftime ? isHalftimeRunning : isLiveTimerRunning) ? "PAUSE" : "START"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isHalftime) {
                                  setIsHalftimeRunning(false);
                                  setHalftimeSecondsLeft(HALFTIME_BREAK_SECONDS);
                                } else {
                                  setIsLiveTimerRunning(false);
                                  setLiveTimerSeconds(0);
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-black transition cursor-pointer border ${isModernSleek
                                ? "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-[#161f2e] hover:bg-[#1e293b] text-slate-300 border-[#26354d]"
                                }`}
                              title={isHalftime ? `Relancer les 15 minutes de ${breakLongLabel.toLowerCase()}` : "Réinitialiser le chrono"}
                            >
                              🔄
                            </button>
                          </div>
                        </div>

                        {/* Manual Match Finish Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFinishLiveMatch();
                          }}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border flex items-center justify-center gap-1.5 shadow-2xs ${isModernSleek
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                            : "bg-[#161f2e] hover:bg-[#1e293b] text-slate-200 border-[#26354d]"
                            }`}
                          title="Enregistrer les résultats et terminer officiellement le match"
                        >
                          <span>🏁 TERMINER LE MATCH</span>
                        </button>

                        {/* Match Events Feed Log */}
                        {matchEvents.filter((evt) => evt.type !== "assist").length > 0 && (
                          <div className={`mt-1 w-full p-2 rounded-xl border max-h-56 overflow-y-auto text-left space-y-1.5 scrollbar-thin ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1f293d]"}`}>
                            <div className={`text-[11.5px] font-black uppercase tracking-wider flex items-center justify-between border-b pb-1 ${isModernSleek ? "text-slate-600 border-slate-200" : "text-slate-400 border-[#1f293d]"}`}>
                              <span>ÉVÉNEMENTS ({matchEvents.filter((evt) => evt.type !== "assist").length}) :</span>
                              <button
                                onClick={async () => {
                                  if (await confirmAction({ title: "Effacer l'historique ?", message: "Tous les événements enregistrés pour ce match seront effacés.", confirmLabel: "Effacer" })) {
                                    setMatchEvents([]);
                                  }
                                }}
                                className={`text-[11px] font-bold transition cursor-pointer ${isModernSleek ? "text-slate-400 hover:text-slate-700" : "text-slate-500 hover:text-slate-300"}`}
                              >
                                Effacer
                              </button>
                            </div>
                            {matchEvents
                              .filter((evt) => evt.type !== "assist")
                              .map((evt) => (
                                <div key={evt.id} className={`text-xs font-bold flex items-center justify-between p-1.5 rounded-lg transition group ${isModernSleek ? "text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-100/70" : "text-slate-200 hover:bg-[#131b29]"}`}>
                                  <span className="flex items-center gap-1.5 truncate min-w-0">
                                    <span className="text-xs">
                                      {evt.type === "goal"
                                        ? (evt.icon || (activeSport === "rugby" ? "🏉" : activeSport === "basketball" ? "🏀" : activeSport === "handball" ? "🤾" : "⚽"))
                                        : evt.type === "yellow" ? "🟨" : evt.type === "red" ? "🟥" : evt.type === "note" ? "📝" : "🔄"}
                                    </span>
                                    <span className={`font-extrabold truncate max-w-[140px] ${isModernSleek ? "text-slate-800" : "text-white"}`}>
                                      {evt.player}
                                      {evt.type === "goal" ? (
                                        <span className={`font-bold text-xs ml-1 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                                          ({evt.points && evt.points > 1 ? `+${evt.points} pts` : "1 pt"}{evt.assister ? ` • ${evt.assister}` : ""})
                                        </span>
                                      ) : null}
                                    </span>
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className={`text-[11.5px] font-mono font-bold ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                                      {evt.period ? `${evt.period} ${evt.time}` : evt.time}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteMatchEvent(evt.id)}
                                      className={`opacity-0 group-hover:opacity-100 transition px-1 cursor-pointer font-black text-xs ${isModernSleek ? "text-slate-400 hover:text-slate-700" : "text-slate-500 hover:text-slate-300"}`}
                                      title="Supprimer cet événement"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (!isProOrAdmin) {
                            setSleekToastMessage("🔒 La gestion des matchs est réservée aux abonnés PRO & PRO+.");
                            setIsCheckoutOpen(true);
                            return;
                          }
                          setIsMatchEditOpen(true);
                        }}
                        className={`mt-1.5 pt-1 border-t ${isModernSleek ? "border-slate-100" : "border-[#1f293d]/60"} cursor-pointer text-center`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <p className={`text-[11px] font-black ${isModernSleek ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider truncate`}>
                            {activeMatch.competition}
                          </p>
                          {activeMatch.isFinished && (
                            <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1 rounded uppercase">
                              TERMINÉ
                            </span>
                          )}
                        </div>
                        {activeMatch.score && (
                          <p className="text-xs font-mono font-black text-[#00E599]">
                            Score : {activeMatch.score}
                          </p>
                        )}
                        <p className={`text-[11px] font-bold ${isModernSleek ? "text-emerald-800" : "text-slate-400"} mt-0.5`}>
                          {formatMatchDateTime(activeMatch)}
                        </p>
                      </div>
                    )}

                    {/* Bas de la section : match terminé → analyse vidéo (Recording, équipe et match ouverts) ;
                        sinon partage du live (QR du match, télécommande, QR du club) et convocation des joueurs du groupe */}
                    {activeMatch.id && (activeMatch.isFinished || currentPeriod === "FIN") ? (
                    <div className={`mt-2.5 pt-2.5 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const teamId = activeMatch.teamId || activeTeamId;
                          router.push(`/recording?equipe=${encodeURIComponent(teamId)}&match=${encodeURIComponent(activeMatch.id)}`);
                        }}
                        className="w-full h-8 px-2.5 rounded-lg text-[11px] font-black uppercase tracking-wide inline-flex items-center justify-center gap-1.5 transition cursor-pointer bg-[#FF5A4E] hover:bg-[#E8483D] text-white shadow-md shadow-[#FF5A4E]/15"
                        title="Ouvrir le module Recording avec ce match et son résumé"
                      >
                        <Clapperboard className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Passez à l&apos;analyse vidéo</span>
                      </button>
                    </div>
                    ) : (
                    <div className={`mt-2.5 pt-2.5 border-t grid grid-cols-2 gap-1.5 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openLiveShare(); }}
                        className={`h-9 px-2 rounded-xl border text-[11px] font-black inline-flex items-center justify-center gap-1.5 min-w-0 transition cursor-pointer ${isModernSleek
                          ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-[#131d2b] hover:bg-[#1a283b] text-slate-200 border-[#26354d]"
                          }`}
                        title="QR du match (public), télécommande pour l'adjoint et QR général du club"
                      >
                        <QrCode className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{activeLivePublicId ? "Partager le live" : "Publier le live"}</span>
                        {!isProPlusOrAdmin && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded-sm">PRO+</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openMatchConvocation(); }}
                        className={`h-9 px-2 rounded-xl border text-[11px] font-black inline-flex items-center justify-center gap-1.5 min-w-0 transition cursor-pointer ${isModernSleek
                          ? "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-[#FF8A1F]/10 hover:bg-[#FF8A1F]/20 text-[#FFA34D] border-[#FF8A1F]/35"
                          }`}
                        title="Convoquer les joueurs du groupe du match (envoi au module Convocations)"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Convocations</span>
                        {!isProOrAdmin && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded-sm">PRO</span>
                        )}
                      </button>
                    </div>
                    )}
                  </div>
                )}
              </div>
    </>
  );
}
