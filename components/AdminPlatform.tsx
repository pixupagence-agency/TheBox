"use client";

import React, { useState } from "react";
import { CoachProfile } from "@/app/page";
import { calculateTrialRemaining, TRIAL_DURATION_DAYS } from "@/components/TrialCountdownModal";
import { isSuperAdminEmail } from "@/lib/security";
import { auth, listAllUserProfiles, adminUpdateUserProfile, type FirebaseCoachProfile } from "@/lib/firebase";
import {
  ShieldCheck,
  Users,
  CreditCard,
  Lock,
  Search,
  UserPlus,
  TrendingUp,
  CheckCircle2,
  X,
  Award,
  Layers,
  Sparkles,
  Clock,
  Gift,
  RotateCcw,
  Crown,
  Trash2,
  Zap,
  ExternalLink,
  Wrench
} from "lucide-react";
import { confirmAction } from "@/components/ConfirmDialog";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  MAINTENANCE_MESSAGE_MAX,
  MaintenanceState,
  isCurrentUserSuperAdmin,
  setMaintenance,
} from "@/lib/maintenance";

export interface SportAccessConfig {
  id: string;
  name: string;
  icon: string;
  isBlocked: boolean;
  statusNote: string;
  category: string;
}

export const defaultBlockedSports: string[] = ["basketball", "rugby", "handball"];

export const defaultSportsConfig: SportAccessConfig[] = [
  {
    id: "football",
    name: "Football",
    icon: "⚽",
    isBlocked: false,
    statusNote: "Totalement opérationnel (11v11, 8v8, 5v5)",
    category: "Outdoor"
  },
  {
    id: "basketball",
    name: "Basketball",
    icon: "🏀",
    isBlocked: true,
    statusNote: "Disponible sur activation administrateur",
    category: "Indoor"
  },
  {
    id: "rugby",
    name: "Rugby",
    icon: "🏉",
    isBlocked: true,
    statusNote: "Disponible sur activation administrateur",
    category: "Outdoor"
  },
  {
    id: "handball",
    name: "Handball",
    icon: "🤾",
    isBlocked: true,
    statusNote: "Disponible sur activation administrateur",
    category: "Indoor"
  }
];

interface AdminPlatformProps {
  isOpen: boolean;
  onClose: () => void;
  coaches: CoachProfile[];
  setCoaches: React.Dispatch<React.SetStateAction<CoachProfile[]>>;
  activeCoach: CoachProfile;
  blockedSports: string[];
  setBlockedSports: React.Dispatch<React.SetStateAction<string[]>>;
  sportsConfig: SportAccessConfig[];
  setSportsConfig: React.Dispatch<React.SetStateAction<SportAccessConfig[]>>;
  activePlan: string;
  setActivePlan: (plan: string) => void;
  isModernSleek?: boolean;
  /** État du mode maintenance, suivi en direct par la page */
  maintenance: MaintenanceState;
}

const DAY_MS = 24 * 60 * 60 * 1000;

type AdminTab = "subscriptions" | "sports" | "privileges" | "maintenance";

/** Fin d'essai enregistrée en base (Timestamp Firestore ou ISO) au format ISO, sinon undefined. */
const trialEndIso = (p: FirebaseCoachProfile): string | undefined => {
  const raw: any = (p as any).trialEndsAt;
  const date = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null;
  return date && !isNaN(date.getTime()) ? date.toISOString() : undefined;
};

/**
 * Nouvelle fin d'essai après ajout de jours : à partir de la fin d'essai actuelle (fixée par le serveur,
 * sinon déduite de la création + jours offerts), ou d'aujourd'hui si l'essai est déjà terminé.
 */
const extendedTrialEnd = (p: FirebaseCoachProfile, daysToAdd: number): Date => {
  const now = Date.now();
  const iso = trialEndIso(p);
  const start = new Date(p.createdAt || "").getTime();
  const currentEnd = iso
    ? new Date(iso).getTime()
    : (isNaN(start) ? now : start) + (TRIAL_DURATION_DAYS + (p.trialBonusDays || 0)) * DAY_MS;
  return new Date(Math.max(currentEnd, now) + daysToAdd * DAY_MS);
};

