"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import LogoIcon from "../../LogoIcon";
import { PWAInstallButton } from "../../PWAInstallButton";
import { type TrialTimeRemaining } from "../../TrialCountdownModal";
import { LiveTrialCountdownLabel } from "@/components/tactics/LiveTrialCountdownLabel";
import { type Language, type translations } from "@/lib/i18n";
import { type CoachProfile } from "@/lib/tactics/types";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Maximize2, Minimize2, type User } from "lucide-react";

export interface TopHeaderProps {
  activeCoach: CoachProfile;
  currentLang: Language;
  currentPlan: any;
  handleOpenUserConfig: () => void;
  hasHadPaidSubscription: boolean;
  isCompactUI: boolean;
  isModernSleek: boolean;
  isPaidSubscriber: boolean;
  isPitchFullscreen: boolean;
  isRightSidebarOpen: boolean;
  isUserAdmin: boolean;
  isUserMenuOpen: boolean;
  liveTrialStatus: TrialTimeRemaining;
  onLogout: (() => void) | undefined;
  onOpenAdminPlatform: ((tab?: any, sectionId?: string | undefined) => void) | undefined;
  onOpenLegalModal: ((tab?: any) => void) | undefined;
  onOpenSupportModal: (() => void) | undefined;
  onOpenTrialModal: (() => void) | undefined;
  onOpenTutorial: (() => void) | undefined;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUserGuideModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUserMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t: (typeof translations)[Language];
  togglePitchFullscreen: () => Promise<void>;
}

