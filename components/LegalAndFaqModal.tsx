"use client";

import React, { useState } from "react";
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
    answer: "Toute création de compte bénéficie automatiquement d'une période d'essai gratuite complète de 14 jours donnant accès à toutes les fonctionnalités de la formule PRO sans engagement et sans carte bancaire requise à l'inscription."
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

  if (!isOpen) return null;

  const categories = ["Toutes", "Général", "Abonnements & Tarifs", "Utilisation & Fonctionnalités", "Sécurité & Données"];

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

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto border ${isModernSleek ? "bg-white border-slate-200 text-slate-800" : "bg-[#0d1117] border-[#1b2436] text-slate-200"
        }`}>

        {/* HEADER */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between gap-4 ${isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#090d14] border-[#1b2436] text-white"
          }`}>
          <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 text-[#00E599]" />
            <div>
              <h2 className={`text-lg font-black flex items-center gap-2 ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                The Box <span className="text-[#00E599] text-xs font-bold uppercase tracking-widest bg-[#00E599]/10 px-2 py-0.5 rounded border border-[#00E599]/30">Informations & Légal</span>
              </h2>
              <p className={`text-xs ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>CGU, CGV & Foire Aux Questions des utilisateurs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1b2436]"
              }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className={`border-b px-5 pt-3 flex gap-2 overflow-x-auto ${isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#121824] border-[#1b2436]"
          }`}>
          <button
            onClick={() => setActiveTab("faq")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${activeTab === "faq"
              ? isModernSleek ? "bg-white text-emerald-700 border-emerald-500" : "bg-[#0d1117] text-[#00E599] border-[#00E599]"
              : isModernSleek ? "text-slate-500 hover:text-slate-900 border-transparent" : "text-slate-400 hover:text-white border-transparent"
              }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Foire Aux Questions (FAQ)</span>
          </button>

          <button
            onClick={() => setActiveTab("cgu")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${activeTab === "cgu"
              ? isModernSleek ? "bg-white text-emerald-700 border-emerald-500" : "bg-[#0d1117] text-[#00E599] border-[#00E599]"
              : isModernSleek ? "text-slate-500 hover:text-slate-900 border-transparent" : "text-slate-400 hover:text-white border-transparent"
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>CGU (Conditions Générales d&apos;Utilisation)</span>
          </button>

          <button
            onClick={() => setActiveTab("cgv")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition cursor-pointer border-b-2 ${activeTab === "cgv"
              ? isModernSleek ? "bg-white text-emerald-700 border-emerald-500" : "bg-[#0d1117] text-[#00E599] border-[#00E599]"
              : isModernSleek ? "text-slate-500 hover:text-slate-900 border-transparent" : "text-slate-400 hover:text-white border-transparent"
              }`}
          >
            <Scale className="w-4 h-4" />
            <span>CGV (Conditions Générales de Vente)</span>
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className={`p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 text-sm leading-relaxed ${isModernSleek ? "bg-slate-50 text-slate-800" : "bg-[#0d1117] text-slate-300"
          }`}>

          {/* TAB 1: FAQ */}
          {activeTab === "faq" && (
            <div className="space-y-6">

              {/* Search & Filter bar */}
              <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-xl border ${isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#141c2b] border-[#1b2436]"
                }`}>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Rechercher une question..."
                    className={`w-full rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none border ${isModernSleek
                        ? "bg-white border-slate-300 text-slate-900 focus:border-emerald-600 placeholder-slate-400"
                        : "bg-[#0d1117] border-[#233149] text-white focus:border-[#00E599] placeholder-slate-500"
                      }`}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${selectedCategory === cat
                        ? isModernSleek ? "bg-emerald-600 text-white" : "bg-[#00E599] text-[#0d1117]"
                        : isModernSleek
                          ? "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
                          : "bg-[#0d1117] text-slate-400 hover:text-white hover:bg-[#1f2d42]"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accordion FAQ List */}
              <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className={`text-center py-10 rounded-xl border ${isModernSleek ? "bg-white border-slate-200 text-slate-600" : "bg-[#121824] border-[#1b2436] text-slate-400"
                    }`}>
                    <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold">Aucune question ne correspond à votre recherche.</p>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isOpenFaq = openFaqIds.includes(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-xl overflow-hidden transition duration-150 border ${isModernSleek
                            ? "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                            : "bg-[#121824] border-[#1b2436] hover:border-[#2b3a55]"
                          }`}
                      >
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className={`w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer transition ${isModernSleek
                              ? "bg-white hover:bg-slate-50 text-slate-900"
                              : "bg-[#121824] hover:bg-[#182133] text-white"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${isModernSleek
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-[#00E599] bg-[#00E599]/10 border-[#00E599]/20"
                              }`}>
                              {faq.category}
                            </span>
                            <span className={`font-bold text-xs sm:text-sm ${isModernSleek ? "text-slate-900" : "text-white"
                              }`}>{faq.question}</span>
                          </div>
                          {isOpenFaq ? (
                            <ChevronUp className={`w-4 h-4 shrink-0 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isOpenFaq && (
                          <div className={`px-4 pb-4 pt-2 text-xs border-t ${isModernSleek
                              ? "border-slate-100 bg-slate-50/70 text-slate-700"
                              : "border-[#1b2436]/60 bg-[#0d1117]/80 text-slate-300"
                            }`}>
                            <p className="leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Assistance Box */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 ${isModernSleek
                  ? "bg-emerald-50/80 border-emerald-200 text-slate-900"
                  : "bg-gradient-to-r from-[#00E599]/10 via-[#121824] to-[#121824] border-[#00E599]/30"
                }`}>
                <div className="flex items-center gap-3">
                  <Mail className={`w-6 h-6 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} />
                  <div>
                    <h4 className={`text-xs font-black ${isModernSleek ? "text-slate-900" : "text-white"}`}>Vous ne trouvez pas votre réponse ?</h4>
                    <p className={`text-[11px] ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Notre équipe d&apos;assistance est disponible pour vous accompagner.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSupport) {
                      onOpenSupport();
                    } else {
                      window.location.href = "mailto:pixup.agence@gmail.com?subject=%5BSupport%5D%20Demande%20d'assistance";
                    }
                  }}
                  className={`px-4 py-2 font-black text-xs rounded-lg transition cursor-pointer shrink-0 ${isModernSleek
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      : "bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117]"
                    }`}
                >
                  Contacter le support
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: CGU */}
          {activeTab === "cgu" && (
            <div className="space-y-6 text-xs text-slate-300">
              <div className="bg-[#121824] p-4 rounded-xl border border-[#1b2436] mb-4">
                <p className="text-slate-400 italic">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                <p className="mt-1 font-semibold text-white">Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme web « The Box - Zone de décision tactique ».</p>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  1. Objet et Présentation du Service
                </h3>
                <p>
                  La plateforme <strong>The Box</strong> est un service SaaS d&apos;animation tactique, de gestion d&apos;effectifs et de préparation de séances sportives destiné aux entraîneurs, éducateurs et clubs sportifs. L&apos;accès au service implique l&apos;acceptation pleine et entière des présentes CGU par l&apos;utilisateur.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  2. Accès au Service et Création de Compte
                </h3>
                <p>
                  L&apos;accès aux fonctionnalités avancées nécessite la création d&apos;un compte utilisateur sécurisé. L&apos;utilisateur s&apos;engage à fournir des informations exactes et à préserver la confidentialité de ses identifiants de connexion. Toute action effectuée depuis son compte est présumée être réalisée par l&apos;utilisateur titulaire.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  3. Propriété Intellectuelle
                </h3>
                <p>
                  L&apos;ensemble de l&apos;application (interface, visuels, moteurs d&apos;animation, terrains vectoriels, codes sources et marques « The Box ») est la propriété exclusive de l&apos;éditeur. L&apos;utilisateur conserve la propriété intellectuelle de ses contenus créés (schémas tactiques, compositions et notes personnelles), mais concède à la plateforme une licence technique nécessaire au stockage et à la restitution du service.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  4. Protection des Données Personnelles (RGPD)
                </h3>
                <p>
                  Conformément au Règlement Général sur la Protection des Données (RGPD), The Box s&apos;engage à protéger la vie privée des entraîneurs et de leurs effectifs. Les données collectées (nom, email, effectifs du club) sont uniquement utilisées pour l&apos;exécution du service et ne sont en aucun cas vendues ou cédées à des tiers. Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression via support@thebox-tactique.com.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  5. Disponibilité et Responsabilité
                </h3>
                <p>
                  The Box met en œuvre tous les moyens raisonnables pour assurer un accès continu et fluide au service 24h/24 et 7j/7. Néanmoins, l&apos;accès peut être temporairement interrompu pour des raisons de maintenance technique ou de mise à jour des terrains. L&apos;éditeur ne saurait être tenu responsable des pertes indirectes liées à une interruption momentanée du réseau internet.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  6. Modification des CGU
                </h3>
                <p>
                  L&apos;éditeur se réserve le droit de modifier les présentes CGU à tout moment afin de les adapter aux évolutions réglementaires et techniques. Les utilisateurs seront informés de toute modification majeure lors de leur connexion.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: CGV */}
          {activeTab === "cgv" && (
            <div className="space-y-6 text-xs text-slate-300">
              <div className="bg-[#121824] p-4 rounded-xl border border-[#1b2436] mb-4">
                <p className="text-slate-400 italic">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                <p className="mt-1 font-semibold text-white">Les présentes Conditions Générales de Vente (CGV) s&apos;appliquent à toutes les souscriptions d&apos;abonnements payants sur la plateforme The Box.</p>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  1. Offres et Tarifications
                </h3>
                <p>The Box propose trois formules d&apos;accès :</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-300">
                  <li><strong>Formule Gratuite :</strong> Accès de base au tableau tactique 2D, gestion d&apos;effectif et exports PNG (0.00 €/mois).</li>
                  <li><strong>Formule PRO :</strong> Accès multi-équipes, sauvegarde illimitée des schémas, préparation de l&apos;équipe adverse et causeries vocales (9.90 €/mois TTC).</li>
                  <li><strong>Formule PRO+ :</strong> Toutes les fonctionnalités PRO + activation du mode Live Match en direct avec chronomètre et statistiques (14.90 €/mois TTC).</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  2. Période d&apos;Essai Gratuite
                </h3>
                <p>
                  Tout nouveau compte bénéficie automatiquement d&apos;une période d&apos;essai gratuite de 7 jours aux fonctionnalités de la formule PRO. À l&apos;issue des 7 jours, l&apos;utilisateur repasse automatiquement en Formule Gratuite sans aucuns frais prélevés si aucun abonnement payant n&apos;a été activé.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  3. Modalités de Paiement
                </h3>
                <p>
                  Les paiements s&apos;effectuent de manière mensuelle et récurrente par Carte Bancaire via une infrastructure de paiement hautement sécurisée et chiffrée. L&apos;abonnement est prélevé à la date anniversaire de la souscription.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  4. Sans Engagement & Résiliation
                </h3>
                <p>
                  Tous nos abonnements payants sont strictement <strong>sans engagement de durée</strong>. Vous pouvez mettre fin à votre renouvellement automatique à tout moment en un clic dans votre espace utilisateur. La résiliation prend effet à la fin de la période mensuelle en cours.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  5. Droit de Rétractation
                </h3>
                <p>
                  Conformément aux dispositions de l&apos;article L.221-18 du Code de la Consommation, vous disposez d&apos;un délai de rétractation de 14 jours à compter de la souscription initiale pour annuler votre contrat et en demander le remboursement intégral en contactant support@thebox-tactique.com.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599]"></span>
                  6. Support Client et Facturation
                </h3>
                <p>
                  Pour toute question concernant vos factures ou votre abonnement, notre service client est disponible par courrier électronique à l&apos;adresse <strong>support@thebox-tactique.com</strong>.
                </p>
              </section>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-[#090d14] border-t border-[#1b2436] flex items-center justify-between text-xs text-slate-400">
          <span>The Box - Zone de décision tactique</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1f2d42] hover:bg-[#2b3d59] text-white font-bold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
