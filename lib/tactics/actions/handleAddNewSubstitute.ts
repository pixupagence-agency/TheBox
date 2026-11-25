// Tableau tactique : ancien handleAddNewSubstitute() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { type TeamRosterPlayer, type Token } from "@/lib/tactics/types";

export interface HandleAddNewSubstituteCtx {
  activeSport: string;
  activeTeamId: string;
  currentTokens: Token[];
  isProOrAdmin: boolean;
  opponentSubstitutes: any[];
  rolesTargetTeam: "home" | "away";
  setOpponentSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setTeamRostersMap: React.Dispatch<React.SetStateAction<Record<string, TeamRosterPlayer[]>>>;
  substitutes: any[];
  teamRostersMap: Record<string, TeamRosterPlayer[]>;
}

export function handleAddNewSubstitute(boardCtx: HandleAddNewSubstituteCtx, targetTeam?: "home" | "away") {
  const { activeSport, activeTeamId, currentTokens, isProOrAdmin, opponentSubstitutes, rolesTargetTeam, setOpponentSubstitutes, setSubstitutes, setTeamRostersMap, substitutes, teamRostersMap } = boardCtx;
  const isAway = (targetTeam || rolesTargetTeam) === "away";
  const starters = currentTokens.filter((t) => isAway ? t.type === "player_b" : t.type === "player_a");
  const bench = isAway ? opponentSubstitutes : substitutes;

  const taken = new Set<number>();
  starters.forEach((p) => {
    if (typeof p.number === "number" && !isNaN(p.number)) taken.add(p.number);
  });
  bench.forEach((s) => {
    if (typeof s.number === "number" && !isNaN(s.number)) taken.add(s.number);
  });

  // Le nouveau joueur prend le numéro qui suit le dernier de l'effectif (titulaires puis banc)
  let newNum = (taken.size ? Math.max(...taken) : 0) + 1;
  while (taken.has(newNum)) {
    newNum++;
  }

  if (isAway) {
    const newId = `opp_sub_${Date.now()}_${newNum}`;
    const newSub = {
      id: newId,
      name: `Joueur ${newNum} Adv`,
      number: newNum,
      role: activeSport === "football" ? "SUB" : "Remplaçant",
      status: "normal",
      type: "player_b"
    };
    setOpponentSubstitutes((prev) => [...prev, newSub]);
  } else {
    const newId = `sub_${Date.now()}_${newNum}`;
    const role = activeSport === "football" ? "SUB" : "Remplaçant";
    // PRO : le nouveau joueur rejoint aussi l'effectif de l'équipe (s'il est enregistré)
    const joinsRoster = isProOrAdmin && !!(activeTeamId && teamRostersMap[activeTeamId]?.length);
    const rosterId = joinsRoster ? `${activeTeamId}_p${Date.now()}` : undefined;
    const newSub = {
      id: newId,
      name: `Joueur ${newNum}`,
      number: newNum,
      role,
      status: "normal",
      type: "player_a",
      ...(rosterId ? { rosterId } : {}),
    };
    setSubstitutes((prev) => [...prev, newSub]);
    if (rosterId) {
      setTeamRostersMap((prev) => ({
        ...prev,
        [activeTeamId]: [...(prev[activeTeamId] || []), { id: rosterId, name: newSub.name, number: newNum, role, status: "normal", isStarter: false }],
      }));
    }
  }
}
