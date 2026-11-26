"use client";
// Console admin : modification et publication des documents légaux (CGU, CGV, mentions légales,
// politique de confidentialité, accord de sous-traitance). Voir lib/legal/documents.ts.
import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Eye, PenLine, Plus, RotateCcw, Send, Trash2, Undo2 } from "lucide-react";
import { confirmAction } from "@/components/ConfirmDialog";
import LegalText from "@/components/legal/LegalText";
import {
  LEGAL_DOC_IDS,
  LEGAL_DOC_META,
  LEGAL_LIMITS,
  type LegalDocId,
  type LegalDocument,
  type LegalSection,
  countPlaceholders,
  defaultLegalDocument,
  newSectionId,
  validateLegalDocument,
} from "@/lib/legal/documents";
import { publishLegalDocument, subscribeLegalDocument } from "@/lib/legal/store";

type Theme = Record<
  "card" | "cardMuted" | "text" | "sub" | "faint" | "ghostBtn" | "primaryBtn" | "chip" | "accent" | "segment" | "segmentActive" | "segmentIdle" | "border",
  string
>;

interface Props {
  th: Theme;
  isModernSleek: boolean;
  inputBase: string;
  labelBase: string;
}

type Draft = Pick<LegalDocument, "intro" | "sections">;

const sameDraft = (a: Draft, b: Draft) =>
  a.intro.trim() === b.intro.trim() &&
  a.sections.length === b.sections.length &&
  a.sections.every((x, i) => x.title.trim() === b.sections[i].title.trim() && x.body.trim() === b.sections[i].body.trim());

const toDraft = (d: LegalDocument): Draft => ({ intro: d.intro, sections: d.sections.map((x) => ({ ...x })) });

