"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Search,
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
  Sparkles,
  Edit3,
  ShieldCheck,
  Eye,
  Film,
  Plus
} from "lucide-react";
import GuideMediaViewer from "./GuideMediaViewer";
import AdminGuideEditor from "./AdminGuideEditor";
import {
  GuideSectionItem,
  loadGuideSections,
  GUIDE_UPDATED_EVENT,
  getMediaType
} from "@/lib/userGuideData";
import { getPremiumTheme, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";

export interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isModernSleek?: boolean;
  isAdmin?: boolean;
  initialMode?: "reader" | "editor";
  initialSectionId?: string;
}

export function renderGuideIcon(iconName?: string, className: string = "w-4 h-4") {
  switch ((iconName || "").toLowerCase()) {
    case "compass":
      return <Compass className={`${className} text-[#00E599]`} />;
    case "layers":
      return <Layers className={`${className} text-emerald-400`} />;
    case "pentool":
      return <PenTool className={`${className} text-cyan-400`} />;
    case "award":
      return <Award className={`${className} text-amber-400`} />;
    case "sliders":
      return <Sliders className={`${className} text-sky-400`} />;
    case "play":
      return <Play className={`${className} text-violet-400`} />;
    case "users":
      return <Users className={`${className} text-rose-400`} />;
    case "timer":
      return <Timer className={`${className} text-rose-500`} />;
    case "cloud":
      return <Cloud className={`${className} text-blue-400`} />;
    case "download":
      return <Download className={`${className} text-[#00E599]`} />;
    case "keyboard":
      return <Keyboard className={`${className} text-amber-300`} />;
    case "sparkles":
      return <Sparkles className={`${className} text-amber-400`} />;
    case "shield":
      return <ShieldCheck className={`${className} text-emerald-400`} />;
    default:
      return <BookOpen className={`${className} text-[#00E599]`} />;
  }
}

