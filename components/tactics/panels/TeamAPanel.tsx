"use client";

// Tableau tactique : ancien renderTeamAPanel() de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { type Language, type translations } from "@/lib/i18n";
import { type SetPieceRoleConfig, type Token } from "@/lib/tactics/types";
import { ArrowLeftRight, Minus, Plus, Target, Trash2, Users } from "lucide-react";

export interface TeamAPanelProps {
  activeSport: string;
  applyTeamAFormation: (formName: string) => void;
  clearTeamAPlayers: () => void;
  countSportRoles: (roles: SetPieceRoleConfig) => number;
  currentTokens: Token[];
  getAvailableFormationsForSport: (sport: string, format?: string) => string[];
  isCompactUI: boolean;
  isModernSleek: boolean;
  isTeamAPanelCollapsed: boolean;
  regroupTeamAInCamp: () => void;
  selectedFormationA: string;
  setIsSetPiecesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTeamAPanelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setPieceRoles: SetPieceRoleConfig;
  setRolesTargetTeam: React.Dispatch<React.SetStateAction<"home" | "away">>;
  setTeamRolesModalTab: React.Dispatch<React.SetStateAction<"players" | "setpieces">>;
  substitutes: any[];
  t: (typeof translations)[Language];
  isFullscreenMode?: boolean;
}

