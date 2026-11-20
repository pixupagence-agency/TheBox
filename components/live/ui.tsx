"use client";
import React from "react";
import type { LiveEvent, LiveMatchDoc } from "@/lib/live/model";
import { clockSeconds, formatClock, periodLabel } from "@/lib/live/model";

export const ACCENT = "#00E599";

/** Écran mobile sombre commun aux pages publiques du live */
export function LiveScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#05080B] text-slate-100 font-[Inter,system-ui,sans-serif]">
      <style>{`.tb-noscroll{scrollbar-width:none;-ms-overflow-style:none}.tb-noscroll::-webkit-scrollbar{display:none}`}</style>
      <div className="mx-auto w-full max-w-[460px] min-h-[100dvh] flex flex-col px-4 pb-8">{children}</div>
    </div>
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
    case "note": return "📝";
    default: return "•";
  }
};

export const eventTitle = (ev: LiveEvent, m: Pick<LiveMatchDoc, "home" | "away">) => {
  const team = ev.team === "home" ? m.home : m.away;
  switch (ev.type) {
    case "goal": return ev.points && ev.points > 1 ? `${ev.player} · +${ev.points}` : `But · ${ev.player}`;
    case "yellow": return `Carton jaune · ${ev.player}`;
    case "red": return `Carton rouge · ${ev.player}`;
    case "sub": return `Remplacement · ${ev.player}`;
    case "note": return ev.player;
    default: return `${ev.player} (${team})`;
  }
};

export function EventRow({ ev, match, compact = false }: { ev: LiveEvent; match: Pick<LiveMatchDoc, "home" | "away" | "sport">; compact?: boolean }) {
  const isHome = ev.team === "home";
  return (
    <div className={`flex items-start gap-3 ${compact ? "py-2" : "py-2.5"} border-b border-white/[0.06] last:border-0`}>
      <span className="w-10 shrink-0 text-right font-mono text-[12px] font-bold text-slate-400 pt-0.5">{ev.time}</span>
      <span className="text-[16px] leading-none pt-0.5">{eventIcon(ev, match.sport)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-white truncate">{eventTitle(ev, match)}</p>
        <p className="text-[11.5px] text-slate-400 truncate">
          {isHome ? match.home : match.away}
          {ev.type === "goal" && ev.assister ? ` · Passe : ${ev.assister}` : ""}
        </p>
      </div>
    </div>
  );
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
