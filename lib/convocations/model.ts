// Module Convocations : modèle de données (sans dépendance à l'interface ni à Firebase).
//
// Une convocation concerne un MATCH ou un ENTRAÎNEMENT d'une équipe. Elle liste les joueurs convoqués
// et, pour chacun :
//   - sa RÉPONSE à la convocation (présent / incertain / absent / sans réponse). Pour l'instant le coach
//     la saisit lui-même (réponse donnée de vive voix) ; l'application mobile joueurs / parents viendra
//     ensuite écrire ces réponses ;
//   - pour un entraînement, sa PRÉSENCE RÉELLE, validée par le coach (présent / retard / excusé / absent).
//
// Les convocations sont enregistrées dans le localStorage (clé CONVOCATIONS_KEY), synchronisée en ligne
// par lib/cloudSync.ts comme les équipes et les matchs.

export const CONVOCATIONS_KEY = "thebox_convocations";

export type ConvocationKind = "match" | "training";
export type ConvocationResponse = "pending" | "present" | "maybe" | "absent";
export type AttendanceStatus = "present" | "late" | "excused" | "absent";
export type ResponseSource = "coach" | "player" | "parent";

export interface ConvocationPlayer {
  /** Identifiant du joueur dans l'effectif de l'équipe */
  playerId: string;
  /** Nom et numéro au moment de la convocation (le joueur peut ensuite quitter l'effectif) */
  name: string;
  number?: number;
  response: ConvocationResponse;
  /** Précision donnée avec la réponse (blessure, école…) */
  note?: string;
  respondedBy?: ResponseSource;
  /** Date de la réponse (ISO) */
  respondedAt?: string;
  /** Entraînement : présence réelle relevée par le coach */
  attendance?: AttendanceStatus;
  /** Joueur ajouté le jour de la séance sans avoir été convoqué */
  addedOnSite?: boolean;
}

export interface Convocation {
  id: string;
  kind: ConvocationKind;
  teamId: string;
  /** Date de l'événement, AAAA-MM-JJ */
  date: string;
  /** Coup d'envoi (match) ou début de séance (entraînement), HH:MM */
  startTime?: string;
  /** Fin de séance (entraînement), HH:MM */
  endTime?: string;
  /** Heure de rendez-vous, HH:MM */
  meetTime?: string;
  place?: string;
  /** Mot du coach */
  message?: string;
  /** Date limite de réponse (AAAA-MM-JJTHH:MM) */
  deadline?: string;

  // --- Match ---
  /** Match du tableau tactique associé (pré-remplissage, lien vers le match) */
  matchId?: string;
  opponent?: string;
  isHome?: boolean;
  competition?: string;

  // --- Entraînement ---
  /** Titre de la séance (« Entraînement », « Séance vitesse »…) */
  title?: string;
  /** Thème / objectif de la séance */
  theme?: string;
  /** Feuille de présence validée par le coach (ISO) ; absent = à valider */
  attendanceValidatedAt?: string;

  players: ConvocationPlayer[];
  createdAt: string;
  updatedAt: string;
}

/** Joueur de l'effectif, tel que fourni par le tableau tactique */
export interface RosterPlayerLike {
  id: string;
  name: string;
  number?: number;
  role?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Libellés
// ---------------------------------------------------------------------------

export const RESPONSE_LABELS: Record<ConvocationResponse, string> = {
  pending: "Sans réponse",
  present: "Présent",
  maybe: "Incertain",
  absent: "Absent",
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Présent",
  late: "En retard",
  excused: "Absent excusé",
  absent: "Absent",
};

export const ATTENDANCE_SHORT: Record<AttendanceStatus, string> = {
  present: "Présent",
  late: "Retard",
  excused: "Excusé",
  absent: "Absent",
};

/** Joueur indisponible dans l'effectif (non convoqué par défaut) */
export const isUnavailableRosterStatus = (status?: string) =>
  status === "absent" || status === "suspended" || status === "injured";

export const ROSTER_STATUS_LABELS: Record<string, string> = {
  absent: "Absent",
  suspended: "Suspendu",
  injured: "Blessé",
  reserve: "À disposition",
};

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

/** Date du jour (heure locale), AAAA-MM-JJ */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const isValidIsoDate = (value?: string): value is string =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(`${value}T00:00:00`).getTime());

export const isValidTime = (value?: string): value is string => !!value && /^\d{2}:\d{2}$/.test(value);

/** Convocation à venir (aujourd'hui compris) */
export const isUpcoming = (c: Convocation, today: string = todayIso()) => c.date >= today;

/** Parties de la date pour le pavé de date des listes (« SAM. », « 28 », « NOV. ») */
export function dateBlock(date: string): { weekday: string; day: string; month: string } {
  if (!isValidIsoDate(date)) return { weekday: "", day: "?", month: "" };
  const d = new Date(`${date}T00:00:00`);
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
    day: String(d.getDate()),
    month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
  };
}

