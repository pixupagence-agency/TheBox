// Mode Live déporté : modèle partagé entre l'app tactique (coach), le serveur (télécommande)
// et les pages publiques (suiveur, liste des matchs du club, résumé).
//
// Firestore :
//   liveMatches/{publicId}      document public (lecture seule pour tous) : infos, score, chrono, événements, compo
//   liveMatches/{publicId}/commands/{cmdId}
//                               actions saisies à la télécommande, en attente d'être appliquées par l'app tactique
//   liveEditorKeys/{publicId}   accès éditeur (télécommande) : privé, lu et écrit par le coach et le serveur
//   liveClubs/{slug}            page publique du club (QR général) : nom et logo

export type LiveStatus = "scheduled" | "live" | "halftime" | "finished";
export type LiveTeam = "home" | "away";
export type LiveEventType = "goal" | "assist" | "yellow" | "red" | "sub" | "note";

export interface LivePlayer {
  id: string;
  n?: number;
  name: string;
}

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  team: LiveTeam;
  /** Minute affichée, ex. « 23' » */
  time: string;
  period?: string;
  player: string;
  number?: number;
  assister?: string;
  note?: string;
  points?: number;
  icon?: string;
  subType?: string;
  /** Remplacement saisi à la télécommande : place sur le terrain (pour l'annulation) */
  outId?: string;
  /** Saisi à la télécommande */
  remote?: boolean;
}

/** Chrono partagé : temps écoulé (s) à l'arrêt + instant de reprise (ms) quand il tourne */
export interface LiveClock {
  elapsed: number;
  runningSince: number | null;
}

export interface LiveLineup {
  onPitch: LivePlayer[];
  bench: LivePlayer[];
}

export interface LiveMatchDoc {
  ownerUid: string;
  clubSlug: string;
  clubName: string;
  teamId: string;
  teamName: string;
  home: string;
  away: string;
  competition: string;
  date: string;
  time: string;
  dateTime: string;
  venue?: string;
  sport: string;
  periods: string[];
  periodSeconds: number;
  breakAfterIndex: number;
  status: LiveStatus;
  period: string;
  score: { home: number; away: number };
  clock: LiveClock;
  events: LiveEvent[];
  lineup: LiveLineup;
  /** Dernier signe de vie de l'app tactique (ms) */
  hostSeenAt?: number;
  createdAt: number;
  updatedAt: number;
  finishedAt?: number | null;
}

export interface LiveClubDoc {
  ownerUid: string;
  name: string;
  logo?: string;
  updatedAt: number;
}

export type LiveOp =
  | { kind: "start" }
  | { kind: "pause" }
  | { kind: "next" }
  | { kind: "goal"; team: LiveTeam; scorer?: LivePlayer; assister?: LivePlayer; points?: number; label?: string; icon?: string; subType?: string }
  | { kind: "card"; color: "yellow" | "red"; team: LiveTeam; player?: LivePlayer }
  | { kind: "sub"; outId: string; inId: string }
  | { kind: "note"; team: LiveTeam; text: string }
  | { kind: "undo"; eventId: string };

export interface LiveCommand {
  op: LiveOp;
  createdAt: number;
}

export const HALFTIME_PERIOD = "MI-TEMPS";
export const FINISHED_PERIOD = "FIN";

export const clockSeconds = (clock: LiveClock | undefined, now: number = Date.now()): number => {
  if (!clock) return 0;
  const running = clock.runningSince ? Math.max(0, (now - clock.runningSince) / 1000) : 0;
  return Math.floor((clock.elapsed || 0) + running);
};

export const formatClock = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/** Même convention que le mode Live du tableau tactique */
export const minuteLabel = (secs: number): string => `${Math.floor(secs / 60)}'`;

export const isBasket = (sport: string) => sport === "basketball";

export const periodLabel = (period: string, sport: string): string => {
  switch (period) {
    case "1MT": return "1re mi-temps";
    case "2MT": return "2e mi-temps";
    case "QT1": return "1er quart-temps";
    case "QT2": return "2e quart-temps";
    case "QT3": return "3e quart-temps";
    case "QT4": return "4e quart-temps";
    case HALFTIME_PERIOD: return isBasket(sport) ? "Pause" : "Mi-temps";
    case FINISHED_PERIOD: return "Terminé";
    default: return period;
  }
};

/** Enchaînement des périodes : jeu, pause après breakAfterIndex, jeu… puis FIN */
export const periodSequence = (doc: Pick<LiveMatchDoc, "periods" | "breakAfterIndex">): string[] => [
  ...doc.periods.slice(0, doc.breakAfterIndex + 1),
  HALFTIME_PERIOD,
  ...doc.periods.slice(doc.breakAfterIndex + 1),
  FINISHED_PERIOD,
];

export const nextPeriodOf = (doc: Pick<LiveMatchDoc, "periods" | "breakAfterIndex" | "period">): string => {
  const seq = periodSequence(doc);
  const idx = seq.indexOf(doc.period);
  return idx < 0 ? seq[0] : seq[Math.min(idx + 1, seq.length - 1)];
};

