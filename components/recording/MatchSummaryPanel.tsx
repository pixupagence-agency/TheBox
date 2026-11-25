"use client";

// Module Recording : résumé du match à analyser (score, faits de match, notes du coach), en tête du menu de droite.
import React from "react";
import { Trophy, X } from "lucide-react";
import { useRecordingTheme } from "@/lib/recording/theme";
import type { MatchSummary, MatchSummaryEvent } from "@/lib/recording/matchSummary";
import { Section } from "./SequencePanel";

const eventIcon = (e: MatchSummaryEvent) => {
  switch (e.type) {
    case "goal": return e.icon || "⚽";
    case "yellow": return "🟨";
    case "red": return "🟥";
    case "sub": return "🔄";
    default: return e.icon || "📝";
  }
};

const eventLabel = (e: MatchSummaryEvent) => {
  switch (e.type) {
    case "goal":
      if (e.subType === "own_goal") return `But contre son camp · ${e.player}`;
      if (e.subType === "penalty") return `But sur penalty · ${e.player}`;
      return e.points && e.points > 1 ? `${e.player} · +${e.points}` : `But · ${e.player}`;
    case "yellow": return `Carton jaune · ${e.player}`;
    case "red": return `Carton rouge · ${e.player}`;
    case "sub": return `Remplacement · ${e.player}`;
    default: return e.player;
  }
};

const longDate = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export default function MatchSummaryPanel({ summary, onClose }: { summary: MatchSummary; onClose: () => void }) {
  const th = useRecordingTheme();
  const meta = [summary.competition, longDate(summary.date), summary.time].filter(Boolean).join(" · ");
  const homeWin = summary.homeScore > summary.awayScore;
  const awayWin = summary.awayScore > summary.homeScore;

  return (
    <Section id="match-summary" icon={Trophy} title={summary.teamName ? `Match · ${summary.teamName}` : "Match analysé"}>
      <div className={`${th.card} !space-y-2.5`}>
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${th.accentText}`}>
            {summary.finished ? "Match terminé" : "Match"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Retirer le résumé du match"
            title="Retirer le résumé du match"
            className={`h-7 w-7 -mt-1 -mr-1 rounded-lg border flex items-center justify-center cursor-pointer transition ${th.idleBtn}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <p className={`text-[13px] font-black uppercase truncate ${homeWin ? th.text : th.sub}`} title={summary.home}>{summary.home}</p>
          <p className={`text-2xl font-black tabular-nums leading-none ${th.text}`}>
            {summary.homeScore}<span className={`px-1.5 ${th.faint}`}>–</span>{summary.awayScore}
          </p>
          <p className={`text-[13px] font-black uppercase truncate text-right ${awayWin ? th.text : th.sub}`} title={summary.away}>{summary.away}</p>
        </div>
        {meta && <p className={`text-[12px] font-semibold ${th.sub}`}>{meta}</p>}
      </div>

      <div className="mt-2.5">
        <p className={th.label}>Faits de match</p>
        {summary.events.length === 0 ? (
          <p className={`rounded-xl border border-dashed p-2.5 text-[12px] ${th.hint}`}>Aucun fait de match saisi.</p>
        ) : (
          <ul className="space-y-1">
            {summary.events.map((e) => (
              <li
                key={e.id}
                className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-[12.5px] ${e.team === "away" ? "flex-row-reverse text-right" : ""}`}
              >
                <span className={`w-9 shrink-0 tabular-nums font-black ${th.faint} ${e.team === "away" ? "text-right" : ""}`}>{e.time}</span>
                <span aria-hidden className="shrink-0">{eventIcon(e)}</span>
                <span className="min-w-0">
                  <span className={`block font-bold leading-snug ${th.text}`}>{eventLabel(e)}</span>
                  {/* Passe décisive ; précision libre seulement pour une note (celle des buts et cartons répète le type) */}
                  {(e.assister || (e.type === "note" && e.note)) && (
                    <span className={`block text-[11.5px] leading-snug ${th.sub}`}>{e.assister ? `Passe : ${e.assister}` : e.note}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {summary.notes.trim() && (
        <div className="mt-2.5">
          <p className={th.label}>Notes du coach</p>
          <p className={`text-[12.5px] leading-relaxed whitespace-pre-line break-words ${th.sub}`}>{summary.notes}</p>
        </div>
      )}
    </Section>
  );
}
