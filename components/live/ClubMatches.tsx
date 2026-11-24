"use client";
// Page du club (QR général) : matchs en direct, à venir et terminés — d'après la maquette
// « QR général — liste des matchs » du canvas Télécommande Live.
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useClubMatches, useLiveClub, useNow, type LiveMatchWithId } from "./liveHooks";
import { ACCENT, LiveScreen, Message, Spinner, TeamDot, broadcastMinute, eventTitle, initials, resultLetter } from "./ui";
import { clockSeconds, kickoffTime, periodLabel } from "@/lib/live/model";

const byKickoff = (a: LiveMatchWithId, b: LiveMatchWithId) => (kickoffTime(a) ?? a.createdAt) - (kickoffTime(b) ?? b.createdAt);

const DAYS = ["DIM.", "LUN.", "MAR.", "MER.", "JEU.", "VEN.", "SAM."];
const MONTHS = ["JANV.", "FÉVR.", "MARS", "AVR.", "MAI", "JUIN", "JUIL.", "AOÛT", "SEPT.", "OCT.", "NOV.", "DÉC."];

/** Pavé date de la liste « À venir » : jour, quantième, mois */
function DateBlock({ m }: { m: LiveMatchWithId }) {
  const t = kickoffTime(m);
  const d = t ? new Date(t) : null;
  return (
    <span className="shrink-0 w-12 flex flex-col items-center py-1 rounded-[10px] bg-[#0A0E13]">
      <span className="text-[10px] text-[#8B98A8]">{d ? DAYS[d.getDay()] : "DATE"}</span>
      <span className="tb-num text-[19px] font-bold leading-[1.1]">{d ? d.getDate() : "–"}</span>
      <span className="text-[10px] text-[#8B98A8]">{d ? MONTHS[d.getMonth()] : "À FIXER"}</span>
    </span>
  );
}

const shortDate = (m: LiveMatchWithId) => {
  const t = kickoffTime(m) ?? m.finishedAt ?? null;
  if (!t) return "";
  const d = new Date(t);
  return `${DAYS[d.getDay()].charAt(0)}${DAYS[d.getDay()].slice(1).toLowerCase()} ${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`;
};

