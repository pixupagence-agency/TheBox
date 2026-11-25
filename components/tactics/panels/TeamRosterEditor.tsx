"use client";

// Tableau tactique : ancien renderTeamRosterEditor() de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { MAX_TEAM_SQUAD_SIZE, TEAM_PLAYER_STATUS_OPTIONS, isUnavailableStatus, toTeamStatusOption, type TeamRosterStatus } from "@/lib/tactics/roster";
import { type TeamCategory, type TeamRosterPlayer, type Token } from "@/lib/tactics/types";
import { Camera, ChevronLeft, Lock, Plus, Trash, X } from "lucide-react";

export interface TeamRosterEditorProps {
  activeSport: string;
  activeTeamId: string;
  currentTokens: Token[];
  getRosterForTeam: (teamId: string) => TeamRosterPlayer[];
  getSportCommonPositions: (sport: string) => string[];
  handleAddTeamPlayer: (teamId: string) => void;
  handleEditTeamPlayer: (teamId: string, playerId: string, patch: Partial<TeamRosterPlayer>) => void;
  handleRemoveTeamPlayer: (teamId: string, playerId: string) => Promise<void>;
  handleTeamPlayerPhoto: (teamId: string, playerId: string, file?: File | undefined) => Promise<void>;
  isModernSleek: boolean;
  isProOrAdmin: boolean;
  pth: { panel: string; sidebar: string; border: string; card: string; cardMuted: string; text: string; body: string; sub: string; faint: string; input: string; navActive: string; navIdle: string; navIndicator: string; ghostBtn: string; primaryBtn: string; tableHead: string; rowHover: string; divide: string; chip: string; gold: string; goldChip: string; goldTile: string; accent: string; accentChip: string; accentDot: string; selected: string; selectable: string; segment: string; segmentActive: string; segmentIdle: string; danger: string; option: string; };
  setRosterEditTeamId: React.Dispatch<React.SetStateAction<string | null>>;
  substitutes: any[];
  team: TeamCategory;
}

