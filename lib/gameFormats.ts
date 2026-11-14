// Formats de jeu par sport : football à 11 / à 8 / à 5, rugby à XV / à 7.
// Le premier format de chaque sport est le format historique de The Box : il garde
// les effectifs, schémas et terrains déjà définis dans TacticsBoard et Pitch.
// Les autres formats sont entièrement décrits ici (effectif, schémas, terrain, durée).

export interface GameFormatOption {
  id: string;
  /** Libellé complet, ex. « Foot à 8 » */
  label: string;
  labelEn: string;
  /** Libellé court pour les boutons, ex. « À 8 » */
  short: string;
  players: number;
}

export const GAME_FORMATS: Record<string, GameFormatOption[]> = {
  football: [
    { id: "11", label: "Foot à 11", labelEn: "11-a-side", short: "11", players: 11 },
    { id: "8", label: "Foot à 8", labelEn: "8-a-side", short: "8", players: 8 },
    { id: "5", label: "Foot à 5", labelEn: "5-a-side", short: "5", players: 5 },
  ],
  rugby: [
    { id: "15", label: "Rugby à XV", labelEn: "Rugby 15s", short: "XV", players: 15 },
    { id: "7", label: "Rugby à 7", labelEn: "Rugby 7s", short: "7", players: 7 },
  ],
};

export const GAME_FORMATS_STORAGE_KEY = "thebox_game_formats";

export const getGameFormatOptions = (sport: string): GameFormatOption[] => GAME_FORMATS[sport] || [];

/** Format valide pour le sport (le format par défaut si absent ou inconnu). */
export const resolveGameFormat = (sport: string, format?: string | null): string => {
  const options = getGameFormatOptions(sport);
  if (options.length === 0) return "";
  return options.some((o) => o.id === format) ? (format as string) : options[0].id;
};

export const getGameFormatOption = (sport: string, format?: string | null): GameFormatOption | undefined =>
  getGameFormatOptions(sport).find((o) => o.id === resolveGameFormat(sport, format));

/** true si le format n'est pas le format historique du sport (donc décrit dans ce fichier). */
const isAltFormat = (sport: string, format?: string | null): boolean => {
  const options = getGameFormatOptions(sport);
  return options.length > 1 && resolveGameFormat(sport, format) !== options[0].id;
};

// ---------------------------------------------------------------------------
// Effectifs et schémas
// ---------------------------------------------------------------------------

type Spot = { x: number; y: number };

interface AltFormatDef {
  roles: string[];
  /** Schémas : coordonnées de l'équipe qui attaque vers la droite (gardien à gauche). */
  formations: Record<string, Spot[]>;
}

const p = (x: number, y: number): Spot => ({ x, y });

const ALT_FORMATS: Record<string, AltFormatDef> = {
  "football:8": {
    roles: ["G", "DG", "DC", "DD", "MG", "MC", "MD", "AC"],
    formations: {
      "3-3-1": [p(8, 50), p(26, 22), p(24, 50), p(26, 78), p(48, 20), p(46, 50), p(48, 80), p(72, 50)],
      "2-3-2": [p(8, 50), p(25, 32), p(25, 50), p(25, 68), p(46, 18), p(44, 50), p(46, 82), p(70, 38)],
      "3-2-2": [p(8, 50), p(26, 22), p(24, 50), p(26, 78), p(46, 34), p(46, 66), p(70, 34), p(70, 66)],
      "2-4-1": [p(8, 50), p(25, 35), p(25, 65), p(48, 14), p(44, 38), p(44, 62), p(48, 86), p(72, 50)],
    },
  },
  "football:5": {
    roles: ["G", "FIX", "AiG", "AiD", "PIV"],
    formations: {
      "1-2-1": [p(8, 50), p(28, 50), p(48, 22), p(48, 78), p(70, 50)],
      "2-2": [p(8, 50), p(28, 30), p(28, 70), p(62, 30), p(62, 70)],
      "3-1": [p(8, 50), p(28, 22), p(26, 50), p(28, 78), p(64, 50)],
      "2-1-1": [p(8, 50), p(26, 32), p(26, 68), p(46, 50), p(70, 50)],
    },
  },
  "rugby:7": {
    roles: ["PIL", "TAL", "PIL", "DM", "OUV", "CEN", "AIL"],
    formations: {
      "7s Standard": [p(38, 40), p(38, 50), p(38, 60), p(31, 52), p(25, 30), p(25, 72), p(18, 50)],
      "Attaque en ligne": [p(40, 44), p(40, 50), p(40, 56), p(34, 58), p(28, 66), p(23, 74), p(19, 84)],
      "Défense à plat": [p(42, 38), p(42, 50), p(42, 62), p(42, 26), p(42, 74), p(42, 14), p(42, 86)],
    },
  },
};

