// Tableau tactique : ancien handleAssignUniqueNumber() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import { type Token } from "@/lib/tactics/types";

export interface HandleAssignUniqueNumberCtx {
  currentTokens: Token[];
  handleUpdatePitchPlayer: (tokenId: string, field: "number" | "role" | "name" | "status" | "photo", value: any) => void;
  handleUpdateSubstitute: (subId: string, field: "number" | "role" | "name" | "status" | "photo", value: any) => void;
  opponentSubstitutes: any[];
  rolesTargetTeam: "home" | "away";
  substitutes: any[];
}

export function handleAssignUniqueNumber(boardCtx: HandleAssignUniqueNumberCtx, targetId: string, isStarter: boolean, rawValue: string | number, targetTeam?: "home" | "away") {
  const { currentTokens, handleUpdatePitchPlayer, handleUpdateSubstitute, opponentSubstitutes, rolesTargetTeam, substitutes } = boardCtx;
  const newNum = parseInt(String(rawValue), 10);
  if (isNaN(newNum) || newNum < 1 || newNum > 99) return;
  const isAway = (targetTeam || rolesTargetTeam) === "away";

  const starters = currentTokens.filter((t) => isAway ? t.type === "player_b" : t.type === "player_a");
  const bench = isAway ? opponentSubstitutes : substitutes;

  const targetPlayer = isStarter
    ? starters.find((p) => p.id === targetId)
    : bench.find((s) => s.id === targetId);

  const oldNum = targetPlayer?.number && !isNaN(targetPlayer.number) ? targetPlayer.number : null;
  if (oldNum === newNum) return;

  // Check if conflicting player exists with newNum
  const conflictingStarter = starters.find((p) => p.id !== targetId && p.number === newNum);
  const conflictingSub = bench.find((s) => s.id !== targetId && s.number === newNum);

  // Number to assign to conflicting player (swap with oldNum, or find free number)
  let fallbackNum = oldNum;
  if (!fallbackNum || fallbackNum < 1 || fallbackNum > 99 || fallbackNum === newNum) {
    const taken = new Set<number>();
    starters.forEach((p) => { if (typeof p.number === "number") taken.add(p.number); });
    bench.forEach((s) => { if (typeof s.number === "number") taken.add(s.number); });
    taken.add(newNum);
    for (let n = 1; n <= 99; n++) {
      if (!taken.has(n)) {
        fallbackNum = n;
        break;
      }
    }
    fallbackNum = fallbackNum || 99;
  }

  // 1. Update target player
  if (isStarter) {
    handleUpdatePitchPlayer(targetId, "number", newNum);
  } else {
    handleUpdateSubstitute(targetId, "number", newNum);
  }

  // 2. If conflicting player existed, reassign / swap them
  if (conflictingStarter) {
    handleUpdatePitchPlayer(conflictingStarter.id, "number", fallbackNum);
  } else if (conflictingSub) {
    handleUpdateSubstitute(conflictingSub.id, "number", fallbackNum);
  }
}
