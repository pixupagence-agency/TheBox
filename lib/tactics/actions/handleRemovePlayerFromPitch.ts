// Tableau tactique : ancien handleRemovePlayerFromPitch() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { type LivePeriod } from "@/lib/tactics/livePeriods";
import { type Token } from "@/lib/tactics/types";

export interface HandleRemovePlayerFromPitchCtx {
  currentFrameIdx: number;
  eventPeriodLabel: LivePeriod | "PAUSE";
  isLiveMatchMode: boolean;
  liveTimerSeconds: number;
  setEditingToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setMatchEvents: React.Dispatch<React.SetStateAction<{ id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[]>>;
  setOpponentSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setQuickActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSubPickerToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
}

export function handleRemovePlayerFromPitch(boardCtx: HandleRemovePlayerFromPitchCtx, tokenToRemove: Token, reason: "normal" | "injured" | "red_card") {
  const { currentFrameIdx, eventPeriodLabel, isLiveMatchMode, liveTimerSeconds, setEditingToken, setKeyframes, setMatchEvents, setOpponentSubstitutes, setQuickActionToken, setSubPickerToken, setSubstitutes } = boardCtx;
  const isOpponent = tokenToRemove.type === "player_b";

  // 1. Remove from current active frame
  setKeyframes((prev) => {
    const copy = [...prev];
    const activeFrame = copy[currentFrameIdx] || [];
    copy[currentFrameIdx] = activeFrame.filter((t) => t.id !== tokenToRemove.id);
    return copy;
  });

  const targetStatus = reason === "injured" ? "injured" : reason === "red_card" ? "red_card" : "normal";

  // 2. Update or add player in appropriate substitutes list
  if (isOpponent) {
    setOpponentSubstitutes((prev) => {
      const existsIndex = prev.findIndex(
        (s) => s.name.toLowerCase() === tokenToRemove.name.toLowerCase() || s.id === tokenToRemove.id
      );

      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = {
          ...copy[existsIndex],
          status: targetStatus,
          removalReason: reason
        };
        return copy;
      } else {
        return [
          {
            id: tokenToRemove.id || `opp_sub_${Date.now()}`,
            name: tokenToRemove.name,
            number: tokenToRemove.number || 1,
            role: tokenToRemove.role || "SUB",
            status: targetStatus,
            removalReason: reason,
            type: "player_b",
            photo: tokenToRemove.photo
          },
          ...prev
        ];
      }
    });
  } else {
    setSubstitutes((prev) => {
      const existsIndex = prev.findIndex(
        (s) => s.name.toLowerCase() === tokenToRemove.name.toLowerCase() || s.id === tokenToRemove.id
      );

      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = {
          ...copy[existsIndex],
          status: targetStatus,
          removalReason: reason
        };
        return copy;
      } else {
        return [
          {
            id: tokenToRemove.id || `sub_${Date.now()}`,
            name: tokenToRemove.name,
            number: tokenToRemove.number || 1,
            role: tokenToRemove.role || "SUB",
            status: targetStatus,
            removalReason: reason,
            type: tokenToRemove.type,
            photo: tokenToRemove.photo,
            ...(tokenToRemove.rosterId ? { rosterId: tokenToRemove.rosterId } : {})
          },
          ...prev
        ];
      }
    });
  }

  // Record event in Live Match Mode
  if (isLiveMatchMode) {
    const timeFormatted = `${Math.floor(liveTimerSeconds / 60)}'`;
    const isHome = tokenToRemove.type === "player_a";
    if (reason === "red_card") {
      setMatchEvents((prev) => [
        {
          id: `evt_${Date.now()}`,
          time: timeFormatted,
          period: eventPeriodLabel,
          type: "red" as const,
          player: tokenToRemove.name,
          number: tokenToRemove.number,
          team: isHome ? "home" : "away",
          note: "Expulsion Carton Rouge 🟥"
        },
        ...prev
      ]);
    } else if (reason === "injured") {
      setMatchEvents((prev) => [
        {
          id: `evt_${Date.now()}`,
          time: timeFormatted,
          period: eventPeriodLabel,
          type: "sub" as const,
          player: tokenToRemove.name,
          number: tokenToRemove.number,
          team: isHome ? "home" : "away",
          note: "Sortie sur blessure 🏥"
        },
        ...prev
      ]);
      if (isLiveMatchMode) {
        setQuickActionToken(tokenToRemove);
        setSubPickerToken(tokenToRemove);
      }
    }
  }

  setEditingToken(null);
}
