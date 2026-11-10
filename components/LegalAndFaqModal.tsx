"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  HelpCircle,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  Mail,
  CreditCard,
  Lock,
  Scale,
  CheckCircle2,
  Zap,
  Users,
  Trophy
} from "lucide-react";
import LogoIcon from "./LogoIcon";
import { getPremiumTheme, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";

export type LegalTab = "faq" | "cgu" | "cgv";

interface LegalAndFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: LegalTab;
  onOpenSupport?: () => void;
  isModernSleek?: boolean;
}

interface FaqItem {
  id: string;
  category: "Général" | "Abonnements & Tarifs" | "Utilisation & Fonctionnalités" | "Sécurité & Données";
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: "f1",
    category: "Général",
    question: "Qu'est-ce que The Box - Zone de décision tactique ?",
    answer: "The Box est une plateforme web moderne dédiée aux entraîneurs et éducateurs sportifs. Elle permet de concevoir des schémas tactiques animés en 2D, de générer des cartes d'équipe en perspective 3D, de gérer les effectifs et compositions, d'enregistrer des causeries vocales, de préparer l'équipe adverse et de piloter les événements de match en direct."
  },
  {
    id: "f2",
    category: "Général",
    question: "Quels sports sont pris en charge sur The Box ?",
    answer: "The Box gère nativement le Football avec les tracés et dimensions officiels de terrains (et prochainement le Basketball, le Rugby et le Handball). Vous disposez des équipements spécifiques pour chaque discipline."
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
    answer: "Toute création de compte bénéficie automatiquement d'une période d'essai gratuite complète de 14 jours donnant accès à toutes les fonctionnalités de la formule PRO+ (y compris le Mode Live Match), sans engagement et sans carte bancaire requise à l'inscription. À la fin des 14 jours, votre compte passe automatiquement en Version Gratuite."
  },
  {
    id: "f6",
    category: "Abonnements & Tarifs",
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer: "Absolument. Les abonnements PRO et PRO+ sont mensuels et sans aucun engagement de durée. Vous pouvez résilier votre récurrence à tout moment depuis votre espace utilisateur. Vous conserverez vos accès jusqu'à la fin du mois déjà réglé."
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
    id: "f17",
    category: "Sécurité & Données",
    question: "Comment contacter le support technique ?",
    answer: "En cas de question ou de besoin d'accompagnement, vous pouvez cliquer sur 'Contacter le support' dans cette modale ou nous envoyer un message via le formulaire de contact officiel. Notre équipe répond sous 24h."
  }
];