const altDef = (sport: string, format?: string | null): AltFormatDef | null =>
  isAltFormat(sport, format) ? ALT_FORMATS[`${sport}:${resolveGameFormat(sport, format)}`] || null : null;

export interface FormatToken {
  id: string;
  type: "player_a" | "player_b" | "ball";
  number?: number;
  name: string;
  role: string;
  x: number;
  y: number;
}

/** Effectif de départ du format (null = format historique, géré par TacticsBoard). */
export const getFormatDefaultPlayers = (sport: string, format?: string | null): FormatToken[] | null => {
  const def = altDef(sport, format);
  if (!def) return null;
  // Au départ, chaque équipe est regroupée dans sa moitié de terrain (pas de joueurs superposés)
  // (les schémas de rugby à 7 sont déjà placés dans le camp de l'équipe)
  const base = Object.values(def.formations)[0].map((c) =>
    sport === "football" ? { x: Math.round(6 + (c.x / 100) * 40), y: c.y } : c
  );
  const team = (side: "a" | "b"): FormatToken[] =>
    base.map((c, i) => ({
      id: `${side}${i + 1}`,
      type: side === "a" ? "player_a" : "player_b",
      number: i + 1,
      name: side === "a" ? `Joueur ${i + 1}` : `Joueur ${i + 1} Adv`,
      role: def.roles[i] || "J",
      x: side === "a" ? c.x : 100 - c.x,
      y: c.y,
    }));
  return [...team("a"), ...team("b"), { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 50, y: 50 }];
};

/** Noms des schémas du format (null = format historique). */
export const getFormatFormations = (sport: string, format?: string | null): string[] | null => {
  const def = altDef(sport, format);
  return def ? Object.keys(def.formations) : null;
};

/** Coordonnées d'un schéma, côté gauche (null = format historique ou schéma inconnu). */
export const getFormatFormationCoords = (sport: string, format: string | null | undefined, formation: string): Spot[] | null => {
  const def = altDef(sport, format);
  if (!def) return null;
  return def.formations[formation] || Object.values(def.formations)[0];
};

// ---------------------------------------------------------------------------
// Durée des périodes en mode live
// ---------------------------------------------------------------------------

/** Durée d'une période en secondes (null = durée du format historique). */
export const getFormatPeriodSeconds = (sport: string, format?: string | null): number | null => {
  if (!isAltFormat(sport, format)) return null;
  const key = `${sport}:${resolveGameFormat(sport, format)}`;
  if (key === "football:8") return 30 * 60;
  if (key === "football:5") return 20 * 60;
  if (key === "rugby:7") return 7 * 60;
  return null;
};

// ---------------------------------------------------------------------------
// Petits terrains de football (le rugby à 7 se joue sur le terrain de XV)
// ---------------------------------------------------------------------------

export interface SmallPitchSpec {
  /** Longueur et largeur de l'aire de jeu, en mètres */
  length: number;
  width: number;
  /** Dégagement autour des lignes */
  margin: number;
  goalWidth: number;
  goalDepth: number;
  centerRadius: number;
  /** Surface de réparation : rectangle (foot à 8) ou zone arrondie type futsal (foot à 5) */
  area: { kind: "rect"; depth: number; width: number } | { kind: "arc"; radius: number };
  /** Distance du point de penalty à la ligne de but */
  spot: number;
  secondSpot?: number;
}

const SMALL_PITCHES: Record<string, SmallPitchSpec> = {
  // Foot à 8 (U10-U13) : terrain d'environ 64 x 50 m, buts de 6 m, surface de 26 x 13 m, penalty à 9 m
  "football:8": {
    length: 64, width: 50, margin: 2.5,
    goalWidth: 6, goalDepth: 1.5, centerRadius: 6,
    area: { kind: "rect", depth: 13, width: 26 },
    spot: 9,
  },
  // Foot à 5 : terrain de 40 x 20 m, buts de 3 m, zone arrondie de 6 m, points à 6 et 10 m
  "football:5": {
    length: 40, width: 20, margin: 1.5,
    goalWidth: 3, goalDepth: 1, centerRadius: 3,
    area: { kind: "arc", radius: 6 },
    spot: 6, secondSpot: 10,
  },
};

