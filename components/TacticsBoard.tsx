"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import html2canvas from "html2canvas";
import { toPng } from "html-to-image";
import Pitch from "./Pitch";
import SportIcon from "./SportIcon";
import LogoIcon from "./LogoIcon";
import TrialCountdownModal, { calculateTrialRemaining, TrialTimeRemaining } from "./TrialCountdownModal";
import ShareModal, { ShareData } from "./ShareModal";
import LiveShareModal from "./live/LiveShareModal";
import MatchConvocationModal from "./convocations/MatchConvocationModal";
import { useRouter } from "next/navigation";
import { useLiveHost } from "@/lib/live/useLiveHost";
import {
  createLiveMatch, deleteLiveMatch, ensureLiveClub, getEditorAccess, regenerateEditorAccess, revokeEditorAccess, updateLiveMatchMeta,
  type EditorAccess, type LiveMatchMeta, type LiveState,
} from "@/lib/live/client";
import { applyLiveOp, statusFor, type LiveCommand, type LiveEvent, type LiveMatchDoc } from "@/lib/live/model";
import { buildGifTimeline, clampStepDuration, interpolateFrameTokens } from "@/lib/animationExport";
import SubscriptionPlans from "./SubscriptionPlans";
import { PWAInstallButton } from "./PWAInstallButton";
import UserGuideModal from "./UserGuideModal";
import {
  Play, Pause, Plus, Trash2, ChevronLeft, ChevronRight,
  RotateCcw, Pencil, Sparkles, Save, UserPlus, UserMinus, RefreshCw, Shield, CheckCircle, Check,
  Download, Share2, Maximize2, Minimize2, Laptop, Smartphone,
  MousePointer, Move, ArrowUpRight, Settings, Info, FileText, Camera, Loader2,
  Mic, Trash, Eye, Globe, LogOut, ChevronDown, Award, Eraser, Lock, X, User, Users, BrickWall, RotateCw,
  Search, UserCheck, Upload, ArrowLeftRight, Zap, AlertCircle, Cloud, Filter, Film,
  Video, CircleDot, ZoomIn, Map, Hash, Minus, Columns, Activity, Target, Shirt, Circle,
  CreditCard, Box, Scan, Bookmark, CalendarDays, CircleHelp, NotebookPen,
  Crown, Flag, CornerUpLeft, CornerUpRight, Archive, QrCode, Tag, ClipboardCheck, Clapperboard
} from "lucide-react";
import { getPremiumTheme, premiumOverlay, premiumShell, premiumLabel } from "@/lib/premiumModalTheme";
import { auth, logoutUser, saveTacticToFirestore, deleteTacticFromFirestore, saveUserProfileToFirestore } from "@/lib/firebase";
import { clearLocalWorkspace, startWorkspaceSync, stopWorkspaceSync } from "@/lib/cloudSync";
import { isSuperAdminEmail } from "@/lib/security";
import { Language, translations, getStoredLanguage, setStoredLanguage } from "@/lib/i18n";
import { confirmAction } from "@/components/ConfirmDialog";
import { formatMatchDateTime } from "@/lib/dateFormat";
import { exportMatchPdf, type MatchPdfPlayer, type MatchPdfSchema, type MatchPdfSquad } from "@/lib/matchPdf";
import { prepareClubLogo, CLUB_LOGO_ACCEPT } from "@/lib/clubLogo";
import { getSportRoles, getPlayerRoleCodes, autoAssignSportRoles, type RoleIconName, type RoleTone } from "@/lib/sportRoles";
import { assignPlayersToFormation } from "@/lib/formationAssign";
import { WALL_DEFAULT, WALL_MAX, WALL_MIN, WALL_PREFERRED_ROLES, effectiveWallAngle, isGoalkeeperRole, normalizeAngle, playerWallTeam, wallPlacement, type WallTeam } from "@/lib/setPieceWall";

import { useHorizontalScroll } from "@/lib/useHorizontalScroll";
import {
  getGameFormatOptions, getGameFormatOption, resolveGameFormat,
  getFormatDefaultPlayers, getFormatFormations, getFormatFormationCoords, getFormatPeriodSeconds,
  getFormatPitchRatio, getCenterCircleRadiusRatio, getSmallPitchSpec, smallPitchBox, drawSmallFootballPitch, drawFootballZones, drawFootballThirds, getFootballFieldRect,
} from "@/lib/gameFormats";

// Types, utilitaires et petits composants du tableau (étape 1 du découpage de ce fichier)
import { type Token, type DrawingAction, type SetPieceRoleConfig, defaultSetPieceRoles, type CoachProfile, type TeamCategory, type TeamRosterPlayer } from "@/lib/tactics/types";
import { TOOLBAR_GROUP_KEYS, COACH_NOTE_MAX, LINK_COLORS, GIF_EXPORT_WIDTH } from "@/lib/tactics/constants";
import { HALFTIME_BREAK_SECONDS, type LivePeriod, getLivePeriodConfig } from "@/lib/tactics/livePeriods";
import { BALL_MAGNET_PX, detachBall, isCurveTool, ZONE_FILL_ALPHA, type Pt, curvePointsPx, bezierAt, strokeCurveArrow, getSportRatioNum } from "@/lib/tactics/pitchGeometry";
import { type NewTeamPlayerEdit, MAX_TEAM_SQUAD_SIZE, standardDefaultRoles26, defaultManagedTeamRosters, generateDefaultRosterForCustomTeam, makeDefaultSubstitutes, readStoredBench, type TeamRosterStatus, TEAM_PLAYER_STATUS_OPTIONS, isUnavailableStatus, toTeamStatusOption, toGroupStatus, toRosterStatus, rosterPlayerToSub, buildMatchGroupFromRoster, applyRosterIdentity, isGenericGroup, defaultTeams } from "@/lib/tactics/roster";
import { safeLocalStorageSetItem } from "@/lib/tactics/storage";
import { autoRemoveBackgroundFromDataUrl, compressImage } from "@/lib/tactics/imageProcessing";
import { ROLE_ICONS, ROLE_TONE_CHIP, CurveArrowIcon, PlayerLinkIcon } from "@/components/tactics/icons";
import { PlayerLinksOverlay } from "@/components/tactics/PlayerLinksOverlay";
import { getSportBallInfo, PitchBallGraphic } from "@/components/tactics/PitchBallGraphic";
import { LiveTrialCountdownLabel } from "@/components/tactics/LiveTrialCountdownLabel";
import { MarqueeText } from "@/components/tactics/MarqueeText";
import UserSettingsModal from "@/components/tactics/modals/UserSettingsModal";
import Squad3DExportModal from "@/components/tactics/modals/Squad3DExportModal";
import SquadManagementModal from "@/components/tactics/modals/SquadManagementModal";
import OpponentRosterModal from "@/components/tactics/modals/OpponentRosterModal";
import LiveShareModals from "@/components/tactics/modals/LiveShareModals";
import MultiTeamUpgradeModal from "@/components/tactics/modals/MultiTeamUpgradeModal";
import MultiTeamManagerModal from "@/components/tactics/modals/MultiTeamManagerModal";
import MatchFinishedModal from "@/components/tactics/modals/MatchFinishedModal";
import MatchListModal from "@/components/tactics/modals/MatchListModal";
import AssistPickerModal from "@/components/tactics/modals/AssistPickerModal";
import PlayerEditPanel from "@/components/tactics/panels/PlayerEditPanel";
import AnimationStrip from "@/components/tactics/panels/AnimationStrip";
import LiveMatchToolbox from "@/components/tactics/panels/LiveMatchToolbox";
import SubstitutionModal from "@/components/tactics/panels/SubstitutionModal";
import PlayerEditModal from "@/components/tactics/panels/PlayerEditModal";
import TeamAPanel from "@/components/tactics/panels/TeamAPanel";
import TeamBPanel from "@/components/tactics/panels/TeamBPanel";
import TeamRosterEditor from "@/components/tactics/panels/TeamRosterEditor";
import { renderCompositeTacticsCanvas as renderCompositeTacticsCanvasImpl } from "@/lib/tactics/canvas/renderCompositeTacticsCanvas";
import { drawAllStrokes as drawAllStrokesImpl } from "@/lib/tactics/canvas/drawAllStrokes";
import { findStrokeIndexAtCoords as findStrokeIndexAtCoordsImpl } from "@/lib/tactics/canvas/findStrokeIndexAtCoords";
import { captureSquad3DDataUrl as captureSquad3DDataUrlImpl } from "@/lib/tactics/canvas/captureSquad3DDataUrl";
import { getFormationCoordinates as getFormationCoordinatesImpl } from "@/lib/tactics/formations/getFormationCoordinates";
import { getDefaultPlayersForSport as getDefaultPlayersForSportImpl } from "@/lib/tactics/formations/getDefaultPlayersForSport";
import { handleExportMatchPdf as handleExportMatchPdfImpl } from "@/lib/tactics/actions/handleExportMatchPdf";
import { handleOpenShareSchema as handleOpenShareSchemaImpl } from "@/lib/tactics/actions/handleOpenShareSchema";
import { handleTokenStartDrag as handleTokenStartDragImpl } from "@/lib/tactics/actions/handleTokenStartDrag";
import { selectMatch as selectMatchImpl } from "@/lib/tactics/actions/selectMatch";
import { handleExecuteInterTeamSwap as handleExecuteInterTeamSwapImpl } from "@/lib/tactics/actions/handleExecuteInterTeamSwap";
import { handleRemovePlayerFromPitch as handleRemovePlayerFromPitchImpl } from "@/lib/tactics/actions/handleRemovePlayerFromPitch";
import { handleExecuteDirectTransfer as handleExecuteDirectTransferImpl } from "@/lib/tactics/actions/handleExecuteDirectTransfer";
import { handleToggleStarterSubstitute as handleToggleStarterSubstituteImpl } from "@/lib/tactics/actions/handleToggleStarterSubstitute";
import { handleSwapPlayerOnPitch as handleSwapPlayerOnPitchImpl } from "@/lib/tactics/actions/handleSwapPlayerOnPitch";
import { applyRemoteLiveCommand as applyRemoteLiveCommandImpl } from "@/lib/tactics/actions/applyRemoteLiveCommand";
import { handleSaveTacticState as handleSaveTacticStateImpl } from "@/lib/tactics/actions/handleSaveTacticState";
import { sanitizeSquadNumbers as sanitizeSquadNumbersImpl } from "@/lib/tactics/actions/sanitizeSquadNumbers";
import { handleCreateNewTeam as handleCreateNewTeamImpl } from "@/lib/tactics/actions/handleCreateNewTeam";
import { handleShareMatchWhatsApp as handleShareMatchWhatsAppImpl } from "@/lib/tactics/actions/handleShareMatchWhatsApp";
import { handleAssignUniqueNumber as handleAssignUniqueNumberImpl } from "@/lib/tactics/actions/handleAssignUniqueNumber";
import { handleAddNewSubstitute as handleAddNewSubstituteImpl } from "@/lib/tactics/actions/handleAddNewSubstitute";
import { handleToggleMicRecording as handleToggleMicRecordingImpl } from "@/lib/tactics/actions/handleToggleMicRecording";
import WallSettingsPanel from "@/components/tactics/board/WallSettingsPanel";
import PlayerLinkToolbar from "@/components/tactics/board/PlayerLinkToolbar";
import TacticalNotesSection from "@/components/tactics/board/TacticalNotesSection";
import SchemasSection from "@/components/tactics/board/SchemasSection";
import MatchCard from "@/components/tactics/board/MatchCard";
import PitchArea from "@/components/tactics/board/PitchArea";
import PitchToolbar from "@/components/tactics/board/PitchToolbar";
import TopHeader from "@/components/tactics/board/TopHeader";
export type { Token } from "@/lib/tactics/types";
import { getSportScoreActions, type SportScoreAction } from "@/lib/sportScoring";
export { getSportScoreActions };
export type { SportScoreAction };

// Bascule unique vers le design « cockpit » : les préférences d'affichage étaient déjà
// persistées (thème, représentation des joueurs, panneau droit), les nouveaux défauts
// n'auraient donc jamais atteint les utilisateurs existants. Rejouée une seule fois,
// elle laisse ensuite chacun libre de revenir au thème clair ou aux pastilles.
const COCKPIT_DESIGN_KEY = "thebox_cockpit_design_v1";
if (typeof window !== "undefined") {
  try {
    if (!localStorage.getItem(COCKPIT_DESIGN_KEY)) {
      localStorage.setItem("thebox_modern_sleek", "false");
      localStorage.setItem("thebox_player_representation", "head");
      if (window.innerWidth >= 1280) {
        localStorage.setItem("thebox_right_sidebar_open", "true");
      }
      localStorage.setItem(COCKPIT_DESIGN_KEY, "1");
    }
  } catch {
    // Stockage indisponible (navigation privée) : les défauts du code s'appliquent.
  }
}

interface TacticsBoardProps {
  coaches: CoachProfile[];
  setCoaches: React.Dispatch<React.SetStateAction<CoachProfile[]>>;
  activeCoachId: string;
  setActiveCoachId: (id: string) => void;
  activePlan: string;
  setActivePlan: (plan: string) => void;
  savedTactics: any[];
  setSavedTactics: React.Dispatch<React.SetStateAction<any[]>>;
  activeSport: string;
  setActiveSport: (sport: string) => void;
  setIsRegisterModalOpen?: (open: boolean) => void;
  onLogout?: () => void;
  isAdmin?: boolean;
  blockedSports?: string[];
  sportsConfig?: any[];
  onOpenAdminPlatform?: (tab?: any, sectionId?: string) => void;
  onOpenTrialModal?: () => void;
  /** Incrémenté par la page pour ouvrir la fenêtre des formules (ex. depuis la modale d'essai). */
  checkoutRequest?: number;
  onOpenTutorial?: () => void;
  onOpenLegalModal?: (tab?: any) => void;
  isFirstLogin?: boolean;
  onCompleteFirstLogin?: () => void;
  onOpenSupportModal?: () => void;
}

