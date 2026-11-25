// Mode Live : données des joueurs rendues publiques (RGPD, joueurs souvent mineurs).
// Le tableau tactique garde les noms complets ; seul ce qui est publié (page du match, page du club,
// télécommande) passe par ces fonctions : les joueurs y apparaissent en « Prénom I. ».
import { stripUndefined, type LiveEvent, type LiveLineup, type LiveMatchDoc, type LivePlayer } from "@/lib/live/model";

/**
 * Résumé d'un match pour l'index de la page du club (liveClubs/{slug}/matches/{publicId}) :
 * sans composition, réactions ni identifiant du coach.
 */
export function clubMatchSummary(data: Partial<LiveMatchDoc>): Partial<LiveMatchDoc> {
  const { ownerUid: _o, lineup: _l, reactions: _r, hostSeenAt: _h, ...summary } = data;
  return stripUndefined(summary);
}

/** Libellés génériques laissés tels quels (aucune donnée personnelle) */
const GENERIC = /^(?:(?:joueur|adversaire|csc|remplaçant)\b|n°)/i;

/**
 * « Lucas Martin » → « Lucas M. » ; « Jean-Pierre Dupont Durand » → « Jean-Pierre D. ».
 * Un seul mot, un libellé générique ou un nom déjà abrégé sont conservés.
 */
export function publicPlayerName(name: string | undefined | null): string {
  const clean = String(name || "").replace(/\s+/g, " ").trim();
  if (!clean || GENERIC.test(clean)) return clean;
  const parts = clean.split(" ");
  if (parts.length < 2) return clean;
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (/^\p{L}\.$/u.test(last)) return `${first} ${last}`; // déjà « Prénom I. »
  const initial = last.match(/\p{L}/u)?.[0];
  return initial ? `${first} ${initial.toUpperCase()}.` : first;
}

/** Remplace dans un texte libre les noms complets connus par leur forme publique */
function maskKnownNames(text: string | undefined, known: Map<string, string>): string | undefined {
  if (!text) return text;
  let out = text;
  // Les noms les plus longs d'abord (« Lucas Martin » avant « Lucas »)
  for (const [full, pub] of [...known.entries()].sort((a, b) => b[0].length - a[0].length)) {
    if (full !== pub && full.includes(" ")) out = out.split(full).join(pub);
  }
  return out;
}

const publicPlayer = (p: LivePlayer): LivePlayer => ({ ...p, name: publicPlayerName(p.name) });

/** Composition et faits de match tels qu'ils doivent être publiés */
export function toPublicLive<T extends { lineup?: LiveLineup; events?: LiveEvent[] }>(state: T): T {
  const known = new Map<string, string>();
  const remember = (name?: string) => {
    const n = String(name || "").replace(/\s+/g, " ").trim();
    if (n) known.set(n, publicPlayerName(n));
  };
  const isSwap = (e: LiveEvent) => e.type === "sub" && e.player.includes(" ➔ ");

  // 1. Noms connus : composition, puis joueurs cités dans les faits de match (adversaires compris)
  state.lineup?.onPitch.forEach((p) => remember(p.name));
  state.lineup?.bench.forEach((p) => remember(p.name));
  state.events?.forEach((e) => {
    if (isSwap(e)) e.player.split(" ➔ ").forEach(remember);
    else if (e.type !== "note") remember(e.player);
    if (e.assister) remember(e.assister);
  });

  // 2. Faits de match publiés : noms abrégés ; textes libres (notes) : noms connus masqués
  const events = state.events?.map((e) => ({
    ...e,
    player: e.type === "note"
      ? maskKnownNames(e.player, known) || ""
      : isSwap(e)
        ? e.player.split(" ➔ ").map(publicPlayerName).join(" ➔ ")
        : publicPlayerName(e.player),
    ...(e.assister ? { assister: publicPlayerName(e.assister) } : {}),
    ...(e.note ? { note: maskKnownNames(e.note, known) } : {}),
  }));

  return {
    ...state,
    ...(state.lineup ? { lineup: { onPitch: state.lineup.onPitch.map(publicPlayer), bench: state.lineup.bench.map(publicPlayer) } } : {}),
    ...(events ? { events } : {}),
  };
}
