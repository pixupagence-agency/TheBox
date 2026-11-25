"use client";

// Tableau tactique : ancien renderTeamBPanel() de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { type Language, type translations } from "@/lib/i18n";
import { type SetPieceRoleConfig, type Token } from "@/lib/tactics/types";
import { ArrowLeftRight, Minus, Plus, Target, Trash2, Users } from "lucide-react";

export interface TeamBPanelProps {
  activeSport: string;
  applyTeamBFormation: (formName: string) => void;
  clearTeamBPlayers: () => void;
  countSportRoles: (roles: SetPieceRoleConfig) => number;
  currentTokens: Token[];
  getAvailableFormationsForSport: (sport: string, format?: string) => string[];
  handleAddOpponent: () => void;
  isCompactUI: boolean;
  isModernSleek: boolean;
  isProOrAdmin: boolean;
  isTeamBPanelCollapsed: boolean;
  opponentSetPieceRoles: SetPieceRoleConfig;
  opponentSubstitutes: any[];
  regroupTeamBInCamp: () => void;
  selectedFormationB: string;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSetPiecesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTeamBPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setRolesTargetTeam: React.Dispatch<React.SetStateAction<"home" | "away">>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setTeamRolesModalTab: React.Dispatch<React.SetStateAction<"players" | "setpieces">>;
  t: (typeof translations)[Language];
  isFullscreenMode?: boolean;
}

