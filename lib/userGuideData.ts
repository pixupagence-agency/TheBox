export interface GuideSectionContentBlock {
  subtitle?: string;
  paragraphs: string[];
  bullets?: string[];
  tip?: string;
}

export interface GuideSectionItem {
  id: string;
  number: string;
  title: string;
  iconName?: string;
  summary: string;
  badge?: string;
  videoUrl?: string;
  content: GuideSectionContentBlock[];
}

export const GUIDE_STORAGE_KEY = "thebox_guide_sections";
export const GUIDE_UPDATED_EVENT = "thebox_guide_updated";

export const DEFAULT_GUIDE_SECTIONS: GuideSectionItem[] = [
  {
    id: "section-1",
    number: "01",
    title: "Vue d'ensemble & Prise en main",
    iconName: "compass",
    summary: "Découverte de l'interface, du profil coach et de la navigation.",
    badge: "Essentiel",
    videoUrl: "/images/guide/parcours-coach-tactique.webp",
    content: [
      {
        subtitle: "1.1 Inscription & Connexion Coach",
        paragraphs: [
          "TheBox est un tableau blanc tactique 2D de référence conçu pour les entraîneurs, préparateurs et éducateurs sportifs. Il vous permet de modéliser vos séances, préparer vos matchs et transmettre vos plans de jeu avec clarté.",
          "Pour accéder au tableau tactique, deux possibilités s'offrent à vous depuis la page d'accueil :",
          "1. Création d'un Compte Coach : Cliquez sur le bouton vert « Créer un Compte Coach » pour ouvrir le formulaire rapide.",
          "2. Connexion rapide : Connectez-vous avec votre adresse Google ou vos identifiants e-mail existants."
        ],
        bullets: [
          "Prénom & Nom : Personnalisez votre profil d'entraîneur.",
          "Club / Structure : Indiquez le nom officiel de votre club (ex: FC TheBox).",
          "Sport Principal : Le Football est disponible immédiatement par défaut en configuration officielle (11v11, 8v8, 5v5).",
          "Période d'essai offerte : Tout nouveau compte bénéficie automatiquement d'une période d'essai pour tester l'ensemble des fonctionnalités avancées."
        ],
        tip: "L'inscription rapide prend moins de 30 secondes et active instantanément l'ensemble de votre tableau tactique."
      },
      {
        subtitle: "1.2 La Barre Supérieure (Header & Navigation)",
        paragraphs: [
          "Une fois connecté au tableau tactique, la barre supérieure concentre les commandes essentielles de pilotage et d'accès rapide :"
        ],
        bullets: [
          "Identité Coach & Menu Utilisateur : Affiche votre nom, votre statut (Coach Principal) et le blason de votre club. En cliquant dessus, vous ouvrez le Menu Utilisateur qui donne accès au Guide d'Utilisation, au profil coach, au tutoriel interactif, au changement de thème et de langue.",
          "Sport Actif : Badge indiquant la discipline active (Football 11).",
          "Statut d'Abonnement : Indique votre formule en cours (Essai gratuit, Formule PRO ou PRO+). Un compte à rebours vous informe des jours restants.",
          "🎓 Tuto Coach : Bouton interactif permettant de relancer à tout moment le tutoriel guidé en 6 étapes sur le terrain.",
          "Langue & Aide : Bascule rapide entre Français (FR) et Anglais (EN), et accès direct à la FAQ et au support."
        ],
        tip: "Accès au Guide Utilisateur dans l'application : Cliquez sur votre Profil Coach (en haut à droite de l'écran) pour dérouler le Menu Utilisateur. Vous y trouverez l'entrée « Guide d'Utilisation » pour consulter à tout moment l'aide détaillée sans quitter votre tableau tactique."
      },
      {
        subtitle: "1.3 Installation sur Mobile & Tablette (PWA)",
        paragraphs: [
          "TheBox est une Progressive Web App (PWA) entièrement optimisée pour le bord du terrain, les bancs de touche et les causeries de vestiaire :",
          "L'application s'ouvre alors en mode plein écran sans barre d'adresse de navigateur, prête pour vos séances et vos matchs."
        ],
        bullets: [
          "Sur iPad / iPhone (Safari) : Appuyez sur l'icône de partage ⎋ puis sur « Sur l'écran d'accueil ».",
          "Sur Android (Chrome) : Appuyez sur le menu (⋮) puis sur « Installer l'application ».",
          "Sur PC / Mac (Chrome / Edge) : Cliquez sur le bouton « Installer l'application » disponible directement dans la barre d'outils."
        ],
        tip: "Une fois installée sur votre écran d'accueil, TheBox démarre instantanément en plein écran et reste ultra fluide même avec un réseau faible au bord du terrain."
      }
    ]
  },
  {
    id: "section-2",
    number: "02",
    title: "Le Terrain Tactique & Pions Joueurs",
    iconName: "layers",
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
    iconName: "pentool",
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
    iconName: "award",
    summary: "Désignation des spécialistes pour les phases arrêtées décisives.",
    badge: "CPA",
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
    iconName: "sliders",
    summary: "Terrain complet, demi-terrain et adaptation aux écrans de vestiaire.",
    badge: "Vue",
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
    iconName: "play",
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
    iconName: "users",
    summary: "Compositions, bloc-notes et enregistreur vocal d'avant-match.",
    badge: "Effectif",
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
    iconName: "timer",
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
    iconName: "cloud",
    summary: "Persistance sécurisée Firebase et organisation par thématiques de séance.",
    badge: "Cloud",
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
    iconName: "download",
    summary: "Export PNG haute résolution, diffusion WhatsApp et envoi par email.",
    badge: "Partage",
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
    iconName: "keyboard",
    summary: "Les raccourcis pour manipuler le tableau blanc à la vitesse de l'éclair.",
    badge: "Astuces",
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

/**
 * Load user guide sections from localStorage or fallback to defaults
 */
export function loadGuideSections(): GuideSectionItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_GUIDE_SECTIONS;
  }
  try {
    const raw = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!raw) return DEFAULT_GUIDE_SECTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Auto-migrate section-1 if it is still using the single-block legacy draft
      const sec1Index = parsed.findIndex((s: GuideSectionItem) => s.id === "section-1");
      if (sec1Index !== -1 && (!parsed[sec1Index].content || parsed[sec1Index].content.length < 3)) {
        parsed[sec1Index] = {
          ...parsed[sec1Index],
          summary: DEFAULT_GUIDE_SECTIONS[0].summary,
          videoUrl: parsed[sec1Index].videoUrl || DEFAULT_GUIDE_SECTIONS[0].videoUrl,
          content: DEFAULT_GUIDE_SECTIONS[0].content
        };
        try {
          localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(parsed));
        } catch {
          // ignore storage quota errors
        }
      }
      return parsed;
    }
  } catch (err) {
    console.error("Failed to load guide sections from localStorage:", err);
  }
  return DEFAULT_GUIDE_SECTIONS;
}

