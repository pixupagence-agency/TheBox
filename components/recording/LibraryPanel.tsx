"use client";

// Module Recording : bibliothèque enregistrée sur l'appareil — séquences, extraits (Entrée → Sortie) et images,
// avec recherche et filtres par tag.
import React, { useMemo, useState } from "react";
import { Camera, Download, Film, Library, Scissors, Search, Trash2, X, Youtube } from "lucide-react";
import { formatTime } from "@/lib/recording/sources";
import { GAME_PHASES, SET_PIECES } from "@/lib/recording/tags";
import { useRecordingTheme } from "@/lib/recording/theme";
import type { LibraryImage, Sequence, SequenceTags } from "@/lib/recording/types";

interface Props {
  sequences: Sequence[];
  images: LibraryImage[];
  activeId: string | null;
  storage: { usedMb: number; quotaMb: number } | null;
  onOpen: (seq: Sequence) => void;
  onDelete: (seq: Sequence) => void;
  onOpenImage: (image: LibraryImage) => void;
  onDeleteImage: (image: LibraryImage) => void;
  /** Export du passage en fichier vidéo (fichiers importés uniquement) */
  onExport: (seq: Sequence) => void;
  onDownloadImage: (image: LibraryImage) => void;
  /** Format du fichier vidéo exporté ; null si le navigateur ne sait pas enregistrer de vidéo */
  exportFormat: "mp4" | "webm" | null;
}

type Tab = "all" | "sequences" | "clips" | "images";

type Item =
  | { kind: "sequence"; date: string; seq: Sequence }
  | { kind: "image"; date: string; image: LibraryImage };

const tagsOf = (t: SequenceTags) => [t.phase, t.setPiece, ...t.players, ...t.custom].filter(Boolean) as string[];

