"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import MatchConvocationModal from "../../convocations/MatchConvocationModal";
import LiveShareModal from "../../live/LiveShareModal";
import { type EditorAccess } from "@/lib/live/client";
import { type TeamCategory } from "@/lib/tactics/types";
import { Award, Sparkles, Zap } from "lucide-react";

export interface LiveShareModalsProps {
  activeLivePublicId: string | null;
  activeMatch: any;
  activeTeamId: string;
  handlePublishActiveLive: () => Promise<void>;
  handleRegenerateLiveEditor: () => Promise<void>;
  handleRevokeLiveEditor: () => Promise<void>;
  isClubTeamName: (name?: string | undefined) => boolean;
  isLiveMatchUpgradeModalOpen: boolean;
  isLiveShareOpen: boolean;
  isMatchConvocationOpen: boolean;
  isModernSleek: boolean;
  liveClubName: string;
  liveClubSlug: string | null;
  liveEditorAccess: EditorAccess | null;
  liveShareBusy: boolean;
  liveShareError: string | null;
  matchConvocationGroup: () => { id: string; name: string; number: any; status: any; }[];
  onOpenTrialModal: (() => void) | undefined;
  setIsLiveMatchUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveShareOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMatchConvocationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  teams: TeamCategory[];
}

export default function LiveShareModals({
  activeLivePublicId,
  activeMatch,
  activeTeamId,
  handlePublishActiveLive,
  handleRegenerateLiveEditor,
  handleRevokeLiveEditor,
  isClubTeamName,
  isLiveMatchUpgradeModalOpen,
  isLiveShareOpen,
  isMatchConvocationOpen,
  isModernSleek,
  liveClubName,
  liveClubSlug,
  liveEditorAccess,
  liveShareBusy,
  liveShareError,
  matchConvocationGroup,
  onOpenTrialModal,
  setIsLiveMatchUpgradeModalOpen,
  setIsLiveShareOpen,
  setIsMatchConvocationOpen,
  setSleekToastMessage,
  teams,
}: LiveShareModalsProps) {
  return (
    <>
        {/* LIVE MATCH PRO+ UPGRADE PROMPT MODAL */}
        <LiveShareModal
          open={isLiveShareOpen}
          onClose={() => setIsLiveShareOpen(false)}
          isLight={isModernSleek}
          matchTitle={`${activeMatch.homeTeam} vs ${activeMatch.awayTeam}`}
          clubName={liveClubName}
          publicId={activeLivePublicId}
          clubSlug={liveClubSlug}
          editor={liveEditorAccess}
          busy={liveShareBusy}
          error={liveShareError}
          onPublish={handlePublishActiveLive}
          onRegenerate={handleRegenerateLiveEditor}
          onRevoke={handleRevokeLiveEditor}
        />

        {isMatchConvocationOpen && activeMatch.id && (() => {
          const awayIsClub = isClubTeamName(activeMatch.awayTeam) && !isClubTeamName(activeMatch.homeTeam);
          const teamId = activeMatch.teamId || activeTeamId;
          return (
            <MatchConvocationModal
              isModernSleek={isModernSleek}
              teamId={teamId}
              teamName={teams.find((t) => t.id === teamId)?.name || (awayIsClub ? activeMatch.awayTeam : activeMatch.homeTeam) || "Mon équipe"}
              match={{ id: activeMatch.id, competition: activeMatch.competition, date: (activeMatch as any).date, time: (activeMatch as any).time }}
              opponent={(awayIsClub ? activeMatch.homeTeam : activeMatch.awayTeam) || ""}
              isHome={!awayIsClub}
              players={matchConvocationGroup()}
              onClose={() => setIsMatchConvocationOpen(false)}
              onSent={(msg) => {
                setSleekToastMessage(msg);
                setTimeout(() => setSleekToastMessage(null), 3500);
              }}
            />
          );
        })()}

        {isLiveMatchUpgradeModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
            <div className={`border max-w-lg w-full rounded-2xl sm:rounded-3xl p-6 shadow-2xl relative overflow-hidden ${isModernSleek ? "bg-white border-amber-500 text-slate-900" : "bg-[#0b0e14] border-amber-500/60 text-white"
              }`}>
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/30 via-amber-500/20 to-amber-400/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0 text-amber-500 shadow-lg">
                  🔴
                </div>
                <div>
                  <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit mb-1">
                    <Sparkles className="w-3 h-3" /> EXCLUSIVITÉ FORMULE PRO+ (14,90 €)
                  </span>
                  <h3 className={`text-base font-black uppercase leading-snug ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                    Mode Live Match & Chronomètre Officiel
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isModernSleek ? "text-slate-600" : "text-slate-300"}`}>
                    Le suivi de match en direct est réservé à la formule <strong className="text-amber-500">PRO+</strong>.
                  </p>
                </div>
              </div>

              <div className={`border rounded-xl p-4 my-4 space-y-2.5 relative z-10 text-xs ${isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#121926] border-[#1f293d] text-slate-300"
                }`}>
                <p className="font-bold text-amber-500 uppercase text-[11px] tracking-wider border-b pb-1.5 flex items-center gap-1.5 border-slate-200 dark:border-[#1f293d]">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fonctionnalités Live Match Débloquées en PRO+ :</span>
                </p>
                <ul className="space-y-2 text-[11px]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#00E599] font-black">✓</span>
                    <span><strong>Chronomètre & Périodes de Match</strong> : Suivi 1ère/2ème mi-temps et temps additionnel.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00E599] font-black">✓</span>
                    <span><strong>Saisie Instantanée des Buts & Passes</strong> : Enregistrez les buteurs ⚽ et passeurs 👟 en direct.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00E599] font-black">✓</span>
                    <span><strong>Cartons & Blessures</strong> : Distribution des cartons 🟨🟥 et gestion des sorties sur blessure.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00E599] font-black">✓</span>
                    <span><strong>Remplacements Tactiques</strong> : Entrées/sorties directes sur le tableau avec mise à jour du 11.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 relative z-10">
                <button
                  onClick={() => {
                    setIsLiveMatchUpgradeModalOpen(false);
                    if (onOpenTrialModal) onOpenTrialModal();
                  }}
                  className="w-full sm:flex-1 h-11 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-rose-400 text-slate-950 font-black text-xs uppercase rounded-xl hover:brightness-110 transition shadow-lg inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Passer à la Formule PRO+ (14,90 €/m)</span>
                </button>
                <button
                  onClick={() => setIsLiveMatchUpgradeModalOpen(false)}
                  className={`w-full sm:w-auto h-11 px-5 rounded-xl font-bold text-xs inline-flex items-center justify-center whitespace-nowrap transition border cursor-pointer ${isModernSleek
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    : "bg-[#161c28] hover:bg-[#1e2738] text-white border-[#233149]"
                    }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
    </>
  );
}
