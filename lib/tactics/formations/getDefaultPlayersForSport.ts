// Tableau tactique : ancien getDefaultPlayersForSport() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import { getFormatDefaultPlayers } from "@/lib/gameFormats";
import { type Token } from "@/lib/tactics/types";

export interface GetDefaultPlayersForSportCtx {
  formatFor: (sport: string) => string;
}

export function getDefaultPlayersForSport(boardCtx: GetDefaultPlayersForSportCtx, sport: string, format: string): Token[] {
  const { formatFor } = boardCtx;
  const formatPlayers = getFormatDefaultPlayers(sport, format);
  if (formatPlayers) return formatPlayers as Token[];
  switch (sport) {
    case "basketball":
      return [
        { id: "a1", type: "player_a", number: 1, name: "Joueur 1", role: "PG", x: 28, y: 50 },
        { id: "a2", type: "player_a", number: 2, name: "Joueur 2", role: "SG", x: 38, y: 22 },
        { id: "a3", type: "player_a", number: 3, name: "Joueur 3", role: "SF", x: 38, y: 78 },
        { id: "a4", type: "player_a", number: 4, name: "Joueur 4", role: "PF", x: 42, y: 38 },
        { id: "a5", type: "player_a", number: 5, name: "Joueur 5", role: "C", x: 42, y: 62 },
        { id: "b1", type: "player_b", number: 1, name: "Joueur 1 Adv", role: "PG", x: 72, y: 50 },
        { id: "b2", type: "player_b", number: 2, name: "Joueur 2 Adv", role: "SG", x: 62, y: 22 },
        { id: "b3", type: "player_b", number: 3, name: "Joueur 3 Adv", role: "SF", x: 62, y: 78 },
        { id: "b4", type: "player_b", number: 4, name: "Joueur 4 Adv", role: "PF", x: 58, y: 38 },
        { id: "b5", type: "player_b", number: 5, name: "Joueur 5 Adv", role: "C", x: 58, y: 62 },
        { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 50, y: 50 },
      ];

    case "rugby":
      return [
        { id: "a1", type: "player_a", number: 1, name: "Joueur 1", role: "PIL", x: 40, y: 35 },
        { id: "a2", type: "player_a", number: 2, name: "Joueur 2", role: "TAL", x: 40, y: 50 },
        { id: "a3", type: "player_a", number: 3, name: "Joueur 3", role: "PIL", x: 40, y: 65 },
        { id: "a4", type: "player_a", number: 4, name: "Joueur 4", role: "2L", x: 33, y: 40 },
        { id: "a5", type: "player_a", number: 5, name: "Joueur 5", role: "2L", x: 33, y: 60 },
        { id: "a6", type: "player_a", number: 6, name: "Joueur 6", role: "3L", x: 28, y: 30 },
        { id: "a7", type: "player_a", number: 7, name: "Joueur 7", role: "3L", x: 28, y: 70 },
        { id: "a8", type: "player_a", number: 8, name: "Joueur 8", role: "N8", x: 25, y: 50 },
        { id: "a9", type: "player_a", number: 9, name: "Joueur 9", role: "DM", x: 22, y: 45 },
        { id: "a10", type: "player_a", number: 10, name: "Joueur 10", role: "OUV", x: 20, y: 55 },
        { id: "a11", type: "player_a", number: 11, name: "Joueur 11", role: "AIL", x: 18, y: 18 },
        { id: "a12", type: "player_a", number: 12, name: "Joueur 12", role: "CEN", x: 18, y: 40 },
        { id: "a13", type: "player_a", number: 13, name: "Joueur 13", role: "CEN", x: 18, y: 60 },
        { id: "a14", type: "player_a", number: 14, name: "Joueur 14", role: "AIL", x: 18, y: 82 },
        { id: "a15", type: "player_a", number: 15, name: "Joueur 15", role: "ARR", x: 8, y: 50 },
        { id: "b1", type: "player_b", number: 1, name: "Joueur 1 Adv", role: "PIL", x: 60, y: 35 },
        { id: "b2", type: "player_b", number: 2, name: "Joueur 2 Adv", role: "TAL", x: 60, y: 50 },
        { id: "b3", type: "player_b", number: 3, name: "Joueur 3 Adv", role: "PIL", x: 60, y: 65 },
        { id: "b4", type: "player_b", number: 4, name: "Joueur 4 Adv", role: "2L", x: 67, y: 40 },
        { id: "b5", type: "player_b", number: 5, name: "Joueur 5 Adv", role: "2L", x: 67, y: 60 },
        { id: "b6", type: "player_b", number: 6, name: "Joueur 6 Adv", role: "3L", x: 72, y: 30 },
        { id: "b7", type: "player_b", number: 7, name: "Joueur 7 Adv", role: "3L", x: 72, y: 70 },
        { id: "b8", type: "player_b", number: 8, name: "Joueur 8 Adv", role: "N8", x: 75, y: 50 },
        { id: "b9", type: "player_b", number: 9, name: "Joueur 9 Adv", role: "DM", x: 78, y: 45 },
        { id: "b10", type: "player_b", number: 10, name: "Joueur 10 Adv", role: "OUV", x: 80, y: 55 },
        { id: "b11", type: "player_b", number: 11, name: "Joueur 11 Adv", role: "AIL", x: 82, y: 18 },
        { id: "b12", type: "player_b", number: 12, name: "Joueur 12 Adv", role: "CEN", x: 82, y: 40 },
        { id: "b13", type: "player_b", number: 13, name: "Joueur 13 Adv", role: "CEN", x: 82, y: 60 },
        { id: "b14", type: "player_b", number: 14, name: "Joueur 14 Adv", role: "AIL", x: 82, y: 82 },
        { id: "b15", type: "player_b", number: 15, name: "Joueur 15 Adv", role: "ARR", x: 92, y: 50 },
        { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 50, y: 50 },
      ];

    case "handball":
      return [
        { id: "a1", type: "player_a", number: 1, name: "Joueur 1", role: "GB", x: 8, y: 50 },
        { id: "a2", type: "player_a", number: 2, name: "Joueur 2", role: "ALG", x: 32, y: 16 },
        { id: "a3", type: "player_a", number: 3, name: "Joueur 3", role: "ARG", x: 30, y: 34 },
        { id: "a4", type: "player_a", number: 4, name: "Joueur 4", role: "DC", x: 28, y: 50 },
        { id: "a5", type: "player_a", number: 5, name: "Joueur 5", role: "PV", x: 42, y: 50 },
        { id: "a6", type: "player_a", number: 6, name: "Joueur 6", role: "ARD", x: 30, y: 66 },
        { id: "a7", type: "player_a", number: 7, name: "Joueur 7", role: "ALD", x: 32, y: 84 },
        { id: "b1", type: "player_b", number: 1, name: "Joueur 1 Adv", role: "GB", x: 92, y: 50 },
        { id: "b2", type: "player_b", number: 2, name: "Joueur 2 Adv", role: "ALG", x: 68, y: 16 },
        { id: "b3", type: "player_b", number: 3, name: "Joueur 3 Adv", role: "ARG", x: 70, y: 34 },
        { id: "b4", type: "player_b", number: 4, name: "Joueur 4 Adv", role: "DC", x: 72, y: 50 },
        { id: "b5", type: "player_b", number: 5, name: "Joueur 5 Adv", role: "PV", x: 58, y: 50 },
        { id: "b6", type: "player_b", number: 6, name: "Joueur 6 Adv", role: "ARD", x: 70, y: 66 },
        { id: "b7", type: "player_b", number: 7, name: "Joueur 7 Adv", role: "ALD", x: 68, y: 84 },
        { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 50, y: 50 },
      ];

    case "football":
    default:
      return [
        { id: "a1", type: "player_a", number: 1, name: "Joueur 1", role: "G", x: 8, y: 50 },
        { id: "a2", type: "player_a", number: 2, name: "Joueur 2", role: "DD", x: 28, y: 80 },
        { id: "a3", type: "player_a", number: 3, name: "Joueur 3", role: "DG", x: 28, y: 20 },
        { id: "a4", type: "player_a", number: 4, name: "Joueur 4", role: "DC", x: 24, y: 35 },
        { id: "a5", type: "player_a", number: 5, name: "Joueur 5", role: "DC", x: 24, y: 65 },
        { id: "a6", type: "player_a", number: 6, name: "Joueur 6", role: "MDC", x: 44, y: 50 },
        { id: "a7", type: "player_a", number: 7, name: "Joueur 7", role: "AiD", x: 74, y: 80 },
        { id: "a8", type: "player_a", number: 8, name: "Joueur 8", role: "MC", x: 55, y: 32 },
        { id: "a9", type: "player_a", number: 9, name: "Joueur 9", role: "AC", x: 78, y: 50 },
        { id: "a10", type: "player_a", number: 10, name: "Joueur 10", role: "MOC", x: 55, y: 68 },
        { id: "a11", type: "player_a", number: 11, name: "Joueur 11", role: "AiG", x: 74, y: 20 },
        { id: "b1", type: "player_b", number: 1, name: "Joueur 1 Adv", role: "G", x: 92, y: 50 },
        { id: "b2", type: "player_b", number: 2, name: "Joueur 2 Adv", role: "DD", x: 72, y: 20 },
        { id: "b3", type: "player_b", number: 3, name: "Joueur 3 Adv", role: "DG", x: 72, y: 80 },
        { id: "b4", type: "player_b", number: 4, name: "Joueur 4 Adv", role: "DC", x: 76, y: 35 },
        { id: "b5", type: "player_b", number: 5, name: "Joueur 5 Adv", role: "DC", x: 76, y: 65 },
        { id: "b6", type: "player_b", number: 6, name: "Joueur 6 Adv", role: "MDC", x: 56, y: 50 },
        { id: "b7", type: "player_b", number: 7, name: "Joueur 7 Adv", role: "MC", x: 45, y: 32 },
        { id: "b8", type: "player_b", number: 8, name: "Joueur 8 Adv", role: "MOC", x: 45, y: 68 },
        { id: "b9", type: "player_b", number: 9, name: "Joueur 9 Adv", role: "AC", x: 22, y: 50 },
        { id: "b10", type: "player_b", number: 10, name: "Joueur 10 Adv", role: "AiD", x: 26, y: 80 },
        { id: "b11", type: "player_b", number: 11, name: "Joueur 11 Adv", role: "AiG", x: 26, y: 20 },
        { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 52, y: 50 },
      ];
  }
}