/**
 * Save user guide sections to localStorage and notify listeners
 */
export function saveGuideSections(sections: GuideSectionItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(sections));
    window.dispatchEvent(new CustomEvent(GUIDE_UPDATED_EVENT, { detail: sections }));
  } catch (err) {
    console.error("Failed to save guide sections to localStorage:", err);
  }
}

/**
 * Reset user guide sections to official defaults
 */
export function resetGuideSections(): GuideSectionItem[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(GUIDE_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(GUIDE_UPDATED_EVENT, { detail: DEFAULT_GUIDE_SECTIONS }));
    } catch (err) {
      console.error("Failed to reset guide sections:", err);
    }
  }
  return DEFAULT_GUIDE_SECTIONS;
}

/**
 * Analyze media type from URL
 */
export function getMediaType(url?: string): "youtube" | "vimeo" | "video" | "image" | "none" {
  if (!url || typeof url !== "string" || !url.trim()) return "none";
  const trimmed = url.trim();

  // YouTube
  if (
    trimmed.includes("youtube.com/watch") ||
    trimmed.includes("youtu.be/") ||
    trimmed.includes("youtube.com/embed/")
  ) {
    return "youtube";
  }

  // Vimeo
  if (trimmed.includes("vimeo.com/")) {
    return "vimeo";
  }

  // HTML5 Video (mp4, webm, ogg, mov, blob or data:video)
  if (
    trimmed.startsWith("data:video/") ||
    trimmed.startsWith("blob:") ||
    trimmed.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
  ) {
    return "video";
  }

  // Otherwise assume image / animated webp / gif
  return "image";
}

/**
 * Get embeddable URL for YouTube or Vimeo
 */
export function getEmbedUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // YouTube: handle watch?v=ID or youtu.be/ID
  if (trimmed.includes("youtu.be/")) {
    const id = trimmed.split("youtu.be/")[1]?.split(/[?&]/)[0];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&rel=0`;
  }
  if (trimmed.includes("youtube.com/watch")) {
    const urlObj = new URL(trimmed);
    const id = urlObj.searchParams.get("v");
    if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0&rel=0`;
  }
  if (trimmed.includes("youtube.com/embed/")) {
    return trimmed;
  }

  // Vimeo: handle vimeo.com/ID
  if (trimmed.includes("vimeo.com/")) {
    const parts = trimmed.split("vimeo.com/");
    const id = parts[1]?.split(/[?&/]/)[0];
    if (id) return `https://player.vimeo.com/video/${id}`;
  }

  return trimmed;
}
