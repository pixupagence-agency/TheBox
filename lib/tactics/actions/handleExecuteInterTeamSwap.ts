// Tableau tactique : ancien handleExecuteInterTeamSwap() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { toRosterStatus } from "@/lib/tactics/roster";
import { type TeamCategory, type TeamRosterPlayer, type Token } from "@/lib/tactics/types";

export interface HandleExecuteInterTeamSwapCtx {
  activeTeam: TeamCategory | undefined;
  activeTeamId: string;
  currentTokens: Token[];
  getRosterForTeam: (teamId: string) => TeamRosterPlayer[];
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setOpponentSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setSwapNotification: React.Dispatch<React.SetStateAction<{ message: string; type: "success" | "info"; } | null>>;
  setSwapSourcePlayer: React.Dispatch<React.SetStateAction<{ id: string; name: string; number: number; role: string; photo?: string | undefined; status?: string | undefined; isStarter: boolean; teamTarget?: "home" | "away" | undefined; } | null>>;
  setSwapTargetPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
  setTeamRostersMap: React.Dispatch<React.SetStateAction<Record<string, TeamRosterPlayer[]>>>;
  substitutes: any[];
  swapSourcePlayer: { id: string; name: string; number: number; role: string; photo?: string | undefined; status?: string | undefined; isStarter: boolean; teamTarget?: "home" | "away" | undefined; } | null;
  swapTargetPlayerId: string | null;
  swapTargetTeamId: string;
  teams: TeamCategory[];
  updateRosterPlayer: (rosterId: string | undefined, patch: Partial<TeamRosterPlayer>) => void;
}

export function handleExecuteInterTeamSwap(boardCtx: HandleExecuteInterTeamSwapCtx) {
  const { activeTeam, activeTeamId, currentTokens, getRosterForTeam, setKeyframes, setOpponentSubstitutes, setSubstitutes, setSwapNotification, setSwapSourcePlayer, setSwapTargetPlayerId, setTeamRostersMap, substitutes, swapSourcePlayer, swapTargetPlayerId, swapTargetTeamId, teams, updateRosterPlayer } = boardCtx;
  if (!swapSourcePlayer) {
    alert("Veuillez choisir un joueur dans l'effectif actuel.");
    return;
  }
  if (!swapTargetTeamId) {
    alert("Veuillez sélectionner une autre équipe de votre club.");
    return;
  }
  const targetRoster = getRosterForTeam(swapTargetTeamId);
  const targetPlayer = targetRoster.find((p) => p.id === swapTargetPlayerId);
  if (!targetPlayer) {
    alert("Veuillez sélectionner le joueur avec qui réaliser l'échange.");
    return;
  }

  const sourceTeamObj = teams.find((t) => t.id === activeTeamId) || activeTeam;
  const targetTeamObj = teams.find((t) => t.id === swapTargetTeamId);

  // La fiche d'effectif du joueur échangé (mon équipe) reçoit le joueur qui arrive
  if (swapSourcePlayer.teamTarget !== "away") {
    const sourceRosterId = swapSourcePlayer.isStarter
      ? currentTokens.find((t) => t.id === swapSourcePlayer.id)?.rosterId
      : substitutes.find((s) => s.id === swapSourcePlayer.id)?.rosterId;
    updateRosterPlayer(sourceRosterId, {
      name: targetPlayer.name,
      number: targetPlayer.number,
      role: targetPlayer.role,
      status: toRosterStatus(targetPlayer.status),
      photo: targetPlayer.photo,
    });
  }

  // 1. Update Source Team (current squad)
  if (swapSourcePlayer.isStarter) {
    // Update token on pitch
    setKeyframes((prev) =>
      prev.map((frame) =>
        frame.map((t) => {
          if (t.id === swapSourcePlayer.id) {
            return {
              ...t,
              name: targetPlayer.name,
              number: targetPlayer.number,
              role: targetPlayer.role,
              status: (targetPlayer.status as any) || "normal",
              photo: targetPlayer.photo,
            };
          }
          return t;
        })
      )
    );
  } else {
    // Update substitute on bench
    if (swapSourcePlayer.teamTarget === "away") {
      setOpponentSubstitutes((prev) =>
        prev.map((s) =>
          s.id === swapSourcePlayer.id
            ? {
              ...s,
              name: targetPlayer.name,
              number: targetPlayer.number,
              role: targetPlayer.role,
              status: targetPlayer.status || "normal",
              photo: targetPlayer.photo,
            }
            : s
        )
      );
    } else {
      setSubstitutes((prev) =>
        prev.map((s) =>
          s.id === swapSourcePlayer.id
            ? {
              ...s,
              name: targetPlayer.name,
              number: targetPlayer.number,
              role: targetPlayer.role,
              status: targetPlayer.status || "normal",
              photo: targetPlayer.photo,
            }
            : s
        )
      );
    }
  }

  // 2. Update Target Team Roster in teamRostersMap
  const updatedTargetRoster = targetRoster.map((p) => {
    if (p.id === targetPlayer.id) {
      return {
        ...p,
        name: swapSourcePlayer.name,
        number: swapSourcePlayer.number,
        role: swapSourcePlayer.role,
        status: (swapSourcePlayer.status as any) || "normal",
        photo: swapSourcePlayer.photo,
      };
    }
    return p;
  });

  setTeamRostersMap((prev) => {
    const nextMap = {
      ...prev,
      [swapTargetTeamId]: updatedTargetRoster,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_team_rosters", JSON.stringify(nextMap));
    }
    return nextMap;
  });

  const msg = `🔄 Échange réussi : ${swapSourcePlayer.name} a rejoint ${targetTeamObj?.name || "l'autre équipe"} et ${targetPlayer.name} intègre ${sourceTeamObj?.name || "votre équipe"} !`;
  setSwapNotification({
    type: "success",
    message: msg,
  });

  // Update the source player in state to reflect the new incoming player
  setSwapSourcePlayer({
    id: swapSourcePlayer.id,
    name: targetPlayer.name,
    number: targetPlayer.number,
    role: targetPlayer.role,
    photo: targetPlayer.photo,
    status: targetPlayer.status || "normal",
    isStarter: swapSourcePlayer.isStarter,
    teamTarget: swapSourcePlayer.teamTarget,
  });
  setSwapTargetPlayerId(null);
}
