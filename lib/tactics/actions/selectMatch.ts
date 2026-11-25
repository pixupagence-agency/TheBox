// Tableau tactique : ancien selectMatch() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { HALFTIME_BREAK_SECONDS, type LivePeriod } from "@/lib/tactics/livePeriods";
import { applyRosterIdentity, buildMatchGroupFromRoster, makeDefaultSubstitutes } from "@/lib/tactics/roster";
import { defaultSetPieceRoles, type DrawingAction, type SetPieceRoleConfig, type TeamRosterPlayer, type Token } from "@/lib/tactics/types";

export interface SelectMatchCtx {
  activeSport: string;
  activeTeamId: string;
  applySchemaFormat: (sport: string, format?: string | undefined) => void;
  firstLivePeriod: LivePeriod;
  getDefaultPlayersForSport: (sport: string, format?: string) => Token[];
  isProOrAdmin: boolean;
  matchesList: any[];
  savedTactics: any[];
  schemaBelongsToMatch: (sc: { matchId?: string | undefined; }, matchId: string) => boolean;
  setActiveMatchId: React.Dispatch<React.SetStateAction<string>>;
  setActiveSport: (sport: string) => void;
  setActiveTeamId: React.Dispatch<React.SetStateAction<string>>;
  setAwayScore: React.Dispatch<React.SetStateAction<number>>;
  setCurrentFrameIdx: React.Dispatch<React.SetStateAction<number>>;
  setCurrentPeriod: React.Dispatch<React.SetStateAction<LivePeriod>>;
  setDrawingActions: React.Dispatch<React.SetStateAction<DrawingAction[]>>;
  setHalftimeSecondsLeft: React.Dispatch<React.SetStateAction<number>>;
  setHomeScore: React.Dispatch<React.SetStateAction<number>>;
  setIsHalftimeRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveMatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setLiveActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setLiveTimerSeconds: React.Dispatch<React.SetStateAction<number>>;
  setMatchEvents: React.Dispatch<React.SetStateAction<{ id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[]>>;
  setOpponentSetPieceRoles: React.Dispatch<React.SetStateAction<SetPieceRoleConfig>>;
  setOpponentSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setSetPieceRoles: React.Dispatch<React.SetStateAction<SetPieceRoleConfig>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setTacticalNotes: React.Dispatch<React.SetStateAction<string>>;
  teamRostersMap: Record<string, TeamRosterPlayer[]>;
}

export function selectMatch(boardCtx: SelectMatchCtx, matchId: string, customMatchesList?: any[]) {
  const { activeSport, activeTeamId, applySchemaFormat, firstLivePeriod, getDefaultPlayersForSport, isProOrAdmin, matchesList, savedTactics, schemaBelongsToMatch, setActiveMatchId, setActiveSport, setActiveTeamId, setAwayScore, setCurrentFrameIdx, setCurrentPeriod, setDrawingActions, setHalftimeSecondsLeft, setHomeScore, setIsHalftimeRunning, setIsLiveMatchMode, setIsLiveTimerRunning, setKeyframes, setLiveActionToken, setLiveTimerSeconds, setMatchEvents, setOpponentSetPieceRoles, setOpponentSubstitutes, setSetPieceRoles, setSubstitutes, setTacticalNotes, teamRostersMap } = boardCtx;
  const listToSearch = customMatchesList || matchesList;
  setActiveMatchId(matchId);
  const targetM = listToSearch.find((m) => m.id === matchId);
  if (targetM && targetM.teamId && targetM.teamId !== activeTeamId) {
    setActiveTeamId(targetM.teamId);
  }
  // Effectif de l'équipe du match : constitue le groupe d'un match qui n'en a pas encore
  const matchRoster = isProOrAdmin ? teamRostersMap[targetM?.teamId || activeTeamId] || [] : [];
  let hasSavedBench = false;
  if (typeof window !== "undefined") {
    localStorage.setItem("thebox_active_match_id", matchId);

    // Bancs enregistrés pour ce match (sinon bancs par défaut)
    const readBench = (key: string): any[] | null => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "null");
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };
    const savedBench = readBench(`thebox_substitutes_${matchId}`);
    const savedOppBench = readBench(`thebox_opp_substitutes_${matchId}`);
    hasSavedBench = savedBench !== null;
    setSubstitutes(savedBench ?? makeDefaultSubstitutes(false));
    setOpponentSubstitutes(savedOppBench ?? makeDefaultSubstitutes(true));

    // Load events for this match
    const savedEvts = localStorage.getItem(`thebox_match_events_${matchId}`);
    if (savedEvts) {
      try { setMatchEvents(JSON.parse(savedEvts)); } catch (e) { setMatchEvents([]); }
    } else {
      setMatchEvents([]);
    }

