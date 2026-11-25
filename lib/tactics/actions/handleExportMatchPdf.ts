// Tableau tactique : ancien handleExportMatchPdf() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { formatMatchDateTime } from "@/lib/dateFormat";
import { exportMatchPdf, type MatchPdfPlayer, type MatchPdfSchema, type MatchPdfSquad } from "@/lib/matchPdf";
import { WALL_DEFAULT, type WallTeam } from "@/lib/setPieceWall";
import { getPlayerRoleCodes, getSportRoles } from "@/lib/sportRoles";
import { type CoachProfile, type SetPieceRoleConfig, type TeamCategory, type Token } from "@/lib/tactics/types";

export interface HandleExportMatchPdfCtx {
  activeCoach: CoachProfile;
  activeMatch: any;
  activeMatchId: string;
  activeSport: string;
  activeTeam: TeamCategory | undefined;
  clubLogo: string;
  currentTokens: Token[];
  displayClubTitle: any;
  findWall: (team: WallTeam, tokens?: Token[]) => Token | undefined;
  hasActiveMatch: boolean;
  isExportingMatchPdf: boolean;
  isFootballBoard: boolean;
  isProOrAdmin: boolean;
  preloadExportPortraits: (tokens: any[], sport: string) => Promise<void>;
  renderCompositeTacticsCanvas: (schemaOverride?: any, frameIndexOverride?: number | undefined, tokensOverride?: any[] | undefined) => HTMLCanvasElement | null;
  savedTactics: any[];
  schemaBelongsToMatch: (sc: { matchId?: string | undefined; }, matchId: string) => boolean;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExportingMatchPdf: React.Dispatch<React.SetStateAction<boolean>>;
  setPieceRoles: SetPieceRoleConfig;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  substitutes: any[];
  tacticalNotes: string;
  wallMembers: (team: WallTeam, count: number, tokens?: Token[]) => (Token | null)[];
}