export default function TacticsBoard({
  coaches,
  setCoaches,
  activeCoachId,
  setActiveCoachId,
  activePlan,
  setActivePlan,
  savedTactics,
  setSavedTactics,
  activeSport,
  setActiveSport,
  setIsRegisterModalOpen,
  onLogout,
  isAdmin = false,
  blockedSports = [],
  sportsConfig = [],
  onOpenAdminPlatform,
  onOpenTrialModal,
  checkoutRequest = 0,
  onOpenTutorial,
  onOpenLegalModal,
  isFirstLogin,
  onCompleteFirstLogin,
  onOpenSupportModal
}: TacticsBoardProps) {

  // Barre d'outils du terrain sur une seule ligne : tous les outils sont affichés d'emblée
  // et la ligne défile horizontalement quand l'écran est trop étroit (doigt, molette ou flèches de bord).
  const toolbarScroll = useHorizontalScroll<HTMLDivElement>();

  // Active coach helper & live trial calculation
  const activeCoach = coaches.find(c => c.id === activeCoachId) || coaches[0];
  const [liveTrialStatus, setLiveTrialStatus] = useState<TrialTimeRemaining>(() =>
    calculateTrialRemaining(activeCoach?.createdAt, activeCoach?.trialBonusDays || 0, activeCoach?.trialEndsAt)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      // Ce composant est très lourd à re-rendre : il ne suit que ce qu'il affiche, les secondes vivent dans LiveTrialCountdownLabel
      setLiveTrialStatus((prev) => {
        const next = calculateTrialRemaining(activeCoach?.createdAt, activeCoach?.trialBonusDays || 0, activeCoach?.trialEndsAt);
        const unchanged = prev.isExpired === next.isExpired && prev.days === next.days && prev.hours === next.hours;
        return unchanged ? prev : next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCoach?.createdAt, activeCoach?.trialBonusDays, activeCoach?.trialEndsAt]);

  const isUserAdmin = Boolean(
    isAdmin ||
    activeCoach?.isAdmin ||
    activeCoach?.role === "Super Admin" ||
    isSuperAdminEmail(activeCoach?.email)
  );

  const currentPlan = (activeCoach as any)?.activePlan || activePlan || "free";

  const isPaidSubscriber = Boolean(
    currentPlan &&
    currentPlan.toLowerCase() !== "free" &&
    currentPlan.toLowerCase() !== "gratuit"
  );

  // Track if coach has had a paid subscription (so returning to free mode hides demo timer)
  const coachId = activeCoach?.id || "default_coach";
  const [hasHadPaidSubscription, setHasHadPaidSubscription] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`thebox_has_had_subscription_${coachId}`);
      if (stored === "true") return true;
    }
    return isPaidSubscriber;
  });

  useEffect(() => {
    if (isPaidSubscriber) {
      setHasHadPaidSubscription(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`thebox_has_had_subscription_${coachId}`, "true");
      }
    }
  }, [isPaidSubscriber, coachId]);

  // Internationalization (i18n) state: French (default) or English
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (activeCoach?.language) return activeCoach.language;
    return getStoredLanguage();
  });
  const t = translations[currentLang];

  useEffect(() => {
    if (activeCoach?.language && activeCoach.language !== currentLang) {
      setCurrentLang(activeCoach.language);
      setStoredLanguage(activeCoach.language);
    }
  }, [activeCoach?.language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleLangChange = (e: any) => {
      const newLang = e.detail?.language as Language;
      if (newLang && newLang !== currentLang) {
        setCurrentLang(newLang);
      }
    };
    window.addEventListener("thebox_language_change", handleLangChange);
    return () => window.removeEventListener("thebox_language_change", handleLangChange);
  }, [currentLang]);

  const isFreePlan = Boolean(
    !currentPlan ||
    currentPlan.toLowerCase() === "free" ||
    currentPlan.toLowerCase() === "gratuit"
  );

  // Essai gratuit de 14 jours (PRO+) : compte en formule gratuite, essai non expiré,
  // et jamais abonné (un ancien abonné revenu en gratuit ne récupère pas l'essai).
  // « Déjà abonné » vient du serveur (tous appareils confondus), l'indicateur local reste en secours.
  const isInFreeTrial = Boolean(
    isFreePlan && !hasHadPaidSubscription && !activeCoach?.hasHadSubscription && liveTrialStatus && !liveTrialStatus.isExpired
  );
  // Compte sans accès : ses données sont masquées, conservées en base (voir lib/accountStatus.ts)
  const isDataHidden = Boolean(!isUserAdmin && isFreePlan && !isInFreeTrial && activeCoach?.dataHidden);
  const [isHiddenDataBannerDismissed, setIsHiddenDataBannerDismissed] = useState(false);

  // Suppression du compte par le coach (droit à l'effacement), côté serveur (app/api/account/delete) :
  //  - abonnement payé en cours : non renouvelé, accès conservé jusqu'à la fin de la période payée,
  //    compte supprimé à cette date (annulable d'ici là) ;
  //  - sinon : compte, données, profil et identifiants supprimés immédiatement.
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [scheduledDeletionAt, setScheduledDeletionAt] = useState<string | null>(activeCoach?.deletionScheduledAt ?? null);
  useEffect(() => {
    setScheduledDeletionAt(activeCoach?.deletionScheduledAt ?? null);
  }, [activeCoach?.deletionScheduledAt]);
  const handleDeleteOwnAccount = async () => {
    if (deleteAccountConfirm.trim().toUpperCase() !== "SUPPRIMER" || isDeletingAccount) return;
    const user = auth.currentUser;
    if (!user) {
      setDeleteAccountError("Reconnectez-vous pour supprimer votre compte.");
      return;
    }
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    // Synchro arrêtée pendant la demande : en cas de suppression immédiate, elle renverrait sinon
    // les données locales en ligne. Elle reprend si le compte reste actif (suppression programmée, échec).
    const syncWasRunning = !isDataHidden;
    await stopWorkspaceSync();
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ confirm: deleteAccountConfirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || "La suppression n'a pas pu aboutir.");

      if (data.mode === "scheduled") {
        if (syncWasRunning) startWorkspaceSync(user.uid);
        setScheduledDeletionAt(data.deletionAt);
        setCoaches((prev) => prev.map((c) => (c.id === activeCoachId ? { ...c, deletionScheduledAt: data.deletionAt } : c)));
        setIsDeleteAccountOpen(false);
        setIsDeletingAccount(false);
        return;
      }

      // Plus aucune trace du compte sur cet appareil
      await clearLocalWorkspace();
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("thebox_")) localStorage.removeItem(key);
      }
      try {
        await logoutUser();
      } catch {
        /* compte déjà supprimé côté serveur */
      }
      alert("Votre compte et vos données ont été supprimés définitivement.");
      window.location.reload();
    } catch (e: any) {
      if (syncWasRunning) startWorkspaceSync(user.uid);
      setDeleteAccountError(e?.message || "La suppression n'a pas pu aboutir.");
      setIsDeletingAccount(false);
    }
  };
  const handleCancelAccountDeletion = async () => {
    const user = auth.currentUser;
    if (!user || isDeletingAccount) return;
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || "L'annulation n'a pas pu aboutir.");
      setScheduledDeletionAt(null);
      setCoaches((prev) => prev.map((c) => (c.id === activeCoachId ? { ...c, deletionScheduledAt: null } : c)));
    } catch (e: any) {
      setDeleteAccountError(e?.message || "L'annulation n'a pas pu aboutir.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Saisie des notes tactiques : réservée aux formules PRO & PRO+ (les notes restent lisibles)
  const handleLockedNotesClick = () => {
    setSleekToastMessage("🔒 La saisie des notes tactiques est réservée aux formules PRO & PRO+.");
    setTimeout(() => setSleekToastMessage(null), 3000);
    setIsCheckoutOpen(true);
  };

  const isProPlusOrAdmin = Boolean(
    isUserAdmin ||
    currentPlan === "pro_plus" ||
    currentPlan === "club" ||
    currentPlan === "annuel" ||
    isInFreeTrial
  );

  const isProOrAdmin = Boolean(
    isProPlusOrAdmin ||
    currentPlan === "pro" ||
    currentPlan === "mensuel"
  );

  // Team configurations
  const [teamAColor, setTeamAColor] = useState("#00E599"); // Neon Emerald
  const [teamBColor, setTeamBColor] = useState("#ef4444"); // Red

  // Multi-Team Management States (PRO / PRO+ feature)
  const [teams, setTeams] = useState<TeamCategory[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_teams");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) { }
      }
    }
    return defaultTeams;
  });

  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_active_team_id");
      if (saved) return saved;
    }
    return "";
  });

  // Format de jeu (foot à 11 / 8 / 5, rugby à XV / 7) : choisi à la création de l'équipe.
  // Un schéma enregistré dans un autre format s'affiche dans son format, jusqu'au prochain changement d'équipe.
  const [schemaFormatOverride, setSchemaFormatOverride] = useState<{ sport: string; format: string } | null>(null);
  const teamForFormat = (teams.find((t) => t.id === activeTeamId) || teams[0]) as TeamCategory | undefined;
  const formatFor = (sport: string) =>
    schemaFormatOverride && schemaFormatOverride.sport === sport
      ? resolveGameFormat(sport, schemaFormatOverride.format)
      : resolveGameFormat(sport, teamForFormat?.format);
  const activeFormat = formatFor(activeSport);
  const applySchemaFormat = (sport: string, format?: string) => {
    if (getGameFormatOptions(sport).length === 0) return;
    const resolved = resolveGameFormat(sport, format);
    setSchemaFormatOverride(resolved === resolveGameFormat(sport, teamForFormat?.format) ? null : { sport, format: resolved });
  };

  // Sport-specific default player generators & formation helpers
  const getDefaultPlayersForSport = (sport: string, format: string = formatFor(sport)): Token[] =>
    getDefaultPlayersForSportImpl({ formatFor }, sport, format);

  const getAvailableFormationsForSport = (sport: string, format: string = formatFor(sport)): string[] => {
    const formatFormations = getFormatFormations(sport, format);
    if (formatFormations) return formatFormations;
    switch (sport) {
      case "basketball":
        return ["2-3", "1-2-2", "1-3-1", "3-2", "5-Out"];
      case "rugby":
        return ["15s Standard", "Pack Ruck", "Combinaison"];
      case "handball":
        return ["6-0", "5-1", "3-2-1", "4-2"];
      case "football":
      default:
        return ["4-4-2", "4-3-3", "4-2-3-1", "3-4-3", "5-3-2", "3-5-2"];
    }
  };

  const [keyframes, setKeyframes] = useState<Token[][]>(() => {
    return [getDefaultPlayersForSport(activeSport)];
  });
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per frame

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<"select" | "move" | "line" | "curve" | "arrow" | "draw" | "settings" | "link">("select");
  const [drawingTool, setDrawingTool] = useState<DrawingAction["tool"]>("brush");
  const [drawColor, setDrawColor] = useState<string>("#00E599"); // Green by default
  const [drawSize, setDrawSize] = useState<number>(3);
  const [drawingActions, setDrawingActions] = useState<DrawingAction[]>([]);
  const [drawingHistory, setDrawingHistory] = useState<DrawingAction[][]>([]); // for Undo
  const [selectedStrokeIndex, setSelectedStrokeIndex] = useState<number | null>(null);

  // Selection & Draggable state
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentActionPoints, setCurrentActionPoints] = useState<{ x: number; y: number }[]>([]);
  // Crayon (dessin libre) : les points du trait en cours sont gardés hors de l'état React et dessinés
  // directement sur le canevas. Sans cela, chaque mouvement re-rendait tout le tableau et, sur tablette,
  // les mouvements arrivaient trop espacés : le trait ne gardait que quelques points (segments droits).
  const brushPointsRef = useRef<{ x: number; y: number }[]>([]);
  // Dernier appui sur un joueur (détection du double appui qui ouvre la fiche)
  const lastTokenTapRef = useRef<{ id: string; at: number } | null>(null);

  // Viewport Settings
  const [terrainComplet, setTerrainComplet] = useState<boolean>(true);
  const [isAnimationCreatorOpen, setIsAnimationCreatorOpen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
  // Hauteur réelle du terrain (hors zoom) : sert à réserver sa hauteur zoomée pour garder la barre d'animation dessous
  const [pitchBoxHeight, setPitchBoxHeight] = useState<number>(0);
  const pitchBoxObserverRef = useRef<ResizeObserver | null>(null);
  const pitchBoxRef = useCallback((node: HTMLDivElement | null) => {
    pitchBoxObserverRef.current?.disconnect();
    pitchBoxObserverRef.current = null;
    if (!node) return;
    setPitchBoxHeight(node.offsetHeight);
    const observer = new ResizeObserver(() => setPitchBoxHeight(node.offsetHeight));
    observer.observe(node);
    pitchBoxObserverRef.current = observer;
  }, []);
  const [pitchPan, setPitchPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningPitch, setIsPanningPitch] = useState<boolean>(false);
  const [playerScale, setPlayerScale] = useState<number>(100);
  const [aspectRatioMode, setAspectRatioMode] = useState<"desktop" | "mobile">("desktop");
  const [isBoardFullscreen, setIsBoardFullscreen] = useState(false);
  const [isPitchFullscreen, setIsPitchFullscreen] = useState(false);

  // Active tactical formation state
  const [selectedFormationA, setSelectedFormationA] = useState<string>("4-3-3");
  const [selectedFormationB, setSelectedFormationB] = useState<string>("4-3-3");

  // Toggles display
  const [showBall, setShowBall] = useState<boolean>(true);
  const [showOpponents, setShowOpponents] = useState<boolean>(true);
  // Football uniquement : 5 couloirs (latéraux, demi-espaces, axe) tracés sur le terrain
  const [showPitchZones, setShowPitchZones] = useState<boolean>(false);
  // Football uniquement : 3 zones dans la longueur (défense, milieu, attaque)
  const [showPitchThirds, setShowPitchThirds] = useState<boolean>(false);
  const pitchThirdsLabels: [string, string, string] = currentLang === "en" ? ["Defence", "Midfield", "Attack"] : ["Défense", "Milieu", "Attaque"];
  const isFootballBoard = ["football", "soccer"].includes(activeSport.toLowerCase());
  // Mur sur coup franc (football) : nombre de joueurs choisi par équipe, fenêtre de réglage de la barre d'outils
  const [wallCounts, setWallCounts] = useState<Record<WallTeam, number>>({ home: WALL_DEFAULT, away: WALL_DEFAULT });
  const [wallPopover, setWallPopover] = useState<{ team: WallTeam; left: number; top: number } | null>(null);
  /** Joueur glissé au-dessus d'un mur : place visée (surbrillance) */
  const [wallDropTarget, setWallDropTarget] = useState<{ team: WallTeam; slot: number } | null>(null);
  // Aimant du ballon : joueur qui recevra le ballon si on le lâche maintenant (surbrillance pendant le glisser)
  const [ballMagnetTargetId, setBallMagnetTargetId] = useState<string | null>(null);
  // Liaisons entre joueurs : chaîne en cours de création (outil « Lier »), réglages et liaison sélectionnée
  const [linkDraft, setLinkDraft] = useState<string[]>([]);
  const [linkColor, setLinkColor] = useState<string>(LINK_COLORS[0]);
  const [linkDashed, setLinkDashed] = useState<boolean>(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const tokensLayerRef = useRef<HTMLDivElement>(null);
  /** Rôles réellement attribués (hors composition du mur) */
  const countSportRoles = (roles: SetPieceRoleConfig) => getSportRoles(activeSport).roles.filter((r) => roles[r.key]).length;
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_show_player_names");
      if (saved !== null) {
        return saved === "true";
      }
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_show_player_names", String(showPlayerNames));
    }
  }, [showPlayerNames]);

  // Rôles des joueurs sur le terrain (« C » du capitaine, CF, PK, CK…) : masquables depuis la barre d'outils
  const [showPlayerRoles, setShowPlayerRoles] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("thebox_show_player_roles");
        if (saved !== null) return saved === "true";
      } catch { }
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem("thebox_show_player_roles", String(showPlayerRoles));
    } catch { }
  }, [showPlayerRoles]);
  const playerRolesToggleLabel = showPlayerRoles
    ? (currentLang === "en" ? "Hide player roles (captain, set pieces)" : "Masquer les rôles des joueurs (capitaine, coups de pied arrêtés)")
    : (currentLang === "en" ? "Show player roles (captain, set pieces)" : "Afficher les rôles des joueurs (capitaine, coups de pied arrêtés)");

  // Choix de la représentation des joueurs : Pastille ("dot"), Buste ("jersey") ou Tête ("head")
  const [playerRepresentation, setPlayerRepresentation] = useState<"dot" | "jersey" | "head">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_player_representation");
      if (saved === "dot" || saved === "jersey" || saved === "head") {
        return saved;
      }
    }
    return "head";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_player_representation", playerRepresentation);
    }
  }, [playerRepresentation]);

  // Flanking Panels Collapse States (for iPad & small screens)
  const [isTeamAPanelCollapsed, setIsTeamAPanelCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_panel_a_collapsed");
      if (saved !== null) return saved === "true";
      if (window.innerWidth < 1024) return true;
    }
    return false;
  });

  const [isTeamBPanelCollapsed, setIsTeamBPanelCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_panel_b_collapsed");
      if (saved !== null) return saved === "true";
      if (window.innerWidth < 1024) return true;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_panel_a_collapsed", String(isTeamAPanelCollapsed));
    }
  }, [isTeamAPanelCollapsed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_panel_b_collapsed", String(isTeamBPanelCollapsed));
    }
  }, [isTeamBPanelCollapsed]);

  // 3D Squad Card Export View Modal State
  const [showSquad3DModal, setShowSquad3DModal] = useState<boolean>(false);
  const [squad3DPlayerStyle, setSquad3DPlayerStyle] = useState<"card" | "head">("head");
  const [squad3DPlayerScale, setSquad3DPlayerScale] = useState<number>(100);
  const [cardTheme, setCardTheme] = useState<"gold" | "silver" | "black_special" | "emerald">("gold");
  const [showCardStats, setShowCardStats] = useState<boolean>(true);
  const [squad3DOrientation, setSquad3DOrientation] = useState<"landscape" | "portrait">("landscape");
  const [squad3DPitchScale, setSquad3DPitchScale] = useState<number>(100);
  const squad3DRef = useRef<HTMLDivElement>(null);

  // Share Modal State (Schemas & 3D Card View)
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const gifRequestIdRef = useRef<number>(0);
  // Portraits déjà chargés, indexés par source : le dessin de l'export sur canvas est synchrone
  const exportImageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const [shareData, setShareData] = useState<ShareData | null>(null);

  // Dedicated helper to capture the full 3D Squad Stage without scroll or viewport clipping
  const captureSquad3DDataUrl = (): Promise<string | null> =>
    captureSquad3DDataUrlImpl({ squad3DOrientation, squad3DRef });

  const handleDownloadSquad3DImage = async () => {
    try {
      const dataUrl = await captureSquad3DDataUrl();
      if (!dataUrl) {
        alert("L'exportation de la vue 3D a rencontré un souci. Veuillez réessayer.");
        return;
      }
      const link = document.createElement("a");
      link.download = `squad_3d_${squad3DPlayerStyle}_${activeSport}_${squad3DOrientation}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur téléchargement 3D:", err);
      alert("L'exportation de la vue 3D a rencontré un souci. Veuillez réessayer.");
    }
  };

  // Notes state (persisted per active match)
  const [quickNote, setQuickNote] = useState<string>("");
  const [tacticalNotes, setTacticalNotes] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const savedMatchNotes = localStorage.getItem(`thebox_match_notes_${initialMatchId}`);
      if (savedMatchNotes !== null) return savedMatchNotes;
      const legacySaved = localStorage.getItem("thebox_tactical_notes");
      return legacySaved || "";
    }
    return "";
  });
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isSchemasSectionCollapsed, setIsSchemasSectionCollapsed] = useState(false);
  const [isMatchSectionCollapsed, setIsMatchSectionCollapsed] = useState(false);
  const [isNotesSectionCollapsed, setIsNotesSectionCollapsed] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
      }
    };
  }, []);

  // Set-Piece Roles & Captain designations (persisted per active match)
  const [setPieceRoles, setSetPieceRoles] = useState<SetPieceRoleConfig>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_setpiece_roles_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return defaultSetPieceRoles;
  });

  const [opponentSetPieceRoles, setOpponentSetPieceRoles] = useState<SetPieceRoleConfig>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_opp_setpiece_roles_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return defaultSetPieceRoles;
  });

  const [rolesTargetTeam, setRolesTargetTeam] = useState<"home" | "away">("home");
  const [isSetPiecesOpen, setIsSetPiecesOpen] = useState(false);
  const [teamRolesModalTab, setTeamRolesModalTab] = useState<"players" | "setpieces">("players");
  const [rosterSearchQuery, setRosterSearchQuery] = useState<string>("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "starters" | "subs" | "reserve">("all");
  const [rosterPositionFilter, setRosterPositionFilter] = useState<string>("ALL");

  // Tactic Save states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaveAnimationMode, setIsSaveAnimationMode] = useState(false);
  const [tacticName, setTacticName] = useState("");
  const [tacticDesc, setTacticDesc] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDeleteSchemaId, setConfirmDeleteSchemaId] = useState<string | null>(null);


  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [saveTacticMatchId, setSaveTacticMatchId] = useState<string>("");
  const [isMultiTeamModalOpen, setIsMultiTeamModalOpen] = useState(false);
  const [isMultiTeamUpgradeModalOpen, setIsMultiTeamUpgradeModalOpen] = useState(false);
  const [isLiveMatchUpgradeModalOpen, setIsLiveMatchUpgradeModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamCategory, setNewTeamCategory] = useState("Séniors");
  const [newTeamFormat, setNewTeamFormat] = useState<string>("");
  // Effectif saisi à la création : taille choisie (null = taille par défaut du format) et fiches par position dans la liste
  const [newTeamSquadSize, setNewTeamSquadSize] = useState<number | null>(null);
  const [newTeamPlayerEdits, setNewTeamPlayerEdits] = useState<Record<number, NewTeamPlayerEdit>>({});

  // Fenêtre de gestion des équipes : fermeture avec Échap
  useEffect(() => {
    if (!isMultiTeamModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMultiTeamModalOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMultiTeamModalOpen]);

  // Persistent Rosters for each team managed by the user
  const [teamRostersMap, setTeamRostersMap] = useState<Record<string, TeamRosterPlayer[]>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_team_rosters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            // Auto-migrate legacy rosters that contain real player names (e.g. Lewandowski, Pedri, etc.)
            const str = JSON.stringify(parsed);
            if (/(Stegen|Araújo|Cubarsí|Koundé|Lewandowski|Raphinha|Pedri|Gavi|Fati|Torres|Yamal|De Jong|Mbappé|Benzema|Courtois)/i.test(str)) {
              localStorage.removeItem("thebox_team_rosters");
              return {};
            }
            return parsed;
          }
        } catch (e) { }
      }
    }
    // Nouveau compte : pas d'effectif tant qu'aucune équipe n'est créée
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      safeLocalStorageSetItem("thebox_team_rosters", JSON.stringify(teamRostersMap));
    }
  }, [teamRostersMap]);

  const getRosterForTeam = (teamId: string): TeamRosterPlayer[] => {
    if (teamRostersMap[teamId] && teamRostersMap[teamId].length > 0) {
      return teamRostersMap[teamId];
    }
    if (defaultManagedTeamRosters[teamId]) {
      return defaultManagedTeamRosters[teamId];
    }
    const targetTeam = teams.find((t) => t.id === teamId);
    return generateDefaultRosterForCustomTeam(teamId, targetTeam?.name || "Équipe", targetTeam?.category || "Séniors");
  };

  // Inter-Team Player Swap States (Passerelle inter-équipes gérées)
  const [isInterTeamSwapOpen, setIsInterTeamSwapOpen] = useState<boolean>(false);
  const [swapSourcePlayer, setSwapSourcePlayer] = useState<{
    id: string;
    name: string;
    number: number;
    role: string;
    photo?: string;
    status?: string;
    isStarter: boolean;
    teamTarget?: "home" | "away";
  } | null>(null);
  const [swapTargetTeamId, setSwapTargetTeamId] = useState<string>("team_2");
  const [swapTargetPlayerId, setSwapTargetPlayerId] = useState<string | null>(null);
  const [swapSearchQuery, setSwapSearchQuery] = useState<string>("");
  const [swapPositionFilter, setSwapPositionFilter] = useState<string>("ALL");
  const [swapNotification, setSwapNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      safeLocalStorageSetItem("thebox_teams", JSON.stringify(teams));
    }
  }, [teams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      safeLocalStorageSetItem("thebox_active_team_id", activeTeamId);
    }
  }, [activeTeamId]);

  const activeTeam = (teams.find((t) => t.id === activeTeamId) || teams[0]) as TeamCategory | undefined;

  // Logo du club (profil du coach) : carte du match, rond central du terrain, exports image et PDF
  const clubLogo = activeCoach?.clubLogo || "";
  const showClubLogoOnPitch = Boolean(clubLogo) && (activeCoach?.showLogoOnPitch ?? true);
  const clubLogoImgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!clubLogo) { clubLogoImgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { clubLogoImgRef.current = img; };
    img.src = clubLogo;
  }, [clubLogo]);
  /** true si ce nom d'équipe est une équipe du club (pour placer le logo du bon côté du match) */
  const isClubTeamName = (name?: string) => {
    const n = (name || "").trim().toLowerCase();
    if (!n) return false;
    return teams.some((t) => t.name.trim().toLowerCase() === n) || (activeCoach?.club || "").trim().toLowerCase() === n;
  };

  const handleSelectTeam = (teamId: string) => {
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;

    if (!isProOrAdmin && !target.isDefault) {
      setIsMultiTeamUpgradeModalOpen(true);
      return;
    }

    setActiveTeamId(teamId);
  };

  /**
   * Effectif proposé dans le formulaire de création d'équipe : les titulaires du format choisi,
   * puis les remplaçants, complétés par les fiches déjà saisies (photo, numéro, nom, poste).
   */
  const getNewTeamDraft = () => {
    const starters = getDefaultPlayersForSport(activeSport, resolveGameFormat(activeSport, newTeamFormat))
      .filter((t) => t.type === "player_a");
    const defaultSize = Math.min(MAX_TEAM_SQUAD_SIZE, starters.length + Math.max(3, Math.round(starters.length * 0.6)));
    const size = newTeamSquadSize ?? defaultSize;
    const positions = getSportCommonPositions(activeSport).filter((p) => p !== "SUB");
    const useStandardBench = activeSport === "football" && starters.length === 11;
    const players = Array.from({ length: size }, (_, index) => {
      const edit = newTeamPlayerEdits[index] || {};
      const defaultRole = index < starters.length && starters[index].role
        ? starters[index].role
        : (useStandardBench && standardDefaultRoles26[index]?.role) || positions[index % positions.length];
      const typedNumber = parseInt(edit.numberText ?? "", 10);
      return {
        index,
        number: Number.isNaN(typedNumber) ? index + 1 : typedNumber,
        numberText: edit.numberText ?? String(index + 1),
        name: edit.name ?? "",
        role: edit.role ?? defaultRole,
        photo: edit.photo,
        status: edit.status ?? ("normal" as TeamRosterStatus),
        isStarter: index < starters.length,
      };
    });
    return { size, starterCount: Math.min(starters.length, size), players, positions };
  };

  const updateNewTeamPlayer = (index: number, patch: NewTeamPlayerEdit) => {
    setNewTeamPlayerEdits((prev) => ({ ...prev, [index]: { ...prev[index], ...patch } }));
  };

  const handleNewTeamPlayerPhoto = async (index: number, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).");
      return;
    }
    try {
      const photo = await compressImage(file, 160, 160, 0.75);
      if (photo) updateNewTeamPlayer(index, { photo });
    } catch (err) {
      console.error("Erreur lors de la compression de la photo:", err);
    }
  };

  const handleCreateNewTeam = (e?: React.FormEvent) =>
    handleCreateNewTeamImpl({ activeSport, clearActiveMatch, getDefaultPlayersForSport, getNewTeamDraft, isProOrAdmin, newTeamCategory, newTeamFormat, newTeamName, setActiveTeamId, setCurrentFrameIdx, setDrawingActions, setIsMultiTeamUpgradeModalOpen, setKeyframes, setNewTeamFormat, setNewTeamName, setNewTeamPlayerEdits, setNewTeamSquadSize, setSubstitutes, setTeamRostersMap, setTeams, teams }, e);

  // ---- Fiches des joueurs d'une équipe enregistrée (clic sur l'équipe dans « Gestion des équipes ») ----
  const [rosterEditTeamId, setRosterEditTeamId] = useState<string | null>(null);

  const editTeamRoster = (teamId: string, update: (roster: TeamRosterPlayer[]) => TeamRosterPlayer[]) => {
    setTeamRostersMap((prev) => ({
      ...prev,
      [teamId]: update(prev[teamId]?.length ? prev[teamId] : getRosterForTeam(teamId)),
    }));
  };

  /** Modifie une fiche ; pour l'équipe active, le joueur est aussi mis à jour sur le terrain et le banc du match */
  const handleEditTeamPlayer = (teamId: string, playerId: string, patch: Partial<TeamRosterPlayer>) => {
    editTeamRoster(teamId, (roster) => roster.map((p) => (p.id === playerId ? { ...p, ...patch } : p)));
    if (teamId !== activeTeamId) return;
    const { isStarter: _isStarter, id: _id, status, ...rest } = patch;
    const tokenPatch: Partial<Token> = { ...rest, ...(status !== undefined ? { status: toGroupStatus(status) } : {}) };
    if (Object.keys(tokenPatch).length === 0) return;
    setKeyframes((prev) => prev.map((frame) => frame.map((t) => (t.type === "player_a" && t.rosterId === playerId ? { ...t, ...tokenPatch } : t))));
    setSubstitutes((prev) => prev.map((s) => (s.rosterId === playerId ? { ...s, ...tokenPatch } : s)));
  };

  const handleTeamPlayerPhoto = async (teamId: string, playerId: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).");
      return;
    }
    try {
      const photo = await compressImage(file, 160, 160, 0.75);
      if (photo) handleEditTeamPlayer(teamId, playerId, { photo });
    } catch (err) {
      console.error("Erreur lors de la compression de la photo:", err);
    }
  };

  const handleAddTeamPlayer = (teamId: string) => {
    editTeamRoster(teamId, (roster) => {
      if (roster.length >= MAX_TEAM_SQUAD_SIZE) return roster;
      const used = new Set(roster.map((p) => p.number));
      let number = 1;
      while (used.has(number)) number++;
      const role = getSportCommonPositions(activeSport).filter((p) => p !== "SUB")[0] || "SUB";
      return [...roster, { id: `${teamId}_p${Date.now()}`, name: `Joueur ${number}`, number, role, status: "normal", isStarter: false }];
    });
  };

  const handleRemoveTeamPlayer = async (teamId: string, playerId: string) => {
    const player = getRosterForTeam(teamId).find((p) => p.id === playerId);
    if (!player) return;
    const ok = await confirmAction({
      title: "Retirer ce joueur de l'équipe ?",
      subject: player.name,
      message: "Sa fiche sera supprimée de l'effectif de l'équipe. Les matchs déjà préparés ne sont pas modifiés.",
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    editTeamRoster(teamId, (roster) => roster.filter((p) => p.id !== playerId));
  };

  const handleDeleteTeam = async (teamId: string) => {
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;
    if (target.isDefault) {
      alert("L'équipe principale par défaut ne peut pas être supprimée.");
      return;
    }

    if (await confirmAction({ title: "Supprimer cette équipe ?", subject: target.name, message: "L'équipe et son effectif seront retirés de votre compte." })) {
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      if (activeTeamId === teamId) {
        setActiveTeamId(teams.find((t) => t.id !== teamId && t.isDefault)?.id || teams.find((t) => t.id !== teamId)?.id || "");
      }
    }
  };

  // Sidebar Toggles & Resizing State
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_right_sidebar_open");
      if (saved !== null) {
        return saved === "true";
      }
    }
    // Ouverte par défaut sur grand écran ; en dessous de xl, elle reste un tiroir à la demande
    return typeof window !== "undefined" && window.innerWidth >= 1280;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_right_sidebar_open", String(isRightSidebarOpen));
    }
  }, [isRightSidebarOpen]);
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_right_sidebar_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 170 && parsed <= 700) {
          return parsed;
        }
      }
    }
    return 300;
  });
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState<boolean>(false);
  const resizingStartXRef = useRef<number>(0);
  const resizingStartWidthRef = useRef<number>(300);

  // Save right sidebar width to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_right_sidebar_width", rightSidebarWidth.toString());
    }
  }, [rightSidebarWidth]);

  // Window drag listeners for smooth right sidebar resizing
  useEffect(() => {
    if (!isResizingRightSidebar) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const deltaX = resizingStartXRef.current - clientX;
      const maxAllowed = typeof window !== "undefined" ? Math.min(650, Math.floor(window.innerWidth * 0.45)) : 500;
      const newWidth = Math.min(
        Math.max(170, resizingStartWidthRef.current + deltaX),
        maxAllowed
      );
      setRightSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingRightSidebar(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingRightSidebar]);

  const handleRightSidebarResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizingRightSidebar(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    resizingStartXRef.current = clientX;
    resizingStartWidthRef.current = rightSidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Compact / Simplified UI Mode State
  const [isCompactUI, setIsCompactUI] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("thebox_compact_ui") === "true";
    }
    return false;
  });

  const toggleCompactUI = () => {
    setIsCompactUI((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_compact_ui", String(next));
      }
      return next;
    });
  };

  // Ultra-Sleek Modern UI Mode State (persisted in localStorage, proposed active by default)
  const [isModernSleek, setIsModernSleek] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_modern_sleek");
      if (saved !== null) return saved === "true";
    }
    return false; // Le design sombre « cockpit » est le thème par défaut
  });

  const [sleekToastMessage, setSleekToastMessage] = useState<string | null>(null);

  const toggleModernSleek = () => {
    setIsModernSleek((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_modern_sleek", String(next));
      }
      if (next && rightSidebarWidth < 260) {
        setRightSidebarWidth(260);
      }
      setSleekToastMessage(
        next
          ? "✨ Mode Design Épuré (Clair) activé : couleurs lumineuses, interface aérée et contrastes optimisés."
          : "🌙 Mode Design Sombre Classique réactivé."
      );
      setTimeout(() => {
        setSleekToastMessage(null);
      }, 3500);
      return next;
    });
  };

  // Subscription Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Ouverture demandée depuis l'extérieur du tableau (bouton « Découvrir les Offres Pro » de la modale d'essai)
  useEffect(() => {
    if (checkoutRequest > 0) setIsCheckoutOpen(true);
  }, [checkoutRequest]);

  // User Profile & Sport Configuration Modal State
  const [isUserConfigModalOpen, setIsUserConfigModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editClub, setEditClub] = useState("");
  const [editClubLogo, setEditClubLogo] = useState<string>("");
  const [editShowLogoOnPitch, setEditShowLogoOnPitch] = useState(true);
  const [clubLogoError, setClubLogoError] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editSport, setEditSport] = useState(activeSport);
  const [editLanguage, setEditLanguage] = useState<Language>(currentLang);
  const [userConfigSection, setUserConfigSection] = useState<"profile" | "preferences" | "sport" | "billing">("profile");

  const handleOpenUserConfig = () => {
    const fallbackEmail = typeof window !== "undefined" ? localStorage.getItem("thebox_user_email") || "coach@thebox.com" : "coach@thebox.com";
    if (activeCoach) {
      setEditFirstName(activeCoach.firstName || "Coach");
      setEditLastName(activeCoach.lastName || "Principal");
      setEditEmail(activeCoach.email || fallbackEmail);
      setEditClub(activeCoach.club || "");
      setEditClubLogo(activeCoach.clubLogo || "");
      setEditShowLogoOnPitch(activeCoach.showLogoOnPitch ?? true);
      setClubLogoError(null);
      setEditRole(activeCoach.role || "Coach Principal");
      setEditSport(activeSport || activeCoach.preferredSport || "football");
      setEditLanguage(activeCoach.language || currentLang);
    } else {
      setEditFirstName((prev) => prev || "Coach");
      setEditLastName((prev) => prev || "Principal");
      setEditEmail((prev) => prev || fallbackEmail);
      setEditSport(activeSport || "football");
      setEditLanguage(currentLang);
    }
    setUserConfigSection("profile");
    setIsUserConfigModalOpen(true);
  };

  const handleSaveUserConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFirstName.trim() || !editLastName.trim()) {
      alert(t.userModal.validationName);
      return;
    }
    if (!editEmail.trim() || !editEmail.includes("@")) {
      alert(t.userModal.validationEmail);
      return;
    }

    if (!isUserAdmin && blockedSports.includes(editSport)) {
      alert(t.userModal.sportBlockedAlert(editSport));
      return;
    }

    const finalLang = editLanguage;
    setCurrentLang(finalLang);
    setStoredLanguage(finalLang);

    setCoaches((prev) =>
      prev.map((c) =>
        c.id === activeCoachId
          ? {
            ...c,
            firstName: editFirstName.trim(),
            lastName: editLastName.trim(),
            email: editEmail.trim(),
            club: editClub.trim(),
            clubLogo: editClubLogo,
            showLogoOnPitch: editShowLogoOnPitch,
            role: editRole,
            preferredSport: editSport,
            language: finalLang,
          }
          : c
      )
    );

    if (activeCoach) {
      saveUserProfileToFirestore({
        ...activeCoach,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        club: editClub.trim(),
        clubLogo: editClubLogo,
        showLogoOnPitch: editShowLogoOnPitch,
        role: editRole,
        preferredSport: editSport,
        language: finalLang,
      }).catch((err) => console.log("Firestore profile sync queued:", err));
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_user_email", editEmail.trim());
    }

    setActiveSport(editSport);
    setIsUserConfigModalOpen(false);
    setSleekToastMessage(translations[finalLang].userModal.successToast);
    setTimeout(() => setSleekToastMessage(null), 3000);
  };

  // Opponent Roster & Player Token Editing (PRO Mode)
  const [isOpponentRosterModalOpen, setIsOpponentRosterModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<Token | null>(null);
  const [editingRemovalReason, setEditingRemovalReason] = useState<"normal" | "injured" | "red_card">("normal");

  // Long-press Quick Removal Action State
  const [quickActionToken, setQuickActionToken] = useState<Token | null>(null);
  const [subPickerToken, setSubPickerToken] = useState<Token | null>(null);
  const [liveActionToken, setLiveActionToken] = useState<Token | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingTokenRef = useRef<boolean>(false);
  const dragEndTimeRef = useRef<number>(0);

  // Upcoming Match State & Multiple Matches management
  const [isMatchEditOpen, setIsMatchEditOpen] = useState(false);
  const [isExportingModalScreen, setIsExportingModalScreen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [matchSearchQuery, setMatchSearchQuery] = useState<string>("");
  const [matchTeamFilter, setMatchTeamFilter] = useState<string>("all");
  const [matchesList, setMatchesList] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_matches_list");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((m) =>
              m.awayTeam === "NOUVEL ADVERSAIRE" ? { ...m, awayTeam: "ADVERSAIRE" } : m
            );
          }
        } catch (e) { }
      }
    }
    // Aucun match par défaut : le coach crée ses matchs s'il le souhaite
    return [];
  });

  const [activeMatchId, setActiveMatchId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_active_match_id");
      if (saved !== null && saved !== "undefined") return saved;
    }
    return "";
  });

  // Synchronize setPieceRoles to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      localStorage.setItem(`thebox_setpiece_roles_${activeMatchId}`, JSON.stringify(setPieceRoles));
    }
  }, [setPieceRoles, activeMatchId]);

  // Synchronize opponentSetPieceRoles to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      localStorage.setItem(`thebox_opp_setpiece_roles_${activeMatchId}`, JSON.stringify(opponentSetPieceRoles));
    }
  }, [opponentSetPieceRoles, activeMatchId]);

  const filteredMatches = matchesList.filter((m) => (m.teamId || "team_1") === activeTeamId);

  const activeMatch =
    filteredMatches.find((m) => m.id === activeMatchId) ||
    matchesList.find((m) => m.id === activeMatchId) ||
    {
      id: "",
      teamId: activeTeamId,
      homeTeam: activeTeam?.name || "MON EQUIPE",
      awayTeam: "ADVERSAIRE",
      competition: "",
      dateTime: ""
    };
  // false quand le coach n'a (encore) aucun match pour l'équipe active
  const hasActiveMatch = Boolean(activeMatch.id);

  // Un schéma appartient au match donné. Sans match paramétré (matchId vide ou match supprimé),
  // aucun schéma n'est rattaché : la section Schémas reste vide.
  // Les anciens schémas sans matchId restent rattachés au match historique "match_1".
  const schemaBelongsToMatch = (sc: { matchId?: string }, matchId: string) => {
    if (!matchId || !matchesList.some((m) => m.id === matchId)) return false;
    return (sc.matchId || "match_1") === matchId;
  };

  const displayClubTitle = activeMatch?.homeTeam || activeTeam?.name || "MON EQUIPE";

  // LIVE MATCH Mode State
  const [isLiveMatchMode, setIsLiveMatchMode] = useState<boolean>(false);
  const [isLiveTimerRunning, setIsLiveTimerRunning] = useState<boolean>(false);
  const [isMatchFinishedModalOpen, setIsMatchFinishedModalOpen] = useState<boolean>(false);

  // Périodes de jeu du sport actif (football : 2 MT de 45 min ; basket : 4 QT de 20 min)
  const livePeriodConfig = useMemo(() => getLivePeriodConfig(activeSport, activeFormat), [activeSport, activeFormat]);
  const firstLivePeriod = livePeriodConfig.periods[0];

  const [currentPeriod, setCurrentPeriod] = useState<LivePeriod>(() => {
    const first = getLivePeriodConfig(activeSport, activeFormat).periods[0];
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved).currentPeriod || first; } catch (e) { }
      }
    }
    return first;
  });

  // Si la période enregistrée appartient à un autre sport (ex. "1MT" en basket), on la convertit
  useEffect(() => {
    if (currentPeriod === "MI-TEMPS" || currentPeriod === "FIN") return;
    if (livePeriodConfig.periods.includes(currentPeriod)) return;
    const secondHalf = currentPeriod === "2MT" || currentPeriod === "QT3" || currentPeriod === "QT4";
    setCurrentPeriod(livePeriodConfig.periods[secondHalf ? livePeriodConfig.breakAfterIndex + 1 : 0]);
  }, [currentPeriod, livePeriodConfig]);

  const [liveTimerSeconds, setLiveTimerSeconds] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved).liveTimerSeconds || 0; } catch (e) { }
      }
    }
    return 0;
  });

  // Mi-temps : compte à rebours de 15 minutes lancé au clic sur PAUSE
  const [halftimeSecondsLeft, setHalftimeSecondsLeft] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try {
          const value = JSON.parse(saved).halftimeSecondsLeft;
          if (typeof value === "number") return value;
        } catch (e) { }
      }
    }
    return HALFTIME_BREAK_SECONDS;
  });
  const [isHalftimeRunning, setIsHalftimeRunning] = useState<boolean>(false);

  const [homeScore, setHomeScore] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved).homeScore || 0; } catch (e) { }
      }
    }
    return 0;
  });

  const [awayScore, setAwayScore] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved).awayScore || 0; } catch (e) { }
      }
    }
    return 0;
  });

  const [matchEvents, setMatchEvents] = useState<Array<{
    id: string;
    time: string;
    period?: string;
    type: "goal" | "assist" | "yellow" | "red" | "sub" | "note";
    player: string;
    number?: number;
    team: "home" | "away";
    note?: string;
    assister?: string;
    points?: number;
    icon?: string;
    subType?: string;
    /** Remplacement saisi à la télécommande : place sur le terrain (annulation) */
    outId?: string;
    /** Saisi à la télécommande du mode Live */
    remote?: boolean;
  }>>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_events_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return [];
  });

  // State for Goal / Point Assist Selection Modal
  const [pendingGoalToken, setPendingGoalToken] = useState<Token | null>(null);
  const [pendingScoreAction, setPendingScoreAction] = useState<SportScoreAction | null>(null);
  const [selectedPasseurName, setSelectedPasseurName] = useState<string>("");

  // Persist match events per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      safeLocalStorageSetItem(`thebox_match_events_${activeMatchId}`, JSON.stringify(matchEvents));
    }
  }, [matchEvents, activeMatchId]);

  // Persist match state (scores, timer & period) per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      safeLocalStorageSetItem(
        `thebox_match_state_${activeMatchId}`,
        JSON.stringify({ homeScore, awayScore, liveTimerSeconds, currentPeriod, halftimeSecondsLeft })
      );
    }
  }, [homeScore, awayScore, liveTimerSeconds, currentPeriod, halftimeSecondsLeft, activeMatchId]);

  // Persist active match pitch state (keyframes and drawings) per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId && keyframes.length > 0) {
      safeLocalStorageSetItem(
        `thebox_pitch_state_${activeMatchId}`,
        JSON.stringify({ keyframes, drawings: drawingActions })
      );
    }
  }, [keyframes, drawingActions, activeMatchId]);

  // Persist notes per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      safeLocalStorageSetItem(`thebox_match_notes_${activeMatchId}`, tacticalNotes);
    }
  }, [tacticalNotes, activeMatchId]);

  // Handle Match Finish & Save to match record
  const handleFinishLiveMatch = (isAuto: boolean = false) => {
    setIsLiveTimerRunning(false);
    setIsHalftimeRunning(false);
    setIsLiveMatchMode(false);
    setLiveActionToken(null);
    setCurrentPeriod("FIN");
    const scoreFormatted = `${homeScore} - ${awayScore}`;

    const updatedMatch = {
      ...activeMatch,
      homeScore,
      awayScore,
      score: scoreFormatted,
      isFinished: true,
      finishedAtMs: Date.now(),
      status: `Terminé (${scoreFormatted})`,
      finishedAt: new Date().toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      events: matchEvents,
      notes: tacticalNotes
    };

    setMatchesList((prev) => {
      const list = prev.map((m) => (m.id === activeMatchId ? updatedMatch : m));
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_matches_list", JSON.stringify(list));
      }
      return list;
    });

    setIsMatchFinishedModalOpen(true);
    setSleekToastMessage(
      isAuto
        ? `🏁 Match terminé (${formatLiveTime(livePeriodConfig.periods.length * livePeriodConfig.periodSeconds)}) ! Score final : ${scoreFormatted}. Données rattachées au match.`
        : `🏁 Match terminé ! Score final : ${scoreFormatted} enregistré.`
    );
    setTimeout(() => setSleekToastMessage(null), 4500);
  };

  // Chrono du match : il continue au-delà de la durée de la période (temps additionnel),
  // l'affichage passe alors en rouge (ex. football 1MT : après 45:00 ; basket QT1 : après 20:00).
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLiveMatchMode && isLiveTimerRunning) {
      interval = setInterval(() => {
        setLiveTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMatchMode, isLiveTimerRunning]);

  // Compte à rebours de la mi-temps (15 minutes)
  useEffect(() => {
    if (!isLiveMatchMode || !isHalftimeRunning || currentPeriod !== "MI-TEMPS") return;
    const interval = setInterval(() => {
      setHalftimeSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveMatchMode, isHalftimeRunning, currentPeriod]);

  useEffect(() => {
    if (halftimeSecondsLeft === 0 && isHalftimeRunning) {
      setIsHalftimeRunning(false);
      const nextPeriod = livePeriodConfig.periods[livePeriodConfig.breakAfterIndex + 1];
      setSleekToastMessage(`⏱️ Fin de la pause (15:00) ! Cliquez sur ${nextPeriod} pour relancer le match.`);
      setTimeout(() => setSleekToastMessage(null), 4500);
    }
  }, [halftimeSecondsLeft, isHalftimeRunning, livePeriodConfig]);

  const formatLiveTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Temps réglementaire de la période en cours dépassé (affichage en rouge)
  const currentPeriodIndex = livePeriodConfig.periods.indexOf(currentPeriod);
  const isPeriodOvertime =
    currentPeriodIndex >= 0 &&
    liveTimerSeconds > (currentPeriodIndex + 1) * livePeriodConfig.periodSeconds;
  const isHalftime = currentPeriod === "MI-TEMPS";

  // Libellés de la pause : en basket on parle de « PAUSE » (pas de mi-temps), sinon de mi-temps
  const isBasketLive = activeSport === "basketball";
  const breakShortLabel = isBasketLive ? "PAUSE" : "MT";
  const breakLongLabel = isBasketLive ? "Pause" : "Mi-temps";
  // Période inscrite sur les événements du match (buts, cartons, remplacements…)
  const eventPeriodLabel = isHalftime && isBasketLive ? "PAUSE" : currentPeriod;

  // Boutons de période affichés : périodes de jeu avec la pause insérée au bon endroit
  // (football : 1MT | PAUSE | 2MT ; basket : QT1 | QT2 | PAUSE | QT3 | QT4)
  const livePeriodButtons: LivePeriod[] = [
    ...livePeriodConfig.periods.slice(0, livePeriodConfig.breakAfterIndex + 1),
    "MI-TEMPS",
    ...livePeriodConfig.periods.slice(livePeriodConfig.breakAfterIndex + 1),
  ];

  // Changement de période depuis les boutons de période
  const handleSelectLivePeriod = (period: LivePeriod) => {
    if (period === "MI-TEMPS") {
      // Pause : le chrono du match s'arrête et le compte à rebours de 15 minutes démarre
      setIsLiveTimerRunning(false);
      if (currentPeriod !== "MI-TEMPS") setHalftimeSecondsLeft(HALFTIME_BREAK_SECONDS);
      setIsHalftimeRunning(true);
    } else {
      setIsHalftimeRunning(false);
      // Chaque nouvelle période repart de son début théorique (ex. 2MT à 45:00, QT3 à 40:00),
      // quel que soit le temps additionnel de la précédente
      const index = livePeriodConfig.periods.indexOf(period);
      if (index > 0 && period !== currentPeriod) setLiveTimerSeconds(index * livePeriodConfig.periodSeconds);
      setIsLiveTimerRunning(true);
    }
    setCurrentPeriod(period);
  };

  const handleDeleteMatchEvent = (eventId: string) => {
    const target = matchEvents.find((e) => e.id === eventId);
    if (target && target.type === "goal") {
      const pts = target.points || 1;
      if (target.team === "home") {
        setHomeScore((prev) => Math.max(0, prev - pts));
      } else {
        setAwayScore((prev) => Math.max(0, prev - pts));
      }
    }
    setMatchEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const updateActiveMatchField = (field: string, value: string) => {
    setMatchesList(prev => {
      const updated = prev.map(m => {
        if (m.id === activeMatchId) {
          return { ...m, [field]: value };
        }
        return m;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_matches_list", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateMatchById = (matchId: string, field: string, value: any) => {
    setMatchesList((prev) => {
      const updated = prev.map((m) => {
        if (m.id === matchId) {
          const newM = { ...m, [field]: value };
          if (field === "date" || field === "time") {
            const d = field === "date" ? value : (m.date || "");
            const t = field === "time" ? value : (m.time || "");
            if (d && t) {
              newM.dateTime = `${d} • ${t}`;
            } else if (d) {
              newM.dateTime = d;
            } else if (t) {
              newM.dateTime = t;
            }
          }
          return newM;
        }
        return m;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_matches_list", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleDeleteMatchFromList = async (matchId: string) => {
    const targetM = matchesList.find((m) => m.id === matchId);
    const matchTitle = targetM ? `${targetM.homeTeam} VS ${targetM.awayTeam}` : "ce match";
    if (await confirmAction({ title: "Supprimer ce match ?", subject: matchTitle, message: "Toutes ses actions, statistiques et schémas associés seront également supprimés." })) {
      const updatedList = matchesList.filter((m) => m.id !== matchId);
      setMatchesList(updatedList);
      if (targetM?.livePublicId) deleteLiveMatch(targetM.livePublicId).catch(() => {});
      setSavedTactics((prev) => prev.filter((s) => s.matchId !== matchId));
      if (typeof window !== "undefined") {
        localStorage.removeItem(`thebox_match_events_${matchId}`);
        localStorage.removeItem(`thebox_match_state_${matchId}`);
        localStorage.removeItem(`thebox_match_notes_${matchId}`);
        localStorage.removeItem(`thebox_pitch_state_${matchId}`);
        localStorage.setItem("thebox_matches_list", JSON.stringify(updatedList));
      }
      if (editingMatchId === matchId) {
        setEditingMatchId(null);
      }
      if (activeMatchId === matchId) {
        const nextForTeam = updatedList.find((m) => (m.teamId || "team_1") === activeTeamId);
        if (nextForTeam) {
          selectMatch(nextForTeam.id, updatedList);
        } else {
          clearActiveMatch();
        }
      }
      setSleekToastMessage("🗑️ Match supprimé avec succès.");
      setTimeout(() => setSleekToastMessage(null), 3000);
    }
  };

  const handleAddNewMatch = (assignedTeamId?: any) => {
    if (!isProOrAdmin) {
      setSleekToastMessage("🔒 La création de matchs est réservée aux abonnés PRO & PRO+.");
      setIsCheckoutOpen(true);
      return;
    }
    const targetTeamId = typeof assignedTeamId === "string" ? assignedTeamId : activeTeamId;
    const targetTeam = teams.find((t) => t.id === targetTeamId) || activeTeam;
    // Un match est toujours rattaché à une équipe : sans équipe, on propose d'abord d'en créer une
    if (!targetTeam) {
      setSleekToastMessage("⚽ Créez d'abord votre équipe pour pouvoir ajouter un match.");
      setTimeout(() => setSleekToastMessage(null), 3500);
      setIsMultiTeamModalOpen(true);
      return;
    }
    const newId = `match_${Date.now()}`;
    const newM = {
      id: newId,
      teamId: targetTeamId,
      homeTeam: targetTeam?.name || "MON EQUIPE",
      awayTeam: "ADVERSAIRE",
      competition: "CHAMPIONNAT",
      dateTime: "DIM. PROCHAIN • 15:00",
      isFinished: false,
      score: "",
      homeScore: 0,
      awayScore: 0,
      sport: activeSport
    };

    const updatedList = [newM, ...matchesList];
    setMatchesList(updatedList);
    setMatchSearchQuery("");
    setMatchTeamFilter("all");
    setEditingMatchId(newId);

    selectMatch(newId, updatedList);

    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_matches_list", JSON.stringify(updatedList));
    }

    setSleekToastMessage("✨ Nouveau match créé ! Vous pouvez éditer ses informations ci-dessous.");
    setTimeout(() => setSleekToastMessage(null), 3500);

    // Mode Live déporté : le QR du match est généré dès la création (PRO+)
    publishLiveForMatch(newM).catch((err) => console.warn("[Live] publication du match :", err?.message));
  };

  // Aucun match sélectionné : on garde le terrain tel quel, on vide les données propres à un match
  const clearActiveMatch = () => {
    setActiveMatchId("");
    setMatchEvents([]);
    setHomeScore(0);
    setAwayScore(0);
    setLiveTimerSeconds(0);
    setHalftimeSecondsLeft(HALFTIME_BREAK_SECONDS);
    setIsHalftimeRunning(false);
    setCurrentPeriod(firstLivePeriod);
    setIsLiveMatchMode(false);
    setIsLiveTimerRunning(false);
    setLiveActionToken(null);
    setTacticalNotes("");
    setSetPieceRoles(defaultSetPieceRoles);
    setOpponentSetPieceRoles(defaultSetPieceRoles);
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_active_match_id", "");
    }
  };

  const selectMatch = (matchId: string, customMatchesList?: any[]) =>
    selectMatchImpl({ activeSport, activeTeamId, applySchemaFormat, firstLivePeriod, getDefaultPlayersForSport, isProOrAdmin, matchesList, savedTactics, schemaBelongsToMatch, setActiveMatchId, setActiveSport, setActiveTeamId, setAwayScore, setCurrentFrameIdx, setCurrentPeriod, setDrawingActions, setHalftimeSecondsLeft, setHomeScore, setIsHalftimeRunning, setIsLiveMatchMode, setIsLiveTimerRunning, setKeyframes, setLiveActionToken, setLiveTimerSeconds, setMatchEvents, setOpponentSetPieceRoles, setOpponentSubstitutes, setSetPieceRoles, setSubstitutes, setTacticalNotes, teamRostersMap }, matchId, customMatchesList);

  const handleAutoAssignSetPieces = (targetTeam?: "home" | "away") => {
    const isAway = (targetTeam || rolesTargetTeam) === "away";
    const playersOnPitch = currentTokens.filter(t => isAway ? t.type === "player_b" : t.type === "player_a");
    if (playersOnPitch.length === 0) return;

    // Rôles propres au sport (buteur et ouvreur au rugby, meneur au basket, jet de 7 m au handball…)
    const assignedRoles = autoAssignSportRoles(activeSport, playersOnPitch);

    if (isAway) {
      setOpponentSetPieceRoles((prev) => ({ ...prev, ...assignedRoles }));
    } else {
      setSetPieceRoles((prev) => ({ ...prev, ...assignedRoles }));
    }
  };

  // Re-initialize pitch tokens when activeSport changes
  const prevSportRef = useRef(activeSport);
  useEffect(() => {
    if (prevSportRef.current !== activeSport) {
      prevSportRef.current = activeSport;
      const defaultTokens = getDefaultPlayersForSport(activeSport);
      setKeyframes([defaultTokens]);
      setCurrentFrameIdx(0);
      setDrawingActions([]);
    }
  }, [activeSport]);

  // Changement d'équipe : le format de l'équipe reprend la main sur celui d'un schéma chargé
  useEffect(() => {
    setSchemaFormatOverride(null);
  }, [activeTeamId]);

  // Changement de format (autre équipe, format modifié) : effectif de départ du nouveau format,
  // sauf si le terrain affiche déjà un effectif de la bonne taille (match ou schéma rechargé)
  const prevFormatRef = useRef(activeFormat);
  useEffect(() => {
    const prevFormat = prevFormatRef.current;
    prevFormatRef.current = activeFormat;
    if (prevFormat === activeFormat) return;
    const prevCount = getGameFormatOption(activeSport, prevFormat)?.players;
    const nextCount = getGameFormatOption(activeSport, activeFormat)?.players;
    if (!prevCount || !nextCount) return;
    setKeyframes((prev) => {
      const countA = (prev[0] || []).filter((t) => t.type === "player_a").length;
      if (countA === nextCount || countA !== prevCount) return prev;
      return [getDefaultPlayersForSport(activeSport, activeFormat)];
    });
    const formations = getAvailableFormationsForSport(activeSport, activeFormat);
    if (formations[0]) {
      setSelectedFormationA(formations[0]);
      setSelectedFormationB(formations[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFormat]);

  // L'étape affichée reste dans les bornes de l'animation (après une remise à zéro du terrain)
  useEffect(() => {
    if (currentFrameIdx > keyframes.length - 1) setCurrentFrameIdx(Math.max(0, keyframes.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyframes.length]);

  // Synchronize matches list and active match when activeTeamId changes
  useEffect(() => {
    const currentTeamMatches = matchesList.filter((m) => (m.teamId || "team_1") === activeTeamId);
    if (currentTeamMatches.length > 0) {
      const exists = currentTeamMatches.some((m) => m.id === activeMatchId);
      if (!exists) {
        selectMatch(currentTeamMatches[0].id);
      }
    } else if (activeMatchId) {
      // Aucun match pour cette équipe : aucun match actif (pas de création automatique)
      clearActiveMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeamId]);

  const handlePrevMatch = () => {
    const currentTeamMatches = matchesList.filter((m) => (m.teamId || "team_1") === activeTeamId);
    const idx = currentTeamMatches.findIndex((m) => m.id === activeMatchId);
    if (idx > 0) {
      selectMatch(currentTeamMatches[idx - 1].id);
    }
  };

  const handleNextMatch = () => {
    const currentTeamMatches = matchesList.filter((m) => (m.teamId || "team_1") === activeTeamId);
    const idx = currentTeamMatches.findIndex((m) => m.id === activeMatchId);
    if (idx >= 0 && idx < currentTeamMatches.length - 1) {
      selectMatch(currentTeamMatches[idx + 1].id);
    }
  };

  // Banc du match (remplaçants) : rechargé depuis le match actif, sinon Joueur 12 à 26
  const [substitutes, setSubstitutes] = useState<any[]>(() => readStoredBench("thebox_substitutes_") ?? makeDefaultSubstitutes(false));

  // Banc adverse du match : rechargé depuis le match actif, sinon Joueur 12 Adv à 26 Adv
  const [opponentSubstitutes, setOpponentSubstitutes] = useState<any[]>(() => readStoredBench("thebox_opp_substitutes_") ?? makeDefaultSubstitutes(true));

  // Persist substitutes per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      safeLocalStorageSetItem(`thebox_substitutes_${activeMatchId}`, JSON.stringify(substitutes));
    }
  }, [substitutes, activeMatchId]);

  // Persist opponent substitutes per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      safeLocalStorageSetItem(`thebox_opp_substitutes_${activeMatchId}`, JSON.stringify(opponentSubstitutes));
    }
  }, [opponentSubstitutes, activeMatchId]);

  // References
  const pitchWrapperRef = useRef<HTMLDivElement>(null);
  const pitchContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editPanelRef = useRef<HTMLDivElement>(null);
  const matchFinishedModalRef = useRef<HTMLDivElement>(null);

  // Fullscreen Pitch Handler
  const togglePitchFullscreen = async () => {
    const nextState = !isPitchFullscreen;
    setIsPitchFullscreen(nextState);
    setZoomScale(100);
    setPlayerScale(100);
    if (nextState) {
      setDrawColor("#3b82f6");
      setDrawSize(3); // Épaisseur moyenne par défaut en mode plein écran
    }

    try {
      if (nextState) {
        if (pitchWrapperRef.current && !document.fullscreenElement && pitchWrapperRef.current.requestFullscreen) {
          await pitchWrapperRef.current.requestFullscreen().catch(() => { });
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => { });
        }
      }
    } catch {
      // Graceful fallback: CSS fixed inset-0 overlay handles fullscreen without error
    }
  };

  useEffect(() => {
    // Réinitialiser automatiquement l'échelle et la position du terrain et des joueurs à 100% lors du changement de mode (plein écran ou normal, vue terrain, ratio, mode live)
    setZoomScale(100);
    setPitchPan({ x: 0, y: 0 });
    setPlayerScale(100);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isPitchFullscreen) {
        setIsPitchFullscreen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPitchFullscreen) {
        setIsPitchFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPitchFullscreen, isBoardFullscreen, terrainComplet, aspectRatioMode, isLiveMatchMode]);

  const currentTokens = keyframes[currentFrameIdx] || [];

  // Numéros du banc : les remplaçants générés (« Joueur 12 », « Joueur 12 Adv ») suivent directement
  // le dernier numéro des titulaires (foot à 8 : 9, 10… ; foot à 11 : 12, 13…).
  // Les remplaçants renommés par le coach gardent leur numéro.
  const starterNumbersKeyA = currentTokens.filter((t) => t.type === "player_a").map((t) => t.number || 0).join(",");
  const starterNumbersKeyB = currentTokens.filter((t) => t.type === "player_b").map((t) => t.number || 0).join(",");
  useEffect(() => {
    const renumber = (bench: any[], starterKey: string, isAway: boolean) => {
      const starterNums = starterKey ? starterKey.split(",").map(Number).filter((n) => n > 0) : [];
      // Remplaçant du banc par défaut (identifiant s1… / opp_s1…) dont le nom n'a pas été personnalisé
      const isGenerated = (s: any) =>
        new RegExp(isAway ? "^opp_s\\d+$" : "^s\\d+$").test(String(s.id || "")) &&
        new RegExp(isAway ? "^Joueur \\d+ Adv$" : "^Joueur \\d+$").test(s.name || "");
      const taken = new Set<number>([...starterNums, ...bench.filter((s) => !isGenerated(s)).map((s) => Number(s.number) || 0)]);
      let next = (starterNums.length ? Math.max(...starterNums) : 0) + 1;
      const renames: Record<string, string> = {};
      let changed = false;
      const updated = bench.map((s) => {
        if (!isGenerated(s)) return s;
        while (taken.has(next)) next++;
        const num = next++;
        const name = isAway ? `Joueur ${num} Adv` : `Joueur ${num}`;
        if (s.number === num && s.name === name) return s;
        changed = true;
        renames[s.name] = name;
        return { ...s, number: num, name };
      });
      return changed ? { updated, renames } : null;
    };
    const renameRoles = (roles: SetPieceRoleConfig, renames: Record<string, string>): SetPieceRoleConfig => {
      const out = { ...roles };
      (Object.keys(out) as (keyof SetPieceRoleConfig)[]).forEach((k) => { if (renames[out[k]]) out[k] = renames[out[k]]; });
      return out;
    };
    const home = renumber(substitutes, starterNumbersKeyA, false);
    if (home) {
      setSubstitutes(home.updated);
      setSetPieceRoles((prev) => renameRoles(prev, home.renames));
    }
    const away = renumber(opponentSubstitutes, starterNumbersKeyB, true);
    if (away) {
      setOpponentSubstitutes(away.updated);
      setOpponentSetPieceRoles((prev) => renameRoles(prev, away.renames));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterNumbersKeyA, starterNumbersKeyB, substitutes, opponentSubstitutes]);

  // Cache et nettoyage automatique systématique du fond des photos de joueurs (de base, sans bouton requis)
  const [autoTransparentCache, setAutoTransparentCache] = useState<Record<string, string>>({});

  useEffect(() => {
    currentTokens.forEach((token) => {
      const photo = token.photo;
      if (photo && !photo.startsWith("data:image/svg") && !autoTransparentCache[photo]) {
        autoRemoveBackgroundFromDataUrl(photo).then((cleaned) => {
          if (cleaned && cleaned !== photo) {
            setAutoTransparentCache((prev) => ({ ...prev, [photo]: cleaned }));
            setKeyframes((prevFrames) =>
              prevFrames.map((frame) =>
                frame.map((tok) => (tok.id === token.id ? { ...tok, photo: cleaned } : tok))
              )
            );
          }
        });
      }
    });
  }, [currentTokens, autoTransparentCache]);

  // Auto-scroll edit panel into view whenever a player token is selected
  useEffect(() => {
    const activeToken = editingToken || quickActionToken;
    if (activeToken && editPanelRef.current) {
      const timer = setTimeout(() => {
        editPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [editingToken, quickActionToken]);

  // Responsive sidebar collapsing and client-only setup
  useEffect(() => {
    // Sidebars are kept open as requested by the user
  }, []);

  // Handle Playback timeline
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setCurrentFrameIdx((prev) => {
          if (prev >= keyframes.length - 1) {
            return 0; // loop
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, keyframes.length, playbackSpeed]);

  /** Courbe dont les poignées sont affichées : courbe sélectionnée (outil Sélection) ou venant d'être tracée (outil Courbe) */
  const curveHandleIdx =
    (activeTool === "select" || activeTool === "curve") &&
    selectedStrokeIndex !== null &&
    drawingActions[selectedStrokeIndex] &&
    isCurveTool(drawingActions[selectedStrokeIndex].tool) &&
    drawingActions[selectedStrokeIndex].points.length >= 4
      ? selectedStrokeIndex
      : null;

  /** Déplace une poignée de courbe (départ, contrôles, arrivée) au doigt ou à la souris */
  const startCurveHandleDrag = (strokeIdx: number, pointIdx: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const container = pitchContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let moved = false;
    const moveHandler = (ev: MouseEvent | TouchEvent) => {
      const clientX = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
      const clientY = "touches" in ev ? ev.touches[0].clientY : ev.clientY;
      const rx = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const ry = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      const p = aspectRatioMode === "mobile" ? { x: 100 - ry, y: rx } : { x: rx, y: ry };
      if (!moved) {
        moved = true;
        setDrawingHistory((prev) => [...prev, drawingActions]);
      }
      setDrawingActions((prev) =>
        prev.map((a, i) => (i !== strokeIdx ? a : { ...a, points: a.points.map((pt, k) => (k === pointIdx ? p : pt)) }))
      );
    };
    const upHandler = () => {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);
      window.removeEventListener("touchmove", moveHandler);
      window.removeEventListener("touchend", upHandler);
    };
    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
    window.addEventListener("touchmove", moveHandler, { passive: true });
    window.addEventListener("touchend", upHandler);
  };

  const drawArrowhead = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const length = 12;

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - length * Math.cos(angle - Math.PI / 6), toY - length * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - length * Math.cos(angle + Math.PI / 6), toY - length * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const drawAllStrokes = () =>
    drawAllStrokesImpl({ activeTool, aspectRatioMode, brushPointsRef, canvasRef, currentActionPoints, curveHandleIdx, drawArrowhead, drawColor, drawingActions, drawingTool, drawSize, isDrawing, selectedStrokeIndex });

  // Render canvas drawings
  useEffect(() => {
    drawAllStrokes();
  }, [drawingActions, currentActionPoints, currentFrameIdx, selectedStrokeIndex, activeTool]);

  // Adjust canvas size to match layout bounding box
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawAllStrokes();
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (pitchContainerRef.current) {
      observer.observe(pitchContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [drawingActions, keyframes, currentFrameIdx]);

  // Free pan/drag of the pitch when zoomed or when using the "move" tool
  const handlePitchPanStart = (startEvent: React.MouseEvent | React.TouchEvent) => {
    const isMiddleMouse = "button" in startEvent && startEvent.button === 1;
    // Appui hors d'une liaison : elle est désélectionnée
    if (selectedLinkId) setSelectedLinkId(null);
    if (!isMiddleMouse && activeTool !== "select" && activeTool !== "move") return;
    if (!isMiddleMouse && zoomScale === 100 && activeTool !== "move") return;
    if ("button" in startEvent && startEvent.button !== 0 && startEvent.button !== 1) return;

    const startX = "touches" in startEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const startY = "touches" in startEvent ? startEvent.touches[0].clientY : startEvent.clientY;
    const originPanX = pitchPan.x;
    const originPanY = pitchPan.y;

    let panStarted = false;

    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;

      if (!panStarted && Math.hypot(dx, dy) > 2) {
        panStarted = true;
        setIsPanningPitch(true);
      }

      if (panStarted) {
        setPitchPan({
          x: Math.round(originPanX + dx),
          y: Math.round(originPanY + dy),
        });
      }
    };

    const upHandler = () => {
      setIsPanningPitch(false);
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);
      window.removeEventListener("touchmove", moveHandler);
      window.removeEventListener("touchend", upHandler);
    };

    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
    window.addEventListener("touchmove", moveHandler, { passive: true });
    window.addEventListener("touchend", upHandler);
  };

  // Drag and Drop relative calculation with Single Click Quick Action detection
  const handleTokenStartDrag = (tokenId: string, startEvent: React.MouseEvent | React.TouchEvent) =>
    handleTokenStartDragImpl({ activeTool, aspectRatioMode, currentFrameIdx, currentTokens, dragEndTimeRef, findWall, handleJoinWall, isDraggingTokenRef, isInWall, pitchContainerRef, playerScale, setBallMagnetTargetId, setKeyframes, setSelectedTokenId, setWallDropTarget, showBall, showOpponents, startCoordsRef, wallSlotAtPoint }, tokenId, startEvent);

  // Canvas drawings coordinates mapper
  const getRelativeMouseCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const xPercent = ((clientX - rect.left) / rect.width) * 100;
    const yPercent = ((clientY - rect.top) / rect.height) * 100;

    if (aspectRatioMode === "mobile") {
      return {
        x: 100 - yPercent,
        y: xPercent
      };
    }

    return { x: xPercent, y: yPercent };
  };

  // Find stroke under mouse/touch click
  const findStrokeIndexAtCoords = (coords: { x: number; y: number }, actions: DrawingAction[]): number | null =>
    findStrokeIndexAtCoordsImpl({  }, coords, actions);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getRelativeMouseCoords(e);

    // Outil « Lier » : toucher le terrain valide la chaîne de joueurs en cours
    if (activeTool === "link") {
      e.stopPropagation();
      if (linkDraft.length > 0) commitLink(linkDraft);
      return;
    }

    // Only in SELECT mode: detect clicks on strokes to show the stroke deletion menu
    if (activeTool === "select") {
      setSelectedLinkId(null);
      const hitIndex = findStrokeIndexAtCoords(coords, drawingActions);
      if (hitIndex !== null) {
        e.stopPropagation();
        setSelectedStrokeIndex(hitIndex);
        return;
      }
      setSelectedStrokeIndex(null);
      if (liveActionToken) {
        setLiveActionToken(null);
      }
      return;
    }

    // In other modes (move, line, arrow, draw), deselect any active stroke
    setSelectedStrokeIndex(null);

    if (activeTool === "move") {
      if (liveActionToken) {
        setLiveActionToken(null);
      }
      return;
    }

    e.stopPropagation();
    setIsDrawing(true);
    brushPointsRef.current = [coords];
    setCurrentActionPoints([coords]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getRelativeMouseCoords(e);

    if (drawingTool === "brush") {
      const pts = brushPointsRef.current;
      const prev = pts[pts.length - 1];
      pts.push(coords);
      // Segment dessiné tout de suite, sans re-rendu du tableau
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx && prev) {
        const toPx = (pt: { x: number; y: number }) =>
          aspectRatioMode === "mobile"
            ? { x: (pt.y / 100) * canvas.width, y: ((100 - pt.x) / 100) * canvas.height }
            : { x: (pt.x / 100) * canvas.width, y: (pt.y / 100) * canvas.height };
        const a = toPx(prev);
        const b = toPx(coords);
        ctx.save();
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      setCurrentActionPoints((prev) => [prev[0], coords]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    let finalPoints = drawingTool === "brush" ? brushPointsRef.current : currentActionPoints;
    brushPointsRef.current = [];
    const isCurve = isCurveTool(drawingTool);
    if (isCurve) {
      // Un simple clic ne crée pas de courbe
      const a = finalPoints[0];
      const b = finalPoints[finalPoints.length - 1];
      if (finalPoints.length < 2 || !a || !b || Math.hypot(b.x - a.x, b.y - a.y) < 1.5) finalPoints = [];
      else {
        // Points de contrôle calculés en pixels (arc régulier quel que soit le format du terrain), puis remis en %
        const canvas = canvasRef.current;
        const cw = canvas?.width || 100;
        const ch = canvas?.height || 100;
        const mobile = aspectRatioMode === "mobile";
        const toPx = (p: Pt) => (mobile ? { x: (p.y / 100) * cw, y: ((100 - p.x) / 100) * ch } : { x: (p.x / 100) * cw, y: (p.y / 100) * ch });
        const toPct = (p: Pt) => {
          const rx = Math.max(0, Math.min(100, (p.x / cw) * 100));
          const ry = Math.max(0, Math.min(100, (p.y / ch) * 100));
          return mobile ? { x: 100 - ry, y: rx } : { x: rx, y: ry };
        };
        const [, c1, c2] = curvePointsPx([toPx(a), toPx(b)]);
        finalPoints = [a, toPct(c1), toPct(c2), b];
      }
    }
    if (finalPoints.length > 0) {
      const newAction: DrawingAction = {
        tool: drawingTool,
        color: drawColor,
        size: drawSize,
        points: finalPoints,
      };

      setDrawingHistory((prev) => [...prev, drawingActions]);
      setDrawingActions((prev) => [...prev, newAction]);
    }
    setCurrentActionPoints([]);
    // La courbe tracée garde ses poignées pour être cintrée tout de suite
    setSelectedStrokeIndex(isCurve && finalPoints.length > 0 ? drawingActions.length : null);
  };

  // Pendant un tracé, le pointeur peut passer ou être relâché au-dessus d'un joueur (calque posé sur le canvas) :
  // on suit alors le mouvement et le relâchement au niveau de la fenêtre pour que le trait se termine bien.
  useEffect(() => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (ev.target === canvas) return; // déjà traité par le canvas
      handleCanvasMouseMove(ev as unknown as React.MouseEvent<HTMLCanvasElement>);
    };
    const onUp = (ev: MouseEvent | TouchEvent) => {
      if (ev.target === canvas) return;
      handleCanvasMouseUp();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  });

  // Formations Coordinates Presets for all sports
  const getFormationCoordinates = (sport: string, formationName: string, isOpponent: boolean): { x: number; y: number }[] =>
    getFormationCoordinatesImpl({ formatFor, getDefaultPlayersForSport }, sport, formationName, isOpponent);

  /**
   * Applique un schéma à une équipe : chaque joueur reprend la place de son POSTE dans le schéma (lib/formationAssign),
   * pas la place la plus proche de sa position actuelle. Les joueurs gardent toutes leurs informations
   * (photo, cartons, place dans le mur…). Place sans joueur : joueur par défaut ; joueur sans place : il reste où il est.
   */
  const applyFormationToTeam = (formName: string, isOpponent: boolean) => {
    const coords = getFormationCoordinates(activeSport, formName, isOpponent);
    if (coords.length === 0) return;
    const type: Token["type"] = isOpponent ? "player_b" : "player_a";
    // Places exprimées pour une équipe qui attaque vers la droite (l'adversaire est en miroir)
    const slots = coords.map((c) => ({ x: isOpponent ? 100 - c.x : c.x, y: c.y }));

    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      const teamPlayers = activeFrame.filter((t) => t.type === type);
      const others = activeFrame.filter((t) => t.type !== type && (isOpponent || t.type !== "ball"));
      const defaultTokens = getDefaultPlayersForSport(activeSport).filter((t) => t.type === type);
      const slotToPlayer = assignPlayersToFormation(teamPlayers, slots, activeSport);
      const placed = new Set(slotToPlayer.filter((i) => i >= 0));

      const newTeam: Token[] = coords.map((c, idx) => {
        const pi = slotToPlayer[idx];
        if (pi >= 0) return { ...teamPlayers[pi], x: c.x, y: c.y };
        const defaultP = defaultTokens[idx] || {
          name: isOpponent ? `Joueur ${idx + 1} Adv` : `Joueur ${idx + 1}`,
          role: isOpponent ? "ADV" : "J",
          number: idx + 1,
        };
        return {
          id: `${type}_${idx}_${Date.now().toString(36)}`,
          type,
          name: defaultP.name,
          role: defaultP.role,
          number: defaultP.number,
          x: c.x,
          y: c.y,
        };
      });
      // Joueurs en trop (plus de joueurs que de places) : gardés là où ils sont
      const extras = teamPlayers.filter((_, i) => !placed.has(i));

      if (isOpponent) {
        copy[currentFrameIdx] = [...others, ...newTeam, ...extras];
      } else {
        const ballToken = activeFrame.find((t) => t.type === "ball") || {
          id: "ball",
          type: "ball" as const,
          name: "Ballon",
          role: "Equipement",
          x: 50,
          y: 50,
        };
        copy[currentFrameIdx] = [...newTeam, ...extras, ballToken, ...others];
      }
      return copy;
    });
  };

  const applyTeamAFormation = (formName: string) => {
    setSelectedFormationA(formName);
    applyFormationToTeam(formName, false);
  };

  const applyTeamBFormation = (formName: string) => {
    setSelectedFormationB(formName);
    applyFormationToTeam(formName, true);
    setShowOpponents(true);
  };

  const clearTeamAPlayers = () => {
    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      copy[currentFrameIdx] = activeFrame.filter(t => t.type !== "player_a");
      return copy;
    });
  };

  const clearTeamBPlayers = () => {
    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      copy[currentFrameIdx] = activeFrame.filter(t => t.type !== "player_b");
      return copy;
    });
  };

  // « Dans leur camp » : le schéma de jeu est réparti sur toute la moitié de terrain de l'équipe
  // (profondeur ramenée entre le but et la ligne médiane, largeur conservée), sans joueurs superposés.
  // Coordonnées renvoyées pour l'équipe qui défend le but de gauche (miroir à faire pour l'adversaire).
  const spreadFormationInOwnHalf = (coords: { x: number; y: number }[]): { x: number; y: number }[] => {
    if (coords.length === 0) return coords;
    const HALF_MIN = 7;   // près de la ligne de but
    const HALF_MAX = 44;  // avant la ligne médiane (rond central dégagé)
    const xs = coords.map((c) => c.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const span = maxX - minX;
    const placed = coords.map((c) => ({
      x: span < 1 ? (HALF_MIN + HALF_MAX) / 2 : HALF_MIN + ((c.x - minX) / span) * (HALF_MAX - HALF_MIN),
      y: Math.min(92, Math.max(8, c.y)),
    }));
    // Écarte les joueurs qui se chevaucheraient encore
    for (let i = 0; i < placed.length; i++) {
      for (let guard = 0; guard < 12; guard++) {
        const clash = placed.slice(0, i).some((o) => Math.abs(o.x - placed[i].x) < 4 && Math.abs(o.y - placed[i].y) < 7);
        if (!clash) break;
        placed[i] = { x: placed[i].x, y: placed[i].y <= 50 ? Math.max(8, placed[i].y - 8) : Math.min(92, placed[i].y + 8) };
        if (guard % 2 === 1) placed[i] = { x: Math.min(HALF_MAX, placed[i].x + 4), y: placed[i].y };
      }
    }
    return placed.map((c) => ({ x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10 }));
  };

  const regroupTeamAInCamp = () => {
    const availableFormations = getAvailableFormationsForSport(activeSport);
    const formA = availableFormations.includes(selectedFormationA)
      ? selectedFormationA
      : availableFormations[0] || "4-3-3";

    const coordsA = spreadFormationInOwnHalf(getFormationCoordinates(activeSport, formA, false));

    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];

      const existingTeamA = activeFrame.filter(t => t.type === "player_a");
      const nonTeamA = activeFrame.filter(t => t.type !== "player_a");

      const defaultTokensA = getDefaultPlayersForSport(activeSport).filter(t => t.type === "player_a");
      const teamAToPlace = existingTeamA.length > 0 ? existingTeamA : defaultTokensA;

      const updatedTeamA: Token[] = coordsA.map((c, idx) => {
        const existingP = teamAToPlace[idx];
        const defaultP = defaultTokensA[idx] || { name: `Joueur ${idx + 1}`, role: "J", number: idx + 1 };
        return {
          id: existingP ? existingP.id : `player_a_${idx}`,
          type: "player_a",
          name: existingP ? existingP.name : defaultP.name,
          role: existingP ? existingP.role : defaultP.role,
          number: existingP ? existingP.number : defaultP.number,
          x: c.x,
          y: c.y,
          status: existingP ? existingP.status : undefined
        };
      });

      copy[currentFrameIdx] = [...nonTeamA, ...updatedTeamA];
      return copy;
    });
  };

  const regroupTeamBInCamp = () => {
    const availableFormations = getAvailableFormationsForSport(activeSport);
    const formB = availableFormations.includes(selectedFormationB)
      ? selectedFormationB
      : availableFormations[0] || "4-3-3";

    // Même répartition que l'équipe A, en miroir dans l'autre moitié de terrain
    const coordsB = spreadFormationInOwnHalf(getFormationCoordinates(activeSport, formB, false)).map((c) => ({ x: 100 - c.x, y: c.y }));

    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];

      const existingTeamB = activeFrame.filter(t => t.type === "player_b");
      const nonTeamB = activeFrame.filter(t => t.type !== "player_b");

      const defaultTokensB = getDefaultPlayersForSport(activeSport).filter(t => t.type === "player_b");
      const teamBToPlace = existingTeamB.length > 0 ? existingTeamB : defaultTokensB;

      const updatedTeamB: Token[] = coordsB.map((c, idx) => {
        const existingP = teamBToPlace[idx];
        const defaultP = defaultTokensB[idx] || { name: `Joueur ${idx + 1} Adv`, role: "ADV", number: idx + 1 };
        return {
          id: existingP ? existingP.id : `player_b_${idx}`,
          type: "player_b",
          name: existingP ? existingP.name : defaultP.name,
          role: existingP ? existingP.role : defaultP.role,
          number: existingP ? existingP.number : defaultP.number,
          x: c.x,
          y: c.y
        };
      });

      copy[currentFrameIdx] = [...nonTeamB, ...updatedTeamB];
      return copy;
    });
    setShowOpponents(true);
  };

  const regroupPlayersInCamps = () => {
    regroupTeamAInCamp();
    regroupTeamBInCamp();
    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      const updated = activeFrame.map((token) => token.type === "ball" ? { ...detachBall(token), x: 50, y: 50 } : token);
      copy[currentFrameIdx] = updated;
      return copy;
    });
  };

  // Remove a player from the pitch and place them into substitutes list with status/reason
  const handleRemovePlayerFromPitch = (tokenToRemove: Token, reason: "normal" | "injured" | "red_card") =>
    handleRemovePlayerFromPitchImpl({ currentFrameIdx, eventPeriodLabel, isLiveMatchMode, liveTimerSeconds, setEditingToken, setKeyframes, setMatchEvents, setOpponentSubstitutes, setQuickActionToken, setSubPickerToken, setSubstitutes }, tokenToRemove, reason);

  // Toggle player injury status (e.g. mark as cured / no longer injured)
  const handleTogglePlayerInjury = (targetToken: Token | any, markInjured: boolean) => {
    const targetStatus: "injured" | "normal" = markInjured ? "injured" : "normal";
    const targetReason = markInjured ? "injured" : "normal";

    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      copy[currentFrameIdx] = activeFrame.map((t) =>
        t.id === targetToken.id || (t.name && targetToken.name && t.name.toLowerCase() === targetToken.name.toLowerCase())
          ? { ...t, status: targetStatus, removalReason: targetReason }
          : t
      );
      return copy;
    });

    setSubstitutes((prev) =>
      prev.map((s) =>
        s.id === targetToken.id || (s.name && targetToken.name && s.name.toLowerCase() === targetToken.name.toLowerCase())
          ? { ...s, status: targetStatus, removalReason: targetReason }
          : s
      )
    );

    setOpponentSubstitutes((prev) =>
      prev.map((s) =>
        s.id === targetToken.id || (s.name && targetToken.name && s.name.toLowerCase() === targetToken.name.toLowerCase())
          ? { ...s, status: targetStatus, removalReason: targetReason }
          : s
      )
    );
  };

  // Swap a player on pitch with an incoming substitute
  // opts : remplacement saisi à la télécommande (identifiant d'événement imposé, ou aucun événement pour une annulation)
  const handleSwapPlayerOnPitch = (originalToken: Token, newSub: any, opts?: { eventId?: string; noEvent?: boolean; remote?: boolean }) =>
    handleSwapPlayerOnPitchImpl({ currentFrameIdx, eventPeriodLabel, isLiveMatchMode, liveTimerSeconds, setKeyframes, setMatchEvents, setOpponentSubstitutes, setQuickActionToken, setSubPickerToken, setSubstitutes }, originalToken, newSub, opts);

  // ================= MODE LIVE DÉPORTÉ =================
  // QR du match (public), télécommande adjoint (privée) et page du club (QR général).
  // Le tableau tactique est l'hôte : il applique les actions de la télécommande puis publie l'état du match.
  const [liveClubSlug, setLiveClubSlug] = useState<string | null>(null);
  const [isLiveShareOpen, setIsLiveShareOpen] = useState(false);
  // Convocation du match (envoyée au module Convocations) : joueurs du groupe du match
  const [isMatchConvocationOpen, setIsMatchConvocationOpen] = useState(false);
  const router = useRouter();
  const [liveEditorAccess, setLiveEditorAccess] = useState<EditorAccess | null>(null);
  const [liveShareBusy, setLiveShareBusy] = useState(false);
  const [liveShareError, setLiveShareError] = useState<string | null>(null);
  const liveClubName = (activeCoach?.club || "").trim() || activeTeam?.name || "Mon club";
  const canUseRemoteLive = isProPlusOrAdmin && Boolean(auth.currentUser);
  const hasAnyLiveMatch = matchesList.some((m) => m.livePublicId);
  const activeLivePublicId: string | null = hasActiveMatch && activeMatch.livePublicId ? activeMatch.livePublicId : null;

  const liveMetaFor = (m: any): LiveMatchMeta => {
    const team = teams.find((t) => t.id === (m.teamId || "team_1"));
    const sport = m.sport || activeSport;
    const cfg = getLivePeriodConfig(sport, team?.format);
    return {
      teamId: m.teamId || "team_1",
      teamName: team?.name || "",
      home: m.homeTeam || "",
      away: m.awayTeam || "",
      competition: m.competition || "",
      date: m.date || "",
      time: m.time || "",
      dateTime: m.dateTime || "",
      // Mot du coach : affiché dans le résumé public une fois le match terminé
      coachNote: String(m.coachNote || "").trim().slice(0, COACH_NOTE_MAX),
      sport,
      periods: cfg.periods,
      periodSeconds: cfg.periodSeconds,
      breakAfterIndex: cfg.breakAfterIndex,
    };
  };

  const liveRunning = isLiveMatchMode && isLiveTimerRunning && currentPeriod !== "MI-TEMPS" && currentPeriod !== "FIN";
  // Composition publiée dans le suivi live : les titulaires à leur place sur le tableau du coach.
  // Les positions viennent de la 1re image (la mise en place), pour ne pas suivre une animation en cours de lecture.
  const liveLineupFrame = keyframes[0];
  const liveLineup = useMemo(() => ({
    onPitch: currentTokens
      .filter((t) => t.type === "player_a")
      .map((t) => {
        const placed = liveLineupFrame?.find((p) => p.id === t.id) || t;
        const isGk = isGoalkeeperRole(t.role) || (activeSport !== "basketball" && activeSport !== "rugby" && t.number === 1);
        return {
          id: t.id,
          n: t.number,
          name: t.name || "",
          x: Math.round(placed.x * 10) / 10,
          y: Math.round(placed.y * 10) / 10,
          ...(isGk ? { gk: true } : {}),
        };
      }),
    bench: substitutes
      .filter((s) => s.type !== "player_b" && s.removalReason !== "red_card")
      .map((s) => ({ id: String(s.id), n: s.number, name: s.name || "" })),
  }), [currentTokens, substitutes, liveLineupFrame, activeSport]);
  const liveClock = liveRunning
    ? { elapsed: 0, runningSince: Date.now() - liveTimerSeconds * 1000 }
    : { elapsed: liveTimerSeconds, runningSince: null };
  const liveState: LiveState = {
    status: statusFor(currentPeriod, liveClock, Boolean(activeMatch.isFinished)),
    period: activeMatch.isFinished ? "FIN" : currentPeriod,
    score: { home: homeScore, away: awayScore },
    clock: liveClock,
    events: matchEvents as LiveEvent[],
    lineup: liveLineup,
    finishedAt: activeMatch.isFinished ? activeMatch.finishedAtMs || null : null,
  };

  const notifyRemote = (text: string) => {
    setSleekToastMessage(`📱 Télécommande : ${text}`);
    setTimeout(() => setSleekToastMessage(null), 3500);
  };

  // Action saisie à la télécommande → état local du tableau (puis republication)
  const applyRemoteLiveCommand = (cmdId: string, cmd: LiveCommand) =>
    applyRemoteLiveCommandImpl({ activeMatch, breakLongLabel, currentFrameIdx, currentPeriod, currentTokens, handleDeleteMatchEvent, handleFinishLiveMatch, handleSelectLivePeriod, handleSwapPlayerOnPitch, liveMetaFor, livePeriodButtons, livePeriodConfig, liveState, liveTimerSeconds, matchEvents, notifyRemote, setAwayScore, setHomeScore, setIsLiveMatchMode, setIsLiveTimerRunning, setKeyframes, setMatchEvents, substitutes }, cmdId, cmd);

  useLiveHost({
    publicId: activeLivePublicId,
    clubSlug: liveClubSlug,
    enabled: canUseRemoteLive && Boolean(activeLivePublicId),
    state: liveState,
    onCommand: applyRemoteLiveCommand,
  });

  // Page du club (QR général) : créée ou mise à jour avec le nom et le logo du club
  useEffect(() => {
    if (!canUseRemoteLive || (!hasAnyLiveMatch && !isLiveShareOpen)) return;
    let alive = true;
    const timer = setTimeout(() => {
      ensureLiveClub(liveClubName, clubLogo)
        .then((slug) => { if (alive && slug) setLiveClubSlug(slug); })
        .catch((err) => console.warn("[Live] club :", err?.message));
    }, 800);
    return () => { alive = false; clearTimeout(timer); };
  }, [canUseRemoteLive, hasAnyLiveMatch, isLiveShareOpen, liveClubName, clubLogo]);

  // Infos des matchs publiés (adversaire, date, compétition…) tenues à jour
  const liveMetaSentRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!canUseRemoteLive || !liveClubSlug) return;
    const timer = setTimeout(() => {
      matchesList.forEach((m) => {
        if (!m.livePublicId) return;
        const meta = liveMetaFor(m);
        const key = JSON.stringify(meta) + liveClubSlug + liveClubName;
        if (liveMetaSentRef.current[m.livePublicId] === key) return;
        liveMetaSentRef.current[m.livePublicId] = key;
        updateLiveMatchMeta(m.livePublicId, meta, liveClubSlug, liveClubName).catch((err) => {
          delete liveMetaSentRef.current[m.livePublicId];
          console.warn("[Live] infos du match :", err?.message);
        });
      });
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchesList, teams, liveClubSlug, canUseRemoteLive, liveClubName, activeSport]);

  /** Publie le live d'un match (QR du match + accès adjoint) ; renvoie son identifiant public */
  const publishLiveForMatch = async (m: any): Promise<string | null> => {
    if (!canUseRemoteLive || !m?.id) return null;
    if (m.livePublicId) return m.livePublicId;
    const slug = liveClubSlug || (await ensureLiveClub(liveClubName, clubLogo));
    if (!slug) return null;
    setLiveClubSlug(slug);
    const meta = liveMetaFor(m);
    const initial: LiveState = m.id === activeMatchId
      ? liveState
      : {
        status: m.isFinished ? "finished" : "scheduled",
        period: m.isFinished ? "FIN" : meta.periods[0],
        score: { home: m.homeScore || 0, away: m.awayScore || 0 },
        clock: { elapsed: 0, runningSince: null },
        events: Array.isArray(m.events) ? m.events : [],
        lineup: { onPitch: [], bench: [] },
      };
    const publicId = await createLiveMatch(meta, slug, liveClubName, initial);
    if (publicId) {
      liveMetaSentRef.current[publicId] = JSON.stringify(meta) + slug + liveClubName;
      updateMatchById(m.id, "livePublicId", publicId);
    }
    return publicId;
  };

  /** Convocation du match actif : réservée aux formules PRO, un match doit être sélectionné */
  const openMatchConvocation = () => {
    if (!isProOrAdmin) {
      setSleekToastMessage("🔒 Les convocations sont réservées aux formules PRO & PRO+.");
      setTimeout(() => setSleekToastMessage(null), 3500);
      setIsCheckoutOpen(true);
      return;
    }
    if (!activeMatch.id) {
      setSleekToastMessage("⚽ Créez d'abord le match pour convoquer vos joueurs.");
      setTimeout(() => setSleekToastMessage(null), 3500);
      return;
    }
    setIsMatchConvocationOpen(true);
  };

  /** Groupe du match : joueurs proposés à la convocation, reliés à leur fiche d'effectif */
  const matchConvocationGroup = () => {
    // Pion sans lien vers sa fiche (groupe par défaut) : fiche retrouvée par le nom, sinon par le numéro,
    // pour que le joueur garde le même identifiant que dans le module Convocations
    const roster = teamRostersMap[activeMatch.teamId || activeTeamId] || [];
    const used = new Set<string>();
    const resolve = (rosterId: string | undefined, fallbackId: string, name: string, number?: number) => {
      if (rosterId) { used.add(rosterId); return rosterId; }
      const key = name.trim().toLowerCase();
      const found =
        roster.find((r) => !used.has(r.id) && r.name.trim().toLowerCase() === key) ||
        (typeof number === "number" ? roster.find((r) => !used.has(r.id) && r.number === number) : undefined);
      if (found) { used.add(found.id); return found.id; }
      return fallbackId;
    };
    // Les fiches déjà reliées sont réservées avant de chercher les autres
    substitutes.forEach((p: any) => { if (p?.rosterId) used.add(String(p.rosterId)); });
    currentTokens.forEach((t) => { if (t.type === "player_a" && t.rosterId) used.add(t.rosterId); });
    return [
      ...currentTokens
        .filter((t) => t.type === "player_a" && t.name)
        .map((t) => ({ id: resolve(t.rosterId, t.id, t.name, t.number), name: t.name, number: t.number, status: t.status })),
      ...substitutes
        .filter((p: any) => p && p.name)
        .map((p: any) => ({ id: resolve(p.rosterId ? String(p.rosterId) : undefined, String(p.id), String(p.name), typeof p.number === "number" ? p.number : undefined), name: String(p.name), number: typeof p.number === "number" ? p.number : undefined, status: p.status })),
    ];
  };

  const openLiveShare = async () => {
    if (!isProPlusOrAdmin) {
      setIsLiveMatchUpgradeModalOpen(true);
      return;
    }
    if (!auth.currentUser) {
      setSleekToastMessage("🔒 Connectez-vous à votre compte pour partager le live.");
      setTimeout(() => setSleekToastMessage(null), 3500);
      return;
    }
    setLiveShareError(null);
    setLiveEditorAccess(null);
    setIsLiveShareOpen(true);
    if (activeLivePublicId) {
      try {
        setLiveEditorAccess(await getEditorAccess(activeLivePublicId));
      } catch (err: any) {
        setLiveShareError(`Accès adjoint indisponible : ${err?.message || err}`);
      }
    }
  };

  const runLiveShareAction = async (action: () => Promise<void>) => {
    setLiveShareBusy(true);
    setLiveShareError(null);
    try {
      await action();
    } catch (err: any) {
      setLiveShareError(`Opération impossible : ${err?.message || err}`);
    } finally {
      setLiveShareBusy(false);
    }
  };

  const handlePublishActiveLive = () => runLiveShareAction(async () => {
    const id = await publishLiveForMatch(activeMatch);
    if (id) setLiveEditorAccess(await getEditorAccess(id));
  });

  const handleRegenerateLiveEditor = () => runLiveShareAction(async () => {
    if (!activeLivePublicId) return;
    setLiveEditorAccess(await regenerateEditorAccess(activeLivePublicId));
  });

  const handleRevokeLiveEditor = () => runLiveShareAction(async () => {
    if (!activeLivePublicId) return;
    await revokeEditorAccess(activeLivePublicId);
    setLiveEditorAccess((prev) => (prev ? { ...prev, revoked: true } : prev));
  });

  // Common positions per sport for rapid suggestions
  const getSportCommonPositions = (sport: string): string[] => {
    switch (sport) {
      case "basketball":
        return ["PG", "SG", "SF", "PF", "C", "SUB"];
      case "rugby":
        return ["PIL", "TAL", "2L", "3L", "N8", "DM", "OUV", "CEN", "AIL", "ARR", "SUB"];
      case "handball":
        return ["GB", "PV", "DC", "ARG", "ARD", "ALG", "ALD", "SUB"];
      case "football":
      default:
        return ["GB", "DC", "DD", "DG", "MDC", "MC", "MD", "MG", "MOC", "AiD", "AiG", "BU", "AC", "SUB"];
    }
  };

  /** Modifie une fiche de l'effectif d'équipe (identifiants uniques : on la cherche dans toutes les équipes). */
  const updateRosterPlayer = (rosterId: string | undefined, patch: Partial<TeamRosterPlayer>) => {
    if (!rosterId) return;
    setTeamRostersMap((prev) => {
      let changed = false;
      const next: Record<string, TeamRosterPlayer[]> = {};
      Object.entries(prev).forEach(([teamId, roster]) => {
        next[teamId] = roster.map((p) => {
          if (p.id !== rosterId) return p;
          changed = true;
          return { ...p, ...patch };
        });
      });
      return changed ? next : prev;
    });
  };

  /** Une modification faite dans le groupe du match est reportée sur la fiche de l'effectif. */
  const syncRosterField = (rosterId: string | undefined, field: "name" | "number" | "role" | "status" | "photo", value: any) => {
    if (!rosterId) return;
    if (field === "status") updateRosterPlayer(rosterId, { status: toRosterStatus(value) });
    else if (field === "name" && !(typeof value === "string" && value.trim())) return;
    else updateRosterPlayer(rosterId, { [field]: value } as Partial<TeamRosterPlayer>);
  };

  // Squad / Roster editing handlers in the Roles & Team Modal
  const handleUpdatePitchPlayer = (tokenId: string, field: "name" | "number" | "role" | "status" | "photo", value: any) => {
    const oldPlayer = currentTokens.find((t) => t.id === tokenId);
    const oldName = oldPlayer?.name;
    const isOpponent = oldPlayer?.type === "player_b";
    if (!isOpponent) syncRosterField(oldPlayer?.rosterId, field, value);

    setKeyframes((prev) =>
      prev.map((frame) =>
        frame.map((t) => {
          if (t.id === tokenId) {
            return { ...t, [field]: value };
          }
          return t;
        })
      )
    );

    if (field === "name" && oldName && typeof value === "string" && value.trim()) {
      if (isOpponent) {
        setOpponentSetPieceRoles((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as (keyof SetPieceRoleConfig)[]).forEach((key) => {
            if (updated[key] === oldName) {
              updated[key] = value;
            }
          });
          return updated;
        });
      } else {
        setSetPieceRoles((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as (keyof SetPieceRoleConfig)[]).forEach((key) => {
            if (updated[key] === oldName) {
              updated[key] = value;
            }
          });
          return updated;
        });
      }
    }
  };

  const handleUpdateSubstitute = (subId: string, field: "name" | "number" | "role" | "status" | "photo", value: any) => {
    const isOppSub = opponentSubstitutes.some((s) => s.id === subId);

    if (isOppSub) {
      const oldSub = opponentSubstitutes.find((s) => s.id === subId);
      const oldName = oldSub?.name;

      setOpponentSubstitutes((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, [field]: value } : s))
      );

      if (field === "name" && oldName && typeof value === "string" && value.trim()) {
        setOpponentSetPieceRoles((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as (keyof SetPieceRoleConfig)[]).forEach((key) => {
            if (updated[key] === oldName) {
              updated[key] = value;
            }
          });
          return updated;
        });
      }
    } else {
      const oldSub = substitutes.find((s) => s.id === subId);
      const oldName = oldSub?.name;
      syncRosterField(oldSub?.rosterId, field, value);

      setSubstitutes((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, [field]: value } : s))
      );

      if (field === "name" && oldName && typeof value === "string" && value.trim()) {
        setSetPieceRoles((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as (keyof SetPieceRoleConfig)[]).forEach((key) => {
            if (updated[key] === oldName) {
              updated[key] = value;
            }
          });
          return updated;
        });
      }
    }
  };

  // Helper to get available unique numbers (1-99) for a player (excluding taken numbers by other players in the squad)
  const getAvailableNumbersForPlayer = (playerId: string, currentNum?: number, targetTeam?: "home" | "away") => {
    const isAway = (targetTeam || rolesTargetTeam) === "away";
    const starters = currentTokens.filter((t) => isAway ? t.type === "player_b" : t.type === "player_a");
    const bench = isAway ? opponentSubstitutes : substitutes;

    const taken = new Set<number>();
    starters.forEach((p) => {
      if (p.id !== playerId && typeof p.number === "number" && !isNaN(p.number)) {
        taken.add(p.number);
      }
    });
    bench.forEach((s) => {
      if (s.id !== playerId && typeof s.number === "number" && !isNaN(s.number)) {
        taken.add(s.number);
      }
    });

    const available: number[] = [];
    for (let i = 1; i <= 99; i++) {
      if (!taken.has(i) || i === currentNum) {
        available.push(i);
      }
    }
    return available;
  };

  const getAvailableNumbersForOpponent = (tokenId: string, currentNum?: number) => {
    return getAvailableNumbersForPlayer(tokenId, currentNum, "away");
  };

  // Sanitize all squad player numbers (starters + substitutes) to guarantee 100% uniqueness
  const sanitizeSquadNumbers = (targetTeam: "home" | "away") =>
    sanitizeSquadNumbersImpl({ currentTokens, opponentSubstitutes, setKeyframes, setOpponentSubstitutes, setSubstitutes, substitutes }, targetTeam);

  // Automatically sanitize squad numbers on modal open
  useEffect(() => {
    if (isSetPiecesOpen) {
      sanitizeSquadNumbers("home");
      sanitizeSquadNumbers("away");
    }
  }, [isSetPiecesOpen]);

  // Assign Unique Number to a player without duplicates (atomic swap if conflict)
  const handleAssignUniqueNumber = (targetId: string, isStarter: boolean, rawValue: string | number, targetTeam?: "home" | "away") =>
    handleAssignUniqueNumberImpl({ currentTokens, handleUpdatePitchPlayer, handleUpdateSubstitute, opponentSubstitutes, rolesTargetTeam, substitutes }, targetId, isStarter, rawValue, targetTeam);

  // Re-number entire team uniquely 1 to N
  const handleAutoRenumberSquad = (targetTeam?: "home" | "away") => {
    const isAway = (targetTeam || rolesTargetTeam) === "away";
    const starters = currentTokens.filter((t) => isAway ? t.type === "player_b" : t.type === "player_a");
    let seq = 1;
    const starterMap: Record<string, number> = {};
    starters.forEach((p) => {
      starterMap[p.id] = seq++;
    });

    setKeyframes((prev) =>
      prev.map((frame) =>
        frame.map((t) => (starterMap[t.id] !== undefined ? { ...t, number: starterMap[t.id] } : t))
      )
    );

    if (isAway) {
      setOpponentSubstitutes((prev) =>
        prev.map((s) => ({
          ...s,
          number: seq++,
        }))
      );
    } else {
      setSubstitutes((prev) =>
        prev.map((s) => ({
          ...s,
          number: seq++,
        }))
      );
    }
  };

  // Switch player status between Starter (pitch) and Substitute (bench)
  const handleToggleStarterSubstitute = (targetId: string, currentStatus: "starter" | "substitute", targetTeam?: "home" | "away") =>
    handleToggleStarterSubstituteImpl({ currentFrameIdx, currentTokens, opponentSubstitutes, rolesTargetTeam, setKeyframes, setOpponentSubstitutes, setSubstitutes, substitutes }, targetId, currentStatus, targetTeam);

  // Upload custom player photo
  const handlePlayerPhotoUpload = async (playerId: string, isStarter: boolean, file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).");
      return;
    }
    try {
      const compressedBase64 = await compressImage(file, 160, 160, 0.75);
      if (compressedBase64) {
        if (isStarter) {
          handleUpdatePitchPlayer(playerId, "photo", compressedBase64);
        } else {
          handleUpdateSubstitute(playerId, "photo", compressedBase64);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la compression de la photo:", err);
    }
  };

  const handleRemovePlayerPhoto = (playerId: string, isStarter: boolean) => {
    if (isStarter) {
      handleUpdatePitchPlayer(playerId, "photo", undefined);
    } else {
      handleUpdateSubstitute(playerId, "photo", undefined);
    }
  };

  const handleAddNewSubstitute = (targetTeam?: "home" | "away") =>
    handleAddNewSubstituteImpl({ activeSport, activeTeamId, currentTokens, isProOrAdmin, opponentSubstitutes, rolesTargetTeam, setOpponentSubstitutes, setSubstitutes, setTeamRostersMap, substitutes, teamRostersMap }, targetTeam);

  // ---------- Groupe du match ↔ effectif de l'équipe (titulaires, remplaçants, réserve) ----------

  /** Retire le joueur de ses rôles de coups de pied arrêtés (mon équipe). */
  const clearHomeRolesFor = (name?: string) => {
    if (!name) return;
    setSetPieceRoles((prev) => {
      const updated = { ...prev };
      (Object.keys(updated) as (keyof SetPieceRoleConfig)[]).forEach((key) => {
        if (updated[key] === name) updated[key] = "";
      });
      return updated;
    });
  };

  /** Sort un joueur du groupe du match : sa fiche reste dans l'effectif, en réserve. */
  const handleMoveToReserve = (playerId: string, isStarter: boolean) => {
    const player = isStarter ? currentTokens.find((t) => t.id === playerId) : substitutes.find((s) => s.id === playerId);
    if (!player) return;
    if (isStarter) {
      setKeyframes((prev) => prev.map((frame) => frame.filter((t) => t.id !== playerId)));
    } else {
      setSubstitutes((prev) => prev.filter((s) => s.id !== playerId));
    }
    clearHomeRolesFor(player.name);
  };

  /** Fait entrer un joueur de la réserve sur le banc du match (numéro libre si le sien est déjà pris). */
  const handleReserveToBench = (rosterId: string) => {
    const player = (teamRostersMap[activeTeamId] || []).find((p) => p.id === rosterId);
    if (!player) return;
    const taken = new Set<number>();
    currentTokens.forEach((t) => { if (t.type === "player_a" && typeof t.number === "number") taken.add(t.number); });
    substitutes.forEach((s) => { if (typeof s.number === "number") taken.add(s.number); });
    let number = player.number;
    if (taken.has(number)) {
      number = 1;
      while (taken.has(number)) number++;
    }
    setSubstitutes((prev) => [...prev, { ...rosterPlayerToSub(player), number }]);
    if (player.status === "reserve") updateRosterPlayer(rosterId, { status: "normal" });
  };

  /** Supprime définitivement une fiche de l'effectif de l'équipe (depuis la réserve). */
  const handleDeleteRosterPlayer = async (rosterId: string) => {
    const player = (teamRostersMap[activeTeamId] || []).find((p) => p.id === rosterId);
    if (!player) return;
    const ok = await confirmAction({
      title: "Retirer ce joueur de l'équipe ?",
      subject: player.name,
      message: "Sa fiche sera supprimée de l'effectif de l'équipe. Les matchs déjà préparés ne sont pas modifiés.",
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    setTeamRostersMap((prev) => ({ ...prev, [activeTeamId]: (prev[activeTeamId] || []).filter((p) => p.id !== rosterId) }));
  };

  /** Remplace le groupe du match (terrain + banc) par l'effectif de l'équipe, positions conservées. */
  const applyTeamRosterToGroup = () => {
    const roster = teamRostersMap[activeTeamId] || [];
    if (roster.length === 0) return;
    const { identity, bench } = buildMatchGroupFromRoster(currentTokens, roster);
    setKeyframes((prev) => prev.map((frame) => applyRosterIdentity(frame, identity)));
    setSubstitutes(bench);
    setSetPieceRoles(defaultSetPieceRoles);
  };

  const handleApplyTeamRosterToGroup = async () => {
    const ok = await confirmAction({
      title: "Utiliser l'effectif de l'équipe ?",
      subject: activeTeam?.name,
      message: "Les joueurs du terrain et du banc de ce match seront remplacés par les fiches de l'effectif. Les positions sur le terrain sont conservées.",
      confirmLabel: "Utiliser l'effectif",
    });
    if (ok) applyTeamRosterToGroup();
  };

  // PRO : à l'ouverture de la fenêtre Effectif, un groupe encore vierge (Joueur 1… 26) reprend
  // automatiquement l'effectif de l'équipe, pour n'afficher que ses joueurs
  useEffect(() => {
    if (!isSetPiecesOpen || !isProOrAdmin) return;
    const roster = teamRostersMap[activeTeamId] || [];
    if (roster.length === 0) return;
    const rosterIds = new Set(roster.map((p) => p.id));
    const group: { name?: string; rosterId?: string }[] = [...currentTokens.filter((t) => t.type === "player_a"), ...substitutes];
    const linkedHere = group.some((p) => p.rosterId && rosterIds.has(p.rosterId));
    // Groupe vierge, ou entièrement composé des joueurs d'une autre équipe (changement d'équipe sans match)
    const fromOtherTeam = group.length > 0 && group.every((p) => p.rosterId && !rosterIds.has(p.rosterId));
    if (group.length > 0 && !linkedHere && (isGenericGroup(group) || fromOtherTeam)) applyTeamRosterToGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSetPiecesOpen]);

  /** Enregistre le groupe actuel du match (terrain + banc) comme effectif de l'équipe. */
  const handleSaveGroupAsTeamRoster = () => {
    if (!activeTeamId) return;
    const stamp = Date.now();
    const pitchPlayers = currentTokens.filter((t) => t.type === "player_a");
    const roster: TeamRosterPlayer[] = [];
    const tokenLinks: Record<string, string> = {};
    pitchPlayers.forEach((t, i) => {
      const id = `${activeTeamId}_p${stamp}_${i}`;
      tokenLinks[t.id] = id;
      roster.push({ id, name: t.name, number: t.number ?? i + 1, role: t.role, status: toRosterStatus(t.status), photo: t.photo, isStarter: true });
    });
    const linkedBench = substitutes.map((s, i) => {
      const id = `${activeTeamId}_p${stamp}_b${i}`;
      roster.push({ id, name: s.name, number: s.number ?? pitchPlayers.length + i + 1, role: s.role, status: toRosterStatus(s.status), photo: s.photo, isStarter: false });
      return { ...s, rosterId: id };
    });
    setTeamRostersMap((prev) => ({ ...prev, [activeTeamId]: roster }));
    setKeyframes((prev) => prev.map((frame) => frame.map((t) => (tokenLinks[t.id] ? { ...t, rosterId: tokenLinks[t.id] } : t))));
    setSubstitutes(linkedBench);
  };

  // Supprime un titulaire de l'effectif : retiré du terrain (toutes les étapes de l'animation) et de ses rôles
  const handleDeleteStarter = async (tokenId: string, targetTeam?: "home" | "away") => {
    const isAway = (targetTeam || rolesTargetTeam) === "away";
    const token = currentTokens.find((t) => t.id === tokenId);
    if (!token) return;
    const ok = await confirmAction({
      title: "Supprimer ce joueur ?",
      subject: token.name,
      message: "Le joueur sera retiré du terrain et de l'effectif. Pour le garder en réserve, envoyez-le plutôt sur le banc.",
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    setKeyframes((prev) => prev.map((frame) => frame.filter((t) => t.id !== tokenId)));
    if (token.name) {
      const clearRoles = (prev: SetPieceRoleConfig) => {
        const updated = { ...prev };
        (Object.keys(updated) as (keyof SetPieceRoleConfig)[]).forEach((key) => {
          if (updated[key] === token.name) updated[key] = "";
        });
        return updated;
      };
      if (isAway) setOpponentSetPieceRoles(clearRoles);
      else setSetPieceRoles(clearRoles);
    }
  };

  const handleDeleteSubstitute = (subId: string, targetTeam?: "home" | "away") => {
    const isOppSub = targetTeam ? targetTeam === "away" : opponentSubstitutes.some((s) => s.id === subId);

    if (isOppSub) {
      const subToRemove = opponentSubstitutes.find((s) => s.id === subId);
      setOpponentSubstitutes((prev) => prev.filter((s) => s.id !== subId));
      if (subToRemove?.name) {
        setOpponentSetPieceRoles((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as (keyof SetPieceRoleConfig)[]).forEach((key) => {
            if (updated[key] === subToRemove.name) {
              updated[key] = "";
            }
          });
          return updated;
        });
      }
    } else {
      const subToRemove = substitutes.find((s) => s.id === subId);
      setSubstitutes((prev) => prev.filter((s) => s.id !== subId));
      if (subToRemove?.name) {
        setSetPieceRoles((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as (keyof SetPieceRoleConfig)[]).forEach((key) => {
            if (updated[key] === subToRemove.name) {
              updated[key] = "";
            }
          });
          return updated;
        });
      }
    }
  };

  // Open Inter-Team Swap Dialog
  const handleOpenInterTeamSwap = (
    player?: { id: string; name: string; number?: number; role?: string; photo?: string; status?: string },
    isStarter?: boolean,
    targetTeam?: "home" | "away"
  ) => {
    const currentIsAway = (targetTeam || rolesTargetTeam) === "away";
    const starters = currentTokens.filter((t) => currentIsAway ? t.type === "player_b" : t.type === "player_a");
    const bench = currentIsAway ? opponentSubstitutes : substitutes;

    if (player) {
      setSwapSourcePlayer({
        id: player.id,
        name: player.name || "Joueur",
        number: player.number || 10,
        role: player.role || (isStarter ? "Titulaire" : "SUB"),
        photo: player.photo,
        status: player.status || "normal",
        isStarter: Boolean(isStarter),
        teamTarget: currentIsAway ? "away" : "home",
      });
    } else {
      const defaultP = starters[0] || bench[0];
      if (defaultP) {
        setSwapSourcePlayer({
          id: defaultP.id,
          name: defaultP.name || "Joueur",
          number: defaultP.number || 10,
          role: defaultP.role || "Titulaire",
          photo: defaultP.photo,
          status: defaultP.status || "normal",
          isStarter: starters.includes(defaultP),
          teamTarget: currentIsAway ? "away" : "home",
        });
      }
    }

    // Default target team to another team managed by user
    const otherTeams = teams.filter((t) => t.id !== activeTeamId);
    if (otherTeams.length > 0) {
      if (!swapTargetTeamId || swapTargetTeamId === activeTeamId || !otherTeams.some((t) => t.id === swapTargetTeamId)) {
        setSwapTargetTeamId(otherTeams[0].id);
      }
    }

    setSwapTargetPlayerId(null);
    setSwapSearchQuery("");
    setSwapPositionFilter("ALL");
    setSwapNotification(null);
    setIsInterTeamSwapOpen(true);
  };

  // Perform 1-for-1 Inter-Team Swap
  const handleExecuteInterTeamSwap = () =>
    handleExecuteInterTeamSwapImpl({ activeTeam, activeTeamId, currentTokens, getRosterForTeam, setKeyframes, setOpponentSubstitutes, setSubstitutes, setSwapNotification, setSwapSourcePlayer, setSwapTargetPlayerId, setTeamRostersMap, substitutes, swapSourcePlayer, swapTargetPlayerId, swapTargetTeamId, teams, updateRosterPlayer });

  // Direct Transfer without 1-to-1 swap
  const handleExecuteDirectTransfer = (direction: "send_to_target" | "bring_from_target") =>
    handleExecuteDirectTransferImpl({ activeTeam, activeTeamId, currentTokens, getRosterForTeam, handleUpdatePitchPlayer, isProOrAdmin, setIsInterTeamSwapOpen, setKeyframes, setOpponentSubstitutes, setSubstitutes, setSwapNotification, setSwapTargetPlayerId, setTeamRostersMap, substitutes, swapSourcePlayer, swapTargetPlayerId, swapTargetTeamId, teamRostersMap, teams }, direction);

  // Give a yellow card to a player on the pitch (2nd yellow = automatic red card expulsion)
  const handleGiveYellowCard = (targetToken: Token) => {
    if (!isLiveMatchMode) {
      alert("Les cartons (jaunes/rouges) sont disponibles uniquement en MODE LIVE MATCH. Activer le Mode Live dans l'en-tête.");
      return;
    }
    const currentYellows = targetToken.yellowCards || 0;
    const timeFormatted = `${Math.floor(liveTimerSeconds / 60)}'`;
    const isHome = targetToken.type === "player_a";

    if (currentYellows >= 1) {
      alert(`Deuxième carton jaune 🟨🟨 pour ${targetToken.name} -> Carton rouge 🟥 ! Le joueur est expulsé du terrain.`);
      handleRemovePlayerFromPitch(targetToken, "red_card");
    } else {
      setKeyframes((prev) => {
        const copy = [...prev];
        const activeFrame = copy[currentFrameIdx] || [];
        copy[currentFrameIdx] = activeFrame.map((t) =>
          t.id === targetToken.id ? { ...t, yellowCards: 1 } : t
        );
        return copy;
      });

      setMatchEvents((prev) => [
        {
          id: `evt_${Date.now()}`,
          time: timeFormatted,
          period: eventPeriodLabel,
          type: "yellow" as const,
          player: targetToken.name,
          number: targetToken.number,
          team: isHome ? "home" : "away",
          note: "Carton Jaune 🟨"
        },
        ...prev
      ]);
    }
  };

  // Record Goal or Sport-specific Point (opens assist selector or records directly depending on action)
  const handleRecordScore = (targetToken: Token, action: SportScoreAction, explicitAssister?: string) => {
    if (!isLiveMatchMode) {
      alert("L'attribution de points est disponible uniquement en MODE LIVE MATCH.");
      return;
    }
    if (explicitAssister !== undefined || !action.requiresAssisterModal) {
      confirmGoalRecord(targetToken, explicitAssister, action);
    } else {
      setPendingScoreAction(action);
      setPendingGoalToken(targetToken);
      setSelectedPasseurName("");
    }
  };

  const handleRecordGoal = (targetToken: Token, explicitAssister?: string) => {
    const defaultAction = getSportScoreActions(activeSport)[0];
    handleRecordScore(targetToken, defaultAction, explicitAssister);
  };

  const confirmGoalRecord = (scorerToken: Token, passeurName?: string, customAction?: SportScoreAction) => {
    const action = customAction || pendingScoreAction || getSportScoreActions(activeSport)[0];
    const pts = action.points || 1;
    const isHome = scorerToken.type === "player_a";
    if (isHome) {
      setHomeScore((prev) => prev + pts);
    } else {
      setAwayScore((prev) => prev + pts);
    }

    const timeFormatted = `${Math.floor(liveTimerSeconds / 60)}'`;
    const cleanPasseur = passeurName && passeurName.trim() !== "" ? passeurName.trim() : undefined;

    setMatchEvents((prev) => [
      {
        id: `evt_${Date.now()}`,
        time: timeFormatted,
        period: eventPeriodLabel,
        type: "goal" as const,
        player: scorerToken.name,
        number: scorerToken.number,
        team: isHome ? "home" : "away",
        assister: cleanPasseur,
        points: pts,
        icon: action.icon,
        subType: action.id,
        note: cleanPasseur
          ? `${action.label} (+${pts} pts) • Passeur : ${cleanPasseur}`
          : `${action.label} (+${pts} pts)`
      },
      ...prev
    ]);

    setPendingGoalToken(null);
    setPendingScoreAction(null);
    setSelectedPasseurName("");
    setLiveActionToken(null);
    setSleekToastMessage(
      cleanPasseur
        ? `${action.icon} ${action.label.toUpperCase()} (+${pts} pts) de ${scorerToken.name} (Passeur : ${cleanPasseur}) !`
        : `${action.icon} ${action.label.toUpperCase()} (+${pts} pts) de ${scorerToken.name} !`
    );
    setTimeout(() => setSleekToastMessage(null), 3000);
  };

  // Record Assist in Live Match (attaches to the most recent goal without an assister)
  const handleRecordAssist = (targetToken: Token) => {
    if (!isLiveMatchMode) {
      alert("L'attribution de passe décisive est disponible uniquement en MODE LIVE MATCH.");
      return;
    }
    const isHome = targetToken.type === "player_a";
    const targetTeam = isHome ? "home" : "away";

    let updatedGoal = false;
    setMatchEvents((prev) => {
      const copy = [...prev];
      const goalIndex = copy.findIndex((e) => e.type === "goal" && e.team === targetTeam && !e.assister);
      if (goalIndex !== -1) {
        copy[goalIndex] = {
          ...copy[goalIndex],
          assister: targetToken.name,
          note: `Passeur : ${targetToken.name}`
        };
        updatedGoal = true;
        return copy;
      }
      return prev;
    });

    if (updatedGoal) {
      setSleekToastMessage(`👟 Passe décisive attribuée à ${targetToken.name} !`);
    } else {
      setSleekToastMessage(`👟 Passeur ${targetToken.name} sélectionné pour le prochain but !`);
      setSelectedPasseurName(targetToken.name);
    }
    setTimeout(() => setSleekToastMessage(null), 3000);
  };

  // Keyboard shortcuts when live action toolbox is open (b, p, j, r, esc)
  useEffect(() => {
    if (!liveActionToken || !isLiveMatchMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName)) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        handleRecordGoal(liveActionToken);
      } else if (key === "p") {
        e.preventDefault();
        handleRecordAssist(liveActionToken);
      } else if (key === "j") {
        e.preventDefault();
        const yellowsBefore = liveActionToken.yellowCards || 0;
        handleGiveYellowCard(liveActionToken);
        if (yellowsBefore >= 1) {
          setLiveActionToken(null);
        } else {
          setLiveActionToken({ ...liveActionToken, yellowCards: 1 });
        }
      } else if (key === "r") {
        e.preventDefault();
        handleRemovePlayerFromPitch(liveActionToken, "red_card");
        setLiveActionToken(null);
      } else if (key === "escape") {
        setLiveActionToken(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [liveActionToken, isLiveMatchMode, currentTokens]);

  // Add a bench substitute to the pitch
  const handleAddSubToPitch = (sub: any) => {
    if (sub.status === "red_card" || sub.removalReason === "red_card") {
      alert(`Impossible : ${sub.name} a reçu un carton rouge 🟥 (Expulsé du match).`);
      return;
    }

    const alreadyOnPitch = currentTokens.some(t => t.name === sub.name);
    if (alreadyOnPitch) {
      alert(`${sub.name} est déjà sur le terrain !`);
      return;
    }

    // Remove from substitutes so player is not on both pitch and bench simultaneously
    if (sub.type === "player_b") {
      setOpponentSubstitutes((prev) => prev.filter((s) => s.id !== sub.id));
    } else {
      setSubstitutes((prev) => prev.filter((s) => s.id !== sub.id));
    }

    const indexOffset = currentTokens.length;
    const newToken: Token = {
      id: `sub_${sub.id}_${indexOffset}`,
      type: sub.type || "player_a",
      name: sub.name,
      role: sub.role,
      number: sub.number,
      x: 45 + ((indexOffset * 3) % 12),
      y: 45 + ((indexOffset * 5) % 12),
      status: sub.status
    };

    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      copy[currentFrameIdx] = [...activeFrame, newToken];
      return copy;
    });
  };

  // Add an opponent player to the pitch deterministically
  const handleAddOpponent = () => {
    const count = currentTokens.filter(t => t.type === "player_b").length;
    const maxPlayers = getGameFormatOption(activeSport, activeFormat)?.players
      || (activeSport === "rugby" ? 15 : activeSport === "football" ? 11 : activeSport === "handball" ? 7 : activeSport === "basketball" ? 5 : 6);
    if (count >= maxPlayers) {
      alert(`Nombre maximum d'adversaires atteint (${maxPlayers}/${maxPlayers}).`);
      return;
    }
    const indexOffset = currentTokens.length;
    const newToken: Token = {
      id: `player_b_opt_${count}_${indexOffset}`,
      type: "player_b",
      name: `B${count + 1}`,
      role: "ADV",
      number: count + 1,
      x: 65 + ((count * 3) % 20),
      y: 20 + ((count * 6) % 60)
    };
    setKeyframes((prev) => {
      const copy = [...prev];
      copy[currentFrameIdx] = [...(copy[currentFrameIdx] || []), newToken];
      return copy;
    });
    setShowOpponents(true);
  };

  // ---------------------------------------------------------------------------
  // Mur sur coup franc (football)
  // Les joueurs glissés sur le mur y prennent une place (wallSlot) : ils sont affichés dans le mur, plus seuls.
  // Un remplaçant reprend le jeton du joueur sorti (même identifiant) : il entre donc aussi dans le mur.
  // ---------------------------------------------------------------------------
  const wallTokenId = (team: WallTeam) => `wall_${team}`;
  const findWall = (team: WallTeam, tokens: Token[] = currentTokens) => tokens.find((t) => t.type === "wall" && t.wallTeam === team);
  const wallCountFor = (team: WallTeam) => findWall(team)?.wallCount ?? wallCounts[team];
  const isWallMemberOf = (t: Token, team: WallTeam) => playerWallTeam(t.type) === team && typeof t.wallSlot === "number";

  /** Joueur affiché dans le mur de son équipe (le mur est posé dans cette image) */
  const isInWall = (t: Token, tokens: Token[]) => {
    const team = playerWallTeam(t.type);
    return !!team && typeof t.wallSlot === "number" && tokens.some((w) => w.type === "wall" && w.wallTeam === team);
  };

  /** Places du mur dans l'ordre : le joueur qui l'occupe, ou null si elle est libre */
  const wallMembers = (team: WallTeam, count: number, tokens: Token[] = currentTokens): (Token | null)[] =>
    Array.from({ length: count }, (_, i) => tokens.find((t) => isWallMemberOf(t, team) && t.wallSlot === i) || null);

  /** Angle affiché du mur (repère paysage) */
  const wallAngleOf = (wall: Token, tokens: Token[] = currentTokens) => {
    const ballTok = tokens.find((t) => t.type === "ball");
    return effectiveWallAngle(wall, ballTok && showBall ? ballTok : null, activeSport, activeFormat);
  };

  /** Position d'un joueur qui sort du mur : juste derrière le mur, côté de son but, à hauteur de sa place */
  const releasePosition = (wall: Token, slot: number, count: number) => {
    const a = (wallAngleOf(wall) * Math.PI) / 180;
    const offset = (slot - (count - 1) / 2) * 2.4;
    const back = wall.wallTeam === "away" ? 3.5 : -3.5;
    return {
      x: Math.max(1, Math.min(99, Math.round((wall.x + back + Math.cos(a) * offset * 0.66) * 10) / 10)),
      y: Math.max(1, Math.min(99, Math.round((wall.y + Math.sin(a) * offset) * 10) / 10)),
    };
  };

  /** Place (ou replace) le mur de l'équipe face au ballon, sur toutes les images ; ses joueurs restent dedans */
  const handlePlaceWall = (team: WallTeam) => {
    const ballTok = currentTokens.find((t) => t.type === "ball");
    const ball = ballTok && showBall ? { x: ballTok.x, y: ballTok.y } : null;
    const pos = wallPlacement(ball, team, activeSport, activeFormat);
    const wall: Token = {
      id: wallTokenId(team),
      type: "wall",
      wallTeam: team,
      wallCount: wallCountFor(team),
      name: "Mur",
      role: "MUR",
      x: pos.x,
      y: pos.y,
    };
    setKeyframes((prev) => prev.map((frame) => [...frame.filter((t) => !(t.type === "wall" && t.wallTeam === team)), wall]));
    if (team === "away") setShowOpponents(true);
  };

  /** Retire le mur : ses joueurs reviennent sur le terrain, juste derrière */
  const handleRemoveWall = (team: WallTeam) => {
    const wall = findWall(team);
    const count = wall?.wallCount || WALL_DEFAULT;
    setKeyframes((prev) => prev.map((frame) => frame
      .filter((t) => !(t.type === "wall" && t.wallTeam === team))
      .map((t) => {
        if (!isWallMemberOf(t, team)) return t;
        const { wallSlot, ...rest } = t;
        return wall ? { ...rest, ...releasePosition(wall, wallSlot!, count) } : rest;
      })));
    setWallPopover((p) => (p && p.team === team ? null : p));
  };

  /** Sort un joueur du mur */
  const handleReleaseFromWall = (tokenId: string) => {
    const tok = currentTokens.find((t) => t.id === tokenId);
    const team = tok ? playerWallTeam(tok.type) : null;
    const wall = team ? findWall(team) : undefined;
    if (!tok || !team || typeof tok.wallSlot !== "number") return;
    const pos = wall ? releasePosition(wall, tok.wallSlot, wall.wallCount || WALL_DEFAULT) : null;
    setKeyframes((prev) => prev.map((frame) => frame.map((t) => {
      if (t.id !== tokenId) return t;
      const { wallSlot: _slot, ...rest } = t;
      return pos ? { ...rest, ...pos } : rest;
    })));
  };

  /**
   * Fait entrer un joueur dans le mur de son équipe, à la place visée si elle est libre, sinon à la place libre
   * la plus proche ; mur plein : une place de plus (jusqu'à 7).
   */
  // ---------------------------------------------------------------------------
  // Liaisons entre joueurs (outil « Lier ») : on touche les joueurs un à un pour former une chaîne.
  // Toucher à nouveau le dernier joueur (ou le terrain, ou « Terminer ») valide la liaison ;
  // toucher le premier joueur ferme la forme. La liaison est ajoutée à l'image courante et aux suivantes.
  // ---------------------------------------------------------------------------
  const commitLink = (ids: string[]) => {
    setLinkDraft([]);
    if (ids.length < 2) return;
    const link: Token = {
      id: `link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type: "link",
      name: "Liaison",
      role: "Liaison",
      x: 0,
      y: 0,
      color: linkColor,
      linkStyle: linkDashed ? "dashed" : "solid",
      linkIds: ids,
    };
    setKeyframes((prev) => prev.map((frame, fIdx) => {
      if (fIdx < currentFrameIdx) return frame;
      // Images suivantes : seulement si tous les joueurs reliés y sont encore
      if (fIdx > currentFrameIdx && !ids.every((id) => frame.some((t) => t.id === id))) return frame;
      return [...frame, link];
    }));
  };

  const handleLinkTap = (tokenId: string) => {
    const draft = linkDraft;
    if (draft.length === 0) { setLinkDraft([tokenId]); return; }
    // Dernier joueur touché à nouveau : la liaison est terminée
    if (tokenId === draft[draft.length - 1]) { commitLink(draft); return; }
    // Premier joueur touché : la forme est fermée
    if (tokenId === draft[0] && draft.length >= 3) { commitLink([...draft, tokenId]); return; }
    if (draft.includes(tokenId)) return;
    setLinkDraft([...draft, tokenId]);
  };

  const handleDeleteLink = (linkId: string) => {
    setKeyframes((prev) => prev.map((frame) => frame.filter((t) => t.id !== linkId)));
    setSelectedLinkId(null);
  };

  // En quittant l'outil « Lier », la chaîne en cours est validée (2 joueurs ou plus)
  useEffect(() => {
    if (activeTool !== "link" && linkDraft.length > 0) commitLink(linkDraft);
    if (activeTool !== "select") setSelectedLinkId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  // Clavier : Entrée valide la chaîne, Échap l'annule ; Suppr efface la liaison sélectionnée
  useEffect(() => {
    if (activeTool !== "link" && !selectedLinkId) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (activeTool === "link" && e.key === "Enter") { e.preventDefault(); commitLink(linkDraft); }
      else if (activeTool === "link" && e.key === "Escape") { setLinkDraft([]); }
      else if (selectedLinkId && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); handleDeleteLink(selectedLinkId); }
      else if (selectedLinkId && e.key === "Escape") setSelectedLinkId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, linkDraft, selectedLinkId, linkColor, linkDashed]);

  const handleJoinWall = (tokenId: string, team: WallTeam, preferredSlot: number) => {
    const wall = findWall(team);
    if (!wall) return;
    const count = wall.wallCount || WALL_DEFAULT;
    const occupied = new Set(currentTokens.filter((t) => isWallMemberOf(t, team) && t.id !== tokenId).map((t) => t.wallSlot!));
    const free = Array.from({ length: count }, (_, i) => i).filter((i) => !occupied.has(i)).sort((a, b) => Math.abs(a - preferredSlot) - Math.abs(b - preferredSlot));
    let slot = free.length ? free[0] : -1;
    let newCount = count;
    if (slot < 0) {
      if (count >= WALL_MAX) {
        setSleekToastMessage(`Le mur est complet (${WALL_MAX} joueurs maximum)`);
        return;
      }
      slot = count;
      newCount = count + 1;
      setWallCounts((prev) => ({ ...prev, [team]: newCount }));
    }
    setKeyframes((prev) => prev.map((frame) => frame.map((t) => {
      if (t.id === tokenId) return { ...t, wallSlot: slot };
      if (t.type === "wall" && t.wallTeam === team && newCount !== count) return { ...t, wallCount: newCount };
      return t;
    })));
  };

  /** Nombre de places du mur : en moins, les derniers joueurs du mur reviennent sur le terrain */
  const handleSetWallCount = (team: WallTeam, count: number) => {
    const n = Math.max(WALL_MIN, Math.min(WALL_MAX, count));
    setWallCounts((prev) => ({ ...prev, [team]: n }));
    const wall = findWall(team);
    const members = currentTokens.filter((t) => isWallMemberOf(t, team)).sort((a, b) => a.wallSlot! - b.wallSlot!);
    const keep = members.slice(0, n);
    const drop = new globalThis.Map(members.slice(n).map((m) => [m.id, m.wallSlot!]));
    // Les joueurs gardés dont la place disparaît prennent les places libres restantes
    const used = new Set(keep.filter((m) => m.wallSlot! < n).map((m) => m.wallSlot!));
    const remap = new globalThis.Map<string, number>();
    let next = 0;
    keep.filter((m) => m.wallSlot! >= n).forEach((m) => {
      while (used.has(next)) next++;
      remap.set(m.id, next);
      used.add(next);
    });
    setKeyframes((prev) => prev.map((frame) => frame.map((t) => {
      if (t.type === "wall" && t.wallTeam === team) return { ...t, wallCount: n };
      if (drop.has(t.id)) {
        const { wallSlot: _slot, ...rest } = t;
        return wall ? { ...rest, ...releasePosition(wall, drop.get(t.id)!, wall.wallCount || WALL_DEFAULT) } : rest;
      }
      if (remap.has(t.id)) return { ...t, wallSlot: remap.get(t.id) };
      return t;
    })));
  };

  /** Angle du mur (undefined = face au ballon) */
  const handleSetWallAngle = (team: WallTeam, angle: number | undefined) => {
    setKeyframes((prev) => prev.map((frame) => frame.map((t) => {
      if (!(t.type === "wall" && t.wallTeam === team)) return t;
      if (angle === undefined) {
        const { wallAngle: _a, ...rest } = t;
        return rest;
      }
      return { ...t, wallAngle: normalizeAngle(angle) };
    })));
  };

  /** Remplit les places libres : joueurs de champ sur le terrain, postes de duel d'abord, sans le tireur de coup franc */
  const handleAutoFillWall = (team: WallTeam) => {
    const wall = findWall(team);
    if (!wall) return;
    const count = wall.wallCount || WALL_DEFAULT;
    const roles = team === "away" ? opponentSetPieceRoles : setPieceRoles;
    const occupied = new Set(currentTokens.filter((t) => isWallMemberOf(t, team)).map((t) => t.wallSlot!));
    const freeSlots = Array.from({ length: count }, (_, i) => i).filter((i) => !occupied.has(i));
    const rank = (role?: string) => {
      const i = WALL_PREFERRED_ROLES.indexOf((role || "").toUpperCase().trim());
      return i < 0 ? WALL_PREFERRED_ROLES.length : i;
    };
    const picked = currentTokens
      .filter((t) => playerWallTeam(t.type) === team && typeof t.wallSlot !== "number" && !isGoalkeeperRole(t.role) && t.number !== 1 && (!t.name || t.name !== roles.directFreeKick))
      .sort((a, b) => rank(a.role) - rank(b.role))
      .slice(0, freeSlots.length);
    if (!picked.length) return;
    const assign = new globalThis.Map(picked.map((p, i) => [p.id, freeSlots[i]]));
    setKeyframes((prev) => prev.map((frame) => frame.map((t) => (assign.has(t.id) ? { ...t, wallSlot: assign.get(t.id) } : t))));
  };

  /** Place du mur sous un point de l'écran (-1 si le point n'est pas sur le mur) */
  const wallSlotAtPoint = (wall: Token, clientX: number, clientY: number, rect: DOMRect) => {
    const portrait = aspectRatioMode === "mobile";
    const sx = portrait ? wall.y : wall.x;
    const sy = portrait ? 100 - wall.x : wall.y;
    const cx = rect.left + (sx / 100) * rect.width;
    const cy = rect.top + (sy / 100) * rect.height;
    const a = ((wallAngleOf(wall) - (portrait ? 90 : 0)) * Math.PI) / 180;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const u = dx * Math.cos(a) + dy * Math.sin(a);
    const v = -dx * Math.sin(a) + dy * Math.cos(a);
    const scale = playerScale / 100;
    const step = 24 * scale;
    const count = wall.wallCount || WALL_DEFAULT;
    const half = (count * step) / 2;
    if (Math.abs(v) > 26 * scale || Math.abs(u) > half + 18 * scale) return -1;
    return Math.max(0, Math.min(count - 1, Math.floor((u + half) / step)));
  };

  /** Rotation à la main : la poignée suit le doigt / la souris autour du centre du mur (pas de 5°) */
  const handleStartWallRotate = (team: WallTeam, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const el = (e.currentTarget as HTMLElement).closest("[data-wall-team]") as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const portrait = aspectRatioMode === "mobile";
    const move = (ev: MouseEvent | TouchEvent) => {
      const p = "touches" in ev ? ev.touches[0] : ev;
      if (!p) return;
      const screen = (Math.atan2(p.clientY - cy, p.clientX - cx) * 180) / Math.PI;
      handleSetWallAngle(team, normalizeAngle(screen + (portrait ? 90 : 0), 5));
    };
    const up = () => {
      dragEndTimeRef.current = Date.now();
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
  };

  // Le panneau du mur se ferme quand on appuie ailleurs (hors du panneau, du mur, des joueurs et du bouton « Mur »)
  useEffect(() => {
    if (!wallPopover) return;
    const onDown = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as HTMLElement | null;
      if (target?.closest("[data-wall-popover], [data-wall-team], [data-board-token], [data-wall-button]")) return;
      setWallPopover(null);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
    };
  }, [wallPopover]);

  // Core drawing and whiteboard cleaning options
  const handleUndo = () => {
    if (drawingHistory.length > 0) {
      const last = drawingHistory[drawingHistory.length - 1];
      setDrawingActions(last);
      setDrawingHistory((prev) => prev.slice(0, -1));
    } else {
      setDrawingActions([]);
    }
    setSelectedStrokeIndex(null);
  };

  const handleClearDrawings = () => {
    if (drawingActions.length > 0) {
      setDrawingHistory((prev) => [...prev, drawingActions]);
      setDrawingActions([]);
      setSelectedStrokeIndex(null);
    }
    setCurrentActionPoints([]);
  };

  const handleDeleteSelectedStroke = () => {
    if (selectedStrokeIndex !== null) {
      setDrawingHistory((prev) => [...prev, drawingActions]);
      setDrawingActions((prev) => prev.filter((_, idx) => idx !== selectedStrokeIndex));
      setSelectedStrokeIndex(null);
    }
  };

  const handleToggleLineTool = () => {
    setSelectedStrokeIndex(null);
    if (activeTool !== "line") {
      setActiveTool("line");
      if (drawingTool !== "shape-dashed-line" && drawingTool !== "shape-line") {
        setDrawingTool("shape-line");
      }
    } else {
      setDrawingTool((prev) => (prev === "shape-dashed-line" ? "shape-line" : "shape-dashed-line"));
    }
  };

  /** Courbe fléchée : 1er clic = trait plein, clics suivants = bascule plein / pointillé */
  const handleToggleCurveTool = () => {
    setSelectedStrokeIndex(null);
    if (activeTool !== "curve") {
      setActiveTool("curve");
      if (!isCurveTool(drawingTool)) setDrawingTool("curve-arrow");
    } else {
      setDrawingTool((prev) => (prev === "curve-arrow-dashed" ? "curve-arrow" : "curve-arrow-dashed"));
    }
  };
  const curveToolTitle =
    activeTool === "curve"
      ? `Courbe fléchée ${drawingTool === "curve-arrow-dashed" ? "en pointillé" : "pleine"} : glissez pour tracer, puis déplacez les poignées pour la cintrer. Recliquez pour passer en ${drawingTool === "curve-arrow-dashed" ? "trait plein" : "pointillé"}`
      : "Courbe fléchée : glissez pour tracer, puis déplacez les poignées pour la cintrer (recliquez pour le pointillé)";

  // Keyboard shortcuts for drawing undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (drawingActions.length > 0 || drawingHistory.length > 0) {
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawingActions, drawingHistory]);

  const handleResetBoard = async () => {
    if (
      await confirmAction({
        title: "Réinitialiser le terrain ?",
        message: "Les joueurs reprendront leur position de départ et tous les tracés seront effacés.",
        confirmLabel: "Réinitialiser",
        tone: "warning",
      })
    ) {
      setDrawingActions([]);
      setDrawingHistory([]);
      const defaultTokens = getDefaultPlayersForSport(activeSport);
      setKeyframes([defaultTokens]);
      setCurrentFrameIdx(0);
    }
  };

  // Format du terrain depuis la barre d'outils (foot à 11 / 8 / 5, rugby à XV / 7) — formule gratuite uniquement.
  // Ne modifie pas le format enregistré de l'équipe : il reprend la main au prochain changement d'équipe.
  const handleSwitchBoardFormat = async (format: string) => {
    const option = getGameFormatOption(activeSport, format);
    if (!option || option.id === activeFormat) return;
    if (
      (drawingActions.length > 0 || keyframes.length > 1) &&
      !(await confirmAction({
        title: `Passer en ${currentLang === "en" ? option.labelEn : option.label} ?`,
        message: "Le terrain sera réinitialisé : les joueurs reprendront leur position de départ, les tracés et les étapes d'animation seront effacés.",
        confirmLabel: "Changer de format",
        tone: "warning",
      }))
    ) return;
    setSchemaFormatOverride(option.id === resolveGameFormat(activeSport, teamForFormat?.format) ? null : { sport: activeSport, format: option.id });
    setIsPlaying(false);
    setDrawingActions([]);
    setDrawingHistory([]);
    setKeyframes([getDefaultPlayersForSport(activeSport, option.id)]);
    setCurrentFrameIdx(0);
    setSleekToastMessage(`✅ ${currentLang === "en" ? option.labelEn : option.label} (${option.players} ${currentLang === "en" ? "players" : "joueurs"})`);
    setTimeout(() => setSleekToastMessage(null), 2500);
  };

  // Format de jeu d'une équipe (foot à 11 / 8 / 5, rugby à XV / 7)
  const handleChangeTeamFormat = async (teamId: string, format: string) => {
    const team = teams.find((t) => t.id === teamId);
    const option = getGameFormatOption(activeSport, format);
    if (!team || !option || resolveGameFormat(activeSport, team.format) === option.id) return;
    const isActive = teamId === activeTeamId;
    if (
      isActive &&
      (drawingActions.length > 0 || keyframes.length > 1) &&
      !(await confirmAction({
        title: `Passer ${team.name} en ${option.label} ?`,
        message: "Le terrain sera réinitialisé : les joueurs reprendront leur position de départ, les tracés et les étapes d'animation seront effacés.",
        confirmLabel: "Changer de format",
        tone: "warning",
      }))
    ) return;
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, format: option.id } : t)));
    if (isActive) {
      setSchemaFormatOverride(null);
      setIsPlaying(false);
      setDrawingActions([]);
      setDrawingHistory([]);
      setKeyframes([getDefaultPlayersForSport(activeSport, option.id)]);
      setCurrentFrameIdx(0);
    }
    setSleekToastMessage(`✅ ${team.name} : ${currentLang === "en" ? option.labelEn : option.label} (${option.players} ${currentLang === "en" ? "players" : "joueurs"})`);
    setTimeout(() => setSleekToastMessage(null), 2500);
  };

  // Saved tactical strategies handlers
  const handleTriggerSaveModal = () => {
    if (!isProOrAdmin) {
      setSleekToastMessage("🔒 L'enregistrement des schémas tactiques est réservé aux formules PRO & PRO+.");
      setIsCheckoutOpen(true);
      return;
    }
    setIsSaveAnimationMode(false);
    setTacticName(`Schéma ${activeSport.toUpperCase()} - ${new Date().toLocaleDateString(undefined)}`);
    setSaveTacticMatchId(activeMatchId);
    setIsSaveModalOpen(true);
  };

  const handleSaveTacticState = () =>
    handleSaveTacticStateImpl({ activeFormat, activeMatch, activeMatchId, activeSport, activeTeam, drawingActions, generateCompositeTacticsCanvas, isProOrAdmin, isSaveAnimationMode, keyframes, matchesList, savedTactics, saveTacticMatchId, setIsCheckoutOpen, setIsSaveAnimationMode, setIsSaveModalOpen, setSavedTactics, setSaveSuccess, setSleekToastMessage, setTacticDesc, showOpponents, syncSchemaToCloud, tacticDesc, tacticName, teams });

  // Sauvegarde en ligne d'un schéma (compte Google connecté uniquement).
  // L'image d'aperçu n'est pas envoyée : elle est lourde (souvent > 1 Mo, la limite d'un document)
  // et elle est régénérée à l'affichage / au partage.
  const CLOUD_SCHEMA_MAX_CHARS = 1_000_000;
  const syncSchemaToCloud = (schema: any, opts: { isNew?: boolean } = {}) => {
    if (!schema?.id) return;
    const { previewImage: _omitPreview, ...cloudSchema } = schema;
    const payload = JSON.stringify(cloudSchema);

    if (payload.length > CLOUD_SCHEMA_MAX_CHARS) {
      console.warn(`[Firestore] Schéma ${schema.id} trop volumineux pour la sauvegarde en ligne (${payload.length} caractères).`);
      setSleekToastMessage("⚠️ Schéma trop volumineux pour la sauvegarde en ligne : il reste enregistré sur cet appareil uniquement.");
      setTimeout(() => setSleekToastMessage(null), 5000);
      return;
    }

    const nowIso = new Date().toISOString();
    saveTacticToFirestore({
      id: schema.id,
      userId: activeCoachId,
      name: schema.name,
      sport: schema.sport || activeSport,
      pitchType: "full",
      notes: schema.description || "",
      payload,
      // createdAt n'est envoyé qu'à la création (les règles de sécurité interdisent de le modifier ensuite)
      ...(opts.isNew ? { createdAt: nowIso } : {}),
      updatedAt: nowIso,
    }).catch((e) => {
      console.error("[Firestore] Échec de la sauvegarde en ligne du schéma:", e);
      setSleekToastMessage("⚠️ La sauvegarde en ligne du schéma a échoué : il reste enregistré sur cet appareil.");
      setTimeout(() => setSleekToastMessage(null), 5000);
    });
  };

  const handleLinkSchemaToMatch = (schemaId: string, matchId: string) => {
    setSavedTactics((prev) => {
      const nextList = prev.map((sc) => (sc.id === schemaId ? { ...sc, matchId } : sc));
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_saved_playbooks", JSON.stringify(nextList));
      }
      return nextList;
    });
    // Rattachement au match également sauvegardé en ligne
    const current = savedTactics.find((sc) => sc.id === schemaId);
    if (current) syncSchemaToCloud({ ...current, matchId });
  };

  const handleLoadSchema = (schema: any) => {
    if (schema.keyframes) {
      setKeyframes(schema.keyframes);
      setCurrentFrameIdx(0);
    }
    if (schema.drawings) {
      setDrawingActions(schema.drawings);
    }
    if (schema.sport) {
      setActiveSport(schema.sport);
    }
    applySchemaFormat(schema.sport || activeSport, schema.format);
    // Rétablit l'affichage des adversaires tel qu'il était à l'enregistrement
    setShowOpponents(schema.showOpponents !== false);
    if (schema.id && activeMatchId && schema.matchId !== activeMatchId) {
      handleLinkSchemaToMatch(schema.id, activeMatchId);
    }

    const isAnim = Boolean(schema.isAnimation || (schema.keyframes && schema.keyframes.length > 1));
    if (isAnim && !isLiveMatchMode) {
      setIsAnimationCreatorOpen(true);
      setSleekToastMessage(`🎬 Animation "${schema.name}" loaded (${schema.keyframes?.length || 1} étapes) !`);
    } else {
      setSleekToastMessage(`🎯 Schéma "${schema.name}" chargé pour le match "${activeMatch?.homeTeam || 'Mon Équipe'} VS ${activeMatch?.awayTeam || 'Adversaire'}" !`);
    }
    setTimeout(() => setSleekToastMessage(null), 2500);
  };

  const handleDeleteSchema = (schemaId: string) => {
    setSavedTactics((prev) => {
      const nextList = prev.filter((s) => s.id !== schemaId);
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_saved_playbooks", JSON.stringify(nextList));
      }
      return nextList;
    });

    // Cloud delete via Firebase Firestore
    try {
      deleteTacticFromFirestore(schemaId).catch((e) => console.log("Firebase delete queued:", e));
    } catch (e) {
      console.log("Firebase delete skipped:", e);
    }
  };

  // Handlers for sharing (3D View and Schemas via WhatsApp / Email)
  const handleOpenShareSquad3D = async () => {
    const activeStarters = currentTokens
      .filter((t) => t.type === "player_a")
      .map((p) => ({
        number: p.number || 1,
        name: p.name || `Joueur #${p.number}`,
        position: p.role || "ST",
        isStarter: true,
      }));

    const activeSubs = (substitutes || [])
      .filter((s: any) => !activeStarters.some((st) => st.name && s.name && st.name.toLowerCase() === s.name.toLowerCase()))
      .map((s: any) => ({
        number: s.number || 12,
        name: s.name || `Remplaçant #${s.number}`,
        position: s.role || "SUB",
        isStarter: false,
      }));

    // Pre-capture full-height 3D image to avoid any scroll/viewport clipping
    const captured3d = await captureSquad3DDataUrl();

    setShareData({
      type: "carte_3d",
      title: `Composition 3D - ${displayClubTitle}`,
      sport: activeSport,
      clubName: displayClubTitle,
      matchInfo: isLiveMatchMode && activeMatch ? `${displayClubTitle} vs ${activeMatch.awayTeam}` : undefined,
      formation: selectedFormationA || "4-3-3",
      notes: tacticalNotes || activeMatch?.notes || "Composition officielle transmise pour la rencontre.",
      players: [...activeStarters, ...activeSubs],
      starters: activeStarters,
      substitutes: activeSubs,
      imageElementRef: squad3DRef,
      imageUrl: captured3d || undefined,
    });
    setShareModalOpen(true);
  };

  const handleOpenShareSchema = (schema?: any) =>
    handleOpenShareSchemaImpl({ activeMatch, activeMatchId, activeSport, currentTokens, displayClubTitle, generateCompositeTacticsCanvas, gifRequestIdRef, hasActiveMatch, isProOrAdmin, keyframes, playbackSpeed, preloadExportPortraits, renderCompositeTacticsCanvas, savedTactics, schemaBelongsToMatch, selectedFormationA, setIsCheckoutOpen, setShareData, setShareModalOpen, setSleekToastMessage, substitutes, tacticalNotes }, schema);

  // Export PDF du dossier du match : nom du match, schémas liés et notes tactiques (PRO & PRO+)
  const [isExportingMatchPdf, setIsExportingMatchPdf] = useState(false);
  const handleExportMatchPdf = () =>
    handleExportMatchPdfImpl({ activeCoach, activeMatch, activeMatchId, activeSport, activeTeam, clubLogo, currentTokens, displayClubTitle, findWall, hasActiveMatch, isExportingMatchPdf, isFootballBoard, isProOrAdmin, preloadExportPortraits, renderCompositeTacticsCanvas, savedTactics, schemaBelongsToMatch, setIsCheckoutOpen, setIsExportingMatchPdf, setPieceRoles, setSleekToastMessage, substitutes, tacticalNotes, wallMembers });

  const drawWrappedCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = 6
  ) => {
    if (!text) return;
    const words = text.split(/\s+/);
    let line = "";
    let currentY = y;
    let linesCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
        linesCount++;
        if (linesCount >= maxLines - 1) {
          ctx.fillText((line + "...").trim(), x, currentY);
          return;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  };

  // Même choix de portrait que sur le terrain (photo du joueur, sinon avatar selon le sport, l'équipe et le poste)
  const getTokenPortraitSrc = (token: any, sport: string): string => {
    if (token.photo) return autoTransparentCache[token.photo] || token.photo;
    const sportKey = String(sport).toLowerCase();
    const isTeamB = token.type === "player_b";
    const isGK =
      sportKey !== "basketball" &&
      sportKey !== "rugby" &&
      (token.role === "G" || token.role === "GK" || token.role === "GB" || token.role === "Gardien" || token.number === 1);
    if (sportKey === "basketball") return isTeamB ? "/images/avatars/basket_opponent_red.png" : "/images/avatars/basket_player_green.png";
    if (sportKey === "rugby") return isTeamB ? "/images/avatars/rugby_opponent_red.png" : "/images/avatars/rugby_player_green.png";
    if (sportKey === "handball") {
      if (isGK) return isTeamB ? "/images/avatars/handball_opponent_goalkeeper.png" : "/images/avatars/handball_goalkeeper_yellow.png";
      return isTeamB ? "/images/avatars/handball_opponent_red.png" : "/images/avatars/handball_player_green.png";
    }
    if (isGK) return isTeamB ? "/images/avatars/opponent_goalkeeper.png" : "/images/avatars/goalkeeper_yellow.png";
    return isTeamB ? "/images/avatars/opponent_red.png" : "/images/avatars/player_green.png";
  };

  // Une image introuvable n'est pas bloquante : l'export retombe alors sur le dessin simplifié
  const preloadExportPortraits = (tokens: any[], sport: string): Promise<void> => {
    const sources = new Set<string>(
      tokens
        .filter((token) => token?.type === "player_a" || token?.type === "player_b")
        .map((token) => getTokenPortraitSrc(token, sport))
    );
    return Promise.all(
      Array.from(sources)
        .filter((src) => !exportImageCacheRef.current[src])
        .map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              // Une image externe sans CORS rendrait le canvas inexportable : elle échoue ici plutôt qu'à l'export
              if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
              img.onload = () => {
                exportImageCacheRef.current[src] = img;
                resolve();
              };
              img.onerror = () => resolve();
              img.src = src;
            })
        )
    ).then(() => undefined);
  };

  // Garde les portraits du terrain prêts pour les exports immédiats (image PNG, aperçu d'enregistrement)
  useEffect(() => {
    if (playerRepresentation === "jersey") return;
    preloadExportPortraits(
      playerRepresentation === "head" ? currentTokens : currentTokens.filter((token: any) => token.photo),
      activeSport
    );
  }, [currentTokens, activeSport, playerRepresentation, autoTransparentCache]);

  // Helper function to generate high resolution composite tactic pitch image
  const generateCompositeTacticsCanvas = (schemaOverride?: any, frameIndexOverride?: number): string =>
    renderCompositeTacticsCanvas(schemaOverride, frameIndexOverride)?.toDataURL("image/png") || "";

  const renderCompositeTacticsCanvas = (schemaOverride?: any, frameIndexOverride?: number, tokensOverride?: any[]): HTMLCanvasElement | null =>
    renderCompositeTacticsCanvasImpl({ activeCoach, activeMatch, activeMatchId, activeSport, awayScore, clubLogoImgRef, currentTokens, displayClubTitle, drawingActions, drawWrappedCanvasText, exportImageCacheRef, formatFor, formatLiveTime, getTokenPortraitSrc, hasActiveMatch, homeScore, isInWall, isLiveMatchMode, keyframes, liveTimerSeconds, matchEvents, pitchThirdsLabels, playerRepresentation, savedTactics, schemaBelongsToMatch, showBall, showClubLogoOnPitch, showOpponents, showPitchThirds, showPitchZones, showPlayerNames, tacticalNotes, teamAColor, teamBColor, wallMembers }, schemaOverride, frameIndexOverride, tokensOverride);

  // Execute PNG Image Download Directly
  const handleDoExportImage = () => {
    try {
      const dataUrl = generateCompositeTacticsCanvas();
      if (!dataUrl) {
        alert("Erreur lors de la préparation de l'image.");
        return;
      }
      const link = document.createElement("a");
      const matchNameSlug = hasActiveMatch ? `${activeMatch.homeTeam}_VS_${activeMatch.awayTeam}`.replace(/\s+/g, "_") : `Tactique_${activeSport.toUpperCase()}`;
      link.download = `Bilan_${matchNameSlug}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'exportation PNG.");
    }
  };

  // Execute PNG Image Download Directly (Included in Free plan)
  const handleOpenExportModal = () => {
    handleDoExportImage();
  };

  // Export Screenshot Image of the active Modal Window DOM Element
  const handleExportModalWindowImage = async () => {
    if (!matchFinishedModalRef.current) {
      alert("La fenêtre du bilan n'est pas disponible.");
      return;
    }
    try {
      setSleekToastMessage("📸 Capture de la fenêtre en cours...");
      setIsExportingModalScreen(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(matchFinishedModalRef.current, {
        scale: 2,
        backgroundColor: "#0d1117",
        useCORS: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const matchSlug = activeMatch ? `${activeMatch.homeTeam}_VS_${activeMatch.awayTeam}`.replace(/\s+/g, "_") : "Bilan_Match";
      link.download = `Capture_Fenetre_${matchSlug}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSleekToastMessage("✅ Image de la fenêtre exportée avec succès !");
      setTimeout(() => setSleekToastMessage(null), 3000);
    } catch (e) {
      console.warn("html2canvas failed, attempting html-to-image fallback:", e);
      try {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(matchFinishedModalRef.current, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: "#0d1117"
        });
        const link = document.createElement("a");
        const matchSlug = activeMatch ? `${activeMatch.homeTeam}_VS_${activeMatch.awayTeam}`.replace(/\s+/g, "_") : "Bilan_Match";
        link.download = `Capture_Fenetre_${matchSlug}_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSleekToastMessage("✅ Image de la fenêtre exportée avec succès !");
        setTimeout(() => setSleekToastMessage(null), 3000);
      } catch (err) {
        console.error("toPng error:", err);
        alert("Erreur lors de la capture de la fenêtre.");
        setSleekToastMessage(null);
      }
    } finally {
      setIsExportingModalScreen(false);
    }
  };

  // WhatsApp Match Report Share
  const handleShareMatchWhatsApp = () =>
    handleShareMatchWhatsAppImpl({ activeMatch, activeSport, awayScore, formatLiveTime, homeScore, liveTimerSeconds, matchEvents, tacticalNotes });

  // Mic dictation implementation using browser Web Speech API
  const handleToggleMicRecording = () =>
    handleToggleMicRecordingImpl({ isProOrAdmin, isRecordingVoice, recognitionRef, setIsCheckoutOpen, setIsRecordingVoice, setSleekToastMessage, setSpeechError, setTacticalNotes });

  const renderPlayerEditPanel = () => (
    <PlayerEditPanel
      activeSport={activeSport}
      currentFrameIdx={currentFrameIdx}
      currentTokens={currentTokens}
      editingToken={editingToken}
      editPanelRef={editPanelRef}
      getAvailableNumbersForOpponent={getAvailableNumbersForOpponent}
      getAvailableNumbersForPlayer={getAvailableNumbersForPlayer}
      handleAssignUniqueNumber={handleAssignUniqueNumber}
      handleGiveYellowCard={handleGiveYellowCard}
      handleRecordAssist={handleRecordAssist}
      handleRecordScore={handleRecordScore}
      handleRemovePlayerFromPitch={handleRemovePlayerFromPitch}
      handleSwapPlayerOnPitch={handleSwapPlayerOnPitch}
      isLiveMatchMode={isLiveMatchMode}
      isModernSleek={isModernSleek}
      isPitchFullscreen={isPitchFullscreen}
      matchEvents={matchEvents}
      opponentSubstitutes={opponentSubstitutes}
      quickActionToken={quickActionToken}
      setEditingToken={setEditingToken}
      setKeyframes={setKeyframes}
      setQuickActionToken={setQuickActionToken}
      setSubPickerToken={setSubPickerToken}
      substitutes={substitutes}
      t={t}
    />
  );

  // Dimensions dynamiques du terrain adaptées à l'espace vide disponible :
  // - Quand la boîte à outils compacte s'affiche (joueur sélectionné en Live Match), le terrain s'adapte en se réduisant
  //   pour que terrain + boîte à outils s'intègrent parfaitement sans débordement ni barre de défilement.
  // - Quand la boîte à outils est masquée, le terrain s'agrandit pour occuper harmonieusement tout l'espace disponible.
  const isToolboxVisible = Boolean(isLiveMatchMode && liveActionToken);

  const currentPitchRatio = aspectRatioMode === "mobile"
    ? (terrainComplet ? 1 / getSportRatioNum(activeSport, activeFormat) : 2 / getSportRatioNum(activeSport, activeFormat))
    : (terrainComplet ? getSportRatioNum(activeSport, activeFormat) : getSportRatioNum(activeSport, activeFormat) / 2);

  // Position des drapeaux de coin (en %) selon le dégagement autour du terrain du format
  const cornerFlagVars = (() => {
    const spec = getSmallPitchSpec(activeSport, activeFormat);
    const { W, H } = spec ? smallPitchBox(spec) : { W: 110, H: 73 };
    const m = spec ? spec.margin : 2.5;
    return { "--cf-x": `${(m / W) * 100}%`, "--cf-y": `${(m / H) * 100}%` } as React.CSSProperties;
  })();

  const pitchTargetVh = isBoardFullscreen
    ? (!isLiveMatchMode && isAnimationCreatorOpen ? 50 : (isToolboxVisible ? 62 : 78))
    : (!isLiveMatchMode && isAnimationCreatorOpen ? 48 : (isToolboxVisible ? 54 : 68));

  // Dynamic calculation for Fullscreen mode: subtract exact top & bottom bars height from 100vh
  // Animation : 200px couvrent le bandeau du haut (même replié sur 2 lignes) + la barre d'animation dockée en bas
  const fullscreenHeightExpr = !isLiveMatchMode && isAnimationCreatorOpen
    ? "calc(100vh - 215px)"
    : isToolboxVisible
      ? "calc(100vh - 140px)"
      : "calc(100vh - 90px)";

  // L'ouverture de la barre d'animation ne réduit pas le terrain : la barre s'ajoute sous la barre d'outils
  // et la zone centrale défile si besoin.
  const normalPitchHeightExpr = isToolboxVisible
      ? "min(54vh, calc(100vh - 200px))"
      : "min(65vh, calc(100vh - 150px))";

  const pitchMaxHeight = isPitchFullscreen
    ? fullscreenHeightExpr
    : normalPitchHeightExpr;

  // Barre d'animation ouverte + zoom avant : le terrain occupe sa hauteur zoomée et pousse la barre en dessous
  const zoomedPitchReservedHeight = !isLiveMatchMode && isAnimationCreatorOpen && zoomScale > 100 && pitchBoxHeight > 0
    ? Math.ceil((pitchBoxHeight * zoomScale) / 100)
    : undefined;

  const fullscreenSidePanelsWidth = (isTeamAPanelCollapsed ? 42 : 180) + (showOpponents ? (isTeamBPanelCollapsed ? 42 : 180) : 0);

  const pitchMaxWidth = isPitchFullscreen
    ? (aspectRatioMode === "mobile"
      ? `min(calc(96vw - ${fullscreenSidePanelsWidth}px), calc(${fullscreenHeightExpr} * ${currentPitchRatio}))`
      : `min(calc(98vw - ${fullscreenSidePanelsWidth}px), calc(${fullscreenHeightExpr} * ${currentPitchRatio}))`)
    : (aspectRatioMode === "mobile"
      ? `min(88vw, calc(${normalPitchHeightExpr} * ${currentPitchRatio}))`
      : `min(100%, calc(${normalPitchHeightExpr} * ${currentPitchRatio}))`);

  // Petite boîte à outils Live Match (options de match : buteur, passeur, carton jaune, carton rouge, blessure)
  // Contrôles d'animation : seconde ligne de la barre d'outils, au-dessus du terrain (affichage normal et plein écran)
  const renderAnimationStrip = () => (
    <AnimationStrip
      activeMatchId={activeMatchId}
      activeSport={activeSport}
      currentFrameIdx={currentFrameIdx}
      drawingActions={drawingActions}
      getDefaultPlayersForSport={getDefaultPlayersForSport}
      handleOpenShareSchema={handleOpenShareSchema}
      isModernSleek={isModernSleek}
      isPlaying={isPlaying}
      isProOrAdmin={isProOrAdmin}
      keyframes={keyframes}
      playbackSpeed={playbackSpeed}
      selectedFormationA={selectedFormationA}
      setCurrentFrameIdx={setCurrentFrameIdx}
      setIsCheckoutOpen={setIsCheckoutOpen}
      setIsPlaying={setIsPlaying}
      setIsSaveAnimationMode={setIsSaveAnimationMode}
      setIsSaveModalOpen={setIsSaveModalOpen}
      setKeyframes={setKeyframes}
      setPlaybackSpeed={setPlaybackSpeed}
      setSaveTacticMatchId={setSaveTacticMatchId}
      setSleekToastMessage={setSleekToastMessage}
      setTacticName={setTacticName}
      t={t}
    />
  );

  const renderLiveMatchToolbox = () => (
    <LiveMatchToolbox
      activeSport={activeSport}
      currentTokens={currentTokens}
      handleGiveYellowCard={handleGiveYellowCard}
      handleRecordAssist={handleRecordAssist}
      handleRecordScore={handleRecordScore}
      handleRemovePlayerFromPitch={handleRemovePlayerFromPitch}
      isLiveMatchMode={isLiveMatchMode}
      isModernSleek={isModernSleek}
      liveActionToken={liveActionToken}
      matchEvents={matchEvents}
      pitchMaxWidth={pitchMaxWidth}
      setLiveActionToken={setLiveActionToken}
      setSubPickerToken={setSubPickerToken}
      t={t}
    />
  );
  const renderSubstitutionModal = () => (
    <SubstitutionModal
      activeMatch={activeMatch}
      currentTokens={currentTokens}
      handleRemovePlayerFromPitch={handleRemovePlayerFromPitch}
      handleSwapPlayerOnPitch={handleSwapPlayerOnPitch}
      isModernSleek={isModernSleek}
      opponentSubstitutes={opponentSubstitutes}
      setEditingToken={setEditingToken}
      setQuickActionToken={setQuickActionToken}
      setSubPickerToken={setSubPickerToken}
      subPickerToken={subPickerToken}
      substitutes={substitutes}
      t={t}
    />
  );

  // Modale complète de la Fiche du Joueur (accessible depuis la fenêtre de changement de joueur et par double-clic)
  const renderPlayerEditModal = () => (
    <PlayerEditModal
      activeMatch={activeMatch}
      activeSport={activeSport}
      currentTokens={currentTokens}
      editingToken={editingToken}
      getAvailableNumbersForOpponent={getAvailableNumbersForOpponent}
      getAvailableNumbersForPlayer={getAvailableNumbersForPlayer}
      getSportCommonPositions={getSportCommonPositions}
      handleAssignUniqueNumber={handleAssignUniqueNumber}
      handleRemovePlayerFromPitch={handleRemovePlayerFromPitch}
      handleUpdatePitchPlayer={handleUpdatePitchPlayer}
      handleUpdateSubstitute={handleUpdateSubstitute}
      isLiveMatchMode={isLiveMatchMode}
      isModernSleek={isModernSleek}
      matchEvents={matchEvents}
      setEditingToken={setEditingToken}
      setQuickActionToken={setQuickActionToken}
      setSubPickerToken={setSubPickerToken}
    />
  );

  {/* RENDER FUNCTION: MON EQUIPE (PANEL A) */ }
  const renderTeamAPanel = (isFullscreenMode: boolean = false) => (
    <TeamAPanel
      activeSport={activeSport}
      applyTeamAFormation={applyTeamAFormation}
      clearTeamAPlayers={clearTeamAPlayers}
      countSportRoles={countSportRoles}
      currentTokens={currentTokens}
      getAvailableFormationsForSport={getAvailableFormationsForSport}
      isCompactUI={isCompactUI}
      isModernSleek={isModernSleek}
      isTeamAPanelCollapsed={isTeamAPanelCollapsed}
      regroupTeamAInCamp={regroupTeamAInCamp}
      selectedFormationA={selectedFormationA}
      setIsSetPiecesOpen={setIsSetPiecesOpen}
      setIsTeamAPanelCollapsed={setIsTeamAPanelCollapsed}
      setPieceRoles={setPieceRoles}
      setRolesTargetTeam={setRolesTargetTeam}
      setTeamRolesModalTab={setTeamRolesModalTab}
      substitutes={substitutes}
      t={t}
      isFullscreenMode={isFullscreenMode}
    />
  );

  {/* RENDER FUNCTION: MON ADVERSAIRE (PANEL B) */ }
  const renderTeamBPanel = (isFullscreenMode: boolean = false) => (
    <TeamBPanel
      activeSport={activeSport}
      applyTeamBFormation={applyTeamBFormation}
      clearTeamBPlayers={clearTeamBPlayers}
      countSportRoles={countSportRoles}
      currentTokens={currentTokens}
      getAvailableFormationsForSport={getAvailableFormationsForSport}
      handleAddOpponent={handleAddOpponent}
      isCompactUI={isCompactUI}
      isModernSleek={isModernSleek}
      isProOrAdmin={isProOrAdmin}
      isTeamBPanelCollapsed={isTeamBPanelCollapsed}
      opponentSetPieceRoles={opponentSetPieceRoles}
      opponentSubstitutes={opponentSubstitutes}
      regroupTeamBInCamp={regroupTeamBInCamp}
      selectedFormationB={selectedFormationB}
      setIsCheckoutOpen={setIsCheckoutOpen}
      setIsSetPiecesOpen={setIsSetPiecesOpen}
      setIsTeamBPanelCollapsed={setIsTeamBPanelCollapsed}
      setRolesTargetTeam={setRolesTargetTeam}
      setSleekToastMessage={setSleekToastMessage}
      setTeamRolesModalTab={setTeamRolesModalTab}
      t={t}
      isFullscreenMode={isFullscreenMode}
    />
  );

  // Thème commun des grandes fenêtres (gestion des matchs, sauvegarde…)
  const pth = getPremiumTheme(isModernSleek);

  /** Joueurs d'une équipe enregistrée : consultation et modification des fiches */
  const renderTeamRosterEditor = (team: TeamCategory) => (
    <TeamRosterEditor
      activeSport={activeSport}
      activeTeamId={activeTeamId}
      currentTokens={currentTokens}
      getRosterForTeam={getRosterForTeam}
      getSportCommonPositions={getSportCommonPositions}
      handleAddTeamPlayer={handleAddTeamPlayer}
      handleEditTeamPlayer={handleEditTeamPlayer}
      handleRemoveTeamPlayer={handleRemoveTeamPlayer}
      handleTeamPlayerPhoto={handleTeamPlayerPhoto}
      isModernSleek={isModernSleek}
      isProOrAdmin={isProOrAdmin}
      pth={pth}
      setRosterEditTeamId={setRosterEditTeamId}
      substitutes={substitutes}
      team={team}
    />
  );
  // Boutons d'outils de la barre du haut (même gabarit que les autres groupes : h-7, icône seule)
  const topToolBtnClass = (isActive: boolean) => `h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer relative flex items-center justify-center ${isActive
    ? isModernSleek
      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
    : isModernSleek
      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
    }`;
  const topToolGroupClass = `flex items-center gap-1 h-8 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`;

  // Groupes de la barre du terrain : tous affichés dans la ligne défilante.
  const toolbarSeparator = (
    <div aria-hidden="true" className={`h-5 w-px mx-0.5 shrink-0 ${isModernSleek ? "bg-slate-300" : "bg-[#2a3344]"}`} />
  );
  const renderToolbarGroup = (key: (typeof TOOLBAR_GROUP_KEYS)[number], withSeparator: boolean, node: React.ReactNode) => (
    <div
      key={key}
      data-toolbar-key={key}
      className={`flex items-center gap-[inherit] shrink-0 ${key === "zoom" ? "ml-auto" : ""}`}
    >
      {withSeparator && toolbarSeparator}
      {node}
    </div>
  );

  // Flèche de bord : signale qu'il reste des outils de ce côté et fait défiler d'une « page »
  const renderToolbarScrollArrow = (side: "left" | "right") => {
    const visible = side === "left" ? toolbarScroll.canScrollLeft : toolbarScroll.canScrollRight;
    if (!visible) return null;
    const label = side === "left"
      ? (currentLang === "fr" ? "Outils précédents" : "Previous tools")
      : (currentLang === "fr" ? "Outils suivants" : "Next tools");
    return (
      <div
        className={`pointer-events-none absolute inset-y-0 ${side === "left" ? "left-0 pr-6 bg-gradient-to-r" : "right-0 pl-6 bg-gradient-to-l"} from-[var(--cockpit-toolbar)] from-60% to-transparent flex items-center z-10`}
      >
        <button
          type="button"
          onClick={() => toolbarScroll.scrollByPage(side === "left" ? -1 : 1)}
          className={`pointer-events-auto h-8 w-8 rounded-full shadow-md flex items-center justify-center transition cursor-pointer border ${isModernSleek
            ? "bg-white border-slate-300 text-slate-700 hover:text-emerald-700"
            : "bg-[#132338] border-[#00E599]/50 text-[#00E599] hover:bg-[#1a2d47]"
            }`}
          title={label}
          aria-label={label}
        >
          {side === "left" ? <ChevronLeft className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        </button>
      </div>
    );
  };
  const teamInitials = (name?: string) => {
    const words = (name || "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div
      className={`stitch-board flex flex-col h-screen overflow-hidden relative font-sans select-none transition-colors duration-300 ${isModernSleek
        ? "bg-[#f1f5f9] text-slate-800 modern-sleek-mode"
        : "bg-[#111319] text-white"
        } ${isCompactUI ? "compact-mode text-[92%]" : ""}`}
      id="tactical-command-center"
    >
      {/* Subtle modern ambient spotlight */}
      {isModernSleek && (
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,229,153,0.12),transparent_70%)]" />
      )}

      {/* Floating Modern Sleek Toast Notification */}
      {sleekToastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-2xl border border-emerald-500 text-emerald-800 text-xs font-black shadow-2xl shadow-slate-900/15 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>{sleekToastMessage}</span>
          </div>
        </div>
      )}

      {/* Compte sans accès : données masquées (conservées en base) */}
      {isDataHidden && !isHiddenDataBannerDismissed && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl" role="status">
          <div className={`p-3 rounded-2xl border shadow-2xl flex items-start gap-3 ${isModernSleek ? "bg-white border-amber-400 text-slate-800" : "bg-[#121926]/95 backdrop-blur-xl border-amber-500/40 text-slate-200"}`}>
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="flex-1 min-w-0 text-xs leading-relaxed">
              <p className="font-black">Votre accès PRO est terminé : vos équipes, matchs, notes et schémas sont masqués.</p>
              <p className={isModernSleek ? "text-slate-500" : "text-slate-400"}>
                Ils restent sauvegardés sur votre compte. Reprenez une formule PRO ou PRO+ pour les retrouver.
              </p>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition cursor-pointer"
              >
                Voir les formules
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsHiddenDataBannerDismissed(true)}
              className={`p-1 rounded-lg transition cursor-pointer ${isModernSleek ? "text-slate-400 hover:text-slate-800" : "text-slate-500 hover:text-white"}`}
              aria-label="Fermer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <TopHeader
        activeCoach={activeCoach}
        currentLang={currentLang}
        currentPlan={currentPlan}
        handleOpenUserConfig={handleOpenUserConfig}
        hasHadPaidSubscription={hasHadPaidSubscription}
        isCompactUI={isCompactUI}
        isModernSleek={isModernSleek}
        isPaidSubscriber={isPaidSubscriber}
        isPitchFullscreen={isPitchFullscreen}
        isRightSidebarOpen={isRightSidebarOpen}
        isUserAdmin={isUserAdmin}
        isUserMenuOpen={isUserMenuOpen}
        liveTrialStatus={liveTrialStatus}
        onLogout={onLogout}
        onOpenAdminPlatform={onOpenAdminPlatform}
        onOpenLegalModal={onOpenLegalModal}
        onOpenSupportModal={onOpenSupportModal}
        onOpenTrialModal={onOpenTrialModal}
        onOpenTutorial={onOpenTutorial}
        setIsCheckoutOpen={setIsCheckoutOpen}
        setIsRightSidebarOpen={setIsRightSidebarOpen}
        setIsUserGuideModalOpen={setIsUserGuideModalOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        t={t}
        togglePitchFullscreen={togglePitchFullscreen}
      />

      {/* 2. THREE PANEL WORKSPACE (LEFT - CENTER - RIGHT) */}
      <div className="flex-1 flex overflow-hidden w-full">

        {/* ========================================================= */}
        {/* CENTER PANEL: PITCH VIEWPORT & CONTROLLERS & FORMATIONS */}
        {/* ========================================================= */}
        <main className={`tb-main flex-1 flex flex-col ${isModernSleek ? "bg-[#f1f5f9]" : "bg-[#07090e]"} ${isCompactUI ? "p-1.5 sm:p-2" : "p-1.5 sm:p-2.5 lg:p-3 xl:p-4"} overflow-y-auto overflow-x-hidden scrollbar-thin transition-all duration-200`}>

          <PitchToolbar
            activeFormat={activeFormat}
            activeSport={activeSport}
            activeTool={activeTool}
            aspectRatioMode={aspectRatioMode}
            currentLang={currentLang}
            currentTokens={currentTokens}
            curveToolTitle={curveToolTitle}
            drawColor={drawColor}
            drawingActions={drawingActions}
            drawingTool={drawingTool}
            handleClearDrawings={handleClearDrawings}
            handleOpenExportModal={handleOpenExportModal}
            handleSwitchBoardFormat={handleSwitchBoardFormat}
            handleToggleCurveTool={handleToggleCurveTool}
            handleToggleLineTool={handleToggleLineTool}
            isAnimationCreatorOpen={isAnimationCreatorOpen}
            isCompactUI={isCompactUI}
            isFootballBoard={isFootballBoard}
            isLiveMatchMode={isLiveMatchMode}
            isModernSleek={isModernSleek}
            isPitchFullscreen={isPitchFullscreen}
            isProOrAdmin={isProOrAdmin}
            isTeamAPanelCollapsed={isTeamAPanelCollapsed}
            isTeamBPanelCollapsed={isTeamBPanelCollapsed}
            playerRepresentation={playerRepresentation}
            playerRolesToggleLabel={playerRolesToggleLabel}
            playerScale={playerScale}
            renderAnimationStrip={renderAnimationStrip}
            renderToolbarGroup={renderToolbarGroup}
            renderToolbarScrollArrow={renderToolbarScrollArrow}
            setActiveTool={setActiveTool}
            setAspectRatioMode={setAspectRatioMode}
            setDrawColor={setDrawColor}
            setDrawingTool={setDrawingTool}
            setIsAnimationCreatorOpen={setIsAnimationCreatorOpen}
            setIsTeamAPanelCollapsed={setIsTeamAPanelCollapsed}
            setIsTeamBPanelCollapsed={setIsTeamBPanelCollapsed}
            setPitchPan={setPitchPan}
            setPlayerRepresentation={setPlayerRepresentation}
            setPlayerScale={setPlayerScale}
            setSelectedStrokeIndex={setSelectedStrokeIndex}
            setShowBall={setShowBall}
            setShowOpponents={setShowOpponents}
            setShowPitchThirds={setShowPitchThirds}
            setShowPitchZones={setShowPitchZones}
            setShowPlayerNames={setShowPlayerNames}
            setShowPlayerRoles={setShowPlayerRoles}
            setShowSquad3DModal={setShowSquad3DModal}
            setTerrainComplet={setTerrainComplet}
            setWallPopover={setWallPopover}
            setZoomScale={setZoomScale}
            showBall={showBall}
            showOpponents={showOpponents}
            showPitchThirds={showPitchThirds}
            showPitchZones={showPitchZones}
            showPlayerNames={showPlayerNames}
            showPlayerRoles={showPlayerRoles}
            t={t}
            terrainComplet={terrainComplet}
            toolbarScroll={toolbarScroll}
            topToolBtnClass={topToolBtnClass}
            topToolGroupClass={topToolGroupClass}
            wallPopover={wallPopover}
            zoomScale={zoomScale}
          />


          {/* PITCH WORKSPACE WITH FLANKING PANELS (LEFT: MON EQUIPE + SUBS, CENTER: PITCH, RIGHT: COMPO ADVERSE) */}
          <div className="tb-workspace flex-1 flex flex-col lg:flex-row items-stretch lg:items-center-safe justify-center-safe gap-2 xl:gap-3.5 w-full m-auto min-h-0">

            {/* 1. LEFT FLANKING PANEL: MON EQUIPE (USER CLUB + SUBS) */}
            {!isPitchFullscreen && renderTeamAPanel(false)}

            <PitchArea
              activeFormat={activeFormat}
              activeSport={activeSport}
              activeTool={activeTool}
              aspectRatioMode={aspectRatioMode}
              autoTransparentCache={autoTransparentCache}
              awayScore={awayScore}
              ballMagnetTargetId={ballMagnetTargetId}
              breakShortLabel={breakShortLabel}
              canvasRef={canvasRef}
              clubLogo={clubLogo}
              cornerFlagVars={cornerFlagVars}
              currentPitchRatio={currentPitchRatio}
              currentTokens={currentTokens}
              curveHandleIdx={curveHandleIdx}
              curveToolTitle={curveToolTitle}
              dragEndTimeRef={dragEndTimeRef}
              drawingActions={drawingActions}
              drawingTool={drawingTool}
              drawSize={drawSize}
              formatLiveTime={formatLiveTime}
              halftimeSecondsLeft={halftimeSecondsLeft}
              handleCanvasMouseDown={handleCanvasMouseDown}
              handleCanvasMouseMove={handleCanvasMouseMove}
              handleCanvasMouseUp={handleCanvasMouseUp}
              handleClearDrawings={handleClearDrawings}
              handleDeleteLink={handleDeleteLink}
              handleDeleteSelectedStroke={handleDeleteSelectedStroke}
              handleLinkTap={handleLinkTap}
              handlePitchPanStart={handlePitchPanStart}
              handleStartWallRotate={handleStartWallRotate}
              handleToggleCurveTool={handleToggleCurveTool}
              handleToggleLineTool={handleToggleLineTool}
              handleTokenStartDrag={handleTokenStartDrag}
              handleUndo={handleUndo}
              homeScore={homeScore}
              isAnimationCreatorOpen={isAnimationCreatorOpen}
              isDraggingTokenRef={isDraggingTokenRef}
              isFootballBoard={isFootballBoard}
              isHalftime={isHalftime}
              isInWall={isInWall}
              isLiveMatchMode={isLiveMatchMode}
              isModernSleek={isModernSleek}
              isPanningPitch={isPanningPitch}
              isPeriodOvertime={isPeriodOvertime}
              isPitchFullscreen={isPitchFullscreen}
              isPlaying={isPlaying}
              isTeamAPanelCollapsed={isTeamAPanelCollapsed}
              isTeamBPanelCollapsed={isTeamBPanelCollapsed}
              lastTokenTapRef={lastTokenTapRef}
              linkColor={linkColor}
              linkDashed={linkDashed}
              linkDraft={linkDraft}
              liveTimerSeconds={liveTimerSeconds}
              matchEvents={matchEvents}
              pitchBoxRef={pitchBoxRef}
              pitchContainerRef={pitchContainerRef}
              pitchMaxHeight={pitchMaxHeight}
              pitchMaxWidth={pitchMaxWidth}
              pitchPan={pitchPan}
              pitchThirdsLabels={pitchThirdsLabels}
              pitchWrapperRef={pitchWrapperRef}
              playbackSpeed={playbackSpeed}
              playerRepresentation={playerRepresentation}
              playerRolesToggleLabel={playerRolesToggleLabel}
              playerScale={playerScale}
              renderAnimationStrip={renderAnimationStrip}
              renderLiveMatchToolbox={renderLiveMatchToolbox}
              renderPlayerEditModal={renderPlayerEditModal}
              renderSubstitutionModal={renderSubstitutionModal}
              renderTeamAPanel={renderTeamAPanel}
              renderTeamBPanel={renderTeamBPanel}
              selectedLinkId={selectedLinkId}
              selectedStrokeIndex={selectedStrokeIndex}
              selectedTokenId={selectedTokenId}
              setActiveTool={setActiveTool}
              setAspectRatioMode={setAspectRatioMode}
              setDrawColor={setDrawColor}
              setDrawingTool={setDrawingTool}
              setDrawSize={setDrawSize}
              setEditingToken={setEditingToken}
              setIsAnimationCreatorOpen={setIsAnimationCreatorOpen}
              setIsTeamAPanelCollapsed={setIsTeamAPanelCollapsed}
              setIsTeamBPanelCollapsed={setIsTeamBPanelCollapsed}
              setLiveActionToken={setLiveActionToken}
              setPieceRoles={setPieceRoles}
              setPitchPan={setPitchPan}
              setPlayerRepresentation={setPlayerRepresentation}
              setPlayerScale={setPlayerScale}
              setQuickActionToken={setQuickActionToken}
              setSelectedLinkId={setSelectedLinkId}
              setSelectedStrokeIndex={setSelectedStrokeIndex}
              setShowBall={setShowBall}
              setShowOpponents={setShowOpponents}
              setShowPlayerNames={setShowPlayerNames}
              setShowPlayerRoles={setShowPlayerRoles}
              setSubPickerToken={setSubPickerToken}
              setTerrainComplet={setTerrainComplet}
              setWallPopover={setWallPopover}
              setZoomScale={setZoomScale}
              showBall={showBall}
              showClubLogoOnPitch={showClubLogoOnPitch}
              showOpponents={showOpponents}
              showPitchThirds={showPitchThirds}
              showPitchZones={showPitchZones}
              showPlayerNames={showPlayerNames}
              showPlayerRoles={showPlayerRoles}
              startCurveHandleDrag={startCurveHandleDrag}
              t={t}
              teamAColor={teamAColor}
              teamBColor={teamBColor}
              terrainComplet={terrainComplet}
              togglePitchFullscreen={togglePitchFullscreen}
              tokensLayerRef={tokensLayerRef}
              wallAngleOf={wallAngleOf}
              wallDropTarget={wallDropTarget}
              wallMembers={wallMembers}
              wallPopover={wallPopover}
              zoomedPitchReservedHeight={zoomedPitchReservedHeight}
              zoomScale={zoomScale}
            />

            {/* 3. RIGHT FLANKING PANEL: COMPO ADVERSE (CLUB ADVERSE) */}
            {!isPitchFullscreen && showOpponents && renderTeamBPanel(false)}

          </div>

          {/* Bottom padding end of pitch main area */}
          <div className="pb-2" />

        </main>

        {/* ========================================================= */}
        {/* RESIZABLE SPLITTER DIVIDER HANDLE - Desktop only (xl+) */}
        {/* ========================================================= */}
        {isRightSidebarOpen && (
          <div
            onMouseDown={handleRightSidebarResizeStart}
            onTouchStart={handleRightSidebarResizeStart}
            onDoubleClick={() => setRightSidebarWidth(isCompactUI ? 220 : 300)}
            className={`hidden xl:flex w-1.5 hover:w-2 ${isModernSleek ? "bg-slate-200 border-slate-300 hover:bg-emerald-500/40" : "bg-[#121926] border-[#1f293d] hover:bg-[#00E599]/50"} cursor-col-resize flex-shrink-0 transition-all z-20 items-center justify-center relative group select-none border-l ${isResizingRightSidebar ? "bg-[#00E599] !w-2 shadow-lg shadow-[#00e599]/30" : ""
              }`}
            title={t.tactics.sidebar.resizeTooltip}
          >
            {/* Visual grab bar indicator */}
            <div
              className={`w-0.5 h-8 rounded-full transition-all ${isResizingRightSidebar
                ? "bg-slate-950 scale-y-125"
                : isModernSleek
                  ? "bg-slate-400 group-hover:bg-emerald-600 group-hover:scale-y-110"
                  : "bg-[#384869] group-hover:bg-[#00E599] group-hover:scale-y-110"
                }`}
            />

            {/* Floating width indicator tooltip when dragging */}
            {isResizingRightSidebar && (
              <div className="absolute top-12 right-3 z-50 bg-[#070b13] border border-[#00E599] text-[#00E599] px-2 py-0.5 rounded-md text-[10px] font-mono font-black shadow-xl whitespace-nowrap pointer-events-none">
                {rightSidebarWidth} px
              </div>
            )}
          </div>
        )}

        {/* Floating Expand Tab when Right Sidebar is Closed - Placed at Bottom Right */}
        {!isRightSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsRightSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-[#0d1117]/95 hover:bg-[#00E599] text-[#00E599] hover:text-slate-950 border border-[#00E599]/60 py-2.5 px-4 rounded-2xl shadow-2xl shadow-[#00E599]/20 transition-all duration-200 cursor-pointer flex items-center gap-2 group select-none animate-pulse hover:animate-none backdrop-blur-md"
            title={t.tactics.sidebar.openSidebarTooltip}
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-black uppercase tracking-wider">{t.tactics.sidebar.openSidebarBtn}</span>
          </button>
        )}

        {/* Backdrop on tablet/iPad/mobile (< 1280px) when right sidebar is open */}
        {isRightSidebarOpen && (
          <div
            onClick={() => setIsRightSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 xl:hidden cursor-pointer"
            aria-hidden="true"
          />
        )}

        {/* ========================================================= */}
        {/* RIGHT PANEL: SCHÉMAS, MATCH À VENIR, NOTES TACTIQUES - REDUCED & COMPACT */}
        {/* ========================================================= */}
        <aside
          id="tour-right-sidebar"
          style={{
            width: isRightSidebarOpen ? `${rightSidebarWidth}px` : 0,
          }}
          className={`${isRightSidebarOpen
            ? "opacity-100"
            : "w-0 border-l-0 opacity-0 overflow-hidden pointer-events-none"
            } ${isModernSleek
              ? "bg-white border-l border-slate-200/90 shadow-sm text-slate-800"
              : "bg-[#0d1117] border-l border-[#1f293d]"
            } flex flex-col justify-between flex-shrink-0 fixed xl:relative inset-y-0 right-0 z-50 xl:z-30 shadow-2xl xl:shadow-none h-full max-w-[92vw] sm:max-w-[500px] ${isResizingRightSidebar ? "transition-none select-none" : "transition-[width,opacity] duration-300"
            }`}
        >
          {/* Mobile / Tablet / iPad Drawer Header with Close Button */}
          <div className="xl:hidden flex items-center justify-between p-2.5 border-b border-[#1f293d] bg-[#090d14] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">📖</span>
              <span className="text-xs font-black uppercase tracking-wider text-[#00E599]">{t.tactics.sidebar.openSidebarBtn}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRightSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2333] transition cursor-pointer"
              title={t.tactics.sidebar.closeSidebarTooltip}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="tb-sidebar-scroll flex-1 flex flex-col p-3 gap-3 overflow-y-auto scrollbar-thin h-full">

            {/* Active Team Pill (au-dessus du module Match) */}
            <button
              onClick={() => {
                // Sans équipe, toutes les formules peuvent créer leur première équipe
                if (!isProOrAdmin && teams.length > 0) {
                  setIsMultiTeamUpgradeModalOpen(true);
                } else {
                  setIsMultiTeamModalOpen(true);
                }
              }}
              className={`w-full tb-team-pill ${isModernSleek ? "text-slate-800" : ""} border hover:border-amber-500/50 p-2 rounded-xl flex items-center justify-between transition cursor-pointer shadow-sm group`}
              title={t.tactics.sidebar.switchTeamTooltip}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-7 h-7 rounded-full border-2 ${isModernSleek ? "border-emerald-600" : "border-[#00E599]"} flex items-center justify-center shrink-0`}>
                  <Shield className={`w-4 h-4 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} />
                </span>
                <span className="min-w-0 text-left">
                  <span className={`block text-sm font-black ${isModernSleek ? "text-slate-900 group-hover:text-emerald-800" : "text-white group-hover:text-amber-200"} truncate transition`}>
                    {activeTeam?.name || "Créer mon équipe"}
                  </span>
                  {activeMatch?.competition && (
                    <span className={`block text-xs font-semibold ${isModernSleek ? "text-slate-500" : "text-slate-400"} truncate mt-0.5`}>{activeMatch.competition}</span>
                  )}
                </span>
              </div>
              {isProOrAdmin ? (
                <span className="tb-pro-badge text-[10px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 shadow-sm">
                  PRO
                </span>
              ) : (
                <span className="text-[9px] bg-slate-800 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full uppercase font-extrabold flex items-center gap-0.5 shrink-0">
                  <Lock className="w-2.5 h-2.5" /> 1 ÉQUIPE
                </span>
              )}
            </button>

            <MatchCard
              activeLivePublicId={activeLivePublicId}
              activeMatch={activeMatch}
              activeMatchId={activeMatchId}
              activeSport={activeSport}
              activeTeamId={activeTeamId}
              awayScore={awayScore}
              breakLongLabel={breakLongLabel}
              clubLogo={clubLogo}
              currentPeriod={currentPeriod}
              currentTokens={currentTokens}
              filteredMatches={filteredMatches}
              formatLiveTime={formatLiveTime}
              halftimeSecondsLeft={halftimeSecondsLeft}
              handleAddNewMatch={handleAddNewMatch}
              handleDeleteMatchEvent={handleDeleteMatchEvent}
              handleFinishLiveMatch={handleFinishLiveMatch}
              handleNextMatch={handleNextMatch}
              handlePrevMatch={handlePrevMatch}
              handleRecordScore={handleRecordScore}
              handleSelectLivePeriod={handleSelectLivePeriod}
              hasActiveMatch={hasActiveMatch}
              homeScore={homeScore}
              isClubTeamName={isClubTeamName}
              isHalftime={isHalftime}
              isHalftimeRunning={isHalftimeRunning}
              isLiveMatchMode={isLiveMatchMode}
              isLiveTimerRunning={isLiveTimerRunning}
              isMatchSectionCollapsed={isMatchSectionCollapsed}
              isModernSleek={isModernSleek}
              isPeriodOvertime={isPeriodOvertime}
              isProOrAdmin={isProOrAdmin}
              isProPlusOrAdmin={isProPlusOrAdmin}
              liveActionToken={liveActionToken}
              livePeriodButtons={livePeriodButtons}
              liveTimerSeconds={liveTimerSeconds}
              matchEvents={matchEvents}
              openLiveShare={openLiveShare}
              openMatchConvocation={openMatchConvocation}
              router={router}
              setAwayScore={setAwayScore}
              setHalftimeSecondsLeft={setHalftimeSecondsLeft}
              setHomeScore={setHomeScore}
              setIsCheckoutOpen={setIsCheckoutOpen}
              setIsHalftimeRunning={setIsHalftimeRunning}
              setIsLiveMatchMode={setIsLiveMatchMode}
              setIsLiveMatchUpgradeModalOpen={setIsLiveMatchUpgradeModalOpen}
              setIsLiveTimerRunning={setIsLiveTimerRunning}
              setIsMatchEditOpen={setIsMatchEditOpen}
              setIsMatchFinishedModalOpen={setIsMatchFinishedModalOpen}
              setIsMatchSectionCollapsed={setIsMatchSectionCollapsed}
              setIsNotesSectionCollapsed={setIsNotesSectionCollapsed}
              setIsSchemasSectionCollapsed={setIsSchemasSectionCollapsed}
              setLiveActionToken={setLiveActionToken}
              setLiveTimerSeconds={setLiveTimerSeconds}
              setMatchEvents={setMatchEvents}
              setSleekToastMessage={setSleekToastMessage}
              teamInitials={teamInitials}
            />

            <SchemasSection
              activeMatch={activeMatch}
              activeMatchId={activeMatchId}
              confirmDeleteSchemaId={confirmDeleteSchemaId}
              handleDeleteSchema={handleDeleteSchema}
              handleLoadSchema={handleLoadSchema}
              handleOpenShareSchema={handleOpenShareSchema}
              handleTriggerSaveModal={handleTriggerSaveModal}
              hasActiveMatch={hasActiveMatch}
              isModernSleek={isModernSleek}
              isProOrAdmin={isProOrAdmin}
              isSchemasSectionCollapsed={isSchemasSectionCollapsed}
              savedTactics={savedTactics}
              schemaBelongsToMatch={schemaBelongsToMatch}
              setConfirmDeleteSchemaId={setConfirmDeleteSchemaId}
              setIsCheckoutOpen={setIsCheckoutOpen}
              setIsSchemasSectionCollapsed={setIsSchemasSectionCollapsed}
              setSleekToastMessage={setSleekToastMessage}
            />

            <TacticalNotesSection
              handleLockedNotesClick={handleLockedNotesClick}
              handleToggleMicRecording={handleToggleMicRecording}
              isModernSleek={isModernSleek}
              isNotesSectionCollapsed={isNotesSectionCollapsed}
              isProOrAdmin={isProOrAdmin}
              isRecordingVoice={isRecordingVoice}
              quickNote={quickNote}
              setIsNotesExpanded={setIsNotesExpanded}
              setIsNotesSectionCollapsed={setIsNotesSectionCollapsed}
              setQuickNote={setQuickNote}
              setSpeechError={setSpeechError}
              setTacticalNotes={setTacticalNotes}
              speechError={speechError}
              t={t}
              tacticalNotes={tacticalNotes}
            />

          </div>

          {/* Export PDF du match (schémas + notes tactiques) — réservé PRO & PRO+ */}
          <div className={`p-2 px-3 shrink-0 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
            <button
              type="button"
              onClick={handleExportMatchPdf}
              disabled={isExportingMatchPdf}
              className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#00E599] hover:bg-[#00cc88] text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm transition cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              title={isProOrAdmin ? "Exporter le match en PDF : schémas et notes tactiques" : "Réservé aux formules PRO & PRO+"}
            >
              {isExportingMatchPdf ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : isProOrAdmin ? (
                <FileText className="h-4 w-4 shrink-0" />
              ) : (
                <Lock className="h-4 w-4 shrink-0" />
              )}
              <span>{isExportingMatchPdf ? "Export en cours…" : "Exporter le match en PDF"}</span>
            </button>
          </div>

          {/* Quick coaching quotes footer watermark */}
          <div className={`p-2 px-3 border-t ${isModernSleek ? "border-slate-200 bg-slate-50" : "border-[#2a2f37]"} text-center`}>
            <p className={`text-[11px] ${isModernSleek ? "text-slate-500" : "text-slate-400"} font-bold uppercase tracking-widest flex items-center justify-between gap-2`}>
              <span>THE BOX FOOTBALL CLUB</span>
            </p>
          </div>

        </aside>

      </div>



      {/* ========================================================= */}
      {/* 4. STRIPE PREMIUM SUBSCRIPTION PLANS POPUP MODAL */}
      {/* ========================================================= */}

      {/* ========================================================= */}
      {/* 5. NOTES TACTIQUES EXPAND OVERLAY MODAL */}
      {/* ========================================================= */}
      {isNotesExpanded && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
          <div className={`max-w-3xl w-full rounded-2xl sm:rounded-3xl shadow-2xl relative my-auto flex flex-col h-[75vh] border overflow-hidden ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
            }`}>
            {/* Ambient background glow accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header bar */}
            <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between relative z-10 shrink-0 ${isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#0f141d] border-[#1f293d] text-white"
              }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-[#00E599]/15 border-[#00E599]/30 text-[#00E599]"
                  }`}>
                  <span className="text-base">📝</span>
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-black uppercase tracking-wide ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                    Notes Tactiques Complètes
                  </h3>
                  <p className={`text-[11px] font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                    Consignes d&apos;avant-match, discours et organisation tactique
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNotesExpanded(false)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer shrink-0 ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
                  }`}
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 flex-1 flex flex-col relative z-10">
              <textarea
                value={tacticalNotes}
                readOnly={!isProOrAdmin}
                onClick={!isProOrAdmin ? handleLockedNotesClick : undefined}
                onChange={(e) => { if (isProOrAdmin) setTacticalNotes(e.target.value); }}
                placeholder="Saisissez ici l'intégralité de vos consignes tactiques et physiques de match..."
                className={`flex-1 w-full rounded-xl p-4 text-xs focus:outline-none transition resize-none font-medium leading-relaxed scrollbar-thin border ${isModernSleek
                  ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white"
                  : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                  }`}
              />
            </div>

            <div className={`px-5 sm:px-6 py-3.5 border-t flex items-center justify-end relative z-10 shrink-0 ${isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#090d14] border-[#1f293d]"}`}>
              <button
                onClick={() => setIsNotesExpanded(false)}
                className={`h-10 px-5 rounded-xl font-bold text-xs inline-flex items-center justify-center whitespace-nowrap transition cursor-pointer border ${isModernSleek
                  ? "bg-white hover:bg-slate-200 text-slate-700 border-slate-300 shadow-xs"
                  : "bg-[#162235] hover:bg-[#233350] text-slate-300 border-[#2e3d5b]"
                  }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      <AssistPickerModal
        activeSport={activeSport}
        confirmGoalRecord={confirmGoalRecord}
        currentTokens={currentTokens}
        isModernSleek={isModernSleek}
        opponentSubstitutes={opponentSubstitutes}
        pendingGoalToken={pendingGoalToken}
        pendingScoreAction={pendingScoreAction}
        selectedPasseurName={selectedPasseurName}
        setPendingGoalToken={setPendingGoalToken}
        setPendingScoreAction={setPendingScoreAction}
        setSelectedPasseurName={setSelectedPasseurName}
        substitutes={substitutes}
      />
      <MatchListModal
        activeMatchId={activeMatchId}
        activeTeamId={activeTeamId}
        editingMatchId={editingMatchId}
        handleAddNewMatch={handleAddNewMatch}
        handleDeleteMatchFromList={handleDeleteMatchFromList}
        isMatchEditOpen={isMatchEditOpen}
        isModernSleek={isModernSleek}
        isProOrAdmin={isProOrAdmin}
        matchesList={matchesList}
        matchSearchQuery={matchSearchQuery}
        matchTeamFilter={matchTeamFilter}
        pth={pth}
        selectMatch={selectMatch}
        setEditingMatchId={setEditingMatchId}
        setIsCheckoutOpen={setIsCheckoutOpen}
        setIsMatchEditOpen={setIsMatchEditOpen}
        setMatchSearchQuery={setMatchSearchQuery}
        setMatchTeamFilter={setMatchTeamFilter}
        setSleekToastMessage={setSleekToastMessage}
        teams={teams}
        updateMatchById={updateMatchById}
      />
      <MatchFinishedModal
        activeMatch={activeMatch}
        activeMatchId={activeMatchId}
        activeSport={activeSport}
        awayScore={awayScore}
        formatLiveTime={formatLiveTime}
        handleExportModalWindowImage={handleExportModalWindowImage}
        handleSaveTacticState={handleSaveTacticState}
        handleShareMatchWhatsApp={handleShareMatchWhatsApp}
        hasActiveMatch={hasActiveMatch}
        homeScore={homeScore}
        isExportingModalScreen={isExportingModalScreen}
        isMatchFinishedModalOpen={isMatchFinishedModalOpen}
        isModernSleek={isModernSleek}
        isSaveAnimationMode={isSaveAnimationMode}
        isSaveModalOpen={isSaveModalOpen}
        keyframes={keyframes}
        liveTimerSeconds={liveTimerSeconds}
        matchesList={matchesList}
        matchEvents={matchEvents}
        matchFinishedModalRef={matchFinishedModalRef}
        pth={pth}
        saveSuccess={saveSuccess}
        saveTacticMatchId={saveTacticMatchId}
        selectedFormationA={selectedFormationA}
        setIsLiveMatchMode={setIsLiveMatchMode}
        setIsMatchFinishedModalOpen={setIsMatchFinishedModalOpen}
        setIsSaveModalOpen={setIsSaveModalOpen}
        setSaveTacticMatchId={setSaveTacticMatchId}
        setTacticDesc={setTacticDesc}
        setTacticName={setTacticName}
        tacticDesc={tacticDesc}
        tacticName={tacticName}
        updateMatchById={updateMatchById}
      />
      <MultiTeamManagerModal
        activeSport={activeSport}
        activeTeamId={activeTeamId}
        getNewTeamDraft={getNewTeamDraft}
        getRosterForTeam={getRosterForTeam}
        handleChangeTeamFormat={handleChangeTeamFormat}
        handleCreateNewTeam={handleCreateNewTeam}
        handleDeleteTeam={handleDeleteTeam}
        handleNewTeamPlayerPhoto={handleNewTeamPlayerPhoto}
        handleSelectTeam={handleSelectTeam}
        isModernSleek={isModernSleek}
        isMultiTeamModalOpen={isMultiTeamModalOpen}
        isProOrAdmin={isProOrAdmin}
        newTeamCategory={newTeamCategory}
        newTeamFormat={newTeamFormat}
        newTeamName={newTeamName}
        pth={pth}
        renderTeamRosterEditor={renderTeamRosterEditor}
        rosterEditTeamId={rosterEditTeamId}
        savedTactics={savedTactics}
        setIsMultiTeamModalOpen={setIsMultiTeamModalOpen}
        setNewTeamCategory={setNewTeamCategory}
        setNewTeamFormat={setNewTeamFormat}
        setNewTeamName={setNewTeamName}
        setNewTeamSquadSize={setNewTeamSquadSize}
        setRosterEditTeamId={setRosterEditTeamId}
        teamInitials={teamInitials}
        teams={teams}
        updateNewTeamPlayer={updateNewTeamPlayer}
      />
      <MultiTeamUpgradeModal
        isModernSleek={isModernSleek}
        isMultiTeamUpgradeModalOpen={isMultiTeamUpgradeModalOpen}
        onOpenTrialModal={onOpenTrialModal}
        setIsMultiTeamUpgradeModalOpen={setIsMultiTeamUpgradeModalOpen}
      />
      <LiveShareModals
        activeLivePublicId={activeLivePublicId}
        activeMatch={activeMatch}
        activeTeamId={activeTeamId}
        handlePublishActiveLive={handlePublishActiveLive}
        handleRegenerateLiveEditor={handleRegenerateLiveEditor}
        handleRevokeLiveEditor={handleRevokeLiveEditor}
        isClubTeamName={isClubTeamName}
        isLiveMatchUpgradeModalOpen={isLiveMatchUpgradeModalOpen}
        isLiveShareOpen={isLiveShareOpen}
        isMatchConvocationOpen={isMatchConvocationOpen}
        isModernSleek={isModernSleek}
        liveClubName={liveClubName}
        liveClubSlug={liveClubSlug}
        liveEditorAccess={liveEditorAccess}
        liveShareBusy={liveShareBusy}
        liveShareError={liveShareError}
        matchConvocationGroup={matchConvocationGroup}
        onOpenTrialModal={onOpenTrialModal}
        setIsLiveMatchUpgradeModalOpen={setIsLiveMatchUpgradeModalOpen}
        setIsLiveShareOpen={setIsLiveShareOpen}
        setIsMatchConvocationOpen={setIsMatchConvocationOpen}
        setSleekToastMessage={setSleekToastMessage}
        teams={teams}
      />
      <OpponentRosterModal
        currentFrameIdx={currentFrameIdx}
        currentTokens={currentTokens}
        getAvailableNumbersForOpponent={getAvailableNumbersForOpponent}
        handleAddOpponent={handleAddOpponent}
        isModernSleek={isModernSleek}
        isOpponentRosterModalOpen={isOpponentRosterModalOpen}
        setIsOpponentRosterModalOpen={setIsOpponentRosterModalOpen}
        setKeyframes={setKeyframes}
      />
      {/* 9. SINGLE TOKEN QUICK EDIT & SUBSTITUTION (NOW INLINE BELOW PITCH) */}
      {/* ========================================================= */}

      <PlayerLinkToolbar
        activeTool={activeTool}
        commitLink={commitLink}
        isModernSleek={isModernSleek}
        linkColor={linkColor}
        linkDashed={linkDashed}
        linkDraft={linkDraft}
        setActiveTool={setActiveTool}
        setLinkColor={setLinkColor}
        setLinkDashed={setLinkDashed}
        setLinkDraft={setLinkDraft}
      />

      <WallSettingsPanel
        activeMatch={activeMatch}
        findWall={findWall}
        handleAutoFillWall={handleAutoFillWall}
        handlePlaceWall={handlePlaceWall}
        handleReleaseFromWall={handleReleaseFromWall}
        handleRemoveWall={handleRemoveWall}
        handleSetWallAngle={handleSetWallAngle}
        handleSetWallCount={handleSetWallCount}
        isFootballBoard={isFootballBoard}
        isModernSleek={isModernSleek}
        setSubPickerToken={setSubPickerToken}
        setWallPopover={setWallPopover}
        wallAngleOf={wallAngleOf}
        wallCountFor={wallCountFor}
        wallMembers={wallMembers}
        wallPopover={wallPopover}
      />

      {/* ========================================================= */}
      <SquadManagementModal
        activeMatch={activeMatch}
        activeSport={activeSport}
        activeTeam={activeTeam}
        activeTeamId={activeTeamId}
        autoTransparentCache={autoTransparentCache}
        countSportRoles={countSportRoles}
        currentTokens={currentTokens}
        findWall={findWall}
        getAvailableNumbersForPlayer={getAvailableNumbersForPlayer}
        getRosterForTeam={getRosterForTeam}
        getSportCommonPositions={getSportCommonPositions}
        handleAddNewSubstitute={handleAddNewSubstitute}
        handleApplyTeamRosterToGroup={handleApplyTeamRosterToGroup}
        handleAssignUniqueNumber={handleAssignUniqueNumber}
        handleAutoAssignSetPieces={handleAutoAssignSetPieces}
        handleAutoFillWall={handleAutoFillWall}
        handleAutoRenumberSquad={handleAutoRenumberSquad}
        handleDeleteRosterPlayer={handleDeleteRosterPlayer}
        handleDeleteStarter={handleDeleteStarter}
        handleDeleteSubstitute={handleDeleteSubstitute}
        handleExecuteDirectTransfer={handleExecuteDirectTransfer}
        handleExecuteInterTeamSwap={handleExecuteInterTeamSwap}
        handleMoveToReserve={handleMoveToReserve}
        handleOpenInterTeamSwap={handleOpenInterTeamSwap}
        handlePlaceWall={handlePlaceWall}
        handlePlayerPhotoUpload={handlePlayerPhotoUpload}
        handleReleaseFromWall={handleReleaseFromWall}
        handleRemovePlayerPhoto={handleRemovePlayerPhoto}
        handleReserveToBench={handleReserveToBench}
        handleSaveGroupAsTeamRoster={handleSaveGroupAsTeamRoster}
        handleSetWallCount={handleSetWallCount}
        handleToggleStarterSubstitute={handleToggleStarterSubstitute}
        handleUpdatePitchPlayer={handleUpdatePitchPlayer}
        handleUpdateSubstitute={handleUpdateSubstitute}
        isFootballBoard={isFootballBoard}
        isInterTeamSwapOpen={isInterTeamSwapOpen}
        isModernSleek={isModernSleek}
        isProOrAdmin={isProOrAdmin}
        isSetPiecesOpen={isSetPiecesOpen}
        opponentSetPieceRoles={opponentSetPieceRoles}
        opponentSubstitutes={opponentSubstitutes}
        rolesTargetTeam={rolesTargetTeam}
        rosterFilter={rosterFilter}
        rosterPositionFilter={rosterPositionFilter}
        rosterSearchQuery={rosterSearchQuery}
        setIsInterTeamSwapOpen={setIsInterTeamSwapOpen}
        setIsSetPiecesOpen={setIsSetPiecesOpen}
        setOpponentSetPieceRoles={setOpponentSetPieceRoles}
        setPieceRoles={setPieceRoles}
        setRosterFilter={setRosterFilter}
        setRosterPositionFilter={setRosterPositionFilter}
        setRosterSearchQuery={setRosterSearchQuery}
        setSetPieceRoles={setSetPieceRoles}
        setSwapNotification={setSwapNotification}
        setSwapPositionFilter={setSwapPositionFilter}
        setSwapSearchQuery={setSwapSearchQuery}
        setSwapSourcePlayer={setSwapSourcePlayer}
        setSwapTargetPlayerId={setSwapTargetPlayerId}
        setSwapTargetTeamId={setSwapTargetTeamId}
        setTeamRolesModalTab={setTeamRolesModalTab}
        substitutes={substitutes}
        swapNotification={swapNotification}
        swapPositionFilter={swapPositionFilter}
        swapSearchQuery={swapSearchQuery}
        swapSourcePlayer={swapSourcePlayer}
        swapTargetPlayerId={swapTargetPlayerId}
        swapTargetTeamId={swapTargetTeamId}
        teamRolesModalTab={teamRolesModalTab}
        teamRostersMap={teamRostersMap}
        teams={teams}
        updateRosterPlayer={updateRosterPlayer}
        wallCountFor={wallCountFor}
        wallMembers={wallMembers}
      />
      <Squad3DExportModal
        activeFormat={activeFormat}
        activeMatch={activeMatch}
        activeSport={activeSport}
        autoTransparentCache={autoTransparentCache}
        cardTheme={cardTheme}
        clubLogo={clubLogo}
        currentTokens={currentTokens}
        displayClubTitle={displayClubTitle}
        handleDownloadSquad3DImage={handleDownloadSquad3DImage}
        handleOpenShareSquad3D={handleOpenShareSquad3D}
        isModernSleek={isModernSleek}
        setCardTheme={setCardTheme}
        setShowSquad3DModal={setShowSquad3DModal}
        setSquad3DOrientation={setSquad3DOrientation}
        setSquad3DPitchScale={setSquad3DPitchScale}
        setSquad3DPlayerScale={setSquad3DPlayerScale}
        setSquad3DPlayerStyle={setSquad3DPlayerStyle}
        showClubLogoOnPitch={showClubLogoOnPitch}
        showSquad3DModal={showSquad3DModal}
        squad3DOrientation={squad3DOrientation}
        squad3DPitchScale={squad3DPitchScale}
        squad3DPlayerScale={squad3DPlayerScale}
        squad3DPlayerStyle={squad3DPlayerStyle}
        squad3DRef={squad3DRef}
      />
      <UserSettingsModal
        activePlan={activePlan}
        blockedSports={blockedSports}
        clubLogoError={clubLogoError}
        currentLang={currentLang}
        deleteAccountConfirm={deleteAccountConfirm}
        deleteAccountError={deleteAccountError}
        editClub={editClub}
        editClubLogo={editClubLogo}
        editEmail={editEmail}
        editFirstName={editFirstName}
        editLanguage={editLanguage}
        editLastName={editLastName}
        editRole={editRole}
        editShowLogoOnPitch={editShowLogoOnPitch}
        editSport={editSport}
        handleCancelAccountDeletion={handleCancelAccountDeletion}
        handleDeleteOwnAccount={handleDeleteOwnAccount}
        handleSaveUserConfig={handleSaveUserConfig}
        isDeleteAccountOpen={isDeleteAccountOpen}
        isDeletingAccount={isDeletingAccount}
        isModernSleek={isModernSleek}
        isUserAdmin={isUserAdmin}
        isUserConfigModalOpen={isUserConfigModalOpen}
        scheduledDeletionAt={scheduledDeletionAt}
        setActivePlan={setActivePlan}
        setClubLogoError={setClubLogoError}
        setDeleteAccountConfirm={setDeleteAccountConfirm}
        setDeleteAccountError={setDeleteAccountError}
        setEditClub={setEditClub}
        setEditClubLogo={setEditClubLogo}
        setEditEmail={setEditEmail}
        setEditFirstName={setEditFirstName}
        setEditLanguage={setEditLanguage}
        setEditLastName={setEditLastName}
        setEditRole={setEditRole}
        setEditShowLogoOnPitch={setEditShowLogoOnPitch}
        setEditSport={setEditSport}
        setIsCheckoutOpen={setIsCheckoutOpen}
        setIsDeleteAccountOpen={setIsDeleteAccountOpen}
        setIsUserConfigModalOpen={setIsUserConfigModalOpen}
        setUserConfigSection={setUserConfigSection}
        t={t}
        toggleModernSleek={toggleModernSleek}
        userConfigSection={userConfigSection}
      />
      {/* Share Modal (Schemas & 3D Card View) */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        data={shareData}
        userEmail={activeCoach?.email}
        userName={activeCoach ? `${activeCoach.firstName} ${activeCoach.lastName}` : undefined}
        isModernSleek={isModernSleek}
      />

      {/* MODALE CHECKOUT / ABONNEMENTS */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl sm:rounded-3xl p-6 shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"}`}>
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className={`flex items-center justify-between border-b pb-4 mb-6 relative z-10 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shadow-inner ${isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-gradient-to-br from-[#00E599]/20 to-emerald-600/30 border-[#00E599]/40 text-[#00E599]"
                  }`}>
                  💳
                </div>
                <div>
                  <h3 className={`text-base font-black uppercase tracking-wider ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                    ABONNEMENTS & FORMULES THE BOX
                  </h3>
                  <p className={`text-xs font-bold ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                    Choisissez l&apos;offre adaptée à votre club ou staff technique.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className={`w-9 h-9 flex items-center justify-center font-bold rounded-xl cursor-pointer transition shrink-0 ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
                  }`}
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-10">
              <SubscriptionPlans
                activePlan={activePlan}
                setActivePlan={(plan) => {
                  setActivePlan(plan);
                  setIsCheckoutOpen(false);
                }}
                coachId={activeCoach?.id}
                coachEmail={activeCoach?.email}
                coachName={activeCoach?.firstName ? `${activeCoach.firstName} ${activeCoach.lastName}` : undefined}
                isModernSleek={isModernSleek}
              />
            </div>

            <div className={`mt-6 pt-4 border-t flex items-center justify-end relative z-10 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className={`h-10 px-5 rounded-xl font-bold text-xs inline-flex items-center justify-center transition border cursor-pointer whitespace-nowrap ${isModernSleek
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                  : "bg-[#161c28] hover:bg-[#1e2738] text-slate-200 border-[#233149]"
                  }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDE UTILISATEUR MODAL */}
      <UserGuideModal
        isOpen={isUserGuideModalOpen}
        onClose={() => setIsUserGuideModalOpen(false)}
        isModernSleek={isModernSleek}
        isAdmin={isUserAdmin}
      />

    </div>
  );
}
