// Tableau tactique : ancien handleOpenShareSchema() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { type ShareData } from "../../../components/ShareModal";
import { buildGifTimeline, clampStepDuration, interpolateFrameTokens } from "@/lib/animationExport";
import { auth } from "@/lib/firebase";
import { GIF_EXPORT_WIDTH } from "@/lib/tactics/constants";
import { type Token } from "@/lib/tactics/types";

export interface HandleOpenShareSchemaCtx {
  activeMatch: any;
  activeMatchId: string;
  activeSport: string;
  currentTokens: Token[];
  displayClubTitle: any;
  generateCompositeTacticsCanvas: (schemaOverride?: any, frameIndexOverride?: number | undefined) => string;
  gifRequestIdRef: React.RefObject<number>;
  hasActiveMatch: boolean;
  isProOrAdmin: boolean;
  keyframes: Token[][];
  playbackSpeed: number;
  preloadExportPortraits: (tokens: any[], sport: string) => Promise<void>;
  renderCompositeTacticsCanvas: (schemaOverride?: any, frameIndexOverride?: number | undefined, tokensOverride?: any[] | undefined) => HTMLCanvasElement | null;
  savedTactics: any[];
  schemaBelongsToMatch: (sc: { matchId?: string | undefined; }, matchId: string) => boolean;
  selectedFormationA: string;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShareData: React.Dispatch<React.SetStateAction<ShareData | null>>;
  setShareModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  substitutes: any[];
  tacticalNotes: string;
}

