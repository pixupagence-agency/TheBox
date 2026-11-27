// Foire aux questions : publiée par le super admin dans app_config/faq (lecture publique, écriture super
// admin : règles Firestore), lue en direct dans « Aide & informations ». Tant qu'aucune version n'a été
// publiée, la FAQ par défaut ci-dessous est affichée.
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export const FAQ_CATEGORIES = ["Général", "Abonnements & Tarifs", "Utilisation & Fonctionnalités", "Sécurité & Données"] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

/** Libellés courts des filtres de la FAQ */
export const FAQ_CATEGORY_SHORT: Record<FaqCategory, string> = {
  "Général": "Général",
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
    answer: "The Box est une plateforme web moderne dédiée aux entraîneurs et éducateurs sportifs. Elle permet de concevoir des schémas tactiques animés en 2D, de générer des cartes d'équipe en perspective 3D, de gérer les effectifs et compositions, d'enregistrer des causeries vocales, de préparer l'équipe adverse et de piloter les événements de match en direct."
  },
  {
    id: "f2",
    category: "Général",
    question: "Quels formats de football sont pris en charge sur The Box ?",
    answer: "The Box gère nativement le football avec les tracés et dimensions officiels des terrains, du football à 5 au football à 11, ainsi que les équipements et formations adaptés à chaque format."
  },
  {
    id: "f3",
    category: "Abonnements & Tarifs",
    question: "Puis-je utiliser The Box gratuitement ?",
    answer: "Oui ! La formule Gratuite vous permet d'accéder au tableau blanc tactique 2D, de composer vos équipes, d'attribuer les rôles et d'exporter vos visuels en Haute Définition sans limitation de durée."
  },
  {
    id: "f4",
    category: "Abonnements & Tarifs",
    question: "Quelles sont les différences entre les formules PRO et PRO+ ?",
    answer: "La formule PRO (9.90€/mois) débloque la gestion multi-équipes illimitée, la passerelle d'échange inter-équipes du club, la sauvegarde illimitée des schémas tactiques, la préparation de l'effectif adverse et les causeries vocales audio. La formule PRO+ (14.90€/mois) ajoute le mode Live Match en direct sur le bord du terrain pour enregistrer le chrono officiel, le score, les buts, passeurs, cartons et changements."
  },
  {
    id: "f5",
    category: "Abonnements & Tarifs",
    question: "Comment fonctionne la période d'essai gratuite ?",
    answer: "Toute création de compte bénéficie automatiquement d'une période d'essai gratuite complète de 14 jours donnant accès à toutes les fonctionnalités de la formule PRO+ (y compris le Mode Live Match), sans engagement et sans carte bancaire requise à l'inscription. L'essai est accordé une seule fois par compte et par adresse e-mail : il n'est plus proposé à un utilisateur ayant déjà souscrit un abonnement PRO ou PRO+. À la fin des 14 jours, votre compte passe automatiquement en Version Gratuite : vos équipes, matchs, notes et schémas sont alors masqués mais restent sauvegardés, et vous les retrouvez dès que vous souscrivez une formule PRO ou PRO+."
  },
  {
    id: "f6",
    category: "Abonnements & Tarifs",
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer: "Absolument. Les abonnements PRO et PRO+ sont mensuels et sans aucun engagement de durée. Vous pouvez résilier votre récurrence à tout moment depuis votre espace utilisateur. Vous conserverez vos accès jusqu'à la fin du mois déjà réglé. Votre compte repasse ensuite en Version Gratuite : vos équipes, matchs, notes et schémas sont masqués mais conservés, et réapparaissent si vous reprenez un abonnement. Une résiliation ne donne pas droit à une nouvelle période d'essai gratuite."
  },
  {
    id: "f7",
    category: "Utilisation & Fonctionnalités",
    question: "Comment créer et animer des schémas tactiques en 2D ?",
    answer: "Sur le terrain tactique 2D, déplacez vos jetons (titulaires, remplaçants, adversaires), ballons et équipements (cônes, mannequins, portes, échelles). Utilisez les outils de dessin interactifs pour tracer les passes, courses et surligner des zones tactiques. Créez des séquences d'animation étape par étape avec contrôle de la lecture, pause et vitesse."
  },
  {
    id: "f8",
    category: "Utilisation & Fonctionnalités",
    question: "Comment générer et personnaliser la Vue 3D Carte de mon équipe (Squad 3D) ?",
    answer: "Accédez à la 'Vue 3D Carte' pour transformer votre composition 2D en une scène 3D réaliste en perspective. Choisissez parmi 4 styles de cartes (Gold Or, Special Dark, Argent, Émeraude), ajustez le format (Paysage 16:9 ou Portrait 9:16 idéal pour stories/mobiles), réglez l'échelle du terrain et téléchargez votre carte d'équipe en image PNG HD."
  },
  {
    id: "f9",
    category: "Utilisation & Fonctionnalités",
    question: "Comment créer et partager une Feuille de Match & Plan Tactique ?",
    answer: "The Box génère automatiquement votre Feuille de Match complète et structurée incluant les 11 titulaires (sur le schéma), les remplaçants (sur le banc), les schémas rattachés et les consignes du coach. Vous pouvez la copier au format texte structuré pour WhatsApp/SMS, l'exporter en PNG HD ou l'envoyer par e-mail au staff et aux joueurs."
  },
  {
    id: "f10",
    category: "Utilisation & Fonctionnalités",
    question: "Comment attribuer les rôles tactiques et gérer l'équipe adverse ?",
    answer: "Dans le menu Effectif & Rôles, personnalisez vos joueurs (nom, numéro, poste, état de forme). Attribuez d'un clic les rôles clés : Capitaine, Tireurs de penalty, Coups francs directs/indirects, Corners droit/gauche et Touches longues. Vous pouvez aussi configurer les noms et numéros des joueurs de l'équipe adverse."
  },
  {
    id: "f11",
    category: "Utilisation & Fonctionnalités",
    question: "Comment fonctionne la Passerelle d'échange Inter-Équipes ?",
    answer: "Accessible avec les formules PRO et PRO+, la Passerelle Inter-Équipes permet de transférer ou permuter instantanément des joueurs entre les catégories de votre club (ex: Séniors A, Réserve, U19). Choisissez l'équipe cible et effectuez une permutation réciproque ou un renfort simple avec synchronisation en temps réel."
  },
  {
    id: "f12",
    category: "Utilisation & Fonctionnalités",
    question: "Comment enregistrer des causeries vocales pour mes joueurs ?",
    answer: "Utilisez l'enregistreur vocal intégré pour enregistrer vos causeries tactiques audio et consignes du coach. Les enregistrements restent rattachés à votre schéma ou match et peuvent être réécoutés par votre staff et vos joueurs avant ou après la rencontre."
  },
  {
    id: "f13",
    category: "Utilisation & Fonctionnalités",
    question: "Qu'est-ce que le Mode Live Match et comment l'utiliser au bord du terrain ?",
    answer: "Inclus dans la formule PRO+, le Mode Live Match transforme votre écran en banc de touche connecté. Il intègre un chronomètre officiel de match (Start/Pause/Reset), la saisie du score en temps réel, l'enregistrement des événements (buts, passeurs, cartons jaunes/rouges) et la réalisation de remplacements ou sorties sur blessure."
  },
  {
    id: "f14",
    category: "Utilisation & Fonctionnalités",
    question: "Comment basculer entre le Mode Sombre et le Mode Clair & Épuré ?",
    answer: "Dans les paramètres de votre compte (icône ⚙️), vous pouvez basculer d'un clic entre le Mode Sombre classique (optimisé pour l'analyse vidéo) et le Mode Clair & Épuré (lumineux et aéré). L'intégralité de l'interface (panneaux, modales, tableaux) s'adapte instantanément au thème choisi."
  },
  {
    id: "f15",
    category: "Utilisation & Fonctionnalités",
    question: "Sur quels appareils puis-je utiliser The Box (PC, Tablette, Smartphone, PWA) ?",
    answer: "The Box est une application web 100% responsive et progressive (PWA). Elle fonctionne sur ordinateur de bureau, ordinateur portable, écran interactif tactile, tablette (iPad / Android) et smartphone. Vous pouvez même l'installer sur l'écran d'accueil de votre appareil pour un accès direct hors navigateur."
  },
  {
    id: "f16",
    category: "Sécurité & Données",
    question: "Mes données tactiques et mes effectifs sont-ils protégés ?",
    answer: "Toutes vos données (joueurs, schémas, notes de causerie, enregistrements) sont chiffrées et stockées sur des serveurs sécurisés conformes aux normes européennes du RGPD. Seul votre compte a accès à vos données tactiques privées."
  },
  {
    id: "f16b",
    category: "Sécurité & Données",
    question: "Combien de temps mes données sont-elles conservées ? Comment les supprimer ?",
    answer: "Vos données sont conservées tant que votre compte existe, y compris en Version Gratuite (elles sont alors masquées, pas effacées). Aucune suppression automatique n'est appliquée. Vous pouvez supprimer définitivement votre compte et toutes vos données à tout moment depuis Paramètres > Profil > « Supprimer mon compte », ou en écrivant à support@thebox-tactique.com. Si un abonnement est en cours, il n'est pas renouvelé : vous gardez l'accès jusqu'à la fin de la période déjà payée, puis votre compte et vos données sont supprimés à cette date (vous pouvez annuler la suppression d'ici là). Sans abonnement en cours, la suppression est immédiate."
  },
  {
    id: "f17",
    category: "Sécurité & Données",
    question: "Comment contacter le support technique ?",
    answer: "En cas de question ou de besoin d'accompagnement, vous pouvez cliquer sur 'Contacter le support' dans cette modale ou nous envoyer un message via le formulaire de contact officiel. Notre équipe répond sous 24h."
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