export default function TopHeader({
  activeCoach,
  currentLang,
  currentPlan,
  handleOpenUserConfig,
  hasHadPaidSubscription,
  isCompactUI,
  isModernSleek,
  isPaidSubscriber,
  isPitchFullscreen,
  isRightSidebarOpen,
  isUserAdmin,
  isUserMenuOpen,
  liveTrialStatus,
  onLogout,
  onOpenAdminPlatform,
  onOpenLegalModal,
  onOpenSupportModal,
  onOpenTrialModal,
  onOpenTutorial,
  setIsCheckoutOpen,
  setIsRightSidebarOpen,
  setIsUserGuideModalOpen,
  setIsUserMenuOpen,
  t,
  togglePitchFullscreen,
}: TopHeaderProps) {
  return (
    <>
        {/* 1. TOP HEADER NAVBAR */}
        <header
          id="tour-top-header"
          className={`${isModernSleek
            ? isCompactUI
              ? "h-14 px-3 sm:px-4 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-xs text-slate-900"
              : "h-14 sm:h-16 px-3 sm:px-6 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm text-slate-900"
            : isCompactUI
              ? "h-12 px-2.5 sm:px-3.5 border-b border-[#1f293d] bg-[#0d1117]"
              : "h-14 sm:h-16 px-3 sm:px-6 border-b border-[#1f293d] bg-[#0d1117]"
            } flex items-center justify-between gap-2 relative z-40 flex-shrink-0 transition-all duration-300`}
        >

          {/* Left Brand info */}
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            {/* Logo badge SVG */}
            {/* Identique au logo de la landing page (LandingPage.tsx) */}
            <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
              <LogoIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${isModernSleek ? "text-slate-900" : "text-white"} flex-shrink-0`} />
              <div className="text-left select-none">
                <div className="flex items-center gap-2">
                  <h1 className={`text-xl sm:text-2xl font-black tracking-wider leading-none lowercase whitespace-nowrap ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                    the box
                  </h1>
                  {(isUserAdmin || isPaidSubscriber) && (
                    <span className="tb-pro-badge hidden sm:inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded whitespace-nowrap">
                      {isUserAdmin || currentPlan === "club" ? "Pro Club" : currentPlan === "pro_plus" || currentPlan === "annuel" ? "Pro+" : "Pro"}
                    </span>
                  )}
                </div>
                <p className={`hidden sm:block whitespace-nowrap text-[8.5px] ${isModernSleek ? "text-slate-500" : "text-white/70"} font-black uppercase tracking-[0.22em] leading-none mt-1`}>
                  zone de décision tactique
                </p>
              </div>
            </div>
          </div>

          {/* CENTER CONTROLS: TRIAL COUNTDOWN BADGE & USER ACCOUNT */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Trial / Creator / Subscriber Badge */}
            {isUserAdmin ? null : isPaidSubscriber ? (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${isModernSleek
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-[#d4af37]/10 text-[#e9c349] border-[#d4af37]/45 hover:bg-[#d4af37]/20"
                  }`}
                title={`Formule ${currentPlan.toUpperCase()} active. Cliquez pour gérer vos offres et formules.`}
              >
                {isModernSleek && <span>✨</span>}
                <span className="font-bold hidden sm:inline">
                  Formule {currentPlan === "pro_plus" || currentPlan === "annuel" || currentPlan === "club" ? "PRO+" : "PRO"}
                </span>
                <span className="sm:hidden text-[10px] font-bold">
                  {currentPlan === "pro_plus" || currentPlan === "annuel" || currentPlan === "club" ? "PRO+" : "PRO"}
                </span>
              </button>
            ) : hasHadPaidSubscription ? (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${isModernSleek
                  ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                  : "bg-[#121926] text-slate-300 border-[#1f293d] hover:border-slate-500"
                  }`}
                title={t.tactics.freeBadgeTooltip}
              >
                <span>⚪</span>
                <span className="font-bold hidden sm:inline">Formule Gratuite</span>
                <span className="sm:hidden text-[10px] font-bold">Gratuit</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onOpenTrialModal) onOpenTrialModal();
                }}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${liveTrialStatus.isExpired
                  ? isModernSleek ? "bg-slate-100 text-slate-600 border-slate-300" : "bg-[#121926] text-slate-400 border-[#1f293d] hover:border-slate-500"
                  : isModernSleek
                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-[#d4af37]/10 text-[#e9c349] border-[#d4af37]/45 hover:bg-[#d4af37]/20"
                  }`}
                title={t.tactics.trialBadgeTooltip}
              >
                <span className={`${liveTrialStatus.isExpired ? "" : "animate-pulse"} ${isModernSleek ? "" : "hidden"}`}>
                  {liveTrialStatus.isExpired ? "⏳" : "⏰"}
                </span>
                <span className="font-mono hidden lg:inline whitespace-nowrap">
                  {liveTrialStatus.isExpired ? (
                    "Essai expiré (Gratuit)"
                  ) : (
                    <LiveTrialCountdownLabel createdAt={activeCoach?.createdAt} bonusDays={activeCoach?.trialBonusDays || 0} trialEndsAt={activeCoach?.trialEndsAt} />
                  )}
                </span>
                <span className="font-mono lg:hidden whitespace-nowrap text-[10px] font-bold">
                  {liveTrialStatus.isExpired ? "Expiré" : `${liveTrialStatus.days}j ${liveTrialStatus.hours}h`}
                </span>
              </button>
            )}

            {/* Right tools and account card */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

              {/* Guide / Tutoriel Coach Button - Only for non-admin coaches */}
              {!isUserAdmin && (
                <button
                  onClick={() => {
                    if (onOpenTutorial) onOpenTutorial();
                  }}
                  className={`hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl ${isModernSleek
                    ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-500 shadow-xs"
                    : "bg-[#0d141f] hover:bg-[#152030] border-[#1f293d] hover:border-[#00E599] text-slate-200"
                    } border text-[10px] font-bold transition cursor-pointer shadow-sm group`}
                  title={t.tactics.tutorialTooltip}
                >
                  <span className="text-xs group-hover:scale-110 transition-transform">🎓</span>
                  <span className={`font-semibold hidden xl:inline whitespace-nowrap ${isModernSleek ? "text-slate-700 group-hover:text-emerald-800" : "text-slate-200 group-hover:text-[#00E599]"}`}>Tuto Coach</span>
                </button>
              )}

              {/* Plein écran : action prioritaire, placée dans l'en-tête */}
              <button
                type="button"
                onClick={togglePitchFullscreen}
                className={`h-8 px-2 xl:px-3 rounded-lg font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 select-none shrink-0 ${isModernSleek
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-sm"
                  : "bg-[#00E599] hover:bg-[#33edad] text-[#04120c]"
                  }`}
                title={isPitchFullscreen ? t.tactics.pitchModes.fullscreenExit : t.tactics.pitchModes.fullscreenEnter}
              >
                {isPitchFullscreen ? <Minimize2 className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" /> : <Maximize2 className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />}
                <span className="hidden lg:inline uppercase tracking-wide text-[10px] font-black whitespace-nowrap">
                  {isPitchFullscreen ? t.tactics.pitchModes.fullscreenExit : t.tactics.pitchModes.fullscreenEnter}
                </span>
              </button>

              <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className={`p-1.5 sm:p-2 ${isModernSleek
                  ? "hover:bg-slate-100 border border-slate-200 bg-white text-slate-600 hover:text-emerald-800 shadow-xs"
                  : "hover:bg-[#1f293d] border border-[#1f293d] text-[#62728f] hover:text-[#00E599]"
                  } rounded-xl transition cursor-pointer flex items-center justify-center shrink-0`}
                title={isRightSidebarOpen ? (currentLang === "en" ? "Hide right panel" : "Masquer le menu droit") : (currentLang === "en" ? "Show right panel" : "Afficher le menu droit")}
              >
                {isRightSidebarOpen ? <ChevronRight className={`h-4 w-4 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} /> : <ChevronLeft className="h-4 w-4" />}
              </button>

              {/* PWA In-App Install Button */}
              <PWAInstallButton isModernSleek={isModernSleek} />

              <div className={`h-6 w-[1.5px] ${isModernSleek ? "bg-slate-200" : "bg-[#1f293d]"} hidden sm:block`} />

              {/* User Coach Account profile card */}
              <div className="relative z-50">
                {/* Click-away backdrop */}
                {isUserMenuOpen && (
                  <div
                    className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                    onClick={() => setIsUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                )}

                <button
                  type="button"
                  id="tour-user-menu-btn"
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 sm:gap-2.5 ${isModernSleek
                    ? "bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-slate-800"
                    : "bg-[#171f2c] hover:border-[#354563] border border-[#222d41]"
                    } p-1 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer select-none`}
                  title={t.userMenu.profileTitle}
                  aria-label={t.userMenu.profileAriaLabel}
                  aria-expanded={isUserMenuOpen}
                >
                  <div className={`w-7 h-7 flex items-center justify-center font-black text-xs text-white shrink-0 ${!isModernSleek
                    ? "rounded-lg bg-[#d4af37] !text-[#241a00]"
                    : isUserAdmin
                    ? "rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 font-black ring-2 ring-amber-400/50"
                    : "rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}>
                    {activeCoach?.firstName ? activeCoach.firstName.charAt(0) : "C"}{activeCoach?.lastName ? activeCoach.lastName.charAt(0) : "P"}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className={`text-xs font-black whitespace-nowrap ${isModernSleek ? "text-slate-900" : "text-white"} leading-none flex items-center gap-1`}>
                      <span>{activeCoach?.firstName || "Coach"} {activeCoach?.lastName || "Principal"}</span>
                      {isUserAdmin && <span className={`text-[9px] bg-amber-500/20 font-black px-1 rounded border border-amber-500/30 ${isModernSleek ? "text-amber-700" : "text-[#e9c349]"}`}>{t.userMenu.adminBadge}</span>}
                      <ChevronDown className={`h-3 w-3 ${isModernSleek ? "text-slate-400" : "text-[#62728f]"} transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                    </p>
                    <p className={`text-[9px] ${isModernSleek ? "text-slate-500 font-bold" : "text-slate-400 font-black"} uppercase tracking-wider leading-none mt-1`}>
                      {isUserAdmin ? t.userMenu.platformAdmin : (currentLang === "en" ? (
                        activeCoach?.role === "Coach Principal" ? t.userModal.roles.principal :
                          activeCoach?.role === "Entraîneur Adjoint" ? t.userModal.roles.adjoint :
                            activeCoach?.role === "Analyste Vidéo / Tactique" ? t.userModal.roles.analyst :
                              activeCoach?.role === "Préparateur Physique" ? t.userModal.roles.fitness :
                                activeCoach?.role === "Responsable Technique" ? t.userModal.roles.techDirector :
                                  (activeCoach?.role || t.userModal.roles.principal)
                      ) : (activeCoach?.role || "Coach Principal"))}
                    </p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 sm:hidden ${isModernSleek ? "text-slate-500" : "text-[#62728f]"} shrink-0 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profiles switching card popup */}
                {isUserMenuOpen && (
                  <div className={`absolute right-0 top-full mt-2 ${isModernSleek
                    ? "bg-white border border-slate-200 shadow-2xl text-slate-800"
                    : "bg-[#0d1117] border border-[#1f293d] shadow-2xl text-white"
                    } rounded-2xl p-2.5 w-72 max-w-[calc(100vw-20px)] z-50 animate-fade-in`}>
                    {/* Mobile Identity Header (shows full name & role when collapsed on small screens) */}
                    <div className="sm:hidden flex items-center gap-2.5 pb-2.5 mb-2 border-b border-[#1f293d]/50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 ${isUserAdmin
                        ? "bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 font-black ring-2 ring-amber-400/50"
                        : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}>
                        {activeCoach?.firstName ? activeCoach.firstName.charAt(0) : "C"}{activeCoach?.lastName ? activeCoach.lastName.charAt(0) : "P"}
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className={`text-xs font-black ${isModernSleek ? "text-slate-900" : "text-white"} truncate`}>
                          {activeCoach?.firstName || "Coach"} {activeCoach?.lastName || "Principal"}
                        </p>
                        <p className={`text-[9px] ${isModernSleek ? "text-slate-500" : "text-[#62728f]"} font-bold uppercase tracking-wider truncate`}>
                          {isUserAdmin ? t.userMenu.platformAdmin : (currentLang === "en" ? (
                            activeCoach?.role === "Coach Principal" ? t.userModal.roles.principal :
                              activeCoach?.role === "Entraîneur Adjoint" ? t.userModal.roles.adjoint :
                                activeCoach?.role === "Analyste Vidéo / Tactique" ? t.userModal.roles.analyst :
                                  activeCoach?.role === "Préparateur Physique" ? t.userModal.roles.fitness :
                                    activeCoach?.role === "Responsable Technique" ? t.userModal.roles.techDirector :
                                      (activeCoach?.role || t.userModal.roles.principal)
                          ) : (activeCoach?.role || "Coach Principal"))}
                        </p>
                      </div>
                    </div>

                    {isUserAdmin && (
                      <div className={`p-2 border-b ${isModernSleek ? "border-amber-200 bg-amber-50 text-amber-900" : "border-amber-500/30 bg-amber-950/30 text-amber-300"} rounded-lg mb-2`}>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onOpenAdminPlatform) onOpenAdminPlatform("subscriptions");
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-md text-xs font-black hover:opacity-80 flex items-center gap-2 transition cursor-pointer"
                        >
                          <span>👑</span>
                          <span>{t.userMenu.adminConsole}</span>
                        </button>
                      </div>
                    )}

                    {!isUserAdmin && (
                      isPaidSubscriber ? (
                        <>
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsCheckoutOpen(true);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${isModernSleek ? "text-emerald-800 hover:bg-slate-50 border-slate-200" : "text-emerald-400 hover:bg-[#1a2333] border-[#1f293d]"
                              } transition flex items-center justify-between border-b pb-2 mb-1 cursor-pointer`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span>✨</span>
                              <span>{currentPlan === "pro_plus" || currentPlan === "annuel" || currentPlan === "club" ? t.userMenu.proPlusPlan : t.userMenu.proPlan}</span>
                            </span>
                            <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded border ${isModernSleek ? "text-emerald-800 bg-emerald-100 border-emerald-300" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              }`}>{t.userMenu.activeBadge}</span>
                          </button>

                          {/* Bouton de désabonnement direct dans le menu profil */}
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsCheckoutOpen(true);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-between cursor-pointer mb-1 border-b border-rose-500/20 pb-2"
                            title={t.userMenu.unsubscribeTooltip}
                          >
                            <span className="flex items-center gap-1.5">
                              <span>🛑</span>
                              <span>{t.userMenu.unsubscribe}</span>
                            </span>
                            <span className="text-[9px] uppercase font-black text-rose-500 px-1.5 py-0.2 rounded bg-rose-500/10">{t.userMenu.unsubscribeConfirmTitle}</span>
                          </button>
                        </>
                      ) : hasHadPaidSubscription ? (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsCheckoutOpen(true);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${isModernSleek ? "text-slate-700 hover:bg-slate-50 border-slate-200" : "text-slate-300 hover:bg-[#1a2333] border-[#1f293d]"
                            } transition flex items-center justify-between border-b pb-2 mb-1 cursor-pointer`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>⚪</span>
                            <span>{t.userMenu.freePlan}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-black bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-500/20">{t.userMenu.activeBadge}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onOpenTrialModal) onOpenTrialModal();
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${isModernSleek ? "text-amber-700 hover:bg-slate-50 border-slate-200" : "text-amber-300 hover:bg-[#1a2333] border-[#1f293d]"
                            } transition flex items-center justify-between border-b pb-2 mb-1 cursor-pointer`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>⏰</span>
                            <span>{t.userMenu.demoTrialTime}</span>
                          </span>
                          <span className="text-[10px] font-mono text-amber-600 font-black">{liveTrialStatus.days}j {liveTrialStatus.hours}h</span>
                        </button>
                      )
                    )}
                    {!isUserAdmin && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onOpenTutorial) onOpenTutorial();
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-800" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                          } transition flex items-center gap-1.5 cursor-pointer`}
                      >
                        <span>🎓</span>
                        <span>{t.userMenu.tutorial}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsUserGuideModalOpen(true);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-800" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                        } transition flex items-center gap-1.5 cursor-pointer`}
                    >
                      <span>📖</span>
                      <span>{t.userMenu.userGuide}</span>
                    </button>
                    {onOpenLegalModal && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenLegalModal("faq");
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-800" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                          } transition flex items-center gap-1.5 cursor-pointer`}
                      >
                        <span>❓</span>
                        <span>{t.userMenu.faq}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onOpenSupportModal) {
                          onOpenSupportModal();
                        } else {
                          window.location.href = "mailto:support@thebox-tactique.com?subject=%5BSupport%5D%20Demande%20d'aide%20coach";
                        }
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-800" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                        } transition flex items-center gap-1.5 cursor-pointer`}
                    >
                      <span>✉️</span>
                      <span>{t.userMenu.contactSupport}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleOpenUserConfig();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-800" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                        } transition flex items-center gap-1.5 cursor-pointer`}
                    >
                      <span>⚙️</span>
                      <span>{t.userMenu.profileConfig}</span>
                    </button>
                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 mt-1 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"
                          } pt-2 flex items-center justify-between transition cursor-pointer`}
                      >
                        <span>🚪 {t.userMenu.logout}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  } else {
                    alert("Déconnexion sécurisée.");
                  }
                }}
                className="p-1.5 sm:p-2 hover:bg-[#1f293d] border border-[#1f293d] rounded-xl text-[#62728f] hover:text-[#00E599] transition cursor-pointer hidden sm:flex items-center justify-center shrink-0"
                title={t.userMenu.logoutTooltip}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>

        </header>
    </>
  );
}
