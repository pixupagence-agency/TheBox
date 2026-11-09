"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Barre d'outils sur une seule ligne : les groupes qui ne tiennent pas sont repliés
// (dans l'ordre de `hideOrder`) derrière un chevron qui les déroule horizontalement.
//
// - Chaque groupe affiché doit porter `data-toolbar-key="<clé>"` et se trouver dans `rowRef`.
// - `pinnedRef` désigne la partie toujours visible en bout de ligne (elle n'est jamais masquée).
// - La largeur d'un groupe est mémorisée tant qu'il est dans la ligne, pour savoir s'il peut y revenir.

const CHEVRON_RESERVE = 40; // place du bouton chevron (+ espacement)

export function useToolbarOverflow(keys: readonly string[], hideOrder: readonly string[]) {
  const rowRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const widthsRef = useRef(new Map<string, number>());
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  const recompute = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;

    // Mise à jour des largeurs des groupes actuellement affichés dans la ligne
    row.querySelectorAll<HTMLElement>("[data-toolbar-key]").forEach((el) => {
      const key = el.dataset.toolbarKey;
      if (key && el.offsetWidth > 0) widthsRef.current.set(key, el.offsetWidth);
    });

    const styles = window.getComputedStyle(row);
    const gap = parseFloat(styles.columnGap) || 0;
    const pinnedWidth = pinnedRef.current?.offsetWidth ?? 0;
    const available = row.clientWidth - pinnedWidth - gap;

    const widthOf = (visible: readonly string[]) =>
      visible.reduce((sum, key) => sum + (widthsRef.current.get(key) ?? 0) + gap, 0);

    let next: string[] = [];
    if (widthOf(keys) > available) {
      const budget = available - CHEVRON_RESERVE;
      for (const key of hideOrder) {
        next.push(key);
        if (widthOf(keys.filter((k) => !next.includes(k))) <= budget) break;
      }
      // Ordre d'affichage dans le menu = ordre de la barre
      next = keys.filter((k) => next.includes(k));
    }

    setHiddenKeys((prev) => (prev.join("|") === next.join("|") ? prev : next));
  }, [keys, hideOrder]);

  // Après chaque rendu : le contenu des groupes (langue, mode compact…) peut avoir changé de largeur
  useLayoutEffect(() => {
    recompute();
  });

  useEffect(() => {
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => recompute());
    observer.observe(row);
    return () => observer.disconnect();
  }, [recompute]);

  return { rowRef, pinnedRef, hiddenKeys };
}
