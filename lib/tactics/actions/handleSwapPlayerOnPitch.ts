// Tableau tactique : ancien handleSwapPlayerOnPitch() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { type LivePeriod } from "@/lib/tactics/livePeriods";
import { type Token } from "@/lib/tactics/types";

export interface HandleSwapPlayerOnPitchCtx {
  currentFrameIdx: number;
  eventPeriodLabel: LivePeriod | "PAUSE";
  isLiveMatchMode: boolean;
  liveTimerSeconds: number;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setMatchEvents: React.Dispatch<React.SetStateAction<{ id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[]>>;
  setOpponentSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
  setQuickActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSubPickerToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSubstitutes: React.Dispatch<React.SetStateAction<any[]>>;
}

export function handleSwapPlayerOnPitch(boardCtx: HandleSwapPlayerOnPitchCtx, originalToken: Token, newSub: any, opts?: { eventId?: string; noEvent?: boolean; remote?: boolean }) {
  const { currentFrameIdx, eventPeriodLabel, isLiveMatchMode, liveTimerSeconds, setKeyframes, setMatchEvents, setOpponentSubstitutes, setQuickActionToken, setSubPickerToken, setSubstitutes } = boardCtx;
  const isOpponent = originalToken.type === "player_b";

  // 1. Replace token on pitch
  setKeyframes((prev) => {
    const copy = [...prev];
    const activeFrame = copy[currentFrameIdx] || [];
    copy[currentFrameIdx] = activeFrame.map((t) => {
      if (t.id === originalToken.id) {
        return {
          ...t,
          name: newSub.name,
          number: newSub.number,
          role: newSub.role,
          status: newSub.status || "normal",
          photo: newSub.photo,
          rosterId: isOpponent ? undefined : newSub.rosterId
        };
      }
      return t;
    });
    return copy;
  });

  // 2. Put original player into appropriate substitutes list, and remove incoming sub from bench
  if (isOpponent) {
    setOpponentSubstitutes((prev) => {
      const withoutSub = prev.filter((s) => s.id !== newSub.id && (!newSub.name || s.name.toLowerCase() !== newSub.name.toLowerCase()));
      const exists = withoutSub.some((s) => s.name.toLowerCase() === originalToken.name.toLowerCase());
      if (!exists) {
        return [
          {
            id: originalToken.id || `opp_sub_${Date.now()}`,
            name: originalToken.name,
            number: originalToken.number || 1,
            role: originalToken.role || "SUB",
            status: "normal",
            removalReason: "normal",
            type: "player_b",
            photo: originalToken.photo
          },
          ...withoutSub
        ];
      }
      return withoutSub;
    });
  } else {
    setSubstitutes((prev) => {
      const withoutSub = prev.filter((s) => s.id !== newSub.id && (!newSub.name || s.name.toLowerCase() !== newSub.name.toLowerCase()));
      const exists = withoutSub.some((s) => s.name.toLowerCase() === originalToken.name.toLowerCase());
      if (!exists) {
        return [
          {
            id: originalToken.id || `sub_${Date.now()}`,
            name: originalToken.name,
            number: originalToken.number || 1,
            role: originalToken.role || "SUB",
            status: "normal",
            removalReason: "normal",
            type: originalToken.type,
            photo: originalToken.photo,
            ...(originalToken.rosterId ? { rosterId: originalToken.rosterId } : {})
          },
          ...withoutSub
        ];
      }
      return withoutSub;
    });
  }

  if ((isLiveMatchMode || opts?.eventId) && !opts?.noEvent) {
    const timeFormatted = `${Math.floor(liveTimerSeconds / 60)}'`;
    const isHome = originalToken.type === "player_a";
    setMatchEvents((prev) => [
      {
        id: opts?.eventId || `evt_${Date.now()}`,
        ...(opts?.eventId ? { outId: originalToken.id, remote: opts.remote } : {}),
        time: timeFormatted,
        period: eventPeriodLabel,
        type: "sub" as const,
        player: `${originalToken.name} ➔ ${newSub.name}`,
        number: newSub.number,
        team: isHome ? "home" : "away",
        note: "Remplacement 🔄"
      },
      ...prev
    ]);
  }

  setQuickActionToken(null);
  setSubPickerToken(null);
}
