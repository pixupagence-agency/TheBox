// Tableau tactique : ancien sanitizeSquadNumbers() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { type Token } from "@/lib/tactics/types";

export interface SanitizeSquadNumbersCtx {
  currentTokens: Token[];
  opponentSubstitutes: any[];
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setOpponentSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  substitutes: any[];
}

export function sanitizeSquadNumbers(boardCtx: SanitizeSquadNumbersCtx, targetTeam: "home" | "away") {
  const { currentTokens, opponentSubstitutes, setKeyframes, setOpponentSubstitutes, setSubstitutes, substitutes } = boardCtx;
  const isAway = targetTeam === "away";
  const starters = currentTokens.filter((t) => isAway ? t.type === "player_b" : t.type === "player_a");
  const bench = isAway ? opponentSubstitutes : substitutes;

  const usedNumbers = new Set<number>();
  let hasStarterChanges = false;
  let hasBenchChanges = false;

  const getFreeNumber = (): number => {
    for (let n = 1; n <= 99; n++) {
      if (!usedNumbers.has(n)) {
        usedNumbers.add(n);
        return n;
      }
    }
    return 99;
  };

  // 1. Process starters first
  const updatedStarterNumbers: Record<string, number> = {};
  starters.forEach((p) => {
    const num = typeof p.number === "number" && !isNaN(p.number) ? p.number : null;
    if (num !== null && num >= 1 && num <= 99 && !usedNumbers.has(num)) {
      usedNumbers.add(num);
      updatedStarterNumbers[p.id] = num;
    } else {
      hasStarterChanges = true;
    }
  });

  starters.forEach((p) => {
    if (updatedStarterNumbers[p.id] === undefined) {
      updatedStarterNumbers[p.id] = getFreeNumber();
    }
  });

  // 2. Process bench substitutes
  const updatedBench = bench.map((s) => {
    const num = typeof s.number === "number" && !isNaN(s.number) ? s.number : null;
    if (num !== null && num >= 1 && num <= 99 && !usedNumbers.has(num)) {
      usedNumbers.add(num);
      return s;
    } else {
      hasBenchChanges = true;
      const newNum = getFreeNumber();
      return { ...s, number: newNum };
    }
  });

  if (hasStarterChanges) {
    setKeyframes((prev) =>
      prev.map((frame) =>
        frame.map((t) => (updatedStarterNumbers[t.id] !== undefined ? { ...t, number: updatedStarterNumbers[t.id] } : t))
      )
    );
  }

  if (hasBenchChanges) {
    if (isAway) {
      setOpponentSubstitutes(updatedBench);
    } else {
      setSubstitutes(updatedBench);
    }
  }
}
