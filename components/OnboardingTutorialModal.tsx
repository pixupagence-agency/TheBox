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
  Eye,
  Info,
  Palette,
  Laptop,
  Smartphone,
  BrickWall,
  Hash,
  Tag,
  Columns,
  Circle,
  Shirt,
  User,
  MousePointer,
  Move,
  ArrowUpRight,
  Scan,
  Pencil,
  Trash2,
  ZoomIn,
  Video,
} from "lucide-react";
import { CurveArrowIcon, PlayerLinkIcon } from "@/components/tactics/icons";

/** Icônes de la barre d'outils dessinées à la main (mêmes tracés que sur la barre) */
const svgProps = { className: "h-4 w-4 shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const FullPitchIcon = () => (<svg {...svgProps}><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="12" y1="4" x2="12" y2="20" /><circle cx="12" cy="12" r="3" /></svg>);
const HalfPitchIcon = () => (<svg {...svgProps}><path d="M4 3h16v18H4z" /><line x1="4" y1="21" x2="20" y2="21" /><path d="M8 3v5h8V3" /><path d="M9 21a3 3 0 0 1 6 0" /></svg>);
const LanesIcon = () => (<svg {...svgProps}><rect x="2" y="4" width="20" height="16" rx="2" />{[8, 10.5, 13.5, 16].map((y) => <line key={y} x1="2" y1={y} x2="22" y2={y} strokeWidth="1.5" strokeDasharray="2 2" />)}</svg>);
const ThirdsIcon = () => (<svg {...svgProps}><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="8.7" y1="4" x2="8.7" y2="20" strokeWidth="1.5" strokeDasharray="2 2" /><line x1="15.3" y1="4" x2="15.3" y2="20" strokeWidth="1.5" strokeDasharray="2 2" /></svg>);
const LineIcon = () => (<svg {...svgProps} strokeWidth={2.5}><line x1="5" y1="19" x2="19" y2="5" /></svg>);
const ic = "h-4 w-4 shrink-0";
const STROKE_COLORS = ["#00E599", "#ef4444", "#3b82f6", "#1e293b", "#eab308"];

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
  /** Fiche de chaque bouton du groupe (repéré sur la barre par data-tour-btn) */
  buttons?: TourButton[];
}

export interface TourButton {
  key: string;
  icon: React.ReactNode;
  name: string;
  text: string;
  /** Condition d'affichage du bouton (ex. « football ») */
  only?: string;
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
  // Bouton de la barre repéré depuis sa fiche (lié à l'étape : il disparaît quand on change d'étape)
  const [spotButton, setSpotButton] = useState<{ step: number; key: string; rect: DOMRect } | null>(null);
  // Boutons réellement présents sur la barre de ce coach (sport, formule) : seules leurs fiches sont affichées
  const [presentButtons, setPresentButtons] = useState<Set<string> | null>(null);
  const spotOn = (key: string) => {
    const el = document.querySelector<HTMLElement>(`[data-tour-btn="${key}"]`);
    if (!el) return setSpotButton(null);
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    setSpotButton({ step: currentStep, key, rect: el.getBoundingClientRect() });
  };
  const spotOff = () => setSpotButton(null);

