"use client";
// Console admin : modification et publication de la FAQ (app_config/faq). Voir lib/faq.ts.
import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Plus, RotateCcw, Search, Send, Trash2, Undo2 } from "lucide-react";
import { confirmAction } from "@/components/ConfirmDialog";
import {
  DEFAULT_FAQ,
  FAQ_CATEGORIES,
  FAQ_CATEGORY_SHORT,
  FAQ_LIMITS,
  type FaqCategory,
  type FaqItem,
  type PublishedFaq,
  newFaqId,
  publishFaq,
  subscribeFaq,
  validateFaq,
} from "@/lib/faq";

type Theme = Record<"card" | "cardMuted" | "text" | "sub" | "faint" | "ghostBtn" | "primaryBtn" | "chip" | "accent" | "segment" | "segmentActive" | "segmentIdle" | "option", string>;

interface Props {
  th: Theme;
  isModernSleek: boolean;
  inputBase: string;
  labelBase: string;
}

const same = (a: FaqItem[], b: FaqItem[]) => JSON.stringify(a) === JSON.stringify(b);
const copy = (items: FaqItem[]) => items.map((x) => ({ ...x }));

export default function FaqEditor({ th, isModernSleek, inputBase, labelBase }: Props) {
  const [published, setPublished] = useState<PublishedFaq | null>(null);
  useEffect(() => subscribeFaq(setPublished), []);

  // Brouillon : repart de la version publiée à chaque publication, sauf modifications en cours
  const [basis, setBasis] = useState<FaqItem[] | null>(null);
  const [items, setItems] = useState<FaqItem[]>([]);
  const dirty = basis !== null && !same(items, basis);
  const key = published ? published.updatedAt ?? "défaut" : null;
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  if (published && key !== syncedKey && !dirty) {
    setSyncedKey(key);
    setBasis(copy(published.items));
    setItems(copy(published.items));
  }

  const [filter, setFilter] = useState<"Toutes" | FaqCategory>("Toutes");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const problem = basis ? validateFaq(items) : null;

  const update = (id: string, patch: Partial<FaqItem>) => setItems((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (id: string, delta: -1 | 1) =>
    setItems((list) => {
      const i = list.findIndex((x) => x.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = async (item: FaqItem) => {
    if (await confirmAction({ title: "Supprimer cette question ?", subject: item.question || "Question sans titre", message: "Elle disparaîtra de la FAQ à la prochaine publication." })) {
      setItems((list) => list.filter((x) => x.id !== item.id));
    }
  };
  const add = () => {
    setFilter("Toutes");
    setSearch("");
    setItems((list) => [...list, { id: newFaqId(), category: filter === "Toutes" ? "Général" : filter, question: "", answer: "" }]);
  };

  const restoreDefault = async () => {
    if (
      await confirmAction({
        title: "Restaurer la FAQ d'origine ?",
        message: "Le brouillon reprend les questions d'origine de The Box. Rien n'est publié tant que vous ne cliquez pas sur « Publier ».",
        confirmLabel: "Restaurer",
        tone: "warning",
      })
    ) {
      setItems(copy(DEFAULT_FAQ));
      setMessage(null);
    }
  };

  const publish = async () => {
    if (problem) return;
    if (!(await confirmAction({ title: "Publier la FAQ ?", message: "Cette version sera immédiatement visible par tous les visiteurs et utilisateurs.", confirmLabel: "Publier", tone: "warning" }))) return;
    setSaving(true);
    setMessage(null);
    try {
      await publishFaq(items);
      setBasis(copy(items));
      setMessage({ ok: true, text: "FAQ publiée." });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setMessage({ ok: false, text: code === "permission-denied" ? "Publication refusée : réservée aux super administrateurs." : (err as Error)?.message || "Publication impossible, réessayez." });
    } finally {
      setSaving(false);
    }
  };

  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (x) => (filter === "Toutes" || x.category === filter) && (!q || x.question.toLowerCase().includes(q) || x.answer.toLowerCase().includes(q))
  );
  const btn = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`;
  const iconBtn = `p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${th.ghostBtn}`;

  if (!published || !basis) return <p className={`text-xs ${th.sub}`} role="status">Chargement de la FAQ…</p>;

  return (
    <div className="space-y-4" data-testid="faq-editor">
      <div className={`p-4 rounded-2xl border ${th.card}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-black ${th.text}`}>Foire aux questions · {items.length} question{items.length > 1 ? "s" : ""}</p>
            <p className={`text-[11px] mt-1 ${th.sub}`}>
              {published.updatedAt
                ? <>Publiée le {new Date(published.updatedAt).toLocaleString("fr-FR")}{published.updatedBy ? <> par {published.updatedBy}</> : null}.</>
                : "FAQ d'origine de The Box, jamais publiée."}
              {dirty && <span className={`ml-1 font-bold ${isModernSleek ? "text-amber-700" : "text-amber-300"}`}>● Modifications non publiées</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <button type="button" onClick={() => { setItems(copy(basis)); setMessage(null); }} className={`${btn} ${th.ghostBtn}`}>
                <Undo2 className="h-3.5 w-3.5" />Annuler les modifications
              </button>
            )}
            <button type="button" onClick={() => void restoreDefault()} className={`${btn} ${th.ghostBtn}`}>
              <RotateCcw className="h-3.5 w-3.5" />FAQ d&apos;origine
            </button>
            <button
              type="button"
              onClick={() => void publish()}
              disabled={saving || Boolean(problem) || (!dirty && Boolean(published.updatedAt))}
              title={problem ?? undefined}
              className={`${btn} border-transparent font-black ${th.primaryBtn}`}
            >
              <Send className="h-3.5 w-3.5" />{saving ? "Publication…" : "Publier"}
            </button>
          </div>
        </div>
        {problem && <p className="mt-3 text-[11px] font-semibold text-rose-400">{problem}</p>}
        {message && (
          <p className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold ${message.ok ? th.accent : "text-rose-400"}`} role="status">
            {message.ok && <CheckCircle2 className="h-3.5 w-3.5" />}{message.text}
          </p>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${th.faint}`} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une question…" className={`${inputBase} pl-9`} aria-label="Rechercher une question" />
        </div>
        <div className={`flex gap-1 p-1 rounded-xl border overflow-x-auto ${th.segment}`}>
          {(["Toutes", ...FAQ_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${filter === c ? th.segmentActive : th.segmentIdle}`}
            >
              {c === "Toutes" ? "Toutes" : FAQ_CATEGORY_SHORT[c]}
              <span className={`ml-1 tabular-nums ${th.faint}`}>{c === "Toutes" ? items.length : items.filter((x) => x.category === c).length}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && <p className={`text-xs text-center py-8 ${th.sub}`}>Aucune question ne correspond.</p>}

      {visible.map((item) => {
        const index = items.findIndex((x) => x.id === item.id);
        return (
          <div key={item.id} className={`p-4 rounded-2xl border ${th.card}`} data-testid="faq-item">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-black tabular-nums shrink-0 ${th.chip}`}>{index + 1}</span>
              <select
                value={item.category}
                onChange={(e) => update(item.id, { category: e.target.value as FaqCategory })}
                aria-label={`Catégorie de la question ${index + 1}`}
                className={`${inputBase} !w-auto ${th.option}`}
              >
                {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="flex-1" />
              <button type="button" className={iconBtn} disabled={index === 0} onClick={() => move(item.id, -1)} title="Monter" aria-label="Monter la question"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" className={iconBtn} disabled={index === items.length - 1} onClick={() => move(item.id, 1)} title="Descendre" aria-label="Descendre la question"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button type="button" className={`${iconBtn} hover:!text-rose-400`} onClick={() => void remove(item)} title="Supprimer" aria-label="Supprimer la question"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <label className={`${labelBase} mt-3`} htmlFor={`faq-q-${item.id}`}>Question</label>
            <input
              id={`faq-q-${item.id}`}
              type="text"
              value={item.question}
              maxLength={FAQ_LIMITS.question}
              onChange={(e) => update(item.id, { question: e.target.value })}
              aria-label={`Question ${index + 1}`}
              className={`${inputBase} font-bold`}
            />
            <label className={`${labelBase} mt-3`} htmlFor={`faq-a-${item.id}`}>Réponse</label>
            <textarea
              id={`faq-a-${item.id}`}
              value={item.answer}
              maxLength={FAQ_LIMITS.answer}
              rows={Math.min(10, Math.max(3, Math.ceil(item.answer.length / 110)))}
              onChange={(e) => update(item.id, { answer: e.target.value })}
              aria-label={`Réponse ${index + 1}`}
              className={`${inputBase} resize-y leading-relaxed`}
            />
          </div>
        );
      })}

      <button type="button" onClick={add} disabled={items.length >= FAQ_LIMITS.items} className={`w-full ${btn} justify-center py-2.5 border-dashed ${th.ghostBtn}`}>
        <Plus className="h-3.5 w-3.5" />Ajouter une question
      </button>
    </div>
  );
}
