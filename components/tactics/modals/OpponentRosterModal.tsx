"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { type Token } from "@/lib/tactics/types";
import { Pencil, Plus, Trash2, X } from "lucide-react";

export interface OpponentRosterModalProps {
  currentFrameIdx: number;
  currentTokens: Token[];
  getAvailableNumbersForOpponent: (tokenId: string, currentNum?: number | undefined) => number[];
  handleAddOpponent: () => void;
  isModernSleek: boolean;
  isOpponentRosterModalOpen: boolean;
  setIsOpponentRosterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
}

export default function OpponentRosterModal({
  currentFrameIdx,
  currentTokens,
  getAvailableNumbersForOpponent,
  handleAddOpponent,
  isModernSleek,
  isOpponentRosterModalOpen,
  setIsOpponentRosterModalOpen,
  setKeyframes,
}: OpponentRosterModalProps) {
  return (
    <>
        {/* 8. OPPONENT ROSTER CUSTOMIZATION MODAL (PRO MODE) */}
        {/* ========================================================= */}
        {isOpponentRosterModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
            <div className={`max-w-lg w-full rounded-2xl sm:rounded-3xl shadow-2xl relative my-auto max-h-[85vh] flex flex-col border overflow-hidden ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"}`}>
              {/* Ambient background glow accents */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header bar */}
              <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between relative z-10 shrink-0 ${isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#0f141d] border-[#1f293d] text-white"
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${isModernSleek ? "bg-rose-100 border-rose-300 text-rose-800" : "bg-rose-500/20 border-rose-500/40 text-rose-400"
                    }`}>
                    <Pencil className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-black uppercase tracking-wide flex items-center gap-2 ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                      <span>Équipe Adverse</span>
                      <span className="text-[8px] bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                        MODE PRO
                      </span>
                    </h3>
                    <p className={`text-[11px] font-medium ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                      Nommez et numérotez les joueurs adverses
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpponentRosterModalOpen(false)}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
                    }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 flex-1 flex flex-col overflow-y-auto relative z-10 pb-0">
                <p className={`text-[11px] mb-4 ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                  Nommez et numérotez les joueurs adverses selon votre analyse tactique et votre préparation de match.
                </p>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin mb-4">
                  {currentTokens.filter((t) => t.type === "player_b").length === 0 ? (
                    <div className={`text-center p-6 border border-dashed rounded-xl ${isModernSleek ? "border-slate-300 text-slate-500" : "border-[#1f293d] text-slate-400"
                      }`}>
                      <p className="text-xs mb-3 font-semibold">Aucun joueur adverse actuellement sur le terrain.</p>
                      <button
                        onClick={handleAddOpponent}
                        className="px-3 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        + Placer l&apos;équipe adverse
                      </button>
                    </div>
                  ) : (
                    currentTokens
                      .filter((t) => t.type === "player_b")
                      .map((token, index) => (
                        <div
                          key={token.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border ${isModernSleek ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-[#090d14] border-[#1f293d] text-white"
                            }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-500 text-rose-200 text-xs font-black flex items-center justify-center shrink-0">
                            {token.number || index + 1}
                          </div>

                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={token.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setKeyframes((prev) => {
                                  const copy = [...prev];
                                  const activeFrame = copy[currentFrameIdx] || [];
                                  copy[currentFrameIdx] = activeFrame.map((t) =>
                                    t.id === token.id ? { ...t, name: newName } : t
                                  );
                                  return copy;
                                });
                              }}
                              placeholder="Nom du joueur"
                              className={`col-span-2 rounded px-2 py-1 text-xs focus:outline-none transition border font-bold ${isModernSleek ? "bg-white border-slate-300 text-slate-900 focus:border-rose-500" : "bg-[#0d1117] border-[#1f293d] text-white focus:border-rose-500"
                                }`}
                            />

                            <select
                              value={token.number || index + 1}
                              onChange={(e) => {
                                const newNum = Number(e.target.value);
                                setKeyframes((prev) => {
                                  const copy = [...prev];
                                  const activeFrame = copy[currentFrameIdx] || [];
                                  copy[currentFrameIdx] = activeFrame.map((t) =>
                                    t.id === token.id ? { ...t, number: newNum } : t
                                  );
                                  return copy;
                                });
                              }}
                              className={`rounded px-2 py-1 text-xs text-rose-500 focus:outline-none transition border text-center font-bold cursor-pointer ${isModernSleek ? "bg-white border-slate-300 focus:border-rose-500" : "bg-[#0d1117] border-[#1f293d] focus:border-rose-500"
                                }`}
                              title="Numéro unique (seuls les numéros disponibles sont proposés)"
                            >
                              {getAvailableNumbersForOpponent(token.id, token.number).map((n) => (
                                <option key={n} value={n} className={isModernSleek ? "bg-white text-slate-900" : "bg-[#0d1117] text-white"}>
                                  N° {n}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={() => {
                              setKeyframes((prev) => {
                                const copy = [...prev];
                                const activeFrame = copy[currentFrameIdx] || [];
                                copy[currentFrameIdx] = activeFrame.filter((t) => t.id !== token.id);
                                return copy;
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Retirer ce joueur adverse"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className={`flex items-center justify-between border-t p-4 px-5 sm:px-6 shrink-0 relative z-10 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                <button
                  onClick={handleAddOpponent}
                  className={`h-10 px-3.5 text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap border ${isModernSleek ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300" : "bg-[#172233] hover:bg-[#1f2f47] text-slate-200 border-slate-700"
                    }`}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span>Ajouter un joueur</span>
                </button>

                <button
                  onClick={() => setIsOpponentRosterModalOpen(false)}
                  className="h-10 px-5 bg-gradient-to-r from-[#00E599] to-[#06b87d] hover:brightness-110 text-[#07090e] font-black text-xs rounded-xl inline-flex items-center justify-center whitespace-nowrap shadow-lg transition cursor-pointer"
                >
                  Valider les noms
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
    </>
  );
}
