"use client";

import { useCallback, useEffect, useRef, useState, type WheelEvent } from "react";

// Ligne d'outils défilant horizontalement : tous les outils sont affichés d'emblée,
// on suit s'il reste du contenu à gauche / à droite pour afficher les flèches et les fondus de bord.

export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>() {
  const scrollerRef = useRef<T>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { left: el.scrollLeft > 2, right: el.scrollLeft < max - 2 };
    setEdges((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Le contenu change de largeur (langue, mode compact, groupes conditionnels…) : on surveille aussi les enfants
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(el);
      Array.from(el.children).forEach((child) => observer!.observe(child));
    }
    const mutations = typeof MutationObserver !== "undefined" ? new MutationObserver(() => {
      if (observer) Array.from(el.children).forEach((child) => observer!.observe(child));
      update();
    }) : undefined;
    mutations?.observe(el, { childList: true });
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, [update]);

  // Défilement d'environ une « page » d'outils, en gardant un peu de recouvrement
  const scrollByPage = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(120, el.clientWidth * 0.7), behavior: "smooth" });
  }, []);

  // Molette verticale → défilement horizontal (souris sans molette latérale)
  const onWheel = useCallback((e: WheelEvent<T>) => {
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    el.scrollLeft += e.deltaY;
  }, []);

  return { scrollerRef, canScrollLeft: edges.left, canScrollRight: edges.right, scrollByPage, onWheel };
}
