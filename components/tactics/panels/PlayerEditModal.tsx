"use client";

// Tableau tactique : ancien renderPlayerEditModal() de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { compressImage } from "@/lib/tactics/imageProcessing";
import { type Token } from "@/lib/tactics/types";
import { Activity, Award, Camera, ChevronDown, RefreshCw, Shield, Trash2, Upload, User, X } from "lucide-react";

export interface PlayerEditModalProps {
  activeMatch: any;
  activeSport: string;
  currentTokens: Token[];
  editingToken: Token | null;
  getAvailableNumbersForOpponent: (tokenId: string, currentNum?: number | undefined) => number[];
  getAvailableNumbersForPlayer: (playerId: string, currentNum?: number | undefined, targetTeam?: "home" | "away" | undefined) => number[];
  getSportCommonPositions: (sport: string) => string[];
  handleAssignUniqueNumber: (targetId: string, isStarter: boolean, rawValue: string | number, targetTeam?: "home" | "away" | undefined) => void;
  handleRemovePlayerFromPitch: (tokenToRemove: Token, reason: "normal" | "injured" | "red_card") => void;
  handleUpdatePitchPlayer: (tokenId: string, field: "number" | "name" | "role" | "status" | "photo", value: any) => void;
  handleUpdateSubstitute: (subId: string, field: "number" | "name" | "role" | "status" | "photo", value: any) => void;
  isLiveMatchMode: boolean;
  isModernSleek: boolean;
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  setEditingToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setQuickActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSubPickerToken: React.Dispatch<React.SetStateAction<Token | null>>;
}

