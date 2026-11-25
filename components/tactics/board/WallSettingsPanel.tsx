"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { WALL_MAX, WALL_MIN, normalizeAngle, type WallTeam } from "@/lib/setPieceWall";
import { type Token } from "@/lib/tactics/types";
import { ArrowLeftRight, BrickWall, Minus, Plus, RotateCcw, RotateCw, Trash2, X, Zap } from "lucide-react";

export interface WallSettingsPanelProps {
  activeMatch: any;
  findWall: (team: WallTeam, tokens?: Token[]) => Token | undefined;
  handleAutoFillWall: (team: WallTeam) => void;
  handlePlaceWall: (team: WallTeam) => void;
  handleReleaseFromWall: (tokenId: string) => void;
  handleRemoveWall: (team: WallTeam) => void;
  handleSetWallAngle: (team: WallTeam, angle: number | undefined) => void;
  handleSetWallCount: (team: WallTeam, count: number) => void;
  isFootballBoard: boolean;
  isModernSleek: boolean;
  setSubPickerToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setWallPopover: React.Dispatch<React.SetStateAction<{ team: WallTeam; left: number; top: number; } | null>>;
  wallAngleOf: (wall: Token, tokens?: Token[]) => number;
  wallCountFor: (team: WallTeam) => number;
  wallMembers: (team: WallTeam, count: number, tokens?: Token[]) => (Token | null)[];
  wallPopover: { team: WallTeam; left: number; top: number; } | null;
}

