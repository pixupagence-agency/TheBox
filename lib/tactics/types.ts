// Tableau tactique : types partagés (pions, tracés, équipes, effectifs, profil du coach).
import type { Language } from "@/lib/i18n";

export interface Token {
  id: string;
  type: "player_a" | "player_b" | "referee" | "ball" | "cone" | "goal" | "hurdle" | "ladder" | "wall" | "link";
  /** Liaison (type « link ») : joueurs reliés dans l'ordre ; si le dernier = le premier, la forme est fermée */
  linkIds?: string[];
  /** Liaison : trait plein ou pointillé (la couleur est dans `color`) */
  linkStyle?: "solid" | "dashed";
  /** Mur (type « wall ») : nombre de places et équipe qui le forme */
  wallCount?: number;
  wallTeam?: "home" | "away";
  /** Mur : angle choisi (degrés, repère paysage) ; absent = le mur fait face au ballon */
  wallAngle?: number;
  /** Joueur placé dans le mur de son équipe (place 0 → wallCount - 1) : masqué du terrain, affiché dans le mur */
  wallSlot?: number;
  number?: number;
  name: string;
  role: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color?: string;
  photo?: string;
  status?: "excellent" | "tired" | "injured" | "normal" | "suspended" | "absent" | "red_card";
  removalReason?: string;
  yellowCards?: number;
  /** Joueur de l'effectif de l'équipe que ce pion représente (fiche partagée entre les matchs) */
  rosterId?: string;
  /** Ballon aimanté : joueur qui porte le ballon (le ballon suit ses déplacements) */
  ballCarrierId?: string;
  /** Ballon aimanté : décalage (repère logique, en %) du ballon par rapport au joueur porteur */
  ballOffsetX?: number;
  ballOffsetY?: number;
}

export interface DrawingAction {
  tool: "brush" | "arrow-direct" | "arrow-deep" | "arrow-run" | "shape-circle" | "shape-rect" | "shape-line" | "shape-dashed-line" | "curve-arrow" | "curve-arrow-dashed" | "eraser";
  color: string;
  size: number;
  points: { x: number; y: number }[]; // percentages 0-100
}

// 7 emplacements de rôles communs à tous les sports : leur sens dépend du sport (voir lib/sportRoles.ts).
// Ex. penaltyTaker = tireur de penalty (foot), buteur (rugby), lancers francs (basket), jet de 7 m (hand).
export interface SetPieceRoleConfig {
  captain: string;           // Capitaine (👑)
  penaltyTaker: string;      // Penalty (11m ⚽)
  directFreeKick: string;    // Coup Franc Direct (⚡)
  offCenterFKLeft: string;   // Coup Franc Excentré Gauche (↪️)
  offCenterFKRight: string;  // Coup Franc Excentré Droit (↩️)
  cornerLeft: string;        // Corner Gauche (🚩)
  cornerRight: string;       // Corner Droit (🚩)
}

export const defaultSetPieceRoles: SetPieceRoleConfig = {
  captain: "",
  penaltyTaker: "",
  directFreeKick: "",
  offCenterFKLeft: "",
  offCenterFKRight: "",
  cornerLeft: "",
  cornerRight: "",
};

export interface CoachProfile {
  id: string;
  lastName: string;
  firstName: string;
  club: string;
  role: string;
  preferredSport: string;
  email: string;
  isAdmin?: boolean;
  createdAt?: string;
  trialBonusDays?: number;
  language?: Language;
  /** Logo du club (data URL) : carte du match, rond central, exports image et PDF */
  clubLogo?: string;
  showLogoOnPitch?: boolean;
  /** Fin de l'essai fixée par le serveur (ISO) ; null = plus de droit à l'essai ; absent = statut inconnu */
  trialEndsAt?: string | null;
  /** Statut d'accès renvoyé par le serveur (lib/accountStatus.ts) */
  hasHadSubscription?: boolean;
  /** Compte sans accès : équipes, matchs, notes et schémas masqués (conservés en base) */
  dataHidden?: boolean;
  /** Suppression du compte programmée à cette date (fin de la période payée), ISO */
  deletionScheduledAt?: string | null;
}

export interface TeamCategory {
  id: string;
  name: string;
  category: string;
  color?: string;
  isDefault?: boolean;
  /** Format de jeu de l'équipe (football : "11" | "8" | "5" ; rugby : "15" | "7"). Absent = format standard. */
  format?: string;
}

export interface TeamRosterPlayer {
  id: string;
  name: string;
  role: string;
  number: number;
  /** « reserve » = À disposition : disponible mais hors du groupe du match */
  status?: "normal" | "excellent" | "tired" | "injured" | "suspended" | "absent" | "reserve";
  photo?: string;
  isStarter?: boolean;
}
