"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { ROLE_ICONS } from "@/components/tactics/icons";
import { getPremiumTheme, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";
import { WALL_MAX, WALL_MIN, type WallTeam } from "@/lib/setPieceWall";
import { getSportRoles } from "@/lib/sportRoles";
import { isUnavailableStatus } from "@/lib/tactics/roster";
import { defaultSetPieceRoles, type SetPieceRoleConfig, type TeamCategory, type TeamRosterPlayer, type Token } from "@/lib/tactics/types";
import { Archive, ArrowLeftRight, BrickWall, Camera, CheckCircle, ChevronDown, Crown, Hash, Minus, Plus, RefreshCw, Save, Search, Shield, Sparkles, Target, Trash2, User, UserCheck, UserMinus, UserPlus, Users, X, Zap } from "lucide-react";

export interface SquadManagementModalProps {
  activeMatch: any;
  activeSport: string;
  activeTeam: TeamCategory | undefined;
  activeTeamId: string;
  autoTransparentCache: Record<string, string>;
  countSportRoles: (roles: SetPieceRoleConfig) => number;
  currentTokens: Token[];
  findWall: (team: WallTeam, tokens?: Token[]) => Token | undefined;
  getAvailableNumbersForPlayer: (playerId: string, currentNum?: number | undefined, targetTeam?: "home" | "away" | undefined) => number[];
  getRosterForTeam: (teamId: string) => TeamRosterPlayer[];
  getSportCommonPositions: (sport: string) => string[];
  handleAddNewSubstitute: (targetTeam?: "home" | "away" | undefined) => void;
  handleApplyTeamRosterToGroup: () => Promise<void>;
  handleAssignUniqueNumber: (targetId: string, isStarter: boolean, rawValue: string | number, targetTeam?: "home" | "away" | undefined) => void;
  handleAutoAssignSetPieces: (targetTeam?: "home" | "away" | undefined) => void;
  handleAutoFillWall: (team: WallTeam) => void;
  handleAutoRenumberSquad: (targetTeam?: "home" | "away" | undefined) => void;
  handleDeleteRosterPlayer: (rosterId: string) => Promise<void>;
  handleDeleteStarter: (tokenId: string, targetTeam?: "home" | "away" | undefined) => Promise<void>;
  handleDeleteSubstitute: (subId: string, targetTeam?: "home" | "away" | undefined) => void;
  handleExecuteDirectTransfer: (direction: "send_to_target" | "bring_from_target") => void;
  handleExecuteInterTeamSwap: () => void;
  handleMoveToReserve: (playerId: string, isStarter: boolean) => void;
  handleOpenInterTeamSwap: (player?: { id: string; name: string; number?: number | undefined; role?: string | undefined; photo?: string | undefined; status?: string | undefined; } | undefined, isStarter?: boolean | undefined, targetTeam?: "home" | "away" | undefined) => void;
  handlePlaceWall: (team: WallTeam) => void;
  handlePlayerPhotoUpload: (playerId: string, isStarter: boolean, file: File) => Promise<void>;
  handleReleaseFromWall: (tokenId: string) => void;
  handleRemovePlayerPhoto: (playerId: string, isStarter: boolean) => void;
  handleReserveToBench: (rosterId: string) => void;
  handleSaveGroupAsTeamRoster: () => void;
  handleSetWallCount: (team: WallTeam, count: number) => void;
  handleToggleStarterSubstitute: (targetId: string, currentStatus: "starter" | "substitute", targetTeam?: "home" | "away" | undefined) => void;
  handleUpdatePitchPlayer: (tokenId: string, field: "number" | "role" | "name" | "status" | "photo", value: any) => void;
  handleUpdateSubstitute: (subId: string, field: "number" | "role" | "name" | "status" | "photo", value: any) => void;
  isFootballBoard: boolean;
  isInterTeamSwapOpen: boolean;
  isModernSleek: boolean;
  isProOrAdmin: boolean;
  isSetPiecesOpen: boolean;
  opponentSetPieceRoles: SetPieceRoleConfig;
  opponentSubstitutes: any[];
  rolesTargetTeam: "home" | "away";
  rosterFilter: "all" | "starters" | "subs" | "reserve";
  rosterPositionFilter: string;
  rosterSearchQuery: string;
  setIsInterTeamSwapOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSetPiecesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOpponentSetPieceRoles: React.Dispatch<React.SetStateAction<SetPieceRoleConfig>>;
  setPieceRoles: SetPieceRoleConfig;
  setRosterFilter: React.Dispatch<React.SetStateAction<"all" | "starters" | "subs" | "reserve">>;
  setRosterPositionFilter: React.Dispatch<React.SetStateAction<string>>;
  setRosterSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setSetPieceRoles: React.Dispatch<React.SetStateAction<SetPieceRoleConfig>>;
  setSwapNotification: React.Dispatch<React.SetStateAction<{ message: string; type: "success" | "info"; } | null>>;
  setSwapPositionFilter: React.Dispatch<React.SetStateAction<string>>;
  setSwapSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setSwapSourcePlayer: React.Dispatch<React.SetStateAction<{ id: string; name: string; number: number; role: string; photo?: string | undefined; status?: string | undefined; isStarter: boolean; teamTarget?: "home" | "away" | undefined; } | null>>;
  setSwapTargetPlayerId: React.Dispatch<React.SetStateAction<string | null>>;
  setSwapTargetTeamId: React.Dispatch<React.SetStateAction<string>>;
  setTeamRolesModalTab: React.Dispatch<React.SetStateAction<"players" | "setpieces">>;
  substitutes: any[];
  swapNotification: { message: string; type: "success" | "info"; } | null;
  swapPositionFilter: string;
  swapSearchQuery: string;
  swapSourcePlayer: { id: string; name: string; number: number; role: string; photo?: string | undefined; status?: string | undefined; isStarter: boolean; teamTarget?: "home" | "away" | undefined; } | null;
  swapTargetPlayerId: string | null;
  swapTargetTeamId: string;
  teamRolesModalTab: "players" | "setpieces";
  teamRostersMap: Record<string, TeamRosterPlayer[]>;
  teams: TeamCategory[];
  updateRosterPlayer: (rosterId: string | undefined, patch: Partial<TeamRosterPlayer>) => void;
  wallCountFor: (team: WallTeam) => number;
  wallMembers: (team: WallTeam, count: number, tokens?: Token[]) => (Token | null)[];
}

export default function SquadManagementModal({
  activeMatch,
  activeSport,
  activeTeam,
  activeTeamId,
  autoTransparentCache,
  countSportRoles,
  currentTokens,
  findWall,
  getAvailableNumbersForPlayer,
  getRosterForTeam,
  getSportCommonPositions,
  handleAddNewSubstitute,
  handleApplyTeamRosterToGroup,
  handleAssignUniqueNumber,
  handleAutoAssignSetPieces,
  handleAutoFillWall,
  handleAutoRenumberSquad,
  handleDeleteRosterPlayer,
  handleDeleteStarter,
  handleDeleteSubstitute,
  handleExecuteDirectTransfer,
  handleExecuteInterTeamSwap,
  handleMoveToReserve,
  handleOpenInterTeamSwap,
  handlePlaceWall,
  handlePlayerPhotoUpload,
  handleReleaseFromWall,
  handleRemovePlayerPhoto,
  handleReserveToBench,
  handleSaveGroupAsTeamRoster,
  handleSetWallCount,
  handleToggleStarterSubstitute,
  handleUpdatePitchPlayer,
  handleUpdateSubstitute,
  isFootballBoard,
  isInterTeamSwapOpen,
  isModernSleek,
  isProOrAdmin,
  isSetPiecesOpen,
  opponentSetPieceRoles,
  opponentSubstitutes,
  rolesTargetTeam,
  rosterFilter,
  rosterPositionFilter,
  rosterSearchQuery,
  setIsInterTeamSwapOpen,
  setIsSetPiecesOpen,
  setOpponentSetPieceRoles,
  setPieceRoles,
  setRosterFilter,
  setRosterPositionFilter,
  setRosterSearchQuery,
  setSetPieceRoles,
  setSwapNotification,
  setSwapPositionFilter,
  setSwapSearchQuery,
  setSwapSourcePlayer,
  setSwapTargetPlayerId,
  setSwapTargetTeamId,
  setTeamRolesModalTab,
  substitutes,
  swapNotification,
  swapPositionFilter,
  swapSearchQuery,
  swapSourcePlayer,
  swapTargetPlayerId,
  swapTargetTeamId,
  teamRolesModalTab,
  teamRostersMap,
  teams,
  updateRosterPlayer,
  wallCountFor,
  wallMembers,
}: SquadManagementModalProps) {
  return (
    <>
        {/* MODAL : GESTION DE L'EFFECTIF (NOMS, N°, POSTES) & RÔLES / COUPS DE PIED ARRÊTÉS */}
        {/* ========================================================= */}
        {isSetPiecesOpen && (() => {
          const isAway = rolesTargetTeam === "away";
          const starters = currentTokens.filter((t) => isAway ? t.type === "player_b" : t.type === "player_a");
          const activeSubs = isAway ? opponentSubstitutes : substitutes;
          const currentRoles = isAway ? opponentSetPieceRoles : setPieceRoles;
          const sportRoles = getSportRoles(activeSport);
          const availablePositions = getSportCommonPositions(activeSport);

          const getPlayerDefaultHeadAvatar = (
            p: { role?: string; number?: number; photo?: string },
            isOpponentTeam: boolean
          ) => {
            if (p.photo) {
              return autoTransparentCache[p.photo] || p.photo;
            }
            const isGK =
              activeSport !== "basketball" &&
              activeSport !== "rugby" &&
              (p.role === "G" ||
                p.role === "GK" ||
                p.role === "GB" ||
                p.role === "Gardien" ||
                p.number === 1);
            return activeSport === "basketball"
              ? isOpponentTeam
                ? "/images/avatars/basket_opponent_red.png"
                : "/images/avatars/basket_player_green.png"
              : activeSport === "handball"
                ? isGK
                  ? isOpponentTeam
                    ? "/images/avatars/handball_opponent_goalkeeper.png"
                    : "/images/avatars/handball_goalkeeper_yellow.png"
                  : isOpponentTeam
                    ? "/images/avatars/handball_opponent_red.png"
                    : "/images/avatars/handball_player_green.png"
                : activeSport === "rugby"
                  ? isOpponentTeam
                    ? "/images/avatars/rugby_opponent_red.png"
                    : "/images/avatars/rugby_player_green.png"
                  : isGK
                    ? isOpponentTeam
                      ? "/images/avatars/opponent_goalkeeper.png"
                      : "/images/avatars/goalkeeper_yellow.png"
                    : isOpponentTeam
                      ? "/images/avatars/opponent_red.png"
                      : "/images/avatars/player_green.png";
          };

          const updateRole = (key: keyof SetPieceRoleConfig, val: string) => {
            if (isAway) {
              setOpponentSetPieceRoles((prev) => ({ ...prev, [key]: val }));
            } else {
              setSetPieceRoles((prev) => ({ ...prev, [key]: val }));
            }
          };

          // Filter players based on search, position filter & tab filter
          const matchesSearch = (p: { name: string; number?: number; role?: string }) => {
            if (rosterPositionFilter !== "ALL") {
              const playerRole = (p.role || "").toUpperCase().trim();
              const filterPos = rosterPositionFilter.toUpperCase().trim();
              if (filterPos === "SUB") {
                if (!playerRole.includes("SUB") && !playerRole.includes("REMP") && !playerRole.includes("BANC")) {
                  return false;
                }
              } else if (playerRole !== filterPos) {
                return false;
              }
            }

            if (!rosterSearchQuery.trim()) return true;
            const q = rosterSearchQuery.toLowerCase();
            const nameMatch = (p.name || "").toLowerCase().includes(q);
            const numMatch = String(p.number || "").includes(q);
            const roleMatch = (p.role || "").toLowerCase().includes(q);
            return nameMatch || numMatch || roleMatch;
          };

          const filteredStarters = starters.filter(matchesSearch);
          const filteredSubs = activeSubs.filter(matchesSearch);

          // Effectif de l'équipe (mon équipe) : ce qui n'est ni sur le terrain ni sur le banc est en réserve
          // (PRO uniquement : en gratuit, la fenêtre garde le banc type de 26 joueurs)
          const teamRoster: TeamRosterPlayer[] = !isAway && isProOrAdmin ? (teamRostersMap[activeTeamId] || []) : [];
          const groupRosterIds = new Set([...starters, ...activeSubs].map((p: { rosterId?: string }) => p.rosterId).filter(Boolean));
          const reserve = teamRoster.filter((p) => !groupRosterIds.has(p.id));
          const filteredReserve = reserve.filter(matchesSearch);
          const groupLinked = teamRoster.some((p) => groupRosterIds.has(p.id));
          const showUseRosterBanner = !isAway && teamRoster.length > 0 && !groupLinked;
          const showSaveRosterBanner = !isAway && isProOrAdmin && !!activeTeam && teamRoster.length === 0;
          // Le filtre « Réserve » n'existe que pour mon équipe
          const viewFilter = rosterFilter === "reserve" && (isAway || teamRoster.length === 0) ? "all" : rosterFilter;
          const assignedRolesCount = countSportRoles(currentRoles);
          const teamDisplayName = isAway
            ? (activeMatch.awayTeam || "Équipe B (Adverse)")
            : (activeMatch.homeTeam || "Mon Équipe");

          const th = getPremiumTheme(isModernSleek);
          // Couleur d'équipe : vert pour mon équipe, rouge pour l'adversaire ; or pour le banc
          const acc = isAway
            ? {
              text: isModernSleek ? "text-rose-600" : "text-rose-300",
              chip: isModernSleek ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-rose-500/10 text-rose-300 border-rose-500/25",
              bar: "bg-rose-500",
              btn: isModernSleek ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20" : "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/10",
              selected: isModernSleek ? "bg-white border-rose-400 ring-2 ring-rose-500/15" : "bg-rose-500/[0.06] border-rose-500/50 ring-2 ring-rose-500/10",
              focus: "focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15",
            }
            : {
              text: th.accent,
              chip: th.accentChip,
              bar: th.accentDot,
              btn: th.primaryBtn,
              selected: th.selected,
              focus: isModernSleek ? "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15" : "focus:border-[#00E599]/50 focus:ring-2 focus:ring-[#00E599]/10",
            };
          const fieldBase = `rounded-lg border outline-none transition ${isModernSleek ? "bg-white border-slate-200 text-slate-900 placeholder-slate-400 hover:border-slate-300" : "bg-white/[0.03] border-white/10 text-white placeholder-slate-500 hover:border-white/20"} ${acc.focus}`;
          const optionCls = isModernSleek ? "bg-white text-slate-900" : "bg-[#0f141d] text-white";

          const statusCls = (status?: string) =>
            status === "excellent"
              ? isModernSleek ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
              : status === "tired"
                ? isModernSleek ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-amber-500/10 border-amber-500/25 text-amber-300"
                : isUnavailableStatus(status)
                  ? isModernSleek ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-rose-500/10 border-rose-500/25 text-rose-300"
                  : isModernSleek ? "bg-white border-slate-200 text-slate-700" : "bg-white/[0.03] border-white/10 text-slate-300";

          const unavailableCount = [...starters, ...activeSubs].filter((p) => isUnavailableStatus(p.status)).length;
          const allCount = starters.length + activeSubs.length;

          const sections: { id: "players" | "setpieces"; label: string; icon: React.ElementType; badge: string }[] = [
            { id: "players", label: "Effectif", icon: Users, badge: String(allCount + reserve.length) },
            { id: "setpieces", label: sportRoles.tabLabel, icon: Target, badge: `${assignedRolesCount}/${sportRoles.roles.length}` },
          ];
          const tabMeta = teamRolesModalTab === "players"
            ? {
              title: "Effectif",
              desc: isAway
                ? "Noms, numéros, postes et disponibilité. Les titulaires sont synchronisés avec le terrain."
                : "Constituez le groupe du match : titulaires sur le terrain, remplaçants sur le banc, le reste de l'effectif à disposition.",
            }
            : { title: sportRoles.title, desc: sportRoles.description };

          // Rôles propres au sport actif (lib/sportRoles)
          const roleItems: { key: keyof SetPieceRoleConfig; icon: React.ElementType; label: string; badge: string }[] =
            sportRoles.roles.map((r) => ({ key: r.key, icon: ROLE_ICONS[r.icon], label: r.label, badge: r.badge }));

          // Carte joueur commune aux titulaires et aux remplaçants
          const renderPlayerCard = (player: { id: string; name: string; number?: number; role?: string; photo?: string; status?: string; rosterId?: string }, isStarter: boolean) => {
            const isCaptain = !!player.name && currentRoles.captain === player.name;
            const update = (field: string, val: string) =>
              isStarter ? handleUpdatePitchPlayer(player.id, field as never, val) : handleUpdateSubstitute(player.id, field as never, val);
            const barCls = isStarter ? acc.bar : "bg-amber-500";
            const numberChip = isStarter ? acc.chip : th.goldChip;
            return (
              <div key={player.id} className={`relative rounded-2xl border overflow-hidden transition ${th.card} ${isModernSleek ? "hover:border-slate-300" : "hover:border-white/15"}`}>
                <span className={`absolute left-0 inset-y-0 w-[3px] ${barCls}`} />
                <div className="p-3 pl-4 space-y-2.5">
                  <div className="flex items-center gap-3">
                    {/* Avatar + photo */}
                    <div className={`relative group w-[72px] h-[72px] rounded-2xl border overflow-hidden shrink-0 ${th.cardMuted}`}>
                      <img
                        src={getPlayerDefaultHeadAvatar(player, isAway)}
                        alt={player.name}
                        className={`w-full h-full ${player.photo ? "object-cover" : "object-contain p-0.5"}`}
                      />
                      {player.photo && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerPhoto(player.id, isStarter)}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition z-20 cursor-pointer"
                          title="Supprimer la photo"
                          aria-label="Supprimer la photo"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <label className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer z-10" title="Ajouter ou changer la photo">
                        <Camera className="w-5 h-5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handlePlayerPhotoUpload(player.id, isStarter, e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>

                    {/* Nom + numéro + poste */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        type="text"
                        value={player.name || ""}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder={isStarter ? "Nom du joueur" : "Nom du remplaçant"}
                        className={`w-full px-2.5 py-1.5 text-[13px] font-bold ${fieldBase}`}
                        aria-label="Nom du joueur"
                      />
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <select
                            value={player.number ?? ""}
                            onChange={(e) => handleAssignUniqueNumber(player.id, isStarter, Number(e.target.value), rolesTargetTeam)}
                            className={`appearance-none h-7 pl-2 pr-6 rounded-lg border text-[11px] font-black tabular-nums cursor-pointer outline-none ${numberChip}`}
                            title="Numéro de maillot (unique)"
                            aria-label="Numéro de maillot"
                          >
                            {getAvailableNumbersForPlayer(player.id, player.number, rolesTargetTeam).map((n) => (
                              <option key={n} value={n} className={optionCls}>N° {n}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                        </div>
                        <input
                          type="text"
                          value={player.role || ""}
                          onChange={(e) => update("role", e.target.value)}
                          placeholder="Poste"
                          className={`w-16 h-7 px-1.5 text-[11px] font-black text-center uppercase ${fieldBase}`}
                          aria-label="Poste"
                        />
                        {isCaptain && (
                          <span className={`inline-flex items-center gap-1 h-7 px-2 rounded-lg border text-[10px] font-black ${th.goldChip}`}>
                            <Crown className="w-3 h-3" /> Capitaine
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStarterSubstitute(player.id, isStarter ? "starter" : "substitute", rolesTargetTeam)}
                        className={`h-7 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${th.ghostBtn}`}
                        title={isStarter ? "Envoyer sur le banc" : "Titulariser sur le terrain"}
                      >
                        {isStarter ? <UserMinus className="w-3 h-3 text-amber-500" /> : <UserCheck className={`w-3 h-3 ${acc.text}`} />}
                        {isStarter ? "Banc" : "Terrain"}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenInterTeamSwap(player as never, isStarter, rolesTargetTeam)}
                          className={`h-7 w-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${th.ghostBtn}`}
                          title="Échanger avec une autre équipe du club"
                          aria-label="Échanger avec une autre équipe du club"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-500" />
                        </button>
                        {!isAway && isProOrAdmin && player.rosterId ? (
                          <button
                            type="button"
                            onClick={() => handleMoveToReserve(player.id, isStarter)}
                            className={`h-7 w-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${th.ghostBtn}`}
                            title="Mettre à disposition (hors du groupe de ce match)"
                            aria-label="Mettre à disposition"
                          >
                            <Archive className={`w-3.5 h-3.5 ${th.sub}`} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => (isStarter ? handleDeleteStarter(player.id, rolesTargetTeam) : handleDeleteSubstitute(player.id, rolesTargetTeam))}
                            className={`h-7 w-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${isModernSleek ? "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50" : "bg-white/[0.03] border-white/10 text-slate-500 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10"}`}
                            title="Supprimer ce joueur de l'effectif"
                            aria-label="Supprimer ce joueur de l'effectif"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Disponibilité + postes rapides */}
                  <div className={`flex items-center gap-2 pt-2.5 border-t ${th.border}`}>
                    <select
                      value={player.status || "normal"}
                      onChange={(e) => update("status", e.target.value)}
                      className={`h-7 px-2 rounded-lg border text-[10px] font-bold cursor-pointer outline-none shrink-0 ${statusCls(player.status)}`}
                      aria-label="Disponibilité"
                    >
                      <option value="normal" className={optionCls}>🟢 Disponible</option>
                      <option value="excellent" className={optionCls}>⚡ En forme</option>
                      <option value="tired" className={optionCls}>🥱 Fatigué</option>
                      <option value="injured" className={optionCls}>🩹 Blessé</option>
                      <option value="suspended" className={optionCls}>🟥 Suspendu</option>
                      <option value="absent" className={optionCls}>🚫 Absent</option>
                    </select>
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
                      {availablePositions.slice(0, 6).map((pos) => {
                        const isSel = (player.role || "").toUpperCase() === pos.toUpperCase();
                        return (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => update("role", pos)}
                            className={`h-6 px-1.5 rounded-md border text-[9.5px] font-black shrink-0 transition cursor-pointer ${isSel ? (isStarter ? acc.chip : th.goldChip) : `${th.segmentIdle} border-transparent`}`}
                          >
                            {pos}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          // Carte d'un joueur en réserve : fiche de l'effectif, hors du groupe de ce match
          const renderReserveCard = (player: TeamRosterPlayer) => {
            const unavailable = isUnavailableStatus(player.status);
            return (
              <div key={player.id} className={`relative rounded-2xl border overflow-hidden transition ${th.cardMuted}`}>
                <span className={`absolute left-0 inset-y-0 w-[3px] ${isModernSleek ? "bg-slate-300" : "bg-slate-600"}`} />
                <div className="p-3 pl-4 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl border overflow-hidden shrink-0 ${th.card}`}>
                    <img
                      src={getPlayerDefaultHeadAvatar(player, false)}
                      alt={player.name}
                      className={`w-full h-full ${player.photo ? "object-cover" : "object-contain p-0.5"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updateRosterPlayer(player.id, { name: e.target.value })}
                      className={`w-full px-2.5 py-1.5 text-[13px] font-bold ${fieldBase}`}
                      aria-label={`Nom de ${player.name}`}
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`h-6 px-2 rounded-lg border text-[11px] font-black tabular-nums inline-flex items-center ${th.chip}`}>N° {player.number}</span>
                      <span className={`h-6 px-2 rounded-lg border text-[11px] font-black inline-flex items-center ${th.chip}`}>{player.role}</span>
                      {unavailable && (
                        <span className={`h-6 px-2 rounded-lg border text-[10px] font-bold inline-flex items-center ${statusCls(player.status)}`}>
                          {player.status === "injured" ? "Blessé" : "Suspendu"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReserveToBench(player.id)}
                      className={`h-8 px-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${th.ghostBtn}`}
                      title="Ajouter au groupe du match (sur le banc)"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-500" /> Banc
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRosterPlayer(player.id)}
                      className={`h-8 w-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${isModernSleek ? "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50" : "bg-white/[0.03] border-white/10 text-slate-500 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10"}`}
                      title="Retirer ce joueur de l'équipe"
                      aria-label={`Retirer ${player.name} de l'équipe`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          };

          const sectionHead = (label: string, count: number, dot: string, right?: React.ReactNode) => (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className={`text-[11px] font-black uppercase tracking-[0.14em] flex items-center gap-2 ${th.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
                <span className={`tabular-nums ${th.faint}`}>{count}</span>
              </p>
              {right}
            </div>
          );

          return (
            <div className={`${premiumOverlay} z-[150]`}>
              <div className={`${premiumShell} w-full max-w-6xl h-[94vh] sm:h-[90vh] ${th.panel}`}>
                {!isModernSleek && (
                  <div className={`absolute -top-40 left-40 w-[520px] h-[320px] rounded-full blur-3xl pointer-events-none ${isAway ? "bg-rose-500/[0.05]" : "bg-[#00E599]/[0.05]"}`} />
                )}

                {/* ================= SIDEBAR ================= */}
                <aside className={`hidden md:flex w-64 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
                  <div className="px-5 pt-6 pb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${acc.chip}`}>
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="leading-tight min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${acc.text}`}>{isAway ? "Adversaire" : "Mon équipe"}</p>
                        <p className={`text-sm font-black truncate ${th.text}`}>{teamDisplayName}</p>
                      </div>
                    </div>
                  </div>

                  <nav className="px-3 space-y-1">
                    <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>Effectif & rôles</p>
                    {sections.map((sec) => {
                      const Icon = sec.icon;
                      const isActive = teamRolesModalTab === sec.id;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setTeamRolesModalTab(sec.id)}
                          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? th.navActive : th.navIdle}`}
                        >
                          {isActive && <span className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${acc.bar}`} />}
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? acc.text : ""}`} />
                          <span className="flex-1 text-left">{sec.label}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border tabular-nums ${th.chip}`}>{sec.badge}</span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Résumé */}
                  <div className="px-3 mt-5">
                    <div className={`p-3 rounded-2xl border grid grid-cols-2 gap-2 ${th.card}`}>
                      {[
                        { label: "Titulaires", value: starters.length, cls: acc.text },
                        { label: "Remplaçants", value: activeSubs.length, cls: th.gold },
                        ...(!isAway && teamRoster.length > 0 ? [{ label: "À disposition", value: reserve.length, cls: th.sub }] : []),
                        { label: "Rôles", value: `${assignedRolesCount}/${sportRoles.roles.length}`, cls: th.text },
                        { label: "Indisponibles", value: unavailableCount, cls: unavailableCount > 0 ? (isModernSleek ? "text-rose-600" : "text-rose-300") : th.text },
                      ].map((k) => (
                        <div key={k.label} className={`p-2 rounded-xl border ${th.cardMuted}`}>
                          <p className={`text-lg font-black tabular-nums leading-none ${k.cls}`}>{k.value}</p>
                          <p className={`text-[9.5px] font-bold mt-1 ${th.sub}`}>{k.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto p-3 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenInterTeamSwap(undefined, undefined, rolesTargetTeam)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${th.ghostBtn}`}
                      title="Échanger un joueur avec une autre équipe du club"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="flex-1 text-left">Échanger avec une équipe</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border tabular-nums ${th.chip}`}>{teams.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoRenumberSquad(rolesTargetTeam)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${th.ghostBtn}`}
                      title="Renuméroter automatiquement de 1 à N sans doublon"
                    >
                      <Hash className={`w-3.5 h-3.5 ${th.gold}`} />
                      <span className="flex-1 text-left">Renuméroter de 1 à N</span>
                    </button>
                  </div>
                </aside>

                {/* ================= MAIN ================= */}
                <main className="flex-1 min-w-0 flex flex-col relative z-10 min-h-0">
                  <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${th.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className={`md:hidden text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${acc.text}`}>{teamDisplayName}</p>
                        <h2 className={`text-lg sm:text-xl font-black tracking-tight ${th.text}`}>{tabMeta.title}</h2>
                        <p className={`text-xs mt-1 ${th.sub}`}>{tabMeta.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSetPiecesOpen(false)}
                        className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${th.ghostBtn}`}
                        title="Fermer"
                        aria-label="Fermer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Onglets mobiles */}
                    <div className={`md:hidden mt-4 flex gap-1 p-1 rounded-xl border ${th.segment}`}>
                      {sections.map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setTeamRolesModalTab(sec.id)}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${teamRolesModalTab === sec.id ? th.segmentActive : th.segmentIdle}`}
                        >
                          {sec.label} <span className={th.faint}>{sec.badge}</span>
                        </button>
                      ))}
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 space-y-5 scrollbar-thin">

                    {/* ---------- EFFECTIF ---------- */}
                    {teamRolesModalTab === "players" && (
                      <>
                        {/* Barre de contrôle */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${th.faint}`} />
                            <input
                              type="text"
                              value={rosterSearchQuery}
                              onChange={(e) => setRosterSearchQuery(e.target.value)}
                              placeholder="Rechercher un nom, un numéro, un poste…"
                              className={`w-full rounded-xl pl-9 pr-8 py-2 text-xs border outline-none transition ${th.input}`}
                            />
                            {rosterSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setRosterSearchQuery("")}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md cursor-pointer ${th.faint} hover:opacity-70`}
                                aria-label="Effacer la recherche"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className={`flex items-center gap-0.5 p-1 rounded-xl border ${th.segment}`}>
                            {([
                              { v: "all", l: "Tous", n: allCount + reserve.length },
                              { v: "starters", l: "Titulaires", n: starters.length },
                              { v: "subs", l: "Banc", n: activeSubs.length },
                              ...(!isAway && teamRoster.length > 0 ? [{ v: "reserve", l: "À disposition", n: reserve.length }] : []),
                            ] as { v: "all" | "starters" | "subs" | "reserve"; l: string; n: number }[]).map((f) => (
                              <button
                                key={f.v}
                                type="button"
                                onClick={() => setRosterFilter(f.v)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${viewFilter === f.v ? th.segmentActive : th.segmentIdle}`}
                              >
                                {f.l}
                                <span className={`tabular-nums text-[10px] ${viewFilter === f.v ? acc.text : th.faint}`}>{f.n}</span>
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddNewSubstitute(rolesTargetTeam)}
                            className={`ml-auto px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${acc.btn}`}
                          >
                            <UserPlus className="w-4 h-4" />
                            Ajouter un joueur
                          </button>
                        </div>

                        {/* Filtre par poste */}
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
                          <span className={`text-[10px] font-black uppercase tracking-[0.14em] shrink-0 mr-1 ${th.faint}`}>Poste</span>
                          {["ALL", ...availablePositions].map((pos) => {
                            const isAll = pos === "ALL";
                            const isSelected = isAll ? rosterPositionFilter === "ALL" : rosterPositionFilter.toUpperCase() === pos.toUpperCase();
                            const count = isAll ? allCount : [...starters, ...activeSubs].filter((p) => {
                              const playerRole = (p.role || "").toUpperCase().trim();
                              const filterPos = pos.toUpperCase().trim();
                              if (filterPos === "SUB") return playerRole.includes("SUB") || playerRole.includes("REMP") || playerRole.includes("BANC");
                              return playerRole === filterPos;
                            }).length;
                            return (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => setRosterPositionFilter(isAll || isSelected ? "ALL" : pos)}
                                className={`h-7 px-2.5 rounded-lg border text-[10.5px] font-black flex items-center gap-1.5 shrink-0 transition cursor-pointer ${isSelected
                                  ? acc.chip
                                  : count > 0
                                    ? `${th.selectable} ${th.body}`
                                    : `${th.selectable} ${th.faint} opacity-60`
                                  }`}
                                title={isAll ? "Tous les postes" : `Filtrer les joueurs au poste ${pos}`}
                              >
                                {isAll ? "Tous" : pos}
                                {count > 0 && <span className={`tabular-nums text-[9.5px] ${isSelected ? "" : th.faint}`}>{count}</span>}
                              </button>
                            );
                          })}
                        </div>

                        {/* Lien avec l'effectif de l'équipe */}
                        {showUseRosterBanner && (
                          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${th.card}`}>
                            <div className="min-w-0">
                              <p className={`text-xs font-black ${th.text}`}>Ce match n&apos;utilise pas encore l&apos;effectif de {activeTeam?.name || "l'équipe"}</p>
                              <p className={`text-[11px] mt-0.5 ${th.sub}`}>{teamRoster.length} joueurs dans l&apos;effectif. Les titulaires prennent les places du terrain, les autres vont sur le banc.</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleApplyTeamRosterToGroup}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${acc.btn}`}
                            >
                              <Users className="w-4 h-4" /> Utiliser l&apos;effectif
                            </button>
                          </div>
                        )}
                        {showSaveRosterBanner && (
                          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${th.card}`}>
                            <div className="min-w-0">
                              <p className={`text-xs font-black ${th.text}`}>{activeTeam?.name} n&apos;a pas encore d&apos;effectif enregistré</p>
                              <p className={`text-[11px] mt-0.5 ${th.sub}`}>Enregistrez ce groupe comme effectif de l&apos;équipe : vous pourrez ensuite gérer les joueurs à disposition et le réutiliser à chaque match.</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveGroupAsTeamRoster}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${acc.btn}`}
                            >
                              <Save className="w-4 h-4" /> Enregistrer comme effectif
                            </button>
                          </div>
                        )}

                        {/* Titulaires */}
                        {(viewFilter === "all" || viewFilter === "starters") && (
                          <section className="space-y-2.5">
                            {sectionHead("Titulaires", filteredStarters.length, acc.bar, (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${th.chip}`}>
                                <RefreshCw className={`w-3 h-3 ${acc.text}`} /> Synchronisé avec le terrain
                              </span>
                            ))}
                            {filteredStarters.length === 0 ? (
                              <div className={`p-6 text-center rounded-2xl border border-dashed text-xs ${th.cardMuted} ${th.sub}`}>
                                Aucun titulaire ne correspond à votre recherche.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                                {filteredStarters.map((p) => renderPlayerCard(p, true))}
                              </div>
                            )}
                          </section>
                        )}

                        {/* Remplaçants */}
                        {(viewFilter === "all" || viewFilter === "subs") && (
                          <section className="space-y-2.5">
                            {sectionHead("Remplaçants", filteredSubs.length, "bg-amber-500", (
                              <button
                                type="button"
                                onClick={() => handleAddNewSubstitute(rolesTargetTeam)}
                                className={`inline-flex items-center gap-1 text-[11px] font-bold transition cursor-pointer hover:opacity-80 ${th.gold}`}
                              >
                                <Plus className="w-3.5 h-3.5" /> Ajouter
                              </button>
                            ))}
                            {filteredSubs.length === 0 ? (
                              <div className={`p-6 text-center rounded-2xl border border-dashed text-xs ${th.cardMuted} ${th.sub}`}>
                                Aucun remplaçant ne correspond à votre recherche.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                                {filteredSubs.map((s) => renderPlayerCard(s, false))}
                              </div>
                            )}
                          </section>
                        )}

                        {/* Réserve : joueurs de l'effectif hors du groupe de ce match */}
                        {!isAway && teamRoster.length > 0 && (viewFilter === "all" || viewFilter === "reserve") && (
                          <section className="space-y-2.5">
                            {sectionHead("À disposition", filteredReserve.length, isModernSleek ? "bg-slate-300" : "bg-slate-500", (
                              <span className={`text-[10px] font-bold ${th.faint}`}>Hors du groupe de ce match</span>
                            ))}
                            {filteredReserve.length === 0 ? (
                              <div className={`p-6 text-center rounded-2xl border border-dashed text-xs ${th.cardMuted} ${th.sub}`}>
                                {reserve.length === 0
                                  ? "Tout l'effectif est dans le groupe du match. Utilisez le bouton « Mettre à disposition » d'un joueur pour l'en sortir."
                                  : "Aucun joueur à disposition ne correspond à votre recherche."}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                                {filteredReserve.map((p) => renderReserveCard(p))}
                              </div>
                            )}
                          </section>
                        )}
                      </>
                    )}

                    {/* ---------- COUPS ARRÊTÉS ---------- */}
                    {teamRolesModalTab === "setpieces" && (
                      <>
                        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${th.card}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${acc.chip}`}>
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`text-xs font-black ${th.text}`}>Effectif éligible</p>
                              <p className={`text-[11px] ${th.sub}`}>{starters.length} titulaires · {activeSubs.length} remplaçants</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isAway) setOpponentSetPieceRoles(defaultSetPieceRoles);
                                else setSetPieceRoles(defaultSetPieceRoles);
                              }}
                              className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}
                            >
                              Tout effacer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAutoAssignSetPieces(rolesTargetTeam)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${acc.btn}`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              Attribution rapide
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {roleItems.map((roleItem) => {
                            const Icon = roleItem.icon;
                            const assignedName = currentRoles[roleItem.key];
                            const assignedPlayer =
                              starters.find((p) => p.name === assignedName) ||
                              activeSubs.find((s) => s.name === assignedName);
                            return (
                              <div key={roleItem.key} className={`p-4 rounded-2xl border transition ${assignedName ? acc.selected : th.card}`}>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${roleItem.key === "captain" ? th.goldTile : assignedName ? acc.chip : th.cardMuted}`}>
                                      <Icon className={`w-4 h-4 ${roleItem.key === "captain" || assignedName ? "" : th.faint}`} />
                                    </div>
                                    <p className={`text-[13px] font-black truncate ${th.text}`}>{roleItem.label}</p>
                                  </div>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-black uppercase tracking-wider shrink-0 ${assignedName ? acc.chip : th.chip}`}>
                                    {roleItem.badge}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className={`relative w-10 h-10 rounded-xl border overflow-hidden shrink-0 flex items-center justify-center ${th.cardMuted}`}>
                                    {assignedPlayer ? (
                                      <>
                                        <img
                                          src={getPlayerDefaultHeadAvatar(assignedPlayer, isAway)}
                                          alt={assignedPlayer.name}
                                          className={`w-full h-full ${assignedPlayer.photo ? "object-cover" : "object-contain p-0.5"}`}
                                        />
                                        <span className={`absolute bottom-0 left-0 text-[8px] font-black px-1 rounded-tr leading-tight border-t border-r ${acc.chip}`}>
                                          #{assignedPlayer.number ?? "?"}
                                        </span>
                                      </>
                                    ) : (
                                      <User className={`w-4 h-4 ${th.faint}`} />
                                    )}
                                  </div>
                                  <select
                                    value={assignedName}
                                    onChange={(e) => updateRole(roleItem.key, e.target.value)}
                                    className={`flex-1 min-w-0 h-10 px-3 text-xs font-bold cursor-pointer ${fieldBase}`}
                                    aria-label={roleItem.label}
                                  >
                                    <option value="" className={optionCls}>— Non attribué —</option>
                                    <optgroup label="Titulaires">
                                      {starters.map((p) => (
                                        <option key={p.id} value={p.name} className={optionCls}>
                                          N°{p.number || "?"} · {p.name}{p.role ? ` (${p.role})` : ""}
                                        </option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Remplaçants">
                                      {activeSubs.map((s) => (
                                        <option key={s.id} value={s.name} className={optionCls}>
                                          N°{s.number || "?"} · {s.name}{s.role ? ` (${s.role})` : ""}
                                        </option>
                                      ))}
                                    </optgroup>
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Composition du mur sur coup franc (football) : faite sur le terrain, en glissant les joueurs sur le mur */}
                        {isFootballBoard && (() => {
                          const team: WallTeam = isAway ? "away" : "home";
                          const count = wallCountFor(team);
                          const wallOnPitch = findWall(team);
                          const members = wallMembers(team, count);
                          const filled = members.filter(Boolean).length;
                          return (
                            <div className={`p-4 rounded-2xl border ${filled ? acc.selected : th.card}`}>
                              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${filled ? acc.chip : th.cardMuted}`}>
                                    <BrickWall className={`w-4 h-4 ${filled ? "" : th.faint}`} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-[13px] font-black ${th.text}`}>Composition du mur</p>
                                    <p className={`text-[11px] ${th.sub}`}>
                                      {wallOnPitch ? `Coups francs · ${filled}/${count} places occupées · glissez les joueurs du terrain sur le mur` : "Aucun mur sur le terrain"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5" role="group" aria-label="Nombre de places dans le mur">
                                    <button type="button" disabled={count <= WALL_MIN} onClick={() => handleSetWallCount(team, count - 1)} className={`h-8 w-8 rounded-lg border flex items-center justify-center transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${th.ghostBtn}`} aria-label="Une place de moins"><Minus className="w-3.5 h-3.5" /></button>
                                    <span className={`w-16 text-center text-xs font-black tabular-nums ${th.text}`}>{count} place{count > 1 ? "s" : ""}</span>
                                    <button type="button" disabled={count >= WALL_MAX} onClick={() => handleSetWallCount(team, count + 1)} className={`h-8 w-8 rounded-lg border flex items-center justify-center transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${th.ghostBtn}`} aria-label="Une place de plus"><Plus className="w-3.5 h-3.5" /></button>
                                  </div>
                                  {wallOnPitch && (
                                    <button type="button" onClick={() => handleAutoFillWall(team)} disabled={filled >= count} className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${th.ghostBtn}`} title="Remplit les places libres avec des joueurs du terrain (défenseurs centraux et milieux défensifs d'abord, sans gardien ni tireur de coup franc)">
                                      <Zap className="w-3.5 h-3.5" />Remplir
                                    </button>
                                  )}
                                  <button type="button" onClick={() => handlePlaceWall(team)} className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${acc.btn}`}>
                                    {wallOnPitch ? "Replacer face au ballon" : "Placer le mur"}
                                  </button>
                                </div>
                              </div>
                              {wallOnPitch && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {members.map((m, i) => (
                                    <div key={i} className={`h-10 px-2.5 rounded-xl border flex items-center gap-2 ${m ? th.card : th.cardMuted}`}>
                                      <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[11px] font-black shrink-0 ${m ? acc.chip : th.chip}`}>{i + 1}</span>
                                      <span className={`flex-1 min-w-0 truncate text-xs font-bold ${m ? th.text : th.faint}`}>{m ? `N°${m.number ?? "?"} · ${m.name}` : "Place libre"}</span>
                                      {m && (
                                        <button type="button" onClick={() => handleReleaseFromWall(m.id)} aria-label={`Sortir ${m.name} du mur`} title="Sortir du mur (le joueur revient sur le terrain)" className={`h-7 w-7 rounded-lg border flex items-center justify-center cursor-pointer shrink-0 ${th.ghostBtn}`}>
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {/* Pied */}
                  <footer className={`px-5 sm:px-8 py-4 border-t flex items-center justify-between gap-3 flex-wrap ${th.border}`}>
                    <p className={`text-[11px] font-medium tabular-nums ${th.sub}`}>
                      {starters.length} titulaires · {activeSubs.length} remplaçants · {assignedRolesCount} rôles attribués
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSetPiecesOpen(false)}
                      className={`h-10 px-5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${acc.btn}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Terminé
                    </button>
                  </footer>
                </main>

                {/* ========================================================= */}
                {/* INTER-TEAM PLAYER SWAP MODAL OVERLAY */}
                {/* ========================================================= */}
                {isInterTeamSwapOpen && (() => {
                  const currentIsAway = (swapSourcePlayer?.teamTarget || rolesTargetTeam) === "away";
                  const sourceTeamStarters = currentTokens.filter((t) => currentIsAway ? t.type === "player_b" : t.type === "player_a");
                  const sourceTeamBench = currentIsAway ? opponentSubstitutes : substitutes;
                  const allSourcePlayers = [
                    ...sourceTeamStarters.map(p => ({ ...p, isStarter: true })),
                    ...sourceTeamBench.map(s => ({ ...s, isStarter: false }))
                  ];

                  // Selected target team and its roster
                  const targetTeamObj = teams.find(t => t.id === swapTargetTeamId) || teams.find(t => t.id !== activeTeamId) || teams[0];
                  const targetRoster = getRosterForTeam(targetTeamObj.id);

                  // Filter target team roster
                  const filteredTargetRoster = targetRoster.filter(p => {
                    if (swapPositionFilter !== "ALL") {
                      const pRole = (p.role || "").toUpperCase().trim();
                      const fPos = swapPositionFilter.toUpperCase().trim();
                      if (fPos === "GB" && !pRole.includes("G") && !pRole.includes("GB")) return false;
                      if (fPos === "DEF" && !pRole.includes("DC") && !pRole.includes("DD") && !pRole.includes("DG") && !pRole.includes("DEF")) return false;
                      if (fPos === "MIL" && !pRole.includes("MC") && !pRole.includes("MDC") && !pRole.includes("MOC") && !pRole.includes("MD") && !pRole.includes("MG")) return false;
                      if (fPos === "ATT" && !pRole.includes("BU") && !pRole.includes("AC") && !pRole.includes("AiD") && !pRole.includes("AiG") && !pRole.includes("ATT")) return false;
                    }
                    if (!swapSearchQuery.trim()) return true;
                    const q = swapSearchQuery.toLowerCase();
                    return (
                      (p.name || "").toLowerCase().includes(q) ||
                      String(p.number || "").includes(q) ||
                      (p.role || "").toLowerCase().includes(q)
                    );
                  });

                  const selectedTargetPlayer = targetRoster.find(p => p.id === swapTargetPlayerId);
                  const otherTeamsList = teams.filter(t => t.id !== activeTeamId);

                  return (
                    <div className="fixed inset-0 bg-black/85 z-[160] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-fade-in">
                      <div className={`max-w-4xl w-full rounded-2xl sm:rounded-3xl shadow-2xl relative my-6 flex flex-col max-h-[92vh] overflow-hidden border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b1019] border-cyan-500/40 text-white"
                        }`}>

                        {/* Glow accents */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Header */}
                        <div className={`p-4 sm:p-5 border-b shrink-0 relative z-10 ${isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-gradient-to-r from-[#0d1424] via-[#101b30] to-[#0d1424] border-[#1f293d]"
                          }`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl sm:rounded-2xl border flex items-center justify-center text-xl shadow-inner ${isModernSleek ? "bg-cyan-100 border-cyan-300 text-cyan-800" : "bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border-cyan-500/50 text-cyan-400"
                                }`}>
                                <ArrowLeftRight className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                                    PASSERELLE & ÉCHANGE INTER-ÉQUIPES DU CLUB
                                  </h3>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${isModernSleek ? "bg-cyan-100 border-cyan-300 text-cyan-800" : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                    }`}>
                                    {teams.length} ÉQUIPES GÉRÉES
                                  </span>
                                </div>
                                <p className={`text-[11px] font-medium mt-0.5 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                                  Échangez un joueur de votre effectif actuel avec un joueur d&apos;une autre équipe de votre club (promotion, réserve, U19, renfort...).
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setIsInterTeamSwapOpen(false);
                                setSwapNotification(null);
                              }}
                              className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer font-bold shrink-0 ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
                                }`}
                              title="Fermer la passerelle"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Success / Info Notification Banner */}
                        {swapNotification && (
                          <div className={`mx-4 mt-4 p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 animate-fade-in shadow-md ${isModernSleek ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                            }`}>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{swapNotification.message}</span>
                            </div>
                            <button
                              onClick={() => setSwapNotification(null)}
                              className="text-emerald-700 hover:text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* Modal Body */}
                        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 scrollbar-thin relative z-10">

                          {/* Top Grid: Source Player on Left vs Target Team Selector on Right */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* LEFT BOX: SOURCE PLAYER (CURRENT SQUAD) */}
                            <div className={`rounded-2xl border p-3.5 space-y-3 ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e1524] border-[#1f293d]"
                              }`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"
                                  }`}>
                                  <Shield className={`w-3.5 h-3.5 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} />
                                  <span>1. Équipe Source : <strong className={isModernSleek ? "text-slate-900" : "text-white"}>{activeTeam?.name}</strong></span>
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${swapSourcePlayer?.isStarter
                                  ? isModernSleek ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/40"
                                  : isModernSleek ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  }`}>
                                  {swapSourcePlayer?.isStarter ? "🟢 Titulaire" : "🔄 Remplaçant"}
                                </span>
                              </div>

                              {/* Selector to change source player if desired */}
                              <div className="space-y-1">
                                <label className={`text-[9.5px] font-bold uppercase ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                                  Joueur sélectionné pour l&apos;échange :
                                </label>
                                <select
                                  value={swapSourcePlayer?.id || ""}
                                  onChange={(e) => {
                                    const chosen = allSourcePlayers.find(p => p.id === e.target.value);
                                    if (chosen) {
                                      setSwapSourcePlayer({
                                        id: chosen.id,
                                        name: chosen.name,
                                        number: chosen.number || 10,
                                        role: chosen.role || (chosen.isStarter ? "Titulaire" : "SUB"),
                                        photo: chosen.photo,
                                        status: chosen.status || "normal",
                                        isStarter: chosen.isStarter,
                                        teamTarget: currentIsAway ? "away" : "home"
                                      });
                                    }
                                  }}
                                  className={`w-full rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer border ${isModernSleek ? "bg-white border-slate-300 text-slate-900 focus:border-cyan-500 shadow-xs" : "bg-[#141d2e] border-[#1f293d] text-white focus:border-cyan-400"
                                    }`}
                                >
                                  <optgroup label="Titulaires sur le terrain">
                                    {sourceTeamStarters.map(p => (
                                      <option key={p.id} value={p.id} className={isModernSleek ? "bg-white text-slate-900 font-bold" : "bg-[#0d1117] text-white font-bold"}>
                                        [Titulaire] N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Remplaçants sur le banc">
                                    {sourceTeamBench.map(s => (
                                      <option key={s.id} value={s.id} className={isModernSleek ? "bg-white text-slate-900 font-bold" : "bg-[#0d1117] text-white font-bold"}>
                                        [Banc] N°{s.number || "?"} - {s.name} ({s.role || "SUB"})
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>

                              {/* Source Player Visual Card */}
                              {swapSourcePlayer && (
                                <div className={`p-3 rounded-xl border flex items-center gap-3 shadow-xs ${isModernSleek ? "bg-white border-slate-200" : "bg-[#080d16] border-cyan-500/30"
                                  }`}>
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-sm overflow-hidden shrink-0 shadow-xs ${isModernSleek ? "bg-cyan-50 text-cyan-800 border-cyan-300" : "bg-gradient-to-br from-cyan-950 to-blue-950 border-cyan-500/40 text-cyan-300"
                                    }`}>
                                    <img
                                      src={getPlayerDefaultHeadAvatar(swapSourcePlayer, currentIsAway)}
                                      alt={swapSourcePlayer.name}
                                      className={`w-full h-full ${swapSourcePlayer.photo ? "object-cover" : "object-contain p-0.5"}`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-black truncate ${isModernSleek ? "text-slate-900" : "text-white"}`}>{swapSourcePlayer.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border ${isModernSleek ? "bg-cyan-50 border-cyan-200 text-cyan-800" : "bg-cyan-950 border-cyan-500/40 text-cyan-300"
                                        }`}>
                                        Poste : {swapSourcePlayer.role}
                                      </span>
                                      <span className={`text-[9.5px] font-bold ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                                        N°{swapSourcePlayer.number}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className={`text-[9px] px-2 py-1 rounded font-bold block border ${isModernSleek ? "bg-cyan-50 text-cyan-800 border-cyan-200" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                      }`}>
                                      En partance ➔
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* RIGHT BOX: TARGET TEAM SELECTOR */}
                            <div className={`rounded-2xl border p-3.5 space-y-3 ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e1524] border-[#1f293d]"
                              }`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"
                                  }`}>
                                  <Users className={`w-3.5 h-3.5 ${isModernSleek ? "text-cyan-700" : "text-cyan-400"}`} />
                                  <span>2. Choisir l&apos;Équipe Partenaire :</span>
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${isModernSleek ? "bg-white text-slate-600 border-slate-200" : "bg-[#141d2e] text-slate-400 border-[#1f293d]"
                                  }`}>
                                  {otherTeamsList.length} équipe(s) disponible(s)
                                </span>
                              </div>

                              {/* Target Team Pills */}
                              <div className="flex flex-wrap gap-1.5">
                                {otherTeamsList.map(team => {
                                  const isSelected = team.id === swapTargetTeamId;
                                  const rosterCount = getRosterForTeam(team.id).length;
                                  return (
                                    <button
                                      key={team.id}
                                      type="button"
                                      onClick={() => {
                                        setSwapTargetTeamId(team.id);
                                        setSwapTargetPlayerId(null);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-xs ${isSelected
                                        ? isModernSleek
                                          ? "bg-cyan-600 text-white border-cyan-600 font-black shadow-md"
                                          : "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20"
                                        : isModernSleek
                                          ? "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:text-slate-900"
                                          : "bg-[#141d2e] text-slate-300 border-[#1f293d] hover:border-slate-500 hover:text-white"
                                        }`}
                                    >
                                      <span>🛡️</span>
                                      <span>{team.name}</span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${isSelected
                                        ? "bg-black/20 text-white"
                                        : isModernSleek ? "bg-slate-100 text-slate-600" : "bg-[#0b1019] text-slate-400"
                                        }`}>
                                        {rosterCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Current Target Team Info Banner */}
                              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${isModernSleek ? "bg-white border-slate-200" : "bg-[#080d16] border-[#1f293d]"
                                }`}>
                                <div>
                                  <span className={`font-medium text-[10px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Équipe sélectionnée : </span>
                                  <strong className={`font-bold ${isModernSleek ? "text-cyan-800" : "text-cyan-300"}`}>{targetTeamObj.name}</strong>
                                  <span className={`text-[9px] ml-1.5 uppercase ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>({targetTeamObj.category})</span>
                                </div>
                                <span className={`text-[10px] font-bold ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                                  {targetRoster.length} joueurs sous contrat
                                </span>
                              </div>
                            </div>

                          </div>

                          {/* MIDDLE SECTION: TARGET TEAM ROSTER & PLAYER SELECTION */}
                          <div className={`rounded-2xl border p-3.5 space-y-3 ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#0e1524] border-[#1f293d]"
                            }`}>
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                              <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isModernSleek ? "text-slate-800" : "text-slate-200"
                                }`}>
                                <span>⚡</span>
                                <span>3. Choisir le Joueur de {targetTeamObj.name} à échanger ({filteredTargetRoster.length}) :</span>
                              </span>

                              {/* Search & Filter */}
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[170px]">
                                  <Search className={`w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 ${isModernSleek ? "text-slate-400" : "text-slate-400"}`} />
                                  <input
                                    type="text"
                                    value={swapSearchQuery}
                                    onChange={(e) => setSwapSearchQuery(e.target.value)}
                                    placeholder="Filtrer nom ou poste..."
                                    className={`w-full rounded-xl pl-7 pr-2.5 py-1 text-xs focus:outline-none border ${isModernSleek
                                      ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500 shadow-xs"
                                      : "bg-[#141d2e] border-[#1f293d] text-white placeholder-slate-500 focus:border-cyan-400"
                                      }`}
                                  />
                                  {swapSearchQuery && (
                                    <button
                                      onClick={() => setSwapSearchQuery("")}
                                      className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs cursor-pointer ${isModernSleek ? "text-slate-400 hover:text-slate-700" : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>

                                {/* Position Filter Pills */}
                                <div className={`flex items-center gap-1 p-1 rounded-xl border text-[9.5px] ${isModernSleek ? "bg-slate-200/60 border-slate-200" : "bg-[#141d2e] border-[#1f293d]"
                                  }`}>
                                  {["ALL", "GB", "DEF", "MIL", "ATT"].map((pos) => (
                                    <button
                                      key={pos}
                                      type="button"
                                      onClick={() => setSwapPositionFilter(pos)}
                                      className={`px-2 py-0.5 rounded-lg font-black transition cursor-pointer ${swapPositionFilter === pos
                                        ? isModernSleek ? "bg-cyan-600 text-white shadow-xs" : "bg-cyan-500 text-slate-950 shadow-sm"
                                        : isModernSleek ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                      {pos === "ALL" ? "Tous" : pos}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Roster Cards Grid */}
                            {filteredTargetRoster.length === 0 ? (
                              <div className={`p-6 text-center rounded-2xl border text-xs ${isModernSleek ? "bg-white border-slate-200 text-slate-500" : "bg-[#080d16] border-[#1f293d] text-slate-400"
                                }`}>
                                Aucun joueur ne correspond aux critères de filtre.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                                {filteredTargetRoster.map((player) => {
                                  const isSelected = player.id === swapTargetPlayerId;
                                  return (
                                    <div
                                      key={player.id}
                                      onClick={() => setSwapTargetPlayerId(player.id)}
                                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 shadow-xs ${isSelected
                                        ? isModernSleek
                                          ? "bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/30 text-cyan-950"
                                          : "bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/40 text-white"
                                        : isModernSleek
                                          ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300"
                                          : "bg-[#080d16] hover:bg-[#121c2e] border-[#1f293d] text-slate-300 hover:border-slate-500"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border ${isSelected
                                          ? "bg-white border-cyan-500 shadow-xs"
                                          : isModernSleek ? "bg-cyan-50 border-cyan-200" : "bg-[#141d2e] border-[#1f293d]"
                                          }`}>
                                          <img
                                            src={getPlayerDefaultHeadAvatar(player, false)}
                                            alt={player.name}
                                            className={`w-full h-full ${player.photo ? "object-cover" : "object-contain p-0.5"}`}
                                          />
                                          <span className={`absolute bottom-0 left-0 text-[7.5px] font-black px-1 rounded-tr leading-tight border-t border-r ${isSelected
                                            ? "bg-cyan-600 text-white border-cyan-500"
                                            : isModernSleek ? "bg-white/95 text-cyan-800 border-cyan-200" : "bg-slate-950/90 text-cyan-300 border-cyan-500/40"
                                            }`}>
                                            #{player.number}
                                          </span>
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold truncate leading-tight">{player.name}</p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${isModernSleek ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-[#141d2e] text-cyan-300 border border-[#1f293d]"
                                              }`}>
                                              {player.role || "JOUEUR"}
                                            </span>
                                            <span className={`text-[8.5px] font-bold ${player.status === "excellent"
                                              ? isModernSleek ? "text-emerald-700" : "text-emerald-400"
                                              : isModernSleek ? "text-slate-500" : "text-slate-400"
                                              }`}>
                                              {player.status === "excellent" ? "⚡ En forme" : "🟢 Prêt"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="shrink-0">
                                        {isSelected ? (
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shadow ${isModernSleek ? "bg-cyan-600 text-white" : "bg-cyan-400 text-slate-950"
                                            }`}>
                                            ✓
                                          </span>
                                        ) : (
                                          <span className={`text-[9px] font-bold ${isModernSleek ? "text-slate-400 hover:text-cyan-700" : "text-slate-500 hover:text-cyan-300"}`}>
                                            Choisir ➔
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* BOTTOM SECTION: DUO COMPARISON PREVIEW & ACTION CTA */}
                          {selectedTargetPlayer && swapSourcePlayer && (
                            <div className={`rounded-2xl border p-4 space-y-3 animate-fade-in shadow-lg ${isModernSleek
                              ? "bg-gradient-to-r from-cyan-50/80 via-slate-50 to-emerald-50/80 border-cyan-200"
                              : "bg-gradient-to-r from-cyan-950/50 via-[#0a1628] to-blue-950/50 border-cyan-500/40"
                              }`}>
                              <div className={`flex items-center justify-between border-b pb-2 ${isModernSleek ? "border-slate-200" : "border-cyan-500/30"}`}>
                                <span className={`text-xs font-black uppercase flex items-center gap-1.5 tracking-wider ${isModernSleek ? "text-cyan-900" : "text-cyan-300"
                                  }`}>
                                  <Sparkles className={`w-3.5 h-3.5 ${isModernSleek ? "text-cyan-600" : "text-cyan-400"}`} />
                                  <span>Aperçu de la permutation inter-équipes :</span>
                                </span>
                                <span className={`text-[10px] font-bold ${isModernSleek ? "text-cyan-800" : "text-cyan-400/80"}`}>
                                  Bascule instantanée sur la composition et l&apos;effectif
                                </span>
                              </div>

                              {/* Side-by-Side Dual Card */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">

                                {/* Source card moving out */}
                                <div className={`p-3 rounded-xl border space-y-1 relative ${isModernSleek ? "bg-white border-slate-200 shadow-xs" : "bg-[#080d16] border-cyan-500/30"
                                  }`}>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase border ${isModernSleek ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                    }`}>
                                    Quitte {activeTeam?.name}
                                  </span>
                                  <div className="flex items-center gap-2.5 pt-1">
                                    <div className={`relative w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border ${isModernSleek ? "bg-cyan-50 border-cyan-200" : "bg-cyan-500/20 border-cyan-500/40"
                                      }`}>
                                      <img
                                        src={getPlayerDefaultHeadAvatar(swapSourcePlayer, currentIsAway)}
                                        alt={swapSourcePlayer.name}
                                        className={`w-full h-full ${swapSourcePlayer.photo ? "object-cover" : "object-contain p-0.5"}`}
                                      />
                                      <span className={`absolute bottom-0 left-0 text-[7.5px] font-black px-1 rounded-tr leading-tight border-t border-r ${isModernSleek ? "bg-white/95 text-cyan-800 border-cyan-200" : "bg-slate-950/90 text-cyan-300 border-cyan-500/40"
                                        }`}>
                                        #{swapSourcePlayer.number}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-xs font-black truncate ${isModernSleek ? "text-slate-900" : "text-white"}`}>{swapSourcePlayer.name}</p>
                                      <p className={`text-[10px] font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Poste : {swapSourcePlayer.role} • {swapSourcePlayer.isStarter ? "Titulaire" : "Remplaçant"}</p>
                                    </div>
                                  </div>
                                  <p className={`text-[9.5px] font-bold pt-1 ${isModernSleek ? "text-amber-800" : "text-amber-300/90"}`}>
                                    ➔ Intègre l&apos;effectif de {targetTeamObj.name}
                                  </p>
                                </div>

                                {/* Target card moving in */}
                                <div className={`p-3 rounded-xl border space-y-1 relative ${isModernSleek ? "bg-white border-emerald-200 shadow-xs" : "bg-[#080d16] border-[#00E599]/40"
                                  }`}>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase border ${isModernSleek ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30"
                                    }`}>
                                    Rejoint {activeTeam?.name}
                                  </span>
                                  <div className="flex items-center gap-2.5 pt-1">
                                    <div className={`relative w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border ${isModernSleek ? "bg-emerald-50 border-emerald-200" : "bg-[#00E599]/20 border border-[#00E599]/40"
                                      }`}>
                                      <img
                                        src={getPlayerDefaultHeadAvatar(selectedTargetPlayer, false)}
                                        alt={selectedTargetPlayer.name}
                                        className={`w-full h-full ${selectedTargetPlayer.photo ? "object-cover" : "object-contain p-0.5"}`}
                                      />
                                      <span className={`absolute bottom-0 left-0 text-[7.5px] font-black px-1 rounded-tr leading-tight border-t border-r ${isModernSleek ? "bg-white/95 text-emerald-800 border-emerald-200" : "bg-slate-950/90 text-[#00E599] border-[#00E599]/40"
                                        }`}>
                                        #{selectedTargetPlayer.number}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-xs font-black truncate ${isModernSleek ? "text-slate-900" : "text-white"}`}>{selectedTargetPlayer.name}</p>
                                      <p className={`text-[10px] font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Poste : {selectedTargetPlayer.role} • Prêt à jouer</p>
                                    </div>
                                  </div>
                                  <p className={`text-[9.5px] font-bold pt-1 ${isModernSleek ? "text-emerald-700" : "text-[#00E599]"}`}>
                                    ➔ Devient {swapSourcePlayer.isStarter ? "Titulaire sur le terrain" : "Remplaçant sur le banc"}
                                  </p>
                                </div>

                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleExecuteDirectTransfer("bring_from_target")}
                                  className={`h-10 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer border inline-flex items-center justify-center whitespace-nowrap ${isModernSleek
                                    ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                                    : "bg-[#121926] hover:bg-[#1a2333] border-[#1f293d] hover:border-slate-500 text-slate-300 hover:text-white"
                                    }`}
                                  title="Faire venir uniquement ce joueur sur le banc sans renvoyer de joueur"
                                >
                                  Ajouter comme renfort simple
                                </button>

                                <button
                                  type="button"
                                  onClick={handleExecuteInterTeamSwap}
                                  className="h-10 px-5 bg-gradient-to-r from-cyan-400 via-teal-400 to-[#00E599] hover:from-cyan-300 hover:to-[#05f4a4] text-slate-950 font-black text-xs uppercase rounded-xl tracking-wider cursor-pointer transition inline-flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.01] whitespace-nowrap"
                                >
                                  <ArrowLeftRight className="w-4 h-4 text-slate-950 shrink-0" />
                                  <span>Confirmer la Permutation des 2 Joueurs</span>
                                </button>
                              </div>

                            </div>
                          )}

                        </div>

                        {/* Modal Footer */}
                        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-10 ${isModernSleek ? "border-slate-200 bg-slate-100 text-slate-600" : "border-[#1f293d] bg-[#080d16] text-slate-400"
                          }`}>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span>🛡️</span>
                            <span>Les statistiques, rôles et effectifs sont synchronisés pour les deux équipes en temps réel.</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsInterTeamSwapOpen(false);
                              setSwapNotification(null);
                            }}
                            className={`h-10 px-4 inline-flex items-center justify-center text-xs font-bold rounded-xl border transition cursor-pointer whitespace-nowrap ${isModernSleek
                              ? "bg-white hover:bg-slate-200 text-slate-700 border-slate-300"
                              : "bg-[#141d2e] hover:bg-[#1c283f] text-slate-300 hover:text-white border-[#1f293d]"
                              }`}
                          >
                            Fermer la passerelle
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          );
        })()}


        {/* ========================================================= */}
    </>
  );
}
