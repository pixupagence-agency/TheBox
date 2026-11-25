// Tableau tactique : effectifs d'équipe (rôles par défaut, statuts, groupe du match ↔ effectif).
import type { TeamCategory, TeamRosterPlayer, Token } from "./types";

/** Fiche saisie pour un joueur lors de la création d'une équipe (champ absent = valeur par défaut). */
export type NewTeamPlayerEdit = { name?: string; role?: string; numberText?: string; photo?: string; status?: TeamRosterStatus };
/** Taille maximale de l'effectif proposé à la création d'une équipe. */
export const MAX_TEAM_SQUAD_SIZE = 40;

export const standardDefaultRoles26: { num: number; role: string; starter: boolean }[] = [
  { num: 1, role: "GB", starter: true },
  { num: 2, role: "DD", starter: true },
  { num: 3, role: "DG", starter: true },
  { num: 4, role: "DC", starter: true },
  { num: 5, role: "DC", starter: true },
  { num: 6, role: "MDC", starter: true },
  { num: 7, role: "AiD", starter: true },
  { num: 8, role: "MC", starter: true },
  { num: 9, role: "BU", starter: true },
  { num: 10, role: "MOC", starter: true },
  { num: 11, role: "AiG", starter: true },
  { num: 12, role: "DD", starter: false },
  { num: 13, role: "DC", starter: false },
  { num: 14, role: "DG", starter: false },
  { num: 15, role: "MDC", starter: false },
  { num: 16, role: "GB", starter: false },
  { num: 17, role: "MC", starter: false },
  { num: 18, role: "MC", starter: false },
  { num: 19, role: "MOC", starter: false },
  { num: 20, role: "AiD", starter: false },
  { num: 21, role: "AiG", starter: false },
  { num: 22, role: "BU", starter: false },
  { num: 23, role: "AC", starter: false },
  { num: 24, role: "DC", starter: false },
  { num: 25, role: "MC", starter: false },
  { num: 26, role: "GB", starter: false },
];

export const generateStandardRoster = (teamId: string): TeamRosterPlayer[] => {
  return standardDefaultRoles26.map(({ num, role, starter }) => ({
    id: `${teamId}_p${num}`,
    name: `Joueur ${num}`,
    role,
    number: num,
    status: "normal",
    isStarter: starter,
  }));
};

export const defaultManagedTeamRosters: Record<string, TeamRosterPlayer[]> = {
  team_1: generateStandardRoster("t1"),
  team_2: generateStandardRoster("t2"),
  team_3: generateStandardRoster("t3"),
  team_4: generateStandardRoster("t4"),
};

export const generateDefaultRosterForCustomTeam = (teamId: string, _teamName: string, _category: string): TeamRosterPlayer[] => {
  return generateStandardRoster(teamId);
};

/** Banc par défaut d'un match sans effectif (Joueur 12 à 26). */
export const makeDefaultSubstitutes = (opponent: boolean) =>
  standardDefaultRoles26.slice(11).map(({ num, role }, i) => ({
    id: opponent ? `opp_s${i + 1}` : `s${i + 1}`,
    name: opponent ? `Joueur ${num} Adv` : `Joueur ${num}`,
    role,
    number: num,
    status: "normal",
  }));

/** Banc enregistré pour le match actif (au chargement de la page). */
export const readStoredBench = (prefix: string): any[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const matchId = localStorage.getItem("thebox_active_match_id");
    if (!matchId) return null;
    const raw = localStorage.getItem(`${prefix}${matchId}`);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const ROSTER_STATUSES = ["normal", "excellent", "tired", "injured", "suspended", "absent", "reserve"] as const;
export type TeamRosterStatus = NonNullable<TeamRosterPlayer["status"]>;
/** Statuts proposés dans les fiches de l'effectif d'équipe */
export const TEAM_PLAYER_STATUS_OPTIONS: { value: TeamRosterStatus; label: string }[] = [
  { value: "normal", label: "Disponible" },
  { value: "reserve", label: "À disposition" },
  { value: "absent", label: "Absent" },
  { value: "suspended", label: "Suspendu" },
  { value: "injured", label: "Blessé" },
];
/** Joueur indisponible pour le match (absent, suspendu, blessé) */
export const isUnavailableStatus = (status?: string) => status === "absent" || status === "suspended" || status === "injured";
/** « En forme » et « Fatigué » restent des joueurs disponibles */
export const toTeamStatusOption = (status?: string): TeamRosterStatus =>
  isUnavailableStatus(status) || status === "reserve" ? (status as TeamRosterStatus) : "normal";
/** Statut d'un joueur placé dans le groupe du match (« À disposition » n'a pas de sens sur le terrain ni sur le banc) */
export const toGroupStatus = (status?: TeamRosterStatus) => (!status || status === "reserve" ? "normal" : status);
/** Disponibilité conservée dans la fiche d'effectif (les cartons du match n'y vont pas). */
export const toRosterStatus = (status?: string): TeamRosterPlayer["status"] =>
  (ROSTER_STATUSES as readonly string[]).includes(status || "") ? (status as TeamRosterPlayer["status"]) : "normal";

/** Fiche de l'effectif → remplaçant du match (même fiche, reliée par rosterId). */
export const rosterPlayerToSub = (p: TeamRosterPlayer) => ({
  id: `sub_${p.id}`,
  rosterId: p.id,
  name: p.name,
  number: p.number,
  role: p.role,
  status: toGroupStatus(p.status),
  photo: p.photo,
  type: "player_a" as const,
});

/**
 * Groupe d'un match construit depuis l'effectif de l'équipe : les titulaires de l'effectif
 * prennent les places du terrain (positions conservées), les joueurs suivants vont sur le banc.
 */
export const buildMatchGroupFromRoster = (tokens: Token[], roster: TeamRosterPlayer[]) => {
  // Les joueurs indisponibles et « À disposition » restent hors du groupe du match
  const available = roster.filter((p) => !isUnavailableStatus(p.status) && p.status !== "reserve");
  const ordered = [...available.filter((p) => p.isStarter), ...available.filter((p) => !p.isStarter)];
  const identity: Record<string, Partial<Token>> = {};
  tokens
    .filter((t) => t.type === "player_a")
    .forEach((t, i) => {
      const p = ordered[i];
      if (p) {
        identity[t.id] = { name: p.name, number: p.number, role: p.role, photo: p.photo, status: toGroupStatus(p.status), rosterId: p.id };
      }
    });
  const used = Object.keys(identity).length;
  return { identity, bench: ordered.slice(used).map(rosterPlayerToSub) };
};

/**
 * Applique les fiches de l'effectif aux pions d'une étape : le groupe compte exactement les joueurs
 * de l'effectif, une place du terrain sans joueur (effectif trop court) est retirée.
 */
export const applyRosterIdentity = (frame: Token[], identity: Record<string, Partial<Token>>) =>
  frame
    .filter((t) => t.type !== "player_a" || !!identity[t.id])
    .map((t) => (identity[t.id] ? { ...t, ...identity[t.id] } : t));

/** Groupe encore « vierge » : uniquement les joueurs génériques (Joueur N), sans fiche reliée. */
export const isGenericGroup = (players: { name?: string; rosterId?: string }[]) =>
  players.every((p) => !p.rosterId && /^Joueur \d+$/.test((p.name || "").trim()));

// Nouveau compte : aucune équipe paramétrée, le coach crée la sienne
export const defaultTeams: TeamCategory[] = [];
