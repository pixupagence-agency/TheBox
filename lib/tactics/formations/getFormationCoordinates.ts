// Tableau tactique : ancien getFormationCoordinates() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import { getFormatFormationCoords } from "@/lib/gameFormats";
import { type Token } from "@/lib/tactics/types";

export interface GetFormationCoordinatesCtx {
  formatFor: (sport: string) => string;
  getDefaultPlayersForSport: (sport: string, format?: string) => Token[];
}

export function getFormationCoordinates(boardCtx: GetFormationCoordinatesCtx, sport: string, formationName: string, isOpponent: boolean): { x: number; y: number }[] {
  const { formatFor, getDefaultPlayersForSport } = boardCtx;
  const flipX = (val: number) => isOpponent ? 100 - val : val;
  let coords: { x: number; y: number }[] = [];
  const formatCoords = getFormatFormationCoords(sport, formatFor(sport), formationName);

  if (formatCoords) {
    coords = formatCoords.map((c) => ({ x: flipX(c.x), y: c.y }));
  } else if (sport === "basketball") {
    switch (formationName) {
      case "2-3":
        coords = [
          { x: flipX(28), y: 50 },
          { x: flipX(38), y: 25 }, { x: flipX(38), y: 74 },
          { x: flipX(42), y: 38 }, { x: flipX(42), y: 62 },
        ];
        break;
      case "1-2-2":
        coords = [
          { x: flipX(25), y: 50 },
          { x: flipX(36), y: 25 }, { x: flipX(36), y: 74 },
          { x: flipX(44), y: 20 }, { x: flipX(44), y: 74 },
        ];
        break;
      case "1-3-1":
        coords = [
          { x: flipX(24), y: 50 },
          { x: flipX(34), y: 22 }, { x: flipX(34), y: 74 },
          { x: flipX(35), y: 50 }, { x: flipX(44), y: 50 },
        ];
        break;
      case "3-2":
        coords = [
          { x: flipX(28), y: 50 }, { x: flipX(28), y: 25 }, { x: flipX(28), y: 74 },
          { x: flipX(42), y: 35 }, { x: flipX(42), y: 65 },
        ];
        break;
      case "5-Out":
        coords = [
          { x: flipX(25), y: 50 },
          { x: flipX(32), y: 20 }, { x: flipX(32), y: 74 },
          { x: flipX(40), y: 15 }, { x: flipX(40), y: 74 },
        ];
        break;
    }
  } else if (sport === "rugby") {
    switch (formationName) {
      case "Pack Ruck":
        coords = [
          { x: flipX(45), y: 30 }, { x: flipX(45), y: 40 }, { x: flipX(45), y: 50 }, { x: flipX(45), y: 60 }, { x: flipX(45), y: 70 },
          { x: flipX(38), y: 40 }, { x: flipX(38), y: 50 }, { x: flipX(38), y: 60 },
          { x: flipX(25), y: 45 }, { x: flipX(22), y: 55 },
          { x: flipX(18), y: 20 }, { x: flipX(18), y: 40 }, { x: flipX(18), y: 60 }, { x: flipX(18), y: 74 },
          { x: flipX(10), y: 50 },
        ];
        break;
      case "Combinaison":
        coords = [
          { x: flipX(40), y: 35 }, { x: flipX(40), y: 50 }, { x: flipX(40), y: 65 },
          { x: flipX(33), y: 40 }, { x: flipX(33), y: 60 },
          { x: flipX(28), y: 30 }, { x: flipX(28), y: 70 }, { x: flipX(25), y: 50 },
          { x: flipX(24), y: 35 }, { x: flipX(22), y: 50 },
          { x: flipX(18), y: 15 }, { x: flipX(20), y: 35 }, { x: flipX(20), y: 65 }, { x: flipX(18), y: 74 },
          { x: flipX(8), y: 50 },
        ];
        break;
      case "15s Standard":
      default:
        coords = [
          { x: flipX(40), y: 35 }, { x: flipX(40), y: 50 }, { x: flipX(40), y: 65 },
          { x: flipX(33), y: 40 }, { x: flipX(33), y: 60 },
          { x: flipX(28), y: 30 }, { x: flipX(28), y: 70 }, { x: flipX(25), y: 50 },
          { x: flipX(22), y: 45 }, { x: flipX(20), y: 55 },
          { x: flipX(18), y: 15 }, { x: flipX(18), y: 40 }, { x: flipX(18), y: 60 }, { x: flipX(18), y: 74 },
          { x: flipX(8), y: 50 },
        ];
        break;
    }
  } else if (sport === "handball") {
    switch (formationName) {
      case "6-0":
        coords = [
          { x: flipX(8), y: 50 },
          { x: flipX(32), y: 15 }, { x: flipX(30), y: 35 }, { x: flipX(28), y: 50 },
          { x: flipX(42), y: 50 }, { x: flipX(30), y: 65 }, { x: flipX(32), y: 74 },
        ];
        break;
      case "5-1":
        coords = [
          { x: flipX(8), y: 50 },
          { x: flipX(32), y: 15 }, { x: flipX(30), y: 35 }, { x: flipX(36), y: 50 },
          { x: flipX(42), y: 50 }, { x: flipX(30), y: 65 }, { x: flipX(32), y: 74 },
        ];
        break;
      case "3-2-1":
        coords = [
          { x: flipX(8), y: 50 },
          { x: flipX(32), y: 15 }, { x: flipX(28), y: 35 }, { x: flipX(38), y: 50 },
          { x: flipX(42), y: 50 }, { x: flipX(28), y: 65 }, { x: flipX(32), y: 74 },
        ];
        break;
      case "4-2":
        coords = [
          { x: flipX(8), y: 50 },
          { x: flipX(32), y: 15 }, { x: flipX(28), y: 35 }, { x: flipX(38), y: 40 },
          { x: flipX(38), y: 60 }, { x: flipX(28), y: 65 }, { x: flipX(32), y: 74 },
        ];
        break;
    }
  } else {
    // Default: Football
    switch (formationName) {
      case "4-4-2":
        coords = [
          { x: flipX(8), y: 50 },  // 0: GK
          { x: flipX(24), y: 35 }, { x: flipX(24), y: 65 }, // 1: DC, 2: DC
          { x: flipX(28), y: 80 }, { x: flipX(28), y: 20 }, // 3: DD (y=80), 4: DG (y=20)
          { x: flipX(46), y: 38 }, { x: flipX(46), y: 62 }, // 5: MDC/MC, 6: MC
          { x: flipX(68), y: 60 },                          // 7: MOC / AC
          { x: flipX(50), y: 20 }, { x: flipX(50), y: 80 }, // 8: MG (y=20), 9: MD (y=80)
          { x: flipX(75), y: 40 },                          // 10: AC
        ];
        break;
      case "4-3-3":
        coords = [
          { x: flipX(8), y: 50 },  // 0: GK
          { x: flipX(24), y: 35 }, { x: flipX(24), y: 65 }, // 1: DC, 2: DC
          { x: flipX(28), y: 80 }, { x: flipX(28), y: 20 }, // 3: DD (y=80), 4: DG (y=20)
          { x: flipX(44), y: 50 },                          // 5: MDC
          { x: flipX(55), y: 32 }, { x: flipX(55), y: 68 }, // 6: MC (y=32), 7: MOC (y=68)
          { x: flipX(74), y: 20 }, { x: flipX(74), y: 80 }, // 8: AiG (y=20), 9: AiD (y=80)
          { x: flipX(78), y: 50 },                          // 10: AC
        ];
        break;
      case "4-2-3-1":
        coords = [
          { x: flipX(8), y: 50 },  // 0: GK
          { x: flipX(24), y: 35 }, { x: flipX(24), y: 65 }, // 1: DC, 2: DC
          { x: flipX(28), y: 80 }, { x: flipX(28), y: 20 }, // 3: DD (y=80), 4: DG (y=20)
          { x: flipX(42), y: 38 }, { x: flipX(42), y: 62 }, // 5: MDC1, 6: MDC2
          { x: flipX(60), y: 50 },                          // 7: MOC
          { x: flipX(64), y: 20 }, { x: flipX(64), y: 80 }, // 8: AiG (y=20), 9: AiD (y=80)
          { x: flipX(78), y: 50 },                          // 10: AC
        ];
        break;
      case "5-3-2":
        coords = [
          { x: flipX(8), y: 50 },  // 0: GK
          { x: flipX(24), y: 32 }, { x: flipX(22), y: 50 }, // 1: DC, 2: DC
          { x: flipX(30), y: 82 }, { x: flipX(30), y: 18 }, // 3: Pistard Droit (DD), 4: Pistard Gauche (DG)
          { x: flipX(24), y: 68 },                          // 5: DC Right
          { x: flipX(48), y: 32 }, { x: flipX(44), y: 50 }, // 6: MC Left, 7: MDC Central
          { x: flipX(48), y: 68 },                          // 8: MC Right
          { x: flipX(75), y: 38 }, { x: flipX(75), y: 62 }, // 9: AC1, 10: AC2
        ];
        break;
      case "3-5-2":
        coords = [
          { x: flipX(8), y: 50 },  // 0: GK
          { x: flipX(24), y: 28 }, { x: flipX(22), y: 50 }, // 1: DC, 2: DC
          { x: flipX(48), y: 82 }, { x: flipX(48), y: 18 }, // 3: Piston Droit (DD), 4: Piston Gauche (DG)
          { x: flipX(24), y: 72 },                          // 5: DC Right
          { x: flipX(46), y: 35 }, { x: flipX(42), y: 50 }, // 6: MC Left, 7: MDC Central
          { x: flipX(46), y: 65 },                          // 8: MC Right
          { x: flipX(75), y: 38 }, { x: flipX(75), y: 62 }, // 9: AC1, 10: AC2
        ];
        break;
      case "3-4-3":
        coords = [
          { x: flipX(8), y: 50 },  // 0: GK
          { x: flipX(24), y: 28 }, { x: flipX(22), y: 50 }, { x: flipX(24), y: 72 }, // 1: DC Gauche, 2: DC Axe, 3: DC Droit
          { x: flipX(46), y: 18 }, { x: flipX(44), y: 38 },                          // 4: Piston Gauche (DG), 5: MC Gauche
          { x: flipX(44), y: 62 }, { x: flipX(46), y: 82 },                          // 6: MC Droit, 7: Piston Droit (DD)
          { x: flipX(74), y: 20 }, { x: flipX(74), y: 80 },                          // 8: AiG, 9: AiD
          { x: flipX(78), y: 50 },                                                   // 10: AC (Buteur)
        ];
        break;
      default:
        const defaultTokens = getDefaultPlayersForSport(sport).filter(t => isOpponent ? t.type === "player_b" : t.type === "player_a");
        coords = defaultTokens.map(t => ({ x: t.x, y: t.y }));
        break;
    }
  }

  if (coords.length === 0) {
    const defaultTokens = getDefaultPlayersForSport(sport).filter(t => isOpponent ? t.type === "player_b" : t.type === "player_a");
    coords = defaultTokens.map(t => ({ x: t.x, y: t.y }));
  }

  // Safety clamp to ensure players never land outside touchlines
  return coords.map((c) => ({
    x: Math.min(94, Math.max(6, c.x)),
    y: Math.min(88, Math.max(12, c.y)),
  }));
}
