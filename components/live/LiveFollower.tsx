"use client";
// Suivi public d'un match (parents, club) et résumé une fois terminé — d'après les maquettes
// « Suiveur — lecture seule » et « Résumé d'un match terminé » du canvas Télécommande Live.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Share2, Link2 } from "lucide-react";
import { useLiveClub, useLiveMatch, useNow } from "./liveHooks";
import {
  ACCENT,
  BackSquare,
  LivePill,
  LiveScreen,
  MatchTimeline,
  Message,
  SegmentTabs,
  Spinner,
  TeamDot,
  broadcastMinute,
  eventTitle,
  resultLetter,
} from "./ui";
import {
  LIVE_REACTIONS, clockSeconds, formatKickoff, kickoffTime, periodLabel, reactionTotal,
  type LiveEvent, type LiveMatchDoc, type LivePlayer, type LiveReactionId,
} from "@/lib/live/model";

const countdown = (ms: number) => {
  if (ms <= 0) return "Coup d'envoi imminent";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `Dans ${d} j ${h} h`;
  if (h > 0) return `Dans ${h} h ${String(m).padStart(2, "0")}`;
  return `Dans ${Math.max(1, m)} min`;
};

/** Partage natif, sinon copie du lien ; renvoie le message à afficher */
const shareOrCopy = async (title: string, text: string): Promise<string | null> => {
  const url = window.location.href;
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try { await nav.share({ title, text, url }); return null; } catch { return null; }
  }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); return "Lien copié"; } catch { return "Copie impossible : copiez l'adresse de la page"; }
};

const copyLink = async (): Promise<string> => {
  try { await navigator.clipboard.writeText(window.location.href); return "Lien copié"; } catch { return "Copie impossible : copiez l'adresse de la page"; }
};

/** Buteurs d'une équipe regroupés : « Simon 12', 61' » */
const scorersLine = (events: LiveEvent[], team: "home" | "away") => {
  const byName = new Map<string, string[]>();
  [...events].reverse().forEach((e) => {
    if (e.type !== "goal" || e.team !== team) return;
    const name = e.subType === "own_goal" ? "CSC" : e.player;
    byName.set(name, [...(byName.get(name) || []), `${e.time}${e.subType === "penalty" ? " (pen.)" : ""}`]);
  });
  return [...byName.entries()].map(([name, times]) => `${name} ${times.join(", ")}`).join(" · ");
};

// ---------------------------------------------------------------------------
// Score
// ---------------------------------------------------------------------------

function ScoreCard({ match, logo, now, events }: { match: LiveMatchDoc; logo?: string; now: number; events: LiveEvent[] }) {
  const secs = clockSeconds(match.clock, now);
  const running = Boolean(match.clock?.runningSince);
  const scheduled = match.status === "scheduled";
  const finished = match.status === "finished";
  const kickoff = kickoffTime(match);
  const homeLine = scorersLine(events, "home");
  const awayLine = scorersLine(events, "away");
  return (
    <section aria-label="Score" className="bg-[#131A22] border border-[#1F2A36] rounded-[20px] p-4 flex flex-col gap-2.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex flex-col items-center gap-2 min-w-0">
          <TeamDot name={match.home} logo={logo} tone="home" />
          <span className="w-full text-center text-[12px] font-semibold tracking-[0.04em] uppercase truncate" title={match.home}>{match.home}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          {scheduled ? (
            <span className="tb-num text-[28px] font-bold text-[#8B98A8] leading-none">VS</span>
          ) : (
            <span className="tb-num text-[56px] font-bold leading-none">
              {match.score.home}<span className="text-[#4B5868] px-2">–</span>{match.score.away}
            </span>
          )}
          {!scheduled && !finished && match.status !== "halftime" && (
            <span className={`tb-num inline-flex items-center gap-1.5 text-[16px] font-semibold ${running ? "text-[#00E599]" : "text-[#FDBA74]"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${running ? "bg-[#00E599] animate-pulse" : "bg-[#FDBA74]"}`} />
              {broadcastMinute(secs)}{running ? "" : " · pause"}
            </span>
          )}
          <span className="text-[11px] text-[#8B98A8] tracking-[0.06em] uppercase">
            {scheduled ? formatKickoff(match) : finished ? "Score final" : periodLabel(match.period, match.sport)}
          </span>
          {scheduled && kickoff && <span className="text-[13px] font-bold text-[#00E599]">{countdown(kickoff - now)}</span>}
        </div>
        <div className="flex flex-col items-center gap-2 min-w-0">
          <TeamDot name={match.away} tone="away" />
          <span className="w-full text-center text-[12px] font-semibold tracking-[0.04em] uppercase truncate" title={match.away}>{match.away}</span>
        </div>
      </div>
      {(homeLine || awayLine) && (
        <div className="grid grid-cols-2 gap-3 text-[12px] text-[#C9D3DE] leading-relaxed">
          <span>{homeLine}</span>
          <span className="text-right">{awayLine}</span>
        </div>
      )}
    </section>
  );
}

