"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import type { Token } from "@/lib/tactics/types";
import { LINK_COLORS } from "@/lib/tactics/constants";

/**
 * Calque des liaisons entre joueurs : les lignes suivent les pions affichés (y compris pendant
 * leurs transitions d'animation), en lisant la position réelle des pions dans la page.
 */
export function PlayerLinksOverlay({
  links,
  draft,
  draftColor,
  draftDashed,
  layerRef,
  selectedLinkId,
  selectable,
  onSelect,
  onDelete,
  followMs,
}: {
  links: Token[];
  draft: string[];
  draftColor: string;
  draftDashed: boolean;
  layerRef: React.RefObject<HTMLDivElement | null>;
  selectedLinkId: string | null;
  selectable: boolean;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  followMs: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const linesRef = useRef<Record<string, SVGPolylineElement | null>>({});
  const hitsRef = useRef<Record<string, SVGPolylineElement | null>>({});
  const deleteRef = useRef<SVGGElement>(null);
  const draftRef = useRef<SVGPolylineElement>(null);

  const all = draft.length > 0 ? [...links, { id: "__draft__", linkIds: draft } as Token] : links;

  const update = () => {
    const svg = svgRef.current;
    const layer = layerRef.current;
    if (!svg || !layer) return;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    // Le terrain peut être zoomé (transform) : on revient aux pixels propres du calque
    const kx = svg.clientWidth / box.width;
    const ky = svg.clientHeight / box.height;
    const pointsOf = (ids: string[]) => {
      const pts: { x: number; y: number }[] = [];
      ids.forEach((id) => {
        const el = layer.querySelector<HTMLElement>(`[data-link-anchor="${CSS.escape(id)}"]`);
        if (!el) return;
        const r = el.getBoundingClientRect();
        pts.push({ x: (r.left + r.width / 2 - box.left) * kx, y: (r.top + r.height / 2 - box.top) * ky });
      });
      return pts;
    };
    all.forEach((link) => {
      const pts = pointsOf(link.linkIds || []);
      const str = pts.length >= 2 ? pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") : "";
      if (link.id === "__draft__") {
        draftRef.current?.setAttribute("points", str);
        return;
      }
      linesRef.current[link.id]?.setAttribute("points", str);
      linesRef.current[`${link.id}__halo`]?.setAttribute("points", str);
      hitsRef.current[link.id]?.setAttribute("points", str);
      if (link.id === selectedLinkId && deleteRef.current) {
        const mid = pts.length >= 2 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : null;
        deleteRef.current.setAttribute("transform", mid ? `translate(${mid.x.toFixed(1)} ${mid.y.toFixed(1)})` : "translate(-999 -999)");
      }
    });
  };

  // Suivi des pions : à chaque rendu, on suit leurs positions le temps de leur transition
  useEffect(() => {
    if (all.length === 0) return;
    let raf = 0;
    const until = performance.now() + followMs;
    const loop = () => {
      update();
      if (performance.now() < until) raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  });

  // Redimensionnement du terrain
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ro = new ResizeObserver(() => update());
    ro.observe(svg);
    return () => ro.disconnect();
  });

  if (all.length === 0) return null;

  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full overflow-visible" style={{ zIndex: 25, pointerEvents: "none" }} aria-hidden={!selectable}>
      {links.map((link) => {
        const color = link.color || LINK_COLORS[0];
        const isSel = link.id === selectedLinkId;
        return (
          <g key={link.id}>
            {isSel && (
              <polyline
                ref={(el) => { linesRef.current[`${link.id}__halo`] = el; }}
                fill="none"
                stroke={color}
                strokeOpacity={0.35}
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
                points=""
                data-halo
              />
            )}
            <polyline
              ref={(el) => { linesRef.current[link.id] = el; }}
              data-testid="player-link"
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={link.linkStyle === "dashed" ? "9 7" : undefined}
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }}
              points=""
            />
            {/* Zone de clic élargie pour sélectionner la liaison */}
            <polyline
              ref={(el) => { hitsRef.current[link.id] = el; }}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              strokeLinecap="round"
              strokeLinejoin="round"
              points=""
              style={{ pointerEvents: selectable ? "stroke" : "none", cursor: "pointer" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onSelect(isSel ? null : link.id); }}
            >
              <title>Liaison entre joueurs (appuyer pour la sélectionner)</title>
            </polyline>
          </g>
        );
      })}
      {draft.length > 0 && (
        <polyline
          ref={draftRef}
          fill="none"
          stroke={draftColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={draftDashed ? "9 7" : undefined}
          strokeOpacity={0.85}
          points=""
        />
      )}
      {selectedLinkId && links.some((l) => l.id === selectedLinkId) && (
        <g
          ref={deleteRef}
          transform="translate(-999 -999)"
          style={{ pointerEvents: "auto", cursor: "pointer" }}
          role="button"
          aria-label="Supprimer la liaison"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(selectedLinkId); }}
        >
          <title>Supprimer la liaison</title>
          <circle r={11} fill="#e11d48" stroke="#ffffff" strokeWidth={2} />
          <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
