"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { getGameFormatOptions, resolveGameFormat } from "@/lib/gameFormats";
import { premiumLabel, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";
import { MAX_TEAM_SQUAD_SIZE, TEAM_PLAYER_STATUS_OPTIONS, isUnavailableStatus, type NewTeamPlayerEdit, type TeamRosterStatus } from "@/lib/tactics/roster";
import { type TeamCategory, type TeamRosterPlayer } from "@/lib/tactics/types";
import { Bookmark, Camera, Check, ChevronRight, Lock, Minus, Plus, Shield, Trash, Users, X } from "lucide-react";

export interface MultiTeamManagerModalProps {
  activeSport: string;
  activeTeamId: string;
  getNewTeamDraft: () => { size: number; starterCount: number; players: { index: number; number: number; numberText: string; name: string; role: string; photo: string | undefined; status: TeamRosterStatus; isStarter: boolean; }[]; positions: string[]; };
  getRosterForTeam: (teamId: string) => TeamRosterPlayer[];
  handleChangeTeamFormat: (teamId: string, format: string) => Promise<void>;
  handleCreateNewTeam: (e?: React.FormEvent<Element> | undefined) => void;
  handleDeleteTeam: (teamId: string) => Promise<void>;
  handleNewTeamPlayerPhoto: (index: number, file?: File | undefined) => Promise<void>;
  handleSelectTeam: (teamId: string) => void;
  isModernSleek: boolean;
  isMultiTeamModalOpen: boolean;
  isProOrAdmin: boolean;
  newTeamCategory: string;
  newTeamFormat: string;
  newTeamName: string;
  pth: { panel: string; sidebar: string; border: string; card: string; cardMuted: string; text: string; body: string; sub: string; faint: string; input: string; navActive: string; navIdle: string; navIndicator: string; ghostBtn: string; primaryBtn: string; tableHead: string; rowHover: string; divide: string; chip: string; gold: string; goldChip: string; goldTile: string; accent: string; accentChip: string; accentDot: string; selected: string; selectable: string; segment: string; segmentActive: string; segmentIdle: string; danger: string; option: string; };
  renderTeamRosterEditor: (team: TeamCategory) => React.JSX.Element;
  rosterEditTeamId: string | null;
  savedTactics: any[];
  setIsMultiTeamModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNewTeamCategory: React.Dispatch<React.SetStateAction<string>>;
  setNewTeamFormat: React.Dispatch<React.SetStateAction<string>>;
  setNewTeamName: React.Dispatch<React.SetStateAction<string>>;
  setNewTeamSquadSize: React.Dispatch<React.SetStateAction<number | null>>;
  setRosterEditTeamId: React.Dispatch<React.SetStateAction<string | null>>;
  teamInitials: (name?: string | undefined) => string;
  teams: TeamCategory[];
  updateNewTeamPlayer: (index: number, patch: NewTeamPlayerEdit) => void;
}

export default function MultiTeamManagerModal({
  activeSport,
  activeTeamId,
  getNewTeamDraft,
  getRosterForTeam,
  handleChangeTeamFormat,
  handleCreateNewTeam,
  handleDeleteTeam,
  handleNewTeamPlayerPhoto,
  handleSelectTeam,
  isModernSleek,
  isMultiTeamModalOpen,
  isProOrAdmin,
  newTeamCategory,
  newTeamFormat,
  newTeamName,
  pth,
  renderTeamRosterEditor,
  rosterEditTeamId,
  savedTactics,
  setIsMultiTeamModalOpen,
  setNewTeamCategory,
  setNewTeamFormat,
  setNewTeamName,
  setNewTeamSquadSize,
  setRosterEditTeamId,
  teamInitials,
  teams,
  updateNewTeamPlayer,
}: MultiTeamManagerModalProps) {
  return (
    <>
        {/* MULTI-TEAM MANAGER MODAL (PRO MODE) */}
        {isMultiTeamModalOpen && (() => {
          const activeTeamObj = teams.find((tm) => tm.id === activeTeamId);
          const closeTeamsModal = () => { setIsMultiTeamModalOpen(false); setRosterEditTeamId(null); };
          const openTeamRoster = (teamId: string) => {
            const target = teams.find((tm) => tm.id === teamId);
            handleSelectTeam(teamId);
            if (target && (isProOrAdmin || target.isDefault)) setRosterEditTeamId(teamId);
          };
          const rosterTeam = rosterEditTeamId ? teams.find((tm) => tm.id === rosterEditTeamId) : undefined;
          return (
            <div
              className={`${premiumOverlay} z-50`}
              onClick={(e) => { if (e.target === e.currentTarget) closeTeamsModal(); }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Gestion des équipes"
                className={`${premiumShell} w-full max-w-4xl max-h-[94vh] sm:max-h-[86vh] ${pth.panel}`}
              >
                {/* ================= SIDEBAR ================= */}
                <aside className={`hidden md:flex w-60 shrink-0 flex-col border-r relative z-10 ${pth.sidebar}`}>
                  <div className="px-5 pt-6 pb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${pth.accentChip}`}>
                        <Shield className="h-5 w-5" />
                      </div>
                      <div className="leading-tight min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${pth.accent}`}>Mon club</p>
                        <p className={`text-sm font-black truncate ${pth.text}`}>{teams.length} équipe{teams.length > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 space-y-2">
                    {[
                      { label: "Équipe active", value: activeTeamObj?.name || "—" },
                      { label: "Catégorie", value: activeTeamObj?.category || "—" },
                      { label: "Effectif", value: activeTeamObj ? `${getRosterForTeam(activeTeamObj.id).length} joueurs` : "—" },
                    ].map((row) => (
                      <div key={row.label} className={`p-3 rounded-xl border ${pth.card}`}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${pth.faint}`}>{row.label}</p>
                        <p className={`text-xs font-bold mt-0.5 truncate ${pth.text}`}>{row.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`mt-auto px-5 pb-6 pt-4 text-[11px] leading-relaxed ${pth.faint}`}>
                    Chaque équipe garde son effectif et ses schémas. Basculez de l&apos;une à l&apos;autre à tout moment.
                  </p>
                </aside>

                {/* ================= MAIN ================= */}
                <main className="flex-1 min-w-0 flex flex-col relative z-10 min-h-0">
                  <header className={`px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b ${pth.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className={`text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 ${pth.text}`}>
                          <span>Gestion des équipes</span>
                          <span className={`text-[9px] font-black uppercase tracking-[0.14em] px-2 py-0.5 rounded-md border ${pth.goldChip}`}>Pro</span>
                        </h2>
                        <p className={`text-xs mt-1 ${pth.sub}`}>
                          Cliquez sur une équipe pour l&apos;afficher sur le tableau et consulter ou modifier ses joueurs.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeTeamsModal}
                        className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${pth.ghostBtn}`}
                        title="Fermer"
                        aria-label="Fermer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </header>

                  <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
                    {rosterTeam ? renderTeamRosterEditor(rosterTeam) : (<>
                    {/* TEAM CARDS LIST */}
                    <section>
                      <p className={`${premiumLabel} ${pth.sub}`}>Équipes enregistrées ({teams.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {teams.map((team) => {
                          const isActive = activeTeamId === team.id;
                          const tacticCount = savedTactics.filter(
                            (s) => s.teamId === team.id || (!s.teamId && team.isDefault)
                          ).length;
                          const playerCount = getRosterForTeam(team.id).length;

                          return (
                            <div
                              key={team.id}
                              role="button"
                              tabIndex={0}
                              aria-pressed={isActive}
                              onClick={() => openTeamRoster(team.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openTeamRoster(team.id);
                                }
                              }}
                              className={`group p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]/40 ${isActive ? pth.selected : pth.selectable}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-black shrink-0 ${isActive ? pth.accentChip : pth.chip}`}>
                                  {teamInitials(team.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-black truncate ${pth.text}`}>{team.name}</p>
                                  <p className={`text-[10px] font-bold uppercase tracking-[0.12em] mt-0.5 truncate ${pth.faint}`}>{team.category}</p>
                                {getGameFormatOptions(activeSport).length > 1 && (
                                  <select
                                    value={resolveGameFormat(activeSport, team.format)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onChange={(e) => handleChangeTeamFormat(team.id, e.target.value)}
                                    className={`mt-1.5 border rounded-lg px-1.5 py-0.5 text-[11px] font-bold outline-none cursor-pointer ${pth.input} ${pth.option}`}
                                    title="Nombre de joueurs de l'équipe"
                                    aria-label={`Format de jeu de l'équipe ${team.name}`}
                                  >
                                    {getGameFormatOptions(activeSport).map((opt) => (
                                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                                    ))}
                                  </select>
                                )}
                                </div>
                                {isActive ? (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] px-2 py-1 rounded-md border shrink-0 ${pth.accentChip}`}>
                                    <Check className="w-3 h-3" />
                                    Active
                                  </span>
                                ) : !team.isDefault ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTeam(team.id);
                                    }}
                                    className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 opacity-70 group-hover:opacity-100 ${pth.faint} hover:text-rose-500 ${isModernSleek ? "hover:bg-rose-50" : "hover:bg-rose-500/10"}`}
                                    title="Supprimer cette équipe"
                                    aria-label={`Supprimer l'équipe ${team.name}`}
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                ) : null}
                              </div>

                              <div className={`pt-2.5 border-t flex items-center justify-between gap-2 text-[11px] ${pth.border}`}>
                                <div className={`flex items-center gap-3 font-semibold ${pth.sub}`}>
                                  <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{playerCount} joueur{playerCount > 1 ? "s" : ""}</span>
                                  <span className="inline-flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" />{tacticCount} schéma{tacticCount > 1 ? "s" : ""}</span>
                                </div>
                                <span className={`font-bold inline-flex items-center gap-0.5 ${pth.accent} ${isActive ? "" : "opacity-70 group-hover:opacity-100"} transition`}>
                                  Voir les joueurs <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* CREATE NEW TEAM FORM */}
                    <form onSubmit={handleCreateNewTeam} className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${pth.cardMuted}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${pth.accentChip}`}>
                          <Plus className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-sm font-black ${pth.text}`}>Nouvelle équipe</p>
                          <p className={`text-[11px] ${pth.sub}`}>Séniors, U19, Féminines… choisissez l&apos;effectif et remplissez les fiches de vos joueurs.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
                        <div>
                          <label htmlFor="new-team-name" className={`${premiumLabel} ${pth.sub}`}>Nom de l&apos;équipe</label>
                          <input
                            id="new-team-name"
                            type="text"
                            placeholder="Ex : U17 National, Séniors C…"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition ${pth.input}`}
                          />
                        </div>
                        <div>
                          <label htmlFor="new-team-category" className={`${premiumLabel} ${pth.sub}`}>Catégorie</label>
                          <select
                            id="new-team-category"
                            value={newTeamCategory}
                            onChange={(e) => setNewTeamCategory(e.target.value)}
                            className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-semibold outline-none transition cursor-pointer ${pth.input} ${pth.option}`}
                          >
                            <option value="Séniors">Séniors</option>
                            <option value="Jeunes / U19">Jeunes / U19 / U17</option>
                            <option value="Féminines">Équipe Féminine</option>
                            <option value="Formation">École de Foot / Formation</option>
                            <option value="Loisirs">Loisirs / Vétérans</option>
                          </select>
                        </div>
                      </div>

                      {getGameFormatOptions(activeSport).length > 1 && (
                        <div>
                          <span className={`${premiumLabel} ${pth.sub}`}>Nombre de joueurs</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Nombre de joueurs">
                            {getGameFormatOptions(activeSport).map((opt) => {
                              const isSel = resolveGameFormat(activeSport, newTeamFormat) === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={isSel}
                                  onClick={() => setNewTeamFormat(opt.id)}
                                  className={`px-3 py-2.5 rounded-xl border text-left transition cursor-pointer ${isSel ? pth.selected : pth.selectable}`}
                                >
                                  <span className={`block text-sm font-black ${pth.text}`}>{opt.label}</span>
                                  <span className={`block text-[11px] font-semibold ${pth.sub}`}>{opt.players} joueurs</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* EFFECTIF + FICHES JOUEURS (photo, numéro, nom, poste) : PRO */}
                      {!isProOrAdmin ? (
                        <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${pth.goldChip}`}>
                          <Lock className="w-4 h-4 shrink-0" />
                          <p className="text-[11px] font-semibold">
                            Effectif type de 26 joueurs. Choisir le nombre de joueurs et créer leurs fiches (photo, nom, poste) est réservé à la formule PRO.
                          </p>
                        </div>
                      ) : (() => {
                        const draft = getNewTeamDraft();
                        const benchCount = Math.max(0, draft.size - draft.starterCount);
                        const setSize = (n: number) => setNewTeamSquadSize(Math.min(MAX_TEAM_SQUAD_SIZE, Math.max(1, n)));
                        return (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                              <div>
                                <label htmlFor="new-team-squad-size" className={`${premiumLabel} ${pth.sub}`}>Effectif de l&apos;équipe</label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSize(draft.size - 1)}
                                    disabled={draft.size <= 1}
                                    aria-label="Retirer un joueur"
                                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${pth.ghostBtn}`}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    id="new-team-squad-size"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={MAX_TEAM_SQUAD_SIZE}
                                    value={draft.size}
                                    onChange={(e) => {
                                      const n = parseInt(e.target.value, 10);
                                      if (!Number.isNaN(n)) setSize(n);
                                    }}
                                    className={`w-20 text-center border rounded-xl px-2 py-2.5 text-sm font-black outline-none transition ${pth.input}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setSize(draft.size + 1)}
                                    disabled={draft.size >= MAX_TEAM_SQUAD_SIZE}
                                    aria-label="Ajouter un joueur"
                                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${pth.ghostBtn}`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <p className={`text-[11px] font-semibold pb-1 ${pth.sub}`}>
                                {draft.starterCount} titulaire{draft.starterCount > 1 ? "s" : ""}
                                {benchCount > 0 && ` + ${benchCount} remplaçant${benchCount > 1 ? "s" : ""}`}
                              </p>
                            </div>

                            <div>
                              <span className={`${premiumLabel} ${pth.sub}`}>Fiches joueurs</span>
                              <p className={`text-[11px] mb-2 ${pth.faint}`}>Facultatif : un nom laissé vide devient « Joueur N ». Tout reste modifiable ensuite.</p>
                              <ul className={`max-h-[360px] overflow-y-auto rounded-xl border divide-y ${pth.border} ${pth.divide}`}>
                                {draft.players.map((p) => {
                                  const roleOptions = draft.positions.includes(p.role) ? draft.positions : [p.role, ...draft.positions];
                                  return (
                                    <li key={p.index} className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2">
                                      <div className="relative shrink-0">
                                        <label
                                          className={`w-10 h-10 rounded-full border flex items-center justify-center overflow-hidden cursor-pointer transition ${pth.chip}`}
                                          title={p.photo ? "Changer la photo" : "Ajouter une photo"}
                                        >
                                          {p.photo ? (
                                            <img src={p.photo} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <Camera className="w-4 h-4" />
                                          )}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            aria-label={`Photo du joueur ${p.index + 1}`}
                                            onChange={(e) => {
                                              handleNewTeamPlayerPhoto(p.index, e.target.files?.[0]);
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>
                                        {p.photo && (
                                          <button
                                            type="button"
                                            onClick={() => updateNewTeamPlayer(p.index, { photo: undefined })}
                                            aria-label={`Retirer la photo du joueur ${p.index + 1}`}
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center cursor-pointer hover:bg-rose-600"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={2}
                                        value={p.numberText}
                                        onChange={(e) => updateNewTeamPlayer(p.index, { numberText: e.target.value.replace(/\D/g, "") })}
                                        aria-label={`Numéro du joueur ${p.index + 1}`}
                                        className={`w-11 shrink-0 text-center border rounded-lg px-1 py-2 text-sm font-black outline-none transition ${pth.input}`}
                                      />
                                      <input
                                        type="text"
                                        value={p.name}
                                        placeholder={`Joueur ${p.number}`}
                                        onChange={(e) => updateNewTeamPlayer(p.index, { name: e.target.value })}
                                        aria-label={`Nom du joueur ${p.index + 1}`}
                                        className={`min-w-0 flex-1 border rounded-lg px-2.5 py-2 text-sm font-semibold outline-none transition ${pth.input}`}
                                      />
                                      <select
                                        value={p.role}
                                        onChange={(e) => updateNewTeamPlayer(p.index, { role: e.target.value })}
                                        aria-label={`Poste du joueur ${p.index + 1}`}
                                        className={`w-[76px] shrink-0 border rounded-lg px-1.5 py-2 text-xs font-bold outline-none cursor-pointer transition ${pth.input} ${pth.option}`}
                                      >
                                        {roleOptions.map((r) => (
                                          <option key={r} value={r}>{r}</option>
                                        ))}
                                      </select>
                                      <select
                                        value={p.status}
                                        onChange={(e) => updateNewTeamPlayer(p.index, { status: e.target.value as TeamRosterStatus })}
                                        aria-label={`Statut du joueur ${p.index + 1}`}
                                        className={`w-[98px] shrink-0 border rounded-lg px-1.5 py-2 text-xs font-bold outline-none cursor-pointer transition ${pth.input} ${pth.option} ${isUnavailableStatus(p.status) ? "!text-rose-500" : ""}`}
                                      >
                                        {TEAM_PLAYER_STATUS_OPTIONS.map((o) => (
                                          <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                      </select>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!newTeamName.trim()}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black transition inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${pth.primaryBtn}`}
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter l&apos;équipe
                        </button>
                      </div>
                    </form>
                    </>)}
                  </div>
                </main>
              </div>
            </div>
          );
        })()}

    </>
  );
}
