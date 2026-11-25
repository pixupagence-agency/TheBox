// Tableau tactique : ancien handleSaveTacticState() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { type DrawingAction, type TeamCategory, type Token } from "@/lib/tactics/types";

export interface HandleSaveTacticStateCtx {
  activeFormat: string;
  activeMatch: any;
  activeMatchId: string;
  activeSport: string;
  activeTeam: TeamCategory | undefined;
  drawingActions: DrawingAction[];
  generateCompositeTacticsCanvas: (schemaOverride?: any, frameIndexOverride?: number | undefined) => string;
  isProOrAdmin: boolean;
  isSaveAnimationMode: boolean;
  keyframes: Token[][];
  matchesList: any[];
  savedTactics: any[];
  saveTacticMatchId: string;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaveAnimationMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaveModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSavedTactics: React.Dispatch<React.SetStateAction<any[]>>;
  setSaveSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setTacticDesc: React.Dispatch<React.SetStateAction<string>>;
  showOpponents: boolean;
  syncSchemaToCloud: (schema: any, opts?: { isNew?: boolean | undefined; }) => void;
  tacticDesc: string;
  tacticName: string;
  teams: TeamCategory[];
}

export function handleSaveTacticState(boardCtx: HandleSaveTacticStateCtx) {
  const { activeFormat, activeMatch, activeMatchId, activeSport, activeTeam, drawingActions, generateCompositeTacticsCanvas, isProOrAdmin, isSaveAnimationMode, keyframes, matchesList, savedTactics, saveTacticMatchId, setIsCheckoutOpen, setIsSaveAnimationMode, setIsSaveModalOpen, setSavedTactics, setSaveSuccess, setSleekToastMessage, setTacticDesc, showOpponents, syncSchemaToCloud, tacticDesc, tacticName, teams } = boardCtx;
  if (!isProOrAdmin) {
    setSleekToastMessage("🔒 L'enregistrement des schémas tactiques est réservé aux formules PRO & PRO+.");
    setIsCheckoutOpen(true);
    return;
  }
  if (!tacticName.trim()) return;

  const targetMatchId = saveTacticMatchId || activeMatchId;
  const targetMatch = matchesList.find((m) => m.id === targetMatchId) || activeMatch;
  const targetTeam = teams.find((t) => t.id === targetMatch?.teamId) || activeTeam;
  const isAnim = isSaveAnimationMode || (keyframes && keyframes.length > 1);

  const newSchemaData = {
    id: `schema_${Date.now()}`,
    name: tacticName,
    description: tacticDesc || (isAnim ? "Animation tactique séquentielle" : "Schéma tactique de référence"),
    sport: activeSport,
    format: activeFormat,
    keyframes: keyframes,
    drawings: drawingActions,
    isAnimation: isAnim,
    // Adversaires masqués à l'enregistrement : ils restent absents de l'image, du GIF et de la vidéo partagés
    showOpponents,
    matchId: targetMatchId,
    teamId: targetTeam?.id || "",
    teamName: targetTeam?.name || "",
    date: new Date().toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  let previewImg = "";
  try {
    previewImg = generateCompositeTacticsCanvas(newSchemaData);
  } catch (e) {
    console.warn("Could not generate tactic preview image", e);
  }

  const newSchema = {
    ...newSchemaData,
    previewImage: previewImg,
  };

  const nextList = [newSchema, ...savedTactics];
  setSavedTactics(nextList);
  if (typeof window !== "undefined") {
    localStorage.setItem("thebox_saved_playbooks", JSON.stringify(nextList));
  }

  // Cloud Persistence via Firebase Firestore
  syncSchemaToCloud(newSchema, { isNew: true });

  setSaveSuccess(true);
  const successMsg = isSaveAnimationMode
    ? "✅ Animation enregistrée avec succès !"
    : "✅ Schéma tactique sauvegardé avec succès !";
  setSleekToastMessage(successMsg);
  setTimeout(() => {
    setSleekToastMessage((prev) => (prev === successMsg ? null : prev));
  }, 3500);
  setTimeout(() => {
    setIsSaveModalOpen(false);
    setSaveSuccess(false);
    setIsSaveAnimationMode(false);
    setTacticDesc("");
  }, 1500);
}