export default function TeamBPanel({
  activeSport,
  applyTeamBFormation,
  clearTeamBPlayers,
  countSportRoles,
  currentTokens,
  getAvailableFormationsForSport,
  handleAddOpponent,
  isCompactUI,
  isModernSleek,
  isProOrAdmin,
  isTeamBPanelCollapsed,
  opponentSetPieceRoles,
  opponentSubstitutes,
  regroupTeamBInCamp,
  selectedFormationB,
  setIsCheckoutOpen,
  setIsSetPiecesOpen,
  setIsTeamBPanelCollapsed,
  setRolesTargetTeam,
  setSleekToastMessage,
  setTeamRolesModalTab,
  t,
  isFullscreenMode = false,
}: TeamBPanelProps) {
  return (
    <div
      className={`${isFullscreenMode
        ? `relative shrink-0 flex flex-col justify-start z-30 transition-all duration-200 ${isTeamBPanelCollapsed
          ? "w-9 xl:w-10 p-1.5"
          : "w-36 xl:w-44 p-2.5 gap-2"
        } max-h-[calc(100vh-130px)] overflow-y-auto scrollbar-thin ${isModernSleek
          ? "bg-white/95 border-2 border-rose-500/40 rounded-2xl shadow-2xl text-slate-800 backdrop-blur-md"
          : "bg-[#0d1117]/95 border border-rose-900/50 hover:border-rose-700/70 rounded-2xl shadow-2xl backdrop-blur-md text-white"
        }`
        : `relative z-30 w-full ${isTeamBPanelCollapsed
          ? "lg:w-9 xl:w-10 p-1.5"
          : "lg:w-40 xl:w-44 2xl:w-52 p-2.5 lg:p-3 gap-2.5"
        } shrink-0 flex flex-col justify-start ${isCompactUI ? "p-1.5 gap-1 text-[85%]" : ""} tb-panel ${isModernSleek ? "text-slate-800" : ""} transition-all duration-200`
        }`}
    >
      {isTeamBPanelCollapsed ? (
        /* Collapsed View (Vertical tab on desktop/landscape, minimal strip on tablet/mobile) */
        <div
          onClick={() => setIsTeamBPanelCollapsed(false)}
          className={`w-full flex ${isFullscreenMode ? "flex-col" : "lg:flex-col"} items-center justify-between py-1 px-2 ${isFullscreenMode ? "py-2.5 px-1" : "lg:py-2.5 lg:px-1"} cursor-pointer group select-none gap-2`}
          title={t.tactics.teamPanel.expandOpponent}
        >
          <div className={`flex items-center ${isFullscreenMode ? "flex-col" : "lg:flex-col"} gap-1.5`}>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className={`text-[11px] font-black uppercase tracking-wider ${isModernSleek ? "text-rose-700" : "text-rose-400"} ${isFullscreenMode ? "inline" : "hidden lg:inline"} [writing-mode:vertical-rl] rotate-180 my-2`}>
              {t.tactics.playerCard.myOpponentBadge}
            </span>
            {!isFullscreenMode && (
              <span className={`text-xs font-black uppercase tracking-wider ${isModernSleek ? "text-rose-700" : "text-rose-400"} lg:hidden`}>
                {t.tactics.playerCard.myOpponentBadge}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsTeamBPanelCollapsed(false); }}
            className={`px-2 py-0.5 ${isFullscreenMode ? "p-1" : "lg:p-1"} rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${isModernSleek
              ? "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5"
              : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            title={t.tactics.teamPanel.expandOpponent}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            {!isFullscreenMode && <span className="lg:hidden text-[9px]">{t.tactics.teamPanel.unfoldBtn}</span>}
          </button>
        </div>
      ) : (
        <>
          {/* Panel Header */}
          <div className={`flex items-center justify-between border-b ${isModernSleek ? "border-slate-200 pb-1.5" : "border-[#1f293d] pb-1.5"}`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className={`text-[11px] sm:text-[12px] font-black uppercase tracking-wider ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                {t.tactics.playerCard.myOpponentBadge}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsTeamBPanelCollapsed(true)}
                className={`px-2 py-0.5 ${isFullscreenMode ? "p-1" : "lg:p-1"} rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${isModernSleek
                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                title={t.tactics.teamPanel.collapseOpponent}
                aria-label={t.tactics.teamPanel.collapseOpponent}
              >
                <Minus className="w-3.5 h-3.5 shrink-0" />
                {!isFullscreenMode && <span className="lg:hidden text-[9px]">{t.tactics.teamPanel.foldBtn}</span>}
              </button>
            </div>
          </div>

          {/* Formations list */}
          <div className="w-full">
            {!isFullscreenMode && (
              <div className="lg:hidden flex items-center gap-1.5 w-full">
                <span className={`text-[9px] font-black uppercase tracking-wider shrink-0 ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                  {t.tactics.teamPanel.formationLabel}
                </span>
                <select
                  value={selectedFormationB}
                  onChange={(e) => applyTeamBFormation(e.target.value)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black cursor-pointer border ${isModernSleek
                    ? "bg-slate-50 border-slate-200 text-slate-800"
                    : "bg-[#090d14] border-[#1a2130] text-rose-300"
                    }`}
                >
                  {getAvailableFormationsForSport(activeSport).map((form) => (
                    <option key={form} value={form} className="bg-[#090d14] text-white">
                      {form}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={isFullscreenMode ? "block" : "hidden lg:block"}>
              <span className={`text-[9px] font-black uppercase tracking-wider block mb-1 ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                {t.tactics.teamPanel.formationLabel}
              </span>
              <div className={`flex flex-col gap-1 ${isFullscreenMode ? "max-h-36 xl:max-h-52" : "max-h-32 xl:max-h-48"} overflow-y-auto scrollbar-thin pr-0.5`}>
                {getAvailableFormationsForSport(activeSport).map((form) => (
                  <button
                    key={form}
                    onClick={() => applyTeamBFormation(form)}
                    className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${selectedFormationB === form
                      ? isModernSleek
                        ? "tb-formation-active bg-rose-50 border border-rose-400/60 text-rose-600 font-black"
                        : "tb-formation-active bg-rose-500/10 border border-rose-400/60 text-rose-300 font-black"
                      : isModernSleek
                        ? "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                        : "bg-[#0b0e13] hover:bg-white/5 border border-[#2a2f37] hover:border-rose-400/40 text-slate-200"
                      }`}
                  >
                    {form}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className={`${isFullscreenMode ? "flex flex-col" : "grid grid-cols-2 sm:grid-cols-5 lg:flex lg:flex-col"} gap-1 pt-1.5 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/50"}`}>
            <button
              onClick={handleAddOpponent}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 shadow-sm`}
              title={t.tactics.teamPanel.addOpponentTooltip}
            >
              <Plus className={`w-3 h-3 ${isModernSleek ? "text-rose-500" : "text-rose-400"} shrink-0`} />
              <span>{t.tactics.teamPanel.addOpponentBtn}</span>
            </button>

            <button
              onClick={regroupTeamBInCamp}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 shadow-sm`}
              title={t.tactics.teamPanel.regroupOpponentTooltip}
            >
              <ArrowLeftRight className={`w-3.5 h-3.5 ${isModernSleek ? "text-rose-600" : "text-rose-400"} shrink-0`} />
              <span>{t.tactics.teamPanel.inTheirHalf}</span>
            </button>

            <button
              onClick={clearTeamBPlayers}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs`}
            >
              <Trash2 className={`w-3.5 h-3.5 ${isModernSleek ? "text-rose-600" : "text-rose-400"} shrink-0`} />
              <span>{t.tactics.teamPanel.clear}</span>
            </button>

            {/* Button 1: Effectif Adverse */}
            <button
              onClick={() => {
                if (!isProOrAdmin) {
                  setSleekToastMessage(t.tactics.teamPanel.lockedProRoster);
                  setIsCheckoutOpen(true);
                  return;
                }
                setRolesTargetTeam("away");
                setTeamRolesModalTab("players");
                setIsSetPiecesOpen(true);
              }}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs relative`}
              title={t.tactics.teamPanel.rosterTooltipOpponent}
            >
              <Users className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{t.tactics.teamPanel.roster}</span>
              {!isProOrAdmin && (
                <span className="text-[7.5px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1 py-0.2 rounded uppercase tracking-wider shadow-sm">
                  PRO
                </span>
              )}
              <span className="text-[8.5px] font-mono text-rose-300 font-bold ml-0.5">
                ({currentTokens.filter((t) => t.type === "player_b").length + opponentSubstitutes.length})
              </span>
            </button>

            {/* Button 2: Rôles Adverses */}
            <button
              onClick={() => {
                if (!isProOrAdmin) {
                  setSleekToastMessage(t.tactics.teamPanel.lockedProRoles);
                  setIsCheckoutOpen(true);
                  return;
                }
                setRolesTargetTeam("away");
                setTeamRolesModalTab("setpieces");
                setIsSetPiecesOpen(true);
              }}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs relative`}
              title={t.tactics.teamPanel.rolesTooltipOpponent}
            >
              <Target className="w-3.5 h-3.5 shrink-0 text-[#e9c349]" />
              <span>{t.tactics.teamPanel.tacticalRoles}</span>
              {!isProOrAdmin && (
                <span className="text-[7.5px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1 py-0.2 rounded uppercase tracking-wider shadow-sm">
                  PRO
                </span>
              )}
              {countSportRoles(opponentSetPieceRoles) > 0 && (
                <span className="bg-rose-500 text-white font-black text-[8px] px-1.5 py-0.2 rounded-full ml-0.5">
                  {countSportRoles(opponentSetPieceRoles)}
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
