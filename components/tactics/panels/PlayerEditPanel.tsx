"use client";

// Tableau tactique : ancien renderPlayerEditPanel() de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { getSportBallInfo } from "@/components/tactics/PitchBallGraphic";
import { type Language, type translations } from "@/lib/i18n";
import { getSportScoreActions, type SportScoreAction } from "@/lib/sportScoring";
import { compressImage } from "@/lib/tactics/imageProcessing";
import { type Token } from "@/lib/tactics/types";
import { Award, RefreshCw, Upload, User, X } from "lucide-react";

export interface PlayerEditPanelProps {
  activeSport: string;
  currentFrameIdx: number;
  currentTokens: Token[];
  editingToken: Token | null;
  editPanelRef: React.RefObject<HTMLDivElement | null>;
  getAvailableNumbersForOpponent: (tokenId: string, currentNum?: number | undefined) => number[];
  getAvailableNumbersForPlayer: (playerId: string, currentNum?: number | undefined, targetTeam?: "home" | "away" | undefined) => number[];
  handleAssignUniqueNumber: (targetId: string, isStarter: boolean, rawValue: string | number, targetTeam?: "home" | "away" | undefined) => void;
  handleGiveYellowCard: (targetToken: Token) => void;
  handleRecordAssist: (targetToken: Token) => void;
  handleRecordScore: (targetToken: Token, action: SportScoreAction, explicitAssister?: string | undefined) => void;
  handleRemovePlayerFromPitch: (tokenToRemove: Token, reason: "normal" | "injured" | "red_card") => void;
  handleSwapPlayerOnPitch: (originalToken: Token, newSub: any, opts?: { eventId?: string | undefined; noEvent?: boolean | undefined; remote?: boolean | undefined; } | undefined) => void;
  isLiveMatchMode: boolean;
  isModernSleek: boolean;
  isPitchFullscreen: boolean;
  matchEvents: { id: string; time: string; period?: string | undefined; type: "goal" | "assist" | "yellow" | "red" | "sub" | "note"; player: string; number?: number | undefined; team: "home" | "away"; note?: string | undefined; assister?: string | undefined; points?: number | undefined; icon?: string | undefined; subType?: string | undefined; outId?: string | undefined; remote?: boolean | undefined; }[];
  opponentSubstitutes: any[];
  quickActionToken: Token | null;
  setEditingToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setKeyframes: React.Dispatch<React.SetStateAction<Token[][]>>;
  setQuickActionToken: React.Dispatch<React.SetStateAction<Token | null>>;
  setSubPickerToken: React.Dispatch<React.SetStateAction<Token | null>>;
  substitutes: any[];
  t: (typeof translations)[Language];
}