export default function LegalAndFaqModal({
  isOpen,
  onClose,
  defaultTab = "faq",
  onOpenSupport,
  isModernSleek = false
}: LegalAndFaqModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(defaultTab);
  const [openFaqIds, setOpenFaqIds] = useState<string[]>(["f1", "f3", "f4"]);
  const [faqSearch, setFaqSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");

  // Ouvre sur l'onglet demandé à chaque ouverture + fermeture au clavier (Échap)
  useEffect(() => {
    if (isOpen) setActiveTab(defaultTab);
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const th = getPremiumTheme(isModernSleek);

  const filterCategories = [
    { id: "Toutes", label: "Toutes", count: FAQ_DATA.length },
    { id: "Général", label: "Général", count: FAQ_DATA.filter(f => f.category === "Général").length },
    { id: "Abonnements & Tarifs", label: "Abonnements", count: FAQ_DATA.filter(f => f.category === "Abonnements & Tarifs").length },
    { id: "Utilisation & Fonctionnalités", label: "Fonctionnalités", count: FAQ_DATA.filter(f => f.category === "Utilisation & Fonctionnalités").length },
    { id: "Sécurité & Données", label: "Sécurité", count: FAQ_DATA.filter(f => f.category === "Sécurité & Données").length },
  ];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCat = selectedCategory === "Toutes" || item.category === selectedCategory;
    const matchesSearch = item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openSupport = () => {
    if (onOpenSupport) {
      onOpenSupport();
    } else {
      window.location.href = "mailto:support@thebox-tactique.com?subject=%5BSupport%5D%20Demande%20d'assistance";
    }
  };

  const lastUpdate = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const tabs: { id: LegalTab; label: string; short: string; title: string; desc: string; icon: React.ElementType }[] = [
    { id: "faq", label: "Foire aux questions", short: "FAQ", title: "Foire aux questions", desc: "Les réponses aux questions les plus fréquentes des coachs.", icon: HelpCircle },
    { id: "cgu", label: "Conditions d'utilisation", short: "CGU", title: "Conditions générales d'utilisation", desc: "Les règles d'accès et d'utilisation de la plateforme The Box.", icon: FileText },
    { id: "cgv", label: "Conditions de vente", short: "CGV", title: "Conditions générales de vente", desc: "Les conditions applicables aux abonnements payants.", icon: Scale },
  ];
  const current = tabs.find((x) => x.id === activeTab) || tabs[0];

  const cguSections: { title: string; body: React.ReactNode }[] = [
    { title: "Objet et présentation du service", body: <>La plateforme <strong>The Box</strong> est un service SaaS d&apos;animation tactique, de gestion d&apos;effectifs et de préparation de séances sportives destiné aux entraîneurs, éducateurs et clubs sportifs. L&apos;accès au service implique l&apos;acceptation pleine et entière des présentes CGU par l&apos;utilisateur.</> },
    { title: "Accès au service et création de compte", body: <>L&apos;accès aux fonctionnalités avancées nécessite la création d&apos;un compte utilisateur sécurisé. L&apos;utilisateur s&apos;engage à fournir des informations exactes et à préserver la confidentialité de ses identifiants de connexion. Toute action effectuée depuis son compte est présumée être réalisée par l&apos;utilisateur titulaire.</> },
    { title: "Propriété intellectuelle", body: <>L&apos;ensemble de l&apos;application (interface, visuels, moteurs d&apos;animation, terrains vectoriels, codes sources et marques « The Box ») est la propriété exclusive de l&apos;éditeur. L&apos;utilisateur conserve la propriété intellectuelle de ses contenus créés (schémas tactiques, compositions et notes personnelles), mais concède à la plateforme une licence technique nécessaire au stockage et à la restitution du service.</> },
    { title: "Protection des données personnelles (RGPD)", body: <>Conformément au Règlement Général sur la Protection des Données (RGPD), The Box s&apos;engage à protéger la vie privée des entraîneurs et de leurs effectifs. Les données collectées (nom, email, effectifs du club) sont uniquement utilisées pour l&apos;exécution du service et ne sont en aucun cas vendues ou cédées à des tiers. Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression via support@thebox-tactique.com.</> },
    { title: "Disponibilité et responsabilité", body: <>The Box met en œuvre tous les moyens raisonnables pour assurer un accès continu et fluide au service 24h/24 et 7j/7. Néanmoins, l&apos;accès peut être temporairement interrompu pour des raisons de maintenance technique ou de mise à jour des terrains. L&apos;éditeur ne saurait être tenu responsable des pertes indirectes liées à une interruption momentanée du réseau internet.</> },
    { title: "Modification des CGU", body: <>L&apos;éditeur se réserve le droit de modifier les présentes CGU à tout moment afin de les adapter aux évolutions réglementaires et techniques. Les utilisateurs seront informés de toute modification majeure lors de leur connexion.</> },
  ];

  const cgvSections: { title: string; body: React.ReactNode }[] = [
    {
      title: "Offres et tarifications",
      body: (
        <>
          <p>The Box propose trois formules d&apos;accès :</p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex gap-2"><CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${th.accent}`} /><span><strong>Formule Gratuite :</strong> Accès de base au tableau tactique 2D, gestion d&apos;effectif et exports PNG (0.00 €/mois).</span></li>
            <li className="flex gap-2"><CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${th.accent}`} /><span><strong>Formule PRO :</strong> Accès multi-équipes, sauvegarde illimitée des schémas, préparation de l&apos;équipe adverse et causeries vocales (9.90 €/mois TTC).</span></li>
            <li className="flex gap-2"><CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${th.accent}`} /><span><strong>Formule PRO+ :</strong> Toutes les fonctionnalités PRO + activation du mode Live Match en direct avec chronomètre et statistiques (14.90 €/mois TTC).</span></li>
          </ul>
        </>
      ),
    },
    { title: "Période d'essai gratuite", body: <>Tout nouveau compte bénéficie automatiquement d&apos;une période d&apos;essai gratuite de 7 jours aux fonctionnalités de la formule PRO. À l&apos;issue des 7 jours, l&apos;utilisateur repasse automatiquement en Formule Gratuite sans aucuns frais prélevés si aucun abonnement payant n&apos;a été activé.</> },
    { title: "Modalités de paiement", body: <>Les paiements s&apos;effectuent de manière mensuelle et récurrente par Carte Bancaire via une infrastructure de paiement hautement sécurisée et chiffrée. L&apos;abonnement est prélevé à la date anniversaire de la souscription.</> },
    { title: "Sans engagement & résiliation", body: <>Tous nos abonnements payants sont strictement <strong>sans engagement de durée</strong>. Vous pouvez mettre fin à votre renouvellement automatique à tout moment en un clic dans votre espace utilisateur. La résiliation prend effet à la fin de la période mensuelle en cours.</> },
    { title: "Droit de rétractation", body: <>Conformément aux dispositions de l&apos;article L.221-18 du Code de la Consommation, vous disposez d&apos;un délai de rétractation de 14 jours à compter de la souscription initiale pour annuler votre contrat et en demander le remboursement intégral en contactant support@thebox-tactique.com.</> },
    { title: "Support client et facturation", body: <>Pour toute question concernant vos factures ou votre abonnement, notre service client est disponible par courrier électronique à l&apos;adresse <strong>support@thebox-tactique.com</strong>.</> },
  ];

  const renderLegal = (intro: string, list: { title: string; body: React.ReactNode }[]) => (
    <article className="max-w-3xl mx-auto space-y-4">
      <div className={`p-4 rounded-2xl border ${th.cardMuted}`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.faint}`}>Dernière mise à jour : {lastUpdate}</p>
        <p className={`mt-1 text-sm font-semibold ${th.text}`}>{intro}</p>
      </div>
      {list.map((sec, i) => (
        <section key={sec.title} className={`p-5 rounded-2xl border ${th.card}`}>
          <h3 className={`text-sm font-black tracking-tight flex items-center gap-3 ${th.text}`}>
            <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-black tabular-nums shrink-0 ${th.accentChip}`}>{i + 1}</span>
            {sec.title}
          </h3>
          <div className={`mt-2.5 text-[13px] leading-6 ${th.body}`}>{sec.body}</div>
        </section>
      ))}
    </article>
  );

  return (
    <div className={`${premiumOverlay} z-[120]`}>
      <div className={`${premiumShell} w-full max-w-5xl h-[94vh] sm:h-[88vh] ${th.panel}`}>
        {!isModernSleek && (
          <div className="absolute -top-40 left-32 w-[460px] h-[300px] bg-[#00E599]/[0.05] rounded-full blur-3xl pointer-events-none" />
        )}

        {/* ================= SIDEBAR ================= */}
        <aside className={`hidden md:flex w-64 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${th.accentChip}`}>
                <LogoIcon className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.accent}`}>The Box</p>
                <p className={`text-sm font-black ${th.text}`}>Aide & informations</p>
              </div>
            </div>
          </div>

          <nav className="px-3 space-y-1">
            <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>Rubriques</p>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = current.id === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? th.navActive : th.navIdle}`}
                >
                  {isActive && <span className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${th.navIndicator}`} />}
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? th.accent : ""}`} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${th.chip}`}>{tab.short}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-3">
            <div className={`p-4 rounded-2xl border ${th.card}`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${th.accentChip}`}>
                <Mail className="h-4 w-4" />
              </div>
              <p className={`mt-3 text-xs font-black ${th.text}`}>Besoin d&apos;aide ?</p>
              <p className={`text-[11px] mt-0.5 leading-relaxed ${th.sub}`}>Notre équipe vous répond sous 24 h.</p>
              <button
                type="button"
                onClick={openSupport}
                className={`mt-3 w-full px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer ${th.primaryBtn}`}
              >
                Contacter le support
              </button>
            </div>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="flex-1 min-w-0 flex flex-col relative z-10">
          <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${th.border}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={`md:hidden text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${th.accent}`}>Aide & informations</p>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight ${th.text}`}>{current.title}</h2>
                <p className={`text-xs mt-1 ${th.sub}`}>{current.desc}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${th.ghostBtn}`}
                title="Fermer (Échap)"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Onglets mobiles */}
            <div className={`md:hidden mt-4 flex gap-1 p-1 rounded-xl border ${th.segment}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${current.id === tab.id ? th.segmentActive : th.segmentIdle}`}
                >
                  {tab.short}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 scrollbar-thin">
            {/* ---------- FAQ ---------- */}
            {current.id === "faq" && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="relative">
                  <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${th.faint}`} />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Rechercher une question (abonnement, export, live, rôles…)"
                    className={`w-full rounded-xl pl-10 pr-9 py-2.5 text-xs border outline-none transition ${th.input}`}
                  />
                  {faqSearch && (
                    <button
                      type="button"
                      onClick={() => setFaqSearch("")}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition cursor-pointer ${th.faint} hover:opacity-70`}
                      title="Effacer la recherche"
                      aria-label="Effacer la recherche"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className={`flex items-center gap-0.5 p-1 rounded-xl border overflow-x-auto scrollbar-none ${th.segment}`}>
                  {filterCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${isSelected ? th.segmentActive : th.segmentIdle}`}
                      >
                        {cat.label}
                        <span className={`tabular-nums text-[10px] ${isSelected ? th.accent : th.faint}`}>{cat.count}</span>
                      </button>
                    );
                  })}
                </div>

                {filteredFaqs.length === 0 ? (
                  <div className={`text-center py-12 rounded-2xl border ${th.card}`}>
                    <HelpCircle className={`w-6 h-6 mx-auto mb-2 ${th.faint}`} />
                    <p className={`text-xs font-semibold ${th.sub}`}>Aucune question ne correspond à votre recherche.</p>
                  </div>
                ) : (
                  <div className={`rounded-2xl border overflow-hidden divide-y ${th.card} ${th.divide}`}>
                    {filteredFaqs.map((faq) => {
                      const isOpenFaq = openFaqIds.includes(faq.id);
                      return (
                        <div key={faq.id}>
                          <button
                            type="button"
                            onClick={() => toggleFaq(faq.id)}
                            aria-expanded={isOpenFaq}
                            className={`w-full px-5 py-4 text-left flex items-start justify-between gap-4 cursor-pointer transition ${th.rowHover}`}
                          >
                            <span className="min-w-0">
                              <span className={`block text-[10px] font-black uppercase tracking-[0.14em] mb-1 ${th.faint}`}>{faq.category}</span>
                              <span className={`block text-sm font-bold ${th.text}`}>{faq.question}</span>
                            </span>
                            <ChevronDown className={`w-4 h-4 shrink-0 mt-4 transition-transform ${isOpenFaq ? `rotate-180 ${th.accent}` : th.faint}`} />
                          </button>
                          {isOpenFaq && (
                            <p className={`px-5 pb-5 -mt-1 text-[13px] leading-6 ${th.body}`}>{faq.answer}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Encart support (visible aussi sur mobile) */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${th.card}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${th.accentChip}`}>
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-black ${th.text}`}>Vous ne trouvez pas votre réponse ?</p>
                      <p className={`text-[11px] ${th.sub}`}>Notre équipe d&apos;assistance est là pour vous accompagner.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openSupport}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${th.primaryBtn}`}
                  >
                    Contacter le support
                  </button>
                </div>
              </div>
            )}

            {/* ---------- CGU ---------- */}
            {current.id === "cgu" && renderLegal(
              "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme web « The Box - Zone de décision tactique ».",
              cguSections
            )}

            {/* ---------- CGV ---------- */}
            {current.id === "cgv" && renderLegal(
              "Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les souscriptions d'abonnements payants sur la plateforme The Box.",
              cgvSections
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
