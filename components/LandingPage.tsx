"use client";

import React from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { CoachProfile } from "@/app/page";
import LogoIcon from "./LogoIcon";
import { LegalTab } from "./LegalAndFaqModal";
import LandingContactSection from "./LandingContactSection";
import { Language } from "@/lib/i18n";
import { WEEK_ILLUSTRATIONS } from "./landing/weekIllustrations";
import {
  Billing,
  PriceKey,
  TRIAL_DAYS,
  computeOffer,
  formatEuro,
  formatEuroShort,
  packSaving,
  priceTable,
} from "@/lib/pricing";
import "./landing/landing.css";

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

/* ------------------------------------------------------------------ */
/* Modules : couleurs et textes                                        */
/* ------------------------------------------------------------------ */

type ModuleId = "tactic" | "training" | "recording" | "convocations" | "live";

const MOD: Record<ModuleId, { name: string; color: string; light: string; rgb: string; bg: string }> = {
  tactic: { name: "Tactic", color: "#00E599", light: "#5dffc6", rgb: "0,229,153", bg: "#070c0b" },
  training: { name: "Training", color: "#3B82F6", light: "#93c5fd", rgb: "59,130,246", bg: "#070a12" },
  recording: { name: "Recording", color: "#FF5A4E", light: "#ffa8a1", rgb: "255,90,78", bg: "#0d0807" },
  convocations: { name: "Convocations", color: "#FF8A1F", light: "#ffc48f", rgb: "255,138,31", bg: "#0d0905" },
  live: { name: "Live", color: "#F59E0B", light: "#fcd34d", rgb: "245,158,11", bg: "#0d0b05" },
};

const MARQUEE: ModuleId[] = ["tactic", "training", "recording", "convocations", "live"];

const WEEK: { mod: ModuleId; day: string; text: React.ReactNode }[] = [
  { mod: "training", day: "LUNDI – MERCREDI", text: <>Je planifie et j&apos;anime mes séances avec <strong className="text-white">Training</strong>.</> },
  { mod: "convocations", day: "JEUDI", text: <>J&apos;envoie les convocations ; joueurs et parents répondent avec <strong className="text-white">Convocations</strong>.</> },
  { mod: "tactic", day: "VENDREDI", text: <>Je prépare le plan de jeu et la causerie sur <strong className="text-white">Tactic</strong>.</> },
  { mod: "live", day: "SAMEDI", text: <>Je pilote le match en direct, mon adjoint saisit depuis son téléphone avec <strong className="text-white">Live</strong>.</> },
  { mod: "recording", day: "DIMANCHE", text: <>Je découpe et commente les actions du match avec <strong className="text-white">Recording</strong>.</> },
];

const WEEK_LABELS = [
  "Illustration : séance d'entraînement, un joueur dribble en slalom entre des plots, une échelle de rythme et un chrono",
  "Illustration : un téléphone affiche la convocation du samedi, avec les réponses des joueurs et un QR code",
  "Illustration : plan de jeu sur le tableau tactique, avec une flèche de course et les notes de la causerie",
  "Illustration : tableau de score du match en direct et le téléphone de l'adjoint qui sert de télécommande",
  "Illustration : lecteur vidéo d'une action du match, un joueur entouré et une timeline de séquences taguées",
];

interface ModuleCard {
  mod: ModuleId;
  image: string;
  alt: string;
  caption: string;
  badge: string;
  desc: string;
  bullets: string[];
  icon: React.ReactNode;
}

const ICON_PROPS = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

/* ------------------------------------------------------------------ */
/* Défilement horizontal à la souris et à la molette                  */
/* ------------------------------------------------------------------ */

function useDragScroll<T extends HTMLElement>(id: string) {
  const drag = React.useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const wasDrag = React.useRef(false);

  React.useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY * 1.2, behavior: "auto" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [id]);

  const end = (e: React.PointerEvent<T>) => {
    const d = drag.current;
    if (!d) return;
    e.currentTarget.style.cursor = "";
    e.currentTarget.style.scrollSnapType = "x mandatory";
    wasDrag.current = d.moved;
    drag.current = null;
  };

  const handlers = {
    onPointerDown: (e: React.PointerEvent<T>) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
      e.currentTarget.style.scrollSnapType = "none";
      e.currentTarget.style.cursor = "grabbing";
    },
    onPointerMove: (e: React.PointerEvent<T>) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 5) d.moved = true;
      e.currentTarget.scrollLeft = d.left - dx;
    },
    onPointerUp: end,
    onPointerLeave: end,
    onClickCapture: (e: React.MouseEvent<T>) => {
      if (wasDrag.current) {
        e.preventDefault();
        e.stopPropagation();
        wasDrag.current = false;
      }
    },
  };

  const step = (dir: 1 | -1) => {
    const el = document.getElementById(id);
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 16;
    const w = first ? first.getBoundingClientRect().width + gap : 380;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return { handlers, step };
}

/* ------------------------------------------------------------------ */
/* Petits éléments                                                    */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.16em] text-[#00E599]">
      <span className="h-px w-7 bg-[#00E599]" aria-hidden="true" />
      {children}
    </p>
  );
}