export default function PlayerEditPanel({
  activeSport,
  currentFrameIdx,
  currentTokens,
  editingToken,
  editPanelRef,
  getAvailableNumbersForOpponent,
  getAvailableNumbersForPlayer,
  handleAssignUniqueNumber,
  handleGiveYellowCard,
  handleRecordAssist,
  handleRecordScore,
  handleRemovePlayerFromPitch,
  handleSwapPlayerOnPitch,
  isLiveMatchMode,
  isModernSleek,
  isPitchFullscreen,
  matchEvents,
  opponentSubstitutes,
  quickActionToken,
  setEditingToken,
  setKeyframes,
  setQuickActionToken,
  setSubPickerToken,
  substitutes,
  t,
}: PlayerEditPanelProps) {
  const activeToken = editingToken || quickActionToken;

  const updateTokenField = (field: keyof Token, value: any) => {
    if (!activeToken) return;
    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      copy[currentFrameIdx] = activeFrame.map((t) =>
        t.id === activeToken.id ? { ...t, [field]: value } : t
      );
      return copy;
    });
    if (editingToken && editingToken.id === activeToken.id) {
      setEditingToken({ ...editingToken, [field]: value });
    }
    if (quickActionToken && quickActionToken.id === activeToken.id) {
      setQuickActionToken({ ...quickActionToken, [field]: value });
    }
  };

  if (!activeToken) {
    if (isPitchFullscreen) {
      return null;
    }
    const pitchPlayers = currentTokens.filter((t) => t.type.startsWith("player"));
    return (
      <div
        ref={editPanelRef}
        className="w-full bg-[#0d1117] border border-[#1f293d] hover:border-[#00E599]/30 rounded-2xl shadow-xl p-2.5 transition-all duration-200"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-[#102420] border border-[#00e599]/30 flex items-center justify-center text-[#00E599]">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] text-white font-black uppercase tracking-wider">
              FICHE JOUEUR
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              • Cliquez sur un joueur du terrain pour ouvrir sa fiche :
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full scrollbar-thin">
            {pitchPlayers.map((token) => (
              <button
                key={token.id}
                onClick={() => {
                  setEditingToken(token);
                  setQuickActionToken(token);
                }}
                className={`px-2 py-1 rounded-lg border text-left flex items-center gap-1.5 transition cursor-pointer shrink-0 text-xs ${token.type === "player_a"
                  ? "bg-[#090d14] border-[#00e599]/30 hover:border-[#00E599] text-slate-200 hover:bg-[#102420]"
                  : "bg-[#090d14] border-rose-900/40 hover:border-rose-500 text-rose-200 hover:bg-[#251016]"
                  }`}
                title={`Éditer ${token.name}`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-black shrink-0 ${token.type === "player_a" ? "bg-[#00E599] text-[#0d1117]" : "bg-rose-600 text-white"
                    }`}
                >
                  {token.number || "J"}
                </span>
                <span className="font-bold text-[10px] max-w-[85px] truncate">{token.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isHome = activeToken.type === "player_a";
  const availableSubs = (isHome ? substitutes : opponentSubstitutes).filter(
    (s) => s.status !== "red_card" && s.removalReason !== "red_card"
  );

  // Compute player's stats
  const playerGoals = matchEvents.filter(
    (e) => e.type === "goal" && e.player.toLowerCase() === activeToken.name.toLowerCase()
  ).length;
  const playerAssists = matchEvents.filter(
    (e) => (e.type === "assist" && e.player.toLowerCase() === activeToken.name.toLowerCase()) ||
      (e.type === "goal" && e.assister && e.assister.toLowerCase() === activeToken.name.toLowerCase())
  ).length;
  const playerYellows =
    (activeToken.yellowCards || 0) +
    matchEvents.filter(
      (e) => e.type === "yellow" && e.player.toLowerCase() === activeToken.name.toLowerCase()
    ).length;
  const playerReds =
    matchEvents.filter(
      (e) => e.type === "red" && e.player.toLowerCase() === activeToken.name.toLowerCase()
    ).length + (activeToken.status === "red_card" || activeToken.removalReason === "red_card" ? 1 : 0);

  const isInjured = activeToken.status === "injured" || activeToken.removalReason === "injured";
  const isTired = activeToken.status === "tired";
  const isExcellent = activeToken.status === "excellent";

  return (
    <div
      ref={editPanelRef}
      className={`w-full bg-[#0d1117] border ${isHome ? "border-[#00E599]/50 shadow-[#00e599]/5" : "border-rose-500/50 shadow-rose-500/5"
        } rounded-2xl shadow-xl p-2.5 transition-all duration-200 flex flex-col gap-2.5`}
    >
      {/* LIGNE 1 : INFORMATIONS JOUEUR À L'HORIZONTALE */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f293d] pb-2">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Photo / Avatar */}
          <div className="relative shrink-0">
            {(() => {
              const isGK = activeSport !== "basketball" && activeSport !== "rugby" && (activeToken.role === "G" || activeToken.role === "GK" || activeToken.role === "GB" || activeToken.role === "Gardien" || activeToken.number === 1);
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
              const src = activeToken.photo || defaultAvatar;

              return (
                <img
                  src={src}
                  alt={activeToken.name}
                  className={`w-8 h-8 rounded-full object-cover border-2 ${isHome ? "border-[#00E599]" : "border-rose-500"}`}
                />
              );
            })()}
          </div>

          {/* Nom */}
          <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] rounded-lg px-2 py-1 flex-1 min-w-[130px] max-w-[200px]">
            <span className="text-[8px] font-black text-[#62728f] uppercase shrink-0">{t.tactics.playerCard.nameLabel}</span>
            <input
              type="text"
              value={activeToken.name}
              onChange={(e) => updateTokenField("name", e.target.value)}
              className="bg-transparent text-xs font-black text-white w-full outline-none"
              placeholder={t.tactics.playerCard.namePlaceholder}
            />
          </div>

          {/* N° */}
          <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] rounded-lg px-2 py-1 w-20 shrink-0">
            <span className="text-[8px] font-black text-[#62728f] uppercase shrink-0">{t.tactics.playerCard.numberLabel}</span>
            <select
              value={activeToken.number ?? ""}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val)) return;
                if (isHome) {
                  handleAssignUniqueNumber(activeToken.id, true, val, "home");
                } else {
                  handleAssignUniqueNumber(activeToken.id, true, val, "away");
                }
              }}
              className="bg-transparent text-xs font-black text-white w-full outline-none text-center cursor-pointer"
              title={t.tactics.playerCard.numberTooltip}
            >
              {(isHome
                ? getAvailableNumbersForPlayer(activeToken.id, activeToken.number)
                : getAvailableNumbersForOpponent(activeToken.id, activeToken.number)
              ).map((n) => (
                <option key={n} value={n} className="bg-[#0d1117] text-white">
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Poste / Rôle */}
          <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] rounded-lg px-2 py-1 w-24 shrink-0">
            <span className="text-[8px] font-black text-[#62728f] uppercase shrink-0">{t.tactics.playerCard.roleLabel}</span>
            <input
              type="text"
              value={activeToken.role || ""}
              onChange={(e) => updateTokenField("role", e.target.value)}
              className="bg-transparent text-xs font-black text-white w-full outline-none uppercase text-center"
              placeholder={t.tactics.playerCard.rolePlaceholder}
            />
          </div>

          {/* Photo URL & Actions */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] rounded-lg px-2 py-1 flex-1 min-w-[110px] max-w-[220px]">
            <span className="text-[8px] font-black text-[#62728f] uppercase shrink-0">{t.tactics.playerCard.photoLabel}</span>
            <input
              type="text"
              value={activeToken.photo || ""}
              onChange={(e) => updateTokenField("photo", e.target.value)}
              className="bg-transparent text-[9.5px] text-slate-300 w-full outline-none truncate"
              placeholder="URL (https://...)"
            />
            <label className="cursor-pointer text-[#00E599] hover:text-white" title="Charger une photo (fond automatiquement détouré)">
              <Upload className="w-3 h-3 shrink-0" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const base64 = await compressImage(file);
                    updateTokenField("photo", base64);
                  }
                }}
              />
            </label>
          </div>

          {/* Badge Équipe */}
          <span
            className={`text-[8px] px-2 py-1 rounded font-black uppercase border shrink-0 ${isModernSleek
              ? "bg-slate-100 text-slate-700 border-slate-200"
              : isHome
                ? "bg-[#102420] text-[#00E599] border-[#00e599]/30"
                : "bg-rose-950 text-rose-300 border-rose-800"
              }`}
          >
            {isHome ? t.tactics.playerCard.myClubBadge : t.tactics.playerCard.myOpponentBadge}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setEditingToken(null);
            setQuickActionToken(null);
          }}
          className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${isModernSleek
            ? "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200"
            : "bg-[#172233] hover:bg-rose-900/80 text-slate-300 hover:text-white"
            }`}
          title={t.tactics.playerCard.close}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* LIGNE 2 : STATS GLOBALES DU JOUEUR (affichée uniquement lorsqu'un match est en cours) */}
      {isLiveMatchMode && (
        <div className={`flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border ${isModernSleek
          ? "bg-slate-50 border-slate-200 text-slate-700"
          : "bg-[#090d14] border-[#1a2130]"
          }`}>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-amber-400"}`}>
              <Award className={`w-3.5 h-3.5 ${isModernSleek ? "text-slate-500" : "text-amber-400"}`} />
              <span>{t.tactics.playerCard.globalStatsHeader}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Buts / Points */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[10.5px] border ${isModernSleek
              ? "bg-white border-slate-200 text-slate-700"
              : "bg-[#102420] border-[#00e599]/30 text-emerald-300"
              }`}>
              <span>{getSportBallInfo(activeSport).emoji}</span>
              <span className="text-[8.5px] uppercase font-black text-slate-400">{t.tactics.playerCard.goalsLabel}</span>
              <span className={`font-black text-xs ${isModernSleek ? "text-slate-900" : "text-[#00E599]"}`}>{playerGoals}</span>
            </div>

            {/* Passes D. 👟 */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[10.5px] border ${isModernSleek
              ? "bg-white border-slate-200 text-slate-700"
              : "bg-[#0f2334] border-cyan-500/30 text-cyan-300"
              }`}>
              <span>👟</span>
              <span className="text-[8.5px] uppercase font-black text-slate-400">{t.tactics.playerCard.assistsLabel}</span>
              <span className={`font-black text-xs ${isModernSleek ? "text-slate-900" : "text-cyan-400"}`}>{playerAssists}</span>
            </div>

            {/* Cartons Jaunes 🟨 */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[10.5px] border ${isModernSleek
              ? "bg-white border-slate-200 text-slate-700"
              : "bg-[#241c10] border-amber-500/30 text-amber-300"
              }`}>
              <span>🟨</span>
              <span className="text-[8.5px] uppercase font-black text-slate-400">{t.tactics.playerCard.yellowsLabel}</span>
              <span className={`font-black text-xs ${isModernSleek ? "text-slate-900" : "text-amber-400"}`}>{playerYellows}</span>
            </div>

            {/* Cartons Rouges 🟥 */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[10.5px] border ${isModernSleek
              ? "bg-white border-slate-200 text-slate-700"
              : "bg-[#2c1318] border-rose-500/30 text-rose-300"
              }`}>
              <span>🟥</span>
              <span className="text-[8.5px] uppercase font-black text-slate-400">{t.tactics.playerCard.redsLabel}</span>
              <span className={`font-black text-xs ${isModernSleek ? "text-slate-900" : "text-rose-400"}`}>{playerReds}</span>
            </div>

            {/* État / Forme */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] border ${isModernSleek ? "bg-white border-slate-200" : "bg-[#111827] border-[#1f293d]"
              }`}>
              <span className="text-[8.5px] uppercase font-black text-slate-400">{t.tactics.playerCard.fitnessLabel}</span>
              {isInjured ? (
                <span className="text-slate-700 font-black flex items-center gap-1">{t.tactics.subModal.injured}</span>
              ) : playerReds > 0 ? (
                <span className="text-slate-700 font-black flex items-center gap-1">{t.tactics.subModal.sentOff}</span>
              ) : isTired ? (
                <span className="text-slate-700 font-black flex items-center gap-1">{t.tactics.subModal.tired}</span>
              ) : isExcellent ? (
                <span className={`font-black flex items-center gap-1 ${isModernSleek ? "text-slate-900" : "text-emerald-400"}`}>{t.tactics.playerCard.formExcellent}</span>
              ) : (
                <span className={`font-black flex items-center gap-1 ${isModernSleek ? "text-slate-900" : "text-[#00E599]"}`}>{t.tactics.playerCard.formFit}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIGNE 3 : REMPLACEMENT (MENU DÉROULANT) & ACTIONS MATCH */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/80"}`}>
        {/* Section Remplacement avec Menu Déroulant */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black text-xs shrink-0 border ${isModernSleek ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-[#102420] border-[#00E599]/40 text-[#00E599]"
            }`}>
            <RefreshCw className={`w-3.5 h-3.5 ${isModernSleek ? "text-slate-600" : "text-[#00E599]"}`} />
            <span className="text-[9.5px] uppercase tracking-wider">{t.tactics.playerCard.replacementHeader}</span>
          </div>

          {/* Menu Déroulant Principal */}
          {availableSubs.length === 0 ? (
            <span className={`text-[10px] italic px-2.5 py-1.5 rounded-xl border ${isModernSleek ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-[#111827] border-[#1a2130] text-slate-500"
              }`}>
              {t.tactics.playerCard.noSubsAvailable}
            </span>
          ) : (
            <div className="relative flex items-center">
              <select
                id="substitute-select-dropdown"
                defaultValue=""
                onChange={(e) => {
                  const subId = e.target.value;
                  if (!subId) return;
                  const selectedSub = availableSubs.find((s) => s.id === subId);
                  if (selectedSub) {
                    handleSwapPlayerOnPitch(activeToken, selectedSub);
                    e.target.value = "";
                  }
                }}
                className={`border text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer shadow-xs transition-all pr-8 appearance-none ${isModernSleek
                  ? "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                  : "bg-[#111827] border-[#00E599]/60 hover:border-[#00E599] focus:border-[#00E599] text-white"
                  }`}
                title={t.tactics.playerCard.selectSubTooltip}
              >
                <option value="" disabled>
                  {t.tactics.playerCard.selectSubPlaceholder}
                </option>
                {availableSubs.map((sub) => {
                  const isCurrentlyOnPitch = currentTokens.some(
                    (t) => t.name.toLowerCase() === sub.name.toLowerCase()
                  );
                  return (
                    <option
                      key={sub.id}
                      value={sub.id}
                      disabled={isCurrentlyOnPitch}
                      className={isModernSleek ? "bg-white text-slate-900" : `bg-[#0d1117] ${isCurrentlyOnPitch ? "text-slate-500" : "text-white"}`}
                    >
                      {isCurrentlyOnPitch ? "⚠️ " : "🔄 "}
                      N°{sub.number || "?"} - {sub.name} ({sub.role || "SUB"})
                      {isCurrentlyOnPitch ? t.tactics.playerCard.alreadyOnPitch : ""}
                      {sub.status === "injured" ? t.tactics.playerCard.injuredTag : ""}
                      {sub.status === "tired" ? t.tactics.playerCard.tiredTag : ""}
                    </option>
                  );
                })}
              </select>
              <div className={`absolute right-2.5 pointer-events-none text-[10px] ${isModernSleek ? "text-slate-500" : "text-[#00E599]"}`}>
                ▼
              </div>
            </div>
          )}

          {/* Bouton pour ouvrir la modale complète avec fiches/photos */}
          <button
            type="button"
            onClick={() => setSubPickerToken(activeToken)}
            className={`px-2.5 py-1.5 border font-bold text-[10px] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${isModernSleek
              ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
              : "bg-[#172233] hover:bg-[#202f4a] border-[#263750] text-slate-200 hover:text-white"
              }`}
            title={t.tactics.playerCard.benchSubModalTooltip}
          >
            <span>📋</span>
            <span>{t.tactics.playerCard.benchSubModalBtn}</span>
          </button>

          {/* Sorties directes */}
          <button
            type="button"
            onClick={() => handleRemovePlayerFromPitch(activeToken, "normal")}
            className={`px-2.5 py-1.5 border rounded-xl text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs ${isModernSleek
              ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
              : "bg-[#172233] hover:bg-[#22334d] border-[#263750] text-slate-300 hover:text-white"
              }`}
            title={t.tactics.playerCard.subOutTooltip}
          >
            <span>🚪</span>
            <span>{t.tactics.playerCard.subOutBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => handleRemovePlayerFromPitch(activeToken, "injured")}
            className={`px-2.5 py-1.5 border rounded-xl text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs ${isModernSleek
              ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
              : "bg-amber-950/80 hover:bg-amber-800 border-amber-600/80 text-amber-200 hover:text-white"
              }`}
            title={t.tactics.playerCard.injuryTooltip}
          >
            <span>🏥</span>
            <span>{t.tactics.playerCard.injuryBtn}</span>
          </button>
        </div>

        {/* LIGNE ACTIONS LIVE MATCH (UNIQUEMENT QUAND LE MODE LIVE EST ACTIVÉ) */}
        {isLiveMatchMode && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[8.5px] font-black uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1 ${isModernSleek ? "text-slate-500" : "text-amber-400"
              }`}>
              <Award className="w-3 h-3" />
              <span>{t.tactics.playerCard.liveActionsHeader}</span>
            </span>

            {getSportScoreActions(activeSport).map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleRecordScore(activeToken, action)}
                className={`px-2 py-1 rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs border ${isModernSleek
                  ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800 hover:text-slate-950"
                  : "bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-500/80 text-emerald-200 hover:text-white"
                  }`}
                title={`Attribuer ${action.label} (+${action.points} sur le score) à ${activeToken.name}`}
              >
                <span>{action.icon}</span>
                <span>{action.shortLabel}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleRecordAssist(activeToken)}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs border ${isModernSleek
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                : "bg-cyan-950/90 hover:bg-cyan-800 border border-cyan-500/80 text-cyan-200 hover:text-white"
                }`}
              title={t.tactics.playerCard.addAssistTooltip}
            >
              <span>👟</span>
              <span>{t.tactics.playerCard.addAssistBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => handleGiveYellowCard(activeToken)}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs border ${isModernSleek
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                : "bg-amber-950/90 hover:bg-amber-800 border border-amber-500/80 text-amber-200 hover:text-white"
                }`}
              title={t.tactics.playerCard.yellowCardTooltip}
            >
              <span>🟨</span>
              <span>{t.tactics.playerCard.yellowCardBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRemovePlayerFromPitch(activeToken, "red_card")}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs border ${isModernSleek
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                : "bg-rose-950/90 hover:bg-rose-800 border border-rose-600/80 text-rose-200 hover:text-white"
                }`}
              title={t.tactics.playerCard.redCardTooltip}
            >
              <span>🟥</span>
              <span>{t.tactics.playerCard.redCardBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
