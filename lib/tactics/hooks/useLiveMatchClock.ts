"use client";
// Tableau tactique, mode Live : périodes du sport, chrono du match, compte à rebours de la pause et score.
// L'état (score, chrono, période, pause) est mémorisé sur l'appareil pour chaque match.
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { HALFTIME_BREAK_SECONDS, type LivePeriod, getLivePeriodConfig } from "@/lib/tactics/livePeriods";
import { safeLocalStorageSetItem } from "@/lib/tactics/storage";

interface SavedMatchState {
  homeScore?: number;
  awayScore?: number;
  liveTimerSeconds?: number;
  currentPeriod?: LivePeriod;
  halftimeSecondsLeft?: number;
}

/** État du match actif enregistré sur l'appareil (lu une seule fois, au montage du tableau) */
function readSavedMatchState(): SavedMatchState {
  if (typeof window === "undefined") return {};
  try {
    const matchId = localStorage.getItem("thebox_active_match_id") || "match_1";
    const saved = JSON.parse(localStorage.getItem(`thebox_match_state_${matchId}`) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

/** 754 s → « 12:34 » */
export const formatLiveTime = (totalSecs: number) => {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

interface Options {
  activeSport: string;
  activeFormat?: string;
  activeMatchId: string;
  isLiveMatchMode: boolean;
  /** Fin du compte à rebours de la pause : le coach est prévenu (période suivante à lancer) */
  onBreakEnd: (nextPeriod: LivePeriod | undefined) => void;
}

export function useLiveMatchClock({ activeSport, activeFormat, activeMatchId, isLiveMatchMode, onBreakEnd }: Options) {
  const [saved] = useState(readSavedMatchState);

  // Périodes de jeu du sport actif (football : 2 MT de 45 min ; basket : 4 QT de 20 min)
  const livePeriodConfig = useMemo(() => getLivePeriodConfig(activeSport, activeFormat), [activeSport, activeFormat]);
  const firstLivePeriod = livePeriodConfig.periods[0];

  const [isLiveTimerRunning, setIsLiveTimerRunning] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<LivePeriod>(() => saved.currentPeriod || firstLivePeriod);
  const [liveTimerSeconds, setLiveTimerSeconds] = useState<number>(() => saved.liveTimerSeconds || 0);
  // Mi-temps : compte à rebours de 15 minutes lancé au clic sur PAUSE
  const [halftimeSecondsLeft, setHalftimeSecondsLeft] = useState<number>(() =>
    typeof saved.halftimeSecondsLeft === "number" ? saved.halftimeSecondsLeft : HALFTIME_BREAK_SECONDS
  );
  const [isHalftimeRunning, setIsHalftimeRunning] = useState(false);
  const [homeScore, setHomeScore] = useState<number>(() => saved.homeScore || 0);
  const [awayScore, setAwayScore] = useState<number>(() => saved.awayScore || 0);

  // Si la période enregistrée appartient à un autre sport (ex. "1MT" en basket), on la convertit
  // (ajusté pendant le rendu, sans effet)
  if (currentPeriod !== "MI-TEMPS" && currentPeriod !== "FIN" && !livePeriodConfig.periods.includes(currentPeriod)) {
    const secondHalf = currentPeriod === "2MT" || currentPeriod === "QT3" || currentPeriod === "QT4";
    const converted = livePeriodConfig.periods[secondHalf ? livePeriodConfig.breakAfterIndex + 1 : 0];
    if (converted) setCurrentPeriod(converted);
  }

  // Mémorisation par match (scores, chrono, période, pause)
  useEffect(() => {
    if (!activeMatchId) return;
    safeLocalStorageSetItem(
      `thebox_match_state_${activeMatchId}`,
      JSON.stringify({ homeScore, awayScore, liveTimerSeconds, currentPeriod, halftimeSecondsLeft })
    );
  }, [homeScore, awayScore, liveTimerSeconds, currentPeriod, halftimeSecondsLeft, activeMatchId]);

  // Chrono du match : il continue au-delà de la durée de la période (temps additionnel),
  // l'affichage passe alors en rouge (ex. football 1MT : après 45:00 ; basket QT1 : après 20:00).
  useEffect(() => {
    if (!isLiveMatchMode || !isLiveTimerRunning) return;
    const interval = setInterval(() => setLiveTimerSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isLiveMatchMode, isLiveTimerRunning]);

  // Compte à rebours de la pause : une seconde de moins chaque seconde ; à zéro, la pause s'arrête
  const tickBreak = useEffectEvent(() => {
    if (halftimeSecondsLeft > 1) {
      setHalftimeSecondsLeft(halftimeSecondsLeft - 1);
      return;
    }
    setHalftimeSecondsLeft(0);
    setIsHalftimeRunning(false);
    onBreakEnd(livePeriodConfig.periods[livePeriodConfig.breakAfterIndex + 1]);
  });
  useEffect(() => {
    if (!isLiveMatchMode || !isHalftimeRunning || currentPeriod !== "MI-TEMPS") return;
    const interval = setInterval(() => tickBreak(), 1000);
    return () => clearInterval(interval);
  }, [isLiveMatchMode, isHalftimeRunning, currentPeriod]);

  // Temps réglementaire de la période en cours dépassé (affichage en rouge)
  const currentPeriodIndex = livePeriodConfig.periods.indexOf(currentPeriod);
  const isPeriodOvertime =
    currentPeriodIndex >= 0 && liveTimerSeconds > (currentPeriodIndex + 1) * livePeriodConfig.periodSeconds;
  const isHalftime = currentPeriod === "MI-TEMPS";

  // Libellés de la pause : en basket on parle de « PAUSE » (pas de mi-temps), sinon de mi-temps
  const isBasketLive = activeSport === "basketball";
  const breakShortLabel: "PAUSE" | "MT" = isBasketLive ? "PAUSE" : "MT";
  const breakLongLabel: "Pause" | "Mi-temps" = isBasketLive ? "Pause" : "Mi-temps";
  // Période inscrite sur les événements du match (buts, cartons, remplacements…)
  const eventPeriodLabel: LivePeriod | "PAUSE" = isHalftime && isBasketLive ? "PAUSE" : currentPeriod;

  // Boutons de période affichés : périodes de jeu avec la pause insérée au bon endroit
  // (football : 1MT | PAUSE | 2MT ; basket : QT1 | QT2 | PAUSE | QT3 | QT4)
  const livePeriodButtons: LivePeriod[] = [
    ...livePeriodConfig.periods.slice(0, livePeriodConfig.breakAfterIndex + 1),
    "MI-TEMPS",
    ...livePeriodConfig.periods.slice(livePeriodConfig.breakAfterIndex + 1),
  ];

  // Changement de période depuis les boutons de période
  const handleSelectLivePeriod = (period: LivePeriod) => {
    if (period === "MI-TEMPS") {
      // Pause : le chrono du match s'arrête et le compte à rebours de 15 minutes démarre
      setIsLiveTimerRunning(false);
      if (currentPeriod !== "MI-TEMPS") setHalftimeSecondsLeft(HALFTIME_BREAK_SECONDS);
      setIsHalftimeRunning(true);
    } else {
      setIsHalftimeRunning(false);
      // Chaque nouvelle période repart de son début théorique (ex. 2MT à 45:00, QT3 à 40:00),
      // quel que soit le temps additionnel de la précédente
      const index = livePeriodConfig.periods.indexOf(period);
      if (index > 0 && period !== currentPeriod) setLiveTimerSeconds(index * livePeriodConfig.periodSeconds);
      setIsLiveTimerRunning(true);
    }
    setCurrentPeriod(period);
  };

  return {
    livePeriodConfig, firstLivePeriod, livePeriodButtons,
    isLiveTimerRunning, setIsLiveTimerRunning,
    currentPeriod, setCurrentPeriod, currentPeriodIndex, isPeriodOvertime, isHalftime, eventPeriodLabel,
    liveTimerSeconds, setLiveTimerSeconds,
    halftimeSecondsLeft, setHalftimeSecondsLeft, isHalftimeRunning, setIsHalftimeRunning,
    homeScore, setHomeScore, awayScore, setAwayScore,
    isBasketLive, breakShortLabel, breakLongLabel,
    handleSelectLivePeriod,
  };
}
