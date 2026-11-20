"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useClubMatches, useLiveClub, useNow, type LiveMatchWithId } from "./liveHooks";
import { LiveScreen, Message, Spinner, TeamCrest, eventIcon, initials, resultLetter } from "./ui";
import { clockSeconds, formatKickoff, kickoffTime, periodLabel } from "@/lib/live/model";

const byKickoff = (a: LiveMatchWithId, b: LiveMatchWithId) => (kickoffTime(a) ?? a.createdAt) - (kickoffTime(b) ?? b.createdAt);

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

  return (
    <LiveScreen>
      <header className="pt-6 pb-4 flex items-center gap-3">
        <span className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 overflow-hidden flex items-center justify-center text-[18px] font-black text-[#00E599] shrink-0">
          {club?.logo ? <img src={club.logo} alt={clubName} className="w-full h-full object-contain p-1.5" /> : initials(clubName)}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black text-[#00E599] uppercase tracking-wider">Matchs du club</p>
          <h1 className="text-[20px] font-black truncate">{clubName}</h1>
        </div>
      </header>

      {teams.length > 1 && (
        <div className="tb-noscroll -mx-4 px-4 flex gap-2 overflow-x-auto pb-3">
          {[["all", "Toutes"] as [string, string], ...teams].map(([id, name]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTeam(id)}
              className={`h-8 px-3.5 rounded-full text-[12.5px] font-bold whitespace-nowrap border transition ${team === id ? "bg-[#00E599] text-slate-950 border-[#00E599]" : "bg-white/[0.04] text-slate-300 border-white/10"}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 && <Message title="Aucun match publié" text="Les prochains matchs apparaîtront ici dès que le coach les aura créés." />}

      {live.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[12px] font-black text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />En direct
          </h2>
          <div className="space-y-2.5">
            {live.map((m) => {
              const last = (m.events || []).find((e) => e.type !== "assist" && e.type !== "note");
              const minute = Math.floor(clockSeconds(m.clock, now) / 60);
              return (
                <Link key={m.id} href={`/live/${m.id}`} className="block rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-500/[0.08] to-[#0B1118] p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                    <span className="truncate">{m.teamName || m.competition}</span>
                    <span className="text-rose-300 font-black shrink-0">{m.status === "halftime" ? periodLabel(m.period, m.sport) : `${minute}'`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TeamCrest name={m.home} logo={club?.logo} size={34} />
                    <p className="flex-1 min-w-0 text-[13px] font-black uppercase truncate">{m.home}</p>
                    <p className="text-[22px] font-black font-mono shrink-0">{m.score.home} - {m.score.away}</p>
                    <p className="flex-1 min-w-0 text-[13px] font-black uppercase truncate text-right">{m.away}</p>
                    <TeamCrest name={m.away} tone="away" size={34} />
                  </div>
                  {last && (
                    <p className="mt-2 text-[12px] text-slate-300 truncate">
                      {eventIcon(last, m.sport)} {last.player} ({last.time})
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-wider mb-2">À venir</h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B1118] divide-y divide-white/[0.06]">
            {upcoming.map((m) => (
              <Link key={m.id} href={`/live/${m.id}`} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-[#00E599]">{formatKickoff(m)}</p>
                  <p className="text-[13.5px] font-black truncate">{m.home} <span className="text-slate-500 font-bold">vs</span> {m.away}</p>
                  <p className="text-[11.5px] text-slate-400 truncate">{[m.teamName, m.competition].filter(Boolean).join(" · ")}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-wider mb-2">Terminés</h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B1118] divide-y divide-white/[0.06]">
            {finished.map((m) => {
              const res = resultLetter(m);
              return (
                <Link key={m.id} href={`/live/${m.id}`} className="flex items-center gap-3 p-3.5">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-black shrink-0 ${res.cls}`}>{res.letter}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-black truncate">{m.home} <span className="text-slate-500 font-bold">vs</span> {m.away}</p>
                    <p className="text-[11.5px] text-slate-400 truncate">{[formatKickoff(m), m.teamName].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="text-[16px] font-black font-mono shrink-0">{m.score.home} - {m.score.away}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <p className="mt-auto pt-6 text-center text-[11px] text-slate-600">Matchs publiés avec The Box</p>
    </LiveScreen>
  );
}
