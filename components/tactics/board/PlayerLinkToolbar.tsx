"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { LINK_COLORS } from "@/lib/tactics/constants";

export interface PlayerLinkToolbarProps {
  activeTool: "select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link";
  commitLink: (ids: string[]) => void;
  isModernSleek: boolean;
  linkColor: string;
  linkDashed: boolean;
  linkDraft: string[];
  setActiveTool: React.Dispatch<React.SetStateAction<"select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link">>;
  setLinkColor: React.Dispatch<React.SetStateAction<string>>;
  setLinkDashed: React.Dispatch<React.SetStateAction<boolean>>;
  setLinkDraft: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PlayerLinkToolbar({
  activeTool,
  commitLink,
  isModernSleek,
  linkColor,
  linkDashed,
  linkDraft,
  setActiveTool,
  setLinkColor,
  setLinkDashed,
  setLinkDraft,
}: PlayerLinkToolbarProps) {
  return (
    <>
        {/* Outil « Lier des joueurs » : consigne, couleur, style du trait, valider / annuler */}
        {activeTool === "link" && (
          <div
            role="toolbar"
            aria-label="Lier des joueurs"
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[min(92vw,460px)] rounded-2xl border shadow-2xl px-3 py-2.5 flex flex-col gap-2 ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b1018]/95 border-[#1e293b] text-white"}`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <p className={`text-[11px] leading-snug font-semibold ${isModernSleek ? "text-slate-600" : "text-slate-300"}`}>
              {linkDraft.length === 0
                ? "Touchez les joueurs à relier, un par un."
                : linkDraft.length === 1
                  ? "Touchez le joueur suivant."
                  : `${linkDraft.length} joueurs reliés. Touchez le dernier à nouveau (ou le terrain) pour terminer${linkDraft.length >= 3 ? ", le premier pour fermer la forme" : ""}.`}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Couleur de la liaison">
                {LINK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={linkColor === c}
                    aria-label={`Couleur ${c}`}
                    onClick={() => setLinkColor(c)}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition ${linkColor === c ? "scale-110 border-slate-900 ring-2 ring-offset-1 ring-emerald-400" : "border-black/20"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setLinkDashed((v) => !v)}
                aria-pressed={linkDashed}
                title={linkDashed ? "Trait pointillé" : "Trait plein"}
                className={`h-7 px-2 rounded-lg border text-[11px] font-black flex items-center gap-1.5 cursor-pointer ${isModernSleek ? "bg-slate-100 border-slate-300" : "bg-[#0c1017] border-[#1e293b]"}`}
              >
                <svg className="w-5 h-3" viewBox="0 0 20 6" aria-hidden>
                  <line x1="1" y1="3" x2="19" y2="3" stroke={linkColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={linkDashed ? "4 3" : undefined} />
                </svg>
                {linkDashed ? "Pointillé" : "Plein"}
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setLinkDraft([])}
                disabled={linkDraft.length === 0}
                className={`h-7 px-2.5 rounded-lg border text-[11px] font-black cursor-pointer disabled:opacity-40 disabled:cursor-default ${isModernSleek ? "bg-slate-100 border-slate-300" : "bg-[#0c1017] border-[#1e293b]"}`}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => { if (linkDraft.length >= 2) commitLink(linkDraft); else setActiveTool("select"); }}
                className="h-7 px-2.5 rounded-lg border border-emerald-500 bg-emerald-500 text-slate-950 text-[11px] font-black cursor-pointer"
              >
                {linkDraft.length >= 2 ? "Terminer" : "Fermer"}
              </button>
            </div>
          </div>
        )}
    </>
  );
}
