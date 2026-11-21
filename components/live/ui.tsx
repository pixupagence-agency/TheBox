"use client";
import React from "react";
import Link from "next/link";
import type { LiveEvent, LiveMatchDoc } from "@/lib/live/model";
import { clockSeconds, formatClock, periodLabel } from "@/lib/live/model";
import LogoIcon from "@/components/LogoIcon";

export const ACCENT = "#00E599";

/**
 * Palette des maquettes du live (canvas « Télécommande Live ») :
 * fond #0A0E13, cartes #131A22, filets #1F2A36 / #2A3644, texte #E6EDF3, secondaire #C9D3DE, discret #8B98A8.
 * Chiffres (score, chrono, minutes) en Space Grotesk : classe `tb-num`.
 */
export const LIVE_STYLES = `
.tb-noscroll{scrollbar-width:none;-ms-overflow-style:none}.tb-noscroll::-webkit-scrollbar{display:none}
.tb-num{font-family:"Space Grotesk",Inter,system-ui,sans-serif;font-variant-numeric:tabular-nums}
`;

/** Écran mobile sombre commun aux pages publiques du live */
export function LiveScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#0A0E13] text-[#E6EDF3] font-[Inter,system-ui,sans-serif]">
      <style>{LIVE_STYLES}</style>
      <LiveBrandBar />
      <div className="mx-auto w-full max-w-[460px] min-h-[calc(100dvh-52px)] flex flex-col px-4 pb-8">{children}</div>
    </div>
  );
}

/** Entête de l'application live : logo The Box et point rouge « live » */
export function LiveBrandBar() {
  return (
    <header
      className="sticky top-0 z-30 h-[52px] border-b border-black/40 shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
      style={{
        // Vraie pelouse (découpée dans la photo du stade de la page d'accueil, raccord sans couture),
        // ombrée à gauche pour la lisibilité du logo
        backgroundColor: "#2a7a30",
        backgroundImage: "linear-gradient(90deg, rgba(5,8,11,0.55) 0%, rgba(5,8,11,0.15) 55%, rgba(5,8,11,0.35) 100%), url(/images/live-grass.jpg)",
        backgroundRepeat: "no-repeat, repeat-x",
        backgroundSize: "100% 100%, auto 140px",
        backgroundPosition: "0 0, left center",
      }}
    >
      <div className="mx-auto w-full max-w-[460px] h-full px-4 flex items-center justify-start gap-2.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]" aria-label="The Box Live">
        <LogoIcon className="w-7 h-7 text-white shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" aria-hidden />
        <span className="text-[19px] font-black tracking-wider leading-none lowercase text-white select-none">the box</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1" title="Live">
          <span className="relative flex w-2 h-2" aria-hidden>
            <span className="absolute inline-flex w-full h-full rounded-full bg-rose-500 opacity-75 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-rose-500" />
          </span>
          <span className="text-[10px] font-black tracking-[0.18em] text-rose-300 leading-none">LIVE</span>
        </span>
      </div>
    </header>
  );
}

export const initials = (name: string) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

export function TeamCrest({ name, logo, tone = "home", size = 52 }: { name: string; logo?: string; tone?: "home" | "away"; size?: number }) {
  const ring = tone === "home" ? "border-[#00E599]/60 bg-[#00E599]/10 text-[#00E599]" : "border-rose-400/60 bg-rose-500/10 text-rose-300";
  return (
    <span
      className={`rounded-full border-2 overflow-hidden flex items-center justify-center font-black shrink-0 ${ring}`}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {logo ? <img src={logo} alt={name} className="w-full h-full object-contain p-1" /> : initials(name)}
    </span>
  );
}

export const eventIcon = (ev: LiveEvent, sport: string) => {
  switch (ev.type) {
    case "goal":
      return ev.icon || (sport === "rugby" ? "🏉" : sport === "basketball" ? "🏀" : sport === "handball" ? "🤾" : "⚽");
    case "yellow": return "🟨";
    case "red": return "🟥";
    case "sub": return "🔄";
    case "note": return ev.icon || "📝";
    default: return "•";
  }
};

export const eventTitle = (ev: LiveEvent, m: Pick<LiveMatchDoc, "home" | "away" | "sport">) => {
  const team = ev.team === "home" ? m.home : m.away;
  switch (ev.type) {
    case "goal":
      if (ev.subType === "own_goal") return ev.team === "home" ? "But · contre son camp adverse" : "But adverse · contre son camp";
      if (ev.subType === "penalty") return `But sur ${m.sport === "handball" ? "jet de 7 m" : "penalty"} · ${ev.player}`;
      return ev.points && ev.points > 1 ? `${ev.player} · +${ev.points}` : `But · ${ev.player}`;
    case "yellow": return `Carton jaune · ${ev.player}`;
    case "red": return `Carton rouge · ${ev.player}`;
    case "sub": return `Remplacement · ${ev.player}`;
    case "note": return ev.player;
    default: return `${ev.player} (${team})`;
  }
};

