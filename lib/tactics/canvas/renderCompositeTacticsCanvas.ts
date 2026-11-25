// Tableau tactique : ancien renderCompositeTacticsCanvas() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { formatMatchDateTime } from "@/lib/dateFormat";
import { drawFootballThirds, drawFootballZones, drawSmallFootballPitch, getCenterCircleRadiusRatio, getFootballFieldRect, getSmallPitchSpec, resolveGameFormat } from "@/lib/gameFormats";
import { WALL_DEFAULT, WALL_MAX, WALL_MIN, effectiveWallAngle, type WallTeam } from "@/lib/setPieceWall";
import { LINK_COLORS } from "@/lib/tactics/constants";
import { ZONE_FILL_ALPHA, getSportRatioNum, isCurveTool, strokeCurveArrow, type Pt } from "@/lib/tactics/pitchGeometry";
import { type CoachProfile, type DrawingAction, type Token } from "@/lib/tactics/types";

export interface RenderCompositeTacticsCanvasCtx {
  activeCoach: CoachProfile;
  activeMatch: any;
  activeMatchId: string;
  activeSport: string;
  awayScore: number;
  clubLogoImgRef: React.RefObject<HTMLImageElement | null>;
  currentTokens: Token[];
  displayClubTitle: any;
  drawingActions: DrawingAction[];
  drawWrappedCanvasText: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines?: number) => void;
  exportImageCacheRef: React.RefObject<Record<string, HTMLImageElement>>;
  formatFor: (sport: string) => string;
  formatLiveTime: (totalSecs: number) => string;
  getTokenPortraitSrc: (token: any, sport: string) => string;
  hasActiveMatch: boolean;
  homeScore: number;
  isInWall: (t: Token, tokens: Token[]) => boolean;
  isLiveMatchMode: boolean;
  keyframes: Token[][];
  liveTimerSeconds: number;
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  pitchThirdsLabels: [string, string, string];
  playerRepresentation: "dot" | "jersey" | "head";
  savedTactics: any[];
  schemaBelongsToMatch: (sc: { matchId?: string | undefined; }, matchId: string) => boolean;
  showBall: boolean;
  showClubLogoOnPitch: boolean;
  showOpponents: boolean;
  showPitchThirds: boolean;
  showPitchZones: boolean;
  showPlayerNames: boolean;
  tacticalNotes: string;
  teamAColor: string;
  teamBColor: string;
  wallMembers: (team: WallTeam, count: number, tokens?: Token[]) => (Token | null)[];
}