export async function handleExportMatchPdf(boardCtx: HandleExportMatchPdfCtx) {
  const { activeCoach, activeMatch, activeMatchId, activeSport, activeTeam, clubLogo, currentTokens, displayClubTitle, findWall, hasActiveMatch, isExportingMatchPdf, isFootballBoard, isProOrAdmin, preloadExportPortraits, renderCompositeTacticsCanvas, savedTactics, schemaBelongsToMatch, setIsCheckoutOpen, setIsExportingMatchPdf, setPieceRoles, setSleekToastMessage, substitutes, tacticalNotes, wallMembers } = boardCtx;
  if (!isProOrAdmin) {
    setSleekToastMessage("🔒 L'export PDF du match est réservé aux formules PRO & PRO+.");
    setIsCheckoutOpen(true);
    return;
  }
  if (isExportingMatchPdf) return;
  setIsExportingMatchPdf(true);
  try {
    const matchSchemas = savedTactics.filter((s) => schemaBelongsToMatch(s, activeMatchId));
    const collectFrameTokens = (frames: any[] | undefined): any[] =>
      (frames || []).flatMap((frame: any) => (Array.isArray(frame) ? frame : frame?.players || []));
    await Promise.all(
      matchSchemas.map((s) => preloadExportPortraits(collectFrameTokens(s.keyframes).concat(s.players || [], s.tokens || []), s.sport || activeSport))
    );

    const schemas: MatchPdfSchema[] = matchSchemas.map((s) => {
      const isAnim = Boolean(s.isAnimation || (s.keyframes && s.keyframes.length > 1));
      let image: string | undefined;
      let imageWidth: number | undefined;
      let imageHeight: number | undefined;
      try {
        const source = renderCompositeTacticsCanvas(s);
        if (source) {
          // Recadrage au plus près du terrain : sans le bandeau (85 px, déjà repris par le PDF) ni les marges
          // sombres (35 px sur les côtés, 15 px en haut, 25 px en bas), on garde 10 px autour des lignes
          // pour les joueurs posés sur le bord. Le terrain occupe ainsi quasiment toute la page.
          const keep = 10;
          const cropX = Math.max(0, 35 - keep);
          const cropTop = Math.min(85 + 15 - keep, Math.max(0, source.height - 1));
          const srcW = Math.max(1, source.width - cropX * 2);
          const srcH = Math.max(1, source.height - cropTop - (25 - keep));
          // Image réduite et compressée : le PDF reste léger même avec beaucoup de schémas
          const scale = Math.min(1, 2400 / srcW);
          const out = document.createElement("canvas");
          out.width = Math.round(srcW * scale);
          out.height = Math.round(srcH * scale);
          const outCtx = out.getContext("2d");
          if (outCtx) {
            outCtx.imageSmoothingQuality = "high";
            outCtx.drawImage(source, cropX, cropTop, srcW, srcH, 0, 0, out.width, out.height);
            image = out.toDataURL("image/jpeg", 0.88);
            imageWidth = out.width;
            imageHeight = out.height;
          }
        }
      } catch (e) {
        console.warn("Image du schéma indisponible pour le PDF", e);
      }
      return {
        name: s.name,
        date: s.date,
        description: s.description,
        isAnimation: isAnim,
        steps: isAnim ? s.keyframes?.length : undefined,
        image,
        imageWidth,
        imageHeight,
      };
    });

    const matchTitle = hasActiveMatch
      ? `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}`
      : `Schémas hors match - ${activeTeam?.name || displayClubTitle}`;
    const slug = matchTitle
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const coachName = [activeCoach?.firstName, activeCoach?.lastName].filter(Boolean).join(" ");

    // Groupe de joueurs (titulaires sur le terrain + remplaçants) et rôles attribués pour la rencontre
    const sportRolesDef = getSportRoles(activeSport);
    const homeWall = isFootballBoard ? findWall("home") : undefined;
    const homeWallMembers = homeWall ? wallMembers("home", homeWall.wallCount || WALL_DEFAULT) : [];
    const byNumber = (a: { number?: number }, b: { number?: number }) => (a.number ?? 999) - (b.number ?? 999);
    const toPdfPlayer = (p: { name: string; number?: number; role?: string; status?: string }, inWall: boolean): MatchPdfPlayer => ({
      number: p.number,
      name: p.name,
      position: p.role,
      status: p.status,
      roles: [
        ...(p.name && setPieceRoles.captain === p.name ? ["C"] : []),
        ...getPlayerRoleCodes(activeSport, setPieceRoles, p.name).map((r) => r.code),
        ...(inWall ? ["MUR"] : []),
      ],
    });
    const pitchPlayers = currentTokens.filter((t) => t.type === "player_a").sort(byNumber);
    const playerLabel = (name: string) => {
      const p = pitchPlayers.find((t) => t.name === name) || substitutes.find((s) => s.name === name);
      return p?.number !== undefined ? `N°${p.number} · ${name}` : name;
    };
    const squad: MatchPdfSquad = {
      teamName: hasActiveMatch ? activeMatch.homeTeam || activeTeam?.name || displayClubTitle : activeTeam?.name || displayClubTitle,
      starters: pitchPlayers.map((p) => toPdfPlayer(p, Boolean(homeWall) && typeof p.wallSlot === "number")),
      substitutes: [...substitutes].sort(byNumber).map((s) => toPdfPlayer(s, false)),
      roles: sportRolesDef.roles.map((r) => ({
        label: r.label,
        badge: r.badge,
        player: setPieceRoles[r.key] ? playerLabel(setPieceRoles[r.key]) : undefined,
      })),
      wall: homeWall
        ? {
          places: homeWall.wallCount || WALL_DEFAULT,
          players: homeWallMembers.filter((m): m is Token => !!m).map((m) => (m.number !== undefined ? `N°${m.number} · ${m.name}` : m.name)),
        }
        : undefined,
    };

    await exportMatchPdf({
      squad,
      matchTitle,
      competition: hasActiveMatch ? activeMatch.competition : undefined,
      dateTime: hasActiveMatch ? formatMatchDateTime(activeMatch) || undefined : undefined,
      clubName: activeTeam?.name || displayClubTitle,
      clubLogo: clubLogo || undefined,
      sport: activeSport,
      coachName: coachName || undefined,
      notes: tacticalNotes,
      schemas,
      fileName: `TheBox_${slug || "Match"}.pdf`,
    });
    setSleekToastMessage("📄 Dossier du match exporté en PDF.");
  } catch (err) {
    console.error("Export PDF du match impossible", err);
    setSleekToastMessage("⚠️ L'export PDF a échoué. Réessayez.");
  } finally {
    setIsExportingMatchPdf(false);
  }
}
