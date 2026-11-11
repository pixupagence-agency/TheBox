"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Zap, 
  PenTool, 
  Download, 
  Sliders, 
  Layers, 
  Play,
  Users,
  ArrowRight,
  Eye,
  Info
} from "lucide-react";

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachName?: string;
  sportName?: string;
  onCompleteTutorial?: () => void;
  isModernSleek?: boolean;
}

export interface InAppTourStep {
  id: number;
  targetId: string;
  title: string;
  category: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  keyPoints: string[];
  proTip: string;
  preferredPlacement: "top" | "bottom" | "left" | "right";
}

export default function OnboardingTutorialModal({
  isOpen,
  onClose,
  coachName = "Coach",
  sportName = "Football",
  onCompleteTutorial,
  isModernSleek = false,
}: OnboardingTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const rawSteps: Omit<InAppTourStep, "id" | "badge">[] = [
    {
      targetId: "tour-top-header",
      category: "Barre Supérieure",
      icon: <Sparkles className="h-5 w-5 text-[#00E599]" />,
      title: `Bienvenue sur THE BOX, ${coachName} !`,
      description: "La barre du haut regroupe votre formule, l'aide et l'accès à votre compte.",
      keyPoints: [
        "Badge de formule : Gratuite, essai PRO+ (14 jours) avec son compte à rebours, PRO ou PRO+",
        "Votre profil (à droite) : guide d'utilisation, FAQ, support, configuration du profil et déconnexion",
        "🎓 Tuto Coach : relancez ce tutoriel à tout moment"
      ],
      proTip: "Vos équipes, matchs et schémas sont sauvegardés sur votre compte : retrouvez-les sur ordinateur, tablette ou smartphone.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-team-panel",
      category: "Mon Équipe",
      icon: <Users className="h-5 w-5 text-emerald-400" />,
      title: "Votre Équipe & Votre Adversaire",
      description: "Les panneaux « Mon Équipe » (à gauche) et « Mon Adversaire » (à droite) pilotent la composition de chaque camp.",
      keyPoints: [
        "SCHÉMA : appliquez une formation en un clic (ex. 4-3-3, 4-4-2…)",
        "Effectif : noms, numéros, postes, photos, titulaires et remplaçants",
        "Rôles Tactiques : capitaine, tireurs de penalty, coups francs et corners",
        "Dans leur camp / Effacer : regroupez ou retirez les joueurs du terrain"
      ],
      proTip: "L'effectif et les rôles de l'adversaire, ainsi que le bouton « + Adv », sont disponibles avec les formules PRO et PRO+.",
      preferredPlacement: "right"
    },
    {
      targetId: "pitch-main-viewport",
      category: "Terrain Tactique",
      icon: <Layers className="h-5 w-5 text-emerald-400" />,
      title: "Le Terrain & les Joueurs",
      description: "Votre zone de travail : placez vos joueurs, le ballon et vos tracés pour préparer séances et matchs.",
      keyPoints: [
        "Glisser-déposer : déplacez joueurs et ballon librement",
        "Double-clic sur un joueur : modifiez son nom, son numéro, son poste ou sa photo",
        "Football, basket, rugby et handball : terrain et formations adaptés au sport choisi"
      ],
      proTip: "Un remplaçant se fait entrer sur le terrain depuis la fiche du joueur ou depuis l'effectif.",
      preferredPlacement: "top"
    },
    {
      targetId: "tour-drawing-tools",
      category: "Outils de Dessin",
      icon: <PenTool className="h-5 w-5 text-blue-400" />,
      title: "Les Outils de Tracé",
      description: "Au-dessus du terrain, dessinez vos consignes sans déplacer les joueurs.",
      keyPoints: [
        "Ligne pleine ou pointillée (un clic de plus pour basculer), Flèche, Zone rectangulaire et Dessin libre",
        "Sélecteur : cliquez sur un tracé pour le supprimer ; Déplacer : faites glisser le terrain quand il est zoomé",
        "Couleur et épaisseur du trait dans le groupe « TRAIT »",
        "Corbeille : effacez tous les tracés d'un coup"
      ],
      proTip: "Ctrl + Z (Cmd + Z sur Mac) annule le dernier tracé.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-pitch-controllers",
      category: "Affichage",
      icon: <Sliders className="h-5 w-5 text-cyan-400" />,
      title: "Affichage & Zoom du Terrain",
      description: "Adaptez la vue à ce que vous voulez montrer et à la taille de votre écran.",
      keyPoints: [
        "Terrain complet ou demi-terrain, format paysage ou portrait",
        "Joueurs en pastille, buste ou tête ; afficher ou masquer noms, adversaires et ballon",
        "Échelle du terrain, taille des joueurs et mode plein écran"
      ],
      proTip: "Le demi-terrain est idéal pour détailler corners et coups francs aux abords de la surface.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-right-sidebar",
      category: "Schémas, Matchs & Notes",
      icon: <Play className="h-5 w-5 text-amber-400" />,
      title: "Schémas, Matchs & Mode Live",
      description: "Le panneau de droite organise votre préparation match par match.",
      keyPoints: [
        "Équipe active (en haut du panneau) : changez d'équipe ou gérez plusieurs équipes (PRO)",
        "Schémas : enregistrez vos compositions et animations, rattachées à un match (PRO)",
        "Matchs : créez vos rencontres et retrouvez leurs schémas et notes (PRO)",
        "Notes & causerie : consignes écrites, ou dictées à la voix (PRO)",
        "⏱️ Mode Live Match : chrono par période, score, buteurs, cartons et remplacements (PRO+)"
      ],
      proTip: "En Live, double-cliquez sur un joueur puis utilisez B (but), P (passe), J (jaune) ou R (rouge).",
      preferredPlacement: "left"
    },
    {
      targetId: "tour-export-actions",
      category: "Export & Partage",
      icon: <Download className="h-5 w-5 text-[#00E599]" />,
      title: "Export HD & Partage",
      description: "Votre plan de jeu est prêt ? Diffusez-le à vos joueurs et à votre staff.",
      keyPoints: [
        "Export PNG HD : image nette du terrain, des joueurs et des tracés",
        "Vue Carte 3D : présentation de l'équipe en cartes ou en têtes, paysage ou portrait",
        "Partage d'un schéma enregistré : image, GIF ou vidéo d'animation, WhatsApp et e-mail (PRO)"
      ],
      proTip: "Bravo Coach ! Retrouvez le détail de chaque fonction dans le Guide d'Utilisation, depuis votre profil.",
      preferredPlacement: "right"
    }
  ];

  const steps: InAppTourStep[] = rawSteps.map((step, idx) => ({
    ...step,
    id: idx + 1,
    badge: `Étape ${idx + 1}/${rawSteps.length} • ${step.category}`,
  }));

  const current = steps[currentStep];

  // Update target bounding box
  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const targetEl = document.getElementById(current.targetId);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // Fallback center of screen
      setTargetRect(null);
    }
  }, [isOpen, current.targetId]);

  const handleFinish = useCallback(() => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("thebox_tutorial_seen", "true");
    }
    if (onCompleteTutorial) {
      onCompleteTutorial();
    }
    onClose();
  }, [dontShowAgain, onCompleteTutorial, onClose]);

  // Measure and update target rect on step change, resize, and scroll
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      updateTargetRect();
    }, 50);

    const handleResizeOrScroll = () => {
      updateTargetRect();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
        else handleFinish();
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) setCurrentStep((prev) => prev - 1);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep, steps.length, onClose, handleFinish]);

  if (!isOpen) return null;

  // Compute tooltip position style relative to target element
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || typeof window === "undefined") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed",
      };
    }

    const margin = 16;
    const cardWidth = Math.min(420, window.innerWidth - 32);
    const cardHeight = 360;

    let placement = current.preferredPlacement;

    // Viewport bounds detection
    const canFitRight = targetRect.right + margin + cardWidth < window.innerWidth;
    const canFitLeft = targetRect.left - margin - cardWidth > 0;
    const canFitBottom = targetRect.bottom + margin + cardHeight < window.innerHeight;
    const canFitTop = targetRect.top - margin - cardHeight > 0;

    if (placement === "right" && !canFitRight) {
      placement = canFitLeft ? "left" : (canFitBottom ? "bottom" : "top");
    } else if (placement === "left" && !canFitLeft) {
      placement = canFitRight ? "right" : (canFitBottom ? "bottom" : "top");
    } else if (placement === "bottom" && !canFitBottom) {
      placement = canFitTop ? "top" : (canFitRight ? "right" : "left");
    } else if (placement === "top" && !canFitTop) {
      placement = canFitBottom ? "bottom" : (canFitRight ? "right" : "left");
    }

    // On mobile screen width, center horizontally at bottom or top
    if (window.innerWidth < 640) {
      return {
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 100,
      };
    }

    switch (placement) {
      case "right":
        return {
          position: "fixed",
          top: Math.max(margin, Math.min(window.innerHeight - cardHeight - margin, targetRect.top)),
          left: targetRect.right + margin,
          width: `${cardWidth}px`,
          zIndex: 100,
        };
      case "left":
        return {
          position: "fixed",
          top: Math.max(margin, Math.min(window.innerHeight - cardHeight - margin, targetRect.top)),
          left: Math.max(margin, targetRect.left - cardWidth - margin),
          width: `${cardWidth}px`,
          zIndex: 100,
        };
      case "bottom":
        return {
          position: "fixed",
          top: targetRect.bottom + margin,
          left: Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, targetRect.left + targetRect.width / 2 - cardWidth / 2)),
          width: `${cardWidth}px`,
          zIndex: 100,
        };
      case "top":
      default:
        return {
          position: "fixed",
          top: Math.max(margin, targetRect.top - cardHeight - margin),
          left: Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, targetRect.left + targetRect.width / 2 - cardWidth / 2)),
          width: `${cardWidth}px`,
          zIndex: 100,
        };
    }
  };

  const highlightPadding = 8;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto select-none">
      
      {/* 1. SPOTLIGHT BACKDROP WITH TARGET CUTOUT */}
      {targetRect ? (
        <svg className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300 ease-out z-40">
          <defs>
            <mask id="tour-spotlight-mask">
              {/* White background means visible backdrop */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black rectangle creates the transparent cutout over the target element */}
              <rect
                x={targetRect.left - highlightPadding}
                y={targetRect.top - highlightPadding}
                width={targetRect.width + highlightPadding * 2}
                height={targetRect.height + highlightPadding * 2}
                rx="14"
                fill="black"
              />
            </mask>
          </defs>
          {/* Semi-transparent dark curtain */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(5, 8, 14, 0.82)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      ) : (
        <div className="fixed inset-0 bg-[#05080e]/85 backdrop-blur-sm z-40" />
      )}

      {/* 2. GLOWING HIGHLIGHT BORDER AROUND TARGET */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            top: targetRect.top - highlightPadding,
            left: targetRect.left - highlightPadding,
            width: targetRect.width + highlightPadding * 2,
            height: targetRect.height + highlightPadding * 2,
            borderRadius: "14px",
            zIndex: 45,
            pointerEvents: "none",
          }}
          className="border-2 border-[#00E599] shadow-[0_0_35px_rgba(0,229,153,0.55)] transition-all duration-300 ease-out animate-pulse"
        >
          {/* Target Corner Accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00E599]" />
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00E599]" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00E599]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00E599]" />
        </div>
      )}

      {/* 3. CONTEXTUAL FLOATING TOUR CARD */}
      <div
        ref={cardRef}
        style={getTooltipStyle()}
        className={`border-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-fade-in ${
          isModernSleek ? "bg-white border-emerald-500 text-slate-900" : "bg-[#0b101a] border-[#00E599]/60 text-white"
        }`}
      >
        {/* Card Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#101726] border-[#1b273d]"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-[#00E599]/15 border-[#00E599]/30 text-[#00E599]"
            }`}>
              {current.icon}
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider block ${
                isModernSleek ? "text-emerald-800" : "text-[#00E599]"
              }`}>
                {current.badge}
              </span>
              <h3 className={`text-xs sm:text-sm font-black leading-tight ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                {current.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition cursor-pointer text-xs font-bold ${
              isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#182338]"
            }`}
            title="Quitter le guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3 text-xs overflow-y-auto max-h-[60vh] sm:max-h-none">
          <p className={`leading-relaxed font-medium ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
            {current.description}
          </p>

          {/* Key Points list */}
          <div className={`space-y-1.5 p-3 rounded-xl border ${
            isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e1524] border-[#1c293e]"
          }`}>
            {current.keyPoints.map((pt, idx) => (
              <div key={idx} className={`flex items-start gap-2 text-[11px] ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#00E599] shrink-0 mt-0.5" />
                <span className="leading-snug">{pt}</span>
              </div>
            ))}
          </div>

          {/* Pro tip */}
          <div className={`border-l-2 border-[#00E599] px-3 py-2 rounded-r-lg flex items-start gap-2 ${
            isModernSleek ? "bg-emerald-50/60" : "bg-gradient-to-r from-emerald-950/40 to-slate-900"
          }`}>
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className={`text-[10.5px] leading-tight ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
              {current.proTip}
            </p>
          </div>
        </div>

        {/* Card Footer */}
        <div className={`px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
          isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#101726] border-[#1b273d]"
        }`}>
          
          {/* Step dots & dont show again */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex gap-1.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? "w-5 bg-[#00E599]"
                      : idx < currentStep
                        ? "w-2 bg-[#00E599]/60"
                        : isModernSleek ? "w-2 bg-slate-300" : "w-2 bg-slate-700"
                  }`}
                  title={`Aller à l'étape ${idx + 1}`}
                />
              ))}
            </div>

            <label className={`flex items-center gap-1.5 text-[10px] cursor-pointer select-none ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded text-[#00E599] focus:ring-[#00E599]"
              />
              <span>Ne plus afficher</span>
            </label>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className={`px-3 py-1.5 border font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer ${
                  isModernSleek ? "bg-white hover:bg-slate-200 border-slate-300 text-slate-700" : "bg-[#172236] hover:bg-[#202f4a] border-transparent text-slate-200"
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Précédent</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 bg-[#00E599] hover:bg-[#05be80] text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-[#00e599]/15"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>FIN</span>
                </>
              ) : (
                <>
                  <span>Suivant</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