/** Date longue (« samedi 28 novembre 2026 ») */
export function longDate(date: string): string {
  if (!isValidIsoDate(date)) return "Date à définir";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Date et heure d'une date limite (« jeu. 26 nov. · 20:00 ») */
export function formatDeadline(deadline?: string): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  if (!Number.isFinite(d.getTime())) return "";
  const day = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

/** Date limite dépassée */
export const isDeadlinePassed = (c: Convocation, now: Date = new Date()) => {
  if (!c.deadline) return false;
  const d = new Date(c.deadline);
  return Number.isFinite(d.getTime()) && d.getTime() < now.getTime();
};

// ---------------------------------------------------------------------------
// Calculs
// ---------------------------------------------------------------------------

export interface ResponseCounts {
  present: number;
  maybe: number;
  absent: number;
  pending: number;
  total: number;
}

/** Réponses des joueurs convoqués (les joueurs ajoutés sur place ne comptent pas) */
export function responseCounts(c: Convocation): ResponseCounts {
  const counts: ResponseCounts = { present: 0, maybe: 0, absent: 0, pending: 0, total: 0 };
  for (const p of c.players) {
    if (p.addedOnSite) continue;
    counts[p.response] += 1;
    counts.total += 1;
  }
  return counts;
}

export interface AttendanceCounts {
  present: number;
  late: number;
  excused: number;
  absent: number;
  unset: number;
  total: number;
}

export function attendanceCounts(c: Convocation): AttendanceCounts {
  const counts: AttendanceCounts = { present: 0, late: 0, excused: 0, absent: 0, unset: 0, total: 0 };
  for (const p of c.players) {
    if (p.attendance) counts[p.attendance] += 1;
    else counts.unset += 1;
    counts.total += 1;
  }
  return counts;
}

/** Présence proposée d'après la réponse, tant que le coach ne l'a pas relevée */
export function suggestedAttendance(p: ConvocationPlayer): AttendanceStatus | undefined {
  if (p.attendance) return p.attendance;
  if (p.response === "absent") return "excused";
  if (p.response === "present") return "present";
  return undefined;
}

/** Entraînement passé (ou du jour) dont la feuille de présence reste à valider */
export const needsAttendance = (c: Convocation, today: string = todayIso()) =>
  c.kind === "training" && !c.attendanceValidatedAt && c.date <= today;

/** Titre affiché d'une convocation */
export function convocationTitle(c: Convocation, teamName?: string): string {
  if (c.kind === "training") return c.title?.trim() || "Entraînement";
  const opponent = c.opponent?.trim() || "Adversaire";
  const team = teamName?.trim() || "Mon équipe";
  return c.isHome === false ? `${opponent} vs ${team}` : `${team} vs ${opponent}`;
}

/** Tri : à venir du plus proche au plus lointain, passées de la plus récente à la plus ancienne */
export function sortConvocations(list: Convocation[], upcoming: boolean): Convocation[] {
  const key = (c: Convocation) => `${c.date}T${c.startTime || "00:00"}`;
  return [...list].sort((a, b) => (upcoming ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a))));
}

/**
 * Taux de présence d'un joueur sur les entraînements validés d'une équipe
 * (présent ou en retard / séances où il était convoqué ou présent).
 */
export function playerAttendanceRate(list: Convocation[], teamId: string, playerId: string): { attended: number; sessions: number } {
  let attended = 0;
  let sessions = 0;
  for (const c of list) {
    if (c.kind !== "training" || c.teamId !== teamId || !c.attendanceValidatedAt) continue;
    const p = c.players.find((x) => x.playerId === playerId);
    if (!p || !p.attendance) continue;
    sessions += 1;
    if (p.attendance === "present" || p.attendance === "late") attended += 1;
  }
  return { attended, sessions };
}

// ---------------------------------------------------------------------------
// Création / modification
// ---------------------------------------------------------------------------

export const newConvocationId = () => `conv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** Fiche d'un joueur convoqué, à partir de l'effectif */
export const toConvocationPlayer = (p: RosterPlayerLike): ConvocationPlayer => ({
  playerId: p.id,
  name: p.name,
  ...(typeof p.number === "number" && Number.isFinite(p.number) ? { number: p.number } : {}),
  response: "pending",
});

/**
 * Nouvelle liste de convoqués après modification de la sélection :
 * les joueurs gardés conservent leur réponse et leur présence, les nouveaux sont « sans réponse ».
 * Les joueurs ajoutés sur place sont conservés.
 */
export function mergeSelection(
  previous: ConvocationPlayer[],
  selectedIds: string[],
  roster: RosterPlayerLike[]
): ConvocationPlayer[] {
  const byId = new Map(previous.map((p) => [p.playerId, p]));
  const rosterById = new Map(roster.map((p) => [p.id, p]));
  const next: ConvocationPlayer[] = [];
  for (const id of selectedIds) {
    const existing = byId.get(id);
    const rosterPlayer = rosterById.get(id);
    if (existing) {
      next.push({
        ...existing,
        addedOnSite: undefined,
        name: rosterPlayer?.name ?? existing.name,
        number: rosterPlayer?.number ?? existing.number,
      });
    } else if (rosterPlayer) {
      next.push(toConvocationPlayer(rosterPlayer));
    }
  }
  for (const p of previous) {
    if (p.addedOnSite && !selectedIds.includes(p.playerId)) next.push(p);
  }
  return sortPlayers(next);
}

/** Joueurs triés par numéro, puis par nom */
export function sortPlayers<T extends { number?: number; name: string }>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    const na = typeof a.number === "number" ? a.number : 999;
    const nb = typeof b.number === "number" ? b.number : 999;
    return na - nb || a.name.localeCompare(b.name);
  });
}

/** Lecture tolérante d'une liste enregistrée (données anciennes ou partielles ignorées) */
export function parseConvocations(raw: string | null): Convocation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Convocation =>
        !!c &&
        typeof c.id === "string" &&
        (c.kind === "match" || c.kind === "training") &&
        typeof c.teamId === "string" &&
        typeof c.date === "string" &&
        Array.isArray(c.players)
    );
  } catch {
    return [];
  }
}
