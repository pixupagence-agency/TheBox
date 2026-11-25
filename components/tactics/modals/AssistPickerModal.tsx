"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { getSportScoreActions, type SportScoreAction } from "@/lib/sportScoring";
import { type Token } from "@/lib/tactics/types";
import { CheckCircle, X } from "lucide-react";

export interface AssistPickerModalProps {
  activeSport: string;
  confirmGoalRecord: (scorerToken: Token, passeurName?: string | undefined, customAction?: SportScoreAction | undefined) => void;
  currentTokens: Token[];
  isModernSleek: boolean;
  opponentSubstitutes: any[];
  pendingGoalToken: Token | null;
  pendingScoreAction: SportScoreAction | null;
  selectedPasseurName: string;
  setPendingGoalToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setPendingScoreAction: React.Dispatch<React.SetStateAction<SportScoreAction | null>>;
  setSelectedPasseurName: React.Dispatch<React.SetStateAction<string>>;
  substitutes: any[];
}

export default function AssistPickerModal({
  activeSport,
  confirmGoalRecord,
  currentTokens,
  isModernSleek,
  opponentSubstitutes,
  pendingGoalToken,
  pendingScoreAction,
  selectedPasseurName,
  setPendingGoalToken,
  setPendingScoreAction,
  setSelectedPasseurName,
  substitutes,
}: AssistPickerModalProps) {
  return (
    <>
        {/* SELECTION DU PASSEUR DECISIF MODAL */}
        {/* ========================================================= */}
        {pendingGoalToken && (() => {
          const currentAction = pendingScoreAction || getSportScoreActions(activeSport)[0];
          return (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-sm overflow-y-auto">
              <div className={`max-w-md w-full rounded-2xl sm:rounded-3xl shadow-xl relative my-auto flex flex-col border overflow-hidden ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
                }`}>
                {/* Header bar */}
                <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between relative z-10 ${isModernSleek ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-[#0f141d] border-[#1f293d] text-white"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${isModernSleek ? "bg-white border-slate-200 text-slate-700 shadow-sm" : "bg-[#00E599]/15 border-[#00E599]/30 text-[#00E599]"
                      }`}>
                      <span className="text-xl">{currentAction.icon}</span>
                    </div>
                    <div>
                      <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                        {currentAction.label === "But" ? "Nouveau But !" : `Nouveau : ${currentAction.label} (+${currentAction.points} pts)`}
                      </h3>
                      <p className={`text-[11px] font-bold mt-0.5 ${isModernSleek ? "text-slate-500" : "text-[#00E599]"}`}>
                        {activeSport === "rugby" ? "Marqueur" : activeSport === "basketball" ? "Buteur / Panier" : "Buteur"} : #{pendingGoalToken.number || "?"} {pendingGoalToken.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPendingGoalToken(null); setPendingScoreAction(null); }}
                    className={`p-1.5 rounded-xl transition cursor-pointer ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200/70" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
                      }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4 relative z-10">
                  <div>
                    <label className={`text-xs font-black uppercase tracking-wider block flex items-center gap-1.5 mb-2 ${isModernSleek ? "text-slate-700" : "text-amber-500"}`}>
                      <span>👟</span>
                      <span>Passeur décisif (Optionnel) :</span>
                    </label>

                    {/* Action individuelle / sans passeur option */}
                    <button
                      type="button"
                      onClick={() => setSelectedPasseurName("")}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${selectedPasseurName === ""
                        ? isModernSleek ? "bg-slate-100 border-slate-900 text-slate-900 font-black" : "bg-[#00E599]/20 border-[#00E599] text-[#00E599]"
                        : isModernSleek ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" : "bg-[#111827] border-[#1f293d] text-slate-300 hover:bg-[#1f293d]"
                        }`}
                    >
                      <span>🚫 Aucun (Action individuelle / Solo)</span>
                      {selectedPasseurName === "" && <CheckCircle className={`w-4 h-4 ${isModernSleek ? "text-slate-900" : "text-[#00E599]"}`} />}
                    </button>

                    {/* List of teammates on pitch and bench for this team */}
                    <div className={`text-[10px] font-bold uppercase mt-3 mb-1.5 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                      Coéquipiers de l&apos;équipe :
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {currentTokens
                        .filter((t) => t.type === pendingGoalToken.type && t.id !== pendingGoalToken.id)
                        .concat(
                          (pendingGoalToken.type === "player_a" ? substitutes : opponentSubstitutes)
                            .filter((s) => s.id !== pendingGoalToken.id)
                        )
                        .map((teammate) => {
                          const isSelected = selectedPasseurName === teammate.name;
                          return (
                            <button
                              key={teammate.id}
                              type="button"
                              onClick={() => setSelectedPasseurName(teammate.name)}
                              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${isSelected
                                ? isModernSleek ? "bg-slate-100 border-slate-900 text-slate-900 font-black shadow-sm" : "bg-[#00E599]/20 border-[#00E599] text-[#00E599] font-black shadow-sm"
                                : isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100" : "bg-[#111827] border-[#1f293d] text-slate-300 hover:bg-[#131d2b]"
                                }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={`w-5 h-5 rounded-full font-black text-[9px] flex items-center justify-center shrink-0 ${isModernSleek ? "bg-slate-200 text-slate-800" : "bg-[#1f293d] text-[#00E599]"
                                  }`}>
                                  {teammate.number || "?"}
                                </span>
                                <span className="truncate">{teammate.name}</span>
                                <span className={`text-[9px] font-normal shrink-0 ${isModernSleek ? "text-slate-500" : "text-slate-500"}`}>({teammate.role || "Joueur"})</span>
                              </div>
                              {isSelected && <CheckCircle className={`w-4 h-4 shrink-0 ${isModernSleek ? "text-slate-900" : "text-[#00E599]"}`} />}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className={`flex items-center justify-between gap-3 pt-3 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                    <button
                      type="button"
                      onClick={() => { setPendingGoalToken(null); setPendingScoreAction(null); }}
                      className={`h-10 px-4 rounded-xl font-bold text-xs inline-flex items-center justify-center whitespace-nowrap transition border cursor-pointer ${isModernSleek
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                        : "bg-[#161c28] hover:bg-[#1e2738] text-white border-[#233149]"
                        }`}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmGoalRecord(pendingGoalToken, selectedPasseurName, currentAction)}
                      className={`h-10 px-5 font-black text-xs rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap border ${isModernSleek
                        ? "bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-sm"
                        : "bg-gradient-to-r from-[#00E599] to-[#06b87d] hover:brightness-110 border-transparent text-[#07090e] shadow-lg shadow-[#00e599]/20"
                        }`}
                    >
                      <span>
                        {currentAction.label === "But"
                          ? "⚽ VALIDER LE BUT"
                          : `${currentAction.icon} VALIDER ${currentAction.label.toUpperCase()} (+${currentAction.points})`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================= */}
    </>
  );
}
