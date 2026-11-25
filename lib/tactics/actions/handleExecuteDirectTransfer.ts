// Tableau tactique : ancien handleExecuteDirectTransfer() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { toRosterStatus } from "@/lib/tactics/roster";
import { type TeamCategory, type TeamRosterPlayer, type Token } from "@/lib/tactics/types";

export interface HandleExecuteDirectTransferCtx {
  activeTeam: TeamCategory | undefined;
  activeTeamId: string;
  currentTokens: Token[];
  getRosterForTeam: (teamId: string) => TeamRosterPlayer[];
  handleUpdatePitchPlayer: (tokenId: string, field: "number" | "role" | "name" | "status" | "photo", value: any) => void;
  isProOrAdmin: boolean;
  setIsInterTeamSwapOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setOpponentSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setSwapNotification: React.Dispatch<React.SetStateAction<{ message: string; type: "success" | "info"; } | null>>;
  setSwapTargetPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
  setTeamRostersMap: React.Dispatch<React.SetStateAction<Record<string, TeamRosterPlayer[]>>>;
  substitutes: any[];
  swapSourcePlayer: { id: string; name: string; number: number; role: string; photo?: string | undefined; status?: string | undefined; isStarter: boolean; teamTarget?: "home" | "away" | undefined; } | null;
  swapTargetPlayerId: string | null;
  swapTargetTeamId: string;
  teamRostersMap: Record<string, TeamRosterPlayer[]>;
  teams: TeamCategory[];
}

export function handleExecuteDirectTransfer(boardCtx: HandleExecuteDirectTransferCtx, direction: "send_to_target" | "bring_from_target") {
  const { activeTeam, activeTeamId, currentTokens, getRosterForTeam, handleUpdatePitchPlayer, isProOrAdmin, setIsInterTeamSwapOpen, setKeyframes, setOpponentSubstitutes, setSubstitutes, setSwapNotification, setSwapTargetPlayerId, setTeamRostersMap, substitutes, swapSourcePlayer, swapTargetPlayerId, swapTargetTeamId, teamRostersMap, teams } = boardCtx;
  if (!swapSourcePlayer && direction === "send_to_target") return;
  const targetRoster = getRosterForTeam(swapTargetTeamId);
  const targetTeamObj = teams.find((t) => t.id === swapTargetTeamId);
  const sourceTeamObj = teams.find((t) => t.id === activeTeamId) || activeTeam;

  if (direction === "send_to_target" && swapSourcePlayer) {
    const newTargetPlayer: TeamRosterPlayer = {
      id: `p_${Date.now()}_${swapSourcePlayer.number}`,
      name: swapSourcePlayer.name,
      number: swapSourcePlayer.number,
      role: swapSourcePlayer.role,
      status: (swapSourcePlayer.status as any) || "normal",
      photo: swapSourcePlayer.photo,
      isStarter: false,
    };
    const updatedTargetRoster = [...targetRoster, newTargetPlayer];

    // Le joueur quitte mon équipe : sa fiche sort de l'effectif (et ne réapparaît pas en réserve)
    const leavingRosterId = swapSourcePlayer.teamTarget === "away"
      ? undefined
      : swapSourcePlayer.isStarter
        ? currentTokens.find((t) => t.id === swapSourcePlayer.id)?.rosterId
        : substitutes.find((s) => s.id === swapSourcePlayer.id)?.rosterId;

    if (!swapSourcePlayer.isStarter) {
      if (swapSourcePlayer.teamTarget === "away") {
        setOpponentSubstitutes((prev) => prev.filter((s) => s.id !== swapSourcePlayer.id));
      } else {
        setSubstitutes((prev) => prev.filter((s) => s.id !== swapSourcePlayer.id));
      }
    } else {
      handleUpdatePitchPlayer(swapSourcePlayer.id, "name", "Nouveau Titulaire");
      setKeyframes((prev) => prev.map((frame) => frame.map((t) => (t.id === swapSourcePlayer.id ? { ...t, rosterId: undefined } : t))));
    }

    setTeamRostersMap((prev) => {
      const nextMap = { ...prev, [swapTargetTeamId]: updatedTargetRoster };
      if (leavingRosterId && nextMap[activeTeamId]) {
        nextMap[activeTeamId] = nextMap[activeTeamId].filter((p) => p.id !== leavingRosterId);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_team_rosters", JSON.stringify(nextMap));
      }
      return nextMap;
    });

    setSwapNotification({
      type: "success",
      message: `➡️ Transfert réussi : ${swapSourcePlayer.name} a rejoint l'effectif de ${targetTeamObj?.name || "l'autre équipe"} !`
    });
    setIsInterTeamSwapOpen(false);
  } else if (direction === "bring_from_target") {
    const targetPlayer = targetRoster.find((p) => p.id === swapTargetPlayerId);
    if (!targetPlayer) {
      alert("Veuillez sélectionner le joueur à faire venir dans votre équipe.");
      return;
    }
    // Le renfort rejoint l'effectif de mon équipe (s'il est enregistré) et le banc du match
    const joinsRoster = isProOrAdmin && !!(activeTeamId && teamRostersMap[activeTeamId]?.length);
    const arrivingRosterPlayer: TeamRosterPlayer = {
      id: `${activeTeamId}_p${Date.now()}`,
      name: targetPlayer.name,
      number: targetPlayer.number,
      role: targetPlayer.role,
      status: toRosterStatus(targetPlayer.status),
      photo: targetPlayer.photo,
      isStarter: false,
    };
    const newSub = {
      id: `sub_${Date.now()}_${targetPlayer.number}`,
      name: targetPlayer.name,
      number: targetPlayer.number,
      role: targetPlayer.role,
      status: targetPlayer.status || "normal",
      photo: targetPlayer.photo,
      type: "player_a",
      ...(joinsRoster ? { rosterId: arrivingRosterPlayer.id } : {}),
    };
    setSubstitutes((prev) => [...prev, newSub]);

    const updatedTargetRoster = targetRoster.filter((p) => p.id !== targetPlayer.id);
    setTeamRostersMap((prev) => {
      const nextMap = { ...prev, [swapTargetTeamId]: updatedTargetRoster };
      if (joinsRoster && nextMap[activeTeamId]) {
        nextMap[activeTeamId] = [...nextMap[activeTeamId], arrivingRosterPlayer];
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_team_rosters", JSON.stringify(nextMap));
      }
      return nextMap;
    });

    setSwapNotification({
      type: "success",
      message: `⬅️ Renfort intégré : ${targetPlayer.name} rejoint le banc de ${sourceTeamObj?.name || "votre équipe"} !`
    });
    setSwapTargetPlayerId(null);
  }
}
