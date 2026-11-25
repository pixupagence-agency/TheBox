// Tableau tactique : ancien captureSquad3DDataUrl() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";

export interface CaptureSquad3DDataUrlCtx {
  squad3DOrientation: "landscape" | "portrait";
  squad3DRef: React.RefObject<HTMLDivElement | null>;
}

export async function captureSquad3DDataUrl(boardCtx: CaptureSquad3DDataUrlCtx): Promise<string | null> {
  const { squad3DOrientation, squad3DRef } = boardCtx;
  if (!squad3DRef.current) return null;
  const node = squad3DRef.current;

  // Explicit dimensions matching the exact rendered card bounding box to ensure perfect centering
  const isPortrait = squad3DOrientation === "portrait";
  const rect = node.getBoundingClientRect();
  const width = Math.round(rect.width || node.offsetWidth || (isPortrait ? 540 : 960));
  const height = Math.round(rect.height || node.offsetHeight || (isPortrait ? 820 : 600));

  try {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      quality: 0.98,
      width: width,
      height: height,
      canvasWidth: width * 2,
      canvasHeight: height * 2,
      style: {
        margin: "0",
        transform: "none",
        maxHeight: "none",
        maxWidth: "none",
        height: `${height}px`,
        width: `${width}px`,
        overflow: "visible",
      },
    });
    return dataUrl;
  } catch (err) {
    console.warn("html-to-image failed, falling back to html2canvas...", err);
    try {
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0a0f18",
        logging: false,
        width: width,
        height: height,
        scrollX: 0,
        scrollY: 0,
        windowWidth: width,
        windowHeight: height,
        onclone: (clonedDoc, clonedEl) => {
          if (clonedEl) {
            clonedEl.style.height = `${height}px`;
            clonedEl.style.width = `${width}px`;
            clonedEl.style.maxHeight = "none";
            clonedEl.style.maxWidth = "none";
            clonedEl.style.overflow = "visible";
          }
          const styleTags = clonedDoc.querySelectorAll("style");
          styleTags.forEach((style) => {
            if (style.textContent) {
              style.textContent = style.textContent
                .replace(/oklab\([^)]+\)/g, "rgba(0,0,0,0.5)")
                .replace(/oklch\([^)]+\)/g, "rgba(0,0,0,0.5)");
            }
          });
        },
      });
      return canvas.toDataURL("image/png");
    } catch (fallbackErr) {
      console.error("3D squad capture error:", fallbackErr);
      return null;
    }
  }
}
