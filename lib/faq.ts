// Foire aux questions : publiée par le super admin dans app_config/faq (lecture publique, écriture super
// admin : règles Firestore), lue en direct dans « Aide & informations ». Tant qu'aucune version n'a été
// publiée, la FAQ par défaut ci-dessous est affichée.
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export const FAQ_CATEGORIES = ["Général", "Terrain & Outils", "Utilisation & Fonctionnalités", "Abonnements & Tarifs", "Sécurité & Données"] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

/** Libellés courts des filtres de la FAQ */
export const FAQ_CATEGORY_SHORT: Record<FaqCategory, string> = {
  "Général": "Général",
  "Terrain & Outils": "Outils",
  "Abonnements & Tarifs": "Abonnements",
  "Utilisation & Fonctionnalités": "Fonctionnalités",
  "Sécurité & Données": "Sécurité",
};

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export interface PublishedFaq {
  items: FaqItem[];
  updatedAt: string | null;
  updatedBy: string | null;
}

export const FAQ_LIMITS = { items: 100, question: 300, answer: 4000 } as const;

export const DEFAULT_FAQ: FaqItem[] = [
  {
    id: "f1",
    category: "Général",
    question: "Qu'est-ce que The Box - Zone de décision tactique ?",
    answer: "The Box est un tableau tactique en ligne pour les entraîneurs de football. Vous y placez vos joueurs sur un terrain 2D, dessinez vos consignes, animez vos combinaisons, gérez vos effectifs et vos matchs, préparez l'adversaire et suivez vos rencontres en direct avec le Mode Live Match."
  },
  {
    id: "f2",
    category: "Général",
    question: "Quels formats de football sont pris en charge ?",
    answer: "Le football à 11, à 8 et à 5, avec les dimensions et les formations adaptées à chaque format. En formule Gratuite, le format se choisit dans le groupe Vue de la barre d'outils. En PRO et PRO+, chaque équipe a son format, défini à sa création."
  },
  {
    id: "f15",
    category: "Général",
    question: "Sur quels appareils puis-je utiliser The Box ?",
    answer: "Sur ordinateur, tablette (iPad, Android) et smartphone, depuis un navigateur récent. The Box s'installe aussi comme une application : sur iPhone / iPad, bouton de partage puis « Sur l'écran d'accueil » ; sur Android, menu ⋮ puis « Installer l'application » ; sur ordinateur, bouton « Installer l'application » de la barre supérieure. Votre compte est le même partout."
  },
  {
    id: "g1",
    category: "Général",
    question: "Où trouver de l'aide pour prendre en main l'application ?",
    answer: "Deux aides sont disponibles depuis le tableau tactique : le bouton « 🎓 Tuto Coach » de la barre supérieure lance une visite guidée en 12 étapes, avec une fiche pour chaque bouton de la barre d'outils (survolez une fiche pour repérer le bouton) ; le « Guide d'Utilisation », dans le menu de votre profil, détaille chaque fonction section par section, avec une recherche."
  },
  {
    id: "t1",
    category: "Terrain & Outils",
    question: "Comment est organisée la barre d'outils au-dessus du terrain ?",
    answer: "Elle tient sur une seule ligne, rangée en groupes de gauche à droite : Vue (terrain complet ou demi-terrain, paysage ou portrait), Affichage (ballon, couloirs, zones, mur, adversaires, noms, rôles, panneaux, représentation des joueurs), Tracés, Couleurs, Export (PNG HD et Vue Carte 3D), Zoom, puis Animation tout à droite. Survolez un bouton pour afficher son nom ; un bouton encadré de couleur est actif, recliquez pour le désactiver."
  },
  {
    id: "t2",
    category: "Terrain & Outils",
    question: "Certains boutons de la barre d'outils ont disparu sur mon smartphone ou ma tablette : où sont-ils ?",
    answer: "Ils sont toujours là : sur un écran étroit, la barre défile horizontalement. Faites-la glisser au doigt, utilisez la molette, ou touchez les flèches ‹ › qui apparaissent sur ses bords quand des outils sont hors de vue. Le bouton Animation reste toujours visible à droite."
  },
  {
    id: "t3",
    category: "Terrain & Outils",
    question: "À quoi sert chaque outil de tracé ?",
    answer: "Sélecteur (flèche) : outil par défaut, pour déplacer joueurs et ballon et sélectionner un tracé. Déplacer (croix fléchée) : faire glisser le terrain quand il est zoomé. Ligne : pleine, recliquez pour le pointillé. Lier des joueurs : ligne qui suit les joueurs reliés. Flèche de course : déplacement ou passe. Courbe fléchée : tracez-la puis déplacez ses poignées pour la cintrer, recliquez pour le pointillé. Zone : rectangle pour délimiter un espace. Dessin libre (crayon) : annotations à main levée. Corbeille rouge : efface tous les tracés."
  },
  {
    id: "t4",
    category: "Terrain & Outils",
    question: "Je n'arrive plus à déplacer mes joueurs, pourquoi ?",
    answer: "Un outil de tracé est sans doute encore actif : il reste sélectionné jusqu'à ce que vous en choisissiez un autre. Cliquez sur le Sélecteur (la flèche, premier bouton du groupe Tracés) pour déplacer à nouveau joueurs et ballon. Si le terrain est zoomé, l'outil Déplacer fait glisser le terrain et non les joueurs."
  },
  {
    id: "t5",
    category: "Terrain & Outils",
    question: "Comment supprimer un tracé ou annuler une erreur ?",
    answer: "Ctrl + Z (Cmd + Z sur Mac) annule le dernier tracé. Pour supprimer un tracé précis, prenez le Sélecteur et cliquez dessus : une petite barre apparaît pour le supprimer, annuler ou tout effacer. La corbeille rouge du groupe Tracés efface tous les tracés d'un coup (elle est grisée quand il n'y en a aucun)."
  },
  {
    id: "t6",
    category: "Terrain & Outils",
    question: "Comment relier des joueurs par une ligne qui les suit ?",
    answer: "Choisissez l'outil « Lier des joueurs », puis touchez les joueurs un par un : une petite barre vous guide et permet de choisir la couleur et le style (plein ou pointillé). Pour terminer, touchez à nouveau le dernier joueur ou le terrain ; à partir de 3 joueurs, touchez le premier pour fermer la forme. La liaison suit les joueurs quand vous les déplacez et pendant les animations. Pour la supprimer, cliquez dessus avec le Sélecteur puis sur le bouton de suppression."
  },
  {
    id: "t7",
    category: "Terrain & Outils",
    question: "Comment changer la couleur ou l'épaisseur du trait ?",
    answer: "Le groupe Couleurs propose cinq pastilles (vert, rouge, bleu, noir, jaune) : la pastille choisie est entourée et s'applique aux prochains tracés. L'épaisseur (fin, moyen, épais) se règle dans la barre d'outils du mode Plein écran."
  },
  {
    id: "t8",
    category: "Terrain & Outils",
    question: "Comment afficher les couloirs ou les zones du terrain ?",
    answer: "Dans le groupe Affichage : le bouton « 5 couloirs » trace les couloirs dans la longueur (largeur, demi-espaces, axe) et le bouton « 3 zones » découpe le terrain en zones de défense, de milieu et d'attaque. Les deux peuvent être affichés en même temps."
  },
  {
    id: "t9",
    category: "Terrain & Outils",
    question: "Comment placer un mur sur un coup franc ?",
    answer: "Cliquez sur le bouton « Mur » du groupe Affichage. Choisissez l'équipe qui forme le mur et son nombre de places (de 1 à 7), puis « Placer le mur » : il se pose à la distance réglementaire du ballon, entre le ballon et le but défendu. Glissez ensuite les joueurs du terrain sur le mur pour le composer ; chacun peut être remplacé ou sorti du mur. Un appui sur le mur rouvre ce réglage."
  },
  {
    id: "t10",
    category: "Terrain & Outils",
    question: "Comment masquer les noms, les rôles ou l'équipe adverse ?",
    answer: "Dans le groupe Affichage : le bouton # masque les noms pour ne garder que les numéros, le bouton étiquette masque les badges de rôles (capitaine, tireurs), et le bouton Adversaires (rouge quand ils sont visibles) masque l'équipe adverse. Noms et rôles masqués sont signalés par un bouton orange. Le bouton ballon affiche ou masque le ballon."
  },
  {
    id: "t11",
    category: "Terrain & Outils",
    question: "Comment changer l'apparence des joueurs sur le terrain ?",
    answer: "Les trois derniers boutons du groupe Affichage choisissent la représentation : Pastille (rond numéroté, la plus lisible), Buste (maillot aux couleurs de l'équipe) ou Tête (visage du joueur, avec sa photo quand vous l'avez ajoutée). La taille des joueurs se règle dans le groupe Zoom, de 20 % à 130 %."
  },
  {
    id: "t12",
    category: "Terrain & Outils",
    question: "Comment zoomer sur le terrain ou agrandir la zone de travail ?",
    answer: "Dans le groupe Zoom, la loupe règle l'échelle du terrain de 70 % à 150 % ; cliquez sur le pourcentage pour revenir à 100 % et recentrer. Terrain zoomé, prenez l'outil Déplacer pour le faire glisser. Pour gagner de la place, le bouton Panneaux d'équipe (colonnes) replie Mon Équipe et Mon Adversaire, et le bouton Plein écran de la barre supérieure affiche le terrain sur tout l'écran (touche Échap pour en sortir)."
  },
  {
    id: "t13",
    category: "Terrain & Outils",
    question: "Quelle différence entre terrain complet, demi-terrain, format ordinateur et format smartphone ?",
    answer: "Ce sont les quatre premiers boutons de la barre (groupe Vue). Terrain complet : les deux moitiés, pour l'organisation générale. Demi-terrain : une moitié agrandie, idéale pour les phases offensives et les coups de pied arrêtés. Format ordinateur : terrain en paysage, pour un grand écran. Format smartphone : terrain en portrait, pour un téléphone ou un export lisible sur mobile."
  },
  {
    id: "f7",
    category: "Utilisation & Fonctionnalités",
    question: "Comment créer une animation tactique ?",
    answer: "Cliquez sur le bouton « Animation », tout à droite de la barre d'outils : ses commandes s'ouvrent sous la barre. Placez joueurs et ballon en position de départ, ajoutez une nouvelle étape (+) et déplacez les joueurs vers leur position suivante, puis recommencez. Lecture ▶ / Pause rejoue l'action, à une vitesse de 0,5 à 2 secondes par étape. L'animation s'enregistre dans vos schémas et se partage en GIF ou en vidéo (PRO). Elle n'est pas disponible pendant le Mode Live Match."
  },
  {
    id: "f8",
    category: "Utilisation & Fonctionnalités",
    question: "Comment générer la Vue Carte 3D de mon équipe ?",
    answer: "Cliquez sur le bouton étoiles du groupe Export de la barre d'outils. Présentez votre équipe en cartes ou en têtes, choisissez le style des cartes (Or, Onyx, Argent, Émeraude) et le format (paysage 16:9 ou portrait 9:16, idéal pour les stories et les téléphones), réglez la taille du terrain et des joueurs, puis téléchargez l'image en PNG HD. Vous pouvez aussi glisser chaque carte pour la placer (« Replacer » les remet en place) et tourner autour du terrain en faisant glisser le fond de la scène ou avec les réglages Rotation et Inclinaison (« Vue de face » pour revenir). Ces réglages ne modifient pas votre terrain tactique."
  },
  {
    id: "f9",
    category: "Utilisation & Fonctionnalités",
    question: "Comment envoyer mes plans de jeu à mes joueurs et à mon staff ?",
    answer: "Le bouton jaune du groupe Export enregistre une image PNG HD du terrain, des joueurs et des tracés. Avec les formules PRO et PRO+, un schéma enregistré se partage en image, en GIF ou en vidéo pour une animation, par WhatsApp ou par e-mail, et le bouton « Exporter PDF de match » du panneau de droite crée le dossier complet d'un match : couverture, groupe et rôles, notes tactiques et un schéma par page."
  },
  {
    id: "f10",
    category: "Utilisation & Fonctionnalités",
    question: "Comment attribuer les rôles tactiques et gérer l'équipe adverse ?",
    answer: "Le bouton « Rôles Tactiques » d'un panneau d'équipe désigne le capitaine, le tireur de penalty, les tireurs de coups francs (direct, excentré gauche et droit) et de corners (gauche et droit). Les rôles s'affichent en badges sur les joueurs. Le bouton « Effectif » gère noms, numéros, postes, photos, état de forme, titulaires et remplaçants. L'effectif et les rôles de l'adversaire sont disponibles avec les formules PRO et PRO+."
  },
  {
    id: "f11",
    category: "Utilisation & Fonctionnalités",
    question: "Comment échanger un joueur entre deux de mes équipes ?",
    answer: "Avec les formules PRO et PRO+, ouvrez l'effectif d'une équipe et utilisez « Échanger avec une équipe » : choisissez l'équipe cible et le joueur, pour un échange entre les deux effectifs (par exemple entre les Séniors et les U19)."
  },
  {
    id: "f12",
    category: "Utilisation & Fonctionnalités",
    question: "Comment préparer mes notes et ma causerie ?",
    answer: "Dans le panneau de droite, la section « Notes & causerie » enregistre vos consignes pour chaque match. Avec les formules PRO et PRO+, la dictée vocale (icône micro) écrit vos consignes à mesure que vous parlez, sur les navigateurs compatibles (Chrome, Edge, Safari). Les notes sont sauvegardées sur votre compte et reprises dans le PDF du match."
  },
  {
    id: "f13",
    category: "Utilisation & Fonctionnalités",
    question: "Qu'est-ce que le Mode Live Match et comment l'utiliser au bord du terrain ?",
    answer: "Inclus dans la formule PRO+, le Mode Live Match transforme votre écran en console de bord du terrain : chronomètre par période (START / PAUSE / remise à zéro, temps additionnel en rouge), compte à rebours de la mi-temps, score, buts et passes décisives, cartons jaunes et rouges, blessures et remplacements. Double-cliquez sur un joueur pour ses actions, ou utilisez les touches B (but), P (passe), J (jaune) et R (rouge). « Terminer le match » ouvre le bilan, exportable en image ou partageable sur WhatsApp."
  },
  {
    id: "f14",
    category: "Utilisation & Fonctionnalités",
    question: "Comment passer du thème sombre au thème clair ?",
    answer: "Ouvrez le menu de votre profil (en haut à droite), puis « Configuration Profil & Sport », onglet Préférences : choisissez le thème sombre ou clair, ainsi que la langue (français ou anglais). Toute l'interface s'adapte immédiatement."
  },
  {
    id: "f3",
    category: "Abonnements & Tarifs",
    question: "Puis-je utiliser The Box gratuitement ?",
    answer: "Oui, sans limite de durée. La formule Gratuite comprend le tableau tactique et toute la barre d'outils (tracés, affichage, zoom), l'effectif et les rôles de votre équipe, les animations, l'export PNG HD et la Vue Carte 3D."
  },
  {
    id: "f4",
    category: "Abonnements & Tarifs",
    question: "Quelles sont les différences entre les formules PRO et PRO+ ?",
    answer: "La formule PRO (9,90 €/mois) ajoute la gestion de plusieurs équipes et l'échange de joueurs entre elles, la création de matchs, l'enregistrement et le partage des schémas (image, GIF, vidéo, WhatsApp, e-mail), le PDF de match, l'effectif et les rôles de l'adversaire et la dictée vocale. La formule PRO+ (14,90 €/mois) ajoute le Mode Live Match : chronomètre, score, buteurs, passeurs, cartons et remplacements."
  },
  {
    id: "f5",
    category: "Abonnements & Tarifs",
    question: "Comment fonctionne la période d'essai gratuite ?",
    answer: "Toute création de compte bénéficie automatiquement de 14 jours d'essai avec toutes les fonctionnalités de la formule PRO+ (y compris le Mode Live Match), sans engagement et sans carte bancaire. Le compte à rebours s'affiche dans la barre supérieure. L'essai est accordé une seule fois par compte et par adresse e-mail : il n'est plus proposé à un utilisateur ayant déjà souscrit un abonnement PRO ou PRO+. À la fin des 14 jours, votre compte passe automatiquement en formule Gratuite : vos équipes, matchs, notes et schémas sont alors masqués mais restent sauvegardés, et vous les retrouvez dès que vous souscrivez une formule PRO ou PRO+."
  },
  {
    id: "f6",
    category: "Abonnements & Tarifs",
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer: "Oui. Les abonnements PRO et PRO+ sont mensuels et sans engagement. Résiliez depuis le menu de votre profil (« Se désabonner ») ou depuis l'onglet Abonnement de la Configuration Profil & Sport, où le portail Stripe donne aussi accès à vos factures et à votre moyen de paiement. Vous gardez vos accès jusqu'à la fin du mois déjà payé, puis votre compte repasse en formule Gratuite : vos équipes, matchs, notes et schémas sont masqués mais conservés, et réapparaissent si vous reprenez un abonnement. Une résiliation ne donne pas droit à une nouvelle période d'essai."
  },
  {
    id: "f16",
    category: "Sécurité & Données",
    question: "Mes données tactiques et mes effectifs sont-ils protégés ?",
    answer: "Vos données (joueurs, schémas, matchs, notes) sont sauvegardées automatiquement sur votre compte, chez Google Cloud (Firebase) : elles sont chiffrées lors des échanges et sur les serveurs, et des règles de sécurité limitent leur accès à votre seul compte. Le traitement de vos données est détaillé dans la Politique de confidentialité, accessible depuis « Aide & informations »."
  },
  {
    id: "f16b",
    category: "Sécurité & Données",
    question: "Combien de temps mes données sont-elles conservées ? Comment les supprimer ?",
    answer: "Vos données sont conservées tant que votre compte existe, y compris en formule Gratuite (elles sont alors masquées, pas effacées). Aucune suppression automatique n'est appliquée. Vous pouvez supprimer définitivement votre compte et toutes vos données à tout moment depuis le menu de votre profil > Configuration Profil & Sport > onglet Profil > « Supprimer mon compte », ou en écrivant à support@thebox-tactique.com. Si un abonnement est en cours, il n'est pas renouvelé : vous gardez l'accès jusqu'à la fin de la période déjà payée, puis votre compte et vos données sont supprimés à cette date (vous pouvez annuler la suppression d'ici là). Sans abonnement en cours, la suppression est immédiate."
  },
  {
    id: "f17",
    category: "Sécurité & Données",
    question: "Comment contacter le support technique ?",
    answer: "Depuis le tableau tactique, ouvrez le menu de votre profil puis « Contacter le Support (Email) » : votre messagerie s'ouvre avec un message adressé à support@thebox-tactique.com. Vous pouvez aussi écrire directement à cette adresse, ou utiliser le bouton « Contacter le support » de cette fenêtre."
  }
];

