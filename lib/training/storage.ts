// Module Training : brouillon local du schéma en cours et lecture (seule) de l'effectif existant.
// Les clés « thebox_training_… » ne font pas partie des clés synchronisées par lib/cloudSync.ts :
// le module n'interfère pas avec la synchronisation actuelle (seules les séances, lib/training/sessions.ts, sont synchronisées). La sauvegarde en ligne des exercices
// arrive en phase 3 (collections Firestore dédiées).
import { backupRaw } from "../localData";
import { readDiagram } from "./diagramData";
import { emptyDiagram } from "./editorState";
import type { TrainingDiagram } from "./types";

export const TRAINING_DRAFT_KEY = "thebox_training_draft_v1";

/** Brouillon en cours (migré si besoin). S'il a fallu le réparer ou l'abandonner, le texte
 *  d'origine est copié sous « thebox_backup_… » avant d'être remplacé. */
export function loadDraft(): TrainingDiagram {
  if (typeof window === "undefined") return emptyDiagram();
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(TRAINING_DRAFT_KEY);
    if (!raw) return emptyDiagram();
    const parsed = JSON.parse(raw);
    const diagram = readDiagram(parsed);
    if (!diagram || diagram.elements.length !== parsed.elements.length) backupRaw(TRAINING_DRAFT_KEY, raw);
    return diagram || emptyDiagram();
  } catch {
    backupRaw(TRAINING_DRAFT_KEY, raw);
    return emptyDiagram();
  }
}

export function saveDraft(diagram: TrainingDiagram) {
  try {
    localStorage.setItem(TRAINING_DRAFT_KEY, JSON.stringify(diagram));
  } catch {
    /* stockage plein ou indisponible : le schéma reste en mémoire */
  }
}

/** Logo du club du coach connecté, s'il doit figurer dans le rond central (même réglage que le tableau tactique) */
export function readClubCenterLogo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const coaches = JSON.parse(localStorage.getItem("thebox_coaches") || "[]") as Array<{ id: string; clubLogo?: string; showLogoOnPitch?: boolean }>;
    const activeId = localStorage.getItem("thebox_active_coach_id");
    const coach = coaches.find((c) => c.id === activeId) || coaches[0];
    if (!coach?.clubLogo || coach.showLogoOnPitch === false) return null;
    return coach.clubLogo.startsWith("data:image/") ? coach.clubLogo : null;
  } catch {
    return null;
  }
}

export interface RosterPlayer {
  id: string;
  name: string;
  number: number;
  role: string;
}

/** Effectif de l'équipe active du tableau tactique, ou de l'équipe indiquée (lecture seule) */
export function readActiveRoster(forTeamId?: string): { teamName: string; players: RosterPlayer[] } {
  if (typeof window === "undefined") return { teamName: "", players: [] };
  try {
    const teamId = forTeamId || localStorage.getItem("thebox_active_team_id") || "team_1";
    const rosters = JSON.parse(localStorage.getItem("thebox_team_rosters") || "{}") as Record<string, RosterPlayer[]>;
    const teams = JSON.parse(localStorage.getItem("thebox_teams") || "[]") as Array<{ id: string; name: string }>;
    const players = Array.isArray(rosters[teamId]) ? rosters[teamId] : [];
    return {
      teamName: teams.find((t) => t.id === teamId)?.name || "",
      players: players
        .filter((p) => p && typeof p.name === "string")
        .map((p) => ({ id: String(p.id), name: p.name, number: Number(p.number) || 0, role: String(p.role || "") }))
        .sort((a, b) => a.number - b.number),
    };
  } catch {
    return { teamName: "", players: [] };
  }
}