export async function handleOpenShareSchema(boardCtx: HandleOpenShareSchemaCtx, schema?: any) {
  const { activeMatch, activeMatchId, activeSport, currentTokens, displayClubTitle, generateCompositeTacticsCanvas, gifRequestIdRef, hasActiveMatch, isProOrAdmin, keyframes, playbackSpeed, preloadExportPortraits, renderCompositeTacticsCanvas, savedTactics, schemaBelongsToMatch, selectedFormationA, setIsCheckoutOpen, setShareData, setShareModalOpen, setSleekToastMessage, substitutes, tacticalNotes } = boardCtx;
  if (!isProOrAdmin) {
    setSleekToastMessage("🔒 Le partage de schémas tactiques est réservé aux formules PRO & PRO+.");
    setIsCheckoutOpen(true);
    return;
  }
  const targetKeyframes = schema?.keyframes || keyframes;
  const isAnim = Boolean(schema?.isAnimation || (targetKeyframes && targetKeyframes.length > 1));
  const firstFrame = targetKeyframes?.[0] || keyframes[0];
  const targetTokens = Array.isArray(firstFrame)
    ? firstFrame
    : (firstFrame?.players || currentTokens);

  const targetPlayers = targetTokens
    .filter((t: any) => t.type === "player_a")
    .map((p: any) => ({
      number: p.number || 1,
      name: p.name || `Joueur #${p.number}`,
      position: p.role,
      isStarter: true,
    }));

  const activeSubs = (substitutes || [])
    .filter((s: any) => !targetPlayers.some((st: any) => st.name && s.name && st.name.toLowerCase() === s.name.toLowerCase()))
    .map((s: any) => ({
      number: s.number || 12,
      name: s.name || `Remplaçant #${s.number}`,
      position: s.role || "SUB",
      isStarter: false,
    }));

  // Les portraits doivent être chargés avant de dessiner les images et les étapes de l'animation
  const collectFrameTokens = (frames: any[] | undefined): any[] =>
    (frames || []).flatMap((frame: any) => (Array.isArray(frame) ? frame : frame?.players || []));
  // Partage global (sans schéma ciblé) : tous les schémas du match sont présentés ; sinon uniquement celui partagé
  const isGlobalShare = !schema;
  const matchSchemaSources = isGlobalShare ? savedTactics.filter((s) => schemaBelongsToMatch(s, activeMatchId)) : [];
  await Promise.all([
    preloadExportPortraits(
      [...collectFrameTokens(targetKeyframes), ...(schema?.players || []), ...(schema?.tokens || []), ...currentTokens],
      schema?.sport || activeSport
    ),
    ...matchSchemaSources.map((s) =>
      preloadExportPortraits(collectFrameTokens(s.keyframes).concat(s.players || [], s.tokens || []), s.sport || activeSport)
    ),
  ]);

  // Always generate fresh high-quality composite image to ensure players and proportions are rendered
  let schemaImg = "";
  try {
    schemaImg = generateCompositeTacticsCanvas(schema);
  } catch (e) {
    console.warn("Could not generate composite canvas", e);
    schemaImg = schema?.previewImage || "";
  }

  // Match-associated saved schemas
  const matchSavedSchemas = matchSchemaSources.map((s) => {
    const frames = Array.isArray(s.keyframes) ? s.keyframes : [];
    const isSchemaAnim = Boolean(s.isAnimation || frames.length > 1) && frames.length > 1;
    return {
      id: s.id,
      name: s.name,
      previewImage: generateCompositeTacticsCanvas(s),
      date: s.date,
      description: s.description,
      formation: s.formation,
      sport: s.sport,
      isAnimation: isSchemaAnim,
      stepsCount: frames.length || 1,
      playbackSpeed: clampStepDuration(s.playbackSpeed || playbackSpeed),
      renderAnimationFrame: isSchemaAnim
        ? (position: number) => renderCompositeTacticsCanvas(s, Math.floor(position), interpolateFrameTokens(frames, position))
        : undefined,
    };
  });

  const defaultSchemaTitle = schema?.name || (isAnim ? `Animation ${(schema?.sport || activeSport).toUpperCase()} - ${new Date().toLocaleDateString(undefined)}` : `Schéma ${(schema?.sport || activeSport).toUpperCase()} - ${new Date().toLocaleDateString(undefined)}`);
  const defaultSchemaNotes = schema?.description || tacticalNotes || (activeMatch?.notes ? activeMatch.notes : (isAnim ? "Animation tactique séquentielle de référence" : "Schéma tactique de référence"));

  // Pre-generate GIF if it is a multi-step animation
  let precomputedGifUrl: string | undefined = undefined;
  const isAnimationExport = isAnim && Array.isArray(targetKeyframes) && targetKeyframes.length > 0;
  const animationStepMs = clampStepDuration(schema?.playbackSpeed || playbackSpeed);
  const renderAnimationFrame = isAnimationExport
    ? (position: number) =>
        renderCompositeTacticsCanvas(schema, Math.floor(position), interpolateFrameTokens(targetKeyframes, position))
    : undefined;
  // Une réponse GIF tardive ne doit pas écraser le partage ouvert entre-temps
  const gifRequestId = ++gifRequestIdRef.current;
  const markGifFailed = () => {
    if (gifRequestId !== gifRequestIdRef.current) return;
    setShareData((prev) => (prev ? { ...prev, gifError: true } : null));
  };
  setShareData({
    type: "schema",
    title: defaultSchemaTitle,
    sport: schema?.sport || activeSport,
    clubName: schema?.teamName || displayClubTitle,
    matchInfo: hasActiveMatch ? `${displayClubTitle} vs ${activeMatch.awayTeam}` : undefined,
    formation: schema?.formation || selectedFormationA,
    notes: defaultSchemaNotes,
    players: [...targetPlayers, ...activeSubs],
    starters: targetPlayers,
    substitutes: activeSubs,
    phasesCount: targetKeyframes?.length || 1,
    imageUrl: schemaImg,
    gifUrl: precomputedGifUrl,
    gifError: false,
    renderAnimationFrame,
    isAnimation: isAnim,
    keyframes: targetKeyframes,
    playbackSpeed: animationStepMs,
    matchSchemas: matchSavedSchemas.length > 0 ? matchSavedSchemas : undefined,
  });
  setShareModalOpen(true);

  // Le GIF se prépare après l'ouverture de la fenêtre, qui affiche sa progression
  if (!renderAnimationFrame) return;
  try {
    const { positions, delays } = buildGifTimeline(targetKeyframes.length, animationStepMs);
    const frames: string[] = [];
    const gifCanvas = document.createElement("canvas");
    for (const position of positions) {
      if (gifRequestId !== gifRequestIdRef.current) return;
      const source = renderAnimationFrame(position);
      if (!source) throw new Error("Canvas non supporté");
      const gifScale = Math.min(1, GIF_EXPORT_WIDTH / source.width);
      gifCanvas.width = Math.round(source.width * gifScale);
      gifCanvas.height = Math.round(source.height * gifScale);
      const gifCtx = gifCanvas.getContext("2d");
      if (!gifCtx) throw new Error("Canvas non supporté");
      gifCtx.imageSmoothingQuality = "high";
      gifCtx.drawImage(source, 0, 0, gifCanvas.width, gifCanvas.height);
      // JPEG : avec plusieurs dizaines d'images, le PNG rendrait la requête beaucoup trop lourde
      frames.push(gifCanvas.toDataURL("image/jpeg", 0.8));
      await new Promise((resolve) => setTimeout(resolve)); // laisse l'interface réactive entre deux images
    }
    const res = await fetch("/api/generate-animation-gif", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` } : {}),
      },
      body: JSON.stringify({ frames, delays, width: GIF_EXPORT_WIDTH }),
    });
    const json = res.ok ? await res.json() : null;
    if (!json?.gifUrl) {
      markGifFailed();
      return;
    }
    if (gifRequestId !== gifRequestIdRef.current) return;
    setShareData((prev) => (prev ? { ...prev, gifUrl: json.gifUrl } : null));
  } catch (err) {
    console.warn("Erreur pré-génération GIF:", err);
    markGifFailed();
  }
}
