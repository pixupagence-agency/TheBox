"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { Award, Sparkles } from "lucide-react";

export interface MultiTeamUpgradeModalProps {
  isModernSleek: boolean;
  isMultiTeamUpgradeModalOpen: boolean;
  onOpenTrialModal: (() => void) | undefined;
  setIsMultiTeamUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MultiTeamUpgradeModal({
  isModernSleek,
  isMultiTeamUpgradeModalOpen,
  onOpenTrialModal,
  setIsMultiTeamUpgradeModalOpen,
}: MultiTeamUpgradeModalProps) {
  return (
    <>
        {/* MULTI-TEAM PRO UPGRADE PROMPT MODAL */}
        {isMultiTeamUpgradeModalOpen && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
            <div className={`border max-w-lg w-full rounded-2xl sm:rounded-3xl p-6 shadow-2xl relative overflow-hidden ${isModernSleek ? "bg-white border-amber-500 text-slate-900" : "bg-[#0b0e14] border-amber-500/50 text-white"
              }`}>
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-amber-400/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0 text-amber-500 shadow-lg">
                  🔒
                </div>
                <div>
                  <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit mb-1">
                    <Award className="w-3 h-3" /> EXCLUSIVITÉ ABONNÉS PRO & CLUB ÉLITE
                  </span>
                  <h3 className={`text-base font-black uppercase leading-snug ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                    Gestion Multi-Équipes des Schémas Tactiques
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isModernSleek ? "text-slate-600" : "text-slate-300"}`}>
                    En formule <strong className={isModernSleek ? "text-slate-900" : "text-white"}>Gratuite</strong>, votre compte est limité à la gestion des schémas tactiques pour <strong className="text-amber-500">1 seule équipe</strong>.
                  </p>
                </div>
              </div>

              <div className={`border rounded-xl p-4 my-4 space-y-2.5 relative z-10 text-xs ${isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#121926] border-[#1f293d] text-slate-300"
                }`}>
                <p className="font-bold text-amber-500 uppercase text-[11px] tracking-wider border-b pb-1.5 flex items-center gap-1.5 border-slate-200 dark:border-[#1f293d]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fonctionnalités Multi-Équipes Débloquées en PRO :</span>
                </p>
                <ul className="space-y-2 text-[11px]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#00E599] font-black">✓</span>
                    <span><strong>Création d&apos;Équipes Illimités</strong> : Séniors A, Séniors B, U19, U17, Féminines...</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00E599] font-black">✓</span>
                    <span><strong>Classement des Schémas</strong> : Associez chaque schéma tactique à son équipe propre.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00E599] font-black">✓</span>
                    <span><strong>Bascule Instantanée</strong> : Changez d&apos;équipe sur le tableau tactique en 1 clic.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00E599] font-black">✓</span>
                    <span><strong>Partage avec Adjoints</strong> : Exportez les consignes tactiques personnalisées par équipe.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 relative z-10">
                <button
                  onClick={() => {
                    setIsMultiTeamUpgradeModalOpen(false);
                    if (onOpenTrialModal) onOpenTrialModal();
                  }}
                  className="w-full sm:flex-1 h-11 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl hover:brightness-110 transition shadow-lg inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Débloquer l&apos;Accès PRO (Essai 14j Offert)</span>
                </button>
                <button
                  onClick={() => setIsMultiTeamUpgradeModalOpen(false)}
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

    </>
  );
}