const faqRef = () => doc(db, "app_config", "faq");

/** FAQ lue en base, vérifiée champ par champ ; FAQ par défaut si elle est absente ou vide */
export function readFaq(data: unknown): PublishedFaq {
  const fallback: PublishedFaq = { items: DEFAULT_FAQ, updatedAt: null, updatedBy: null };
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  const items = (Array.isArray(d.items) ? d.items : [])
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x) => ({
      id: typeof x.id === "string" && x.id ? x.id : newFaqId(),
      category: (FAQ_CATEGORIES as readonly string[]).includes(x.category as string) ? (x.category as FaqCategory) : "Général",
      question: typeof x.question === "string" ? x.question : "",
      answer: typeof x.answer === "string" ? x.answer : "",
    }))
    .filter((x) => x.question.trim() && x.answer.trim());
  if (!items.length) return fallback;
  return { items, updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : null, updatedBy: typeof d.updatedBy === "string" ? d.updatedBy : null };
}

let seq = 0;
export const newFaqId = () => `q${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Suit la FAQ publiée ; FAQ par défaut si jamais publiée ou si la lecture échoue */
export function subscribeFaq(onChange: (faq: PublishedFaq) => void): () => void {
  return onSnapshot(
    faqRef(),
    (snap) => onChange(readFaq(snap.data())),
    (err) => {
      console.warn("[FAQ] Lecture impossible :", err?.message);
      onChange(readFaq(null));
    }
  );
}

/** Problème empêchant la publication, sinon null */
export function validateFaq(items: FaqItem[]): string | null {
  if (!items.length) return "La FAQ doit contenir au moins une question.";
  if (items.length > FAQ_LIMITS.items) return `${FAQ_LIMITS.items} questions au maximum.`;
  for (const [i, it] of items.entries()) {
    if (!it.question.trim()) return `La question ${i + 1} est vide.`;
    if (!it.answer.trim()) return `La réponse à « ${it.question} » est vide.`;
    if (it.question.length > FAQ_LIMITS.question) return `La question ${i + 1} est trop longue.`;
    if (it.answer.length > FAQ_LIMITS.answer) return `La réponse à « ${it.question} » est trop longue.`;
  }
  return null;
}

/** Publie la FAQ pour tous les utilisateurs (super admin) */
export async function publishFaq(items: FaqItem[]): Promise<void> {
  const problem = validateFaq(items);
  if (problem) throw new Error(problem);
  await setDoc(faqRef(), {
    items: items.map((it) => ({ id: it.id, category: it.category, question: it.question.trim(), answer: it.answer.trim() })),
    updatedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.email || null,
  });
}
