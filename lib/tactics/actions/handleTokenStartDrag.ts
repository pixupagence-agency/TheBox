// Tableau tactique : ancien handleTokenStartDrag() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { playerWallTeam, type WallTeam } from "@/lib/setPieceWall";
import { BALL_MAGNET_PX, detachBall } from "@/lib/tactics/pitchGeometry";
import { type Token } from "@/lib/tactics/types";

export interface HandleTokenStartDragCtx {
  activeTool: "select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link";
  aspectRatioMode: "desktop" | "mobile";
  currentFrameIdx: number;
  currentTokens: Token[];
  dragEndTimeRef: React.RefObject<number>;
  findWall: (team: WallTeam, tokens?: Token[]) => Token | undefined;
  handleJoinWall: (tokenId: string, team: WallTeam, preferredSlot: number) => void;
  isDraggingTokenRef: React.RefObject<boolean>;
  isInWall: (t: Token, tokens: Token[]) => boolean;
  pitchContainerRef: React.RefObject<HTMLDivElement | null>;
  playerScale: number;
  setBallMagnetTargetId: React.Dispatch<React.SetStateAction<string | null>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setSelectedTokenId: React.Dispatch<React.SetStateAction<string | null>>;
  setWallDropTarget: React.Dispatch<React.SetStateAction<{ team: WallTeam; slot: number; } | null>>;
  showBall: boolean;
  showOpponents: boolean;
  startCoordsRef: React.RefObject<{ x: number; y: number; }>;
  wallSlotAtPoint: (wall: Token, clientX: number, clientY: number, rect: DOMRect) => number;
}

