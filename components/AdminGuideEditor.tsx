"use client";

import React, { useState, useEffect } from "react";
import {
  GuideSectionItem,
  GuideSectionContentBlock,
  loadGuideSections,
  saveGuideSections,
  resetGuideSections,
  DEFAULT_GUIDE_SECTIONS,
  getMediaType
} from "@/lib/userGuideData";
import GuideMediaViewer from "./GuideMediaViewer";
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Film,
  Type,
  FileText,
  Search,
  ExternalLink,
  Upload,
  ArrowUp,
  ArrowDown,
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
  Eye,
  HelpCircle
} from "lucide-react";

interface AdminGuideEditorProps {
  isModernSleek?: boolean;
  initialSectionId?: string;
  onPreviewGuide?: () => void;
}

const AVAILABLE_ICONS = [
  { id: "compass", name: "Boussole", icon: Compass },
  { id: "layers", name: "Calques / Terrain", icon: Layers },
  { id: "pentool", name: "Dessin / Tracés", icon: PenTool },
  { id: "award", name: "Trophée / Rôles", icon: Award },
  { id: "sliders", name: "Réglages / Vues", icon: Sliders },
  { id: "play", name: "Lecture / Vidéo", icon: Play },
  { id: "users", name: "Effectif / Joueurs", icon: Users },
  { id: "timer", name: "Chrono / Live", icon: Timer },
  { id: "cloud", name: "Cloud / Sauvegarde", icon: Cloud },
  { id: "download", name: "Export / Partage", icon: Download },
  { id: "keyboard", name: "Clavier / Raccourcis", icon: Keyboard },
  { id: "sparkles", name: "Étincelles / IA", icon: Sparkles },
  { id: "book", name: "Guide / Manuel", icon: BookOpen }
];