export default function TeamAPanel({
  activeSport,
  applyTeamAFormation,
  clearTeamAPlayers,
  countSportRoles,
  currentTokens,
  getAvailableFormationsForSport,
  isCompactUI,
  isModernSleek,
  isTeamAPanelCollapsed,
  regroupTeamAInCamp,
  selectedFormationA,
  setIsSetPiecesOpen,
  setIsTeamAPanelCollapsed,
  setPieceRoles,
  setRolesTargetTeam,
  setTeamRolesModalTab,
  substitutes,
  t,
  isFullscreenMode = false,
}: TeamAPanelProps) {
  return (
    <div
      id={isFullscreenMode ? undefined : "tour-team-panel"}
      className={`${isFullscreenMode
        ? `relative shrink-0 flex flex-col justify-start z-30 transition-all duration-200 ${isTeamAPanelCollapsed
          ? "w-9 xl:w-10 p-1.5"
          : "w-36 xl:w-44 p-2.5 gap-2"
        } max-h-[calc(100vh-130px)] overflow-y-auto scrollbar-thin ${isModernSleek
          ? "bg-white/95 border-2 border-emerald-500/40 rounded-2xl shadow-2xl text-slate-800 backdrop-blur-md"
          : "bg-[#0d1117]/95 border border-[#00E599]/40 hover:border-[#00E599]/60 rounded-2xl shadow-2xl backdrop-blur-md text-white"
        }`
        : `relative z-30 w-full ${isTeamAPanelCollapsed
          ? "lg:w-9 xl:w-10 p-1.5"
          : "lg:w-40 xl:w-44 2xl:w-52 p-2.5 lg:p-3 gap-2.5"
        } shrink-0 flex flex-col justify-start ${isCompactUI ? "p-1.5 gap-1 text-[85%]" : ""} tb-panel ${isModernSleek ? "text-slate-800" : ""} transition-all duration-200`
        }`}
    >
      {isTeamAPanelCollapsed ? (
        /* Collapsed View (Vertical tab on desktop/landscape, minimal strip on tablet/mobile) */
        <div
          onClick={() => setIsTeamAPanelCollapsed(false)}
          className={`w-full flex ${isFullscreenMode ? "flex-col" : "lg:flex-col"} items-center justify-between py-1 px-2 ${isFullscreenMode ? "py-2.5 px-1" : "lg:py-2.5 lg:px-1"} cursor-pointer group select-none gap-2`}
          title={t.tactics.teamPanel.expandClub}
        >
          <div className={`flex items-center ${isFullscreenMode ? "flex-col" : "lg:flex-col"} gap-1.5`}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E599] animate-pulse shrink-0" />
            <span className={`text-[11px] font-black uppercase tracking-wider ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"} ${isFullscreenMode ? "inline" : "hidden lg:inline"} [writing-mode:vertical-rl] rotate-180 my-2`}>
              {t.tactics.playerCard.myClubBadge}
            </span>
            {!isFullscreenMode && (
              <span className={`text-xs font-black uppercase tracking-wider ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"} lg:hidden`}>
                {t.tactics.playerCard.myClubBadge}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsTeamAPanelCollapsed(false); }}
            className={`px-2 py-0.5 ${isFullscreenMode ? "p-1" : "lg:p-1"} rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${isModernSleek
              ? "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5"
              : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            title={t.tactics.teamPanel.expandClub}
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
              <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
              <span className={`text-[11px] sm:text-[12px] font-black uppercase tracking-wider ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                {t.tactics.playerCard.myClubBadge}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsTeamAPanelCollapsed(true)}
                className={`px-2 py-0.5 ${isFullscreenMode ? "p-1" : "lg:p-1"} rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${isModernSleek
                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                title={t.tactics.teamPanel.collapseClub}
                aria-label={t.tactics.teamPanel.collapseClub}
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
                  value={selectedFormationA}
                  onChange={(e) => applyTeamAFormation(e.target.value)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black cursor-pointer border ${isModernSleek
                    ? "bg-slate-50 border-slate-200 text-slate-800"
                    : "bg-[#090d14] border-[#1a2130] text-[#00E599]"
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
                    onClick={() => applyTeamAFormation(form)}
                    className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${selectedFormationA === form
                      ? isModernSleek
                        ? "tb-formation-active bg-emerald-50 border border-emerald-500/60 text-emerald-700 font-black"
                        : "tb-formation-active bg-[#00E599]/10 border border-[#00E599]/60 text-[#00E599] font-black"
                      : isModernSleek
                        ? "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                        : "bg-[#0b0e13] hover:bg-white/5 border border-[#2a2f37] hover:border-[#00e599]/40 text-slate-200"
                      }`}
                  >
                    {form}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className={`${isFullscreenMode ? "flex flex-col" : "grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-col"} gap-1 pt-1.5 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/50"}`}>
            <button
              onClick={regroupTeamAInCamp}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs`}
              title={t.tactics.teamPanel.regroupClubTooltip}
            >
              <ArrowLeftRight className={`w-3.5 h-3.5 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"} shrink-0`} />
              <span>{t.tactics.teamPanel.inTheirHalf}</span>
            </button>

            <button
              onClick={clearTeamAPlayers}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs`}
            >
              <Trash2 className={`w-3.5 h-3.5 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"} shrink-0`} />
              <span>{t.tactics.teamPanel.clear}</span>
            </button>

            {/* Button 1: Effectif Mon Équipe */}
            <button
              onClick={() => {
                setRolesTargetTeam("home");
                setTeamRolesModalTab("players");
                setIsSetPiecesOpen(true);
              }}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs relative`}
              title={t.tactics.teamPanel.rosterTooltipClub}
            >
              <Users className={`w-3.5 h-3.5 shrink-0 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
              <span>{t.tactics.teamPanel.roster}</span>
              <span className={`text-[8.5px] font-mono font-bold ml-0.5 ${isModernSleek ? "text-emerald-800" : "text-emerald-300"}`}>
                ({currentTokens.filter((t) => t.type === "player_a").length + substitutes.length})
              </span>
            </button>

            {/* Button 2: Rôles Mon Équipe */}
            <button
              onClick={() => {
                setRolesTargetTeam("home");
                setTeamRolesModalTab("setpieces");
                setIsSetPiecesOpen(true);
              }}
              className={`w-full py-1.5 px-2 ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-[#0b0e13] hover:bg-white/5 border-[#2a2f37] text-slate-100"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs relative`}
              title={t.tactics.teamPanel.rolesTooltipClub}
            >
              <Target className="w-3.5 h-3.5 shrink-0 text-[#e9c349]" />
              <span>{t.tactics.teamPanel.tacticalRoles}</span>
              {countSportRoles(setPieceRoles) > 0 && (
                <span className="bg-[#00E599] text-slate-950 font-black text-[8px] px-1.5 py-0.2 rounded-full ml-0.5">
                  {countSportRoles(setPieceRoles)}
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