/** Dernier fait marquant (dernier but) */
function Highlight({ match, events }: { match: LiveMatchDoc; events: LiveEvent[] }) {
  const last = events.find((e) => e.type === "goal");
  if (!last) return null;
  const home = last.team === "home";
  return (
    <div className={`flex items-center gap-3 px-3.5 py-3 rounded-[14px] border ${home ? "bg-[#0E2A1F] border-[#14533A]" : "bg-[#2A0F12] border-[#5B1A1D]"}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={home ? ACCENT : "#F87171"} strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5l4 2.9-1.5 4.6h-5L8 10.4z" /></svg>
      <div className="min-w-0 flex flex-col">
        <span className="text-[14px] font-bold truncate">{home ? "BUT ! " : ""}{eventTitle(last, match)} — {last.time}</span>
        <span className={`text-[12px] truncate ${home ? "text-[#A7C4B8]" : "text-[#F5B5B5]"}`}>
          {last.assister ? `Passe décisive de ${last.assister}` : home ? match.home : match.away}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

/** Proportions du terrain (largeur / longueur) selon le sport */
const PITCH_RATIO: Record<string, number> = { football: 68 / 105, soccer: 68 / 105, rugby: 70 / 100, handball: 20 / 40, basketball: 15 / 28 };

/** Tracés simplifiés du terrain, vu en portrait (notre but en bas) */
function PitchMarkings({ sport }: { sport: string }) {
  const line = "absolute border-white/35";
  const ends = (render: (pos: "top" | "bottom") => React.ReactNode) => (["top", "bottom"] as const).map((pos) => <React.Fragment key={pos}>{render(pos)}</React.Fragment>);
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      <div className={`${line} inset-[3%] border-2 rounded-[2px]`} />
      <div className={`${line} left-[3%] right-[3%] top-1/2 border-t-2`} />
      <div className={`${line} left-1/2 top-1/2 w-[26%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2`} />
      {(sport === "football" || sport === "soccer") && ends((pos) => (
        <>
          <div className={`${line} left-[20%] right-[20%] h-[16%] border-2 ${pos === "top" ? "top-[3%] border-t-0" : "bottom-[3%] border-b-0"}`} />
          <div className={`${line} left-[36%] right-[36%] h-[5.5%] border-2 ${pos === "top" ? "top-[3%] border-t-0" : "bottom-[3%] border-b-0"}`} />
        </>
      ))}
      {sport === "handball" && ends((pos) => (
        <div className={`${line} left-[22%] right-[22%] h-[16%] border-2 ${pos === "top" ? "top-[3%] border-t-0 rounded-b-full" : "bottom-[3%] border-b-0 rounded-t-full"}`} />
      ))}
      {sport === "basketball" && ends((pos) => (
        <div className={`${line} left-[34%] right-[34%] h-[20%] border-2 ${pos === "top" ? "top-[3%] border-t-0" : "bottom-[3%] border-b-0"}`} />
      ))}
      {sport === "rugby" && ends((pos) => (
        <div className={`${line} left-[3%] right-[3%] border-t-2 border-dashed ${pos === "top" ? "top-[24%]" : "bottom-[24%]"}`} />
      ))}
    </div>
  );
}

/** Titulaires placés comme sur le tableau tactique du coach */
function LineupPitch({ match, players }: { match: LiveMatchDoc; players: (LivePlayer & { x: number; y: number })[] }) {
  const sport = (match.sport || "football").toLowerCase();
  const ratio = PITCH_RATIO[sport] ?? PITCH_RATIO.football;
  const clamp = (v: number) => Math.max(5, Math.min(95, v));
  return (
    <div
      className="relative w-full max-w-[340px] mx-auto rounded-2xl overflow-hidden border border-[#1E4A36] shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]"
      style={{
        aspectRatio: `${ratio}`,
        backgroundColor: "#2a7a30",
        backgroundImage: "linear-gradient(rgba(5,8,11,0.28), rgba(5,8,11,0.28)), url(/images/live-grass.jpg)",
        backgroundSize: "100% 100%, auto 120px",
      }}
      role="img"
      aria-label={`Composition de ${match.home} : ${players.map((p) => (p.n ? `${p.n} ${p.name}` : p.name)).join(", ")}`}
    >
      <PitchMarkings sport={sport} />
      {players.map((p) => (
        <div
          key={p.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-[3px] w-[70px]"
          // Même repère que le tableau du coach en vue portrait : notre but en bas
          style={{ left: `${clamp(p.y)}%`, top: `${clamp(100 - p.x)}%` }}
        >
          <span
            className={`tb-num w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.5)] ${p.gk ? "bg-[#FACC15] text-[#1A1400]" : "bg-[#00E599] text-[#04120C]"}`}
          >
            {p.n ?? "–"}
          </span>
          <span className="max-w-full truncate px-1 rounded bg-black/45 text-[11px] leading-[15px] text-[#E6EDF3]">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

function Lineup({ match, events }: { match: LiveMatchDoc; events?: LiveEvent[] }) {
  const { onPitch = [], bench = [] } = match.lineup || {};
  if (!onPitch.length && !bench.length) {
    return <p className="text-center text-[13px] text-[#8B98A8] py-8">La composition sera publiée par le coach.</p>;
  }
  // Composition placée sur le tableau du coach (les anciens matchs n'ont que la liste des joueurs)
  const placed = onPitch.filter((p): p is LivePlayer & { x: number; y: number } => typeof p.x === "number" && typeof p.y === "number");
  const showPitch = placed.length > 0 && placed.length === onPitch.length;
  const subs = (events || []).filter((e) => e.type === "sub" && e.team === "home");
  const label = "text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8B98A8]";
  return (
    <div className="flex flex-col gap-3">
      {showPitch ? (
        <LineupPitch match={match} players={placed} />
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className={label}>Titulaires · {onPitch.length}</span>
          <div className="flex flex-wrap gap-1.5">
            {onPitch.map((p) => <span key={p.id} className="px-2.5 py-1.5 rounded-lg bg-[#131A22] text-[13px]">{p.n ? `${p.n} ` : ""}{p.name}</span>)}
          </div>
        </div>
      )}
      {bench.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className={label}>Remplaçants</span>
          <div className="flex flex-wrap gap-1.5">
            {bench.map((p) => <span key={p.id} className="px-2.5 py-1.5 rounded-lg bg-[#131A22] text-[13px]">{p.n ? `${p.n} ` : ""}{p.name}</span>)}
          </div>
        </div>
      )}
      {subs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className={label}>Changements</span>
          {[...subs].reverse().map((s) => (
            <div key={s.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#131A22] text-[13px]">
              <span className="tb-num w-8 font-semibold text-[#C9D3DE]">{s.time}</span>
              <span className="min-w-0 truncate">{s.player}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Résumé d'un match terminé
// ---------------------------------------------------------------------------

function StatsTab({ match, events }: { match: LiveMatchDoc; events: LiveEvent[] }) {
  const count = (team: "home" | "away", test: (e: LiveEvent) => boolean) => events.filter((e) => e.team === team && test(e)).length;
  const rows: [string, number, number][] = [
    ["Buts", match.score.home, match.score.away],
    ["Occasions", count("home", (e) => e.subType === "chance"), count("away", (e) => e.subType === "chance")],
    ["Cartons jaunes", count("home", (e) => e.type === "yellow"), count("away", (e) => e.type === "yellow")],
    ["Cartons rouges", count("home", (e) => e.type === "red"), count("away", (e) => e.type === "red")],
  ];
  // Joueurs décisifs de notre équipe : buts et passes décisives
  const decisive = new Map<string, { goals: number; assists: number; n?: number }>();
  events.forEach((e) => {
    if (e.team !== "home" || e.type !== "goal") return;
    if (e.subType !== "own_goal") {
      const g = decisive.get(e.player) || { goals: 0, assists: 0, n: e.number };
      g.goals += 1;
      decisive.set(e.player, g);
    }
    if (e.assister) {
      const a = decisive.get(e.assister) || { goals: 0, assists: 0 };
      a.assists += 1;
      decisive.set(e.assister, a);
    }
  });
  const players = [...decisive.entries()].sort((a, b) => b[1].goals - a[1].goals || b[1].assists - a[1].assists);
  const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-[#131A22] border border-[#1F2A36] rounded-2xl px-4 py-3.5 flex flex-col gap-3.5">
        {rows.map(([label, h, a]) => {
          const max = Math.max(h, a, 1);
          return (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="grid grid-cols-[32px_minmax(0,1fr)_32px] items-center text-[13px]">
                <span className="tb-num text-[16px] font-bold">{h}</span>
                <span className="text-center text-[#C9D3DE]">{label}</span>
                <span className="tb-num text-[16px] font-bold text-right">{a}</span>
              </div>
              <div className="flex gap-1 h-1.5" aria-hidden>
                <div className="flex-1 flex justify-end bg-[#1F2A36] rounded-sm overflow-hidden"><span style={{ width: `${Math.round((h / max) * 100)}%`, background: ACCENT }} /></div>
                <div className="flex-1 flex bg-[#1F2A36] rounded-sm overflow-hidden"><span style={{ width: `${Math.round((a / max) * 100)}%`, background: "#EF4444" }} /></div>
              </div>
            </div>
          );
        })}
      </div>
      {players.length > 0 && (
        <>
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8B98A8]">Nos joueurs décisifs</span>
          {players.map(([name, s]) => (
            <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#131A22]">
              <span className="tb-num shrink-0 w-[34px] h-[34px] rounded-full bg-[#00E599] text-[#04120C] flex items-center justify-center text-[14px] font-bold">{s.n ?? name.slice(0, 1)}</span>
              <span className="flex-1 min-w-0 text-[14px] font-semibold truncate">{name}</span>
              <span className="text-[13px] text-[#C9D3DE] shrink-0">
                {[s.goals ? plural(s.goals, "but", "buts") : "", s.assists ? plural(s.assists, "passe décisive", "passes décisives") : ""].filter(Boolean).join(" · ")}
              </span>
            </div>
          ))}
        </>
      )}
      <span className="text-[11px] text-[#8B98A8] leading-relaxed">Statistiques issues de la saisie du mode Live.</span>
    </div>
  );
}

function Summary({ match, events, logo, clubName, onToast }: { match: LiveMatchDoc; events: LiveEvent[]; logo?: string; clubName: string; onToast: (t: string) => void }) {
  const [tab, setTab] = useState<"timeline" | "stats" | "lineup">("timeline");
  const [shareOpen, setShareOpen] = useState(false);
  const res = resultLetter(match);
  const verdict = res.letter === "V" ? "VICTOIRE" : res.letter === "D" ? "DÉFAITE" : "MATCH NUL";
  const verdictCls = res.letter === "V" ? "bg-[#0E2A1F] text-[#B7F5DA]" : res.letter === "D" ? "bg-[#3A0D10] text-[#FF8A8A]" : "bg-white/10 text-[#C9D3DE]";
  const homeLine = scorersLine(events, "home");
  const awayLine = scorersLine(events, "away");
  const caption = `Score final : ${match.home} ${match.score.home} - ${match.score.away} ${match.away}${homeLine ? `\n${homeLine}` : ""}`;

  return (
    <>
      <section aria-label="Score final" className="bg-[#131A22] border border-[#1F2A36] rounded-[20px] p-4 flex flex-col gap-3">
        <div className="flex justify-center"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-[0.08em] ${verdictCls}`}>TERMINÉ · {verdict}</span></div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <div className="flex flex-col items-center gap-2 min-w-0">
            <TeamDot name={match.home} logo={logo} tone="home" size={44} />
            <span className="w-full text-center text-[12px] font-semibold uppercase truncate">{match.home}</span>
          </div>
          <span className="tb-num text-[56px] font-bold leading-none">{match.score.home}<span className="text-[#4B5868] px-2">–</span>{match.score.away}</span>
          <div className="flex flex-col items-center gap-2 min-w-0">
            <TeamDot name={match.away} tone="away" size={44} />
            <span className="w-full text-center text-[12px] font-semibold uppercase truncate">{match.away}</span>
          </div>
        </div>
        {(homeLine || awayLine) && (
          <div className="grid grid-cols-2 gap-3 text-[12px] text-[#C9D3DE] leading-relaxed">
            <span>{homeLine}</span>
            <span className="text-right">{awayLine}</span>
          </div>
        )}
        <div className="flex justify-center flex-wrap gap-2 text-[12px] text-[#8B98A8] border-t border-[#1F2A36] pt-2.5">
          {[formatKickoff(match), match.venue].filter(Boolean).join(" · ") || match.competition || "Match"}
        </div>
      </section>

      {match.coachNote?.trim() && (
        <section aria-label="Le mot du coach" className="bg-[#131A22] border border-[#1F2A36] rounded-2xl px-4 py-3.5 flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8B98A8]">Le mot du coach</span>
          <p className="text-[14px] leading-relaxed text-[#C9D3DE] whitespace-pre-line break-words">{match.coachNote}</p>
        </section>
      )}

      <SegmentTabs label="Résumé du match" value={tab} onChange={setTab} tabs={[["timeline", "Déroulé"], ["stats", "Stats"], ["lineup", "Compo"]]} />

      {tab === "timeline" && <MatchTimeline match={match} events={events} empty="Aucun fait de match saisi." />}
      {tab === "stats" && <StatsTab match={match} events={events} />}
      {tab === "lineup" && <Lineup match={match} events={events} />}

      <button type="button" onClick={() => setShareOpen(true)} className="min-h-[52px] rounded-[14px] bg-[#00E599] text-[#04120C] text-[15px] font-bold inline-flex items-center justify-center gap-2">
        <Share2 className="w-[18px] h-[18px]" />Partager le résumé
      </button>

      {shareOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(2,5,8,0.72)] flex flex-col justify-end" onClick={() => setShareOpen(false)}>
          <div role="dialog" aria-label="Partager le résumé" className="mx-auto w-full max-w-[460px] bg-[#131A22] border-t border-[#2A3644] rounded-t-3xl px-4 pt-2.5 pb-6 flex flex-col gap-3.5" onClick={(e) => e.stopPropagation()}>
            <div className="self-center w-10 h-1 rounded-sm bg-[#2A3644]" />
            <span className="tb-num text-[20px] font-semibold">Partager le résumé</span>
            <div className="self-center w-[230px] h-[230px] rounded-2xl bg-[#0A0E13] border border-[#2A3644] flex flex-col items-center justify-center gap-2 p-4">
              <span className="px-2.5 py-1 rounded-md bg-[#00E599] text-[#04120C] text-[12px] font-bold tracking-[0.08em]">SCORE FINAL</span>
              <span className="tb-num text-[54px] font-bold leading-none">{match.score.home} – {match.score.away}</span>
              <span className="w-full text-center text-[11px] font-semibold text-[#8B98A8] tracking-[0.06em] uppercase truncate">{match.home} · {match.away}</span>
              {homeLine && <span className="text-[13px] text-center line-clamp-2">{homeLine}</span>}
              <span className="mt-1.5 text-[10px] text-[#8B98A8] tracking-[0.08em] uppercase truncate max-w-full">{clubName} · The Box</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={async () => { onToast(await copyLink()); setShareOpen(false); }} className="min-h-[52px] rounded-[14px] border border-[#2A3644] text-[15px] font-semibold inline-flex items-center justify-center gap-2">
                <Link2 className="w-4 h-4" />Copier le lien
              </button>
              <button type="button" onClick={async () => { const t = await shareOrCopy("Résumé du match", caption); if (t) onToast(t); setShareOpen(false); }} className="min-h-[52px] rounded-[14px] bg-[#00E599] text-[#04120C] text-[15px] font-bold">
                Partager
              </button>
            </div>
            <button type="button" onClick={() => setShareOpen(false)} className="min-h-[44px] rounded-xl text-[#8B98A8] text-[14px] font-semibold">Fermer</button>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Réactions des suiveurs
// ---------------------------------------------------------------------------

const REACTION_STYLES = `
@keyframes tb-react-rise{0%{transform:translate(-50%,0) scale(.6);opacity:0}15%{opacity:1;transform:translate(-50%,-10px) scale(1.15)}100%{transform:translate(-50%,-70px) scale(1);opacity:0}}
.tb-react-burst{position:absolute;left:50%;bottom:60%;pointer-events:none;font-size:20px;animation:tb-react-rise .9s ease-out forwards}
`;

const formatCount = (n: number) =>
  n >= 10000 ? `${Math.round(n / 1000)} k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} k` : String(n);

/**
 * Barre d'emojis : chaque touche ajoute une réaction au match. Les touches sont regroupées et envoyées
 * au serveur toutes les ~0,8 s ; l'affichage reprend tout de suite les touches pas encore comptées en ligne.
 */
function Reactions({ match, onToast }: { match: LiveMatchDoc & { id?: string }; onToast: (t: string) => void }) {
  const [unsent, setUnsent] = useState<Partial<Record<LiveReactionId, number>>>({});
  const [bursts, setBursts] = useState<{ key: number; id: LiveReactionId; emoji: string }[]>([]);
  const queue = useRef<Partial<Record<LiveReactionId, number>>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstKey = useRef(0);
  const matchId = match.id || "";

  const flush = async () => {
    timer.current = null;
    const batch = queue.current;
    queue.current = {};
    for (const [reaction, count] of Object.entries(batch) as [LiveReactionId, number][]) {
      let ok = false;
      try {
        const res = await fetch("/api/live/react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: matchId, reaction, count }),
        });
        ok = res.ok;
        if (res.status === 429) onToast("Doucement ! Réessayez dans un instant.");
      } catch {
        /* hors ligne */
      }
      // Compté en ligne (le compteur du match arrive par la mise à jour en temps réel) ou abandonné
      setUnsent((prev) => ({ ...prev, [reaction]: Math.max(0, (prev[reaction] || 0) - count) }));
      if (!ok) break;
    }
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const react = (id: LiveReactionId, emoji: string) => {
    if (!matchId) return;
    queue.current[id] = (queue.current[id] || 0) + 1;
    setUnsent((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    const key = ++burstKey.current;
    setBursts((prev) => [...prev.slice(-8), { key, id, emoji }]);
    window.setTimeout(() => setBursts((prev) => prev.filter((b) => b.key !== key)), 950);
    if (!timer.current) timer.current = setTimeout(() => void flush(), 800);
  };

  const countOf = (id: LiveReactionId) => Math.max(0, Number(match.reactions?.[id]) || 0) + (unsent[id] || 0);
  const total = reactionTotal(match.reactions) + Object.values(unsent).reduce((a, b) => a + (b || 0), 0);

  return (
    <section
      aria-label="Réactions"
      className="sticky bottom-0 z-30 -mx-4 -mb-8 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-[#0A0E13]/95 backdrop-blur border-t border-[#1F2A36] flex flex-col gap-1.5"
    >
      <style>{REACTION_STYLES}</style>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B98A8]">Réagissez</span>
        <span className="tb-num text-[11px] font-semibold text-[#C9D3DE]" aria-live="polite">
          {formatCount(total)} réaction{total > 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {LIVE_REACTIONS.map((r) => {
          const n = countOf(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => react(r.id, r.emoji)}
              aria-label={`${r.label} (${n})`}
              className="relative h-10 rounded-full bg-[#131A22] border border-[#2A3644] flex items-center justify-center gap-1 transition active:scale-90 hover:border-[#3A4858] select-none [-webkit-tap-highlight-color:transparent]"
            >
              <span className="text-[18px] leading-none" aria-hidden>{r.emoji}</span>
              {n > 0 && <span className="tb-num text-[10px] font-semibold text-[#8B98A8]">{formatCount(n)}</span>}
              {bursts.filter((b) => b.id === r.id).map((b) => (
                <span key={b.key} className="tb-react-burst" aria-hidden>{b.emoji}</span>
              ))}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * @param fromClub vrai quand le match est ouvert depuis la page des matchs du club : le retour vers
 *   la liste n'est proposé qu'à ce moment-là. Arrivé par le QR (ou le lien) du match, le visiteur
 *   ne voit que ce match.
 */
export default function LiveFollower({ id, fromClub = false }: { id: string; fromClub?: boolean }) {
  const { match, state } = useLiveMatch(id);
  const { club } = useLiveClub(match?.clubSlug);
  const now = useNow(1000);
  const [tab, setTab] = useState<"live" | "lineup">("live");
  const [toast, setToast] = useState<string | null>(null);
  const events = useMemo(() => (match?.events || []).filter((e) => e.type !== "assist"), [match?.events]);

  if (state === "loading") return <LiveScreen><Spinner label="Chargement du match…" /></LiveScreen>;
  if (state !== "ready" || !match) {
    return <LiveScreen><Message title="Match introuvable" text="Ce lien n'est plus valide ou le match a été supprimé par le coach." /></LiveScreen>;
  }

  const finished = match.status === "finished";
  const clubName = club?.name || match.clubName || "";
  const showToast = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 2500);
  };

  return (
    <LiveScreen>
      <div className="flex flex-col gap-3 pt-4">
        {/* En-tête : retour aux matchs du club, équipe, statut */}
        <header className="flex items-center justify-between gap-2 min-h-[44px]">
          <div className="flex items-center gap-2.5 min-w-0">
            {fromClub && match.clubSlug && <BackSquare href={`/club/${match.clubSlug}`} label="Retour à tous les matchs" />}
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-semibold truncate">
                {finished ? "Résumé du match" : [clubName, match.teamName].filter(Boolean).join(" · ") || match.home}
              </span>
              <span className="text-[12px] text-[#8B98A8] truncate">
                {finished ? [match.teamName, match.competition].filter(Boolean).join(" · ") : match.competition || "Match"}
              </span>
            </div>
          </div>
          <LivePill match={match} />
        </header>

        {finished ? (
          <Summary match={match} events={events} logo={club?.logo} clubName={clubName} onToast={showToast} />
        ) : (
          <>
            <ScoreCard match={match} logo={club?.logo} now={now} events={events} />
            <Highlight match={match} events={events} />
            <SegmentTabs
              label="Suivi du match"
              value={tab}
              onChange={setTab}
              tabs={[["live", match.status === "scheduled" ? "Infos" : "Direct"], ["lineup", "Composition"]]}
            />
            {tab === "live" ? (
              match.status === "scheduled" ? (
                <div className="rounded-2xl border border-[#1F2A36] bg-[#131A22] p-4 text-center flex flex-col gap-1.5">
                  <p className="tb-num text-[15px] font-bold">{formatKickoff(match) || "Horaire à venir"}</p>
                  <p className="text-[12.5px] text-[#8B98A8]">Gardez cette page ouverte : le score s’affichera en direct dès le coup d’envoi.</p>
                </div>
              ) : (
                <MatchTimeline match={match} events={events} empty="Aucun événement pour l'instant." />
              )
            ) : (
              <Lineup match={match} />
            )}
            <button
              type="button"
              onClick={async () => { const t = await shareOrCopy("Match en direct", `${match.home} ${match.score.home} - ${match.score.away} ${match.away}`); if (t) showToast(t); }}
              className="mt-1 min-h-[52px] rounded-[14px] border border-[#2A3644] text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-white/[0.03]"
            >
              <Share2 className="w-[18px] h-[18px]" />Partager le lien du match
            </button>
          </>
        )}
      </div>

      <p className="mt-auto pt-6 pb-3 text-center text-[11px] text-[#8B98A8]">Lecture seule · Mis à jour en temps réel · The Box</p>

      {/* Réactions : barre fixée en bas de l'écran, toujours à portée de pouce */}
      <Reactions match={match} onToast={showToast} />

      {toast && (
        <div role="status" className="fixed left-4 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-[430px] px-4 py-3.5 rounded-[14px] bg-[#E6EDF3] text-[#0A0E13] text-[14px] font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          {toast}
        </div>
      )}
    </LiveScreen>
  );
}