export function renderCompositeTacticsCanvas(boardCtx: RenderCompositeTacticsCanvasCtx, schemaOverride?: any, frameIndexOverride?: number, tokensOverride?: any[]): HTMLCanvasElement | null {
  const { activeCoach, activeMatch, activeMatchId, activeSport, awayScore, clubLogoImgRef, currentTokens, displayClubTitle, drawingActions, drawWrappedCanvasText, exportImageCacheRef, formatFor, formatLiveTime, getTokenPortraitSrc, hasActiveMatch, homeScore, isInWall, isLiveMatchMode, keyframes, liveTimerSeconds, matchEvents, pitchThirdsLabels, playerRepresentation, savedTactics, schemaBelongsToMatch, showBall, showClubLogoOnPitch, showOpponents, showPitchThirds, showPitchZones, showPlayerNames, tacticalNotes, teamAColor, teamBColor, wallMembers } = boardCtx;
  const isMatchReport = !schemaOverride && (isLiveMatchMode || matchEvents.length > 0);
  // Match réellement paramétré (sans match, activeMatch n'est qu'un modèle « MON EQUIPE vs ADVERSAIRE »)
  const exportMatch = hasActiveMatch ? activeMatch : null;
  const targetSport = schemaOverride?.sport || activeSport;
  const sportKey = targetSport.toLowerCase();
  // Un schéma enregistré garde son format ; sans format, c'est le format historique (à 11 / à XV)
  const targetFormat = schemaOverride?.sport ? resolveGameFormat(targetSport, schemaOverride.format) : formatFor(targetSport);
  const exportSmallPitch = getSmallPitchSpec(targetSport, targetFormat);
  const sportRatio = getSportRatioNum(targetSport, targetFormat);

  // Compute standard, mathematically exact pitch dimensions based on the sport ratio
  const pitchH = 760;
  const pitchW = Math.round(pitchH * sportRatio);
  const paddingX = 35;
  const headerH = 85;
  const paddingYTop = 15;
  const paddingYBottom = 25;
  const footerH = isMatchReport ? 280 : 0;

  const w = pitchW + paddingX * 2;
  const h = headerH + paddingYTop + pitchH + paddingYBottom + footerH;

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = w;
  exportCanvas.height = h;
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) return null;

  const targetTitle = schemaOverride?.name || (exportMatch ? `${exportMatch.homeTeam} VS ${exportMatch.awayTeam}` : `Schéma tactique ${targetSport}`);
  const targetClub = schemaOverride?.teamName || displayClubTitle;

  // 1. Dark Background
  ctx.fillStyle = "#090d14";
  ctx.fillRect(0, 0, w, h);

  // Header bar (Height 85px)
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, w, headerH);

  ctx.strokeStyle = "#00E599";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, headerH);
  ctx.lineTo(w, headerH);
  ctx.stroke();

  // Nom de l'application, en haut à gauche
  ctx.fillStyle = "#00E599";
  ctx.font = "900 13px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("The Box - Zone de Décision Tactique", 30, 24);

  // Titre du schéma / du match
  ctx.fillStyle = "#f8fafc";
  ctx.font = "900 20px system-ui, sans-serif";
  ctx.fillText(`🏆 ${targetTitle.toUpperCase()}`, 30, 50);

  // Subtitle
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "700 12px system-ui, sans-serif";
  const matchSubInfo = exportMatch
    ? `Compétition : ${exportMatch.competition || "Regular"}  |  Date & Heure : ${formatMatchDateTime(exportMatch) || "Prochainement"}`
    : `Sport : ${targetSport.toUpperCase()}  |  Club : ${targetClub}`;
  ctx.fillText(matchSubInfo, 30, 72);

  // Badge de score : uniquement sur le rapport de match (jamais sur les images de schémas partagées)
  if (isMatchReport && (exportMatch || homeScore > 0 || awayScore > 0)) {
    const scoreStr = `SCORE : ${homeScore} - ${awayScore}`;
    ctx.fillStyle = "#00E599";
    ctx.fillRect(w - 240, 20, 210, 45);
    ctx.fillStyle = "#0d1117";
    ctx.font = "900 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(scoreStr, w - 135, 48);
  } else {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.textAlign = "right";
    const rightHeader = `Coach : ${activeCoach?.firstName || "Coach"} ${activeCoach?.lastName || "Principal"}  |  Généré le ${new Date().toLocaleDateString(undefined)}`;
    ctx.fillText(rightHeader, w - 30, 48);
  }

  ctx.textAlign = "left";

  // Exact Pitch Area bounds (locked to official sport ratio)
  const pitchX = paddingX;
  const pitchY = headerH + paddingYTop;

  // Pitch Border & Sport-Specific Line markup
  if (sportKey === "basketball") {
    // Warm honey-orange maple wood parquet court background matching reference image
    const courtX = pitchX + pitchW * 0.021;
    const courtY = pitchY + pitchH * 0.033;
    const courtW = pitchW * 0.958;
    const courtH = pitchH * 0.934;

    // Parquet floor slats background
    const courtGrad = ctx.createLinearGradient(pitchX, pitchY, pitchX, pitchY + pitchH);
    courtGrad.addColorStop(0, "#f49f38");
    courtGrad.addColorStop(0.25, "#ea8323");
    courtGrad.addColorStop(0.5, "#f0942e");
    courtGrad.addColorStop(0.75, "#e07718");
    courtGrad.addColorStop(1, "#f6a540");
    ctx.fillStyle = courtGrad;
    ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

    // Slat separation lines
    ctx.strokeStyle = "rgba(180, 80, 10, 0.35)";
    ctx.lineWidth = 1;
    const slatCount = 14;
    for (let s = 1; s < slatCount; s++) {
      const sy = pitchY + (pitchH / slatCount) * s;
      ctx.beginPath();
      ctx.moveTo(pitchX, sy);
      ctx.lineTo(pitchX + pitchW, sy);
      ctx.stroke();
    }

    // Outer white boundary line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.strokeRect(courtX, courtY, courtW, courtH);

    // Center Line (crisp white)
    ctx.beginPath();
    ctx.moveTo(courtX + courtW / 2, courtY);
    ctx.lineTo(courtX + courtW / 2, courtY + courtH);
    ctx.stroke();

    // Center Circle (full white circle)
    ctx.beginPath();
    ctx.arc(courtX + courtW / 2, courtY + courtH / 2, courtH * 0.25, 0, 2 * Math.PI);
    ctx.stroke();

    // Key dimensions - placed fully inside the 3-point arc
    const keyW = courtW * 0.171;
    const keyH = courtH * 0.30;
    const keyY = courtY + (courtH - keyH) / 2;

    // Left Key (white rectangle)
    ctx.strokeRect(courtX, keyY, keyW, keyH);

    // Left Free throw circle (full white circle inside the 3-point arc)
    const ftRadius = keyH * 0.357;
    ctx.beginPath();
    ctx.arc(courtX + keyW, courtY + courtH / 2, ftRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Left Key Rebound Blocks (4 white blocks top, 4 bottom)
    ctx.fillStyle = "#ffffff";
    const blockW = keyW * 0.076;
    const blockH = keyH * 0.08;
    for (let b = 0; b < 4; b++) {
      const bx = courtX + keyW * (0.26 + b * 0.17);
      ctx.fillRect(bx, keyY - blockH, blockW, blockH);
      ctx.fillRect(bx, keyY + keyH, blockW, blockH);
    }

    // Left 3-Point Arc (grand rond - curves well past the key)
    ctx.beginPath();
    ctx.arc(courtX + keyW * 0.35, courtY + courtH / 2, courtH * 0.48, -Math.PI * 0.40, Math.PI * 0.40);
    ctx.stroke();

    // Left Backboard & Hoop (all white)
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(courtX + keyW * 0.22, keyY + keyH * 0.28);
    ctx.lineTo(courtX + keyW * 0.22, keyY + keyH * 0.72);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(courtX + keyW * 0.22, courtY + courtH / 2);
    ctx.lineTo(courtX + keyW * 0.31, courtY + courtH / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(courtX + keyW * 0.40, courtY + courtH / 2, 8, 0, 2 * Math.PI);
    ctx.stroke();

    // Right Key (white rectangle)
    ctx.strokeRect(courtX + courtW - keyW, keyY, keyW, keyH);

    // Right Free throw circle (full white circle inside the 3-point arc)
    ctx.beginPath();
    ctx.arc(courtX + courtW - keyW, courtY + courtH / 2, ftRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Right Key Rebound Blocks (4 white blocks top, 4 bottom)
    for (let b = 0; b < 4; b++) {
      const bx = courtX + courtW - keyW * (0.26 + b * 0.17) - blockW;
      ctx.fillRect(bx, keyY - blockH, blockW, blockH);
      ctx.fillRect(bx, keyY + keyH, blockW, blockH);
    }

    // Right 3-Point Arc (grand rond - curves well past the key)
    ctx.beginPath();
    ctx.arc(courtX + courtW - keyW * 0.35, courtY + courtH / 2, courtH * 0.48, Math.PI * 0.60, Math.PI * 1.40);
    ctx.stroke();

    // Right Backboard & Hoop (all white)
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(courtX + courtW - keyW * 0.22, keyY + keyH * 0.28);
    ctx.lineTo(courtX + courtW - keyW * 0.22, keyY + keyH * 0.72);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(courtX + courtW - keyW * 0.22, courtY + courtH / 2);
    ctx.lineTo(courtX + courtW - keyW * 0.31, courtY + courtH / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(courtX + courtW - keyW * 0.40, courtY + courtH / 2, 8, 0, 2 * Math.PI);
    ctx.stroke();

  } else if (sportKey === "handball") {
    // Slate court background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);

    // Center Line
    ctx.beginPath();
    ctx.moveTo(pitchX + pitchW / 2, pitchY);
    ctx.lineTo(pitchX + pitchW / 2, pitchY + pitchH);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pitchX + pitchW / 2, pitchY + pitchH / 2, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();

    // Left 6m zone (D-Zone)
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pitchX, pitchY + pitchH / 2, pitchH * 0.30, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Left 9m dashed free-throw line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(pitchX, pitchY + pitchH / 2, pitchH * 0.45, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right 6m zone
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pitchX + pitchW, pitchY + pitchH / 2, pitchH * 0.30, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();

    // Right 9m dashed free-throw line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(pitchX + pitchW, pitchY + pitchH / 2, pitchH * 0.45, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Goals
    ctx.strokeRect(pitchX - 10, pitchY + pitchH * 0.38, 10, pitchH * 0.24);
    ctx.strokeRect(pitchX + pitchW, pitchY + pitchH * 0.38, 10, pitchH * 0.24);

  } else if (sportKey === "rugby") {
    // Emerald grass background
    ctx.fillStyle = "#064e3b";
    ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;

    const tryZoneW = pitchW * 0.12;
    const playW = pitchW - 2 * tryZoneW;

    // Outer boundary and try lines
    ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);
    ctx.beginPath();
    ctx.moveTo(pitchX + tryZoneW, pitchY);
    ctx.lineTo(pitchX + tryZoneW, pitchY + pitchH);
    ctx.moveTo(pitchX + pitchW - tryZoneW, pitchY);
    ctx.lineTo(pitchX + pitchW - tryZoneW, pitchY + pitchH);
    ctx.stroke();

    // 50m Midfield line
    ctx.beginPath();
    ctx.moveTo(pitchX + pitchW / 2, pitchY);
    ctx.lineTo(pitchX + pitchW / 2, pitchY + pitchH);
    ctx.stroke();

    // 22m lines
    const line22W = playW * 0.22;
    ctx.beginPath();
    ctx.moveTo(pitchX + tryZoneW + line22W, pitchY);
    ctx.lineTo(pitchX + tryZoneW + line22W, pitchY + pitchH);
    ctx.moveTo(pitchX + pitchW - tryZoneW - line22W, pitchY);
    ctx.lineTo(pitchX + pitchW - tryZoneW - line22W, pitchY + pitchH);
    ctx.stroke();

    // 10m dashed lines
    const line10W = playW * 0.10;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(pitchX + pitchW / 2 - line10W, pitchY);
    ctx.lineTo(pitchX + pitchW / 2 - line10W, pitchY + pitchH);
    ctx.moveTo(pitchX + pitchW / 2 + line10W, pitchY);
    ctx.lineTo(pitchX + pitchW / 2 + line10W, pitchY + pitchH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Goal posts H
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pitchX + tryZoneW, pitchY + pitchH * 0.42);
    ctx.lineTo(pitchX + tryZoneW - 12, pitchY + pitchH * 0.42);
    ctx.lineTo(pitchX + tryZoneW - 12, pitchY + pitchH * 0.58);
    ctx.lineTo(pitchX + tryZoneW, pitchY + pitchH * 0.58);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pitchX + pitchW - tryZoneW, pitchY + pitchH * 0.42);
    ctx.lineTo(pitchX + pitchW - tryZoneW + 12, pitchY + pitchH * 0.42);
    ctx.lineTo(pitchX + pitchW - tryZoneW + 12, pitchY + pitchH * 0.58);
    ctx.lineTo(pitchX + pitchW - tryZoneW, pitchY + pitchH * 0.58);
    ctx.stroke();

  } else if (exportSmallPitch) {
    // Foot à 8 / foot à 5 : petit terrain tracé à partir de ses dimensions
    drawSmallFootballPitch(ctx, exportSmallPitch, pitchX, pitchY, pitchW, pitchH);
  } else {
    // DEFAULT / FOOTBALL FULL PITCH MARKINGS (Standard FIFA proportions matching 0 0 110 73 viewBox)
    // 1. Grass gradient background matching the actual board
    const pitchGrad = ctx.createLinearGradient(pitchX, pitchY, pitchX, pitchY + pitchH);
    pitchGrad.addColorStop(0, "#032e22");
    pitchGrad.addColorStop(1, "#053b2c");
    ctx.fillStyle = pitchGrad;
    ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

    // 2. Pitch Grass Stripes (12 vertical bands)
    const stripeW = pitchW / 12;
    for (let i = 0; i < 12; i += 2) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
      ctx.fillRect(pitchX + i * stripeW, pitchY, stripeW, pitchH);
    }

    // Coordinate helper matching 0 0 110 73 viewBox exactly
    const toX = (vx: number) => pitchX + (vx / 110) * pitchW;
    const toY = (vy: number) => pitchY + (vy / 73) * pitchH;
    const toW = (vw: number) => (vw / 110) * pitchW;
    const toH = (vh: number) => (vh / 73) * pitchH;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2.5;

    // Outer Field Boundary Line (68m x 105m playfield inside 73m x 110m, margin 2.5m)
    ctx.strokeRect(toX(2.5), toY(2.5), toW(105), toH(68));

    // Midfield Line
    ctx.beginPath();
    ctx.moveTo(toX(55), toY(2.5));
    ctx.lineTo(toX(55), toY(70.5));
    ctx.stroke();

    // Center Circle (official 9.15m radius)
    ctx.beginPath();
    ctx.arc(toX(55), toY(36.5), toH(9.15), 0, 2 * Math.PI);
    ctx.stroke();

    // Center Spot
    ctx.beginPath();
    ctx.arc(toX(55), toY(36.5), 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Goal Nets (outside lines: 7.32m wide, 2.2m deep)
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(toX(0.3), toY(32.84), toW(2.2), toH(7.32));
    ctx.strokeRect(toX(0.3), toY(32.84), toW(2.2), toH(7.32));

    ctx.fillRect(toX(107.5), toY(32.84), toW(2.2), toH(7.32));
    ctx.strokeRect(toX(107.5), toY(32.84), toW(2.2), toH(7.32));

    // Left Penalty Area (16.5m x 40.32m)
    ctx.strokeRect(toX(2.5), toY(16.34), toW(16.5), toH(40.32));

    // Left 6-yard box (5.5m x 18.32m)
    ctx.strokeRect(toX(2.5), toY(27.34), toW(5.5), toH(18.32));

    // Left Penalty Spot (11m from line -> 13.5m)
    ctx.beginPath();
    ctx.arc(toX(13.5), toY(36.5), 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Left Penalty Arc (9.15m radius centered at spot)
    ctx.beginPath();
    ctx.arc(toX(13.5), toY(36.5), toH(9.15), -0.93, 0.93);
    ctx.stroke();

    // Right Penalty Area (16.5m x 40.32m)
    ctx.strokeRect(toX(91), toY(16.34), toW(16.5), toH(40.32));

    // Right 6-yard box (5.5m x 18.32m)
    ctx.strokeRect(toX(102), toY(27.34), toW(5.5), toH(18.32));

    // Right Penalty Spot (11m from line -> 96.5m)
    ctx.beginPath();
    ctx.arc(toX(96.5), toY(36.5), 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Right Penalty Arc (9.15m radius centered at spot)
    ctx.beginPath();
    ctx.arc(toX(96.5), toY(36.5), toH(9.15), Math.PI - 0.93, Math.PI + 0.93);
    ctx.stroke();

    // Corner Arcs (1m radius)
    const cR = toH(1.2);
    ctx.beginPath();
    ctx.arc(toX(2.5), toY(2.5), cR, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(toX(107.5), toY(2.5), cR, Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(toX(2.5), toY(70.5), cR, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(toX(107.5), toY(70.5), cR, Math.PI, -Math.PI / 2);
    ctx.stroke();

    // Corner flags
    const flagCorners = [
      [toX(2.5), toY(2.5)],
      [toX(107.5), toY(2.5)],
      [toX(2.5), toY(70.5)],
      [toX(107.5), toY(70.5)],
    ];
    flagCorners.forEach(([fx, fy]) => {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(fx, fy, 3.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  // 5 couloirs et 3 zones du football, si affichés sur le terrain
  if ((showPitchZones || showPitchThirds) && (sportKey === "football" || sportKey === "soccer")) {
    const fr = getFootballFieldRect(targetSport, targetFormat);
    const fx = pitchX + fr.x * pitchW;
    const fy = pitchY + fr.y * pitchH;
    const flen = fr.w * pitchW;
    const fwid = fr.h * pitchH;
    if (showPitchZones) drawFootballZones(ctx, fx, fy, flen, fwid);
    if (showPitchThirds) drawFootballThirds(ctx, fx, fy, flen, fwid, pitchThirdsLabels);
  }

  // Outer Pitch Frame Border
  ctx.strokeStyle = "#1f293d";
  ctx.lineWidth = 3;
  ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);

  // Logo du club dans le rond central (même réglage que sur le terrain) : découpé en rond au diamètre du rond central
  const logoImg = clubLogoImgRef.current;
  const centerRatio = getCenterCircleRadiusRatio(targetSport, targetFormat);
  if (showClubLogoOnPitch && logoImg && logoImg.naturalWidth > 0 && centerRatio) {
    const ccx = pitchX + pitchW / 2;
    const ccy = pitchY + pitchH / 2;
    const r = pitchH * centerRatio;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ccx, ccy, r, 0, 2 * Math.PI);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(ccx - r, ccy - r, r * 2, r * 2);
    // Remplit le rond (comme « cover ») en gardant les proportions du logo
    const scale = Math.max((r * 2) / logoImg.naturalWidth, (r * 2) / logoImg.naturalHeight);
    const lw = logoImg.naturalWidth * scale;
    const lh = logoImg.naturalHeight * scale;
    ctx.drawImage(logoImg, ccx - lw / 2, ccy - lh / 2, lw, lh);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(ccx, ccy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(1.5, pitchH * 0.0035);
    ctx.stroke();
  }

  // 2. Render Drawing Actions
  let exportDrawings: any[] = [];
  if (schemaOverride && schemaOverride.drawings !== undefined) {
    exportDrawings = Array.isArray(schemaOverride.drawings) ? schemaOverride.drawings : [];
  } else {
    exportDrawings = drawingActions || [];
  }

  exportDrawings.forEach((action: any) => {
    if (!action.points || action.points.length < 2) return;
    ctx.strokeStyle = action.color || "#00E599";
    ctx.fillStyle = action.color || "#00E599";
    ctx.lineWidth = (action.size || 4) * 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);

    const getExportX = (pt: { x: number; y: number }) => pitchX + (pt.x / 100) * pitchW;
    const getExportY = (pt: { x: number; y: number }) => pitchY + (pt.y / 100) * pitchH;

    const startX = getExportX(action.points[0]);
    const startY = getExportY(action.points[0]);
    const endX = getExportX(action.points[action.points.length - 1]);
    const endY = getExportY(action.points[action.points.length - 1]);

    if (action.tool === "brush") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      for (let i = 1; i < action.points.length; i++) {
        ctx.lineTo(getExportX(action.points[i]), getExportY(action.points[i]));
      }
      ctx.stroke();
    } else if (action.tool === "arrow-direct" || action.tool === "arrow-deep" || action.tool === "arrow-run") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      if (action.tool === "arrow-deep") ctx.setLineDash([10, 8]);
      else if (action.tool === "arrow-run") ctx.setLineDash([4, 6]);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead
      const angle = Math.atan2(endY - startY, endX - startX);
      const headLen = 16;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (action.tool === "shape-circle") {
      ctx.beginPath();
      const r = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      ctx.arc(startX, startY, r, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (action.tool === "shape-rect") {
      ctx.save();
      ctx.globalAlpha = ZONE_FILL_ALPHA;
      ctx.fillRect(startX, startY, endX - startX, endY - startY);
      ctx.restore();
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    } else if (isCurveTool(action.tool)) {
      const ptsPx = action.points.map((p: Pt) => ({ x: getExportX(p), y: getExportY(p) }));
      strokeCurveArrow(ctx, ptsPx, action.tool === "curve-arrow-dashed", [12, 9], 16 + (action.size || 4));
    } else if (action.tool === "shape-line" || action.tool === "shape-dashed-line") {
      ctx.beginPath();
      if (action.tool === "shape-dashed-line") {
        ctx.setLineDash([10, 8]);
      }
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      if (action.tool === "shape-dashed-line") {
        ctx.setLineDash([]);
      }
    }
  });

  // 3. Render Player Tokens
  let exportTokens: any[] = [];
  if (schemaOverride) {
    const activeFrameIdx = typeof frameIndexOverride === "number" ? Math.max(0, frameIndexOverride) : 0;
    if (Array.isArray(schemaOverride)) {
      exportTokens = schemaOverride;
    } else if (Array.isArray(schemaOverride.keyframes?.[activeFrameIdx])) {
      exportTokens = schemaOverride.keyframes[activeFrameIdx];
    } else if (Array.isArray(schemaOverride.keyframes?.[activeFrameIdx]?.players)) {
      exportTokens = schemaOverride.keyframes[activeFrameIdx].players;
    } else if (Array.isArray(schemaOverride.keyframes?.[0])) {
      exportTokens = schemaOverride.keyframes[0];
    } else if (Array.isArray(schemaOverride.keyframes?.[0]?.players)) {
      exportTokens = schemaOverride.keyframes[0].players;
    } else if (Array.isArray(schemaOverride.players)) {
      exportTokens = schemaOverride.players;
    } else if (Array.isArray(schemaOverride.tokens)) {
      exportTokens = schemaOverride.tokens;
    } else {
      exportTokens = currentTokens;
    }
  } else {
    if (typeof frameIndexOverride === "number" && keyframes[frameIndexOverride]) {
      exportTokens = keyframes[frameIndexOverride];
    } else {
      exportTokens = currentTokens;
    }
  }

  if (tokensOverride) {
    exportTokens = tokensOverride;
  }

  if (!exportTokens || exportTokens.length === 0) {
    exportTokens = currentTokens;
  }

  // Liaisons entre joueurs : tracées sous les pions, entre les joueurs visibles
  {
    const opponentsShown = schemaOverride && !Array.isArray(schemaOverride)
      ? schemaOverride.showOpponents !== false
      : schemaOverride ? true : showOpponents;
    exportTokens.forEach((link: Token) => {
      if (link.type !== "link" || !link.linkIds) return;
      const pts = link.linkIds
        .map((id) => exportTokens.find((t: Token) => t.id === id))
        .filter((t: Token | undefined): t is Token => !!t && !(t.type === "player_b" && !opponentsShown) && !isInWall(t, exportTokens))
        .map((t: Token) => ({ x: pitchX + (t.x / 100) * pitchW, y: pitchY + (t.y / 100) * pitchH }));
      if (pts.length < 2) return;
      ctx.save();
      ctx.strokeStyle = link.color || LINK_COLORS[0];
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(link.linkStyle === "dashed" ? [12, 9] : []);
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 3;
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();
    });
  }

  exportTokens.forEach((token: any) => {
    if (token.type === "link") return;
    if (token.type === "ball" && !showBall && !schemaOverride) return;
    // Schéma enregistré : on suit l'état des adversaires au moment de l'enregistrement
    // (les anciens schémas, sans cette information, les affichent comme avant)
    const opponentsVisible = schemaOverride && !Array.isArray(schemaOverride)
      ? schemaOverride.showOpponents !== false
      : schemaOverride ? true : showOpponents;
    if (token.type === "player_b" && !opponentsVisible) return;
    // Joueur placé dans le mur : dessiné avec le mur
    if (isInWall(token, exportTokens)) return;

    const tokX = pitchX + (token.x / 100) * pitchW;
    const tokY = pitchY + (token.y / 100) * pitchH;

    // Mur sur coup franc : rangée de joueurs face au ballon, numéros des joueurs attribués
    if (token.type === "wall") {
      const team: WallTeam = token.wallTeam === "away" ? "away" : "home";
      if (team === "away" && !opponentsVisible) return;
      const count = Math.max(WALL_MIN, Math.min(WALL_MAX, token.wallCount || WALL_DEFAULT));
      const members = wallMembers(team, count, exportTokens);
      const ballTok = exportTokens.find((t: Token) => t.type === "ball");
      const angle = (effectiveWallAngle(token, ballTok && (showBall || schemaOverride) ? ballTok : null, targetSport, targetFormat) * Math.PI) / 180;
      const r = 13;
      const step = 2 * r + 3;
      const span = (count - 1) * step;
      ctx.save();
      ctx.translate(tokX, tokY);
      ctx.rotate(angle);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-span / 2 - r - 4, -r - 4, span + 2 * r + 8, 2 * r + 8, r + 4);
      ctx.fill();
      ctx.stroke();
      members.forEach((m, i) => {
        const cx = -span / 2 + i * step;
        ctx.beginPath();
        ctx.arc(cx, 0, r, 0, Math.PI * 2);
        // Place libre : disque estompé
        ctx.globalAlpha = m ? 1 : 0.35;
        ctx.fillStyle = team === "away" ? (teamBColor || "#e11d48") : (teamAColor || "#00E599");
        ctx.fill();
        ctx.strokeStyle = "#0d131f";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (m?.number) {
          ctx.save();
          ctx.translate(cx, 0);
          ctx.rotate(-angle);
          ctx.fillStyle = team === "away" ? "#ffffff" : "#0d131f";
          ctx.font = "900 12px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(m.number), 0, 0.5);
          ctx.restore();
        }
      });
      ctx.restore();
      return;
    }
    const radius = 22;
    const isPlayerToken = token.type === "player_a" || token.type === "player_b";
    const portrait = isPlayerToken ? exportImageCacheRef.current[getTokenPortraitSrc(token, targetSport)] : undefined;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.arc(tokX, tokY, radius, 0, 2 * Math.PI);

    if (playerRepresentation === "jersey" && (token.type === "player_a" || token.type === "player_b")) {
      const isTeamB = token.type === "player_b";
      const jerseyFill = isTeamB ? (teamBColor || "#e11d48") : (teamAColor || "#00E599");
      const strokeColor = isTeamB ? "#ffffff" : "#0d131f";
      const textColor = isTeamB ? "#ffffff" : "#090d14";

      ctx.save();
      ctx.translate(tokX, tokY);
      const s = radius / 22;
      ctx.scale(s, s);

      ctx.beginPath();
      ctx.moveTo(-7, -19);
      ctx.bezierCurveTo(-4, -15, 4, -15, 7, -19);
      ctx.lineTo(19, -13);
      ctx.lineTo(21, -2);
      ctx.lineTo(13, 1);
      ctx.lineTo(11, -4);
      ctx.lineTo(11, 22);
      ctx.lineTo(-11, 22);
      ctx.lineTo(-11, -4);
      ctx.lineTo(-13, 1);
      ctx.lineTo(-21, -2);
      ctx.lineTo(-19, -13);
      ctx.closePath();

      ctx.fillStyle = jerseyFill;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = "900 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(token.number ?? token.role ?? (isTeamB ? "B" : "A")), 0, 7);
      ctx.restore();
    } else if (playerRepresentation === "head" && portrait) {
      // Mode Tête du joueur : même rendu que sur le terrain (joueur détouré sans vignette ni contour,
      // ombre qui suit la silhouette, numéro en pastille aux couleurs de l'équipe)
      const isTeamB = token.type === "player_b";
      const teamColor = isTeamB ? (teamBColor || "#e11d48") : (teamAColor || "#00E599");
      const half = radius + 2;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.imageSmoothingQuality = "high";
      const fitScale = Math.min((half * 2) / portrait.naturalWidth, (half * 2) / portrait.naturalHeight);
      const drawW = portrait.naturalWidth * fitScale;
      const drawH = portrait.naturalHeight * fitScale;
      ctx.drawImage(portrait, tokX - drawW / 2, tokY - drawH / 2, drawW, drawH);
      ctx.restore();
      ctx.shadowColor = "transparent";

      if (token.number !== undefined && token.number !== null) {
        ctx.beginPath();
        ctx.arc(tokX + half - 1, tokY - half + 1, 10, 0, 2 * Math.PI);
        ctx.fillStyle = teamColor;
        ctx.fill();
        ctx.fillStyle = isTeamB ? "#ffffff" : "#04120c";
        ctx.font = "900 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(token.number), tokX + half - 1, tokY - half + 2);
      }

      ctx.restore();
    } else if (playerRepresentation === "dot" && token.photo && showPlayerNames && portrait) {
      // Mode Pastille : la photo du joueur remplace le numéro, comme sur le terrain
      ctx.fillStyle = "#0b1512";
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.save();
      ctx.beginPath();
      ctx.arc(tokX, tokY, radius, 0, 2 * Math.PI);
      ctx.clip();
      const coverScale = Math.max((radius * 2) / portrait.naturalWidth, (radius * 2) / portrait.naturalHeight);
      const coverW = portrait.naturalWidth * coverScale;
      const coverH = portrait.naturalHeight * coverScale;
      ctx.drawImage(portrait, tokX - coverW / 2, tokY - coverH / 2, coverW, coverH);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(tokX, tokY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    } else if (playerRepresentation === "head" && (token.type === "player_a" || token.type === "player_b")) {
      // Portrait indisponible : tête simplifiée
      ctx.beginPath();
      ctx.ellipse(tokX, tokY - 2, radius * 0.8, radius * 0.95, 0, 0, 2 * Math.PI);
      ctx.fillStyle = "#fed7aa";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(tokX, tokY - 5, radius * 0.8, Math.PI, 0, false);
      ctx.fillStyle = token.type === "player_b" ? "#d97706" : "#1e293b";
      ctx.fill();

      ctx.restore();
    } else if (token.type === "player_a") {
      ctx.fillStyle = teamAColor || "#00E599";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
      ctx.fillStyle = "#090d14";
      ctx.font = "900 15px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(token.number ?? token.role ?? "A"), tokX, tokY);
    } else if (token.type === "player_b") {
      ctx.fillStyle = teamBColor || "#e11d48";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 15px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(token.number ?? token.role ?? "B"), tokX, tokY);
    } else if (token.type === "ball") {
      if (activeSport === "basketball") {
        ctx.fillStyle = "#ea580c";
        ctx.fill();
        ctx.strokeStyle = "#1c1917";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#1c1917";
        ctx.font = "700 16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🏀", tokX, tokY);
      } else if (activeSport === "rugby") {
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🏉", tokX, tokY);
      } else if (activeSport === "handball") {
        ctx.fillStyle = "#0284c7";
        ctx.fill();
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🤾", tokX, tokY);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚽", tokX, tokY);
      }
    } else {
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
      ctx.fillStyle = "#000000";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("R", tokX, tokY);
    }

    // Player Name Tag under token
    if (token.name && token.type !== "ball") {
      ctx.font = "bold 11.5px system-ui, sans-serif";
      const nameText = token.name;
      const textWidth = ctx.measureText(nameText).width;
      const padX = 7;
      const tagH = 19;
      const tagY = tokY + radius + 4;

      ctx.fillStyle = "rgba(9, 13, 20, 0.92)";
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(tokX - textWidth / 2 - padX, tagY, textWidth + padX * 2, tagH, 4);
      } else {
        ctx.rect(tokX - textWidth / 2 - padX, tagY, textWidth + padX * 2, tagH);
      }
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(nameText, tokX, tagY + tagH / 2);
    }
  });

  ctx.shadowBlur = 0;

  // 4. Rich Match Recap & Tactical Notes Footer (only for match reports)
  if (isMatchReport) {
    const footerY = pitchY + pitchH + paddingYBottom;
    const footerAreaH = 280;

    ctx.fillStyle = "#080d14";
    ctx.fillRect(0, footerY, w, footerAreaH);

    ctx.strokeStyle = "#00E599";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, footerY);
    ctx.lineTo(w, footerY);
    ctx.stroke();

    ctx.textBaseline = "alphabetic";

    const panelW = Math.floor((w - 60 - 30) / 3);
    const p1X = 30;
    const p2X = p1X + panelW + 15;
    const p3X = p2X + panelW + 15;

    // Panel 1: Match Events Feed
    ctx.fillStyle = "#111827";
    ctx.fillRect(p1X, footerY + 15, panelW, 245);
    ctx.strokeStyle = "#1f293d";
    ctx.lineWidth = 1;
    ctx.strokeRect(p1X, footerY + 15, panelW, 245);

    ctx.fillStyle = "#00E599";
    ctx.font = "900 13px system-ui, sans-serif";
    ctx.textAlign = "left";
    const visibleCanvasEvents = matchEvents.filter((e) => e.type !== "assist");
    ctx.fillText(`⚽ ÉVÉNEMENTS DU MATCH (${visibleCanvasEvents.length})`, p1X + 15, footerY + 40);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 11px system-ui, sans-serif";
    if (visibleCanvasEvents.length > 0) {
      visibleCanvasEvents.slice(0, 7).forEach((evt, idx) => {
        const icon = evt.type === "goal" ? "⚽" : evt.type === "yellow" ? "🟨" : evt.type === "red" ? "🟥" : evt.type === "note" ? "📝" : "🔄";
        const passeurStr = evt.type === "goal" && evt.assister ? ` (${evt.assister})` : "";
        const evtLine = `${icon} ${evt.player}${passeurStr} ${evt.time ? `- ${evt.period ? `${evt.period} ` : ''}${evt.time}` : ''}`;
        ctx.fillText(evtLine, p1X + 15, footerY + 68 + idx * 24);
      });
      if (visibleCanvasEvents.length > 7) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "500 10px system-ui, sans-serif";
        ctx.fillText(`... et ${visibleCanvasEvents.length - 7} autre(s) action(s)`, p1X + 15, footerY + 245);
      }
    } else {
      ctx.fillStyle = "#64748b";
      ctx.font = "italic 500 11px system-ui, sans-serif";
      ctx.fillText("Aucun événement enregistré pendant le match.", p1X + 15, footerY + 68);
    }

    // Panel 2: Stats & Details
    ctx.fillStyle = "#111827";
    ctx.fillRect(p2X, footerY + 15, panelW, 245);
    ctx.strokeStyle = "#1f293d";
    ctx.strokeRect(p2X, footerY + 15, panelW, 245);

    ctx.fillStyle = "#00E599";
    ctx.font = "900 13px system-ui, sans-serif";
    ctx.fillText("📊 SYNTHÈSE & DÉTAILS DU MATCH", p2X + 15, footerY + 40);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "800 12px system-ui, sans-serif";
    ctx.fillText(`Score Final : ${homeScore} - ${awayScore}`, p2X + 15, footerY + 70);
    ctx.fillText(`Compétition : ${activeMatch?.competition || "Regular"}`, p2X + 15, footerY + 98);
    ctx.fillText(`Date & Heure : ${formatMatchDateTime(activeMatch) || "Non renseignée"}`, p2X + 15, footerY + 126);
    ctx.fillText(`Temps de Jeu : ${formatLiveTime(liveTimerSeconds)}`, p2X + 15, footerY + 154);
    ctx.fillText(`Buts enregistrés : ${matchEvents.filter(e => e.type === "goal").length}`, p2X + 15, footerY + 182);
    ctx.fillText(`Schémas tactiques liés : ${savedTactics.filter(sc => schemaBelongsToMatch(sc, activeMatchId)).length}`, p2X + 15, footerY + 210);

    // Panel 3: Tactical Notes & Remarks
    ctx.fillStyle = "#111827";
    ctx.fillRect(p3X, footerY + 15, panelW, 245);
    ctx.strokeStyle = "#1f293d";
    ctx.strokeRect(p3X, footerY + 15, panelW, 245);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "900 13px system-ui, sans-serif";
    ctx.fillText("📝 CONSIGNES & CAUSERIE DU COACH", p3X + 15, footerY + 40);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 11px system-ui, sans-serif";
    const rawNote = schemaOverride?.description || schemaOverride?.notes || (schemaOverride ? "" : tacticalNotes);
    if (rawNote && rawNote.trim()) {
      drawWrappedCanvasText(ctx, rawNote.trim(), p3X + 15, footerY + 68, panelW - 30, 22, 8);
    } else {
      ctx.fillStyle = "#64748b";
      ctx.font = "italic 500 11px system-ui, sans-serif";
      ctx.fillText("Aucune note tactique particulière pour ce match.", p3X + 15, footerY + 68);
    }
  }

  return exportCanvas;
}