/** Libellé du bouton « période suivante » de la télécommande */
export const nextPeriodActionLabel = (doc: Pick<LiveMatchDoc, "periods" | "breakAfterIndex" | "period" | "sport">): string => {
  const next = nextPeriodOf(doc);
  if (next === FINISHED_PERIOD) return "Fin du match";
  if (next === HALFTIME_PERIOD) return isBasket(doc.sport) ? "Pause" : "Fin de la 1re MT";
  return `Reprise · ${periodLabel(next, doc.sport)}`;
};

export const statusFor = (period: string, clock: LiveClock, finished?: boolean): LiveStatus => {
  if (finished || period === FINISHED_PERIOD) return "finished";
  if (period === HALFTIME_PERIOD) return "halftime";
  if (clock.runningSince || (clock.elapsed || 0) > 0) return "live";
  return "scheduled";
};

const PUBLIC_ID_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomString = (length: number, alphabet: string): string => {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
};

export const newPublicId = () => randomString(10, PUBLIC_ID_ALPHABET);
export const newClubSlug = () => randomString(8, PUBLIC_ID_ALPHABET);
/** Jeton secret de la télécommande (lien / QR adjoint) */
export const newEditorToken = () => randomString(32, PUBLIC_ID_ALPHABET);
/** Code à saisir à la main sur la télécommande */
export const newEditorCode = () => randomString(6, CODE_ALPHABET);

export const normalizeCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const sha256Hex = async (text: string): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const playerLabel = (p?: LivePlayer, team: LiveTeam = "home"): string => {
  if (!p) return team === "home" ? "Joueur" : "Adversaire";
  if (team === "away") return p.name || (p.n ? `N° ${p.n}` : "Adversaire");
  return p.n ? `${p.n} ${p.name}` : p.name;
};

/**
 * Applique une action de la télécommande au document public (côté serveur).
 * L'app tactique applique ensuite la même action à son état local et republie le document.
 * Renvoie null si l'action n'a pas d'effet.
 */
export const applyLiveOp = (doc: LiveMatchDoc, op: LiveOp, cmdId: string, now: number): Partial<LiveMatchDoc> | null => {
  const clock: LiveClock = doc.clock || { elapsed: 0, runningSince: null };
  const secs = clockSeconds(clock, now);
  const eventId = `r_${cmdId}`;
  const base = { id: eventId, time: minuteLabel(secs), period: doc.period, remote: true };
  const pushEvent = (ev: LiveEvent, extra: Partial<LiveMatchDoc> = {}): Partial<LiveMatchDoc> => ({
    events: [ev, ...(doc.events || []).filter((e) => e.id !== ev.id)],
    ...extra,
  });

  switch (op.kind) {
    case "start": {
      if (doc.period === FINISHED_PERIOD) return null;
      if (doc.period === HALFTIME_PERIOD) {
        // Reprise : la période suivante commence à son début théorique
        const next = nextPeriodOf(doc);
        const idx = doc.periods.indexOf(next);
        const newClock = { elapsed: Math.max(idx, 0) * doc.periodSeconds, runningSince: now };
        return { period: next, clock: newClock, status: "live" };
      }
      if (clock.runningSince) return null;
      const newClock = { elapsed: clock.elapsed || 0, runningSince: now };
      return { clock: newClock, status: "live" };
    }
    case "pause": {
      if (!clock.runningSince) return null;
      return { clock: { elapsed: secs, runningSince: null } };
    }
    case "next": {
      const next = nextPeriodOf(doc);
      if (next === doc.period) return null;
      if (next === FINISHED_PERIOD) {
        return { period: next, clock: { elapsed: secs, runningSince: null }, status: "finished", finishedAt: now };
      }
      if (next === HALFTIME_PERIOD) {
        return { period: next, clock: { elapsed: secs, runningSince: null }, status: "halftime" };
      }
      const idx = doc.periods.indexOf(next);
      return { period: next, clock: { elapsed: Math.max(idx, 0) * doc.periodSeconds, runningSince: now }, status: "live" };
    }
    case "goal": {
      const pts = Math.max(1, Math.min(10, Math.round(op.points || 1)));
      const label = op.label || "But";
      const assist = op.team === "home" && op.assister ? op.assister.name : undefined;
      const ev: LiveEvent = {
        ...base,
        type: "goal",
        team: op.team,
        player: op.team === "home" ? op.scorer?.name || "Joueur" : op.scorer?.name || (op.scorer?.n ? `N° ${op.scorer.n}` : "Adversaire"),
        number: op.scorer?.n,
        assister: assist,
        points: pts,
        icon: op.icon,
        subType: op.subType,
        note: assist ? `${label} (+${pts} pts) • Passeur : ${assist}` : `${label} (+${pts} pts)`,
      };
      const score = { ...doc.score, [op.team]: (doc.score?.[op.team] || 0) + pts };
      return pushEvent(ev, { score });
    }
    case "card": {
      const ev: LiveEvent = {
        ...base,
        type: op.color,
        team: op.team,
        player: op.player?.name || (op.player?.n ? `N° ${op.player.n}` : op.team === "home" ? "Joueur" : "Adversaire"),
        number: op.player?.n,
        note: op.color === "yellow" ? "Carton Jaune 🟨" : "Carton Rouge 🟥",
      };
      return pushEvent(ev);
    }
    case "sub": {
      const lineup = doc.lineup || { onPitch: [], bench: [] };
      const out = lineup.onPitch.find((p) => p.id === op.outId);
      const inn = lineup.bench.find((p) => p.id === op.inId);
      if (!out || !inn) return null;
      // Même logique que le tableau tactique : la place sur le terrain garde son identifiant,
      // le sortant rejoint le banc avec l'identifiant de cette place
      const onPitch = lineup.onPitch.map((p) => (p.id === op.outId ? { id: op.outId, n: inn.n, name: inn.name } : p));
      const bench = [{ id: op.outId, n: out.n, name: out.name }, ...lineup.bench.filter((p) => p.id !== op.inId && p.id !== op.outId)];
      const ev: LiveEvent = {
        ...base,
        type: "sub",
        team: "home",
        player: `${out.name} ➔ ${inn.name}`,
        number: inn.n,
        note: "Remplacement 🔄",
        outId: op.outId,
      };
      return pushEvent(ev, { lineup: { onPitch, bench } });
    }
    case "note": {
      const text = op.text.trim().slice(0, 200);
      if (!text) return null;
      const ev: LiveEvent = { ...base, type: "note", team: op.team, player: text, note: text };
      return pushEvent(ev);
    }
    case "undo": {
      const target = (doc.events || []).find((e) => e.id === op.eventId);
      if (!target) return null;
      const patch: Partial<LiveMatchDoc> = { events: (doc.events || []).filter((e) => e.id !== op.eventId) };
      if (target.type === "goal") {
        const pts = target.points || 1;
        patch.score = { ...doc.score, [target.team]: Math.max(0, (doc.score?.[target.team] || 0) - pts) };
      }
      if (target.type === "sub" && target.outId) {
        // Remplacement inverse : le joueur sorti (sur le banc avec l'identifiant de la place) revient
        const lineup = doc.lineup || { onPitch: [], bench: [] };
        const onField = lineup.onPitch.find((p) => p.id === target.outId);
        const back = lineup.bench.find((p) => p.id === target.outId);
        if (onField && back) {
          patch.lineup = {
            onPitch: lineup.onPitch.map((p) => (p.id === target.outId ? { ...back } : p)),
            bench: [{ id: target.outId, n: onField.n, name: onField.name }, ...lineup.bench.filter((p) => p.id !== target.outId)],
          };
        }
      }
      return patch;
    }
    default:
      return null;
  }
};

