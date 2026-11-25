"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { formatMatchDateTime } from "@/lib/dateFormat";
import { premiumLabel, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";
import { COACH_NOTE_MAX } from "@/lib/tactics/constants";
import { type Token } from "@/lib/tactics/types";
import { Bookmark, Camera, CheckCircle, Film, Save, Share2, X } from "lucide-react";

export interface MatchFinishedModalProps {
  activeMatch: any;
  activeMatchId: string;
  activeSport: string;
  awayScore: number;
  formatLiveTime: (totalSecs: number) => string;
  handleExportModalWindowImage: () => Promise<void>;
  handleSaveTacticState: () => void;
  handleShareMatchWhatsApp: () => void;
  hasActiveMatch: boolean;
  homeScore: number;
  isExportingModalScreen: boolean;
  isMatchFinishedModalOpen: boolean;
  isModernSleek: boolean;
  isSaveAnimationMode: boolean;
  isSaveModalOpen: boolean;
  keyframes: Token[][];
  liveTimerSeconds: number;
  matchesList: any[];
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  matchFinishedModalRef: React.RefObject<HTMLDivElement | null>;
  pth: { panel: string; sidebar: string; border: string; card: string; cardMuted: string; text: string; body: string; sub: string; faint: string; input: string; navActive: string; navIdle: string; navIndicator: string; ghostBtn: string; primaryBtn: string; tableHead: string; rowHover: string; divide: string; chip: string; gold: string; goldChip: string; goldTile: string; accent: string; accentChip: string; accentDot: string; selected: string; selectable: string; segment: string; segmentActive: string; segmentIdle: string; danger: string; option: string; };
  saveSuccess: boolean;
  saveTacticMatchId: string;
  selectedFormationA: string;
  setIsLiveMatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMatchFinishedModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaveModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveTacticMatchId: React.Dispatch<React.SetStateAction<string>>;
  setTacticDesc: React.Dispatch<React.SetStateAction<string>>;
  setTacticName: React.Dispatch<React.SetStateAction<string>>;
  tacticDesc: string;
  tacticName: string;
  updateMatchById: (matchId: string, field: string, value: any) => void;
}

export default function MatchFinishedModal({
  activeMatch,
  activeMatchId,
  activeSport,
  awayScore,
  formatLiveTime,
  handleExportModalWindowImage,
  handleSaveTacticState,
  handleShareMatchWhatsApp,
  hasActiveMatch,
  homeScore,
  isExportingModalScreen,
  isMatchFinishedModalOpen,
  isModernSleek,
  isSaveAnimationMode,
  isSaveModalOpen,
  keyframes,
  liveTimerSeconds,
  matchesList,
  matchEvents,
  matchFinishedModalRef,
  pth,
  saveSuccess,
  saveTacticMatchId,
  selectedFormationA,
  setIsLiveMatchMode,
  setIsMatchFinishedModalOpen,
  setIsSaveModalOpen,
  setSaveTacticMatchId,
  setTacticDesc,
  setTacticName,
  tacticDesc,
  tacticName,
  updateMatchById,
}: MatchFinishedModalProps) {
  return (
    <>
        {/* 6.5. MATCH FINISHED RECAP MODAL */}
        {/* ========================================================= */}
        {isMatchFinishedModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
            <div ref={matchFinishedModalRef} className={`border max-w-lg w-full rounded-3xl p-6 shadow-xl relative overflow-hidden ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-emerald-500 text-white"
              }`}>
              {/* Header / Banner */}
              <div className={`-mx-6 -mt-6 p-5 border-b text-center relative mb-5 ${isModernSleek
                ? "bg-slate-50 border-slate-200 text-slate-900"
                : "bg-gradient-to-r from-emerald-950 via-[#0d1117] to-emerald-950 border-emerald-500/30 text-white"
                }`}>
                <span className="text-2xl mb-1 block">🏆</span>
                <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isModernSleek ? "text-slate-900" : "text-[#00E599]"}`}>
                  MATCH TERMINÉ — SCORE FINAL
                </h3>
                <p className={`text-[11px] font-medium mt-0.5 ${isModernSleek ? "text-slate-500" : "text-slate-300"
                  }`}>
                  {activeMatch.competition} • {formatMatchDateTime(activeMatch)}
                </p>
                {!isExportingModalScreen && (
                  <button
                    onClick={() => setIsMatchFinishedModalOpen(false)}
                    className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl transition cursor-pointer ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200/70" : "text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    title="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Big Score Box */}
              <div className={`border rounded-2xl p-4 text-center mb-5 relative ${isModernSleek
                ? "bg-slate-50 border-slate-200 text-slate-900 shadow-sm"
                : "bg-gradient-to-b from-[#131d2b] to-[#0a0f18] border-emerald-500/40 text-white shadow-lg"
                }`}>
                <div className="flex items-center justify-around gap-2">
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-xl mb-1">🛡️</span>
                    <span className={`text-xs font-black uppercase truncate max-w-[100px] ${isModernSleek ? "text-slate-700" : "text-white"
                      }`}>
                      {activeMatch.homeTeam}
                    </span>
                    <span className={`text-3xl font-black font-mono mt-1 ${isModernSleek ? "text-slate-900" : "text-[#00E599]"}`}>
                      {homeScore}
                    </span>
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${isModernSleek
                      ? "bg-white border-slate-200 text-slate-700 shadow-sm"
                      : "bg-emerald-500 border-emerald-400 text-slate-950 shadow-md"
                      }`}>
                      TERMINÉ
                    </span>
                    <span className={`text-xs font-mono font-bold mt-2 px-2 py-0.5 rounded border ${isModernSleek
                      ? "bg-white border-slate-200 text-slate-600"
                      : "bg-black/60 border-amber-500/30 text-amber-500"
                      }`}>
                      ⏱️ {formatLiveTime(liveTimerSeconds)}
                    </span>
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <span className="text-xl mb-1">🛡️</span>
                    <span className={`text-xs font-black uppercase truncate max-w-[100px] ${isModernSleek ? "text-slate-700" : "text-white"
                      }`}>
                      {activeMatch.awayTeam}
                    </span>
                    <span className={`text-3xl font-black font-mono mt-1 ${isModernSleek ? "text-slate-900" : "text-rose-500"}`}>
                      {awayScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Events timeline */}
              {matchEvents.filter((evt) => evt.type !== "assist").length > 0 && (
                <div className="mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-wider block mb-1.5 ${isModernSleek ? "text-slate-500" : "text-[#00E599]"}`}>
                    HISTORIQUE DES ÉVÉNEMENTS DU MATCH ({matchEvents.filter((evt) => evt.type !== "assist").length})
                  </span>
                  <div className={`p-2 rounded-xl border max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#080d14] border-[#1f293d]"
                    }`}>
                    {matchEvents
                      .filter((evt) => evt.type !== "assist")
                      .map((evt) => (
                        <div key={evt.id} className={`text-xs font-bold flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${isModernSleek ? "text-slate-800 bg-white border-slate-200" : "text-slate-200 bg-[#0f172a] border-[#1f293d]"
                          }`}>
                          <span className="flex items-center gap-2 truncate">
                            <span>
                              {evt.type === "goal"
                                ? (evt.icon || (activeSport === "rugby" ? "🏉" : activeSport === "basketball" ? "🏀" : activeSport === "handball" ? "🤾" : "⚽"))
                                : evt.type === "yellow" ? "🟨" : evt.type === "red" ? "🟥" : evt.type === "note" ? "📝" : "🔄"}
                            </span>
                            <span className={`font-extrabold flex items-center gap-1 ${isModernSleek ? "text-slate-900" : "text-white"
                              }`}>
                              {evt.player}
                              {evt.type === "goal" ? (
                                <span className={`font-bold text-xs ${isModernSleek ? "text-slate-600" : "text-[#00E599]"}`}>
                                  ({evt.points && evt.points > 1 ? `+${evt.points} pts` : "1 pt"}{evt.assister ? ` • ${evt.assister}` : ""})
                                </span>
                              ) : null}
                            </span>
                            {evt.type !== "goal" && <span className="text-slate-500 font-normal text-[10px]">({evt.note})</span>}
                          </span>
                          <span className={`font-mono text-[10px] font-black shrink-0 ml-2 ${isModernSleek ? "text-slate-500" : "text-amber-500"}`}>
                            {evt.period ? `${evt.period} • ${evt.time}` : evt.time}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Mot du coach : publié dans le résumé public du live */}
              {isExportingModalScreen ? (
                activeMatch.coachNote?.trim() ? (
                  <div className={`mb-4 p-3 rounded-xl border text-xs leading-relaxed whitespace-pre-line ${isModernSleek ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-[#080d14] border-[#1f293d] text-slate-300"}`}>
                    <span className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${isModernSleek ? "text-slate-500" : "text-[#00E599]"}`}>Le mot du coach</span>
                    {activeMatch.coachNote}
                  </div>
                ) : null
              ) : (
                <div className="mb-4">
                  <label htmlFor="coach-note-finished" className={`flex items-baseline justify-between gap-2 text-[10px] font-black uppercase tracking-wider mb-1.5 ${isModernSleek ? "text-slate-500" : "text-[#00E599]"}`}>
                    <span>Le mot du coach <span className="normal-case tracking-normal font-semibold opacity-70">(facultatif)</span></span>
                    <span className="normal-case tracking-normal font-semibold opacity-70 tabular-nums">{(activeMatch.coachNote || "").length}/{COACH_NOTE_MAX}</span>
                  </label>
                  <textarea
                    id="coach-note-finished"
                    value={activeMatch.coachNote || ""}
                    onChange={(e) => updateMatchById(activeMatchId, "coachNote", e.target.value.slice(0, COACH_NOTE_MAX))}
                    rows={3}
                    maxLength={COACH_NOTE_MAX}
                    placeholder="Ex : Belle réaction après la pause, fiers de l'état d'esprit du groupe. Prochain objectif : la coupe samedi."
                    className={`w-full rounded-xl border px-3 py-2 text-xs leading-relaxed resize-y outline-none transition ${isModernSleek ? "bg-white border-slate-300 text-slate-900 focus:border-emerald-500" : "bg-[#080d14] border-[#1f293d] text-white placeholder:text-slate-500 focus:border-[#00E599]"}`}
                  />
                  <p className={`mt-1 text-[10.5px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                    {activeMatch.livePublicId ? "Publié automatiquement dans le résumé du match (lien et QR du live)." : "Affiché dans le résumé public si le match est partagé en live."}
                  </p>
                </div>
              )}

              {/* Buttons / Actions */}
              {!isExportingModalScreen && (
                <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"
                  }`}>
                  <button
                    onClick={handleShareMatchWhatsApp}
                    className={`w-full sm:flex-1 h-10 px-3 font-black text-xs rounded-xl transition cursor-pointer text-center inline-flex items-center justify-center gap-1.5 whitespace-nowrap border ${isModernSleek
                      ? "bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-sm"
                      : "bg-[#25D366] hover:bg-[#20bd5a] border-transparent text-slate-950 shadow-lg shadow-emerald-500/20"
                      }`}
                    title="Partager le bilan complet du match directement sur WhatsApp"
                  >
                    <Share2 className="w-4 h-4 shrink-0" />
                    <span>PARTAGER WHATSAPP</span>
                  </button>

                  <button
                    onClick={handleExportModalWindowImage}
                    className={`w-full sm:flex-1 h-10 px-3 border font-bold text-xs rounded-xl transition cursor-pointer text-center inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${isModernSleek
                      ? "bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm"
                      : "bg-[#131d2b] hover:bg-[#1c2c40] border-[#00E599]/40 text-[#00E599]"
                      }`}
                    title="Exporter une capture image PNG exacte de cette fenêtre"
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>EXPORTER (PNG)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMatchFinishedModalOpen(false);
                      setIsLiveMatchMode(false);
                    }}
                    className={`w-full sm:w-auto h-10 px-4 font-bold text-xs rounded-xl transition cursor-pointer text-center inline-flex items-center justify-center whitespace-nowrap border ${isModernSleek ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700" : "bg-[#182338] hover:bg-[#233350] border-[#263750] text-slate-300"
                      }`}
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {isSaveModalOpen && (
          <div className={`${premiumOverlay} z-50`}>
            <div className={`${premiumShell} w-full max-w-3xl max-h-[94vh] sm:max-h-[86vh] ${pth.panel}`}>
              {/* ================= SIDEBAR ================= */}
              <aside className={`hidden md:flex w-60 shrink-0 flex-col border-r relative z-10 ${pth.sidebar}`}>
                <div className="px-5 pt-6 pb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${isSaveAnimationMode ? (isModernSleek ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-purple-500/10 border-purple-500/25 text-purple-300") : pth.accentChip}`}>
                      {isSaveAnimationMode ? <Film className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                    </div>
                    <div className="leading-tight">
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${pth.accent}`}>Bibliothèque</p>
                      <p className={`text-sm font-black ${pth.text}`}>{isSaveAnimationMode ? "Animations" : "Schémas"}</p>
                    </div>
                  </div>
                </div>
                <div className="px-3 space-y-2">
                  {[
                    { label: "Type", value: isSaveAnimationMode ? `Animation · ${keyframes.length} étapes` : "Schéma fixe" },
                    { label: "Sport", value: activeSport.charAt(0).toUpperCase() + activeSport.slice(1) },
                    { label: "Dispositif", value: selectedFormationA || "—" },
                  ].map((row) => (
                    <div key={row.label} className={`p-3 rounded-xl border ${pth.card}`}>
                      <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${pth.faint}`}>{row.label}</p>
                      <p className={`text-xs font-bold mt-0.5 truncate ${pth.text}`}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </aside>

              {/* ================= MAIN ================= */}
              <main className="flex-1 min-w-0 flex flex-col relative z-10 min-h-0">
                <header className={`px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b ${pth.border}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className={`text-lg sm:text-xl font-black tracking-tight ${pth.text}`}>
                        {isSaveAnimationMode ? "Enregistrer l'animation" : "Sauvegarder ce schéma"}
                      </h2>
                      <p className={`text-xs mt-1 ${pth.sub}`}>
                        {isSaveAnimationMode ? "Ajoutez cette séquence à votre bibliothèque de mouvements." : "Ajoutez ce schéma à votre bibliothèque de jeu."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSaveModalOpen(false)}
                      className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${pth.ghostBtn}`}
                      title="Fermer"
                      aria-label="Fermer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                {saveSuccess ? (
                  <div className="flex-1 px-7 py-12 flex flex-col items-center justify-center text-center">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${pth.accentChip}`}>
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <p className={`mt-4 text-base font-black ${pth.text}`}>
                      {isSaveAnimationMode ? "Animation enregistrée" : "Schéma sauvegardé"}
                    </p>
                    <p className={`text-xs mt-1 ${pth.sub}`}>Retrouvez-le dans la section Schémas du panneau de droite.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4 scrollbar-thin">
                      <div>
                        <label className={`${premiumLabel} ${pth.sub}`}>
                          {isSaveAnimationMode ? "Nom de l'animation" : "Nom du schéma"} <span className={pth.accent}>*</span>
                        </label>
                        <input
                          type="text"
                          value={tacticName}
                          onChange={(e) => setTacticName(e.target.value)}
                          className={`w-full rounded-xl px-3 py-2.5 text-xs font-semibold border outline-none transition ${pth.input}`}
                        />
                      </div>

                      <div>
                        <label className={`${premiumLabel} ${pth.sub}`}>Match associé</label>
                        {matchesList && matchesList.length > 1 ? (
                          <select
                            value={saveTacticMatchId || activeMatchId}
                            onChange={(e) => setSaveTacticMatchId(e.target.value)}
                            className={`w-full rounded-xl px-3 py-2.5 text-xs font-semibold border outline-none transition cursor-pointer ${pth.input} ${pth.option}`}
                          >
                            {matchesList.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.homeTeam} vs {m.awayTeam} · {m.competition || "Match"}{formatMatchDateTime(m) ? ` · ${formatMatchDateTime(m)}` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className={`w-full rounded-xl px-3 py-2.5 text-xs flex items-center justify-between gap-2 border ${pth.cardMuted}`}>
                            <span className={`font-bold truncate ${pth.text}`}>{hasActiveMatch ? `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}` : "Aucun match — schéma non associé"}</span>
                            {hasActiveMatch && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${pth.chip}`}>{activeMatch?.competition || "Match"}</span>}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={`${premiumLabel} ${pth.sub}`}>Description <span className={`normal-case tracking-normal font-semibold ${pth.faint}`}>(optionnelle)</span></label>
                        <textarea
                          value={tacticDesc}
                          onChange={(e) => setTacticDesc(e.target.value)}
                          placeholder="Consignes, objectifs, déclencheurs…"
                          rows={4}
                          className={`w-full rounded-xl px-3 py-2.5 text-xs border outline-none transition resize-none leading-relaxed ${pth.input}`}
                        />
                      </div>
                    </div>

                    <footer className={`px-5 sm:px-7 py-4 border-t flex items-center justify-end gap-2 ${pth.border}`}>
                      <button
                        type="button"
                        onClick={() => setIsSaveModalOpen(false)}
                        className={`h-10 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${pth.ghostBtn}`}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTacticState}
                        className={`h-10 px-5 rounded-xl text-xs font-black inline-flex items-center gap-2 transition cursor-pointer ${pth.primaryBtn}`}
                      >
                        <Save className="w-4 h-4" />
                        Enregistrer
                      </button>
                    </footer>
                  </>
                )}
              </main>
            </div>
          </div>
        )}

    </>
  );
}