/** Étiquette colorée du type d'événement (maquettes : BUT, JAUNE, REMP., NOTE…) */
export const eventChip = (ev: LiveEvent): { label: string; cls: string } => {
  switch (ev.type) {
    case "goal":
      if (ev.subType === "own_goal") return { label: "CSC", cls: ev.team === "home" ? "bg-[#00E599] text-[#04120C]" : "bg-[#EF4444] text-white" };
      if (ev.subType === "penalty") return { label: "PEN.", cls: ev.team === "home" ? "bg-[#00E599] text-[#04120C]" : "bg-[#EF4444] text-white" };
      return { label: ev.points && ev.points > 1 ? `+${ev.points}` : "BUT", cls: ev.team === "home" ? "bg-[#00E599] text-[#04120C]" : "bg-[#EF4444] text-white" };
    case "yellow": return { label: "JAUNE", cls: "bg-[#FACC15] text-[#1A1400]" };
    case "red": return { label: "ROUGE", cls: "bg-[#EF4444] text-white" };
    case "sub": return { label: "REMP.", cls: "bg-[#1D4ED8] text-white" };
    case "note":
      if (ev.subType === "chance") return { label: "OCCAS.", cls: "bg-[#F59E0B] text-[#1A1100]" };
      if (ev.subType === "missed_penalty") return { label: "PEN. ✕", cls: "bg-[#334155] text-[#FECACA]" };
      return { label: "NOTE", cls: "bg-[#3B3363] text-[#E9E5FF]" };
    default: return { label: "•", cls: "bg-[#334155] text-white" };
  }
};

/** Détail sous le titre d'un événement : équipe, passeur… */
const eventDetail = (ev: LiveEvent, m: Pick<LiveMatchDoc, "home" | "away">) => {
  const team = ev.team === "home" ? m.home : m.away;
  if (ev.type === "goal" && ev.assister) return `Passe : ${ev.assister}`;
  return team;
};

export function EventRow({ ev, match }: { ev: LiveEvent; match: Pick<LiveMatchDoc, "home" | "away" | "sport">; compact?: boolean }) {
  const chip = eventChip(ev);
  const homeGoal = ev.type === "goal" && ev.team === "home";
  return (
    <div className={`flex items-center gap-2.5 px-3 py-[9px] rounded-xl ${homeGoal ? "bg-[#0E2A1F]" : "bg-[#131A22]"}`}>
      <span className="tb-num w-8 shrink-0 text-[14px] font-semibold text-[#C9D3DE]">{ev.time}</span>
      <span className={`shrink-0 min-w-[44px] text-center px-1.5 py-1 rounded-md text-[10px] font-bold tracking-[0.04em] ${chip.cls}`}>{chip.label}</span>
      <div className="min-w-0 flex flex-col">
        <span className="text-[14px] font-semibold truncate">{eventTitle(ev, match)}</span>
        <span className="text-[12px] text-[#8B98A8] truncate">{eventDetail(ev, match)}</span>
      </div>
    </div>
  );
}

/** Séparateur du fil : « Mi-temps · 1–1 », « Coup d'envoi »… */
export function TimelineSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-0.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B98A8]">
      <span className="flex-1 h-px bg-[#1F2A36]" />{label}<span className="flex-1 h-px bg-[#1F2A36]" />
    </div>
  );
}

type TimelineItem = { kind: "event"; ev: LiveEvent } | { kind: "sep"; key: string; label: string };

/**
 * Fil du match, du plus récent au plus ancien, avec ses repères : coup d'envoi, pauses (score à la pause), fin du match.
 * La période d'un événement vient de l'événement s'il la porte, sinon de sa minute.
 */
export const timelineItems = (
  match: Pick<LiveMatchDoc, "periods" | "periodSeconds" | "breakAfterIndex" | "sport" | "status">,
  eventsNewestFirst: LiveEvent[]
): TimelineItem[] => {
  const periods = match.periods?.length ? match.periods : ["1MT", "2MT"];
  const periodIndex = (ev: LiveEvent) => {
    const known = ev.period ? periods.indexOf(ev.period) : -1;
    if (known >= 0) return known;
    const minute = parseInt(ev.time, 10) || 0;
    const per = Math.max(1, (match.periodSeconds || 2700) / 60);
    return Math.min(periods.length - 1, Math.floor(minute / per));
  };
  const items: TimelineItem[] = [{ kind: "sep", key: "kickoff", label: "Coup d'envoi" }];
  const score = { home: 0, away: 0 };
  let current = 0;
  [...eventsNewestFirst].reverse().forEach((ev) => {
    const idx = periodIndex(ev);
    while (idx > current) {
      const label = current === match.breakAfterIndex ? periodLabel("MI-TEMPS", match.sport) : `Fin ${periodLabel(periods[current], match.sport)}`;
      items.push({ kind: "sep", key: `p${current}`, label: `${label} · ${score.home}–${score.away}` });
      current += 1;
    }
    if (ev.type === "goal") score[ev.team] += ev.points || 1;
    items.push({ kind: "event", ev });
  });
  if (match.status === "finished") items.push({ kind: "sep", key: "end", label: `Fin du match · ${score.home}–${score.away}` });
  return items.reverse();
};

