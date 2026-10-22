"use client";

import React from "react";
import { 
  Users, ArrowRight, Zap, Activity, LogIn, UserPlus, 
  Trophy, Target, Check, Share2, HelpCircle, FileText, Scale, Mail,
  Monitor, Tv, Tablet, Sparkles, CheckCircle2
} from "lucide-react";
import { CoachProfile } from "@/app/page";
import SportIcon from "./SportIcon";
import LogoIcon from "./LogoIcon";
import { LegalTab } from "./LegalAndFaqModal";
import LandingContactSection from "./LandingContactSection";
import { Language, getStoredLanguage, setStoredLanguage, translations } from "@/lib/i18n";

interface LandingPageProps {
  coaches: CoachProfile[];
  activeCoachId: string;
  onLoginAsCoach: (coachId: string, sport?: string) => void;
  onOpenRegisterModal: () => void;
  onOpenLoginModal: () => void;
  onOpenLegalModal?: (tab?: LegalTab) => void;
  blockedSports?: string[];
  onOpenSupportModal?: () => void;
  isAdmin?: boolean;
  language?: Language;
}

export default function LandingPage({
  coaches,
  activeCoachId,
  onLoginAsCoach,
  onOpenRegisterModal,
  onOpenLoginModal,
  onOpenLegalModal,
  blockedSports = [],
  onOpenSupportModal,
  isAdmin = false,
  language: propLang
}: LandingPageProps) {
  const [currentLang, setCurrentLang] = React.useState<Language>(() => propLang || getStoredLanguage());

  React.useEffect(() => {
    if (propLang) setCurrentLang(propLang);
  }, [propLang]);

  React.useEffect(() => {
    const handleLangChange = (e: any) => {
      const newLang = e.detail?.language as Language;
      if (newLang && newLang !== currentLang) {
        setCurrentLang(newLang);
      }
    };
    window.addEventListener("thebox_language_change", handleLangChange);
    return () => window.removeEventListener("thebox_language_change", handleLangChange);
  }, [currentLang]);

  const handleLanguageSelect = (lang: Language) => {
    if (lang === currentLang) return;
    setCurrentLang(lang);
    setStoredLanguage(lang);
  };

  const t = translations[currentLang].landing;

  const allSportsList = [
    { id: "football", label: t.sports.footballLabel, icon: "⚽", players: t.sports.footballPlayers, formations: t.sports.footballFormations, isBlocked: blockedSports.includes("football") },
    { id: "basketball", label: t.sports.basketballLabel, icon: "🏀", players: t.sports.basketballPlayers, formations: t.sports.basketballFormations, isBlocked: blockedSports.includes("basketball") },
    { id: "rugby", label: t.sports.rugbyLabel, icon: "🏉", players: t.sports.rugbyPlayers, formations: t.sports.rugbyFormations, isBlocked: blockedSports.includes("rugby") },
    { id: "handball", label: t.sports.handballLabel, icon: "🤾", players: t.sports.handballPlayers, formations: t.sports.handballFormations, isBlocked: blockedSports.includes("handball") },
  ];

  // Direct Stripe checkout loading state
  const [stripeLoadingPlan, setStripeLoadingPlan] = React.useState<string | null>(null);

  const handleLaunchStripeCheckout = async (planId: string) => {
    setStripeLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          returnUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        alert(data.error || (currentLang === "fr" ? "Erreur lors de la redirection vers le paiement." : "Error redirecting to checkout."));
        setStripeLoadingPlan(null);
      }
    } catch (e: any) {
      alert(currentLang === "fr" ? "Erreur de connexion à la passerelle de paiement." : "Payment gateway connection error.");
      setStripeLoadingPlan(null);
    }
  };

  // Filter out blocked sports from landing page display
  const availableSports = allSportsList.filter((sp) => !sp.isBlocked);

  const useCases = [
    {
      step: "01",
      tag: t.useCases.case1Tag,
      title: t.useCases.case1Title,
      desc: t.useCases.case1Desc,
      image: "/usecase-bureau.jpg",
      icon: Monitor,
      highlights: t.useCases.case1Highlights
    },
    {
      step: "02",
      tag: t.useCases.case2Tag,
      title: t.useCases.case2Title,
      desc: t.useCases.case2Desc,
      image: "/usecase-vestiaire.jpg",
      icon: Tv,
      highlights: t.useCases.case2Highlights
    },
    {
      step: "03",
      tag: t.useCases.case3Tag,
      title: t.useCases.case3Title,
      desc: t.useCases.case3Desc,
      image: "/usecase-terrain.jpg",
      icon: Tablet,
      highlights: t.useCases.case3Highlights
    }
  ];

  const featureIcons = [Activity, Zap, Trophy, Users, Target, Share2];
  const features = t.features.items.map((item, idx) => ({
    ...item,
    icon: featureIcons[idx] || Activity
  }));

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans selection:bg-white selection:text-[#07090e]">
      
      {/* BRAND HEADER / NAVBAR */}
      <header className="border-b border-[#1b2436] bg-[#0d1117]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-2">
          
          {/* Logo Brand Emblem - Aligned strictly with the app logo */}
          <div className="flex items-center gap-3.5 group cursor-pointer shrink-0" onClick={onOpenLoginModal}>
            <div className="relative">
              <LogoIcon className="w-10 h-10 text-white flex-shrink-0 group-hover:scale-105 transition-transform duration-200" />
              <div className="absolute -inset-1 bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            </div>

            <div className="text-left select-none">
              <h1 className="text-2xl font-black text-white tracking-wider leading-none lowercase">
                the box
              </h1>
              <p className="text-[8.5px] text-white/70 font-black uppercase tracking-[0.22em] leading-none mt-1">
                {t.brandTagline}
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher FR / EN */}
            <div 
              className="flex items-center bg-[#121926] border border-[#232f45] rounded-xl p-1 gap-1 text-xs font-bold shadow-sm"
              role="group"
              aria-label={t.langSwitchAria}
            >
              <button
                type="button"
                id="lang-switch-fr"
                onClick={() => handleLanguageSelect("fr")}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  currentLang === "fr"
                    ? "bg-[#00E599] text-[#07090e] font-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Français"
                aria-pressed={currentLang === "fr"}
              >
                <span>🇫🇷</span>
                <span className="font-mono text-[11px]">FR</span>
              </button>
              <button
                type="button"
                id="lang-switch-en"
                onClick={() => handleLanguageSelect("en")}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  currentLang === "en"
                    ? "bg-[#00E599] text-[#07090e] font-black shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="English"
                aria-pressed={currentLang === "en"}
              >
                <span>🇬🇧</span>
                <span className="font-mono text-[11px]">EN</span>
              </button>
            </div>

            {onOpenLegalModal && (
              <button
                onClick={() => onOpenLegalModal("faq")}
                className="hidden sm:flex items-center justify-center h-10 w-10 rounded-xl border border-[#232f45] bg-[#0d1117]/80 hover:bg-[#121926] text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                title={t.faqHelp}
                aria-label={t.faqHelp}
              >
                <HelpCircle className="h-4 w-4 text-[#00E599]" />
              </button>
            )}

            <a
              href="#contact"
              className="hidden md:flex items-center justify-center h-10 w-10 rounded-xl border border-[#232f45] bg-[#0d1117]/80 hover:bg-[#121926] text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title={t.contact}
              aria-label={t.contact}
            >
              <Mail className="h-4 w-4 text-[#00E599]" />
            </a>

            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-2 h-10 px-3.5 sm:px-4 rounded-xl border border-[#232f45] bg-[#121926] hover:bg-[#1a253b] text-xs font-extrabold text-white transition cursor-pointer shrink-0"
            >
              <LogIn className="h-3.5 w-3.5 text-[#00E599]" />
              <span>{t.login}</span>
            </button>

            <button
              onClick={onOpenRegisterModal}
              className="flex items-center gap-2 h-10 px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-100 text-[#0d1117] text-xs font-black transition cursor-pointer shadow-lg shadow-white/10 hover:shadow-white/20 shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{t.register}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH TURF & CHALK BACKDROP */}
      <section className="relative pt-10 pb-20 px-4 sm:px-6 w-full overflow-hidden min-h-[85vh] flex items-center justify-center">
        
        {/* Grass Turf Background Image (Displayed Crisp & Pure with Official Logo Watermark) */}
        <div className="absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
          <img
            src="/landing-bg.jpg"
            alt="The Box"
            className="w-full h-full object-cover object-center transform filter brightness-105 contrast-105"
            referrerPolicy="no-referrer"
          />

          {/* Official 'The Box' Tactical Logo Emblem chalked on the lawn */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative flex items-center justify-center w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] lg:w-[620px] lg:h-[620px] opacity-30 filter drop-shadow-[0_0_30px_rgba(0,229,153,0.35)]">
              <LogoIcon className="w-full h-full text-white" />
            </div>
          </div>

          {/* Subtle Top & Bottom Fade ONLY for seamless transition into header/footer */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07090e] to-transparent opacity-80" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent" />
        </div>

        {/* Hero Top Content Container in Translucent Glass Card */}
        <div className="text-center max-w-4xl mx-auto relative z-10 my-auto bg-[#07090e]/80 backdrop-blur-md border border-[#00E599]/30 p-6 sm:p-12 rounded-3xl shadow-2xl">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0d1117]/90 border border-[#00E599]/50 text-xs font-black uppercase tracking-widest text-[#00E599] mb-6 shadow-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E599] animate-pulse shadow-[0_0_10px_#00E599]" />
            <span>{t.hero.badge}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white drop-shadow-lg">
            {t.hero.titlePrefix}
            <span className="text-[#00E599] underline decoration-[#00E599] decoration-4 underline-offset-8">
              {t.hero.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed font-semibold drop-shadow">
            {t.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenLoginModal}
              className="px-8 py-4 rounded-xl bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117] font-black text-sm flex items-center justify-center gap-3 transition duration-200 shadow-2xl shadow-[#00E599]/40 hover:scale-105 cursor-pointer group uppercase tracking-wider"
            >
              <LogIn className="h-4 w-4 text-[#0d1117]" />
              <span>{t.hero.ctaBoard}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenRegisterModal}
              className="px-7 py-4 rounded-xl bg-[#0d1117]/95 hover:bg-[#141b29] border border-[#00E599]/40 hover:border-[#00E599] text-white font-black text-sm flex items-center justify-center gap-2.5 transition duration-200 cursor-pointer shadow-xl"
            >
              <UserPlus className="h-4 w-4 text-[#00E599]" />
              <span>{t.hero.ctaRegister}</span>
            </button>
          </div>

          {/* Key Feature Highlights Pill Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 font-bold border-t border-[#1f293d]/80 pt-6">
            <div className="flex items-center gap-2 bg-[#0d1117]/90 px-3.5 py-1.5 rounded-full border border-[#1f293d]">
              <Check className="w-4 h-4 text-[#00E599]" />
              <span>{t.hero.highlightAnimations}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0d1117]/90 px-3.5 py-1.5 rounded-full border border-[#1f293d]">
              <Check className="w-4 h-4 text-[#00E599]" />
              <span>{t.hero.highlightAnalysis}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0d1117]/90 px-3.5 py-1.5 rounded-full border border-[#1f293d]">
              <Check className="w-4 h-4 text-[#00E599]" />
              <span>{t.hero.highlightExport}</span>
            </div>
          </div>

        </div>

      </section>

      {/* SPORTS SHOWCASE SECTION (Football enabled by default, others activable via admin) */}
      <section className="py-16 bg-[#090d14] border-y border-[#1b2436] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#00E599]">
            {t.sports.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            {currentLang === "fr" 
              ? `${allSportsList.filter(s => !s.isBlocked).length} Sport${allSportsList.filter(s => !s.isBlocked).length > 1 ? "s" : ""} Actif${allSportsList.filter(s => !s.isBlocked).length > 1 ? "s" : ""} & Terrains Officiels`
              : `${allSportsList.filter(s => !s.isBlocked).length} Active Sport${allSportsList.filter(s => !s.isBlocked).length > 1 ? "s" : ""} & Official Pitches`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            {currentLang === "fr"
              ? "Le football est immédiatement disponible par défaut. Les autres disciplines (basketball, rugby, handball) sont activables en 1 clic par l'administrateur de l'application."
              : "Football is immediately available by default. Other sports (basketball, rugby, handball) can be activated in 1 click by the application administrator."}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {allSportsList.map((sp) => {
              const isBlocked = sp.isBlocked;
              return (
                <button
                  key={sp.id}
                  onClick={() => {
                    if (isBlocked) {
                      alert(
                        currentLang === "fr"
                          ? `Le sport "${sp.label}" est actuellement réservé ou en attente d'activation par l'administrateur de la plateforme.\n\nConnectez-vous avec votre compte administrateur pour l'activer instantanément.`
                          : `The sport "${sp.label}" is currently awaiting activation by the platform administrator.\n\nLog in with your administrator account to activate it instantly.`
                      );
                    } else {
                      onOpenLoginModal();
                    }
                  }}
                  className={`border rounded-2xl p-6 text-center transition group cursor-pointer flex flex-col items-center justify-center shadow-lg relative ${
                    isBlocked 
                      ? "bg-[#0a0d13]/80 border-[#1a2233] opacity-85 hover:border-amber-500/50" 
                      : "bg-[#0d1117] border-[#1f293d] hover:border-[#00E599] hover:shadow-xl hover:shadow-[#00E599]/10"
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {isBlocked ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        🔒 {currentLang === "fr" ? "Sur activation" : "Admin toggle"}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#00E599] border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        🟢 {currentLang === "fr" ? "Disponible" : "Available"}
                      </span>
                    )}
                  </div>

                  <div className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border flex items-center justify-center mb-4 transition-all duration-300 shadow-lg ${
                    isBlocked
                      ? "bg-[#0f1420] border-[#1c273c] text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/40"
                      : "bg-[#121926] border-[#233149] text-white group-hover:text-[#00E599] group-hover:bg-[#162236] group-hover:border-[#00E599]/60 group-hover:scale-110"
                  }`}>
                    <SportIcon sport={sp.id} className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-black transition ${isBlocked ? "text-slate-300 group-hover:text-amber-300" : "text-white group-hover:text-[#00E599]"}`}>
                      {sp.label}
                    </h3>
                    <p className={`text-xs font-bold mt-1 ${isBlocked ? "text-amber-400/80" : "text-[#00E599]"}`}>
                      {sp.players}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-medium">
                      {isBlocked 
                        ? (currentLang === "fr" ? "Activable par l'admin" : "Can be activated by admin")
                        : sp.formations}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* USE CASES SHOWCASE SECTION (3 IMAGES DÉMONTRANT LES UTILITÉS DU COACHING) */}
      <section className="py-24 bg-gradient-to-b from-[#090d14] via-[#07090e] to-[#090d14] border-b border-[#1b2436] px-4 sm:px-6 relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#00E599]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121926] border border-[#233149] text-[10px] font-black uppercase tracking-widest text-[#00E599] mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#00E599]" />
              <span>{t.useCases.tag}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {t.useCases.titleLine1} <br className="hidden sm:inline" />
              <span className="text-[#00E599]">{t.useCases.titleHighlight}</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-300 mt-4 max-w-2xl mx-auto font-medium leading-relaxed">
              {t.useCases.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <div
                  key={i}
                  className="bg-[#0d1117] border border-[#233149] hover:border-[#00E599]/60 rounded-3xl overflow-hidden flex flex-col group transition-all duration-300 shadow-2xl hover:shadow-[0_0_30px_rgba(0,229,153,0.12)] hover:-translate-y-1.5"
                >
                  {/* Image container with badges and overlay */}
                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-900">
                    <img
                      src={uc.image}
                      alt={uc.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-black/40 opacity-90" />
                    
                    {/* Top pill badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                      <span className="bg-[#0d1117]/90 backdrop-blur-md text-[9px] font-black tracking-widest uppercase text-[#00E599] px-3 py-1 rounded-full border border-[#00E599]/40 shadow-lg">
                        {uc.tag}
                      </span>
                      <span className="bg-[#07090e]/85 backdrop-blur-md text-white font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-white/10">
                        {uc.step}
                      </span>
                    </div>

                    {/* Bottom floating icon */}
                    <div className="absolute -bottom-5 right-6 w-12 h-12 rounded-2xl bg-[#121926] border border-[#00E599]/40 shadow-xl flex items-center justify-center text-[#00E599] group-hover:bg-[#00E599] group-hover:text-[#07090e] transition-colors duration-300 z-10">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Text description & checklist */}
                  <div className="p-7 pt-9 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white group-hover:text-[#00E599] transition-colors duration-200">
                        {uc.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed font-medium">
                        {uc.desc}
                      </p>

                      <div className="border-t border-[#1b2436] mt-6 pt-5 space-y-2.5">
                        {uc.highlights.map((h, hIdx) => (
                          <div key={hIdx} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-[#00E599] shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-[#1b2436]/60 flex items-center justify-between">
                      <button
                        onClick={onOpenLoginModal}
                        className="text-xs font-black text-[#00E599] hover:text-white flex items-center gap-1.5 transition cursor-pointer group-hover:translate-x-1"
                      >
                        <span>{t.useCases.tryFeature}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#00E599]">
            {t.features.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
            {t.features.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-[#0d1117] border border-[#233149] rounded-2xl p-6 relative overflow-hidden group hover:border-white transition duration-300 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#121926] border border-[#233149] flex items-center justify-center text-[#00E599] group-hover:text-white transition">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 bg-[#121926] px-2.5 py-1 rounded-full border border-[#233149]">
                    {f.tag}
                  </span>
                </div>

                <h3 className="text-base font-black text-white mb-2 group-hover:text-white transition">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRICING TABLE / GRILLE TARIFAIRE */}
      <section id="tarifs" className="py-20 bg-[#090d14] border-t border-[#1b2436] px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00E599] bg-[#121926] px-3 py-1 rounded-full border border-[#233149]">
              {t.pricing.tag}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-4">
              {t.pricing.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* PLAN GRATUIT */}
            <div className="bg-[#0d1117] border border-[#233149] rounded-2xl p-7 flex flex-col justify-between relative shadow-xl hover:border-[#384b6e] transition">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">{t.pricing.freeTag}</span>
                <h3 className="text-xl font-black text-white">{t.pricing.freeTitle}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{t.pricing.freeDesc}</p>

                <div className="mt-6 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{t.pricing.freePrice}</span>
                  <span className="text-xs text-slate-400 font-semibold">{t.pricing.perMonth}</span>
                </div>

                <div className="border-t border-[#1b2436] pt-5 space-y-3 mb-8">
                  {t.pricing.freeFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onOpenRegisterModal}
                className="w-full py-3 px-4 bg-[#121926] hover:bg-[#1a253b] border border-[#233149] text-white font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
              >
                {t.pricing.freeCta}
              </button>
            </div>

            {/* PLAN PRO (FEATURED) */}
            <div className="bg-gradient-to-b from-[#0f172a] to-[#0d1117] border-2 border-[#00E599] rounded-2xl p-7 flex flex-col justify-between relative shadow-2xl shadow-[#00E599]/10 transform md:-translate-y-2">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00E599] text-[#0d1117] text-[9.5px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                {t.pricing.recommendedBadge}
              </span>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00E599] block mb-2">{t.pricing.proTag}</span>
                <h3 className="text-xl font-black text-white">{t.pricing.proTitle}</h3>
                <p className="text-xs text-slate-300 mt-1 min-h-[32px]">{t.pricing.proDesc}</p>

                <div className="mt-6 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#00E599]">{t.pricing.proPrice}</span>
                  <span className="text-xs text-slate-400 font-semibold">{t.pricing.perMonth}</span>
                </div>

                <div className="border-t border-[#1b2436] pt-5 space-y-3 mb-8">
                  {t.pricing.proFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-white font-medium">
                      <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 mt-auto">
                <button
                  onClick={onOpenRegisterModal}
                  className="w-full py-3.5 px-4 bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117] font-black text-xs rounded-xl transition cursor-pointer text-center shadow-lg shadow-[#00E599]/20"
                >
                  {t.pricing.proCtaTrial}
                </button>
                <button
                  type="button"
                  disabled={Boolean(stripeLoadingPlan)}
                  onClick={() => handleLaunchStripeCheckout("pro")}
                  className="w-full py-2.5 px-3 bg-[#111927] hover:bg-[#182337] border border-[#00E599]/30 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5 text-[#00E599]" />
                  <span>{stripeLoadingPlan === "pro" ? t.pricing.proRedirecting : t.pricing.proCtaSubscribe}</span>
                </button>
              </div>
            </div>

            {/* PLAN PRO+ */}
            <div className="bg-[#0d1117] border border-[#233149] hover:border-amber-500/50 rounded-2xl p-7 flex flex-col justify-between relative shadow-xl transition">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-2">{t.pricing.proPlusTag}</span>
                <h3 className="text-xl font-black text-white">{t.pricing.proPlusTitle}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{t.pricing.proPlusDesc}</p>

                <div className="mt-6 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-amber-400">{t.pricing.proPlusPrice}</span>
                  <span className="text-xs text-slate-400 font-semibold">{t.pricing.perMonth}</span>
                </div>

                <div className="border-t border-[#1b2436] pt-5 space-y-3 mb-8">
                  {t.pricing.proPlusFeatures.map((feat, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 text-xs ${idx === 1 ? "text-amber-300 font-bold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30" : "text-slate-200 font-semibold"}`}>
                      <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 mt-auto">
                <button
                  onClick={onOpenRegisterModal}
                  className="w-full py-3 px-4 bg-[#121926] hover:bg-[#1a253b] border border-amber-500/40 text-amber-300 hover:text-white font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
                >
                  {t.pricing.proPlusCtaTrial}
                </button>
                <button
                  type="button"
                  disabled={Boolean(stripeLoadingPlan)}
                  onClick={() => handleLaunchStripeCheckout("club")}
                  className="w-full py-2.5 px-3 bg-[#111927] hover:bg-[#182337] border border-amber-500/30 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>{stripeLoadingPlan === "club" ? t.pricing.proRedirecting : t.pricing.proPlusCtaSubscribe}</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* DEDICATED CONTACT FORM SECTION */}
      <LandingContactSection isAdmin={isAdmin} language={currentLang} />

      {/* BRAND FOOTER */}
      <footer className="mt-auto border-t border-[#1b2436] bg-[#090d14] py-10 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <LogoIcon className="w-7 h-7 text-white" />
            <div className="text-left">
              <span className="font-black text-white lowercase tracking-wide block leading-none text-sm">
                the box
              </span>
              <span className="text-[8px] text-white/60 uppercase font-black tracking-widest block mt-0.5">
                {t.footer.brandTagline}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
            {/* Footer Language switcher */}
            <div className="flex items-center gap-1 bg-[#121824] border border-[#232f45] rounded-lg p-0.5 text-[11px] font-bold">
              <button
                type="button"
                id="lang-switch-footer-fr"
                onClick={() => handleLanguageSelect("fr")}
                className={`px-2 py-0.5 rounded transition ${currentLang === "fr" ? "bg-[#00E599] text-[#07090e] font-black" : "text-slate-400 hover:text-white"}`}
              >
                FR
              </button>
              <button
                type="button"
                id="lang-switch-footer-en"
                onClick={() => handleLanguageSelect("en")}
                className={`px-2 py-0.5 rounded transition ${currentLang === "en" ? "bg-[#00E599] text-[#07090e] font-black" : "text-slate-400 hover:text-white"}`}
              >
                EN
              </button>
            </div>

            <span className="text-slate-700">•</span>

            {onOpenLegalModal && (
              <>
                <button
                  onClick={() => onOpenLegalModal("faq")}
                  className="hover:text-[#00E599] transition cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{t.footer.faqHelp}</span>
                </button>
                <span className="text-slate-700">•</span>
                <button
                  onClick={() => onOpenLegalModal("cgu")}
                  className="hover:text-[#00E599] transition cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.footer.cgu}</span>
                </button>
                <span className="text-slate-700">•</span>
                <button
                  onClick={() => onOpenLegalModal("cgv")}
                  className="hover:text-[#00E599] transition cursor-pointer flex items-center gap-1"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>{t.footer.cgv}</span>
                </button>
                <span className="text-slate-700">•</span>
              </>
            )}
            <a
              href="#contact"
              className="hover:text-[#00E599] transition cursor-pointer flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{t.footer.contactUs}</span>
            </a>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenSupportModal) {
                  onOpenSupportModal();
                } else {
                  window.location.href = isAdmin 
                    ? "mailto:support@thebox-tactique.com?subject=%5BSupport%5D%20Demande%20d'assistance"
                    : "#contact";
                }
              }}
              className="hover:text-white transition cursor-pointer"
            >
              {t.footer.contactSupport}
            </button>
          </div>

          <p className="text-[11px] text-slate-600 font-medium">
            {t.footer.copyright(new Date().getFullYear())}
          </p>
        </div>
      </footer>

    </div>
  );
}
