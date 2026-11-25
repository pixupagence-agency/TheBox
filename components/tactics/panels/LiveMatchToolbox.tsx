"use client";

// Tableau tactique : ancien renderLiveMatchToolbox() de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { type Language, type translations } from "@/lib/i18n";
import { getSportScoreActions, type SportScoreAction } from "@/lib/sportScoring";
import { type Token } from "@/lib/tactics/types";
import { X } from "lucide-react";

export interface LiveMatchToolboxProps {
  activeSport: string;
  currentTokens: Token[];
  handleGiveYellowCard: (targetToken: Token) => void;
  handleRecordAssist: (targetToken: Token) => void;
  handleRecordScore: (targetToken: Token, action: SportScoreAction, explicitAssister?: string | undefined) => void;
  handleRemovePlayerFromPitch: (tokenToRemove: Token, reason: "normal" | "injured" | "red_card") => void;
  isLiveMatchMode: boolean;
  isModernSleek: boolean;
  liveActionToken: Token | null;
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  pitchMaxWidth: string;
  setLiveActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSubPickerToken: React.Dispatch<React.SetStateAction<Token | null>>;
  t: (typeof translations)[Language];
}

export default function LiveMatchToolbox({
  activeSport,
  currentTokens,
  handleGiveYellowCard,
  handleRecordAssist,
  handleRecordScore,
  handleRemovePlayerFromPitch,
  isLiveMatchMode,
  isModernSleek,
  liveActionToken,
  matchEvents,
  pitchMaxWidth,
  setLiveActionToken,
  setSubPickerToken,
  t,
}: LiveMatchToolboxProps) {
  if (!isLiveMatchMode || !liveActionToken) return null;

  const currentLiveToken = currentTokens.find((t) => t.id === liveActionToken.id) || liveActionToken;
  const isHome = currentLiveToken.type === "player_a";
  const currentGoals = matchEvents.filter((e) => e.type === "goal" && e.player === currentLiveToken.name).length;
  const currentPoints = matchEvents.filter((e) => e.type === "goal" && e.player === currentLiveToken.name).reduce((sum, e) => sum + (e.points || 1), 0);
  const currentAssists = matchEvents.filter((e) => (e.type === "assist" && e.player === currentLiveToken.name) || (e.type === "goal" && e.assister === currentLiveToken.name)).length;
  const currentYellows = (currentLiveToken.yellowCards && currentLiveToken.yellowCards > 0)
    ? currentLiveToken.yellowCards
    : matchEvents.filter((e) => e.type === "yellow" && e.player === currentLiveToken.name).length;

  return (
    <div
      id="live-match-player-toolbox"
      className="relative w-full mx-auto mt-2 transition-all duration-300 ease-in-out z-40 shrink-0 select-none animate-fade-in"
      style={{ maxWidth: pitchMaxWidth }}
    >
      <div
        className={`rounded-2xl px-3.5 py-2.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 transition-all duration-300 ${isModernSleek
          ? "bg-white/95 border border-slate-200 shadow-sm text-slate-800"
          : "bg-[#0d1117]/95 border border-[#1f293d] shadow-lg text-white"
          }`}
      >
        {/* Identité joueur */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border shrink-0 ${isModernSleek
              ? "bg-slate-100 text-slate-800 border-slate-300"
              : isHome
                ? "bg-[#00E599] text-[#0d1117] border-[#00e599]"
                : "bg-rose-600 text-white border-rose-400"
              }`}
          >
            {currentLiveToken.number || "?"}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-black truncate max-w-[140px] sm:max-w-[200px] ${isModernSleek ? "text-slate-900" : "text-white"
                  }`}
              >
                {currentLiveToken.name}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${isModernSleek
                  ? "bg-slate-100 text-slate-600 border-slate-200"
                  : isHome
                    ? "bg-[#102420] text-[#00E599] border-[#00e599]/30"
                    : "bg-rose-950 text-rose-300 border-rose-800"
                  }`}
              >
                {isHome ? t.tactics.playerCard.myClubBadge : t.tactics.playerCard.myOpponentBadge}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 text-[10.5px] ${isModernSleek ? "text-slate-500 font-medium" : "text-slate-400"
                }`}
            >
              <span>{currentLiveToken.role || t.tactics.liveToolbox.player}</span>
              {currentGoals > 0 && (
                <span className={`font-bold flex items-center gap-0.5 ${isModernSleek ? "text-slate-700" : "text-emerald-400"}`}>
                  {activeSport === "rugby" ? "🏉" : activeSport === "basketball" ? "🏀" : activeSport === "handball" ? "🤾" : "⚽"}{" "}
                  {activeSport === "rugby" || activeSport === "basketball" ? `${currentPoints} pts` : `x${currentGoals}`}
                </span>
              )}
              {currentAssists > 0 && (
                <span className={`font-bold flex items-center gap-0.5 ${isModernSleek ? "text-slate-700" : "text-cyan-300"}`}>
                  👟 x{currentAssists}
                </span>
              )}
              {currentYellows > 0 && (
                <span className={`font-bold flex items-center gap-0.5 ${isModernSleek ? "text-slate-700" : "text-amber-400"}`}>
                  🟨 (1/2)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Options de match en direct */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Boutons de points selon le sport (Rugby, Basket, Hand, Foot) */}
          {getSportScoreActions(activeSport).map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleRecordScore(currentLiveToken, action)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${isModernSleek
                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-950 shadow-2xs"
                : "bg-[#161f2e] hover:bg-[#1e293b] border-[#26354d] text-slate-200 hover:text-white"
                }`}
              title={`Attribuer ${action.label} (+${action.points} point${action.points > 1 ? "s" : ""}) à ${currentLiveToken.name}`}
            >
              <span>{action.icon}</span>
              <span>{action.shortLabel}</span>
            </button>
          ))}

          {/* passeur (p) */}
          <button
            type="button"
            onClick={() => handleRecordAssist(currentLiveToken)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${isModernSleek
              ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs"
              : "bg-[#161f2e] hover:bg-[#1e293b] border-[#26354d] text-slate-200 hover:text-white"
              }`}
            title={t.tactics.liveToolbox.assistTooltip}
          >
            <span>👟</span>
            <span>{t.tactics.liveToolbox.assistBtn}</span>
          </button>

          {/* carton jaune (CJ) */}
          <button
            type="button"
            onClick={() => {
              const yellowsBefore = currentLiveToken.yellowCards || 0;
              handleGiveYellowCard(currentLiveToken);
              if (yellowsBefore >= 1) {
                setLiveActionToken(null);
              } else {
                setLiveActionToken({ ...currentLiveToken, yellowCards: 1 });
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${isModernSleek
              ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs"
              : "bg-[#161f2e] hover:bg-[#1e293b] border-[#26354d] text-slate-200 hover:text-white"
              }`}
            title={t.tactics.liveToolbox.yellowTooltip}
          >
            <span>🟨</span>
            <span>{t.tactics.liveToolbox.yellowBtn}</span>
          </button>

          {/* carton rouge (CR) */}
          <button
            type="button"
            onClick={() => {
              handleRemovePlayerFromPitch(currentLiveToken, "red_card");
              setLiveActionToken(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${isModernSleek
              ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs"
              : "bg-[#161f2e] hover:bg-[#1e293b] border-[#26354d] text-slate-200 hover:text-white"
              }`}
            title={t.tactics.liveToolbox.redTooltip}
          >
            <span>🟥</span>
            <span>{t.tactics.liveToolbox.redBtn}</span>
          </button>

          {/* blessure (B) */}
          <button
            type="button"
            onClick={() => {
              handleRemovePlayerFromPitch(currentLiveToken, "injured");
              setLiveActionToken(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 border ${isModernSleek
              ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs"
              : "bg-[#161f2e] hover:bg-[#1e293b] border-[#26354d] text-slate-200 hover:text-white"
              }`}
            title={t.tactics.liveToolbox.injuryTooltip}
          >
            <span>🏥</span>
            <span>{t.tactics.liveToolbox.injuryBtn}</span>
          </button>

          {/* Remplacer */}
          <button
            type="button"
            onClick={() => {
              setSubPickerToken(currentLiveToken);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${isModernSleek
              ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs"
              : "bg-[#161f2e] hover:bg-[#1e293b] border-[#26354d] text-slate-200 hover:text-white"
              }`}
            title={t.tactics.liveToolbox.substituteTooltip}
          >
            <span>🔄</span>
            <span className="hidden sm:inline">{t.tactics.liveToolbox.substituteBtn}</span>
          </button>

          {/* Fermer */}
          <button
            type="button"
            onClick={() => setLiveActionToken(null)}
            className={`p-1.5 rounded-xl transition cursor-pointer shrink-0 ml-0.5 border ${isModernSleek
              ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800"
              : "bg-[#172233] hover:bg-slate-800 border-transparent text-slate-300 hover:text-white"
              }`}
            title={t.tactics.liveToolbox.closeTooltip}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
