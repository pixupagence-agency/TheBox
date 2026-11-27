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
  Building2,
  FileLock2,
} from "lucide-react";
import LogoIcon from "./LogoIcon";
import LegalText from "./legal/LegalText";
import { getPremiumTheme, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";
import { LEGAL_DOC_IDS, LEGAL_DOC_META, type LegalDocId, type LegalDocument } from "@/lib/legal/documents";
import { subscribeLegalDocument } from "@/lib/legal/store";
import { FAQ_CATEGORIES, FAQ_CATEGORY_SHORT, subscribeFaq, type PublishedFaq } from "@/lib/faq";

export type LegalTab = "faq" | LegalDocId;

const LEGAL_ICONS: Record<LegalDocId, React.ElementType> = {
  mentions: Building2,
  cgu: FileText,
  cgv: Scale,
  privacy: Lock,
  dpa: FileLock2,
};

/** Document légal publié (suivi en direct), null pendant le chargement */
function useLegalDocument(id: LegalDocId | null): LegalDocument | null {
  const [state, setState] = useState<{ id: LegalDocId; doc: LegalDocument } | null>(null);
  useEffect(() => {
    if (!id) return;
    return subscribeLegalDocument(id, (doc) => setState({ id, doc }));
  }, [id]);
  return state && state.id === id ? state.doc : null;
}

interface LegalAndFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: LegalTab;
  onOpenSupport?: () => void;
  isModernSleek?: boolean;
}

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
  const legalId = isOpen && activeTab !== "faq" ? activeTab : null;
  const legalDoc = useLegalDocument(legalId);

  // FAQ publiée par l'administrateur (app_config/faq), suivie pendant l'ouverture
  const [publishedFaq, setPublishedFaq] = useState<PublishedFaq | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    return subscribeFaq(setPublishedFaq);
  }, [isOpen]);
  const FAQ_DATA = publishedFaq?.items ?? [];

  // Ouvre sur l'onglet demandé à chaque ouverture (ajusté pendant le rendu, sans effet)
  const openKey = isOpen ? defaultTab : null;
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey) setActiveTab(openKey);
  }

  // Fermeture au clavier (Échap)
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
    ...FAQ_CATEGORIES.map((c) => ({ id: c, label: FAQ_CATEGORY_SHORT[c], count: FAQ_DATA.filter((f) => f.category === c).length })),
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

  const tabs: { id: LegalTab; label: string; short: string; title: string; desc: string; icon: React.ElementType }[] = [
    { id: "faq", label: "Foire aux questions", short: "FAQ", title: "Foire aux questions", desc: "Les réponses aux questions les plus fréquentes des coachs.", icon: HelpCircle },
    ...LEGAL_DOC_IDS.map((id) => ({ id, ...LEGAL_DOC_META[id], icon: LEGAL_ICONS[id] })),
  ];
  const current = tabs.find((x) => x.id === activeTab) || tabs[0];

  const renderLegal = (doc: LegalDocument | null) => {
    if (!doc) {
      return (
        <div className={`max-w-3xl mx-auto py-16 text-center text-xs font-semibold ${th.sub}`} role="status">
          Chargement du document…
        </div>
      );
    }
    const updated = doc.updatedAt
      ? new Date(doc.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : null;
    return (
      <article className="max-w-3xl mx-auto space-y-4" data-testid={`legal-doc-${doc.id}`}>
        <div className={`p-4 rounded-2xl border ${th.cardMuted}`}>
          <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.faint}`}>
            {updated ? <>Dernière mise à jour : {updated}{doc.version > 0 && <> · version {doc.version}</>}</> : "Version initiale"}
          </p>
          {doc.intro && <p className={`mt-1 text-sm font-semibold ${th.text}`}>{doc.intro}</p>}
        </div>
        {doc.sections.map((sec, i) => (
          <section key={sec.id} className={`p-5 rounded-2xl border ${th.card}`}>
            <h3 className={`text-sm font-black tracking-tight flex items-center gap-3 ${th.text}`}>
              <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-black tabular-nums shrink-0 ${th.accentChip}`}>{i + 1}</span>
              {sec.title}
            </h3>
            <div className={`mt-2.5 text-[13px] leading-6 ${th.body}`}>
              <LegalText
                text={sec.body}
                bulletClass={isModernSleek ? "bg-emerald-500" : "bg-[#00E599]"}
                placeholderClass={isModernSleek ? "bg-amber-100 text-amber-900" : "bg-amber-400/20 text-amber-200"}
              />
            </div>
          </section>
        ))}
      </article>
    );
  };

  return (
    <div className={`${premiumOverlay} z-[120]`}>
      <div role="dialog" aria-modal="true" aria-label="Aide & informations" className={`${premiumShell} w-full max-w-5xl h-[94vh] sm:h-[88vh] ${th.panel}`}>
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
                  {tab.short.length <= 8 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${th.chip}`}>{tab.short}</span>
                  )}
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
            <div className={`md:hidden mt-4 flex gap-1 p-1 rounded-xl border overflow-x-auto scrollbar-none ${th.segment}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${current.id === tab.id ? th.segmentActive : th.segmentIdle}`}
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

            {/* ---------- Documents légaux (modifiables dans la console admin) ---------- */}
            {current.id !== "faq" && renderLegal(legalDoc)}
          </div>
        </main>
      </div>
    </div>
  );
}
