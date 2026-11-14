// Module Training : brouillon local du schéma en cours et lecture (seule) de l'effectif existant.
// Les clés « thebox_training_… » ne font pas partie des clés synchronisées par lib/cloudSync.ts :
// le module n'interfère pas avec la synchronisation actuelle. La sauvegarde en ligne des exercices
// arrive en phase 3 (collections Firestore dédiées).
import { emptyDiagram } from "./editorState";
import { PITCH_FORMATS } from "./pitch";
import type { TrainingDiagram } from "./types";

export const TRAINING_DRAFT_KEY = "thebox_training_draft_v1";

export function loadDraft(): TrainingDiagram {
  if (typeof window === "undefined") return emptyDiagram();
  try {
    const raw = localStorage.getItem(TRAINING_DRAFT_KEY);
    if (!raw) return emptyDiagram();
    const parsed = JSON.parse(raw) as TrainingDiagram;
    const validPitch = parsed?.pitch && PITCH_FORMATS.some((f) => f.id === parsed.pitch.format);
    if (parsed?.version !== 1 || !validPitch || !Array.isArray(parsed.elements)) return emptyDiagram();
    return parsed;
  } catch {
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

export interface RosterPlayer {
  id: string;
  name: string;
  number: number;
  role: string;
}

/** Effectif de l'équipe active du tableau tactique (lecture seule) */
export function readActiveRoster(): { teamName: string; players: RosterPlayer[] } {
  if (typeof window === "undefined") return { teamName: "", players: [] };
  try {
    const teamId = localStorage.getItem("thebox_active_team_id") || "team_1";
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
