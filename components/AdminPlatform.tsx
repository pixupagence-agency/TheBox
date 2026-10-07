"use client";

import React, { useState } from "react";
import { CoachProfile } from "@/app/page";
import { calculateTrialRemaining } from "@/components/TrialCountdownModal";
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Lock, 
  Unlock, 
  Search, 
  UserPlus, 
  TrendingUp, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Award, 
  Eye, 
  DollarSign, 
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Download,
  Clock,
  Gift,
  RotateCcw,
  Calendar,
  Plus
} from "lucide-react";

export interface SportAccessConfig {
  id: string;
  name: string;
  icon: string;
  isBlocked: boolean;
  statusNote: string;
  category: string;
}

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
    isBlocked: false,
    statusNote: "Totalement opérationnel (Lignes 3pts FIBA / NBA)",
    category: "Indoor"
  },
  {
    id: "rugby",
    name: "Rugby",
    icon: "🏉",
    isBlocked: false,
    statusNote: "Totalement opérationnel (Rugby à 15 & à 7)",
    category: "Outdoor"
  },
  {
    id: "handball",
    name: "Handball",
    icon: "🤾",
    isBlocked: false,
    statusNote: "Totalement opérationnel (40x20m avec zone 6m)",
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
}

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
  isModernSleek = false
}: AdminPlatformProps) {
  const [activeTab, setActiveTab] = useState<"subscriptions" | "sports" | "privileges">("subscriptions");
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
      initial[c.id] = c.email?.toLowerCase().includes("pixup") ? "club" : "free";
    });
    return initial;
  });

  // Handle plan change for a specific coach
  const handleChangeUserPlan = (coachId: string, plan: string) => {
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
  const handleApplyExtendDemo = (coachId: string, daysToAdd: number) => {
    if (daysToAdd <= 0) return;
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
  const handleResetTrial = (coachId: string) => {
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

  React.useEffect(() => {
    if (!isOpen) return;
    const hasUnsupported = sportsConfig.some((s) => !supportedSportIds.includes(s.id)) || sportsConfig.length !== defaultSportsConfig.length;
    if (hasUnsupported) {
      setSportsConfig(activeSportsConfig);
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_sports_config", JSON.stringify(activeSportsConfig));
      }
    }
    const hasUnsupportedBlocked = blockedSports.some((id) => !supportedSportIds.includes(id));
    if (hasUnsupportedBlocked) {
      setBlockedSports(cleanBlockedSports);
      if (typeof window !== "undefined") {
        localStorage.setItem("thebox_blocked_sports", JSON.stringify(cleanBlockedSports));
      }
    }
  }, [isOpen, sportsConfig, blockedSports]);

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
  const handleDeleteCoach = (coachId: string, email: string) => {
    if (email.toLowerCase().includes("pixup")) {
      alert("Impossible de supprimer le compte Administrateur Suprême.");
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${email} ?`)) {
      setCoaches((prev) => prev.filter((c) => c.id !== coachId));
    }
  };

  // Calculate statistics
  const filteredCoaches = coaches.filter((c) => {
    const matchesSearch = 
      c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.club.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userPlan = userPlans[c.id] || "free";
    const matchesPlan = filterPlan === "all" || userPlan === filterPlan;

    return matchesSearch && matchesPlan;
  });

  const totalCoaches = coaches.length;
  const proCount = Object.values(userPlans).filter((p) => p === "pro").length;
  const clubCount = Object.values(userPlans).filter((p) => p === "club").length;
  const freeCount = totalCoaches - proCount - clubCount;
  const estimatedMRR = proCount * 19 + clubCount * 49;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in backdrop-blur-md">
      <div className={`w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border ${
        isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
      }`}>
        
        {/* HEADER BAR */}
        <div className={`px-6 py-4 border-b flex items-center justify-between flex-wrap gap-4 ${
          isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#0f141d] border-[#1f293d] text-white"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-black tracking-wide ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                  Console Administrateur Platforme
                </h2>
                <span className="bg-amber-500/20 border border-amber-500/50 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                  👑 ADMIN SUPRÊME
                </span>
              </div>
              <p className={`text-xs font-medium flex items-center gap-2 mt-0.5 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                <span>Compte connecté :</span>
                <strong className={`font-mono ${isModernSleek ? "text-emerald-800 font-bold" : "text-[#00E599]"}`}>{activeCoach.email || "pixup.agence@gmail.com"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isModernSleek ? "bg-slate-200 border-slate-300 text-slate-700" : "bg-[#141b28] border-[#222d41] text-slate-300"
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span className="font-bold">Options Administrateur Activées (Accès Total)</span>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isModernSleek ? "bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300" : "bg-[#141b28] hover:bg-[#1e283a] text-slate-400 hover:text-white border-[#222d41]"
              }`}
              title="Fermer la console Admin"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ADMIN METRICS SUMMARY CARDS */}
        <div className={`p-4 sm:p-6 border-b grid grid-cols-2 lg:grid-cols-4 gap-3.5 ${
          isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#090c11] border-[#1a2333]"
        }`}>
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0f1522] border-[#1c273c] text-white"
          }`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Utilisateurs Inscrits</p>
              <p className={`text-2xl font-black mt-1 font-mono ${isModernSleek ? "text-slate-900" : "text-white"}`}>{totalCoaches}</p>
              <p className={`text-[10px] font-bold mt-1 ${isModernSleek ? "text-emerald-800" : "text-emerald-400"}`}>
                {proCount + clubCount} abonnés payants
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0f1522] border-[#1c273c] text-white"
          }`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Abonnements Pro & Club</p>
              <p className={`text-2xl font-black mt-1 font-mono ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`}>{proCount + clubCount}</p>
              <p className={`text-[10px] mt-1 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                {proCount} Pro • {clubCount} Club Élite
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-emerald-500/10 border-emerald-500/30 text-[#00E599]"
            }`}>
              <CreditCard className="h-5 w-5" />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0f1522] border-[#1c273c] text-white"
          }`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Revenu Estimé (MRR)</p>
              <p className="text-2xl font-black text-amber-500 mt-1 font-mono">{estimatedMRR} €<span className={`text-xs font-normal ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>/mois</span></p>
              <p className="text-[10px] text-amber-600 dark:text-amber-300 font-bold mt-1">
                Abonnements mensuels
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0f1522] border-[#1c273c] text-white"
          }`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Sports Restreints</p>
              <p className="text-2xl font-black text-rose-500 mt-1 font-mono">{blockedSportsCount}</p>
              <p className={`text-[10px] mt-1 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                sur {activeSportsConfig.length} sports disponibles
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Lock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className={`flex border-b px-6 gap-2 pt-2 ${
          isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#0d121c] border-[#1a2333]"
        }`}>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "subscriptions"
                ? "border-[#00E599] text-emerald-600 dark:text-[#00E599]"
                : isModernSleek ? "border-transparent text-slate-500 hover:text-slate-900" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Suivi des Abonnements & Coachs ({totalCoaches})</span>
          </button>

          <button
            onClick={() => setActiveTab("sports")}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "sports"
                ? "border-[#00E599] text-emerald-600 dark:text-[#00E599]"
                : isModernSleek ? "border-transparent text-slate-500 hover:text-slate-900" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Gestion des Accès Sports ({activeSportsConfig.length})</span>
            {blockedSportsCount > 0 && (
              <span className="bg-rose-500/20 text-rose-500 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {blockedSportsCount} bloqué(s)
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("privileges")}
            className={`px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "privileges"
                ? "border-[#00E599] text-emerald-600 dark:text-[#00E599]"
                : isModernSleek ? "border-transparent text-slate-500 hover:text-slate-900" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Mes Privilèges Admin</span>
          </button>
        </div>

        {/* TAB CONTENT BODY */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin ${
          isModernSleek ? "bg-slate-50 text-slate-900" : "bg-[#080b10] text-white"
        }`}>

          {/* TAB 1: SUBSCRIPTIONS & USERS MANAGEMENT */}
          {activeTab === "subscriptions" && (
            <div className="space-y-4">
              
              {/* Stripe Gateway Status Card */}
              <div className={`border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg transition ${
                isModernSleek 
                  ? "bg-white border-slate-200 text-slate-900" 
                  : "bg-gradient-to-r from-[#0d1424] to-[#070b13] border-[#1f2d45] text-white"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-[#00E599] ${
                    isModernSleek ? "bg-emerald-50 border-emerald-300" : "bg-[#00E599]/10 border-[#00E599]/30"
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-black uppercase tracking-wider ${isModernSleek ? "text-slate-900" : "text-white"}`}>Passerelle de Paiement</h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#00E599] border border-emerald-500/30">
                        Connecteur API v2025 Prêt
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                      Routes actives : <code className={isModernSleek ? "text-slate-800 bg-slate-100 px-1 py-0.5 rounded" : "text-slate-300"}>/api/stripe/checkout</code> &bull; <code className={isModernSleek ? "text-slate-800 bg-slate-100 px-1 py-0.5 rounded" : "text-slate-300"}>/api/stripe/webhook</code> &bull; <code className={isModernSleek ? "text-slate-800 bg-slate-100 px-1 py-0.5 rounded" : "text-slate-300"}>/api/stripe/portal</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="text-right hidden sm:block mr-2">
                    <span className={`text-[10px] uppercase font-bold block ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Tarifs en vigueur</span>
                    <span className={`text-xs font-bold ${isModernSleek ? "text-slate-900" : "text-white"}`}>PRO : 9.90€ &bull; PRO+ : 14.90€</span>
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
                    className="px-3 py-1.5 bg-[#00E599] hover:bg-[#06b87d] text-[#07090e] font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <span>⚡ Tester Checkout (9.90€)</span>
                  </button>

                  <a
                    href="https://dashboard.stripe.com/test"
                    target="_blank"
                    rel="noreferrer"
                    className={`px-3 py-1.5 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border ${
                      isModernSleek
                        ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900"
                        : "bg-[#162133] hover:bg-[#1e2d45] border-[#273854] text-slate-200 hover:text-white"
                    }`}
                  >
                    <span>Tableau de Bord Paiements ↗</span>
                  </a>
                </div>
              </div>

              {/* Controls bar */}
              <div className={`flex items-center justify-between gap-3 flex-wrap p-3 rounded-2xl border ${
                isModernSleek ? "bg-white border-slate-200" : "bg-[#0f1522] border-[#1c273c]"
              }`}>
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un coach, club ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#00E599] ${
                        isModernSleek ? "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400" : "bg-[#080b10] border border-[#1e293b] text-white placeholder-slate-500"
                      }`}
                    />
                  </div>

                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#00E599] ${
                      isModernSleek ? "bg-slate-50 border border-slate-300 text-slate-800" : "bg-[#080b10] border border-[#1e293b] text-slate-200"
                    }`}
                  >
                    <option value="all">Toutes les formules</option>
                    <option value="free">Gratuit (0 €)</option>
                    <option value="pro">Formule PRO (9.90 €)</option>
                    <option value="club">Formule PRO+ (14.90 €)</option>
                  </select>
                </div>

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-4 py-2 bg-[#00E599] hover:bg-[#05be80] text-[#0d1117] font-black text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-[#00e599]/10"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Ajouter un Utilisateur / Coach</span>
                </button>
              </div>

              {/* Notification Toast for Trial Extensions */}
              {extendNotification && (
                <div className="bg-gradient-to-r from-emerald-950/90 to-amber-950/90 border border-emerald-500/50 p-3.5 rounded-2xl flex items-center justify-between text-xs text-white font-bold animate-fade-in shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <Gift className="h-5 w-5 text-amber-400 shrink-0" />
                    <span>{extendNotification}</span>
                  </div>
                  <button onClick={() => setExtendNotification(null)} className="text-slate-400 hover:text-white p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Users Table */}
              <div className={`border rounded-2xl overflow-hidden shadow-xl ${
                isModernSleek ? "bg-white border-slate-200" : "bg-[#0f1522] border-[#1c273c]"
              }`}>
                <div className="overflow-x-auto">
                  <table className={`w-full text-left text-xs ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                    <thead className={`uppercase text-[10px] font-black border-b ${
                      isModernSleek ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-[#131b2c] text-slate-400 border-[#1c273c]"
                    }`}>
                      <tr>
                        <th className="px-4 py-3">Coach / Utilisateur</th>
                        <th className="px-4 py-3">Club & Rôle</th>
                        <th className="px-4 py-3">Sport Principal</th>
                        <th className="px-4 py-3">Formule d&apos;Abonnement</th>
                        <th className="px-4 py-3">Temps de Démo / Essai</th>
                        <th className="px-4 py-3 text-center">Statut Admin</th>
                        <th className="px-4 py-3 text-right">Actions Admin</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isModernSleek ? "divide-slate-200" : "divide-[#182236]"}`}>
                      {filteredCoaches.map((coach) => {
                        const isPixupAdmin = coach.email.toLowerCase().includes("pixup") || coach.email.toLowerCase() === "pixup.agence@gmail.com";
                        const currentPlan = userPlans[coach.id] || (isPixupAdmin ? "club" : "free");
                        const trialInfo = calculateTrialRemaining(coach.createdAt, coach.trialBonusDays || 0);

                        return (
                          <tr key={coach.id} className={`transition ${isModernSleek ? "hover:bg-slate-50" : "hover:bg-[#141d30]"}`}>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center ${
                                  isPixupAdmin 
                                    ? "bg-gradient-to-tr from-amber-500 to-emerald-400 text-slate-950 ring-2 ring-amber-400/50" 
                                    : "bg-[#1f2d45] text-[#00E599]"
                                }`}>
                                  {coach.firstName.charAt(0)}{coach.lastName.charAt(0)}
                                </div>
                                <div>
                                  <p className={`font-black flex items-center gap-1.5 ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                                    <span>{coach.firstName} {coach.lastName}</span>
                                    {isPixupAdmin && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.2 rounded font-bold border border-amber-500/30">
                                        ADMIN
                                      </span>
                                    )}
                                  </p>
                                  <p className={`text-[10px] font-mono ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>{coach.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <p className={`font-bold ${isModernSleek ? "text-slate-800" : "text-slate-200"}`}>{coach.club}</p>
                              <p className={`text-[10px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>{coach.role || "Coach"}</p>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="capitalize font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 px-2 py-0.5 rounded-lg text-[10px]">
                                {coach.preferredSport}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <select
                                  value={currentPlan}
                                  onChange={(e) => handleChangeUserPlan(coach.id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-black border transition cursor-pointer ${
                                    currentPlan === "club"
                                      ? "bg-emerald-950/80 border-emerald-500/60 text-[#00E599]"
                                      : currentPlan === "pro"
                                      ? "bg-blue-950/80 border-blue-500/60 text-blue-300"
                                      : isModernSleek
                                      ? "bg-slate-100 border-slate-300 text-slate-800"
                                      : "bg-[#182236] border-[#22314d] text-slate-300"
                                  }`}
                                >
                                  <option value="free">Gratuit (0 €)</option>
                                  <option value="pro">Formule PRO (9.90 €/mois)</option>
                                  <option value="club">Formule PRO+ (14.90 €/mois)</option>
                                </select>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              {isPixupAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/40">
                                  👑 VIP Illimité
                                </span>
                              ) : trialInfo.isExpired ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60">
                                    ⚠️ Expiré ({trialInfo.totalTrialDays}j max)
                                  </span>
                                  {coach.trialBonusDays ? (
                                    <p className="text-[9px] text-amber-500 font-mono font-bold flex items-center gap-0.5">
                                      <Gift className="w-2.5 h-2.5" /> +{coach.trialBonusDays}j offerts
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-[#00E599] border border-emerald-300 dark:border-emerald-500/50">
                                    <Clock className="w-3 h-3 text-emerald-600 dark:text-[#00E599]" />
                                    <span>{trialInfo.days}j restants</span>
                                  </span>
                                  {coach.trialBonusDays ? (
                                    <p className="text-[9px] text-amber-600 dark:text-amber-300 font-mono font-bold flex items-center gap-0.5 mt-0.5">
                                      <Gift className="w-2.5 h-2.5 text-amber-500" /> +{coach.trialBonusDays}j bonus ajoutés
                                    </p>
                                  ) : null}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-center">
                              {isPixupAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/40">
                                  👑 ACCÈS TOTAL
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isModernSleek ? "bg-slate-200 text-slate-600" : "bg-slate-800 text-slate-400"
                                }`}>
                                  Utilisateur Standard
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedCoachForExtend(coach);
                                    setCustomDaysToAdd(7);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-amber-500/10"
                                  title="Ajouter du temps de démo / Prolonger la période d'essai"
                                >
                                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                                  <span>+ Temps Démo</span>
                                </button>

                                {!isPixupAdmin && (
                                  <button
                                    onClick={() => handleDeleteCoach(coach.id, coach.email)}
                                    className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-900/60 text-rose-300 transition cursor-pointer"
                                    title="Supprimer l'utilisateur"
                                  >
                                    <X className="h-3.5 w-3.5" />
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
              </div>
            </div>
          )}

          {/* TAB 2: SPORTS & ACCESS MANAGEMENT */}
          {activeTab === "sports" && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isModernSleek ? "bg-amber-50/80 border-amber-200 text-amber-900" : "bg-[#0f1522] border-[#1c273c] text-white"
              }`}>
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className={`font-bold ${isModernSleek ? "text-slate-900" : "text-white"}`}>Gestion du Blocage des Sports pour les Utilisateurs Standard</p>
                  <p className={`leading-relaxed ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                    Bloquez temporairement l&apos;accès à certains sports tant qu&apos;ils ne sont pas totalement opérationnels.
                    <br />
                    <strong className="text-[#00E599]">Privilège Administrateur The Box :</strong> En tant qu&apos;administrateur, vous avez un accès permanent et illimité à TOUS les sports, même lorsqu&apos;ils sont verrouillés pour le grand public.
                  </p>
                </div>
              </div>

              {/* Grid of Sports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSportsConfig.map((sport) => {
                  const isBlocked = cleanBlockedSports.includes(sport.id);

                  return (
                    <div
                      key={sport.id}
                      className={`p-4 rounded-2xl border transition relative overflow-hidden ${
                        isBlocked
                          ? isModernSleek ? "bg-rose-50 border-rose-200 shadow-sm" : "bg-rose-950/20 border-rose-800/60 shadow-lg shadow-rose-950/20"
                          : isModernSleek ? "bg-white border-slate-200 hover:border-slate-300" : "bg-[#0f1522] border-[#1c273c] hover:border-[#273752]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl p-2 rounded-xl border ${
                            isModernSleek ? "bg-slate-100 border-slate-200 text-slate-800" : "bg-[#131b2c] border-[#1f293d]"
                          }`}>
                            {sport.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-black text-sm ${isModernSleek ? "text-slate-900" : "text-white"}`}>{sport.name}</h4>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                isModernSleek ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-[#131b2c] text-slate-400"
                              }`}>
                                {sport.category}
                              </span>
                            </div>
                            <p className={`text-[10px] font-mono mt-0.5 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>ID: {sport.id}</p>
                          </div>
                        </div>

                        {/* TOGGLE BUTTON */}
                        <button
                          onClick={() => handleToggleSportBlock(sport.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer border ${
                            isBlocked
                              ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-900/50"
                              : "bg-emerald-950/80 hover:bg-emerald-900 text-[#00E599] border-emerald-500/50"
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Lock className="h-3.5 w-3.5" />
                              <span>BLOQUÉ</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3.5 w-3.5" />
                              <span>OPÉRATIONNEL</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Note and status input */}
                      <div className={`space-y-1.5 pt-2 border-t ${isModernSleek ? "border-slate-200" : "border-[#1a2333]"}`}>
                        <label className={`block text-[10px] font-black uppercase ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                          Message de statut opérationnel (affiché aux coachs) :
                        </label>
                        <input
                          type="text"
                          value={sport.statusNote}
                          onChange={(e) => handleUpdateSportNote(sport.id, e.target.value)}
                          className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#00E599] border ${
                            isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#080b10] border-[#1e293b] text-slate-200"
                          }`}
                        />
                      </div>

                      <div className={`mt-2.5 flex items-center justify-between text-[10px] font-bold ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                        <span>Accès Grand Public : {isBlocked ? "🔴 Verrouillé" : "🟢 Autorisé"}</span>
                        <span className="text-[#00E599]">Accès Admin : 🔓 Inconditionnel</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN PRIVILEGES */}
          {activeTab === "privileges" && (
            <div className="space-y-6">
              <div className={`border p-6 rounded-2xl shadow-xl ${
                isModernSleek 
                  ? "bg-gradient-to-r from-amber-50 via-white to-emerald-50 border-amber-300/70" 
                  : "bg-gradient-to-r from-amber-950/40 via-[#0f1522] to-emerald-950/40 border-amber-500/30"
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-amber-400">
                    <Award className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className={`text-base font-black ${isModernSleek ? "text-slate-900" : "text-white"}`}>Privilèges Administrateur de la Plateforme</h3>
                    <p className={`text-xs font-bold ${isModernSleek ? "text-amber-700" : "text-amber-300"}`}>
                      Compte Administrateur Principal The Box
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    isModernSleek ? "bg-white border-slate-200" : "bg-[#080b10]/80 border-[#1f293d]"
                  }`}>
                    <CheckCircle2 className="h-5 w-5 text-[#00E599] flex-shrink-0" />
                    <div className="text-xs">
                      <p className={`font-black ${isModernSleek ? "text-slate-900" : "text-white"}`}>Déblocage Inconditionnel de Tous les Sports</p>
                      <p className={`text-[11px] ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Accès à Football, Basketball, Rugby et Handball en illimité.</p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    isModernSleek ? "bg-white border-slate-200" : "bg-[#080b10]/80 border-[#1f293d]"
                  }`}>
                    <CheckCircle2 className="h-5 w-5 text-[#00E599] flex-shrink-0" />
                    <div className="text-xs">
                      <p className={`font-black ${isModernSleek ? "text-slate-900" : "text-white"}`}>Formule Club Élite Active Gratuitement</p>
                      <p className={`text-[11px] ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Toutes les fonctionnalités avancées (Export HD, multi-terrains, Playbook) sont débloquées.</p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    isModernSleek ? "bg-white border-slate-200" : "bg-[#080b10]/80 border-[#1f293d]"
                  }`}>
                    <CheckCircle2 className="h-5 w-5 text-[#00E599] flex-shrink-0" />
                    <div className="text-xs">
                      <p className={`font-black ${isModernSleek ? "text-slate-900" : "text-white"}`}>Module de Causerie & Tactiques Illimités</p>
                      <p className={`text-[11px] ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Aucune restriction sur le nombre de schémas par jour.</p>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    isModernSleek ? "bg-white border-slate-200" : "bg-[#080b10]/80 border-[#1f293d]"
                  }`}>
                    <CheckCircle2 className="h-5 w-5 text-[#00E599] flex-shrink-0" />
                    <div className="text-xs">
                      <p className={`font-black ${isModernSleek ? "text-slate-900" : "text-white"}`}>Gestionnaire Centralisé des Abonnements</p>
                      <p className={`text-[11px] ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Modification directe des offres des utilisateurs et contrôle du statut des sports.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
          isModernSleek ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-[#0f141d] border-[#1f293d] text-slate-400"
        }`}>
          <span>The Box Platform Admin</span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 font-black rounded-xl border transition cursor-pointer ${
              isModernSleek ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300" : "bg-[#1a2333] hover:bg-[#253249] text-white border-[#222d41]"
            }`}
          >
            Fermer la Console Admin
          </button>
        </div>

      </div>

      {/* MODAL ADD USER BY ADMIN */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border ${
            isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0f1522] border-[#1c273c] text-white"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isModernSleek ? "border-slate-200" : "border-[#1c273c]"}`}>
              <h3 className={`font-black text-sm flex items-center gap-2 ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                <UserPlus className="h-4 w-4 text-[#00E599]" />
                <span>Nouveau Compte Coach (Admin)</span>
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className={`text-xs font-bold ${isModernSleek ? "text-slate-400 hover:text-slate-900" : "text-slate-400 hover:text-white"}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserByAdmin} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[10px] font-black uppercase mb-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="Prénom"
                    className={`w-full rounded-lg px-3 py-1.5 text-xs border ${
                      isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" : "bg-[#080b10] border-[#1e293b] text-white"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase mb-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Nom *</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Nom"
                    className={`w-full rounded-lg px-3 py-1.5 text-xs border ${
                      isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" : "bg-[#080b10] border-[#1e293b] text-white"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase mb-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Adresse Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="coach@club.com"
                  className={`w-full rounded-lg px-3 py-1.5 text-xs border ${
                    isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" : "bg-[#080b10] border-[#1e293b] text-white"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase mb-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Club / Structure</label>
                <input
                  type="text"
                  value={newClub}
                  onChange={(e) => setNewClub(e.target.value)}
                  placeholder="Nom du club"
                  className={`w-full rounded-lg px-3 py-1.5 text-xs border ${
                    isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" : "bg-[#080b10] border-[#1e293b] text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[10px] font-black uppercase mb-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Offre d&apos;Abonnement</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs text-emerald-600 font-bold border ${
                      isModernSleek ? "bg-slate-50 border-slate-300" : "bg-[#080b10] border-[#1e2e47]"
                    }`}
                  >
                    <option value="free">Gratuit (0 €)</option>
                    <option value="pro">Formule PRO (9.90 €)</option>
                    <option value="club">Formule PRO+ (14.90 €)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase mb-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Sport Favori</label>
                  <select
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-bold capitalize border ${
                      isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-[#080b10] border-[#1e2e47] text-white"
                    }`}
                  >
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="rugby">Rugby</option>
                    <option value="handball">Handball</option>
                  </select>
                </div>
              </div>

              <div className={`flex justify-end gap-2 pt-3 border-t ${isModernSleek ? "border-slate-200" : "border-[#1c273c]"}`}>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                    isModernSleek ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00E599] text-[#0d1117] text-xs font-black rounded-lg hover:bg-[#06b87d]"
                >
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXTEND DEMO TIME BY ADMIN */}
      {selectedCoachForExtend && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fade-in">
          <div className={`max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden border ${
            isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0f1522] border-[#1c273c] text-slate-200"
          }`}>
            
            {/* Header */}
            <div className={`flex items-start justify-between border-b pb-4 ${isModernSleek ? "border-slate-200" : "border-[#1c273c]"}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h3 className={`font-black text-base tracking-wide flex items-center gap-2 ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                    <span>Prolonger le Temps de Démo</span>
                  </h3>
                  <p className={`text-xs ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                    Offrir des jours supplémentaires d&apos;essai Pro & Pro+
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCoachForExtend(null)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Coach Card */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#080b10] border-[#1e293b]"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-black text-sm ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                    {selectedCoachForExtend.firstName} {selectedCoachForExtend.lastName}
                  </p>
                  <p className="text-xs text-[#00E599] font-mono font-bold">{selectedCoachForExtend.email}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                  isModernSleek ? "bg-white border-slate-300 text-slate-700" : "bg-[#131b2c] border-[#1f293d] text-slate-300"
                }`}>
                  {selectedCoachForExtend.club}
                </span>
              </div>

              {/* Current Status Info */}
              {(() => {
                const info = calculateTrialRemaining(selectedCoachForExtend.createdAt, selectedCoachForExtend.trialBonusDays || 0);
                return (
                  <div className={`pt-2 border-t flex items-center justify-between text-xs ${isModernSleek ? "border-slate-200" : "border-[#182236]"}`}>
                    <span className={isModernSleek ? "text-slate-600" : "text-slate-400"}>Statut d&apos;essai actuel :</span>
                    <span className={`font-black ${info.isExpired ? 'text-rose-500' : 'text-amber-600 dark:text-amber-300'}`}>
                      {info.isExpired ? 'Expiré (0j)' : `${info.days} jours restants`}
                      {selectedCoachForExtend.trialBonusDays ? ` (+${selectedCoachForExtend.trialBonusDays}j offerts)` : ''}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Quick Add Presets */}
            <div className="space-y-2">
              <label className={`block text-xs font-black uppercase tracking-wider ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                Choix Rapides d&apos;Extension de Démo :
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { days: 7, label: "+ 7 Jours", desc: "+1 semaine" },
                  { days: 14, label: "+ 14 Jours", desc: "+2 semaines" },
                  { days: 30, label: "+ 30 Jours", desc: "1 Mois VIP" },
                  { days: 60, label: "+ 60 Jours", desc: "2 Mois VIP" },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => handleApplyExtendDemo(selectedCoachForExtend.id, preset.days)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer group ${
                      isModernSleek 
                        ? "bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-400" 
                        : "bg-[#131b2c] hover:bg-amber-500/20 border-[#1f293d] hover:border-amber-500/50"
                    }`}
                  >
                    <p className={`font-black text-xs transition ${isModernSleek ? "text-slate-900 group-hover:text-amber-600" : "text-white group-hover:text-amber-300"}`}>{preset.label}</p>
                    <p className={`text-[10px] mt-0.5 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Days Input */}
            <div className={`space-y-2 pt-2 border-t ${isModernSleek ? "border-slate-200" : "border-[#1c273c]"}`}>
              <label className={`block text-xs font-black uppercase tracking-wider ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                Saisir un nombre de jours sur-mesure :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDaysToAdd}
                  onChange={(e) => setCustomDaysToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none transition border ${
                    isModernSleek ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" : "bg-[#080b10] border-[#1e293b] text-white focus:border-[#00E599]"
                  }`}
                  placeholder="Nombre de jours"
                />
                <button
                  type="button"
                  onClick={() => handleApplyExtendDemo(selectedCoachForExtend.id, customDaysToAdd)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-black rounded-xl transition shadow-lg cursor-pointer"
                >
                  Ajouter {customDaysToAdd} Jours
                </button>
              </div>
            </div>

            {/* Reset Button Option */}
            <div className={`pt-2 border-t flex items-center justify-between ${isModernSleek ? "border-slate-200" : "border-[#1c273c]"}`}>
              <button
                type="button"
                onClick={() => handleResetTrial(selectedCoachForExtend.id)}
                className={`text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isModernSleek ? "text-slate-500 hover:text-amber-600" : "text-slate-400 hover:text-amber-300"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Réinitialiser à 14 jours complets dès aujourd&apos;hui</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCoachForExtend(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  isModernSleek ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                Annuler
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
