// Module Recording : résumé d'un match terminé du tableau tactique (lecture seule, données de l'appareil).
// Ouvert depuis le bouton « Passez à l'analyse vidéo » du tableau : /recording?equipe=<id>&match=<id>.

export interface MatchSummaryEvent {
  id: string;
  time: string;
  period?: string;
  type: "goal" | "assist" | "yellow" | "red" | "sub" | "note";
  player: string;
  number?: number;
  team: "home" | "away";
  assister?: string;
  note?: string;
  icon?: string;
  subType?: string;
  points?: number;
}

export interface MatchSummary {
  matchId: string;
  teamId: string;
  teamName: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  date: string;
  time: string;
  finished: boolean;
  events: MatchSummaryEvent[];
  notes: string;
}

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ((JSON.parse(raw) ?? fallback) as T) : fallback;
  } catch {
    return fallback;
  }
};

const parseScore = (score: unknown): [number, number] | null => {
  const m = typeof score === "string" ? score.match(/(\d+)\s*-\s*(\d+)/) : null;
  return m ? [Number(m[1]), Number(m[2])] : null;
};

export function readMatchSummary(teamId?: string, matchId?: string): MatchSummary | null {
  if (typeof window === "undefined" || !matchId) return null;
  const matches = readJson<Record<string, unknown>[]>("thebox_matches_list", []);
  const m = (Array.isArray(matches) ? matches : []).find((x) => x && x.id === matchId);
  if (!m) return null;
  const tid = String(m.teamId || teamId || "");
  const teams = readJson<{ id: string; name: string }[]>("thebox_teams", []);
  const teamName = (Array.isArray(teams) ? teams : []).find((t) => t?.id === tid)?.name || "";

  const stored = readJson<MatchSummaryEvent[]>(`thebox_match_events_${matchId}`, []);
  const events = (Array.isArray(m.events) && m.events.length ? (m.events as MatchSummaryEvent[]) : Array.isArray(stored) ? stored : [])
    .filter((e) => e && e.type !== "assist" && typeof e.player === "string");

  const fromScore = parseScore(m.score);
  const homeScore = typeof m.homeScore === "number" ? m.homeScore : fromScore?.[0] ?? 0;
  const awayScore = typeof m.awayScore === "number" ? m.awayScore : fromScore?.[1] ?? 0;
  // Notes tactiques : texte brut (pas du JSON) dans thebox_match_notes_<id>
  let notes = typeof m.notes === "string" ? m.notes : "";
  if (!notes) {
    try { notes = localStorage.getItem(`thebox_match_notes_${matchId}`) || ""; } catch { /* indisponible */ }
  }

  return {
    matchId,
    teamId: tid,
    teamName,
    home: String(m.homeTeam || ""),
    away: String(m.awayTeam || ""),
    homeScore,
    awayScore,
    competition: String(m.competition || ""),
    date: typeof m.date === "string" ? m.date : "",
    time: typeof m.time === "string" ? m.time : "",
    finished: Boolean(m.isFinished),
    events,
    notes: typeof notes === "string" ? notes : "",
  };
}
