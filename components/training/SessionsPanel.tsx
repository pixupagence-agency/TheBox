"use client";

// Module Training : section « Séance » (même principe que la section « Match » du tableau tactique).
//  - créer une séance, passer d'une séance à l'autre (‹ ›), modifier son titre, sa date, son objectif ;
//  - affecter le schéma affiché à la séance : il devient un exercice (durée, joueurs utiles, ballons utiles) ;
//  - ouvrir un exercice : son schéma s'affiche sur le terrain et les modifications y sont enregistrées.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Pencil, Plus, PlusSquare, Trash2, Users, Timer } from "lucide-react";
import { confirmAction } from "@/components/ConfirmDialog";
import { useTrainingTheme } from "@/lib/training/theme";
import type { TrainingDiagram } from "@/lib/training/types";
import {
  formatMinutes, isValidIsoDate, loadSessions, newId, readActiveSessionId, saveSessions, sessionDateLabel, sortSessions,
  storeActiveSessionId, suggestedCounts, todayIso, totalDuration,
  type SessionExercise, type TrainingSession,
} from "@/lib/training/sessions";
import CollapsibleCard from "./CollapsibleCard";
import { Stepper } from "./PropertiesPanel";

const bigBtn = "h-12 rounded-xl border text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5";
const iconBtn = "h-9 w-9 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer transition disabled:opacity-35 disabled:cursor-not-allowed";

const BallIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7l4 3-1.5 4.5h-5L8 10z" />
  </svg>
);

interface Props {
  diagram: TrainingDiagram;
  /** Exercice dont le schéma est affiché (ses modifications y sont enregistrées) */
  activeExerciseId: string | null;
  onActiveExerciseChange: (id: string | null) => void;
  /** Affiche le schéma d'un exercice sur le terrain */
  onLoadDiagram: (diagram: TrainingDiagram) => void;
}

