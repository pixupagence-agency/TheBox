"use client";

import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { toPng } from "html-to-image";
import Pitch from "./Pitch";
import SportIcon from "./SportIcon";
import LogoIcon from "./LogoIcon";
import TrialCountdownModal, { calculateTrialRemaining, TrialTimeRemaining } from "./TrialCountdownModal";
import ShareModal, { ShareData } from "./ShareModal";
import SubscriptionPlans from "./SubscriptionPlans";
import { PWAInstallButton } from "./PWAInstallButton";
import { 
  Play, Pause, Plus, Trash2, ChevronLeft, ChevronRight, 
  RotateCcw, Pencil, Sparkles, Save, UserPlus, UserMinus, RefreshCw, Shield, CheckCircle, Check, 
  Download, Share2, Maximize2, Minimize2, Laptop, Smartphone,
  MousePointer, Move, ArrowUpRight, Settings, Info, FileText, Camera,
  Mic, Trash, Eye, Globe, LogOut, ChevronDown, Award, Eraser, Lock, X, User, Users,
  Search, UserCheck, Upload, ArrowLeftRight, Zap, AlertCircle, Cloud, Filter, Film,
  Video, CircleDot, ZoomIn, Map, Hash, Minus, Columns
} from "lucide-react";
import { saveTacticToFirestore, deleteTacticFromFirestore } from "@/lib/firebase";

export interface Token {
  id: string;
  type: "player_a" | "player_b" | "referee" | "ball" | "cone" | "goal" | "hurdle" | "ladder";
  number?: number;
  name: string;
  role: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color?: string;
  photo?: string;
  status?: "excellent" | "tired" | "injured" | "normal" | "suspended" | "red_card";
  removalReason?: string;
  yellowCards?: number;
}

export interface DrawingAction {
  tool: "brush" | "arrow-direct" | "arrow-deep" | "arrow-run" | "shape-circle" | "shape-rect" | "shape-line" | "shape-dashed-line" | "eraser";
  color: string;
  size: number;
  points: { x: number; y: number }[]; // percentages 0-100
}

export interface SetPieceRoleConfig {
  captain: string;           // Capitaine (👑)
  penaltyTaker: string;      // Penalty (11m ⚽)
  directFreeKick: string;    // Coup Franc Direct (⚡)
  offCenterFKLeft: string;   // Coup Franc Excentré Gauche (↪️)
  offCenterFKRight: string;  // Coup Franc Excentré Droit (↩️)
  cornerLeft: string;        // Corner Gauche (🚩)
  cornerRight: string;       // Corner Droit (🚩)
}

export const defaultSetPieceRoles: SetPieceRoleConfig = {
  captain: "",
  penaltyTaker: "",
  directFreeKick: "",
  offCenterFKLeft: "",
  offCenterFKRight: "",
  cornerLeft: "",
  cornerRight: "",
};

const getSportRatioNum = (sport: string): number => {
  if (sport === "basketball") return 28 / 15; // 1.866 (matches 28x15 viewBox)
  if (sport === "rugby") return 144 / 70; // 2.057 (matches 144x70 viewBox)
  if (sport === "handball") return 40 / 20; // 2.0 (matches 40x20 viewBox)
  return 110 / 73; // football standard FIFA ratio with 2.5m perimeter (~1.5068, matches 110x73 viewBox exactly)
};

interface CoachProfile {
  id: string;
  lastName: string;
  firstName: string;
  club: string;
  role: string;
  preferredSport: string;
  email: string;
  isAdmin?: boolean;
  createdAt?: string;
  trialBonusDays?: number;
}

export interface TeamCategory {
  id: string;
  name: string;
  category: string;
  color?: string;
  isDefault?: boolean;
}

export interface TeamRosterPlayer {
  id: string;
  name: string;
  role: string;
  number: number;
  status?: "normal" | "excellent" | "tired" | "injured" | "suspended";
  photo?: string;
  isStarter?: boolean;
}

export const defaultManagedTeamRosters: Record<string, TeamRosterPlayer[]> = {
  team_1: [
    { id: "t1_p1", name: "Marc-André ter Stegen", role: "GB", number: 1, status: "normal", isStarter: true },
    { id: "t1_p2", name: "Jules Koundé", role: "DD", number: 23, status: "excellent", isStarter: true },
    { id: "t1_p3", name: "Ronald Araújo", role: "DC", number: 4, status: "normal", isStarter: true },
    { id: "t1_p4", name: "Pau Cubarsí", role: "DC", number: 2, status: "excellent", isStarter: true },
    { id: "t1_p5", name: "Alejandro Balde", role: "DG", number: 3, status: "excellent", isStarter: true },
    { id: "t1_p6", name: "Frenkie de Jong", role: "MDC", number: 21, status: "normal", isStarter: true },
    { id: "t1_p7", name: "Pedri", role: "MC", number: 8, status: "excellent", isStarter: true },
    { id: "t1_p8", name: "Dani Olmo", role: "MOC", number: 20, status: "excellent", isStarter: true },
    { id: "t1_p9", name: "Lamine Yamal", role: "AiD", number: 19, status: "excellent", isStarter: true },
    { id: "t1_p10", name: "Robert Lewandowski", role: "BU", number: 9, status: "excellent", isStarter: true },
    { id: "t1_p11", name: "Raphinha", role: "AiG", number: 11, status: "excellent", isStarter: true },
    { id: "t1_p12", name: "Gavi", role: "MC", number: 6, status: "excellent", isStarter: false },
    { id: "t1_p13", name: "Ansu Fati", role: "AC", number: 10, status: "normal", isStarter: false },
    { id: "t1_p14", name: "Ferran Torres", role: "AC", number: 7, status: "normal", isStarter: false },
    { id: "t1_p15", name: "Iñigo Martínez", role: "DC", number: 5, status: "normal", isStarter: false },
    { id: "t1_p16", name: "Fermín López", role: "MC", number: 16, status: "excellent", isStarter: false },
    { id: "t1_p17", name: "Pablo Torre", role: "MC", number: 14, status: "normal", isStarter: false },
    { id: "t1_p18", name: "Pau Víctor", role: "AC", number: 18, status: "normal", isStarter: false },
    { id: "t1_p19", name: "Eric García", role: "DC", number: 24, status: "injured", isStarter: false },
    { id: "t1_p20", name: "Héctor Fort", role: "DD", number: 32, status: "normal", isStarter: false },
  ],
  team_2: [
    { id: "t2_p1", name: "Diego Kochen", role: "GB", number: 1, status: "normal", isStarter: true },
    { id: "t2_p2", name: "Landry Farré", role: "DD", number: 2, status: "normal", isStarter: true },
    { id: "t2_p3", name: "Alexis Olmedo", role: "DC", number: 4, status: "normal", isStarter: true },
    { id: "t2_p4", name: "Eman Kospo", role: "DC", number: 5, status: "normal", isStarter: true },
    { id: "t2_p5", name: "Álvaro Cortés", role: "DG", number: 3, status: "normal", isStarter: true },
    { id: "t2_p6", name: "Marc Bernal", role: "MDC", number: 6, status: "excellent", isStarter: true },
    { id: "t2_p7", name: "Aleix Garrido", role: "MC", number: 8, status: "normal", isStarter: true },
    { id: "t2_p8", name: "Unai Hernández", role: "MOC", number: 10, status: "excellent", isStarter: true },
    { id: "t2_p9", name: "Noah Darvich", role: "AiD", number: 19, status: "excellent", isStarter: true },
    { id: "t2_p10", name: "Toni Fernández", role: "BU", number: 7, status: "excellent", isStarter: true },
    { id: "t2_p11", name: "Dani Rodríguez", role: "AiG", number: 11, status: "normal", isStarter: true },
    { id: "t2_p12", name: "Jan Virgili", role: "BU", number: 9, status: "normal", isStarter: false },
    { id: "t2_p13", name: "Pau Prim", role: "MDC", number: 14, status: "normal", isStarter: false },
    { id: "t2_p14", name: "Trilli", role: "DD", number: 12, status: "normal", isStarter: false },
    { id: "t2_p15", name: "Edu Sánchez", role: "DG", number: 15, status: "normal", isStarter: false },
    { id: "t2_p16", name: "Aron Yaakobishvili", role: "GB", number: 13, status: "normal", isStarter: false },
  ],
  team_3: [
    { id: "t3_p1", name: "Max Bonfill", role: "GB", number: 1, status: "normal", isStarter: true },
    { id: "t3_p2", name: "Xavi Espart", role: "DD", number: 2, status: "normal", isStarter: true },
    { id: "t3_p3", name: "Alexander Walton", role: "DC", number: 5, status: "normal", isStarter: true },
    { id: "t3_p4", name: "Leo Saca", role: "DC", number: 4, status: "normal", isStarter: true },
    { id: "t3_p5", name: "Guillem Víctor", role: "DG", number: 3, status: "normal", isStarter: true },
    { id: "t3_p6", name: "Pedro Soma", role: "MDC", number: 6, status: "normal", isStarter: true },
    { id: "t3_p7", name: "Brian Fariñas", role: "MC", number: 8, status: "normal", isStarter: true },
    { id: "t3_p8", name: "Ebrima Tunkara", role: "MOC", number: 10, status: "excellent", isStarter: true },
    { id: "t3_p9", name: "Nil Calderó", role: "AiD", number: 7, status: "normal", isStarter: true },
    { id: "t3_p10", name: "Shane Kluivert", role: "BU", number: 9, status: "excellent", isStarter: true },
    { id: "t3_p11", name: "Juan Hernández", role: "AiG", number: 11, status: "excellent", isStarter: true },
    { id: "t3_p12", name: "Quim Junyent", role: "MC", number: 16, status: "normal", isStarter: false },
    { id: "t3_p13", name: "Sama Nomoko", role: "AiD", number: 17, status: "normal", isStarter: false },
    { id: "t3_p14", name: "Jofre Torrents", role: "DG", number: 18, status: "normal", isStarter: false },
    { id: "t3_p15", name: "Lorenzo Oertli", role: "DC", number: 12, status: "normal", isStarter: false },
    { id: "t3_p16", name: "Gerard Valls", role: "GB", number: 13, status: "normal", isStarter: false },
  ],
  team_4: [
    { id: "t4_p1", name: "Cata Coll", role: "GB", number: 1, status: "excellent", isStarter: true },
    { id: "t4_p2", name: "Ona Batlle", role: "DD", number: 2, status: "excellent", isStarter: true },
    { id: "t4_p3", name: "Irene Paredes", role: "DC", number: 4, status: "normal", isStarter: true },
    { id: "t4_p4", name: "Mapi León", role: "DC", number: 5, status: "excellent", isStarter: true },
    { id: "t4_p5", name: "Fridolina Rolfö", role: "DG", number: 16, status: "normal", isStarter: true },
    { id: "t4_p6", name: "Patri Guijarro", role: "MDC", number: 12, status: "excellent", isStarter: true },
    { id: "t4_p7", name: "Aitana Bonmatí", role: "MC", number: 14, status: "excellent", isStarter: true },
    { id: "t4_p8", name: "Alexia Putellas", role: "MOC", number: 11, status: "excellent", isStarter: true },
    { id: "t4_p9", name: "Caroline Graham Hansen", role: "AiD", number: 10, status: "excellent", isStarter: true },
    { id: "t4_p10", name: "Ewa Pajor", role: "BU", number: 9, status: "excellent", isStarter: true },
    { id: "t4_p11", name: "Salma Paralluelo", role: "AiG", number: 7, status: "excellent", isStarter: true },
    { id: "t4_p12", name: "Claudia Pina", role: "AC", number: 6, status: "normal", isStarter: false },
    { id: "t4_p13", name: "Vicky López", role: "MOC", number: 19, status: "excellent", isStarter: false },
    { id: "t4_p14", name: "Sydney Schertenleib", role: "MC", number: 8, status: "normal", isStarter: false },
    { id: "t4_p15", name: "Marta Torrejón", role: "DC", number: 3, status: "normal", isStarter: false },
    { id: "t4_p16", name: "Gemma Font", role: "GB", number: 13, status: "normal", isStarter: false },
  ]
};

export const generateDefaultRosterForCustomTeam = (teamId: string, teamName: string, category: string): TeamRosterPlayer[] => {
  const isFemale = category.toLowerCase().includes("féminin") || teamName.toLowerCase().includes("féminin");
  const isYouth = category.toLowerCase().includes("jeune") || category.toLowerCase().includes("u19") || category.toLowerCase().includes("u17") || category.toLowerCase().includes("formation");
  
  const prefix = isYouth ? "U-" : isFemale ? "F-" : "J-";
  const defaultRoles = [
    { num: 1, role: "GB", starter: true },
    { num: 2, role: "DD", starter: true },
    { num: 3, role: "DG", starter: true },
    { num: 4, role: "DC", starter: true },
    { num: 5, role: "DC", starter: true },
    { num: 6, role: "MDC", starter: true },
    { num: 8, role: "MC", starter: true },
    { num: 10, role: "MOC", starter: true },
    { num: 7, role: "AiD", starter: true },
    { num: 9, role: "BU", starter: true },
    { num: 11, role: "AiG", starter: true },
    { num: 12, role: "DD", starter: false },
    { num: 14, role: "MC", starter: false },
    { num: 15, role: "DG", starter: false },
    { num: 16, role: "GB", starter: false },
    { num: 18, role: "AC", starter: false },
  ];

  return defaultRoles.map((r, idx) => ({
    id: `${teamId}_p${idx + 1}`,
    name: `${teamName.split(" ")[0]} ${prefix}${idx + 1}`,
    role: r.role,
    number: r.num,
    status: idx === 7 || idx === 9 ? ("excellent" as const) : ("normal" as const),
    isStarter: r.starter,
  }));
};

const defaultTeams: TeamCategory[] = [
  { id: "team_1", name: "Séniors A (Fanion)", category: "Séniors", color: "#00E599", isDefault: true },
  { id: "team_2", name: "Séniors B (Réserve)", category: "Séniors", color: "#f59e0b" },
  { id: "team_3", name: "U19 Régional 1", category: "Jeunes / U19", color: "#3b82f6" },
  { id: "team_4", name: "Équipe Féminine", category: "Féminines", color: "#ec4899" },
];

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
  onOpenAdminPlatform?: () => void;
  onOpenTrialModal?: () => void;
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
  onOpenTutorial,
  onOpenLegalModal,
  isFirstLogin,
  onCompleteFirstLogin,
  onOpenSupportModal
}: TacticsBoardProps) {
  
  // Active coach helper & live trial calculation
  const activeCoach = coaches.find(c => c.id === activeCoachId) || coaches[0];
  const [liveTrialStatus, setLiveTrialStatus] = useState<TrialTimeRemaining>(() =>
    calculateTrialRemaining(activeCoach?.createdAt, activeCoach?.trialBonusDays || 0)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTrialStatus(calculateTrialRemaining(activeCoach?.createdAt, activeCoach?.trialBonusDays || 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCoach?.createdAt, activeCoach?.trialBonusDays]);

  const isUserAdmin = Boolean(
    isAdmin ||
    activeCoach?.isAdmin ||
    activeCoach?.email?.toLowerCase().includes("pixup") ||
    activeCoach?.email?.toLowerCase() === "pixup.agence@gmail.com"
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

  const isProPlusOrAdmin = Boolean(
    isUserAdmin ||
    currentPlan === "pro_plus" ||
    currentPlan === "club" ||
    currentPlan === "annuel" ||
    (!isPaidSubscriber && liveTrialStatus && !liveTrialStatus.isExpired)
  );

  const isProOrAdmin = Boolean(
    isProPlusOrAdmin ||
    currentPlan === "pro" ||
    currentPlan === "mensuel" ||
    (!isPaidSubscriber && liveTrialStatus && !liveTrialStatus.isExpired)
  );

  // Team configurations
  const [teamAColor, setTeamAColor] = useState("#00E599"); // Neon Emerald
  const [teamBColor, setTeamBColor] = useState("#ef4444"); // Red

  // Sport-specific default player generators & formation helpers
  const getDefaultPlayersForSport = (sport: string): Token[] => {
    switch (sport) {
      case "basketball":
        return [
          { id: "a1", type: "player_a", number: 1, name: "Meneur", role: "PG", x: 28, y: 50 },
          { id: "a2", type: "player_a", number: 2, name: "Arrière", role: "SG", x: 38, y: 22 },
          { id: "a3", type: "player_a", number: 3, name: "Ailier", role: "SF", x: 38, y: 78 },
          { id: "a4", type: "player_a", number: 4, name: "Ailier Fort", role: "PF", x: 42, y: 38 },
          { id: "a5", type: "player_a", number: 5, name: "Pivot", role: "C", x: 42, y: 62 },
          { id: "b1", type: "player_b", number: 1, name: "Meneur Adv", role: "PG", x: 72, y: 50 },
          { id: "b2", type: "player_b", number: 2, name: "Arrière Adv", role: "SG", x: 62, y: 22 },
          { id: "b3", type: "player_b", number: 3, name: "Ailier Adv", role: "SF", x: 62, y: 78 },
          { id: "b4", type: "player_b", number: 4, name: "Ailier Fort Adv", role: "PF", x: 58, y: 38 },
          { id: "b5", type: "player_b", number: 5, name: "Pivot Adv", role: "C", x: 58, y: 62 },
          { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 50, y: 50 },
        ];

      case "rugby":
        return [
          { id: "a1", type: "player_a", number: 1, name: "Pilier G", role: "PIL", x: 40, y: 35 },
          { id: "a2", type: "player_a", number: 2, name: "Talonneur", role: "TAL", x: 40, y: 50 },
          { id: "a3", type: "player_a", number: 3, name: "Pilier D", role: "PIL", x: 40, y: 65 },
          { id: "a4", type: "player_a", number: 4, name: "2e Ligne", role: "2L", x: 33, y: 40 },
          { id: "a5", type: "player_a", number: 5, name: "2e Ligne", role: "2L", x: 33, y: 60 },
          { id: "a6", type: "player_a", number: 6, name: "3e Ligne", role: "3L", x: 28, y: 30 },
          { id: "a7", type: "player_a", number: 7, name: "3e Ligne", role: "3L", x: 28, y: 70 },
          { id: "a8", type: "player_a", number: 8, name: "N°8", role: "N8", x: 25, y: 50 },
          { id: "a9", type: "player_a", number: 9, name: "Demi Mêlée", role: "DM", x: 22, y: 45 },
          { id: "a10", type: "player_a", number: 10, name: "Ouverture", role: "OUV", x: 20, y: 55 },
          { id: "a11", type: "player_a", number: 11, name: "Ailier G", role: "AIL", x: 18, y: 18 },
          { id: "a12", type: "player_a", number: 12, name: "Centre", role: "CEN", x: 18, y: 40 },
          { id: "a13", type: "player_a", number: 13, name: "Centre", role: "CEN", x: 18, y: 60 },
          { id: "a14", type: "player_a", number: 14, name: "Ailier D", role: "AIL", x: 18, y: 82 },
          { id: "a15", type: "player_a", number: 15, name: "Arrière", role: "ARR", x: 8, y: 50 },
          { id: "b1", type: "player_b", number: 1, name: "Pilier G Adv", role: "PIL", x: 60, y: 35 },
          { id: "b2", type: "player_b", number: 2, name: "Talonneur Adv", role: "TAL", x: 60, y: 50 },
          { id: "b3", type: "player_b", number: 3, name: "Pilier D Adv", role: "PIL", x: 60, y: 65 },
          { id: "b4", type: "player_b", number: 4, name: "2e Ligne Adv", role: "2L", x: 67, y: 40 },
          { id: "b5", type: "player_b", number: 5, name: "2e Ligne Adv", role: "2L", x: 67, y: 60 },
          { id: "b6", type: "player_b", number: 6, name: "3e Ligne Adv", role: "3L", x: 72, y: 30 },
          { id: "b7", type: "player_b", number: 7, name: "3e Ligne Adv", role: "3L", x: 72, y: 70 },
          { id: "b8", type: "player_b", number: 8, name: "N°8 Adv", role: "N8", x: 75, y: 50 },
          { id: "b9", type: "player_b", number: 9, name: "Demi Mêlée Adv", role: "DM", x: 78, y: 45 },
          { id: "b10", type: "player_b", number: 10, name: "Ouverture Adv", role: "OUV", x: 80, y: 55 },
          { id: "b11", type: "player_b", number: 11, name: "Ailier G Adv", role: "AIL", x: 82, y: 18 },
          { id: "b12", type: "player_b", number: 12, name: "Centre Adv", role: "CEN", x: 82, y: 40 },
          { id: "b13", type: "player_b", number: 13, name: "Centre Adv", role: "CEN", x: 82, y: 60 },
          { id: "b14", type: "player_b", number: 14, name: "Ailier D Adv", role: "AIL", x: 82, y: 82 },
          { id: "b15", type: "player_b", number: 15, name: "Arrière Adv", role: "ARR", x: 92, y: 50 },
          { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 50, y: 50 },
        ];

      case "handball":
        return [
          { id: "a1", type: "player_a", number: 1, name: "Gardien", role: "GB", x: 8, y: 50 },
          { id: "a2", type: "player_a", number: 2, name: "Ailier G", role: "ALG", x: 32, y: 16 },
          { id: "a3", type: "player_a", number: 3, name: "Arrière G", role: "ARG", x: 30, y: 34 },
          { id: "a4", type: "player_a", number: 4, name: "Demi Centre", role: "DC", x: 28, y: 50 },
          { id: "a5", type: "player_a", number: 5, name: "Pivot", role: "PV", x: 42, y: 50 },
          { id: "a6", type: "player_a", number: 6, name: "Arrière D", role: "ARD", x: 30, y: 66 },
          { id: "a7", type: "player_a", number: 7, name: "Ailier D", role: "ALD", x: 32, y: 84 },
          { id: "b1", type: "player_b", number: 1, name: "Gardien Adv", role: "GB", x: 92, y: 50 },
          { id: "b2", type: "player_b", number: 2, name: "Ailier G Adv", role: "ALG", x: 68, y: 16 },
          { id: "b3", type: "player_b", number: 3, name: "Arrière G Adv", role: "ARG", x: 70, y: 34 },
          { id: "b4", type: "player_b", number: 4, name: "Demi Centre Adv", role: "DC", x: 72, y: 50 },
          { id: "b5", type: "player_b", number: 5, name: "Pivot Adv", role: "PV", x: 58, y: 50 },
          { id: "b6", type: "player_b", number: 6, name: "Arrière D Adv", role: "ARD", x: 70, y: 66 },
          { id: "b7", type: "player_b", number: 7, name: "Ailier D Adv", role: "ALD", x: 68, y: 84 },
          { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 50, y: 50 },
        ];

      case "football":
      default:
        return [
          { id: "a1", type: "player_a", number: 1, name: "Ter Stegen", role: "G", x: 8, y: 50 },
          { id: "a2", type: "player_a", number: 4, name: "Araújo", role: "DC", x: 24, y: 35 },
          { id: "a3", type: "player_a", number: 5, name: "Cubarsí", role: "DC", x: 24, y: 65 },
          { id: "a4", type: "player_a", number: 23, name: "Koundé", role: "DD", x: 28, y: 80 },
          { id: "a5", type: "player_a", number: 3, name: "Balde", role: "DG", x: 28, y: 20 },
          { id: "a6", type: "player_a", number: 21, name: "De Jong", role: "MDC", x: 44, y: 50 },
          { id: "a7", type: "player_a", number: 8, name: "Pedri", role: "MC", x: 55, y: 32 },
          { id: "a8", type: "player_a", number: 20, name: "Dani Olmo", role: "MOC", x: 55, y: 68 },
          { id: "a9", type: "player_a", number: 11, name: "Raphinha", role: "AiG", x: 74, y: 20 },
          { id: "a10", type: "player_a", number: 19, name: "Lamine Yamal", role: "AiD", x: 74, y: 80 },
          { id: "a11", type: "player_a", number: 9, name: "Lewandowski", role: "AC", x: 78, y: 50 },
          { id: "b1", type: "player_b", number: 1, name: "Gardien Adv", role: "G", x: 92, y: 50 },
          { id: "b2", type: "player_b", number: 4, name: "Défenseur Adv", role: "DC", x: 76, y: 35 },
          { id: "b3", type: "player_b", number: 5, name: "Défenseur Adv", role: "DC", x: 76, y: 65 },
          { id: "b4", type: "player_b", number: 2, name: "Latéral Adv", role: "DG", x: 72, y: 80 },
          { id: "b5", type: "player_b", number: 3, name: "Latéral Adv", role: "DD", x: 72, y: 20 },
          { id: "b6", type: "player_b", number: 6, name: "Milieu Adv", role: "MDC", x: 56, y: 50 },
          { id: "b7", type: "player_b", number: 7, name: "Milieu Adv", role: "MC", x: 45, y: 32 },
          { id: "b8", type: "player_b", number: 8, name: "Milieu Adv", role: "MOC", x: 45, y: 68 },
          { id: "b9", type: "player_b", number: 11, name: "Attaquant Adv", role: "AiG", x: 26, y: 20 },
          { id: "b10", type: "player_b", number: 10, name: "Attaquant Adv", role: "AiD", x: 26, y: 80 },
          { id: "b11", type: "player_b", number: 9, name: "Buteur Adv", role: "AC", x: 22, y: 50 },
          { id: "ball", type: "ball", name: "Ballon", role: "Equipement", x: 52, y: 50 },
        ];
    }
  };

  const getAvailableFormationsForSport = (sport: string): string[] => {
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
  const [activeTool, setActiveTool] = useState<"select" | "move" | "line" | "arrow" | "draw" | "settings">("select");
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

  // Viewport Settings
  const [terrainComplet, setTerrainComplet] = useState<boolean>(true);
  const [isAnimationCreatorOpen, setIsAnimationCreatorOpen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
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
  const [cardTheme, setCardTheme] = useState<"gold" | "silver" | "black_special" | "emerald">("gold");
  const [showCardStats, setShowCardStats] = useState<boolean>(true);
  const [squad3DOrientation, setSquad3DOrientation] = useState<"landscape" | "portrait">("landscape");
  const [squad3DPitchScale, setSquad3DPitchScale] = useState<number>(100);
  const squad3DRef = useRef<HTMLDivElement>(null);

  // Share Modal State (Schemas & 3D Card View)
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);

  // Dedicated helper to capture the full 3D Squad Stage without scroll or viewport clipping
  const captureSquad3DDataUrl = async (): Promise<string | null> => {
    if (!squad3DRef.current) return null;
    const node = squad3DRef.current;
    
    // Explicit dimensions matching the exact rendered card bounding box to ensure perfect centering
    const isPortrait = squad3DOrientation === "portrait";
    const rect = node.getBoundingClientRect();
    const width = Math.round(rect.width || node.offsetWidth || (isPortrait ? 540 : 960));
    const height = Math.round(rect.height || node.offsetHeight || (isPortrait ? 820 : 600));

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.98,
        width: width,
        height: height,
        canvasWidth: width * 2,
        canvasHeight: height * 2,
        style: {
          margin: "0",
          transform: "none",
          maxHeight: "none",
          maxWidth: "none",
          height: `${height}px`,
          width: `${width}px`,
          overflow: "visible",
        },
      });
      return dataUrl;
    } catch (err) {
      console.warn("html-to-image failed, falling back to html2canvas...", err);
      try {
        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#0a0f18",
          logging: false,
          width: width,
          height: height,
          scrollX: 0,
          scrollY: 0,
          windowWidth: width,
          windowHeight: height,
          onclone: (clonedDoc, clonedEl) => {
            if (clonedEl) {
              clonedEl.style.height = `${height}px`;
              clonedEl.style.width = `${width}px`;
              clonedEl.style.maxHeight = "none";
              clonedEl.style.maxWidth = "none";
              clonedEl.style.overflow = "visible";
            }
            const styleTags = clonedDoc.querySelectorAll("style");
            styleTags.forEach((style) => {
              if (style.textContent) {
                style.textContent = style.textContent
                  .replace(/oklab\([^)]+\)/g, "rgba(0,0,0,0.5)")
                  .replace(/oklch\([^)]+\)/g, "rgba(0,0,0,0.5)");
              }
            });
          },
        });
        return canvas.toDataURL("image/png");
      } catch (fallbackErr) {
        console.error("3D squad capture error:", fallbackErr);
        return null;
      }
    }
  };

  const handleDownloadSquad3DImage = async () => {
    try {
      const dataUrl = await captureSquad3DDataUrl();
      if (!dataUrl) {
        alert("L'exportation de la vue 3D a rencontré un souci. Veuillez réessayer.");
        return;
      }
      const link = document.createElement("a");
      link.download = `squad_3d_${activeSport}_${squad3DOrientation}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur téléchargement 3D:", err);
      alert("L'exportation de la vue 3D a rencontré un souci. Veuillez réessayer.");
    }
  };

  // Notes state (persisted per active match)
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
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Set-Piece Roles & Captain designations (persisted per active match)
  const [setPieceRoles, setSetPieceRoles] = useState<SetPieceRoleConfig>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_setpiece_roles_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultSetPieceRoles;
  });

  const [opponentSetPieceRoles, setOpponentSetPieceRoles] = useState<SetPieceRoleConfig>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_opp_setpiece_roles_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultSetPieceRoles;
  });

  const [rolesTargetTeam, setRolesTargetTeam] = useState<"home" | "away">("home");
  const [isSetPiecesOpen, setIsSetPiecesOpen] = useState(false);
  const [teamRolesModalTab, setTeamRolesModalTab] = useState<"players" | "setpieces">("players");
  const [rosterSearchQuery, setRosterSearchQuery] = useState<string>("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "starters" | "subs">("all");
  const [rosterPositionFilter, setRosterPositionFilter] = useState<string>("ALL");

  // Tactic Save states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaveAnimationMode, setIsSaveAnimationMode] = useState(false);
  const [tacticName, setTacticName] = useState("");
  const [tacticDesc, setTacticDesc] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDeleteSchemaId, setConfirmDeleteSchemaId] = useState<string | null>(null);

  // Multi-Team Management States (PRO / PRO+ feature)
  const [teams, setTeams] = useState<TeamCategory[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_teams");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return defaultTeams;
  });

  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_active_team_id");
      if (saved) return saved;
    }
    return "team_1";
  });

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [saveTacticMatchId, setSaveTacticMatchId] = useState<string>("");
  const [isMultiTeamModalOpen, setIsMultiTeamModalOpen] = useState(false);
  const [isMultiTeamUpgradeModalOpen, setIsMultiTeamUpgradeModalOpen] = useState(false);
  const [isLiveMatchUpgradeModalOpen, setIsLiveMatchUpgradeModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamCategory, setNewTeamCategory] = useState("Séniors");

  // Persistent Rosters for each team managed by the user
  const [teamRostersMap, setTeamRostersMap] = useState<Record<string, TeamRosterPlayer[]>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_team_rosters");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") return parsed;
        } catch (e) {}
      }
    }
    return defaultManagedTeamRosters;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_team_rosters", JSON.stringify(teamRostersMap));
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
      localStorage.setItem("thebox_teams", JSON.stringify(teams));
    }
  }, [teams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_active_team_id", activeTeamId);
    }
  }, [activeTeamId]);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];

  const handleSelectTeam = (teamId: string) => {
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;

    if (!isProOrAdmin && !target.isDefault) {
      setIsMultiTeamUpgradeModalOpen(true);
      return;
    }

    setActiveTeamId(teamId);
  };

  const handleCreateNewTeam = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isProOrAdmin) {
      setIsMultiTeamUpgradeModalOpen(true);
      return;
    }

    if (!newTeamName.trim()) {
      alert("Veuillez saisir un nom d'équipe (ex: U17 National, Séniors C...).");
      return;
    }

    const newTeamObj: TeamCategory = {
      id: `team_${Date.now()}`,
      name: newTeamName.trim(),
      category: newTeamCategory,
      color: "#00E599",
    };

    const newRoster = generateDefaultRosterForCustomTeam(newTeamObj.id, newTeamObj.name, newTeamObj.category);
    setTeamRostersMap((prev) => ({ ...prev, [newTeamObj.id]: newRoster }));

    setTeams((prev) => [...prev, newTeamObj]);
    setActiveTeamId(newTeamObj.id);
    setNewTeamName("");
  };

  const handleDeleteTeam = (teamId: string) => {
    const target = teams.find((t) => t.id === teamId);
    if (!target) return;
    if (target.isDefault) {
      alert("L'équipe principale par défaut ne peut pas être supprimée.");
      return;
    }

    if (confirm(`Supprimer l'équipe "${target.name}" ?`)) {
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      if (activeTeamId === teamId) {
        setActiveTeamId("team_1");
      }
    }
  };

  // Sidebar Toggles & Resizing State
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_right_sidebar_open");
      if (saved !== null) {
        return saved === "true";
      }
    }
    // En mode gratuit, la colonne de droite (schémas, matchs et notes) est fermée par défaut
    return false;
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
    return 240;
  });
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState<boolean>(false);
  const resizingStartXRef = useRef<number>(0);
  const resizingStartWidthRef = useRef<number>(240);

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
    return true; // Propose the sleek modern design active by default
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

  // User Profile & Sport Configuration Modal State
  const [isUserConfigModalOpen, setIsUserConfigModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editClub, setEditClub] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editSport, setEditSport] = useState(activeSport);

  const handleOpenUserConfig = () => {
    if (activeCoach) {
      setEditFirstName(activeCoach.firstName || "");
      setEditLastName(activeCoach.lastName || "");
      setEditEmail(activeCoach.email || "");
      setEditClub(activeCoach.club || "");
      setEditRole(activeCoach.role || "Coach Principal");
      setEditSport(activeSport || activeCoach.preferredSport || "football");
    }
    setIsUserConfigModalOpen(true);
  };

  const handleSaveUserConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFirstName.trim() || !editLastName.trim()) {
      alert("Veuillez remplir votre prénom et votre nom.");
      return;
    }
    if (!editEmail.trim() || !editEmail.includes("@")) {
      alert("Veuillez saisir une adresse email de connexion valide.");
      return;
    }

    if (!isUserAdmin && blockedSports.includes(editSport)) {
      alert(`Le sport "${editSport.toUpperCase()}" est actuellement bloqué et restreint par l'administration.`);
      return;
    }

    setCoaches((prev) =>
      prev.map((c) =>
        c.id === activeCoachId
          ? {
              ...c,
              firstName: editFirstName.trim(),
              lastName: editLastName.trim(),
              email: editEmail.trim(),
              club: editClub.trim(),
              role: editRole,
              preferredSport: editSport,
            }
          : c
      )
    );

    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_user_email", editEmail.trim());
    }

    setActiveSport(editSport);
    setIsUserConfigModalOpen(false);
    setSleekToastMessage("✅ Profil et adresse email mis à jour avec succès !");
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
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return [
      {
        id: "match_1",
        teamId: "team_1",
        homeTeam: "SÉNIORS A",
        awayTeam: "BORDEAUX FC",
        competition: "RÉGIONAL 1",
        dateTime: "DIM. 25 AVRIL • 15:00"
      },
      {
        id: "match_2",
        teamId: "team_1",
        homeTeam: "SÉNIORS A",
        awayTeam: "PARIS SG (B)",
        competition: "COUPE DE FRANCE",
        dateTime: "MER. 12 MAI • 21:00"
      },
      {
        id: "match_3",
        teamId: "team_2",
        homeTeam: "SÉNIORS B",
        awayTeam: "MARSEILLE (B)",
        competition: "RÉGIONAL 2",
        dateTime: "DIM. 23 MAI • 15:00"
      },
      {
        id: "match_4",
        teamId: "team_3",
        homeTeam: "U19 REGIONAL 1",
        awayTeam: "TOULOUSE FC U19",
        competition: "CHAMPIONNAT U19",
        dateTime: "SAM. 29 MAI • 16:00"
      }
    ];
  });

  const [activeMatchId, setActiveMatchId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_active_match_id");
      if (saved && saved !== "undefined") return saved;
    }
    return "match_1";
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
    filteredMatches[0] ||
    matchesList[0] || {
      id: "match_1",
      teamId: "team_1",
      homeTeam: "SÉNIORS A",
      awayTeam: "BORDEAUX FC",
      competition: "RÉGIONAL 1",
      dateTime: "DIM. 25 AVRIL • 15:00"
    };

  const displayClubTitle = activeMatch?.homeTeam || activeTeam?.name || "MON CLUB";

  // LIVE MATCH Mode State
  const [isLiveMatchMode, setIsLiveMatchMode] = useState<boolean>(false);
  const [isLiveTimerRunning, setIsLiveTimerRunning] = useState<boolean>(false);
  const [isMatchFinishedModalOpen, setIsMatchFinishedModalOpen] = useState<boolean>(false);

  const [currentPeriod, setCurrentPeriod] = useState<"1MT" | "MI-TEMPS" | "2MT" | "FIN">(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved).currentPeriod || "1MT"; } catch (e) {}
      }
    }
    return "1MT";
  });

  const [liveTimerSeconds, setLiveTimerSeconds] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved).liveTimerSeconds || 0; } catch (e) {}
      }
    }
    return 0;
  });

  const [homeScore, setHomeScore] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved).homeScore || 0; } catch (e) {}
      }
    }
    return 0;
  });

  const [awayScore, setAwayScore] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_state_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved).awayScore || 0; } catch (e) {}
      }
    }
    return 0;
  });

  const [matchEvents, setMatchEvents] = useState<Array<{
    id: string;
    time: string;
    period?: string;
    type: "goal" | "assist" | "yellow" | "red" | "sub";
    player: string;
    number?: number;
    team: "home" | "away";
    note?: string;
    assister?: string;
  }>>(() => {
    if (typeof window !== "undefined") {
      const initialMatchId = localStorage.getItem("thebox_active_match_id") || "match_1";
      const saved = localStorage.getItem(`thebox_match_events_${initialMatchId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  // State for Goal Assist Selection Modal
  const [pendingGoalToken, setPendingGoalToken] = useState<Token | null>(null);
  const [selectedPasseurName, setSelectedPasseurName] = useState<string>("");

  // Persist match events per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      localStorage.setItem(`thebox_match_events_${activeMatchId}`, JSON.stringify(matchEvents));
    }
  }, [matchEvents, activeMatchId]);

  // Persist match state (scores, timer & period) per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      localStorage.setItem(
        `thebox_match_state_${activeMatchId}`,
        JSON.stringify({ homeScore, awayScore, liveTimerSeconds, currentPeriod })
      );
    }
  }, [homeScore, awayScore, liveTimerSeconds, currentPeriod, activeMatchId]);

  // Persist active match pitch state (keyframes and drawings) per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId && keyframes.length > 0) {
      localStorage.setItem(
        `thebox_pitch_state_${activeMatchId}`,
        JSON.stringify({ keyframes, drawings: drawingActions })
      );
    }
  }, [keyframes, drawingActions, activeMatchId]);

  // Persist notes per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      localStorage.setItem(`thebox_match_notes_${activeMatchId}`, tacticalNotes);
    }
  }, [tacticalNotes, activeMatchId]);

  // Handle Match Finish & Save to match record
  const handleFinishLiveMatch = (isAuto: boolean = false) => {
    setIsLiveTimerRunning(false);
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
      status: `Terminé (${scoreFormatted})`,
      finishedAt: new Date().toLocaleDateString("fr-FR", {
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
        ? `🏁 Match terminé (90:00) ! Score final : ${scoreFormatted}. Données rattachées au match.`
        : `🏁 Match terminé ! Score final : ${scoreFormatted} enregistré.`
    );
    setTimeout(() => setSleekToastMessage(null), 4500);
  };

  // Live match timer effect & period automation (1MT 45m = 2700s, 2MT 90m = 5400s)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLiveMatchMode && isLiveTimerRunning) {
      interval = setInterval(() => {
        setLiveTimerSeconds((prev) => {
          const next = prev + 1;
          
          // Auto Pause at 45:00 for 1MT -> MI-TEMPS
          if (next === 2700 && currentPeriod === "1MT") {
            setIsLiveTimerRunning(false);
            setCurrentPeriod("MI-TEMPS");
            setSleekToastMessage("⏸️ Fin de la 1ère Mi-Temps (45:00) ! Passage en pause mi-temps.");
            setTimeout(() => setSleekToastMessage(null), 4000);
          }
          
          // Auto Match Finish at 90:00 for 2MT -> FIN
          if (next === 5400 && currentPeriod === "2MT") {
            setTimeout(() => {
              handleFinishLiveMatch(true);
            }, 100);
          }

          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMatchMode, isLiveTimerRunning, currentPeriod]);

  const formatLiveTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleDeleteMatchEvent = (eventId: string) => {
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

  const handleDeleteMatchFromList = (matchId: string) => {
    const targetM = matchesList.find((m) => m.id === matchId);
    const matchTitle = targetM ? `${targetM.homeTeam} VS ${targetM.awayTeam}` : "ce match";
    if (confirm(`Voulez-vous vraiment supprimer définitivement le match "${matchTitle}" ainsi que toutes ses actions et schémas associés ?`)) {
      const updatedList = matchesList.filter((m) => m.id !== matchId);
      setMatchesList(updatedList);
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
      if (updatedList.length > 0) {
        if (activeMatchId === matchId) {
          selectMatch(updatedList[0].id);
        }
      } else {
        handleAddNewMatch(activeTeamId);
      }
      setSleekToastMessage("🗑️ Match supprimé avec succès.");
      setTimeout(() => setSleekToastMessage(null), 3000);
    }
  };

  const handleAddNewMatch = (assignedTeamId?: any) => {
    const targetTeamId = typeof assignedTeamId === "string" ? assignedTeamId : activeTeamId;
    const targetTeam = teams.find((t) => t.id === targetTeamId) || activeTeam;
    const newId = `match_${Date.now()}`;
    const newM = {
      id: newId,
      teamId: targetTeamId,
      homeTeam: targetTeam?.name || "MON CLUB",
      awayTeam: "NOUVEL ADVERSAIRE",
      competition: "CHAMPIONNAT",
      dateTime: "DIM. PROCHAIN • 15:00",
      isFinished: false,
      score: "",
      homeScore: 0,
      awayScore: 0
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
  };

  const selectMatch = (matchId: string, customMatchesList?: any[]) => {
    const listToSearch = customMatchesList || matchesList;
    setActiveMatchId(matchId);
    const targetM = listToSearch.find((m) => m.id === matchId);
    if (targetM && targetM.teamId && targetM.teamId !== activeTeamId) {
      setActiveTeamId(targetM.teamId);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_active_match_id", matchId);

      // Load events for this match
      const savedEvts = localStorage.getItem(`thebox_match_events_${matchId}`);
      if (savedEvts) {
        try { setMatchEvents(JSON.parse(savedEvts)); } catch (e) { setMatchEvents([]); }
      } else {
        setMatchEvents([]);
      }

      // Load scores, timer & period for this match
      let isMatchFinished = targetM?.isFinished || false;
      const savedSt = localStorage.getItem(`thebox_match_state_${matchId}`);
      if (savedSt) {
        try {
          const parsed = JSON.parse(savedSt);
          setHomeScore(parsed.homeScore || 0);
          setAwayScore(parsed.awayScore || 0);
          setLiveTimerSeconds(parsed.liveTimerSeconds || 0);
          const periodLoaded = parsed.currentPeriod || "1MT";
          setCurrentPeriod(periodLoaded);
          if (periodLoaded === "FIN") {
            isMatchFinished = true;
          }
        } catch (e) {
          setHomeScore(0);
          setAwayScore(0);
          setLiveTimerSeconds(0);
          setCurrentPeriod("1MT");
        }
      } else {
        setHomeScore(0);
        setAwayScore(0);
        setLiveTimerSeconds(0);
        setCurrentPeriod("1MT");
      }

      if (isMatchFinished) {
        setIsLiveMatchMode(false);
        setIsLiveTimerRunning(false);
        setLiveActionToken(null);
      }

      // Load notes for this match
      const savedNt = localStorage.getItem(`thebox_match_notes_${matchId}`);
      if (savedNt !== null) {
        setTacticalNotes(savedNt);
      } else {
        setTacticalNotes("");
      }

      // Load set-piece roles for this match
      const savedSetPieces = localStorage.getItem(`thebox_setpiece_roles_${matchId}`);
      if (savedSetPieces) {
        try { setSetPieceRoles(JSON.parse(savedSetPieces)); } catch (e) { setSetPieceRoles(defaultSetPieceRoles); }
      } else {
        setSetPieceRoles(defaultSetPieceRoles);
      }

      // Load opponent set-piece roles for this match
      const savedOppSetPieces = localStorage.getItem(`thebox_opp_setpiece_roles_${matchId}`);
      if (savedOppSetPieces) {
        try { setOpponentSetPieceRoles(JSON.parse(savedOppSetPieces)); } catch (e) { setOpponentSetPieceRoles(defaultSetPieceRoles); }
      } else {
        setOpponentSetPieceRoles(defaultSetPieceRoles);
      }

      // Load pitch state (keyframes & drawings) specifically saved for this match
      const savedPitchState = localStorage.getItem(`thebox_pitch_state_${matchId}`);
      if (savedPitchState) {
        try {
          const parsed = JSON.parse(savedPitchState);
          if (parsed.keyframes && parsed.keyframes.length > 0) {
            setKeyframes(parsed.keyframes);
            if (parsed.drawings) setDrawingActions(parsed.drawings);
            else setDrawingActions([]);
            setCurrentFrameIdx(0);
            return;
          }
        } catch (e) {}
      }
    }

    // Filter schemas specifically linked to this match
    const matchSchemas = savedTactics.filter(sc => (sc.matchId || "match_1") === matchId);
    if (matchSchemas.length > 0) {
      // Load the first schema of this match
      const schema = matchSchemas[0];
      if (schema.keyframes) setKeyframes(schema.keyframes);
      if (schema.drawings) setDrawingActions(schema.drawings);
      if (schema.sport) setActiveSport(schema.sport);
      setCurrentFrameIdx(0);
    } else {
      // Reset pitch to default players for activeSport for new match
      setDrawingActions([]);
      const defaultTokens = getDefaultPlayersForSport(activeSport);
      setKeyframes([defaultTokens]);
      setCurrentFrameIdx(0);
    }
  };

  const handleAutoAssignSetPieces = (targetTeam?: "home" | "away") => {
    const isAway = (targetTeam || rolesTargetTeam) === "away";
    const playersOnPitch = currentTokens.filter(t => isAway ? t.type === "player_b" : t.type === "player_a");
    if (playersOnPitch.length === 0) return;

    const playmaker = playersOnPitch.find(p => p.number === 10 || p.role?.includes("MC") || p.role?.includes("MO")) || playersOnPitch[0];
    const striker = playersOnPitch.find(p => p.number === 9 || p.role?.includes("AC") || p.role?.includes("BU") || p.role?.includes("ATT")) || playersOnPitch[Math.min(8, playersOnPitch.length - 1)];
    const wingerL = playersOnPitch.find(p => p.number === 11 || p.role?.includes("AG") || p.role?.includes("MG")) || playersOnPitch[Math.min(6, playersOnPitch.length - 1)];
    const wingerR = playersOnPitch.find(p => p.number === 7 || p.role?.includes("AD") || p.role?.includes("MD")) || playersOnPitch[Math.min(7, playersOnPitch.length - 1)];

    const assignedRoles: SetPieceRoleConfig = {
      captain: playmaker ? playmaker.name : (playersOnPitch[0]?.name || ""),
      penaltyTaker: striker ? striker.name : (playersOnPitch[0]?.name || ""),
      directFreeKick: playmaker ? playmaker.name : (playersOnPitch[0]?.name || ""),
      offCenterFKLeft: wingerL ? wingerL.name : (playersOnPitch[0]?.name || ""),
      offCenterFKRight: wingerR ? wingerR.name : (playersOnPitch[0]?.name || ""),
      cornerLeft: wingerL ? wingerL.name : (playersOnPitch[0]?.name || ""),
      cornerRight: wingerR ? wingerR.name : (playersOnPitch[0]?.name || ""),
    };

    if (isAway) {
      setOpponentSetPieceRoles(assignedRoles);
    } else {
      setSetPieceRoles(assignedRoles);
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

  // Synchronize matches list and active match when activeTeamId changes
  useEffect(() => {
    const currentTeamMatches = matchesList.filter((m) => (m.teamId || "team_1") === activeTeamId);
    if (currentTeamMatches.length > 0) {
      const exists = currentTeamMatches.some((m) => m.id === activeMatchId);
      if (!exists) {
        selectMatch(currentTeamMatches[0].id);
      }
    } else {
      // Auto-create initial match for newly selected team
      const targetTeam = teams.find((t) => t.id === activeTeamId) || activeTeam;
      const newId = `match_${Date.now()}`;
      const newMatchObj = {
        id: newId,
        teamId: activeTeamId,
        homeTeam: targetTeam?.name || "MON CLUB",
        awayTeam: "ADVERSAIRE",
        competition: "CHAMPIONNAT",
        dateTime: "DIM. PROCHAIN • 15:00",
      };
      setMatchesList((prev) => {
        const updated = [...prev, newMatchObj];
        if (typeof window !== "undefined") {
          localStorage.setItem("thebox_matches_list", JSON.stringify(updated));
        }
        return updated;
      });
      selectMatch(newId);
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

  // Roster / Substitutes (16 real bench players)
  const [substitutes, setSubstitutes] = useState<any[]>([
    { id: "s1", name: "Gavi", role: "MC", number: 6, status: "excellent" },
    { id: "s2", name: "Raphinha", role: "AiG", number: 11, status: "normal" },
    { id: "s3", name: "Dani Olmo", role: "MOC", number: 20, status: "normal" },
    { id: "s4", name: "Ansu Fati", role: "AC", number: 10, status: "tired" },
    { id: "s5", name: "Iñigo Martínez", role: "DC", number: 5, status: "normal" },
    { id: "s6", name: "Héctor Fort", role: "DD", number: 32, status: "normal" },
    { id: "s7", name: "Fermín López", role: "MC", number: 16, status: "excellent" },
    { id: "s8", name: "Ferran Torres", role: "AC", number: 7, status: "normal" },
    { id: "s9", name: "Pablo Torre", role: "MC", number: 14, status: "normal" },
    { id: "s10", name: "Pau Víctor", role: "AC", number: 18, status: "normal" },
    { id: "s11", name: "Eric García", role: "DC", number: 24, status: "injured" },
    { id: "s12", name: "Gerard Martín", role: "DG", number: 35, status: "normal" },
    { id: "s13", name: "Sergi Domínguez", role: "DC", number: 36, status: "normal" },
    { id: "s14", name: "Ander Astralaga", role: "G", number: 26, status: "normal" },
    { id: "s15", name: "Quim Junyent", role: "MC", number: 28, status: "normal" },
    { id: "s16", name: "Guille Fernández", role: "MC", number: 30, status: "excellent" }
  ]);

  // Opponent Roster / Substitutes (16 bench players for opponent team)
  const [opponentSubstitutes, setOpponentSubstitutes] = useState<any[]>([
    { id: "opp_s1", name: "Remplaçant 1", role: "MC", number: 12, status: "normal" },
    { id: "opp_s2", name: "Remplaçant 2", role: "AC", number: 13, status: "normal" },
    { id: "opp_s3", name: "Remplaçant 3", role: "DC", number: 14, status: "normal" },
    { id: "opp_s4", name: "Remplaçant 4", role: "AiD", number: 15, status: "normal" },
    { id: "opp_s5", name: "Remplaçant 5", role: "GB", number: 16, status: "normal" },
    { id: "opp_s6", name: "Remplaçant 6", role: "DD", number: 17, status: "normal" },
    { id: "opp_s7", name: "Remplaçant 7", role: "DG", number: 18, status: "normal" },
    { id: "opp_s8", name: "Remplaçant 8", role: "MDC", number: 19, status: "normal" },
    { id: "opp_s9", name: "Remplaçant 9", role: "MOC", number: 20, status: "normal" },
    { id: "opp_s10", name: "Remplaçant 10", role: "AiG", number: 21, status: "normal" },
    { id: "opp_s11", name: "Remplaçant 11", role: "DC", number: 22, status: "normal" },
    { id: "opp_s12", name: "Remplaçant 12", role: "MC", number: 23, status: "normal" },
    { id: "opp_s13", name: "Remplaçant 13", role: "BU", number: 24, status: "normal" },
    { id: "opp_s14", name: "Remplaçant 14", role: "G", number: 25, status: "normal" },
    { id: "opp_s15", name: "Remplaçant 15", role: "MC", number: 26, status: "normal" },
    { id: "opp_s16", name: "Remplaçant 16", role: "DC", number: 27, status: "normal" }
  ]);

  // Persist substitutes per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      localStorage.setItem(`thebox_substitutes_${activeMatchId}`, JSON.stringify(substitutes));
    }
  }, [substitutes, activeMatchId]);

  // Persist opponent substitutes per match
  useEffect(() => {
    if (typeof window !== "undefined" && activeMatchId) {
      localStorage.setItem(`thebox_opp_substitutes_${activeMatchId}`, JSON.stringify(opponentSubstitutes));
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
          await pitchWrapperRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Graceful fallback: CSS fixed inset-0 overlay handles fullscreen without error
    }
  };

  useEffect(() => {
    // Réinitialiser automatiquement l'échelle du terrain et des joueurs à 100% lors du changement de mode (plein écran ou normal, vue terrain, ratio, mode live)
    setZoomScale(100);
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

  const drawAllStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    const renderStroke = (action: DrawingAction) => {
      if (action.points.length < 2) return;

      ctx.strokeStyle = action.color;
      ctx.fillStyle = action.color;
      ctx.lineWidth = action.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([]);

      const start = action.points[0];
      const end = action.points[action.points.length - 1];

      const getPtX = (pt: { x: number; y: number }) => {
        if (aspectRatioMode === "mobile") {
          return (pt.y / 100) * w;
        }
        return (pt.x / 100) * w;
      };

      const getPtY = (pt: { x: number; y: number }) => {
        if (aspectRatioMode === "mobile") {
          return ((100 - pt.x) / 100) * h;
        }
        return (pt.y / 100) * h;
      };

      const startX = getPtX(start);
      const startY = getPtY(start);
      const endX = getPtX(end);
      const endY = getPtY(end);

      if (action.tool === "brush") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < action.points.length; i++) {
          const ptX = getPtX(action.points[i]);
          const ptY = getPtY(action.points[i]);
          ctx.lineTo(ptX, ptY);
        }
        ctx.stroke();
      } else if (action.tool === "arrow-direct" || action.tool === "arrow-deep" || action.tool === "arrow-run") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        if (action.tool === "arrow-deep") {
          ctx.setLineDash([8, 6]);
        } else if (action.tool === "arrow-run") {
          ctx.setLineDash([2, 5]);
        }

        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        drawArrowhead(ctx, startX, startY, endX, endY);
      } else if (action.tool === "shape-circle") {
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.tool === "shape-rect") {
        ctx.beginPath();
        ctx.rect(startX, startY, endX - startX, endY - startY);
        ctx.stroke();
      } else if (action.tool === "shape-line" || action.tool === "shape-dashed-line") {
        ctx.beginPath();
        if (action.tool === "shape-dashed-line") {
          ctx.setLineDash([8, 6]);
        }
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        if (action.tool === "shape-dashed-line") {
          ctx.setLineDash([]);
        }
      }
    };

    drawingActions.forEach((action, idx) => {
      renderStroke(action);
      if (activeTool === "select" && idx === selectedStrokeIndex) {
        ctx.save();
        ctx.strokeStyle = "#00E599";
        ctx.shadowColor = "#00E599";
        ctx.shadowBlur = 12;
        ctx.lineWidth = (action.size || 3) + 4;
        renderStroke({ ...action, color: "#00E599", size: (action.size || 3) + 4 });
        ctx.restore();
      }
    });

    if (isDrawing && currentActionPoints.length > 0) {
      renderStroke({
        tool: drawingTool,
        color: drawColor,
        size: drawSize,
        points: currentActionPoints,
      });
    }
  };

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

  // Drag and Drop relative calculation with Single Click Quick Action detection
  const handleTokenStartDrag = (tokenId: string, startEvent: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== "select" && activeTool !== "move") return;
    setSelectedTokenId(tokenId);

    const startX = "touches" in startEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const startY = "touches" in startEvent ? startEvent.touches[0].clientY : startEvent.clientY;
    startCoordsRef.current = { x: startX, y: startY };

    let userMoved = false;
    isDraggingTokenRef.current = false;

    const container = pitchContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const dist = Math.hypot(clientX - startCoordsRef.current.x, clientY - startCoordsRef.current.y);
      if (dist > 5) {
        userMoved = true;
        isDraggingTokenRef.current = true;
      }

      if (userMoved) {
        const relativeX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const relativeY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

        const logicalX = aspectRatioMode === "mobile" ? 100 - relativeY : relativeX;
        const logicalY = aspectRatioMode === "mobile" ? relativeX : relativeY;

        setKeyframes((prev) => {
          const copy = prev.map((f, fIdx) => {
            if (fIdx === currentFrameIdx) {
              return f.map((t) => (t.id === tokenId ? { ...t, x: Math.round(logicalX * 10) / 10, y: Math.round(logicalY * 10) / 10 } : t));
            }
            return f;
          });
          return copy;
        });
      }
    };

    const upHandler = () => {
      if (userMoved) {
        // Enregistrer l'instant de fin du déplacement pour bloquer l'événement onClick résiduel du navigateur
        dragEndTimeRef.current = Date.now();
      }
      isDraggingTokenRef.current = false;
      setSelectedTokenId(null);
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
  const findStrokeIndexAtCoords = (coords: { x: number; y: number }, actions: DrawingAction[]): number | null => {
    if (!actions || actions.length === 0) return null;

    const distToSegment = (p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => {
      const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = v.x + t * (w.x - v.x);
      const projY = v.y + t * (w.y - v.y);
      return Math.hypot(p.x - projX, p.y - projY);
    };

    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      const pts = action.points;
      if (!pts || pts.length === 0) continue;

      const threshold = 3.5 + (action.size || 3) * 0.3;

      if (action.tool === "brush" || action.tool === "shape-line" || action.tool === "shape-dashed-line" || action.tool.startsWith("arrow")) {
        for (let j = 0; j < pts.length - 1; j++) {
          if (distToSegment(coords, pts[j], pts[j + 1]) <= threshold) return i;
        }
        if (pts.length === 1 && Math.hypot(coords.x - pts[0].x, coords.y - pts[0].y) <= threshold) {
          return i;
        }
      } else if (action.tool === "shape-circle") {
        const start = pts[0];
        const end = pts[pts.length - 1];
        const radius = Math.hypot(end.x - start.x, end.y - start.y);
        const distFromCenter = Math.hypot(coords.x - start.x, coords.y - start.y);
        if (Math.abs(distFromCenter - radius) <= threshold || distFromCenter <= radius) {
          return i;
        }
      } else if (action.tool === "shape-rect") {
        const start = pts[0];
        const end = pts[pts.length - 1];
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        if (
          coords.x >= minX - threshold &&
          coords.x <= maxX + threshold &&
          coords.y >= minY - threshold &&
          coords.y <= maxY + threshold
        ) {
          return i;
        }
      }
    }

    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getRelativeMouseCoords(e);

    // Only in SELECT mode: detect clicks on strokes to show the stroke deletion menu
    if (activeTool === "select") {
      const hitIndex = findStrokeIndexAtCoords(coords, drawingActions);
      if (hitIndex !== null) {
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

    setIsDrawing(true);
    setCurrentActionPoints([coords]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getRelativeMouseCoords(e);
    
    if (drawingTool === "brush") {
      setCurrentActionPoints((prev) => [...prev, coords]);
    } else {
      setCurrentActionPoints((prev) => [prev[0], coords]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentActionPoints.length > 0) {
      const newAction: DrawingAction = {
        tool: drawingTool,
        color: drawColor,
        size: drawSize,
        points: currentActionPoints,
      };

      setDrawingHistory((prev) => [...prev, drawingActions]);
      setDrawingActions((prev) => [...prev, newAction]);
    }
    setCurrentActionPoints([]);
    setSelectedStrokeIndex(null);
  };

  // Formations Coordinates Presets for all sports
  const getFormationCoordinates = (sport: string, formationName: string, isOpponent: boolean): { x: number; y: number }[] => {
    const flipX = (val: number) => isOpponent ? 100 - val : val;
    let coords: { x: number; y: number }[] = [];
    
    if (sport === "basketball") {
      switch (formationName) {
        case "2-3":
          coords = [
            { x: flipX(28), y: 50 },
            { x: flipX(38), y: 25 }, { x: flipX(38), y: 74 },
            { x: flipX(42), y: 38 }, { x: flipX(42), y: 62 },
          ];
          break;
        case "1-2-2":
          coords = [
            { x: flipX(25), y: 50 },
            { x: flipX(36), y: 25 }, { x: flipX(36), y: 74 },
            { x: flipX(44), y: 20 }, { x: flipX(44), y: 74 },
          ];
          break;
        case "1-3-1":
          coords = [
            { x: flipX(24), y: 50 },
            { x: flipX(34), y: 22 }, { x: flipX(34), y: 74 },
            { x: flipX(35), y: 50 }, { x: flipX(44), y: 50 },
          ];
          break;
        case "3-2":
          coords = [
            { x: flipX(28), y: 50 }, { x: flipX(28), y: 25 }, { x: flipX(28), y: 74 },
            { x: flipX(42), y: 35 }, { x: flipX(42), y: 65 },
          ];
          break;
        case "5-Out":
          coords = [
            { x: flipX(25), y: 50 },
            { x: flipX(32), y: 20 }, { x: flipX(32), y: 74 },
            { x: flipX(40), y: 15 }, { x: flipX(40), y: 74 },
          ];
          break;
      }
    } else if (sport === "rugby") {
      switch (formationName) {
        case "Pack Ruck":
          coords = [
            { x: flipX(45), y: 30 }, { x: flipX(45), y: 40 }, { x: flipX(45), y: 50 }, { x: flipX(45), y: 60 }, { x: flipX(45), y: 70 },
            { x: flipX(38), y: 40 }, { x: flipX(38), y: 50 }, { x: flipX(38), y: 60 },
            { x: flipX(25), y: 45 }, { x: flipX(22), y: 55 },
            { x: flipX(18), y: 20 }, { x: flipX(18), y: 40 }, { x: flipX(18), y: 60 }, { x: flipX(18), y: 74 },
            { x: flipX(10), y: 50 },
          ];
          break;
        case "Combinaison":
          coords = [
            { x: flipX(40), y: 35 }, { x: flipX(40), y: 50 }, { x: flipX(40), y: 65 },
            { x: flipX(33), y: 40 }, { x: flipX(33), y: 60 },
            { x: flipX(28), y: 30 }, { x: flipX(28), y: 70 }, { x: flipX(25), y: 50 },
            { x: flipX(24), y: 35 }, { x: flipX(22), y: 50 },
            { x: flipX(18), y: 15 }, { x: flipX(20), y: 35 }, { x: flipX(20), y: 65 }, { x: flipX(18), y: 74 },
            { x: flipX(8), y: 50 },
          ];
          break;
        case "15s Standard":
        default:
          coords = [
            { x: flipX(40), y: 35 }, { x: flipX(40), y: 50 }, { x: flipX(40), y: 65 },
            { x: flipX(33), y: 40 }, { x: flipX(33), y: 60 },
            { x: flipX(28), y: 30 }, { x: flipX(28), y: 70 }, { x: flipX(25), y: 50 },
            { x: flipX(22), y: 45 }, { x: flipX(20), y: 55 },
            { x: flipX(18), y: 15 }, { x: flipX(18), y: 40 }, { x: flipX(18), y: 60 }, { x: flipX(18), y: 74 },
            { x: flipX(8), y: 50 },
          ];
          break;
      }
    } else if (sport === "handball") {
      switch (formationName) {
        case "6-0":
          coords = [
            { x: flipX(8), y: 50 },
            { x: flipX(32), y: 15 }, { x: flipX(30), y: 35 }, { x: flipX(28), y: 50 },
            { x: flipX(42), y: 50 }, { x: flipX(30), y: 65 }, { x: flipX(32), y: 74 },
          ];
          break;
        case "5-1":
          coords = [
            { x: flipX(8), y: 50 },
            { x: flipX(32), y: 15 }, { x: flipX(30), y: 35 }, { x: flipX(36), y: 50 },
            { x: flipX(42), y: 50 }, { x: flipX(30), y: 65 }, { x: flipX(32), y: 74 },
          ];
          break;
        case "3-2-1":
          coords = [
            { x: flipX(8), y: 50 },
            { x: flipX(32), y: 15 }, { x: flipX(28), y: 35 }, { x: flipX(38), y: 50 },
            { x: flipX(42), y: 50 }, { x: flipX(28), y: 65 }, { x: flipX(32), y: 74 },
          ];
          break;
        case "4-2":
          coords = [
            { x: flipX(8), y: 50 },
            { x: flipX(32), y: 15 }, { x: flipX(28), y: 35 }, { x: flipX(38), y: 40 },
            { x: flipX(38), y: 60 }, { x: flipX(28), y: 65 }, { x: flipX(32), y: 74 },
          ];
          break;
      }
    } else {
      // Default: Football
      switch (formationName) {
        case "4-4-2":
          coords = [
            { x: flipX(8), y: 50 },  // 0: GK
            { x: flipX(24), y: 35 }, { x: flipX(24), y: 65 }, // 1: DC, 2: DC
            { x: flipX(28), y: 80 }, { x: flipX(28), y: 20 }, // 3: DD (y=80), 4: DG (y=20)
            { x: flipX(46), y: 38 }, { x: flipX(46), y: 62 }, // 5: MDC/MC, 6: MC
            { x: flipX(68), y: 60 },                          // 7: MOC / AC
            { x: flipX(50), y: 20 }, { x: flipX(50), y: 80 }, // 8: MG (y=20), 9: MD (y=80)
            { x: flipX(75), y: 40 },                          // 10: AC
          ];
          break;
        case "4-3-3":
          coords = [
            { x: flipX(8), y: 50 },  // 0: GK
            { x: flipX(24), y: 35 }, { x: flipX(24), y: 65 }, // 1: DC, 2: DC
            { x: flipX(28), y: 80 }, { x: flipX(28), y: 20 }, // 3: DD (y=80), 4: DG (y=20)
            { x: flipX(44), y: 50 },                          // 5: MDC
            { x: flipX(55), y: 32 }, { x: flipX(55), y: 68 }, // 6: MC (y=32), 7: MOC (y=68)
            { x: flipX(74), y: 20 }, { x: flipX(74), y: 80 }, // 8: AiG (y=20), 9: AiD (y=80)
            { x: flipX(78), y: 50 },                          // 10: AC
          ];
          break;
        case "4-2-3-1":
          coords = [
            { x: flipX(8), y: 50 },  // 0: GK
            { x: flipX(24), y: 35 }, { x: flipX(24), y: 65 }, // 1: DC, 2: DC
            { x: flipX(28), y: 80 }, { x: flipX(28), y: 20 }, // 3: DD (y=80), 4: DG (y=20)
            { x: flipX(42), y: 38 }, { x: flipX(42), y: 62 }, // 5: MDC1, 6: MDC2
            { x: flipX(60), y: 50 },                          // 7: MOC
            { x: flipX(64), y: 20 }, { x: flipX(64), y: 80 }, // 8: AiG (y=20), 9: AiD (y=80)
            { x: flipX(78), y: 50 },                          // 10: AC
          ];
          break;
        case "5-3-2":
          coords = [
            { x: flipX(8), y: 50 },  // 0: GK
            { x: flipX(24), y: 32 }, { x: flipX(22), y: 50 }, // 1: DC, 2: DC
            { x: flipX(30), y: 82 }, { x: flipX(30), y: 18 }, // 3: Pistard Droit (DD), 4: Pistard Gauche (DG)
            { x: flipX(24), y: 68 },                          // 5: DC Right
            { x: flipX(48), y: 32 }, { x: flipX(44), y: 50 }, // 6: MC Left, 7: MDC Central
            { x: flipX(48), y: 68 },                          // 8: MC Right
            { x: flipX(75), y: 38 }, { x: flipX(75), y: 62 }, // 9: AC1, 10: AC2
          ];
          break;
        case "3-5-2":
          coords = [
            { x: flipX(8), y: 50 },  // 0: GK
            { x: flipX(24), y: 28 }, { x: flipX(22), y: 50 }, // 1: DC, 2: DC
            { x: flipX(48), y: 82 }, { x: flipX(48), y: 18 }, // 3: Piston Droit (DD), 4: Piston Gauche (DG)
            { x: flipX(24), y: 72 },                          // 5: DC Right
            { x: flipX(46), y: 35 }, { x: flipX(42), y: 50 }, // 6: MC Left, 7: MDC Central
            { x: flipX(46), y: 65 },                          // 8: MC Right
            { x: flipX(75), y: 38 }, { x: flipX(75), y: 62 }, // 9: AC1, 10: AC2
          ];
          break;
        case "3-4-3":
          coords = [
            { x: flipX(8), y: 50 },  // 0: GK
            { x: flipX(24), y: 28 }, { x: flipX(22), y: 50 }, { x: flipX(24), y: 72 }, // 1: DC Gauche, 2: DC Axe, 3: DC Droit
            { x: flipX(46), y: 18 }, { x: flipX(44), y: 38 },                          // 4: Piston Gauche (DG), 5: MC Gauche
            { x: flipX(44), y: 62 }, { x: flipX(46), y: 82 },                          // 6: MC Droit, 7: Piston Droit (DD)
            { x: flipX(74), y: 20 }, { x: flipX(74), y: 80 },                          // 8: AiG, 9: AiD
            { x: flipX(78), y: 50 },                                                   // 10: AC (Buteur)
          ];
          break;
        default:
          const defaultTokens = getDefaultPlayersForSport(sport).filter(t => isOpponent ? t.type === "player_b" : t.type === "player_a");
          coords = defaultTokens.map(t => ({ x: t.x, y: t.y }));
          break;
      }
    }

    if (coords.length === 0) {
      const defaultTokens = getDefaultPlayersForSport(sport).filter(t => isOpponent ? t.type === "player_b" : t.type === "player_a");
      coords = defaultTokens.map(t => ({ x: t.x, y: t.y }));
    }

    // Safety clamp to ensure players never land outside touchlines
    return coords.map((c) => ({
      x: Math.min(94, Math.max(6, c.x)),
      y: Math.min(88, Math.max(12, c.y)),
    }));
  };

  const applyTeamAFormation = (formName: string) => {
    setSelectedFormationA(formName);
    const coords = getFormationCoordinates(activeSport, formName, false);
    if (coords.length === 0) return;

    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      const nonTeamAPlayers = activeFrame.filter(t => t.type !== "player_a" && t.type !== "ball");
      const ballToken = activeFrame.find(t => t.type === "ball") || { 
        id: "ball", 
        type: "ball" as const, 
        name: "Ballon", 
        role: "Equipement", 
        x: 50, 
        y: 50 
      };

      const existingTeamA = activeFrame.filter(t => t.type === "player_a");
      const defaultTokens = getDefaultPlayersForSport(activeSport).filter(t => t.type === "player_a");

      const newTeamAPlayers: Token[] = coords.map((c, idx) => {
        const existingP = existingTeamA[idx];
        const defaultP = defaultTokens[idx] || {
          name: `Joueur ${idx + 1}`,
          role: "J",
          number: idx + 1
        };
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

      copy[currentFrameIdx] = [...newTeamAPlayers, ballToken, ...nonTeamAPlayers];
      return copy;
    });
  };

  const applyTeamBFormation = (formName: string) => {
    setSelectedFormationB(formName);
    const coords = getFormationCoordinates(activeSport, formName, true);
    if (coords.length === 0) return;

    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      const nonTeamBPlayers = activeFrame.filter(t => t.type !== "player_b");

      const existingTeamB = activeFrame.filter(t => t.type === "player_b");
      const defaultTokens = getDefaultPlayersForSport(activeSport).filter(t => t.type === "player_b");

      const newTeamBPlayers: Token[] = coords.map((c, idx) => {
        const existingP = existingTeamB[idx];
        const defaultP = defaultTokens[idx] || {
          name: `B${idx + 1}`,
          role: "ADV",
          number: idx + 1
        };
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

      copy[currentFrameIdx] = [...nonTeamBPlayers, ...newTeamBPlayers];
      return copy;
    });
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

  const regroupTeamAInCamp = () => {
    const availableFormations = getAvailableFormationsForSport(activeSport);
    const formA = availableFormations.includes(selectedFormationA)
      ? selectedFormationA
      : availableFormations[0] || "4-3-3";

    const coordsA = getFormationCoordinates(activeSport, formA, false);

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
        const campX = 6 + (c.x / 100) * 36;
        return {
          id: existingP ? existingP.id : `player_a_${idx}`,
          type: "player_a",
          name: existingP ? existingP.name : defaultP.name,
          role: existingP ? existingP.role : defaultP.role,
          number: existingP ? existingP.number : defaultP.number,
          x: Math.min(44, Math.max(8, campX)),
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

    const coordsB = getFormationCoordinates(activeSport, formB, true);

    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];

      const existingTeamB = activeFrame.filter(t => t.type === "player_b");
      const nonTeamB = activeFrame.filter(t => t.type !== "player_b");

      const defaultTokensB = getDefaultPlayersForSport(activeSport).filter(t => t.type === "player_b");
      const teamBToPlace = existingTeamB.length > 0 ? existingTeamB : defaultTokensB;

      const updatedTeamB: Token[] = coordsB.map((c, idx) => {
        const existingP = teamBToPlace[idx];
        const defaultP = defaultTokensB[idx] || { name: `B${idx + 1}`, role: "ADV", number: idx + 1 };
        const campX = 94 - ((100 - c.x) / 100) * 36;
        return {
          id: existingP ? existingP.id : `player_b_${idx}`,
          type: "player_b",
          name: existingP ? existingP.name : defaultP.name,
          role: existingP ? existingP.role : defaultP.role,
          number: existingP ? existingP.number : defaultP.number,
          x: Math.max(56, Math.min(92, campX)),
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
      const updated = activeFrame.map((token) => token.type === "ball" ? { ...token, x: 50, y: 50 } : token);
      copy[currentFrameIdx] = updated;
      return copy;
    });
  };

  // Remove a player from the pitch and place them into substitutes list with status/reason
  const handleRemovePlayerFromPitch = (tokenToRemove: Token, reason: "normal" | "injured" | "red_card") => {
    const isOpponent = tokenToRemove.type === "player_b";

    // 1. Remove from current active frame
    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      copy[currentFrameIdx] = activeFrame.filter((t) => t.id !== tokenToRemove.id);
      return copy;
    });

    const targetStatus = reason === "injured" ? "injured" : reason === "red_card" ? "red_card" : "normal";

    // 2. Update or add player in appropriate substitutes list
    if (isOpponent) {
      setOpponentSubstitutes((prev) => {
        const existsIndex = prev.findIndex(
          (s) => s.name.toLowerCase() === tokenToRemove.name.toLowerCase() || s.id === tokenToRemove.id
        );

        if (existsIndex >= 0) {
          const copy = [...prev];
          copy[existsIndex] = {
            ...copy[existsIndex],
            status: targetStatus,
            removalReason: reason
          };
          return copy;
        } else {
          return [
            {
              id: tokenToRemove.id || `opp_sub_${Date.now()}`,
              name: tokenToRemove.name,
              number: tokenToRemove.number || 1,
              role: tokenToRemove.role || "SUB",
              status: targetStatus,
              removalReason: reason,
              type: "player_b",
              photo: tokenToRemove.photo
            },
            ...prev
          ];
        }
      });
    } else {
      setSubstitutes((prev) => {
        const existsIndex = prev.findIndex(
          (s) => s.name.toLowerCase() === tokenToRemove.name.toLowerCase() || s.id === tokenToRemove.id
        );

        if (existsIndex >= 0) {
          const copy = [...prev];
          copy[existsIndex] = {
            ...copy[existsIndex],
            status: targetStatus,
            removalReason: reason
          };
          return copy;
        } else {
          return [
            {
              id: tokenToRemove.id || `sub_${Date.now()}`,
              name: tokenToRemove.name,
              number: tokenToRemove.number || 1,
              role: tokenToRemove.role || "SUB",
              status: targetStatus,
              removalReason: reason,
              type: tokenToRemove.type,
              photo: tokenToRemove.photo
            },
            ...prev
          ];
        }
      });
    }

    // Record event in Live Match Mode
    if (isLiveMatchMode) {
      const timeFormatted = `${Math.floor(liveTimerSeconds / 60)}'`;
      const isHome = tokenToRemove.type === "player_a";
      if (reason === "red_card") {
        setMatchEvents((prev) => [
          {
            id: `evt_${Date.now()}`,
            time: timeFormatted,
            period: currentPeriod,
            type: "red" as const,
            player: tokenToRemove.name,
            number: tokenToRemove.number,
            team: isHome ? "home" : "away",
            note: "Expulsion Carton Rouge 🟥"
          },
          ...prev
        ]);
      } else if (reason === "injured") {
        setMatchEvents((prev) => [
          {
            id: `evt_${Date.now()}`,
            time: timeFormatted,
            period: currentPeriod,
            type: "sub" as const,
            player: tokenToRemove.name,
            number: tokenToRemove.number,
            team: isHome ? "home" : "away",
            note: "Sortie sur blessure 🏥"
          },
          ...prev
        ]);
        if (isLiveMatchMode) {
          setQuickActionToken(tokenToRemove);
          setSubPickerToken(tokenToRemove);
        }
      }
    }

    setEditingToken(null);
  };

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
  const handleSwapPlayerOnPitch = (originalToken: Token, newSub: any) => {
    const isOpponent = originalToken.type === "player_b";

    // 1. Replace token on pitch
    setKeyframes((prev) => {
      const copy = [...prev];
      const activeFrame = copy[currentFrameIdx] || [];
      copy[currentFrameIdx] = activeFrame.map((t) => {
        if (t.id === originalToken.id) {
          return {
            ...t,
            name: newSub.name,
            number: newSub.number,
            role: newSub.role,
            status: newSub.status || "normal",
            photo: newSub.photo
          };
        }
        return t;
      });
      return copy;
    });

    // 2. Put original player into appropriate substitutes list
    if (isOpponent) {
      setOpponentSubstitutes((prev) => {
        const exists = prev.some((s) => s.name.toLowerCase() === originalToken.name.toLowerCase());
        if (!exists) {
          return [
            {
              id: originalToken.id || `opp_sub_${Date.now()}`,
              name: originalToken.name,
              number: originalToken.number || 1,
              role: originalToken.role || "SUB",
              status: "normal",
              removalReason: "normal",
              type: "player_b",
              photo: originalToken.photo
            },
            ...prev
          ];
        }
        return prev;
      });
    } else {
      setSubstitutes((prev) => {
        const exists = prev.some((s) => s.name.toLowerCase() === originalToken.name.toLowerCase());
        if (!exists) {
          return [
            {
              id: originalToken.id || `sub_${Date.now()}`,
              name: originalToken.name,
              number: originalToken.number || 1,
              role: originalToken.role || "SUB",
              status: "normal",
              removalReason: "normal",
              type: originalToken.type,
              photo: originalToken.photo
            },
            ...prev
          ];
        }
        return prev;
      });
    }

    if (isLiveMatchMode) {
      const timeFormatted = `${Math.floor(liveTimerSeconds / 60)}'`;
      const isHome = originalToken.type === "player_a";
      setMatchEvents((prev) => [
        {
          id: `evt_${Date.now()}`,
          time: timeFormatted,
          period: currentPeriod,
          type: "sub" as const,
          player: `${originalToken.name} ➔ ${newSub.name}`,
          number: newSub.number,
          team: isHome ? "home" : "away",
          note: "Remplacement 🔄"
        },
        ...prev
      ]);
    }

    setQuickActionToken(null);
    setSubPickerToken(null);
  };

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

  // Squad / Roster editing handlers in the Roles & Team Modal
  const handleUpdatePitchPlayer = (tokenId: string, field: "name" | "number" | "role" | "status" | "photo", value: any) => {
    const oldPlayer = currentTokens.find((t) => t.id === tokenId);
    const oldName = oldPlayer?.name;
    const isOpponent = oldPlayer?.type === "player_b";

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

  // Assign Unique Number to a player without duplicates
  const handleAssignUniqueNumber = (targetId: string, isStarter: boolean, rawValue: string | number) => {
    const newNum = parseInt(String(rawValue), 10);
    if (isNaN(newNum) || newNum < 1) return;

    if (isStarter) {
      handleUpdatePitchPlayer(targetId, "number", newNum);
    } else {
      handleUpdateSubstitute(targetId, "number", newNum);
    }
  };

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
  const handleToggleStarterSubstitute = (targetId: string, currentStatus: "starter" | "substitute", targetTeam?: "home" | "away") => {
    const isAway = (targetTeam || rolesTargetTeam) === "away";

    if (currentStatus === "starter") {
      // Pitch -> Bench
      const starter = currentTokens.find((t) => t.id === targetId);
      if (!starter) return;

      setKeyframes((prev) =>
        prev.map((frame) => frame.filter((t) => t.id !== targetId))
      );

      if (isAway) {
        const newSubId = `opp_sub_${Date.now()}_${starter.number || 99}`;
        const newSub = {
          id: newSubId,
          name: starter.name,
          number: starter.number ?? (opponentSubstitutes.length + 12),
          role: starter.role || "SUB",
          status: starter.status || "normal",
          photo: starter.photo,
          type: "player_b"
        };
        setOpponentSubstitutes((prev) => [...prev, newSub]);
      } else {
        const newSubId = `sub_${substitutes.length + 1}_${starter.number || 99}`;
        const newSub = {
          id: newSubId,
          name: starter.name,
          number: starter.number ?? (substitutes.length + 12),
          role: starter.role || "SUB",
          status: starter.status || "normal",
          photo: starter.photo,
          type: "player_a"
        };
        setSubstitutes((prev) => [...prev, newSub]);
      }
    } else {
      // Bench -> Pitch
      if (isAway) {
        const sub = opponentSubstitutes.find((s) => s.id === targetId);
        if (!sub) return;

        setOpponentSubstitutes((prev) => prev.filter((s) => s.id !== targetId));

        const newStarterId = `player_b_${sub.id}_${sub.number || 1}`;
        const newPitchPlayer: Token = {
          id: newStarterId,
          type: "player_b",
          name: sub.name,
          number: sub.number,
          role: sub.role || "Titulaire",
          status: (sub.status as any) || "normal",
          photo: sub.photo,
          x: 75,
          y: 50,
        };

        setKeyframes((prev) => {
          const copy = [...prev];
          const activeFrame = copy[currentFrameIdx] || [];
          copy[currentFrameIdx] = [...activeFrame, newPitchPlayer];
          return copy;
        });
      } else {
        const sub = substitutes.find((s) => s.id === targetId);
        if (!sub) return;

        setSubstitutes((prev) => prev.filter((s) => s.id !== targetId));

        const newStarterId = `player_a_${sub.id}_${sub.number || 1}`;
        const newPitchPlayer: Token = {
          id: newStarterId,
          type: "player_a",
          name: sub.name,
          number: sub.number,
          role: sub.role || "Titulaire",
          status: (sub.status as any) || "normal",
          photo: sub.photo,
          x: 25,
          y: 50,
        };

        setKeyframes((prev) => {
          const copy = [...prev];
          const activeFrame = copy[currentFrameIdx] || [];
          copy[currentFrameIdx] = [...activeFrame, newPitchPlayer];
          return copy;
        });
      }
    }
  };

  // Upload custom player photo
  const handlePlayerPhotoUpload = (playerId: string, isStarter: boolean, file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        if (isStarter) {
          handleUpdatePitchPlayer(playerId, "photo", base64);
        } else {
          handleUpdateSubstitute(playerId, "photo", base64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePlayerPhoto = (playerId: string, isStarter: boolean) => {
    if (isStarter) {
      handleUpdatePitchPlayer(playerId, "photo", undefined);
    } else {
      handleUpdateSubstitute(playerId, "photo", undefined);
    }
  };

  const handleAddNewSubstitute = (targetTeam?: "home" | "away") => {
    const isAway = (targetTeam || rolesTargetTeam) === "away";
    const starters = currentTokens.filter((t) => isAway ? t.type === "player_b" : t.type === "player_a");
    const bench = isAway ? opponentSubstitutes : substitutes;

    const taken = new Set<number>();
    starters.forEach((p) => {
      if (typeof p.number === "number" && !isNaN(p.number)) taken.add(p.number);
    });
    bench.forEach((s) => {
      if (typeof s.number === "number" && !isNaN(s.number)) taken.add(s.number);
    });

    let newNum = 1;
    while (taken.has(newNum)) {
      newNum++;
    }

    if (isAway) {
      const newId = `opp_sub_${Date.now()}_${newNum}`;
      const newSub = {
        id: newId,
        name: `Remplaçant ${newNum}`,
        number: newNum,
        role: activeSport === "football" ? "SUB" : "Remplaçant",
        status: "normal",
        type: "player_b"
      };
      setOpponentSubstitutes((prev) => [...prev, newSub]);
    } else {
      const newId = `sub_${Date.now()}_${newNum}`;
      const newSub = {
        id: newId,
        name: `Nouveau Joueur ${newNum}`,
        number: newNum,
        role: activeSport === "football" ? "SUB" : "Remplaçant",
        status: "normal",
        type: "player_a"
      };
      setSubstitutes((prev) => [...prev, newSub]);
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
  const handleExecuteInterTeamSwap = () => {
    if (!swapSourcePlayer) {
      alert("Veuillez choisir un joueur dans l'effectif actuel.");
      return;
    }
    if (!swapTargetTeamId) {
      alert("Veuillez sélectionner une autre équipe de votre club.");
      return;
    }
    const targetRoster = getRosterForTeam(swapTargetTeamId);
    const targetPlayer = targetRoster.find((p) => p.id === swapTargetPlayerId);
    if (!targetPlayer) {
      alert("Veuillez sélectionner le joueur avec qui réaliser l'échange.");
      return;
    }

    const sourceTeamObj = teams.find((t) => t.id === activeTeamId) || activeTeam;
    const targetTeamObj = teams.find((t) => t.id === swapTargetTeamId);

    // 1. Update Source Team (current squad)
    if (swapSourcePlayer.isStarter) {
      // Update token on pitch
      setKeyframes((prev) =>
        prev.map((frame) =>
          frame.map((t) => {
            if (t.id === swapSourcePlayer.id) {
              return {
                ...t,
                name: targetPlayer.name,
                number: targetPlayer.number,
                role: targetPlayer.role,
                status: (targetPlayer.status as any) || "normal",
                photo: targetPlayer.photo,
              };
            }
            return t;
          })
        )
      );
    } else {
      // Update substitute on bench
      if (swapSourcePlayer.teamTarget === "away") {
        setOpponentSubstitutes((prev) =>
          prev.map((s) =>
            s.id === swapSourcePlayer.id
              ? {
                  ...s,
                  name: targetPlayer.name,
                  number: targetPlayer.number,
                  role: targetPlayer.role,
                  status: targetPlayer.status || "normal",
                  photo: targetPlayer.photo,
                }
              : s
          )
        );
      } else {
        setSubstitutes((prev) =>
          prev.map((s) =>
            s.id === swapSourcePlayer.id
              ? {
                  ...s,
                  name: targetPlayer.name,
                  number: targetPlayer.number,
                  role: targetPlayer.role,
                  status: targetPlayer.status || "normal",
                  photo: targetPlayer.photo,
                }
              : s
          )
        );
      }
    }

    // 2. Update Target Team Roster in teamRostersMap
    const updatedTargetRoster = targetRoster.map((p) => {
      if (p.id === targetPlayer.id) {
        return {
          ...p,
          name: swapSourcePlayer.name,
          number: swapSourcePlayer.number,
          role: swapSourcePlayer.role,
          status: (swapSourcePlayer.status as any) || "normal",
          photo: swapSourcePlayer.photo,
        };
      }
      return p;
    });

    setTeamRostersMap((prev) => {
      const nextMap = {
        ...prev,
        [swapTargetTeamId]: updatedTargetRoster,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_team_rosters", JSON.stringify(nextMap));
      }
      return nextMap;
    });

    const msg = `🔄 Échange réussi : ${swapSourcePlayer.name} a rejoint ${targetTeamObj?.name || "l'autre équipe"} et ${targetPlayer.name} intègre ${sourceTeamObj?.name || "votre équipe"} !`;
    setSwapNotification({
      type: "success",
      message: msg,
    });

    // Update the source player in state to reflect the new incoming player
    setSwapSourcePlayer({
      id: swapSourcePlayer.id,
      name: targetPlayer.name,
      number: targetPlayer.number,
      role: targetPlayer.role,
      photo: targetPlayer.photo,
      status: targetPlayer.status || "normal",
      isStarter: swapSourcePlayer.isStarter,
      teamTarget: swapSourcePlayer.teamTarget,
    });
    setSwapTargetPlayerId(null);
  };

  // Direct Transfer without 1-to-1 swap
  const handleExecuteDirectTransfer = (direction: "send_to_target" | "bring_from_target") => {
    if (!swapSourcePlayer && direction === "send_to_target") return;
    const targetRoster = getRosterForTeam(swapTargetTeamId);
    const targetTeamObj = teams.find((t) => t.id === swapTargetTeamId);
    const sourceTeamObj = teams.find((t) => t.id === activeTeamId) || activeTeam;

    if (direction === "send_to_target" && swapSourcePlayer) {
      const newTargetPlayer: TeamRosterPlayer = {
        id: `p_${Date.now()}_${swapSourcePlayer.number}`,
        name: swapSourcePlayer.name,
        number: swapSourcePlayer.number,
        role: swapSourcePlayer.role,
        status: (swapSourcePlayer.status as any) || "normal",
        photo: swapSourcePlayer.photo,
        isStarter: false,
      };
      const updatedTargetRoster = [...targetRoster, newTargetPlayer];

      if (!swapSourcePlayer.isStarter) {
        if (swapSourcePlayer.teamTarget === "away") {
          setOpponentSubstitutes((prev) => prev.filter((s) => s.id !== swapSourcePlayer.id));
        } else {
          setSubstitutes((prev) => prev.filter((s) => s.id !== swapSourcePlayer.id));
        }
      } else {
        handleUpdatePitchPlayer(swapSourcePlayer.id, "name", "Nouveau Titulaire");
      }

      setTeamRostersMap((prev) => {
        const nextMap = { ...prev, [swapTargetTeamId]: updatedTargetRoster };
        if (typeof window !== "undefined") {
          localStorage.setItem("thebox_team_rosters", JSON.stringify(nextMap));
        }
        return nextMap;
      });

      setSwapNotification({
        type: "success",
        message: `➡️ Transfert réussi : ${swapSourcePlayer.name} a rejoint l'effectif de ${targetTeamObj?.name || "l'autre équipe"} !`
      });
      setIsInterTeamSwapOpen(false);
    } else if (direction === "bring_from_target") {
      const targetPlayer = targetRoster.find((p) => p.id === swapTargetPlayerId);
      if (!targetPlayer) {
        alert("Veuillez sélectionner le joueur à faire venir dans votre équipe.");
        return;
      }
      const newSub = {
        id: `sub_${Date.now()}_${targetPlayer.number}`,
        name: targetPlayer.name,
        number: targetPlayer.number,
        role: targetPlayer.role,
        status: targetPlayer.status || "normal",
        photo: targetPlayer.photo,
        type: "player_a",
      };
      setSubstitutes((prev) => [...prev, newSub]);

      const updatedTargetRoster = targetRoster.filter((p) => p.id !== targetPlayer.id);
      setTeamRostersMap((prev) => {
        const nextMap = { ...prev, [swapTargetTeamId]: updatedTargetRoster };
        if (typeof window !== "undefined") {
          localStorage.setItem("thebox_team_rosters", JSON.stringify(nextMap));
        }
        return nextMap;
      });

      setSwapNotification({
        type: "success",
        message: `⬅️ Renfort intégré : ${targetPlayer.name} rejoint le banc de ${sourceTeamObj?.name || "votre équipe"} !`
      });
      setSwapTargetPlayerId(null);
    }
  };

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
          period: currentPeriod,
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

  // Record Goal in Live Match (opens assist selector or records with explicit assister)
  const handleRecordGoal = (targetToken: Token, explicitAssister?: string) => {
    if (!isLiveMatchMode) {
      alert("L'attribution de but est disponible uniquement en MODE LIVE MATCH.");
      return;
    }
    if (explicitAssister !== undefined) {
      confirmGoalRecord(targetToken, explicitAssister);
    } else {
      setPendingGoalToken(targetToken);
      setSelectedPasseurName("");
    }
  };

  const confirmGoalRecord = (scorerToken: Token, passeurName?: string) => {
    const isHome = scorerToken.type === "player_a";
    if (isHome) {
      setHomeScore((prev) => prev + 1);
    } else {
      setAwayScore((prev) => prev + 1);
    }

    const timeFormatted = `${Math.floor(liveTimerSeconds / 60)}'`;
    const cleanPasseur = passeurName && passeurName.trim() !== "" ? passeurName.trim() : undefined;

    setMatchEvents((prev) => [
      {
        id: `evt_${Date.now()}`,
        time: timeFormatted,
        period: currentPeriod,
        type: "goal" as const,
        player: scorerToken.name,
        number: scorerToken.number,
        team: isHome ? "home" : "away",
        assister: cleanPasseur,
        note: cleanPasseur ? `Passeur : ${cleanPasseur}` : `BUT ! ⚽`
      },
      ...prev
    ]);

    setPendingGoalToken(null);
    setSelectedPasseurName("");
    setSleekToastMessage(
      cleanPasseur
        ? `⚽ BUT de ${scorerToken.name} (Passeur : ${cleanPasseur}) !`
        : `⚽ BUT de ${scorerToken.name} !`
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
    const maxPlayers = activeSport === "rugby" ? 15 : activeSport === "football" ? 11 : activeSport === "handball" ? 7 : activeSport === "basketball" ? 5 : 6;
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

  const handleResetBoard = () => {
    if (confirm("Réinitialiser le terrain et tous les tracés ?")) {
      setDrawingActions([]);
      setDrawingHistory([]);
      const defaultTokens = getDefaultPlayersForSport(activeSport);
      setKeyframes([defaultTokens]);
      setCurrentFrameIdx(0);
    }
  };

  // Saved tactical strategies handlers
  const handleTriggerSaveModal = () => {
    setIsSaveAnimationMode(false);
    setTacticName(`Schéma ${activeSport.toUpperCase()} - ${new Date().toLocaleDateString("fr-FR")}`);
    setSaveTacticMatchId(activeMatchId);
    setIsSaveModalOpen(true);
  };

  const handleSaveTacticState = () => {
    if (!tacticName.trim()) return;

    const targetMatchId = saveTacticMatchId || activeMatchId;
    const targetMatch = matchesList.find((m) => m.id === targetMatchId) || activeMatch;
    const targetTeam = teams.find((t) => t.id === targetMatch?.teamId) || activeTeam;
    const isAnim = isSaveAnimationMode || (keyframes && keyframes.length > 1);

    const newSchemaData = {
      id: `schema_${Date.now()}`,
      name: tacticName,
      description: tacticDesc || (isAnim ? "Animation tactique séquentielle" : "Schéma tactique de référence"),
      sport: activeSport,
      keyframes: keyframes,
      drawings: drawingActions,
      isAnimation: isAnim,
      matchId: targetMatchId,
      teamId: targetTeam.id,
      teamName: targetTeam.name,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    let previewImg = "";
    try {
      previewImg = generateCompositeTacticsCanvas(newSchemaData);
    } catch (e) {
      console.warn("Could not generate tactic preview image", e);
    }

    const newSchema = {
      ...newSchemaData,
      previewImage: previewImg,
    };

    const nextList = [newSchema, ...savedTactics];
    setSavedTactics(nextList);
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_saved_playbooks", JSON.stringify(nextList));
    }

    // Cloud Persistence via Firebase Firestore
    try {
      saveTacticToFirestore({
        id: newSchema.id,
        userId: activeCoachId,
        name: newSchema.name,
        sport: newSchema.sport || activeSport,
        pitchType: "full",
        notes: newSchema.description || "",
        payload: JSON.stringify(newSchema),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).catch((e) => console.log("Firebase sync queued:", e));
    } catch (e) {
      console.log("Firebase save skipped:", e);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setIsSaveModalOpen(false);
      setSaveSuccess(false);
      setIsSaveAnimationMode(false);
      setTacticDesc("");
    }, 1200);
  };

  const handleLinkSchemaToMatch = (schemaId: string, matchId: string) => {
    setSavedTactics((prev) => {
      const nextList = prev.map((sc) => (sc.id === schemaId ? { ...sc, matchId } : sc));
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_saved_playbooks", JSON.stringify(nextList));
      }
      return nextList;
    });
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
    if (schema.id && activeMatchId && schema.matchId !== activeMatchId) {
      handleLinkSchemaToMatch(schema.id, activeMatchId);
    }
    
    const isAnim = Boolean(schema.isAnimation || (schema.keyframes && schema.keyframes.length > 1));
    if (isAnim && !isLiveMatchMode) {
      setIsAnimationCreatorOpen(true);
      setSleekToastMessage(`🎬 Animation "${schema.name}" loaded (${schema.keyframes?.length || 1} étapes) !`);
    } else {
      setSleekToastMessage(`🎯 Schéma "${schema.name}" chargé pour le match "${activeMatch?.homeTeam || 'Mon Club'} VS ${activeMatch?.awayTeam || 'Adversaire'}" !`);
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

  const handleOpenShareSchema = (schema?: any) => {
    const targetKeyframes = schema?.keyframes || keyframes;
    const firstFrame = targetKeyframes?.[0] || keyframes[0];
    const targetTokens = Array.isArray(firstFrame) 
      ? firstFrame 
      : (firstFrame?.players || currentTokens);

    const targetPlayers = targetTokens
      .filter((t: any) => t.type === "player_a")
      .map((p: any) => ({
        number: p.number || 1,
        name: p.name || `Joueur #${p.number}`,
        position: p.role,
        isStarter: true,
      }));

    const activeSubs = (substitutes || [])
      .filter((s: any) => !targetPlayers.some((st: any) => st.name && s.name && st.name.toLowerCase() === s.name.toLowerCase()))
      .map((s: any) => ({
        number: s.number || 12,
        name: s.name || `Remplaçant #${s.number}`,
        position: s.role || "SUB",
        isStarter: false,
      }));

    // Always generate fresh high-quality composite image to ensure players and proportions are rendered
    let schemaImg = "";
    try {
      schemaImg = generateCompositeTacticsCanvas(schema);
    } catch (e) {
      console.warn("Could not generate composite canvas", e);
      schemaImg = schema?.previewImage || "";
    }

    // Match-associated saved schemas
    const matchSavedSchemas = savedTactics
      .filter((s) => (s.matchId || "match_1") === activeMatchId)
      .map((s) => ({
        id: s.id,
        name: s.name,
        previewImage: generateCompositeTacticsCanvas(s),
        date: s.date,
        description: s.description,
        formation: s.formation,
        sport: s.sport,
      }));

    const defaultSchemaTitle = schema?.name || `Schéma ${(schema?.sport || activeSport).toUpperCase()} - ${new Date().toLocaleDateString("fr-FR")}`;
    const defaultSchemaNotes = schema?.description || tacticalNotes || (activeMatch?.notes ? activeMatch.notes : "Schéma tactique de référence");

    setShareData({
      type: "schema",
      title: defaultSchemaTitle,
      sport: schema?.sport || activeSport,
      clubName: schema?.teamName || displayClubTitle,
      matchInfo: activeMatch ? `${displayClubTitle} vs ${activeMatch.awayTeam}` : undefined,
      formation: schema?.formation || selectedFormationA,
      notes: defaultSchemaNotes,
      players: [...targetPlayers, ...activeSubs],
      starters: targetPlayers,
      substitutes: activeSubs,
      phasesCount: targetKeyframes?.length || 1,
      imageUrl: schemaImg,
      matchSchemas: matchSavedSchemas.length > 0 ? matchSavedSchemas : undefined,
    });
    setShareModalOpen(true);
  };

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

  // Helper function to generate high resolution composite tactic pitch image
  const generateCompositeTacticsCanvas = (schemaOverride?: any): string => {
    const isMatchReport = !schemaOverride && (isLiveMatchMode || matchEvents.length > 0);
    const targetSport = schemaOverride?.sport || activeSport;
    const sportKey = targetSport.toLowerCase();
    const sportRatio = getSportRatioNum(targetSport);

    // Compute standard, mathematically exact pitch dimensions based on the sport ratio
    const pitchH = 760;
    const pitchW = Math.round(pitchH * sportRatio);
    const paddingX = 35;
    const headerH = 85;
    const paddingYTop = 15;
    const paddingYBottom = 25;
    const footerH = isMatchReport ? 280 : 0;

    const w = pitchW + paddingX * 2;
    const h = headerH + paddingYTop + pitchH + paddingYBottom + footerH;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = w;
    exportCanvas.height = h;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return "";

    const targetTitle = schemaOverride?.name || (activeMatch ? `${activeMatch.homeTeam} VS ${activeMatch.awayTeam}` : `THE BOX • ${targetSport.toUpperCase()} TACTICS PRO`);
    const targetClub = schemaOverride?.teamName || displayClubTitle;

    // 1. Dark Background
    ctx.fillStyle = "#090d14";
    ctx.fillRect(0, 0, w, h);

    // Header bar (Height 85px)
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, w, headerH);

    ctx.strokeStyle = "#00E599";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, headerH);
    ctx.lineTo(w, headerH);
    ctx.stroke();

    // Match Title / Sport Title
    ctx.fillStyle = "#00E599";
    ctx.font = "900 22px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`🏆 ${targetTitle.toUpperCase()}`, 30, 36);

    // Subtitle
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "700 12px system-ui, sans-serif";
    const matchSubInfo = activeMatch
      ? `Compétition : ${activeMatch.competition || "Regular"}  |  Date & Heure : ${activeMatch.dateTime || activeMatch.date || "Prochainement"}`
      : `Sport : ${targetSport.toUpperCase()}  |  Club : ${targetClub}`;
    ctx.fillText(matchSubInfo, 30, 62);

    // Score Badge on Header Right
    if (activeMatch || homeScore > 0 || awayScore > 0) {
      const scoreStr = `SCORE : ${homeScore} - ${awayScore}`;
      ctx.fillStyle = "#00E599";
      ctx.fillRect(w - 240, 20, 210, 45);
      ctx.fillStyle = "#0d1117";
      ctx.font = "900 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(scoreStr, w - 135, 48);
    } else {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.textAlign = "right";
      const rightHeader = `Coach : ${activeCoach?.firstName || "Coach"} ${activeCoach?.lastName || "Principal"}  |  Généré le ${new Date().toLocaleDateString("fr-FR")}`;
      ctx.fillText(rightHeader, w - 30, 48);
    }

    ctx.textAlign = "left";

    // Exact Pitch Area bounds (locked to official sport ratio)
    const pitchX = paddingX;
    const pitchY = headerH + paddingYTop;

    // Pitch Border & Sport-Specific Line markup
    if (sportKey === "basketball") {
      // Wood court background
      const courtGrad = ctx.createLinearGradient(pitchX, pitchY, pitchX + pitchW, pitchY + pitchH);
      courtGrad.addColorStop(0, "#78350f");
      courtGrad.addColorStop(0.5, "#92400e");
      courtGrad.addColorStop(1, "#78350f");
      ctx.fillStyle = courtGrad;
      ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

      ctx.strokeStyle = "#fcd34d";
      ctx.lineWidth = 3;
      ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);

      // Center Line
      ctx.beginPath();
      ctx.moveTo(pitchX + pitchW / 2, pitchY);
      ctx.lineTo(pitchX + pitchW / 2, pitchY + pitchH);
      ctx.stroke();

      // Center Circle
      ctx.beginPath();
      ctx.arc(pitchX + pitchW / 2, pitchY + pitchH / 2, pitchH * 0.22, 0, 2 * Math.PI);
      ctx.stroke();

      // Left Key
      const keyW = pitchW * 0.18;
      const keyH = pitchH * 0.36;
      const keyY = pitchY + (pitchH - keyH) / 2;
      ctx.strokeRect(pitchX, keyY, keyW, keyH);

      // Left Free throw circle
      ctx.beginPath();
      ctx.arc(pitchX + keyW, pitchY + pitchH / 2, keyH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Left 3-Point Arc
      ctx.beginPath();
      ctx.arc(pitchX + keyW * 0.3, pitchY + pitchH / 2, pitchH * 0.42, -Math.PI * 0.38, Math.PI * 0.38);
      ctx.stroke();

      // Right Key
      ctx.strokeRect(pitchX + pitchW - keyW, keyY, keyW, keyH);

      // Right Free throw circle
      ctx.beginPath();
      ctx.arc(pitchX + pitchW - keyW, pitchY + pitchH / 2, keyH / 2, Math.PI / 2, -Math.PI / 2);
      ctx.stroke();

      // Right 3-Point Arc
      ctx.beginPath();
      ctx.arc(pitchX + pitchW - keyW * 0.3, pitchY + pitchH / 2, pitchH * 0.42, Math.PI * 0.62, Math.PI * 1.38);
      ctx.stroke();

      // Backboards & Hoops
      ctx.strokeStyle = "#fcd34d";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pitchX + keyW * 0.25, keyY + keyH * 0.35);
      ctx.lineTo(pitchX + keyW * 0.25, keyY + keyH * 0.65);
      ctx.stroke();
      ctx.strokeStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(pitchX + keyW * 0.32, pitchY + pitchH / 2, 8, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.strokeStyle = "#fcd34d";
      ctx.beginPath();
      ctx.moveTo(pitchX + pitchW - keyW * 0.25, keyY + keyH * 0.35);
      ctx.lineTo(pitchX + pitchW - keyW * 0.25, keyY + keyH * 0.65);
      ctx.stroke();
      ctx.strokeStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(pitchX + pitchW - keyW * 0.32, pitchY + pitchH / 2, 8, 0, 2 * Math.PI);
      ctx.stroke();

    } else if (sportKey === "handball") {
      // Slate court background
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 3;
      ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);

      // Center Line
      ctx.beginPath();
      ctx.moveTo(pitchX + pitchW / 2, pitchY);
      ctx.lineTo(pitchX + pitchW / 2, pitchY + pitchH);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pitchX + pitchW / 2, pitchY + pitchH / 2, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "#e2e8f0";
      ctx.fill();

      // Left 6m zone (D-Zone)
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pitchX, pitchY + pitchH / 2, pitchH * 0.30, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Left 9m dashed free-throw line
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(pitchX, pitchY + pitchH / 2, pitchH * 0.45, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right 6m zone
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pitchX + pitchW, pitchY + pitchH / 2, pitchH * 0.30, Math.PI / 2, -Math.PI / 2);
      ctx.stroke();

      // Right 9m dashed free-throw line
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(pitchX + pitchW, pitchY + pitchH / 2, pitchH * 0.45, Math.PI / 2, -Math.PI / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Goals
      ctx.strokeRect(pitchX - 10, pitchY + pitchH * 0.38, 10, pitchH * 0.24);
      ctx.strokeRect(pitchX + pitchW, pitchY + pitchH * 0.38, 10, pitchH * 0.24);

    } else if (sportKey === "rugby") {
      // Emerald grass background
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;

      const tryZoneW = pitchW * 0.12;
      const playW = pitchW - 2 * tryZoneW;

      // Outer boundary and try lines
      ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);
      ctx.beginPath();
      ctx.moveTo(pitchX + tryZoneW, pitchY);
      ctx.lineTo(pitchX + tryZoneW, pitchY + pitchH);
      ctx.moveTo(pitchX + pitchW - tryZoneW, pitchY);
      ctx.lineTo(pitchX + pitchW - tryZoneW, pitchY + pitchH);
      ctx.stroke();

      // 50m Midfield line
      ctx.beginPath();
      ctx.moveTo(pitchX + pitchW / 2, pitchY);
      ctx.lineTo(pitchX + pitchW / 2, pitchY + pitchH);
      ctx.stroke();

      // 22m lines
      const line22W = playW * 0.22;
      ctx.beginPath();
      ctx.moveTo(pitchX + tryZoneW + line22W, pitchY);
      ctx.lineTo(pitchX + tryZoneW + line22W, pitchY + pitchH);
      ctx.moveTo(pitchX + pitchW - tryZoneW - line22W, pitchY);
      ctx.lineTo(pitchX + pitchW - tryZoneW - line22W, pitchY + pitchH);
      ctx.stroke();

      // 10m dashed lines
      const line10W = playW * 0.10;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(pitchX + pitchW / 2 - line10W, pitchY);
      ctx.lineTo(pitchX + pitchW / 2 - line10W, pitchY + pitchH);
      ctx.moveTo(pitchX + pitchW / 2 + line10W, pitchY);
      ctx.lineTo(pitchX + pitchW / 2 + line10W, pitchY + pitchH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Goal posts H
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pitchX + tryZoneW, pitchY + pitchH * 0.42);
      ctx.lineTo(pitchX + tryZoneW - 12, pitchY + pitchH * 0.42);
      ctx.lineTo(pitchX + tryZoneW - 12, pitchY + pitchH * 0.58);
      ctx.lineTo(pitchX + tryZoneW, pitchY + pitchH * 0.58);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pitchX + pitchW - tryZoneW, pitchY + pitchH * 0.42);
      ctx.lineTo(pitchX + pitchW - tryZoneW + 12, pitchY + pitchH * 0.42);
      ctx.lineTo(pitchX + pitchW - tryZoneW + 12, pitchY + pitchH * 0.58);
      ctx.lineTo(pitchX + pitchW - tryZoneW, pitchY + pitchH * 0.58);
      ctx.stroke();

    } else {
      // DEFAULT / FOOTBALL FULL PITCH MARKINGS (Standard FIFA proportions matching 0 0 110 73 viewBox)
      // 1. Grass gradient background matching the actual board
      const pitchGrad = ctx.createLinearGradient(pitchX, pitchY, pitchX, pitchY + pitchH);
      pitchGrad.addColorStop(0, "#032e22");
      pitchGrad.addColorStop(1, "#053b2c");
      ctx.fillStyle = pitchGrad;
      ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

      // 2. Pitch Grass Stripes (12 vertical bands)
      const stripeW = pitchW / 12;
      for (let i = 0; i < 12; i += 2) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
        ctx.fillRect(pitchX + i * stripeW, pitchY, stripeW, pitchH);
      }

      // Coordinate helper matching 0 0 110 73 viewBox exactly
      const toX = (vx: number) => pitchX + (vx / 110) * pitchW;
      const toY = (vy: number) => pitchY + (vy / 73) * pitchH;
      const toW = (vw: number) => (vw / 110) * pitchW;
      const toH = (vh: number) => (vh / 73) * pitchH;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2.5;

      // Outer Field Boundary Line (68m x 105m playfield inside 73m x 110m, margin 2.5m)
      ctx.strokeRect(toX(2.5), toY(2.5), toW(105), toH(68));

      // Midfield Line
      ctx.beginPath();
      ctx.moveTo(toX(55), toY(2.5));
      ctx.lineTo(toX(55), toY(70.5));
      ctx.stroke();

      // Center Circle (official 9.15m radius)
      ctx.beginPath();
      ctx.arc(toX(55), toY(36.5), toH(9.15), 0, 2 * Math.PI);
      ctx.stroke();

      // Center Spot
      ctx.beginPath();
      ctx.arc(toX(55), toY(36.5), 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Goal Nets (outside lines: 7.32m wide, 2.2m deep)
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(toX(0.3), toY(32.84), toW(2.2), toH(7.32));
      ctx.strokeRect(toX(0.3), toY(32.84), toW(2.2), toH(7.32));

      ctx.fillRect(toX(107.5), toY(32.84), toW(2.2), toH(7.32));
      ctx.strokeRect(toX(107.5), toY(32.84), toW(2.2), toH(7.32));

      // Left Penalty Area (16.5m x 40.32m)
      ctx.strokeRect(toX(2.5), toY(16.34), toW(16.5), toH(40.32));

      // Left 6-yard box (5.5m x 18.32m)
      ctx.strokeRect(toX(2.5), toY(27.34), toW(5.5), toH(18.32));

      // Left Penalty Spot (11m from line -> 13.5m)
      ctx.beginPath();
      ctx.arc(toX(13.5), toY(36.5), 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Left Penalty Arc (9.15m radius centered at spot)
      ctx.beginPath();
      ctx.arc(toX(13.5), toY(36.5), toH(9.15), -0.93, 0.93);
      ctx.stroke();

      // Right Penalty Area (16.5m x 40.32m)
      ctx.strokeRect(toX(91), toY(16.34), toW(16.5), toH(40.32));

      // Right 6-yard box (5.5m x 18.32m)
      ctx.strokeRect(toX(102), toY(27.34), toW(5.5), toH(18.32));

      // Right Penalty Spot (11m from line -> 96.5m)
      ctx.beginPath();
      ctx.arc(toX(96.5), toY(36.5), 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Right Penalty Arc (9.15m radius centered at spot)
      ctx.beginPath();
      ctx.arc(toX(96.5), toY(36.5), toH(9.15), Math.PI - 0.93, Math.PI + 0.93);
      ctx.stroke();

      // Corner Arcs (1m radius)
      const cR = toH(1.2);
      ctx.beginPath();
      ctx.arc(toX(2.5), toY(2.5), cR, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(toX(107.5), toY(2.5), cR, Math.PI / 2, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(toX(2.5), toY(70.5), cR, -Math.PI / 2, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(toX(107.5), toY(70.5), cR, Math.PI, -Math.PI / 2);
      ctx.stroke();

      // Corner flags
      const flagCorners = [
        [toX(2.5), toY(2.5)],
        [toX(107.5), toY(2.5)],
        [toX(2.5), toY(70.5)],
        [toX(107.5), toY(70.5)],
      ];
      flagCorners.forEach(([fx, fy]) => {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // Outer Pitch Frame Border
    ctx.strokeStyle = "#1f293d";
    ctx.lineWidth = 3;
    ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);

    // 2. Render Drawing Actions
    let exportDrawings: any[] = [];
    if (schemaOverride && schemaOverride.drawings !== undefined) {
      exportDrawings = Array.isArray(schemaOverride.drawings) ? schemaOverride.drawings : [];
    } else {
      exportDrawings = drawingActions || [];
    }

    exportDrawings.forEach((action: any) => {
      if (!action.points || action.points.length < 2) return;
      ctx.strokeStyle = action.color || "#00E599";
      ctx.fillStyle = action.color || "#00E599";
      ctx.lineWidth = (action.size || 4) * 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([]);

      const getExportX = (pt: { x: number; y: number }) => pitchX + (pt.x / 100) * pitchW;
      const getExportY = (pt: { x: number; y: number }) => pitchY + (pt.y / 100) * pitchH;

      const startX = getExportX(action.points[0]);
      const startY = getExportY(action.points[0]);
      const endX = getExportX(action.points[action.points.length - 1]);
      const endY = getExportY(action.points[action.points.length - 1]);

      if (action.tool === "brush") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(getExportX(action.points[i]), getExportY(action.points[i]));
        }
        ctx.stroke();
      } else if (action.tool === "arrow-direct" || action.tool === "arrow-deep" || action.tool === "arrow-run") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        if (action.tool === "arrow-deep") ctx.setLineDash([10, 8]);
        else if (action.tool === "arrow-run") ctx.setLineDash([4, 6]);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLen = 16;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (action.tool === "shape-circle") {
        ctx.beginPath();
        const r = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        ctx.arc(startX, startY, r, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.tool === "shape-rect") {
        ctx.strokeRect(startX, startY, endX - startX, endY - startY);
      } else if (action.tool === "shape-line" || action.tool === "shape-dashed-line") {
        ctx.beginPath();
        if (action.tool === "shape-dashed-line") {
          ctx.setLineDash([10, 8]);
        }
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        if (action.tool === "shape-dashed-line") {
          ctx.setLineDash([]);
        }
      }
    });

    // 3. Render Player Tokens
    let exportTokens: any[] = [];
    if (schemaOverride) {
      if (Array.isArray(schemaOverride)) {
        exportTokens = schemaOverride;
      } else if (Array.isArray(schemaOverride.keyframes?.[0])) {
        exportTokens = schemaOverride.keyframes[0];
      } else if (Array.isArray(schemaOverride.keyframes?.[0]?.players)) {
        exportTokens = schemaOverride.keyframes[0].players;
      } else if (Array.isArray(schemaOverride.players)) {
        exportTokens = schemaOverride.players;
      } else if (Array.isArray(schemaOverride.tokens)) {
        exportTokens = schemaOverride.tokens;
      } else {
        exportTokens = currentTokens;
      }
    } else {
      exportTokens = currentTokens;
    }

    if (!exportTokens || exportTokens.length === 0) {
      exportTokens = currentTokens;
    }

    exportTokens.forEach((token: any) => {
      if (token.type === "ball" && !showBall && !schemaOverride) return;
      if (token.type === "player_b" && !showOpponents && !schemaOverride) return;

      const tokX = pitchX + (token.x / 100) * pitchW;
      const tokY = pitchY + (token.y / 100) * pitchH;
      const radius = 22;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.arc(tokX, tokY, radius, 0, 2 * Math.PI);

      if (token.type === "player_a") {
        ctx.fillStyle = teamAColor || "#00E599";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.restore();
        ctx.fillStyle = "#090d14";
        ctx.font = "900 15px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(token.number ?? token.role ?? "A"), tokX, tokY);
      } else if (token.type === "player_b") {
        ctx.fillStyle = teamBColor || "#e11d48";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.restore();
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 15px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(token.number ?? token.role ?? "B"), tokX, tokY);
      } else if (token.type === "ball") {
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚽", tokX, tokY);
      } else {
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
        ctx.fillStyle = "#000000";
        ctx.font = "900 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("R", tokX, tokY);
      }

      // Player Name Tag under token
      if (token.name && token.type !== "ball") {
        ctx.font = "bold 11.5px system-ui, sans-serif";
        const nameText = token.name;
        const textWidth = ctx.measureText(nameText).width;
        const padX = 7;
        const tagH = 19;
        const tagY = tokY + radius + 4;

        ctx.fillStyle = "rgba(9, 13, 20, 0.92)";
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(tokX - textWidth / 2 - padX, tagY, textWidth + padX * 2, tagH, 4);
        } else {
          ctx.rect(tokX - textWidth / 2 - padX, tagY, textWidth + padX * 2, tagH);
        }
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nameText, tokX, tagY + tagH / 2);
      }
    });

    ctx.shadowBlur = 0;

    // 4. Rich Match Recap & Tactical Notes Footer (only for match reports)
    if (isMatchReport) {
      const footerY = pitchY + pitchH + paddingYBottom;
      const footerAreaH = 280;

      ctx.fillStyle = "#080d14";
      ctx.fillRect(0, footerY, w, footerAreaH);

      ctx.strokeStyle = "#00E599";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, footerY);
      ctx.lineTo(w, footerY);
      ctx.stroke();

      ctx.textBaseline = "alphabetic";

      const panelW = Math.floor((w - 60 - 30) / 3);
      const p1X = 30;
      const p2X = p1X + panelW + 15;
      const p3X = p2X + panelW + 15;

      // Panel 1: Match Events Feed
      ctx.fillStyle = "#111827";
      ctx.fillRect(p1X, footerY + 15, panelW, 245);
      ctx.strokeStyle = "#1f293d";
      ctx.lineWidth = 1;
      ctx.strokeRect(p1X, footerY + 15, panelW, 245);

      ctx.fillStyle = "#00E599";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.textAlign = "left";
      const visibleCanvasEvents = matchEvents.filter((e) => e.type !== "assist");
      ctx.fillText(`⚽ ÉVÉNEMENTS DU MATCH (${visibleCanvasEvents.length})`, p1X + 15, footerY + 40);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 11px system-ui, sans-serif";
      if (visibleCanvasEvents.length > 0) {
        visibleCanvasEvents.slice(0, 7).forEach((evt, idx) => {
          const icon = evt.type === "goal" ? "⚽" : evt.type === "yellow" ? "🟨" : evt.type === "red" ? "🟥" : "🔄";
          const passeurStr = evt.type === "goal" && evt.assister ? ` (${evt.assister})` : "";
          const evtLine = `${icon} ${evt.player}${passeurStr} ${evt.time ? `- ${evt.period ? `${evt.period} ` : ''}${evt.time}` : ''}`;
          ctx.fillText(evtLine, p1X + 15, footerY + 68 + idx * 24);
        });
        if (visibleCanvasEvents.length > 7) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "500 10px system-ui, sans-serif";
          ctx.fillText(`... et ${visibleCanvasEvents.length - 7} autre(s) action(s)`, p1X + 15, footerY + 245);
        }
      } else {
        ctx.fillStyle = "#64748b";
        ctx.font = "italic 500 11px system-ui, sans-serif";
        ctx.fillText("Aucun événement enregistré pendant le match.", p1X + 15, footerY + 68);
      }

      // Panel 2: Stats & Details
      ctx.fillStyle = "#111827";
      ctx.fillRect(p2X, footerY + 15, panelW, 245);
      ctx.strokeStyle = "#1f293d";
      ctx.strokeRect(p2X, footerY + 15, panelW, 245);

      ctx.fillStyle = "#00E599";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.fillText("📊 SYNTHÈSE & DÉTAILS DU MATCH", p2X + 15, footerY + 40);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 12px system-ui, sans-serif";
      ctx.fillText(`Score Final : ${homeScore} - ${awayScore}`, p2X + 15, footerY + 70);
      ctx.fillText(`Compétition : ${activeMatch?.competition || "Regular"}`, p2X + 15, footerY + 98);
      ctx.fillText(`Date & Heure : ${activeMatch?.dateTime || activeMatch?.date || "Non renseignée"}`, p2X + 15, footerY + 126);
      ctx.fillText(`Temps de Jeu : ${formatLiveTime(liveTimerSeconds)}`, p2X + 15, footerY + 154);
      ctx.fillText(`Buts enregistrés : ${matchEvents.filter(e => e.type === "goal").length}`, p2X + 15, footerY + 182);
      ctx.fillText(`Schémas tactiques liés : ${savedTactics.filter(sc => (sc.matchId || "match_1") === activeMatchId).length}`, p2X + 15, footerY + 210);

      // Panel 3: Tactical Notes & Remarks
      ctx.fillStyle = "#111827";
      ctx.fillRect(p3X, footerY + 15, panelW, 245);
      ctx.strokeStyle = "#1f293d";
      ctx.strokeRect(p3X, footerY + 15, panelW, 245);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.fillText("📝 CONSIGNES & CAUSERIE DU COACH", p3X + 15, footerY + 40);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "500 11px system-ui, sans-serif";
      const rawNote = schemaOverride?.description || schemaOverride?.notes || (schemaOverride ? "" : tacticalNotes);
      if (rawNote && rawNote.trim()) {
        drawWrappedCanvasText(ctx, rawNote.trim(), p3X + 15, footerY + 68, panelW - 30, 22, 8);
      } else {
        ctx.fillStyle = "#64748b";
        ctx.font = "italic 500 11px system-ui, sans-serif";
        ctx.fillText("Aucune note tactique particulière pour ce match.", p3X + 15, footerY + 68);
      }
    }

    return exportCanvas.toDataURL("image/png");
  };

  // Execute PNG Image Download Directly
  const handleDoExportImage = () => {
    try {
      const dataUrl = generateCompositeTacticsCanvas();
      if (!dataUrl) {
        alert("Erreur lors de la préparation de l'image.");
        return;
      }
      const link = document.createElement("a");
      const matchNameSlug = activeMatch ? `${activeMatch.homeTeam}_VS_${activeMatch.awayTeam}`.replace(/\s+/g, "_") : `Tactique_${activeSport.toUpperCase()}`;
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

  // Directly download image or open checkout if free user
  const handleOpenExportModal = () => {
    if (isProOrAdmin) {
      handleDoExportImage();
    } else {
      setIsCheckoutOpen(true);
    }
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
  const handleShareMatchWhatsApp = () => {
    const goalsEvts = matchEvents.filter((e) => e.type === "goal");
    const cardsEvts = matchEvents.filter((e) => e.type === "yellow" || e.type === "red");
    const subsEvts = matchEvents.filter((e) => e.type === "sub");

    let msg = `🏆 *BILAN DU MATCH* : ${activeMatch?.homeTeam || "Domicile"} vs ${activeMatch?.awayTeam || "Extérieur"}\n`;
    msg += `📊 *Score Final :* ${homeScore} - ${awayScore}\n`;
    if (activeMatch?.competition) {
      msg += `🏆 *Compétition :* ${activeMatch.competition}\n`;
    }
    if (activeMatch?.dateTime) {
      msg += `📅 *Date & Heure :* ${activeMatch.dateTime}\n`;
    }
    msg += `⏱️ *Temps de jeu :* ${formatLiveTime(liveTimerSeconds)}\n\n`;

    if (goalsEvts.length > 0) {
      msg += `⚽ *Buteurs :*\n`;
      goalsEvts.forEach((g) => {
        const passeurStr = g.assister ? ` (${g.assister})` : "";
        msg += `  • ${g.player}${passeurStr} ${g.time ? `(${g.period ? `${g.period} ` : ''}${g.time})` : ""}\n`;
      });
      msg += `\n`;
    }

    if (cardsEvts.length > 0) {
      msg += `🟨 *Sanctions :*\n`;
      cardsEvts.forEach((c) => {
        msg += `  • ${c.type === "red" ? "🟥 Carton Rouge" : "🟨 Carton Jaune"} : ${c.player} ${c.time ? `(${c.time})` : ""}\n`;
      });
      msg += `\n`;
    }

    if (subsEvts.length > 0) {
      msg += `🔄 *Remplacements :*\n`;
      subsEvts.forEach((s) => {
        msg += `  • ${s.player} ${s.time ? `(${s.time})` : ""}\n`;
      });
      msg += `\n`;
    }

    if (tacticalNotes && tacticalNotes.trim()) {
      msg += `📝 *Note & Causerie du Coach :*\n${tacticalNotes.trim()}\n\n`;
    }

    msg += `⚡ *Partagé via THE BOX TAC TIK PRO*`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Mic dictation implementation using browser Web Speech API
  const handleToggleMicRecording = () => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (isRecordingVoice) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setIsRecordingVoice(false);
      setSpeechError(null);
      return;
    }

    if (!SpeechRecognitionAPI) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(() => {
            alert(
              "Le microphone fonctionne, mais la reconnaissance vocale automatique (SpeechRecognition) n'est pas disponible sur ce navigateur. Veuillez utiliser Google Chrome, Microsoft Edge ou Safari."
            );
          })
          .catch(() => {
            alert(
              "Accès au microphone bloqué ou refusé. Veuillez autoriser l'accès au microphone dans la barre d'adresse de votre navigateur."
            );
          });
      } else {
        alert("La dictée vocale n'est pas supportée sur ce navigateur.");
      }
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "fr-FR";

      recognition.onstart = () => {
        setIsRecordingVoice(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }

        if (finalTranscript) {
          setTacticalNotes((prev) => {
            const needsSpace = prev && !prev.endsWith("\n") && !prev.endsWith(" ");
            return prev + (needsSpace ? " " : "") + finalTranscript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setSpeechError("Microphone bloqué par le navigateur.");
          alert("Accès au microphone refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.");
          setIsRecordingVoice(false);
          recognitionRef.current = null;
        } else if (event.error === "no-speech") {
          // ignore transient no-speech
        } else {
          setSpeechError(`Erreur micro : ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsRecordingVoice(false);
            recognitionRef.current = null;
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Erreur d'initialisation micro:", err);
      alert("Impossible de démarrer le microphone.");
      setIsRecordingVoice(false);
    }
  };

  const renderPlayerEditPanel = () => {
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
                  className={`px-2 py-1 rounded-lg border text-left flex items-center gap-1.5 transition cursor-pointer shrink-0 text-xs ${
                    token.type === "player_a"
                      ? "bg-[#090d14] border-[#00e599]/30 hover:border-[#00E599] text-slate-200 hover:bg-[#102420]"
                      : "bg-[#090d14] border-rose-900/40 hover:border-rose-500 text-rose-200 hover:bg-[#251016]"
                  }`}
                  title={`Éditer ${token.name}`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-black shrink-0 ${
                      token.type === "player_a" ? "bg-[#00E599] text-[#0d1117]" : "bg-rose-600 text-white"
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
        className={`w-full bg-[#0d1117] border ${
          isHome ? "border-[#00E599]/50 shadow-[#00e599]/5" : "border-rose-500/50 shadow-rose-500/5"
        } rounded-2xl shadow-xl p-2.5 transition-all duration-200 flex flex-col gap-2.5`}
      >
        {/* LIGNE 1 : INFORMATIONS JOUEUR À L'HORIZONTALE */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f293d] pb-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Photo / Avatar */}
            <div className="relative shrink-0">
              {activeToken.photo ? (
                <img
                  src={activeToken.photo}
                  alt={activeToken.name}
                  className={`w-8 h-8 rounded-full object-cover border-2 ${isHome ? "border-[#00E599]" : "border-rose-500"}`}
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 ${
                    isHome
                      ? "bg-[#00E599] text-[#0d1117] border-[#00e599]"
                      : "bg-rose-600 text-white border-rose-400"
                  }`}
                >
                  {activeToken.number || "?"}
                </div>
              )}
            </div>

            {/* Nom */}
            <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] rounded-lg px-2 py-1 flex-1 min-w-[130px] max-w-[200px]">
              <span className="text-[8px] font-black text-[#62728f] uppercase shrink-0">NOM :</span>
              <input
                type="text"
                value={activeToken.name}
                onChange={(e) => updateTokenField("name", e.target.value)}
                className="bg-transparent text-xs font-black text-white w-full outline-none"
                placeholder="Nom du joueur"
              />
            </div>

            {/* N° */}
            <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] rounded-lg px-2 py-1 w-20 shrink-0">
              <span className="text-[8px] font-black text-[#62728f] uppercase shrink-0">N° :</span>
              <select
                value={activeToken.number ?? ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) return;
                  if (isHome) {
                    handleAssignUniqueNumber(activeToken.id, true, val);
                  } else {
                    updateTokenField("number", val);
                  }
                }}
                className="bg-transparent text-xs font-black text-white w-full outline-none text-center cursor-pointer"
                title="Numéro unique (seuls les numéros disponibles sont proposés)"
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
              <span className="text-[8px] font-black text-[#62728f] uppercase shrink-0">POSTE :</span>
              <input
                type="text"
                value={activeToken.role || ""}
                onChange={(e) => updateTokenField("role", e.target.value)}
                className="bg-transparent text-xs font-black text-white w-full outline-none uppercase text-center"
                placeholder="Poste"
              />
            </div>

            {/* Photo URL */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] rounded-lg px-2 py-1 flex-1 min-w-[110px] max-w-[190px]">
              <span className="text-[8px] font-black text-[#62728f] uppercase shrink-0">PHOTO :</span>
              <input
                type="text"
                value={activeToken.photo || ""}
                onChange={(e) => updateTokenField("photo", e.target.value)}
                className="bg-transparent text-[9.5px] text-slate-300 w-full outline-none truncate"
                placeholder="URL (https://...)"
              />
            </div>

            {/* Badge Équipe */}
            <span
              className={`text-[8px] px-2 py-1 rounded font-black uppercase border shrink-0 ${
                isHome
                  ? "bg-[#102420] text-[#00E599] border-[#00e599]/30"
                  : "bg-rose-950 text-rose-300 border-rose-800"
              }`}
            >
              {isHome ? "MON CLUB" : "MON ADVERSAIRE"}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setEditingToken(null);
              setQuickActionToken(null);
            }}
            className="p-1.5 bg-[#172233] hover:bg-rose-900/80 text-slate-300 hover:text-white rounded-lg transition cursor-pointer shrink-0"
            title="Fermer la fiche joueur"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* LIGNE 2 : STATS GLOBALES DU JOUEUR */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#090d14] px-2.5 py-1.5 rounded-xl border border-[#1a2130]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>STATS GLOBALES :</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Buts ⚽ */}
            <div className="flex items-center gap-1.5 bg-[#102420] border border-[#00e599]/30 px-2.5 py-1 rounded-lg text-emerald-300 font-bold text-[10.5px]">
              <span>⚽</span>
              <span className="text-[8.5px] uppercase font-black text-slate-400">Buts :</span>
              <span className="font-black text-[#00E599] text-xs">{playerGoals}</span>
            </div>

            {/* Passes D. 👟 */}
            <div className="flex items-center gap-1.5 bg-[#0f2334] border border-cyan-500/30 px-2.5 py-1 rounded-lg text-cyan-300 font-bold text-[10.5px]">
              <span>👟</span>
              <span className="text-[8.5px] uppercase font-black text-slate-400">Passes D. :</span>
              <span className="font-black text-cyan-400 text-xs">{playerAssists}</span>
            </div>

            {/* Cartons Jaunes 🟨 */}
            <div className="flex items-center gap-1.5 bg-[#241c10] border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-300 font-bold text-[10.5px]">
              <span>🟨</span>
              <span className="text-[8.5px] uppercase font-black text-slate-400">Jaune :</span>
              <span className="font-black text-amber-400 text-xs">{playerYellows}</span>
            </div>

            {/* Cartons Rouges 🟥 */}
            <div className="flex items-center gap-1.5 bg-[#2c1318] border border-rose-500/30 px-2.5 py-1 rounded-lg text-rose-300 font-bold text-[10.5px]">
              <span>🟥</span>
              <span className="text-[8.5px] uppercase font-black text-slate-400">Rouge :</span>
              <span className="font-black text-rose-400 text-xs">{playerReds}</span>
            </div>

            {/* État / Forme */}
            <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] px-2.5 py-1 rounded-lg text-[10.5px]">
              <span className="text-[8.5px] uppercase font-black text-slate-400">Forme :</span>
              {isInjured ? (
                <span className="text-amber-400 font-black flex items-center gap-1">🏥 Blessé</span>
              ) : playerReds > 0 ? (
                <span className="text-rose-400 font-black flex items-center gap-1">🟥 Expulsé</span>
              ) : isTired ? (
                <span className="text-yellow-400 font-black flex items-center gap-1">⚠️ Fatigué</span>
              ) : isExcellent ? (
                <span className="text-emerald-400 font-black flex items-center gap-1">⭐ Excellente</span>
              ) : (
                <span className="text-[#00E599] font-black flex items-center gap-1">✅ En forme</span>
              )}
            </div>
          </div>
        </div>

        {/* LIGNE 3 : REMPLACEMENT (MENU DÉROULANT) & ACTIONS MATCH */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#1f293d]/80">
          {/* Section Remplacement avec Menu Déroulant */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#102420] border border-[#00E599]/40 rounded-xl text-[#00E599] font-black text-xs shrink-0 shadow-sm">
              <RefreshCw className="w-3.5 h-3.5 text-[#00E599]" />
              <span className="text-[9.5px] uppercase tracking-wider">REMPLACEMENT :</span>
            </div>

            {/* Menu Déroulant Principal */}
            {availableSubs.length === 0 ? (
              <span className="text-[10px] text-slate-500 italic bg-[#111827] px-2.5 py-1.5 rounded-xl border border-[#1a2130]">
                Aucun remplaçant disponible sur le banc
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
                  className="bg-[#111827] border-2 border-[#00E599]/60 hover:border-[#00E599] focus:border-[#00E599] text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer shadow-lg transition-all pr-8 appearance-none"
                  title="Sélectionner un remplaçant sur le banc pour effectuer le remplacement"
                >
                  <option value="" disabled>
                    🔄 Sélectionner un remplaçant sur le banc...
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
                        className={`bg-[#0d1117] ${isCurrentlyOnPitch ? "text-slate-500" : "text-white"}`}
                      >
                        {isCurrentlyOnPitch ? "⚠️ " : "🔄 "}
                        N°{sub.number || "?"} - {sub.name} ({sub.role || "SUB"})
                        {isCurrentlyOnPitch ? " [Déjà sur le terrain]" : ""}
                        {sub.status === "injured" ? " [Blessé 🏥]" : ""}
                        {sub.status === "tired" ? " [Fatigué ⚠️]" : ""}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-2.5 pointer-events-none text-[#00E599] text-[10px]">
                  ▼
                </div>
              </div>
            )}

            {/* Bouton pour ouvrir la modale complète avec fiches/photos */}
            <button
              type="button"
              onClick={() => setSubPickerToken(activeToken)}
              className="px-2.5 py-1.5 bg-[#172233] hover:bg-[#202f4a] border border-[#263750] text-slate-200 hover:text-white font-bold text-[10px] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Ouvrir la modale complète avec les cartes et photos de tous les remplaçants"
            >
              <span>📋</span>
              <span>Fiche banc</span>
            </button>

            {/* Sorties directes */}
            <button
              type="button"
              onClick={() => handleRemovePlayerFromPitch(activeToken, "normal")}
              className="px-2.5 py-1.5 bg-[#172233] hover:bg-[#22334d] border border-[#263750] text-slate-300 hover:text-white rounded-xl text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="Sortie normale du joueur (sans remplacement)"
            >
              <span>🚪</span>
              <span>Sortie</span>
            </button>

            <button
              type="button"
              onClick={() => handleRemovePlayerFromPitch(activeToken, "injured")}
              className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-800 border border-amber-600/80 text-amber-200 hover:text-white rounded-xl text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="Sortie sur blessure"
            >
              <span>🏥</span>
              <span>Blessure</span>
            </button>
          </div>

          {/* LIGNE ACTIONS LIVE MATCH (UNIQUEMENT QUAND LE MODE LIVE EST ACTIVÉ) */}
          {isLiveMatchMode && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>ACTIONS LIVE :</span>
              </span>

              <button
                type="button"
                onClick={() => handleRecordGoal(activeToken)}
                className="px-2 py-1 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-500/80 text-emerald-200 hover:text-white rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="Ajouter un but à ce joueur"
              >
                <span>⚽</span>
                <span>+1 BUT</span>
              </button>

              <button
                type="button"
                onClick={() => handleRecordAssist(activeToken)}
                className="px-2 py-1 bg-cyan-950/90 hover:bg-cyan-800 border border-cyan-500/80 text-cyan-200 hover:text-white rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="Ajouter une passe décisive à ce joueur"
              >
                <span>👟</span>
                <span>+1 PASSE D.</span>
              </button>

              <button
                type="button"
                onClick={() => handleGiveYellowCard(activeToken)}
                className="px-2 py-1 bg-amber-950/90 hover:bg-amber-800 border border-amber-500/80 text-amber-200 hover:text-white rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="Attribuer un carton jaune"
              >
                <span>🟨</span>
                <span>CARTON J.</span>
              </button>

              <button
                type="button"
                onClick={() => handleRemovePlayerFromPitch(activeToken, "red_card")}
                className="px-2 py-1 bg-rose-950/90 hover:bg-rose-800 border border-rose-600/80 text-rose-200 hover:text-white rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="Expulsion (Carton Rouge)"
              >
                <span>🟥</span>
                <span>ROUGE</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dimensions dynamiques du terrain adaptées à l'espace vide disponible :
  // - Quand la boîte à outils compacte s'affiche (joueur sélectionné en Live Match), le terrain s'adapte en se réduisant
  //   pour que terrain + boîte à outils s'intègrent parfaitement sans débordement ni barre de défilement.
  // - Quand la boîte à outils est masquée, le terrain s'agrandit pour occuper harmonieusement tout l'espace disponible.
  const isToolboxVisible = Boolean(isLiveMatchMode && liveActionToken);

  const currentPitchRatio = aspectRatioMode === "mobile" 
    ? (terrainComplet ? 1 / getSportRatioNum(activeSport) : 2 / getSportRatioNum(activeSport)) 
    : (terrainComplet ? getSportRatioNum(activeSport) : getSportRatioNum(activeSport) / 2);

  const pitchTargetVh = isBoardFullscreen
    ? (!isLiveMatchMode && isAnimationCreatorOpen ? 50 : (isToolboxVisible ? 62 : 78))
    : (!isLiveMatchMode && isAnimationCreatorOpen ? 48 : (isToolboxVisible ? 54 : 68));

  // Dynamic calculation for Fullscreen mode: subtract exact top & bottom bars height from 100vh
  const fullscreenHeightExpr = !isLiveMatchMode && isAnimationCreatorOpen 
    ? "calc(100vh - 135px)" 
    : isToolboxVisible 
    ? "calc(100vh - 125px)" 
    : "calc(100vh - 75px)";

  const normalPitchHeightExpr = !isLiveMatchMode && isAnimationCreatorOpen 
    ? "min(48vh, calc(100vh - 230px))" 
    : isToolboxVisible 
    ? "min(54vh, calc(100vh - 200px))" 
    : "min(65vh, calc(100vh - 150px))";

  const pitchMaxHeight = isPitchFullscreen 
    ? fullscreenHeightExpr 
    : normalPitchHeightExpr;

  const fullscreenSidePanelsWidth = (isTeamAPanelCollapsed ? 42 : 180) + (showOpponents ? (isTeamBPanelCollapsed ? 42 : 180) : 0);

  const pitchMaxWidth = isPitchFullscreen
    ? (aspectRatioMode === "mobile" 
        ? `min(calc(96vw - ${fullscreenSidePanelsWidth}px), calc(${fullscreenHeightExpr} * ${currentPitchRatio}))` 
        : `min(calc(98vw - ${fullscreenSidePanelsWidth}px), calc(${fullscreenHeightExpr} * ${currentPitchRatio}))`)
    : (aspectRatioMode === "mobile" 
        ? `min(88vw, calc(${normalPitchHeightExpr} * ${currentPitchRatio}))` 
        : `min(100%, calc(${normalPitchHeightExpr} * ${currentPitchRatio}))`);

  // Petite boîte à outils Live Match (options de match : buteur, passeur, carton jaune, carton rouge, blessure)
  const renderLiveMatchToolbox = () => {
    if (!isLiveMatchMode || !liveActionToken) return null;

    const currentLiveToken = currentTokens.find((t) => t.id === liveActionToken.id) || liveActionToken;
    const isHome = currentLiveToken.type === "player_a";
    const currentGoals = matchEvents.filter((e) => e.type === "goal" && e.player === currentLiveToken.name).length;
    const currentAssists = matchEvents.filter((e) => (e.type === "assist" && e.player === currentLiveToken.name) || (e.type === "goal" && e.assister === currentLiveToken.name)).length;
    const currentYellows = (currentLiveToken.yellowCards && currentLiveToken.yellowCards > 0) 
      ? currentLiveToken.yellowCards 
      : matchEvents.filter((e) => e.type === "yellow" && e.player === currentLiveToken.name).length;

    return (
      <div
        id="live-match-player-toolbox"
        className="w-full mx-auto mt-2 transition-all duration-300 ease-in-out z-40 shrink-0 select-none animate-fade-in"
        style={{ maxWidth: pitchMaxWidth }}
      >
        <div className="bg-[#0d1117]/95 border border-[#00E599]/60 shadow-[0_0_20px_rgba(0,229,153,0.12)] rounded-2xl px-3 py-2 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5">
          {/* Identité joueur */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border shrink-0 ${
                isHome
                  ? "bg-[#00E599] text-[#0d1117] border-[#00e599]"
                  : "bg-rose-600 text-white border-rose-400"
              }`}
            >
              {currentLiveToken.number || "?"}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white truncate max-w-[130px] sm:max-w-[180px]">
                  {currentLiveToken.name}
                </span>
                <span
                  className={`text-[8px] font-black px-1.5 py-0.2 rounded border shrink-0 ${
                    isHome
                      ? "bg-[#102420] text-[#00E599] border-[#00e599]/30"
                      : "bg-rose-950 text-rose-300 border-rose-800"
                  }`}
                >
                  {isHome ? "MON CLUB" : "MON ADVERSAIRE"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-slate-400">
                <span>{currentLiveToken.role || "JOUEUR"}</span>
                {currentGoals > 0 && (
                  <span className="text-emerald-400 font-black flex items-center gap-0.5">
                    ⚽ x{currentGoals}
                  </span>
                )}
                {currentAssists > 0 && (
                  <span className="text-cyan-300 font-black flex items-center gap-0.5">
                    👟 x{currentAssists}
                  </span>
                )}
                {currentYellows > 0 && (
                  <span className="text-amber-400 font-black flex items-center gap-0.5">
                    🟨 (1/2)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Options de match en direct */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {/* buteur (b) */}
            <button
              type="button"
              onClick={() => handleRecordGoal(currentLiveToken)}
              className="px-2.5 py-1.5 bg-emerald-950/90 hover:bg-emerald-800 border border-emerald-500/70 hover:border-emerald-400 text-emerald-200 hover:text-white rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
              title="Ajouter un but à ce joueur (Raccourci clavier : B)"
            >
              <span>⚽</span>
              <span>buteur (b)</span>
            </button>

            {/* passeur (p) */}
            <button
              type="button"
              onClick={() => handleRecordAssist(currentLiveToken)}
              className="px-2.5 py-1.5 bg-cyan-950/90 hover:bg-cyan-800 border border-cyan-500/70 hover:border-cyan-400 text-cyan-200 hover:text-white rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
              title="Ajouter une passe décisive à ce joueur (Raccourci clavier : P)"
            >
              <span>👟</span>
              <span>passeur (p)</span>
            </button>

            {/* carton jaune (CJ) */}
            <button
              type="button"
              onClick={() => {
                const yellowsBefore = currentLiveToken.yellowCards || 0;
                handleGiveYellowCard(currentLiveToken);
                if (yellowsBefore >= 1) {
                  setLiveActionToken(null);
                } else {
                  setLiveActionToken({ ...currentLiveToken, yellowCards: 1 });
                }
              }}
              className="px-2.5 py-1.5 bg-amber-950/90 hover:bg-amber-800 border border-amber-500/70 hover:border-amber-400 text-amber-200 hover:text-white rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
              title="Donner un carton jaune (CJ) - 2ème = exclusion (Raccourci clavier : J)"
            >
              <span>🟨</span>
              <span>carton jaune (CJ)</span>
            </button>

            {/* carton rouge (CR) */}
            <button
              type="button"
              onClick={() => {
                handleRemovePlayerFromPitch(currentLiveToken, "red_card");
                setLiveActionToken(null);
              }}
              className="px-2.5 py-1.5 bg-rose-950/90 hover:bg-rose-800 border border-rose-600/70 hover:border-rose-400 text-rose-200 hover:text-white rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
              title="Carton rouge (CR) - Expulsion immédiate (Raccourci clavier : R)"
            >
              <span>🟥</span>
              <span>carton rouge (CR)</span>
            </button>

            {/* blessure (B) */}
            <button
              type="button"
              onClick={() => {
                handleRemovePlayerFromPitch(currentLiveToken, "injured");
                setLiveActionToken(null);
              }}
              className="px-2.5 py-1.5 bg-red-950/90 hover:bg-red-800 border border-red-500/70 hover:border-red-400 text-red-200 hover:text-white rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
              title="Blessure (B) - Sortie sur blessure et proposition de remplacement"
            >
              <span>🏥</span>
              <span>blessure (B)</span>
            </button>

            {/* Remplacer */}
            <button
              type="button"
              onClick={() => {
                setSubPickerToken(currentLiveToken);
              }}
              className="px-2 py-1.5 bg-[#172233] hover:bg-[#202f47] border border-[#2d3f5e] hover:border-[#00e599]/40 text-slate-200 hover:text-white rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
              title="Effectuer un remplacement pour ce joueur"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Remplacer</span>
            </button>

            {/* Fermer */}
            <button
              type="button"
              onClick={() => setLiveActionToken(null)}
              className="p-1.5 bg-[#172233] hover:bg-rose-900/80 text-slate-300 hover:text-white rounded-xl transition cursor-pointer shrink-0 ml-0.5"
              title="Fermer la boîte à outils (Échap)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderSubstitutionModal = () => {
    if (!subPickerToken) return null;

    const isOpponent = subPickerToken.type === "player_b";
    const activeBenchList = isOpponent ? opponentSubstitutes : substitutes;
    const teamTitle = isOpponent
      ? (activeMatch.awayTeam || "ÉQUIPE ADVERSE")
      : (activeMatch.homeTeam || "MON CLUB");

    return (
      <div
        id="substitution-modal-overlay"
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto select-none"
        onClick={() => setSubPickerToken(null)}
      >
        <div
          id="substitution-modal-card"
          className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#0d1117] border border-[#1f293d] rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5 text-slate-200 select-auto scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          {/* EN-TÊTE MODALE */}
          <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                isOpponent ? "bg-rose-950/60 border-rose-600/40 text-rose-400" : "bg-[#102420] border-[#00e599]/40 text-[#00E599]"
              }`}>
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Effectuer un Remplacement</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase ${
                    isOpponent ? "bg-rose-950/80 text-rose-300 border-rose-700/60" : "bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30"
                  }`}>
                    {teamTitle}
                  </span>
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  {isOpponent
                    ? "Sélectionnez un remplaçant sur le banc adverse pour entrer à la place de ce joueur"
                    : "Sélectionnez un remplaçant sur le banc pour entrer à la place de ce joueur"}
                </p>
              </div>
            </div>
            <button
              id="btn-close-sub-modal"
              onClick={() => setSubPickerToken(null)}
              className="p-1.5 bg-[#172233] hover:bg-rose-900/80 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* JOUEUR SORTANT (OUT) */}
          <div className={`bg-[#121926] border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 ${
            isOpponent ? "border-rose-800/60" : "border-rose-900/40"
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                {subPickerToken.photo ? (
                  <img
                    src={subPickerToken.photo}
                    alt={subPickerToken.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-rose-500 shadow-md"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-md bg-rose-950 text-rose-300 border-rose-500"
                  >
                    {subPickerToken.number || "?"}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white text-[7.5px] font-black px-1 rounded-full uppercase shadow">
                  OUT
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white truncate max-w-[130px]">
                    {subPickerToken.name}
                  </span>
                  <span className="text-[8px] bg-[#1a2333] text-slate-300 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
                    {subPickerToken.role || "TITULAIRE"}
                  </span>
                </div>
                <div className="text-[10px] text-rose-400 font-bold mt-0.5 flex items-center gap-1">
                  <span>🚪 Joueur sortant du terrain</span>
                </div>
              </div>
            </div>

            {/* Quick direct exit buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="btn-sub-exit-simple"
                onClick={() => {
                  handleRemovePlayerFromPitch(subPickerToken, "normal");
                  setSubPickerToken(null);
                }}
                className="px-2.5 py-1 bg-[#172233] hover:bg-[#22334d] border border-[#263750] text-slate-200 hover:text-white rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Faire sortir sans remplacement"
              >
                <span>🚪 Sortie simple</span>
              </button>
              <button
                type="button"
                id="btn-sub-exit-injured"
                onClick={() => {
                  handleRemovePlayerFromPitch(subPickerToken, "injured");
                  setSubPickerToken(null);
                }}
                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-800 border border-amber-600/80 text-amber-200 hover:text-white rounded-lg text-[9.5px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Sortie sur blessure"
              >
                <span>🏥 Blessure</span>
              </button>
            </div>
          </div>

          {/* LISTE DES REMPLAÇANTS DU BANC (IN) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10.5px] font-black uppercase">
              <span className={`flex items-center gap-1.5 ${isOpponent ? "text-rose-400" : "text-[#00E599]"}`}>
                <User className="w-3.5 h-3.5" />
                <span>Remplaçants sur le banc ({activeBenchList.length})</span>
              </span>
              <span className="text-[9px] text-slate-400 font-normal">
                Cliquez sur &quot;Faire entrer&quot; pour valider
              </span>
            </div>

            <div className="max-h-56 sm:max-h-64 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
              {activeBenchList.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#090d14] border border-[#1a2130] text-center text-xs text-slate-500 italic">
                  {isOpponent
                    ? "Aucun remplaçant présent sur le banc adverse."
                    : "Aucun remplaçant présent sur la feuille de match."}
                </div>
              ) : (
                activeBenchList.map((sub) => {
                  const alreadyActive = currentTokens.some(
                    (t) => (isOpponent ? t.type === "player_b" : t.type === "player_a") &&
                           t.name.toLowerCase() === sub.name.toLowerCase()
                  );
                  const isInjured = sub.status === "injured" || sub.removalReason === "injured";
                  const isRedCard = sub.status === "red_card" || sub.removalReason === "red_card";
                  const isTired = sub.status === "tired";
                  const isExcellent = sub.status === "excellent";

                  return (
                    <div
                      key={sub.id}
                      id={`sub-row-${sub.id}`}
                      className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition ${
                        isRedCard
                          ? "bg-rose-950/30 border-rose-900/50 opacity-60"
                          : isInjured
                          ? "bg-amber-950/30 border-amber-900/50 opacity-60"
                          : alreadyActive
                          ? "bg-[#090d14] border-[#1a2130] opacity-60"
                          : isOpponent
                          ? "bg-[#161118] border-[#381f2a] hover:border-rose-500/60 hover:bg-[#221622]"
                          : "bg-[#101725] border-[#1f2c42] hover:border-[#00E599]/60 hover:bg-[#132034]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {sub.photo ? (
                          <img
                            src={sub.photo}
                            alt={sub.name}
                            className={`w-8 h-8 rounded-full object-cover border shrink-0 ${
                              isOpponent ? "border-rose-500" : "border-[#00E599]"
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              alreadyActive
                                ? "bg-slate-700 text-slate-300"
                                : isOpponent
                                ? "bg-rose-950 border border-rose-600/40 text-rose-300"
                                : "bg-[#102420] border border-[#00e599]/40 text-[#00E599]"
                            }`}
                          >
                            {sub.number || "R"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white truncate max-w-[120px] sm:max-w-[160px]">
                              {sub.name}
                            </span>
                            <span className="text-[8px] bg-[#1a2333] text-cyan-300 border border-cyan-800/40 px-1 py-0.2 rounded font-black uppercase shrink-0">
                              {sub.role || "SUB"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[9px] mt-0.5">
                            {alreadyActive && (
                              <span className={isOpponent ? "text-rose-400 font-bold" : "text-[#00E599] font-bold"}>
                                Sur le terrain
                              </span>
                            )}
                            {isInjured && (
                              <span className="text-amber-400 font-bold">🏥 Blessé</span>
                            )}
                            {isRedCard && (
                              <span className="text-rose-400 font-bold">🟥 Expulsé</span>
                            )}
                            {!alreadyActive && !isInjured && !isRedCard && (
                              <>
                                {isExcellent && (
                                  <span className="text-emerald-400 font-bold">⭐ Excellente forme</span>
                                )}
                                {isTired && (
                                  <span className="text-yellow-400 font-bold">⚠️ Fatigué</span>
                                )}
                                {!isExcellent && !isTired && (
                                  <span className="text-emerald-400 font-medium">✅ Disponible</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remplacer button */}
                      <div>
                        {alreadyActive ? (
                          <span className="text-[9.5px] text-slate-500 font-bold px-2 py-1">
                            En jeu
                          </span>
                        ) : isInjured || isRedCard ? (
                          <span className="text-[9.5px] text-rose-400 font-bold px-2 py-1">
                            Indisponible
                          </span>
                        ) : (
                          <button
                            type="button"
                            id={`btn-swap-to-${sub.id}`}
                            onClick={() => {
                              handleSwapPlayerOnPitch(subPickerToken, sub);
                              setSubPickerToken(null);
                            }}
                            className={`px-3 py-1.5 font-black text-[10px] rounded-lg shadow-md transition cursor-pointer flex items-center gap-1 ${
                              isOpponent
                                ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950"
                            }`}
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Faire entrer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PIED DE MODALE */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1f293d]">
            <button
              type="button"
              onClick={() => {
                setEditingToken(subPickerToken);
                setQuickActionToken(subPickerToken);
                setSubPickerToken(null);
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              Ouvrir la fiche complète du joueur
            </button>

            <button
              type="button"
              id="btn-cancel-sub-modal"
              onClick={() => setSubPickerToken(null)}
              className="px-3.5 py-1.5 bg-[#172233] hover:bg-[#202f4a] text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };

  {/* RENDER FUNCTION: MON CLUB (PANEL A) */}
  const renderTeamAPanel = (isFullscreenMode: boolean = false) => {
    return (
      <div
        className={`${
          isFullscreenMode
            ? `shrink-0 flex flex-col justify-start z-30 transition-all duration-200 ${
                isTeamAPanelCollapsed
                  ? "w-9 xl:w-10 p-1.5"
                  : "w-36 xl:w-44 p-2.5 gap-2"
              } max-h-[calc(100vh-130px)] overflow-y-auto scrollbar-thin ${
                isModernSleek
                  ? "bg-white/95 border-2 border-emerald-500/40 rounded-2xl shadow-2xl text-slate-800 backdrop-blur-md"
                  : "bg-[#0d1117]/95 border border-[#00E599]/40 hover:border-[#00E599]/60 rounded-2xl shadow-2xl backdrop-blur-md text-white"
              }`
            : `w-full ${
                isTeamAPanelCollapsed
                  ? "lg:w-9 xl:w-10 p-1.5"
                  : (isModernSleek ? "lg:w-36 xl:w-44 p-2.5 gap-2" : "lg:w-36 xl:w-40 p-2 lg:p-2.5 gap-1.5 lg:gap-2")
              } shrink-0 flex flex-col justify-start ${isCompactUI ? "p-1.5 gap-1 text-[85%]" : ""} ${
                isModernSleek 
                  ? "bg-white border-2 border-emerald-500/30 rounded-2xl shadow-md text-slate-800" 
                  : "bg-[#0d1117] border border-[#00E599]/30 hover:border-[#00E599]/50 rounded-2xl shadow-xl"
              } transition-all duration-200`
        }`}
      >
        {isTeamAPanelCollapsed ? (
          /* Collapsed View (Vertical tab on desktop/landscape, minimal strip on tablet/mobile) */
          <div 
            onClick={() => setIsTeamAPanelCollapsed(false)}
            className={`w-full flex ${isFullscreenMode ? "flex-col" : "lg:flex-col"} items-center justify-between py-1 px-2 ${isFullscreenMode ? "py-2.5 px-1" : "lg:py-2.5 lg:px-1"} cursor-pointer group select-none gap-2`}
            title="Agrandir le panneau Mon Club"
          >
            <div className={`flex items-center ${isFullscreenMode ? "flex-col" : "lg:flex-col"} gap-1.5`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E599] animate-pulse shrink-0" />
              <span className={`text-[11px] font-black uppercase tracking-wider ${isModernSleek ? "text-emerald-700" : "text-[#00E599]"} ${isFullscreenMode ? "inline" : "hidden lg:inline"} [writing-mode:vertical-rl] rotate-180 my-2`}>
                MON CLUB
              </span>
              {!isFullscreenMode && (
                <span className={`text-xs font-black uppercase tracking-wider ${isModernSleek ? "text-emerald-700" : "text-[#00E599]"} lg:hidden`}>
                  MON CLUB
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsTeamAPanelCollapsed(false); }}
              className={`px-2 py-0.5 ${isFullscreenMode ? "p-1" : "lg:p-1"} rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${
                isModernSleek 
                  ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200" 
                  : "bg-[#162234] text-[#00E599] hover:bg-[#00E599] hover:text-slate-950 border border-[#233149]"
              }`}
              title="Déplier Mon Club"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              {!isFullscreenMode && <span className="lg:hidden text-[9px]">Déplier</span>}
            </button>
          </div>
        ) : (
          <>
            {/* Panel Header */}
            <div className={`flex items-center justify-between border-b ${isModernSleek ? "border-slate-200 pb-1.5" : "border-[#1f293d] pb-1.5"}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
                <span className={`text-[11px] sm:text-[12px] font-black uppercase tracking-wider ${isModernSleek ? "text-emerald-700" : "text-[#00E599]"}`}>
                  MON CLUB
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsTeamAPanelCollapsed(true)}
                  className={`px-2 py-0.5 ${isFullscreenMode ? "p-1" : "lg:p-1"} rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${
                    isModernSleek 
                      ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200" 
                      : "bg-[#162234] text-[#00E599] hover:bg-[#00E599] hover:text-slate-950 border border-[#233149]"
                  }`}
                  title="Réduire le panneau Mon Club"
                  aria-label="Réduire le panneau Mon Club"
                >
                  <Minus className="w-3.5 h-3.5 shrink-0" />
                  {!isFullscreenMode && <span className="lg:hidden text-[9px]">Réduire</span>}
                </button>
              </div>
            </div>

            {/* Formations list */}
            <div className="w-full">
              {!isFullscreenMode && (
                <div className="lg:hidden flex items-center gap-1.5 w-full">
                  <span className={`text-[9px] font-black uppercase tracking-wider shrink-0 ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                    SCHÉMA :
                  </span>
                  <select
                    value={selectedFormationA}
                    onChange={(e) => applyTeamAFormation(e.target.value)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black cursor-pointer border ${
                      isModernSleek
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : "bg-[#090d14] border-[#1a2130] text-[#00E599]"
                    }`}
                  >
                    {getAvailableFormationsForSport(activeSport).map((form) => (
                      <option key={form} value={form} className="bg-[#090d14] text-white">
                        {form}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={isFullscreenMode ? "block" : "hidden lg:block"}>
                <span className={`text-[9px] font-black uppercase tracking-wider block mb-1 ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                  SCHÉMA :
                </span>
                <div className={`flex flex-col gap-1 ${isFullscreenMode ? "max-h-36 xl:max-h-52" : "max-h-32 xl:max-h-48"} overflow-y-auto scrollbar-thin pr-0.5`}>
                  {getAvailableFormationsForSport(activeSport).map((form) => (
                    <button
                      key={form}
                      onClick={() => applyTeamAFormation(form)}
                      className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                        selectedFormationA === form
                          ? isModernSleek
                            ? "bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30"
                            : "bg-[#00E599] text-[#0d1117] font-black shadow-md shadow-[#00e599]/20"
                          : isModernSleek
                            ? "bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 font-bold"
                            : "bg-[#090d14] hover:bg-[#151f30] border border-[#1a2130] hover:border-[#00e599]/30 text-slate-300 hover:text-brand-cream"
                      }`}
                    >
                      {form}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className={`${isFullscreenMode ? "flex flex-col" : "grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-col"} gap-1 pt-1.5 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/50"}`}>
              <button
                onClick={regroupTeamAInCamp}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                    : "bg-gradient-to-r from-[#121926] to-[#182338] hover:from-[#182338] border-[#233149] text-[#00E599] hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs`}
                title="Regrouper les joueurs dans leur camp"
              >
                <RotateCcw className={`w-3 h-3 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"} shrink-0`} />
                <span>Dans leur camp</span>
              </button>

              <button
                onClick={clearTeamAPlayers}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek
                    ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
                    : "bg-emerald-950/80 hover:bg-emerald-900 border-emerald-800/80 text-emerald-200 hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center text-center shadow-2xs`}
              >
                Effacer
              </button>

              {/* Button 1: Effectif Mon Club */}
              <button
                onClick={() => {
                  setRolesTargetTeam("home");
                  setTeamRolesModalTab("players");
                  setIsSetPiecesOpen(true);
                }}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                    : "bg-gradient-to-r from-[#121926] to-[#182338] hover:from-[#182338] border-[#233149] text-[#00E599] hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs relative`}
                title="Gérer l'effectif, les noms, numéros de maillot et postes de Mon Club"
              >
                <span className="text-xs">👥</span>
                <span>Effectif</span>
                <span className="text-[8.5px] font-mono text-emerald-300 font-bold ml-0.5">
                  ({currentTokens.filter((t) => t.type === "player_a").length + substitutes.length})
                </span>
              </button>

              {/* Button 2: Rôles Mon Club */}
              <button
                onClick={() => {
                  setRolesTargetTeam("home");
                  setTeamRolesModalTab("setpieces");
                  setIsSetPiecesOpen(true);
                }}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                    : "bg-gradient-to-r from-[#121926] to-[#182338] hover:from-[#182338] border-[#233149] text-[#00E599] hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs relative`}
                title="Désigner le Capitaine, Penaltys, Corners et Coups Francs de Mon Club"
              >
                <span className="text-xs">🎯</span>
                <span>Rôles Tactiques</span>
                {Object.values(setPieceRoles).filter(Boolean).length > 0 && (
                  <span className="bg-[#00E599] text-slate-950 font-black text-[8px] px-1.5 py-0.2 rounded-full ml-0.5">
                    {Object.values(setPieceRoles).filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  {/* RENDER FUNCTION: MON ADVERSAIRE (PANEL B) */}
  const renderTeamBPanel = (isFullscreenMode: boolean = false) => {
    return (
      <div
        className={`${
          isFullscreenMode
            ? `shrink-0 flex flex-col justify-start z-30 transition-all duration-200 ${
                isTeamBPanelCollapsed
                  ? "w-9 xl:w-10 p-1.5"
                  : "w-36 xl:w-44 p-2.5 gap-2"
              } max-h-[calc(100vh-130px)] overflow-y-auto scrollbar-thin ${
                isModernSleek
                  ? "bg-white/95 border-2 border-rose-500/40 rounded-2xl shadow-2xl text-slate-800 backdrop-blur-md"
                  : "bg-[#0d1117]/95 border border-rose-900/50 hover:border-rose-700/70 rounded-2xl shadow-2xl backdrop-blur-md text-white"
              }`
            : `w-full ${
                isTeamBPanelCollapsed
                  ? "lg:w-9 xl:w-10 p-1.5"
                  : (isModernSleek ? "lg:w-36 xl:w-44 p-2.5 gap-2" : "lg:w-36 xl:w-40 p-2 lg:p-2.5 gap-1.5 lg:gap-2")
              } shrink-0 flex flex-col justify-start ${isCompactUI ? "p-1.5 gap-1 text-[85%]" : ""} ${
                isModernSleek 
                  ? "bg-white border-2 border-rose-500/30 rounded-2xl shadow-md text-slate-800" 
                  : "bg-[#0d1117] border border-rose-900/40 hover:border-rose-700/60 rounded-2xl shadow-xl"
              } transition-all duration-200`
        }`}
      >
        {isTeamBPanelCollapsed ? (
          /* Collapsed View (Vertical tab on desktop/landscape, minimal strip on tablet/mobile) */
          <div 
            onClick={() => setIsTeamBPanelCollapsed(false)}
            className={`w-full flex ${isFullscreenMode ? "flex-col" : "lg:flex-col"} items-center justify-between py-1 px-2 ${isFullscreenMode ? "py-2.5 px-1" : "lg:py-2.5 lg:px-1"} cursor-pointer group select-none gap-2`}
            title="Agrandir le panneau Mon Adversaire"
          >
            <div className={`flex items-center ${isFullscreenMode ? "flex-col" : "lg:flex-col"} gap-1.5`}>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className={`text-[11px] font-black uppercase tracking-wider ${isModernSleek ? "text-rose-700" : "text-rose-400"} ${isFullscreenMode ? "inline" : "hidden lg:inline"} [writing-mode:vertical-rl] rotate-180 my-2`}>
                MON ADVERSAIRE
              </span>
              {!isFullscreenMode && (
                <span className={`text-xs font-black uppercase tracking-wider ${isModernSleek ? "text-rose-700" : "text-rose-400"} lg:hidden`}>
                  MON ADVERSAIRE
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsTeamBPanelCollapsed(false); }}
              className={`px-2 py-0.5 ${isFullscreenMode ? "p-1" : "lg:p-1"} rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${
                isModernSleek 
                  ? "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200" 
                  : "bg-[#251217] text-rose-300 hover:bg-rose-500 hover:text-slate-950 border border-[#492331]"
              }`}
              title="Déplier Mon Adversaire"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              {!isFullscreenMode && <span className="lg:hidden text-[9px]">Déplier</span>}
            </button>
          </div>
        ) : (
          <>
            {/* Panel Header */}
            <div className={`flex items-center justify-between border-b ${isModernSleek ? "border-slate-200 pb-1.5" : "border-[#1f293d] pb-1.5"}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className={`text-[11px] sm:text-[12px] font-black uppercase tracking-wider ${isModernSleek ? "text-rose-700" : "text-rose-400"}`}>
                  MON ADVERSAIRE
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsTeamBPanelCollapsed(true)}
                  className={`px-2 py-0.5 ${isFullscreenMode ? "p-1" : "lg:p-1"} rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${
                    isModernSleek 
                      ? "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200" 
                      : "bg-[#251217] text-rose-300 hover:bg-rose-500 hover:text-slate-950 border border-[#492331]"
                  }`}
                  title="Réduire le panneau Mon Adversaire"
                  aria-label="Réduire le panneau Mon Adversaire"
                >
                  <Minus className="w-3.5 h-3.5 shrink-0" />
                  {!isFullscreenMode && <span className="lg:hidden text-[9px]">Réduire</span>}
                </button>
              </div>
            </div>

            {/* Formations list */}
            <div className="w-full">
              {!isFullscreenMode && (
                <div className="lg:hidden flex items-center gap-1.5 w-full">
                  <span className={`text-[9px] font-black uppercase tracking-wider shrink-0 ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                    SCHÉMA :
                  </span>
                  <select
                    value={selectedFormationB}
                    onChange={(e) => applyTeamBFormation(e.target.value)}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black cursor-pointer border ${
                      isModernSleek
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : "bg-[#090d14] border-[#1a2130] text-rose-300"
                    }`}
                  >
                    {getAvailableFormationsForSport(activeSport).map((form) => (
                      <option key={form} value={form} className="bg-[#090d14] text-white">
                        {form}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={isFullscreenMode ? "block" : "hidden lg:block"}>
                <span className={`text-[9px] font-black uppercase tracking-wider block mb-1 ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                  SCHÉMA :
                </span>
                <div className={`flex flex-col gap-1 ${isFullscreenMode ? "max-h-36 xl:max-h-52" : "max-h-32 xl:max-h-48"} overflow-y-auto scrollbar-thin pr-0.5`}>
                  {getAvailableFormationsForSport(activeSport).map((form) => (
                    <button
                      key={form}
                      onClick={() => applyTeamBFormation(form)}
                      className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                        selectedFormationB === form
                          ? isModernSleek
                            ? "bg-rose-600 text-white font-black shadow-md shadow-rose-600/30"
                            : "bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20"
                          : isModernSleek
                            ? "bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-700 font-bold"
                            : "bg-[#090d14] hover:bg-[#2c1a1e] border border-[#1a2130] hover:border-rose-500/30 text-rose-300 hover:text-brand-cream"
                      }`}
                    >
                      {form}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className={`${isFullscreenMode ? "flex flex-col" : "grid grid-cols-2 sm:grid-cols-5 lg:flex lg:flex-col"} gap-1 pt-1.5 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/50"}`}>
              <button
                onClick={handleAddOpponent}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek 
                    ? "bg-rose-600 hover:bg-rose-700 border-rose-600 text-white shadow-2xs"
                    : "bg-rose-950/90 hover:bg-rose-900 border-rose-700/80 text-rose-200 hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 shadow-sm`}
                title="Ajouter un joueur dans l'équipe adverse"
              >
                <Plus className={`w-3 h-3 ${isModernSleek ? "text-white" : "text-rose-400"} shrink-0`} />
                <span>+ Adv</span>
              </button>

              <button
                onClick={regroupTeamBInCamp}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs"
                    : "bg-gradient-to-r from-[#211217] to-[#381822] hover:from-[#381822] border-[#492331] text-rose-200 hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 shadow-sm`}
                title="Regrouper les joueurs adverses dans leur camp"
              >
                <RotateCcw className={`w-3 h-3 ${isModernSleek ? "text-rose-600" : "text-rose-400"} shrink-0`} />
                <span>Dans leur camp</span>
              </button>

              <button
                onClick={clearTeamBPlayers}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek
                    ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800 shadow-2xs"
                    : "bg-rose-950/80 hover:bg-rose-900 border-rose-800/80 text-rose-200 hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center text-center shadow-2xs`}
              >
                Effacer
              </button>

              {/* Button 1: Effectif Adverse */}
              <button
                onClick={() => {
                  setRolesTargetTeam("away");
                  setTeamRolesModalTab("players");
                  setIsSetPiecesOpen(true);
                }}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs"
                    : "bg-gradient-to-r from-[#211217] to-[#381822] hover:from-[#381822] border-[#492331] text-rose-200 hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs relative`}
                title="Gérer l'effectif, les noms, numéros de maillot et postes de l'équipe adverse"
              >
                <span className="text-xs">👥</span>
                <span>Effectif</span>
                <span className="text-[8.5px] font-mono text-rose-300 font-bold ml-0.5">
                  ({currentTokens.filter((t) => t.type === "player_b").length + opponentSubstitutes.length})
                </span>
              </button>

              {/* Button 2: Rôles Adverses */}
              <button
                onClick={() => {
                  setRolesTargetTeam("away");
                  setTeamRolesModalTab("setpieces");
                  setIsSetPiecesOpen(true);
                }}
                className={`w-full py-1.5 px-2 ${
                  isModernSleek
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs"
                    : "bg-gradient-to-r from-[#211217] to-[#381822] hover:from-[#381822] border-[#492331] text-rose-200 hover:text-white"
                } border rounded-lg text-[9.5px] font-black transition cursor-pointer flex items-center justify-center gap-1 text-center shadow-2xs relative`}
                title="Désigner Capitaine, Penaltys, Corners et Coups Francs de l'équipe adverse"
              >
                <span className="text-xs">🎯</span>
                <span>Rôles Tactiques</span>
                {Object.values(opponentSetPieceRoles).filter(Boolean).length > 0 && (
                  <span className="bg-rose-500 text-white font-black text-[8px] px-1.5 py-0.2 rounded-full ml-0.5">
                    {Object.values(opponentSetPieceRoles).filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`flex flex-col h-screen overflow-hidden relative font-sans select-none transition-colors duration-300 ${
        isModernSleek 
          ? "bg-[#f1f5f9] text-slate-800 modern-sleek-mode" 
          : "bg-[#07090e] text-white"
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
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sleekToastMessage}</span>
          </div>
        </div>
      )}
      
      {/* 1. TOP HEADER NAVBAR */}
      <header 
        id="tour-top-header" 
        className={`${
          isModernSleek
            ? isCompactUI 
              ? "h-14 px-4 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-xs text-slate-900" 
              : "h-16 px-6 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm text-slate-900"
            : isCompactUI 
              ? "h-12 px-3.5 border-b border-[#1f293d] bg-[#0d1117]" 
              : "h-16 px-6 border-b border-[#1f293d] bg-[#0d1117]"
        } flex items-center justify-between relative z-40 flex-shrink-0 transition-all duration-300`}
      >
        
        {/* Left Brand info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className={`${
              isModernSleek
                ? "p-2 hover:bg-slate-100 border border-slate-200 bg-white rounded-xl text-slate-600 hover:text-emerald-600 shadow-xs"
                : `${isCompactUI ? "p-1.5" : "p-2"} hover:bg-[#1f293d] border border-[#1f293d] rounded-xl text-[#62728f] hover:text-[#00E599]`
            } transition cursor-pointer flex items-center justify-center`}
            title={isLeftSidebarOpen ? "Masquer le menu gauche" : "Afficher le menu gauche"}
          >
            {isLeftSidebarOpen ? <ChevronLeft className={`h-4 w-4 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Logo badge SVG */}
          <div className="flex items-center gap-2.5">
            <LogoIcon className={`${isCompactUI ? "w-7 h-7" : isModernSleek ? "w-8 h-8 text-emerald-600" : "w-9 h-9 text-white"} flex-shrink-0 transition-all`} />
            <div className="text-left flex flex-col justify-center select-none">
              <h1 className={`${isCompactUI ? "text-base" : "text-lg"} font-black ${isModernSleek ? "tracking-wider uppercase text-slate-900" : "tracking-wide lowercase text-white"} leading-none`}>
                the box
              </h1>
              {!isCompactUI && (
                <p className={`text-[8.5px] ${isModernSleek ? "text-slate-500 font-bold" : "text-white/70"} uppercase tracking-[0.18em] leading-none mt-1`}>
                  zone de décision tactique
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CENTER CONTROLS: TRIAL COUNTDOWN BADGE & USER ACCOUNT */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Trial / Creator / Subscriber Badge */}
          {isUserAdmin ? (
            <button
              onClick={() => {
                if (onOpenAdminPlatform) onOpenAdminPlatform();
              }}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                isModernSleek
                  ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                  : "bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 text-amber-300 border-amber-500/50 hover:border-amber-300 hover:brightness-110"
              }`}
              title="Compte Administrateur The Box : Accès total sans restriction de temps ni de fonction (Espace Admin)"
            >
              <span>👑</span>
              <span className="hidden sm:inline">Accès Illimité • Admin The Box</span>
              <span className="sm:hidden text-[10px]">Admin</span>
            </button>
          ) : isPaidSubscriber ? (
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                isModernSleek
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-gradient-to-r from-emerald-500/20 via-emerald-500/30 to-teal-500/20 text-emerald-300 border-emerald-500/50 hover:border-emerald-300 hover:brightness-110"
              }`}
              title={`Formule ${currentPlan.toUpperCase()} active. Cliquez pour gérer vos offres et formules.`}
            >
              <span>✨</span>
              <span className="font-bold hidden sm:inline">
                Formule {currentPlan === "pro_plus" || currentPlan === "annuel" || currentPlan === "club" ? "PRO+" : "PRO"}
              </span>
              <span className="sm:hidden text-[10px] font-bold">
                {currentPlan === "pro_plus" || currentPlan === "annuel" || currentPlan === "club" ? "PRO+" : "PRO"}
              </span>
            </button>
          ) : hasHadPaidSubscription ? (
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                isModernSleek
                  ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                  : "bg-[#121926] text-slate-300 border-[#1f293d] hover:border-slate-500"
              }`}
              title="Formule Gratuite active. Cliquez pour passer à la formule PRO."
            >
              <span>⚪</span>
              <span className="font-bold hidden sm:inline">Formule Gratuite</span>
              <span className="sm:hidden text-[10px] font-bold">Gratuit</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (onOpenTrialModal) onOpenTrialModal();
              }}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                liveTrialStatus.isExpired
                  ? isModernSleek ? "bg-slate-100 text-slate-600 border-slate-300" : "bg-[#121926] text-slate-400 border-[#1f293d] hover:border-slate-500"
                  : isModernSleek
                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-emerald-500/20 text-amber-300 border-amber-500/50 hover:border-amber-300 hover:brightness-110"
              }`}
              title="Cliquez pour afficher les détails du compte à rebours de votre période d'essai Pro (14 Jours)"
            >
              <span className={liveTrialStatus.isExpired ? "" : "animate-pulse"}>
                {liveTrialStatus.isExpired ? "⏳" : "⏰"}
              </span>
              <span className="font-mono hidden sm:inline">
                {liveTrialStatus.isExpired
                  ? "Essai expiré (Gratuit)"
                  : `Démo Pro : ${liveTrialStatus.days}j ${String(liveTrialStatus.hours).padStart(2, '0')}h ${String(liveTrialStatus.minutes).padStart(2, '0')}m ${String(liveTrialStatus.seconds).padStart(2, '0')}s`}
              </span>
              <span className="font-mono sm:hidden text-[10px] font-bold">
                {liveTrialStatus.isExpired ? "Expiré" : `${liveTrialStatus.days}j ${liveTrialStatus.hours}h`}
              </span>
            </button>
          )}

          {/* Right tools and account card */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">

          {/* Guide / Tutoriel Coach Button - Only for non-admin coaches */}
          {!isUserAdmin && (
            <button
              onClick={() => {
                if (onOpenTutorial) onOpenTutorial();
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl ${
                isModernSleek
                  ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-500 shadow-xs"
                  : "bg-[#0d141f] hover:bg-[#152030] border-[#1f293d] hover:border-[#00E599] text-slate-200"
              } border text-[10px] font-bold transition cursor-pointer shadow-sm group`}
              title="Ouvrir le guide interactif et tutoriel du coach"
            >
              <span className="text-xs group-hover:scale-110 transition-transform">🎓</span>
              <span className={`font-semibold hidden sm:inline ${isModernSleek ? "text-slate-700 group-hover:text-emerald-700" : "text-slate-200 group-hover:text-[#00E599]"}`}>Tuto Coach</span>
            </button>
          )}

          {/* Firebase Cloud Sync Badge - Only for platform admin */}
          {isUserAdmin && (
            <div 
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${
                isModernSleek ? "bg-white border-slate-200 text-slate-700 shadow-xs" : "bg-[#0d141f] border-[#1f293d] text-slate-300"
              } border text-[10px] font-bold shadow-sm`}
              title="Persistance & synchronisation Cloud actives via Firebase Firestore"
            >
              <Cloud className={`w-3.5 h-3.5 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} />
              <span className="font-semibold">Cloud Sync</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isModernSleek ? "bg-emerald-600" : "bg-[#00E599]"} animate-pulse`}></span>
            </div>
          )}
          
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className={`p-1.5 sm:p-2 ${
              isModernSleek 
                ? "hover:bg-slate-100 border border-slate-200 bg-white text-slate-600 hover:text-emerald-600 shadow-xs" 
                : "hover:bg-[#1f293d] border border-[#1f293d] text-[#62728f] hover:text-[#00E599]"
            } rounded-xl transition cursor-pointer flex items-center justify-center shrink-0`}
            title={isRightSidebarOpen ? "Masquer le menu droit" : "Afficher le menu droit"}
          >
            {isRightSidebarOpen ? <ChevronRight className={`h-4 w-4 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* PWA In-App Install Button */}
          <PWAInstallButton isModernSleek={isModernSleek} />

          <div className={`h-6 w-[1.5px] ${isModernSleek ? "bg-slate-200" : "bg-[#1f293d]"} hidden sm:block`} />

          {/* User Coach Account profile card */}
          <div className="relative z-50">
            {/* Click-away backdrop */}
            {isUserMenuOpen && (
              <div 
                className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                onClick={() => setIsUserMenuOpen(false)}
                aria-hidden="true"
              />
            )}

            <button
              type="button"
              id="tour-user-menu-btn"
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className={`flex items-center gap-1.5 sm:gap-2.5 ${
                isModernSleek
                  ? "bg-white hover:bg-slate-50 border border-slate-200 shadow-xs text-slate-800"
                  : "bg-[#171f2c] hover:border-[#354563] border border-[#222d41]"
              } p-1 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer select-none`}
              title="Profil & Options du compte"
              aria-label="Menu profil utilisateur"
              aria-expanded={isUserMenuOpen}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 ${
                isUserAdmin 
                  ? "bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 font-black ring-2 ring-amber-400/50" 
                  : "bg-gradient-to-r from-purple-500 to-pink-500"
              }`}>
                {activeCoach?.firstName ? activeCoach.firstName.charAt(0) : "C"}{activeCoach?.lastName ? activeCoach.lastName.charAt(0) : "P"}
              </div>
              <div className="text-left hidden sm:block">
                <p className={`text-xs font-black ${isModernSleek ? "text-slate-900" : "text-white"} leading-none flex items-center gap-1`}>
                  <span>{activeCoach?.firstName || "Coach"} {activeCoach?.lastName || "Principal"}</span>
                  {isUserAdmin && <span className="text-[9px] bg-amber-500/20 text-amber-700 font-black px-1 rounded border border-amber-500/30">ADMIN</span>}
                  <ChevronDown className={`h-3 w-3 ${isModernSleek ? "text-slate-400" : "text-[#62728f]"} transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </p>
                <p className={`text-[9px] ${isModernSleek ? "text-slate-500 font-bold" : "text-[#62728f] font-black"} uppercase tracking-wider leading-none mt-1`}>
                  {isUserAdmin ? "👑 Admin Plateforme" : (activeCoach?.role || "Coach Principal")}
                </p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 sm:hidden ${isModernSleek ? "text-slate-500" : "text-[#62728f]"} shrink-0 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Profiles switching card popup */}
            {isUserMenuOpen && (
              <div className={`absolute right-0 top-full mt-2 ${
                isModernSleek
                  ? "bg-white border border-slate-200 shadow-2xl text-slate-800"
                  : "bg-[#0d1117] border border-[#1f293d] shadow-2xl text-white"
              } rounded-2xl p-2.5 w-72 max-w-[calc(100vw-20px)] z-50 animate-fade-in`}>
                {/* Mobile Identity Header (shows full name & role when collapsed on small screens) */}
                <div className="sm:hidden flex items-center gap-2.5 pb-2.5 mb-2 border-b border-[#1f293d]/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 ${
                    isUserAdmin 
                      ? "bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 font-black ring-2 ring-amber-400/50" 
                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                  }`}>
                    {activeCoach?.firstName ? activeCoach.firstName.charAt(0) : "C"}{activeCoach?.lastName ? activeCoach.lastName.charAt(0) : "P"}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className={`text-xs font-black ${isModernSleek ? "text-slate-900" : "text-white"} truncate`}>
                      {activeCoach?.firstName || "Coach"} {activeCoach?.lastName || "Principal"}
                    </p>
                    <p className={`text-[9px] ${isModernSleek ? "text-slate-500" : "text-[#62728f]"} font-bold uppercase tracking-wider truncate`}>
                      {isUserAdmin ? "👑 Admin Plateforme" : (activeCoach?.role || "Coach Principal")}
                    </p>
                  </div>
                </div>

                {isUserAdmin && (
                  <div className={`p-2 border-b ${isModernSleek ? "border-amber-200 bg-amber-50 text-amber-900" : "border-amber-500/30 bg-amber-950/30 text-amber-300"} rounded-lg mb-2`}>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onOpenAdminPlatform) onOpenAdminPlatform();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-md text-xs font-black hover:opacity-80 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span>👑</span>
                      <span>Console Admin Plateforme</span>
                    </button>
                  </div>
                )}

                {!isUserAdmin && (
                  isPaidSubscriber ? (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${
                        isModernSleek ? "text-emerald-700 hover:bg-slate-50 border-slate-200" : "text-emerald-400 hover:bg-[#1a2333] border-[#1f293d]"
                      } transition flex items-center justify-between border-b pb-2 mb-1 cursor-pointer`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>✨</span>
                        <span>Formule {currentPlan === "pro_plus" || currentPlan === "annuel" || currentPlan === "club" ? "PRO+" : "PRO"}</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-black bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">ACTIF</span>
                    </button>
                  ) : hasHadPaidSubscription ? (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${
                        isModernSleek ? "text-slate-700 hover:bg-slate-50 border-slate-200" : "text-slate-300 hover:bg-[#1a2333] border-[#1f293d]"
                      } transition flex items-center justify-between border-b pb-2 mb-1 cursor-pointer`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>⚪</span>
                        <span>Formule Gratuite</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-black bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-500/20">ACTIF</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onOpenTrialModal) onOpenTrialModal();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${
                        isModernSleek ? "text-amber-700 hover:bg-slate-50 border-slate-200" : "text-amber-300 hover:bg-[#1a2333] border-[#1f293d]"
                      } transition flex items-center justify-between border-b pb-2 mb-1 cursor-pointer`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>⏰</span>
                        <span>Temps Démo / Essai (14j)</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-600 font-black">{liveTrialStatus.days}j {liveTrialStatus.hours}h</span>
                    </button>
                  )
                )}
                {!isUserAdmin && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenTutorial) onOpenTutorial();
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${
                      isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-700" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                    } transition flex items-center gap-1.5 cursor-pointer`}
                  >
                    <span>🎓</span>
                    <span>Tutoriel & Guide de démarrage</span>
                  </button>
                )}
                {onOpenLegalModal && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenLegalModal("faq");
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${
                      isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-700" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                    } transition flex items-center gap-1.5 cursor-pointer`}
                  >
                    <span>❓</span>
                    <span>Foire Aux Questions (FAQ)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onOpenSupportModal) {
                      onOpenSupportModal();
                    } else {
                      window.location.href = "mailto:pixup.agence@gmail.com?subject=%5BSupport%5D%20Demande%20d'aide%20coach";
                    }
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${
                    isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-700" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                  } transition flex items-center gap-1.5 cursor-pointer`}
                >
                  <span>✉️</span>
                  <span>Contacter le Support (Email)</span>
                </button>
                {/* Option Utilisateur : Thème d'Affichage (Sombre / Clair & Épuré) */}
                <div className={`p-2.5 rounded-xl border ${
                  isModernSleek 
                    ? "bg-slate-50 border-slate-200 text-slate-900" 
                    : "bg-[#121926] border-[#1f293d] text-slate-200"
                } my-1.5 shadow-2xs`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{isModernSleek ? "☀️" : "🌙"}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {isModernSleek ? "Design Clair" : "Design Sombre"}
                      </span>
                    </div>
                    <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase ${
                      isModernSleek ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {isModernSleek ? "Actif" : "Classique"}
                    </span>
                  </div>

                  <button
                    onClick={toggleModernSleek}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer border ${
                      isModernSleek
                        ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-2xs"
                        : "bg-[#090d14] hover:bg-[#162030] border-[#1f293d] text-slate-300 hover:text-white"
                    }`}
                    title={isModernSleek ? "Basculer vers le mode Sombre Classique" : "Basculer vers le mode Clair & Épuré"}
                  >
                    <span className="text-[10px] font-bold">
                      {isModernSleek ? "Passer au thème Sombre" : "Passer au thème Clair"}
                    </span>

                    {/* Switch Pill */}
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                      isModernSleek ? "bg-emerald-600 justify-end shadow-inner" : "bg-slate-700 justify-start border border-slate-600"
                    }`}>
                      <div className="w-3 h-3 rounded-full bg-white shadow-sm transition-all transform" />
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleOpenUserConfig();
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold ${
                    isModernSleek ? "text-slate-700 hover:bg-slate-50 hover:text-emerald-700" : "text-slate-200 hover:bg-[#1a2333] hover:text-[#00E599]"
                  } transition flex items-center gap-1.5 cursor-pointer`}
                >
                  <span>⚙️</span>
                  <span>Configuration Profil & Sport</span>
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 mt-1 border-t ${
                      isModernSleek ? "border-slate-200" : "border-[#1f293d]"
                    } pt-2 flex items-center justify-between transition cursor-pointer`}
                  >
                    <span>🚪 Déconnexion</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                alert("Déconnexion sécurisée.");
              }
            }}
            className="p-1.5 sm:p-2 hover:bg-[#1f293d] border border-[#1f293d] rounded-xl text-[#62728f] hover:text-[#00E599] transition cursor-pointer hidden sm:flex items-center justify-center shrink-0"
            title="Déconnexion (Retour à la landing page)"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        </div>

      </header>

      {/* 2. THREE PANEL WORKSPACE (LEFT - CENTER - RIGHT) */}
      <div className="flex-1 flex overflow-hidden w-full">

        {/* ========================================================= */}
        {/* LEFT PANEL: OUTILS, ACTIONS, AFFICHAGE, PLAN PRO (ICON ONLY) */}
        {/* ========================================================= */}
        <aside 
          id="tour-left-toolbar" 
          className={`${isLeftSidebarOpen ? (isModernSleek ? "w-18 opacity-100" : "w-16 opacity-100") : "w-0 opacity-0 overflow-hidden pointer-events-none"} ${
            isModernSleek 
              ? "bg-white/95 backdrop-blur-xl border-r border-slate-200/90 shadow-sm text-slate-800" 
              : "border-r border-[#1f293d] bg-[#0d1117]"
          } flex flex-col justify-between flex-shrink-0 transition-all duration-300 relative`}
        >
          
          <div className="flex-1 overflow-y-auto p-2.5 space-y-4 scrollbar-thin flex flex-col items-center">
            
            {/* 1. OUTILS (ICON BUTTONS) */}
            <div className="flex flex-col items-center gap-1.5 w-full">
              <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>OUTILS</span>
              
              <button
                onClick={() => { setActiveTool("select"); setDrawingTool("brush"); }}
                className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                  activeTool === "select"
                    ? isModernSleek
                      ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-md shadow-emerald-600/30"
                      : "bg-[#00E599] text-[#0d1117] border-[#00E599] shadow-md shadow-[#00e599]/20"
                    : isModernSleek
                      ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs"
                      : "bg-[#090d14] border-[#1a2130] text-[#62728f] hover:text-brand-cream hover:border-[#354563]"
                }`}
                title="Sélecteur"
              >
                <MousePointer className="h-4 w-4" />
                <span className="text-[7.5px] font-black uppercase tracking-tighter mt-0.5">SÉLECT</span>
              </button>

              <button
                onClick={() => { setActiveTool("move"); setDrawingTool("brush"); setSelectedStrokeIndex(null); }}
                className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                  activeTool === "move"
                    ? isModernSleek
                      ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-md shadow-emerald-600/30"
                      : "bg-[#00E599] text-[#0d1117] border-[#00E599] shadow-md shadow-[#00e599]/20"
                    : isModernSleek
                      ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs"
                      : "bg-[#090d14] border-[#1a2130] text-[#62728f] hover:text-brand-cream hover:border-[#354563]"
                }`}
                title="Déplacer"
              >
                <Move className="h-4 w-4" />
                <span className="text-[7.5px] font-black uppercase tracking-tighter mt-0.5">BOUGER</span>
              </button>

              {/* Ligne Tactique (Pleine & Pointillée sur le même bouton) */}
              <button
                onClick={handleToggleLineTool}
                className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer relative ${
                  activeTool === "line"
                    ? isModernSleek
                      ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-md shadow-emerald-600/30"
                      : "bg-[#00E599] text-[#0d1117] border-[#00E599] shadow-md shadow-[#00e599]/20"
                    : isModernSleek
                      ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs"
                      : "bg-[#090d14] border-[#1a2130] text-[#62728f] hover:text-brand-cream hover:border-[#354563]"
                }`}
                title={
                  activeTool === "line"
                    ? drawingTool === "shape-dashed-line"
                      ? "Ligne Pointillée active (cliquez pour basculer en Ligne Pleine)"
                      : "Ligne Pleine active (cliquez pour basculer en Ligne Pointillée)"
                    : "Tracer une Ligne Tactique (Pleine ou Pointillée)"
                }
              >
                {activeTool === "line" && drawingTool === "shape-dashed-line" ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="4" y1="20" x2="20" y2="4" strokeDasharray="3 3" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="5" y1="19" x2="19" y2="5" />
                  </svg>
                )}
                <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5 leading-none">
                  {activeTool === "line"
                    ? drawingTool === "shape-dashed-line"
                      ? "POINTILLÉ"
                      : "PLEINE"
                    : "LIGNE"}
                </span>

                {/* Badge visuel de type de ligne actif */}
                {activeTool === "line" && (
                  <span
                    className={`absolute -top-1 -right-1 text-[6.5px] font-black px-1 py-0.5 rounded-full leading-none border shadow-2xs ${
                      isModernSleek
                        ? "bg-slate-900 text-emerald-300 border-white"
                        : "bg-[#05080e] text-[#00E599] border-[#00E599]"
                    }`}
                  >
                    {drawingTool === "shape-dashed-line" ? "••" : "—"}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTool("arrow"); setDrawingTool("arrow-direct"); setSelectedStrokeIndex(null); }}
                className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                  activeTool === "arrow"
                    ? isModernSleek
                      ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-md shadow-emerald-600/30"
                      : "bg-[#00E599] text-[#0d1117] border-[#00E599] shadow-md shadow-[#00e599]/20"
                    : isModernSleek
                      ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs"
                      : "bg-[#090d14] border-[#1a2130] text-[#62728f] hover:text-brand-cream hover:border-[#354563]"
                }`}
                title="Flèche de Course"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-[7.5px] font-black uppercase tracking-tighter mt-0.5">FLÈCHE</span>
              </button>

              <button
                onClick={() => { setActiveTool("draw"); setDrawingTool("brush"); setSelectedStrokeIndex(null); }}
                className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                  activeTool === "draw"
                    ? isModernSleek
                      ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-md shadow-emerald-600/30"
                      : "bg-[#00E599] text-[#0d1117] border-[#00E599] shadow-md shadow-[#00e599]/20"
                    : isModernSleek
                      ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs"
                      : "bg-[#090d14] border-[#1a2130] text-[#62728f] hover:text-brand-cream hover:border-[#354563]"
                }`}
                title="Dessin Libre"
              >
                <Pencil className="h-4 w-4" />
                <span className="text-[7.5px] font-black uppercase tracking-tighter mt-0.5">DESSIN</span>
              </button>

              <button
                onClick={handleClearDrawings}
                disabled={drawingActions.length === 0}
                className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                  drawingActions.length > 0
                    ? isModernSleek
                      ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-400 shadow-2xs"
                      : "bg-rose-950/80 border-rose-800 text-rose-300 hover:bg-rose-900 hover:text-white hover:border-rose-500 shadow-md shadow-rose-950/40"
                    : isModernSleek
                      ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                      : "bg-[#090d14] border-[#1a2130] text-[#62728f]/40 cursor-not-allowed"
                }`}
                title="Effacer tous les dessins"
              >
                <Trash2 className={`h-4 w-4 ${drawingActions.length > 0 ? (isModernSleek ? "text-rose-600" : "text-rose-400") : ""}`} />
                <span className="text-[7.5px] font-black uppercase tracking-tighter mt-0.5">RAZ</span>
              </button>
            </div>

            <div className={`w-8 h-px ${isModernSleek ? "bg-slate-200" : "bg-[#1f293d]"}`} />

            {/* 2. STROKE COLOR / SIZE PICKER */}
            <div className="flex flex-col items-center gap-1 w-full" title="Couleur et épaisseur de tracé">
              <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>TRAIT</span>
              <div className={`flex flex-col items-center gap-1.5 ${isModernSleek ? "bg-slate-100 border border-slate-200 shadow-2xs" : "bg-[#090d14] border-[#1a2130]"} p-1.5 rounded-xl`}>
                {["#00E599", "#ef4444", "#3b82f6", "#1e293b", "#eab308"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-4 h-4 rounded-full border transition cursor-pointer ${drawColor === c ? (isModernSleek ? "ring-2 ring-emerald-600 scale-110 shadow-sm" : "ring-2 ring-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]") : "hover:scale-105 opacity-80 hover:opacity-100"}`}
                    style={{ backgroundColor: c, borderColor: isModernSleek ? "rgba(0,0,0,0.15)" : undefined }}
                    title={`Couleur ${c}`}
                  />
                ))}
              </div>
            </div>



            <div className={`w-8 h-px ${isModernSleek ? "bg-slate-200" : "bg-[#1f293d]"}`} />

            {/* 4. ACTIONS (ICON BUTTONS) */}
            <div id="tour-export-actions" className="flex flex-col items-center gap-1.5 w-full">
              <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>EXPORT</span>
              
              <button
                onClick={handleOpenExportModal}
                className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition cursor-pointer shadow-sm ${
                  isModernSleek
                    ? "bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-2xs"
                    : "bg-gradient-to-r from-[#00E599]/20 to-emerald-600/20 hover:from-[#00E599]/30 hover:to-emerald-600/30 border border-[#00E599]/50 text-[#00E599] shadow-[#00e599]/10"
                }`}
                title="Exporter l'image PNG HD"
              >
                <Download className="h-4 w-4" />
                <span className="text-[7.5px] font-black uppercase tracking-tighter mt-0.5">PNG</span>
              </button>

              <button
                onClick={() => setShowSquad3DModal(true)}
                className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition cursor-pointer shadow-sm ${
                  isModernSleek
                    ? "bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 shadow-2xs"
                    : "bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-yellow-500/20 hover:from-amber-500/30 hover:via-amber-600/30 hover:to-yellow-500/30 border border-amber-500/50 text-amber-300 shadow-amber-500/10"
                }`}
                title="Vue Carte 3D (Squad Export)"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-[7.5px] font-black uppercase tracking-tighter mt-0.5">3D</span>
              </button>
            </div>

          </div>

          {/* 5. PLAN PRO CTA (ICON) */}
          <div className={`p-2 border-t ${isModernSleek ? "border-slate-200 bg-slate-50" : "border-[#1f293d] bg-[#090c12]"} flex justify-center`}>
            <button
              onClick={() => {
                if (isProOrAdmin) {
                  if (isUserAdmin && onOpenAdminPlatform) {
                    onOpenAdminPlatform();
                  } else {
                    alert(`Votre abonnement ${activePlan.toUpperCase()} est ACTIF !`);
                  }
                } else {
                  setIsCheckoutOpen(true);
                }
              }}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition cursor-pointer border ${
                isProOrAdmin 
                  ? isModernSleek
                    ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 shadow-xs"
                    : "bg-emerald-500/20 border-emerald-500/40 text-amber-400 hover:bg-emerald-500/30" 
                  : "bg-gradient-to-r from-[#00E599] to-[#059669] border-[#00E599] text-[#0d1117] hover:brightness-110 shadow-lg shadow-[#00e599]/10"
              }`}
              title={isProOrAdmin ? (isUserAdmin ? "Compte Admin PRO Active" : `Plan ${activePlan.toUpperCase()} Actif`) : "Souscrire au Plan PRO"}
            >
              <Award className="h-5 w-5 shrink-0" />
            </button>
          </div>

        </aside>

        {/* ========================================================= */}
        {/* CENTER PANEL: PITCH VIEWPORT & CONTROLLERS & FORMATIONS */}
        {/* ========================================================= */}
        <main className={`flex-1 flex flex-col ${isModernSleek ? "bg-[#f1f5f9]" : "bg-[#07090e]"} ${isCompactUI ? "p-1.5 sm:p-2" : "p-1.5 sm:p-2.5 lg:p-3 xl:p-4"} overflow-y-auto scrollbar-thin transition-all duration-200`}>
          
          {/* Pitch Area Main Toolbar */}
          <div 
            id="tour-pitch-controllers" 
            className={`flex flex-wrap items-center justify-between ${
              isCompactUI ? "py-1.5 px-3 gap-1.5 mb-2 text-[90%]" : "py-2 px-4 gap-2 mb-3"
            } ${
              isModernSleek
                ? "bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-sm text-slate-800"
                : "bg-[#0d1117] border border-[#1f293d] rounded-xl shadow-lg"
            } transition-all duration-300`}
          >
            
            {/* GROUP 1: Pitch View Modes (Full Pitch & Half Pitch) & Animation Video Toggle */}
            <div className={`flex items-center gap-1 h-8 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
              <button
                type="button"
                onClick={() => setTerrainComplet(true)}
                className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  terrainComplet 
                    ? isModernSleek 
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black" 
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs" 
                    : isModernSleek 
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80" 
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title="Terrain complet"
                aria-label="Terrain complet"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setTerrainComplet(false)}
                className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  !terrainComplet 
                    ? isModernSleek 
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black" 
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs" 
                    : isModernSleek 
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80" 
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title="Demi-terrain"
                aria-label="Demi-terrain"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 3h16v18H4z" />
                  <line x1="4" y1="21" x2="20" y2="21" />
                  <path d="M8 3v5h8V3" />
                  <path d="M9 21a3 3 0 0 1 6 0" />
                </svg>
              </button>

              <div className={`h-4 w-px mx-0.5 ${isModernSleek ? "bg-slate-300" : "bg-[#1a2130]"}`} />

              <button
                type="button"
                disabled={isLiveMatchMode}
                onClick={() => {
                  if (isLiveMatchMode) return;
                  const nextState = !isAnimationCreatorOpen;
                  setIsAnimationCreatorOpen(nextState);
                  if (nextState) {
                    setTimeout(() => {
                      const animationEl = document.getElementById("animation-creator-panel");
                      if (animationEl) {
                        animationEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }
                    }, 100);
                  }
                }}
                className={`h-7 px-2.5 rounded-lg transition flex items-center justify-center ${
                  isLiveMatchMode
                    ? "opacity-30 cursor-not-allowed bg-[#0c1017] border border-[#1e293b] text-slate-500"
                    : isAnimationCreatorOpen
                    ? isModernSleek
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black cursor-pointer"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs cursor-pointer"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80 cursor-pointer"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d] cursor-pointer"
                }`}
                title={isLiveMatchMode ? "L'animation n'est pas disponible en mode Live Match" : (isAnimationCreatorOpen ? "Masquer le créateur d'animation" : "Activer le créateur d'animation (Vidéo)")}
                aria-label="Créer une animation"
              >
                <Video className="h-4 w-4 shrink-0" />
              </button>
            </div>

            {/* GROUP 2: Display Device Ratios (Paysage & Portrait) */}
            <div className={`flex items-center gap-1 h-8 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
              <button
                type="button"
                onClick={() => setAspectRatioMode("desktop")}
                className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  aspectRatioMode === "desktop" 
                    ? isModernSleek 
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black" 
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs" 
                    : isModernSleek 
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80" 
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title="Ratio Écran Large (Paysage)"
                aria-label="Ratio Écran Large"
              >
                <Laptop className="h-4 w-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setAspectRatioMode("mobile")}
                className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  aspectRatioMode === "mobile" 
                    ? isModernSleek 
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black" 
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs" 
                    : isModernSleek 
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80" 
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title="Ratio Écran Étroit (Portrait)"
                aria-label="Ratio Écran Étroit"
              >
                <Smartphone className="h-4 w-4 shrink-0" />
              </button>
            </div>

            {/* GROUP 3: Pitch Interactive Elements (Ballon, Adversaires & Noms/Numéros) */}
            <div className={`flex items-center gap-1 h-8 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
              <button
                type="button"
                onClick={() => setShowBall(!showBall)}
                className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  showBall
                    ? isModernSleek
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title={showBall ? "Masquer le ballon" : "Afficher le ballon"}
                aria-label="Afficher ou masquer le ballon"
              >
                <CircleDot className="h-4 w-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setShowOpponents(!showOpponents)}
                className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  showOpponents
                    ? isModernSleek
                      ? "bg-white border border-rose-400 text-rose-700 shadow-xs font-black"
                      : "bg-[#28131a] border border-rose-500/60 text-rose-400 shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title={showOpponents ? "Masquer les adversaires" : "Afficher les adversaires"}
                aria-label="Afficher ou masquer les adversaires"
              >
                <Users className="h-4 w-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setShowPlayerNames(!showPlayerNames)}
                className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  !showPlayerNames
                    ? isModernSleek
                      ? "bg-amber-500 border border-amber-600 text-white shadow-xs font-black"
                      : "bg-[#382810] border border-amber-400 text-amber-300 shadow-xs font-black"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title={showPlayerNames ? "Masquer les noms des joueurs (garder uniquement les numéros)" : "Afficher les noms des joueurs"}
                aria-label="Masquer ou afficher les noms des joueurs"
              >
                <Hash className="h-4 w-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const shouldCollapse = !isTeamAPanelCollapsed || !isTeamBPanelCollapsed;
                  setIsTeamAPanelCollapsed(shouldCollapse);
                  setIsTeamBPanelCollapsed(shouldCollapse);
                }}
                className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  isTeamAPanelCollapsed && isTeamBPanelCollapsed
                    ? isModernSleek
                      ? "bg-purple-600 border border-purple-700 text-white shadow-xs font-black"
                      : "bg-[#361942] border border-purple-400 text-purple-200 shadow-xs font-black"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title={
                  isTeamAPanelCollapsed && isTeamBPanelCollapsed
                    ? "Déplier les panneaux d'équipes (Mon Club & Adverse)"
                    : "Réduire les panneaux d'équipes pour agrandir le terrain"
                }
                aria-label="Réduire ou déplier les panneaux d'équipes"
              >
                <Columns className="h-4 w-4 shrink-0" />
              </button>
            </div>

            {/* GROUP 4: Zooms (Échelle Terrain & Taille Joueurs) - Standardized h-8 Height & Icons */}
            <div className={`flex items-center gap-2 h-8 ${isModernSleek ? "bg-slate-100 p-0.5 px-2 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 px-2 rounded-lg border border-[#1a2130]"}`}>
              {/* Pitch Zoom */}
              <div title="Échelle du terrain" className="flex items-center gap-1">
                <ZoomIn className={`h-4 w-4 shrink-0 ${isModernSleek ? "text-slate-600" : "text-[#718096]"}`} />
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.max(70, prev - 10))}
                  className={`h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                    isModernSleek 
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-700" 
                      : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                  }`}
                  title="Réduire l'échelle du terrain"
                >
                  -
                </button>
                <span className={`text-[10px] font-black ${isModernSleek ? "text-slate-900" : "text-white"} w-7 text-center font-mono`}>{zoomScale}%</span>
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.min(150, prev + 10))}
                  className={`h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                    isModernSleek 
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-700" 
                      : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                  }`}
                  title="Agrandir l'échelle du terrain"
                >
                  +
                </button>
              </div>

              <div className={`h-4 w-px ${isModernSleek ? "bg-slate-300" : "bg-[#1a2130]"}`} />

              {/* Players Scale */}
              <div title="Taille des joueurs" className="flex items-center gap-1">
                <User className={`h-4 w-4 shrink-0 ${isModernSleek ? "text-slate-600" : "text-[#718096]"}`} />
                <button
                  type="button"
                  onClick={() => setPlayerScale(prev => Math.max(20, prev - 10))}
                  className={`h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                    isModernSleek 
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-700" 
                      : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                  }`}
                  title="Réduire la taille des joueurs"
                >
                  -
                </button>
                <span className={`text-[10px] font-black ${isModernSleek ? "text-slate-900" : "text-white"} w-7 text-center font-mono`}>{playerScale}%</span>
                <button
                  type="button"
                  onClick={() => setPlayerScale(prev => Math.min(130, prev + 10))}
                  className={`h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                    isModernSleek 
                      ? "bg-slate-200/80 border border-slate-300 text-slate-700 hover:bg-slate-300 hover:text-emerald-700" 
                      : "bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                  }`}
                  title="Agrandir la taille des joueurs"
                >
                  +
                </button>
              </div>
            </div>

            {/* GROUP 5: Fullscreen Expand Toggle */}
            <div className={`flex items-center h-8 ${isModernSleek ? "bg-slate-100 p-0.5 rounded-xl border border-slate-200" : "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]"}`}>
              <button
                onClick={togglePitchFullscreen}
                className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                  isPitchFullscreen
                    ? isModernSleek
                      ? "bg-white border border-emerald-400 text-emerald-800 shadow-xs font-black"
                      : "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                    : isModernSleek
                      ? "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80"
                      : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                }`}
                title={isPitchFullscreen ? "Quitter le plein écran" : "Afficher le terrain en plein écran"}
              >
                {isPitchFullscreen ? (
                  <Minimize2 className={`h-4 w-4 shrink-0 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} />
                ) : (
                  <Maximize2 className="h-4 w-4 shrink-0" />
                )}
              </button>
            </div>

          </div>

          {/* PITCH WORKSPACE WITH FLANKING PANELS (LEFT: MON CLUB + SUBS, CENTER: PITCH, RIGHT: COMPO ADVERSE) */}
          <div className="flex-1 flex flex-col lg:flex-row items-stretch lg:items-center justify-center gap-2 xl:gap-3.5 w-full m-auto min-h-0">

            {/* 1. LEFT FLANKING PANEL: MON CLUB (USER CLUB + SUBS) */}
            {!isPitchFullscreen && renderTeamAPanel(false)}

            {/* 2. CENTER: THE PITCH ARTIFICIAL GRASS CONTAINER WITH PROPORTIONS LOCK */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0 w-full pr-1">
            
            {/* Fullscreen Pitch Wrapper (covers entire screen when isPitchFullscreen is true) */}
            <div
              ref={pitchWrapperRef}
              id="pitch-main-viewport"
              className={
                isPitchFullscreen
                  ? "fixed inset-0 z-[100] bg-[#070b13]/98 backdrop-blur-xl flex flex-col items-center justify-between p-2 sm:p-3 select-none animate-fade-in overflow-hidden h-screen w-screen"
                  : "relative w-full mx-auto flex flex-col items-center justify-center transition-all duration-300 ease-in-out"
              }
            >
              {/* Fullscreen Dedicated Top Controls Header with Full Tactics Tools & Animation Button */}
              {isPitchFullscreen && (
                <div className="w-full max-w-fit flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 mb-2 bg-[#0d1117]/95 border border-[#1f293d] rounded-2xl shadow-2xl backdrop-blur-md z-40 shrink-0">
                  
                  {/* Mode Live Indicator & Score Pill in Top Fullscreen Bar */}
                  {isLiveMatchMode && (
                    <>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-950/40 border border-rose-800/60 rounded-xl mr-1 shrink-0">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                        </span>
                        <span className="text-[8.5px] font-black tracking-wider text-rose-300 uppercase">
                          LIVE
                        </span>
                        <div className="h-3 w-px bg-rose-800/60" />
                        <span className="text-[9.5px] font-mono font-black text-amber-300">
                          {homeScore} - {awayScore}
                        </span>
                        <div className="h-3 w-px bg-rose-800/60" />
                        <span className="text-[9px] font-mono font-bold text-slate-300">
                          {formatLiveTime(liveTimerSeconds)}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-[#1f293d]" />
                    </>
                  )}

                  {/* GROUP 1: Pitch View Modes (Full Pitch & Half Pitch) & Animation Video Toggle */}
                  <div className="flex items-center gap-1 h-8 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]">
                    <button
                      type="button"
                      onClick={() => setTerrainComplet(true)}
                      className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        terrainComplet 
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs" 
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title="Terrain complet"
                      aria-label="Terrain complet"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="12" y1="4" x2="12" y2="20" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerrainComplet(false)}
                      className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        !terrainComplet 
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs" 
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title="Demi-terrain"
                      aria-label="Demi-terrain"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 3h16v18H4z" />
                        <line x1="4" y1="21" x2="20" y2="21" />
                        <path d="M8 3v5h8V3" />
                        <path d="M9 21a3 3 0 0 1 6 0" />
                      </svg>
                    </button>

                    <div className="h-4 w-px mx-0.5 bg-[#1a2130]" />

                    <button
                      type="button"
                      disabled={isLiveMatchMode}
                      onClick={() => {
                        if (isLiveMatchMode) return;
                        const nextState = !isAnimationCreatorOpen;
                        setIsAnimationCreatorOpen(nextState);
                        if (nextState) {
                          setTimeout(() => {
                            const animationEl = document.getElementById("animation-creator-panel");
                            if (animationEl) {
                              animationEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }
                          }, 100);
                        }
                      }}
                      className={`h-7 px-2.5 rounded-lg transition flex items-center justify-center ${
                        isLiveMatchMode
                          ? "opacity-30 cursor-not-allowed bg-[#0c1017] border border-[#1e293b] text-slate-500"
                          : isAnimationCreatorOpen
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs cursor-pointer"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d] cursor-pointer"
                      }`}
                      title={isLiveMatchMode ? "L'animation n'est pas disponible en mode Live Match" : (isAnimationCreatorOpen ? "Masquer le créateur d'animation" : "Activer le créateur d'animation (Vidéo)")}
                      aria-label="Créer une animation"
                    >
                      <Video className="h-4 w-4 shrink-0" />
                    </button>
                  </div>

                  {/* GROUP 2: Display Device Ratios (Paysage & Portrait) */}
                  <div className="flex items-center gap-1 h-8 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]">
                    <button
                      type="button"
                      onClick={() => setAspectRatioMode("desktop")}
                      className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        aspectRatioMode === "desktop" 
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs" 
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title="Ratio Écran Large (Paysage)"
                      aria-label="Ratio Écran Large"
                    >
                      <Laptop className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatioMode("mobile")}
                      className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        aspectRatioMode === "mobile" 
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs" 
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title="Ratio Écran Étroit (Portrait)"
                      aria-label="Ratio Écran Étroit"
                    >
                      <Smartphone className="h-4 w-4 shrink-0" />
                    </button>
                  </div>

                  {/* GROUP 3: Pitch Interactive Elements (Ballon & Adversaires) */}
                  <div className="flex items-center gap-1 h-8 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]">
                    <button
                      type="button"
                      onClick={() => setShowBall(!showBall)}
                      className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        showBall
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title={showBall ? "Masquer le ballon" : "Afficher le ballon"}
                      aria-label="Afficher ou masquer le ballon"
                    >
                      <CircleDot className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOpponents(!showOpponents)}
                      className={`h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        showOpponents
                          ? "bg-[#28131a] border border-rose-500/60 text-rose-400 shadow-xs"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title={showOpponents ? "Masquer les adversaires" : "Afficher les adversaires"}
                      aria-label="Afficher ou masquer les adversaires"
                    >
                      <Users className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPlayerNames(!showPlayerNames)}
                      className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        !showPlayerNames
                          ? "bg-[#382810] border border-amber-400 text-amber-300 shadow-xs font-black"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title={showPlayerNames ? "Masquer les noms des joueurs (garder uniquement les numéros)" : "Afficher les noms des joueurs"}
                      aria-label="Masquer ou afficher les noms des joueurs"
                    >
                      <Hash className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const shouldCollapse = !isTeamAPanelCollapsed || !isTeamBPanelCollapsed;
                        setIsTeamAPanelCollapsed(shouldCollapse);
                        setIsTeamBPanelCollapsed(shouldCollapse);
                      }}
                      className={`h-7 w-7 sm:w-8 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        isTeamAPanelCollapsed && isTeamBPanelCollapsed
                          ? "bg-[#361942] border border-purple-400 text-purple-200 shadow-xs font-black"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title={
                        isTeamAPanelCollapsed && isTeamBPanelCollapsed
                          ? "Déplier les panneaux d'équipes (Mon Club & Adverse)"
                          : "Réduire les panneaux d'équipes pour agrandir le terrain"
                      }
                      aria-label="Réduire ou déplier les panneaux d'équipes"
                    >
                      <Columns className="h-4 w-4 shrink-0" />
                    </button>
                  </div>

                  <div className="h-4 w-px bg-[#1f293d]" />

                  {/* GROUP 4: Drawing Tools (Select, Move, Line, Arrow, Draw) */}
                  <div className="flex items-center gap-1 h-8 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]">
                    {/* Sélecteur */}
                    <button
                      type="button"
                      onClick={() => { setActiveTool("select"); setDrawingTool("brush"); }}
                      className={`h-7 px-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        activeTool === "select"
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title="Sélecteur de joueur"
                      aria-label="Sélecteur"
                    >
                      <MousePointer className="h-4 w-4 shrink-0" />
                    </button>

                    {/* Déplacer */}
                    <button
                      type="button"
                      onClick={() => { setActiveTool("move"); setDrawingTool("brush"); setSelectedStrokeIndex(null); }}
                      className={`h-7 px-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        activeTool === "move"
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title="Déplacer"
                      aria-label="Déplacer"
                    >
                      <Move className="h-4 w-4 shrink-0" />
                    </button>

                    {/* Ligne Pleine & Pointillée */}
                    <button
                      type="button"
                      onClick={handleToggleLineTool}
                      className={`h-7 px-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        activeTool === "line"
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title={
                        activeTool === "line"
                          ? drawingTool === "shape-dashed-line"
                            ? "Ligne Pointillée active (cliquer pour Pleine)"
                            : "Ligne Pleine active (cliquer pour Pointillée)"
                          : "Tracer une ligne (pleine / pointillée)"
                      }
                      aria-label="Tracer une ligne"
                    >
                      {activeTool === "line" && drawingTool === "shape-dashed-line" ? (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="4" y1="20" x2="20" y2="4" strokeDasharray="3 3" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="5" y1="19" x2="19" y2="5" />
                        </svg>
                      )}
                    </button>

                    {/* Flèche */}
                    <button
                      type="button"
                      onClick={() => { setActiveTool("arrow"); setDrawingTool("arrow-direct"); setSelectedStrokeIndex(null); }}
                      className={`h-7 px-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        activeTool === "arrow"
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title="Tracer une flèche de course"
                      aria-label="Tracer une flèche"
                    >
                      <ArrowUpRight className="h-4 w-4 shrink-0" />
                    </button>

                    {/* Crayon */}
                    <button
                      type="button"
                      onClick={() => { setActiveTool("draw"); setDrawingTool("brush"); setSelectedStrokeIndex(null); }}
                      className={`h-7 px-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        activeTool === "draw"
                          ? "bg-[#132338] border border-[#00E599]/60 text-[#00E599] shadow-xs"
                          : "bg-[#0c1017] border border-[#1e293b] text-[#6c7d99] hover:text-white hover:bg-[#151e2d]"
                      }`}
                      title="Dessin libre au crayon"
                      aria-label="Crayon"
                    >
                      <Pencil className="h-4 w-4 shrink-0" />
                    </button>
                  </div>

                  <div className="h-4 w-px bg-[#1f293d]" />

                  {/* Couleur de trait bleue */}
                  <button
                    type="button"
                    onClick={() => setDrawColor("#3b82f6")}
                    className="h-7 w-8 bg-[#0c1017] rounded-lg border border-[#3b82f6]/50 shadow-sm cursor-pointer flex items-center justify-center hover:bg-[#151e2d]"
                    title="Couleur de trait : Bleu"
                    aria-label="Couleur de trait : Bleu"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] border border-white/50 ring-2 ring-[#3b82f6]/50 shadow-sm" />
                  </button>

                  {/* Sélecteur d'épaisseur */}
                  <div className="flex items-center gap-1 h-8 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]">
                    {[
                      { size: 2, label: "Fin", dot: "w-1.5 h-1.5" },
                      { size: 3, label: "Moyen", dot: "w-2.5 h-2.5" },
                      { size: 5, label: "Épais", dot: "w-3.5 h-3.5" }
                    ].map(({ size, label, dot }) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setDrawSize(size)}
                        className={`h-7 w-6 rounded-md transition cursor-pointer flex items-center justify-center ${
                          drawSize === size
                            ? "bg-[#132338] text-[#3b82f6] border border-[#3b82f6]/50 font-bold"
                            : "bg-[#0c1017] border border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#151e2d]"
                        }`}
                        title={`Épaisseur: ${label}`}
                        aria-label={`Épaisseur: ${label}`}
                      >
                        <span className={`${dot} rounded-full bg-current`} />
                      </button>
                    ))}
                  </div>

                  {/* Effacer tous les tracés */}
                  <button
                    type="button"
                    onClick={handleClearDrawings}
                    disabled={drawingActions.length === 0}
                    className={`h-7 px-2.5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                      drawingActions.length > 0
                        ? "bg-rose-950/80 hover:bg-rose-900 border-rose-800 text-rose-300 hover:text-white shadow-sm"
                        : "bg-[#0c1017] border-[#1e293b] text-slate-600 cursor-not-allowed"
                    }`}
                    title="Effacer tous les dessins"
                    aria-label="Effacer tous les dessins"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                  </button>

                  <div className="h-4 w-px bg-[#1f293d]" />

                  {/* GROUP 5: Zooms (Échelle Terrain & Taille Joueurs) */}
                  <div className="flex items-center gap-2 h-8 bg-[#090d14] p-0.5 px-2 rounded-lg border border-[#1a2130]">
                    {/* Pitch Zoom */}
                    <div title="Échelle du terrain" className="flex items-center gap-1">
                      <ZoomIn className="h-4 w-4 shrink-0 text-[#718096]" />
                      <button
                        type="button"
                        onClick={() => setZoomScale(prev => Math.max(70, prev - 10))}
                        className="h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                        title="Réduire l'échelle du terrain"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-black text-white w-7 text-center font-mono">{zoomScale}%</span>
                      <button
                        type="button"
                        onClick={() => setZoomScale(prev => Math.min(150, prev + 10))}
                        className="h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                        title="Agrandir l'échelle du terrain"
                      >
                        +
                      </button>
                    </div>

                    <div className="h-4 w-px bg-[#1a2130]" />

                    {/* Players Scale */}
                    <div title="Taille des joueurs" className="flex items-center gap-1">
                      <User className="h-4 w-4 shrink-0 text-[#718096]" />
                      <button
                        type="button"
                        onClick={() => setPlayerScale(prev => Math.max(20, prev - 10))}
                        className="h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                        title="Réduire la taille des joueurs"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-black text-white w-7 text-center font-mono">{playerScale}%</span>
                      <button
                        type="button"
                        onClick={() => setPlayerScale(prev => Math.min(130, prev + 10))}
                        className="h-7 w-6 rounded-md flex items-center justify-center text-xs font-bold transition cursor-pointer bg-[#0c1017] border border-[#1e293b] text-[#718096] hover:bg-[#151e2d] hover:text-white"
                        title="Agrandir la taille des joueurs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="h-4 w-px bg-[#1f293d]" />

                  {/* GROUP 6: Quitter plein écran */}
                  <div className="flex items-center h-8 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]">
                    <button
                      type="button"
                      onClick={togglePitchFullscreen}
                      className="h-7 px-2.5 bg-[#132338] hover:bg-rose-950/80 border border-[#233149] hover:border-rose-700 text-[#00E599] hover:text-white rounded-lg transition cursor-pointer flex items-center justify-center gap-1 font-bold"
                      title="Quitter le mode plein écran (Échap)"
                      aria-label="Quitter le plein écran"
                    >
                      <Minimize2 className="h-4 w-4 shrink-0" />
                    </button>
                  </div>

                </div>
              )}

              {/* PITCH AND FLANKING SIDE PANELS ROW (IN FULLSCREEN: ROW WITH MON CLUB & MON ADVERSAIRE) */}
              <div className={`w-full flex-1 flex ${isPitchFullscreen ? "flex-row items-center justify-center gap-2 xl:gap-3.5 min-h-0 overflow-hidden relative my-auto px-1 sm:px-2" : "flex-col items-center justify-center"}`}>
                {isPitchFullscreen && renderTeamAPanel(true)}
                <div className={isPitchFullscreen ? "flex-1 flex flex-col items-center justify-center h-full min-w-0 relative" : "w-full flex flex-col items-center justify-center"}>
                  {/* Visual Pitch Box */}
                  <div
                    className={`relative w-full mx-auto my-auto shrink-0 rounded-3xl overflow-hidden ${
                  isModernSleek
                    ? "border-4 border-slate-300 ring-8 ring-white/90 shadow-2xl bg-[#032e22]"
                    : "border-4 border-[#1f293d] shadow-2xl bg-[#032e22]"
                } transition-all duration-300 ease-in-out`}
                style={{
                  aspectRatio: `${currentPitchRatio}`,
                  maxWidth: pitchMaxWidth,
                  maxHeight: pitchMaxHeight,
                  transform: zoomScale !== 100 ? `scale(${zoomScale / 100})` : undefined,
                  transformOrigin: "center center",
                  marginTop: zoomScale > 100 ? `${(zoomScale - 100) * 3.8}px` : undefined,
                  marginBottom: zoomScale > 100 ? `${(zoomScale - 100) * 4.5}px` : undefined,
                }}
              >
                {/* Floating Quick Drawing Controls Bar overlay on Pitch - Only shown when a stroke is clicked in SELECT mode */}
                {activeTool === "select" && selectedStrokeIndex !== null && drawingActions[selectedStrokeIndex] && (
                  <div className="absolute top-2.5 right-12 sm:right-32 z-40 flex items-center gap-1.5 bg-[#0d1117]/95 border border-[#00E599]/60 p-1.5 px-3 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in pointer-events-auto">
                  <span className="text-[10px] font-black text-[#00E599] flex items-center gap-1 mr-1">
                    <Pencil className="w-3.5 h-3.5" />
                    <span>TRACÉ SÉLECTIONNÉ</span>
                  </span>

                  <div className="h-4 w-px bg-[#2a364f]" />

                  <button
                    onClick={handleDeleteSelectedStroke}
                    className="px-2.5 py-1 bg-rose-950/90 hover:bg-rose-900 border border-rose-700/80 text-rose-200 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-md"
                    title="Supprimer ce tracé sélectionné"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Supprimer tracé</span>
                  </button>

                  <button
                    onClick={handleUndo}
                    className="px-2 py-1 bg-[#172233] hover:bg-[#202f4a] border border-[#233149] text-slate-200 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Annuler le dernier tracé (Ctrl+Z)"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-300" />
                    <span>Annuler</span>
                  </button>

                  <button
                    onClick={handleClearDrawings}
                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/90 border border-rose-800/60 text-rose-300 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Effacer tous les tracés sur le terrain"
                  >
                    <span>Tout effacer</span>
                  </button>

                  <button
                    onClick={() => setSelectedStrokeIndex(null)}
                    className="ml-1 p-0.5 hover:bg-[#1f293d] text-slate-400 hover:text-white rounded-lg transition"
                    title="Fermer le menu"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div 
                ref={pitchContainerRef}
                className="absolute left-0 top-0 touch-none transition-all duration-300"
                style={{ 
                  width: terrainComplet ? "100%" : (aspectRatioMode === "mobile" ? "100%" : "200%"),
                  height: terrainComplet ? "100%" : (aspectRatioMode === "mobile" ? "200%" : "100%"),
                  left: 0,
                  top: 0,
                }}
              >
                {/* Ground pitch texture lines rendering */}
                <Pitch sport={activeSport} isPortrait={aspectRatioMode === "mobile"} />

              {/* Corner Flags Overlay */}
              {activeSport === "football" && ! (aspectRatioMode === "mobile") && (
                <>
                  <div className="absolute top-[3.42%] left-[2.27%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" title="Drapeau de corner" />
                  <div className="absolute top-[3.42%] right-[2.27%] translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" title="Drapeau de corner" />
                  <div className="absolute bottom-[3.42%] left-[2.27%] -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" title="Drapeau de corner" />
                  <div className="absolute bottom-[3.42%] right-[2.27%] translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" title="Drapeau de corner" />
                </>
              )}

              {activeSport === "football" && aspectRatioMode === "mobile" && (
                <>
                  {/* Portrait Corner flags */}
                  <div className="absolute top-[2.27%] left-[3.42%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" />
                  <div className="absolute top-[2.27%] right-[3.42%] translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" />
                  <div className="absolute bottom-[2.27%] left-[3.42%] -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" />
                  <div className="absolute bottom-[2.27%] right-[3.42%] translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-red-600 border border-yellow-500 rounded-sm shadow-sm pointer-events-none" />
                </>
              )}

              {/* Dynamic canvas drawing overlay */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
                className={`absolute inset-0 w-full h-full z-10 ${
                  activeTool === "select"
                    ? (drawingActions.length > 0 ? "pointer-events-auto cursor-pointer" : "pointer-events-none cursor-default")
                    : activeTool === "move"
                    ? "pointer-events-none cursor-default"
                    : "cursor-crosshair pointer-events-auto"
                }`}
              />

              {/* DRAGGABLE TOKENS */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {currentTokens.map((token) => {
                  
                  // Handle visibility toggles
                  if (token.type === "ball" && !showBall) return null;
                  if (token.type === "player_b" && !showOpponents) return null;

                  // Custom visual profiles
                  let tokenBg = "bg-[#090d14] border-[#00E599] text-[#00E599]"; // Team A looks like neon green matching layout
                  let iconContent: React.ReactNode = token.number;

                  if (token.type === "player_b") {
                    tokenBg = "bg-rose-950/90 border-rose-500 text-rose-200";
                  } else if (token.type === "referee") {
                    tokenBg = "bg-slate-200 border-slate-400 text-slate-900";
                    iconContent = "🏁";
                  } else if (token.type === "ball") {
                    tokenBg = "bg-white border-slate-500 shadow-xl text-slate-900";
                    iconContent = activeSport === "rugby" ? "🏉" : "⚽";
                  }

                  const isSelected = selectedTokenId === token.id;
                  const isPlayer = token.type.startsWith("player");
                  const playerGoals = isPlayer ? matchEvents.filter(e => e.type === "goal" && e.player === token.name).length : 0;
                  const playerAssists = isPlayer ? matchEvents.filter(e => (e.type === "assist" && e.player === token.name) || (e.type === "goal" && e.assister === token.name)).length : 0;
                  const hasYellowCard = isPlayer && ((token.yellowCards && token.yellowCards > 0) || matchEvents.some(e => e.type === "yellow" && e.player === token.name));

                  // Transition style for smooth animation of player movement
                  const isCurrentlyDragging = selectedTokenId === token.id;
                  const transitionStyle = isCurrentlyDragging
                    ? "none"
                    : `left ${isPlaying ? playbackSpeed * 0.95 : 350}ms ease-in-out, top ${isPlaying ? playbackSpeed * 0.95 : 350}ms ease-in-out`;

                  return (
                    <div
                      key={token.id}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleTokenStartDrag(token.id, e);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleTokenStartDrag(token.id, e);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Lors du déplacement d'un joueur sur le terrain, ne pas ouvrir la fenêtre de remplacement
                        if (isDraggingTokenRef.current || Date.now() - dragEndTimeRef.current < 250) {
                          return;
                        }
                        if (token.type.startsWith("player")) {
                          setEditingToken(token);
                          setQuickActionToken(token);
                          if (isLiveMatchMode) {
                            setLiveActionToken(token);
                          } else {
                            setSubPickerToken(token);
                          }
                        }
                      }}
                      onContextMenu={(e) => {
                        if (token.type.startsWith("player")) {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isDraggingTokenRef.current || Date.now() - dragEndTimeRef.current < 250) return;
                          setEditingToken(token);
                          setQuickActionToken(token);
                          if (isLiveMatchMode) {
                            setLiveActionToken(token);
                          } else {
                            setSubPickerToken(token);
                          }
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (isDraggingTokenRef.current || Date.now() - dragEndTimeRef.current < 250) return;
                        if (token.type.startsWith("player")) {
                          setEditingToken(token);
                          setQuickActionToken(token);
                          if (isLiveMatchMode) {
                            setLiveActionToken(token);
                          } else {
                            setSubPickerToken(token);
                          }
                        }
                      }}
                      className="absolute pointer-events-auto select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center transition-transform"
                      title={
                        token.type.startsWith("player")
                          ? isLiveMatchMode
                            ? `Double-clic pour les options de match (${token.name})`
                            : `Clic pour remplacer ${token.name}`
                          : "Glisser pour déplacer"
                      }
                      style={{
                        left: `${aspectRatioMode === "mobile" ? token.y : token.x}%`,
                        top: `${aspectRatioMode === "mobile" ? 100 - token.x : token.y}%`,
                        transform: `translate(-50%, -50%) scale(${(isSelected ? 1.2 : 1) * (playerScale / 100)})`,
                        zIndex: token.type === "ball" ? 40 : 30,
                        transition: transitionStyle,
                      }}
                    >
                      {/* Circle dot with border */}
                      <div 
                        className={`${
                          token.type === "ball" 
                            ? "w-6 h-6 sm:w-7 sm:h-7 text-[10px]" 
                            : "w-9 h-9 sm:w-10 sm:h-10 text-xs"
                        } rounded-full border-2 flex items-center justify-center font-black shadow-xl ${tokenBg} transition-all relative`}
                      >
                        {/* Inner photo/icon wrapper to keep rounded avatar without clipping badges */}
                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                          {token.photo && showPlayerNames ? (
                            <img src={token.photo} alt={token.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            iconContent
                          )}
                        </div>

                        {/* TOP BADGES ROW (Match stats: Yellow Cards, Goals, Assists, Fitness status) */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-0.5 z-30 whitespace-nowrap pointer-events-none">
                          {/* Yellow Card 🟨 */}
                          {hasYellowCard && (
                            <span
                              className="w-3.5 h-4 bg-amber-400 rounded-[1px] border border-amber-200 shadow-md flex items-center justify-center font-black text-[7px] text-amber-950"
                              title="Carton Jaune 🟨"
                            >
                              🟨
                            </span>
                          )}

                          {/* Goal Scorer ⚽ */}
                          {playerGoals > 0 && (
                            <span
                              className="bg-emerald-500 text-slate-950 rounded-full font-black text-[8.5px] h-4 min-w-[16px] px-1 shadow-md border border-emerald-200 flex items-center justify-center leading-none"
                              title={`Buteur ⚽ (${playerGoals} goal${playerGoals > 1 ? "s" : ""})`}
                            >
                              ⚽{playerGoals > 1 ? playerGoals : ""}
                            </span>
                          )}

                          {/* Assist 👟 */}
                          {playerAssists > 0 && (
                            <span
                              className="bg-cyan-400 text-slate-950 rounded-full font-black text-[8.5px] h-4 min-w-[16px] px-1 shadow-md border border-cyan-200 flex items-center justify-center leading-none"
                              title={`Passeur décisif 👟 (${playerAssists} passe${playerAssists > 1 ? "s" : ""})`}
                            >
                              👟{playerAssists > 1 ? playerAssists : ""}
                            </span>
                          )}

                          {/* Fitness / Availability Status Badge */}
                          {token.status && token.status !== "normal" && (
                            <span
                              className={`w-3.5 h-3.5 rounded-full border border-black shadow-md flex items-center justify-center text-[7.5px] leading-none shrink-0 ${
                                token.status === "excellent"
                                  ? "bg-emerald-500 text-white font-bold"
                                  : token.status === "tired"
                                  ? "bg-amber-500 text-slate-950 font-bold"
                                  : token.status === "injured"
                                  ? "bg-rose-600 text-white font-bold"
                                  : token.status === "suspended"
                                  ? "bg-red-700 text-white font-bold"
                                  : "bg-rose-500 text-white font-bold"
                              }`}
                              title={`Disponibilité: ${
                                token.status === "excellent"
                                  ? "En forme ⚡"
                                  : token.status === "tired"
                                  ? "Fatigué 🥱"
                                  : token.status === "injured"
                                  ? "Blessé 🩹"
                                  : token.status === "suspended"
                                  ? "Suspendu 🟥"
                                  : token.status
                              }`}
                            >
                              {token.status === "excellent"
                                ? "⚡"
                                : token.status === "tired"
                                ? "🥱"
                                : token.status === "injured"
                                ? "🩹"
                                : token.status === "suspended"
                                ? "🟥"
                                : "•"}
                            </span>
                          )}
                        </div>

                        {/* LEFT BADGES (Set-Piece Roles: Captain, Corner, Free Kick) */}
                        {token.type === "player_a" && (
                          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 flex flex-col items-end justify-center gap-0.5 z-30 whitespace-nowrap pointer-events-none">
                            {/* Captain 👑 */}
                            {setPieceRoles.captain === token.name && (
                              <span
                                className="bg-amber-400 text-slate-950 rounded-full font-black text-[8.5px] h-4 w-4 shadow-md border border-amber-200 flex items-center justify-center leading-none"
                                title="Capitaine d'Équipe 👑"
                              >
                                👑
                              </span>
                            )}

                            {/* Tireur de Corner 🚩 */}
                            {(setPieceRoles.cornerLeft === token.name || setPieceRoles.cornerRight === token.name) && (
                              <span
                                className="bg-rose-500 text-white rounded font-black text-[7.5px] px-1 h-3.5 shadow-md border border-rose-300 flex items-center justify-center leading-none"
                                title="Tireur de Corner 🚩"
                              >
                                {setPieceRoles.cornerLeft === token.name && setPieceRoles.cornerRight === token.name
                                  ? "CK-2"
                                  : setPieceRoles.cornerLeft === token.name
                                  ? "CK-G"
                                  : "CK-D"}
                              </span>
                            )}

                            {/* Coup Franc Direct / Excentré */}
                            {(setPieceRoles.directFreeKick === token.name || setPieceRoles.offCenterFKLeft === token.name || setPieceRoles.offCenterFKRight === token.name) && (
                              <span
                                className="bg-cyan-400 text-slate-950 rounded font-black text-[7.5px] px-1 h-3.5 shadow-md border border-cyan-200 flex items-center justify-center leading-none"
                                title="Tireur de Coup Franc ⚡"
                              >
                                {setPieceRoles.directFreeKick === token.name
                                  ? "CF"
                                  : setPieceRoles.offCenterFKLeft === token.name
                                  ? "CF-G"
                                  : "CF-D"}
                              </span>
                            )}
                          </div>
                        )}

                        {/* RIGHT BADGES (Set-Piece Roles: Penalty Taker PK) */}
                        {token.type === "player_a" && (
                          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 flex flex-col items-start justify-center gap-0.5 z-30 whitespace-nowrap pointer-events-none">
                            {/* Tireur Penalty ⚽ (PK) */}
                            {setPieceRoles.penaltyTaker === token.name && (
                              <span
                                className="bg-[#00E599] text-[#0d1117] rounded font-black text-[7.5px] px-1 h-3.5 shadow-md border border-emerald-300 flex items-center justify-center leading-none"
                                title="Tireur de Penalty ⚽ (11m)"
                              >
                                PK
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Name Label JUST BELOW the token pastille */}
                      {token.type.startsWith("player") && showPlayerNames && (
                        <div className={`absolute top-[100%] mt-1 ${
                          isModernSleek
                            ? "bg-white/95 text-slate-900 border border-slate-300 font-black shadow-md shadow-slate-900/10"
                            : "bg-slate-950/90 text-slate-200 border border-slate-800 font-bold"
                        } text-[9px] px-1.5 py-0.5 rounded-md whitespace-nowrap pointer-events-none flex items-center gap-1 z-20`}>
                          <span>{token.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>

            </div>

          </div>

        </div>
        {isPitchFullscreen && showOpponents && renderTeamBPanel(true)}
      </div>

            {/* TACTICAL ANIMATION & PLAYER MOVEMENT CREATION PANEL */}
            {!isLiveMatchMode && isAnimationCreatorOpen && (
              <div id="animation-creator-panel" className="mt-2.5 p-1.5 sm:p-2 bg-[#090d14]/95 border border-[#1f293d] rounded-2xl shadow-xl text-xs text-white animate-fade-in shrink-0 relative z-30">
              
                {/* Main Animation Toolbar Row - Compact & Icon-only */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121926] p-1.5 px-2.5 rounded-xl border border-[#1f293d]/80">
                  
                  {/* Left: Section Badge & Speed Pills */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1">
                      <span>🎬</span>
                      <span className="hidden sm:inline">ANIMATION</span>
                    </span>

                    <div className="h-4 w-px bg-[#1f293d]" />

                    {/* Vitesse de lecture */}
                    <div className="flex items-center gap-0.5 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]">
                      <span className="text-[9px] font-black text-slate-500 uppercase px-1">⚡</span>
                      {[500, 1000, 1500, 2000].map((speed) => {
                        const active = playbackSpeed === speed;
                        return (
                          <button
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={`h-6 px-1.5 text-[8.5px] font-black rounded-md transition cursor-pointer ${
                              active
                                ? "bg-[#00E599] text-[#0d1117] shadow-xs"
                                : "text-slate-400 hover:text-white"
                            }`}
                            title={`Vitesse : ${speed / 1000}s par étape`}
                          >
                            {speed / 1000}s
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Center: Playback Controls & Sequence Timeline */}
                  <div className="flex-1 flex items-center gap-2 min-w-0 justify-center">
                    
                    {/* Playback Controls (Prev, Play/Pause, Next) - Icon Only */}
                    <div className="flex items-center gap-1 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130] shrink-0">
                      <button
                        type="button"
                        onClick={() => setCurrentFrameIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentFrameIdx === 0}
                        className="h-7 w-7 bg-[#0c1017] hover:bg-[#1b253b] text-slate-300 disabled:opacity-25 disabled:pointer-events-none rounded-md border border-[#1f293d] transition cursor-pointer flex items-center justify-center"
                        title="Étape Précédente"
                        aria-label="Étape Précédente"
                      >
                        <ChevronLeft className="w-4 h-4 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`h-7 px-2.5 rounded-md transition cursor-pointer flex items-center justify-center shadow-md ${
                          isPlaying
                            ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 animate-pulse border border-rose-400/50"
                            : "bg-[#00E599] hover:bg-emerald-400 text-slate-950 shadow-[#00e599]/15 border border-emerald-300"
                        }`}
                        title={isPlaying ? "Mettre en Pause" : "Lancer la Lecture animée"}
                        aria-label={isPlaying ? "Pause" : "Lecture"}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0 fill-current" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentFrameIdx(prev => Math.min(keyframes.length - 1, prev + 1))}
                        disabled={currentFrameIdx === keyframes.length - 1}
                        className="h-7 w-7 bg-[#0c1017] hover:bg-[#1b253b] text-slate-300 disabled:opacity-25 disabled:pointer-events-none rounded-md border border-[#1f293d] transition cursor-pointer flex items-center justify-center"
                        title="Étape Suivante"
                        aria-label="Étape Suivante"
                      >
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </button>
                    </div>

                    <div className="h-4 w-px bg-[#1f293d] shrink-0" />

                    {/* Sequence Timeline Steps Navigation */}
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-thin">
                      {keyframes.map((_, idx) => {
                        const isActive = idx === currentFrameIdx;
                        return (
                          <div key={idx} className="flex items-center shrink-0 gap-1">
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => setCurrentFrameIdx(idx)}
                                className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all cursor-pointer text-xs font-black ${
                                  isActive
                                    ? "bg-gradient-to-br from-[#11241f] to-[#0a1815] border-[#00E599] text-[#00E599] shadow-xs"
                                    : "bg-[#0c1017] border-[#1f293d] hover:border-slate-500 text-slate-400 hover:text-white"
                                }`}
                                title={`Étape ${idx + 1}`}
                              >
                                <span>{idx + 1}</span>
                              </button>
                              {keyframes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const deletedIdx = idx;
                                    setKeyframes((prev) => prev.filter((_, i) => i !== deletedIdx));
                                    if (currentFrameIdx >= deletedIdx && currentFrameIdx > 0) {
                                      setCurrentFrameIdx((prev) => prev - 1);
                                    }
                                    setSleekToastMessage(`🗑️ Étape ${deletedIdx + 1} supprimée.`);
                                    setTimeout(() => setSleekToastMessage(null), 2500);
                                  }}
                                  className="ml-0.5 p-0.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded transition cursor-pointer text-[9px] font-black"
                                  title={`Supprimer l'étape ${idx + 1}`}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            
                            {idx < keyframes.length - 1 && (
                              <div className={`w-2 h-0.5 shrink-0 ${isActive ? "bg-[#00E599]" : "bg-[#1f293d]"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* Right: Operations Buttons - ICON ONLY */}
                  <div className="flex items-center gap-1 shrink-0 bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]">
                    {/* Sauvegarder (Disquette) */}
                    <button
                      type="button"
                      onClick={() => {
                        setTacticName(`Animation ${activeSport.toUpperCase()} - ${new Date().toLocaleDateString("fr-FR")}`);
                        setSaveTacticMatchId(activeMatchId);
                        setIsSaveAnimationMode(true);
                        setIsSaveModalOpen(true);
                      }}
                      className="h-7 w-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-md transition cursor-pointer flex items-center justify-center border border-purple-400/40 shadow-xs"
                      title="Enregistrer l'animation (Disquette)"
                      aria-label="Sauvegarder l'animation"
                    >
                      <Save className="w-4 h-4 shrink-0" />
                    </button>

                    {/* Nouvelle Étape */}
                    <button
                      type="button"
                      onClick={() => {
                        const activeFrame = keyframes[currentFrameIdx] || keyframes[0];
                        const newFrame = activeFrame.map((t) => ({ ...t }));
                        setKeyframes((prev) => {
                          const copy = [...prev];
                          copy.splice(currentFrameIdx + 1, 0, newFrame);
                          return copy;
                        });
                        setCurrentFrameIdx(currentFrameIdx + 1);
                      }}
                      className="h-7 w-8 bg-[#0c1017] hover:bg-[#121c2e] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white rounded-md transition cursor-pointer flex items-center justify-center"
                      title="Ajouter une nouvelle étape"
                      aria-label="Nouvelle Étape"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                    </button>

                    {/* Supprimer l'étape actuelle */}
                    <button
                      type="button"
                      onClick={() => {
                        if (keyframes.length <= 1) {
                          setSleekToastMessage("⚠️ Vous devez conserver au moins 1 étape dans l'animation.");
                          setTimeout(() => setSleekToastMessage(null), 3000);
                          return;
                        }
                        const deletedIdx = currentFrameIdx;
                        setKeyframes((prev) => prev.filter((_, idx) => idx !== deletedIdx));
                        setCurrentFrameIdx((prev) => Math.max(0, prev - 1));
                        setSleekToastMessage(`🗑️ Étape ${deletedIdx + 1} supprimée.`);
                        setTimeout(() => setSleekToastMessage(null), 2500);
                      }}
                      disabled={keyframes.length <= 1}
                      className="h-7 w-8 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 hover:border-rose-500 text-rose-300 hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded-md transition cursor-pointer flex items-center justify-center"
                      title="Supprimer l'étape actuelle"
                      aria-label="Supprimer l'étape"
                    >
                      <Trash className="w-4 h-4 shrink-0" />
                    </button>

                    {/* Réinitialiser */}
                    <button
                      type="button"
                      onClick={() => {
                        const defaultTokens = getDefaultPlayersForSport(activeSport);
                        setKeyframes([defaultTokens]);
                        setCurrentFrameIdx(0);
                        setIsPlaying(false);
                        setSleekToastMessage("🔄 Séquences d'animation réinitialisées.");
                        setTimeout(() => setSleekToastMessage(null), 2500);
                      }}
                      className="h-7 w-8 bg-[#0c1017] hover:bg-[#1b253b] border border-[#1f293d] hover:border-slate-500 text-slate-400 hover:text-white rounded-md transition cursor-pointer flex items-center justify-center"
                      title="Réinitialiser toute l'animation"
                      aria-label="Réinitialiser"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Petite Boîte à Outils Live Match sous le terrain (dans le viewport principal du terrain, plein écran ou pas) */}
            {isLiveMatchMode && renderLiveMatchToolbox()}

            {/* Modale de remplacement joueur (accessible en plein écran et mode normal) */}
            {renderSubstitutionModal()}

          </div>

        </div>

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
            onDoubleClick={() => setRightSidebarWidth(isCompactUI ? 192 : 240)}
            className={`hidden xl:flex w-1.5 hover:w-2 bg-[#121926] hover:bg-[#00E599]/50 cursor-col-resize flex-shrink-0 transition-all z-20 items-center justify-center relative group select-none border-l border-[#1f293d] ${
              isResizingRightSidebar ? "bg-[#00E599] !w-2 shadow-lg shadow-[#00e599]/30" : ""
            }`}
            title="Glisser avec la souris pour ajuster la largeur (Double-clic pour réinitialiser)"
          >
            {/* Visual grab bar indicator */}
            <div
              className={`w-0.5 h-8 rounded-full transition-all ${
                isResizingRightSidebar
                  ? "bg-slate-950 scale-y-125"
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
            title="Ouvrir le panneau droit (Schémas, Matchs & Notes)"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-black uppercase tracking-wider">SCHÉMAS & MATCHS</span>
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
          className={`${
            isRightSidebarOpen
              ? "opacity-100"
              : "w-0 border-l-0 opacity-0 overflow-hidden pointer-events-none"
          } ${
            isModernSleek
              ? "bg-white border-l border-slate-200/90 shadow-sm text-slate-800"
              : "bg-[#0d1117] border-l border-[#1f293d]"
          } flex flex-col justify-between flex-shrink-0 fixed xl:relative inset-y-0 right-0 z-50 xl:z-auto shadow-2xl xl:shadow-none h-full max-w-[88vw] sm:max-w-[420px] ${
            isResizingRightSidebar ? "transition-none select-none" : "transition-[width,opacity] duration-300"
          }`}
        >
          {/* Mobile / Tablet / iPad Drawer Header with Close Button */}
          <div className="xl:hidden flex items-center justify-between p-2.5 border-b border-[#1f293d] bg-[#090d14] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">📖</span>
              <span className="text-xs font-black uppercase tracking-wider text-[#00E599]">SCHÉMAS & MATCHS</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRightSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2333] transition cursor-pointer"
              title="Fermer le panneau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 scrollbar-thin">
            
            {/* Active Team Pill (Above SCHÉMAS) */}
            <button
              onClick={() => {
                if (!isProOrAdmin) {
                  setIsMultiTeamUpgradeModalOpen(true);
                } else {
                  setIsMultiTeamModalOpen(true);
                }
              }}
              className={`w-full ${
                isModernSleek
                  ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 shadow-2xs"
                  : "bg-[#121926] hover:bg-[#1a2333] border-[#1f293d]"
              } border hover:border-amber-500/50 p-2 rounded-xl flex items-center justify-between transition cursor-pointer shadow-sm group`}
              title="Changer d'équipe ou gérer vos équipes (PRO)"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-500 text-[10px] shrink-0">
                  🛡️
                </span>
                <span className={`text-[11px] font-black ${isModernSleek ? "text-slate-900 group-hover:text-emerald-700" : "text-white group-hover:text-amber-200"} truncate transition`}>
                  {activeTeam?.name || "Séniors A (Fanion)"}
                </span>
              </div>
              {isProOrAdmin ? (
                <span className="text-[7.5px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 shadow-sm">
                  PRO
                </span>
              ) : (
                <span className="text-[7px] bg-slate-800 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full uppercase font-extrabold flex items-center gap-0.5 shrink-0">
                  <Lock className="w-2 h-2" /> 1 ÉQUIPE
                </span>
              )}
            </button>

            {/* SCHÉMAS section (with save, share buttons) */}
            <div className={`${isModernSleek ? "bg-slate-50/90 border border-slate-200 text-slate-800 shadow-2xs" : "bg-[#090d14] border border-[#1a2130]"} rounded-xl p-2`}>
              <div className={`flex items-center justify-between mb-1.5 border-b ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/60"} pb-1`}>
                <p className={`text-[9px] ${isModernSleek ? "text-slate-600 font-extrabold" : "text-[#62728f] font-black"} uppercase tracking-wider flex items-center gap-1`}>
                  <span>📖 SCHÉMAS</span>
                  <span className="text-[7px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1 py-0.2 rounded uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                    <Award className="w-2 h-2" /> PRO
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenShareSchema()}
                    className={`p-1 ${isModernSleek ? "hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-emerald-700" : "hover:bg-[#1a2333] border-[#1a2130] text-slate-400 hover:text-[#00E599]"} border rounded transition cursor-pointer`}
                    title="Partager le schéma actuel (WhatsApp / Mail)"
                  >
                    <Share2 className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={handleTriggerSaveModal}
                    className={`p-1 ${isModernSleek ? "hover:bg-slate-200 border-slate-200 text-emerald-700 hover:text-emerald-800" : "hover:bg-[#1a2333] border-[#1a2130] text-[#00E599] hover:text-brand-cream"} border rounded transition cursor-pointer`}
                    title="Enregistrer sous (PRO)"
                  >
                    <Save className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* En-tête Match actuel */}
              <div className={`flex items-center justify-between px-2 py-1 mb-1.5 rounded-lg border text-[8.5px] font-black uppercase tracking-tight ${
                isModernSleek
                  ? "bg-slate-100 border-slate-200 text-slate-700"
                  : "bg-[#080d14] border-[#1f293d] text-slate-300"
              }`}>
                <span className="flex items-center gap-1 truncate">
                  <span>⚽</span>
                  <span className="truncate">{activeMatch ? `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}` : "Ce Match"}</span>
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-extrabold shrink-0 ${
                  isModernSleek ? "bg-emerald-100 text-emerald-800" : "bg-[#00E599]/20 text-[#00E599]"
                }`}>
                  {savedTactics.filter(sc => (sc.matchId || "match_1") === activeMatchId).length}
                </span>
              </div>

              {/* Saved Playbooks scroll list */}
              <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin">
                {(() => {
                  const matchSchemas = savedTactics.filter(sc => (sc.matchId || "match_1") === activeMatchId);

                  if (matchSchemas.length === 0) {
                    return (
                      <div className={`border border-dashed ${isModernSleek ? "border-slate-300 text-slate-500" : "border-[#1f293d] text-[#62728f]"} rounded-lg p-3 text-center text-[8.5px] font-bold uppercase tracking-wider`}>
                        AUCUN SCHÉMA POUR CE MATCH
                      </div>
                    );
                  }

                  return matchSchemas.map((sc) => {
                    const isAnim = Boolean(sc.isAnimation || (sc.keyframes && sc.keyframes.length > 1));

                    return (
                      <div
                        key={sc.id}
                        onClick={() => handleLoadSchema(sc)}
                        className={`group ${
                          isAnim
                            ? isModernSleek
                              ? "bg-purple-50/90 border-purple-300 hover:border-purple-600 shadow-2xs"
                              : "bg-gradient-to-r from-[#170b22] to-[#0f091c] border-purple-500/50 hover:border-purple-400 shadow-md shadow-purple-950/40"
                            : isModernSleek 
                              ? "bg-white border-slate-200 hover:border-emerald-400 shadow-2xs" 
                              : "bg-[#0d1117] border-[#1a2130] hover:border-[#00e599]/30"
                        } border p-1.5 rounded-lg flex items-center justify-between cursor-pointer transition gap-1.5`}
                      >
                        <div className="text-left min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className={`text-[9.5px] font-black ${
                              isAnim
                                ? isModernSleek ? "text-purple-900 group-hover:text-purple-700" : "text-purple-200 group-hover:text-purple-300"
                                : isModernSleek ? "text-slate-900 group-hover:text-emerald-700" : "text-white group-hover:text-[#00E599]"
                            } truncate leading-tight transition flex items-center gap-1`}>
                              {isAnim && <span className="text-[10px]">🎬</span>}
                              <span>{sc.name}</span>
                            </p>

                            {isAnim && (
                              <span className="text-[6.5px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider shrink-0 shadow-2xs">
                                ANIMATION
                              </span>
                            )}

                          </div>
                          <span className={`text-[7.5px] ${isAnim ? (isModernSleek ? "text-purple-600 font-extrabold" : "text-purple-300/80 font-bold") : (isModernSleek ? "text-slate-400 font-bold" : "text-[#62728f] font-bold")} block mt-0.5`}>
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
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[8px] rounded transition shadow-md cursor-pointer"
                              title="Confirmer la suppression"
                            >
                              Supprimer
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteSchemaId(null);
                              }}
                              className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[8px] rounded transition cursor-pointer"
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
                                handleOpenShareSchema(sc);
                              }}
                              className={`p-1 ${isModernSleek ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-emerald-700" : "bg-[#131b29] hover:bg-[#1f2b40] border-[#1a2130] text-slate-400 hover:text-[#00E599]"} border rounded transition cursor-pointer flex items-center justify-center z-10`}
                              title="Partager ce schéma (WhatsApp & Mail)"
                            >
                              <Share2 className="h-3 w-3" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setConfirmDeleteSchemaId(sc.id);
                              }}
                              className={`p-1 ${isModernSleek ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600 hover:text-rose-800" : "bg-rose-950/60 hover:bg-rose-900 border-rose-800/80 text-rose-300 hover:text-white"} border rounded transition cursor-pointer flex items-center justify-center z-10`}
                              title="Supprimer ce schéma"
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* MATCH CARD (MATCH À VENIR / MATCH EN COURS) */}
            <div className={`${isModernSleek ? "bg-slate-50/90 border border-slate-200 text-slate-800 shadow-2xs" : "bg-[#090d14] border border-[#1a2130]"} rounded-xl p-2`}>
              <div className={`flex items-center justify-between mb-1.5 border-b ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/60"} pb-1`}>
                <div className="flex items-center gap-1.5">
                  {isLiveMatchMode ? (
                    <span className="text-rose-500 text-[9px] font-black flex items-center gap-1 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      🔴 LIVE
                    </span>
                  ) : (
                    <span className={`${isModernSleek ? "text-slate-600 font-extrabold" : "text-[#62728f]"} text-[9px] font-black uppercase flex items-center gap-1`}>
                      ⚽ MATCH
                    </span>
                  )}
                  <span className="text-[7px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1 py-0.2 rounded uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                    <Award className="w-2 h-2" /> PRO
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={() => setIsMatchEditOpen(true)}
                    className={`relative p-0.5 ${isModernSleek ? "hover:bg-slate-200 border-slate-200 text-emerald-700" : "hover:bg-[#1a2333] border-[#1a2130] text-[#00E599]"} border rounded transition cursor-pointer`}
                    title="Gérer ou ajouter des matchs"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={handlePrevMatch}
                    disabled={filteredMatches.findIndex(m => m.id === activeMatchId) <= 0}
                    className={`p-0.5 ${isModernSleek ? "text-slate-500 hover:text-slate-900" : "text-[#62728f] hover:text-brand-cream"} disabled:opacity-30 transition cursor-pointer`}
                    title="Match précédent"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={handleNextMatch}
                    disabled={filteredMatches.findIndex(m => m.id === activeMatchId) >= filteredMatches.length - 1 || filteredMatches.length === 0}
                    className={`p-0.5 ${isModernSleek ? "text-slate-500 hover:text-slate-900" : "text-[#62728f] hover:text-brand-cream"} disabled:opacity-30 transition cursor-pointer`}
                    title="Match suivant"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Match details & Live controls card */}
              <div 
                className={`${
                  isModernSleek ? "bg-white border-slate-200 text-slate-800 shadow-2xs" : "bg-[#0d1117]"
                } border rounded-lg p-2 text-center relative overflow-hidden transition ${
                  isLiveMatchMode
                    ? "border-rose-600/70 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30"
                    : isModernSleek ? "hover:border-slate-300 group cursor-pointer" : "border-[#1f293d] group cursor-pointer hover:border-[#354563]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  {/* Home Team */}
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <span className="text-[10px] mb-0.5">🛡️</span>
                    <span className={`text-[9px] font-black ${isModernSleek ? "text-slate-900" : "text-white"} truncate max-w-[60px] uppercase`}>
                      {activeMatch.homeTeam}
                    </span>
                    {isLiveMatchMode && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setHomeScore(Math.max(0, homeScore - 1)); }}
                          className="w-4 h-4 rounded bg-[#102420] text-[#00E599] text-[9px] font-black hover:bg-[#1a3830] transition cursor-pointer flex items-center justify-center border border-[#00e599]/30"
                          title="Diminuer le score domicile"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-[#00E599] px-0.5 font-mono">{homeScore}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setHomeScore(homeScore + 1); }}
                          className="w-4 h-4 rounded bg-[#102420] text-[#00E599] text-[9px] font-black hover:bg-[#1a3830] transition cursor-pointer flex items-center justify-center border border-[#00e599]/30"
                          title="Augmenter le score domicile"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Score or VS center column with MODE LIVE button */}
                  <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                    {activeMatch?.isFinished || currentPeriod === "FIN" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSleekToastMessage("🔒 Match terminé : Le mode Live est désactivé.");
                          setTimeout(() => setSleekToastMessage(null), 3500);
                          setIsMatchFinishedModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-full text-[8px] font-black transition cursor-pointer flex items-center gap-1 border bg-slate-900/90 text-emerald-400 border-emerald-500/50 shadow-sm hover:bg-slate-800"
                        title="Match terminé - Cliquez pour ouvrir le bilan du match"
                      >
                        <span>🏁 MATCH TERMINÉ</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLiveMatchMode && !isProPlusOrAdmin) {
                            setIsLiveMatchUpgradeModalOpen(true);
                            return;
                          }
                          const nextState = !isLiveMatchMode;
                          setIsLiveMatchMode(nextState);
                          if (nextState) {
                            setIsLiveTimerRunning(true);
                          } else {
                            setIsLiveTimerRunning(false);
                            setLiveActionToken(null);
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded-full text-[8px] font-black transition cursor-pointer flex items-center gap-0.5 border shadow-sm ${
                          isLiveMatchMode
                            ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-400 shadow-rose-900/50"
                            : isModernSleek
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-[#131d2b] hover:bg-[#1a283b] text-[#00E599] border-[#00E599]/40 hover:border-[#00E599]"
                        }`}
                        title={isLiveMatchMode ? "Désactiver le mode Live Match" : (!isProPlusOrAdmin ? "Mode Live Match (Exclusivité PRO+)" : "Lancer le mode Live Match")}
                      >
                        <span className={isLiveMatchMode ? "animate-pulse text-rose-200 text-[9px]" : "text-[9px]"}>🔴</span>
                        <span>{isLiveMatchMode ? "LIVE" : "MODE LIVE"}</span>
                        {!isProPlusOrAdmin && (
                          <span className="text-[7px] bg-amber-400 text-slate-950 font-black px-1 rounded-sm ml-0.5">PRO+</span>
                        )}
                      </button>
                    )}

                    {isLiveMatchMode ? (
                      <div className="text-center">
                        <div className="text-sm font-black text-white font-mono bg-[#111827] px-2 py-0.5 rounded-md border border-rose-500/40">
                          {homeScore} - {awayScore}
                        </div>
                      </div>
                    ) : (
                      <span className={`text-[9px] ${isModernSleek ? "text-slate-400" : "text-[#62728f]"} font-black uppercase`}>VS</span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <span className="text-[10px] mb-0.5">🛡️</span>
                    <span className={`text-[9px] font-black ${isModernSleek ? "text-slate-900" : "text-white"} truncate max-w-[60px] uppercase`}>
                      {activeMatch.awayTeam}
                    </span>
                    {isLiveMatchMode && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setAwayScore(Math.max(0, awayScore - 1)); }}
                          className="w-4 h-4 rounded bg-rose-950/80 text-rose-300 text-[9px] font-black hover:bg-rose-900 transition cursor-pointer flex items-center justify-center border border-rose-500/30"
                          title="Diminuer le score extérieur"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-rose-400 px-0.5 font-mono">{awayScore}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAwayScore(awayScore + 1); }}
                          className="w-4 h-4 rounded bg-rose-950/80 text-rose-300 text-[9px] font-black hover:bg-rose-900 transition cursor-pointer flex items-center justify-center border border-rose-500/30"
                          title="Augmenter le score extérieur"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chrono, Period & Events section */}
                {isLiveMatchMode ? (
                  <div className="mt-2 pt-1.5 border-t border-rose-900/40 flex flex-col items-center gap-1.5">
                    {/* Period Selector Buttons (1MT | PAUSE | 2MT | FIN) */}
                    <div className="flex items-center justify-between gap-1 w-full bg-[#080d14] p-1 rounded-lg border border-[#1f293d]">
                      {(["1MT", "MI-TEMPS", "2MT", "FIN"] as const).map((periodKey) => (
                        <button
                          key={periodKey}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (periodKey === "FIN") {
                              handleFinishLiveMatch();
                            } else {
                              setCurrentPeriod(periodKey);
                              if (periodKey === "MI-TEMPS") {
                                setIsLiveTimerRunning(false);
                              } else if (!isLiveTimerRunning) {
                                setIsLiveTimerRunning(true);
                              }
                            }
                          }}
                          className={`flex-1 py-1 rounded text-[7.5px] font-black transition cursor-pointer text-center uppercase tracking-tight ${
                            currentPeriod === periodKey
                              ? periodKey === "FIN"
                                ? "bg-rose-600 text-white shadow-sm"
                                : periodKey === "MI-TEMPS"
                                ? "bg-amber-400 text-slate-950 font-extrabold"
                                : "bg-[#00E599] text-slate-950 font-extrabold"
                              : "bg-[#111827] text-slate-400 hover:text-white hover:bg-[#1a2333]"
                          }`}
                        >
                          {periodKey === "MI-TEMPS" ? "PAUSE" : periodKey}
                        </button>
                      ))}
                    </div>

                    {/* Timer Bar */}
                    <div className="flex items-center justify-between gap-1 w-full bg-black/60 p-1.5 rounded-lg border border-rose-900/40">
                      <span className="text-xs font-mono font-black text-amber-400 bg-black px-1.5 py-0.5 rounded border border-amber-500/30">
                        ⏱️ {formatLiveTime(liveTimerSeconds)}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsLiveTimerRunning(!isLiveTimerRunning); }}
                          className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase transition cursor-pointer ${
                            isLiveTimerRunning
                              ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          }`}
                        >
                          {isLiveTimerRunning ? "PAUSE" : "START"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLiveTimerSeconds(0); }}
                          className="px-1.5 py-0.5 rounded bg-[#1f293d] hover:bg-[#2e3d5b] text-slate-300 text-[8px] font-black transition cursor-pointer"
                          title="Réinitialiser le chrono"
                        >
                          🔄
                        </button>
                      </div>
                    </div>

                    {/* Manual Match Finish Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFinishLiveMatch();
                      }}
                      className="w-full py-1.5 px-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer border border-rose-400/50 shadow-md shadow-rose-950/50 flex items-center justify-center gap-1"
                      title="Enregistrer les résultats et terminer officiellement le match"
                    >
                      <span>🏁 TERMINER LE MATCH</span>
                    </button>

                    {/* Match Events Feed Log */}
                    {matchEvents.filter((evt) => evt.type !== "assist").length > 0 && (
                      <div className="mt-1 w-full bg-black/60 p-1.5 rounded-lg border border-[#1f293d] max-h-32 overflow-y-auto text-left space-y-1 scrollbar-thin">
                        <div className="text-[7.5px] text-[#00E599] font-black uppercase tracking-wider flex items-center justify-between border-b border-[#1f293d] pb-0.5">
                          <span>ÉVÉNEMENTS ({matchEvents.filter((evt) => evt.type !== "assist").length}) :</span>
                          <button
                            onClick={() => {
                              if (confirm("Effacer tout l'historique des événements de ce match ?")) {
                                setMatchEvents([]);
                              }
                            }}
                            className="text-[7px] text-slate-500 hover:text-rose-400 font-bold transition cursor-pointer"
                          >
                            Effacer
                          </button>
                        </div>
                        {matchEvents
                          .filter((evt) => evt.type !== "assist")
                          .map((evt) => (
                            <div key={evt.id} className="text-[8.5px] font-bold flex items-center justify-between text-slate-200 hover:bg-[#131b29] p-0.5 rounded transition group">
                              <span className="flex items-center gap-1 truncate min-w-0">
                                <span className="text-[10px]">{evt.type === "goal" ? "⚽" : evt.type === "yellow" ? "🟨" : evt.type === "red" ? "🟥" : "🔄"}</span>
                                <span className="text-white font-extrabold truncate max-w-[130px]">
                                  {evt.player}
                                  {evt.type === "goal" && evt.assister ? (
                                    <span className="text-[#00E599] font-bold text-[8px] ml-0.5">
                                      ({evt.assister})
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <span className="text-[7.5px] text-amber-400 font-mono font-black">
                                  {evt.period ? `${evt.period} ${evt.time}` : evt.time}
                                </span>
                                <button
                                  onClick={() => handleDeleteMatchEvent(evt.id)}
                                  className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition px-0.5 cursor-pointer font-black text-[8px]"
                                  title="Supprimer cet événement"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsMatchEditOpen(true)}
                    className={`mt-1.5 pt-1 border-t ${isModernSleek ? "border-slate-100" : "border-[#1f293d]/60"} cursor-pointer text-center`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <p className={`text-[8.5px] font-black ${isModernSleek ? "text-slate-700" : "text-slate-300"} uppercase tracking-wider truncate`}>
                        {activeMatch.competition}
                      </p>
                      {activeMatch.isFinished && (
                        <span className="text-[7px] bg-emerald-500 text-slate-950 font-black px-1 rounded uppercase">
                          TERMINÉ
                        </span>
                      )}
                    </div>
                    {activeMatch.score && (
                      <p className="text-xs font-mono font-black text-[#00E599]">
                        Score : {activeMatch.score}
                      </p>
                    )}
                    <p className={`text-[8.5px] font-bold ${isModernSleek ? "text-emerald-700" : "text-slate-400"} mt-0.5`}>
                      {activeMatch.dateTime}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* NOTES TACTIQUES dictation & editing container */}
            <div className={`${isModernSleek ? "bg-slate-50/90 border border-slate-200 text-slate-800 shadow-2xs" : "bg-[#090d14] border border-[#1a2130]"} rounded-xl p-2`}>
              <div className={`flex items-center justify-between mb-1.5 border-b ${isModernSleek ? "border-slate-200" : "border-[#1f293d]/60"} pb-1`}>
                <p className={`text-[9px] ${isModernSleek ? "text-slate-600 font-extrabold" : "text-[#62728f]"} font-black uppercase tracking-wider flex items-center gap-1`}>
                  <span>📝 NOTES</span>
                  <span className="text-[7px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1 py-0.2 rounded uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                    <Award className="w-2 h-2" /> PRO
                  </span>
                </p>
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={handleToggleMicRecording}
                    className={`relative p-0.5 border rounded transition cursor-pointer ${
                      isRecordingVoice
                        ? "bg-rose-600 border-rose-500 text-white animate-pulse"
                        : isModernSleek 
                          ? "hover:bg-slate-200 border-slate-200 text-amber-600 hover:text-amber-800"
                          : "hover:bg-[#1a2333] border-[#1a2130] text-amber-500 hover:text-brand-cream"
                    }`}
                    title={isRecordingVoice ? "Arrêter l'enregistrement" : "Enregistrer une note vocale"}
                  >
                    <Mic className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => setIsNotesExpanded(true)}
                    className={`p-0.5 ${isModernSleek ? "hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-900" : "hover:bg-[#1a2333] border-[#1a2130] text-[#62728f] hover:text-brand-cream"} border rounded transition`}
                    title="Agrandir les notes"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {isRecordingVoice && (
                <div className="mb-1.5 bg-rose-950/30 border border-rose-500/50 rounded-lg p-1 flex items-center justify-between text-[8px] text-rose-300 shadow-sm animate-pulse">
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    🎤 Dictée vocale...
                  </span>
                  <span className="font-extrabold underline text-rose-200 cursor-pointer" onClick={handleToggleMicRecording}>Arrêter</span>
                </div>
              )}

              {speechError && (
                <div className="mb-1.5 bg-rose-950/50 border border-rose-500/60 rounded-lg p-1 text-[8px] text-rose-200 flex items-center justify-between font-bold">
                  <span>⚠️ {speechError}</span>
                  <button onClick={() => setSpeechError(null)} className="text-slate-400 hover:text-white font-bold ml-1">✕</button>
                </div>
              )}

              <textarea
                value={tacticalNotes}
                onChange={(e) => setTacticalNotes(e.target.value)}
                placeholder="STRATÉGIE ET NOTES DU MATCH..."
                className={`w-full h-24 ${
                  isModernSleek 
                    ? "bg-white border-slate-300 focus:border-emerald-500 text-slate-900 placeholder-slate-400 shadow-2xs" 
                    : "bg-[#0d1117] border-[#1f293d] focus:border-[#354563] text-slate-200 placeholder-[#62728f]"
                } border rounded-lg p-2 text-[11px] focus:outline-none resize-none font-medium leading-relaxed scrollbar-thin transition`}
              />
            </div>

          </div>

          {/* Quick coaching quotes footer watermark */}
          <div className={`p-2 border-t ${isModernSleek ? "border-slate-200 bg-slate-50" : "border-[#1f293d] bg-[#090c12]"} text-center`}>
            <p className={`text-[8.5px] ${isModernSleek ? "text-slate-500" : "text-[#62728f]"} font-bold uppercase tracking-widest`}>
              THE BOX FOOTBALL CLUB • VERSION DÉMO
            </p>
          </div>

        </aside>

      </div>



      {/* ========================================================= */}
      {/* 4. STRIPE PREMIUM SUBSCRIPTION PLANS POPUP MODAL */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-[#1f293d] max-w-4xl w-full rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
            
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 text-[#62728f] hover:text-white text-sm font-bold p-1 bg-[#1a2333]/40 rounded-full"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
              <span className="text-xl">🏆</span> ACTIVER LA LICENCE PRO COACH
            </h3>
            <p className="text-xs text-[#62728f] max-w-md mx-auto mt-2">
              Débloquez l&apos;accès complet à toutes les fonctionnalités premium pour concevoir, exporter et imprimer vos schémas tactiques.
            </p>

            {/* Pricing columns grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 text-left">
              
              {/* Free Plan */}
              <div className="bg-[#090d14] border border-[#1f293d] rounded-xl p-5 relative">
                <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full absolute top-4 right-4">Actif</span>
                <h4 className="text-sm font-black text-white uppercase">DÉMO GRATUIT</h4>
                <p className="text-xl font-black text-white mt-1">0 € <span className="text-xs text-[#62728f] font-normal">/ mois</span></p>
                <ul className="text-[10px] text-slate-300 space-y-2 mt-4">
                  <li className="flex items-center gap-1.5">✓ 1 Phase Tactique active</li>
                  <li className="flex items-center gap-1.5">✓ Tableau blanc de base</li>
                  <li className="flex items-center gap-1.5">✗ Exportations PDF / Images</li>
                  <li className="flex items-center gap-1.5">✗ Animations multi-phases</li>
                </ul>
              </div>

              {/* Monthly Premium Plan (Best option) */}
              <div className="bg-[#0a1b16] border-2 border-[#00E599] rounded-xl p-5 relative shadow-lg shadow-[#00e599]/5">
                <span className="text-[8px] font-black uppercase text-[#0d1117] bg-[#00E599] px-2 py-0.5 rounded-full absolute top-4 right-4">POPULAIRE</span>
                <h4 className="text-sm font-black text-[#00E599] uppercase">MENSUEL PRO</h4>
                <p className="text-xl font-black text-white mt-1">9.99 € <span className="text-xs text-[#62728f] font-normal">/ mois</span></p>
                <ul className="text-[10px] text-slate-200 space-y-2 mt-4">
                  <li className="flex items-center gap-1.5 text-[#00E599]">✓ Phases d&apos;animations illimitées</li>
                  <li className="flex items-center gap-1.5">✓ Exportations PDF & Images HD</li>
                  <li className="flex items-center gap-1.5">✓ Intelligence artificielle Coach IA</li>
                  <li className="flex items-center gap-1.5">✓ Sauvegardes de schémas illimitées</li>
                </ul>
                <button 
                  onClick={() => { setActivePlan("mensuel"); setIsCheckoutOpen(false); alert("Félicitations ! Votre abonnement MENSUEL PRO est maintenant actif !"); }}
                  className="w-full mt-5 py-2 bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117] font-black text-[10px] uppercase rounded-lg transition"
                >
                  Choisir
                </button>
              </div>

              {/* Annual Plan */}
              <div className="bg-[#090d14] border border-[#1f293d] rounded-xl p-5">
                <h4 className="text-sm font-black text-white uppercase">ANNUEL PRO</h4>
                <p className="text-xl font-black text-white mt-1">79.99 € <span className="text-xs text-[#62728f] font-normal">/ an</span></p>
                <p className="text-[8px] text-[#00E599] font-bold mt-1 uppercase">ÉCONOMISEZ 30%</p>
                <ul className="text-[10px] text-slate-300 space-y-2 mt-4">
                  <li className="flex items-center gap-1.5">✓ Tout l&apos;accès PRO mensuel</li>
                  <li className="flex items-center gap-1.5">✓ Facturation annuelle unique</li>
                  <li className="flex items-center gap-1.5">✓ Support prioritaire 24/7</li>
                  <li className="flex items-center gap-1.5">✓ Mises à jour fonctionnalités prioritaires</li>
                </ul>
                <button 
                  onClick={() => { setActivePlan("annuel"); setIsCheckoutOpen(false); alert("Félicitations ! Votre abonnement ANNUEL PRO est maintenant actif !"); }}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-[10px] uppercase rounded-lg transition"
                >
                  Choisir
                </button>
              </div>

            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-[#62728f]">
              <span>🔒 Paiement sécurisé opéré par Stripe. Annulation en 1 clic possible à tout moment.</span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. NOTES TACTIQUES EXPAND OVERLAY MODAL */}
      {/* ========================================================= */}
      {isNotesExpanded && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-[#1f293d] max-w-3xl w-full rounded-2xl p-6 shadow-2xl relative flex flex-col h-[70vh]">
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-3 mb-3">
              <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                <span>📝</span> NOTES TACTIQUES COMPLETES
              </h3>
              <button 
                onClick={() => setIsNotesExpanded(false)}
                className="text-slate-400 hover:text-white font-bold p-1 hover:bg-[#1a2333] rounded"
              >
                Fermer
              </button>
            </div>
            <textarea
              value={tacticalNotes}
              onChange={(e) => setTacticalNotes(e.target.value)}
              placeholder="Saisissez ici l'intégralité de vos consignes tactiques et physiques de match..."
              className="flex-1 w-full bg-[#090d14] border border-[#1f293d] rounded-xl p-4 text-xs text-white placeholder-[#62728f] focus:outline-none focus:border-[#354563] resize-none font-medium leading-relaxed scrollbar-thin"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SELECTION DU PASSEUR DECISIF MODAL */}
      {/* ========================================================= */}
      {pendingGoalToken && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className="bg-[#0d1117] border border-[#00E599]/60 max-w-md w-full rounded-2xl p-5 shadow-[0_0_30px_rgba(0,229,153,0.15)] relative flex flex-col text-white">
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚽</span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    NOUVEAU BUT !
                  </h3>
                  <p className="text-[10.5px] text-[#00E599] font-bold mt-0.5">
                    Buteur : #{pendingGoalToken.number || "?"} {pendingGoalToken.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingGoalToken(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <span>👟</span>
                <span>Passeur décisif (Optionnel) :</span>
              </label>

              {/* Action individuelle / sans passeur option */}
              <button
                type="button"
                onClick={() => setSelectedPasseurName("")}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  selectedPasseurName === ""
                    ? "bg-[#00E599]/20 border-[#00E599] text-[#00E599]"
                    : "bg-[#111827] border-[#1f293d] text-slate-300 hover:bg-[#1f293d]"
                }`}
              >
                <span>🚫 Aucun (Action individuelle / Solo)</span>
                {selectedPasseurName === "" && <CheckCircle className="w-4 h-4 text-[#00E599]" />}
              </button>

              {/* List of teammates on pitch and bench for this team */}
              <div className="text-[10px] text-slate-400 font-bold uppercase mt-2 mb-1">
                Coéquipiers de l&apos;équipe :
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {currentTokens
                  .filter((t) => t.type === pendingGoalToken.type && t.id !== pendingGoalToken.id)
                  .concat(
                    (pendingGoalToken.type === "player_a" ? substitutes : opponentSubstitutes)
                      .filter((s) => s.id !== pendingGoalToken.id)
                  )
                  .map((teammate) => {
                    const isSelected = selectedPasseurName === teammate.name;
                    return (
                      <button
                        key={teammate.id}
                        type="button"
                        onClick={() => setSelectedPasseurName(teammate.name)}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[#00E599]/20 border-[#00E599] text-white shadow-sm"
                            : "bg-[#111827] border-[#1f293d] text-slate-300 hover:bg-[#131d2b]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-[#1f293d] text-[#00E599] font-black text-[9px] flex items-center justify-center shrink-0">
                            {teammate.number || "?"}
                          </span>
                          <span className="truncate">{teammate.name}</span>
                          <span className="text-[9px] text-slate-500 font-normal shrink-0">({teammate.role || "Joueur"})</span>
                        </div>
                        {isSelected && <CheckCircle className="w-4 h-4 text-[#00E599] shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-[#1f293d]">
              <button
                type="button"
                onClick={() => setPendingGoalToken(null)}
                className="flex-1 py-2.5 px-3 bg-[#111827] hover:bg-[#1f293d] border border-[#1f293d] text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => confirmGoalRecord(pendingGoalToken, selectedPasseurName)}
                className="flex-1 py-2.5 px-3 bg-[#00E599] hover:bg-[#05be80] text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-lg shadow-[#00e599]/20 flex items-center justify-center gap-1.5"
              >
                <span>⚽ VALIDER LE BUT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. EDIT UPCOMING MATCHES & MANAGEMENT OVERLAY POPUP */}
      {/* ========================================================= */}
      {isMatchEditOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-[#1f293d] max-w-2xl w-full rounded-2xl p-4 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-3 mb-4 shrink-0">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white uppercase flex items-center gap-2">
                  <span>📋 GESTION DES MATCHS DU CLUB</span>
                  <span className="text-[7.5px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5" /> PRO
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Consultez, modifiez, supprimez ou créez vos matchs enregistrés ({matchesList.length})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddNewMatch();
                  }}
                  className="px-3 py-1.5 bg-[#00E599] hover:bg-[#05be80] text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#00e599]/20"
                  title="Créer un nouveau match"
                >
                  <Plus className="h-3.5 w-3.5" /> NOUVEAU MATCH
                </button>
                <button
                  onClick={() => setIsMatchEditOpen(false)}
                  className="p-1.5 rounded-lg bg-[#162235] hover:bg-[#233350] text-slate-300 hover:text-white transition cursor-pointer"
                  title="Fermer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filters Bar: Search & Team filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un match, un adversaire ou une compétition..."
                  value={matchSearchQuery}
                  onChange={(e) => setMatchSearchQuery(e.target.value)}
                  className="w-full bg-[#090d14] border border-[#1f293d] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E599]"
                />
              </div>

              <select
                value={matchTeamFilter}
                onChange={(e) => setMatchTeamFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#090d14] border border-[#1f293d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599]"
              >
                <option value="all">🛡️ Toutes les Équipes du Club</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    🛡️ {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Matches List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {(() => {
                const filtered = matchesList.filter((m) => {
                  const matchTeam = m.teamId || "team_1";
                  if (matchTeamFilter !== "all" && matchTeam !== matchTeamFilter) return false;
                  if (!matchSearchQuery.trim()) return true;
                  const q = matchSearchQuery.toLowerCase();
                  return (
                    m.homeTeam?.toLowerCase().includes(q) ||
                    m.awayTeam?.toLowerCase().includes(q) ||
                    m.competition?.toLowerCase().includes(q) ||
                    m.dateTime?.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="border border-dashed border-[#1f293d] rounded-2xl p-8 text-center text-slate-400">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2">AUCUN MATCH TROUVÉ</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddNewMatch();
                        }}
                        className="px-3 py-1.5 bg-[#00E599] text-slate-950 font-black text-xs rounded-lg transition cursor-pointer hover:bg-[#05be80]"
                      >
                        ➕ Créer un match
                      </button>
                    </div>
                  );
                }

                return filtered.map((m) => {
                  const isActive = m.id === activeMatchId;
                  const isEditing = editingMatchId === m.id;
                  const mTeam = teams.find((t) => t.id === (m.teamId || "team_1"));
                  const isFinished = m.isFinished || m.status?.includes("Terminé");

                  return (
                    <div
                      key={m.id}
                      className={`border rounded-2xl p-3.5 transition ${
                        isActive
                          ? "border-[#00E599] bg-[#0c1a17] shadow-lg shadow-[#00e599]/10"
                          : "border-[#1f293d] bg-[#090d14] hover:border-[#354563]"
                      }`}
                    >
                      {/* Match Card Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f293d]/60 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Active badge */}
                          {isActive ? (
                            <span className="text-[8px] bg-[#00E599] text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              🎯 ACTIF SUR LE TERRAIN
                            </span>
                          ) : (
                            <button
                              onClick={() => selectMatch(m.id)}
                              className="text-[8px] bg-[#162235] hover:bg-[#233350] text-slate-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition cursor-pointer border border-[#2e3d5b]"
                            >
                              ▶️ Activer sur le terrain
                            </button>
                          )}

                          {/* Status badge */}
                          {isFinished ? (
                            <span className="text-[8px] bg-slate-800 text-emerald-400 font-black px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                              🏁 TERMINÉ ({m.score || `${m.homeScore || 0} - ${m.awayScore || 0}`})
                            </span>
                          ) : (
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-500/30 uppercase">
                              📅 À VENIR
                            </span>
                          )}

                          {/* Team badge */}
                          <span className="text-[8px] bg-[#131d2b] text-slate-300 font-bold px-2 py-0.5 rounded-full border border-[#1f293d] uppercase">
                            🛡️ {mTeam?.name || "Équipe"}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => setEditingMatchId(isEditing ? null : m.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                              isEditing
                                ? "bg-amber-400 text-slate-950 border-amber-400"
                                : "bg-[#131d2b] hover:bg-[#1f2b40] text-slate-200 border-[#1f293d]"
                            }`}
                            title={isEditing ? "Fermer l'édition" : "Modifier les détails"}
                          >
                            <Pencil className="h-3 w-3" />
                            <span>{isEditing ? "Fermer" : "Modifier"}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteMatchFromList(m.id)}
                            className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Supprimer ce match"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>

                      {/* Display View or Edit Form */}
                      {!isEditing ? (
                        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
                              <span>⚽ {m.homeTeam}</span>
                              <span className="text-[#00E599] font-mono">VS</span>
                              <span>{m.awayTeam}</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              🏆 {m.competition} • 📅 {m.dateTime}
                            </p>
                          </div>

                          {m.score && (
                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-black text-[#00E599] bg-black/60 px-2 py-1 rounded-lg border border-[#1f293d]">
                                Score : {m.score}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Inline Edit Form */
                        <div className="mt-3 p-3 bg-[#05080e] rounded-xl border border-[#1f293d] space-y-3">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block border-b border-[#1f293d] pb-1">
                            ✏️ MODIFIER LE MATCH : {m.homeTeam} VS {m.awayTeam}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[9.5px] text-slate-400 font-black uppercase mb-1">Équipe Concernée</label>
                              <select
                                value={m.teamId || activeTeamId || "team_1"}
                                onChange={(e) => updateMatchById(m.id, "teamId", e.target.value)}
                                className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
                              >
                                {teams.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    🛡️ {t.name} ({t.category})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Type de Compétition */}
                            <div>
                              <label className="block text-[9.5px] text-slate-400 font-black uppercase mb-1">Type de Compétition</label>
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
                                className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
                              >
                                <option value="CHAMPIONNAT">🏆 CHAMPIONNAT</option>
                                <option value="COUPE">🏆 COUPE</option>
                                <option value="AMICAL">🤝 AMICAL</option>
                              </select>
                            </div>

                            {/* Équipe Domicile */}
                            <div>
                              <label className="block text-[9.5px] text-slate-400 font-black uppercase mb-1">Équipe Domicile</label>
                              <input
                                type="text"
                                value={m.homeTeam || ""}
                                onChange={(e) => updateMatchById(m.id, "homeTeam", e.target.value)}
                                className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
                              />
                            </div>

                            {/* Équipe Extérieure */}
                            <div>
                              <label className="block text-[9.5px] text-slate-400 font-black uppercase mb-1">Équipe Extérieure</label>
                              <input
                                type="text"
                                value={m.awayTeam || ""}
                                onChange={(e) => updateMatchById(m.id, "awayTeam", e.target.value)}
                                className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
                              />
                            </div>

                            {/* Nom Précis / Poule de la Compétition */}
                            <div className="sm:col-span-2">
                              <label className="block text-[9.5px] text-slate-400 font-black uppercase mb-1">Nom / Niveau de la Compétition (Optionnel)</label>
                              <input
                                type="text"
                                value={m.competition || ""}
                                onChange={(e) => updateMatchById(m.id, "competition", e.target.value)}
                                className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
                                placeholder="ex: Championnat Régional 1, Coupe de France, Match Amical..."
                              />
                            </div>

                            {/* Date du Match */}
                            <div>
                              <label className="block text-[9.5px] text-slate-400 font-black uppercase mb-1">📅 Date du Match</label>
                              <input
                                type="date"
                                value={m.date || ""}
                                onChange={(e) => updateMatchById(m.id, "date", e.target.value)}
                                className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
                              />
                            </div>

                            {/* Heure du Match */}
                            <div>
                              <label className="block text-[9.5px] text-slate-400 font-black uppercase mb-1">⏰ Heure du Match</label>
                              <input
                                type="time"
                                value={m.time || "15:00"}
                                onChange={(e) => updateMatchById(m.id, "time", e.target.value)}
                                className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
                              />
                            </div>

                            {/* Score (Facultatif) */}
                            <div className="sm:col-span-2">
                              <label className="block text-[9.5px] text-slate-400 font-black uppercase mb-1">Score Final (si le match est déjà terminé)</label>
                              <input
                                type="text"
                                value={m.score || ""}
                                onChange={(e) => updateMatchById(m.id, "score", e.target.value)}
                                className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E599]"
                                placeholder="ex: 2 - 1"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingMatchId(null)}
                              className="px-3 py-1.5 bg-[#00E599] text-slate-950 font-black rounded-lg text-xs hover:bg-[#05be80] transition cursor-pointer"
                            >
                              ✓ Valider les modifications
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#1f293d] mt-3 flex justify-end shrink-0">
              <button
                onClick={() => setIsMatchEditOpen(false)}
                className="px-5 py-2 bg-[#162235] hover:bg-[#233350] text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6.5. MATCH FINISHED RECAP MODAL */}
      {/* ========================================================= */}
      {isMatchFinishedModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div ref={matchFinishedModalRef} className="bg-[#0d1117] border-2 border-emerald-500/80 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-[#0d1117] to-emerald-950 -mx-6 -mt-6 p-5 border-b border-emerald-500/30 text-center relative mb-5">
              <span className="text-2xl mb-1 block">🏆</span>
              <h3 className="text-sm sm:text-base font-black uppercase text-[#00E599] tracking-wider">
                MATCH TERMINÉ — SCORE FINAL
              </h3>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                {activeMatch.competition} • {activeMatch.dateTime}
              </p>
              {!isExportingModalScreen && (
                <button
                  onClick={() => setIsMatchFinishedModalOpen(false)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Big Score Box */}
            <div className="bg-gradient-to-b from-[#131d2b] to-[#0a0f18] border border-emerald-500/40 rounded-2xl p-4 text-center mb-5 shadow-lg relative">
              <div className="flex items-center justify-around gap-2">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xl mb-1">🛡️</span>
                  <span className="text-xs font-black uppercase text-white truncate max-w-[100px]">
                    {activeMatch.homeTeam}
                  </span>
                  <span className="text-3xl font-black font-mono text-[#00E599] mt-1">
                    {homeScore}
                  </span>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <span className="text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full shadow-md">
                    TERMINÉ
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 mt-2 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
                    ⏱️ {formatLiveTime(liveTimerSeconds)}
                  </span>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <span className="text-xl mb-1">🛡️</span>
                  <span className="text-xs font-black uppercase text-white truncate max-w-[100px]">
                    {activeMatch.awayTeam}
                  </span>
                  <span className="text-3xl font-black font-mono text-rose-400 mt-1">
                    {awayScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Events timeline */}
            {matchEvents.filter((evt) => evt.type !== "assist").length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] font-black text-[#00E599] uppercase tracking-wider block mb-1.5">
                  HISTORIQUE DES ÉVÉNEMENTS DU MATCH ({matchEvents.filter((evt) => evt.type !== "assist").length})
                </span>
                <div className="bg-[#080d14] p-2 rounded-xl border border-[#1f293d] max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {matchEvents
                    .filter((evt) => evt.type !== "assist")
                    .map((evt) => (
                      <div key={evt.id} className="text-xs font-bold flex items-center justify-between text-slate-200 bg-[#0f172a] px-2.5 py-1.5 rounded-lg border border-[#1f293d]">
                        <span className="flex items-center gap-2 truncate">
                          <span>{evt.type === "goal" ? "⚽" : evt.type === "yellow" ? "🟨" : evt.type === "red" ? "🟥" : "🔄"}</span>
                          <span className="text-white font-extrabold flex items-center gap-1">
                            {evt.player}
                            {evt.type === "goal" && evt.assister ? (
                              <span className="text-[#00E599] font-bold text-xs">
                                ({evt.assister})
                              </span>
                            ) : null}
                          </span>
                          {evt.type !== "goal" && <span className="text-slate-400 font-normal text-[10px]">({evt.note})</span>}
                        </span>
                        <span className="text-amber-400 font-mono text-[10px] font-black shrink-0 ml-2">
                          {evt.period ? `${evt.period} • ${evt.time}` : evt.time}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Buttons / Actions */}
            {!isExportingModalScreen && (
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#1f293d]">
                <button
                  onClick={handleShareMatchWhatsApp}
                  className="w-full sm:flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20 text-center flex items-center justify-center gap-1.5"
                  title="Partager le bilan complet du match directement sur WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span>PARTAGER WHATSAPP</span>
                </button>

                <button
                  onClick={handleExportModalWindowImage}
                  className="w-full sm:flex-1 py-2.5 px-3 bg-[#131d2b] hover:bg-[#1c2c40] border border-[#00E599]/40 text-[#00E599] font-bold text-xs rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                  title="Exporter une capture image PNG exacte de cette fenêtre"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>📸 EXPORTER FENÊTRE (PNG)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMatchFinishedModalOpen(false);
                    setIsLiveMatchMode(false);
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 bg-[#182338] hover:bg-[#233350] text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer text-center"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl relative border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>
            <h3 className={`text-sm font-black ${isSaveAnimationMode ? "text-purple-300" : "text-white"} uppercase mb-2 flex items-center gap-2`}>
              <span>{isSaveAnimationMode ? "🎬" : "📖"}</span>
              <span>{isSaveAnimationMode ? "ENREGISTRER CETTE ANIMATION" : "SAUVEGARDER CE SCHÉMA"}</span>
            </h3>
            <p className="text-[10px] text-[#62728f] mb-4">
              {isSaveAnimationMode
                ? "Enregistrez les séquences de mouvements de vos joueurs dans la liste de schémas d'équipe."
                : "Enregistrez l'emplacement des jetons et vos dessins dans votre bibliothèque de jeu de référence."}
            </p>

            {saveSuccess ? (
              <div className="p-4 bg-[#102420] border border-[#00e599]/20 rounded-xl flex items-center gap-2 text-xs text-[#00E599]">
                <CheckCircle className="h-4 w-4" />
                <span>{isSaveAnimationMode ? "Animation enregistrée avec succès !" : "Schéma tactique sauvegardé avec succès !"}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-[#62728f] font-black uppercase mb-1">Nom du Schéma</label>
                  <input
                    type="text"
                    value={tacticName}
                    onChange={(e) => setTacticName(e.target.value)}
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#62728f] font-black uppercase mb-1 flex items-center justify-between">
                    <span>Match Associé au Schéma</span>
                    <span className="text-[9px] text-[#00E599] font-bold">
                      🎯 Rattaché au match
                    </span>
                  </label>
                  {matchesList && matchesList.length > 1 ? (
                    <select
                      value={saveTacticMatchId || activeMatchId}
                      onChange={(e) => setSaveTacticMatchId(e.target.value)}
                      className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599]"
                    >
                      {matchesList.map((m) => (
                        <option key={m.id} value={m.id}>
                          ⚽ {m.homeTeam} vs {m.awayTeam} ({m.competition || "Match"} - {m.dateTime || ""})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2.5 text-xs text-white flex items-center justify-between">
                      <span className="font-bold flex items-center gap-2">
                        <span>⚽</span>
                        <span>{activeMatch ? `${activeMatch.homeTeam} vs ${activeMatch.awayTeam}` : "Match en cours"}</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-black">
                        {activeMatch?.competition || "Match"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-[#62728f] font-black uppercase mb-1">Description (Optionnelle)</label>
                  <textarea
                    value={tacticDesc}
                    onChange={(e) => setTacticDesc(e.target.value)}
                    placeholder="Consignes, objectifs, etc..."
                    className="w-full h-24 bg-[#090d14] border border-[#1f293d] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#00E599] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsSaveModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveTacticState}
                    className="px-5 py-2 bg-[#00E599] text-[#0d1117] font-black rounded-lg text-xs transition hover:bg-[#06b87d]"
                  >
                    Confirmer l&apos;enregistrement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MULTI-TEAM MANAGER MODAL (PRO MODE) */}
      {isMultiTeamModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className={`max-w-xl w-full rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-[#1f293d] pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                  <span>🛡️</span> GESTION MULTI-ÉQUIPES & SCHÉMAS TACTIQUES
                  <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                    FONCTION PRO
                  </span>
                </h3>
                <p className="text-[10px] text-[#62728f] mt-0.5">
                  Gérez les schémas tactiques de vos différentes équipes ({displayClubTitle}) et basculez en un clic.
                </p>
              </div>
              <button
                onClick={() => setIsMultiTeamModalOpen(false)}
                className="p-1.5 bg-[#162032] hover:bg-[#22304a] text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TEAM CARDS LIST */}
            <div className="space-y-3 mb-6">
              <label className="block text-[10px] text-slate-400 font-black uppercase tracking-wider">
                Équipes Enregistrées ({teams.length}) :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teams.map((team) => {
                  const isActive = activeTeamId === team.id;
                  const tacticCount = savedTactics.filter(
                    (s) => s.teamId === team.id || (!s.teamId && team.isDefault)
                  ).length;

                  return (
                    <div
                      key={team.id}
                      onClick={() => handleSelectTeam(team.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? "bg-gradient-to-br from-[#11241f] to-[#0a1815] border-[#00E599] text-white shadow-lg shadow-[#00E599]/10"
                          : "bg-[#090d14] border-[#1f293d] hover:border-slate-600 text-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🛡️</span>
                          <div>
                            <p className="text-xs font-black truncate max-w-[140px]">{team.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase">{team.category}</p>
                          </div>
                        </div>
                        {isActive ? (
                          <span className="text-[9px] bg-[#00E599] text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                            ACTIVE
                          </span>
                        ) : (
                          !team.isDefault && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(team.id);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 transition"
                              title="Supprimer cette équipe"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#1a2333] flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-bold">📖 {tacticCount} Schéma(s)</span>
                        <span className={isActive ? "text-[#00E599] font-black" : "text-amber-400 font-bold"}>
                          {isActive ? "Sélectionnée" : "Basculez ➔"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CREATE NEW TEAM FORM */}
            <form onSubmit={handleCreateNewTeam} className="bg-[#121926] border border-[#1f293d] rounded-xl p-4 space-y-3">
              <label className="block text-[10px] text-amber-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#00E599]" />
                <span>Créer une nouvelle équipe (Séniors, U19, Féminines...)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Ex: U17 National, Séniors C, Équipe 1..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599]"
                />

                <select
                  value={newTeamCategory}
                  onChange={(e) => setNewTeamCategory(e.target.value)}
                  className="bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#00E599]"
                >
                  <option value="Séniors">Séniors</option>
                  <option value="Jeunes / U19">Jeunes / U19 / U17</option>
                  <option value="Féminines">Équipe Féminine</option>
                  <option value="Formation">École de Foot / Formation</option>
                  <option value="Loisirs">Loisirs / Vétérans</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 text-slate-950 font-black text-xs uppercase rounded-lg hover:brightness-110 transition cursor-pointer shadow-md"
              >
                + Ajouter l&apos;équipe au club
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-TEAM PRO UPGRADE PROMPT MODAL */}
      {isMultiTeamUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-amber-500/50 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-amber-400/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0 text-amber-300 shadow-lg">
                🔒
              </div>
              <div>
                <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit mb-1">
                  <Award className="w-3 h-3" /> EXCLUSIVITÉ ABONNÉS PRO & CLUB ÉLITE
                </span>
                <h3 className="text-base font-black text-white uppercase leading-snug">
                  Gestion Multi-Équipes des Schémas Tactiques
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  En formule <strong className="text-white">Gratuite</strong>, votre compte est limité à la gestion des schémas tactiques pour <strong className="text-amber-300">1 seule équipe</strong>.
                </p>
              </div>
            </div>

            <div className="bg-[#121926] border border-[#1f293d] rounded-xl p-4 my-4 space-y-2.5 relative z-10 text-xs text-slate-300">
              <p className="font-bold text-amber-300 uppercase text-[11px] tracking-wider border-b border-[#1f293d] pb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Fonctionnalités Multi-Équipes Débloquées en PRO :</span>
              </p>
              <ul className="space-y-2 text-[11px]">
                <li className="flex items-center gap-2">
                  <span className="text-[#00E599] font-black">✓</span>
                  <span><strong>Création d&apos;Équipes Illimités</strong> : Séniors A, Séniors B, U19, U17, Féminines...</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00E599] font-black">✓</span>
                  <span><strong>Classement des Schémas</strong> : Associez chaque schéma tactique à son équipe propre.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00E599] font-black">✓</span>
                  <span><strong>Bascule Instantanée</strong> : Changez d&apos;équipe sur le tableau tactique en 1 clic.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00E599] font-black">✓</span>
                  <span><strong>Partage avec Adjoints</strong> : Exportez les consignes tactiques personnalisées par équipe.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 relative z-10">
              <button
                onClick={() => {
                  setIsMultiTeamUpgradeModalOpen(false);
                  if (onOpenTrialModal) onOpenTrialModal();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Débloquer l&apos;Accès PRO (Essai 14j Offert)</span>
              </button>
              <button
                onClick={() => setIsMultiTeamUpgradeModalOpen(false)}
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE MATCH PRO+ UPGRADE PROMPT MODAL */}
      {isLiveMatchUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-amber-500/60 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/30 via-amber-500/20 to-amber-400/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0 text-amber-300 shadow-lg">
                🔴
              </div>
              <div>
                <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit mb-1">
                  <Sparkles className="w-3 h-3" /> EXCLUSIVITÉ FORMULE PRO+ (14,90 €)
                </span>
                <h3 className="text-base font-black text-white uppercase leading-snug">
                  Mode Live Match & Chronomètre Officiel
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Le suivi de match en direct est réservé à la formule <strong className="text-amber-300">PRO+</strong>.
                </p>
              </div>
            </div>

            <div className="bg-[#121926] border border-[#1f293d] rounded-xl p-4 my-4 space-y-2.5 relative z-10 text-xs text-slate-300">
              <p className="font-bold text-amber-300 uppercase text-[11px] tracking-wider border-b border-[#1f293d] pb-1.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Fonctionnalités Live Match Débloquées en PRO+ :</span>
              </p>
              <ul className="space-y-2 text-[11px]">
                <li className="flex items-center gap-2">
                  <span className="text-[#00E599] font-black">✓</span>
                  <span><strong>Chronomètre & Périodes de Match</strong> : Suivi 1ère/2ème mi-temps et temps additionnel.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00E599] font-black">✓</span>
                  <span><strong>Saisie Instantanée des Buts & Passes</strong> : Enregistrez les buteurs ⚽ et passeurs 👟 en direct.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00E599] font-black">✓</span>
                  <span><strong>Cartons & Blessures</strong> : Distribution des cartons 🟨🟥 et gestion des sorties sur blessure.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00E599] font-black">✓</span>
                  <span><strong>Remplacements Tactiques</strong> : Entrées/sorties directes sur le tableau avec mise à jour du 11.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 relative z-10">
              <button
                onClick={() => {
                  setIsLiveMatchUpgradeModalOpen(false);
                  if (onOpenTrialModal) onOpenTrialModal();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-rose-400 text-slate-950 font-black text-xs uppercase rounded-xl hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Passer à la Formule PRO+ (14,90 €/m)</span>
              </button>
              <button
                onClick={() => setIsLiveMatchUpgradeModalOpen(false)}
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. OPPONENT ROSTER CUSTOMIZATION MODAL (PRO MODE) */}
      {/* ========================================================= */}
      {isOpponentRosterModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className={`max-w-lg w-full rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  MODE PRO
                </span>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-rose-400" /> PERSONNALISER L&apos;ÉQUIPE ADVERSE
                </h3>
              </div>
              <button
                onClick={() => setIsOpponentRosterModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1 hover:bg-[#1a2333] rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-[#62728f] mb-4">
              Nommez et numérotez les joueurs adverses selon votre analyse tactique et votre préparation de match.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin mb-4">
              {currentTokens.filter((t) => t.type === "player_b").length === 0 ? (
                <div className="text-center p-6 border border-dashed border-[#1f293d] rounded-xl">
                  <p className="text-xs text-slate-400 mb-3 font-semibold">Aucun joueur adverse actuellement sur le terrain.</p>
                  <button
                    onClick={handleAddOpponent}
                    className="px-3 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    + Placer l&apos;équipe adverse
                  </button>
                </div>
              ) : (
                currentTokens
                  .filter((t) => t.type === "player_b")
                  .map((token, index) => (
                    <div
                      key={token.id}
                      className="flex items-center gap-2 bg-[#090d14] border border-[#1f293d] p-2.5 rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-500 text-rose-200 text-xs font-black flex items-center justify-center shrink-0">
                        {token.number || index + 1}
                      </div>

                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={token.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setKeyframes((prev) => {
                              const copy = [...prev];
                              const activeFrame = copy[currentFrameIdx] || [];
                              copy[currentFrameIdx] = activeFrame.map((t) =>
                                t.id === token.id ? { ...t, name: newName } : t
                              );
                              return copy;
                            });
                          }}
                          placeholder="Nom du joueur"
                          className="col-span-2 bg-[#0d1117] border border-[#1f293d] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-500 font-bold"
                        />

                        <select
                          value={token.number || index + 1}
                          onChange={(e) => {
                            const newNum = Number(e.target.value);
                            setKeyframes((prev) => {
                              const copy = [...prev];
                              const activeFrame = copy[currentFrameIdx] || [];
                              copy[currentFrameIdx] = activeFrame.map((t) =>
                                t.id === token.id ? { ...t, number: newNum } : t
                              );
                              return copy;
                            });
                          }}
                          className="bg-[#0d1117] border border-[#1f293d] rounded px-2 py-1 text-xs text-rose-300 focus:outline-none focus:border-rose-500 text-center font-bold cursor-pointer"
                          title="Numéro unique (seuls les numéros disponibles sont proposés)"
                        >
                          {getAvailableNumbersForOpponent(token.id, token.number).map((n) => (
                            <option key={n} value={n} className="bg-[#0d1117] text-white">
                              N° {n}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setKeyframes((prev) => {
                            const copy = [...prev];
                            const activeFrame = copy[currentFrameIdx] || [];
                            copy[currentFrameIdx] = activeFrame.filter((t) => t.id !== token.id);
                            return copy;
                          });
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Retirer ce joueur adverse"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#1f293d] pt-3">
              <button
                onClick={handleAddOpponent}
                className="px-3 py-1.5 bg-[#172233] hover:bg-[#1f2f47] text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter un joueur
              </button>

              <button
                onClick={() => setIsOpponentRosterModalOpen(false)}
                className="px-4 py-2 bg-[#00E599] text-[#0d1117] font-black text-xs rounded-xl shadow-lg hover:bg-[#06b87d] transition cursor-pointer"
              >
                Valider les noms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. SINGLE TOKEN QUICK EDIT & SUBSTITUTION (NOW INLINE BELOW PITCH) */}
      {/* ========================================================= */}

      {/* ========================================================= */}
      {/* MODAL : GESTION DE L'EFFECTIF (NOMS, N°, POSTES) & RÔLES / COUPS DE PIED ARRÊTÉS */}
      {/* ========================================================= */}
      {isSetPiecesOpen && (() => {
        const isAway = rolesTargetTeam === "away";
        const starters = currentTokens.filter((t) => isAway ? t.type === "player_b" : t.type === "player_a");
        const activeSubs = isAway ? opponentSubstitutes : substitutes;
        const currentRoles = isAway ? opponentSetPieceRoles : setPieceRoles;
        const availablePositions = getSportCommonPositions(activeSport);

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
        const assignedRolesCount = Object.values(currentRoles).filter(Boolean).length;
        const teamDisplayName = isAway
          ? (activeMatch.awayTeam || "Équipe B (Adverse)")
          : (activeMatch.homeTeam || "Mon Club");

        return (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-[150] animate-fade-in backdrop-blur-sm overflow-y-auto">
            <div className={`max-w-4xl w-full rounded-2xl shadow-2xl relative my-6 flex flex-col max-h-[92vh] overflow-hidden border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>
              
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-[#1f293d] bg-gradient-to-r from-[#0d1117] via-[#121926] to-[#0d1117] shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shadow-inner ${
                      isAway
                        ? "bg-gradient-to-br from-rose-500/20 to-red-600/30 border-rose-500/40 text-rose-400"
                        : "bg-gradient-to-br from-[#00E599]/20 to-emerald-600/30 border-[#00E599]/40 text-[#00E599]"
                    }`}>
                      👥
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span>EFFECTIF & RÔLES TACTIQUES</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black border ${
                          isAway
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : "bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30"
                        }`}>
                          {teamDisplayName} • {activeSport.toUpperCase()}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Modifiez en direct les noms, numéros de maillot, postes et rôles de coup de pied arrêtés pour {isAway ? "l'équipe adverse" : "votre club"}.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsSetPiecesOpen(false)}
                    className="text-slate-400 hover:text-white font-bold p-2 hover:bg-[#1a2333] rounded-xl cursor-pointer transition"
                    title="Fermer"
                  >
                    ✕
                  </button>
                </div>

                {/* Main Navigation Tabs */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1f293d]/80">
                  <button
                    onClick={() => setTeamRolesModalTab("players")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                      teamRolesModalTab === "players"
                        ? isAway
                          ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                          : "bg-[#00E599] text-slate-950 shadow-md shadow-[#00e599]/20"
                        : "bg-[#121926] text-slate-300 hover:text-white hover:bg-[#182234] border border-[#1f293d]"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Effectif & Joueurs (Noms, N°, Postes)</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      teamRolesModalTab === "players" 
                        ? isAway ? "bg-black/20 text-white" : "bg-slate-950/20 text-slate-950" 
                        : isAway ? "bg-[#1f293d] text-rose-400" : "bg-[#1f293d] text-[#00E599]"
                    }`}>
                      {starters.length + activeSubs.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTeamRolesModalTab("setpieces")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                      teamRolesModalTab === "setpieces"
                        ? isAway
                          ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                          : "bg-[#00E599] text-slate-950 shadow-md shadow-[#00e599]/20"
                        : "bg-[#121926] text-slate-300 hover:text-white hover:bg-[#182234] border border-[#1f293d]"
                    }`}
                  >
                    <span>🎯</span>
                    <span>Rôles & Coups de pied arrêtés</span>
                    {assignedRolesCount > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                        teamRolesModalTab === "setpieces" 
                          ? isAway ? "bg-black/20 text-white" : "bg-slate-950/20 text-slate-950" 
                          : isAway ? "bg-[#1f293d] text-rose-400" : "bg-[#1f293d] text-[#00E599]"
                      }`}>
                        {assignedRolesCount}/7
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 scrollbar-thin">

                {/* ================= TAB 1: EFFECTIF & JOUEURS (NOMS, NUMEROS, POSTES) ================= */}
                {teamRolesModalTab === "players" && (
                  <div className="space-y-4">
                    {/* Filter / Search Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#090d14] p-3 rounded-xl border border-[#1f293d]">
                      {/* Search box */}
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={rosterSearchQuery}
                          onChange={(e) => setRosterSearchQuery(e.target.value)}
                          placeholder="Rechercher par nom, numéro ou poste..."
                          className="w-full bg-[#121926] border border-[#1f293d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E599] transition"
                        />
                        {rosterSearchQuery && (
                          <button
                            onClick={() => setRosterSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1.5 bg-[#121926] p-1 rounded-lg border border-[#1f293d]">
                        <button
                          onClick={() => setRosterFilter("all")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                            rosterFilter === "all"
                              ? isAway ? "bg-rose-500 text-white font-black" : "bg-[#00E599] text-slate-950 font-black"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Tous ({starters.length + activeSubs.length})
                        </button>
                        <button
                          onClick={() => setRosterFilter("starters")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                            rosterFilter === "starters"
                              ? isAway ? "bg-rose-500 text-white font-black" : "bg-[#00E599] text-slate-950 font-black"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          🟢 Titulaires ({starters.length})
                        </button>
                        <button
                          onClick={() => setRosterFilter("subs")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                            rosterFilter === "subs"
                              ? isAway ? "bg-rose-500 text-white font-black" : "bg-[#00E599] text-slate-950 font-black"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          🔄 Banc ({activeSubs.length})
                        </button>
                      </div>

                      {/* Unique Auto-Renumber, Inter-Team Swap and Add Player Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenInterTeamSwap(undefined, undefined, rolesTargetTeam)}
                          className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-cyan-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Échanger un joueur avec celui d'une autre équipe de votre club"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Échanger équipe</span>
                          <span className="text-[9px] bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 px-1 rounded font-black">
                            {teams.length}
                          </span>
                        </button>

                        <button
                          onClick={() => handleAutoRenumberSquad(rolesTargetTeam)}
                          className="px-2.5 py-1.5 bg-[#121926] hover:bg-[#1a2333] border border-[#1f293d] hover:border-[#00E599]/40 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                          title="Renuméroter automatiquement de 1 à N sans doublon"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Numéros 1-N</span>
                        </button>

                        <button
                          onClick={() => handleAddNewSubstitute(rolesTargetTeam)}
                          className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                            isAway
                              ? "bg-gradient-to-r from-rose-500/20 to-red-600/20 hover:from-rose-500/30 hover:to-red-600/30 border-rose-500/40 text-rose-300"
                              : "bg-gradient-to-r from-[#00E599]/20 to-emerald-600/20 hover:from-[#00E599]/30 hover:to-emerald-600/30 border-[#00E599]/40 text-[#00E599]"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Position Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#090d14]/80 p-2.5 rounded-xl border border-[#1f293d]/80 text-[10px]">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="text-slate-400 font-extrabold flex items-center gap-1 shrink-0">
                          <Filter className="w-3 h-3 text-amber-400" />
                          <span>⚡ Filtrer par Poste ({activeSport.toUpperCase()}) :</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            onClick={() => setRosterPositionFilter("ALL")}
                            className={`px-2 py-1 rounded-md text-[9.5px] font-black transition cursor-pointer flex items-center gap-1 border ${
                              rosterPositionFilter === "ALL"
                                ? isAway
                                  ? "bg-rose-500 text-white border-rose-400 shadow-md"
                                  : "bg-[#00E599] text-slate-950 border-[#00E599] shadow-md shadow-[#00e599]/20"
                                : "bg-[#121926] text-slate-300 border-[#1f293d] hover:border-slate-500 hover:text-white"
                            }`}
                          >
                            <span>TOUS</span>
                            <span className={`text-[8.5px] px-1 rounded-full font-bold ${
                              rosterPositionFilter === "ALL"
                                ? "bg-black/30 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {starters.length + activeSubs.length}
                            </span>
                          </button>

                          {availablePositions.map((pos) => {
                            const isSelected = rosterPositionFilter.toUpperCase() === pos.toUpperCase();
                            const countInRoster = [...starters, ...activeSubs].filter((p) => {
                              const playerRole = (p.role || "").toUpperCase().trim();
                              const filterPos = pos.toUpperCase().trim();
                              if (filterPos === "SUB") {
                                return playerRole.includes("SUB") || playerRole.includes("REMP") || playerRole.includes("BANC");
                              }
                              return playerRole === filterPos;
                            }).length;

                            return (
                              <button
                                key={pos}
                                onClick={() => setRosterPositionFilter(isSelected ? "ALL" : pos)}
                                className={`px-2 py-1 rounded-md text-[9.5px] font-black transition cursor-pointer flex items-center gap-1 border ${
                                  isSelected
                                    ? isAway
                                      ? "bg-rose-500 text-white border-rose-400 shadow-md ring-2 ring-rose-400/40"
                                      : "bg-[#00E599] text-slate-950 border-[#00E599] shadow-md ring-2 ring-[#00e599]/40 shadow-[#00e599]/30"
                                    : countInRoster > 0
                                    ? "bg-[#121926] text-slate-200 border-[#1f293d] hover:border-[#00E599]/50 hover:text-white"
                                    : "bg-[#0e1420]/60 text-slate-500 border-[#1f293d]/50 hover:text-slate-300"
                                }`}
                                title={`Filtrer les joueurs au poste ${pos} (${countInRoster} trouvé${countInRoster > 1 ? "s" : ""})`}
                              >
                                <span>{pos}</span>
                                {countInRoster > 0 && (
                                  <span
                                    className={`text-[8px] px-1 rounded-full font-bold ${
                                      isSelected
                                        ? "bg-black/30 text-white"
                                        : "bg-slate-800 text-[#00E599]"
                                    }`}
                                  >
                                    {countInRoster}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {rosterPositionFilter !== "ALL" && (
                        <button
                          onClick={() => setRosterPositionFilter("ALL")}
                          className="text-xs text-amber-300 hover:text-amber-200 font-black flex items-center gap-1 cursor-pointer bg-amber-950/60 border border-amber-700/60 px-2.5 py-1 rounded-lg transition shadow-sm shrink-0"
                          title="Effacer le filtre de poste actuel"
                        >
                          <span>Filtre : {rosterPositionFilter}</span>
                          <span className="bg-amber-800/80 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✕</span>
                        </button>
                      )}
                    </div>

                    {/* 1. SECTION TITULAIRES */}
                    {(rosterFilter === "all" || rosterFilter === "starters") && (
                      <div className="space-y-2.5">
                        <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${
                          isAway
                            ? "bg-rose-950/60 border-rose-500/30"
                            : "bg-[#102420]/60 border-[#00e599]/30"
                        }`}>
                          <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            isAway ? "text-rose-300" : "text-[#00E599]"
                          }`}>
                            <span className={`w-2 h-2 rounded-full animate-pulse ${isAway ? "bg-rose-400" : "bg-[#00E599]"}`} />
                            <span>Titulaires sur le terrain ({filteredStarters.length})</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Modifications reportées instantanément sur la planche tactique
                          </span>
                        </div>

                        {filteredStarters.length === 0 ? (
                          <div className="p-4 text-center bg-[#090d14] rounded-xl border border-[#1f293d] text-xs text-slate-400">
                            Aucun titulaire ne correspond à votre recherche.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {filteredStarters.map((player) => {
                              const isCaptain = currentRoles.captain === player.name;
                              return (
                                <div
                                  key={player.id}
                                  className={`bg-[#090d14] hover:bg-[#0d1422] p-3 rounded-xl border border-[#1f293d] transition-all duration-150 space-y-2.5 shadow-sm ${
                                    isAway ? "hover:border-rose-500/40" : "hover:border-[#00E599]/40"
                                  }`}
                                >
                                  {/* Top Row: Photo Avatar + Number + Name + Starter Swap */}
                                  <div className="flex items-center gap-2.5">
                                    {/* Player Photo Avatar with Upload / Delete */}
                                    <div className="relative group w-11 h-11 rounded-xl bg-[#121926] border border-[#1f293d] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                      {player.photo ? (
                                        <>
                                          <img
                                            src={player.photo}
                                            alt={player.name}
                                            className="w-full h-full object-cover"
                                          />
                                          <button
                                            onClick={() => handleRemovePlayerPhoto(player.id, true)}
                                            className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                                            title="Supprimer la photo"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <div className={`w-full h-full flex flex-col items-center justify-center text-slate-400 transition ${
                                          isAway ? "group-hover:text-rose-300" : "group-hover:text-[#00E599]"
                                        }`}>
                                          <User className="w-5 h-5 opacity-70" />
                                        </div>
                                      )}

                                      {/* Photo Upload Overlay Button */}
                                      <label
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white"
                                        title="Ajouter ou changer la photo"
                                      >
                                        <Camera className={`w-4 h-4 ${isAway ? "text-rose-400" : "text-[#00E599]"}`} />
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                              handlePlayerPhotoUpload(player.id, true, e.target.files[0]);
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>

                                    {/* Unique Number Select */}
                                    <div className="relative flex items-center">
                                      <select
                                        value={player.number ?? ""}
                                        onChange={(e) =>
                                          handleAssignUniqueNumber(
                                            player.id,
                                            true,
                                            Number(e.target.value)
                                          )
                                        }
                                        className={`w-14 h-9 text-center font-black text-xs rounded-lg focus:outline-none transition cursor-pointer px-1 text-center ${
                                          isAway
                                            ? "bg-rose-500/15 border border-rose-500/50 text-rose-300 focus:border-rose-400 focus:bg-rose-500/25"
                                            : "bg-[#00E599]/15 border border-[#00E599]/50 text-[#00E599] focus:border-[#00E599] focus:bg-[#00E599]/25"
                                        }`}
                                        title="Numéro unique (seuls les numéros disponibles sont proposés)"
                                      >
                                        {getAvailableNumbersForPlayer(player.id, player.number, rolesTargetTeam).map((n) => (
                                          <option key={n} value={n} className={`bg-[#0d1117] font-bold ${isAway ? "text-rose-300" : "text-[#00E599]"}`}>
                                            N° {n}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Name Input */}
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={player.name || ""}
                                        onChange={(e) =>
                                          handleUpdatePitchPlayer(player.id, "name", e.target.value)
                                        }
                                        placeholder="Nom du titulaire"
                                        className={`w-full bg-[#121926] border border-[#1f293d] hover:border-[#354563] rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none transition ${
                                          isAway ? "focus:border-rose-500" : "focus:border-[#00E599]"
                                        }`}
                                      />
                                    </div>

                                    {/* Inter-Team Swap Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenInterTeamSwap(player, true, rolesTargetTeam)}
                                      className="px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0"
                                      title="Échanger ce titulaire avec un joueur d'une autre équipe de votre club"
                                    >
                                      <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                                      <span>Échanger</span>
                                    </button>

                                    {/* Starter / Bench Swap Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStarterSubstitute(player.id, "starter", rolesTargetTeam)}
                                      className="px-2 py-1 bg-amber-950/60 hover:bg-amber-950/90 border border-amber-500/40 hover:border-amber-500/70 text-amber-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0"
                                      title="Cliquez pour envoyer ce joueur sur le banc (Remplaçant)"
                                    >
                                      <ArrowLeftRight className="w-3 h-3" />
                                      <span>Banc</span>
                                    </button>
                                  </div>

                                  {/* Middle Row: Availability Status & Captain indicator */}
                                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1f293d]/60 text-[10px]">
                                    {/* Availability Status Selector */}
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <span className="text-slate-400 font-bold text-[9.5px] shrink-0">
                                        État :
                                      </span>
                                      <select
                                        value={player.status || "normal"}
                                        onChange={(e) =>
                                          handleUpdatePitchPlayer(
                                            player.id,
                                            "status",
                                            e.target.value
                                          )
                                        }
                                        className={`text-[9.5px] rounded-lg px-2 py-1 font-bold border focus:outline-none cursor-pointer flex-1 ${
                                          player.status === "excellent"
                                            ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300"
                                            : player.status === "tired"
                                            ? "bg-amber-950/70 border-amber-500/50 text-amber-300"
                                            : player.status === "injured"
                                            ? "bg-rose-950/70 border-rose-500/50 text-rose-300"
                                            : player.status === "suspended"
                                            ? "bg-red-950/80 border-red-600/60 text-red-300 font-black"
                                            : "bg-[#121926] border-[#1f293d] text-slate-300"
                                        }`}
                                      >
                                        <option value="normal">🟢 Disponible / Normal</option>
                                        <option value="excellent">⚡ En forme</option>
                                        <option value="tired">🥱 Fatigué</option>
                                        <option value="injured">🩹 Blessé</option>
                                        <option value="suspended">🟥 Suspendu</option>
                                      </select>
                                    </div>

                                    {/* Captain Tag */}
                                    {isCaptain && (
                                      <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded font-black uppercase shrink-0 flex items-center gap-1">
                                        👑 CAPITAINE
                                      </span>
                                    )}
                                  </div>

                                  {/* Position / Role Field + Quick Position Badges */}
                                  <div className="flex items-center gap-1.5 pt-1 border-t border-[#1f293d]/50">
                                    <span className="text-[9.5px] text-slate-400 font-bold uppercase shrink-0">
                                      Poste :
                                    </span>
                                    <input
                                      type="text"
                                      value={player.role || ""}
                                      onChange={(e) =>
                                        handleUpdatePitchPlayer(player.id, "role", e.target.value)
                                      }
                                      placeholder="Ex: BU, MC, DC..."
                                      className={`w-20 bg-[#121926] border border-[#1f293d] hover:border-[#354563] rounded px-2 py-0.5 text-[11px] font-black text-center focus:outline-none uppercase ${
                                        isAway ? "text-rose-300 focus:border-rose-500" : "text-[#00E599] focus:border-[#00E599]"
                                      }`}
                                    />
                                    {/* Quick clickable position suggestions */}
                                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 flex-1">
                                      {availablePositions.slice(0, 5).map((pos) => (
                                        <button
                                          key={pos}
                                          type="button"
                                          onClick={() => handleUpdatePitchPlayer(player.id, "role", pos)}
                                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold cursor-pointer transition ${
                                            player.role === pos
                                              ? isAway ? "bg-rose-500 text-white font-black" : "bg-[#00E599] text-slate-950 font-black"
                                              : "bg-[#162032] text-slate-400 hover:text-white hover:bg-[#1f2d47]"
                                          }`}
                                        >
                                          {pos}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. SECTION REMPLAÇANTS */}
                    {(rosterFilter === "all" || rosterFilter === "subs") && (
                      <div className="space-y-2.5 pt-2">
                        <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${
                          isAway
                            ? "bg-rose-950/40 border-rose-500/30"
                            : "bg-[#151f30] border-[#1f293d]"
                        }`}>
                          <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            isAway ? "text-rose-300" : "text-amber-300"
                          }`}>
                            <span>🔄</span>
                            <span>Remplaçants & Banc de touche ({filteredSubs.length})</span>
                          </span>
                          <button
                            onClick={() => handleAddNewSubstitute(rolesTargetTeam)}
                            className={`text-[10px] hover:underline font-bold flex items-center gap-1 cursor-pointer ${
                              isAway ? "text-rose-300" : "text-[#00E599]"
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Ajouter</span>
                          </button>
                        </div>

                        {filteredSubs.length === 0 ? (
                          <div className="p-4 text-center bg-[#090d14] rounded-xl border border-[#1f293d] text-xs text-slate-400">
                            Aucun remplaçant ne correspond à votre recherche.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {filteredSubs.map((sub) => (
                              <div
                                key={sub.id}
                                className={`bg-[#090d14] hover:bg-[#0d1422] p-3 rounded-xl border border-[#1f293d] transition-all duration-150 space-y-2.5 shadow-sm ${
                                  isAway ? "hover:border-rose-400/40" : "hover:border-amber-400/40"
                                }`}
                              >
                                {/* Top Row: Photo Avatar + Number + Name + Starter Promote + Delete */}
                                <div className="flex items-center gap-2.5">
                                  {/* Sub Photo Avatar with Upload / Delete */}
                                  <div className="relative group w-11 h-11 rounded-xl bg-[#121926] border border-[#1f293d] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                    {sub.photo ? (
                                      <>
                                        <img
                                          src={sub.photo}
                                          alt={sub.name}
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          onClick={() => handleRemovePlayerPhoto(sub.id, false)}
                                          className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer"
                                          title="Supprimer la photo"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <div className={`w-full h-full flex flex-col items-center justify-center text-slate-400 transition ${
                                        isAway ? "group-hover:text-rose-300" : "group-hover:text-amber-300"
                                      }`}>
                                        <User className="w-5 h-5 opacity-70" />
                                      </div>
                                    )}

                                    {/* Photo Upload Overlay Button */}
                                    <label
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white"
                                      title="Ajouter ou changer la photo"
                                    >
                                      <Camera className={`w-4 h-4 ${isAway ? "text-rose-400" : "text-amber-400"}`} />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            handlePlayerPhotoUpload(sub.id, false, e.target.files[0]);
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>

                                  {/* Number Select with only available numbers */}
                                  <div className="relative flex items-center">
                                    <select
                                      value={sub.number ?? ""}
                                      onChange={(e) =>
                                        handleAssignUniqueNumber(
                                          sub.id,
                                          false,
                                          Number(e.target.value)
                                        )
                                      }
                                      className={`w-14 h-9 text-center font-black text-xs rounded-lg focus:outline-none transition cursor-pointer px-1 text-center ${
                                        isAway
                                          ? "bg-rose-500/15 border border-rose-500/40 text-rose-300 focus:border-rose-400 focus:bg-rose-500/25"
                                          : "bg-amber-500/15 border border-amber-500/40 text-amber-300 focus:border-amber-400 focus:bg-amber-500/25"
                                      }`}
                                      title="Numéro unique (seuls les numéros disponibles sont proposés)"
                                    >
                                      {getAvailableNumbersForPlayer(sub.id, sub.number, rolesTargetTeam).map((n) => (
                                        <option key={n} value={n} className={`bg-[#0d1117] font-bold ${isAway ? "text-rose-300" : "text-amber-300"}`}>
                                          N° {n}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Name Input */}
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={sub.name || ""}
                                      onChange={(e) =>
                                        handleUpdateSubstitute(sub.id, "name", e.target.value)
                                      }
                                      placeholder="Nom du remplaçant"
                                      className={`w-full bg-[#121926] border border-[#1f293d] hover:border-[#354563] rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none transition ${
                                        isAway ? "focus:border-rose-400" : "focus:border-amber-400"
                                      }`}
                                    />
                                  </div>

                                  {/* Inter-Team Swap Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInterTeamSwap(sub, false, rolesTargetTeam)}
                                    className="px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0"
                                    title="Échanger ce remplaçant avec un joueur d'une autre équipe de votre club"
                                  >
                                    <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                                    <span>Échanger</span>
                                  </button>

                                  {/* Starter / Bench Promote Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStarterSubstitute(sub.id, "substitute", rolesTargetTeam)}
                                    className={`px-2 py-1 border rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0 ${
                                      isAway
                                        ? "bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/50 text-rose-300"
                                        : "bg-[#00E599]/20 hover:bg-[#00E599]/30 border-[#00E599]/50 text-[#00E599]"
                                    }`}
                                    title="Cliquez pour titulariser ce joueur sur le terrain (Titulaire)"
                                  >
                                    <ArrowLeftRight className="w-3 h-3" />
                                    <span>Titulariser</span>
                                  </button>

                                  {/* Delete Substitute Button */}
                                  <button
                                    onClick={() => handleDeleteSubstitute(sub.id, rolesTargetTeam)}
                                    className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-950/40 rounded-lg transition cursor-pointer shrink-0"
                                    title="Supprimer ce joueur de l'effectif"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Middle Row: Availability Status Selector */}
                                <div className="flex items-center gap-1.5 pt-1 border-t border-[#1f293d]/60 text-[10px]">
                                  <span className="text-slate-400 font-bold text-[9.5px] shrink-0">
                                    État :
                                  </span>
                                  <select
                                    value={sub.status || "normal"}
                                    onChange={(e) =>
                                      handleUpdateSubstitute(sub.id, "status", e.target.value)
                                    }
                                    className={`text-[9.5px] rounded-lg px-2 py-1 font-bold border focus:outline-none cursor-pointer flex-1 ${
                                      sub.status === "excellent"
                                        ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300"
                                        : sub.status === "tired"
                                        ? "bg-amber-950/70 border-amber-500/50 text-amber-300"
                                        : sub.status === "injured"
                                        ? "bg-rose-950/70 border-rose-500/50 text-rose-300"
                                        : sub.status === "suspended"
                                        ? "bg-red-950/80 border-red-600/60 text-red-300 font-black"
                                        : "bg-[#121926] border-[#1f293d] text-slate-300"
                                    }`}
                                  >
                                    <option value="normal">🟢 Disponible / Normal</option>
                                    <option value="excellent">⚡ En forme</option>
                                    <option value="tired">🥱 Fatigué</option>
                                    <option value="injured">🩹 Blessé</option>
                                    <option value="suspended">🟥 Suspendu</option>
                                  </select>
                                </div>

                                {/* Position / Role Field + Quick suggestions */}
                                <div className="flex items-center gap-1.5 pt-1 border-t border-[#1f293d]/50">
                                  <span className="text-[9.5px] text-slate-400 font-bold uppercase shrink-0">
                                    Poste :
                                  </span>
                                  <input
                                    type="text"
                                    value={sub.role || ""}
                                    onChange={(e) =>
                                      handleUpdateSubstitute(sub.id, "role", e.target.value)
                                    }
                                    placeholder="Ex: SUB, BU..."
                                    className="w-20 bg-[#121926] border border-[#1f293d] hover:border-[#354563] focus:border-[#00E599] rounded px-2 py-0.5 text-[11px] text-amber-300 font-black text-center focus:outline-none uppercase"
                                  />
                                  {/* Quick clickable position suggestions */}
                                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 flex-1">
                                    {availablePositions.slice(0, 5).map((pos) => (
                                      <button
                                        key={pos}
                                        type="button"
                                        onClick={() => handleUpdateSubstitute(sub.id, "role", pos)}
                                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold cursor-pointer transition ${
                                          sub.role === pos
                                            ? "bg-amber-400 text-slate-950 font-black"
                                            : "bg-[#162032] text-slate-400 hover:text-white hover:bg-[#1f2d47]"
                                        }`}
                                      >
                                        {pos}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ================= TAB 2: RÔLES & COUPS DE PIED ARRÊTÉS ================= */}
                {teamRolesModalTab === "setpieces" && (
                  <div className="space-y-4">
                    {/* Auto-Assign and Reset Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#090d14] p-3 rounded-xl border border-[#1f293d]">
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 font-bold">
                        <span>👥 Effectif éligible :</span>
                        <span className={`px-2.5 py-1 rounded-lg border font-black text-xs ${
                          isAway
                            ? "bg-[#121926] text-rose-400 border-rose-500/30"
                            : "bg-[#121926] text-[#00E599] border-[#1f293d]"
                        }`}>
                          {starters.length} Titulaires + {activeSubs.length} Remplaçants
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAutoAssignSetPieces(rolesTargetTeam)}
                          className={`px-3.5 py-1.5 border rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                            isAway
                              ? "bg-gradient-to-r from-rose-500/20 to-red-600/20 hover:from-rose-500/30 hover:to-red-600/30 border-rose-500/40 text-rose-300"
                              : "bg-gradient-to-r from-[#00E599]/20 to-emerald-600/20 hover:from-[#00E599]/30 hover:to-emerald-600/30 border-[#00E599]/40 text-[#00E599]"
                          }`}
                        >
                          <span>⚡ ATTRIBUTION RAPIDE</span>
                        </button>
                        <button
                          onClick={() => {
                            if (isAway) {
                              setOpponentSetPieceRoles(defaultSetPieceRoles);
                            } else {
                              setSetPieceRoles(defaultSetPieceRoles);
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Effacer Tout
                        </button>
                      </div>
                    </div>

                    {/* Roles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      {/* 1. Capitaine */}
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        currentRoles.captain 
                          ? isAway ? "bg-[#1c1218] border-rose-500/50 shadow-sm" : "bg-[#0f1724] border-[#00E599]/40 shadow-sm"
                          : "bg-[#090d14] border-[#1f293d] hover:border-[#354563]"
                      } space-y-2`}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                            <span>👑</span>
                            <span>CAPITAINE D&apos;ÉQUIPE</span>
                          </label>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                            currentRoles.captain
                              ? isAway ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/30"
                              : "bg-[#121926] text-[#62728f] border-[#1f293d]"
                          }`}>
                            BRASSARD
                          </span>
                        </div>
                        <select
                          value={currentRoles.captain}
                          onChange={(e) => updateRole("captain", e.target.value)}
                          className={`w-full bg-[#0d1117] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer hover:border-[#354563] transition ${
                            isAway ? "focus:border-rose-500" : "focus:border-[#00E599]"
                          }`}
                        >
                          <option value="">-- Aucun capitaine attribué --</option>
                          {starters.map(p => (
                            <option key={p.id} value={p.name} className="bg-[#0d1117]">
                              N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                            </option>
                          ))}
                          {activeSubs.map(s => (
                            <option key={s.id} value={s.name} className="bg-[#0d1117]">
                              [SUB] N°{s.number || "?"} - {s.name} ({s.role || "Remplaçant"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Penalty (11m) */}
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        currentRoles.penaltyTaker 
                          ? isAway ? "bg-[#1c1218] border-rose-500/50 shadow-sm" : "bg-[#0f1724] border-[#00E599]/40 shadow-sm"
                          : "bg-[#090d14] border-[#1f293d] hover:border-[#354563]"
                      } space-y-2`}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                            <span>⚽</span>
                            <span>TIREUR DE PENALTY (11M)</span>
                          </label>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                            currentRoles.penaltyTaker
                              ? isAway ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/30"
                              : "bg-[#121926] text-[#62728f] border-[#1f293d]"
                          }`}>
                            SURFACE
                          </span>
                        </div>
                        <select
                          value={currentRoles.penaltyTaker}
                          onChange={(e) => updateRole("penaltyTaker", e.target.value)}
                          className={`w-full bg-[#0d1117] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer hover:border-[#354563] transition ${
                            isAway ? "focus:border-rose-500" : "focus:border-[#00E599]"
                          }`}
                        >
                          <option value="">-- Aucun tireur attribué --</option>
                          {starters.map(p => (
                            <option key={p.id} value={p.name} className="bg-[#0d1117]">
                              N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                            </option>
                          ))}
                          {activeSubs.map(s => (
                            <option key={s.id} value={s.name} className="bg-[#0d1117]">
                              [SUB] N°{s.number || "?"} - {s.name} ({s.role || "Remplaçant"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Coup Franc Direct */}
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        currentRoles.directFreeKick 
                          ? isAway ? "bg-[#1c1218] border-rose-500/50 shadow-sm" : "bg-[#0f1724] border-[#00E599]/40 shadow-sm"
                          : "bg-[#090d14] border-[#1f293d] hover:border-[#354563]"
                      } space-y-2`}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                            <span>⚡</span>
                            <span>COUP FRANC DIRECT</span>
                          </label>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                            currentRoles.directFreeKick
                              ? isAway ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/30"
                              : "bg-[#121926] text-[#62728f] border-[#1f293d]"
                          }`}>
                            TIR AXE
                          </span>
                        </div>
                        <select
                          value={currentRoles.directFreeKick}
                          onChange={(e) => updateRole("directFreeKick", e.target.value)}
                          className={`w-full bg-[#0d1117] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer hover:border-[#354563] transition ${
                            isAway ? "focus:border-rose-500" : "focus:border-[#00E599]"
                          }`}
                        >
                          <option value="">-- Aucun tireur attribué --</option>
                          {starters.map(p => (
                            <option key={p.id} value={p.name} className="bg-[#0d1117]">
                              N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                            </option>
                          ))}
                          {activeSubs.map(s => (
                            <option key={s.id} value={s.name} className="bg-[#0d1117]">
                              [SUB] N°{s.number || "?"} - {s.name} ({s.role || "Remplaçant"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 4. Coup Franc Excentré Gauche */}
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        currentRoles.offCenterFKLeft 
                          ? isAway ? "bg-[#1c1218] border-rose-500/50 shadow-sm" : "bg-[#0f1724] border-[#00E599]/40 shadow-sm"
                          : "bg-[#090d14] border-[#1f293d] hover:border-[#354563]"
                      } space-y-2`}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                            <span>↪️</span>
                            <span>CF EXCENTRÉ GAUCHE</span>
                          </label>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                            currentRoles.offCenterFKLeft
                              ? isAway ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/30"
                              : "bg-[#121926] text-[#62728f] border-[#1f293d]"
                          }`}>
                            CÔTÉ GAUCHE
                          </span>
                        </div>
                        <select
                          value={currentRoles.offCenterFKLeft}
                          onChange={(e) => updateRole("offCenterFKLeft", e.target.value)}
                          className={`w-full bg-[#0d1117] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer hover:border-[#354563] transition ${
                            isAway ? "focus:border-rose-500" : "focus:border-[#00E599]"
                          }`}
                        >
                          <option value="">-- Aucun tireur attribué --</option>
                          {starters.map(p => (
                            <option key={p.id} value={p.name} className="bg-[#0d1117]">
                              N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                            </option>
                          ))}
                          {activeSubs.map(s => (
                            <option key={s.id} value={s.name} className="bg-[#0d1117]">
                              [SUB] N°{s.number || "?"} - {s.name} ({s.role || "Remplaçant"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 5. Coup Franc Excentré Droit */}
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        currentRoles.offCenterFKRight 
                          ? isAway ? "bg-[#1c1218] border-rose-500/50 shadow-sm" : "bg-[#0f1724] border-[#00E599]/40 shadow-sm"
                          : "bg-[#090d14] border-[#1f293d] hover:border-[#354563]"
                      } space-y-2`}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                            <span>↩️</span>
                            <span>CF EXCENTRÉ DROIT</span>
                          </label>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                            currentRoles.offCenterFKRight
                              ? isAway ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/30"
                              : "bg-[#121926] text-[#62728f] border-[#1f293d]"
                          }`}>
                            CÔTÉ DROIT
                          </span>
                        </div>
                        <select
                          value={currentRoles.offCenterFKRight}
                          onChange={(e) => updateRole("offCenterFKRight", e.target.value)}
                          className={`w-full bg-[#0d1117] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer hover:border-[#354563] transition ${
                            isAway ? "focus:border-rose-500" : "focus:border-[#00E599]"
                          }`}
                        >
                          <option value="">-- Aucun tireur attribué --</option>
                          {starters.map(p => (
                            <option key={p.id} value={p.name} className="bg-[#0d1117]">
                              N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                            </option>
                          ))}
                          {activeSubs.map(s => (
                            <option key={s.id} value={s.name} className="bg-[#0d1117]">
                              [SUB] N°{s.number || "?"} - {s.name} ({s.role || "Remplaçant"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 6. Corner Gauche */}
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        currentRoles.cornerLeft 
                          ? isAway ? "bg-[#1c1218] border-rose-500/50 shadow-sm" : "bg-[#0f1724] border-[#00E599]/40 shadow-sm"
                          : "bg-[#090d14] border-[#1f293d] hover:border-[#354563]"
                      } space-y-2`}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                            <span>🚩</span>
                            <span>CORNER GAUCHE</span>
                          </label>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                            currentRoles.cornerLeft
                              ? isAway ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/30"
                              : "bg-[#121926] text-[#62728f] border-[#1f293d]"
                          }`}>
                            FLAG GAUCHE
                          </span>
                        </div>
                        <select
                          value={currentRoles.cornerLeft}
                          onChange={(e) => updateRole("cornerLeft", e.target.value)}
                          className={`w-full bg-[#0d1117] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer hover:border-[#354563] transition ${
                            isAway ? "focus:border-rose-500" : "focus:border-[#00E599]"
                          }`}
                        >
                          <option value="">-- Aucun tireur attribué --</option>
                          {starters.map(p => (
                            <option key={p.id} value={p.name} className="bg-[#0d1117]">
                              N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                            </option>
                          ))}
                          {activeSubs.map(s => (
                            <option key={s.id} value={s.name} className="bg-[#0d1117]">
                              [SUB] N°{s.number || "?"} - {s.name} ({s.role || "Remplaçant"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 7. Corner Droit */}
                      <div className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        currentRoles.cornerRight 
                          ? isAway ? "bg-[#1c1218] border-rose-500/50 shadow-sm" : "bg-[#0f1724] border-[#00E599]/40 shadow-sm"
                          : "bg-[#090d14] border-[#1f293d] hover:border-[#354563]"
                      } space-y-2`}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                            <span>🚩</span>
                            <span>CORNER DROIT</span>
                          </label>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                            currentRoles.cornerRight
                              ? isAway ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/30"
                              : "bg-[#121926] text-[#62728f] border-[#1f293d]"
                          }`}>
                            FLAG DROIT
                          </span>
                        </div>
                        <select
                          value={currentRoles.cornerRight}
                          onChange={(e) => updateRole("cornerRight", e.target.value)}
                          className={`w-full bg-[#0d1117] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer hover:border-[#354563] transition ${
                            isAway ? "focus:border-rose-500" : "focus:border-[#00E599]"
                          }`}
                        >
                          <option value="">-- Aucun tireur attribué --</option>
                          {starters.map(p => (
                            <option key={p.id} value={p.name} className="bg-[#0d1117]">
                              N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                            </option>
                          ))}
                          {activeSubs.map(s => (
                            <option key={s.id} value={s.name} className="bg-[#0d1117]">
                              [SUB] N°{s.number || "?"} - {s.name} ({s.role || "Remplaçant"})
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#1f293d] bg-[#090d14] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <UserCheck className={`w-3.5 h-3.5 ${isAway ? "text-rose-400" : "text-[#00E599]"}`} />
                  <span>
                    {starters.length} titulaires • {activeSubs.length} remplaçants • {assignedRolesCount} rôles assignés
                  </span>
                </div>
                <button
                  onClick={() => setIsSetPiecesOpen(false)}
                  className={`px-5 py-2.5 font-black text-xs uppercase rounded-xl tracking-wider cursor-pointer transition flex items-center gap-1.5 shadow-lg ${
                    isAway
                      ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/20"
                      : "bg-gradient-to-r from-[#00E599] to-[#059669] hover:from-[#05f4a4] hover:to-[#04b07a] text-[#0d1117] shadow-[#00e599]/15"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Appliquer & Fermer</span>
                </button>
              </div>

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
                  <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-fade-in">
                    <div className={`max-w-4xl w-full rounded-2xl shadow-2xl relative my-6 flex flex-col max-h-[92vh] overflow-hidden border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b1019] border-cyan-500/40 text-white"}`}>
                      
                      {/* Header */}
                      <div className="p-4 sm:p-5 border-b border-[#1f293d] bg-gradient-to-r from-[#0d1424] via-[#101b30] to-[#0d1424] shrink-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400 text-xl shadow-inner">
                              <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <span>PASSERELLE & ÉCHANGE INTER-ÉQUIPES DU CLUB</span>
                                <span className="text-[9px] px-2 py-0.5 rounded font-black border bg-cyan-500/15 text-cyan-300 border-cyan-500/30">
                                  {teams.length} ÉQUIPES GÉRÉES
                                </span>
                              </h3>
                              <p className="text-[11px] text-slate-400 font-medium">
                                Échangez un joueur de votre effectif actuel avec un joueur d&apos;une autre équipe de votre club (promotion, réserve, U19, renfort...).
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setIsInterTeamSwapOpen(false);
                              setSwapNotification(null);
                            }}
                            className="text-slate-400 hover:text-white font-bold p-2 hover:bg-[#1a2333] rounded-xl cursor-pointer transition"
                            title="Fermer la passerelle"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Success / Info Notification Banner */}
                      {swapNotification && (
                        <div className="mx-4 mt-4 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/80 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in shadow-md">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{swapNotification.message}</span>
                          </div>
                          <button
                            onClick={() => setSwapNotification(null)}
                            className="text-emerald-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Modal Body */}
                      <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 scrollbar-thin">
                        
                        {/* Top Grid: Source Player on Left vs Target Team Selector on Right */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* LEFT BOX: SOURCE PLAYER (CURRENT SQUAD) */}
                          <div className="bg-[#0e1524] border border-[#1f293d] rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-[#00E599]" />
                                <span>1. Équipe Source : <strong className="text-white">{activeTeam.name}</strong></span>
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-black border ${
                                swapSourcePlayer?.isStarter
                                  ? "bg-[#00E599]/20 text-[#00E599] border-[#00E599]/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              }`}>
                                {swapSourcePlayer?.isStarter ? "🟢 Titulaire" : "🔄 Remplaçant"}
                              </span>
                            </div>

                            {/* Selector to change source player if desired */}
                            <div className="space-y-1">
                              <label className="text-[9.5px] font-bold text-slate-400 uppercase">
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
                                className="w-full bg-[#141d2e] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                              >
                                <optgroup label="Titulaires sur le terrain">
                                  {sourceTeamStarters.map(p => (
                                    <option key={p.id} value={p.id}>
                                      [Titulaire] N°{p.number || "?"} - {p.name} ({p.role || "Titulaire"})
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Remplaçants sur le banc">
                                  {sourceTeamBench.map(s => (
                                    <option key={s.id} value={s.id}>
                                      [Banc] N°{s.number || "?"} - {s.name} ({s.role || "SUB"})
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>

                            {/* Source Player Visual Card */}
                            {swapSourcePlayer && (
                              <div className="p-3 bg-[#080d16] rounded-xl border border-cyan-500/30 flex items-center gap-3 shadow-inner">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-500/40 flex items-center justify-center font-black text-cyan-300 text-sm overflow-hidden shrink-0 shadow">
                                  {swapSourcePlayer.photo ? (
                                    <img src={swapSourcePlayer.photo} alt={swapSourcePlayer.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>N°{swapSourcePlayer.number}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-white truncate">{swapSourcePlayer.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded font-black">
                                      Poste : {swapSourcePlayer.role}
                                    </span>
                                    <span className="text-[9.5px] text-slate-400 font-bold">
                                      N°{swapSourcePlayer.number}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded font-bold block">
                                    En partance ➔
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* RIGHT BOX: TARGET TEAM SELECTOR */}
                          <div className="bg-[#0e1524] border border-[#1f293d] rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-cyan-400" />
                                <span>2. Choisir l&apos;Équipe Partenaire :</span>
                              </span>
                              <span className="text-[9px] bg-[#141d2e] text-slate-400 px-2 py-0.5 rounded border border-[#1f293d] font-bold">
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
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                                      isSelected
                                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20"
                                        : "bg-[#141d2e] text-slate-300 border-[#1f293d] hover:border-slate-500 hover:text-white"
                                    }`}
                                  >
                                    <span>🛡️</span>
                                    <span>{team.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                                      isSelected ? "bg-slate-950/20 text-slate-950" : "bg-[#0b1019] text-slate-400"
                                    }`}>
                                      {rosterCount}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Current Target Team Info Banner */}
                            <div className="p-2.5 bg-[#080d16] rounded-xl border border-[#1f293d] flex items-center justify-between text-xs">
                              <div>
                                <span className="text-slate-400 font-medium text-[10px]">Équipe sélectionnée : </span>
                                <strong className="text-cyan-300 font-bold">{targetTeamObj.name}</strong>
                                <span className="text-[9px] text-slate-400 ml-1.5 uppercase">({targetTeamObj.category})</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {targetRoster.length} joueurs sous contrat
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* MIDDLE SECTION: TARGET TEAM ROSTER & PLAYER SELECTION */}
                        <div className="bg-[#0e1524] border border-[#1f293d] rounded-xl p-3.5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                              <span>⚡</span>
                              <span>3. Choisir le Joueur de {targetTeamObj.name} à échanger ({filteredTargetRoster.length}) :</span>
                            </span>

                            {/* Search & Filter */}
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="relative min-w-[170px]">
                                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  value={swapSearchQuery}
                                  onChange={(e) => setSwapSearchQuery(e.target.value)}
                                  placeholder="Filtrer nom ou poste..."
                                  className="w-full bg-[#141d2e] border border-[#1f293d] rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                                />
                                {swapSearchQuery && (
                                  <button
                                    onClick={() => setSwapSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              {/* Position Filter Pills */}
                              <div className="flex items-center gap-1 bg-[#141d2e] p-1 rounded-lg border border-[#1f293d] text-[9.5px]">
                                {["ALL", "GB", "DEF", "MIL", "ATT"].map((pos) => (
                                  <button
                                    key={pos}
                                    type="button"
                                    onClick={() => setSwapPositionFilter(pos)}
                                    className={`px-2 py-0.5 rounded font-black transition cursor-pointer ${
                                      swapPositionFilter === pos
                                        ? "bg-cyan-500 text-slate-950 shadow-sm"
                                        : "text-slate-400 hover:text-white"
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
                            <div className="p-6 text-center bg-[#080d16] rounded-xl border border-[#1f293d] text-xs text-slate-400">
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
                                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 shadow-sm ${
                                      isSelected
                                        ? "bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/40 text-white"
                                        : "bg-[#080d16] hover:bg-[#121c2e] border-[#1f293d] text-slate-300 hover:border-slate-500"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                        isSelected
                                          ? "bg-cyan-400 text-slate-950 font-black shadow"
                                          : "bg-[#141d2e] text-cyan-300 border border-[#1f293d]"
                                      }`}>
                                        {player.number}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold truncate leading-tight">{player.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[9px] bg-[#141d2e] px-1.5 py-0.2 rounded font-black text-cyan-300 border border-[#1f293d]">
                                            {player.role || "JOUEUR"}
                                          </span>
                                          <span className={`text-[8.5px] font-bold ${
                                            player.status === "excellent" ? "text-emerald-400" : "text-slate-400"
                                          }`}>
                                            {player.status === "excellent" ? "⚡ En forme" : "🟢 Prêt"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="shrink-0">
                                      {isSelected ? (
                                        <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black text-xs shadow">
                                          ✓
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-slate-500 font-bold hover:text-cyan-300">
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
                          <div className="bg-gradient-to-r from-cyan-950/50 via-[#0a1628] to-blue-950/50 border border-cyan-500/40 rounded-xl p-4 space-y-3 animate-fade-in shadow-xl">
                            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                              <span className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5 tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Aperçu de la permutation inter-équipes :</span>
                              </span>
                              <span className="text-[10px] text-cyan-400/80 font-bold">
                                Bascule instantanée sur la composition et l&apos;effectif
                              </span>
                            </div>

                            {/* Side-by-Side Dual Card */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                              
                              {/* Source card moving out */}
                              <div className="p-3 bg-[#080d16] rounded-xl border border-cyan-500/30 space-y-1 relative">
                                <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-black uppercase">
                                  Quitte {activeTeam.name}
                                </span>
                                <div className="flex items-center gap-2.5 pt-1">
                                  <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center border border-cyan-500/40">
                                    N°{swapSourcePlayer.number}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-white truncate">{swapSourcePlayer.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Poste : {swapSourcePlayer.role} • {swapSourcePlayer.isStarter ? "Titulaire" : "Remplaçant"}</p>
                                  </div>
                                </div>
                                <p className="text-[9.5px] text-amber-300/90 font-bold pt-1">
                                  ➔ Intègre l&apos;effectif de {targetTeamObj.name}
                                </p>
                              </div>

                              {/* Target card moving in */}
                              <div className="p-3 bg-[#080d16] rounded-xl border border-[#00E599]/40 space-y-1 relative">
                                <span className="text-[9px] bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 px-1.5 py-0.2 rounded font-black uppercase">
                                  Rejoint {activeTeam.name}
                                </span>
                                <div className="flex items-center gap-2.5 pt-1">
                                  <span className="w-8 h-8 rounded-lg bg-[#00E599]/20 text-[#00E599] font-black text-xs flex items-center justify-center border border-[#00E599]/40">
                                    N°{selectedTargetPlayer.number}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-white truncate">{selectedTargetPlayer.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Poste : {selectedTargetPlayer.role} • Prêt à jouer</p>
                                  </div>
                                </div>
                                <p className="text-[9.5px] text-[#00E599] font-bold pt-1">
                                  ➔ Devient {swapSourcePlayer.isStarter ? "Titulaire sur le terrain" : "Remplaçant sur le banc"}
                                </p>
                              </div>

                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleExecuteDirectTransfer("bring_from_target")}
                                className="px-3 py-2 bg-[#121926] hover:bg-[#1a2333] border border-[#1f293d] hover:border-slate-500 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                                title="Faire venir uniquement ce joueur sur le banc sans renvoyer de joueur"
                              >
                                Ajouter comme renfort simple
                              </button>

                              <button
                                type="button"
                                onClick={handleExecuteInterTeamSwap}
                                className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-[#00E599] hover:from-cyan-300 hover:to-[#05f4a4] text-slate-950 font-black text-xs uppercase rounded-xl tracking-wider cursor-pointer transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:scale-[1.01]"
                              >
                                <ArrowLeftRight className="w-4 h-4 text-slate-950" />
                                <span>Confirmer la Permutation des 2 Joueurs</span>
                              </button>
                            </div>

                          </div>
                        )}

                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 border-t border-[#1f293d] bg-[#080d16] flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>🛡️</span>
                          <span>Les statistiques, rôles et effectifs sont synchronisés pour les deux équipes en temps réel.</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsInterTeamSwapOpen(false);
                            setSwapNotification(null);
                          }}
                          className="px-4 py-2 bg-[#141d2e] hover:bg-[#1c283f] text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-[#1f293d] transition cursor-pointer"
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
      {/* MODAL : VUE EXPORT 3D CARTE (SQUAD) */}
      {/* ========================================================= */}
      {showSquad3DModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-6xl rounded-2xl p-4 sm:p-6 shadow-2xl relative my-auto space-y-4 max-h-[95vh] overflow-y-auto border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-amber-500/20 to-yellow-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl shadow-inner">
                  🏆
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>VUE EXPORT 3D CARTE (SQUAD)</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-black border border-amber-500/30">
                      STYLE CARTE 3D
                    </span>
                  </h3>
                  <p className="text-xs text-[#62728f] font-bold">
                    Générez et téléchargez une image HD de votre composition en perspective 3D avec cartes de joueurs.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowSquad3DModal(false)}
                className="text-slate-400 hover:text-white font-bold p-2 hover:bg-[#1a2333] rounded-xl cursor-pointer transition text-lg"
              >
                ✕
              </button>
            </div>

            {/* Toolbar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#090d14] p-3 rounded-xl border border-[#1f293d]">
              
              {/* Card Theme Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-black uppercase">Style Cartes:</span>
                <div className="flex items-center gap-1">
                  {[
                    { id: "gold", label: "Or Gold", color: "bg-amber-500 text-slate-950" },
                    { id: "black_special", label: "Special Dark", color: "bg-zinc-800 text-amber-300 border border-amber-500/50" },
                    { id: "silver", label: "Argent", color: "bg-slate-300 text-slate-950" },
                    { id: "emerald", label: "Émeraude", color: "bg-emerald-600 text-white" },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setCardTheme(t.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${t.color} ${
                        cardTheme === t.id ? "ring-2 ring-white scale-105" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation Format Selector */}
              <div className="flex items-center gap-1.5 bg-[#121926] p-1 rounded-xl border border-[#1f293d]">
                <span className="text-[11px] text-slate-400 font-black uppercase px-1.5">Format:</span>
                <button
                  type="button"
                  onClick={() => setSquad3DOrientation("landscape")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 transition cursor-pointer ${
                    squad3DOrientation === "landscape"
                      ? "bg-[#00E599] text-[#0d1117] shadow"
                      : "text-slate-400 hover:text-white bg-[#090d14]"
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Paysage (16:9)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSquad3DOrientation("portrait")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 transition cursor-pointer ${
                    squad3DOrientation === "portrait"
                      ? "bg-[#00E599] text-[#0d1117] shadow"
                      : "text-slate-400 hover:text-white bg-[#090d14]"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Portrait (9:16)</span>
                </button>
              </div>

              {/* Pitch Scale Zoom Control */}
              <div className="flex items-center gap-2 bg-[#121926] px-2.5 py-1.5 rounded-xl border border-[#1f293d]">
                <span className="text-[11px] text-slate-300 font-black uppercase flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-[#00E599]" />
                  <span>Agrandir Terrain:</span>
                </span>
                <input
                  type="range"
                  min="70"
                  max="150"
                  step="5"
                  value={squad3DPitchScale}
                  onChange={(e) => setSquad3DPitchScale(Number(e.target.value))}
                  className="w-20 sm:w-24 accent-[#00E599] cursor-pointer"
                />
                <span className="text-xs font-black text-[#00E599] w-10 text-right">{squad3DPitchScale}%</span>
                {squad3DPitchScale !== 100 && (
                  <button
                    onClick={() => setSquad3DPitchScale(100)}
                    className="text-[9px] bg-[#1a2333] hover:bg-[#253247] text-slate-300 px-1.5 py-0.5 rounded font-bold transition cursor-pointer"
                    title="Réinitialiser à 100%"
                  >
                    100%
                  </button>
                )}
              </div>

              {/* Read-Only Club Title Display & Export Button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121926] border border-[#1f293d] rounded-xl text-xs font-black text-amber-300 shadow-inner" title="Nom de l'équipe active (non modifiable ici)">
                  <span>🛡️</span>
                  <span className="truncate max-w-[140px] uppercase">{displayClubTitle}</span>
                </div>

                <button
                  onClick={handleOpenShareSquad3D}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-[#00E599] text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 flex items-center gap-2 transition cursor-pointer"
                  title="Partager la composition 3D par WhatsApp ou E-mail"
                >
                  <Share2 className="w-4 h-4" />
                  <span>PARTAGER (WHATSAPP & MAIL)</span>
                </button>

                <button
                  onClick={handleDownloadSquad3DImage}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg shadow-amber-500/10 hover:brightness-110 flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>TÉLÉCHARGER PNG HD</span>
                </button>
              </div>

            </div>

            {/* THE EXPORTABLE 3D STAGE CONTAINER */}
            <div
              ref={squad3DRef}
              className={`bg-[#0a0f18] text-white p-4 sm:p-6 rounded-2xl border-2 border-[#1f293d] relative select-none flex flex-col justify-between shadow-2xl mx-auto transition-all duration-300 ${
                squad3DOrientation === "portrait"
                  ? "max-w-[540px] min-h-[820px] w-full"
                  : "max-w-[960px] w-full min-h-[600px]"
              }`}
              style={{
                backgroundImage: "radial-gradient(circle at 50% 30%, rgba(30, 58, 138, 0.35) 0%, rgba(13, 17, 23, 1) 80%)"
              }}
            >
              {/* Studio Background watermark rings */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />

              {/* Stage Top Header */}
              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span>🛡️</span> {displayClubTitle}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {activeSport.toUpperCase()} • FORMATION 3D TACTICAL SQUAD ({squad3DOrientation === "portrait" ? "PORTRAIT 9:16" : "PAYSAGE 16:9"})
                  </p>
                </div>
              </div>

              {/* 3D Pitch Container */}
              <div className={`relative z-10 my-3 w-full flex items-center justify-center transition-all ${
                squad3DOrientation === "portrait"
                  ? "h-[660px] sm:h-[690px]"
                  : (squad3DPitchScale > 120 ? "h-[600px] sm:h-[640px]" : squad3DPitchScale > 100 ? "h-[540px] sm:h-[580px]" : "h-[500px]")
              }`}>
                
                {/* Perspective wrapper */}
                <div 
                  className={`relative ${squad3DOrientation === "portrait" ? "w-[96%] h-[100%]" : "w-[92%] h-[100%]"}`}
                  style={{
                    perspective: squad3DOrientation === "portrait" ? "1200px" : "1100px",
                    perspectiveOrigin: squad3DOrientation === "portrait" ? "50% 35%" : "50% 20%",
                  }}
                >
                  {/* Rotated Pitch Surface */}
                  <div 
                    className="w-full h-full relative rounded-2xl border-4 border-white/40 shadow-[0_30px_60px_rgba(0,0,0,0.95)] overflow-hidden bg-emerald-950 transition-transform duration-200"
                    style={{
                      transform: squad3DOrientation === "portrait"
                        ? `rotateX(30deg) rotateZ(0deg) scale(${(0.96 * squad3DPitchScale) / 100})`
                        : `rotateX(42deg) rotateZ(0deg) scale(${(0.92 * squad3DPitchScale) / 100})`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Mower Stripes parallel to goal lines */}
                    {squad3DOrientation === "portrait" ? (
                      <div className="absolute inset-0 flex flex-col h-full w-full opacity-20 pointer-events-none">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 w-full ${idx % 2 === 0 ? "bg-emerald-900" : "bg-transparent"}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-row h-full w-full opacity-20 pointer-events-none">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 h-full ${idx % 2 === 0 ? "bg-emerald-900" : "bg-transparent"}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* SVG Pitch Markings */}
                    {squad3DOrientation === "portrait" ? (
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 73 110" preserveAspectRatio="none">
                        <rect x="2.5" y="2.5" width="68" height="105" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <line x1="2.5" y1="55" x2="70.5" y2="55" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <circle cx="36.5" cy="55" r="9.15" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <circle cx="36.5" cy="55" r="0.5" fill="white" />
                        
                        {/* The Box Official Logo Emblem on 3D Turf (100% Identical to Navbar) */}
                        <svg x="27.35" y="45.85" width="18.3" height="18.3" viewBox="0 0 100 100" className="pointer-events-none">
                          <g stroke="white" strokeOpacity="0.4" fill="none">
                            <circle cx="50" cy="50" r="44" strokeWidth="4" />
                            <path d="M 19 19 L 81 81" strokeWidth="4" strokeLinecap="square" />
                            <path d="M 81 19 L 19 81" strokeWidth="4" strokeLinecap="square" />
                            <path d="M 32 21 L 50 39 L 68 21" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                            <path d="M 32 79 L 50 61 L 68 79" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                            <path d="M 21 32 L 39 50 L 21 68" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                            <path d="M 79 32 L 61 50 L 79 68" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                          </g>
                        </svg>

                        {/* Top Goal Box */}
                        <rect x="16.34" y="2.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <rect x="27.34" y="2.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        
                        {/* Bottom Goal Box */}
                        <rect x="16.34" y="91" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <rect x="27.34" y="102" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                      </svg>
                    ) : (
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 73" preserveAspectRatio="none">
                        <rect x="2.5" y="2.5" width="105" height="68" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <line x1="55" y1="2.5" x2="55" y2="70.5" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <circle cx="55" cy="36.5" r="9.15" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <circle cx="55" cy="36.5" r="0.5" fill="white" />

                        {/* The Box Official Logo Emblem on 3D Turf (100% Identical to Navbar) */}
                        <svg x="45.85" y="27.35" width="18.3" height="18.3" viewBox="0 0 100 100" className="pointer-events-none">
                          <g stroke="white" strokeOpacity="0.4" fill="none">
                            <circle cx="50" cy="50" r="44" strokeWidth="4" />
                            <path d="M 19 19 L 81 81" strokeWidth="4" strokeLinecap="square" />
                            <path d="M 81 19 L 19 81" strokeWidth="4" strokeLinecap="square" />
                            <path d="M 32 21 L 50 39 L 68 21" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                            <path d="M 32 79 L 50 61 L 68 79" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                            <path d="M 21 32 L 39 50 L 21 68" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                            <path d="M 79 32 L 61 50 L 79 68" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                          </g>
                        </svg>
                        
                        {/* Left Penalty Box */}
                        <rect x="2.5" y="16.34" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <rect x="2.5" y="27.34" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        
                        {/* Right Penalty Box */}
                        <rect x="91" y="16.34" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                        <rect x="102" y="27.34" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                      </svg>
                    )}
                  </div>

                  {/* Player Cards Overlay */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {currentTokens.filter(t => t.type === "player_a").map(p => {
                      // Position calculation based on orientation - safely mapped within visible 3D turf
                      const posX = squad3DOrientation === "portrait" ? (12 + (p.y * 0.76)) : p.x;
                      const posY = squad3DOrientation === "portrait" ? (14 + ((100 - p.x) * 0.72)) : p.y;
                      const role = p.role || "ST";

                      return (
                        <div
                          key={p.id}
                          className="absolute transition-all duration-300"
                          style={{
                            left: `${posX}%`,
                            top: `${posY}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          {/* Reduced & Compact Player Card */}
                          <div 
                            className={`${
                              squad3DOrientation === "portrait" ? "w-13 sm:w-15 p-1" : "w-15 sm:w-18 p-1.5"
                            } rounded-xl shadow-2xl text-center border-2 flex flex-col items-center justify-between transition-all ${
                              cardTheme === "gold"
                                ? "bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-amber-200 text-amber-950 shadow-amber-950/60"
                                : cardTheme === "silver"
                                ? "bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 border-slate-100 text-slate-950 shadow-slate-950/60"
                                : cardTheme === "black_special"
                                ? "bg-gradient-to-b from-zinc-800 via-zinc-950 to-black border-amber-400 text-amber-300 shadow-black/90"
                                : "bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-950 border-emerald-300 text-white shadow-emerald-950/60"
                            }`}
                          >
                            {/* Top bar: Number & Role */}
                            <div className="w-full flex items-center justify-between px-0.5 text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-tight leading-none mb-0.5">
                              <span className="bg-black/50 text-white px-1 py-0.5 rounded font-black">#{p.number || 1}</span>
                              <span className="bg-white/20 text-white px-1 py-0.5 rounded font-extrabold">{role}</span>
                            </div>

                            {/* Photo or Circle with Initials */}
                            <div className="relative my-0.5">
                              {p.photo ? (
                                <img
                                  src={p.photo}
                                  alt={p.name}
                                  className={`${squad3DOrientation === "portrait" ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-10 sm:h-10"} rounded-full object-cover border-2 border-white/80 shadow-md bg-black/40`}
                                />
                              ) : (
                                <div className={`${squad3DOrientation === "portrait" ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-10 sm:h-10"} rounded-full bg-slate-950/70 border-2 border-white/80 flex items-center justify-center font-black text-[9px] sm:text-[11px] text-white shadow-inner uppercase`}>
                                  {p.name ? p.name.slice(0, 2) : `#${p.number}`}
                                </div>
                              )}
                            </div>

                            {/* Player Name Banner */}
                            <div className="w-full bg-black/85 mt-0.5 py-0.5 px-0.5 rounded border border-white/20 text-center">
                              <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-tight text-white truncate">
                                {p.name || `JOUEUR #${p.number}`}
                              </p>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>

              {/* Stage Footer */}
              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-bold">
                <span>⚽ Composition 3D • {displayClubTitle} vs {activeMatch.awayTeam}</span>
                <span>⚡ The Box 3D Squad Generator</span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL : CONFIGURATION DE L'UTILISATEUR & SPORT */}
      {/* ========================================================= */}
      {isUserConfigModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center text-[#00E599] text-lg shrink-0">
                  ⚙️
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    CONFIGURATION DE L&apos;UTILISATEUR
                  </h3>
                  <p className="text-xs text-[#62728f] font-bold">
                    Ajustez votre profil coach et sélectionnez votre discipline sportive principale.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUserConfigModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-2 hover:bg-[#1a2333] rounded-xl transition cursor-pointer text-sm shrink-0"
              >
                ✕
              </button>
            </div>

             {/* Form Body - Scrollable */}
            <form onSubmit={handleSaveUserConfig} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin my-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599] font-bold"
                  />
                </div>
              </div>

              {/* EMAIL DE CONNEXION */}
              <div>
                <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1 flex items-center justify-between">
                  <span>Adresse Email de Connexion *</span>
                  <span className="text-[#00E599] text-[9.5px] font-bold">📧 Compte Principal</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="ex: coach@monclub.fr"
                  className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Club / Équipe
                  </label>
                  <input
                    type="text"
                    value={editClub}
                    onChange={(e) => setEditClub(e.target.value)}
                    placeholder="ex: Olympique Lyonnais"
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Fonction au sein du club
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599] font-bold cursor-pointer"
                  >
                    <option value="Coach Principal">Coach Principal</option>
                    <option value="Entraîneur Adjoint">Entraîneur Adjoint</option>
                    <option value="Analyste Vidéo / Tactique">Analyste Vidéo / Tactique</option>
                    <option value="Préparateur Physique">Préparateur Physique</option>
                    <option value="Responsable Technique">Responsable Technique</option>
                  </select>
                </div>
              </div>

              {/* THÈME D'AFFICHAGE & DESIGN (OPTIONS UTILISATEUR) */}
              <div className="bg-[#090d14] border border-[#1f293d] p-3.5 rounded-xl space-y-2">
                <label className="block text-[10px] font-black text-[#00E599] uppercase tracking-wider flex items-center justify-between">
                  <span>Thème & Apparence de l&apos;Interface</span>
                  <span className="text-slate-400 font-normal text-[9px]">(Mode Sombre ou Clair & Épuré)</span>
                </label>
                <div className="flex items-center justify-between bg-[#0d1117] border border-[#1f293d] p-2.5 rounded-lg flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isModernSleek ? "☀️" : "🌙"}</span>
                    <div>
                      <p className="text-xs font-black text-white uppercase">
                        {isModernSleek ? "Mode Clair & Épuré (Actif)" : "Mode Sombre Classique (Actif)"}
                      </p>
                      <p className="text-[9.5px] text-[#62728f]">
                        {isModernSleek ? "Interface lumineuse et aérée avec fort contraste" : "Contraste historique sombre d'origine"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleModernSleek}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-sm ${
                      isModernSleek
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-900/20"
                        : "bg-[#121926] hover:bg-[#1a253b] text-slate-200 border-[#1f293d]"
                    }`}
                  >
                    <span>{isModernSleek ? "Passer en Sombre" : "Passer en Clair"}</span>
                    <div className={`w-7 h-4 rounded-full p-0.5 flex items-center ${isModernSleek ? "bg-white justify-end" : "bg-slate-700 justify-start"}`}>
                      <div className={`w-3 h-3 rounded-full ${isModernSleek ? "bg-emerald-600" : "bg-white"} shadow-sm`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* SPORT SELECTOR */}
              <div className="bg-[#090d14] border border-[#1f293d] p-3.5 rounded-xl space-y-2">
                <label className="block text-[10px] font-black text-[#00E599] uppercase tracking-wider flex items-center justify-between">
                  <span>Discipline Sportive</span>
                  <span className="text-slate-400 font-normal text-[9px]">
                    {isUserAdmin ? "(Vue Administrateur - Tous les sports)" : "(Disciplines Sportives Autorisées)"}
                  </span>
                </label>
                <select
                  value={editSport}
                  onChange={(e) => setEditSport(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#1f293d] rounded-lg px-3 py-2.5 text-xs text-white font-black uppercase focus:outline-none focus:border-[#00E599] cursor-pointer"
                >
                  {[
                    { id: "football", label: "⚽ FOOTBALL" },
                    { id: "basketball", label: "🏀 BASKETBALL" },
                    { id: "rugby", label: "🏉 RUGBY" },
                    { id: "handball", label: "🤾 HANDBALL" }
                  ]
                    .filter((sport) => {
                      // If user is non-admin, ONLY show sports configured/enabled by the administrator (not in blockedSports)
                      if (!isUserAdmin && blockedSports.includes(sport.id)) {
                        return false;
                      }
                      return true;
                    })
                    .map((sport) => {
                      const isBlocked = blockedSports.includes(sport.id);
                      return (
                        <option
                          key={sport.id}
                          value={sport.id}
                          className="text-white bg-[#0d1117] font-bold"
                        >
                          {sport.label} {isBlocked ? "🔒 (BLOQUÉ POUR USAGERS)" : ""}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* SUBSCRIPTION & STRIPE MANAGEMENT */}
              <div className="bg-[#090d14] border border-[#1f293d] p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#1f293d] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm">💳</span>
                    <label className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                      Gestion de l&apos;Abonnement & Facturation
                    </label>
                  </div>
                  <span className="text-[8px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    STRIPE READY ⚡
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#0d1117] border border-[#1f293d] p-3 rounded-lg flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">Formule actuelle :</span>
                      <span className="text-xs font-black text-[#00E599] uppercase bg-[#00E599]/10 px-2 py-0.5 rounded border border-[#00E599]/30">
                        {isUserAdmin ? "👑 Licence Admin Illimitée" : `Plan ${activePlan.toUpperCase()}`}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-[#62728f] mt-1 font-medium">
                      Portail sécurisé Stripe • Modification et facturation en ligne sans engagement.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserConfigModalOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[10px] uppercase rounded-lg shadow-md transition cursor-pointer shrink-0"
                  >
                    Changer d&apos;Abonnement
                  </button>
                </div>

                {/* Quick Plan Switcher */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePlan("gratuit");
                      alert("Formule Gratuit sélectionnée.");
                    }}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      activePlan === "gratuit"
                        ? "bg-[#121926] border-amber-500/50 ring-1 ring-amber-500/30"
                        : "bg-[#0d1117] border-[#1f293d] hover:border-slate-700"
                    }`}
                  >
                    <div className="text-[9px] font-black text-slate-400 uppercase">Démo Gratuit</div>
                    <div className="text-xs font-black text-white mt-0.5">0 €</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActivePlan("pro");
                      alert("Formule PRO (9.90 €/mois) sélectionnée !");
                    }}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      activePlan === "pro" || activePlan === "mensuel"
                        ? "bg-[#102420] border-[#00E599] ring-1 ring-[#00E599]/30"
                        : "bg-[#0d1117] border-[#1f293d] hover:border-[#00E599]/50"
                    }`}
                  >
                    <div className="text-[9px] font-black text-[#00E599] uppercase">Formule PRO</div>
                    <div className="text-xs font-black text-white mt-0.5">9,90 €/mo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActivePlan("pro_plus");
                      alert("Formule PRO+ (14.90 €/mois) sélectionnée !");
                    }}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      activePlan === "pro_plus" || activePlan === "annuel" || activePlan === "club"
                        ? "bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/30"
                        : "bg-[#0d1117] border-[#1f293d] hover:border-amber-500/50"
                    }`}
                  >
                    <div className="text-[9px] font-black text-amber-300 uppercase">Formule PRO+</div>
                    <div className="text-xs font-black text-white mt-0.5">14,90 €/mo</div>
                  </button>
                </div>
              </div>

              {/* Actions - Sticky at bottom */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f293d] shrink-0 sticky bottom-0 bg-[#0d1117] mt-2">
                <button
                  type="button"
                  onClick={() => setIsUserConfigModalOpen(false)}
                  className="px-4 py-2 bg-[#121926] hover:bg-[#1a253a] border border-[#1f293d] text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117] font-black text-xs uppercase rounded-xl shadow-lg shadow-[#00E599]/10 transition cursor-pointer"
                >
                  Enregistrer la Configuration
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

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
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl p-6 shadow-2xl relative my-auto max-h-[95vh] overflow-y-auto border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"}`}>
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E599]/20 to-emerald-600/30 border border-[#00E599]/40 flex items-center justify-center text-[#00E599] text-xl shadow-inner">
                  💳
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    ABONNEMENTS & FORMULES THE BOX
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    Choisissez l&apos;offre adaptée à votre club ou staff technique.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-2 hover:bg-[#1a2333] rounded-xl cursor-pointer transition text-lg"
              >
                ✕
              </button>
            </div>

            <SubscriptionPlans
              activePlan={activePlan}
              setActivePlan={(plan) => {
                setActivePlan(plan);
                setIsCheckoutOpen(false);
              }}
              coachId={activeCoach?.id}
              coachEmail={activeCoach?.email}
              coachName={activeCoach?.firstName ? `${activeCoach.firstName} ${activeCoach.lastName}` : undefined}
            />
          </div>
        </div>
      )}

      {/* MODALE UPGRADE : MULTI-ÉQUIPES (PRO & PRO+) */}
      {isMultiTeamUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-center space-y-4 border-2 ${isModernSleek ? "bg-white border-emerald-500/60 text-slate-900" : "bg-[#0d1117] border-[#00E599]/60 text-white"}`}>
            <div className="w-14 h-14 rounded-2xl bg-[#00E599]/15 border border-[#00E599]/40 flex items-center justify-center text-[#00E599] text-2xl mx-auto shadow-lg">
              🛡️
            </div>
            
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00E599] bg-[#00E599]/10 px-2.5 py-1 rounded-full border border-[#00E599]/30">
                FONCTIONNALITÉ FORMULE PRO
              </span>
              <h3 className="text-lg font-black text-white mt-2">
                Gestion Multi-Équipes
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                La création et la gestion de plusieurs équipes (Séniors A, Réserve, U19, Féminines...) avec schémas tactiques indépendants est disponible dès la <span className="text-[#00E599] font-bold">Formule PRO (9.90€/mois)</span> et <span className="text-amber-400 font-bold">PRO+ (14.90€/mois)</span>.
              </p>
            </div>

            <div className="bg-[#090d14] border border-[#1f293d] p-3 rounded-xl text-left space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00E599] shrink-0" />
                <span>Multi-équipes illimitées pour un seul coach</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00E599] shrink-0" />
                <span>Schémas tactiques isolés par match et équipe</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#00E599] shrink-0" />
                <span>Enregistrements vocaux et causeries tactiques</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsMultiTeamUpgradeModalOpen(false)}
                className="flex-1 py-2.5 bg-[#121926] hover:bg-[#1a253a] border border-[#1f293d] text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMultiTeamUpgradeModalOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="flex-1 py-2.5 bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117] font-black text-xs uppercase rounded-xl shadow-lg shadow-[#00E599]/20 transition cursor-pointer"
              >
                Passer en PRO (9.90€)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE UPGRADE : MODE LIVE MATCH (EXCLUSIVITÉ PRO+) */}
      {isLiveMatchUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl relative text-center space-y-4 border-2 ${isModernSleek ? "bg-white border-amber-500/60 text-slate-900" : "bg-[#0d1117] border-amber-500/60 text-white"}`}>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl mx-auto shadow-lg animate-pulse">
              ⏱️
            </div>
            
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                EXCLUSIVITÉ FORMULE PRO+
              </span>
              <h3 className="text-lg font-black text-white mt-2">
                Activation du Mode Live Match
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Le mode match en direct avec chronomètre officiel, saisie de score, enregistrement des événements en direct (buts, passes dé, cartons, sorties) et remplacements tactiques est une exclusivité de la <span className="text-amber-400 font-bold">Formule PRO+ (14.90€/mois)</span>.
              </p>
            </div>

            <div className="bg-[#090d14] border border-[#1f293d] p-3 rounded-xl text-left space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Chronomètre de match en temps réel avec Start / Pause / Reset</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Enregistrement en direct des buts & passes décisives</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Cartons jaunes & rouges avec historique d&apos;événements</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Remplacements et blessures en direct sur le terrain</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLiveMatchUpgradeModalOpen(false)}
                className="flex-1 py-2.5 bg-[#121926] hover:bg-[#1a253a] border border-[#1f293d] text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLiveMatchUpgradeModalOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                Passer en PRO+ (14.90€)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