    // Load scores, timer & period for this match
    let isMatchFinished = targetM?.isFinished || false;
    const savedSt = localStorage.getItem(`thebox_match_state_${matchId}`);
    if (savedSt) {
      try {
        const parsed = JSON.parse(savedSt);
        setHomeScore(parsed.homeScore || 0);
        setAwayScore(parsed.awayScore || 0);
        setLiveTimerSeconds(parsed.liveTimerSeconds || 0);
        setHalftimeSecondsLeft(typeof parsed.halftimeSecondsLeft === "number" ? parsed.halftimeSecondsLeft : HALFTIME_BREAK_SECONDS);
        setIsHalftimeRunning(false);
        const periodLoaded = parsed.currentPeriod || firstLivePeriod;
        setCurrentPeriod(periodLoaded);
        if (periodLoaded === "FIN") {
          isMatchFinished = true;
        }
      } catch (e) {
        setHomeScore(0);
        setAwayScore(0);
        setLiveTimerSeconds(0);
        setHalftimeSecondsLeft(HALFTIME_BREAK_SECONDS);
        setIsHalftimeRunning(false);
        setCurrentPeriod(firstLivePeriod);
      }
    } else {
      setHomeScore(0);
      setAwayScore(0);
      setLiveTimerSeconds(0);
      setHalftimeSecondsLeft(HALFTIME_BREAK_SECONDS);
      setIsHalftimeRunning(false);
      setCurrentPeriod(firstLivePeriod);
    }

    if (isMatchFinished) {
      setIsLiveMatchMode(false);
      setIsLiveTimerRunning(false);
      setLiveActionToken(null);
    }

    // Load notes for this match
    const savedNt = localStorage.getItem(`thebox_match_notes_${matchId}`);
    if (savedNt !== null) {
      setTacticalNotes(savedNt);
    } else {
      setTacticalNotes("");
    }

    // Load set-piece roles for this match
    const savedSetPieces = localStorage.getItem(`thebox_setpiece_roles_${matchId}`);
    if (savedSetPieces) {
      try { setSetPieceRoles(JSON.parse(savedSetPieces)); } catch (e) { setSetPieceRoles(defaultSetPieceRoles); }
    } else {
      setSetPieceRoles(defaultSetPieceRoles);
    }

    // Load opponent set-piece roles for this match
    const savedOppSetPieces = localStorage.getItem(`thebox_opp_setpiece_roles_${matchId}`);
    if (savedOppSetPieces) {
      try { setOpponentSetPieceRoles(JSON.parse(savedOppSetPieces)); } catch (e) { setOpponentSetPieceRoles(defaultSetPieceRoles); }
    } else {
      setOpponentSetPieceRoles(defaultSetPieceRoles);
    }

    // Load pitch state (keyframes & drawings) specifically saved for this match
    const savedPitchState = localStorage.getItem(`thebox_pitch_state_${matchId}`);
    if (savedPitchState) {
      try {
        const parsed = JSON.parse(savedPitchState);
        if (parsed.keyframes && parsed.keyframes.length > 0) {
          setKeyframes(parsed.keyframes);
          if (parsed.drawings) setDrawingActions(parsed.drawings);
          else setDrawingActions([]);
          setCurrentFrameIdx(0);
          return;
        }
      } catch (e) { }
    }
  }

  // Filter schemas specifically linked to this match
  const matchSchemas = savedTactics.filter(sc => schemaBelongsToMatch(sc, matchId));
  if (matchSchemas.length > 0) {
    // Load the first schema of this match
    const schema = matchSchemas[0];
    if (schema.keyframes) setKeyframes(schema.keyframes);
    if (schema.drawings) setDrawingActions(schema.drawings);
    if (schema.sport) setActiveSport(schema.sport);
    applySchemaFormat(schema.sport || activeSport, schema.format);
    setCurrentFrameIdx(0);
  } else {
    // Nouveau match : joueurs par défaut du sport, remplacés par l'effectif de l'équipe s'il existe
    setDrawingActions([]);
    const defaultTokens = getDefaultPlayersForSport(activeSport);
    if (matchRoster.length > 0 && !hasSavedBench) {
      const { identity, bench } = buildMatchGroupFromRoster(defaultTokens, matchRoster);
      setKeyframes([applyRosterIdentity(defaultTokens, identity)]);
      setSubstitutes(bench);
    } else {
      setKeyframes([defaultTokens]);
    }
    setCurrentFrameIdx(0);
  }
}
