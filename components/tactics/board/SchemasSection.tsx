"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { Award, Bookmark, ChevronDown, Save, Share2, Trash } from "lucide-react";

export interface SchemasSectionProps {
  activeMatch: any;
  activeMatchId: string;
  confirmDeleteSchemaId: string | null;
  handleDeleteSchema: (schemaId: string) => void;
  handleLoadSchema: (schema: any) => void;
  handleOpenShareSchema: (schema?: any) => Promise<void>;
  handleTriggerSaveModal: () => void;
  hasActiveMatch: boolean;
  isModernSleek: boolean;
  isProOrAdmin: boolean;
  isSchemasSectionCollapsed: boolean;
  savedTactics: any[];
  schemaBelongsToMatch: (sc: { matchId?: string | undefined; }, matchId: string) => boolean;
  setConfirmDeleteSchemaId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSchemasSectionCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function SchemasSection({
  activeMatch,
  activeMatchId,
  confirmDeleteSchemaId,
  handleDeleteSchema,
  handleLoadSchema,
  handleOpenShareSchema,
  handleTriggerSaveModal,
  hasActiveMatch,
  isModernSleek,
  isProOrAdmin,
  isSchemasSectionCollapsed,
  savedTactics,
  schemaBelongsToMatch,
  setConfirmDeleteSchemaId,
  setIsCheckoutOpen,
  setIsSchemasSectionCollapsed,
  setSleekToastMessage,
}: SchemasSectionProps) {
  return (
    <>
              {/* SCHÉMAS section (with save, share, and collapse buttons) */}
              <div className={`tb-section ${isModernSleek ? "text-slate-800" : ""} rounded-xl p-2 shrink-0`}>
                <div className={`tb-section-head flex items-center justify-between ${isSchemasSectionCollapsed ? "" : `mb-1.5 border-b ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/60"} pb-1`}`}>
                  <p
                    onClick={() => setIsSchemasSectionCollapsed(!isSchemasSectionCollapsed)}
                    className={`text-xs ${isModernSleek ? "text-slate-600 font-extrabold" : "text-[#62728f] font-black"} uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none`}
                  >
                    <Bookmark className={`w-5 h-5 ${isModernSleek ? "text-amber-600" : "text-[#e9c349]"} shrink-0`} />
                    <span>SCHÉMAS</span>
                    <span className="tb-pro-badge text-[9px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1 py-0.2 rounded uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5" /> PRO
                    </span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (!isProOrAdmin) {
                          setSleekToastMessage("🔒 Le partage de schémas tactiques est réservé aux formules PRO & PRO+.");
                          setIsCheckoutOpen(true);
                          return;
                        }
                        handleOpenShareSchema();
                      }}
                      className={`h-8 w-8 flex items-center justify-center ${isModernSleek ? "bg-white hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-emerald-800" : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-slate-400 hover:text-[#00E599]"} border rounded transition cursor-pointer shrink-0`}
                      title="Partager le schéma actuel (PRO)"
                    >
                      <Share2 className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      onClick={handleTriggerSaveModal}
                      className={`h-8 w-8 flex items-center justify-center ${isModernSleek ? "bg-white hover:bg-slate-200 border-slate-200 text-emerald-800 hover:text-emerald-900" : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-[#00E599] hover:text-brand-cream"} border rounded transition cursor-pointer shrink-0`}
                      title="Enregistrer sous (PRO)"
                    >
                      <Save className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSchemasSectionCollapsed(!isSchemasSectionCollapsed)}
                      className={`h-8 px-2 rounded border text-[11px] font-bold transition cursor-pointer inline-flex items-center justify-center gap-0.5 whitespace-nowrap ${isModernSleek
                        ? "bg-white hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900"
                        : "bg-[#121926] hover:bg-[#1a2333] border-[#1a2130] text-slate-400 hover:text-white"
                        }`}
                      title={isSchemasSectionCollapsed ? "Déplier la section Schémas" : "Réduire la section Schémas"}
                      aria-label={isSchemasSectionCollapsed ? "Déplier la section Schémas" : "Réduire la section Schémas"}
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isSchemasSectionCollapsed ? "-rotate-90" : ""}`} />
                      <span className="sr-only">{isSchemasSectionCollapsed ? "Ouvrir" : "Réduire"}</span>
                    </button>
                  </div>
                </div>

                {!isSchemasSectionCollapsed && (
                  <>
                    {/* En-tête Match actuel */}
                    <div className={`flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-lg border text-[11px] font-black uppercase tracking-tight ${isModernSleek
                      ? "bg-slate-100 border-slate-200 text-slate-700"
                      : "bg-[#080d14] border-[#1f293d] text-slate-300"
                      }`}>
                      <span className="flex items-center gap-1 truncate">
                        <span>⚽</span>
                        <span className="truncate">{activeMatch ? `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}` : "Ce Match"}</span>
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold shrink-0 ${isModernSleek ? "bg-emerald-100 text-emerald-800" : "bg-[#00E599]/20 text-[#00E599]"
                        }`}>
                        {savedTactics.filter(sc => schemaBelongsToMatch(sc, activeMatchId)).length}
                      </span>
                    </div>

                    {/* Saved Playbooks scroll list */}
                    <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                      {(() => {
                        const matchSchemas = savedTactics.filter(sc => schemaBelongsToMatch(sc, activeMatchId));

                        if (matchSchemas.length === 0) {
                          return (
                            <div className={`border border-dashed ${isModernSleek ? "border-slate-300 text-slate-500" : "border-[#1f293d] text-[#62728f]"} rounded-lg p-3 text-center text-[11px] font-bold uppercase tracking-wider`}>
                              {hasActiveMatch ? "AUCUN SCHÉMA POUR CE MATCH" : "AUCUN MATCH PARAMÉTRÉ"}
                            </div>
                          );
                        }

                        return matchSchemas.map((sc) => {
                          const isAnim = Boolean(sc.isAnimation || (sc.keyframes && sc.keyframes.length > 1));

                          return (
                            <div
                              key={sc.id}
                              onClick={() => handleLoadSchema(sc)}
                              className={`group ${isAnim
                                ? isModernSleek
                                  ? "bg-purple-50/90 border-purple-300 hover:border-purple-600 shadow-2xs"
                                  : "bg-gradient-to-r from-[#170b22] to-[#0f091c] border-purple-500/50 hover:border-purple-400 shadow-md shadow-purple-950/40"
                                : isModernSleek
                                  ? "bg-white border-slate-200 hover:border-emerald-400 shadow-2xs"
                                  : "bg-[#0d1117] border-[#1a2130] hover:border-[#00e599]/30"
                                } border p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition gap-1.5`}
                            >
                              <div className="text-left min-w-0 flex-1">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <p className={`text-xs font-black ${isAnim
                                    ? isModernSleek ? "text-purple-900 group-hover:text-purple-700" : "text-purple-200 group-hover:text-purple-300"
                                    : isModernSleek ? "text-slate-900 group-hover:text-emerald-800" : "text-white group-hover:text-[#00E599]"
                                    } truncate leading-tight transition flex items-center gap-1`}>
                                    {isAnim && <span className="text-xs">🎬</span>}
                                    <span>{sc.name}</span>
                                  </p>

                                  {isAnim && (
                                    <span className="text-[9px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider shrink-0 shadow-2xs">
                                      ANIMATION
                                    </span>
                                  )}

                                </div>
                                <span className={`text-[10px] ${isAnim ? (isModernSleek ? "text-purple-600 font-extrabold" : "text-purple-300/80 font-bold") : (isModernSleek ? "text-slate-400 font-bold" : "text-[#62728f] font-bold")} block mt-0.5`}>
                                  {sc.date} {sc.keyframes ? `• ${sc.keyframes.length} étape${sc.keyframes.length > 1 ? "s" : ""}` : ""}
                                </span>
                              </div>

                              {confirmDeleteSchemaId === sc.id ? (
                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSchema(sc.id);
                                      setConfirmDeleteSchemaId(null);
                                    }}
                                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10.5px] rounded transition shadow-md cursor-pointer"
                                    title="Confirmer la suppression"
                                  >
                                    Supprimer
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteSchemaId(null);
                                    }}
                                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10.5px] rounded transition cursor-pointer"
                                    title="Annuler"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 shrink-0">

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      if (!isProOrAdmin) {
                                        setSleekToastMessage("🔒 Le partage de schémas tactiques est réservé aux formules PRO & PRO+.");
                                        setIsCheckoutOpen(true);
                                        return;
                                      }
                                      handleOpenShareSchema(sc);
                                    }}
                                    className={`p-1.5 ${isModernSleek ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-emerald-800" : "bg-[#131b29] hover:bg-[#1f2b40] border-[#1a2130] text-slate-400 hover:text-[#00E599]"} border rounded transition cursor-pointer flex items-center justify-center z-10`}
                                    title="Partager ce schéma (PRO)"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setConfirmDeleteSchemaId(sc.id);
                                    }}
                                    className={`p-1.5 ${isModernSleek ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600 hover:text-rose-800" : "bg-rose-950/60 hover:bg-rose-900 border-rose-800/80 text-rose-300 hover:text-white"} border rounded transition cursor-pointer flex items-center justify-center z-10`}
                                    title="Supprimer ce schéma"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
              </div>
    </>
  );
}
