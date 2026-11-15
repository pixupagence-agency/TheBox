// Rôles tactiques par sport (capitaine, buteurs, tireurs, organisateurs…).
// Les 7 emplacements d'enregistrement restent les mêmes pour tous les sports
// (clés historiques de SetPieceRoleConfig) : seuls le sens, les libellés et les badges changent.
// Ainsi les rôles déjà attribués et enregistrés par match ne sont jamais perdus.

export type SetPieceRoleKey =
  | "captain"
  | "penaltyTaker"
  | "directFreeKick"
  | "offCenterFKLeft"
  | "offCenterFKRight"
  | "cornerLeft"
  | "cornerRight";

export type RoleIconName = "crown" | "target" | "zap" | "left" | "right" | "flag" | "users" | "shield" | "circle";
export type RoleTone = "gold" | "green" | "cyan" | "rose";

export interface SportRoleDef {
  key: SetPieceRoleKey;
  /** Libellé dans la fenêtre des rôles */
  label: string;
  /** Pastille courte à côté du libellé */
  badge: string;
  /** Code affiché à côté du joueur sur le terrain */
  code: string;
  icon: RoleIconName;
  tone: RoleTone;
  /** Attribution rapide : postes préférés (par ordre), puis numéros de maillot préférés */
  prefer: { roles?: string[]; numbers?: number[] };
}

export interface SportRolesConfig {
  /** Onglet de la fenêtre */
  tabLabel: string;
  title: string;
  description: string;
  roles: SportRoleDef[];
  /** Codes fusionnés quand un même joueur tient deux rôles (ex. corners des deux côtés) */
  merges?: { keys: [SetPieceRoleKey, SetPieceRoleKey]; code: string }[];
}

const CAPTAIN = (prefer: SportRoleDef["prefer"]): SportRoleDef => ({
  key: "captain", label: "Capitaine", badge: "Brassard", code: "C", icon: "crown", tone: "gold", prefer,
});

const SPORT_ROLES: Record<string, SportRolesConfig> = {
  football: {
    tabLabel: "Coups arrêtés",
    title: "Coups de pied arrêtés",
    description: "Désignez le capitaine et les tireurs pour chaque phase arrêtée.",
    roles: [
      CAPTAIN({ roles: ["MC", "MDC", "MOC", "DC"], numbers: [10, 4, 6] }),
      { key: "penaltyTaker", label: "Tireur de penalty", badge: "11 m", code: "PK", icon: "circle", tone: "green", prefer: { roles: ["BU", "AC"], numbers: [9, 10] } },
      { key: "directFreeKick", label: "Coup franc direct", badge: "Axe", code: "CF", icon: "zap", tone: "cyan", prefer: { roles: ["MOC", "MC"], numbers: [10, 8] } },
      { key: "offCenterFKLeft", label: "Coup franc excentré gauche", badge: "Gauche", code: "CF-G", icon: "left", tone: "cyan", prefer: { roles: ["AiG", "MG"], numbers: [11] } },
      { key: "offCenterFKRight", label: "Coup franc excentré droit", badge: "Droite", code: "CF-D", icon: "right", tone: "cyan", prefer: { roles: ["AiD", "MD"], numbers: [7] } },
      { key: "cornerLeft", label: "Corner gauche", badge: "Gauche", code: "CK-G", icon: "flag", tone: "rose", prefer: { roles: ["AiG", "MG"], numbers: [11] } },
      { key: "cornerRight", label: "Corner droit", badge: "Droite", code: "CK-D", icon: "flag", tone: "rose", prefer: { roles: ["AiD", "MD"], numbers: [7] } },
    ],
    merges: [{ keys: ["cornerLeft", "cornerRight"], code: "CK-2" }],
  },
  rugby: {
    tabLabel: "Rôles clés",
    title: "Rôles clés & jeu au pied",
    description: "Désignez le capitaine, le buteur, l'ouvreur et les spécialistes des phases de conquête.",
    roles: [
      CAPTAIN({ roles: ["3L", "2L", "N8", "TAL"], numbers: [7, 8, 2] }),
      { key: "penaltyTaker", label: "Buteur (pénalités & transformations)", badge: "Buteur", code: "BUT", icon: "target", tone: "green", prefer: { roles: ["OUV", "ARR"], numbers: [10, 15] } },
      { key: "directFreeKick", label: "Ouvreur (stratège du jeu au pied)", badge: "N°10", code: "OUV", icon: "zap", tone: "cyan", prefer: { roles: ["OUV"], numbers: [10] } },
      { key: "offCenterFKLeft", label: "Botteur des coups d'envoi & renvois", badge: "Renvois", code: "REN", icon: "right", tone: "cyan", prefer: { roles: ["OUV", "ARR", "CEN"], numbers: [10, 15, 12] } },
      { key: "offCenterFKRight", label: "Lanceur en touche", badge: "Touche", code: "LAN", icon: "left", tone: "rose", prefer: { roles: ["TAL"], numbers: [2] } },
      { key: "cornerLeft", label: "Sauteur principal en touche", badge: "Alignement", code: "SAU", icon: "users", tone: "rose", prefer: { roles: ["2L", "3L"], numbers: [5, 4, 6] } },
      { key: "cornerRight", label: "Introduction en mêlée", badge: "Mêlée", code: "MEL", icon: "shield", tone: "rose", prefer: { roles: ["DM"], numbers: [9] } },
    ],
  },
  basketball: {
    tabLabel: "Rôles clés",
    title: "Rôles clés & remises en jeu",
    description: "Désignez le capitaine, le meneur et les spécialistes des lancers francs et remises en jeu.",
    roles: [
      CAPTAIN({ roles: ["PG", "SF"], numbers: [4, 5] }),
      { key: "penaltyTaker", label: "Tireur de lancers francs (fautes techniques)", badge: "LF", code: "LF", icon: "target", tone: "green", prefer: { roles: ["SG", "PG"], numbers: [7, 4] } },
      { key: "directFreeKick", label: "Meneur (annonce des systèmes)", badge: "Meneur", code: "MEN", icon: "zap", tone: "cyan", prefer: { roles: ["PG"], numbers: [4] } },
      { key: "offCenterFKLeft", label: "Remise en jeu ligne de fond", badge: "Fond", code: "RJ-F", icon: "right", tone: "cyan", prefer: { roles: ["SF", "SG"], numbers: [6, 7] } },
      { key: "offCenterFKRight", label: "Remise en jeu latérale", badge: "Côté", code: "RJ-C", icon: "left", tone: "cyan", prefer: { roles: ["SG", "SF"], numbers: [7, 6] } },
      { key: "cornerLeft", label: "Shooteur à 3 points (dernière possession)", badge: "3 pts", code: "3PT", icon: "circle", tone: "rose", prefer: { roles: ["SG", "SF"], numbers: [7, 6] } },
      { key: "cornerRight", label: "Joueur de l'entre-deux", badge: "Entre-deux", code: "E2", icon: "users", tone: "rose", prefer: { roles: ["C", "PF"], numbers: [8, 5] } },
    ],
  },
  handball: {
    tabLabel: "Rôles clés",
    title: "Rôles clés & jets",
    description: "Désignez le capitaine, le tireur de 7 m, le demi-centre et les spécialistes des jets francs et de la contre-attaque.",
    roles: [
      CAPTAIN({ roles: ["DC", "ARG", "ARD", "PV"], numbers: [6, 4] }),
      { key: "penaltyTaker", label: "Tireur de jet de 7 m", badge: "7 m", code: "7M", icon: "target", tone: "green", prefer: { roles: ["ALG", "ALD", "ARD"], numbers: [5, 3] } },
      { key: "directFreeKick", label: "Tireur de jet franc (9 m)", badge: "9 m", code: "JF", icon: "zap", tone: "cyan", prefer: { roles: ["ARG", "ARD"], numbers: [4, 2] } },
      { key: "offCenterFKLeft", label: "Demi-centre (organisation du jeu)", badge: "Demi-centre", code: "DC", icon: "users", tone: "cyan", prefer: { roles: ["DC"], numbers: [6] } },
      { key: "offCenterFKRight", label: "Engagement après but", badge: "Engagement", code: "ENG", icon: "right", tone: "cyan", prefer: { roles: ["DC", "PV"], numbers: [6, 7] } },
      { key: "cornerLeft", label: "Contre-attaque gauche", badge: "Gauche", code: "CA-G", icon: "left", tone: "rose", prefer: { roles: ["ALG"], numbers: [5] } },
      { key: "cornerRight", label: "Contre-attaque droite", badge: "Droite", code: "CA-D", icon: "right", tone: "rose", prefer: { roles: ["ALD"], numbers: [3] } },
    ],
  },
};