  const rawSteps: Omit<InAppTourStep, "id" | "badge">[] = [
    {
      targetId: "tour-top-header",
      category: "Barre Supérieure",
      icon: <Sparkles className="h-5 w-5 text-[#00E599]" />,
      title: `Bienvenue sur THE BOX, ${coachName} !`,
      description: "La barre du haut regroupe votre formule, l'aide, le plein écran et l'accès à votre compte.",
      keyPoints: [
        "Badge de formule : Gratuite, essai PRO+ (14 jours) avec son compte à rebours, PRO ou PRO+. Cliquez dessus pour voir les offres",
        "🎓 Tuto Coach : relancez ce tutoriel à tout moment",
        "Plein écran : le terrain occupe tout l'écran, avec sa propre barre d'outils (dont l'épaisseur du trait)",
        "Icône de panneau : affichez ou masquez le panneau de droite",
        "Votre profil (à droite) : guide d'utilisation, FAQ, support, configuration du profil et déconnexion"
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
        "Glisser-déposer : déplacez joueurs et ballon librement (outil Sélecteur actif)",
        "Double-clic sur un joueur : modifiez son nom, son numéro, son poste ou sa photo",
        "Football à 5, 8 ou 11 : terrain et formations adaptés au format choisi"
      ],
      proTip: "Un remplaçant se fait entrer sur le terrain depuis la fiche du joueur ou depuis l'effectif.",
      preferredPlacement: "top"
    },
    {
      targetId: "tour-pitch-controllers",
      category: "Barre d'Outils",
      icon: <Sliders className="h-5 w-5 text-cyan-400" />,
      title: "La Barre d'Outils du Terrain",
      description: "Juste au-dessus du terrain, tous les réglages tiennent sur une seule ligne, rangés en groupes de gauche à droite.",
      keyPoints: [
        "Vue → Affichage → Tracés → Couleurs → Export → Zoom, puis Animation tout à droite",
        "Bouton encadré de couleur = option active ; recliquez pour la désactiver",
        "Survolez un bouton pour afficher son nom",
        "Écran étroit : faites défiler la barre au doigt, à la molette ou avec les flèches ‹ › sur les bords"
      ],
      proTip: "Dans les étapes suivantes, chaque bouton a sa fiche : survolez ou touchez une fiche pour repérer le bouton sur la barre.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-view-tools",
      category: "Barre d'Outils • Vue",
      icon: <Eye className="h-5 w-5 text-cyan-400" />,
      title: "Vue du Terrain",
      description: "Choisissez la portion du terrain affichée et son orientation.",
      keyPoints: [],
      buttons: [
        { key: "full", icon: <FullPitchIcon />, name: "Terrain complet", text: "Affiche les deux moitiés : idéal pour l'organisation générale et les transitions." },
        { key: "half", icon: <HalfPitchIcon />, name: "Demi-terrain", text: "Agrandit une moitié : idéal pour les phases offensives, corners et coups francs." },
        { key: "landscape", icon: <Laptop className={ic} />, name: "Format ordinateur", text: "Terrain en paysage, pour un grand écran ou un vidéoprojecteur." },
        { key: "portrait", icon: <Smartphone className={ic} />, name: "Format smartphone", text: "Terrain en portrait, pour un téléphone ou un export lisible sur mobile." },
        { key: "format", icon: <Users className={ic} />, name: "Format de jeu (11, 8, 5…)", text: "Change le nombre de joueurs : foot à 11, 8 ou 5, rugby à XV ou à 7.", only: "formule gratuite ; en PRO, c'est le format de l'équipe" },
      ],
      proTip: "Le demi-terrain associé au format smartphone donne des images parfaites pour expliquer un coup de pied arrêté.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-display-tools",
      category: "Barre d'Outils • Affichage",
      icon: <Info className="h-5 w-5 text-cyan-400" />,
      title: "Affichage des Éléments",
      description: "Montrez uniquement ce qui sert votre explication.",
      keyPoints: [],
      buttons: [
        { key: "ball", icon: <span className="text-sm leading-none" aria-hidden="true">⚽</span>, name: "Ballon", text: "Affiche ou masque le ballon de votre sport, à glisser sur le terrain." },
        { key: "lanes", icon: <LanesIcon />, name: "5 couloirs", text: "Trace les 5 couloirs dans la longueur : largeur, demi-espaces et axe." },
        { key: "thirds", icon: <ThirdsIcon />, name: "3 zones", text: "Découpe le terrain en zones de défense, de milieu et d'attaque." },
        { key: "wall", icon: <BrickWall className={ic} />, name: "Mur (coup franc)", text: "Place un mur : choisissez son nombre de joueurs et l'équipe qui le forme." },
        { key: "opponents", icon: <Users className={ic} />, name: "Adversaires", text: "Affiche ou masque l'équipe adverse (bouton rouge quand elle est visible)." },
        { key: "names", icon: <Hash className={ic} />, name: "Noms des joueurs", text: "Masque ou affiche les noms sous les joueurs (bouton orange quand ils sont masqués)." },
        { key: "roles", icon: <Tag className={ic} />, name: "Rôles des joueurs", text: "Masque ou affiche les badges capitaine et tireurs de coups de pied arrêtés (orange quand masqués)." },
        { key: "panels", icon: <Columns className={ic} />, name: "Panneaux d'équipe", text: "Replie ou déplie les panneaux Mon Équipe et Mon Adversaire pour agrandir le terrain." },
        { key: "dot", icon: <Circle className={ic} />, name: "Joueurs en pastille", text: "Rond de couleur avec le numéro : la vue la plus lisible." },
        { key: "jersey", icon: <Shirt className={ic} />, name: "Joueurs en buste", text: "Maillot aux couleurs de l'équipe avec le numéro." },
        { key: "head", icon: <User className={ic} />, name: "Joueurs en tête", text: "Visage de chaque joueur, avec sa photo quand vous l'avez ajoutée." },
      ],
      proTip: "Masquez les noms pour un affichage épuré en séance vidéo, ou les adversaires pour vous concentrer sur votre organisation.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-drawing-tools",
      category: "Barre d'Outils • Tracés",
      icon: <PenTool className="h-5 w-5 text-blue-400" />,
      title: "Les Outils de Tracé",
      description: "Choisissez un outil, puis glissez sur le terrain pour dessiner. L'outil reste actif jusqu'à ce que vous en choisissiez un autre.",
      keyPoints: [],
      buttons: [
        { key: "select", icon: <MousePointer className={ic} />, name: "Sélecteur", text: "Outil par défaut : déplacez joueurs et ballon. Cliquez sur un tracé pour le supprimer ou annuler." },
        { key: "move", icon: <Move className={ic} />, name: "Déplacer", text: "Quand le terrain est zoomé, faites-le glisser pour voir une autre partie." },
        { key: "line", icon: <LineIcon />, name: "Ligne", text: "Ligne droite pleine ; recliquez sur le bouton pour passer en pointillé (marquage, ligne défensive)." },
        { key: "link", icon: <PlayerLinkIcon className={ic} />, name: "Lier des joueurs", text: "Touchez les joueurs un à un : la ligne qui les relie les suit quand ils bougent (bloc, chaîne de passes)." },
        { key: "arrow", icon: <ArrowUpRight className={ic} />, name: "Flèche de course", text: "Glissez du point de départ à l'arrivée pour montrer un déplacement ou une passe." },
        { key: "curve", icon: <CurveArrowIcon className={ic} />, name: "Courbe fléchée", text: "Tracez, puis déplacez ses poignées pour la cintrer (appel, centre brossé). Recliquez pour le pointillé." },
        { key: "zone", icon: <Scan className={ic} />, name: "Zone", text: "Rectangle pour délimiter un espace à occuper ou à presser." },
        { key: "draw", icon: <Pencil className={ic} />, name: "Dessin libre", text: "Tracé à main levée, comme au feutre sur un tableau." },
        { key: "clear", icon: <Trash2 className={`${ic} text-rose-400`} />, name: "Tout effacer", text: "Supprime tous les tracés d'un coup (grisé quand il n'y en a aucun)." },
      ],
      proTip: "Ctrl + Z (Cmd + Z sur Mac) annule le dernier tracé. Revenez au Sélecteur pour déplacer à nouveau vos joueurs.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-color-tools",
      category: "Barre d'Outils • Couleurs",
      icon: <Palette className="h-5 w-5 text-blue-400" />,
      title: "Couleur du Trait",
      description: "Cinq pastilles de couleur : celle choisie est entourée et s'applique aux prochains tracés.",
      keyPoints: [
        "Vert, rouge, bleu, noir ou jaune",
        "Exemple : vert pour les courses, jaune pour les passes, rouge pour le pressing",
        "Épaisseur du trait : réglable dans la barre du mode Plein écran"
      ],
      proTip: "Gardez le même code couleur d'une séance à l'autre : vos joueurs le liront d'un coup d'œil.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-export-actions",
      category: "Barre d'Outils • Export",
      icon: <Download className="h-5 w-5 text-[#00E599]" />,
      title: "Export HD & Vue Carte 3D",
      description: "Votre plan de jeu est prêt ? Diffusez-le à vos joueurs et à votre staff.",
      keyPoints: [],
      buttons: [
        { key: "export", icon: <Download className={`${ic} text-amber-500`} />, name: "Export PNG HD", text: "Bouton jaune : enregistre une image nette du terrain, des joueurs et des tracés." },
        { key: "card3d", icon: <Sparkles className={`${ic} text-amber-500`} />, name: "Vue Carte 3D", text: "Présente votre équipe en cartes de joueurs ou en têtes, paysage ou portrait." },
      ],
      proTip: "Un schéma enregistré se partage aussi en image, GIF ou vidéo, par WhatsApp ou e-mail (PRO), depuis le panneau de droite.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-zoom-tools",
      category: "Barre d'Outils • Zoom",
      icon: <ZoomIn className="h-5 w-5 text-cyan-400" />,
      title: "Zoom du Terrain & Taille des Joueurs",
      description: "Deux réglages indépendants, avec – et + de part et d'autre du pourcentage.",
      keyPoints: [],
      buttons: [
        { key: "pitchZoom", icon: <ZoomIn className={ic} />, name: "Échelle du terrain", text: "De 70 % à 150 % par pas de 10. Cliquez sur le pourcentage pour revenir à 100 % et recentrer." },
        { key: "playerZoom", icon: <User className={ic} />, name: "Taille des joueurs", text: "De 20 % à 130 % : réduisez-la en football à 11 ou sur petit écran pour garder de la place aux tracés." },
      ],
      proTip: "Terrain zoomé : prenez l'outil Déplacer pour vous promener sur le terrain.",
      preferredPlacement: "bottom"
    },
    {
      targetId: "tour-animation-tool",
      category: "Barre d'Outils • Animation",
      icon: <Play className="h-5 w-5 text-amber-400" />,
      title: "Créateur d'Animation",
      description: "Animez une action étape par étape, comme un dessin animé de votre combinaison.",
      keyPoints: [
        "Étape 1 : placez joueurs et ballon en position de départ",
        "Nouvelle étape (+) : déplacez les joueurs vers leur position suivante, et ainsi de suite",
        "Lecture ▶ / Pause et vitesse de 0,5 à 2 secondes par étape",
        "Enregistrez l'animation dans vos schémas, puis partagez-la en GIF ou en vidéo (PRO)"
      ],
      buttons: [
        { key: "animation", icon: <Video className={ic} />, name: "Animation", text: "Ouvre ou ferme, sous la barre, les commandes d'animation. Désactivé pendant le Mode Live Match." },
      ],
      proTip: "Gardez le Sélecteur actif pendant l'animation pour déplacer les joueurs d'une étape à l'autre.",
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
      proTip: "Bravo Coach ! En Live, double-cliquez sur un joueur puis utilisez B (but), P (passe), J (jaune) ou R (rouge). Le détail de chaque fonction est dans le Guide d'Utilisation, depuis votre profil.",
      preferredPlacement: "left"
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
      setPresentButtons(new Set(Array.from(document.querySelectorAll<HTMLElement>("[data-tour-btn]"), (el) => el.dataset.tourBtn ?? "")));
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
    // Groupe de la barre d'outils caché par le défilement horizontal : on le ramène dans la vue
    document.getElementById(current.targetId)?.scrollIntoView({ block: "nearest", inline: "nearest" });

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
  }, [isOpen, currentStep, current.targetId, updateTargetRect]);

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
  const visibleButtons = (current.buttons ?? []).filter((b) => !presentButtons || presentButtons.has(b.key));

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
          data-testid="tour-highlight"
          data-target={current.targetId}
          className="border-2 border-[#00E599] shadow-[0_0_35px_rgba(0,229,153,0.55)] transition-all duration-300 ease-out animate-pulse"
        >
          {/* Target Corner Accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00E599]" />
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00E599]" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00E599]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00E599]" />
        </div>
      )}

      {/* 2b. BOUTON REPÉRÉ DEPUIS SA FICHE */}
      {spotButton && spotButton.step === currentStep && (
        <div
          data-testid="tour-button-spot"
          data-button={spotButton.key}
          style={{
            position: "fixed",
            top: spotButton.rect.top - 4,
            left: spotButton.rect.left - 4,
            width: spotButton.rect.width + 8,
            height: spotButton.rect.height + 8,
            zIndex: 46,
            pointerEvents: "none",
          }}
          className="rounded-lg border-2 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.75)]"
        />
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
        <div className="p-4 space-y-3 text-xs overflow-y-auto max-h-[45vh] sm:max-h-[min(55vh,480px)]">
          <p className={`leading-relaxed font-medium ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
            {current.description}
          </p>

          {/* Fiche de chaque bouton : survol ou toucher = bouton repéré sur la barre */}
          {visibleButtons.length > 0 && (
            <ul
              aria-label="Boutons de ce groupe"
              className={`p-1.5 rounded-xl border space-y-0.5 ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e1524] border-[#1c293e]"}`}
            >
              {visibleButtons.map((b) => {
                const isSpot = spotButton?.step === currentStep && spotButton.key === b.key;
                return (
                  <li key={b.key}>
                    <button
                      type="button"
                      data-tour-row={b.key}
                      onMouseEnter={() => spotOn(b.key)}
                      onMouseLeave={spotOff}
                      onFocus={() => spotOn(b.key)}
                      onBlur={spotOff}
                      onClick={() => spotOn(b.key)}
                      className={`w-full flex items-start gap-2.5 text-left px-1.5 py-1 rounded-lg transition cursor-pointer ${
                        isSpot
                          ? isModernSleek ? "bg-amber-50" : "bg-amber-400/10"
                          : isModernSleek ? "hover:bg-slate-100" : "hover:bg-[#142036]"
                      }`}
                    >
                      <span className={`mt-0.5 h-7 w-7 shrink-0 rounded-md border flex items-center justify-center ${
                        isModernSleek ? "bg-white border-slate-300 text-slate-700" : "bg-[#0c1017] border-[#1e293b] text-slate-200"
                      }`}>
                        {b.icon}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[11px] font-black leading-tight ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                          {b.name}
                          {b.only && <span className={`ml-1 font-semibold text-[9.5px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>({b.only})</span>}
                        </span>
                        <span className={`block text-[10.5px] leading-snug ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>{b.text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Couleurs du trait : mêmes pastilles que sur la barre */}
          {current.targetId === "tour-color-tools" && (
            <div className="flex items-center gap-2 px-1" aria-hidden="true">
              {STROKE_COLORS.map((c) => (
                <span key={c} className="h-5 w-5 rounded-full border border-black/20" style={{ backgroundColor: c }} />
              ))}
            </div>
          )}

          {/* Key Points list */}
          {current.keyPoints.length > 0 && (
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
          )}

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
        <div className={`px-4 py-3 border-t flex flex-col items-stretch gap-2.5 ${
          isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#101726] border-[#1b273d]"
        }`}>

          {/* Step dots & dont show again */}
          <div className="flex items-center gap-3 w-full justify-between">
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
          <div className="flex items-center gap-2 w-full justify-end">
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