export default function LegalDocsEditor({ th, isModernSleek, inputBase, labelBase }: Props) {
  const [docId, setDocId] = useState<LegalDocId>("mentions");
  // Versions publiées des 5 documents (suivies en direct : compteurs « à compléter » de chaque onglet)
  const [published, setPublished] = useState<Partial<Record<LegalDocId, LegalDocument>>>({});
  useEffect(() => {
    const unsubs = LEGAL_DOC_IDS.map((id) => subscribeLegalDocument(id, (d) => setPublished((prev) => ({ ...prev, [id]: d }))));
    return () => unsubs.forEach((u) => u());
  }, []);

  const current = published[docId] ?? null;
  // Brouillon du document affiché : repart de la version publiée à chaque changement de document
  // ou de version publiée (ajusté pendant le rendu, sans effet)
  const sourceKey = current ? `${docId}:${current.version}:${current.updatedAt ?? "défaut"}` : null;
  const [draftSource, setDraftSource] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  if (sourceKey !== draftSource) {
    setDraftSource(sourceKey);
    setDraft(current ? toDraft(current) : null);
  }

  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = Boolean(current && draft && !sameDraft(draft, current));
  const problem = draft ? validateLegalDocument(draft) : null;
  const placeholders = draft ? countPlaceholders(draft) : 0;

  const switchDoc = async (id: LegalDocId) => {
    if (id === docId) return;
    if (
      dirty &&
      !(await confirmAction({
        title: "Abandonner les modifications ?",
        subject: LEGAL_DOC_META[docId].title,
        message: "Les modifications non publiées de ce document seront perdues.",
        confirmLabel: "Abandonner",
        tone: "warning",
      }))
    ) {
      return;
    }
    setDocId(id);
    setMessage(null);
    setPreview(false);
  };

  const updateSection = (index: number, patch: Partial<LegalSection>) =>
    setDraft((d) => d && { ...d, sections: d.sections.map((x, i) => (i === index ? { ...x, ...patch } : x)) });

  const moveSection = (index: number, delta: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d;
      const target = index + delta;
      if (target < 0 || target >= d.sections.length) return d;
      const sections = [...d.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...d, sections };
    });

  const removeSection = async (index: number) => {
    const sec = draft?.sections[index];
    if (!sec) return;
    if (await confirmAction({ title: "Supprimer cette section ?", subject: sec.title || `Section ${index + 1}`, message: "Elle disparaîtra du document à la prochaine publication." })) {
      setDraft((d) => d && { ...d, sections: d.sections.filter((_, i) => i !== index) });
    }
  };

  const addSection = () =>
    setDraft((d) => d && { ...d, sections: [...d.sections, { id: newSectionId(), title: "", body: "" }] });

  const restoreDefault = async () => {
    if (
      await confirmAction({
        title: "Restaurer le modèle par défaut ?",
        subject: LEGAL_DOC_META[docId].title,
        message: "Le brouillon est remplacé par le texte d'origine de The Box. Rien n'est publié tant que vous ne cliquez pas sur « Publier ».",
        confirmLabel: "Restaurer",
        tone: "warning",
      })
    ) {
      setDraft(toDraft(defaultLegalDocument(docId)));
      setMessage(null);
    }
  };

  const publish = async () => {
    if (!draft || problem) return;
    const confirmed = await confirmAction({
      title: "Publier cette version ?",
      subject: LEGAL_DOC_META[docId].title,
      message:
        (placeholders > 0 ? `Attention : ${placeholders} information${placeholders > 1 ? "s" : ""} « À COMPLÉTER » reste${placeholders > 1 ? "nt" : ""} dans le texte. ` : "") +
        "Le document sera immédiatement visible par tous les visiteurs et utilisateurs. La version précédente est conservée dans l'historique.",
      confirmLabel: "Publier",
      tone: "warning",
    });
    if (!confirmed) return;
    setSaving(true);
    setMessage(null);
    try {
      const saved = await publishLegalDocument({ id: docId, ...draft });
      setMessage({ ok: true, text: `Version ${saved.version} publiée.` });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setMessage({
        ok: false,
        text: code === "permission-denied"
          ? "Publication refusée : réservée aux super administrateurs."
          : (err as Error)?.message || "Publication impossible, réessayez.",
      });
    } finally {
      setSaving(false);
    }
  };

  const warnTone = isModernSleek ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-amber-500/10 border-amber-500/30 text-amber-200";
  const btn = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`;
  const iconBtn = `p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${th.ghostBtn}`;

  return (
    <div className="space-y-4" data-testid="legal-docs-editor">
      {/* Choix du document */}
      <div className={`flex gap-1 p-1 rounded-xl border overflow-x-auto ${th.segment}`} role="tablist" aria-label="Document légal">
        {LEGAL_DOC_IDS.map((id) => {
          const count = published[id] ? countPlaceholders(published[id]!) : 0;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={docId === id}
              onClick={() => void switchDoc(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${docId === id ? th.segmentActive : th.segmentIdle}`}
            >
              {LEGAL_DOC_META[id].label}
              {count > 0 && (
                <span className={`text-[9px] font-black px-1 rounded border ${warnTone}`} title={`${count} information(s) à compléter dans la version publiée`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!current || !draft ? (
        <p className={`text-xs ${th.sub}`} role="status">Chargement du document…</p>
      ) : (
        <>
          {/* État et actions */}
          <div className={`p-4 rounded-2xl border ${th.card}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-sm font-black ${th.text}`}>{LEGAL_DOC_META[docId].title}</p>
                <p className={`text-[11px] mt-1 ${th.sub}`}>
                  {current.updatedAt
                    ? <>Version {current.version} publiée le {new Date(current.updatedAt).toLocaleString("fr-FR")}{current.updatedBy ? <> par {current.updatedBy}</> : null}.</>
                    : "Texte par défaut de The Box, jamais publié : modifiez-le puis publiez-le pour en faire la version officielle."}
                  {dirty && <span className={`ml-1 font-bold ${isModernSleek ? "text-amber-700" : "text-amber-300"}`}>● Modifications non publiées</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setPreview((v) => !v)} className={`${btn} ${th.ghostBtn}`} aria-pressed={preview}>
                  {preview ? <><PenLine className="h-3.5 w-3.5" />Modifier</> : <><Eye className="h-3.5 w-3.5" />Aperçu</>}
                </button>
                {dirty && (
                  <button type="button" onClick={() => { setDraft(toDraft(current)); setMessage(null); }} className={`${btn} ${th.ghostBtn}`}>
                    <Undo2 className="h-3.5 w-3.5" />Annuler les modifications
                  </button>
                )}
                <button type="button" onClick={() => void restoreDefault()} className={`${btn} ${th.ghostBtn}`}>
                  <RotateCcw className="h-3.5 w-3.5" />Modèle par défaut
                </button>
                <button
                  type="button"
                  disabled={saving || Boolean(problem) || (!dirty && current.version > 0)}
                  onClick={() => void publish()}
                  className={`${btn} border-transparent font-black ${th.primaryBtn}`}
                  title={problem ?? (!dirty && current.version > 0 ? "Aucune modification à publier" : "Publier pour tous les utilisateurs")}
                >
                  <Send className="h-3.5 w-3.5" />{saving ? "Publication…" : "Publier"}
                </button>
              </div>
            </div>
            {placeholders > 0 && (
              <p className={`mt-3 flex items-start gap-2 text-[11px] font-semibold px-3 py-2 rounded-xl border ${warnTone}`}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                {placeholders} information{placeholders > 1 ? "s" : ""} à compléter (repérée{placeholders > 1 ? "s" : ""} par « [À COMPLÉTER : …] »), à remplacer avant publication.
              </p>
            )}
            {problem && <p className="mt-3 text-[11px] font-semibold text-rose-400">{problem}</p>}
            {message && (
              <p className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold ${message.ok ? th.accent : "text-rose-400"}`} role="status">
                {message.ok && <CheckCircle2 className="h-3.5 w-3.5" />}{message.text}
              </p>
            )}
          </div>

          {preview ? (
            /* Aperçu tel que les utilisateurs le verront */
            <div className="space-y-3">
              {draft.intro.trim() && <p className={`p-4 rounded-2xl border text-sm font-semibold ${th.cardMuted} ${th.text}`}>{draft.intro}</p>}
              {draft.sections.map((sec, i) => (
                <section key={sec.id} className={`p-5 rounded-2xl border ${th.card}`}>
                  <h3 className={`text-sm font-black ${th.text}`}>{i + 1}. {sec.title || "(sans titre)"}</h3>
                  <div className={`mt-2.5 text-[13px] leading-6 ${th.sub}`}>
                    <LegalText
                      text={sec.body}
                      bulletClass={isModernSleek ? "bg-emerald-500" : "bg-[#00E599]"}
                      placeholderClass={isModernSleek ? "bg-amber-100 text-amber-900" : "bg-amber-400/20 text-amber-200"}
                    />
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <>
              {/* Aide de mise en forme */}
              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${th.cardMuted} ${th.sub}`}>
                <span className={`font-black ${th.text}`}>Mise en forme : </span>
                ligne vide = nouveau paragraphe · « - » en début de ligne = liste à puces · **texte** = gras · les adresses e-mail deviennent cliquables.
              </div>

              <div className={`p-4 rounded-2xl border ${th.card}`}>
                <label className={labelBase} htmlFor="legal-intro">Introduction</label>
                <textarea
                  id="legal-intro"
                  rows={3}
                  maxLength={LEGAL_LIMITS.intro}
                  value={draft.intro}
                  onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
                  className={`${inputBase} resize-y`}
                />
              </div>

              {draft.sections.map((sec, i) => (
                <div key={sec.id} className={`p-4 rounded-2xl border ${th.card}`} data-testid="legal-section">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-black tabular-nums shrink-0 ${th.chip}`}>{i + 1}</span>
                    <input
                      type="text"
                      value={sec.title}
                      maxLength={LEGAL_LIMITS.title}
                      onChange={(e) => updateSection(i, { title: e.target.value })}
                      placeholder="Titre de la section"
                      aria-label={`Titre de la section ${i + 1}`}
                      className={`${inputBase} font-bold`}
                    />
                    <button type="button" className={iconBtn} disabled={i === 0} onClick={() => moveSection(i, -1)} title="Monter" aria-label="Monter la section"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" className={iconBtn} disabled={i === draft.sections.length - 1} onClick={() => moveSection(i, 1)} title="Descendre" aria-label="Descendre la section"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" className={`${iconBtn} hover:!text-rose-400`} onClick={() => void removeSection(i)} title="Supprimer" aria-label="Supprimer la section"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <textarea
                    value={sec.body}
                    maxLength={LEGAL_LIMITS.body}
                    rows={Math.min(18, Math.max(4, sec.body.split("\n").length + 1))}
                    onChange={(e) => updateSection(i, { body: e.target.value })}
                    aria-label={`Texte de la section ${i + 1}`}
                    className={`${inputBase} mt-2 resize-y leading-relaxed`}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addSection}
                disabled={draft.sections.length >= LEGAL_LIMITS.sections}
                className={`w-full ${btn} justify-center py-2.5 border-dashed ${th.ghostBtn}`}
              >
                <Plus className="h-3.5 w-3.5" />Ajouter une section
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