export function handleTokenStartDrag(boardCtx: HandleTokenStartDragCtx, tokenId: string, startEvent: React.MouseEvent | React.TouchEvent) {
  const { activeTool, aspectRatioMode, currentFrameIdx, currentTokens, dragEndTimeRef, findWall, handleJoinWall, isDraggingTokenRef, isInWall, pitchContainerRef, playerScale, setBallMagnetTargetId, setKeyframes, setSelectedTokenId, setWallDropTarget, showBall, showOpponents, startCoordsRef, wallSlotAtPoint } = boardCtx;
  if (activeTool !== "select" && activeTool !== "move") return;
  setSelectedTokenId(tokenId);

  const startX = "touches" in startEvent ? startEvent.touches[0].clientX : startEvent.clientX;
  const startY = "touches" in startEvent ? startEvent.touches[0].clientY : startEvent.clientY;
  startCoordsRef.current = { x: startX, y: startY };

  let userMoved = false;
  isDraggingTokenRef.current = false;

  const container = pitchContainerRef.current;
  if (!container) return;

  const rect = container.getBoundingClientRect();

  // --- Aimant du ballon -------------------------------------------------
  // Le ballon lâché près d'un joueur se colle à ses pieds, puis suit ses déplacements.
  // Un joueur lâché sur un ballon libre le récupère. Alt enfoncé au lâcher : pas d'aimant.
  const round1 = (v: number) => Math.round(v * 10) / 10;
  const toScreen = (t: { x: number; y: number }) => ({
    x: ((aspectRatioMode === "mobile" ? t.y : t.x) / 100) * rect.width,
    y: ((aspectRatioMode === "mobile" ? 100 - t.x : t.y) / 100) * rect.height,
  });
  const toLogical = (px: number, py: number) => {
    const rx = (px / rect.width) * 100;
    const ry = (py / rect.height) * 100;
    return aspectRatioMode === "mobile" ? { x: 100 - ry, y: rx } : { x: rx, y: ry };
  };
  const magnetScale = playerScale / 100;
  const magnetRadius = BALL_MAGNET_PX * magnetScale;
  /** Joueurs visibles sur le terrain, susceptibles de recevoir le ballon */
  const magnetPlayers = currentTokens.filter(
    (t) => t.type.startsWith("player") && (t.type !== "player_b" || showOpponents) && !isInWall(t, currentTokens)
  );
  /** Position du ballon collé aux pieds d'un joueur (décalage fixe à l'écran, bas-droite) */
  const ballSpotFor = (player: Token) => {
    const p = toScreen(player);
    const spot = toLogical(p.x + 17 * magnetScale, p.y + 15 * magnetScale);
    const x = round1(Math.max(0, Math.min(100, spot.x)));
    const y = round1(Math.max(0, Math.min(100, spot.y)));
    return { x, y, ballOffsetX: round1(x - player.x), ballOffsetY: round1(y - player.y) };
  };
  /** Joueur le plus proche d'un point (px relatifs au terrain), dans le rayon de l'aimant */
  const nearestPlayer = (px: number, py: number) => {
    let best: Token | null = null;
    let bestD = magnetRadius;
    for (const pl of magnetPlayers) {
      const s = toScreen(pl);
      const d = Math.hypot(s.x - px, s.y - py);
      if (d <= bestD) { best = pl; bestD = d; }
    }
    return best;
  };
  const draggedTok = currentTokens.find((t) => t.id === tokenId);
  const isBallDrag = draggedTok?.type === "ball" && showBall;
  const isPlayerDrag = !!draggedTok && draggedTok.type.startsWith("player");
  const ballTok = currentTokens.find((t) => t.type === "ball");
  /** Ballon libre (sans porteur) que le joueur glissé peut récupérer */
  const freeBall = isPlayerDrag && showBall && ballTok && !currentTokens.some((t) => t.id === ballTok.ballCarrierId) ? ballTok : null;
  let magnetTarget: string | null = null;
  const setMagnet = (id: string | null) => {
    if (id === magnetTarget) return;
    magnetTarget = id;
    setBallMagnetTargetId(id);
  };

  const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
    const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const clientY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

    const dist = Math.hypot(clientX - startCoordsRef.current.x, clientY - startCoordsRef.current.y);
    if (dist > 5) {
      userMoved = true;
      isDraggingTokenRef.current = true;
    }

    if (userMoved) {
      const relativeX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const relativeY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

      const logicalX = aspectRatioMode === "mobile" ? 100 - relativeY : relativeX;
      const logicalY = aspectRatioMode === "mobile" ? relativeX : relativeY;
      const nx = round1(logicalX);
      const ny = round1(logicalY);

      setKeyframes((prev) => {
        const copy = prev.map((f, fIdx) => {
          if (fIdx === currentFrameIdx) {
            return f.map((t) => {
              if (t.id === tokenId) return { ...t, x: nx, y: ny };
              // Le ballon porté par le joueur glissé le suit
              if (isPlayerDrag && t.type === "ball" && t.ballCarrierId === tokenId) {
                return {
                  ...t,
                  x: round1(Math.max(0, Math.min(100, nx + (t.ballOffsetX ?? 0)))),
                  y: round1(Math.max(0, Math.min(100, ny + (t.ballOffsetY ?? 0)))),
                };
              }
              return t;
            });
          }
          return f;
        });
        return copy;
      });

      // Aimant : joueur visé par le ballon glissé, ou ballon libre visé par le joueur glissé
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      if (isBallDrag) {
        setMagnet(nearestPlayer(px, py)?.id ?? null);
      } else if (freeBall) {
        const b = toScreen(freeBall);
        setMagnet(Math.hypot(b.x - px, b.y - py) <= magnetRadius ? tokenId : null);
      }

      // Joueur glissé au-dessus du mur de son équipe : place visée en surbrillance
      if (dropWall) {
        const slot = wallSlotAtPoint(dropWall, clientX, clientY, rect);
        lastDrop = slot >= 0 ? slot : -1;
        const next = slot >= 0 ? { team: dropTeam!, slot } : null;
        setWallDropTarget((prev) => (prev?.team === next?.team && prev?.slot === next?.slot ? prev : next));
      }
    }
  };

  // Mur de l'équipe du joueur glissé (le joueur n'y est pas déjà) : cible possible du dépôt
  const draggedToken = currentTokens.find((t) => t.id === tokenId);
  const dropTeam = draggedToken ? playerWallTeam(draggedToken.type) : null;
  const dropWall = dropTeam && draggedToken && typeof draggedToken.wallSlot !== "number" ? findWall(dropTeam) : undefined;
  let lastDrop = -1;

  const upHandler = (upEvent: MouseEvent | TouchEvent) => {
    if (userMoved) {
      // Enregistrer l'instant de fin du déplacement pour bloquer l'événement onClick résiduel du navigateur
      dragEndTimeRef.current = Date.now();
      const noMagnet = upEvent.altKey;
      const joinsWall = !!(dropWall && dropTeam && lastDrop >= 0);
      if (isBallDrag) {
        // Ballon lâché près d'un joueur : il se colle à lui ; sinon il redevient libre
        const carrier = !noMagnet && magnetTarget ? magnetPlayers.find((p) => p.id === magnetTarget) : undefined;
        setKeyframes((prev) => prev.map((f, fIdx) => (fIdx !== currentFrameIdx ? f : f.map((t) => {
          if (t.id !== tokenId) return t;
          return carrier ? { ...t, ...ballSpotFor(carrier), ballCarrierId: carrier.id } : detachBall(t);
        }))));
      } else if (isPlayerDrag && joinsWall) {
        // Le joueur entre dans le mur : il lâche le ballon
        setKeyframes((prev) => prev.map((f, fIdx) => (fIdx !== currentFrameIdx ? f : f.map((t) => (
          t.type === "ball" && t.ballCarrierId === tokenId ? detachBall(t) : t
        )))));
      } else if (freeBall && magnetTarget === tokenId && !noMagnet) {
        // Joueur lâché sur un ballon libre : il le récupère
        setKeyframes((prev) => prev.map((f, fIdx) => {
          if (fIdx !== currentFrameIdx) return f;
          const player = f.find((t) => t.id === tokenId);
          if (!player) return f;
          return f.map((t) => (t.id === freeBall.id ? { ...t, ...ballSpotFor(player), ballCarrierId: tokenId } : t));
        }));
      }
      // Déposé sur le mur : le joueur y entre
      if (joinsWall) handleJoinWall(tokenId, dropTeam!, lastDrop);
    }
    setMagnet(null);
    if (dropWall) setWallDropTarget(null);
    isDraggingTokenRef.current = false;
    setSelectedTokenId(null);
    window.removeEventListener("mousemove", moveHandler);
    window.removeEventListener("mouseup", upHandler);
    window.removeEventListener("touchmove", moveHandler);
    window.removeEventListener("touchend", upHandler);
  };

  window.addEventListener("mousemove", moveHandler);
  window.addEventListener("mouseup", upHandler);
  window.addEventListener("touchmove", moveHandler, { passive: true });
  window.addEventListener("touchend", upHandler);
}
