"use client";

// Tableau tactique : useLiveShare, bloc sorti de components/TacticsBoard.tsx (code inchangé).
import type React from "react";
import { auth } from "@/lib/firebase";
import { createLiveMatch, ensureLiveClub, getEditorAccess, regenerateEditorAccess, revokeEditorAccess, updateLiveMatchMeta, type EditorAccess, type LiveMatchMeta, type LiveState } from "@/lib/live/client";
import { statusFor, type LiveCommand, type LiveEvent } from "@/lib/live/model";
import { useLiveHost } from "@/lib/live/useLiveHost";
import { isGoalkeeperRole } from "@/lib/setPieceWall";
import { applyRemoteLiveCommand as applyRemoteLiveCommandImpl } from "@/lib/tactics/actions/applyRemoteLiveCommand";
import { COACH_NOTE_MAX } from "@/lib/tactics/constants";
import { getLivePeriodConfig, type LivePeriod, type LivePeriodConfig } from "@/lib/tactics/livePeriods";
import { type CoachProfile, type TeamCategory, type Token } from "@/lib/tactics/types";
import { useEffect, useMemo, useRef, useState } from "react";

export interface UseLiveShareParams {
  activeCoach: CoachProfile;
  activeMatch: any;
  activeMatchId: string;
  activeSport: string;
  activeTeam: TeamCategory | undefined;
  awayScore: number;
  breakLongLabel: "Pause" | "Mi-temps";
  clubLogo: string;
  currentFrameIdx: number;
  currentPeriod: LivePeriod;
  currentTokens: Token[];
  handleDeleteMatchEvent: (eventId: string) => void;
  handleFinishLiveMatch: (isAuto?: boolean) => void;
  handleSelectLivePeriod: (period: LivePeriod) => void;
  handleSwapPlayerOnPitch: (originalToken: Token, newSub: any, opts?: { eventId?: string | undefined; noEvent?: boolean | undefined; remote?: boolean | undefined; } | undefined) => void;
  hasActiveMatch: boolean;
  homeScore: number;
  isLiveMatchMode: boolean;
  isLiveTimerRunning: boolean;
  isProPlusOrAdmin: boolean;
  keyframes: Token[][];
  livePeriodButtons: LivePeriod[];
  livePeriodConfig: LivePeriodConfig;
  liveTimerSeconds: number;
  matchesList: any[];
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  setAwayScore: React.Dispatch<React.SetStateAction<number>>;
  setHomeScore: React.Dispatch<React.SetStateAction<number>>;
  setIsLiveMatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveMatchUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setMatchEvents: React.Dispatch<React.SetStateAction<{ id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[]>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  substitutes: any[];
  teams: TeamCategory[];
  updateMatchById: (matchId: string, field: string, value: any) => void;
}

export function useLiveShare(params: UseLiveShareParams) {
  const { activeCoach, activeMatch, activeMatchId, activeSport, activeTeam, awayScore, breakLongLabel, clubLogo, currentFrameIdx, currentPeriod, currentTokens, handleDeleteMatchEvent, handleFinishLiveMatch, handleSelectLivePeriod, handleSwapPlayerOnPitch, hasActiveMatch, homeScore, isLiveMatchMode, isLiveTimerRunning, isProPlusOrAdmin, keyframes, livePeriodButtons, livePeriodConfig, liveTimerSeconds, matchesList, matchEvents, setAwayScore, setHomeScore, setIsLiveMatchMode, setIsLiveMatchUpgradeModalOpen, setIsLiveTimerRunning, setKeyframes, setMatchEvents, setSleekToastMessage, substitutes, teams, updateMatchById } = params;

  // ================= MODE LIVE DÉPORTÉ =================
  // QR du match (public), télécommande adjoint (privée) et page du club (QR général).
  // Le tableau tactique est l'hôte : il applique les actions de la télécommande puis publie l'état du match.
  const [liveClubSlug, setLiveClubSlug] = useState<string | null>(null);
  const [isLiveShareOpen, setIsLiveShareOpen] = useState(false);
  const [liveEditorAccess, setLiveEditorAccess] = useState<EditorAccess | null>(null);
  const [liveShareBusy, setLiveShareBusy] = useState(false);
  const [liveShareError, setLiveShareError] = useState<string | null>(null);
  const liveClubName = (activeCoach?.club || "").trim() || activeTeam?.name || "Mon club";
  const canUseRemoteLive = isProPlusOrAdmin && Boolean(auth.currentUser);
  const hasAnyLiveMatch = matchesList.some((m) => m.livePublicId);
  const activeLivePublicId: string | null = hasActiveMatch && activeMatch.livePublicId ? activeMatch.livePublicId : null;
  const liveMetaFor = (m: any): LiveMatchMeta => {
  const team = teams.find((t) => t.id === (m.teamId || "team_1"));
  const sport = m.sport || activeSport;
  const cfg = getLivePeriodConfig(sport, team?.format);
  return {
    teamId: m.teamId || "team_1",
    teamName: team?.name || "",
    home: m.homeTeam || "",
    away: m.awayTeam || "",
    competition: m.competition || "",
    date: m.date || "",
    time: m.time || "",
    dateTime: m.dateTime || "",
    // Mot du coach : affiché dans le résumé public une fois le match terminé
    coachNote: String(m.coachNote || "").trim().slice(0, COACH_NOTE_MAX),
    sport,
    periods: cfg.periods,
    periodSeconds: cfg.periodSeconds,
    breakAfterIndex: cfg.breakAfterIndex,
  };
};
  const liveRunning = isLiveMatchMode && isLiveTimerRunning && currentPeriod !== "MI-TEMPS" && currentPeriod !== "FIN";
  // Composition publiée dans le suivi live : les titulaires à leur place sur le tableau du coach.
// Les positions viennent de la 1re image (la mise en place), pour ne pas suivre une animation en cours de lecture.
const liveLineupFrame = keyframes[0];
  const liveLineup = useMemo(() => ({
  onPitch: currentTokens
    .filter((t) => t.type === "player_a")
    .map((t) => {
      const placed = liveLineupFrame?.find((p) => p.id === t.id) || t;
      const isGk = isGoalkeeperRole(t.role) || (activeSport !== "basketball" && activeSport !== "rugby" && t.number === 1);
      return {
        id: t.id,
        n: t.number,
        name: t.name || "",
        x: Math.round(placed.x * 10) / 10,
        y: Math.round(placed.y * 10) / 10,
        ...(isGk ? { gk: true } : {}),
      };
    }),
  bench: substitutes
    .filter((s) => s.type !== "player_b" && s.removalReason !== "red_card")
    .map((s) => ({ id: String(s.id), n: s.number, name: s.name || "" })),
}), [currentTokens, substitutes, liveLineupFrame, activeSport]);
  const liveClock = liveRunning
  ? { elapsed: 0, runningSince: Date.now() - liveTimerSeconds * 1000 }
  : { elapsed: liveTimerSeconds, runningSince: null };
  const liveState: LiveState = {
  status: statusFor(currentPeriod, liveClock, Boolean(activeMatch.isFinished)),
  period: activeMatch.isFinished ? "FIN" : currentPeriod,
  score: { home: homeScore, away: awayScore },
  clock: liveClock,
  events: matchEvents as LiveEvent[],
  lineup: liveLineup,
  finishedAt: activeMatch.isFinished ? activeMatch.finishedAtMs || null : null,
};
  const notifyRemote = (text: string) => {
  setSleekToastMessage(`📱 Télécommande : ${text}`);
  setTimeout(() => setSleekToastMessage(null), 3500);
};
  // Action saisie à la télécommande → état local du tableau (puis republication)
const applyRemoteLiveCommand = (cmdId: string, cmd: LiveCommand) =>
  applyRemoteLiveCommandImpl({ activeMatch, breakLongLabel, currentFrameIdx, currentPeriod, currentTokens, handleDeleteMatchEvent, handleFinishLiveMatch, handleSelectLivePeriod, handleSwapPlayerOnPitch, liveMetaFor, livePeriodButtons, livePeriodConfig, liveState, liveTimerSeconds, matchEvents, notifyRemote, setAwayScore, setHomeScore, setIsLiveMatchMode, setIsLiveTimerRunning, setKeyframes, setMatchEvents, substitutes }, cmdId, cmd);
  useLiveHost({
  publicId: activeLivePublicId,
  clubSlug: liveClubSlug,
  enabled: canUseRemoteLive && Boolean(activeLivePublicId),
  state: liveState,
  onCommand: applyRemoteLiveCommand,
});
  // Page du club (QR général) : créée ou mise à jour avec le nom et le logo du club
useEffect(() => {
  if (!canUseRemoteLive || (!hasAnyLiveMatch && !isLiveShareOpen)) return;
  let alive = true;
  const timer = setTimeout(() => {
    ensureLiveClub(liveClubName, clubLogo)
      .then((slug) => { if (alive && slug) setLiveClubSlug(slug); })
      .catch((err) => console.warn("[Live] club :", err?.message));
  }, 800);
  return () => { alive = false; clearTimeout(timer); };
}, [canUseRemoteLive, hasAnyLiveMatch, isLiveShareOpen, liveClubName, clubLogo]);
  // Infos des matchs publiés (adversaire, date, compétition…) tenues à jour
const liveMetaSentRef = useRef<Record<string, string>>({});
  useEffect(() => {
  if (!canUseRemoteLive || !liveClubSlug) return;
  const timer = setTimeout(() => {
    matchesList.forEach((m) => {
      if (!m.livePublicId) return;
      const meta = liveMetaFor(m);
      const key = JSON.stringify(meta) + liveClubSlug + liveClubName;
      if (liveMetaSentRef.current[m.livePublicId] === key) return;
      liveMetaSentRef.current[m.livePublicId] = key;
      updateLiveMatchMeta(m.livePublicId, meta, liveClubSlug, liveClubName).catch((err) => {
        delete liveMetaSentRef.current[m.livePublicId];
        console.warn("[Live] infos du match :", err?.message);
      });
    });
  }, 800);
  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [matchesList, teams, liveClubSlug, canUseRemoteLive, liveClubName, activeSport]);
  /** Publie le live d'un match (QR du match + accès adjoint) ; renvoie son identifiant public */
const publishLiveForMatch = async (m: any): Promise<string | null> => {
  if (!canUseRemoteLive || !m?.id) return null;
  if (m.livePublicId) return m.livePublicId;
  const slug = liveClubSlug || (await ensureLiveClub(liveClubName, clubLogo));
  if (!slug) return null;
  setLiveClubSlug(slug);
  const meta = liveMetaFor(m);
  const initial: LiveState = m.id === activeMatchId
    ? liveState
    : {
      status: m.isFinished ? "finished" : "scheduled",
      period: m.isFinished ? "FIN" : meta.periods[0],
      score: { home: m.homeScore || 0, away: m.awayScore || 0 },
      clock: { elapsed: 0, runningSince: null },
      events: Array.isArray(m.events) ? m.events : [],
      lineup: { onPitch: [], bench: [] },
    };
  const publicId = await createLiveMatch(meta, slug, liveClubName, initial);
  if (publicId) {
    liveMetaSentRef.current[publicId] = JSON.stringify(meta) + slug + liveClubName;
    updateMatchById(m.id, "livePublicId", publicId);
  }
  return publicId;
};
  const openLiveShare = async () => {
  if (!isProPlusOrAdmin) {
    setIsLiveMatchUpgradeModalOpen(true);
    return;
  }
  if (!auth.currentUser) {
    setSleekToastMessage("🔒 Connectez-vous à votre compte pour partager le live.");
    setTimeout(() => setSleekToastMessage(null), 3500);
    return;
  }
  setLiveShareError(null);
  setLiveEditorAccess(null);
  setIsLiveShareOpen(true);
  if (activeLivePublicId) {
    try {
      setLiveEditorAccess(await getEditorAccess(activeLivePublicId));
    } catch (err: any) {
      setLiveShareError(`Accès adjoint indisponible : ${err?.message || err}`);
    }
  }
};
  const runLiveShareAction = async (action: () => Promise<void>) => {
  setLiveShareBusy(true);
  setLiveShareError(null);
  try {
    await action();
  } catch (err: any) {
    setLiveShareError(`Opération impossible : ${err?.message || err}`);
  } finally {
    setLiveShareBusy(false);
  }
};
  const handlePublishActiveLive = () => runLiveShareAction(async () => {
  const id = await publishLiveForMatch(activeMatch);
  if (id) setLiveEditorAccess(await getEditorAccess(id));
});
  const handleRegenerateLiveEditor = () => runLiveShareAction(async () => {
  if (!activeLivePublicId) return;
  setLiveEditorAccess(await regenerateEditorAccess(activeLivePublicId));
});
  const handleRevokeLiveEditor = () => runLiveShareAction(async () => {
  if (!activeLivePublicId) return;
  await revokeEditorAccess(activeLivePublicId);
  setLiveEditorAccess((prev) => (prev ? { ...prev, revoked: true } : prev));
});

  return { activeLivePublicId, handlePublishActiveLive, handleRegenerateLiveEditor, handleRevokeLiveEditor, isLiveShareOpen, liveClubName, liveClubSlug, liveEditorAccess, liveShareBusy, liveShareError, openLiveShare, publishLiveForMatch, setIsLiveShareOpen };
}
