// Module Convocations (route /convocations) : lecture des données du tableau tactique enregistrées sur l'appareil
// (équipes, effectifs, matchs, thème) — restaurées depuis le compte — et contrôle d'accès PRO à partir du profil du coach.
import { calculateTrialRemaining } from "@/components/TrialCountdownModal";
import type { RosterPlayerLike } from "./model";
import type { ConvocationMatchLike } from "@/components/convocations/ConvocationsModule";

export interface ConvocationsWorkspace {
  teams: { id: string; name: string; category?: string }[];
  rosters: Record<string, RosterPlayerLike[]>;
  matches: ConvocationMatchLike[];
  activeTeamId: string;
  isModernSleek: boolean;
}

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
};

interface LocalCoach {
  id: string;
  activePlan?: string;
  isAdmin?: boolean;
  role?: string;
  dataHidden?: boolean;
  hasHadSubscription?: boolean;
  createdAt?: string;
  trialBonusDays?: number;
  trialEndsAt?: string | null;
}

const coachOf = (uid: string): LocalCoach | null => {
  const coaches = readJson<LocalCoach[]>("thebox_coaches", []);
  return Array.isArray(coaches) ? coaches.find((c) => c?.id === uid) || null : null;
};

/**
 * Accès au module, d'après le profil enregistré sur l'appareil par le tableau tactique :
 *  - "pro"     : formule payante, essai en cours ou administrateur ;
 *  - "free"    : formule gratuite (ou compte sans accès) ;
 *  - "unknown" : profil absent de l'appareil (le tableau tactique n'y a jamais été ouvert avec ce compte).
 */
export function readConvocationsAccess(uid: string): "pro" | "free" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const coach = coachOf(uid);
  if (!coach) return "unknown";
  if (coach.isAdmin || coach.role === "Super Admin") return "pro";
  const plan = String(coach.activePlan || "free").toLowerCase();
  if (plan !== "free" && plan !== "gratuit") return "pro";
  if (coach.hasHadSubscription) return "free";
  const trial = calculateTrialRemaining(coach.createdAt, coach.trialBonusDays || 0, coach.trialEndsAt);
  return trial.isExpired ? "free" : "pro";
}

export function readConvocationsWorkspace(): ConvocationsWorkspace {
  const teamsRaw = readJson<unknown[]>("thebox_teams", []);
  const teams = (Array.isArray(teamsRaw) ? teamsRaw : [])
    .filter((t): t is { id: string; name: string; category?: string } =>
      Boolean(t && typeof (t as { id?: unknown }).id === "string" && typeof (t as { name?: unknown }).name === "string"))
    .map((t) => ({ id: t.id, name: t.name, category: t.category }));

  const rostersRaw = readJson<Record<string, unknown>>("thebox_team_rosters", {});
  const rosters: Record<string, RosterPlayerLike[]> = {};
  for (const team of teams) {
    const source = rostersRaw?.[team.id];
    const players = Array.isArray(source) ? (source as Record<string, unknown>[]) : [];
    rosters[team.id] = players
      .filter((p) => p && typeof p.name === "string" && p.id != null)
      .map((p) => ({
        id: String(p.id),
        name: String(p.name),
        number: Number(p.number) || undefined,
        role: typeof p.role === "string" ? p.role : undefined,
        status: typeof p.status === "string" ? p.status : undefined,
      }));
  }

  const matchesRaw = readJson<unknown[]>("thebox_matches_list", []);
  const matches = (Array.isArray(matchesRaw) ? matchesRaw : []).filter(
    (m): m is ConvocationMatchLike => Boolean(m && typeof (m as { id?: unknown }).id === "string")
  );

  const activeTeamId = localStorage.getItem("thebox_active_team_id") || teams[0]?.id || "";
  const isModernSleek = localStorage.getItem("thebox_modern_sleek") === "true";

  return { teams, rosters, matches, activeTeamId, isModernSleek };
}