export default function LibraryPanel({ sequences, images, activeId, storage, onOpen, onDelete, onOpenImage, onDeleteImage, onExport, onDownloadImage, exportFormat }: Props) {
  const th = useRecordingTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");

  const clipCount = sequences.filter((s) => s.parentId).length;
  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: "all", label: "Tout", count: sequences.length + images.length },
    { id: "sequences", label: "Séquences", count: sequences.length - clipCount },
    { id: "clips", label: "Extraits", count: clipCount },
    { id: "images", label: "Images", count: images.length },
  ];

  // Filtres proposés : seulement les tags réellement utilisés
  const usedTags = useMemo(() => {
    const set = new Set<string>();
    sequences.forEach((s) => tagsOf(s.tags).forEach((t) => set.add(t)));
    images.forEach((i) => tagsOf(i.tags).forEach((t) => set.add(t)));
    const order = [...GAME_PHASES, ...SET_PIECES];
    return [...set].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [sequences, images]);

  const matches = (tags: string[], texts: string[]) => {
    if (filter && !tags.includes(filter)) return false;
    const q = query.trim().toLowerCase();
    return !q || [...texts, ...tags].some((v) => v.toLowerCase().includes(q));
  };

  const items: Item[] = [];
  if (tab !== "images") {
    sequences.forEach((s) => {
      if (tab === "sequences" && s.parentId) return;
      if (tab === "clips" && !s.parentId) return;
      if (matches(tagsOf(s.tags), [s.title, s.notes || "", s.parentTitle || ""])) items.push({ kind: "sequence", date: s.updatedAt, seq: s });
    });
  }
  if (tab === "all" || tab === "images") {
    images.forEach((i) => {
      if (matches(tagsOf(i.tags), [i.title, i.sequenceTitle])) items.push({ kind: "image", date: i.createdAt, image: i });
    });
  }
  items.sort((a, b) => b.date.localeCompare(a.date));

  const empty = sequences.length + images.length === 0;
  const tagChips = (tags: string[]) => tags.slice(0, 4).map((t) => (
    <span key={t} className={`h-5 px-1.5 rounded border text-[10px] font-bold truncate max-w-full ${th.accentChip}`}>{t}</span>
  ));
  const downloadBtn = (label: string, title: string, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-label={label} title={title} className={`h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer ${th.idleBtn}`}>
      <Download className="w-4 h-4" />
    </button>
  );
  const deleteBtn = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-label={`Supprimer ${label}`} title="Supprimer" className={`h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer ${th.dangerBtn}`}>
      <Trash2 className="w-4 h-4" />
    </button>
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className={`px-3 py-2.5 border-b flex items-center gap-1.5 ${th.sectionBorder}`}>
        <Library className={`w-4 h-4 shrink-0 ${th.sectionIcon}`} aria-hidden="true" />
        <span className={`flex-1 text-xs font-black uppercase tracking-wider ${th.sectionTitle}`}>Bibliothèque</span>
        <span className={`text-[11px] font-bold tabular-nums ${th.faint}`}>{sequences.length + images.length}</span>
      </div>

      <div className="p-2.5 space-y-2">
        <div className="grid grid-cols-2 gap-1" role="tablist" aria-label="Contenu de la bibliothèque">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-9 px-2 rounded-lg border text-[12px] font-black flex items-center justify-between gap-1 cursor-pointer ${tab === t.id ? th.activeBtn : th.idleBtn}`}
            >
              {t.label}
              <span className="text-[11px] font-bold opacity-70 tabular-nums">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${th.faint}`} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, joueur, phase…"
            aria-label="Rechercher dans la bibliothèque"
            className={`${th.input} h-10 pl-9 text-sm`}
          />
        </div>
        {usedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filter && (
              <button type="button" onClick={() => setFilter(null)} className={`h-7 px-2 rounded-md border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${th.activeBtn}`}>
                {filter}<X className="w-3 h-3" />
              </button>
            )}
            {usedTags.filter((t) => t !== filter).slice(0, 14).map((t) => (
              <button key={t} type="button" onClick={() => setFilter(t)} className={`h-7 px-2 rounded-md border text-[11px] font-bold cursor-pointer ${th.idleBtn}`}>{t}</button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 pb-2.5 space-y-2">
        {items.length === 0 && (
          <p className={`rounded-xl border border-dashed p-3 text-[13px] leading-relaxed ${th.hint}`}>
            {empty
              ? "Bibliothèque vide. Importez une vidéo puis « Enregistrer » la séquence, « Extraire » un passage (Entrée → Sortie) ou ranger une « Image »."
              : tab === "clips" && clipCount === 0
                ? "Aucun extrait. Placez l'Entrée (I) et la Sortie (O) d'un passage puis « Extraire » (E)."
                : tab === "images" && images.length === 0
                  ? "Aucune image. Figez l'action et cliquez sur « Image » pour la ranger avec ses consignes."
                  : "Rien ne correspond à la recherche."}
          </p>
        )}
        {items.map((item) => {
          if (item.kind === "image") {
            const img = item.image;
            return (
              <div key={img.id} className={`rounded-xl border overflow-hidden transition ${th.tileIdle}`}>
                <button type="button" onClick={() => onOpenImage(img)} className="w-full text-left cursor-pointer" aria-label={`Voir ${img.title}`}>
                  <div className="relative aspect-video bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                    <span className="absolute left-1.5 top-1.5 h-5 px-1.5 rounded bg-black/70 text-[10px] font-black text-white flex items-center gap-1">
                      <Camera className="w-3 h-3" />Image · {formatTime(img.time, true, img.fps)}
                    </span>
                  </div>
                  <div className="px-2 pt-1.5 pb-1">
                    <p className={`text-[13px] font-black truncate ${th.text}`}>{img.title}</p>
                    <p className={`text-[11px] font-semibold ${th.faint}`}>{new Date(img.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </button>
                <div className="px-2 pb-2 flex items-end gap-1">
                  <div className="flex-1 flex flex-wrap gap-1 min-w-0">{tagChips(tagsOf(img.tags))}</div>
                  {downloadBtn(`Télécharger ${img.title}`, "Télécharger l'image (JPG)", () => onDownloadImage(img))}
                  {deleteBtn(img.title, () => onDeleteImage(img))}
                </div>
              </div>
            );
          }
          const s = item.seq;
          const isActive = s.id === activeId;
          const shapeCount = s.freezes.reduce((n, f) => n + f.shapes.length, 0);
          return (
            <div key={s.id} className={`group rounded-xl border overflow-hidden transition ${isActive ? th.tileOn : th.tileIdle}`}>
              <button type="button" onClick={() => onOpen(s)} className="w-full text-left cursor-pointer" aria-label={`Ouvrir ${s.title}`}>
                <div className="relative aspect-video bg-black">
                  {s.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500"><Film className="w-7 h-7" /></div>
                  )}
                  <span className="absolute left-1.5 top-1.5 h-5 px-1.5 rounded bg-black/70 text-[10px] font-black text-white flex items-center gap-1">
                    {s.parentId ? <Scissors className="w-3 h-3" /> : s.source.kind === "file" ? <Film className="w-3 h-3" /> : s.source.kind === "youtube" ? <Youtube className="w-3 h-3" /> : "V"}
                    {s.parentId ? "Extrait · " : ""}
                    {s.inPoint !== undefined || s.outPoint !== undefined ? `${formatTime(s.inPoint ?? 0)}–${s.outPoint !== undefined ? formatTime(s.outPoint) : "fin"}` : "Vidéo entière"}
                  </span>
                  {shapeCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-5 px-1.5 rounded bg-[#FF5A4E] text-[10px] font-black text-white flex items-center">
                      {s.freezes.length} arrêt{s.freezes.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="px-2 pt-1.5 pb-1">
                  <p className={`text-[13px] font-black truncate ${th.text}`}>{s.title}</p>
                  <p className={`text-[11px] font-semibold truncate ${th.faint}`}>
                    {new Date(s.updatedAt).toLocaleDateString("fr-FR")}
                    {s.parentTitle ? ` · de « ${s.parentTitle} »` : ""}
                  </p>
                </div>
              </button>
              <div className="px-2 pb-2 flex items-end gap-1">
                <div className="flex-1 flex flex-wrap gap-1 min-w-0">{tagChips(tagsOf(s.tags))}</div>
                {s.source.kind === "file" && exportFormat && downloadBtn(
                  `Exporter ${s.title} en ${exportFormat.toUpperCase()}`,
                  `Exporter ${s.parentId ? "l'extrait" : "la vidéo"} en ${exportFormat.toUpperCase()} (avec joueurs suivis et arrêts sur image)`,
                  () => onExport(s)
                )}
                {deleteBtn(s.title, () => onDelete(s))}
              </div>
            </div>
          );
        })}
      </div>

      {storage && (
        <p className={`px-3 py-2 border-t text-[11px] font-semibold ${th.sectionBorder} ${th.faint}`}>
          Stocké sur cet appareil · {storage.usedMb} Mo utilisés{storage.quotaMb ? ` sur ${Math.round(storage.quotaMb / 1024)} Go` : ""}
        </p>
      )}
    </div>
  );
}
