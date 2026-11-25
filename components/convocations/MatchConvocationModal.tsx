"use client";

// Tableau tactique (section du match, mode live) : envoi de la convocation du match au module Convocations.
// Les convoqués proposés sont les joueurs du groupe du match (terrain + banc), pas l'effectif complet de l'équipe.
// La convocation est enregistrée dans « thebox_convocations » (synchronisée) : le module /convocations la reprend.
import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ClipboardCheck, Clock, MapPin, Send, Users, X } from "lucide-react";
import { getPremiumTheme, premiumLabel, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";
import {
  ROSTER_STATUS_LABELS, isUnavailableRosterStatus, isValidIsoDate, isValidTime, longDate, mergeSelection,
  newConvocationId, sortPlayers, todayIso, toConvocationPlayer,
  type Convocation, type RosterPlayerLike,
} from "@/lib/convocations/model";
import { loadConvocations, saveConvocations } from "@/lib/convocations/storage";

export interface MatchConvocationModalProps {
  isModernSleek: boolean;
  teamId: string;
  teamName: string;
  match: { id: string; competition?: string; date?: string; time?: string };
  opponent: string;
  isHome: boolean;
  /** Groupe du match (joueurs du terrain et du banc, sans distinction) */
  players: RosterPlayerLike[];
  onClose: () => void;
  onSent: (message: string) => void;
}

const ORANGE_BTN = "bg-[#FF8A1F] hover:bg-[#FF9D42] text-[#1A0E00] shadow-lg shadow-[#FF8A1F]/15";

export default function MatchConvocationModal({
  isModernSleek, teamId, teamName, match, opponent, isHome, players, onClose, onSent,
}: MatchConvocationModalProps) {
  const th = getPremiumTheme(isModernSleek);
  const existing = useMemo(
    () => loadConvocations().find((c) => c.kind === "match" && c.matchId === match.id && c.teamId === teamId) || null,
    [match.id, teamId]
  );
  const group = useMemo(() => {
    // Un même joueur ne peut apparaître qu'une fois (pion et remplaçant reliés à la même fiche)
    const seen = new Set<string>();
    return players.filter((p) => p.id && p.name && !seen.has(p.id) && (seen.add(p.id), true));
  }, [players]);

  const [selected, setSelected] = useState<string[]>(() =>
    existing
      ? existing.players.filter((p) => !p.addedOnSite && group.some((g) => g.id === p.playerId)).map((p) => p.playerId)
      : group.filter((p) => !isUnavailableRosterStatus(p.status)).map((p) => p.id)
  );
  const [meetTime, setMeetTime] = useState(existing?.meetTime || "");
  const [place, setPlace] = useState(existing?.place || "");
  const [message, setMessage] = useState(existing?.message || "");
  const [deadline, setDeadline] = useState(existing?.deadline || "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const date = isValidIsoDate(match.date) ? match.date! : "";
  const startTime = isValidTime(match.time) ? match.time! : "";
  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const fieldCls = `w-full h-11 rounded-xl px-3 text-sm font-semibold border outline-none transition ${th.input}`;

  const send = () => {
    if (selected.length === 0) return;
    const now = new Date().toISOString();
    const list = loadConvocations();
    const fields = {
      kind: "match" as const,
      teamId,
      date: date || todayIso(),
      startTime: startTime || undefined,
      meetTime: isValidTime(meetTime) ? meetTime : undefined,
      place: place.trim() || undefined,
      message: message.trim() || undefined,
      deadline: deadline || undefined,
      matchId: match.id,
      opponent: opponent.trim() || "Adversaire",
      isHome,
      competition: match.competition?.trim() || undefined,
    };
    const ordered = sortPlayers(group.filter((p) => selected.includes(p.id))).map((p) => p.id);
    let next: Convocation[];
    if (existing && list.some((c) => c.id === existing.id)) {
      next = list.map((c) =>
        c.id === existing.id
          ? { ...c, ...fields, players: mergeSelection(c.players.filter((p) => !p.addedOnSite), ordered, group), updatedAt: now }
          : c
      );
    } else {
      const created: Convocation = {
        id: newConvocationId(),
        ...fields,
        players: sortPlayers(group.filter((p) => selected.includes(p.id)).map(toConvocationPlayer)),
        createdAt: now,
        updatedAt: now,
      };
      next = [...list, created];
    }
    if (!saveConvocations(next)) {
      onSent("⚠️ Enregistrement impossible : stockage de l'appareil plein.");
      return;
    }
    onSent(
      existing
        ? `✅ Convocation mise à jour · ${selected.length} joueur${selected.length > 1 ? "s" : ""}`
        : `✅ Convocation envoyée au module Convocations · ${selected.length} joueur${selected.length > 1 ? "s" : ""}`
    );
    onClose();
  };

  const renderPlayer = (p: RosterPlayerLike) => {
    const on = selected.includes(p.id);
    const statusLabel = p.status ? ROSTER_STATUS_LABELS[p.status] : undefined;
    return (
      <label
        key={p.id}
        className={`min-h-10 flex items-center gap-2.5 px-3 py-1.5 rounded-xl border cursor-pointer transition ${on
          ? "border-[#FF8A1F]/60 bg-[#FF8A1F]/[0.07] ring-2 ring-[#FF8A1F]/10"
          : th.selectable}`}
      >
        <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="w-4 h-4 accent-orange-500 cursor-pointer shrink-0" />
        <span className={`w-6 text-center text-xs font-black tabular-nums ${th.sub}`}>{p.number ?? "–"}</span>
        <span className={`text-sm font-bold truncate flex-1 ${th.text}`}>{p.name}</span>
        {statusLabel && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${isUnavailableRosterStatus(p.status) ? th.danger : th.chip}`}>{statusLabel}</span>
        )}
      </label>
    );
  };

  return (
    <div className={`${premiumOverlay} z-[120]`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Convoquer les joueurs du match" className={`${premiumShell} !flex-col w-full max-w-lg max-h-[92vh] ${th.panel}`}>
        <header className={`shrink-0 px-5 pt-5 pb-4 border-b flex items-start gap-3 ${th.border}`}>
          <div className="w-10 h-10 rounded-2xl border border-[#FF8A1F]/30 bg-[#FF8A1F]/10 text-[#FF8A1F] flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF8A1F]">Convocation du match</p>
            <h2 className={`text-lg font-black tracking-tight truncate ${th.text}`}>
              {isHome ? `${teamName} vs ${opponent || "Adversaire"}` : `${opponent || "Adversaire"} vs ${teamName}`}
            </h2>
            <p className={`text-xs font-semibold mt-0.5 flex flex-wrap items-center gap-x-2 ${th.sub}`}>
              <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />{date ? longDate(date) : "Date à définir"}</span>
              {startTime && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{startTime}</span>}
              {match.competition && <span>{match.competition}</span>}
            </p>
          </div>
          <button type="button" onClick={onClose} className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${th.ghostBtn}`} aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
          {existing && (
            <p className={`text-xs font-bold p-3 rounded-xl border ${th.goldChip}`}>
              Ce match a déjà une convocation : elle sera mise à jour, les réponses déjà reçues sont conservées.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mc-meet" className={`${premiumLabel} ${th.sub}`}>Rendez-vous</label>
              <input id="mc-meet" type="time" value={meetTime} onChange={(e) => setMeetTime(e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label htmlFor="mc-deadline" className={`${premiumLabel} ${th.sub}`}>Réponse avant</label>
              <input id="mc-deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={fieldCls} />
            </div>
            <div className="col-span-2">
              <label htmlFor="mc-place" className={`${premiumLabel} ${th.sub}`}><MapPin className="inline w-3 h-3 -mt-0.5" /> Lieu</label>
              <input id="mc-place" type="text" value={place} onChange={(e) => setPlace(e.target.value)} className={fieldCls} placeholder="Stade" maxLength={120} />
            </div>
            <div className="col-span-2">
              <label htmlFor="mc-message" className={`${premiumLabel} ${th.sub}`}>Mot du coach</label>
              <textarea id="mc-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={1000} placeholder="Tenue, matériel, consignes…" className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold border outline-none transition resize-y ${th.input}`} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`${premiumLabel} !mb-0 ${th.sub}`}>
                <Users className="inline w-3 h-3 -mt-0.5" /> Groupe · {selected.length}/{group.length} convoqué{selected.length > 1 ? "s" : ""}
              </span>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setSelected(group.map((p) => p.id))} className={`h-8 px-2.5 rounded-lg border text-[11px] font-black cursor-pointer ${th.ghostBtn}`}>Tous</button>
                <button type="button" onClick={() => setSelected([])} className={`h-8 px-2.5 rounded-lg border text-[11px] font-black cursor-pointer ${th.ghostBtn}`}>Aucun</button>
              </div>
            </div>
            {group.length === 0 ? (
              <p className={`text-xs font-semibold p-3 rounded-xl border ${th.cardMuted} ${th.sub}`}>
                Le groupe de ce match est vide : ajoutez des joueurs au groupe depuis l&apos;effectif.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">{sortPlayers(group).map(renderPlayer)}</div>
            )}
          </div>
        </div>

        <footer className={`shrink-0 px-5 py-4 border-t flex items-center justify-end gap-2 ${th.border}`}>
          <button type="button" onClick={onClose} className={`h-11 px-4 rounded-xl border text-sm font-black cursor-pointer ${th.ghostBtn}`}>Annuler</button>
          <button
            type="button"
            onClick={send}
            disabled={selected.length === 0}
            className={`h-11 px-4 rounded-xl text-sm font-black cursor-pointer inline-flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${ORANGE_BTN}`}
          >
            {existing ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {existing ? "Mettre à jour la convocation" : "Envoyer la convocation"}
          </button>
        </footer>
      </div>
    </div>
  );
}
