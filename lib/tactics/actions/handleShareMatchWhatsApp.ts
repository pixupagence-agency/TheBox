// Tableau tactique : ancien handleShareMatchWhatsApp() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import { formatMatchDateTime } from "@/lib/dateFormat";

export interface HandleShareMatchWhatsAppCtx {
  activeMatch: any;
  activeSport: string;
  awayScore: number;
  formatLiveTime: (totalSecs: number) => string;
  homeScore: number;
  liveTimerSeconds: number;
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  tacticalNotes: string;
}

export function handleShareMatchWhatsApp(boardCtx: HandleShareMatchWhatsAppCtx) {
  const { activeMatch, activeSport, awayScore, formatLiveTime, homeScore, liveTimerSeconds, matchEvents, tacticalNotes } = boardCtx;
  const goalsEvts = matchEvents.filter((e) => e.type === "goal");
  const cardsEvts = matchEvents.filter((e) => e.type === "yellow" || e.type === "red");
  const subsEvts = matchEvents.filter((e) => e.type === "sub");

  let msg = `🏆 *BILAN DU MATCH* : ${activeMatch?.homeTeam || "Domicile"} vs ${activeMatch?.awayTeam || "Extérieur"}\n`;
  msg += `📊 *Score Final :* ${homeScore} - ${awayScore}\n`;
  if (activeMatch?.competition) {
    msg += `🏆 *Compétition :* ${activeMatch.competition}\n`;
  }
  if (formatMatchDateTime(activeMatch)) {
    msg += `📅 *Date & Heure :* ${formatMatchDateTime(activeMatch)}\n`;
  }
  msg += `⏱️ *Temps de jeu :* ${formatLiveTime(liveTimerSeconds)}\n\n`;

  if (goalsEvts.length > 0) {
    const headerTitle = activeSport === "rugby"
      ? "🏉 *Points & Marqueurs :*"
      : activeSport === "basketball"
        ? "🏀 *Paniers & Points :*"
        : activeSport === "handball"
          ? "🤾 *Buteurs :*"
          : "⚽ *Buteurs :*";
    msg += `${headerTitle}\n`;
    goalsEvts.forEach((g) => {
      const passeurStr = g.assister ? ` (Passe : ${g.assister})` : "";
      const noteStr = g.note ? ` [${g.note}]` : "";
      msg += `  • ${g.player}${noteStr}${passeurStr} ${g.time ? `(${g.period ? `${g.period} ` : ''}${g.time})` : ""}\n`;
    });
    msg += `\n`;
  }

  if (cardsEvts.length > 0) {
    msg += `🟨 *Sanctions :*\n`;
    cardsEvts.forEach((c) => {
      msg += `  • ${c.type === "red" ? "🟥 Carton Rouge" : "🟨 Carton Jaune"} : ${c.player} ${c.time ? `(${c.time})` : ""}\n`;
    });
    msg += `\n`;
  }

  if (subsEvts.length > 0) {
    msg += `🔄 *Remplacements :*\n`;
    subsEvts.forEach((s) => {
      msg += `  • ${s.player} ${s.time ? `(${s.time})` : ""}\n`;
    });
    msg += `\n`;
  }

  if (tacticalNotes && tacticalNotes.trim()) {
    msg += `📝 *Note & Causerie du Coach :*\n${tacticalNotes.trim()}\n\n`;
  }

  msg += `⚡ *Partagé via THE BOX TAC TIK PRO*`;

  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}
