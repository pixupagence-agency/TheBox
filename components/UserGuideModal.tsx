"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
  PenTool,
  Award,
  Sliders,
  Play,
  Users,
  Timer,
  Cloud,
  Download,
  Keyboard,
  Compass,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import LogoIcon from "./LogoIcon";

export interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isModernSleek?: boolean;
}

interface GuideSectionItem {
  id: string;
  number: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  badge?: string;
  videoUrl?: string;
  content: {
    subtitle?: string;
    paragraphs: string[];
    bullets?: string[];
    tip?: string;
  }[];
}

const GUIDE_SECTIONS: GuideSectionItem[] = [
  {
    id: "section-1",
    number: "01",
    title: "Vue d'ensemble & Prise en main",
    icon: <Compass className="w-4 h-4 text-[#00E599]" />,
    summary: "Découverte de l'interface, du profil coach et de la navigation.",
    badge: "Essentiel",
    videoUrl: "/images/guide/parcours-coach-tactique.webp",
    content: [
      {
        subtitle: "Accès au tableau tactique",
        paragraphs: [
          "TheBox est un tableau blanc tactique 2D conçu pour les entraîneurs, préparateurs et éducateurs sportifs.",
          "Votre profil coach est accessible à tout moment en haut à droite. C'est ici que vous retrouvez vos réglages, la sélection de langue (FR/EN) et le changement de thème."
        ],
        bullets: [
          "Identifiant & Club : Affiche votre nom de coach et la structure sportive.",
          "Tuto Coach interactif : Pour réactiver la visite guidée en 6 étapes.",
          "Installation PWA : Possibilité d'installer TheBox en plein écran sur tablette ou smartphone."
        ],
        tip: "L'accès au présent Guide Utilisateur se fait directement depuis le menu utilisateur en haut à droite."
      }
    ]
  },
  {
    id: "section-2",
    number: "02",
    title: "Le Terrain Tactique & Pions Joueurs",
    icon: <Layers className="w-4 h-4 text-emerald-400" />,
    summary: "Manipulation des joueurs sur la pelouse, personnalisation et rôles.",
    badge: "Terrain",
    videoUrl: "/images/guide/capture-terrain-et-outils.webp",
    content: [
      {
        subtitle: "Positionnement & Glisser-déposer",
        paragraphs: [
          "Déplacez librement vos 11 titulaires et les adversaires par simple glisser-déposer sur le terrain officiel de Football.",
          "Le ballon est également déplaçable à volonté pour situer les actions clés."
        ],
        bullets: [
          "Équipe A (Domicile) : Vos joueurs titulaires et remplaçants.",
          "Équipe B (Adversaires) : Pions dédiés pour simuler le bloc ou le pressing adverse.",
          "Double-clic joueur : Ouvrez la fiche individuelle pour modifier son nom, numéro, poste ou photo.",
          "États de forme : Gérez les statuts (En forme, Fatigué, Blessé, Cartons 🟨 / 🟥)."
        ]
      }
    ]
  },
  {
    id: "section-3",
    number: "03",
    title: "Boîte à Outils & Tracés Tactiques",
    icon: <PenTool className="w-4 h-4 text-cyan-400" />,
    summary: "Flèches de course, passes, dessin libre et zones géométriques.",
    badge: "Dessin",
    videoUrl: "/images/guide/capture-terrain-et-outils.webp",
    content: [
      {
        subtitle: "Les instruments de schématisation",
        paragraphs: [
          "La barre latérale gauche rassemble l'ensemble des tracés conventionnels pour expliquer vos consignes à l'équipe."
        ],
        bullets: [
          "Flèche de course (↗️) : Déplacement sans ballon, appel en profondeur, dédoublement.",
          "Flèche de passe (➔ pointillés) : Transmission au sol ou passe lobée.",
          "Course incurvée (⤴️) : Appel courbé pour déjouer le piège du hors-jeu.",
          "Dessin libre (✏️) : Annotations spontanées et tracés à main levée.",
          "Formes (⭕ / ⬛) : Cadrage du porteur, zones de surnombre ou de pressing.",
          "Gomme & RAZ : Effacez un tracé précis ou remettez à zéro la pelouse en 1 clic."
        ],
        tip: "Utilisez le raccourci Ctrl + Z pour annuler instantanément votre dernier tracé sans toucher aux joueurs."
      }
    ]
  },
  {
    id: "section-4",
    number: "04",
    title: "Coups de Pied Arrêtés (CPA) & Rôles Spécifiques",
    icon: <Award className="w-4 h-4 text-amber-400" />,
    summary: "Désignation des spécialistes pour les phases arrêtées décisives.",
    videoUrl: "/images/guide/capture-terrain-et-outils.webp",
    content: [
      {
        subtitle: "Attribution des tireurs",
        paragraphs: [
          "Attribuez clairement les responsabilités avant le coup d'envoi pour éviter toute hésitation sur le terrain."
        ],
        bullets: [
          "👑 Capitaine d'équipe",
          "⚽ Tireur de Penalty officiel (11 mètres)",
          "⚡ Coup Franc Direct (axe des 20-25m)",
          "↪️ / ↩️ Coups Francs Excentrés Gauche & Droit",
          "🚩 Corners Gauche & Droit"
        ],
        tip: "Ces rôles sont automatiquement répercutés dans la fiche de match et lors de l'export de votre causerie."
      }
    ]
  },
  {
    id: "section-5",
    number: "05",
    title: "Contrôle de Vue, Zoom & Formats",
    icon: <Sliders className="w-4 h-4 text-sky-400" />,
    summary: "Terrain complet, demi-terrain et adaptation aux écrans de vestiaire.",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Adapter la vue tactique",
        paragraphs: [
          "Basculez entre le terrain complet et la vue demi-terrain (Half-pitch) pour zoomer sur les phases offensives ou défensives.",
          "Ajustez la taille des joueurs et l'échelle du terrain selon votre appareil."
        ],
        bullets: [
          "Mode Demi-terrain : Idéal pour travailler les sorties de balle ou les combinaisons de surface.",
          "Mode Plein écran (⛶) : Supprime les barres de menus pour vos projections de vestiaire.",
          "Bascule portrait / paysage : Adapté aux smartphones et tablettes."
        ]
      }
    ]
  },
  {
    id: "section-6",
    number: "06",
    title: "Animation & Séquençage de Jeu",
    icon: <Play className="w-4 h-4 text-violet-400" />,
    summary: "Création d'animations fluides étape par étape pour décortiquer une action.",
    badge: "Vidéo",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Animer vos combinaisons",
        paragraphs: [
          "Créez des animations multi-étapes pour montrer la trajectoire exacte du ballon et des joueurs."
        ],
        bullets: [
          "Étape 1 : Placez les joueurs dans leur disposition initiale.",
          "Étape 2 (+) : Déplacez les joueurs vers leur point de chute.",
          "Lecture (▶ Play) : Visualisez le mouvement synchronisé en temps réel.",
          "Vitesse réglable : Ralentissez la vitesse pour commenter le timing des courses."
        ]
      }
    ]
  },
  {
    id: "section-7",
    number: "07",
    title: "Gestion de l'Effectif & Causerie Vocale",
    icon: <Users className="w-4 h-4 text-rose-400" />,
    summary: "Compositions, bloc-notes et enregistreur vocal d'avant-match.",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Préparation d'avant-match",
        paragraphs: [
          "Le panneau latéral droit est votre carnet de préparation officiel :",
          "Consignez la liste des 11 titulaires et des remplaçants pour chaque rencontre."
        ],
        bullets: [
          "🎙️ Enregistreur vocal de causerie : Enregistrez vos consignes orales directement rattachées au schéma.",
          "📝 Bloc-notes tactique : Notez les points faibles de l'adversaire et les déclencheurs de pressing.",
          "Remplaçants : Préparez les options tactiques du banc de touche."
        ]
      }
    ]
  },
  {
    id: "section-8",
    number: "08",
    title: "Mode Live Match & Banc Connecté",
    icon: <Timer className="w-4 h-4 text-rose-500" />,
    summary: "Chronomètre officiel, saisie du score, événements et changements en direct.",
    badge: "PRO+",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Le banc de touche connecté",
        paragraphs: [
          "Le Mode Live Match transforme votre écran en console de bord du terrain pour suivre la rencontre en direct."
        ],
        bullets: [
          "⏱️ Chronomètre officiel : Start / Pause / Reset et périodes (1MT, PAUSE, 2MT, FIN).",
          "📊 Tableau d'affichage : Saisie en direct du score (Domicile vs Extérieur).",
          "⚽ Buts & Passes : Attribution du buteur et du passeur décisif.",
          "🟨 / 🟥 Cartons & Discipline : Avertissements et expulsions avec impact visuel sur le terrain.",
          "🔄 Remplacements : Horodatage automatique de la minute du match (sortant / entrant).",
          "🏁 Terminer le match : Clôture officielle et sauvegarde des statistiques."
        ]
      }
    ]
  },
  {
    id: "section-9",
    number: "09",
    title: "Sauvegarde Cloud & Bibliothèque",
    icon: <Cloud className="w-4 h-4 text-blue-400" />,
    summary: "Persistance sécurisée Firebase et organisation par thématiques de séance.",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Conserver vos créations tactiques",
        paragraphs: [
          "Toutes vos stratégies sont sauvegardées sur votre compte cloud sécurisé.",
          "Classez vos schémas dans la Bibliothèque de Stratégies par catégories (Attaque, Défense, CPA, Entraînements) pour les charger en un clic."
        ]
      }
    ]
  },
  {
    id: "section-10",
    number: "10",
    title: "Export Haute Définition & Partage",
    icon: <Download className="w-4 h-4 text-[#00E599]" />,
    summary: "Export PNG haute résolution, diffusion WhatsApp et envoi par email.",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Diffuser vos plans de jeu",
        paragraphs: [
          "Exportez vos schémas en image nette et soignée pour vos joueurs et votre staff technique."
        ],
        bullets: [
          "Export PNG HD : Image nette du terrain avec les tracés et le logo du club.",
          "Partage WhatsApp / Messagerie : Diffusion directe dans le groupe de discussion de l'équipe.",
          "Envoi d'email automatique : Transmission instantanée sur la boîte mail des joueurs."
        ]
      }
    ]
  },
  {
    id: "section-11",
    number: "11",
    title: "Raccourcis Clavier & Astuces Pro",
    icon: <Keyboard className="w-4 h-4 text-amber-300" />,
    summary: "Les raccourcis pour manipuler le tableau blanc à la vitesse de l'éclair.",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Raccourcis clavier indispensables",
        paragraphs: [
          "Gagnez un temps précieux lors de vos séances d'analyse tactique :"
        ],
        bullets: [
          "Ctrl + Z : Annuler le dernier tracé.",
          "Ctrl + Y : Rétablir le dernier tracé.",
          "F : Basculer en mode Plein Écran vestiaire.",
          "Échap (Escape) : Désélectionner l'outil de dessin actif.",
          "Touche B : Ajouter un but en mode Live.",
          "Touche P : Ajouter une passe décisive en mode Live.",
          "Touche J : Attribuer un carton jaune en mode Live.",
          "Touche R : Attribuer un carton rouge en mode Live."
        ]
      }
    ]
  }
];

