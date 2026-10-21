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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-3 md:p-4 animate-fade-in">
      <div
        className={`w-full max-w-[1560px] h-[95vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${
          isModernSleek
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-[#0b0e14] border-[#1e293b] text-white"
        }`}
      >
        {/* HEADER */}
        <div
          className={`px-5 sm:px-7 py-3.5 border-b flex items-center justify-between shrink-0 flex-wrap gap-3 ${
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
                <span className="text-[9px] font-mono font-bold text-slate-400">
                  {sections.length} articles
                </span>
              </div>
              <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                Toutes les grandes fonctionnalités expliquées &bull; Modification directe des textes et vidéos
              </p>
            </div>
          </div>

          {/* MODE SWITCHER (LECTURE / ÉDITEUR ADMIN) & CLOSE */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center p-1 rounded-xl border ${
              isModernSleek ? "bg-slate-200/80 border-slate-300" : "bg-[#070a10] border-[#1b2436]"
            }`}>
              <button
                type="button"
                onClick={() => setViewMode("reader")}
                className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                  viewMode === "reader"
                    ? "bg-[#00E599] text-[#07090e] shadow-sm shadow-[#00E599]/20"
                    : isModernSleek
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Mode Lecture</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("editor")}
                className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                  viewMode === "editor"
                    ? "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-sm"
                    : "text-amber-400 hover:text-amber-300"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Mode Édition</span>
              </button>
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
        </div>

        {/* BODY (RENDER EITHER THE FULL EDITOR OR THE SPACIOUS READER) */}
        {viewMode === "editor" ? (
          /* =================================================== */
          /* MODE ÉDITEUR ADMINISTRATEUR (INTEGRATED FULLY HERE) */
          /* =================================================== */
          <div className={`flex-1 overflow-hidden p-3 sm:p-5 flex flex-col min-h-0 ${
            isModernSleek ? "bg-slate-50" : "bg-[#080b10]"
          }`}>
            <AdminGuideEditor
              isModernSleek={isModernSleek}
              initialSectionId={selectedSectionId}
              onPreviewGuide={() => setViewMode("reader")}
            />
          </div>
        ) : (
          /* =================================================== */
          /* MODE LECTURE (ENLARGED & HIGHLY LEGIBLE)            */
          /* =================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* SEARCH STRIP */}
            <div
              className={`px-6 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
                isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e131d] border-[#1b2436]"
              }`}
            >
              <div className="relative w-full max-w-md">
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
            </div>

            {/* SPLIT LIST & CONTENT */}
            <div className="flex-1 flex overflow-hidden">
              {/* NAVIGATION SIDEBAR */}
              <div
                className={`w-80 sm:w-96 border-r overflow-y-auto shrink-0 p-3.5 space-y-1.5 scrollbar-thin ${
                  isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1b2436]"
                }`}
              >
                {filteredSections.map((sec) => {
                  const isSelected = sec.id === activeSection.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`w-full text-left p-3 rounded-2xl transition cursor-pointer flex items-center justify-between border ${
                        isSelected
                          ? isModernSleek
                            ? "bg-white border-emerald-500 shadow-sm text-slate-900"
                            : "bg-[#141b29] border-[#00E599] text-white shadow-md shadow-[#00E599]/10"
                          : isModernSleek
                          ? "bg-transparent border-transparent text-slate-600 hover:bg-slate-200/60"
                          : "bg-transparent border-transparent text-slate-400 hover:bg-[#111827] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-black text-slate-500 shrink-0">
                          {sec.number}
                        </span>
                        <div className="p-2 rounded-xl bg-black/20 shrink-0">
                          {renderGuideIcon(sec.iconName, "w-4 h-4")}
                        </div>
                        <div className="truncate min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate">{sec.title}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{sec.summary}</p>
                        </div>
                      </div>
                      {sec.badge && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ml-2 shrink-0 ${
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
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin">
                {/* SECTION HEADER */}
                <div className="border-b pb-5 border-[#1f293d]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00E599] uppercase tracking-wider mb-1.5">
                    <span>Section {activeSection.number}</span>
                    {activeSection.badge && (
                      <span className="text-[10px] bg-[#00E599]/20 px-2.5 py-0.5 rounded-full border border-[#00E599]/40 font-black">
                        {activeSection.badge}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
                    {activeSection.title}
                  </h1>
                  <p className={`text-sm sm:text-base mt-1.5 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                    {activeSection.summary}
                  </p>
                </div>

                {/* DÉMONSTRATION VIDÉO EN DIRECT DE LA FONCTIONNALITÉ */}
                {activeSection.videoUrl && (
                  <div
                    className={`rounded-2xl overflow-hidden border p-4 shadow-xl ${
                      isModernSleek
                        ? "bg-slate-50 border-slate-200"
                        : "bg-[#080d15] border-[#1e293b]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-black text-[#00E599] uppercase tracking-wider">
                        <Film className="w-4 h-4" />
                        <span>Démonstration Vidéo en Direct</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono bg-black/40 px-2.5 py-0.5 rounded-full border border-white/5">
                        Type : {getMediaType(activeSection.videoUrl).toUpperCase()}
                      </span>
                    </div>

                    <GuideMediaViewer
                      url={activeSection.videoUrl}
                      title={`Démonstration : ${activeSection.title}`}
                      className="max-h-[420px]"
                    />
                  </div>
                )}

                {/* SECTION CONTENT BLOCKS */}
                <div className="space-y-7">
                  {activeSection.content.map((block, idx) => (
                    <div key={idx} className="space-y-3.5">
                      {block.subtitle && (
                        <h3 className="text-base font-black text-white flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#00E599]" />
                          <span>{block.subtitle}</span>
                        </h3>
                      )}

                      {block.paragraphs.map((p, pIdx) => (
                        <p
                          key={pIdx}
                          className={`text-sm sm:text-base leading-relaxed ${
                            isModernSleek ? "text-slate-700" : "text-slate-300"
                          }`}
                        >
                          {p}
                        </p>
                      ))}

                      {block.bullets && block.bullets.length > 0 && (
                        <ul className="space-y-2.5 pl-2">
                          {block.bullets.map((b, bIdx) => (
                            <li
                              key={bIdx}
                              className={`text-sm sm:text-base flex items-start gap-2.5 ${
                                isModernSleek ? "text-slate-700" : "text-slate-300"
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#00E599] shrink-0 mt-1" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {block.tip && (
                        <div
                          className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
                            isModernSleek
                              ? "bg-amber-50 border-amber-200 text-amber-900"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                          }`}
                        >
                          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
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
          </div>
        )}

        {/* FOOTER */}
        <div
          className={`px-6 py-3.5 border-t flex items-center justify-between shrink-0 text-xs ${
            isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#0d121b] border-[#1b2436]"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">
              TheBox &bull; Guide d&apos;utilisation interactif
            </span>
            <span className="text-[#00E599] font-bold text-xs hidden sm:inline">
              &bull; Édition des articles et vidéos intégrée
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#00E599] text-[#07090e] font-black hover:bg-[#05c482] transition cursor-pointer shadow-md shadow-[#00E599]/20"
            >
              Fermer le guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