export default function ClubMatches({ slug }: { slug: string }) {
  const { club, state: clubState } = useLiveClub(slug);
  const { matches, state } = useClubMatches(slug);
  const now = useNow(1000);
  const [team, setTeam] = useState("all");

  const teams = useMemo(() => {
    const map = new Map<string, string>();
    matches.forEach((m) => { if (m.teamId) map.set(m.teamId, m.teamName || m.home); });
    return [...map.entries()];
  }, [matches]);

  const visible = matches.filter((m) => team === "all" || m.teamId === team);
  const live = visible.filter((m) => m.status === "live" || m.status === "halftime");
  const upcoming = visible.filter((m) => m.status === "scheduled").sort(byKickoff);
  const finished = visible
    .filter((m) => m.status === "finished")
    .sort((a, b) => (b.finishedAt || kickoffTime(b) || b.updatedAt) - (a.finishedAt || kickoffTime(a) || a.updatedAt));

  if (clubState === "loading" || state === "loading") return <LiveScreen><Spinner label="Chargement des matchs…" /></LiveScreen>;
  if (clubState === "missing" || clubState === "error") {
    return <LiveScreen><Message title="Club introuvable" text="Ce QR code n'est plus valide. Demandez le nouveau lien à votre club." /></LiveScreen>;
  }

  const clubName = club?.name || "Club";
  const sectionTitle = "mt-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8B98A8]";

  return (
    <LiveScreen>
      {/* En-tête du club */}
      <header className="flex flex-col gap-3.5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-11 h-11 rounded-xl border border-[#2A3644] overflow-hidden flex items-center justify-center text-[14px] font-bold text-[#00E599]">
            {club?.logo ? <img src={club.logo} alt="" className="w-full h-full object-contain p-1" /> : initials(clubName)}
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="tb-num text-[22px] font-semibold truncate">{clubName}</h1>
            <span className="text-[12px] text-[#8B98A8]">Tous les matchs · en direct avec The Box</span>
          </div>
        </div>
        {teams.length > 1 && (
          <div className="tb-noscroll -mx-4 px-4 flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Équipes">
            {[["all", "Toutes"] as [string, string], ...teams].map(([id, name]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={team === id}
                onClick={() => setTeam(id)}
                className={`shrink-0 min-h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition ${team === id ? "bg-[#E6EDF3] text-[#0A0E13]" : "border border-[#2A3644] text-[#C9D3DE]"}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex flex-col gap-2.5">
        {visible.length === 0 && <Message title="Aucun match publié" text="Les prochains matchs apparaîtront ici dès que le coach les aura créés." />}

        {/* En direct */}
        {live.length > 0 && (
          <section className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.08em] text-[#FF8A8A]">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />EN DIRECT
            </span>
            {live.map((m) => {
              const last = (m.events || []).find((e) => e.type !== "assist");
              return (
                <Link key={m.id} href={`/live/${m.id}?depuis=club`} className="flex flex-col gap-3 p-4 rounded-[18px] bg-[#131A22] border border-[#5B1A1D] hover:border-[#7A2329]">
                  <span className="flex justify-between items-center gap-2 text-[12px] text-[#8B98A8]">
                    <span className="truncate">{[m.teamName, m.competition].filter(Boolean).join(" · ") || "Match"}</span>
                    <span className="tb-num shrink-0 text-[14px] font-semibold" style={{ color: ACCENT }}>
                      {m.status === "halftime" ? periodLabel(m.period, m.sport) : broadcastMinute(clockSeconds(m.clock, now))}
                    </span>
                  </span>
                  <span className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <TeamDot name={m.home} logo={club?.logo} tone="home" size={26} />
                      <span className="text-[14px] font-semibold truncate">{m.home}</span>
                    </span>
                    <span className="tb-num text-[32px] font-bold">{m.score.home} – {m.score.away}</span>
                    <span className="flex items-center justify-end gap-2 min-w-0">
                      <span className="text-[14px] font-semibold truncate">{m.away}</span>
                      <TeamDot name={m.away} tone="away" size={26} />
                    </span>
                  </span>
                  <span className="flex justify-between items-center gap-2 text-[12px] text-[#C9D3DE]">
                    <span className="truncate">{last ? `Dernier fait : ${eventTitle(last, m)} (${last.time})` : "Le match a commencé"}</span>
                    <span className="shrink-0 font-bold" style={{ color: ACCENT }}>Suivre</span>
                  </span>
                </Link>
              );
            })}
          </section>
        )}

        {/* À venir */}
        {upcoming.length > 0 && (
          <>
            <span className={sectionTitle}>À venir</span>
            {upcoming.map((m) => (
              <Link key={m.id} href={`/live/${m.id}?depuis=club`} className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] bg-[#131A22] border border-[#1F2A36] hover:border-[#2A3644]">
                <DateBlock m={m} />
                <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                  <span className="text-[14px] font-semibold truncate">{m.home} vs {m.away}</span>
                  <span className="text-[12px] text-[#8B98A8] truncate">{[m.competition, m.time, m.teamName].filter(Boolean).join(" · ")}</span>
                </span>
              </Link>
            ))}
          </>
        )}

        {/* Terminés */}
        {finished.length > 0 && (
          <>
            <span className={sectionTitle}>Terminés</span>
            {finished.map((m) => {
              const res = resultLetter(m);
              const resCls = res.letter === "V" ? "bg-[#00E599] text-[#04120C]" : res.letter === "D" ? "bg-[#7F1D1D] text-white" : "bg-[#334155] text-[#E6EDF3]";
              return (
                <Link key={m.id} href={`/live/${m.id}?depuis=club`} className="flex items-center gap-3 px-3.5 py-3 rounded-[14px] bg-[#131A22] border border-[#1F2A36] hover:border-[#2A3644]">
                  <span className={`shrink-0 w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[13px] font-bold ${resCls}`} aria-label={res.letter === "V" ? "Victoire" : res.letter === "D" ? "Défaite" : "Match nul"}>{res.letter}</span>
                  <span className="flex-1 min-w-0 flex flex-col gap-[3px]">
                    <span className="text-[14px] font-semibold truncate">{m.home} vs {m.away}</span>
                    <span className="text-[12px] text-[#8B98A8] truncate">{[shortDate(m), m.competition || m.teamName].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="tb-num shrink-0 text-[18px] font-bold">{m.score.home}–{m.score.away}</span>
                </Link>
              );
            })}
          </>
        )}
      </div>

      <p className="mt-auto pt-6 pb-1 text-center text-[11px] text-[#8B98A8] border-t border-[#1F2A36]">Lecture seule · Scores mis à jour en temps réel</p>
    </LiveScreen>
  );
}