export default function PlayerEditModal({
  activeMatch,
  activeSport,
  currentTokens,
  editingToken,
  getAvailableNumbersForOpponent,
  getAvailableNumbersForPlayer,
  getSportCommonPositions,
  handleAssignUniqueNumber,
  handleRemovePlayerFromPitch,
  handleUpdatePitchPlayer,
  handleUpdateSubstitute,
  isLiveMatchMode,
  isModernSleek,
  matchEvents,
  setEditingToken,
  setQuickActionToken,
  setSubPickerToken,
}: PlayerEditModalProps) {
  if (!editingToken) return null;

  const isHome = editingToken.type === "player_a";
  const isStarter = currentTokens.some((t) => t.id === editingToken.id);
  const availableNumbers = isHome
    ? getAvailableNumbersForPlayer(editingToken.id, editingToken.number)
    : getAvailableNumbersForOpponent(editingToken.id, editingToken.number);

  const commonPositions = getSportCommonPositions(activeSport);

  // Compute player's stats
  const playerGoals = matchEvents.filter(
    (e) => e.type === "goal" && e.player.toLowerCase() === editingToken.name.toLowerCase()
  ).length;
  const playerAssists = matchEvents.filter(
    (e) => (e.type === "assist" && e.player.toLowerCase() === editingToken.name.toLowerCase()) ||
      (e.type === "goal" && e.assister && e.assister.toLowerCase() === editingToken.name.toLowerCase())
  ).length;
  const playerYellows =
    (editingToken.yellowCards || 0) +
    matchEvents.filter(
      (e) => e.type === "yellow" && e.player.toLowerCase() === editingToken.name.toLowerCase()
    ).length;
  const playerReds =
    matchEvents.filter(
      (e) => e.type === "red" && e.player.toLowerCase() === editingToken.name.toLowerCase()
    ).length + (editingToken.status === "red_card" || editingToken.removalReason === "red_card" ? 1 : 0);

  const updateField = (field: "name" | "number" | "role" | "status" | "photo", value: any) => {
    if (isStarter) {
      handleUpdatePitchPlayer(editingToken.id, field, value);
    } else {
      handleUpdateSubstitute(editingToken.id, field, value);
    }
    setEditingToken((prev) => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div
      id="player-profile-modal-overlay"
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto select-none"
      onClick={() => {
        setEditingToken(null);
        setQuickActionToken(null);
      }}
    >
      <div
        id="player-profile-modal-card"
        className={`w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col gap-4 select-auto scrollbar-thin border relative overflow-hidden ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-slate-200"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow accents */}
        <div className={`absolute top-0 right-0 w-64 h-64 ${isHome ? "bg-[#00E599]/10" : "bg-rose-500/10"} rounded-full blur-3xl pointer-events-none`} />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* EN-TÊTE MODALE */}
        <div className={`flex items-center justify-between border-b pb-3 relative z-10 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isHome
              ? isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-[#102420] border-[#00e599]/40 text-[#00E599]"
              : isModernSleek ? "bg-rose-100 border-rose-300 text-rose-800" : "bg-rose-950/60 border-rose-600/40 text-rose-400"
              }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-black uppercase tracking-wider ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                  FICHE DU JOUEUR
                </h3>
                {(() => {
                  const rawAway = activeMatch.awayTeam?.trim();
                  const awayLabel = (!rawAway || rawAway.toUpperCase() === "NOUVEL ADVERSAIRE") ? "" : rawAway;
                  const label = isHome ? (activeMatch.homeTeam || "MON EQUIPE") : awayLabel;
                  if (!label) return null;
                  return (
                    <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase ${isHome
                      ? isModernSleek ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30"
                      : isModernSleek ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-rose-950/80 text-rose-300 border-rose-700/60"
                      }`}>
                      {label}
                    </span>
                  );
                })()}
                <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase border ${isStarter
                  ? isModernSleek ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-blue-950 text-blue-300 border-blue-800/40"
                  : isModernSleek ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-amber-950 text-amber-300 border-amber-800/40"
                  }`}>
                  {isStarter ? "Titulaire" : "Remplaçant"}
                </span>
              </div>
              <p className={`text-[11px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                Personnalisez l&apos;identité, le poste, la photo et le statut du joueur
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingToken(null);
              setQuickActionToken(null);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer shrink-0 ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
              }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION IDENTITÉ & PHOTO */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 relative z-10 ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#121926] border-[#1e293b]"
          }`}>
          {/* Avatar & Photo avec Upload */}
          <div className="relative group shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative">
              {(() => {
                const isGK = activeSport !== "basketball" && activeSport !== "rugby" && (editingToken.role === "G" || editingToken.role === "GK" || editingToken.role === "GB" || editingToken.role === "Gardien" || editingToken.number === 1);
                const defaultAvatar = activeSport === "basketball"
                  ? isHome
                    ? "/images/avatars/basket_player_green.png"
                    : "/images/avatars/basket_opponent_red.png"
                  : activeSport === "handball"
                    ? isGK
                      ? isHome
                        ? "/images/avatars/handball_goalkeeper_yellow.png"
                        : "/images/avatars/handball_opponent_goalkeeper.png"
                      : isHome
                        ? "/images/avatars/handball_player_green.png"
                        : "/images/avatars/handball_opponent_red.png"
                    : activeSport === "rugby"
                      ? isHome
                        ? "/images/avatars/rugby_player_green.png"
                        : "/images/avatars/rugby_opponent_red.png"
                      : isGK
                        ? isHome
                          ? "/images/avatars/goalkeeper_yellow.png"
                          : "/images/avatars/opponent_goalkeeper.png"
                        : isHome
                          ? "/images/avatars/player_green.png"
                          : "/images/avatars/opponent_red.png";
                const src = editingToken.photo || defaultAvatar;

                return (
                  <img
                    src={src}
                    alt={editingToken.name}
                    className={`w-20 h-20 rounded-2xl object-contain bg-slate-900/30 p-1 border-2 shadow-lg ${isHome ? "border-[#00E599]" : "border-rose-500"
                      }`}
                  />
                );
              })()}

              {/* Upload photo overlay on hover / click */}
              <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white flex-col gap-1">
                <Camera className="w-5 h-5" />
                <span className="text-[9px] font-bold">Changer</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await compressImage(file);
                      updateField("photo", base64);
                    }
                  }}
                />
              </label>
            </div>

            {/* Photo actions buttons */}
            <div className="flex items-center gap-1">
              <label className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${isModernSleek ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100" : "bg-[#172233] border-[#25354e] text-slate-300 hover:text-white"
                }`}>
                <Upload className="w-3 h-3" />
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const base64 = await compressImage(file);
                      updateField("photo", base64);
                    }
                  }}
                />
              </label>

              {editingToken.photo && (
                <button
                  type="button"
                  onClick={() => updateField("photo", undefined)}
                  className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-transparent hover:border-rose-800/40 transition cursor-pointer"
                  title="Supprimer la photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Formulaire : Nom, Numéro, Poste, Statut */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nom */}
            <div className="sm:col-span-2">
              <label className={`block text-[10.5px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"
                }`}>
                <User className="w-3.5 h-3.5 text-blue-400" /> Nom du joueur
              </label>
              <input
                type="text"
                value={editingToken.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="ex: Joueur 10"
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition border ${isModernSleek
                  ? "bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-xs"
                  : "bg-[#0d1117] border-[#1e293b] text-white focus:border-[#00E599]"
                  }`}
              />
            </div>

            {/* Numéro de maillot */}
            <div>
              <label className={`block text-[10.5px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"
                }`}>
                <span>🔢</span> Maillot
              </label>
              <div className="relative">
                <select
                  value={editingToken.number ?? ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) return;
                    handleAssignUniqueNumber(editingToken.id, isStarter, val, isHome ? "home" : "away");
                    setEditingToken((prev) => prev ? { ...prev, number: val } : null);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition appearance-none cursor-pointer border ${isModernSleek
                    ? "bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-xs"
                    : "bg-[#0d1117] border-[#1e293b] text-white focus:border-[#00E599]"
                    }`}
                >
                  {availableNumbers.map((n) => (
                    <option key={n} value={n} className={isModernSleek ? "bg-white text-slate-900" : "bg-[#0d1117] text-white"}>
                      N° {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isModernSleek ? "text-slate-500" : "text-slate-400"
                  }`} />
              </div>
            </div>

            {/* Poste / Rôle */}
            <div>
              <label className={`block text-[10.5px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"
                }`}>
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Poste / Rôle
              </label>
              <input
                type="text"
                value={editingToken.role || ""}
                onChange={(e) => updateField("role", e.target.value)}
                placeholder="ex: BU, MC, DC..."
                className={`w-full rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-none transition border ${isModernSleek
                  ? "bg-white border-slate-300 text-slate-900 focus:border-emerald-500 shadow-xs"
                  : "bg-[#0d1117] border-[#1e293b] text-white focus:border-[#00E599]"
                  }`}
              />
            </div>

            {/* Raccourcis de postes rapides */}
            <div className="sm:col-span-2 flex flex-wrap items-center gap-1">
              <span className={`text-[9px] font-bold uppercase mr-1 ${isModernSleek ? "text-slate-500" : "text-slate-500"}`}>Postes :</span>
              {commonPositions.slice(0, 10).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => updateField("role", pos)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase transition cursor-pointer border ${editingToken.role === pos
                    ? isModernSleek
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-[#00E599] text-slate-950 border-[#00E599]"
                    : isModernSleek
                      ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      : "bg-[#0d1117] border-[#1e293b] text-slate-400 hover:text-white hover:border-[#00e599]/40"
                    }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Statut / État de forme */}
            <div className="sm:col-span-2">
              <label className={`block text-[10.5px] font-black uppercase mb-1 flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"
                }`}>
                <Activity className="w-3.5 h-3.5 text-amber-400" /> État de forme & Disponibilité
              </label>
              <div className="relative">
                <select
                  value={editingToken.status || "normal"}
                  onChange={(e) => updateField("status", e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none transition appearance-none cursor-pointer border ${editingToken.status === "excellent"
                    ? isModernSleek ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-emerald-950/70 border-emerald-500/50 text-emerald-300"
                    : editingToken.status === "tired"
                      ? isModernSleek ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-amber-950/70 border-amber-500/50 text-amber-300"
                      : editingToken.status === "injured"
                        ? isModernSleek ? "bg-rose-50 border-rose-300 text-rose-800" : "bg-rose-950/70 border-rose-500/50 text-rose-300"
                        : editingToken.status === "suspended"
                          ? isModernSleek ? "bg-red-50 border-red-300 text-red-800 font-black" : "bg-red-950/80 border-red-600/60 text-red-300 font-black"
                          : isModernSleek ? "bg-white border-slate-300 text-slate-800" : "bg-[#0d1117] border-[#1e293b] text-slate-300"
                    }`}
                >
                  <option value="normal" className={isModernSleek ? "bg-white text-slate-900" : "bg-[#0d1117] text-white"}>🟢 Normal / Disponible</option>
                  <option value="excellent" className={isModernSleek ? "bg-white text-slate-900" : "bg-[#0d1117] text-white"}>⚡ En pleine forme</option>
                  <option value="tired" className={isModernSleek ? "bg-white text-slate-900" : "bg-[#0d1117] text-white"}>🥱 Fatigué</option>
                  <option value="injured" className={isModernSleek ? "bg-white text-slate-900" : "bg-[#0d1117] text-white"}>🩹 Blessé</option>
                  <option value="suspended" className={isModernSleek ? "bg-white text-slate-900" : "bg-[#0d1117] text-white"}>🟥 Suspendu</option>
                  <option value="absent" className={isModernSleek ? "bg-white text-slate-900" : "bg-[#0d1117] text-white"}>🚫 Absent</option>
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isModernSleek ? "text-slate-500" : "text-slate-400"
                  }`} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION STATISTIQUES DU MATCH (affichée uniquement lorsqu'un match est en cours) */}
        {isLiveMatchMode && (
          <div className={`p-3.5 rounded-2xl border ${isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#121926] border-[#1e293b]"
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isModernSleek ? "text-amber-700" : "text-amber-400"
                }`}>
                <Award className="w-3.5 h-3.5" />
                <span>Statistiques du match</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className={`p-2 rounded-xl border ${isModernSleek ? "bg-white border-emerald-200 text-emerald-800" : "bg-[#090d14] border-emerald-900/40 text-emerald-300"
                }`}>
                <div className="text-base font-black">⚽ {playerGoals}</div>
                <div className="text-[9px] font-bold uppercase opacity-80">Buts</div>
              </div>
              <div className={`p-2 rounded-xl border ${isModernSleek ? "bg-white border-cyan-200 text-cyan-800" : "bg-[#090d14] border-cyan-900/40 text-cyan-300"
                }`}>
                <div className="text-base font-black">👟 {playerAssists}</div>
                <div className="text-[9px] font-bold uppercase opacity-80">Passes</div>
              </div>
              <div className={`p-2 rounded-xl border ${isModernSleek ? "bg-white border-amber-200 text-amber-800" : "bg-[#090d14] border-amber-900/40 text-amber-300"
                }`}>
                <div className="text-base font-black">🟨 {playerYellows}</div>
                <div className="text-[9px] font-bold uppercase opacity-80">Cartons J.</div>
              </div>
              <div className={`p-2 rounded-xl border ${isModernSleek ? "bg-white border-rose-200 text-rose-800" : "bg-[#090d14] border-rose-900/40 text-rose-300"
                }`}>
                <div className="text-base font-black">🟥 {playerReds}</div>
                <div className="text-[9px] font-bold uppercase opacity-80">Cartons R.</div>
              </div>
            </div>
          </div>
        )}

        {/* PIED DE MODALE & ACTIONS */}
        <div className={`flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t relative z-10 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"
          }`}>
          <div className="flex items-center gap-2">
            {/* Bouton pour aller au remplacement */}
            <button
              type="button"
              onClick={() => {
                setSubPickerToken(editingToken);
                setEditingToken(null);
              }}
              className={`h-9 px-3.5 rounded-xl text-xs font-black transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md ${isModernSleek
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-[#00E599] hover:bg-[#00c782] text-slate-950"
                }`}
              title="Remplacer ce joueur"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>Remplacer ce joueur</span>
            </button>

            {/* Sortie directe */}
            {isStarter && (
              <button
                type="button"
                onClick={() => {
                  handleRemovePlayerFromPitch(editingToken, "normal");
                  setEditingToken(null);
                }}
                className={`h-9 px-3 rounded-xl text-xs font-bold border transition cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${isModernSleek
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                  : "bg-[#172233] hover:bg-[#22334d] border-[#263750] text-slate-300 hover:text-white"
                  }`}
                title="Faire sortir sur le banc"
              >
                <span>🚪 Sortir</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingToken(null);
              setQuickActionToken(null);
            }}
            className={`h-9 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center whitespace-nowrap transition cursor-pointer border ${isModernSleek
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              : "bg-[#172233] hover:bg-[#202f4a] border-[#263750] text-slate-300 hover:text-white"
              }`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