export const getSportRoles = (sport: string): SportRolesConfig => SPORT_ROLES[sport] || SPORT_ROLES.football;

/** Codes à afficher à côté d'un joueur sur le terrain (hors capitaine, affiché à part) */
export const getPlayerRoleCodes = (
  sport: string,
  roles: Record<SetPieceRoleKey, string>,
  playerName: string
): { code: string; label: string; tone: RoleTone }[] => {
  if (!playerName) return [];
  const config = getSportRoles(sport);
  const held = config.roles.filter((r) => r.key !== "captain" && roles[r.key] === playerName);
  const out: { code: string; label: string; tone: RoleTone }[] = [];
  const used = new Set<SetPieceRoleKey>();
  for (const merge of config.merges || []) {
    if (merge.keys.every((k) => held.some((r) => r.key === k))) {
      const first = held.find((r) => r.key === merge.keys[0])!;
      out.push({ code: merge.code, label: merge.keys.map((k) => held.find((r) => r.key === k)!.label).join(" & "), tone: first.tone });
      merge.keys.forEach((k) => used.add(k));
    }
  }
  for (const r of held) if (!used.has(r.key)) out.push({ code: r.code, label: r.label, tone: r.tone });
  return out;
};

/** Attribution rapide : chaque rôle va au joueur dont le poste ou le numéro correspond le mieux */
export const autoAssignSportRoles = (
  sport: string,
  players: { name: string; number?: number; role?: string }[]
): Record<SetPieceRoleKey, string> => {
  const config = getSportRoles(sport);
  const named = players.filter((p) => p.name);
  const result = {} as Record<SetPieceRoleKey, string>;
  for (const def of config.roles) {
    let pick: { name: string } | undefined;
    for (const role of def.prefer.roles || []) {
      pick = named.find((p) => (p.role || "").toUpperCase() === role.toUpperCase());
      if (pick) break;
    }
    if (!pick) {
      for (const num of def.prefer.numbers || []) {
        pick = named.find((p) => p.number === num);
        if (pick) break;
      }
    }
    result[def.key] = (pick || named[0])?.name || "";
  }
  return result;
};
