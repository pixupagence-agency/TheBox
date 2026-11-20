"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Share2, Clock, Trophy } from "lucide-react";
import { useLiveClub, useLiveMatch, useNow } from "./liveHooks";
import { EventRow, LiveScreen, Message, Spinner, StatusPill, TeamCrest, eventIcon, resultLetter } from "./ui";
import { clockSeconds, formatClock, formatKickoff, kickoffTime, periodLabel, type LiveEvent, type LiveMatchDoc } from "@/lib/live/model";

const countdown = (ms: number) => {
  if (ms <= 0) return "Coup d'envoi imminent";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `Dans ${d} j ${h} h`;
  if (h > 0) return `Dans ${h} h ${String(m).padStart(2, "0")}`;
  return `Dans ${Math.max(1, m)} min`;
};

const share = async (title: string, text: string) => {
  const url = window.location.href;
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try { await nav.share({ title, text, url }); return; } catch { return; }
  }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); alert("Lien copié"); } catch { /* ignore */ }
};

function Scoreboard({ match, logo, now }: { match: LiveMatchDoc; logo?: string; now: number }) {
  const secs = clockSeconds(match.clock, now);
  const running = Boolean(match.clock?.runningSince);
  const scheduled = match.status === "scheduled";
  const kickoff = kickoffTime(match);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0B1118] p-4">
      <div className="flex justify-center mb-3"><StatusPill match={match} /></div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
          <TeamCrest name={match.home} logo={logo} tone="home" />
          <p className="w-full text-center text-[12.5px] font-black uppercase truncate" title={match.home}>{match.home}</p>
        </div>
        <div className="shrink-0 text-center px-1">
          {scheduled ? (
            <p className="text-[20px] font-black text-slate-400">VS</p>
          ) : (
            <p className="text-[40px] leading-none font-black font-mono tracking-tight">
              {match.score.home}<span className="text-slate-600 mx-1.5">-</span>{match.score.away}
            </p>
          )}
          {!scheduled && match.status !== "finished" && (
            <p className={`mt-1.5 font-mono text-[14px] font-bold ${running ? "text-[#00E599]" : "text-slate-400"}`}>
              {match.status === "halftime" ? periodLabel(match.period, match.sport) : `${formatClock(secs)}${running ? "" : " · pause"}`}
            </p>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
          <TeamCrest name={match.away} tone="away" />
          <p className="w-full text-center text-[12.5px] font-black uppercase truncate" title={match.away}>{match.away}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.06] text-center text-[12px] text-slate-400 font-semibold">
        {[match.competition, formatKickoff(match)].filter(Boolean).join(" · ")}
        {scheduled && kickoff && <p className="mt-1 text-[#00E599] font-black text-[13px]">{countdown(kickoff - now)}</p>}
      </div>
    </div>
  );
}

function Lineup({ match }: { match: LiveMatchDoc }) {
  const { onPitch = [], bench = [] } = match.lineup || {};
  if (!onPitch.length && !bench.length) {
    return <p className="text-center text-[13px] text-slate-500 py-8">La composition sera publiée par le coach.</p>;
  }
  const row = (p: { id: string; n?: number; name: string }) => (
    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/[0.06] last:border-0">
      <span className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[12px] font-black text-[#00E599]">{p.n ?? "–"}</span>
      <span className="text-[13.5px] font-semibold truncate">{p.name}</span>
    </div>
  );
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Titulaires · {onPitch.length}</p>
        <div className="rounded-xl border border-white/[0.08] bg-[#0B1118] px-3">{onPitch.map(row)}</div>
      </div>
      {bench.length > 0 && (
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Remplaçants · {bench.length}</p>
          <div className="rounded-xl border border-white/[0.08] bg-[#0B1118] px-3">{bench.map(row)}</div>
        </div>
      )}
    </div>
  );
}

function Timeline({ match, events }: { match: LiveMatchDoc; events: LiveEvent[] }) {
  if (!events.length) {
    return <p className="text-center text-[13px] text-slate-500 py-8">{match.status === "scheduled" ? "Le direct commencera au coup d'envoi." : "Aucun événement pour l'instant."}</p>;
  }
  return <div className="rounded-xl border border-white/[0.08] bg-[#0B1118] px-3">{events.map((ev) => <EventRow key={ev.id} ev={ev} match={match} />)}</div>;
}

