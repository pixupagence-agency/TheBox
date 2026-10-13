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
  isAdmin = false
}: LandingPageProps) {
  const allSportsList = [
    { id: "football", label: "Football", icon: "⚽", players: "11 Joueurs", formations: "4-4-2, 4-3-3, 4-2-3-1", isBlocked: blockedSports.includes("football") },
    { id: "basketball", label: "Basketball", icon: "🏀", players: "5 Joueurs", formations: "2-3, 1-2-2, 5-Out", isBlocked: blockedSports.includes("basketball") },
    { id: "rugby", label: "Rugby", icon: "🏉", players: "15 Joueurs", formations: "Standard, Pack Ruck", isBlocked: blockedSports.includes("rugby") },
    { id: "handball", label: "Handball", icon: "🤾", players: "7 Joueurs", formations: "6-0, 5-1, 3-2-1", isBlocked: blockedSports.includes("handball") },
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
        alert(data.error || "Erreur lors de la redirection vers le paiement.");
        setStripeLoadingPlan(null);
      }
    } catch (e: any) {
      alert("Erreur de connexion à la passerelle de paiement.");
      setStripeLoadingPlan(null);
    }
  };

  // Filter out blocked sports from landing page display
  const availableSports = allSportsList.filter((sp) => !sp.isBlocked);

  const useCases = [
    {
      step: "01",
      tag: "AU BUREAU & À LA MAISON",
      title: "Analyse & Modélisation Stratégique",
      desc: "Préparez vos séances et vos matchs en toute sérénité. Concevez vos combinaisons tactiques, étudiez l'adversaire et synchronisez vos schémas entre grand écran et tablette tactile.",
      image: "/usecase-bureau.jpg",
      icon: Monitor,
      highlights: [
        "Tracés vectoriels précis & phases de jeu animées",
        "Modélisation complète du bloc adverse & pressing",
        "Attribution des tireurs de coups arrêtés & effectif"
      ]
    },
    {
      step: "02",
      tag: "DANS LE VESTIAIRE",
      title: "Causerie Tactique & Cohésion d'Équipe",
      desc: "Projetez vos plans de jeu sur grand écran ou TV dans le vestiaire. Offrez à vos joueurs une lecture claire et dynamique des consignes pour une adhésion totale avant le coup d'envoi.",
      image: "/usecase-vestiaire.jpg",
      icon: Tv,
      highlights: [
        "Affichage immersif grand format pour tout le groupe",
        "Ajustements tactiques percutants à la mi-temps",
        "Notes de causerie & consignes individuelles claires"
      ]
    },
    {
      step: "03",
      tag: "SUR LE BANC DE TOUCHE",
      title: "Coaching en Direct & Mode Live Match",
      desc: "Emportez votre tablette au bord de la pelouse le jour de match. Ajustez votre dispositif en temps réel, réalisez vos changements tactiques et enregistrez chaque fait marquant.",
      image: "/usecase-terrain.jpg",
      icon: Tablet,
      highlights: [
        "Mode Live Match & chronomètre officiel de rencontre",
        "Remplacements et réorganisations instantanées",
        "Statistiques en direct : buts, cartons, tirs & passes"
      ]
    }
  ];

  const features = [
    {
      title: "Tableau Blanc Tactique 2D Haute Précision",
      desc: "Tracés vectoriels précis : flèches de passe, courses en pointillés, blocs défensifs, zones de pressing et formes géométriques pour modéliser toutes vos phases de jeu.",
      icon: Activity,
      tag: "TABLEAU BLANC MULTI-OUTILS"
    },
    {
      title: "Mode Live Match & Stats en Direct (PRO+)",
      desc: "Chronomètre officiel en bord de terrain : enregistrez en direct les buts, passes décisives, cartons jaunes/rouges, blessures et remplacements tactiques instantanés.",
      icon: Zap,
      tag: "EXCLUSIVITÉ FORMULE PRO+"
    },
    {
      title: "Multi-Équipes & Schémas Isolés",
      desc: "Gérez plusieurs catégories (Seniors A, Réserve, U19). Chaque match planifié conserve ses propres schémas tactiques dédiés et son historique sans confusion.",
      icon: Trophy,
      tag: "MULTI-ÉQUIPES & CALENDRIER"
    },
    {
      title: "Effectif, Photos & Coups Arrêtés",
      desc: "Personnalisation complète de l'effectif, photos des joueurs, états de forme et attribution précise des tireurs de corners, penaltys, coups francs et capitaine.",
      icon: Users,
      tag: "EFFECTIF & COUPS ARRÊTÉS"
    },
    {
      title: "Causerie Tactique & Bloc Adverse",
      desc: "Modélisez le dispositif adverse pour construire vos plans de jeu anti-pressing, préparez vos consignes clés et motivez vos joueurs avec une préparation claire.",
      icon: Target,
      tag: "CAUSERIE & ANALYSE DU BLOC"
    },
    {
      title: "Exportation Haute Définition & Partage Staff",
      desc: "Sauvegardez vos compositions et exportez vos schémas tactiques en image Haute Définition (PNG HD) avec partage instantané par messagerie ou email vers votre staff.",
      icon: Share2,
      tag: "EXPORTS HD & PARTAGE DIRECT"
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col font-sans selection:bg-white selection:text-[#07090e]">
      
      {/* BRAND HEADER / NAVBAR */}
      <header className="border-b border-[#1b2436] bg-[#0d1117]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo Brand Emblem - Aligned strictly with the app logo */}
          <div className="flex items-center gap-3.5 group cursor-pointer" onClick={onOpenLoginModal}>
            <div className="relative">
              <LogoIcon className="w-10 h-10 text-white flex-shrink-0 group-hover:scale-105 transition-transform duration-200" />
              <div className="absolute -inset-1 bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            </div>

            <div className="text-left select-none">
              <h1 className="text-2xl font-black text-white tracking-wider leading-none lowercase">
                the box
              </h1>
              <p className="text-[8.5px] text-white/70 font-black uppercase tracking-[0.22em] leading-none mt-1">
                zone de décision tactique
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenLegalModal && (
              <button
                onClick={() => onOpenLegalModal("faq")}
                className="hidden sm:flex items-center justify-center h-10 w-10 rounded-xl border border-[#232f45] bg-[#0d1117]/80 hover:bg-[#121926] text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                title="FAQ & Aide"
                aria-label="FAQ & Aide"
              >
                <HelpCircle className="h-4 w-4 text-[#00E599]" />
              </button>
            )}

            <a
              href="#contact"
              className="hidden md:flex items-center justify-center h-10 w-10 rounded-xl border border-[#232f45] bg-[#0d1117]/80 hover:bg-[#121926] text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title="Contact"
              aria-label="Contact"
            >
              <Mail className="h-4 w-4 text-[#00E599]" />
            </a>

            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#232f45] bg-[#121926] hover:bg-[#1a253b] text-xs font-extrabold text-white transition cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5 text-[#00E599]" />
              <span>Se Connecter</span>
            </button>

            <button
              onClick={onOpenRegisterModal}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-white hover:bg-slate-100 text-[#0d1117] text-xs font-black transition cursor-pointer shadow-lg shadow-white/10 hover:shadow-white/20"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Créer un Compte</span>
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
            alt="The Box Zone de Décision Tactique"
            className="w-full h-full object-cover object-center transform filter brightness-105 contrast-105"
            referrerPolicy="no-referrer"
          />

          {/* Official 'The Box' Tactical Logo Emblem chalked on the lawn (100% identical to navbar) */}
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
            <span>THE BOX • ZONE DE DÉCISION TACTIQUE</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white drop-shadow-lg">
            Pensez, Modélisez & Transmettez vos{" "}
            <span className="text-[#00E599] underline decoration-[#00E599] decoration-4 underline-offset-8">
              Schémas Tactiques
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed font-semibold drop-shadow">
            Le tableau blanc tactique 2D de référence pour les entraîneurs. 
            Préparez vos matchs et modélisez vos combinaisons sur terrain officiel avec précision.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onOpenLoginModal}
              className="px-8 py-4 rounded-xl bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117] font-black text-sm flex items-center justify-center gap-3 transition duration-200 shadow-2xl shadow-[#00E599]/40 hover:scale-105 cursor-pointer group uppercase tracking-wider"
            >
              <LogIn className="h-4 w-4 text-[#0d1117]" />
              <span>Accéder au Tableau Tactique</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenRegisterModal}
              className="px-7 py-4 rounded-xl bg-[#0d1117]/95 hover:bg-[#141b29] border border-[#00E599]/40 hover:border-[#00E599] text-white font-black text-sm flex items-center justify-center gap-2.5 transition duration-200 cursor-pointer shadow-xl"
            >
              <UserPlus className="h-4 w-4 text-[#00E599]" />
              <span>Créer un Compte Coach</span>
            </button>
          </div>

          {/* Key Feature Highlights Pill Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 font-bold border-t border-[#1f293d]/80 pt-6">
            <div className="flex items-center gap-2 bg-[#0d1117]/90 px-3.5 py-1.5 rounded-full border border-[#1f293d]">
              <Check className="w-4 h-4 text-[#00E599]" />
              <span>Animations & Schémas Tactiques</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0d1117]/90 px-3.5 py-1.5 rounded-full border border-[#1f293d]">
              <Check className="w-4 h-4 text-[#00E599]" />
              <span>Analyse & Causerie Intégrées</span>
            </div>
            <div className="flex items-center gap-2 bg-[#0d1117]/90 px-3.5 py-1.5 rounded-full border border-[#1f293d]">
              <Check className="w-4 h-4 text-[#00E599]" />
              <span>Export Fiches HD & Playbook</span>
            </div>
          </div>

        </div>

      </section>

      {/* SPORTS SHOWCASE SECTION (Filtered by blocked sports - Requires at least 3 active sports) */}
      {availableSports.length >= 3 && (
        <section className="py-16 bg-[#090d14] border-y border-[#1b2436] px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00E599]">
              DISCIPLINES RECONNUES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {availableSports.length} Sport{availableSports.length > 1 ? "s" : ""}, {availableSports.length} Terrain{availableSports.length > 1 ? "s" : ""} Officiel{availableSports.length > 1 ? "s" : ""}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
              Accédez instantanément aux règles de jeu, dimensions de terrain et compositions tactiques homologuées.
            </p>

            <div className={`grid grid-cols-2 sm:grid-cols-3 ${
              availableSports.length >= 6 ? "lg:grid-cols-6" : availableSports.length === 5 ? "lg:grid-cols-5" : availableSports.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
            } gap-4 mt-10`}>
              {availableSports.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => onOpenLoginModal()}
                  className="bg-[#0d1117] border border-[#1f293d] hover:border-white hover:shadow-xl hover:shadow-[#00E599]/5 rounded-2xl p-6 text-center transition group cursor-pointer flex flex-col items-center justify-center shadow-lg relative"
                >
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-[#121926] border border-[#233149] text-white flex items-center justify-center mb-4 transition-all duration-300 shadow-lg group-hover:text-[#00E599] group-hover:bg-[#162236] group-hover:border-[#00E599]/60 group-hover:scale-110">
                    <SportIcon sport={sp.id} className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white group-hover:text-[#00E599] transition">{sp.label}</h3>
                    <p className="text-xs font-bold text-[#00E599] mt-1">{sp.players}</p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-medium">{sp.formations}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* USE CASES SHOWCASE SECTION (3 IMAGES DÉMONTRANT LES UTILITÉS DU COACHING) */}
      <section className="py-24 bg-gradient-to-b from-[#090d14] via-[#07090e] to-[#090d14] border-b border-[#1b2436] px-4 sm:px-6 relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-[#00E599]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121926] border border-[#233149] text-[10px] font-black uppercase tracking-widest text-[#00E599] mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#00E599]" />
              <span>L&apos;APPLICATION EN CONDITIONS RÉELLES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Pensé pour le Terrain, <br className="hidden sm:inline" />
              <span className="text-[#00E599]">du Bureau au Coup de Sifflet Final</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-300 mt-4 max-w-2xl mx-auto font-medium leading-relaxed">
              Une expérience fluide conçue pour chaque moment clé : préparez vos stratégies à froid, fédérez vos joueurs dans le vestiaire et réagissez en direct sur le banc de touche.
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
                        <span>Tester cette fonctionnalité</span>
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
            POUR LES STAFFS EXIGEANTS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
            Conçu pour l&apos;Excellence Tactique
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            De la préparation stratégique à la causerie d&apos;avant-match, the box centralise vos décisions tactiques.
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
              GRILLE TARIFAIRE & OFFRES
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-4">
              Des Tarifs Clairs & Sans Engagement
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
              Du coach indépendant au staff professionnel, découvrez la formule adaptée à vos objectifs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* PLAN GRATUIT */}
            <div className="bg-[#0d1117] border border-[#233149] rounded-2xl p-7 flex flex-col justify-between relative shadow-xl hover:border-[#384b6e] transition">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">DÉCOUVERTE & ESSAI</span>
                <h3 className="text-xl font-black text-white">Version Gratuite</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">Idéal pour découvrir le tableau tactique et préparer ses séances.</p>

                <div className="mt-6 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">0€</span>
                  <span className="text-xs text-slate-400 font-semibold">/ mois</span>
                </div>

                <div className="border-t border-[#1b2436] pt-5 space-y-3 mb-8">
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Tableau blanc tactique 2D & tracés vectoriels</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Personnalisation complète de l&apos;effectif</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Gestion des rôles des joueurs</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Export en PNG du terrain</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Visibilité du terrain complet ou à moitié, en portrait ou paysage</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenRegisterModal}
                className="w-full py-3 px-4 bg-[#121926] hover:bg-[#1a253b] border border-[#233149] text-white font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
              >
                Créer un Compte Gratuit
              </button>
            </div>

            {/* PLAN PRO (FEATURED) */}
            <div className="bg-gradient-to-b from-[#0f172a] to-[#0d1117] border-2 border-[#00E599] rounded-2xl p-7 flex flex-col justify-between relative shadow-2xl shadow-[#00E599]/10 transform md:-translate-y-2">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00E599] text-[#0d1117] text-[9.5px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                ⭐ RECOMMANDÉ
              </span>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00E599] block mb-2">INDIVIDUEL PRO</span>
                <h3 className="text-xl font-black text-white">Formule PRO</h3>
                <p className="text-xs text-slate-300 mt-1 min-h-[32px]">Pour l&apos;entraîneur qui veut gérer ses équipes, matchs, schémas et causeries vocales.</p>

                <div className="mt-6 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#00E599]">9.90€</span>
                  <span className="text-xs text-slate-400 font-semibold">/ mois</span>
                </div>

                <div className="border-t border-[#1b2436] pt-5 space-y-3 mb-8">
                  <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Toutes les fonctionnalités Gratuite</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Gestion multi-équipes pour un seul utilisateur</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Enregistrements des schémas tactiques liés au match sélectionné</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Partage des schémas tactiques (WhatsApp & Mail)</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Enregistrements vocales et saisies de notes activés</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Gestion des matchs</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                    <Check className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
                    <span>Gestion de l&apos;équipe adverse</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-auto">
                <button
                  onClick={onOpenRegisterModal}
                  className="w-full py-3.5 px-4 bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117] font-black text-xs rounded-xl transition cursor-pointer text-center shadow-lg shadow-[#00E599]/20"
                >
                  Essai 14 Jours Offert &bull; Créer un Compte
                </button>
                <button
                  type="button"
                  disabled={Boolean(stripeLoadingPlan)}
                  onClick={() => handleLaunchStripeCheckout("pro")}
                  className="w-full py-2.5 px-3 bg-[#111927] hover:bg-[#182337] border border-[#00E599]/30 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5 text-[#00E599]" />
                  <span>{stripeLoadingPlan === "pro" ? "Redirection..." : "S'abonner à la Formule PRO (9.90€ / mois)"}</span>
                </button>
              </div>
            </div>

            {/* PLAN PRO+ */}
            <div className="bg-[#0d1117] border border-[#233149] hover:border-amber-500/50 rounded-2xl p-7 flex flex-col justify-between relative shadow-xl transition">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-2">🔥 PERFORMANCE & LIVE MATCH</span>
                <h3 className="text-xl font-black text-white">Formule PRO+</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">Pour le suivi en direct le jour de match avec le mode live interactif.</p>

                <div className="mt-6 mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-amber-400">14.90€</span>
                  <span className="text-xs text-slate-400 font-semibold">/ mois</span>
                </div>

                <div className="border-t border-[#1b2436] pt-5 space-y-3 mb-8">
                  <div className="flex items-start gap-2.5 text-xs text-slate-200 font-semibold">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Toutes les fonctionnalités PRO</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-amber-300 font-bold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Activation du mode live match possible</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-auto">
                <button
                  onClick={onOpenRegisterModal}
                  className="w-full py-3 px-4 bg-[#121926] hover:bg-[#1a253b] border border-amber-500/40 text-amber-300 hover:text-white font-extrabold text-xs rounded-xl transition cursor-pointer text-center"
                >
                  Essai 14 Jours Offert &bull; Créer un Compte
                </button>
                <button
                  type="button"
                  disabled={Boolean(stripeLoadingPlan)}
                  onClick={() => handleLaunchStripeCheckout("club")}
                  className="w-full py-2.5 px-3 bg-[#111927] hover:bg-[#182337] border border-amber-500/30 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>{stripeLoadingPlan === "club" ? "Redirection..." : "S'abonner à la Formule PRO+ (14.90€ / mois)"}</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* DEDICATED CONTACT FORM SECTION */}
      <LandingContactSection isAdmin={isAdmin} />

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
                zone de décision tactique
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
            {onOpenLegalModal && (
              <>
                <button
                  onClick={() => onOpenLegalModal("faq")}
                  className="hover:text-[#00E599] transition cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>FAQ & Aide</span>
                </button>
                <span className="text-slate-700">•</span>
                <button
                  onClick={() => onOpenLegalModal("cgu")}
                  className="hover:text-[#00E599] transition cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>CGU</span>
                </button>
                <span className="text-slate-700">•</span>
                <button
                  onClick={() => onOpenLegalModal("cgv")}
                  className="hover:text-[#00E599] transition cursor-pointer flex items-center gap-1"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>CGV</span>
                </button>
                <span className="text-slate-700">•</span>
              </>
            )}
            <a
              href="#contact"
              className="hover:text-[#00E599] transition cursor-pointer flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Nous Contacter</span>
            </a>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenSupportModal) {
                  onOpenSupportModal();
                } else {
                  window.location.href = isAdmin 
                    ? "mailto:pixup.agence@gmail.com?subject=%5BSupport%5D%20Demande%20d'assistance"
                    : "#contact";
                }
              }}
              className="hover:text-white transition cursor-pointer"
            >
              Contact Support
            </button>
          </div>

          <p className="text-[11px] text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} the box. Tous droits réservés.
          </p>
        </div>
      </footer>

    </div>
  );
}