export default function UserGuideModal({
  isOpen,
  onClose,
  isModernSleek = false
}: UserGuideModalProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("section-1");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredSections = GUIDE_SECTIONS.filter((sec) => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = sec.title.toLowerCase().includes(query);
    const matchesSummary = sec.summary.toLowerCase().includes(query);
    const matchesContent = sec.content.some((c) =>
      c.paragraphs.some((p) => p.toLowerCase().includes(query)) ||
      (c.bullets && c.bullets.some((b) => b.toLowerCase().includes(query)))
    );
    return matchesTitle || matchesSummary || matchesContent;
  });

  const activeSection = GUIDE_SECTIONS.find((s) => s.id === selectedSectionId) || GUIDE_SECTIONS[0];

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div
        className={`w-full max-w-5xl h-[88vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${
          isModernSleek
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-[#0b0e14] border-[#1e293b] text-white"
        }`}
      >
        {/* HEADER */}
        <div
          className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isModernSleek
              ? "bg-slate-100 border-slate-200 text-slate-900"
              : "bg-[#0f141d] border-[#1f293d] text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isModernSleek
                  ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                  : "bg-gradient-to-br from-[#00E599]/20 to-cyan-500/20 border-[#00E599]/40 text-[#00E599]"
              }`}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  Guide d&apos;Utilisation Officiel
                </h2>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    isModernSleek
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                      : "bg-[#00E599]/15 border-[#00E599]/40 text-[#00E599]"
                  }`}
                >
                  THE BOX
                </span>
              </div>
              <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                Toutes les grandes fonctionnalités expliquées pour les entraîneurs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isModernSleek
                ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200"
                : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
            }`}
            title="Fermer le guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH BAR & SUMMARY STRIP */}
        <div
          className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e131d] border-[#1b2436]"
          }`}
        >
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une fonction (ex: pressing, chrono, CPA, export)..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none transition ${
                isModernSleek
                  ? "bg-white border-slate-300 text-slate-900 focus:border-emerald-600"
                  : "bg-[#07090e] border-[#1f293d] text-white focus:border-[#00E599]"
              }`}
            />
          </div>
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <span>Accès rapide :</span>
            <span className="text-[#00E599] font-black">Menu Utilisateur</span>
          </div>
        </div>

        {/* BODY SPLIT (LEFT MENU / RIGHT CONTENT) */}
        <div className="flex-1 flex overflow-hidden">
          {/* NAVIGATION SIDEBAR */}
          <div
            className={`w-72 sm:w-80 border-r overflow-y-auto shrink-0 p-3 space-y-1 scrollbar-thin ${
              isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1b2436]"
            }`}
          >
            {filteredSections.map((sec) => {
              const isSelected = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between border ${
                    isSelected
                      ? isModernSleek
                        ? "bg-white border-emerald-500 shadow-sm text-slate-900"
                        : "bg-[#141b29] border-[#00E599] text-white shadow-md shadow-[#00E599]/10"
                      : isModernSleek
                      ? "bg-transparent border-transparent text-slate-600 hover:bg-slate-200/60"
                      : "bg-transparent border-transparent text-slate-400 hover:bg-[#111827] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono font-black text-slate-500">
                      {sec.number}
                    </span>
                    <div className="p-1.5 rounded-lg bg-black/20 shrink-0">
                      {sec.icon}
                    </div>
                    <div className="truncate min-w-0">
                      <p className="text-xs font-bold truncate">{sec.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{sec.summary}</p>
                    </div>
                  </div>
                  {sec.badge && (
                    <span
                      className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ml-1 shrink-0 ${
                        sec.badge === "PRO+"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      }`}
                    >
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* MAIN CONTENT VIEWER */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 scrollbar-thin">
            {/* SECTION HEADER */}
            <div className="border-b pb-4 border-[#1f293d]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00E599] uppercase tracking-wider mb-1">
                <span>Section {activeSection.number}</span>
                {activeSection.badge && (
                  <span className="text-[9px] bg-[#00E599]/20 px-2 py-0.5 rounded-full border border-[#00E599]/40 font-black">
                    {activeSection.badge}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
                {activeSection.title}
              </h1>
              <p className={`text-xs sm:text-sm mt-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                {activeSection.summary}
              </p>
            </div>

            {/* DÉMONSTRATION VIDÉO EN DIRECT DE LA FONCTIONNALITÉ */}
            {activeSection.videoUrl && (
              <div
                className={`rounded-2xl overflow-hidden border p-3.5 shadow-xl ${
                  isModernSleek
                    ? "bg-slate-50 border-slate-200"
                    : "bg-[#080d15] border-[#1e293b]"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-[#00E599] uppercase tracking-wider">
                    <span>📹 Démonstration Vidéo en Direct</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                    Capture d&apos;écran animée
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden border border-black/40 bg-black/70 flex items-center justify-center max-h-80 shadow-inner">
                  <img
                    src={activeSection.videoUrl}
                    alt={`Démonstration vidéo : ${activeSection.title}`}
                    className="w-full h-auto max-h-80 object-contain"
                  />
                </div>
              </div>
            )}

            {/* SECTION CONTENT BLOCKS */}
            <div className="space-y-6">
              {activeSection.content.map((block, idx) => (
                <div key={idx} className="space-y-3">
                  {block.subtitle && (
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00E599]" />
                      <span>{block.subtitle}</span>
                    </h3>
                  )}

                  {block.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isModernSleek ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      {p}
                    </p>
                  ))}

                  {block.bullets && block.bullets.length > 0 && (
                    <ul className="space-y-2 pl-2">
                      {block.bullets.map((b, bIdx) => (
                        <li
                          key={bIdx}
                          className={`text-xs sm:text-sm flex items-start gap-2 ${
                            isModernSleek ? "text-slate-700" : "text-slate-300"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00E599] shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {block.tip && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        isModernSleek
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Astuce Pro :</strong> {block.tip}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between shrink-0 text-xs ${
            isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#0d121b] border-[#1b2436]"
          }`}
        >
          <span className="text-slate-500 font-bold">
            TheBox • Guide Utilisateur interactif
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#00E599] text-[#07090e] font-black hover:bg-[#05c482] transition cursor-pointer"
          >
            Compris, fermer
          </button>
        </div>
      </div>
    </div>
  );
}