export default function SessionsPanel({ diagram, activeExerciseId, onActiveExerciseChange, onLoadDiagram }: Props) {
  const th = useTrainingTheme();
  const [sessions, setSessions] = useState<TrainingSession[]>(() => loadSessions());
  const [activeId, setActiveId] = useState<string | null>(() => readActiveSessionId());
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const firstSave = useRef(true);

  const ordered = useMemo(() => sortSessions(sessions), [sessions]);
  const session = sessions.find((s) => s.id === activeId) || ordered[0] || null;
  const index = session ? ordered.findIndex((s) => s.id === session.id) : -1;

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  // Enregistrement (puis synchronisation en ligne) à chaque modification
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    if (!saveSessions(sessions)) flash("⚠️ Enregistrement impossible : stockage de l'appareil plein.");
  }, [sessions]);

  useEffect(() => { storeActiveSessionId(session?.id ?? null); }, [session?.id]);

  // Le schéma affiché appartient à un exercice : ses modifications y sont reportées
  useEffect(() => {
    if (!activeExerciseId) return;
    const t = setTimeout(() => {
      setSessions((prev) => {
        let changed = false;
        const next = prev.map((s) => {
          if (!s.exercises.some((e) => e.id === activeExerciseId)) return s;
          changed = true;
          return {
            ...s,
            updatedAt: new Date().toISOString(),
            exercises: s.exercises.map((e) => (e.id === activeExerciseId ? { ...e, diagram } : e)),
          };
        });
        return changed ? next : prev;
      });
    }, 500);
    return () => clearTimeout(t);
  }, [diagram, activeExerciseId]);

  // Exercice supprimé ailleurs (autre séance supprimée…) : le schéma n'y est plus rattaché
  useEffect(() => {
    if (activeExerciseId && !sessions.some((s) => s.exercises.some((e) => e.id === activeExerciseId))) onActiveExerciseChange(null);
  }, [sessions, activeExerciseId, onActiveExerciseChange]);

  const patchSession = (id: string, patch: (s: TrainingSession) => TrainingSession) =>
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...patch(s), updatedAt: new Date().toISOString() } : s)));

  const patchExercise = (exId: string, patch: Partial<SessionExercise>) => {
    if (!session) return;
    patchSession(session.id, (s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) }));
  };

  const createSession = () => {
    const now = new Date().toISOString();
    const s: TrainingSession = { id: newId("seance"), title: "Entraînement", date: todayIso(), time: "18:30", exercises: [], createdAt: now, updatedAt: now };
    setSessions((prev) => [...prev, s]);
    setActiveId(s.id);
    setEditing(true);
  };

  const deleteSession = async () => {
    if (!session) return;
    const ok = await confirmAction({
      title: "Supprimer cette séance ?",
      message: `${session.title} · ${sessionDateLabel(session.date, session.time)}. Ses ${session.exercises.length} exercice(s) seront supprimés (le schéma affiché reste sur le terrain).`,
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
    if (session.exercises.some((e) => e.id === activeExerciseId)) onActiveExerciseChange(null);
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
    setActiveId(null);
    setEditing(false);
  };

  const assignCurrent = () => {
    if (!session) return;
    if (diagram.elements.length === 0) {
      flash("Le terrain est vide : dessinez l'exercice avant de l'affecter.");
      return;
    }
    if (activeExerciseId && session.exercises.some((e) => e.id === activeExerciseId)) {
      flash("Ce schéma est déjà un exercice de la séance.");
      return;
    }
    const { players, balls } = suggestedCounts(diagram);
    const ex: SessionExercise = {
      id: newId("exo"),
      title: `Exercice ${session.exercises.length + 1}`,
      duration: 15,
      players,
      balls,
      diagram,
    };
    patchSession(session.id, (s) => ({ ...s, exercises: [...s.exercises, ex] }));
    onActiveExerciseChange(ex.id);
    flash(`✅ Exercice affecté à « ${session.title} »`);
  };

  const openExercise = async (ex: SessionExercise) => {
    if (ex.id === activeExerciseId) return;
    // Schéma non rattaché à une séance : il serait perdu
    if (!activeExerciseId && diagram.elements.length > 0) {
      const ok = await confirmAction({
        title: "Remplacer le schéma affiché ?",
        message: "Le schéma actuel n'est affecté à aucune séance : il sera remplacé par celui de l'exercice. Vous pourrez revenir en arrière avec « Annuler » (Ctrl+Z).",
        confirmLabel: "Ouvrir l'exercice",
        tone: "warning",
      });
      if (!ok) return;
    }
    onActiveExerciseChange(ex.id);
    onLoadDiagram(ex.diagram);
  };

  const removeExercise = async (ex: SessionExercise) => {
    if (!session) return;
    const ok = await confirmAction({
      title: "Retirer cet exercice de la séance ?",
      message: `« ${ex.title} » sera retiré de la séance (le schéma affiché reste sur le terrain).`,
      confirmLabel: "Retirer",
      tone: "danger",
    });
    if (!ok) return;
    if (ex.id === activeExerciseId) onActiveExerciseChange(null);
    patchSession(session.id, (s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== ex.id) }));
  };

  const moveExercise = (ex: SessionExercise, dir: -1 | 1) => {
    if (!session) return;
    patchSession(session.id, (s) => {
      const list = [...s.exercises];
      const i = list.findIndex((e) => e.id === ex.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return s;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...s, exercises: list };
    });
  };

  const go = (dir: -1 | 1) => {
    const next = ordered[index + dir];
    if (next) { setActiveId(next.id); setEditing(false); }
  };

  const total = session ? totalDuration(session) : 0;
  const maxPlayers = session ? session.exercises.reduce((m, e) => Math.max(m, e.players || 0), 0) : 0;
  const maxBalls = session ? session.exercises.reduce((m, e) => Math.max(m, e.balls || 0), 0) : 0;
  const date = session && isValidIsoDate(session.date) ? new Date(`${session.date}T00:00:00`) : null;

  const actions = (
    <>
      <button type="button" onClick={createSession} className={`${iconBtn} ${th.idleBtn}`} title="Nouvelle séance" aria-label="Nouvelle séance"><Plus className="w-4 h-4" /></button>
      <button type="button" onClick={() => go(-1)} disabled={index <= 0} className={`${iconBtn} ${th.idleBtn}`} title="Séance précédente" aria-label="Séance précédente"><ChevronLeft className="w-4 h-4" /></button>
      <button type="button" onClick={() => go(1)} disabled={index < 0 || index >= ordered.length - 1} className={`${iconBtn} ${th.idleBtn}`} title="Séance suivante" aria-label="Séance suivante"><ChevronRight className="w-4 h-4" /></button>
    </>
  );

  return (
    <CollapsibleCard id="session" title="Séance" icon={CalendarDays} actions={actions}>
      {!session ? (
        <div className={`rounded-xl border border-dashed p-3 text-center space-y-2.5 ${th.hint}`}>
          <p className="text-[13px] leading-relaxed">Planifiez une séance puis affectez-y vos exercices (durée, joueurs, ballons).</p>
          <button type="button" onClick={createSession} className={`${bigBtn} w-full ${th.primaryBtn}`}><Plus className="w-5 h-5" />Créer une séance</button>
        </div>
      ) : (
        <>
          {/* En-tête de la séance */}
          {editing ? (
            <div className="space-y-2">
              <div>
                <label className={th.label} htmlFor="ses-title">Titre</label>
                <input id="ses-title" className={th.input} maxLength={60} value={session.title} onChange={(e) => patchSession(session.id, (s) => ({ ...s, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div>
                  <label className={th.label} htmlFor="ses-date">Date</label>
                  <input id="ses-date" type="date" className={th.input} value={session.date} onChange={(e) => patchSession(session.id, (s) => ({ ...s, date: e.target.value }))} />
                </div>
                <div>
                  <label className={th.label} htmlFor="ses-time">Heure</label>
                  <input id="ses-time" type="time" className={`${th.input} w-[7.5rem]`} value={session.time || ""} onChange={(e) => patchSession(session.id, (s) => ({ ...s, time: e.target.value || undefined }))} />
                </div>
              </div>
              <div>
                <label className={th.label} htmlFor="ses-theme">Objectif</label>
                <input id="ses-theme" className={th.input} maxLength={120} placeholder="Pressing, finition, vitesse…" value={session.theme || ""} onChange={(e) => patchSession(session.id, (s) => ({ ...s, theme: e.target.value || undefined }))} />
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <button type="button" onClick={() => void deleteSession()} className={`${bigBtn} w-12 ${th.dangerBtn}`} title="Supprimer la séance" aria-label="Supprimer la séance"><Trash2 className="w-5 h-5" /></button>
                <button type="button" onClick={() => setEditing(false)} className={`${bigBtn} ${th.primaryBtn}`}><Check className="w-5 h-5" />Terminé</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`w-14 shrink-0 rounded-xl border text-center py-1.5 ${th.idleBtn}`}>
                <p className={`text-[10px] font-black uppercase ${th.faint}`}>{date ? date.toLocaleDateString(undefined, { weekday: "short" }) : "—"}</p>
                <p className={`text-xl font-black leading-none ${th.text}`}>{date ? date.getDate() : "?"}</p>
                <p className={`text-[10px] font-black uppercase ${th.faint}`}>{date ? date.toLocaleDateString(undefined, { month: "short" }) : ""}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[15px] font-black truncate ${th.text}`}>{session.title || "Séance"}</p>
                {session.theme && <p className={`text-[12px] font-semibold truncate ${th.accentText}`}>{session.theme}</p>}
                <p className={`text-[12px] font-semibold ${th.sub}`}>{sessionDateLabel(session.date, session.time)}</p>
              </div>
              <button type="button" onClick={() => setEditing(true)} className={`${iconBtn} ${th.idleBtn}`} title="Modifier la séance" aria-label="Modifier la séance"><Pencil className="w-4 h-4" /></button>
            </div>
          )}

          {/* Totaux */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: <Timer className="w-3.5 h-3.5" />, value: formatMinutes(total), label: "Durée" },
              { icon: <Users className="w-3.5 h-3.5" />, value: String(maxPlayers), label: "Joueurs max." },
              { icon: <BallIcon className="w-3.5 h-3.5" />, value: String(maxBalls), label: "Ballons max." },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl border px-2 py-1.5 text-center ${th.idleBtn}`}>
                <p className={`text-[15px] font-black tabular-nums leading-tight ${th.text}`}>{k.value}</p>
                <p className={`text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1 ${th.faint}`}>{k.icon}{k.label}</p>
              </div>
            ))}
          </div>

          {/* Exercices */}
          <div className="space-y-1.5">
            <p className={`${th.label} !mb-0`}>Exercices · {session.exercises.length}</p>
            {session.exercises.length === 0 && (
              <p className={`rounded-xl border border-dashed p-2.5 text-[13px] ${th.hint}`}>Aucun exercice : dessinez un atelier puis affectez-le à la séance.</p>
            )}
            {session.exercises.map((ex, i) => {
              const active = ex.id === activeExerciseId;
              return (
                <div key={ex.id} className={`rounded-xl border ${active ? th.activeBtn : th.idleBtn}`}>
                  <div className="flex items-center gap-2 px-2.5 py-2">
                    <button type="button" onClick={() => void openExercise(ex)} className="min-w-0 flex-1 flex items-center gap-2 text-left cursor-pointer" title={active ? "Exercice affiché sur le terrain" : "Afficher cet exercice sur le terrain"}>
                      <span className={`w-6 h-6 shrink-0 rounded-md text-[12px] font-black flex items-center justify-center ${active ? th.primaryBtn : th.idleBtn} border`}>{i + 1}</span>
                      <span className="min-w-0">
                        <span className={`block text-[13.5px] font-black truncate ${th.text}`}>{ex.title || `Exercice ${i + 1}`}</span>
                        <span className={`block text-[11.5px] font-semibold ${th.sub}`}>
                          {ex.duration} min · {ex.players} joueur{ex.players > 1 ? "s" : ""} · {ex.balls} ballon{ex.balls > 1 ? "s" : ""}
                        </span>
                      </span>
                    </button>
                    {active && <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${th.accentChip}`}>Affiché</span>}
                  </div>
                  {active && (
                    <div className={`px-2.5 pb-2.5 pt-2 space-y-2 border-t ${th.sectionBorder}`}>
                      <div>
                        <label className={th.label} htmlFor={`ex-title-${ex.id}`}>Nom de l&apos;exercice</label>
                        <input id={`ex-title-${ex.id}`} className={th.input} maxLength={60} value={ex.title} onChange={(e) => patchExercise(ex.id, { title: e.target.value })} />
                      </div>
                      <div><span className={th.label}>Durée</span><Stepper value={ex.duration} min={1} max={180} step={5} suffix="min" onChange={(duration) => patchExercise(ex.id, { duration: Math.max(1, Math.round(duration)) })} /></div>
                      <div><span className={th.label}>Joueurs utiles</span><Stepper value={ex.players} min={0} max={60} onChange={(players) => patchExercise(ex.id, { players })} /></div>
                      <div><span className={th.label}>Ballons utiles</span><Stepper value={ex.balls} min={0} max={99} onChange={(balls) => patchExercise(ex.id, { balls })} /></div>
                      <div className="grid grid-cols-[auto_auto_1fr] gap-1.5">
                        <button type="button" onClick={() => moveExercise(ex, -1)} disabled={i === 0} className={`${bigBtn} w-12 ${th.idleBtn} disabled:opacity-35`} aria-label="Monter l'exercice" title="Monter"><ChevronLeft className="w-5 h-5 rotate-90" /></button>
                        <button type="button" onClick={() => moveExercise(ex, 1)} disabled={i === session.exercises.length - 1} className={`${bigBtn} w-12 ${th.idleBtn} disabled:opacity-35`} aria-label="Descendre l'exercice" title="Descendre"><ChevronRight className="w-5 h-5 rotate-90" /></button>
                        <button type="button" onClick={() => void removeExercise(ex)} className={`${bigBtn} ${th.dangerBtn}`}><Trash2 className="w-4 h-4" />Retirer</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={assignCurrent}
            disabled={!!activeExerciseId && session.exercises.some((e) => e.id === activeExerciseId)}
            className={`${bigBtn} w-full ${th.primaryBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <PlusSquare className="w-5 h-5" />Affecter le schéma à la séance
          </button>
        </>
      )}
      {toast && <p role="status" className={`text-[12.5px] font-bold rounded-lg border px-2.5 py-2 ${th.accentChip}`}>{toast}</p>}
    </CollapsibleCard>
  );
}