export default function TeamRosterEditor({
  activeSport,
  activeTeamId,
  currentTokens,
  getRosterForTeam,
  getSportCommonPositions,
  handleAddTeamPlayer,
  handleEditTeamPlayer,
  handleRemoveTeamPlayer,
  handleTeamPlayerPhoto,
  isModernSleek,
  isProOrAdmin,
  pth,
  setRosterEditTeamId,
  substitutes,
  team,
}: TeamRosterEditorProps) {
  const roster = getRosterForTeam(team.id);
  const canEdit = isProOrAdmin;
  const positions = getSportCommonPositions(activeSport).filter((p) => p !== "SUB");
  const unavailable = roster.filter((p) => isUnavailableStatus(p.status)).length;
  const groupIds = team.id === activeTeamId
    ? new Set([...currentTokens.map((t) => t.rosterId), ...substitutes.map((s) => s.rosterId)].filter(Boolean) as string[])
    : null;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setRosterEditTeamId(null)}
          className={`h-9 pl-2 pr-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer ${pth.ghostBtn}`}
        >
          <ChevronLeft className="w-4 h-4" />Équipes
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-base font-black truncate ${pth.text}`}>{team.name}</p>
          <p className={`text-[11px] font-semibold ${pth.sub}`}>
            {team.category} · {roster.length} joueur{roster.length > 1 ? "s" : ""}
            {unavailable > 0 && ` · ${unavailable} indisponible${unavailable > 1 ? "s" : ""}`}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => handleAddTeamPlayer(team.id)}
            disabled={roster.length >= MAX_TEAM_SQUAD_SIZE}
            className={`h-9 px-3.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${pth.primaryBtn}`}
          >
            <Plus className="w-4 h-4" />Ajouter un joueur
          </button>
        )}
      </div>

      {!canEdit && (
        <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${pth.goldChip}`}>
          <Lock className="w-4 h-4 shrink-0" />
          <p className="text-[11px] font-semibold">La modification des fiches joueurs (photo, nom, poste, statut) est réservée à la formule PRO.</p>
        </div>
      )}

      {roster.length === 0 ? (
        <p className={`text-sm text-center py-8 ${pth.sub}`}>Aucun joueur dans cette équipe.</p>
      ) : (
        <ul className={`rounded-xl border divide-y ${pth.border} ${pth.divide}`}>
          {roster.map((p) => {
            const roleOptions = positions.includes(p.role) ? positions : [p.role, ...positions];
            const status = toTeamStatusOption(p.status);
            const inGroup = groupIds?.has(p.id);
            return (
              <li key={p.id} className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2">
                <div className="relative shrink-0">
                  <label
                    className={`w-10 h-10 rounded-full border flex items-center justify-center overflow-hidden transition ${canEdit ? "cursor-pointer" : ""} ${pth.chip}`}
                    title={canEdit ? (p.photo ? "Changer la photo" : "Ajouter une photo") : p.name}
                  >
                    {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : canEdit ? <Camera className="w-4 h-4" /> : <span className="text-[11px] font-black">{p.number}</span>}
                    {canEdit && (
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        aria-label={`Photo de ${p.name}`}
                        onChange={(e) => {
                          handleTeamPlayerPhoto(team.id, p.id, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    )}
                  </label>
                  {canEdit && p.photo && (
                    <button
                      type="button"
                      onClick={() => handleEditTeamPlayer(team.id, p.id, { photo: undefined })}
                      aria-label={`Retirer la photo de ${p.name}`}
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
                  disabled={!canEdit}
                  value={String(p.number ?? "")}
                  onChange={(e) => {
                    const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                    if (!Number.isNaN(n)) handleEditTeamPlayer(team.id, p.id, { number: n });
                  }}
                  aria-label={`Numéro de ${p.name}`}
                  className={`w-11 shrink-0 text-center border rounded-lg px-1 py-2 text-sm font-black outline-none transition disabled:opacity-80 ${pth.input}`}
                />
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={p.name}
                    placeholder={`Joueur ${p.number}`}
                    onChange={(e) => handleEditTeamPlayer(team.id, p.id, { name: e.target.value })}
                    onBlur={(e) => { if (!e.target.value.trim()) handleEditTeamPlayer(team.id, p.id, { name: `Joueur ${p.number}` }); }}
                    aria-label={`Nom du joueur ${p.number}`}
                    className={`w-full border rounded-lg px-2.5 py-2 text-sm font-semibold outline-none transition disabled:opacity-80 ${pth.input}`}
                  />
                  {inGroup && <p className={`text-[10px] font-bold mt-0.5 px-1 ${pth.accent}`}>Dans le groupe du match</p>}
                </div>
                <select
                  value={p.role}
                  disabled={!canEdit}
                  onChange={(e) => handleEditTeamPlayer(team.id, p.id, { role: e.target.value })}
                  aria-label={`Poste de ${p.name}`}
                  className={`w-[76px] shrink-0 border rounded-lg px-1.5 py-2 text-xs font-bold outline-none cursor-pointer transition disabled:opacity-80 ${pth.input} ${pth.option}`}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={status}
                  disabled={!canEdit}
                  onChange={(e) => handleEditTeamPlayer(team.id, p.id, { status: e.target.value as TeamRosterStatus })}
                  aria-label={`Statut de ${p.name}`}
                  className={`w-[98px] shrink-0 border rounded-lg px-1.5 py-2 text-xs font-bold outline-none cursor-pointer transition disabled:opacity-80 ${pth.input} ${pth.option} ${isUnavailableStatus(status) ? "!text-rose-500" : ""}`}
                >
                  {TEAM_PLAYER_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTeamPlayer(team.id, p.id)}
                    className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${pth.faint} hover:text-rose-500 ${isModernSleek ? "hover:bg-rose-50" : "hover:bg-rose-500/10"}`}
                    title="Retirer ce joueur de l'équipe"
                    aria-label={`Retirer ${p.name} de l'équipe`}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className={`text-[11px] ${pth.faint}`}>
        Les modifications sont enregistrées automatiquement. Pour l&apos;équipe active, elles s&apos;appliquent aussi aux joueurs du match en cours.
      </p>
    </section>
  );
}
