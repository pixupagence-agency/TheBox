"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { formatMatchDateTime } from "@/lib/dateFormat";
import { premiumLabel, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";
import { COACH_NOTE_MAX } from "@/lib/tactics/constants";
import { type TeamCategory } from "@/lib/tactics/types";
import { CalendarDays, Check, Pencil, Play, Plus, Search, Shield, Trash2, X } from "lucide-react";

export interface MatchListModalProps {
  activeMatchId: string;
  activeTeamId: string;
  editingMatchId: string | null;
  handleAddNewMatch: (assignedTeamId?: any) => void;
  handleDeleteMatchFromList: (matchId: string) => Promise<void>;
  isMatchEditOpen: boolean;
  isModernSleek: boolean;
  isProOrAdmin: boolean;
  matchesList: any[];
  matchSearchQuery: string;
  matchTeamFilter: string;
  pth: { panel: string; sidebar: string; border: string; card: string; cardMuted: string; text: string; body: string; sub: string; faint: string; input: string; navActive: string; navIdle: string; navIndicator: string; ghostBtn: string; primaryBtn: string; tableHead: string; rowHover: string; divide: string; chip: string; gold: string; goldChip: string; goldTile: string; accent: string; accentChip: string; accentDot: string; selected: string; selectable: string; segment: string; segmentActive: string; segmentIdle: string; danger: string; option: string; };
  selectMatch: (matchId: string, customMatchesList?: any[] | undefined) => void;
  setEditingMatchId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMatchEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMatchSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setMatchTeamFilter: React.Dispatch<React.SetStateAction<string>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  teams: TeamCategory[];
  updateMatchById: (matchId: string, field: string, value: any) => void;
}

export default function MatchListModal({
  activeMatchId,
  activeTeamId,
  editingMatchId,
  handleAddNewMatch,
  handleDeleteMatchFromList,
  isMatchEditOpen,
  isModernSleek,
  isProOrAdmin,
  matchesList,
  matchSearchQuery,
  matchTeamFilter,
  pth,
  selectMatch,
  setEditingMatchId,
  setIsCheckoutOpen,
  setIsMatchEditOpen,
  setMatchSearchQuery,
  setMatchTeamFilter,
  setSleekToastMessage,
  teams,
  updateMatchById,
}: MatchListModalProps) {
  return (
    <>
        {/* 6. EDIT UPCOMING MATCHES & MANAGEMENT OVERLAY POPUP */}
        {/* ========================================================= */}
        {isMatchEditOpen && (() => {
          const addMatch = () => {
            if (!isProOrAdmin) {
              setSleekToastMessage("🔒 La création de nouveaux matchs est réservée aux formules PRO & PRO+.");
              setIsCheckoutOpen(true);
              return;
            }
            handleAddNewMatch();
          };
          const filtered = matchesList.filter((m) => {
            const matchTeam = m.teamId || "team_1";
            if (matchTeamFilter !== "all" && matchTeam !== matchTeamFilter) return false;
            if (!matchSearchQuery.trim()) return true;
            const q = matchSearchQuery.toLowerCase();
            return (
              m.homeTeam?.toLowerCase().includes(q) ||
              m.awayTeam?.toLowerCase().includes(q) ||
              m.competition?.toLowerCase().includes(q) ||
              (m.dateTime?.toLowerCase().includes(q) || formatMatchDateTime(m).toLowerCase().includes(q))
            );
          });
          const fieldCls = `w-full rounded-xl px-3 py-2 text-xs font-semibold border outline-none transition ${pth.input} ${pth.option}`;
          const labelCls = `${premiumLabel} ${pth.sub}`;

          return (
            <div className={`${premiumOverlay} z-50`}>
              <div className={`${premiumShell} w-full max-w-5xl h-[94vh] sm:h-[88vh] ${pth.panel}`}>
                {!isModernSleek && (
                  <div className="absolute -top-40 left-32 w-[460px] h-[300px] bg-[#00E599]/[0.05] rounded-full blur-3xl pointer-events-none" />
                )}

                {/* ================= SIDEBAR : ÉQUIPES ================= */}
                <aside className={`hidden md:flex w-64 shrink-0 flex-col border-r relative z-10 ${pth.sidebar}`}>
                  <div className="px-5 pt-6 pb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${pth.accentChip}`}>
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div className="leading-tight">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${pth.accent}`}>Calendrier</p>
                        <p className={`text-sm font-black ${pth.text}`}>Matchs du club</p>
                      </div>
                    </div>
                  </div>

                  <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin">
                    <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] ${pth.faint}`}>Équipes</p>
                    {[{ id: "all", name: "Toutes les équipes", category: "" }, ...teams].map((team) => {
                      const isActive = matchTeamFilter === team.id;
                      const count = team.id === "all" ? matchesList.length : matchesList.filter((m) => (m.teamId || "team_1") === team.id).length;
                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => setMatchTeamFilter(team.id)}
                          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? pth.navActive : pth.navIdle}`}
                        >
                          {isActive && <span className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${pth.navIndicator}`} />}
                          <Shield className={`h-4 w-4 shrink-0 ${isActive ? pth.accent : ""}`} />
                          <span className="flex-1 text-left min-w-0">
                            <span className="block truncate">{team.name}</span>
                            {team.category && <span className={`block text-[10px] font-semibold truncate ${pth.faint}`}>{team.category}</span>}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border tabular-nums ${pth.chip}`}>{count}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className="p-3">
                    <button
                      type="button"
                      onClick={addMatch}
                      className={`w-full h-10 rounded-xl text-xs font-black inline-flex items-center justify-center gap-2 transition cursor-pointer ${pth.primaryBtn}`}
                    >
                      <Plus className="w-4 h-4" />
                      Nouveau match
                    </button>
                  </div>
                </aside>

                {/* ================= MAIN ================= */}
                <main className="flex-1 min-w-0 flex flex-col relative z-10 min-h-0">
                  <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${pth.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className={`text-lg sm:text-xl font-black tracking-tight ${pth.text}`}>Gestion des matchs</h2>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${pth.goldChip}`}>Pro</span>
                        </div>
                        <p className={`text-xs mt-1 ${pth.sub}`}>Consultez, modifiez ou créez les matchs de vos équipes.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={addMatch}
                          className={`md:hidden h-9 px-3 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer ${pth.primaryBtn}`}
                        >
                          <Plus className="w-4 h-4" />
                          Nouveau
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMatchEditOpen(false)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${pth.ghostBtn}`}
                          title="Fermer"
                          aria-label="Fermer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${pth.faint}`} />
                        <input
                          type="text"
                          placeholder="Rechercher un adversaire, une compétition, une date…"
                          value={matchSearchQuery}
                          onChange={(e) => setMatchSearchQuery(e.target.value)}
                          className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs border outline-none transition ${pth.input}`}
                        />
                      </div>
                      <select
                        value={matchTeamFilter}
                        onChange={(e) => setMatchTeamFilter(e.target.value)}
                        className={`md:hidden rounded-xl px-3 py-2 text-xs font-semibold border outline-none ${pth.input} ${pth.option}`}
                        aria-label="Filtrer par équipe"
                      >
                        <option value="all">Toutes les équipes</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-3 scrollbar-thin">
                    {filtered.length === 0 ? (
                      <div className={`rounded-2xl border border-dashed p-10 text-center ${pth.cardMuted}`}>
                        <CalendarDays className={`w-6 h-6 mx-auto mb-2 ${pth.faint}`} />
                        <p className={`text-xs font-bold ${pth.sub}`}>Aucun match trouvé.</p>
                        <button
                          type="button"
                          onClick={addMatch}
                          className={`mt-4 px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer ${pth.primaryBtn}`}
                        >
                          <Plus className="w-4 h-4" />
                          Créer un match
                        </button>
                      </div>
                    ) : (
                      filtered.map((m) => {
                        const isActive = m.id === activeMatchId;
                        const isEditing = editingMatchId === m.id;
                        const mTeam = teams.find((t) => t.id === (m.teamId || "team_1"));
                        const isFinished = m.isFinished || m.status?.includes("Terminé");
                        const scoreLabel = m.score || (isFinished ? `${m.homeScore || 0} - ${m.awayScore || 0}` : "");

                        return (
                          <div key={m.id} className={`rounded-2xl border overflow-hidden transition ${isActive ? pth.selected : pth.card}`}>
                            <div className="p-4 flex items-center gap-4">
                              {/* Date / statut */}
                              <div className={`w-14 shrink-0 rounded-xl border text-center py-2 ${pth.cardMuted}`}>
                                <CalendarDays className={`w-4 h-4 mx-auto ${isFinished ? pth.faint : pth.gold}`} />
                                <p className={`text-[9px] font-black uppercase tracking-wider mt-1 ${isFinished ? pth.faint : pth.gold}`}>{isFinished ? "Fini" : "À venir"}</p>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  {isActive && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${pth.accentChip}`}>Sur le terrain</span>
                                  )}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${pth.chip}`}>{mTeam?.name || "Équipe"}</span>
                                </div>
                                <p className={`text-sm font-black truncate ${pth.text}`}>
                                  {m.homeTeam} <span className={`font-bold ${pth.faint}`}>vs</span> {m.awayTeam}
                                </p>
                                <p className={`text-[11px] truncate ${pth.sub}`}>{[m.competition, formatMatchDateTime(m)].filter(Boolean).join(" · ")}</p>
                              </div>

                              {scoreLabel && (
                                <span className={`hidden sm:inline-flex text-sm font-black tabular-nums px-3 py-1.5 rounded-xl border ${pth.cardMuted} ${pth.text}`}>{scoreLabel}</span>
                              )}

                              <div className="flex items-center gap-1.5 shrink-0">
                                {!isActive && (
                                  <button
                                    type="button"
                                    onClick={() => selectMatch(m.id)}
                                    className={`h-8 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${pth.ghostBtn}`}
                                    title="Activer ce match sur le terrain"
                                  >
                                    <Play className={`w-3.5 h-3.5 ${pth.accent}`} />
                                    <span className="hidden lg:inline">Activer</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setEditingMatchId(isEditing ? null : m.id)}
                                  className={`h-8 px-2.5 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${isEditing ? pth.goldChip : pth.ghostBtn}`}
                                  title={isEditing ? "Fermer l'édition" : "Modifier les détails"}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span className="hidden lg:inline">{isEditing ? "Fermer" : "Modifier"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMatchFromList(m.id)}
                                  className={`h-8 w-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${isModernSleek ? "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50" : "bg-white/[0.03] border-white/10 text-slate-500 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10"}`}
                                  title="Supprimer ce match"
                                  aria-label="Supprimer ce match"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isEditing && (
                              <div className={`px-4 pb-4 pt-4 border-t ${pth.border}`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className={labelCls}>Équipe concernée</label>
                                    <select value={m.teamId || activeTeamId || "team_1"} onChange={(e) => updateMatchById(m.id, "teamId", e.target.value)} className={`${fieldCls} cursor-pointer`}>
                                      {teams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className={labelCls}>Type de compétition</label>
                                    <select
                                      value={
                                        ["CHAMPIONNAT", "COUPE", "AMICAL"].includes(m.competitionType || m.competition?.toUpperCase() || "")
                                          ? (m.competitionType || m.competition?.toUpperCase())
                                          : (m.competition?.toUpperCase().includes("COUPE") ? "COUPE" : m.competition?.toUpperCase().includes("AMICAL") ? "AMICAL" : "CHAMPIONNAT")
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateMatchById(m.id, "competitionType", val);
                                        if (!m.competition || ["CHAMPIONNAT", "COUPE", "AMICAL"].includes(m.competition.toUpperCase())) {
                                          updateMatchById(m.id, "competition", val);
                                        }
                                      }}
                                      className={`${fieldCls} cursor-pointer`}
                                    >
                                      <option value="CHAMPIONNAT">Championnat</option>
                                      <option value="COUPE">Coupe</option>
                                      <option value="AMICAL">Amical</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className={labelCls}>Équipe domicile</label>
                                    <input type="text" value={m.homeTeam || ""} onChange={(e) => updateMatchById(m.id, "homeTeam", e.target.value)} className={fieldCls} />
                                  </div>
                                  <div>
                                    <label className={labelCls}>Équipe extérieure</label>
                                    <input type="text" value={m.awayTeam || ""} onChange={(e) => updateMatchById(m.id, "awayTeam", e.target.value)} className={fieldCls} />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className={labelCls}>Nom / niveau de la compétition <span className={`normal-case tracking-normal font-semibold ${pth.faint}`}>(optionnel)</span></label>
                                    <input type="text" value={m.competition || ""} onChange={(e) => updateMatchById(m.id, "competition", e.target.value)} placeholder="ex : Régional 1, Coupe de France, match amical…" className={fieldCls} />
                                  </div>
                                  <div>
                                    <label className={labelCls}>Date</label>
                                    <input type="date" value={m.date || ""} onChange={(e) => updateMatchById(m.id, "date", e.target.value)} className={fieldCls} />
                                  </div>
                                  <div>
                                    <label className={labelCls}>Heure</label>
                                    <input type="time" value={m.time || "15:00"} onChange={(e) => updateMatchById(m.id, "time", e.target.value)} className={fieldCls} />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className={labelCls}>Score final <span className={`normal-case tracking-normal font-semibold ${pth.faint}`}>(si le match est terminé)</span></label>
                                    <input type="text" value={m.score || ""} onChange={(e) => updateMatchById(m.id, "score", e.target.value)} placeholder="ex : 2 - 1" className={fieldCls} />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label htmlFor={`coach-note-${m.id}`} className={labelCls}>
                                      Le mot du coach <span className={`normal-case tracking-normal font-semibold ${pth.faint}`}>(résumé public du live, {(m.coachNote || "").length}/{COACH_NOTE_MAX})</span>
                                    </label>
                                    <textarea
                                      id={`coach-note-${m.id}`}
                                      value={m.coachNote || ""}
                                      onChange={(e) => updateMatchById(m.id, "coachNote", e.target.value.slice(0, COACH_NOTE_MAX))}
                                      rows={3}
                                      maxLength={COACH_NOTE_MAX}
                                      placeholder="Ce que vous voulez dire aux joueurs et aux parents après le match"
                                      className={`${fieldCls} h-auto py-2 leading-relaxed resize-y`}
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                  <button
                                    type="button"
                                    onClick={() => setEditingMatchId(null)}
                                    className={`h-9 px-4 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer ${pth.primaryBtn}`}
                                  >
                                    <Check className="w-4 h-4" />
                                    Valider
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <footer className={`px-5 sm:px-8 py-4 border-t flex items-center justify-between gap-3 ${pth.border}`}>
                    <p className={`text-[11px] font-medium tabular-nums ${pth.sub}`}>
                      {filtered.length} match{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""} sur {matchesList.length}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsMatchEditOpen(false)}
                      className={`h-10 px-5 rounded-xl border text-xs font-bold transition cursor-pointer ${pth.ghostBtn}`}
                    >
                      Fermer
                    </button>
                  </footer>
                </main>
              </div>
            </div>
          );
        })()}

        {/* ========================================================= */}
    </>
  );
}
