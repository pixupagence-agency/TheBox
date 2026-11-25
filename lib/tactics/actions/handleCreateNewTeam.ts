// Tableau tactique : ancien handleCreateNewTeam() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { getGameFormatOptions, resolveGameFormat } from "@/lib/gameFormats";
import { applyRosterIdentity, buildMatchGroupFromRoster, generateDefaultRosterForCustomTeam, type NewTeamPlayerEdit, type TeamRosterStatus } from "@/lib/tactics/roster";
import { type DrawingAction, type TeamCategory, type TeamRosterPlayer, type Token } from "@/lib/tactics/types";

export interface HandleCreateNewTeamCtx {
  activeSport: string;
  clearActiveMatch: () => void;
  getDefaultPlayersForSport: (sport: string, format?: string) => Token[];
  getNewTeamDraft: () => { size: number; starterCount: number; players: { index: number; number: number; numberText: string; name: string; role: string; photo: string | undefined; status: TeamRosterStatus; isStarter: boolean; }[]; positions: string[]; };
  isProOrAdmin: boolean;
  newTeamCategory: string;
  newTeamFormat: string;
  newTeamName: string;
  setActiveTeamId: React.Dispatch<React.SetStateAction<string>>;
  setCurrentFrameIdx: React.Dispatch<React.SetStateAction<number>>;
  setDrawingActions: React.Dispatch<React.SetStateAction<DrawingAction[]>>;
  setIsMultiTeamUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setNewTeamFormat: React.Dispatch<React.SetStateAction<string>>;
  setNewTeamName: React.Dispatch<React.SetStateAction<string>>;
  setNewTeamPlayerEdits: React.Dispatch<React.SetStateAction<Record<number, NewTeamPlayerEdit>>>;
  setNewTeamSquadSize: React.Dispatch<React.SetStateAction<number | null>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setTeamRostersMap: React.Dispatch<React.SetStateAction<Record<string, TeamRosterPlayer[]>>>;
  setTeams: React.Dispatch<React.SetStateAction<TeamCategory[]>>;
  teams: TeamCategory[];
}

export function handleCreateNewTeam(boardCtx: HandleCreateNewTeamCtx, e?: React.FormEvent) {
  const { activeSport, clearActiveMatch, getDefaultPlayersForSport, getNewTeamDraft, isProOrAdmin, newTeamCategory, newTeamFormat, newTeamName, setActiveTeamId, setCurrentFrameIdx, setDrawingActions, setIsMultiTeamUpgradeModalOpen, setKeyframes, setNewTeamFormat, setNewTeamName, setNewTeamPlayerEdits, setNewTeamSquadSize, setSubstitutes, setTeamRostersMap, setTeams, teams } = boardCtx;
  if (e) e.preventDefault();

  // La première équipe est accessible à toutes les formules ; les suivantes sont réservées au PRO
  const isFirstTeam = teams.length === 0;
  if (!isProOrAdmin && !isFirstTeam) {
    setIsMultiTeamUpgradeModalOpen(true);
    return;
  }

  if (!newTeamName.trim()) {
    alert("Veuillez saisir un nom d'équipe (ex: U17 National, Séniors C...).");
    return;
  }

  const newTeamObj: TeamCategory = {
    id: `team_${Date.now()}`,
    name: newTeamName.trim(),
    category: newTeamCategory,
    color: "#00E599",
    ...(isFirstTeam ? { isDefault: true } : {}),
    ...(getGameFormatOptions(activeSport).length > 0 ? { format: resolveGameFormat(activeSport, newTeamFormat) } : {}),
  };

  if (isProOrAdmin) {
    // PRO : effectif choisi dans le formulaire (les fiches laissées vides deviennent « Joueur N »)
    const newRoster: TeamRosterPlayer[] = getNewTeamDraft().players.map((p) => ({
      id: `${newTeamObj.id}_p${p.index + 1}`,
      name: p.name.trim() || `Joueur ${p.number}`,
      role: p.role,
      number: p.number,
      status: p.status,
      isStarter: p.isStarter,
      ...(p.photo ? { photo: p.photo } : {}),
    }));
    setTeamRostersMap((prev) => ({ ...prev, [newTeamObj.id]: newRoster }));

    // La nouvelle équipe n'a pas encore de match : le terrain et le banc reprennent tout de suite son effectif
    clearActiveMatch();
    const teamTokens = getDefaultPlayersForSport(activeSport, resolveGameFormat(activeSport, newTeamObj.format));
    const { identity, bench } = buildMatchGroupFromRoster(teamTokens, newRoster);
    setKeyframes([applyRosterIdentity(teamTokens, identity)]);
    setDrawingActions([]);
    setCurrentFrameIdx(0);
    setSubstitutes(bench);
  } else {
    // Gratuit : effectif type de 26 joueurs, terrain et banc inchangés
    const newRoster = generateDefaultRosterForCustomTeam(newTeamObj.id, newTeamObj.name, newTeamObj.category);
    setTeamRostersMap((prev) => ({ ...prev, [newTeamObj.id]: newRoster }));
  }

  setTeams((prev) => [...prev, newTeamObj]);
  setActiveTeamId(newTeamObj.id);
  setNewTeamName("");
  setNewTeamFormat("");
  setNewTeamSquadSize(null);
  setNewTeamPlayerEdits({});
}
