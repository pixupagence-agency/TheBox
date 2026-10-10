"use client";

import React, { useState, useEffect } from "react";
import { Award, Clock, Sparkles, CheckCircle, Shield, ArrowRight, Zap, X } from "lucide-react";

export const TRIAL_DURATION_DAYS = 14;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface TrialTimeRemaining {
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  percentRemaining: number;
  daysPassed: number;
  totalTrialDays: number;
}

export function calculateTrialRemaining(createdAtStr?: string, bonusDays: number = 0): TrialTimeRemaining {
  const totalDays = TRIAL_DURATION_DAYS + (bonusDays || 0);

  let startDate: number;
  if (createdAtStr && !isNaN(new Date(createdAtStr).getTime())) {
    startDate = new Date(createdAtStr).getTime();
  } else {
    if (typeof window !== "undefined") {
      let saved = localStorage.getItem("thebox_demo_init_time");
      if (!saved || isNaN(parseInt(saved, 10))) {
        saved = String(Date.now());
        localStorage.setItem("thebox_demo_init_time", saved);
      }
      startDate = parseInt(saved, 10);
    } else {
      startDate = Date.now();
    }
  }

  const baseEndDate = startDate + TRIAL_DURATION_MS;
  const bonusMs = (bonusDays || 0) * 24 * 60 * 60 * 1000;
  const now = Date.now();

  let endDate = baseEndDate + bonusMs;
  // If base trial was already expired and bonus days are added, extend from now
  if (baseEndDate < now && bonusDays > 0) {
    endDate = Math.max(endDate, now + bonusMs);
  }

  const diff = endDate - now;

  if (diff <= 0) {
    return {
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      percentRemaining: 0,
      daysPassed: totalDays,
      totalTrialDays: totalDays,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const totalMs = totalDays * 24 * 60 * 60 * 1000;
  const percentRemaining = Math.max(0, Math.min(100, (diff / totalMs) * 100));

  const msPassed = Math.max(0, now - startDate);
  const daysPassed = Math.min(totalDays, Math.max(1, Math.ceil(msPassed / (1000 * 60 * 60 * 24))));

  return {
    isExpired: false,
    days,
    hours,
    minutes,
    seconds,
    percentRemaining,
    daysPassed,
    totalTrialDays: totalDays,
  };
}

interface TrialCountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  createdAt?: string;
  trialBonusDays?: number;
  isNewAccountWelcome?: boolean;
  onOpenCheckout?: () => void;
  coachName?: string;
  isAdmin?: boolean;
  coachEmail?: string;
  onAddBonusDays?: (days: number) => void;
  onResetDemo?: () => void;
  isModernSleek?: boolean;
}

export default function TrialCountdownModal({
  isOpen,
  onClose,
  createdAt,
  trialBonusDays = 0,
  isNewAccountWelcome = false,
  onOpenCheckout,
  coachName = "Coach",
  isAdmin = false,
  coachEmail = "",
  onAddBonusDays,
  onResetDemo,
  isModernSleek = false,
}: TrialCountdownModalProps) {
  const isCreatorAdmin = Boolean(
    isAdmin || 
    coachEmail.toLowerCase().includes("pixup") || 
    coachEmail.toLowerCase() === "pixup.agence@gmail.com"
  );

  const [remaining, setRemaining] = useState<TrialTimeRemaining>(() =>
    calculateTrialRemaining(createdAt, trialBonusDays)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(calculateTrialRemaining(createdAt, trialBonusDays));
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, trialBonusDays]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
      <div className={`max-w-xl w-full rounded-2xl sm:rounded-3xl shadow-2xl relative my-auto overflow-hidden border ${
        isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
      }`}>
        
        {/* Glow visual accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER */}
        <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between relative z-10 ${
          isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#0f141d] border-[#1f293d] text-white"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isModernSleek ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border-amber-500/40 text-amber-400"
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-black tracking-wide ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                  {isCreatorAdmin ? "Compte Créateur & Admin" : "Période d'Essai Pro"}
                </h3>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  isModernSleek ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-amber-500/15 border-amber-500/40 text-amber-400"
                }`}>
                  {isCreatorAdmin ? "ADMIN" : `${remaining.totalTrialDays} JOURS`}
                </span>
              </div>
              <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                {isCreatorAdmin ? "Accès total et illimité à toute la plateforme The Box." : "Profitez de l'accès Pro et Pro+ offert."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
            }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 relative z-10 space-y-4">

        {/* COUNTDOWN TIMER / CREATOR UNLIMITED BOX */}
        <div className={`border rounded-2xl p-4 mb-5 shadow-inner relative z-10 ${
          isModernSleek ? "bg-slate-50 border-slate-200" : "bg-gradient-to-br from-[#090d14] via-[#0f1724] to-[#090d14] border-[#1f293d]"
        }`}>
          <div className={`flex items-center justify-between mb-3 border-b pb-2 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{isCreatorAdmin ? "Statut de votre compte Créateur" : "Temps Restant avant la formule Gratuite"}</span>
            </span>
            <span className="text-xs font-black text-amber-500 font-mono">
              {isCreatorAdmin ? "∞ ACCÈS PERMANENT ET ILLIMITÉ" : remaining.isExpired ? "PÉRIODE D'ESSAI EXPIRÉE" : `${remaining.percentRemaining.toFixed(0)}% restant`}
            </span>
          </div>

          {/* Live 4-box countdown grid */}
          {!remaining.isExpired ? (
            <div className="grid grid-cols-4 gap-2 text-center my-2">
              <div className={`border rounded-xl p-2 shadow-inner ${isModernSleek ? "bg-white border-slate-200" : "bg-[#121926] border-[#222d41]"}`}>
                <div className="text-xl sm:text-2xl font-black text-amber-500 font-mono leading-none">
                  {String(remaining.days).padStart(2, '0')}
                </div>
                <div className={`text-[9px] font-bold uppercase mt-1 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Jours</div>
              </div>
              <div className={`border rounded-xl p-2 shadow-inner ${isModernSleek ? "bg-white border-slate-200" : "bg-[#121926] border-[#222d41]"}`}>
                <div className={`text-xl sm:text-2xl font-black font-mono leading-none ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                  {String(remaining.hours).padStart(2, '0')}
                </div>
                <div className={`text-[9px] font-bold uppercase mt-1 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Heures</div>
              </div>
              <div className={`border rounded-xl p-2 shadow-inner ${isModernSleek ? "bg-white border-slate-200" : "bg-[#121926] border-[#222d41]"}`}>
                <div className={`text-xl sm:text-2xl font-black font-mono leading-none ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                  {String(remaining.minutes).padStart(2, '0')}
                </div>
                <div className={`text-[9px] font-bold uppercase mt-1 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Minutes</div>
              </div>
              <div className={`border rounded-xl p-2 shadow-inner ${isModernSleek ? "bg-white border-slate-200" : "bg-[#121926] border-[#222d41]"}`}>
                <div className={`text-xl sm:text-2xl font-black font-mono leading-none animate-pulse ${
                  isModernSleek ? "text-emerald-800" : "text-[#00E599]"
                }`}>
                  {String(remaining.seconds).padStart(2, '0')}
                </div>
                <div className={`text-[9px] font-bold uppercase mt-1 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Secondes</div>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center bg-rose-950/40 border border-rose-500/40 rounded-xl my-2 text-xs text-rose-200 font-bold">
              Votre période d&apos;essai gratuit de 14 jours s&apos;est achevée. Vous êtes actuellement sur la formule gratuite.
            </div>
          )}

          {/* Quick Demo Simulator / Extension Controls */}
          {(onAddBonusDays || onResetDemo) && (
            <div className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
              <span className={`text-[10px] font-bold ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Actions Démo :</span>
              <div className="flex items-center gap-1.5">
                {onAddBonusDays && (
                  <button
                    type="button"
                    onClick={() => onAddBonusDays(7)}
                    className={`px-2.5 py-1 text-amber-600 hover:text-amber-700 border border-amber-500/40 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                      isModernSleek ? "bg-amber-50 hover:bg-amber-100" : "bg-[#1a253a] hover:bg-[#22334f]"
                    }`}
                    title="Ajouter 7 jours supplémentaires à la démo"
                  >
                    <span>🎁 +7 Jours</span>
                  </button>
                )}
                {onResetDemo && (
                  <button
                    type="button"
                    onClick={onResetDemo}
                    className={`px-2.5 py-1 border rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                      isModernSleek 
                        ? "text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100" 
                        : "text-emerald-400 border-emerald-500/40 bg-[#1a253a] hover:bg-[#22334f]"
                    }`}
                    title="Remettre le compteur de démo à 14 jours complets"
                  >
                    <span>🔄 Réinitialiser (14j)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden border mt-3 ${isModernSleek ? "bg-slate-200 border-slate-300" : "bg-[#121926] border-[#1f293d]"}`}>
            <div
              className="bg-gradient-to-r from-amber-500 via-emerald-400 to-[#00E599] h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(2, remaining.percentRemaining)}%` }}
            />
          </div>
        </div>

        {/* INCLUDED PRO & PRO+ FEATURES LIST */}
        <div className="space-y-2 mb-5 relative z-10">
          <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isModernSleek ? "text-slate-600" : "text-[#62728f]"}`}>
            <Zap className={`w-3 h-3 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
            <span>Fonctionnalités débloquées pendant vos 14 jours :</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
              isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#090d14] border-[#1f293d] text-slate-200"
            }`}>
              <CheckCircle className={`w-4 h-4 shrink-0 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
              <span>Analyste Tactique & Playbook Pro</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
              isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#090d14] border-[#1f293d] text-slate-200"
            }`}>
              <CheckCircle className={`w-4 h-4 shrink-0 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
              <span>Export HD Carte 3D Squad View</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
              isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#090d14] border-[#1f293d] text-slate-200"
            }`}>
              <CheckCircle className={`w-4 h-4 shrink-0 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
              <span>Mode Match Live & Remplacements</span>
            </div>
            <div className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
              isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#090d14] border-[#1f293d] text-slate-200"
            }`}>
              <CheckCircle className={`w-4 h-4 shrink-0 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
              <span>Dictée Vocale Notes Tactiques PRO</span>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className={`p-3 rounded-xl border text-[10px] font-medium mb-5 flex items-center gap-2 ${
          isModernSleek ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-[#121926] border-[#1f293d] text-slate-300"
        }`}>
          <Shield className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Aucune carte bancaire requise. À la fin des 14 jours, votre compte passera automatiquement en mode **Gratuit** (accès conservé aux fonctionnalités de base).
          </span>
        </div>

        {/* ACTION BUTTONS */}
        <div className={`pt-3 flex flex-wrap items-center justify-end gap-2.5 relative z-10 border-t ${
          isModernSleek ? "border-slate-200" : "border-[#1f293d]"
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#161c28] hover:bg-[#1e2738] text-white font-bold text-xs transition border border-[#233149] cursor-pointer"
          >
            {isNewAccountWelcome ? "Commencer à utiliser THE BOX" : "Continuer mon entraînement"}
          </button>

          {onOpenCheckout && (
            <button
              onClick={() => {
                onClose();
                onOpenCheckout();
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Découvrir les Offres Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        </div>
      </div>
    </div>
  );
}
