"use client";

// Tableau tactique : ancien renderSubstitutionModal() de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { type Language, type translations } from "@/lib/i18n";
import { type Token } from "@/lib/tactics/types";
import { RefreshCw, User, X } from "lucide-react";

export interface SubstitutionModalProps {
  activeMatch: any;
  currentTokens: Token[];
  handleRemovePlayerFromPitch: (tokenToRemove: Token, reason: "normal" | "injured" | "red_card") => void;
  handleSwapPlayerOnPitch: (originalToken: Token, newSub: any, opts?: { eventId?: string | undefined; noEvent?: boolean | undefined; remote?: boolean | undefined; } | undefined) => void;
  isModernSleek: boolean;
  opponentSubstitutes: any[];
  setEditingToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setQuickActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSubPickerToken: React.Dispatch<React.SetStateAction<Token | null>>;
  subPickerToken: Token | null;
  substitutes: any[];
  t: (typeof translations)[Language];
}

export default function SubstitutionModal({
  activeMatch,
  currentTokens,
  handleRemovePlayerFromPitch,
  handleSwapPlayerOnPitch,
  isModernSleek,
  opponentSubstitutes,
  setEditingToken,
  setQuickActionToken,
  setSubPickerToken,
  subPickerToken,
  substitutes,
  t,
}: SubstitutionModalProps) {
  if (!subPickerToken) return null;

  const isOpponent = subPickerToken.type === "player_b";
  const activeBenchList = isOpponent ? opponentSubstitutes : substitutes;
  const rawAwayTeam = activeMatch.awayTeam?.trim();
  const isDefaultAway = !rawAwayTeam || rawAwayTeam.toUpperCase() === "NOUVEL ADVERSAIRE";
  const teamTitle = isOpponent
    ? (isDefaultAway ? "" : rawAwayTeam)
    : (activeMatch.homeTeam || "MON EQUIPE");

  return (
    <div
      id="substitution-modal-overlay"
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto select-none"
      onClick={() => setSubPickerToken(null)}
    >
      <div
        id="substitution-modal-card"
        className={`w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5 select-auto scrollbar-thin border relative overflow-hidden ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-slate-200"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* EN-TÊTE MODALE */}
        <div className={`flex items-center justify-between border-b pb-3 relative z-10 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${isOpponent
              ? isModernSleek
                ? "bg-rose-100 border-rose-300 text-rose-800"
                : "bg-rose-950/60 border-rose-600/40 text-rose-400"
              : isModernSleek
                ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                : "bg-[#102420] border-[#00e599]/40 text-[#00E599]"
              }`}>
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                <span>{t.tactics.subModal.title}</span>
                {teamTitle ? (
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase ${isOpponent
                    ? isModernSleek
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-rose-950/80 text-rose-300 border-rose-700/60"
                    : isModernSleek
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30"
                    }`}>
                    {teamTitle}
                  </span>
                ) : null}
              </h3>
              <p className={`text-[10.5px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                {isOpponent
                  ? t.tactics.subModal.subtitleOpponent
                  : t.tactics.subModal.subtitleHome}
              </p>
            </div>
          </div>
          <button
            id="btn-close-sub-modal"
            onClick={() => setSubPickerToken(null)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition cursor-pointer shrink-0 ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
              }`}
            title={t.tactics.subModal.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* JOUEUR SORTANT (OUT) */}
        <div className={`border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 ${isModernSleek
          ? isOpponent
            ? "bg-rose-50/60 border-rose-200 text-slate-900"
            : "bg-slate-50 border-slate-200 text-slate-900"
          : isOpponent
            ? "bg-[#161118] border-rose-900/40 text-white"
            : "bg-[#121926] border-emerald-900/40 text-white"
          }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              {subPickerToken.photo ? (
                <img
                  src={subPickerToken.photo}
                  alt={subPickerToken.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-rose-500 shadow-md"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-md ${isModernSleek
                    ? "bg-rose-100 text-rose-800 border-rose-400"
                    : "bg-rose-950 text-rose-300 border-rose-500"
                    }`}
                >
                  {subPickerToken.number || "?"}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[7.5px] font-black px-1 rounded-full uppercase shadow">
                OUT
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black truncate max-w-[130px] ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                  {subPickerToken.name}
                </span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 ${isModernSleek ? "bg-slate-200 text-slate-700" : "bg-[#1a2333] text-slate-300"
                  }`}>
                  {subPickerToken.role || t.tactics.subModal.starter}
                </span>
              </div>
              <div className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${isModernSleek ? "text-rose-700" : "text-rose-500"
                }`}>
                <span>{t.tactics.subModal.playerLeaving}</span>
              </div>
            </div>
          </div>

          {/* Quick direct exit buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="btn-sub-exit-simple"
              onClick={() => {
                handleRemovePlayerFromPitch(subPickerToken, "normal");
                setSubPickerToken(null);
              }}
              className={`px-2.5 py-1 border rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 ${isModernSleek
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                : "bg-[#172233] hover:bg-[#22334d] border-[#263750] text-slate-200 hover:text-white"
                }`}
              title={t.tactics.subModal.simpleExitTooltip}
            >
              <span>{t.tactics.subModal.simpleExit}</span>
            </button>
            <button
              type="button"
              id="btn-sub-exit-injured"
              onClick={() => {
                handleRemovePlayerFromPitch(subPickerToken, "injured");
                setSubPickerToken(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 border ${isModernSleek
                ? "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800"
                : "bg-amber-950/80 hover:bg-amber-800 border-amber-600/80 text-amber-200 hover:text-white"
                }`}
              title={t.tactics.subModal.injuryExitTooltip}
            >
              <span>{t.tactics.subModal.injuryExit}</span>
            </button>
          </div>
        </div>

        {/* LISTE DES REMPLAÇANTS DU BANC (IN) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10.5px] font-black uppercase">
            <span className={`flex items-center gap-1.5 ${isOpponent
              ? isModernSleek ? "text-rose-800 font-black" : "text-rose-400"
              : isModernSleek ? "text-emerald-800 font-black" : "text-[#00E599]"
              }`}>
              <User className="w-3.5 h-3.5" />
              <span>{t.tactics.subModal.benchSubstitutes(activeBenchList.length)}</span>
            </span>
            <span className={`text-[9px] font-normal ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
              {t.tactics.subModal.confirmHint}
            </span>
          </div>

          <div className="max-h-56 sm:max-h-64 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {activeBenchList.length === 0 ? (
              <div className={`p-4 rounded-xl border text-center text-xs italic ${isModernSleek ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-[#090d14] border-[#1a2130] text-slate-500"
                }`}>
                {isOpponent
                  ? t.tactics.subModal.noSubsOpponent
                  : t.tactics.subModal.noSubsHome}
              </div>
            ) : (
              activeBenchList.map((sub) => {
                const alreadyActive = currentTokens.some(
                  (t) => (isOpponent ? t.type === "player_b" : t.type === "player_a") &&
                    t.name.toLowerCase() === sub.name.toLowerCase()
                );
                const isInjured = sub.status === "injured" || sub.removalReason === "injured";
                const isRedCard = sub.status === "red_card" || sub.removalReason === "red_card";
                const isTired = sub.status === "tired";
                const isExcellent = sub.status === "excellent";

                return (
                  <div
                    key={sub.id}
                    id={`sub-row-${sub.id}`}
                    className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition ${isRedCard
                      ? "bg-rose-950/30 border-rose-900/50 opacity-60"
                      : isInjured
                        ? "bg-amber-950/30 border-amber-900/50 opacity-60"
                        : alreadyActive
                          ? isModernSleek ? "bg-slate-100 border-slate-200 opacity-60" : "bg-[#090d14] border-[#1a2130] opacity-60"
                          : isOpponent
                            ? isModernSleek
                              ? "bg-slate-50 border-slate-200 hover:border-rose-400 hover:bg-rose-50/50"
                              : "bg-[#161118] border-[#381f2a] hover:border-rose-500/60 hover:bg-[#221622]"
                            : isModernSleek
                              ? "bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50"
                              : "bg-[#101725] border-[#1f2c42] hover:border-[#00E599]/60 hover:bg-[#132034]"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {sub.photo ? (
                        <img
                          src={sub.photo}
                          alt={sub.name}
                          className={`w-8 h-8 rounded-full object-cover border shrink-0 ${isOpponent
                            ? "border-rose-500"
                            : isModernSleek
                              ? "border-emerald-600"
                              : "border-[#00E599]"
                            }`}
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${alreadyActive
                            ? "bg-slate-700 text-slate-300"
                            : isOpponent
                              ? isModernSleek
                                ? "bg-rose-100 border border-rose-300 text-rose-800"
                                : "bg-rose-950 border border-rose-600/40 text-rose-300"
                              : isModernSleek
                                ? "bg-emerald-100 border border-emerald-300 text-emerald-800"
                                : "bg-[#102420] border border-[#00e599]/40 text-[#00E599]"
                            }`}
                        >
                          {sub.number || "R"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black truncate max-w-[120px] sm:max-w-[160px] ${isModernSleek ? "text-slate-900" : "text-white"
                            }`}>
                            {sub.name}
                          </span>
                          <span className={`text-[8px] border px-1 py-0.2 rounded font-black uppercase shrink-0 ${isModernSleek
                            ? isOpponent
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-slate-200 text-slate-700 border-slate-300"
                            : "bg-[#1a2333] text-cyan-300 border-cyan-800/40"
                            }`}>
                            {sub.role || "SUB"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[9px] mt-0.5">
                          {alreadyActive && (
                            <span className={isOpponent ? (isModernSleek ? "text-rose-700 font-bold" : "text-rose-400 font-bold") : isModernSleek ? "text-emerald-800 font-bold" : "text-[#00E599] font-bold"}>
                              {t.tactics.subModal.onPitch}
                            </span>
                          )}
                          {isInjured && (
                            <span className={isModernSleek ? "text-amber-800 font-bold" : "text-amber-400 font-bold"}>{t.tactics.subModal.injured}</span>
                          )}
                          {isRedCard && (
                            <span className={isModernSleek ? "text-rose-700 font-bold" : "text-rose-400 font-bold"}>{t.tactics.subModal.sentOff}</span>
                          )}
                          {!alreadyActive && !isInjured && !isRedCard && (
                            <>
                              {isExcellent && (
                                <span className={isModernSleek ? "text-emerald-800 font-bold" : "text-emerald-400 font-bold"}>{t.tactics.subModal.topForm}</span>
                              )}
                              {isTired && (
                                <span className={isModernSleek ? "text-amber-800 font-bold" : "text-yellow-400 font-bold"}>{t.tactics.subModal.tired}</span>
                              )}
                              {!isExcellent && !isTired && (
                                <span className={isModernSleek ? "text-slate-600 font-medium" : "text-emerald-400 font-medium"}>{t.tactics.subModal.available}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remplacer button */}
                    <div>
                      {alreadyActive ? (
                        <span className={`text-[9.5px] font-bold px-2 py-1 ${isModernSleek ? "text-slate-400" : "text-slate-500"}`}>
                          {t.tactics.subModal.inGame}
                        </span>
                      ) : isInjured || isRedCard ? (
                        <span className={`text-[9.5px] font-bold px-2 py-1 ${isModernSleek ? "text-rose-700" : "text-rose-400"}`}>
                          {t.tactics.subModal.unavailable}
                        </span>
                      ) : (
                        <button
                          type="button"
                          id={`btn-swap-to-${sub.id}`}
                          onClick={() => {
                            handleSwapPlayerOnPitch(subPickerToken, sub);
                            setSubPickerToken(null);
                          }}
                          className={`px-3 py-1.5 font-black text-[10px] rounded-lg shadow-md transition cursor-pointer flex items-center gap-1 ${isOpponent
                            ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950"
                            }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{t.tactics.subModal.bringOn}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PIED DE MODALE */}
        <div className={`flex items-center justify-between gap-2 pt-2.5 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"
          }`}>
          <button
            type="button"
            id="btn-sub-open-full-card"
            onClick={() => {
              setEditingToken(subPickerToken);
              setQuickActionToken(subPickerToken);
              setSubPickerToken(null);
            }}
            className={`h-9 px-3 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap border transition ${isModernSleek ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" : "bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-800/50 text-cyan-300"
              }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tactics.subModal.openFullCard}</span>
          </button>

          <button
            type="button"
            id="btn-cancel-sub-modal"
            onClick={() => setSubPickerToken(null)}
            className={`h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center whitespace-nowrap transition cursor-pointer border ${isModernSleek
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              : "bg-[#172233] hover:bg-[#202f4a] border-[#263750] text-slate-300 hover:text-white"
              }`}
          >
            {t.userModal.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