export function MatchTimeline({ match, events, empty }: { match: LiveMatchDoc; events: LiveEvent[]; empty: string }) {
  if (!events.length) return <p className="text-center text-[13px] text-[#8B98A8] py-8">{empty}</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {timelineItems(match, events).map((it) =>
        it.kind === "sep" ? <TimelineSeparator key={it.key} label={it.label} /> : <EventRow key={it.ev.id} ev={it.ev} match={match} />
      )}
    </div>
  );
}

/** Onglets segmentés (maquettes : onglet actif clair sur fond sombre) */
export function SegmentTabs<K extends string>({ tabs, value, onChange, label }: { tabs: [K, string][]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="grid gap-1 p-1 rounded-[14px] bg-[#131A22] border border-[#1F2A36]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      {tabs.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={`min-h-[44px] rounded-[10px] text-[14px] font-semibold transition ${value === key ? "bg-[#E6EDF3] text-[#0A0E13]" : "text-[#8B98A8] hover:text-[#C9D3DE]"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Pastille « EN DIRECT » / statut, au style des maquettes */
export function LivePill({ match }: { match: LiveMatchDoc }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-full bg-[#3A0D10] text-[#FF8A8A] text-[11px] font-bold tracking-[0.08em]">
        <span className="w-[7px] h-[7px] rounded-full bg-[#EF4444] animate-pulse" />EN DIRECT
      </span>
    );
  }
  if (match.status === "halftime") return <span className="px-2.5 py-[5px] rounded-full bg-[#2B1A08] text-[#FDBA74] text-[11px] font-bold tracking-[0.08em]">{periodLabel(match.period, match.sport).toUpperCase()}</span>;
  if (match.status === "finished") return <span className="px-2.5 py-[5px] rounded-full bg-white/10 text-[#C9D3DE] text-[11px] font-bold tracking-[0.08em]">TERMINÉ</span>;
  return <span className="px-2.5 py-[5px] rounded-full bg-[#0E2A1F] text-[#B7F5DA] text-[11px] font-bold tracking-[0.08em]">À VENIR</span>;
}

/** Minute affichée façon diffusion (1re minute = 1') */
export const broadcastMinute = (secs: number) => `${Math.floor(secs / 60) + 1}'`;

/** Bouton carré « retour » des maquettes */
export function BackSquare({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="shrink-0 w-11 h-11 rounded-xl border border-[#2A3644] text-[#E6EDF3] flex items-center justify-center hover:bg-white/[0.04]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
    </Link>
  );
}

/** Pastille ronde aux couleurs d'une équipe (logo du club s'il existe) */
export function TeamDot({ name, logo, tone, size = 40 }: { name: string; logo?: string; tone: "home" | "away"; size?: number }) {
  if (logo) return <img src={logo} alt={name} className="rounded-full object-contain bg-white/5 shrink-0" style={{ width: size, height: size }} />;
  return <span aria-hidden className="rounded-full shrink-0" style={{ width: size, height: size, background: tone === "home" ? ACCENT : "#EF4444" }} />;
}

export function useClockText(match: LiveMatchDoc | null, now: number) {
  if (!match) return "";
  return formatClock(clockSeconds(match.clock, now));
}

export function StatusPill({ match }: { match: LiveMatchDoc }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-300 px-2.5 py-1 text-[11px] font-black">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />EN DIRECT · {periodLabel(match.period, match.sport)}
      </span>
    );
  }
  if (match.status === "halftime") {
    return <span className="rounded-full bg-amber-400/15 text-amber-300 px-2.5 py-1 text-[11px] font-black">{periodLabel(match.period, match.sport).toUpperCase()}</span>;
  }
  if (match.status === "finished") {
    return <span className="rounded-full bg-white/10 text-slate-300 px-2.5 py-1 text-[11px] font-black">TERMINÉ</span>;
  }
  return <span className="rounded-full bg-[#00E599]/12 text-[#00E599] px-2.5 py-1 text-[11px] font-black">À VENIR</span>;
}

export const resultLetter = (m: LiveMatchDoc): { letter: "V" | "N" | "D"; cls: string } => {
  if (m.score.home > m.score.away) return { letter: "V", cls: "bg-[#00E599] text-slate-950" };
  if (m.score.home < m.score.away) return { letter: "D", cls: "bg-rose-500 text-white" };
  return { letter: "N", cls: "bg-slate-500 text-white" };
};

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <span className="w-7 h-7 rounded-full border-2 border-white/15 border-t-[#00E599] animate-spin" />
      <p className="text-[13px] font-semibold">{label}</p>
    </div>
  );
}

export function Message({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-24">
      <p className="text-[17px] font-black text-white">{title}</p>
      {text && <p className="text-[13px] text-slate-400 max-w-[300px]">{text}</p>}
      {children}
    </div>
  );
}
