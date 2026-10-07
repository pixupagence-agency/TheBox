"use client";

import React, { useState, useEffect } from "react";
import TacticsBoard from "@/components/TacticsBoard";
import LandingPage from "@/components/LandingPage";
import AdminPlatform, { defaultSportsConfig, SportAccessConfig } from "@/components/AdminPlatform";
import TrialCountdownModal from "@/components/TrialCountdownModal";
import OnboardingTutorialModal from "@/components/OnboardingTutorialModal";
import LegalAndFaqModal, { LegalTab } from "@/components/LegalAndFaqModal";
import SupportContactModal from "@/components/SupportContactModal";
import LogoIcon from "@/components/LogoIcon";
import { CheckCircle, Cloud } from "lucide-react";
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  saveUserProfileToFirestore, 
  getUserProfileFromFirestore,
  getTacticsForUser 
} from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface CoachProfile {
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

const defaultCoaches: CoachProfile[] = [];

export default function Home() {
  // App unified states & Plans
  const [activePlan, setActivePlan] = useState<string>("free");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Safe client-side loading states
  const [coaches, setCoaches] = useState<CoachProfile[]>(defaultCoaches);
  const [activeCoachId, setActiveCoachId] = useState<string>("");
  const [savedTactics, setSavedTactics] = useState<any[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Admin platform & Sports access control states
  const [blockedSports, setBlockedSports] = useState<string[]>([]);
  const [sportsConfig, setSportsConfig] = useState<SportAccessConfig[]>(defaultSportsConfig);
  const [isAdminPlatformOpen, setIsAdminPlatformOpen] = useState<boolean>(false);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  // Legal & FAQ Modal state
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>("faq");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [isModernSleek, setIsModernSleek] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thebox_modern_sleek");
      if (saved !== null) return saved === "true";
    }
    return true;
  });

  const handleOpenLegalModal = (tab: LegalTab = "faq") => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // New coach profile registration form states
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newClub, setNewClub] = useState("");
  const [newRole, setNewRole] = useState("Coach Principal");
  const [newPrefSport, setNewPrefSport] = useState("football");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");

  // Derived active state - compute admin status with safe fallback
  const activeCoach = coaches.find(c => c.id === activeCoachId) || coaches[0] || {
    id: "",
    firstName: "Coach",
    lastName: "Principal",
    club: "The Box FC",
    role: "Coach Principal",
    preferredSport: "football",
    email: "",
    isAdmin: false
  };
  const isAdmin = Boolean(
    activeCoach && (
      activeCoach.isAdmin ||
      activeCoach.email?.toLowerCase().includes("pixup") ||
      activeCoach.email?.toLowerCase() === "pixup.agence@gmail.com"
    )
  );

  // If user is non-admin and trying to access a blocked sport, fallback to football
  const isSelectedSportBlocked = !isAdmin && blockedSports.includes(activeCoach?.preferredSport);
  const activeSport = isSelectedSportBlocked ? "football" : (activeCoach?.preferredSport || "football");

  const setActiveSport = (sport: string) => {
    if (!isAdmin && blockedSports.includes(sport)) {
      const config = sportsConfig.find(s => s.id === sport);
      const note = config?.statusNote || "Ce sport est temporairement indisponible et bloqué par l'administration.";
      alert(`Le sport "${sport.toUpperCase()}" est actuellement restreint aux utilisateurs standard.\n\nRaison : ${note}\n\nEn tant qu'administrateur The Box, connectez-vous pour débloquer ou accéder à ce sport.`);
      return;
    }
    setCoaches((prev) => 
      prev.map((c) => (c.id === activeCoachId ? { ...c, preferredSport: sport } : c))
    );
  };

  // On mount, load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        const savedCoaches = localStorage.getItem("thebox_coaches");
        if (savedCoaches) {
          try {
            const parsed = JSON.parse(savedCoaches);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCoaches(parsed);
            }
          } catch (e) {
            console.error(e);
          }
        }

        const validSportIds = defaultSportsConfig.map(s => s.id);
        const savedBlocked = localStorage.getItem("thebox_blocked_sports");
        if (savedBlocked) {
          try {
            const parsed = JSON.parse(savedBlocked);
            if (Array.isArray(parsed)) {
              const clean = parsed.filter((id: string) => validSportIds.includes(id));
              setBlockedSports(clean);
              localStorage.setItem("thebox_blocked_sports", JSON.stringify(clean));
            }
          } catch (e) { console.error(e); }
        }

        const savedConfig = localStorage.getItem("thebox_sports_config");
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            if (Array.isArray(parsed)) {
              const clean = defaultSportsConfig.map((def) => {
                const existing = parsed.find((s: any) => s.id === def.id);
                return existing ? { ...def, ...existing } : def;
              });
              setSportsConfig(clean);
              localStorage.setItem("thebox_sports_config", JSON.stringify(clean));
            }
          } catch (e) { console.error(e); }
        }

        const savedActiveId = localStorage.getItem("thebox_active_coach_id");
        if (savedActiveId) {
          setActiveCoachId(savedActiveId);
        }

        const savedPlaybooks = localStorage.getItem("thebox_saved_playbooks");
        if (savedPlaybooks) {
          try {
            const parsed = JSON.parse(savedPlaybooks);
            if (Array.isArray(parsed)) {
              setSavedTactics(parsed);
            }
          } catch (e) {
            console.error(e);
          }
        }

        setHasLoaded(true);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, []);

  // Handle Stripe Checkout return parameters (?stripe_status=success/cancel&plan=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const stripeStatus = urlParams.get("stripe_status");
      const plan = urlParams.get("plan");

      if (stripeStatus === "success" && plan) {
        setActivePlan(plan);
        if (activeCoachId) {
          const savedPlans = localStorage.getItem("thebox_admin_user_plans");
          const parsed = savedPlans ? JSON.parse(savedPlans) : {};
          parsed[activeCoachId] = plan;
          localStorage.setItem("thebox_admin_user_plans", JSON.stringify(parsed));
        }
        alert(`🎉 Félicitations ! Votre paiement a été validé avec succès. Votre formule ${plan.toUpperCase()} est désormais active.`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (stripeStatus === "cancel") {
        alert("Paiement annulé. Vous pouvez réessayer à tout moment depuis votre espace.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [activeCoachId, setActivePlan]);

  // Sync to localStorage only after initial client hydration load completes
  useEffect(() => {
    if (hasLoaded && typeof window !== "undefined") {
      localStorage.setItem("thebox_coaches", JSON.stringify(coaches));
    }
  }, [coaches, hasLoaded]);

  useEffect(() => {
    if (hasLoaded && typeof window !== "undefined") {
      localStorage.setItem("thebox_active_coach_id", activeCoachId);
    }
  }, [activeCoachId, hasLoaded]);

  useEffect(() => {
    document.title = "The Box - Zone de décision tactique";
  }, []);

  useEffect(() => {
    if (hasLoaded && typeof window !== "undefined") {
      localStorage.setItem("thebox_saved_playbooks", JSON.stringify(savedTactics));
    }
  }, [savedTactics, hasLoaded]);

  // Trial 14 days states & Onboarding Tutorial
  const [isTrialModalOpen, setIsTrialModalOpen] = useState<boolean>(false);
  const [isNewAccountWelcome, setIsNewAccountWelcome] = useState<boolean>(false);
  const [isOnboardingTutorialOpen, setIsOnboardingTutorialOpen] = useState<boolean>(false);

  // Firebase Realtime Auth & Profile Listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const email = firebaseUser.email || "pixup.agence@gmail.com";
        const displayName = firebaseUser.displayName || "Coach Principal";
        const parts = displayName.split(" ");
        const first = parts[0] || "Coach";
        const last = parts.slice(1).join(" ") || "Principal";
        const isGoogleAdmin = Boolean(
          email.toLowerCase().includes("pixup") ||
          email.toLowerCase() === "pixup.agence@gmail.com"
        );

        // Fetch user profile from Firestore if exists
        let profileFromDb = null;
        try {
          profileFromDb = await getUserProfileFromFirestore(uid);
        } catch (e) {
          console.log("Remote user profile fetch skipped/fallback", e);
        }

        const coachData: CoachProfile = {
          id: uid,
          firstName: profileFromDb?.firstName || first,
          lastName: profileFromDb?.lastName || last,
          club: profileFromDb?.club || "The Box FC",
          role: profileFromDb?.role || (isGoogleAdmin ? "Super Admin" : "Coach Principal"),
          preferredSport: profileFromDb?.preferredSport || "football",
          email: email,
          isAdmin: Boolean(isGoogleAdmin || profileFromDb?.isAdmin),
          createdAt: profileFromDb?.createdAt || new Date().toISOString(),
          trialBonusDays: profileFromDb?.trialBonusDays || 0,
        };

        const savedPlansStr = typeof window !== "undefined" ? localStorage.getItem("thebox_admin_user_plans") : null;
        const savedPlans = savedPlansStr ? JSON.parse(savedPlansStr) : {};
        const resolvedPlan = profileFromDb?.activePlan || savedPlans[uid] || (isGoogleAdmin ? "pro_plus" : "free");
        if (resolvedPlan) {
          setActivePlan(resolvedPlan);
        }

        const isNewUser = !profileFromDb || !profileFromDb.welcomeEmailSent;

        // Persist/Update profile in Firestore
        try {
          await saveUserProfileToFirestore({
            ...coachData,
            activePlan: resolvedPlan,
            welcomeEmailSent: true,
          });
        } catch (e) {
          console.error("Error saving coach profile to Firestore:", e);
        }

        // Send welcome email if new account created
        if (isNewUser && email) {
          fetch("/api/send-welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email,
              firstName: coachData.firstName,
              lastName: coachData.lastName,
            }),
          })
            .then((res) => res.json())
            .then((data) => console.log("Welcome email sent for user:", data))
            .catch((err) => console.error("Failed to send welcome email:", err));
        }

        // Fetch tactics saved in Firestore
        try {
          const remoteTactics = await getTacticsForUser(uid);
          if (remoteTactics && remoteTactics.length > 0) {
            const parsed = remoteTactics.map((t) => {
              try {
                return JSON.parse(t.payload);
              } catch {
                return {
                  id: t.id,
                  name: t.name,
                  sport: t.sport,
                  notes: t.notes,
                  date: t.createdAt,
                };
              }
            });
            setSavedTactics(parsed);
          }
        } catch (e) {
          console.log("Could not load remote tactics:", e);
        }

        setCoaches((prev) => {
          const exists = prev.some((c) => c.id === uid);
          if (exists) {
            return prev.map((c) => (c.id === uid ? { ...c, ...coachData } : c));
          }
          return [coachData, ...prev];
        });
        setActiveCoachId(uid);
        setIsLoggedIn(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check once per day if trial countdown banner should be displayed (standard non-admin accounts only)
  useEffect(() => {
    if (hasLoaded && isLoggedIn && activeCoach) {
      const isCreatorOrAdmin = Boolean(
        isAdmin ||
        activeCoach.isAdmin ||
        activeCoach.email?.toLowerCase().includes("pixup") ||
        activeCoach.email?.toLowerCase() === "pixup.agence@gmail.com"
      );

      const isPaidUser = Boolean(
        activePlan &&
        activePlan.toLowerCase() !== "free" &&
        activePlan.toLowerCase() !== "gratuit"
      );

      // Creator/Admin account or active paid subscriber: do not show trial/popup windows
      if (isCreatorOrAdmin || isPaidUser) {
        return;
      }

      // Check if team configuration was done on first login - let user configure teams first
      const isConfigured = localStorage.getItem(`thebox_team_config_done_${activeCoach.id}`);
      if (!isConfigured || isFirstLogin) {
        return;
      }

      const todayDate = new Date().toISOString().slice(0, 10);
      const lastShownKey = `thebox_trial_last_shown_${activeCoach.id}`;
      const lastShown = localStorage.getItem(lastShownKey);

      if (lastShown !== todayDate) {
        const timer = setTimeout(() => {
          setIsNewAccountWelcome(false);
          setIsTrialModalOpen(true);
          localStorage.setItem(lastShownKey, todayDate);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [hasLoaded, isLoggedIn, activeCoachId, activeCoach, isAdmin, isFirstLogin]);

  // First connection / onboarding interactive tutorial check (skip for platform admin)
  useEffect(() => {
    if (hasLoaded && isLoggedIn && !isAdmin && typeof window !== "undefined") {
      const isConfigured = localStorage.getItem(`thebox_team_config_done_${activeCoachId}`);
      if (!isConfigured || isFirstLogin) {
        return;
      }
      const tutorialSeen = localStorage.getItem("thebox_tutorial_seen");
      if (!tutorialSeen) {
        const timer = setTimeout(() => {
          setIsOnboardingTutorialOpen(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [hasLoaded, isLoggedIn, isAdmin, activeCoachId, isFirstLogin]);

  // Auto-detect if current active coach needs first connection team config
  useEffect(() => {
    if (hasLoaded && isLoggedIn && activeCoachId && typeof window !== "undefined") {
      const isConfigured = localStorage.getItem(`thebox_team_config_done_${activeCoachId}`);
      if (!isConfigured) {
        setIsFirstLogin(true);
      }
    }
  }, [hasLoaded, isLoggedIn, activeCoachId]);

  const handleRegisterCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newClub.trim()) {
      alert("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword && newPassword !== newConfirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    const nowIso = new Date().toISOString();
    const newProfile: CoachProfile = {
      id: `coach_${Date.now()}`,
      firstName: newFirstName,
      lastName: newLastName,
      club: newClub,
      role: newRole,
      preferredSport: "football",
      email: newEmail.trim() || `${newFirstName.toLowerCase()}.${newLastName.toLowerCase()}@club.com`,
      isAdmin: false,
      createdAt: nowIso,
      trialBonusDays: 0,
    };

    const isNewAdmin = Boolean(
      newProfile.isAdmin ||
      newProfile.email.toLowerCase().includes("pixup") ||
      newProfile.email.toLowerCase() === "pixup.agence@gmail.com"
    );

    setCoaches([...coaches, newProfile]);
    setActiveCoachId(newProfile.id);
    setIsRegisterModalOpen(false);
    setIsLoggedIn(true);

    // Persist new coach profile to Firestore
    saveUserProfileToFirestore({
      ...newProfile,
      activePlan: isNewAdmin ? "pro_plus" : "free",
      welcomeEmailSent: true,
    }).catch((e) => console.log("Firestore profile sync queued:", e));

    // Send gorgeous welcome email in the background
    fetch("/api/send-welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newProfile.email,
        firstName: newProfile.firstName,
        lastName: newProfile.lastName
      })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Welcome email sent successfully:", data);
      })
      .catch((err) => {
        console.error("Failed to send welcome email:", err);
      });

    setIsFirstLogin(true);
    setIsNewAccountWelcome(false);
    setIsTrialModalOpen(false);
    const todayDate = nowIso.slice(0, 10);
    localStorage.setItem(`thebox_trial_last_shown_${newProfile.id}`, todayDate);

    // Reset form
    setNewFirstName("");
    setNewLastName("");
    setNewClub("");
    setNewRole("Coach Principal");
    setNewPrefSport("football");
    setNewEmail("");
    setNewPassword("");
    setNewConfirmPassword("");
  };

  const handleGoogleSignUp = async () => {
    try {
      const user = await loginWithGoogle();
      if (!user) return;
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(false);
      setIsLoggedIn(true);
    } catch (err) {
      console.warn("Firebase Google popup fallback:", err);
      // Fallback in case browser blocks popups
      const googleEmail = prompt("Saisissez votre adresse e-mail Google :", "coach@thebox.com");
      if (!googleEmail || !googleEmail.trim()) return;

      const emailName = googleEmail.split("@")[0] || "Coach";
      const derivedFirst = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      const nowIso = new Date().toISOString();

      const googleProfile: CoachProfile = {
        id: `coach_google_${Date.now()}`,
        firstName: derivedFirst,
        lastName: "Google",
        club: "The Box FC",
        role: "Coach Principal",
        preferredSport: "football",
        email: googleEmail.trim(),
        isAdmin: false,
        createdAt: nowIso,
        trialBonusDays: 0,
      };

      const isGoogleAdmin = Boolean(
        googleProfile.isAdmin ||
        googleProfile.email.toLowerCase().includes("pixup") ||
        googleProfile.email.toLowerCase() === "pixup.agence@gmail.com"
      );

      setCoaches([...coaches, googleProfile]);
      setActiveCoachId(googleProfile.id);
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(false);
      setIsLoggedIn(true);

      saveUserProfileToFirestore({
        ...googleProfile,
        activePlan: isGoogleAdmin ? "pro_plus" : "free",
        welcomeEmailSent: true,
      }).catch((e) => console.log("Firestore profile sync queued:", e));

      // Send gorgeous welcome email in the background
      fetch("/api/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleProfile.email,
          firstName: googleProfile.firstName,
          lastName: googleProfile.lastName
        })
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Welcome email sent successfully (Google signup):", data);
        })
        .catch((err) => {
          console.error("Failed to send welcome email:", err);
        });

      if (!isGoogleAdmin) {
        setIsNewAccountWelcome(true);
        setIsTrialModalOpen(true);
      } else {
        setIsTrialModalOpen(false);
      }
      const todayDate = nowIso.slice(0, 10);
      localStorage.setItem(`thebox_trial_last_shown_${googleProfile.id}`, todayDate);
    }
  };

  const handleLoginAsCoach = (coachId: string, sport?: string) => {
    setActiveCoachId(coachId);
    if (sport) {
      setActiveSport(sport);
    }
    const targetCoach = coaches.find((c) => c.id === coachId);
    const isTargetAdmin = Boolean(
      targetCoach?.isAdmin ||
      targetCoach?.email?.toLowerCase().includes("pixup") ||
      targetCoach?.email?.toLowerCase() === "pixup.agence@gmail.com"
    );
    if (isTargetAdmin) {
      setIsTrialModalOpen(false);
    }
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  const handleEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      alert("Veuillez saisir votre adresse email de coach.");
      return;
    }
    const matched = coaches.find(c => c.email.toLowerCase() === loginEmail.toLowerCase().trim());
    if (matched) {
      handleLoginAsCoach(matched.id, matched.preferredSport);
    } else {
      // Auto-login with default or active coach
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
    }
    setLoginEmail("");
    setLoginPassword("");
  };

  return (
    <main className="min-h-screen bg-[#07090e] text-white relative">
      
      {!isLoggedIn ? (
        <LandingPage
          coaches={coaches}
          activeCoachId={activeCoachId}
          onLoginAsCoach={handleLoginAsCoach}
          onOpenRegisterModal={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenLegalModal={handleOpenLegalModal}
          blockedSports={blockedSports}
          onOpenSupportModal={() => setIsSupportModalOpen(true)}
          isAdmin={isAdmin}
        />
      ) : (
        <TacticsBoard
          coaches={coaches}
          setCoaches={setCoaches}
          activeCoachId={activeCoachId}
          setActiveCoachId={setActiveCoachId}
          activePlan={isAdmin ? "club" : activePlan}
          setActivePlan={setActivePlan}
          savedTactics={savedTactics}
          setSavedTactics={setSavedTactics}
          activeSport={activeSport}
          setActiveSport={setActiveSport}
          setIsRegisterModalOpen={setIsRegisterModalOpen}
          onLogout={async () => {
            try {
              await logoutUser();
            } catch (err) {
              console.error("Logout error", err);
            }
            setIsLoggedIn(false);
          }}
          isAdmin={isAdmin}
          blockedSports={blockedSports}
          sportsConfig={sportsConfig}
          onOpenAdminPlatform={() => setIsAdminPlatformOpen(true)}
          onOpenTrialModal={() => {
            setIsNewAccountWelcome(false);
            setIsTrialModalOpen(true);
          }}
          onOpenTutorial={() => setIsOnboardingTutorialOpen(true)}
          onOpenLegalModal={handleOpenLegalModal}
          isFirstLogin={isFirstLogin}
          onCompleteFirstLogin={() => {
            setIsFirstLogin(false);
            if (!isAdmin) {
              setIsNewAccountWelcome(true);
              setIsTrialModalOpen(true);
            }
          }}
          onOpenSupportModal={() => setIsSupportModalOpen(true)}
        />
      )}

      {/* LEGAL & FAQ MODAL */}
      <LegalAndFaqModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        defaultTab={legalModalTab}
        onOpenSupport={() => setIsSupportModalOpen(true)}
      />

      {/* ONBOARDING TUTORIAL MODAL */}
      <OnboardingTutorialModal
        isOpen={isOnboardingTutorialOpen}
        onClose={() => setIsOnboardingTutorialOpen(false)}
        coachName={activeCoach?.firstName || "Coach"}
        sportName={activeSport}
        onCompleteTutorial={() => {
          setIsOnboardingTutorialOpen(false);
          if (typeof window !== "undefined") {
            localStorage.setItem("thebox_tutorial_seen", "true");
          }
        }}
      />

      {/* 14-DAY PRO TRIAL & COUNTDOWN MODAL */}
      <TrialCountdownModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        createdAt={activeCoach?.createdAt}
        trialBonusDays={activeCoach?.trialBonusDays || 0}
        isNewAccountWelcome={isNewAccountWelcome}
        coachName={`${activeCoach?.firstName || "Coach"}`}
        isAdmin={isAdmin}
        coachEmail={activeCoach?.email}
        onAddBonusDays={(days) => {
          if (activeCoach) {
            const updated = coaches.map((c) =>
              c.id === activeCoach.id
                ? { ...c, trialBonusDays: (c.trialBonusDays || 0) + days }
                : c
            );
            setCoaches(updated);
            if (typeof window !== "undefined") {
              localStorage.setItem("thebox_coaches", JSON.stringify(updated));
            }
          }
        }}
        onResetDemo={() => {
          if (typeof window !== "undefined") {
            localStorage.setItem("thebox_demo_init_time", String(Date.now()));
          }
          if (activeCoach) {
            const updated = coaches.map((c) =>
              c.id === activeCoach.id
                ? { ...c, createdAt: new Date().toISOString(), trialBonusDays: 0 }
                : c
            );
            setCoaches(updated);
            if (typeof window !== "undefined") {
              localStorage.setItem("thebox_coaches", JSON.stringify(updated));
            }
          }
        }}
        onOpenCheckout={() => {
          setIsTrialModalOpen(false);
          setActivePlan("pro");
          alert("Offres Pro & Pro+ : Vous bénéficiez déjà d'un accès Pro & Pro+ pendant vos 14 jours d'essai offert !");
        }}
      />

      {/* ADMIN PLATFORM MODAL */}
      <AdminPlatform
        isOpen={isAdminPlatformOpen}
        onClose={() => setIsAdminPlatformOpen(false)}
        coaches={coaches}
        setCoaches={setCoaches}
        activeCoach={activeCoach}
        blockedSports={blockedSports}
        setBlockedSports={setBlockedSports}
        sportsConfig={sportsConfig}
        setSportsConfig={setSportsConfig}
        activePlan={activePlan}
        setActivePlan={setActivePlan}
      />

      {/* SUPPORT CONTACT MODAL */}
      <SupportContactModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        userEmail={activeCoach?.email}
        userName={activeCoach?.firstName ? `${activeCoach.firstName} ${activeCoach.lastName}` : ""}
        userClub={activeCoach?.club}
        userSport={activeSport}
        userPlan={activePlan}
        isAdmin={isAdmin}
      />

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0d1117] border border-[#233149] max-w-lg w-full rounded-2xl p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto scrollbar-thin">
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1f293d]">
              <div className="flex items-center gap-3">
                <LogoIcon className="w-8 h-8 text-white" />
                <div>
                  <h3 className="text-base font-black text-white">Connexion Espace Coach</h3>
                  <p className="text-[10px] text-[#00E599] font-bold uppercase tracking-wider">the box • zone de décision tactique</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-[#121926] rounded border border-[#1f293d]"
              >
                ✕
              </button>
            </div>

            {/* Quick Profile Selection */}
            {coaches.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-black text-[#62728f] uppercase tracking-wider mb-2.5">
                  Profils Enregistrés sur cet appareil :
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {coaches.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleLoginAsCoach(c.id, c.preferredSport)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#121926] hover:bg-[#1a253a] border border-[#1f293d] hover:border-white flex items-center justify-between transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white text-[#0d1117] font-black text-xs flex items-center justify-center">
                          {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white group-hover:text-white transition">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {c.club} • <span className="capitalize text-[#00E599]">{c.preferredSport}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#00E599] text-[#0d1117] font-black px-2 py-1 rounded-lg">
                        Se connecter
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Google Fast Connect */}
            <div className="mb-4 pt-3 border-t border-[#1f293d]">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full py-2.5 px-4 rounded-xl bg-[#121926] hover:bg-[#1a253a] border border-[#233149] text-white font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer shadow hover:border-slate-500"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>Se connecter avec son adresse Google</span>
              </button>
            </div>

            {/* Form login by email */}
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-3 pt-2 border-t border-[#1f293d]">
              <p className="text-[10px] font-black text-[#62728f] uppercase tracking-wider">
                Ou connexion par Email / Mot de passe :
              </p>
              <div>
                <input
                  type="email"
                  placeholder="Adresse Email (ex: coach@club.com)"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00E599] transition"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00E599] transition"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#00E599] hover:bg-[#06b87d] text-[#0d1117] font-black text-xs transition cursor-pointer shadow"
                >
                  Connexion au Tableau
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setIsRegisterModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#121926] hover:bg-[#1a253a] border border-[#233149] text-white font-bold text-xs transition cursor-pointer"
                >
                  Créer un compte
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* COACH ONBOARDING / CREATION DE COMPTE MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0d1117] border border-[#1f293d] max-w-lg w-full rounded-2xl p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto scrollbar-thin">
            
            <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
              <span>🏟️</span> Créer un Compte Coach The Box
            </h3>
            <p className="text-[10px] text-[#62728f] mb-4 leading-relaxed font-bold uppercase">
              Configurez votre mot de passe ou utilisez directement votre adresse e-mail Google.
            </p>

            {/* Google Fast Registration Option */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full py-2.5 px-4 rounded-xl bg-[#121926] hover:bg-[#1a253a] border border-[#233149] text-white font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer shadow hover:border-slate-500"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                </svg>
                <span>S&apos;inscrire avec son adresse email Google</span>
              </button>
            </div>

            <div className="relative flex items-center my-4">
              <div className="flex-grow border-t border-[#1f293d]"></div>
              <span className="flex-shrink mx-3 text-[9px] font-black text-[#62728f] uppercase tracking-wider">
                OU CRÉER AVEC UN MOT DE PASSE
              </span>
              <div className="flex-grow border-t border-[#1f293d]"></div>
            </div>

            <form onSubmit={handleRegisterCoach} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="ex: Jean"
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00E599] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="ex: Dupont"
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00E599] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                  Club / Structure *
                </label>
                <input
                  type="text"
                  required
                  value={newClub}
                  onChange={(e) => setNewClub(e.target.value)}
                  placeholder="ex: Real Madrid, Club de Foot Local..."
                  className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00E599] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Fonction au sein du club
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599] transition font-bold"
                  >
                    <option value="Coach Principal">Coach Principal</option>
                    <option value="Entraîneur Adjoint">Entraîneur Adjoint</option>
                    <option value="Analyste Vidéo / Tactique">Analyste Vidéo / Tactique</option>
                    <option value="Préparateur Physique">Préparateur Physique</option>
                    <option value="Responsable Technique">Responsable Technique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Sport Principal
                  </label>
                  <select
                    value="football"
                    disabled
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E599] transition capitalize font-bold cursor-not-allowed opacity-95"
                    title="Seul le football est ouvert à l'inscription. Les autres sports sont bloqués."
                  >
                    <option value="football">⚽ Football (Ouvert à l&apos;essai)</option>
                    <option value="basketball" disabled>🏀 Basketball (🔒 Bloqué)</option>
                    <option value="rugby" disabled>🏉 Rugby (🔒 Bloqué)</option>
                    <option value="handball" disabled>🤾 Handball (🔒 Bloqué)</option>
                  </select>
                  <p className="text-[9px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                    <span>🔒</span>
                    <span>Tous les autres sports sont temporairement bloqués.</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                  Adresse E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ex: coach@club.com"
                  className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00E599] transition"
                />
              </div>

              {/* Password Configuration Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00E599] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#62728f] uppercase mb-1">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className="w-full bg-[#090d14] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00E599] transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#090d14] p-3 rounded-xl border border-[#1f293d] text-[10px] text-[#62728f] leading-relaxed font-bold">
                <CheckCircle className="h-4 w-4 text-[#00E599] flex-shrink-0" />
                <p>
                  En validant votre inscription, votre tableau tactique s&apos;activera immédiatement sur le sport : <span className="font-bold text-[#00E599]">Football</span>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00E599] text-[#0d1117] text-xs font-black rounded-lg transition shadow-lg cursor-pointer hover:bg-[#06b87d]"
                >
                  Créer mon Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