function ArrowButtons({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  const cls =
    "fc-arrow inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#2a374a] bg-white/[0.03] p-0 text-[#e2e8f0]";
  return (
    <div className="fc-reveal flex gap-2.5">
      <button type="button" className={cls} onClick={onPrev} aria-label={`${label} précédents`}>
        <ChevronLeft className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
      </button>
      <button type="button" className={cls} onClick={onNext} aria-label={`${label} suivants`}>
        <ChevronRight className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}

function ModuleChip({ mod }: { mod: ModuleId }) {
  const m = MOD[mod];
  return (
    <span
      className="inline-flex h-[26px] items-center rounded-full px-2.5 text-xs font-bold"
      style={{ background: `rgba(${m.rgb},0.1)`, border: `1px solid rgba(${m.rgb},0.3)`, color: m.light }}
    >
      {m.name}
    </span>
  );
}

const GRADIENT_BORDER =
  "linear-gradient(90deg, #00E599, #3B82F6, #FF5A4E, #FF8A1F, #F59E0B, #00E599) border-box";

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage({
  onOpenRegisterModal,
  onOpenLoginModal,
  onOpenLegalModal,
  onOpenSupportModal,
  isAdmin = false,
}: LandingPageProps) {
  const [billing, setBilling] = React.useState<Billing>("month");
  const [base, setBase] = React.useState<"pro" | "plus">("plus");
  const [addTraining, setAddTraining] = React.useState(true);
  const [addRecording, setAddRecording] = React.useState(false);

  // Paiement direct (formules déjà disponibles chez Stripe : PRO et PRO+, au mois)
  const [stripeLoadingPlan, setStripeLoadingPlan] = React.useState<string | null>(null);
  const [stripeError, setStripeError] = React.useState<string | null>(null);
  const launchCheckout = async (planId: "pro" | "club") => {
    setStripeLoadingPlan(planId);
    setStripeError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, returnUrl: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setStripeError(data.error || "Erreur lors de la redirection vers le paiement.");
    } catch {
      setStripeError("Erreur de connexion à la passerelle de paiement.");
    }
    setStripeLoadingPlan(null);
  };

  const heroVideo = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    const v = heroVideo.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  const week = useDragScroll<HTMLOListElement>("fc-track-week");
  const modules = useDragScroll<HTMLDivElement>("fc-track-modules");

  const yearly = billing === "year";
  const prices = priceTable(billing);
  const priceOf = (k: PriceKey) => (yearly ? formatEuro(prices[k] / 12) : formatEuro(prices[k]));
  const billedOf = (k: PriceKey) =>
    k === "free" ? "Sans limite de durée" : yearly ? `Facturé ${formatEuroShort(prices[k])} par an` : "Facturé chaque mois";
  const per = yearly ? "/ an" : "/ mois";
  const offer = computeOffer(base, addTraining, addRecording, billing);
  const monthlySaving = formatEuroShort(packSaving("month"));

  const MODULE_CARDS: ModuleCard[] = [
    {
      mod: "tactic",
      image: "/landing/module-tactic.webp",
      alt: "Un coach au bord du terrain, une tablette affichant le tableau tactique à la main, devant son banc pendant un match en nocturne",
      caption: "LE PLAN DE JEU EN MAIN",
      badge: "Le socle",
      desc: "Le tableau tactique 2D : composition, tracés, animations, coups de pied arrêtés, vue Carte 3D et export HD.",
      bullets: ["Barre d'outils complète, mur et couloirs", "Matchs, schémas et notes de causerie", "Vue 3D orientable et partage"],
      icon: (
        <svg {...ICON_PROPS} stroke="#00E599">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      mod: "training",
      image: "/landing/module-training.webp",
      alt: "Un coach prépare sa séance le soir à son bureau, devant l'écran de TheBox FC qui affiche un exercice dessiné sur le terrain",
      caption: "LA SÉANCE SE PRÉPARE ICI",
      badge: "Module",
      desc: "Les ateliers et séances de la semaine : fiches d'exercices dessinées, plots, mannequins et séries chronométrées.",
      bullets: ["Bibliothèque d'exercices et séances", "Matériel : plots, cônes, portes, échelles", "Calendrier des séances (à venir)"],
      icon: (
        <svg {...ICON_PROPS} stroke="#60a5fa">
          <path d="M12 3L5 20h14z" />
          <line x1="8" y1="13" x2="16" y2="13" />
        </svg>
      ),
    },
    {
      mod: "recording",
      image: "/landing/module-recording.webp",
      alt: "Un coach et son adjoint analysent le match dans le bureau du club, devant l'écran du module Recording",
      caption: "L'ANALYSE AVEC LE STAFF",
      badge: "Module",
      desc: "L'analyse vidéo du match : import des séquences, lecture image par image, consignes dessinées et joueurs suivis.",
      bullets: ["Bibliothèque de séquences taguées", "Dessins et marqueurs sur la vidéo", "Export vidéo et résumé du match"],
      icon: (
        <svg {...ICON_PROPS} stroke="#FF5A4E">
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M16 10l6-3v10l-6-3z" />
        </svg>
      ),
    },
    {
      mod: "convocations",
      image: "/landing/module-convocations.webp",
      alt: "Un coach et son adjoint au bureau du club préparent la convocation du week-end, devant la liste des réponses des joueurs",
      caption: "LE GROUPE CONVOQUÉ EN 2 MIN",
      badge: "Inclus PRO",
      desc: "Convoquez aux matchs et aux entraînements. Joueurs et parents répondent depuis leur téléphone, par un lien ou un QR code.",
      bullets: ["Réponses, relances et feuille de présence", "Espace parent multi-enfants et covoiturage", "Suivi du coach sur mobile"],
      icon: (
        <svg {...ICON_PROPS} stroke="#FF8A1F">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="3" x2="8" y2="7" />
          <line x1="16" y1="3" x2="16" y2="7" />
          <path d="M9 15l2 2 4-4" />
        </svg>
      ),
    },
    {
      mod: "live",
      image: "/landing/module-live.webp",
      alt: "Sur le banc, le coach et son adjoint suivent le match en direct sur le téléphone avec le mode Live",
      caption: "LE MATCH SAISI EN DIRECT",
      badge: "Inclus PRO+",
      desc: "Le jour du match : chrono par période, score, cartons et remplacements. Votre adjoint saisit depuis la télécommande.",
      bullets: ["Télécommande sur le téléphone de l'adjoint", "Page publique du match pour les supporters", "Bilan du match partageable"],
      icon: (
        <svg {...ICON_PROPS} stroke="#F59E0B">
          <polyline points="2 12 6 12 9 4 15 20 18 12 22 12" />
        </svg>
      ),
    },
  ];

  const modulePriceLine: Record<ModuleId, string> = {
    tactic: "Inclus dès la formule Gratuite",
    training: yearly ? `+ ${formatEuroShort(prices.training)} / an` : `+ ${formatEuro(prices.training)} / mois`,
    recording: yearly ? `+ ${formatEuroShort(prices.recording)} / an` : `+ ${formatEuro(prices.recording)} / mois`,
    convocations: "Inclus dans PRO et PRO+",
    live: "Inclus dans PRO+",
  };

  const plans: {
    id: PriceKey;
    name: string;
    badge?: string;
    pitch: string;
    modules: ModuleId[];
    features: string[];
    cta: string;
    highlight?: boolean;
    checkout?: "pro" | "club";
  }[] = [
    {
      id: "free",
      name: "Gratuite",
      pitch: "Pour découvrir le tableau tactique.",
      modules: ["tactic"],
      features: ["Tableau tactique et barre d'outils", "Effectif et rôles de votre équipe", "Animations, export PNG et vue 3D"],
      cta: "Commencer gratuitement",
    },
    {
      id: "pro",
      name: "PRO",
      pitch: "Pour gérer ses équipes et convoquer ses joueurs.",
      modules: ["tactic", "convocations"],
      features: ["Plusieurs équipes et matchs", "Schémas enregistrés et partagés", "Convocations joueurs et parents", "Adversaire, PDF de match, dictée"],
      cta: "Choisir PRO",
      checkout: "pro",
    },
    {
      id: "plus",
      name: "PRO+",
      pitch: "Pour vivre le match en direct avec son staff.",
      modules: ["tactic", "convocations", "live"],
      features: ["Tout PRO", "Mode Live Match et télécommande", "Page publique du match", "Bilan du match partageable"],
      cta: "Choisir PRO+",
      checkout: "club",
    },
    {
      id: "pack",
      name: "Pack Staff",
      badge: "Le plus complet",
      pitch: "Les cinq modules, pour tout le staff.",
      modules: ["tactic", "convocations", "live", "training", "recording"],
      features: ["Tout PRO+", "Module Training", "Module Recording", `${monthlySaving} économisés par mois`],
      cta: "Choisir le Pack Staff",
      highlight: true,
    },
  ];

  const ghostCta =
    "fc-btn fc-ghost inline-flex items-center justify-center rounded-full border border-[#243042] font-bold text-[#e2e8f0] no-underline cursor-pointer bg-transparent";
  const primaryCta =
    "fc-btn fc-primary inline-flex items-center justify-center rounded-full bg-[#00E599] font-extrabold text-[#04120c] no-underline cursor-pointer border-0";

  return (
    <div className="fc-landing min-h-screen overflow-x-hidden bg-[#05070b] text-[#e2e8f0]">
      {/* EN-TÊTE */}
      <header className="fc-in relative z-20 sm:sticky sm:top-0 border-b border-white/[0.06] bg-[rgba(5,7,11,0.72)] backdrop-blur-[16px] backdrop-saturate-[1.4]">
        <nav aria-label="Navigation principale" className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-7 gap-y-3 px-6 py-3.5">
          <a href="#top" className="inline-flex items-center gap-2.5 text-white no-underline" aria-label="TheBox FC, retour en haut de page">
            <LogoIcon className="h-8 w-8 text-[#00E599]" aria-hidden="true" />
            <span className="fc-display text-xl font-extrabold tracking-[-0.02em]">thebox fc</span>
          </a>
          <div className="flex flex-auto flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            {[
              ["#modules", "Modules"],
              ["#tarifs", "Tarifs"],
              ["#club", "Clubs"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} className="fc-nav text-[#aab6c8] no-underline" href={href}>
                {label}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={onOpenLoginModal} className={`${ghostCta} h-11 px-[18px] text-sm`}>
              Se connecter
            </button>
            <button type="button" onClick={onOpenRegisterModal} className={`${primaryCta} h-11 px-5 text-sm`}>
              Essai gratuit {TRIAL_DAYS} jours
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section id="top" className="relative isolate">
          <div aria-hidden="true" className="absolute inset-0 -z-20 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="fc-zoom block h-full w-full object-cover opacity-55" src="/landing/hero-bg.webp" alt="" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,7,11,0.96) 0%, rgba(5,7,11,0.82) 42%, rgba(5,7,11,0.45) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,7,11,0.6) 0%, rgba(5,7,11,0) 25%, rgba(5,7,11,0) 70%, #05070b 100%)" }} />
          </div>
          <div
            aria-hidden="true"
            className="fc-aura absolute -right-20 -top-[120px] -z-10 h-[620px] w-[720px] max-w-full rounded-full blur-[10px]"
            style={{ background: "radial-gradient(closest-side, rgba(0,229,153,0.22), rgba(0,229,153,0) 70%)" }}
          />

          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-16 px-6 pb-[88px] pt-16 sm:pt-[104px]">
            <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[26px]">
              <p className="fc-in fc-d1 m-0 inline-flex h-[34px] items-center gap-2.5 self-start rounded-full border border-[rgba(0,229,153,0.28)] bg-[rgba(0,229,153,0.07)] py-0 pl-1.5 pr-3.5 text-[13px] font-bold text-[#5dffc6]">
                <span className="inline-flex h-[22px] items-center rounded-full bg-[#00E599] px-2 text-[11px] font-extrabold tracking-[0.06em] text-[#04120c]">NOUVEAU</span>
                Zone de décision tactique, en 5 modules
              </p>
              <h1 className="fc-in fc-d2 fc-display m-0 text-[clamp(40px,5.4vw,72px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-white">
                Préparer, entraîner, analyser, convoquer.{" "}
                <span className="fc-serif tracking-[-0.01em] text-[#00E599]">Tout le staff et l&apos;équipe dans une seule application.</span>
              </h1>
              <p className="fc-in fc-d3 m-0 max-w-[560px] text-[19px] leading-[1.65] text-[#94a3b8]">
                Le tableau tactique TheBox FC s&apos;enrichit de modules pensés pour la semaine du coach : séances d&apos;entraînement, analyse vidéo,
                convocations des joueurs et suivi du match en direct.
              </p>
              <div className="fc-in fc-d4 flex flex-wrap gap-3 pt-1.5">
                <button type="button" onClick={onOpenRegisterModal} className={`${primaryCta} h-14 gap-2.5 px-7 text-base`}>
                  Essayer tous les modules
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden="true" />
                </button>
                <a href="#modules" className={`${ghostCta} h-14 px-6 text-base`}>
                  Découvrir les modules
                </a>
              </div>
              <p className="fc-in fc-d5 m-0 flex flex-wrap gap-[18px] text-[13px] text-[#8a97ab]">
                {[`${TRIAL_DAYS} jours d'accès complet`, "Sans carte bancaire", "Sans engagement"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#00E599]" strokeWidth={3} aria-hidden="true" />
                    {t}
                  </span>
                ))}
              </p>
            </div>

            <figure
              className="fc-in fc-d6 m-0 min-w-0 flex-[1_1_480px] rounded-[28px] p-px"
              style={{
                background: "linear-gradient(160deg, rgba(0,229,153,0.55), rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.04) 65%, rgba(59,130,246,0.4))",
                boxShadow: "0 40px 120px -40px rgba(0,229,153,0.35), 0 30px 60px -30px rgba(0,0,0,0.9)",
              }}
            >
              <div className="aspect-video overflow-hidden rounded-[27px] bg-[#05070b]">
                <video
                  ref={heroVideo}
                  className="block h-full w-full object-cover"
                  src="/landing/hero-video.mp4"
                  poster="/landing/hero-poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Vidéo de présentation de TheBox FC : Training, Convocations, Tactic, Live et Recording au fil de la semaine du coach, puis le Pack Staff"
                />
              </div>
            </figure>
          </div>
        </section>

        {/* BANDEAU DÉFILANT */}
        <div
          aria-hidden="true"
          className="overflow-hidden border-y border-white/[0.06] bg-[#070a10]"
          style={{ WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)", maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)" }}
        >
          <div className="fc-track fc-display flex w-max gap-14 whitespace-nowrap px-7 py-[22px] text-[22px] font-extrabold tracking-[-0.01em] text-[#3a4658]">
            {[0, 1].map((k) => (
              <React.Fragment key={k}>
                {MARQUEE.map((id) => (
                  <span key={id} className="inline-flex items-center gap-3.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: MOD[id].color }} />
                    {MOD[id].name}
                  </span>
                ))}
                <span className="fc-serif inline-flex items-center text-[26px] text-[#4a5a70]">la semaine du coach, réunie</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* LA SEMAINE DU COACH */}
        <section aria-labelledby="semaine-titre" className="mx-auto flex max-w-[1240px] flex-col gap-9 px-6 pb-10 pt-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="fc-reveal flex max-w-[720px] flex-col gap-3">
              <Eyebrow>La semaine</Eyebrow>
              <h2 id="semaine-titre" className="fc-display m-0 text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-[40px]">
                Un module pour chaque <span className="fc-serif">moment</span> de la semaine
              </h2>
            </div>
            <ArrowButtons label="Moments" onPrev={() => week.step(-1)} onNext={() => week.step(1)} />
          </div>
          <div className="fc-reveal relative">
            <ol
              id="fc-track-week"
              {...week.handlers}
              tabIndex={0}
              aria-label="Les cinq moments de la semaine : faites glisser avec la souris, la molette ou les flèches du clavier"
              className="fc-drag fc-week -mb-[30px] -mt-3.5 flex list-none gap-3.5 overflow-x-auto px-0.5 pb-[30px] pt-3.5"
              style={{ scrollSnapType: "x mandatory", overscrollBehaviorX: "contain" }}
            >
              {WEEK.map((w, i) => {
                const m = MOD[w.mod];
                return (
                  <li key={w.day} className="fc-step relative flex flex-col gap-3 rounded-[22px] border border-white/[0.07] bg-[#0a0e15] px-3 pb-5 pt-3">
                    <div
                      role="img"
                      aria-label={WEEK_LABELS[i]}
                      className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: WEEK_ILLUSTRATIONS[i].replace(/ role="img" aria-label="[^"]*"/, ' aria-hidden="true"') }}
                    />
                    <div className="flex flex-col gap-2 px-2">
                      <span className="h-[3px] w-[34px] rounded-[3px]" style={{ background: m.color }} />
                      <p className="m-0 text-xs font-extrabold tracking-[0.08em]" style={{ color: m.light }}>
                        {w.day}
                      </p>
                      <p className="m-0 text-[15px] leading-[1.55] text-[#cbd5e1]">{w.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* MODULES */}
        <section id="modules" aria-labelledby="modules-titre" className="mx-auto flex max-w-[1240px] flex-col gap-11 px-6 pb-[104px] pt-[72px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="fc-reveal flex max-w-[720px] flex-col gap-3.5">
              <Eyebrow>Les modules</Eyebrow>
              <h2 id="modules-titre" className="fc-display m-0 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] text-white sm:text-[48px]">
                Un socle tactique, des modules <span className="fc-serif text-[#00E599]">à la carte</span>
              </h2>
              <p className="m-0 text-[17px] leading-[1.65] text-[#94a3b8]">
                Tactic est le cœur de TheBox FC. Ajoutez seulement les modules dont votre staff a besoin, ou prenez le Pack Staff.
              </p>
            </div>
            <ArrowButtons label="Modules" onPrev={() => modules.step(-1)} onNext={() => modules.step(1)} />
          </div>

          <div
            id="fc-track-modules"
            {...modules.handlers}
            tabIndex={0}
            aria-label="Les modules : faites glisser avec la souris, la molette ou les flèches du clavier"
            className="fc-mgrid fc-drag fc-reveal -my-3.5 flex gap-[18px] overflow-x-auto px-0.5 pb-[30px] pt-3.5"
            style={{ scrollSnapType: "x mandatory", overscrollBehaviorX: "contain", marginBottom: -30 }}
          >
            {MODULE_CARDS.map((c) => {
              const m = MOD[c.mod];
              return (
                <article
                  key={c.mod}
                  data-module={c.mod}
                  className="fc-card flex flex-col gap-4 rounded-3xl p-7"
                  style={{ border: `1px solid rgba(${m.rgb},0.24)`, background: `linear-gradient(180deg, rgba(${m.rgb},0.1), rgba(${m.rgb},0) 55%), ${m.bg}` }}
                >
                  <div className="-mx-3 -mt-3 mb-1 rounded-[18px] p-px" style={{ background: `linear-gradient(160deg, rgba(${m.rgb},0.5), rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.03))` }}>
                    <div className="rounded-[17px] bg-[linear-gradient(180deg,#0d131d,#080b11)] p-2.5">
                      <div className="relative aspect-[320/170] overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="fc-photo block h-full w-full object-cover" src={c.image} alt={c.alt} loading="lazy" />
                        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,7,11,0) 55%, rgba(5,7,11,0.75))" }} />
                        <span
                          className="absolute bottom-2.5 left-2.5 inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-extrabold tracking-[0.06em] backdrop-blur-[6px]"
                          style={{ background: "rgba(5,7,11,0.8)", border: `1px solid rgba(${m.rgb},0.55)`, color: m.light }}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${c.mod === "recording" ? "fc-blink" : c.mod === "live" ? "fc-pulse" : ""}`}
                            style={{ background: m.color }}
                          />
                          {c.caption}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="fc-display m-0 flex items-center gap-3 text-[22px] font-extrabold text-white">
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ background: `rgba(${m.rgb},0.12)`, border: `1px solid rgba(${m.rgb},0.3)` }}
                      >
                        {c.icon}
                      </span>
                      {m.name}
                    </h3>
                    <span className="rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ color: m.light, border: `1px solid rgba(${m.rgb},0.35)` }}>
                      {c.badge}
                    </span>
                  </div>
                  <p className="m-0 leading-[1.6] text-[#cbd5e1]">{c.desc}</p>
                  <ul className="m-0 pl-[18px] text-[15px] leading-[1.85] text-[#94a3b8]">
                    {c.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <p className="m-0 mt-auto border-t border-white/[0.06] pt-3.5 text-sm font-bold" style={{ color: m.light }}>
                    {modulePriceLine[c.mod]}
                  </p>
                </article>
              );
            })}

            {/* Pack Staff */}
            <article
              data-module="pack"
              className="fc-card fc-gborder flex flex-col gap-4 rounded-3xl p-7"
              style={{
                border: "1px solid transparent",
                background: `linear-gradient(180deg, #0f1620, #090c12) padding-box, ${GRADIENT_BORDER}`,
                boxShadow: "0 30px 80px -40px rgba(0,229,153,0.5)",
              }}
            >
              <div className="-mx-3 -mt-3 mb-1 rounded-[18px] p-px" style={{ background: "linear-gradient(160deg, rgba(0,229,153,0.5), rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.03))" }}>
                <div className="rounded-[17px] bg-[linear-gradient(180deg,#0d131d,#080b11)] p-2.5">
                  <div className="relative aspect-[320/170] overflow-hidden rounded-xl bg-[#05070b]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="fc-photo block h-full w-full object-cover"
                      src="/landing/pack-staff.webp"
                      alt="Animation : le logo TheBox FC au centre, relié aux cinq modules Tactic, Training, Recording, Convocations et Live"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="fc-display m-0 text-[22px] font-extrabold text-white">Pack Staff</h3>
                <span className="rounded-full bg-[#00E599] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.04em] text-[#04120c]">LE PLUS COMPLET</span>
              </div>
              <p className="m-0 leading-[1.6] text-[#cbd5e1]">Les cinq modules réunis pour le staff qui prépare, entraîne, convoque, vit et analyse chaque match.</p>
              <div className="flex flex-wrap gap-1.5" aria-hidden="true">
                {MARQUEE.map((id) => (
                  <span key={id} className="h-2.5 w-2.5 rounded-full" style={{ background: MOD[id].color }} />
                ))}
              </div>
              <p className="fc-display m-0 text-[40px] font-extrabold tracking-[-0.03em] text-white">
                {yearly ? formatEuroShort(prices.pack) : formatEuro(prices.pack)} <span className="text-[15px] font-semibold tracking-normal text-[#94a3b8]">{per}</span>
              </p>
              <p className="m-0 text-sm font-bold text-[#5dffc6]">
                {formatEuroShort(packSaving(billing))} économisés {yearly ? "chaque année" : "chaque mois"}
              </p>
              <a href="#tarifs" className={`${primaryCta} mt-auto h-[50px]`}>
                Composer mon offre
              </a>
            </article>
          </div>
        </section>

        {/* TARIFS */}
        <section id="tarifs" aria-labelledby="tarifs-titre" className="relative isolate border-t border-white/[0.06] bg-[#070a10]">
          <div
            className="fc-aura absolute left-1/2 top-10 -z-10 -ml-[450px] h-[420px] w-[900px] rounded-full"
            aria-hidden="true"
            style={{ background: "radial-gradient(closest-side, rgba(0,229,153,0.12), rgba(0,229,153,0) 70%)" }}
          />
          <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 py-[104px]">
            <div className="fc-reveal flex flex-wrap items-end justify-between gap-6">
              <div className="flex max-w-[640px] flex-col gap-3.5">
                <Eyebrow>Tarifs</Eyebrow>
                <h2 id="tarifs-titre" className="fc-display m-0 text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] text-white sm:text-[48px]">
                  Payez seulement ce que votre staff <span className="fc-serif text-[#00E599]">utilise</span>
                </h2>
                <p className="m-0 text-[17px] text-[#94a3b8]">Sans engagement, résiliable à tout moment. {TRIAL_DAYS} jours d&apos;essai avec tous les modules.</p>
              </div>
              <div
                role="group"
                aria-label="Période de facturation"
                className="relative box-border grid w-full max-w-[400px] grid-cols-2 rounded-full border border-[#1f2a3a] bg-[#0b0f17] p-[5px]"
              >
                <span
                  aria-hidden="true"
                  className="fc-seg absolute bottom-[5px] left-[5px] top-[5px] w-[calc(50%-5px)] rounded-full bg-[#00E599] shadow-[0_8px_24px_-8px_rgba(0,229,153,0.7)]"
                  style={{ transform: `translateX(${yearly ? "100%" : "0"})` }}
                />
                {(
                  [
                    ["month", "Mensuel"],
                    ["year", "Annuel · 2 mois offerts"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBilling(id)}
                    aria-pressed={billing === id}
                    className="relative z-[1] min-h-11 cursor-pointer rounded-full border-0 bg-transparent px-[18px] text-sm font-bold transition-colors duration-300"
                    style={{ color: billing === id ? "#04120c" : "#cbd5e1" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fc-plans">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  data-plan={plan.id}
                  className={`fc-card fc-reveal flex flex-col gap-3.5 rounded-3xl p-[26px] ${plan.highlight ? "fc-gborder" : ""}`}
                  style={
                    plan.highlight
                      ? {
                          border: "1px solid transparent",
                          background: `linear-gradient(180deg, #111a24, #0a0e14) padding-box, ${GRADIENT_BORDER}`,
                          boxShadow: "0 30px 90px -40px rgba(0,229,153,0.55)",
                        }
                      : { border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg, #0d131c, #090c12)" }
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="fc-display m-0 text-xl font-extrabold text-white">{plan.name}</h3>
                    {plan.badge && <span className="rounded-full bg-[#00E599] px-2.5 py-1 text-[11px] font-extrabold text-[#04120c]">{plan.badge}</span>}
                  </div>
                  <p className="m-0 min-h-[42px] text-sm leading-normal text-[#94a3b8]">{plan.pitch}</p>
                  <p className="fc-display m-0 text-[42px] font-extrabold tracking-[-0.03em] text-white">
                    {plan.id === "free" ? "0 €" : priceOf(plan.id)}{" "}
                    {plan.id !== "free" && <span className="text-[15px] font-semibold tracking-normal text-[#94a3b8]">/ mois</span>}
                  </p>
                  <p className="m-0 min-h-[18px] text-[13px] text-[#8a97ab]">{billedOf(plan.id)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.modules.map((id) => (
                      <ModuleChip key={id} mod={id} />
                    ))}
                  </div>
                  <ul className="m-0 flex list-none flex-col gap-2.5 border-t border-white/[0.06] p-0 pt-3.5 text-sm text-[#cbd5e1]">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 leading-[1.45]">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-[#00E599]" strokeWidth={3} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-col gap-2">
                    <button type="button" onClick={onOpenRegisterModal} className={`${plan.highlight ? primaryCta : ghostCta} h-[50px] w-full`}>
                      {plan.cta}
                    </button>
                    {plan.checkout && !yearly && (
                      <button
                        type="button"
                        disabled={Boolean(stripeLoadingPlan)}
                        onClick={() => launchCheckout(plan.checkout!)}
                        className="cursor-pointer border-0 bg-transparent py-1 text-[13px] font-semibold text-[#8a97ab] underline-offset-4 hover:text-white hover:underline disabled:cursor-wait"
                      >
                        {stripeLoadingPlan === plan.checkout ? "Redirection vers le paiement…" : "ou s'abonner sans essai"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {stripeError && (
              <p role="alert" className="m-0 rounded-xl border border-[#FF5A4E]/40 bg-[#FF5A4E]/10 px-4 py-3 text-sm text-[#ffa8a1]">
                {stripeError}
              </p>
            )}

            {/* Calculateur */}
            <div className="fc-reveal flex flex-wrap items-center gap-7 rounded-[26px] border border-[#1f2a3a] bg-[linear-gradient(180deg,#0d131c,#090c12)] p-6 sm:p-8" data-testid="landing-calculator">
              <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-[18px]">
                <h3 className="fc-display m-0 text-2xl font-extrabold tracking-[-0.02em] text-white">Composez votre offre</h3>
                <div role="group" aria-label="Formule de base" className="flex flex-wrap gap-2">
                  {(
                    [
                      ["pro", "PRO · Tactic + Convocations"],
                      ["plus", "PRO+ · avec Live"],
                    ] as const
                  ).map(([id, label]) => {
                    const on = base === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setBase(id)}
                        aria-pressed={on}
                        className="fc-btn min-h-[50px] cursor-pointer rounded-[14px] px-[18px] text-sm font-bold"
                        style={
                          on
                            ? { background: "rgba(0,229,153,0.1)", color: "#5dffc6", border: "1px solid #00E599", boxShadow: "0 0 0 3px rgba(0,229,153,0.12)" }
                            : { background: "#05070b", color: "#cbd5e1", border: "1px solid #243042" }
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(
                    [
                      ["training", addTraining, setAddTraining],
                      ["recording", addRecording, setAddRecording],
                    ] as const
                  ).map(([id, checked, set]) => {
                    const m = MOD[id];
                    return (
                      <label
                        key={id}
                        className="fc-btn flex min-h-[50px] cursor-pointer items-center gap-2.5 rounded-[14px] px-4 font-semibold text-[#e2e8f0]"
                        style={{ border: `1px solid rgba(${m.rgb},0.32)`, background: `rgba(${m.rgb},0.07)` }}
                      >
                        <input type="checkbox" checked={checked} onChange={() => set(!checked)} className="h-[18px] w-[18px]" style={{ accentColor: m.color }} />
                        Module {m.name}{" "}
                        <span style={{ color: m.light }}>
                          + {yearly ? `${formatEuroShort(prices[id])} / an` : `${formatEuro(prices[id])} / mois`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div
                aria-live="polite"
                className="flex min-w-0 flex-[1_1_280px] flex-col gap-2 rounded-[20px] border border-[rgba(0,229,153,0.25)] p-6"
                style={{ background: "radial-gradient(120% 120% at 100% 0%, rgba(0,229,153,0.14), rgba(0,229,153,0) 60%), #05070b" }}
              >
                <p className="m-0 text-[13px] font-bold uppercase tracking-[0.1em] text-[#8a97ab]">Votre total</p>
                <p className="fc-display m-0 text-[46px] font-extrabold tracking-[-0.03em] text-white" data-testid="landing-total">
                  {formatEuroShort(offer.total)} <span className="text-[15px] font-semibold tracking-normal text-[#94a3b8]">{per}</span>
                </p>
                <p className="m-0 text-sm text-[#94a3b8]">{offer.label}</p>
                {offer.hint && <p className="m-0 mt-1.5 text-sm font-bold text-[#5dffc6]">{offer.hint}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* CLUBS */}
        <section id="club" aria-labelledby="club-titre" className="mx-auto max-w-[1240px] px-6 pb-[72px] pt-[88px]">
          <div
            className="fc-reveal relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[28px] border border-white/[0.08] p-8 sm:p-11"
            style={{
              background:
                "radial-gradient(80% 140% at 0% 0%, rgba(59,130,246,0.14), rgba(59,130,246,0) 55%), radial-gradient(70% 140% at 100% 100%, rgba(0,229,153,0.14), rgba(0,229,153,0) 55%), #0a0e15",
            }}
          >
            <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3">
              <h2 id="club-titre" className="fc-display m-0 text-[34px] font-extrabold tracking-[-0.03em] text-white">
                Clubs et <span className="fc-serif">académies</span>
              </h2>
              <p className="m-0 text-base leading-[1.65] text-[#94a3b8]">
                Plusieurs coachs, toutes les catégories, une facture unique pour le club. Contactez-nous : nous construisons ensemble l&apos;offre adaptée à votre club.
              </p>
            </div>
            <a
              href="#contact"
              className="fc-btn fc-ghost inline-flex h-[54px] items-center gap-2.5 rounded-full border border-[#00E599] px-[26px] font-extrabold text-[#00E599] no-underline"
            >
              Nous contacter
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-titre" className="mx-auto flex max-w-[900px] flex-col gap-3 px-6 pb-[104px] pt-6">
          <h2 id="faq-titre" className="fc-reveal fc-display m-0 mb-3 text-[34px] font-extrabold tracking-[-0.03em] text-white">
            Questions sur les modules
          </h2>
          {[
            ["Puis-je ajouter un module à tout moment ?", "Oui. Un module s'ajoute ou se retire depuis votre abonnement ; il est facturé au prorata du mois en cours."],
            ["Faut-il une formule PRO pour prendre un module ?", "Oui, Training et Recording s'ajoutent à une formule PRO ou PRO+. Ils s'appuient sur vos équipes et vos matchs."],
            [
              "Que comprend le Pack Staff ?",
              `Les cinq modules : Tactic, Convocations, Live, Training et Recording, pour ${formatEuro(priceTable("month").pack)} par mois au lieu de ${formatEuro(
                priceTable("month").plus + priceTable("month").training + priceTable("month").recording
              )}.`,
            ],
            ["Les joueurs et les parents doivent-ils payer pour répondre aux convocations ?", "Non. Ils répondent gratuitement depuis leur téléphone, avec le lien ou le QR code envoyé par le coach."],
          ].map(([q, a]) => (
            <details key={q} className="fc-faq fc-reveal rounded-[18px] border border-white/[0.08] bg-[#0a0e15] px-[22px] py-5 transition-colors duration-300">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold text-white">
                {q}
                <Plus className="fc-chev h-5 w-5 flex-none text-[#00E599]" strokeWidth={2.5} aria-hidden="true" />
              </summary>
              <p className="m-0 mt-3 leading-[1.65] text-[#94a3b8]">{a}</p>
            </details>
          ))}
          {onOpenLegalModal && (
            <button
              type="button"
              onClick={() => onOpenLegalModal("faq")}
              aria-label="Ouvrir la FAQ complète"
              className="mt-2 cursor-pointer self-start border-0 bg-transparent p-0 text-sm font-bold text-[#00E599] underline-offset-4 hover:underline"
            >
              Voir toutes les questions
            </button>
          )}
        </section>

        <LandingContactSection isAdmin={isAdmin} language="fr" />
      </main>

      <footer className="border-t border-white/[0.06] bg-[#070a10]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-[18px] px-6 py-8 text-[13px] text-[#8a97ab]">
          <span className="inline-flex items-center gap-2.5">
            <LogoIcon className="h-[22px] w-[22px] text-[#00E599]" aria-hidden="true" />
            TheBox FC · Zone de décision tactique · © {new Date().getFullYear()}
          </span>
          <div className="flex flex-wrap gap-x-[18px] gap-y-2">
            {onOpenLegalModal &&
              (
                [
                  ["faq", "FAQ"],
                  ["cgu", "CGU"],
                  ["cgv", "CGV"],
                  ["privacy", "Confidentialité"],
                  ["mentions", "Mentions légales"],
                  ["dpa", "DPA"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" onClick={() => onOpenLegalModal(id)} className="fc-nav cursor-pointer border-0 bg-transparent text-[#8a97ab]">
                  {label}
                </button>
              ))}
            <button
              type="button"
              onClick={() => (onOpenSupportModal ? onOpenSupportModal() : (window.location.hash = "contact"))}
              className="fc-nav cursor-pointer border-0 bg-transparent text-[#8a97ab]"
            >
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
