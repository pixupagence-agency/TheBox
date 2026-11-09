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
  HelpCircle,
  Edit3
} from "lucide-react";
import { getPremiumTheme } from "@/lib/premiumModalTheme";
import { renderGuideIcon } from "./UserGuideModal";
import { confirmAction } from "@/components/ConfirmDialog";

interface AdminGuideEditorProps {
  isModernSleek?: boolean;
  initialSectionId?: string;
  onPreviewGuide?: () => void;
  /** En-tête de la fenêtre, affiché au-dessus de l'article (même place qu'en lecture) */
  header?: React.ReactNode;
  onSelectSection?: (id: string) => void;
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
  onPreviewGuide,
  header,
  onSelectSection
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

  const selectSection = (id: string) => {
    setSelectedId(id);
    onSelectSection?.(id);
  };

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
  const handleReset = async () => {
    if (
      await confirmAction({
        title: "Réinitialiser le guide ?",
        message: "Le guide reviendra aux 11 articles d'origine de TheBox. Toutes vos modifications personnalisées seront effacées.",
        confirmLabel: "Réinitialiser",
      })
    ) {
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
  const handleDeleteSection = async (id: string) => {
    if (sections.length <= 1) {
      alert("Le guide doit comporter au moins un article.");
      return;
    }
    const article = sections.find((s) => s.id === id);
    if (await confirmAction({ title: "Supprimer cet article ?", subject: article?.title, message: "L'article sera retiré du guide utilisateur." })) {
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

  const th = getPremiumTheme(isModernSleek);
  // Champs « en place » : ils ressemblent au texte lu, et se révèlent au survol / à la saisie
  const inlineField = `bg-transparent border border-transparent rounded-lg outline-none transition ${isModernSleek ? "hover:border-slate-200 focus:border-emerald-500 focus:bg-white" : "hover:border-white/10 focus:border-[#00E599]/50 focus:bg-white/[0.03]"}`;
  const boxField = `w-full rounded-xl border outline-none transition ${th.input}`;
  const labelCls = `block text-[10px] font-black uppercase tracking-[0.14em] mb-1.5 ${th.faint}`;
  const badgeChip = (badge: string) => (badge === "PRO+" ? th.goldChip : th.accentChip);

  return (
    <>
      {/* ================= SIDEBAR : SOMMAIRE ÉDITABLE ================= */}
      <aside className={`hidden md:flex w-80 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${th.goldTile}`}>
              <Edit3 className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.gold}`}>Édition</p>
              <p className={`text-sm font-black ${th.text}`}>Guide d&apos;utilisation</p>
            </div>
          </div>

          <div className="relative mt-5">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${th.faint}`} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrer les articles…"
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition ${th.input}`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-8 pb-2">
          <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>Sommaire</p>
          <p className={`text-[10px] font-bold tabular-nums ${th.faint}`}>{filteredSections.length} / {sections.length}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-thin">
          {filteredSections.map((sec) => {
            const isSelected = sec.id === currentSection?.id;
            const idx = sections.findIndex((s) => s.id === sec.id);
            return (
              <div
                key={sec.id}
                onClick={() => selectSection(sec.id)}
                className={`group relative w-full px-3 py-2.5 rounded-xl border transition cursor-pointer flex items-center gap-3 ${isSelected ? th.navActive : th.navIdle}`}
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
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 group-hover:hidden ${badgeChip(sec.badge)}`}>{sec.badge}</span>
                )}
                {/* Réordonner (au survol) */}
                <span className="hidden group-hover:flex flex-col shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, "up"); }}
                    disabled={idx === 0}
                    className={`p-0.5 rounded disabled:opacity-20 cursor-pointer ${th.faint} hover:opacity-70`}
                    title="Monter d'un rang"
                    aria-label="Monter d'un rang"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, "down"); }}
                    disabled={idx === sections.length - 1}
                    className={`p-0.5 rounded disabled:opacity-20 cursor-pointer ${th.faint} hover:opacity-70`}
                    title="Descendre d'un rang"
                    aria-label="Descendre d'un rang"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </span>
              </div>
            );
          })}
        </nav>

        <div className={`p-3 border-t space-y-1.5 ${th.border}`}>
          <button
            type="button"
            onClick={handleCreateSection}
            className={`w-full h-9 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${th.ghostBtn}`}
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvel article
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={`w-full h-8 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${th.sub} hover:opacity-80`}
            title="Revenir aux articles d'origine de The Box"
          >
            <RotateCcw className="w-3 h-3" />
            Réinitialiser le guide
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 min-w-0 flex flex-col relative z-10 min-h-0">
        {header}

        {/* Sommaire mobile */}
        <div className={`md:hidden px-5 py-3 border-b ${th.border}`}>
          <select
            value={currentSection?.id || ""}
            onChange={(e) => selectSection(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${th.input} ${th.option}`}
            aria-label="Choisir un article à modifier"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>{sec.number} · {sec.title}</option>
            ))}
          </select>
        </div>

        {currentSection ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <article className="max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-8 space-y-7">
              {/* En-tête de l'article (comme en lecture) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.accent}`}>Section</span>
                  <input
                    type="text"
                    value={currentSection.number}
                    onChange={(e) => handleUpdateCurrentSection("number", e.target.value)}
                    className={`${inlineField} w-10 px-1 text-[10px] font-black font-mono ${th.accent}`}
                    aria-label="Numéro de l'article"
                  />
                  <input
                    type="text"
                    value={currentSection.badge || ""}
                    onChange={(e) => handleUpdateCurrentSection("badge", e.target.value)}
                    placeholder="+ Badge"
                    className={`w-24 px-1.5 py-0.5 rounded-md border text-[9px] font-black outline-none transition ${currentSection.badge ? badgeChip(currentSection.badge) : `border-dashed ${th.border} bg-transparent ${th.faint}`}`}
                    aria-label="Badge (Essentiel, PRO+…)"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(currentSection.id)}
                    className={`ml-auto h-7 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${isModernSleek ? "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50" : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10"}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer l&apos;article
                  </button>
                </div>
                <input
                  type="text"
                  value={currentSection.title}
                  onChange={(e) => handleUpdateCurrentSection("title", e.target.value)}
                  placeholder="Titre de l'article"
                  className={`${inlineField} w-full -mx-2 px-2 py-1 text-xl sm:text-2xl font-black tracking-tight ${th.text}`}
                  aria-label="Titre de l'article"
                />
                <input
                  type="text"
                  value={currentSection.summary}
                  onChange={(e) => handleUpdateCurrentSection("summary", e.target.value)}
                  placeholder="Accroche : ce que le coach va apprendre"
                  className={`${inlineField} w-full -mx-2 px-2 py-1 text-sm ${th.sub}`}
                  aria-label="Résumé de l'article"
                />

                {/* Icône */}
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  <span className={`text-[10px] font-black uppercase tracking-[0.14em] mr-1 ${th.faint}`}>Icône</span>
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSel = (currentSection.iconName || "book").toLowerCase() === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleUpdateCurrentSection("iconName", item.id)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${isSel ? th.accentChip : `${th.selectable} ${th.faint}`}`}
                        title={item.name}
                        aria-label={item.name}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Démonstration (comme en lecture) */}
              <div className={`rounded-2xl border overflow-hidden ${th.card}`}>
                <div className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${th.border}`}>
                  <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] ${th.accent}`}>
                    <Film className="w-4 h-4" />
                    Démonstration
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${th.chip}`}>
                    {getMediaType(currentSection.videoUrl).toUpperCase()}
                  </span>
                </div>
                <div className="p-3 space-y-3">
                  <GuideMediaViewer url={currentSection.videoUrl} title={currentSection.title} className="max-h-[380px]" />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentSection.videoUrl || ""}
                      onChange={(e) => handleUpdateCurrentSection("videoUrl", e.target.value)}
                      className={`${boxField} flex-1 px-3 py-2 text-xs font-mono`}
                      placeholder="Lien MP4, YouTube, Vimeo, WebP ou GIF"
                      aria-label="Lien du média"
                    />
                    <label className={`px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition ${th.ghostBtn}`}>
                      <Upload className="w-3.5 h-3.5" />
                      Importer
                      <input type="file" accept="video/*,image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold ${th.faint}`}>Suggestions :</span>
                    {PRESET_MEDIA.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleUpdateCurrentSection("videoUrl", preset.url)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition cursor-pointer ${currentSection.videoUrl === preset.url ? th.accentChip : `${th.selectable} ${th.sub}`}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blocs de contenu (comme en lecture) */}
              {currentSection.content.map((block, bIdx) => (
                <section key={bIdx} className={`group/block relative space-y-3 rounded-2xl -mx-3 px-3 py-3 border border-transparent transition ${isModernSleek ? "hover:border-slate-200" : "hover:border-white/[0.06]"}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-5 rounded-full shrink-0 ${th.accentDot}`} />
                    <input
                      type="text"
                      value={block.subtitle || ""}
                      onChange={(e) => handleUpdateBlock(bIdx, { ...block, subtitle: e.target.value })}
                      placeholder="Sous-titre (optionnel)"
                      className={`${inlineField} w-full px-2 py-1 text-base font-black tracking-tight ${th.text}`}
                      aria-label="Sous-titre du bloc"
                    />
                    {currentSection.content.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(bIdx)}
                        className={`p-1.5 rounded-lg opacity-0 group-hover/block:opacity-100 transition cursor-pointer shrink-0 ${isModernSleek ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-slate-500 hover:text-rose-300 hover:bg-rose-500/10"}`}
                        title="Supprimer ce bloc"
                        aria-label="Supprimer ce bloc"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Texte <span className="normal-case tracking-normal font-semibold">· ligne vide = nouveau paragraphe</span></label>
                    <textarea
                      rows={Math.max(3, block.paragraphs.join("\n\n").split("\n").length + 1)}
                      value={block.paragraphs.join("\n\n")}
                      onChange={(e) => {
                        const lines = e.target.value.split("\n\n").map((p) => p.trim()).filter(Boolean);
                        handleUpdateBlock(bIdx, { ...block, paragraphs: lines.length > 0 ? lines : [e.target.value] });
                      }}
                      className={`${boxField} px-3 py-2.5 text-sm sm:text-[15px] leading-7 resize-y`}
                      placeholder="Rédigez les explications détaillées ici."
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Points clés <span className="normal-case tracking-normal font-semibold">· une puce par ligne</span></label>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-3 ${th.accent}`} />
                      <textarea
                        rows={Math.max(2, (block.bullets || []).length + 1)}
                        value={(block.bullets || []).join("\n")}
                        onChange={(e) => {
                          const bullets = e.target.value.split("\n").map((b) => b.trim()).filter(Boolean);
                          handleUpdateBlock(bIdx, { ...block, bullets });
                        }}
                        className={`${boxField} flex-1 px-3 py-2.5 text-sm leading-7 resize-y`}
                        placeholder={"Point clé n°1\nPoint clé n°2"}
                      />
                    </div>
                  </div>

                  {/* Astuce pro (même encart doré qu'en lecture) */}
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isModernSleek
                    ? "bg-gradient-to-br from-amber-50 to-white border-amber-200"
                    : "bg-gradient-to-br from-[#d4af37]/[0.10] to-transparent border-[#d4af37]/25"
                    }`}>
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${th.goldTile}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-[0.14em] mb-0.5 ${th.gold}`}>Astuce pro <span className={`normal-case tracking-normal font-semibold ${th.faint}`}>· optionnelle</span></p>
                      <input
                        type="text"
                        value={block.tip || ""}
                        onChange={(e) => handleUpdateBlock(bIdx, { ...block, tip: e.target.value })}
                        placeholder="Ex : Ctrl + Z annule instantanément votre dernier tracé."
                        className={`${inlineField} w-full -mx-2 px-2 py-1 text-sm ${th.body}`}
                        aria-label="Astuce pro"
                      />
                    </div>
                  </div>
                </section>
              ))}

              <button
                type="button"
                onClick={handleAddBlock}
                className={`w-full py-3 rounded-2xl border border-dashed text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${isModernSleek ? "border-slate-300 text-slate-500 hover:text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50/50" : "border-white/10 text-slate-400 hover:text-[#00E599] hover:border-[#00E599]/40 hover:bg-[#00E599]/[0.04]"}`}
              >
                <Plus className="w-4 h-4" />
                Ajouter un bloc
              </button>
            </article>
          </div>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center text-center p-12 ${th.sub}`}>
            <BookOpen className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-bold">Sélectionnez un article à modifier.</p>
          </div>
        )}

        {/* Pied : enregistrement */}
        <footer className={`px-5 sm:px-8 py-3.5 border-t flex items-center justify-between gap-3 ${th.border}`}>
          {saveStatus ? (
            <p className={`text-[11px] font-bold flex items-center gap-1.5 ${th.accent}`}>
              <CheckCircle2 className="w-4 h-4" />
              {saveStatus}
            </p>
          ) : (
            <p className={`text-[11px] truncate ${th.sub}`}>
              Les modifications sont visibles par tous les coachs après l&apos;enregistrement.
            </p>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {onPreviewGuide && (
              <button
                type="button"
                onClick={onPreviewGuide}
                className={`h-10 px-4 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${th.ghostBtn}`}
              >
                <Eye className="w-4 h-4" />
                Aperçu
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveAll}
              className={`h-10 px-5 rounded-xl text-xs font-black inline-flex items-center gap-2 transition cursor-pointer ${th.primaryBtn}`}
            >
              <Save className="w-4 h-4" />
              Enregistrer le guide
            </button>
          </div>
        </footer>
      </main>
    </>
  );
}
