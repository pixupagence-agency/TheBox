// Tableau tactique : ancien applyRemoteLiveCommand() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { type LiveMatchMeta, type LiveState } from "@/lib/live/client";
import { applyLiveOp, type LiveCommand, type LiveMatchDoc, type LiveOp, type LivePlayer } from "@/lib/live/model";
import { type LivePeriod, type LivePeriodConfig } from "@/lib/tactics/livePeriods";
import { type Token } from "@/lib/tactics/types";

export interface ApplyRemoteLiveCommandCtx {
  activeMatch: any;
  breakLongLabel: "Pause" | "Mi-temps";
  currentFrameIdx: number;
  currentPeriod: LivePeriod;
  currentTokens: Token[];
  handleDeleteMatchEvent: (eventId: string) => void;
  handleFinishLiveMatch: (isAuto?: boolean) => void;
  handleSelectLivePeriod: (period: LivePeriod) => void;
  handleSwapPlayerOnPitch: (originalToken: Token, newSub: any, opts?: { eventId?: string | undefined; noEvent?: boolean | undefined; remote?: boolean | undefined; } | undefined) => void;
  liveMetaFor: (m: any) => LiveMatchMeta;
  livePeriodButtons: LivePeriod[];
  livePeriodConfig: LivePeriodConfig;
  liveState: LiveState;
  liveTimerSeconds: number;
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  notifyRemote: (text: string) => void;
  setAwayScore: React.Dispatch<React.SetStateAction<number>>;
  setHomeScore: React.Dispatch<React.SetStateAction<number>>;
  setIsLiveMatchMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLiveTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setMatchEvents: React.Dispatch<React.SetStateAction<{ id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[]>>;
  substitutes: any[];
}

export function applyRemoteLiveCommand(boardCtx: ApplyRemoteLiveCommandCtx, cmdId: string, cmd: LiveCommand) {
  const { activeMatch, breakLongLabel, currentFrameIdx, currentPeriod, currentTokens, handleDeleteMatchEvent, handleFinishLiveMatch, handleSelectLivePeriod, handleSwapPlayerOnPitch, liveMetaFor, livePeriodButtons, livePeriodConfig, liveState, liveTimerSeconds, matchEvents, notifyRemote, setAwayScore, setHomeScore, setIsLiveMatchMode, setIsLiveTimerRunning, setKeyframes, setMatchEvents, substitutes } = boardCtx;
  const op = cmd.op;
  if (!op) return;
  if ((activeMatch.isFinished || currentPeriod === "FIN") && op.kind !== "undo") return;
  const pseudoDoc = { ...liveMetaFor(activeMatch), ...liveState } as LiveMatchDoc;
  switch (op.kind) {
    case "start": {
      if (currentPeriod === "MI-TEMPS") {
        handleSelectLivePeriod(livePeriodConfig.periods[livePeriodConfig.breakAfterIndex + 1]);
      } else {
        setIsLiveTimerRunning(true);
      }
      setIsLiveMatchMode(true);
      notifyRemote(liveTimerSeconds === 0 ? "coup d'envoi ▶️" : "reprise du chrono ▶️");
      return;
    }
    case "pause":
      setIsLiveTimerRunning(false);
      notifyRemote("chrono en pause ⏸");
      return;
    case "next": {
      const seq: LivePeriod[] = [...livePeriodButtons, "FIN"];
      const next = seq[seq.indexOf(currentPeriod) + 1];
      if (!next) return;
      if (next === "FIN") {
        handleFinishLiveMatch();
        return;
      }
      setIsLiveMatchMode(true);
      handleSelectLivePeriod(next);
      notifyRemote(next === "MI-TEMPS" ? breakLongLabel : `début ${next}`);
      return;
    }
    case "goal":
    case "card":
    case "note":
    case "action": {
      // La télécommande ne connaît que les noms publics (« Prénom I. ») : le tableau du coach
      // reprend le nom complet du joueur, retrouvé par son identifiant
      const localPlayer = (p?: LivePlayer): LivePlayer | undefined => {
        if (!p?.id) return p;
        const local = currentTokens.find((t) => t.id === p.id) || substitutes.find((s) => String(s.id) === p.id);
        return local?.name ? { ...p, name: local.name } : p;
      };
      const localOp: LiveOp =
        op.kind === "goal" ? { ...op, scorer: localPlayer(op.scorer), assister: localPlayer(op.assister) }
        : op.kind === "card" || op.kind === "action" ? { ...op, player: localPlayer(op.player) }
        : op;
      const patch = applyLiveOp(pseudoDoc, localOp, cmdId, Date.now());
      const ev = patch?.events?.[0];
      if (!ev) return;
      setMatchEvents((prev) => (prev.some((e) => e.id === ev.id) ? prev : [ev as any, ...prev]));
      if (op.kind === "goal") {
        const pts = ev.points || 1;
        if (op.team === "home") setHomeScore((prev) => prev + pts);
        else setAwayScore((prev) => prev + pts);
        notifyRemote(`${ev.icon || "⚽"} ${op.team === "home" ? ev.player : activeMatch.awayTeam}`);
      } else if (op.kind === "card") {
        if (op.color === "yellow" && op.team === "home" && op.player?.id) {
          setKeyframes((prev) => {
            const copy = [...prev];
            copy[currentFrameIdx] = (copy[currentFrameIdx] || []).map((t) => (t.id === op.player?.id ? { ...t, yellowCards: 1 } : t));
            return copy;
          });
        }
        notifyRemote(op.color === "yellow" ? `carton jaune 🟨 ${ev.player}` : `carton rouge 🟥 ${ev.player}${op.team === "home" ? " (retirez-le du terrain)" : ""}`);
      } else if (op.kind === "action") {
        notifyRemote(`${ev.icon || "📝"} ${ev.player}`);
      } else {
        notifyRemote(`note 📝 ${ev.player}`);
      }
      return;
    }
    case "sub": {
      const token = currentTokens.find((t) => t.id === op.outId && t.type === "player_a");
      const incoming = substitutes.find((s) => String(s.id) === op.inId);
      if (!token || !incoming) return;
      handleSwapPlayerOnPitch(token, incoming, { eventId: `r_${cmdId}`, remote: true });
      notifyRemote(`remplacement 🔄 ${token.name} ➔ ${incoming.name}`);
      return;
    }
    case "undo": {
      const target = matchEvents.find((e) => e.id === op.eventId);
      if (!target) return;
      handleDeleteMatchEvent(target.id);
      if (target.type === "sub" && target.outId) {
        const token = currentTokens.find((t) => t.id === target.outId);
        const back = substitutes.find((s) => String(s.id) === target.outId);
        if (token && back) handleSwapPlayerOnPitch(token, back, { noEvent: true });
      }
      notifyRemote("dernière action annulée ↩️");
      return;
    }
  }
}