export default function WallSettingsPanel({
  activeMatch,
  findWall,
  handleAutoFillWall,
  handlePlaceWall,
  handleReleaseFromWall,
  handleRemoveWall,
  handleSetWallAngle,
  handleSetWallCount,
  isFootballBoard,
  isModernSleek,
  setSubPickerToken,
  setWallPopover,
  wallAngleOf,
  wallCountFor,
  wallMembers,
  wallPopover,
}: WallSettingsPanelProps) {
  return (
    <>
        {/* Réglage du mur sur coup franc : bouton « Mur » de la barre d'outils, ou appui sur le mur */}
        {wallPopover && isFootballBoard && (() => {
          const team = wallPopover.team;
          const wall = findWall(team);
          const count = wallCountFor(team);
          const members = wallMembers(team, count);
          const filled = members.filter(Boolean).length;
          const width = 300;
          const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
          const vh = typeof window !== "undefined" ? window.innerHeight : 800;
          const left = Math.max(8, Math.min(vw - width - 8, wallPopover.left - width / 2));
          const top = Math.max(8, Math.min(vh - 420, wallPopover.top));
          const isManualAngle = typeof wall?.wallAngle === "number";
          const panelCls = isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b1018] border-[#1e293b] text-white";
          const subCls = isModernSleek ? "text-slate-500" : "text-slate-400";
          const segIdle = isModernSleek ? "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900" : "bg-[#0c1017] border-[#1e293b] text-[#8a9ab5] hover:text-white";
          const segOn = team === "away"
            ? (isModernSleek ? "bg-rose-50 border-rose-400 text-rose-700" : "bg-rose-500/15 border-rose-500/60 text-rose-300")
            : (isModernSleek ? "bg-emerald-50 border-emerald-400 text-emerald-800" : "bg-[#132338] border-[#00E599]/60 text-[#00E599]");
          const primary = isModernSleek ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : "bg-[#00E599] hover:bg-[#33ebad] text-slate-950 border-[#00E599]";
          const ghost = isModernSleek ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/[0.07]";
          const stepBtn = `h-8 w-8 rounded-lg border flex items-center justify-center transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${ghost}`;
          return (
            <div
              role="dialog"
              aria-label="Mur sur coup franc"
              data-wall-popover="true"
              className={`fixed z-[140] rounded-2xl border shadow-2xl p-3.5 space-y-3 ${panelCls}`}
              style={{ left, top, width }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-black flex items-center gap-2"><BrickWall className="w-4 h-4" />Mur sur coup franc</p>
                <button type="button" onClick={() => setWallPopover(null)} aria-label="Fermer" className={`h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer ${subCls}`}><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Équipe qui forme le mur">
                {(["home", "away"] as WallTeam[]).map((tm) => (
                  <button
                    key={tm}
                    type="button"
                    onClick={() => setWallPopover({ ...wallPopover, team: tm })}
                    aria-pressed={team === tm}
                    className={`h-8 px-2 rounded-lg border text-[11px] font-black truncate cursor-pointer transition ${team === tm ? segOn : segIdle}`}
                  >
                    {tm === "home" ? (activeMatch.homeTeam || "Mon équipe") : (activeMatch.awayTeam || "Adversaire")}
                  </button>
                ))}
              </div>

              {!wall ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold ${subCls}`}>Places dans le mur</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" className={stepBtn} disabled={count <= WALL_MIN} onClick={() => handleSetWallCount(team, count - 1)} aria-label="Une place de moins"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-7 text-center text-base font-black tabular-nums" aria-live="polite">{count}</span>
                      <button type="button" className={stepBtn} disabled={count >= WALL_MAX} onClick={() => handleSetWallCount(team, count + 1)} aria-label="Une place de plus"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <button type="button" onClick={() => handlePlaceWall(team)} className={`w-full h-9 px-2 rounded-xl border text-[12px] font-black cursor-pointer transition ${primary}`} title="Place le mur à la distance réglementaire du ballon, entre le ballon et le but défendu">
                    Placer le mur
                  </button>
                  <p className={`text-[11px] leading-snug ${subCls}`}>Ensuite, glissez les joueurs du terrain sur le mur pour le composer.</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold ${subCls}`}>Places · {filled}/{count} occupées</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" className={stepBtn} disabled={count <= WALL_MIN} onClick={() => handleSetWallCount(team, count - 1)} aria-label="Une place de moins" title="Une place de moins (le dernier joueur du mur revient sur le terrain)"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-7 text-center text-base font-black tabular-nums" aria-live="polite">{count}</span>
                      <button type="button" className={stepBtn} disabled={count >= WALL_MAX} onClick={() => handleSetWallCount(team, count + 1)} aria-label="Une place de plus"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <ol className={`rounded-xl border p-2 space-y-1 ${isModernSleek ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/[0.02]"}`}>
                    {members.map((m, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] min-h-6">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border shrink-0 ${segOn}`}>{i + 1}</span>
                        <span className={`flex-1 truncate font-bold ${m ? "" : subCls}`}>{m ? `${m.number ? `N°${m.number} · ` : ""}${m.name}` : "Place libre"}</span>
                        {m && (
                          <>
                            <button type="button" onClick={() => { setWallPopover(null); setSubPickerToken(m); }} aria-label={`Remplacer ${m.name}`} title="Remplacer ce joueur : le remplaçant prend sa place dans le mur" className={`h-6 w-6 rounded-md flex items-center justify-center cursor-pointer shrink-0 ${subCls} hover:text-cyan-500`}>
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => handleReleaseFromWall(m.id)} aria-label={`Sortir ${m.name} du mur`} title="Sortir du mur (le joueur revient sur le terrain)" className={`h-6 w-6 rounded-md flex items-center justify-center cursor-pointer shrink-0 ${subCls} hover:text-rose-500`}>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                  <p className={`text-[11px] leading-snug ${subCls}`}>Glissez un joueur du terrain sur le mur pour l&apos;y ajouter. Un remplaçant prend la place du joueur qu&apos;il remplace.</p>

                  <div className="space-y-1.5">
                    <span className={`text-[11px] font-bold ${subCls}`}>Orientation</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" className={stepBtn} onClick={() => handleSetWallAngle(team, wallAngleOf(wall) - 15)} aria-label="Tourner de 15° vers la gauche"><RotateCcw className="w-3.5 h-3.5" /></button>
                      <span className="w-12 text-center text-sm font-black tabular-nums">{Math.round(normalizeAngle(wallAngleOf(wall)))}°</span>
                      <button type="button" className={stepBtn} onClick={() => handleSetWallAngle(team, wallAngleOf(wall) + 15)} aria-label="Tourner de 15° vers la droite"><RotateCw className="w-3.5 h-3.5" /></button>
                      <button
                        type="button"
                        onClick={() => handleSetWallAngle(team, undefined)}
                        aria-pressed={!isManualAngle}
                        className={`flex-1 h-8 px-2 rounded-lg border text-[11px] font-black cursor-pointer transition ${!isManualAngle ? segOn : segIdle}`}
                        title="Le mur se tourne tout seul vers le ballon"
                      >
                        Face au ballon
                      </button>
                    </div>
                    <p className={`text-[10.5px] ${subCls}`}>Ou glissez la poignée ↻ au bout du mur.</p>
                  </div>

                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => handleAutoFillWall(team)} disabled={filled >= count} className={`h-9 px-2.5 rounded-xl border text-[11px] font-black cursor-pointer transition flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${ghost}`} title="Remplit les places libres avec des joueurs du terrain (défenseurs centraux et milieux défensifs d'abord, sans gardien ni tireur de coup franc)">
                      <Zap className="w-3.5 h-3.5" />Remplir
                    </button>
                    <button type="button" onClick={() => handlePlaceWall(team)} className={`flex-1 h-9 px-2 rounded-xl border text-[11px] font-black cursor-pointer transition ${primary}`} title="Replace le mur à la distance réglementaire du ballon, tourné vers lui">
                      Replacer face au ballon
                    </button>
                    <button type="button" onClick={() => handleRemoveWall(team)} aria-label="Retirer le mur" title="Retirer le mur (ses joueurs reviennent sur le terrain)" className={`h-9 w-9 rounded-xl border flex items-center justify-center cursor-pointer transition shrink-0 ${isModernSleek ? "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300" : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-rose-300 hover:border-rose-500/40"}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })()}
    </>
  );
}