export const getSmallPitchSpec = (sport: string, format?: string | null): SmallPitchSpec | null =>
  isAltFormat(sport, format) ? SMALL_PITCHES[`${sport}:${resolveGameFormat(sport, format)}`] || null : null;

/** Dimensions totales (avec dégagement) d'un petit terrain, en mètres, en paysage. */
export const smallPitchBox = (spec: SmallPitchSpec) => ({
  W: spec.length + spec.margin * 2,
  H: spec.width + spec.margin * 2,
});

/** Rapport largeur / hauteur du terrain en paysage (null = rapport du sport). */
export const getFormatPitchRatio = (sport: string, format?: string | null): number | null => {
  const spec = getSmallPitchSpec(sport, format);
  if (!spec) return null;
  const { W, H } = smallPitchBox(spec);
  return W / H;
};

/** Trace un petit terrain de football sur un canvas (export image), en paysage. */
export function drawSmallFootballPitch(
  ctx: CanvasRenderingContext2D,
  spec: SmallPitchSpec,
  px: number,
  py: number,
  pw: number,
  ph: number
) {
  const { W, H } = smallPitchBox(spec);
  const m = spec.margin;
  const cy = H / 2;
  const toX = (v: number) => px + (v / W) * pw;
  const toY = (v: number) => py + (v / H) * ph;
  const toW = (v: number) => (v / W) * pw;
  const toH = (v: number) => (v / H) * ph;

  const grad = ctx.createLinearGradient(px, py, px, py + ph);
  grad.addColorStop(0, "#032e22");
  grad.addColorStop(1, "#053b2c");
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, pw, ph);
  const stripeW = pw / 12;
  for (let i = 0; i < 12; i += 2) {
    ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
    ctx.fillRect(px + i * stripeW, py, stripeW, ph);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(toX(m), toY(m), toW(spec.length), toH(spec.width));
  ctx.beginPath();
  ctx.moveTo(toX(W / 2), toY(m));
  ctx.lineTo(toX(W / 2), toY(H - m));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(toX(W / 2), toY(cy), toH(spec.centerRadius), 0, 2 * Math.PI);
  ctx.stroke();

  const dot = (x: number) => {
    ctx.beginPath();
    ctx.arc(toX(x), toY(cy), 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  };
  dot(W / 2);

  // Les deux moitiés : dir = 1 côté gauche, -1 côté droit
  for (const dir of [1, -1]) {
    const line = dir === 1 ? m : W - m;
    const at = (d: number) => line + dir * d;
    // But
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    const gx = dir === 1 ? m - spec.goalDepth : W - m;
    ctx.fillRect(toX(gx), toY(cy - spec.goalWidth / 2), toW(spec.goalDepth), toH(spec.goalWidth));
    ctx.strokeRect(toX(gx), toY(cy - spec.goalWidth / 2), toW(spec.goalDepth), toH(spec.goalWidth));
    // Surface
    if (spec.area.kind === "rect") {
      const ax = dir === 1 ? m : W - m - spec.area.depth;
      ctx.strokeRect(toX(ax), toY(cy - spec.area.width / 2), toW(spec.area.depth), toH(spec.area.width));
    } else {
      const r = spec.area.radius;
      const g = spec.goalWidth / 2;
      ctx.beginPath();
      if (dir === 1) {
        ctx.arc(toX(line), toY(cy - g), toH(r), -Math.PI / 2, 0);
        ctx.lineTo(toX(at(r)), toY(cy + g));
        ctx.arc(toX(line), toY(cy + g), toH(r), 0, Math.PI / 2);
      } else {
        ctx.arc(toX(line), toY(cy - g), toH(r), -Math.PI / 2, -Math.PI, true);
        ctx.lineTo(toX(at(r)), toY(cy + g));
        ctx.arc(toX(line), toY(cy + g), toH(r), Math.PI, Math.PI / 2, true);
      }
      ctx.stroke();
    }
    dot(at(spec.spot));
    if (spec.secondSpot) dot(at(spec.secondSpot));
  }
}
