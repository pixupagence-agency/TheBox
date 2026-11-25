"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { type Language, type translations } from "@/lib/i18n";
import { Award, ChevronDown, Maximize2, Mic, NotebookPen } from "lucide-react";

export interface TacticalNotesSectionProps {
  handleLockedNotesClick: () => void;
  handleToggleMicRecording: () => void;
  isModernSleek: boolean;
  isNotesSectionCollapsed: boolean;
  isProOrAdmin: boolean;
  isRecordingVoice: boolean;
  quickNote: string;
  setIsNotesExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNotesSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setQuickNote: React.Dispatch<React.SetStateAction<string>>;
  setSpeechError: React.Dispatch<React.SetStateAction<string | null>>;
  setTacticalNotes: React.Dispatch<React.SetStateAction<string>>;
  speechError: string | null;
  t: (typeof translations)[Language];
  tacticalNotes: string;
}

export default function TacticalNotesSection({
  handleLockedNotesClick,
  handleToggleMicRecording,
  isModernSleek,
  isNotesSectionCollapsed,
  isProOrAdmin,
  isRecordingVoice,
  quickNote,
  setIsNotesExpanded,
  setIsNotesSectionCollapsed,
  setQuickNote,
  setSpeechError,
  setTacticalNotes,
  speechError,
  t,
  tacticalNotes,
}: TacticalNotesSectionProps) {
  return (
    <>
              {/* NOTES TACTIQUES dictation & editing container */}
              <div className={`tb-section ${isModernSleek ? "text-slate-800" : ""} rounded-xl ${isNotesSectionCollapsed ? "p-2 shrink-0" : "p-3 flex-1 flex flex-col min-h-[180px]"}`}>
                <div className={`tb-section-head flex items-center justify-between ${isNotesSectionCollapsed ? "" : `mb-1.5 border-b ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/60"} pb-1`}`}>
                  <p
                    onClick={() => setIsNotesSectionCollapsed(!isNotesSectionCollapsed)}
                    className={`text-xs ${isModernSleek ? "text-slate-600 font-extrabold" : "text-[#62728f]"} font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none`}
                  >
                    <NotebookPen className={`w-5 h-5 ${isModernSleek ? "text-amber-600" : "text-[#e9c349]"} shrink-0`} />
                    <span>{t.tactics.sidebar.notesTitle}</span>
                    <span className="tb-pro-badge text-[9px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1 py-0.2 rounded uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5" /> PRO
                    </span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleToggleMicRecording}
                      className={`relative h-8 w-8 flex items-center justify-center border rounded transition cursor-pointer shrink-0 ${isRecordingVoice
                        ? "bg-rose-600 border-rose-500 text-white animate-pulse"
                        : isModernSleek
                          ? "bg-white hover:bg-slate-200 border-slate-200 text-amber-600 hover:text-amber-800"
                          : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-amber-500 hover:text-brand-cream"
                        }`}
                      title={isRecordingVoice ? "Arrêter l'enregistrement" : "Enregistrer une note vocale"}
                    >
                      <Mic className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      onClick={() => setIsNotesExpanded(true)}
                      className={`h-8 w-8 flex items-center justify-center ${isModernSleek ? "bg-white hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-900" : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-[#62728f] hover:text-brand-cream"} border rounded transition cursor-pointer shrink-0`}
                      title="Agrandir les notes"
                    >
                      <Maximize2 className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNotesSectionCollapsed(!isNotesSectionCollapsed)}
                      className={`h-8 px-2 rounded border text-[11px] font-bold transition cursor-pointer inline-flex items-center justify-center gap-0.5 whitespace-nowrap ${isModernSleek
                        ? "bg-white hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900"
                        : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-slate-400 hover:text-white"
                        }`}
                      title={isNotesSectionCollapsed ? "Déplier la section Notes" : "Réduire la section Notes"}
                      aria-label={isNotesSectionCollapsed ? "Déplier la section Notes" : "Réduire la section Notes"}
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isNotesSectionCollapsed ? "-rotate-90" : ""}`} />
                      <span className="sr-only">{isNotesSectionCollapsed ? "Ouvrir" : "Réduire"}</span>
                    </button>
                  </div>
                </div>

                {!isNotesSectionCollapsed && (
                  <>
                    {isRecordingVoice && (
                      <div className="mb-1.5 bg-rose-950/30 border border-rose-500/50 rounded-lg p-1 flex items-center justify-between text-[10.5px] text-rose-300 shadow-sm animate-pulse">
                        <span className="flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          🎤 Dictée vocale...
                        </span>
                        <span className="font-extrabold underline text-rose-200 cursor-pointer" onClick={handleToggleMicRecording}>Arrêter</span>
                      </div>
                    )}

                    {speechError && (
                      <div className="mb-1.5 bg-rose-950/50 border border-rose-500/60 rounded-lg p-1 text-[10.5px] text-rose-200 flex items-center justify-between font-bold">
                        <span>⚠️ {speechError}</span>
                        <button onClick={() => setSpeechError(null)} className="text-slate-400 hover:text-white font-bold ml-1">✕</button>
                      </div>
                    )}

                    <textarea
                      value={tacticalNotes}
                      readOnly={!isProOrAdmin}
                      onClick={!isProOrAdmin ? handleLockedNotesClick : undefined}
                      onChange={(e) => { if (isProOrAdmin) setTacticalNotes(e.target.value); }}
                      placeholder="STRATÉGIE ET NOTES DU MATCH..."
                      className={`w-full flex-1 min-h-[110px] bg-transparent border border-dashed ${isModernSleek
                        ? "border-slate-300 focus:border-emerald-500 text-slate-900 placeholder-slate-500"
                        : "border-[#1f293d] focus:border-[#354563] text-slate-200 placeholder-[#62728f]"
                        } rounded-lg p-2.5 text-xs focus:outline-none resize-none font-medium leading-relaxed scrollbar-thin transition placeholder:font-bold placeholder:tracking-wider`}
                    />
                    <input
                      type="text"
                      value={quickNote}
                      readOnly={!isProOrAdmin}
                      onClick={!isProOrAdmin ? handleLockedNotesClick : undefined}
                      onChange={(e) => { if (isProOrAdmin) setQuickNote(e.target.value); }}
                      onKeyDown={(e) => {
                        if (!isProOrAdmin || e.key !== "Enter" || !quickNote.trim()) return;
                        e.preventDefault();
                        setTacticalNotes(tacticalNotes.trim() ? `${tacticalNotes.trimEnd()}\n- ${quickNote.trim()}` : `- ${quickNote.trim()}`);
                        setQuickNote("");
                      }}
                      placeholder={t.tactics.sidebar.quickNotePlaceholder}
                      aria-label={t.tactics.sidebar.quickNotePlaceholder}
                      className={`w-full mt-2 shrink-0 bg-transparent border border-dashed ${isModernSleek
                        ? "border-slate-300 focus:border-emerald-500 text-slate-900 placeholder-slate-500"
                        : "border-[#1f293d] focus:border-[#354563] text-slate-100 placeholder-[#62728f]"
                        } rounded-lg px-2.5 py-2 text-xs font-medium focus:outline-none transition`}
                    />
                  </>
                )}
              </div>
    </>
  );
}