/** Firestore refuse les valeurs undefined : on les retire avant écriture */
export const stripUndefined = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Validation légère d'une action reçue par l'API */
export const sanitizeOp = (raw: unknown): LiveOp | null => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const team: LiveTeam = o.team === "away" ? "away" : "home";
  const str = (v: unknown, max = 80) => (typeof v === "string" ? v.slice(0, max) : "");
  const player = (v: unknown): LivePlayer | undefined => {
    if (!v || typeof v !== "object") return undefined;
    const p = v as Record<string, unknown>;
    const n = typeof p.n === "number" && Number.isFinite(p.n) ? Math.round(p.n) : undefined;
    return { id: str(p.id, 80), n, name: str(p.name, 80) };
  };
  switch (o.kind) {
    case "start":
    case "pause":
    case "next":
      return { kind: o.kind };
    case "goal":
      return {
        kind: "goal",
        team,
        scorer: player(o.scorer),
        assister: player(o.assister),
        points: typeof o.points === "number" ? o.points : 1,
        label: str(o.label, 40) || undefined,
        icon: str(o.icon, 8) || undefined,
        subType: str(o.subType, 40) || undefined,
      };
    case "card":
      return { kind: "card", color: o.color === "red" ? "red" : "yellow", team, player: player(o.player) };
    case "sub":
      if (!str(o.outId) || !str(o.inId)) return null;
      return { kind: "sub", outId: str(o.outId), inId: str(o.inId) };
    case "note":
      return str(o.text, 200).trim() ? { kind: "note", team, text: str(o.text, 200) } : null;
    case "undo":
      return str(o.eventId) ? { kind: "undo", eventId: str(o.eventId) } : null;
    default:
      return null;
  }
};

/** Horodatage du coup d'envoi prévu (date AAAA-MM-JJ + heure HH:MM), ou null */
export const kickoffTime = (doc: Pick<LiveMatchDoc, "date" | "time">): number | null => {
  if (!doc.date || !/^\d{4}-\d{2}-\d{2}$/.test(doc.date)) return null;
  const t = /^\d{2}:\d{2}$/.test(doc.time || "") ? doc.time : "00:00";
  const ms = new Date(`${doc.date}T${t}:00`).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export const formatKickoff = (doc: Pick<LiveMatchDoc, "date" | "time" | "dateTime">): string => {
  const ms = kickoffTime(doc);
  if (!ms) return doc.dateTime || "Date à venir";
  const d = new Date(ms);
  const day = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return doc.time ? `${day} · ${doc.time.replace(":", "h")}` : day;
};
