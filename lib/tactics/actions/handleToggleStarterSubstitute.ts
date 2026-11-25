// Tableau tactique : ancien handleToggleStarterSubstitute() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { type Token } from "@/lib/tactics/types";

export interface HandleToggleStarterSubstituteCtx {
  currentFrameIdx: number;
  currentTokens: Token[];
  opponentSubstitutes: any[];
  rolesTargetTeam: "home" | "away";
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setOpponentSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  substitutes: any[];
}

export function handleToggleStarterSubstitute(boardCtx: HandleToggleStarterSubstituteCtx, targetId: string, currentStatus: "starter" | "substitute", targetTeam?: "home" | "away") {
  const { currentFrameIdx, currentTokens, opponentSubstitutes, rolesTargetTeam, setKeyframes, setOpponentSubstitutes, setSubstitutes, substitutes } = boardCtx;
  const isAway = (targetTeam || rolesTargetTeam) === "away";

  if (currentStatus === "starter") {
    // Pitch -> Bench
    const starter = currentTokens.find((t) => t.id === targetId);
    if (!starter) return;

    setKeyframes((prev) =>
      prev.map((frame) => frame.filter((t) => t.id !== targetId))
    );

    if (isAway) {
      const newSubId = `opp_sub_${Date.now()}_${starter.number || 99}`;
      const newSub = {
        id: newSubId,
        name: starter.name,
        number: starter.number ?? (opponentSubstitutes.length + 12),
        role: starter.role || "SUB",
        status: starter.status || "normal",
        photo: starter.photo,
        type: "player_b"
      };
      setOpponentSubstitutes((prev) => [...prev, newSub]);
    } else {
      const newSubId = `sub_${substitutes.length + 1}_${starter.number || 99}`;
      const newSub = {
        id: newSubId,
        name: starter.name,
        number: starter.number ?? (substitutes.length + 12),
        role: starter.role || "SUB",
        status: starter.status || "normal",
        photo: starter.photo,
        type: "player_a",
        ...(starter.rosterId ? { rosterId: starter.rosterId } : {}),
      };
      setSubstitutes((prev) => [...prev, newSub]);
    }
  } else {
    // Bench -> Pitch
    if (isAway) {
      const sub = opponentSubstitutes.find((s) => s.id === targetId);
      if (!sub) return;

      setOpponentSubstitutes((prev) => prev.filter((s) => s.id !== targetId));

      const newStarterId = `player_b_${sub.id}_${sub.number || 1}`;
      const newPitchPlayer: Token = {
        id: newStarterId,
        type: "player_b",
        name: sub.name,
        number: sub.number,
        role: sub.role || "Titulaire",
        status: (sub.status as any) || "normal",
        photo: sub.photo,
        x: 75,
        y: 50,
      };

      setKeyframes((prev) => {
        const copy = [...prev];
        const activeFrame = copy[currentFrameIdx] || [];
        copy[currentFrameIdx] = [...activeFrame, newPitchPlayer];
        return copy;
      });
    } else {
      const sub = substitutes.find((s) => s.id === targetId);
      if (!sub) return;

      setSubstitutes((prev) => prev.filter((s) => s.id !== targetId));

      const newStarterId = `player_a_${sub.id}_${sub.number || 1}`;
      const newPitchPlayer: Token = {
        id: newStarterId,
        type: "player_a",
        name: sub.name,
        number: sub.number,
        role: sub.role || "Titulaire",
        status: (sub.status as any) || "normal",
        photo: sub.photo,
        x: 25,
        y: 50,
        ...(sub.rosterId ? { rosterId: sub.rosterId } : {}),
      };

      setKeyframes((prev) => {
        const copy = [...prev];
        const activeFrame = copy[currentFrameIdx] || [];
        copy[currentFrameIdx] = [...activeFrame, newPitchPlayer];
        return copy;
      });
    }
  }
}