export default function AdminPlatform({
  isOpen,
  onClose,
  coaches,
  setCoaches,
  activeCoach,
  blockedSports,
  setBlockedSports,
  sportsConfig,
  setSportsConfig,
  activePlan,
  setActivePlan,
  isModernSleek = false,
  maintenance
}: AdminPlatformProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("subscriptions");

  // Mode maintenance : réservé au super admin (adresse confirmée, comme l'exigent les règles Firestore)
  const canManageMaintenance = isOpen && isCurrentUserSuperAdmin();
  const [maintenanceDraft, setMaintenanceDraft] = useState(maintenance.message);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  // Message modifié ailleurs (temps réel) : le brouillon reprend la version enregistrée (ajusté pendant le rendu)
  const [savedMaintenanceMessage, setSavedMaintenanceMessage] = useState(maintenance.message);
  if (maintenance.message !== savedMaintenanceMessage) {
    setSavedMaintenanceMessage(maintenance.message);
    setMaintenanceDraft(maintenance.message);
  }
  const handleSaveMaintenance = async (enabled: boolean) => {
    if (isSavingMaintenance) return;
    if (
      enabled &&
      !maintenance.enabled &&
      !(await confirmAction({
        title: "Activer le mode maintenance ?",
        message: "Les coachs connectés et les visiteurs verront immédiatement l'écran de maintenance. Seuls les administrateurs gardent l'accès.",
        confirmLabel: "Activer",
      }))
    ) {
      return;
    }
    setIsSavingMaintenance(true);
    setMaintenanceError(null);
    try {
      await setMaintenance(enabled, maintenanceDraft);
    } catch (e: any) {
      console.error("[Maintenance] Enregistrement impossible :", e);
      setMaintenanceError("Enregistrement impossible. Vérifiez votre connexion et que les règles Firestore sont déployées.");
    } finally {
      setIsSavingMaintenance(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  
  // State for user creation in admin
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newClub, setNewClub] = useState("");
  const [newRole, setNewRole] = useState("Coach Principal");
  const [newPlan, setNewPlan] = useState("pro");
  const [newSport, setNewSport] = useState("football");

  // State for extending demo time / trial duration
  const [selectedCoachForExtend, setSelectedCoachForExtend] = useState<CoachProfile | null>(null);
  const [customDaysToAdd, setCustomDaysToAdd] = useState<number>(7);
  const [extendNotification, setExtendNotification] = useState<string | null>(null);

  // Track plan map per user (stored in admin state / coach object)
  const [userPlans, setUserPlans] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_admin_user_plans");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    // Default plan mapping
    const initial: Record<string, string> = {};
    coaches.forEach((c) => {
      initial[c.id] = (isSuperAdminEmail(c.email) || c.isAdmin) ? "club" : "free";
    });
    return initial;
  });

  // Comptes réels enregistrés en base (users/{uid}) : chargés à chaque ouverture de la plateforme
  const [remoteProfiles, setRemoteProfiles] = useState<FirebaseCoachProfile[]>([]);
  const [remoteStatus, setRemoteStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [remoteError, setRemoteError] = useState<string | null>(null);

  // Requête seule : l'état « chargement » est posé par l'appelant (ouverture ou bouton Actualiser)
  // (l'état n'est modifié qu'à l'arrivée de la réponse)
  const fetchRemoteProfiles = React.useCallback(
    () =>
      listAllUserProfiles().then(
        (list) => {
          setRemoteProfiles(list);
          setRemoteStatus("ok");
        },
        (e: any) => {
          console.error("Chargement des comptes impossible", e);
          setRemoteError(
            String(e?.message || "").includes("permission")
              ? "Accès refusé par Firestore : connectez-vous avec le compte super admin."
              : "Impossible de charger les comptes en ligne."
          );
          setRemoteStatus("error");
        }
      ),
    []
  );

  const loadRemoteProfiles = () => {
    setRemoteStatus("loading");
    setRemoteError(null);
    void fetchRemoteProfiles();
  };

  // À chaque ouverture : « chargement » affiché tout de suite (ajusté pendant le rendu), puis requête
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setRemoteStatus("loading");
      setRemoteError(null);
    }
  }
  React.useEffect(() => {
    if (isOpen) void fetchRemoteProfiles();
  }, [isOpen, fetchRemoteProfiles]);

  const remoteById = React.useMemo(() => new Map(remoteProfiles.map((p) => [p.id, p])), [remoteProfiles]);
  const isRemoteCoach = (coachId: string) => remoteById.has(coachId);

  // Liste affichée : comptes en base (qui font foi) + profils locaux de cet appareil absents de la base
  const allCoaches: CoachProfile[] = React.useMemo(() => {
    const remoteEmails = new Set(remoteProfiles.map((p) => (p.email || "").toLowerCase()).filter(Boolean));
    const fromDb: CoachProfile[] = remoteProfiles.map((p) => ({
      id: p.id,
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      club: p.club || "",
      role: p.role || "",
      preferredSport: p.preferredSport || "football",
      email: p.email || "",
      isAdmin: p.isAdmin,
      createdAt: p.createdAt,
      trialBonusDays: p.trialBonusDays || 0,
      trialEndsAt: (p as any).hasHadSubscription ? null : trialEndIso(p),
      hasHadSubscription: Boolean((p as any).hasHadSubscription),
    }));
    const localOnly = coaches.filter(
      (c) => !remoteById.has(c.id) && !(c.email && remoteEmails.has(c.email.toLowerCase()))
    );
    return [...fromDb, ...localOnly].sort(
      (a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0)
    );
  }, [remoteProfiles, remoteById, coaches]);

  const patchRemote = async (
    coachId: string,
    patch: Partial<Pick<FirebaseCoachProfile, "activePlan" | "trialBonusDays">> & { trialEndsAt?: Date }
  ) => {
    await adminUpdateUserProfile(coachId, patch);
    const { trialEndsAt, ...rest } = patch;
    setRemoteProfiles((prev) =>
      prev.map((p) => (p.id === coachId ? { ...p, ...rest, ...(trialEndsAt ? { trialEndsAt: trialEndsAt.toISOString() } : {}) } : p))
    );
  };

  // Handle plan change for a specific coach
  const handleChangeUserPlan = async (coachId: string, plan: string) => {
    if (isRemoteCoach(coachId)) {
      try {
        await patchRemote(coachId, { activePlan: plan });
      } catch (e) {
        console.error(e);
        alert("⚠️ La formule n'a pas pu être enregistrée en base.");
        return;
      }
      if (coachId === activeCoach.id) setActivePlan(plan);
      return;
    }
    const updated = { ...userPlans, [coachId]: plan };
    setUserPlans(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_admin_user_plans", JSON.stringify(updated));
    }

    // If changing plan for current active coach, update activePlan
    if (coachId === activeCoach.id) {
      setActivePlan(plan);
    }
  };

  // Add demo time (days) for a specific user
  const handleApplyExtendDemo = async (coachId: string, daysToAdd: number) => {
    if (daysToAdd <= 0) return;
    const remote = remoteById.get(coachId);
    if (remote) {
      try {
        await patchRemote(coachId, {
          trialBonusDays: (remote.trialBonusDays || 0) + daysToAdd,
          trialEndsAt: extendedTrialEnd(remote, daysToAdd),
        });
      } catch (e) {
        console.error(e);
        alert("⚠️ Les jours d'essai n'ont pas pu être enregistrés en base.");
        return;
      }
      setExtendNotification(`🎉 +${daysToAdd} jours de démo ajoutés avec succès à ${remote.firstName} ${remote.lastName} !`);
      setTimeout(() => setExtendNotification(null), 5000);
      setSelectedCoachForExtend(null);
      return;
    }
    const updated = coaches.map((c) => {
      if (c.id === coachId) {
        const currentBonus = c.trialBonusDays || 0;
        return { ...c, trialBonusDays: currentBonus + daysToAdd };
      }
      return c;
    });
    setCoaches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_coaches", JSON.stringify(updated));
    }

    const targetCoach = coaches.find((c) => c.id === coachId);
    if (targetCoach) {
      setExtendNotification(`🎉 +${daysToAdd} jours de démo ajoutés avec succès à ${targetCoach.firstName} ${targetCoach.lastName} !`);
      setTimeout(() => setExtendNotification(null), 5000);
    }
    setSelectedCoachForExtend(null);
  };

  // Reset user's trial to 14 days from today
  const handleResetTrial = async (coachId: string) => {
    const remote = remoteById.get(coachId);
    if (remote) {
      // La fin d'essai (lue par le serveur et les règles Firestore) est repoussée à dans 14 jours.
      // Sans effet pour un ancien abonné : il n'a plus droit à l'essai.
      const start = new Date(remote.createdAt || "").getTime();
      const elapsedDays = isNaN(start) ? 0 : Math.max(0, Math.ceil((Date.now() - start) / DAY_MS));
      try {
        await patchRemote(coachId, {
          trialBonusDays: elapsedDays,
          trialEndsAt: new Date(Date.now() + TRIAL_DURATION_DAYS * DAY_MS),
        });
      } catch (e) {
        console.error(e);
        alert("⚠️ L'essai n'a pas pu être réinitialisé en base.");
        return;
      }
      setExtendNotification(`🔄 Essai de 14 jours réinitialisé avec succès pour ${remote.firstName} ${remote.lastName} !`);
      setTimeout(() => setExtendNotification(null), 5000);
      setSelectedCoachForExtend(null);
      return;
    }
    const updated = coaches.map((c) => {
      if (c.id === coachId) {
        return {
          ...c,
          createdAt: new Date().toISOString(),
          trialBonusDays: 0,
        };
      }
      return c;
    });
    setCoaches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_coaches", JSON.stringify(updated));
    }

    const targetCoach = coaches.find((c) => c.id === coachId);
    if (targetCoach) {
      setExtendNotification(`🔄 Essai de 14 jours réinitialisé avec succès pour ${targetCoach.firstName} ${targetCoach.lastName} !`);
      setTimeout(() => setExtendNotification(null), 5000);
    }
    setSelectedCoachForExtend(null);
  };

  // Supported sports are strictly limited to defaultSportsConfig (Football, Basketball, Rugby, Handball)
  const supportedSportIds = defaultSportsConfig.map((s) => s.id);
  const activeSportsConfig = defaultSportsConfig.map((def) => {
    const existing = sportsConfig.find((s) => s.id === def.id);
    return existing ? { ...def, ...existing } : def;
  });
  const cleanBlockedSports = blockedSports.filter((id) => supportedSportIds.includes(id));
  const blockedSportsCount = cleanBlockedSports.length;

  // À l'ouverture : sports non pris en charge retirés de la configuration enregistrée sur l'appareil
  React.useEffect(() => {
    if (!isOpen) return;
    const supported = defaultSportsConfig.map((s) => s.id);
    if (sportsConfig.some((s) => !supported.includes(s.id)) || sportsConfig.length !== defaultSportsConfig.length) {
      const normalized = defaultSportsConfig.map((def) => ({ ...def, ...sportsConfig.find((s) => s.id === def.id) }));
      setSportsConfig(normalized);
      localStorage.setItem("thebox_sports_config", JSON.stringify(normalized));
    }
    if (blockedSports.some((id) => !supported.includes(id))) {
      const cleaned = blockedSports.filter((id) => supported.includes(id));
      setBlockedSports(cleaned);
      localStorage.setItem("thebox_blocked_sports", JSON.stringify(cleaned));
    }
  }, [isOpen, sportsConfig, blockedSports, setSportsConfig, setBlockedSports]);

  // Toggle sport blockage
  const handleToggleSportBlock = (sportId: string) => {
    let newBlocked: string[];
    if (cleanBlockedSports.includes(sportId)) {
      newBlocked = cleanBlockedSports.filter((s) => s !== sportId);
    } else {
      newBlocked = [...cleanBlockedSports, sportId];
    }
    setBlockedSports(newBlocked);

    // Update config state as well
    const updatedConfig = activeSportsConfig.map((s) => 
      s.id === sportId ? { ...s, isBlocked: newBlocked.includes(sportId) } : s
    );
    setSportsConfig(updatedConfig);

    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_blocked_sports", JSON.stringify(newBlocked));
      localStorage.setItem("thebox_sports_config", JSON.stringify(updatedConfig));
    }
  };

  // Update sport status note
  const handleUpdateSportNote = (sportId: string, note: string) => {
    const updatedConfig = activeSportsConfig.map((s) => 
      s.id === sportId ? { ...s, statusNote: note } : s
    );
    setSportsConfig(updatedConfig);
    if (typeof window !== "undefined") {
      localStorage.setItem("thebox_sports_config", JSON.stringify(updatedConfig));
    }
  };

  // Add new user from admin
  const handleCreateUserByAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) {
      alert("Veuillez renseigner le prénom, le nom et l'adresse email.");
      return;
    }

    const newProfile: CoachProfile = {
      id: `coach_admin_${Date.now()}`,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      club: newClub.trim() || "Club Indépendant",
      role: newRole,
      preferredSport: newSport,
      email: newEmail.trim()
    };

    setCoaches((prev) => [...prev, newProfile]);
    handleChangeUserPlan(newProfile.id, newPlan);

    // Reset
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewClub("");
    setIsAddUserOpen(false);

    alert(`Utilisateur ${newProfile.firstName} ${newProfile.lastName} créé avec succès sur l'offre ${newPlan.toUpperCase()} !`);
  };

  // Delete coach profile
  const handleDeleteCoach = async (coachId: string, email: string) => {
    if (isSuperAdminEmail(email)) {
      alert("Impossible de supprimer le compte Administrateur Suprême.");
      return;
    }
    if (await confirmAction({ title: "Supprimer ce compte ?", subject: email, message: "Le coach perdra l'accès à la plateforme." })) {
      setCoaches((prev) => prev.filter((c) => c.id !== coachId));
    }
  };

  // Supprime les données d'un coach en base (équipes, joueurs, matchs, notes, schémas) ; le compte est conservé
  const [deletingDataCoachId, setDeletingDataCoachId] = useState<string | null>(null);
  const handleDeleteCoachData = async (coach: CoachProfile) => {
    if (isSuperAdminEmail(coach.email)) return;
    const confirmed = await confirmAction({
      title: "Supprimer les données de ce coach ?",
      subject: `${coach.firstName} ${coach.lastName}`.trim() || coach.email,
      message:
        "Ses équipes, joueurs, matchs, notes et schémas seront définitivement effacés de la base. Son compte, sa formule et son abonnement sont conservés. Cette action est irréversible.",
      confirmLabel: "Supprimer les données",
      tone: "danger",
    });
    if (!confirmed) return;
    setDeletingDataCoachId(coach.id);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch("/api/admin/delete-coach-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ coachId: coach.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);
      setExtendNotification(`🗑️ Données de ${coach.firstName} ${coach.lastName} supprimées.`);
      setTimeout(() => setExtendNotification(null), 5000);
    } catch (e: any) {
      alert(`⚠️ ${e?.message || "La suppression des données a échoué."}`);
    } finally {
      setDeletingDataCoachId(null);
    }
  };

  // Formule effective d'un coach (les admins sont sur PRO+ par défaut)
  const planOf = (c: CoachProfile) => {
    const remotePlan = remoteById.get(c.id)?.activePlan;
    const raw = remotePlan || userPlans[c.id] || ((isSuperAdminEmail(c.email) || c.isAdmin) ? "club" : "free");
    // « pro_plus » (valeur posée pour les admins à la connexion) = PRO+
    return raw === "pro_plus" ? "club" : raw;
  };

  // Calculate statistics
  const filteredCoaches = allCoaches.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.club.toLowerCase().includes(q);
    const matchesPlan = filterPlan === "all" || planOf(c) === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const totalCoaches = allCoaches.length;
  const proCount = allCoaches.filter((c) => planOf(c) === "pro").length;
  const clubCount = allCoaches.filter((c) => planOf(c) === "club").length;
  const freeCount = totalCoaches - proCount - clubCount;
  // Tarifs en vigueur : PRO 9,90 € • PRO+ 14,90 €
  const estimatedMRR = proCount * 9.9 + clubCount * 14.9;
  const formatEuro = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }) + " €";

  // Fermeture au clavier (Échap) : sous-fenêtre d'abord, puis la console
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isAddUserOpen) setIsAddUserOpen(false);
      else if (selectedCoachForExtend) setSelectedCoachForExtend(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isAddUserOpen, selectedCoachForExtend, onClose]);

  if (!isOpen) return null;

  // ---------- Thème (clair « Modern Sleek » / sombre « cockpit ») ----------
  const th = isModernSleek
    ? {
        panel: "bg-white text-slate-900 border-slate-200",
        sidebar: "bg-slate-50 border-slate-200",
        border: "border-slate-200",
        card: "bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        cardMuted: "bg-slate-50 border-slate-200",
        text: "text-slate-900",
        sub: "text-slate-500",
        faint: "text-slate-400",
        input: "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15",
        navActive: "bg-white text-slate-900 border-slate-200 shadow-sm",
        navIdle: "text-slate-500 border-transparent hover:text-slate-900 hover:bg-white/70",
        ghostBtn: "bg-white hover:bg-slate-50 border-slate-200 text-slate-700",
        primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20",
        tableHead: "bg-slate-50/80 text-slate-500",
        rowHover: "hover:bg-slate-50/70",
        divide: "divide-slate-100",
        chip: "bg-slate-100 text-slate-600 border-slate-200",
        gold: "text-amber-600",
        goldChip: "bg-amber-50 text-amber-700 border-amber-200",
        goldTile: "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200 text-amber-600",
        accent: "text-emerald-600",
        segment: "bg-slate-100 border-slate-200",
        segmentActive: "bg-white text-slate-900 shadow-sm",
        segmentIdle: "text-slate-500 hover:text-slate-800",
        option: "",
      }
    : {
        panel: "bg-[#0a0d13] text-white border-white/[0.08]",
        sidebar: "bg-[#07090e] border-white/[0.06]",
        border: "border-white/[0.06]",
        card: "bg-white/[0.025] border-white/[0.07]",
        cardMuted: "bg-white/[0.02] border-white/[0.06]",
        text: "text-white",
        sub: "text-slate-400",
        faint: "text-slate-500",
        input: "bg-white/[0.03] border-white/10 text-white placeholder-slate-500 focus:border-[#00E599]/50 focus:ring-2 focus:ring-[#00E599]/10",
        navActive: "bg-white/[0.06] text-white border-white/10",
        navIdle: "text-slate-400 border-transparent hover:text-white hover:bg-white/[0.03]",
        ghostBtn: "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200",
        primaryBtn: "bg-[#00E599] hover:bg-[#33edad] text-[#04120c] shadow-lg shadow-[#00E599]/10",
        tableHead: "bg-white/[0.02] text-slate-500",
        rowHover: "hover:bg-white/[0.025]",
        divide: "divide-white/[0.05]",
        chip: "bg-white/[0.05] text-slate-300 border-white/10",
        gold: "text-[#e9c349]",
        goldChip: "bg-[#d4af37]/10 text-[#e9c349] border-[#d4af37]/30",
        goldTile: "bg-gradient-to-br from-[#d4af37]/25 to-[#d4af37]/5 border-[#d4af37]/30 text-[#e9c349]",
        accent: "text-[#00E599]",
        segment: "bg-white/[0.03] border-white/[0.07]",
        segmentActive: "bg-white/[0.09] text-white",
        segmentIdle: "text-slate-400 hover:text-slate-200",
        option: "[&>option]:bg-[#0f141d]",
      };

  const planLabel: Record<string, string> = { free: "Gratuit", pro: "PRO", club: "PRO+" };
  const planChip = (plan: string) =>
    plan === "club"
      ? isModernSleek ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/30"
      : plan === "pro"
        ? isModernSleek ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-sky-500/10 text-sky-300 border-sky-500/30"
        : th.chip;

  const tabMeta = {
    subscriptions: { title: "Abonnements & coachs", desc: "Suivez les formules, les périodes d'essai et gérez les comptes de la plateforme." },
    sports: { title: "Accès aux sports", desc: "Ouvrez ou verrouillez chaque sport pour le grand public." },
    privileges: { title: "Privilèges administrateur", desc: "Ce que votre compte administrateur débloque sur The Box." },
    maintenance: { title: "Mode maintenance", desc: "Fermez temporairement l'application au public pendant une mise à jour." },
  } as const;

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: string; warn?: boolean }[] = [
    { id: "subscriptions", label: "Abonnements & coachs", icon: Users, badge: String(totalCoaches) },
    { id: "sports", label: "Accès aux sports", icon: Layers, badge: blockedSportsCount > 0 ? `${blockedSportsCount} verrouillé${blockedSportsCount > 1 ? "s" : ""}` : undefined, warn: true },
    { id: "privileges", label: "Privilèges admin", icon: Crown },
    ...(canManageMaintenance
      ? [{ id: "maintenance" as const, label: "Maintenance", icon: Wrench, badge: maintenance.enabled ? "Active" : undefined, warn: true }]
      : []),
  ];

  const adminInitials = `${activeCoach.firstName?.charAt(0) || ""}${activeCoach.lastName?.charAt(0) || ""}`.toUpperCase() || "AD";
  const inputBase = `w-full rounded-xl px-3 py-2 text-xs border outline-none transition ${th.input}`;
  const labelBase = `block text-[10px] font-black uppercase tracking-[0.14em] mb-1.5 ${th.sub}`;

  const kpis = [
    { label: "Coachs inscrits", value: String(totalCoaches), hint: `${freeCount} en formule gratuite`, icon: Users, tone: isModernSleek ? "bg-sky-50 border-sky-200 text-sky-600" : "bg-sky-500/10 border-sky-500/25 text-sky-300" },
    { label: "Abonnés payants", value: String(proCount + clubCount), hint: `${proCount} PRO • ${clubCount} PRO+`, icon: CreditCard, tone: isModernSleek ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-[#00E599]/10 border-[#00E599]/25 text-[#00E599]" },
    { label: "Revenu mensuel estimé", value: formatEuro(estimatedMRR), hint: "MRR sur les tarifs en vigueur", icon: TrendingUp, tone: th.goldTile, gold: true },
    { label: "Sports verrouillés", value: String(blockedSportsCount), hint: `sur ${activeSportsConfig.length} sports`, icon: Lock, tone: isModernSleek ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-rose-500/10 border-rose-500/25 text-rose-300" },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-6 z-50 animate-fade-in backdrop-blur-md">
      <div className={`w-full max-w-7xl h-[94vh] sm:h-[90vh] rounded-[28px] border shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] flex flex-col md:flex-row overflow-hidden relative ${th.panel}`}>
        {/* Halo doré discret */}
        {!isModernSleek && (
          <div className="absolute -top-40 left-40 w-[520px] h-[320px] bg-[#d4af37]/[0.07] rounded-full blur-3xl pointer-events-none" />
        )}

        {/* ================= SIDEBAR ================= */}
        <aside className={`hidden md:flex w-64 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${th.goldTile}`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.gold}`}>The Box</p>
                <p className={`text-sm font-black ${th.text}`}>Console admin</p>
              </div>
            </div>
          </div>

          <nav className="px-3 space-y-1">
            <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>Gestion</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? th.navActive : th.navIdle}`}
                >
                  {isActive && <span className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${isModernSleek ? "bg-emerald-500" : "bg-[#00E599]"}`} />}
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? th.accent : ""}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${item.warn
                      ? isModernSleek ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-rose-500/10 text-rose-300 border-rose-500/25"
                      : th.chip
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-3">
            <div className={`p-3 rounded-2xl border ${th.card}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e9c349] to-[#b8912a] text-[#1a1300] text-xs font-black flex items-center justify-center ring-2 ring-[#d4af37]/30 shrink-0">
                  {adminInitials}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black truncate ${th.text}`}>{activeCoach.firstName} {activeCoach.lastName}</p>
                  <p className={`text-[10px] font-mono truncate ${th.sub}`}>{activeCoach.email || "admin@thebox-tactique.com"}</p>
                </div>
              </div>
              <div className={`mt-2.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${th.goldChip}`}>
                <Crown className="h-3 w-3" /> Super admin
              </div>
            </div>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="flex-1 min-w-0 flex flex-col relative z-10">
          {/* Header */}
          <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${th.border}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={`md:hidden text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${th.gold}`}>Console admin</p>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight ${th.text}`}>{tabMeta[activeTab].title}</h2>
                <p className={`text-xs mt-1 ${th.sub}`}>{tabMeta[activeTab].desc}</p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${th.ghostBtn}`}
                title="Fermer la console (Échap)"
                aria-label="Fermer la console"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Onglets mobiles */}
            <div className={`md:hidden mt-4 flex gap-1 p-1 rounded-xl border overflow-x-auto ${th.segment}`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${activeTab === item.id ? th.segmentActive : th.segmentIdle}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 space-y-5 scrollbar-thin">

            {/* ---------- TAB 1 : ABONNEMENTS ---------- */}
            {activeTab === "subscriptions" && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  {kpis.map((k) => {
                    const Icon = k.icon;
                    return (
                      <div key={k.label} className={`relative p-4 rounded-2xl border overflow-hidden ${th.card}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.sub}`}>{k.label}</p>
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${k.tone}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <p className={`text-2xl sm:text-[28px] font-black tracking-tight mt-1 tabular-nums ${k.gold ? th.gold : th.text}`}>{k.value}</p>
                        <p className={`text-[11px] mt-0.5 ${th.sub}`}>{k.hint}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Passerelle de paiement */}
                <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${th.card}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isModernSleek ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-indigo-500/10 border-indigo-500/25 text-indigo-300"}`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-black ${th.text}`}>Paiements Stripe</h4>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isModernSleek ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/25"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isModernSleek ? "bg-emerald-500" : "bg-[#00E599]"}`} />
                          Connecteur prêt
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {["/api/stripe/checkout", "/api/stripe/webhook", "/api/stripe/portal"].map((route) => (
                          <code key={route} className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border ${th.chip}`}>{route}</code>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`hidden sm:block text-right mr-2 pr-4 border-r ${th.border}`}>
                      <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.faint}`}>Tarifs</p>
                      <p className={`text-xs font-bold tabular-nums ${th.text}`}>PRO 9,90 € <span className={th.faint}>•</span> PRO+ 14,90 €</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/stripe/checkout", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              planId: "pro",
                              coachId: activeCoach?.id,
                              coachEmail: activeCoach?.email,
                              returnUrl: window.location.origin
                            }),
                          });
                          const data = await res.json();
                          if (data.url) {
                            window.open(data.url, "_blank");
                          } else {
                            alert(`Erreur de paiement : ${data.error}`);
                          }
                        } catch (err: any) {
                          alert("Erreur lors de la création de la session de test.");
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${th.primaryBtn}`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Tester le checkout
                    </button>
                    <a
                      href="https://dashboard.stripe.com/test"
                      target="_blank"
                      rel="noreferrer"
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${th.ghostBtn}`}
                    >
                      Dashboard Stripe
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Barre de contrôle */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${th.faint}`} />
                      <input
                        type="text"
                        placeholder="Rechercher un coach, un club, un email…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${inputBase} pl-9`}
                      />
                    </div>
                    <div className={`flex items-center gap-0.5 p-1 rounded-xl border ${th.segment}`}>
                      {[
                        { v: "all", l: "Tous", n: totalCoaches },
                        { v: "free", l: "Gratuit", n: freeCount },
                        { v: "pro", l: "PRO", n: proCount },
                        { v: "club", l: "PRO+", n: clubCount },
                      ].map((f) => (
                        <button
                          key={f.v}
                          type="button"
                          onClick={() => setFilterPlan(f.v)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${filterPlan === f.v ? th.segmentActive : th.segmentIdle}`}
                        >
                          {f.l}
                          <span className={`tabular-nums text-[10px] ${filterPlan === f.v ? th.accent : th.faint}`}>{f.n}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAddUserOpen(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${th.primaryBtn}`}
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter un coach
                  </button>
                </div>

                {/* Tableau des coachs */}
                <div className={`rounded-2xl border overflow-hidden ${th.card}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={`text-[10px] font-black uppercase tracking-[0.12em] border-b ${th.tableHead} ${th.border}`}>
                        <tr>
                          <th className="px-4 py-3 font-black">Coach</th>
                          <th className="px-4 py-3 font-black">Club & rôle</th>
                          <th className="px-4 py-3 font-black">Sport</th>
                          <th className="px-4 py-3 font-black">Formule</th>
                          <th className="px-4 py-3 font-black">Essai</th>
                          <th className="px-4 py-3 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${th.divide}`}>
                        {filteredCoaches.length === 0 && (
                          <tr>
                            <td colSpan={6} className={`px-4 py-12 text-center ${th.sub}`}>
                              <Search className={`h-5 w-5 mx-auto mb-2 ${th.faint}`} />
                              Aucun coach ne correspond à votre recherche.
                            </td>
                          </tr>
                        )}
                        {filteredCoaches.map((coach) => {
                          const isPixupAdmin = isSuperAdminEmail(coach.email) || Boolean(coach.isAdmin);
                          const currentPlan = planOf(coach);
                          const trialInfo = calculateTrialRemaining(coach.createdAt, coach.trialBonusDays || 0, coach.trialEndsAt);
                          const sportInfo = activeSportsConfig.find((s) => s.id === coach.preferredSport);

                          return (
                            <tr key={coach.id} className={`transition ${th.rowHover}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${isPixupAdmin
                                    ? "bg-gradient-to-br from-[#e9c349] to-[#b8912a] text-[#1a1300] ring-2 ring-[#d4af37]/30"
                                    : isModernSleek ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-white/[0.06] text-slate-200 border border-white/10"
                                    }`}>
                                    {coach.firstName.charAt(0)}{coach.lastName.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`font-bold flex items-center gap-1.5 ${th.text}`}>
                                      <span className="truncate">{coach.firstName} {coach.lastName}</span>
                                      {isPixupAdmin && (
                                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-md border ${th.goldChip}`}>
                                          <Crown className="h-2.5 w-2.5" /> ADMIN
                                        </span>
                                      )}
                                    </p>
                                    <p className={`text-[10px] font-mono truncate ${th.sub}`}>{coach.email}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <p className={`font-semibold ${th.text}`}>{coach.club}</p>
                                <p className={`text-[10px] ${th.sub}`}>{coach.role || "Coach"}</p>
                              </td>

                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold capitalize ${th.chip}`}>
                                  {sportInfo && <span aria-hidden="true">{sportInfo.icon}</span>}
                                  {sportInfo?.name || coach.preferredSport}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                <select
                                  value={currentPlan}
                                  onChange={(e) => handleChangeUserPlan(coach.id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black border outline-none transition cursor-pointer ${planChip(currentPlan)} ${th.option}`}
                                  aria-label={`Formule de ${coach.firstName} ${coach.lastName}`}
                                >
                                  <option value="free">Gratuit · 0 €</option>
                                  <option value="pro">PRO · 9,90 €/mois</option>
                                  <option value="club">PRO+ · 14,90 €/mois</option>
                                </select>
                              </td>

                              <td className="px-4 py-3">
                                {isPixupAdmin ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black ${th.goldChip}`}>
                                    Illimité
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-black tabular-nums ${trialInfo.isExpired
                                      ? isModernSleek ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-rose-500/10 text-rose-300 border-rose-500/25"
                                      : isModernSleek ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/25"
                                      }`}>
                                      <Clock className="h-3 w-3" />
                                      {trialInfo.isExpired ? "Expiré" : `${trialInfo.days} j restants`}
                                    </span>
                                    {coach.trialBonusDays ? (
                                      <p className={`text-[10px] font-bold flex items-center gap-1 ${th.gold}`}>
                                        <Gift className="h-3 w-3" /> +{coach.trialBonusDays} j offerts
                                      </p>
                                    ) : null}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedCoachForExtend(coach);
                                      setCustomDaysToAdd(7);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${th.ghostBtn} ${isModernSleek ? "hover:text-amber-700 hover:border-amber-300" : "hover:text-[#e9c349] hover:border-[#d4af37]/40"}`}
                                    title="Prolonger la période d'essai"
                                  >
                                    <Clock className="h-3.5 w-3.5" />
                                    Prolonger
                                  </button>
                                  {!isPixupAdmin && !isRemoteCoach(coach.id) && (
                                    <button
                                      onClick={() => handleDeleteCoach(coach.id, coach.email)}
                                      className={`p-1.5 rounded-lg border transition cursor-pointer ${isModernSleek
                                        ? "bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                                        : "bg-white/[0.03] border-white/10 text-slate-500 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10"
                                        }`}
                                      title="Supprimer le compte"
                                      aria-label={`Supprimer le compte de ${coach.firstName} ${coach.lastName}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {!isPixupAdmin && isRemoteCoach(coach.id) && (
                                    <button
                                      onClick={() => handleDeleteCoachData(coach)}
                                      disabled={deletingDataCoachId === coach.id}
                                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-wait ${isModernSleek
                                        ? "bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                                        : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10"
                                        }`}
                                      title="Supprimer les équipes, matchs, notes et schémas de ce coach (le compte est conservé)"
                                      aria-label={`Supprimer les données de ${coach.firstName} ${coach.lastName}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      {deletingDataCoachId === coach.id ? "Suppression…" : "Données"}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className={`px-4 py-2.5 border-t text-[10px] font-bold flex items-center justify-between gap-3 flex-wrap ${th.border} ${th.faint}`}>
                    <span>
                      {filteredCoaches.length} coach{filteredCoaches.length > 1 ? "s" : ""} affiché{filteredCoaches.length > 1 ? "s" : ""} sur {totalCoaches}
                      {remoteStatus === "ok" && ` · ${remoteProfiles.length} compte${remoteProfiles.length > 1 ? "s" : ""} en base`}
                    </span>
                    <span className="flex items-center gap-2">
                      {remoteStatus === "loading" && <span>Chargement des comptes en ligne…</span>}
                      {remoteStatus === "error" && <span className="text-rose-400">⚠️ {remoteError}</span>}
                      <button
                        type="button"
                        onClick={loadRemoteProfiles}
                        disabled={remoteStatus === "loading"}
                        className={`px-2 py-1 rounded-lg border inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50 ${th.ghostBtn}`}
                      >
                        <RotateCcw className="h-3 w-3" /> Actualiser
                      </button>
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ---------- TAB 2 : SPORTS ---------- */}
            {activeTab === "sports" && (
              <>
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${th.card}`}>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${th.goldTile}`}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="text-xs leading-relaxed">
                    <p className={`font-black ${th.text}`}>Verrouillez un sport tant qu&apos;il n&apos;est pas prêt</p>
                    <p className={th.sub}>
                      Un sport verrouillé est masqué pour les coachs. Votre compte administrateur y garde toujours accès.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {activeSportsConfig.map((sport) => {
                    const isBlocked = cleanBlockedSports.includes(sport.id);
                    return (
                      <div key={sport.id} className={`p-5 rounded-2xl border transition ${th.card} ${isBlocked ? (isModernSleek ? "!border-rose-200" : "!border-rose-500/25") : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl ${th.cardMuted}`}>
                              {sport.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`font-black text-sm ${th.text}`}>{sport.name}</h4>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md border uppercase font-black tracking-wider ${th.chip}`}>{sport.category}</span>
                              </div>
                              <p className={`text-[11px] font-bold mt-1 flex items-center gap-1.5 ${isBlocked ? (isModernSleek ? "text-rose-600" : "text-rose-300") : th.accent}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? "bg-rose-500" : isModernSleek ? "bg-emerald-500" : "bg-[#00E599]"}`} />
                                {isBlocked ? "Verrouillé pour le public" : "Ouvert au public"}
                              </p>
                            </div>
                          </div>

                          {/* Interrupteur d'accès public */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!isBlocked}
                            aria-label={`Accès public à ${sport.name}`}
                            onClick={() => handleToggleSportBlock(sport.id)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition cursor-pointer ${!isBlocked
                              ? isModernSleek ? "bg-emerald-500 border-emerald-500" : "bg-[#00E599] border-[#00E599]"
                              : isModernSleek ? "bg-slate-200 border-slate-300" : "bg-white/10 border-white/10"
                              }`}
                            title={isBlocked ? "Ouvrir ce sport au public" : "Verrouiller ce sport"}
                          >
                            <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${!isBlocked ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
                          </button>
                        </div>

                        <div className={`mt-4 pt-4 border-t ${th.border}`}>
                          <label className={labelBase}>Message affiché aux coachs</label>
                          <input
                            type="text"
                            value={sport.statusNote}
                            onChange={(e) => handleUpdateSportNote(sport.id, e.target.value)}
                            className={inputBase}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ---------- MAINTENANCE (super admin uniquement) ---------- */}
            {activeTab === "maintenance" && canManageMaintenance && (
              <>
                <div className={`p-5 rounded-2xl border ${th.card} ${maintenance.enabled ? (isModernSleek ? "!border-amber-300" : "!border-amber-500/40") : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${maintenance.enabled ? (isModernSleek ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-amber-500/10 border-amber-500/30 text-amber-300") : th.cardMuted}`}>
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-sm font-black ${th.text}`}>
                          {maintenance.enabled ? "L'application est en maintenance" : "L'application est ouverte"}
                        </p>
                        <p className={`text-[11px] mt-1 leading-relaxed ${th.sub}`}>
                          {maintenance.enabled
                            ? "Les visiteurs et les coachs voient l'écran de maintenance. Les administrateurs gardent l'accès complet."
                            : "Activez la maintenance pour afficher un écran d'attente à tous les utilisateurs, sauf aux administrateurs."}
                          {maintenance.updatedAt && (
                            <> Dernière modification : {new Date(maintenance.updatedAt).toLocaleString("fr-FR")}.</>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={maintenance.enabled}
                      aria-label="Mode maintenance"
                      disabled={isSavingMaintenance}
                      onClick={() => void handleSaveMaintenance(!maintenance.enabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition cursor-pointer disabled:opacity-50 ${maintenance.enabled
                        ? "bg-amber-500 border-amber-500"
                        : isModernSleek ? "bg-slate-200 border-slate-300" : "bg-white/10 border-white/10"
                        }`}
                      title={maintenance.enabled ? "Rouvrir l'application" : "Activer la maintenance"}
                    >
                      <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${maintenance.enabled ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
                    </button>
                  </div>

                  <div className={`mt-4 pt-4 border-t ${th.border}`}>
                    <label className={labelBase} htmlFor="maintenance-message">Message affiché aux utilisateurs</label>
                    <textarea
                      id="maintenance-message"
                      rows={3}
                      maxLength={MAINTENANCE_MESSAGE_MAX}
                      value={maintenanceDraft}
                      onChange={(e) => setMaintenanceDraft(e.target.value)}
                      placeholder={DEFAULT_MAINTENANCE_MESSAGE}
                      className={`${inputBase} resize-y`}
                    />
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className={`text-[10px] ${th.faint}`}>Laissez vide pour le message par défaut.</p>
                      {maintenance.enabled && maintenanceDraft.trim() !== maintenance.message.trim() && (
                        <button
                          type="button"
                          disabled={isSavingMaintenance}
                          onClick={() => void handleSaveMaintenance(true)}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer disabled:opacity-50 ${th.ghostBtn}`}
                        >
                          Mettre à jour le message
                        </button>
                      )}
                    </div>
                    {maintenanceError && <p className="mt-2 text-[11px] font-semibold text-rose-400">{maintenanceError}</p>}
                  </div>
                </div>
              </>
            )}

            {/* ---------- TAB 3 : PRIVILÈGES ---------- */}
            {activeTab === "privileges" && (
              <>
                <div className={`relative p-6 sm:p-7 rounded-3xl border overflow-hidden ${isModernSleek
                  ? "bg-gradient-to-br from-amber-50 via-white to-white border-amber-200"
                  : "bg-gradient-to-br from-[#d4af37]/[0.12] via-white/[0.02] to-transparent border-[#d4af37]/25"
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e9c349] to-[#b8912a] text-[#1a1300] flex items-center justify-center shadow-lg shadow-[#d4af37]/20">
                      <Crown className="h-7 w-7" />
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.gold}`}>Compte administrateur principal</p>
                      <h3 className={`text-lg font-black tracking-tight ${th.text}`}>{activeCoach.firstName} {activeCoach.lastName}</h3>
                      <p className={`text-xs font-mono ${th.sub}`}>{activeCoach.email}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: Layers, title: "Tous les sports débloqués", desc: "Football, basketball, rugby et handball, même lorsqu'ils sont verrouillés pour le public." },
                    { icon: Award, title: "Formule PRO+ offerte", desc: "Export HD, multi-terrains, playbook et toutes les fonctions avancées." },
                    { icon: Sparkles, title: "Schémas et causeries illimités", desc: "Aucune limite sur le nombre de schémas créés par jour." },
                    { icon: CreditCard, title: "Gestion centralisée des abonnements", desc: "Modification directe des formules et du statut des sports." },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.title} className={`p-4 rounded-2xl border flex items-start gap-3 ${th.card}`}>
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${th.goldTile}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-xs">
                          <p className={`font-black flex items-center gap-1.5 ${th.text}`}>
                            {f.title}
                            <CheckCircle2 className={`h-3.5 w-3.5 ${th.accent}`} />
                          </p>
                          <p className={`mt-0.5 leading-relaxed ${th.sub}`}>{f.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Toast de confirmation (prolongation / réinitialisation d'essai) */}
      {extendNotification && (
        <div className={`fixed bottom-6 right-6 z-[60] max-w-sm p-3.5 pr-2 rounded-2xl border flex items-start gap-3 text-xs font-bold animate-fade-in shadow-2xl ${th.panel}`}>
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${th.goldTile}`}>
            <Gift className="h-4 w-4" />
          </div>
          <span className={`flex-1 pt-1.5 ${th.text}`}>{extendNotification}</span>
          <button onClick={() => setExtendNotification(null)} className={`p-1 rounded-lg transition cursor-pointer ${th.faint} hover:opacity-70`} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MODAL : NOUVEAU COACH */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`max-w-md w-full rounded-3xl border shadow-2xl my-auto overflow-hidden ${th.panel}`}>
            <div className={`px-6 py-5 border-b flex items-center justify-between ${th.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isModernSleek ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-[#00E599]/10 border-[#00E599]/25 text-[#00E599]"}`}>
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`font-black text-sm ${th.text}`}>Nouveau coach</h3>
                  <p className={`text-[11px] ${th.sub}`}>Création manuelle d&apos;un compte</p>
                </div>
              </div>
              <button onClick={() => setIsAddUserOpen(false)} className={`p-2 rounded-xl border transition cursor-pointer ${th.ghostBtn}`} aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserByAdmin} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelBase}>Prénom <span className={th.accent}>*</span></label>
                  <input type="text" required value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="Prénom" className={inputBase} />
                </div>
                <div>
                  <label className={labelBase}>Nom <span className={th.accent}>*</span></label>
                  <input type="text" required value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Nom" className={inputBase} />
                </div>
              </div>

              <div>
                <label className={labelBase}>Adresse email <span className={th.accent}>*</span></label>
                <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="coach@club.com" className={inputBase} />
              </div>

              <div>
                <label className={labelBase}>Club / structure</label>
                <input type="text" value={newClub} onChange={(e) => setNewClub(e.target.value)} placeholder="Nom du club" className={inputBase} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelBase}>Formule</label>
                  <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} className={`${inputBase} font-bold cursor-pointer ${th.option}`}>
                    <option value="free">Gratuit · 0 €</option>
                    <option value="pro">PRO · 9,90 €</option>
                    <option value="club">PRO+ · 14,90 €</option>
                  </select>
                </div>
                <div>
                  <label className={labelBase}>Sport favori</label>
                  <select value={newSport} onChange={(e) => setNewSport(e.target.value)} className={`${inputBase} font-bold cursor-pointer ${th.option}`}>
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="rugby">Rugby</option>
                    <option value="handball">Handball</option>
                  </select>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-4 border-t ${th.border}`}>
                <button type="button" onClick={() => setIsAddUserOpen(false)} className={`px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}>
                  Annuler
                </button>
                <button type="submit" className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${th.primaryBtn}`}>
                  <UserPlus className="h-4 w-4" />
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : PROLONGER L'ESSAI */}
      {selectedCoachForExtend && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`max-w-lg w-full rounded-3xl border shadow-2xl my-auto overflow-hidden ${th.panel}`}>
            <div className={`px-6 py-5 border-b flex items-center justify-between ${th.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${th.goldTile}`}>
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`font-black text-sm ${th.text}`}>Prolonger la période d&apos;essai</h3>
                  <p className={`text-[11px] ${th.sub}`}>Offrir des jours d&apos;essai PRO & PRO+</p>
                </div>
              </div>
              <button onClick={() => setSelectedCoachForExtend(null)} className={`p-2 rounded-xl border transition cursor-pointer ${th.ghostBtn}`} aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Coach ciblé */}
              {(() => {
                const info = calculateTrialRemaining(selectedCoachForExtend.createdAt, selectedCoachForExtend.trialBonusDays || 0, selectedCoachForExtend.trialEndsAt);
                return (
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${th.cardMuted}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${isModernSleek ? "bg-white text-slate-700 border border-slate-200" : "bg-white/[0.06] text-slate-200 border border-white/10"}`}>
                        {selectedCoachForExtend.firstName.charAt(0)}{selectedCoachForExtend.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-black text-sm truncate ${th.text}`}>{selectedCoachForExtend.firstName} {selectedCoachForExtend.lastName}</p>
                        <p className={`text-[11px] font-mono truncate ${th.sub}`}>{selectedCoachForExtend.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.faint}`}>Essai actuel</p>
                      <p className={`text-xs font-black tabular-nums ${info.isExpired ? "text-rose-500" : th.gold}`}>
                        {info.isExpired ? "Expiré" : `${info.days} j restants`}
                      </p>
                      {selectedCoachForExtend.trialBonusDays ? (
                        <p className={`text-[10px] ${th.sub}`}>dont +{selectedCoachForExtend.trialBonusDays} j offerts</p>
                      ) : null}
                    </div>
                  </div>
                );
              })()}

              {/* Choix rapides */}
              <div>
                <label className={labelBase}>Choix rapides</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { days: 7, desc: "1 semaine" },
                    { days: 14, desc: "2 semaines" },
                    { days: 30, desc: "1 mois" },
                    { days: 60, desc: "2 mois" },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => handleApplyExtendDemo(selectedCoachForExtend.id, preset.days)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer group ${isModernSleek
                        ? "bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/60"
                        : "bg-white/[0.03] border-white/[0.08] hover:border-[#d4af37]/40 hover:bg-[#d4af37]/[0.06]"
                        }`}
                    >
                      <p className={`font-black text-sm tabular-nums ${th.text}`}>+{preset.days} j</p>
                      <p className={`text-[10px] mt-0.5 ${th.sub}`}>{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saisie libre */}
              <div>
                <label className={labelBase}>Nombre de jours sur mesure</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDaysToAdd}
                    onChange={(e) => setCustomDaysToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`${inputBase} flex-1 font-bold font-mono`}
                    placeholder="Nombre de jours"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyExtendDemo(selectedCoachForExtend.id, customDaysToAdd)}
                    className="px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap bg-gradient-to-br from-[#e9c349] to-[#c9a032] hover:brightness-105 text-[#1a1300] shadow-lg shadow-[#d4af37]/20 transition cursor-pointer"
                  >
                    Ajouter {customDaysToAdd} j
                  </button>
                </div>
              </div>

              <div className={`pt-4 border-t flex items-center justify-between gap-3 ${th.border}`}>
                <button
                  type="button"
                  onClick={() => handleResetTrial(selectedCoachForExtend.id)}
                  className={`text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${th.sub} ${isModernSleek ? "hover:text-amber-700" : "hover:text-[#e9c349]"}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Réinitialiser à 14 jours
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCoachForExtend(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
