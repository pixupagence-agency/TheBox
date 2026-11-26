"use client";
// Tableau tactique : panneau latéral droit (ouvert / fermé, largeur réglable à la souris ou au doigt),
// mémorisé sur l'appareil.
import { useEffect, useRef, useState } from "react";

const OPEN_KEY = "thebox_right_sidebar_open";
const WIDTH_KEY = "thebox_right_sidebar_width";
const MIN_WIDTH = 170;
const DEFAULT_WIDTH = 300;

const clientXOf = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) =>
  "touches" in e ? e.touches[0].clientX : e.clientX;

export function useRightSidebar() {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(OPEN_KEY);
    if (saved !== null) return saved === "true";
    // Ouverte par défaut sur grand écran ; en dessous de xl, elle reste un tiroir à la demande
    return window.innerWidth >= 1280;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const parsed = parseInt(localStorage.getItem(WIDTH_KEY) || "", 10);
    return !isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= 700 ? parsed : DEFAULT_WIDTH;
  });
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState(false);
  const resizingStartXRef = useRef(0);
  const resizingStartWidthRef = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    localStorage.setItem(OPEN_KEY, String(isRightSidebarOpen));
  }, [isRightSidebarOpen]);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, rightSidebarWidth.toString());
  }, [rightSidebarWidth]);

  // Glisser du bord du panneau : suivi au niveau de la fenêtre pour un redimensionnement fluide
  useEffect(() => {
    if (!isResizingRightSidebar) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const deltaX = resizingStartXRef.current - clientXOf(e);
      const maxAllowed = Math.min(650, Math.floor(window.innerWidth * 0.45));
      setRightSidebarWidth(Math.min(Math.max(MIN_WIDTH, resizingStartWidthRef.current + deltaX), maxAllowed));
    };
    const handleEnd = () => {
      setIsResizingRightSidebar(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingRightSidebar]);

  const handleRightSidebarResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizingRightSidebar(true);
    resizingStartXRef.current = clientXOf(e);
    resizingStartWidthRef.current = rightSidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return {
    isRightSidebarOpen, setIsRightSidebarOpen,
    rightSidebarWidth, setRightSidebarWidth,
    isResizingRightSidebar,
    handleRightSidebarResizeStart,
  };
}
