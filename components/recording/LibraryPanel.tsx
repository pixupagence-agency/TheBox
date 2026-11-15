"use client";

// Module Recording : bibliothèque des séquences taguées (enregistrées sur l'appareil), avec recherche et filtres.
import React, { useMemo, useState } from "react";
import { Film, Library, Search, Trash2, X, Youtube } from "lucide-react";
import { formatTime } from "@/lib/recording/sources";
import { GAME_PHASES, SET_PIECES } from "@/lib/recording/tags";
import { useRecordingTheme } from "@/lib/recording/theme";
import type { Sequence } from "@/lib/recording/types";

interface Props {
  sequences: Sequence[];
  activeId: string | null;
  storage: { usedMb: number; quotaMb: number } | null;
  onOpen: (seq: Sequence) => void;
  onDelete: (seq: Sequence) => void;
}

export default function LibraryPanel({ sequences, activeId, storage, onOpen, onDelete }: Props) {
  const th = useRecordingTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  // Filtres proposés : seulement les tags réellement utilisés
  const usedTags = useMemo(() => {
    const set = new Set<string>();
    sequences.forEach((s) => {
      if (s.tags.phase) set.add(s.tags.phase);
      if (s.tags.setPiece) set.add(s.tags.setPiece);
      s.tags.players.forEach((p) => set.add(p));
      s.tags.custom.forEach((c) => set.add(c));
    });
    const order = [...GAME_PHASES, ...SET_PIECES];
    return [...set].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [sequences]);

  const visible = sequences.filter((s) => {
    const tags = [s.tags.phase, s.tags.setPiece, ...s.tags.players, ...s.tags.custom].filter(Boolean) as string[];
    if (filter && !tags.includes(filter)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [s.title, s.notes || "", ...tags].some((v) => v.toLowerCase().includes(q));
  });

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className={`px-3 py-2.5 border-b flex items-center gap-1.5 ${th.sectionBorder}`}>
        <Library className={`w-4 h-4 shrink-0 ${th.sectionIcon}`} aria-hidden="true" />
        <span className={`flex-1 text-xs font-black uppercase tracking-wider ${th.sectionTitle}`}>Bibliothèque</span>
        <span className={`text-[11px] font-bold tabular-nums ${th.faint}`}>{sequences.length}</span>
      </div>

      <div className="p-2.5 space-y-2">
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${th.faint}`} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, joueur, phase…"
            aria-label="Rechercher une séquence"
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
        {visible.length === 0 && (
          <p className={`rounded-xl border border-dashed p-3 text-[13px] leading-relaxed ${th.hint}`}>
            {sequences.length === 0
              ? "Aucune séquence enregistrée. Importez une vidéo, annotez-la puis cliquez sur « Enregistrer »."
              : "Aucune séquence ne correspond à la recherche."}
          </p>
        )}
        {visible.map((s) => {
          const isActive = s.id === activeId;
          const tags = [s.tags.phase, s.tags.setPiece, ...s.tags.players, ...s.tags.custom].filter(Boolean) as string[];
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
                    {s.source.kind === "file" ? <Film className="w-3 h-3" /> : s.source.kind === "youtube" ? <Youtube className="w-3 h-3" /> : "V"}
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
                  <p className={`text-[11px] font-semibold ${th.faint}`}>{new Date(s.updatedAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </button>
              <div className="px-2 pb-2 flex items-end gap-1">
                <div className="flex-1 flex flex-wrap gap-1 min-w-0">
                  {tags.slice(0, 4).map((t) => (
                    <span key={t} className={`h-5 px-1.5 rounded border text-[10px] font-bold truncate max-w-full ${th.accentChip}`}>{t}</span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(s)}
                  aria-label={`Supprimer ${s.title}`}
                  title="Supprimer la séquence"
                  className={`h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer ${th.dangerBtn}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