const PRESET_MEDIA = [
  { label: "Capture Terrain & Tracés (WebP)", url: "/images/guide/capture-terrain-et-outils.webp" },
  { label: "Parcours Coach Tactique (WebP)", url: "/images/guide/parcours-coach-tactique.webp" },
  { label: "Session Complète & Navigation (WebP)", url: "/images/guide/session-complete-navigation.webp" },
  { label: "Interface Terrain Tactique (PNG)", url: "/images/guide/interface-terrain-tactique.png" },
  { label: "Démo YouTube (Exemple)", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
];

export default function AdminGuideEditor({
  isModernSleek = false,
  initialSectionId,
  onPreviewGuide
}: AdminGuideEditorProps) {
  const [sections, setSections] = useState<GuideSectionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Load sections on mount
  useEffect(() => {
    const loaded = loadGuideSections();
    setSections(loaded);
    if (loaded.length > 0) {
      if (initialSectionId && loaded.some((s) => s.id === initialSectionId)) {
        setSelectedId(initialSectionId);
      } else {
        setSelectedId(loaded[0].id);
      }
    }
  }, [initialSectionId]);

  const currentSection = sections.find((s) => s.id === selectedId) || sections[0];

  // Update a field of current section
  const handleUpdateCurrentSection = <K extends keyof GuideSectionItem>(
    key: K,
    value: GuideSectionItem[K]
  ) => {
    if (!currentSection) return;
    const updated = sections.map((sec) =>
      sec.id === currentSection.id ? { ...sec, [key]: value } : sec
    );
    setSections(updated);
  };

  // Content block updates
  const handleUpdateBlock = (blockIndex: number, updatedBlock: GuideSectionContentBlock) => {
    if (!currentSection) return;
    const newContent = [...currentSection.content];
    newContent[blockIndex] = updatedBlock;
    handleUpdateCurrentSection("content", newContent);
  };

  const handleAddBlock = () => {
    if (!currentSection) return;
    const newBlock: GuideSectionContentBlock = {
      subtitle: "Nouveau sous-titre",
      paragraphs: ["Rédigez ici le paragraphe explicatif."],
      bullets: [],
      tip: ""
    };
    handleUpdateCurrentSection("content", [...currentSection.content, newBlock]);
  };

  const handleRemoveBlock = (blockIndex: number) => {
    if (!currentSection || currentSection.content.length <= 1) {
      alert("Chaque article doit comporter au moins un bloc de contenu.");
      return;
    }
    const newContent = currentSection.content.filter((_, idx) => idx !== blockIndex);
    handleUpdateCurrentSection("content", newContent);
  };

  // Save all to localStorage
  const handleSaveAll = () => {
    saveGuideSections(sections);
    setSaveStatus("Guide sauvegardé avec succès ! Tous les utilisateurs verront cette version.");
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Reset to default sections
  const handleReset = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'ensemble du guide aux 11 articles d'origine de TheBox ? Toutes vos modifications personnalisées seront effacées.")) {
      const def = resetGuideSections();
      setSections(def);
      setSelectedId(def[0].id);
      setSaveStatus("Le guide a été réinitialisé aux valeurs officielles !");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Create new section
  const handleCreateSection = () => {
    const nextNumber = String(sections.length + 1).padStart(2, "0");
    const newSec: GuideSectionItem = {
      id: `section-custom-${Date.now()}`,
      number: nextNumber,
      title: "Nouvel article du guide",
      iconName: "book",
      summary: "Résumé de la nouvelle fonctionnalité pour les coachs.",
      badge: "Nouveau",
      videoUrl: "/images/guide/capture-terrain-et-outils.webp",
      content: [
        {
          subtitle: "Présentation générale",
          paragraphs: [
            "Explication détaillée de la fonctionnalité et son utilité dans la préparation tactique."
          ],
          bullets: [
            "Point clé numéro 1",
            "Point clé numéro 2"
          ],
          tip: "Astuce pratique pour optimiser l'utilisation de cet outil."
        }
      ]
    };

    const nextSections = [...sections, newSec];
    setSections(nextSections);
    setSelectedId(newSec.id);
  };

  // Delete section
  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert("Le guide doit comporter au moins un article.");
      return;
    }
    if (window.confirm("Voulez-vous vraiment supprimer cet article du guide ?")) {
      const filtered = sections.filter((s) => s.id !== id);
      setSections(filtered);
      setSelectedId(filtered[0].id);
    }
  };

  // Move section up or down
  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Re-index numbers
    const renumbered = newSections.map((sec, idx) => ({
      ...sec,
      number: String(idx + 1).padStart(2, "0")
    }));
    setSections(renumbered);
  };

  // Handle local media file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Le fichier sélectionné dépasse 25 Mo. Pour les vidéos volumineuses, privilégiez un lien direct MP4 ou YouTube.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        handleUpdateCurrentSection("videoUrl", dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredSections = sections.filter((s) =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.number.includes(searchFilter) ||
    s.summary.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* TOP NOTIFICATION BAR */}
      {saveStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00E599]" />
            <span>{saveStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* ACTION BAR */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-sm ${
        isModernSleek ? "bg-white border-slate-200" : "bg-[#0f141d] border-[#1e293d]"
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#00E599]/15 border border-[#00E599]/30 text-[#00E599]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-black flex items-center gap-2 ${isModernSleek ? "text-slate-900" : "text-white"}`}>
              <span>Éditeur Officiel du Guide Utilisateur</span>
              <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase">
                Admin
              </span>
            </h3>
            <p className={`text-xs ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
              Modifiez en temps réel les vidéos (MP4, YouTube, WebP) et les textes de chaque article.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCreateSection}
            className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvel Article</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-slate-500/15 hover:bg-slate-500/25 text-slate-300 border border-slate-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Réinitialiser l'ensemble du guide par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser par défaut</span>
          </button>

          {onPreviewGuide && (
            <button
              type="button"
              onClick={onPreviewGuide}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ouvrir le Guide</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-1.5 rounded-xl bg-[#00E599] hover:bg-[#05c482] text-[#07090e] text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#00E599]/20 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer Tout</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: LIST OF ARTICLES */}
        <div className={`lg:col-span-4 rounded-2xl border flex flex-col overflow-hidden ${
          isModernSleek ? "bg-white border-slate-200" : "bg-[#0b0e14] border-[#1e293b]"
        }`}>
          {/* SEARCH & COUNT HEADER */}
          <div className={`p-3 border-b flex items-center justify-between gap-2 shrink-0 ${
            isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e131d] border-[#1b2436]"
          }`}>
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrer les articles..."
                className={`w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border outline-none ${
                  isModernSleek
                    ? "bg-white border-slate-300 text-slate-900"
                    : "bg-[#07090e] border-[#1f293d] text-white focus:border-[#00E599]"
                }`}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
              {sections.length} article(s)
            </span>
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {filteredSections.map((sec, idx) => {
              const isSelected = sec.id === currentSection?.id;
              return (
                <div
                  key={sec.id}
                  className={`group rounded-xl border p-2.5 transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? isModernSleek
                        ? "bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm"
                        : "bg-[#141b29] border-[#00E599] text-white shadow-md shadow-[#00E599]/10"
                      : isModernSleek
                      ? "bg-transparent border-transparent hover:bg-slate-100 text-slate-700"
                      : "bg-transparent border-transparent hover:bg-[#111827] text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setSelectedId(sec.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono font-black text-slate-500 shrink-0">
                      {sec.number}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{sec.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{sec.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    {sec.badge && (
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {sec.badge}
                      </span>
                    )}

                    {/* REORDER BUTTONS */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(idx, "up");
                      }}
                      disabled={idx === 0}
                      className="p-1 hover:text-white disabled:opacity-20 text-slate-500"
                      title="Monter d'un rang"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(idx, "down");
                      }}
                      disabled={idx === sections.length - 1}
                      className="p-1 hover:text-white disabled:opacity-20 text-slate-500"
                      title="Descendre d'un rang"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ARTICLE EDITOR */}
        <div className={`lg:col-span-8 rounded-2xl border flex flex-col overflow-hidden ${
          isModernSleek ? "bg-white border-slate-200" : "bg-[#0b0e14] border-[#1e293b]"
        }`}>
          {currentSection ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
              {/* ARTICLE HEADER / META */}
              <div className="space-y-4 border-b pb-5 border-slate-700/50">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#00E599] uppercase tracking-wider">
                      Édition de l&apos;Article
                    </span>
                    <span className="font-mono text-xs font-black bg-black/40 px-2 py-0.5 rounded text-slate-300">
                      ID: {currentSection.id}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSection(currentSection.id)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer cet article</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* NUMÉRO */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Numéro
                    </label>
                    <input
                      type="text"
                      value={currentSection.number}
                      onChange={(e) => handleUpdateCurrentSection("number", e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border outline-none ${
                        isModernSleek
                          ? "bg-slate-50 border-slate-300 text-slate-900"
                          : "bg-[#080d15] border-[#1e293b] text-white focus:border-[#00E599]"
                      }`}
                      placeholder="01"
                    />
                  </div>

                  {/* TITRE */}
                  <div className="sm:col-span-7">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Titre de l&apos;article
                    </label>
                    <input
                      type="text"
                      value={currentSection.title}
                      onChange={(e) => handleUpdateCurrentSection("title", e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs font-bold rounded-xl border outline-none ${
                        isModernSleek
                          ? "bg-slate-50 border-slate-300 text-slate-900"
                          : "bg-[#080d15] border-[#1e293b] text-white focus:border-[#00E599]"
                      }`}
                      placeholder="Ex: Le Terrain Tactique & Pions Joueurs"
                    />
                  </div>

                  {/* BADGE */}
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Badge (optionnel)
                    </label>
                    <input
                      type="text"
                      value={currentSection.badge || ""}
                      onChange={(e) => handleUpdateCurrentSection("badge", e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${
                        isModernSleek
                          ? "bg-slate-50 border-slate-300 text-slate-900"
                          : "bg-[#080d15] border-[#1e293b] text-white focus:border-[#00E599]"
                      }`}
                      placeholder="Essentiel, PRO+, etc."
                    />
                  </div>
                </div>

                {/* ACCROCHE / RÉSUMÉ */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Accroche / Résumé synthétique
                  </label>
                  <input
                    type="text"
                    value={currentSection.summary}
                    onChange={(e) => handleUpdateCurrentSection("summary", e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${
                      isModernSleek
                        ? "bg-slate-50 border-slate-300 text-slate-900"
                        : "bg-[#080d15] border-[#1e293b] text-white focus:border-[#00E599]"
                    }`}
                    placeholder="Courte description de ce que le coach va apprendre."
                  />
                </div>

                {/* ICÔNE */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Icône représentative
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = (currentSection.iconName || "book").toLowerCase() === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleUpdateCurrentSection("iconName", item.id)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            isSelected
                              ? "bg-[#00E599]/20 border-[#00E599] text-[#00E599]"
                              : "bg-black/20 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION: VIDÉO & MÉDIA EN DIRECT */}
              <div className={`p-4 rounded-2xl border space-y-4 ${
                isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#080d15] border-[#1e293b]"
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#00E599]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Vidéo & Média de Démonstration
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Type détecté : <strong className="text-[#00E599] font-mono">{getMediaType(currentSection.videoUrl).toUpperCase()}</strong>
                  </span>
                </div>

                {/* URL INPUT & PRESETS */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    URL de la vidéo / média (MP4, WebM, YouTube, Vimeo, WebP, GIF) :
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentSection.videoUrl || ""}
                      onChange={(e) => handleUpdateCurrentSection("videoUrl", e.target.value)}
                      className={`flex-1 px-3 py-2 text-xs font-mono rounded-xl border outline-none ${
                        isModernSleek
                          ? "bg-white border-slate-300 text-slate-900"
                          : "bg-[#04060a] border-[#1e293b] text-white focus:border-[#00E599]"
                      }`}
                      placeholder="https://... ou /images/guide/capture.webp ou lien YouTube"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fichier local</span>
                      <input
                        type="file"
                        accept="video/*,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* QUICK PRESETS */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-500 font-bold">Suggestions :</span>
                    {PRESET_MEDIA.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleUpdateCurrentSection("videoUrl", preset.url)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-black/30 hover:bg-black/60 text-slate-400 hover:text-[#00E599] border border-slate-800 transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LIVE PREVIEW BOX */}
                <div className="border border-black/40 rounded-xl overflow-hidden bg-black/40 p-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Aperçu en direct du lecteur</span>
                    {currentSection.videoUrl && (
                      <span className="text-[#00E599] font-mono text-[9px] truncate max-w-xs">
                        {currentSection.videoUrl}
                      </span>
                    )}
                  </div>
                  <GuideMediaViewer
                    url={currentSection.videoUrl}
                    title={currentSection.title}
                  />
                </div>
              </div>

              {/* SECTION: TEXTES & BLOCS DE CONTENU */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#00E599]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Contenu Rédactionnel ({currentSection.content.length} bloc(s))
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBlock}
                    className="px-2.5 py-1 rounded-lg bg-[#00E599]/15 hover:bg-[#00E599]/25 text-[#00E599] border border-[#00E599]/30 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un sous-paragraphe</span>
                  </button>
                </div>

                {currentSection.content.map((block, bIdx) => (
                  <div
                    key={bIdx}
                    className={`p-4 rounded-2xl border space-y-3 relative ${
                      isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e131d] border-[#1f293d]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        Bloc #{bIdx + 1}
                      </span>
                      {currentSection.content.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(bIdx)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                          title="Supprimer ce bloc"
                        >
                          &times; Supprimer le bloc
                        </button>
                      )}
                    </div>

                    {/* SOUS-TITRE */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Sous-titre (optionnel)
                      </label>
                      <input
                        type="text"
                        value={block.subtitle || ""}
                        onChange={(e) =>
                          handleUpdateBlock(bIdx, { ...block, subtitle: e.target.value })
                        }
                        className={`w-full px-3 py-1.5 text-xs font-bold rounded-xl border outline-none ${
                          isModernSleek
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-[#07090e] border-[#1e293b] text-white focus:border-[#00E599]"
                        }`}
                        placeholder="Ex: Positionnement & Glisser-déposer"
                      />
                    </div>

                    {/* PARAGRAPHES */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Paragraphes de texte (un paragraphe par saut de ligne)
                      </label>
                      <textarea
                        rows={3}
                        value={block.paragraphs.join("\n\n")}
                        onChange={(e) => {
                          const lines = e.target.value
                            .split("\n\n")
                            .map((p) => p.trim())
                            .filter(Boolean);
                          handleUpdateBlock(bIdx, {
                            ...block,
                            paragraphs: lines.length > 0 ? lines : [e.target.value]
                          });
                        }}
                        className={`w-full p-3 text-xs leading-relaxed rounded-xl border outline-none ${
                          isModernSleek
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-[#07090e] border-[#1e293b] text-white focus:border-[#00E599]"
                        }`}
                        placeholder="Rédigez les explications détaillées ici. Séparez par une double ligne vide pour créer un nouveau paragraphe."
                      />
                    </div>

                    {/* LISTE À PUCES (POINTS CLÉS) */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Points Clés / Liste à puces (une puce par ligne)
                      </label>
                      <textarea
                        rows={3}
                        value={(block.bullets || []).join("\n")}
                        onChange={(e) => {
                          const bullets = e.target.value
                            .split("\n")
                            .map((b) => b.trim())
                            .filter(Boolean);
                          handleUpdateBlock(bIdx, { ...block, bullets });
                        }}
                        className={`w-full p-2.5 text-xs font-mono rounded-xl border outline-none ${
                          isModernSleek
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-[#07090e] border-[#1e293b] text-white focus:border-[#00E599]"
                        }`}
                        placeholder="Ex: Équipe A : Titulaires et remplaçants&#10;Double-clic joueur : Fiche détaillée"
                      />
                    </div>

                    {/* ASTUCE PRO */}
                    <div>
                      <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Astuce Pro / Conseil coach (optionnel)</span>
                      </label>
                      <input
                        type="text"
                        value={block.tip || ""}
                        onChange={(e) =>
                          handleUpdateBlock(bIdx, { ...block, tip: e.target.value })
                        }
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none ${
                          isModernSleek
                            ? "bg-amber-50 border-amber-300 text-amber-900"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-200 focus:border-amber-400"
                        }`}
                        placeholder="Ex: Utilisez le raccourci Ctrl + Z pour annuler instantanément votre tracé."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* BOTTOM SAVE BUTTON */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  Modifications prêtes pour l&apos;article <strong>{currentSection.title}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="px-5 py-2 rounded-xl bg-[#00E599] hover:bg-[#05c482] text-[#07090e] text-xs font-black flex items-center gap-2 shadow-lg shadow-[#00E599]/20 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer l&apos;article & l&apos;ensemble du guide</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <BookOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-bold">Sélectionnez un article à éditer dans la colonne de gauche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
