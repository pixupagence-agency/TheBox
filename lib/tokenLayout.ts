// Placement des joueurs sur le tableau tactique : regroupement dans un camp et écartement des jetons
// qui se chevauchent (pastille, buste ou tête + nom affiché dessous).
// Coordonnées en pourcentage du terrain : x le long de la longueur, y le long de la largeur.

export interface PlacedToken {
  id: string;
  x: number;
  y: number;
}

export interface SpreadOptions {
  /** Rapport longueur / largeur du terrain en paysage (ex. 1,5 au foot à 11) */
  ratio: number;
  /** Tableau affiché en portrait (le terrain est tourné d'un quart de tour) */
  portrait?: boolean;
}

const BOUNDS = { xMin: 4, xMax: 96, yMin: 8, yMax: 92 };

/**
 * Encombrement d'un jeton, en pourcentage du terrain sur chaque axe.
 * Le nom affiché sous le jeton rend l'encombrement plus haut que large à l'écran.
 */
function footprint({ ratio, portrait }: SpreadOptions) {
  if (portrait) {
    // x est vertical à l'écran, y horizontal
    return { fx: 5.6 * 1.35, fy: 5.6 * ratio };
  }
  return { fx: 5.2, fy: 5.2 * ratio * 1.35 };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Écarte les jetons qui se chevauchent. Seuls les jetons de `movableIds` bougent ;
 * les autres servent d'obstacles fixes. Les déplacements sont les plus petits possibles
 * (on pousse sur l'axe où le chevauchement est le plus faible).
 */
export function spreadTokens<T extends PlacedToken>(tokens: T[], movableIds: Set<string>, options: SpreadOptions): T[] {
  const { fx, fy } = footprint(options);
  const pts = tokens.map((t) => ({ ...t }));
  for (let iter = 0; iter < 40; iter++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const ma = movableIds.has(a.id), mb = movableIds.has(b.id);
        if (!ma && !mb) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const px = fx - Math.abs(dx), py = fy - Math.abs(dy);
        if (px <= 0 || py <= 0) continue;
        moved = true;
        // Axe de poussée : celui où il faut bouger le moins (en proportion de l'encombrement)
        const alongX = px / fx < py / fy;
        const amount = (alongX ? px : py) + 0.2;
        const sign = (alongX ? dx : dy) !== 0 ? Math.sign(alongX ? dx : dy) : (a.id < b.id ? 1 : -1);
        const share = ma && mb ? 0.5 : 1;
        const shift = (p: typeof a, dir: number) => {
          if (alongX) p.x = clamp(p.x + dir * amount * share, BOUNDS.xMin, BOUNDS.xMax);
          else p.y = clamp(p.y + dir * amount * share, BOUNDS.yMin, BOUNDS.yMax);
        };
        if (ma) shift(a, -sign);
        if (mb) shift(b, sign);
      }
    }
    if (!moved) break;
  }
  return pts.map((p) => ({ ...p, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }));
}

/**
 * Regroupe une équipe dans son camp en conservant la forme de son placement :
 * l'étendue des positions sur la longueur est ramenée entre le but et la ligne médiane,
 * les positions sur la largeur sont conservées.
 */
export function regroupInCamp<T extends PlacedToken>(team: T[], side: "left" | "right"): T[] {
  if (team.length === 0) return team;
  const xs = team.map((t) => t.x);
  const deep = side === "left" ? Math.min(...xs) : Math.max(...xs);
  const high = side === "left" ? Math.max(...xs) : Math.min(...xs);
  const span = Math.abs(high - deep);
  // Camp gauche : du gardien (x ≈ 8) jusqu'à la ligne médiane (x ≈ 44) ; camp droit en miroir
  const from = side === "left" ? 8 : 92;
  const to = side === "left" ? 44 : 56;
  return team.map((t) => {
    const k = span < 1 ? 0.5 : Math.abs(t.x - deep) / span;
    return { ...t, x: Math.round((from + (to - from) * k) * 10) / 10, y: clamp(t.y, BOUNDS.yMin, BOUNDS.yMax) };
  });
}
