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

// Version du contenu par défaut : à incrémenter à chaque refonte du guide pour remplacer
// les anciennes copies enregistrées dans le navigateur.
export const GUIDE_CONTENT_VERSION = "2026-11-guide-v3";
const GUIDE_VERSION_KEY = "thebox_guide_version";

export const DEFAULT_GUIDE_SECTIONS: GuideSectionItem[] = [
  {
    id: "section-1",
    number: "01",
    title: "Prise en main & Compte Coach",
    iconName: "compass",
    summary: "Création du compte, connexion, barre supérieure et installation sur mobile.",
    badge: "Essentiel",
    videoUrl: "/images/guide/parcours-coach-tactique.webp",
    content: [
      {
        subtitle: "1.1 Créer son compte & se connecter",
        paragraphs: [
          "TheBox est un tableau tactique 2D pour les entraîneurs de football : préparez vos séances et vos matchs, gérez vos équipes et suivez vos rencontres en direct.",
          "Depuis la page d'accueil, cliquez sur « Créer un Compte » ou « Se Connecter »."
        ],
        bullets: [
          "Création de compte : prénom, nom, club, fonction, sport principal, adresse e-mail et mot de passe (6 caractères minimum).",
          "Connexion avec Google : un clic sur le bouton Google, sans mot de passe à retenir.",
          "Mot de passe oublié : dans la fenêtre de connexion, cliquez sur « Mot de passe oublié ? » pour recevoir un lien de réinitialisation par e-mail.",
          "E-mail de bienvenue : envoyé automatiquement à la création du compte.",
          "Essai offert : chaque nouveau compte dispose de 14 jours d'accès complet à la formule PRO+, sans carte bancaire."
        ],
        tip: "Votre compte est le même sur tous vos appareils : connectez-vous sur ordinateur, tablette ou smartphone pour retrouver vos équipes, matchs et schémas."
      },
      {
        subtitle: "1.2 La barre supérieure",
        paragraphs: [
          "Une fois connecté, la barre du haut donne accès à votre formule, à l'aide, au plein écran et à votre compte, de gauche à droite :"
        ],
        bullets: [
          "Badge de formule : Gratuite, Essai PRO+ (avec le compte à rebours des jours restants), PRO ou PRO+. Un clic ouvre les offres.",
          "🎓 Tuto Coach : relance la visite guidée de l'interface en 12 étapes, dont une fiche pour chaque bouton de la barre d'outils.",
          "Plein écran : le terrain occupe tout l'écran avec sa propre barre d'outils (voir « Affichage & Zoom »). Le même bouton, ou la touche Échap, permet d'en sortir.",
          "Panneau de droite : affiche ou masque le panneau des schémas, matchs et notes.",
          "Installer l'application : ajoute TheBox sur votre ordinateur ou votre écran d'accueil (affiché quand votre navigateur le permet).",
          "Votre profil (en haut à droite) : ouvre le menu utilisateur avec le Tutoriel, le Guide d'Utilisation, la FAQ, le contact du Support, la Configuration Profil & Sport et la Déconnexion."
        ],
        tip: "Configuration Profil & Sport : modifiez vos informations, la langue (français / anglais), le thème clair ou sombre, votre sport et votre abonnement."
      },
      {
        subtitle: "1.3 Installation sur mobile & tablette",
        paragraphs: [
          "TheBox s'installe comme une application, sans passer par un magasin d'applications. Elle s'ouvre ensuite en plein écran, sans barre d'adresse."
        ],
        bullets: [
          "iPad / iPhone (Safari) : bouton de partage ⎋ puis « Sur l'écran d'accueil ».",
          "Android (Chrome) : menu ⋮ puis « Installer l'application ».",
          "Ordinateur (Chrome / Edge) : bouton « Installer l'application » dans la barre supérieure."
        ]
      }
    ]
  },
  {
    id: "section-2",
    number: "02",
    title: "Mon Équipe, Mon Adversaire & Effectifs",
    iconName: "users",
    summary: "Formations, effectifs, gestion de plusieurs équipes et passerelle entre équipes.",
    badge: "Équipes",
    videoUrl: "/images/guide/capture-terrain-et-outils.webp",
    content: [
      {
        subtitle: "Les panneaux d'équipe",
        paragraphs: [
          "De part et d'autre du terrain, le panneau « Mon Équipe » (à gauche) et le panneau « Mon Adversaire » (à droite) pilotent chaque camp. Chaque panneau peut être réduit pour agrandir le terrain."
        ],
        bullets: [
          "SCHÉMA : appliquez une formation en un clic (ex. 4-3-3, 4-4-2, 4-2-3-1).",
          "Effectif : gérez les noms, numéros de maillot, postes et photos, les titulaires et les remplaçants.",
          "Rôles Tactiques : désignez capitaine et tireurs (voir la section « Rôles Tactiques »).",
          "Dans leur camp : regroupe les joueurs dans leur moitié de terrain.",
          "Effacer 🗑️ : retire les joueurs de ce camp du terrain.",
          "+ Adv (panneau adverse) : ajoute un joueur dans l'équipe adverse."
        ],
        tip: "La gestion de l'effectif et des rôles de l'adversaire est disponible avec les formules PRO et PRO+."
      },
      {
        subtitle: "Plusieurs équipes (PRO & PRO+)",
        paragraphs: [
          "En haut du panneau de droite, le sélecteur d'équipe permet de passer d'une équipe à l'autre (ex. Séniors, U17, Féminines) et d'en créer de nouvelles avec leur nom et leur catégorie. Chaque équipe a son propre effectif.",
          "La passerelle inter-équipes permet d'échanger un joueur entre deux de vos équipes."
        ]
      }
    ]
  },
  {
    id: "section-3",
    number: "03",
    title: "Le Terrain & les Joueurs",
    iconName: "layers",
    summary: "Déplacement des joueurs et du ballon, fiche joueur, remplacements et formats de jeu disponibles.",
    badge: "Terrain",
    videoUrl: "/images/guide/capture-terrain-et-outils.webp",
    content: [
      {
        subtitle: "Manipuler les joueurs",
        paragraphs: [
          "Le terrain s'adapte au format de jeu choisi (football à 5, 8 ou 11) avec ses dimensions et ses formations."
        ],
        bullets: [
          "Glisser-déposer : déplacez joueurs et ballon à la souris ou au doigt, avec l'outil Sélecteur actif (outil par défaut).",
          "Double-clic sur un joueur : ouvre sa fiche pour modifier son nom, son numéro, son poste ou sa photo.",
          "Clic droit (appui long sur écran tactile) : ouvre directement la fiche du joueur.",
          "État de forme : excellente forme, en forme, fatigué, blessé ou suspendu, affiché sur le joueur.",
          "Remplacement : faites entrer un remplaçant du banc à la place d'un joueur du terrain."
        ]
      }
    ]
  },
  {
    id: "section-4",
    number: "04",
    title: "Les Outils de Tracé",
    iconName: "pentool",
    summary: "Chaque bouton de tracé, la liaison entre joueurs, les couleurs, l'épaisseur et la suppression des tracés.",
    badge: "Dessin",
    videoUrl: "/images/guide/capture-terrain-et-outils.webp",
    content: [
      {
        subtitle: "4.1 La barre d'outils au-dessus du terrain",
        paragraphs: [
          "Tous les réglages tiennent sur une seule ligne au-dessus du terrain, rangés en groupes de gauche à droite : Vue, Affichage, Tracés, Couleurs, Export, Zoom, puis Animation tout à droite.",
          "Survolez un bouton pour afficher son nom. Un bouton encadré de couleur est actif : recliquez pour le désactiver."
        ],
        bullets: [
          "Écran étroit (tablette, smartphone) : la barre défile au doigt, à la molette, ou avec les flèches ‹ › qui apparaissent sur ses bords quand des outils sont masqués.",
          "Le Tuto Coach présente chaque bouton et le repère sur la barre : pratique pour une première prise en main."
        ]
      },
      {
        subtitle: "4.2 Les boutons de tracé",
        paragraphs: [
          "Choisissez un outil, puis glissez sur le terrain pour dessiner. L'outil reste actif jusqu'à ce que vous en choisissiez un autre. Les tracés se posent par-dessus le terrain, sans déplacer les joueurs."
        ],
        bullets: [
          "Sélecteur (flèche) : outil par défaut, pour déplacer joueurs et ballon. Cliquez sur un tracé pour le sélectionner : une barre apparaît pour le supprimer, annuler ou tout effacer.",
          "Déplacer (croix fléchée) : quand le terrain est zoomé, faites-le glisser pour en voir une autre partie.",
          "Ligne : ligne droite pleine ; recliquez sur le bouton pour passer en pointillé (et inversement). Idéal pour une ligne défensive ou un marquage.",
          "Lier des joueurs : voir « 4.3 Relier des joueurs ».",
          "Flèche de course : glissez du point de départ au point d'arrivée pour montrer un déplacement ou une passe.",
          "Courbe fléchée : tracez-la, puis déplacez ses poignées pour la cintrer (appel en courbe, centre brossé). Recliquez sur le bouton pour le pointillé.",
          "Zone : rectangle pour délimiter une zone de pressing, de surnombre ou de couverture.",
          "Dessin libre (crayon) : annotations à main levée, comme au feutre sur un tableau.",
          "Tout effacer (corbeille rouge) : supprime tous les tracés d'un coup ; grisée quand le terrain n'en a aucun."
        ],
        tip: "Ctrl + Z (Cmd + Z sur Mac) annule le dernier tracé. Pensez à revenir au Sélecteur pour déplacer à nouveau vos joueurs."
      },
      {
        subtitle: "4.3 Relier des joueurs",
        paragraphs: [
          "L'outil « Lier des joueurs » trace une ligne entre plusieurs joueurs. Contrairement à une ligne dessinée, elle suit les joueurs quand vous les déplacez, et pendant les animations."
        ],
        bullets: [
          "Touchez les joueurs à relier, un par un : une petite barre au-dessus du terrain vous guide.",
          "Choisissez la couleur de la liaison et son style (plein ou pointillé) dans cette barre.",
          "Pour terminer, touchez à nouveau le dernier joueur ou le terrain. À partir de 3 joueurs, touchez le premier pour fermer la forme (bloc, triangle de passes).",
          "Supprimer une liaison : avec le Sélecteur, cliquez sur la ligne puis sur le bouton de suppression."
        ]
      },
      {
        subtitle: "4.4 Couleur et épaisseur du trait",
        paragraphs: [
          "Les cinq pastilles du groupe Couleurs (vert, rouge, bleu, noir, jaune) règlent la couleur des prochains tracés ; la pastille choisie est entourée."
        ],
        bullets: [
          "Exemple de code couleur : vert pour les courses, jaune pour les passes, rouge pour le pressing.",
          "Épaisseur (fin, moyen, épais) : réglable dans la barre d'outils du mode Plein écran."
        ],
        tip: "Gardez le même code couleur d'une séance à l'autre : vos joueurs le liront d'un coup d'œil."
      }
    ]
  },
  {
    id: "section-5",
    number: "05",
    title: "Affichage & Zoom",
    iconName: "sliders",
    summary: "Chaque bouton des groupes Vue, Affichage et Zoom, et le mode plein écran.",
    badge: "Vue",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "5.1 Vue du terrain",
        paragraphs: [
          "Le premier groupe de la barre choisit la portion du terrain affichée et son orientation."
        ],
        bullets: [
          "Terrain complet : les deux moitiés, pour l'organisation générale et les transitions.",
          "Demi-terrain : agrandit une moitié, idéal pour les phases offensives, corners et coups francs.",
          "Format ordinateur (paysage) : pour un grand écran ou un vidéoprojecteur.",
          "Format smartphone (portrait) : pour un téléphone, ou un export lisible sur mobile.",
          "Format de jeu (formule Gratuite) : foot à 11, 8 ou 5. En PRO et PRO+, le format est celui de l'équipe, choisi à sa création."
        ]
      },
      {
        subtitle: "5.2 Affichage des éléments",
        paragraphs: [
          "Le groupe Affichage montre ou masque les éléments du terrain, dans l'ordre des boutons :"
        ],
        bullets: [
          "Ballon : affiche ou masque le ballon.",
          "5 couloirs : trace les couloirs dans la longueur du terrain (largeur, demi-espaces, axe).",
          "3 zones : découpe le terrain en zones de défense, de milieu et d'attaque.",
          "Mur (coup franc) : place et compose un mur (voir « Rôles Tactiques & Coups de Pied Arrêtés »).",
          "Adversaires : affiche ou masque l'équipe adverse (bouton rouge quand elle est visible).",
          "Noms (#) : masque les noms pour ne garder que les numéros (bouton orange quand ils sont masqués).",
          "Rôles (étiquette) : masque ou affiche les badges capitaine et tireurs (orange quand masqués).",
          "Panneaux d'équipe (colonnes) : replie ou déplie Mon Équipe et Mon Adversaire pour agrandir le terrain.",
          "Pastille, Buste ou Tête : représentation des joueurs, en rond numéroté, en maillot ou avec leur visage (photo quand vous l'avez ajoutée)."
        ],
        tip: "Masquez les noms pour un affichage épuré en séance vidéo, ou les adversaires pour vous concentrer sur votre organisation."
      },
      {
        subtitle: "5.3 Zoom du terrain et taille des joueurs",
        paragraphs: [
          "Le groupe Zoom, à droite de la barre, propose deux réglages indépendants avec – et + de part et d'autre du pourcentage."
        ],
        bullets: [
          "Échelle du terrain (loupe) : de 70 % à 150 %. Cliquez sur le pourcentage pour revenir à 100 % et recentrer le terrain.",
          "Taille des joueurs (silhouette) : de 20 % à 130 %. Réduisez-la en football à 11 ou sur petit écran pour laisser de la place aux tracés.",
          "Terrain zoomé : prenez l'outil Déplacer pour faire glisser le terrain."
        ]
      },
      {
        subtitle: "5.4 Plein écran",
        paragraphs: [
          "Le bouton « Plein écran » de la barre supérieure affiche le terrain sur tout l'écran, idéal pour les causeries sur grand écran ou tablette."
        ],
        bullets: [
          "Barre d'outils du plein écran : représentation des joueurs, outils de tracé, couleurs, épaisseur du trait (fin, moyen, épais) et zoom.",
          "Quitter : bouton rouge « Quitter plein écran » ou touche Échap."
        ]
      }
    ]
  },
  {
    id: "section-6",
    number: "06",
    title: "Animations de Phases de Jeu",
    iconName: "play",
    summary: "Création d'animations étape par étape, lecture et vitesse.",
    badge: "Animation",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Animer une combinaison",
        paragraphs: [
          "Le créateur d'animation enchaîne plusieurs positions du terrain pour montrer le déroulement d'une action. Le bouton « Animation », tout à droite de la barre d'outils, ouvre ses commandes sous la barre ; un nouveau clic les referme."
        ],
        bullets: [
          "Étape 1 : placez les joueurs et le ballon dans leur position de départ.",
          "Nouvelle étape (+) : déplacez les joueurs vers leur position suivante. Répétez pour chaque temps de l'action.",
          "Lecture ▶ / Pause : les joueurs se déplacent d'une étape à l'autre.",
          "Vitesse : de 0,5 à 2 secondes par étape, pour commenter le timing des courses.",
          "Supprimer une étape ou réinitialiser toute l'animation.",
          "Enregistrer l'animation : elle rejoint vos schémas et peut être partagée en GIF ou en vidéo (PRO)."
        ],
        tip: "Le créateur d'animation n'est pas disponible pendant le Mode Live Match. Les joueurs reliés par l'outil « Lier des joueurs » gardent leur liaison pendant l'animation."
      }
    ]
  },
  {
    id: "section-7",
    number: "07",
    title: "Rôles Tactiques & Coups de Pied Arrêtés",
    iconName: "award",
    summary: "Désignation du capitaine et des tireurs pour chaque équipe.",
    badge: "Rôles",
    videoUrl: "/images/guide/capture-terrain-et-outils.webp",
    content: [
      {
        subtitle: "Désigner les spécialistes",
        paragraphs: [
          "Depuis le bouton « Rôles Tactiques » d'un panneau d'équipe, attribuez les responsabilités avant le coup d'envoi. Les rôles sont enregistrés pour chaque match."
        ],
        bullets: [
          "👑 Capitaine",
          "⚽ Tireur de penalty",
          "⚡ Tireurs de coups francs",
          "🚩 Tireurs de corners"
        ],
        tip: "Les rôles apparaissent sous forme de badges sur les joueurs du terrain. Les rôles de l'adversaire sont disponibles avec les formules PRO et PRO+."
      },
      {
        subtitle: "Mur sur coup franc (football)",
        paragraphs: [
          "Le bouton « Mur » du groupe Affichage ouvre le réglage du mur. Un appui sur un mur déjà posé l'ouvre aussi."
        ],
        bullets: [
          "Équipe : choisissez l'équipe qui forme le mur.",
          "Places dans le mur : de 1 à 7, avec les boutons – et +.",
          "Placer le mur : il se pose à la distance réglementaire du ballon, entre le ballon et le but défendu.",
          "Composition : glissez les joueurs du terrain sur le mur. Chaque joueur peut ensuite être remplacé ou sorti du mur ; il revient alors sur le terrain."
        ],
        tip: "Associez le mur au demi-terrain et aux rôles de tireurs pour préparer chaque coup franc."
      }
    ]
  },
  {
    id: "section-8",
    number: "08",
    title: "Schémas, Matchs & Notes",
    iconName: "sparkles",
    summary: "Enregistrement des schémas, préparation match par match, notes et dictée vocale.",
    badge: "Préparation",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Le panneau de droite",
        paragraphs: [
          "Le panneau de droite (bouton « SCHÉMAS & MATCHS ») organise votre préparation. Sa largeur se règle en faisant glisser son bord."
        ],
        bullets: [
          "Schémas (PRO) : enregistrez la composition et les tracés du terrain, ou une animation, rattachés à un match. Un clic recharge le schéma sur le terrain.",
          "Matchs (PRO) : créez vos rencontres (équipe, adversaire, date) et retrouvez pour chacune ses schémas, ses notes et son score.",
          "Notes & causerie : saisissez vos consignes et observations, enregistrées pour chaque match.",
          "Dictée vocale (PRO) : parlez, vos consignes s'écrivent dans les notes (navigateurs compatibles : Chrome, Edge, Safari)."
        ]
      }
    ]
  },
  {
    id: "section-9",
    number: "09",
    title: "Mode Live Match",
    iconName: "timer",
    summary: "Chronomètre par période, score, buteurs, cartons, remplacements et bilan du match.",
    badge: "PRO+",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Le chronomètre et les périodes",
        paragraphs: [
          "Le Mode Live Match (formule PRO+) transforme votre écran en console de bord du terrain. Les périodes du match :"
        ],
        bullets: [
          "Football : 2 mi-temps de 45 minutes (1MT · PAUSE · 2MT).",
          "START / PAUSE / 🔄 : lancez, figez ou remettez à zéro le chrono. Au-delà du temps réglementaire, il passe en rouge (temps additionnel).",
          "PAUSE (mi-temps) : lance un compte à rebours de 15 minutes avant la reprise."
        ]
      },
      {
        subtitle: "Les actions de match",
        paragraphs: [
          "Double-cliquez sur un joueur pour ouvrir ses actions de match :"
        ],
        bullets: [
          "But et passe décisive.",
          "Carton jaune (le 2e entraîne l'exclusion) et carton rouge.",
          "Blessure et remplacement : choisissez le remplaçant qui entre ; la minute est enregistrée.",
          "Fil des événements : historique de toutes les actions, avec suppression en cas d'erreur.",
          "Terminer le match : fige le score et ouvre le bilan, exportable en image ou partageable sur WhatsApp."
        ],
        tip: "Raccourcis quand les actions d'un joueur sont ouvertes : B (but), P (passe), J (carton jaune), R (carton rouge), Échap (fermer)."
      }
    ]
  },
  {
    id: "section-10",
    number: "10",
    title: "Export & Partage",
    iconName: "download",
    summary: "Image PNG HD, vue Carte 3D, partage WhatsApp et e-mail.",
    badge: "Partage",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Diffuser vos plans de jeu",
        paragraphs: [
          "Le groupe Export de la barre d'outils (bouton jaune et bouton étoiles) et le partage des schémas enregistrés permettent d'envoyer vos consignes à vos joueurs et à votre staff."
        ],
        bullets: [
          "Export PNG HD (bouton jaune) : image nette du terrain avec les joueurs et les tracés. Choisissez le format smartphone avant l'export pour une image adaptée aux téléphones.",
          "Vue Carte 3D (bouton étoiles) : présentation de votre équipe en cartes (thèmes Or, Onyx, Argent, Émeraude) ou en têtes, au format paysage ou portrait, avec réglage de la taille du terrain et des joueurs.",
          "Vue Carte 3D, mise en scène : glissez une carte (ou utilisez les flèches du clavier) pour la placer ; « Replacer » les remet à la position des joueurs. Faites glisser le fond de la scène, ou réglez « Rotation » et « Inclinaison », pour tourner autour du terrain ; « Vue de face » revient à la vue d’origine. L’image exportée reprend exactement la vue choisie, sans modifier votre terrain tactique.",
          "Partage d'un schéma (PRO) : image, ou GIF et vidéo pour une animation.",
          "WhatsApp : envoi direct dans le groupe de l'équipe.",
          "E-mail : envoi du schéma à l'adresse de votre choix depuis l'application."
        ]
      }
    ]
  },
  {
    id: "section-11",
    number: "11",
    title: "Sauvegarde en Ligne",
    iconName: "cloud",
    summary: "Sauvegarde automatique de vos données et accès depuis tous vos appareils.",
    badge: "Cloud",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Vos données vous suivent",
        paragraphs: [
          "Tout ce que vous créez est sauvegardé automatiquement sur votre compte, sans bouton à presser."
        ],
        bullets: [
          "Données sauvegardées : équipes, effectifs, matchs, notes, rôles, remplaçants, événements et score des matchs, positions du terrain et schémas enregistrés.",
          "Multi-appareils : connectez-vous sur un autre appareil pour tout retrouver.",
          "Sans connexion internet : l'application continue de fonctionner ; vos modifications sont envoyées dès que la connexion revient.",
          "Déconnexion : les dernières modifications sont envoyées avant la fermeture de la session."
        ],
        tip: "Sur un appareil partagé, chaque coach retrouve uniquement ses propres données après connexion à son compte."
      }
    ]
  },
  {
    id: "section-12",
    number: "12",
    title: "Formules & Abonnement",
    iconName: "shield",
    summary: "Ce que comprend chaque formule, essai, facturation et résiliation.",
    badge: "Abonnement",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Les formules",
        paragraphs: [
          "Les abonnements sont mensuels et sans engagement."
        ],
        bullets: [
          "Gratuite : tableau tactique, outils de tracé, effectif de votre équipe, animations, export PNG et vue Carte 3D.",
          "PRO : en plus, plusieurs équipes, création de matchs, enregistrement et partage des schémas, effectif et rôles de l'adversaire, dictée vocale.",
          "PRO+ : toutes les fonctions PRO et le Mode Live Match.",
          "Essai : 14 jours de PRO+ offerts à la création du compte, puis passage automatique en Gratuite."
        ]
      },
      {
        subtitle: "Facturation & résiliation",
        paragraphs: [
          "Le paiement est sécurisé par Stripe. Votre facture mensuelle vous est envoyée par e-mail à chaque prélèvement."
        ],
        bullets: [
          "Portail Stripe : depuis votre espace Abonnement, consultez vos factures et modifiez votre moyen de paiement.",
          "Résiliation : « Se désabonner » arrête les prélèvements. Vous gardez votre formule jusqu'à la fin du mois déjà payé, puis votre compte repasse en Gratuite. Un e-mail de confirmation vous est envoyé.",
          "Vos données (équipes, matchs, schémas) sont conservées après la résiliation."
        ]
      }
    ]
  },
  {
    id: "section-13",
    number: "13",
    title: "Raccourcis Clavier",
    iconName: "keyboard",
    summary: "Les raccourcis disponibles dans l'application.",
    badge: "Astuces",
    videoUrl: "/images/guide/session-complete-navigation.webp",
    content: [
      {
        subtitle: "Raccourcis disponibles",
        paragraphs: [
          "Quelques touches pour aller plus vite :"
        ],
        bullets: [
          "Ctrl + Z (Cmd + Z sur Mac) : annuler le dernier tracé.",
          "Échap : quitter le plein écran, fermer une fenêtre ou les actions d'un joueur.",
          "Mode Live, actions d'un joueur ouvertes : B (but), P (passe décisive), J (carton jaune), R (carton rouge).",
          "Tuto Coach : flèches ← / → pour passer d'une étape à l'autre, Échap pour le fermer."
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
    // Copie enregistrée avec une ancienne version du guide : remplacée par le contenu à jour
    if (localStorage.getItem(GUIDE_VERSION_KEY) !== GUIDE_CONTENT_VERSION) {
      localStorage.removeItem(GUIDE_STORAGE_KEY);
      localStorage.setItem(GUIDE_VERSION_KEY, GUIDE_CONTENT_VERSION);
      return DEFAULT_GUIDE_SECTIONS;
    }
    const raw = localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!raw) return DEFAULT_GUIDE_SECTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
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
    localStorage.setItem(GUIDE_VERSION_KEY, GUIDE_CONTENT_VERSION);
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