/** Page résumé d'un match terminé */
function Summary({ match, events }: { match: LiveMatchDoc; events: LiveEvent[] }) {
  const goals = events.filter((e) => e.type === "goal");
  const cards = events.filter((e) => e.type === "yellow" || e.type === "red");
  const res = resultLetter(match);
  const chronological = [...events].reverse();
  const scorers = (team: "home" | "away") => goals.filter((g) => g.team === team);
  const caption = `Score final : ${match.home} ${match.score.home} - ${match.score.away} ${match.away}` +
    (goals.length ? `\n${goals.filter((g) => g.team === "home").map((g) => `${g.player} ${g.time}`).join(", ")}` : "");
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.08] bg-[#0B1118] p-3.5 flex items-center gap-3">
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-[15px] font-black ${res.cls}`}>{res.letter}</span>
        <div className="min-w-0">
          <p className="text-[14px] font-black">{res.letter === "V" ? "Victoire" : res.letter === "D" ? "Défaite" : "Match nul"}</p>
          <p className="text-[12px] text-slate-400">{match.teamName ? `${match.teamName} · ` : ""}{match.competition || "Match"}</p>
        </div>
        <button type="button" onClick={() => share("Résumé du match", caption)} className="ml-auto h-9 px-3 rounded-lg bg-[#00E599] text-slate-950 text-[12px] font-black inline-flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5" />Partager
        </button>
      </div>

      {goals.length > 0 && (
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Buteurs</p>
          <div className="rounded-xl border border-white/[0.08] bg-[#0B1118] p-3 grid grid-cols-2 gap-3">
            {(["home", "away"] as const).map((team) => (
              <div key={team} className={team === "away" ? "text-right" : ""}>
                <p className="text-[11px] font-black text-slate-500 uppercase truncate mb-1">{team === "home" ? match.home : match.away}</p>
                {scorers(team).length === 0 && <p className="text-[12px] text-slate-600">—</p>}
                {scorers(team).map((g) => (
                  <p key={g.id} className="text-[12.5px] font-semibold truncate">
                    {eventIcon(g, match.sport)} {g.player} <span className="text-slate-400 font-mono">{g.time}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Buts", value: `${match.score.home} - ${match.score.away}` },
          { label: "Cartons", value: String(cards.filter((c) => c.team === "home").length) },
          { label: "Changements", value: String(events.filter((e) => e.type === "sub" && e.team === "home").length) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.08] bg-[#0B1118] p-2.5 text-center">
            <p className="text-[17px] font-black font-mono">{s.value}</p>
            <p className="text-[10.5px] text-slate-400 font-bold uppercase">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="-mt-2 text-[10.5px] text-slate-500 text-center">Cartons et changements : {match.home}</p>

      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Faits du match</p>
        <Timeline match={match} events={chronological} />
      </div>

      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Composition finale</p>
        <Lineup match={match} />
      </div>
    </div>
  );
}

export default function LiveFollower({ id }: { id: string }) {
  const { match, state } = useLiveMatch(id);
  const { club } = useLiveClub(match?.clubSlug);
  const now = useNow(1000);
  const [tab, setTab] = useState<"live" | "lineup">("live");
  const events = useMemo(() => (match?.events || []).filter((e) => e.type !== "assist"), [match?.events]);

  if (state === "loading") return <LiveScreen><Spinner label="Chargement du match…" /></LiveScreen>;
  if (state !== "ready" || !match) {
    return <LiveScreen><Message title="Match introuvable" text="Ce lien n'est plus valide ou le match a été supprimé par le coach." /></LiveScreen>;
  }

  const finished = match.status === "finished";
  return (
    <LiveScreen>
      <header className="flex items-center gap-2 pt-4 pb-3">
        {match.clubSlug ? (
          <Link href={`/club/${match.clubSlug}`} className="h-9 pl-1.5 pr-3 rounded-full bg-white/[0.06] text-[12.5px] font-bold inline-flex items-center gap-1 hover:bg-white/[0.1]">
            <ChevronLeft className="w-4 h-4" />Tous les matchs
          </Link>
        ) : <span />}
        <div className="ml-auto flex items-center gap-2 min-w-0">
          <span className="text-[12px] font-bold text-slate-400 truncate">{club?.name || match.clubName}</span>
          {club?.logo && <img src={club.logo} alt="" className="w-7 h-7 rounded-full object-contain bg-white/5" />}
        </div>
      </header>

      <Scoreboard match={match} logo={club?.logo} now={now} />

      {finished ? (
        <div className="mt-4">
          <p className="text-[15px] font-black mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-[#00E599]" />Résumé du match</p>
          <Summary match={match} events={events} />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.05]">
            {([["live", match.status === "scheduled" ? "Infos" : "Direct"], ["lineup", "Composition"]] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`h-9 rounded-lg text-[13px] font-black transition ${tab === key ? "bg-[#00E599] text-slate-950" : "text-slate-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            {tab === "live" ? (
              match.status === "scheduled" ? (
                <div className="rounded-xl border border-white/[0.08] bg-[#0B1118] p-4 text-center space-y-1.5">
                  <Clock className="w-5 h-5 mx-auto text-[#00E599]" />
                  <p className="text-[14px] font-black">{formatKickoff(match)}</p>
                  <p className="text-[12.5px] text-slate-400">Gardez cette page ouverte : le score s’affichera en direct dès le coup d’envoi.</p>
                </div>
              ) : (
                <Timeline match={match} events={events} />
              )
            ) : (
              <Lineup match={match} />
            )}
          </div>
        </>
      )}

      <p className="mt-auto pt-8 text-center text-[11px] text-slate-600">Live publié avec The Box · lecture seule</p>
    </LiveScreen>
  );
}
