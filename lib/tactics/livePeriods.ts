// Tableau tactique, mode live : périodes de jeu et pause selon le sport et le format.
import { getFormatPeriodSeconds } from "@/lib/gameFormats";

// Mode live : durée de la pause (mi-temps) entre les deux moitiés du match
export const HALFTIME_BREAK_SECONDS = 15 * 60;

// Périodes de jeu du mode live selon le sport.
// "MI-TEMPS" est la pause, placée après la période d'index breakAfterIndex.
export type LivePeriod = "1MT" | "2MT" | "QT1" | "QT2" | "QT3" | "QT4" | "MI-TEMPS" | "FIN";
export interface LivePeriodConfig {
  periods: LivePeriod[];
  periodSeconds: number;
  breakAfterIndex: number;
}
export const getLivePeriodConfig = (sport: string, format?: string): LivePeriodConfig => {
  // Formats réduits (foot à 8 / à 5, rugby à 7) : 2 mi-temps de durée propre au format
  const formatSeconds = getFormatPeriodSeconds(sport, format);
  if (formatSeconds) return { periods: ["1MT", "2MT"], periodSeconds: formatSeconds, breakAfterIndex: 0 };
  switch (sport) {
    case "basketball":
      // 4 quart-temps de 20 minutes, pause entre QT2 et QT3
      return { periods: ["QT1", "QT2", "QT3", "QT4"], periodSeconds: 20 * 60, breakAfterIndex: 1 };
    case "rugby":
      return { periods: ["1MT", "2MT"], periodSeconds: 40 * 60, breakAfterIndex: 0 };
    case "handball":
      return { periods: ["1MT", "2MT"], periodSeconds: 30 * 60, breakAfterIndex: 0 };
    default:
      // Football (et autres sports) : 2 mi-temps de 45 minutes
      return { periods: ["1MT", "2MT"], periodSeconds: 45 * 60, breakAfterIndex: 0 };
  }
};