export default function UserGuideModal({
  isOpen,
  onClose,
  isModernSleek = false,
  isAdmin = false,
  initialMode = "reader",
  initialSectionId = "section-1"
}: UserGuideModalProps) {
  const [sections, setSections] = useState<GuideSectionItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialSectionId);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"reader" | "editor">(initialMode);

  // Load sections on open
  useEffect(() => {
    if (!isOpen) return;
    const loaded = loadGuideSections();
    setSections(loaded);
    if (loaded.length > 0 && !loaded.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(loaded[0].id);
    }
  }, [isOpen]);

  // Sync mode and section when opened
  useEffect(() => {
    if (isOpen) {
      if (initialMode) setViewMode(initialMode);
      if (initialSectionId) setSelectedSectionId(initialSectionId);
    }
  }, [isOpen, initialMode, initialSectionId]);

  // Listen to external updates
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<GuideSectionItem[]>;
      if (customEvent.detail) {
        setSections(customEvent.detail);
      } else {
        setSections(loadGuideSections());
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(GUIDE_UPDATED_EVENT, handleUpdate);
      return () => {
        window.removeEventListener(GUIDE_UPDATED_EVENT, handleUpdate);
      };
    }
  }, []);

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
  const canEdit = isAdmin;
  const isEditor = canEdit && viewMode === "editor";

  const filteredSections = sections.filter((sec) => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = sec.title.toLowerCase().includes(query);
    const matchesSummary = sec.summary.toLowerCase().includes(query);
    const matchesContent = sec.content.some((c) =>
      c.paragraphs.some((p) => p.toLowerCase().includes(query)) ||
      (c.bullets && c.bullets.some((b) => b.toLowerCase().includes(query)))
    );
    return matchesTitle || matchesSummary || matchesContent;
  });

  const activeSection = sections.find((s) => s.id === selectedSectionId) || sections[0] || {
    id: "empty",
    number: "01",
    title: "Guide",
    summary: "",
    content: []
  };

  const activeIndex = sections.findIndex((s) => s.id === activeSection.id);
  const prevSection = activeIndex > 0 ? sections[activeIndex - 1] : null;
  const nextSection = activeIndex >= 0 && activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null;

  const badgeChip = (badge: string) =>
    badge === "PRO+" ? th.goldChip : th.accentChip;

  // En-tête commun aux modes lecture et édition
  const headerEl = (
      <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${th.border}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {isEditor ? (
              <>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${th.gold}`}>Mode édition</p>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight ${th.text}`}>Modifier le guide</h2>
                <p className={`text-xs mt-1 ${th.sub}`}>Textes, astuces et vidéos de démonstration de chaque article.</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.accent}`}>Section {activeSection.number}</p>
                  {activeSection.badge && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${badgeChip(activeSection.badge)}`}>{activeSection.badge}</span>
                  )}
                </div>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${th.text}`}>{activeSection.title}</h2>
                {activeSection.summary && <p className={`text-sm mt-1 ${th.sub}`}>{activeSection.summary}</p>}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <div className={`hidden sm:flex items-center gap-0.5 p-1 rounded-xl border ${th.segment}`}>
                <button
                  type="button"
                  onClick={() => setViewMode("reader")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${!isEditor ? th.segmentActive : th.segmentIdle}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Lecture
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("editor")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${isEditor ? th.segmentActive : th.segmentIdle}`}
                >
                  <Edit3 className={`w-3.5 h-3.5 ${th.gold}`} />
                  Édition
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition cursor-pointer ${th.ghostBtn}`}
              title="Fermer le guide (Échap)"
              aria-label="Fermer le guide"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sommaire mobile */}
        {!isEditor && (
          <select
            value={activeSection.id}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className={`md:hidden mt-4 w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${th.input} ${th.option}`}
            aria-label="Choisir un article"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>{sec.number} · {sec.title}</option>
            ))}
          </select>
        )}
      </header>
  );

  return (
    <div className={`${premiumOverlay} z-[70]`}>
      <div className={`${premiumShell} w-full max-w-[1400px] h-[94vh] sm:h-[90vh] ${th.panel}`}>
        {!isModernSleek && (
          <div className="absolute -top-40 left-40 w-[520px] h-[320px] bg-[#00E599]/[0.05] rounded-full blur-3xl pointer-events-none" />
        )}

        {/* ================= SIDEBAR : SOMMAIRE ================= */}
        {!isEditor && (
          <aside className={`hidden md:flex w-80 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
            <div className="px-5 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${th.accentChip}`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.accent}`}>The Box</p>
                  <p className={`text-sm font-black ${th.text}`}>Guide d&apos;utilisation</p>
                </div>
              </div>

              <div className="relative mt-5">
                <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${th.faint}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher (pressing, chrono, export…)"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition ${th.input}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-8 pb-2">
              <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>Sommaire</p>
              <p className={`text-[10px] font-bold tabular-nums ${th.faint}`}>{filteredSections.length} / {sections.length}</p>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin">
              {filteredSections.length === 0 && (
                <p className={`px-3 py-6 text-xs text-center ${th.sub}`}>Aucun article ne correspond à votre recherche.</p>
              )}
              {filteredSections.map((sec) => {
                const isSelected = sec.id === activeSection.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`relative w-full text-left px-3 py-2.5 rounded-xl border transition cursor-pointer flex items-center gap-3 ${isSelected ? th.navActive : th.navIdle}`}
                  >
                    {isSelected && <span className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${th.navIndicator}`} />}
                    <span className={`text-[10px] font-mono font-black w-5 shrink-0 tabular-nums ${isSelected ? th.accent : th.faint}`}>{sec.number}</span>
                    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${th.cardMuted}`}>
                      {renderGuideIcon(sec.iconName, "w-4 h-4")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold truncate">{sec.title}</span>
                      <span className={`block text-[10px] truncate mt-0.5 ${th.faint}`}>{sec.summary}</span>
                    </span>
                    {sec.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${badgeChip(sec.badge)}`}>{sec.badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* ================= MAIN ================= */}
        {isEditor ? (
          <AdminGuideEditor
            isModernSleek={isModernSleek}
            initialSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            onPreviewGuide={() => setViewMode("reader")}
            header={headerEl}
          />
        ) : (
        <main className="flex-1 min-w-0 flex flex-col relative z-10">
          {headerEl}

          {/* Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <article className="max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-8 space-y-7">
                {/* Vidéo de démonstration */}
                {activeSection.videoUrl && (
                  <div className={`rounded-2xl border overflow-hidden ${th.card}`}>
                    <div className={`px-4 py-3 border-b flex items-center justify-between ${th.border}`}>
                      <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] ${th.accent}`}>
                        <Film className="w-4 h-4" />
                        Démonstration
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${th.chip}`}>
                        {getMediaType(activeSection.videoUrl).toUpperCase()}
                      </span>
                    </div>
                    <div className="p-3">
                      <GuideMediaViewer
                        url={activeSection.videoUrl}
                        title={`Démonstration : ${activeSection.title}`}
                        className="max-h-[420px]"
                      />
                    </div>
                  </div>
                )}

                {activeSection.content.map((block, idx) => (
                  <section key={idx} className="space-y-3">
                    {block.subtitle && (
                      <h3 className={`text-base font-black tracking-tight flex items-center gap-2.5 ${th.text}`}>
                        <span className={`w-1.5 h-5 rounded-full ${th.accentDot}`} />
                        {block.subtitle}
                      </h3>
                    )}

                    {block.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className={`text-sm sm:text-[15px] leading-7 ${th.body}`}>{p}</p>
                    ))}

                    {block.bullets && block.bullets.length > 0 && (
                      <ul className="space-y-2">
                        {block.bullets.map((b, bIdx) => (
                          <li key={bIdx} className={`text-sm sm:text-[15px] leading-7 flex items-start gap-2.5 ${th.body}`}>
                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-1.5 ${th.accent}`} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {block.tip && (
                      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isModernSleek
                        ? "bg-gradient-to-br from-amber-50 to-white border-amber-200"
                        : "bg-gradient-to-br from-[#d4af37]/[0.10] to-transparent border-[#d4af37]/25"
                        }`}>
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${th.goldTile}`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="text-sm leading-relaxed">
                          <p className={`text-[10px] font-black uppercase tracking-[0.14em] mb-0.5 ${th.gold}`}>Astuce pro</p>
                          <p className={th.body}>{block.tip}</p>
                        </div>
                      </div>
                    )}
                  </section>
                ))}

                {/* Navigation précédent / suivant */}
                {(prevSection || nextSection) && (
                  <div className={`pt-6 border-t grid grid-cols-2 gap-3 ${th.border}`}>
                    {prevSection ? (
                      <button
                        type="button"
                        onClick={() => setSelectedSectionId(prevSection.id)}
                        className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${th.selectable}`}
                      >
                        <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.faint}`}>← Précédent</p>
                        <p className={`text-xs font-bold truncate mt-0.5 ${th.text}`}>{prevSection.title}</p>
                      </button>
                    ) : <span />}
                    {nextSection && (
                      <button
                        type="button"
                        onClick={() => setSelectedSectionId(nextSection.id)}
                        className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${th.selectable}`}
                      >
                        <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.accent}`}>Suivant →</p>
                        <p className={`text-xs font-bold truncate mt-0.5 ${th.text}`}>{nextSection.title}</p>
                      </button>
                    )}
                  </div>
                )}
              </article>
            </div>
        </main>
        )}
      </div>
    </div>
  );
}
