// Application d'un schéma prédéfini : chaque joueur va sur la place qui correspond à son POSTE,
// quelle que soit sa position actuelle sur le terrain (un AC retrouve la pointe de l'attaque, un DG le côté gauche…).
//
// Football : chaque poste a une place de référence (repère du schéma : 0 = son but, 100 = but adverse ; y = 20 côté
// gauche, 80 côté droit). Les joueurs sont répartis sur les places du schéma par affectation optimale (méthode
// hongroise) en minimisant l'écart entre la place de référence de leur poste et la place du schéma.
// Les joueurs d'un même poste (deux DC…) sont départagés par numéro de maillot : le résultat ne dépend jamais
// des déplacements faits avant. Autres sports : le numéro de maillot correspond au poste, on suit donc les numéros.

export interface AssignablePlayer {
  role?: string;
  number?: number;
}

type Spot = { x: number; y: number };

/** Place de référence des postes du football (toutes variantes de codes rencontrées dans l'application) */
const FOOTBALL_ROLE_SPOTS: Record<string, Spot> = {
  G: { x: 8, y: 50 }, GB: { x: 8, y: 50 }, GK: { x: 8, y: 50 }, GARDIEN: { x: 8, y: 50 },
  DC: { x: 24, y: 50 }, DCG: { x: 24, y: 38 }, DCD: { x: 24, y: 62 }, LIB: { x: 22, y: 50 }, FIX: { x: 26, y: 50 },
  DG: { x: 28, y: 18 }, LG: { x: 28, y: 18 }, PG: { x: 38, y: 18 },
  DD: { x: 28, y: 82 }, LD: { x: 28, y: 82 }, PD: { x: 38, y: 82 },
  MDC: { x: 36, y: 50 }, MC: { x: 50, y: 50 }, MOC: { x: 60, y: 50 }, MO: { x: 60, y: 50 },
  MG: { x: 50, y: 18 }, MD: { x: 50, y: 82 },
  AIG: { x: 70, y: 18 }, AG: { x: 70, y: 18 },
  AID: { x: 70, y: 82 }, AD: { x: 70, y: 82 },
  SA: { x: 70, y: 50 }, SS: { x: 70, y: 50 },
  AC: { x: 78, y: 50 }, BU: { x: 76, y: 50 }, AT: { x: 76, y: 50 }, ATT: { x: 76, y: 50 }, PIV: { x: 74, y: 50 }, ST: { x: 78, y: 50 },
};

const roleKey = (role?: string) => (role || "").toUpperCase().trim();

/**
 * Ligne d'une place : gardien, défense, jeu (milieu et attaque réunis : un ailier joue aussi bien milieu
 * excentré). Changer de ligne coûte plus cher que changer de côté : un défenseur reste en défense tant qu'il y a
 * une place, plutôt que d'être envoyé au milieu.
 */
type Line = "G" | "D" | "J";
const lineOf = (spot: Spot): Line =>
  spot.x < 15 ? "G"
    : spot.x < 34 ? "D"
      // Piston (couloir, avant le milieu de terrain) : place d'un latéral
      : spot.x < 50 && (spot.y < 25 || spot.y > 75) ? "D"
        : "J";
const LINE_ORDER: Record<Line, number> = { G: 0, D: 1, J: 2 };
const LINE_PENALTY = 30;
const isFootball = (sport: string) => sport === "football" || sport === "soccer";

/**
 * Méthode hongroise (matrice carrée n × n) : renvoie pour chaque ligne la colonne choisie.
 * Version classique en O(n³) avec potentiels.
 */
function hungarian(cost: number[][]): number[] {
  const n = cost.length;
  const INF = Number.POSITIVE_INFINITY;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(INF);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const rowToCol = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j] > 0) rowToCol[p[j] - 1] = j - 1;
  return rowToCol;
}

/** Places de référence des joueurs (football) : joueurs d'un même poste écartés latéralement dans l'ordre des numéros */
function footballReferenceSpots(players: AssignablePlayer[]): (Spot | null)[] {
  const byRole = new Map<string, number[]>();
  players.forEach((pl, i) => {
    const k = roleKey(pl.role);
    if (!FOOTBALL_ROLE_SPOTS[k]) return;
    byRole.set(k, [...(byRole.get(k) || []), i]);
  });
  const out: (Spot | null)[] = players.map((pl) => {
    const base = FOOTBALL_ROLE_SPOTS[roleKey(pl.role)];
    return base ? { ...base } : null;
  });
  byRole.forEach((idxs) => {
    if (idxs.length < 2) return;
    const sorted = [...idxs].sort((a, b) => (players[a].number ?? 999) - (players[b].number ?? 999) || a - b);
    sorted.forEach((pi, rank) => {
      const spot = out[pi]!;
      spot.y = Math.max(10, Math.min(90, spot.y + (rank - (sorted.length - 1) / 2) * 16));
    });
  });
  return out;
}

/**
 * Pour chaque place du schéma (repère de l'équipe qui attaque vers la droite), l'indice du joueur qui la prend,
 * ou -1 si elle reste libre (moins de joueurs que de places). Les joueurs en trop ne reçoivent pas de place.
 */
export function assignPlayersToFormation(players: AssignablePlayer[], slots: Spot[], sport: string): number[] {
  const nP = players.length;
  const nS = slots.length;
  if (!nP || !nS) return slots.map(() => -1);

  if (!isFootball(sport)) {
    // Autres sports : numéros de maillot dans l'ordre (le numéro est le poste), ordre d'origine en cas d'égalité
    const order = players.map((_, i) => i).sort((a, b) => (players[a].number ?? 999) - (players[b].number ?? 999) || a - b);
    return slots.map((_, s) => (s < order.length ? order[s] : -1));
  }

  const refs = footballReferenceSpots(players);
  // Poste inconnu : place indifférente (coût fixe), départage léger par numéro pour un résultat stable
  const UNKNOWN = 60;
  const n = Math.max(nP, nS);
  const cost: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i >= nP || j >= nS) return 0; // ligne / colonne fictive
      const ref = refs[i];
      if (!ref) return UNKNOWN + j * 0.01 * ((players[i].number ?? 50) / 50);
      const lineGap = Math.abs(LINE_ORDER[lineOf(ref)] - LINE_ORDER[lineOf(slots[j])]);
      return Math.hypot(ref.x - slots[j].x, ref.y - slots[j].y) + lineGap * LINE_PENALTY;
    })
  );
  const rowToCol = hungarian(cost);
  const slotToPlayer = slots.map(() => -1);
  rowToCol.forEach((col, row) => {
    if (row < nP && col >= 0 && col < nS) slotToPlayer[col] = row;
  });
  return slotToPlayer;
}
