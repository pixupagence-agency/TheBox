"use client";

import React, { useState, useEffect, useRef } from "react";
import TacticsBoard from "@/components/TacticsBoard";
import LandingPage from "@/components/LandingPage";
import AdminPlatform, { defaultSportsConfig, defaultBlockedSports, SportAccessConfig } from "@/components/AdminPlatform";
import TrialCountdownModal from "@/components/TrialCountdownModal";
import OnboardingTutorialModal from "@/components/OnboardingTutorialModal";
import LegalAndFaqModal, { LegalTab } from "@/components/LegalAndFaqModal";
import SupportContactModal from "@/components/SupportContactModal";
import LogoIcon from "@/components/LogoIcon";
import { CheckCircle, Cloud, X, UserPlus, LogIn, User, Mail, Lock } from "lucide-react";
import { 
  auth,
  loginWithGoogle,
  logoutUser,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  getTacticsForUser,
  registerWithEmail,
  loginWithEmail,
  resetPassword,
  getAuthErrorMessage
} from "@/lib/firebase";
import { restoreWorkspaceFromCloud, startWorkspaceSync, stopWorkspaceSync } from "@/lib/cloudSync";
import { onAuthStateChanged } from "firebase/auth";
import { isSuperAdminEmail } from "@/lib/security";
import { Language, getStoredLanguage, setStoredLanguage, translations } from "@/lib/i18n";

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
  language?: Language;
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
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  // Infos saisies à l'inscription (club, rôle, sport…) en attente de la création du compte Firebase,
  // reprises par onAuthStateChanged pour créer le profil complet en base.
  const pendingRegistrationRef = useRef<Partial<CoachProfile> | null>(null);

  // Safe client-side loading states
  const [coaches, setCoaches] = useState<CoachProfile[]>(defaultCoaches);
  const [activeCoachId, setActiveCoachId] = useState<string>("");
  const [savedTactics, setSavedTactics] = useState<any[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Admin platform & Sports access control states - only football is enabled by default
  const [blockedSports, setBlockedSports] = useState<string[]>(defaultBlockedSports);
  const [sportsConfig, setSportsConfig] = useState<SportAccessConfig[]>(defaultSportsConfig);
  const [isAdminPlatformOpen, setIsAdminPlatformOpen] = useState<boolean>(false);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  const handleOpenAdminPlatform = () => {
    setIsAdminPlatformOpen(true);
  };

  // Legal & FAQ Modal state
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>("faq");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  // Thème lu après le montage (et non au premier rendu) pour que le HTML serveur et client soient identiques
  const [isModernSleek, setIsModernSleek] = useState<boolean>(false);

  // Keep theme state synchronized with localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkTheme = () => {
      const saved = localStorage.getItem("thebox_modern_sleek");
      if (saved !== null) {
        setIsModernSleek(saved === "true");
      }
    };
    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 500);
    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

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

  // Drapeaux admin stockés localement : lus après le montage pour éviter une erreur d'hydratation
  const [hasLocalAdminFlag, setHasLocalAdminFlag] = useState(false);
  useEffect(() => {
    try {
      setHasLocalAdminFlag(localStorage.getItem("thebox_admin_mode") === "true" || localStorage.getItem("thebox_guide_admin") === "true");
    } catch {
      // stockage indisponible (navigation privée) : on garde false
    }
  }, []);

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
      activeCoach.role === "Super Admin" ||
      isSuperAdminEmail(activeCoach.email) ||
      activeCoach.email?.toLowerCase().includes("pixup") ||
      hasLocalAdminFlag
    )
  );

  const [currentSport, setCurrentSport] = useState<string>("");

  // If user is non-admin and trying to access a blocked sport, fallback to football
  const effectiveSport = currentSport || activeCoach?.preferredSport || "football";
  const isSelectedSportBlocked = !isAdmin && blockedSports.includes(effectiveSport);
  const activeSport = isSelectedSportBlocked ? "football" : effectiveSport;

  const setActiveSport = (sport: string) => {
    if (!isAdmin && blockedSports.includes(sport)) {
      const config = sportsConfig.find(s => s.id === sport);
      const note = config?.statusNote || "Ce sport est temporairement indisponible et bloqué par l'administration.";
      alert(`Le sport "${sport.toUpperCase()}" est actuellement restreint aux utilisateurs standard.\n\nRaison : ${note}\n\nEn tant qu'administrateur The Box, connectez-vous pour débloquer ou accéder à ce sport.`);
      return;
    }
    setCurrentSport(sport);
    setCoaches((prev) => {
      const targetId = activeCoachId || activeCoach?.id;
      if (!targetId || prev.length === 0) {
        return [{ ...activeCoach, preferredSport: sport }];
      }
      return prev.map((c) => (c.id === targetId ? { ...c, preferredSport: sport } : c));
    });
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
        const hasInitSportsV2 = localStorage.getItem("thebox_sports_default_v2");
        if (!hasInitSportsV2) {
          localStorage.setItem("thebox_sports_default_v2", "true");
          setBlockedSports(defaultBlockedSports);
          localStorage.setItem("thebox_blocked_sports", JSON.stringify(defaultBlockedSports));
          setSportsConfig(defaultSportsConfig);
          localStorage.setItem("thebox_sports_config", JSON.stringify(defaultSportsConfig));
        } else {
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
    const lang = getStoredLanguage();
    document.title = translations[lang].appTitle;
    document.documentElement.lang = lang;

    const handleLangChange = (e: any) => {
      const newLang = e.detail?.language as Language;
      if (newLang) {
        document.title = translations[newLang].appTitle;
        document.documentElement.lang = newLang;
      }
    };
    window.addEventListener("thebox_language_change", handleLangChange);
    return () => window.removeEventListener("thebox_language_change", handleLangChange);
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
        const email = firebaseUser.email || "";

        // Restauration des équipes, effectifs, matchs… du compte (en parallèle du chargement du profil).
        // Elle doit être terminée avant l'ouverture du tableau, qui lit ces données à son démarrage.
        const workspaceRestore = restoreWorkspaceFromCloud(uid).catch((e) =>
          console.warn("[Synchro en ligne] Restauration impossible, utilisation des données de l'appareil :", e?.code || e?.message || e)
        );
        const displayName = firebaseUser.displayName || "Coach Principal";
        const parts = displayName.split(" ");
        const first = parts[0] || "Coach";
        const last = parts.slice(1).join(" ") || "Principal";
        const isGoogleAdmin = Boolean(
          isSuperAdminEmail(email)
        );

        // Fetch user profile from Firestore if exists
        let profileFromDb = null;
        try {
          profileFromDb = await getUserProfileFromFirestore(uid);
        } catch (e) {
          console.log("Remote user profile fetch skipped/fallback", e);
        }

        const resolvedLang: Language = profileFromDb?.language || getStoredLanguage();
        if (profileFromDb?.language) {
          setStoredLanguage(profileFromDb.language);
        }

        // Infos saisies dans le formulaire d'inscription (compte e-mail tout juste créé)
        const pending = pendingRegistrationRef.current;
        pendingRegistrationRef.current = null;

        const coachData: CoachProfile = {
          id: uid,
          firstName: profileFromDb?.firstName || pending?.firstName || first,
          lastName: profileFromDb?.lastName || pending?.lastName || last,
          club: profileFromDb?.club || pending?.club || "The Box FC",
          role: profileFromDb?.role || pending?.role || (isGoogleAdmin ? "Super Admin" : "Coach Principal"),
          preferredSport: profileFromDb?.preferredSport || pending?.preferredSport || "football",
          email: email,
          isAdmin: Boolean(isGoogleAdmin || profileFromDb?.isAdmin),
          createdAt: profileFromDb?.createdAt || new Date().toISOString(),
          trialBonusDays: profileFromDb?.trialBonusDays || 0,
          language: resolvedLang,
        };

        // La formule vient uniquement de la base (écrite par le webhook Stripe), jamais du navigateur
        const resolvedPlan = profileFromDb?.activePlan || (isGoogleAdmin ? "pro_plus" : "free");
        if (resolvedPlan) {
          setActivePlan(resolvedPlan);
        }

        const isNewUser = !profileFromDb || !profileFromDb.welcomeEmailSent;

        // Persist/Update profile in Firestore
        try {
          // welcomeEmailSent n'est volontairement pas écrit ici : il ne passe à true qu'après un envoi réussi.
          await saveUserProfileToFirestore({
            ...coachData,
            activePlan: resolvedPlan,
          });
        } catch (e) {
          console.error("Error saving coach profile to Firestore:", e);
        }

        // Send welcome email if new account created (retried at next login if the send failed)
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
            .then(async (res) => {
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data?.success) {
                throw new Error(data?.error || `HTTP ${res.status}`);
              }
              console.log("Welcome email sent for user:", data);
              await saveUserProfileToFirestore({
                ...coachData,
                activePlan: resolvedPlan,
                welcomeEmailSent: true,
              });
            })
            .catch((err) => console.error("Failed to send welcome email (will retry at next login):", err));
        }

        // Fetch tactics saved in Firestore
        try {
          // Appareil utilisé auparavant par un autre compte : ses schémas locaux ne sont pas repris
          const restoreResult = await workspaceRestore;
          const deviceUsedByOtherAccount = Boolean(restoreResult && restoreResult.ownerChanged);
          if (deviceUsedByOtherAccount) {
            setSavedTactics([]);
          }

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
            // Fusion avec les schémas déjà présents sur l'appareil (au lieu de les remplacer) :
            // la version en ligne fait foi, mais on garde l'image d'aperçu locale (non stockée en ligne)
            // et les schémas qui n'existent que sur cet appareil.
            setSavedTactics((local) => {
              const localById = new Map((Array.isArray(local) ? local : []).map((s: any) => [s?.id, s]));
              const remoteIds = new Set(parsed.map((s: any) => s?.id));
              const merged = parsed.map((remote: any) => {
                const localCopy = localById.get(remote?.id);
                return localCopy?.previewImage && !remote.previewImage
                  ? { ...remote, previewImage: localCopy.previewImage }
                  : remote;
              });
              const localOnly = (Array.isArray(local) ? local : []).filter((s: any) => s?.id && !remoteIds.has(s.id));
              const idTime = (s: any) => Number(String(s?.id || "").replace(/\D/g, "")) || 0;
              return [...localOnly, ...merged].sort((a, b) => idTime(b) - idTime(a));
            });
          }
        } catch (e) {
          console.log("Could not load remote tactics:", e);
        }

        await workspaceRestore;
        startWorkspaceSync(uid);

        setCoaches((prevAll) => {
          // L'ancien profil local (« coach_… ») avec la même adresse est remplacé par le vrai compte
          const sameEmail = (coachData.email || "").toLowerCase();
          const prev = prevAll.filter(
            (c) => !(c.id.startsWith("coach_") && sameEmail && c.email?.toLowerCase() === sameEmail)
          );
          const exists = prev.some((c) => c.id === uid);
          if (exists) {
            return prev.map((c) => (c.id === uid ? { ...c, ...coachData } : c));
          }
          return [coachData, ...prev];
        });
        setActiveCoachId(uid);
        setIsLoggedIn(true);
      } else {
        void stopWorkspaceSync();
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
        isSuperAdminEmail(activeCoach.email)
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
  }, [hasLoaded, isLoggedIn, activeCoachId, activeCoach, isAdmin, isFirstLogin, activePlan]);

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

  const handleRegisterCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newClub.trim() || !newEmail.trim()) {
      alert("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== newConfirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    const resolvedSport = (!blockedSports.includes(newPrefSport) ? newPrefSport : "football");

    // Repris par onAuthStateChanged : création du profil complet en base + e-mail de bienvenue
    pendingRegistrationRef.current = {
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      club: newClub.trim(),
      role: newRole,
      preferredSport: resolvedSport,
    };

    setIsAuthSubmitting(true);
    try {
      const user = await registerWithEmail(
        newEmail.trim(),
        newPassword,
        `${newFirstName.trim()} ${newLastName.trim()}`
      );

      setActiveSport(resolvedSport);
      setIsRegisterModalOpen(false);
      setIsFirstLogin(true);
      setIsNewAccountWelcome(false);
      setIsTrialModalOpen(false);
      localStorage.setItem(`thebox_trial_last_shown_${user.uid}`, new Date().toISOString().slice(0, 10));

      // Reset form
      setNewFirstName("");
      setNewLastName("");
      setNewClub("");
      setNewRole("Coach Principal");
      setNewPrefSport("football");
      setNewEmail("");
      setNewPassword("");
      setNewConfirmPassword("");
    } catch (err: any) {
      pendingRegistrationRef.current = null;
      console.error("Création de compte impossible:", err);
      alert(getAuthErrorMessage(err));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const user = await loginWithGoogle();
      if (!user) return; // redirection Google en cours (popup bloquée)
      // L'ouverture du tableau est faite par onAuthStateChanged, une fois les données du compte restaurées
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(false);
    } catch (err: any) {
      // Fenêtre fermée par l'utilisateur : rien à signaler
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") return;
      console.warn("Connexion Google impossible:", err);
      if (err?.code !== "auth/unauthorized-domain") {
        alert("Connexion Google impossible pour le moment. Réessayez, ou utilisez votre e-mail et votre mot de passe.");
      }
    }
  };

  const handleLoginAsCoach = (coachId: string, sport?: string) => {
    // Profil déjà connecté sur cet appareil : accès direct.
    // Sinon, on pré-remplit l'e-mail : le mot de passe est obligatoire.
    if (auth.currentUser?.uid !== coachId) {
      const target = coaches.find((c) => c.id === coachId);
      if (target?.email) setLoginEmail(target.email);
      return;
    }
    setActiveCoachId(coachId);
    if (sport) {
      setActiveSport(sport);
    }
    const targetCoach = coaches.find((c) => c.id === coachId);
    const isTargetAdmin = Boolean(
      targetCoach?.isAdmin ||
      isSuperAdminEmail(targetCoach?.email)
    );
    if (isTargetAdmin) {
      setIsTrialModalOpen(false);
    }
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      alert("Veuillez saisir votre adresse e-mail et votre mot de passe.");
      return;
    }
    setIsAuthSubmitting(true);
    try {
      // onAuthStateChanged charge ensuite le profil, les schémas et ouvre l'application
      await loginWithEmail(loginEmail, loginPassword);
      setIsLoginModalOpen(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (err: any) {
      console.error("Connexion impossible:", err);
      // Profil créé avant les comptes sécurisés (id local « coach_… ») : aucun compte Firebase n'existe encore
      const legacyProfile =
        err?.code === "auth/invalid-credential" || err?.code === "auth/user-not-found"
          ? coaches.find(
              (c) =>
                c.id.startsWith("coach_") &&
                c.email?.toLowerCase() === loginEmail.trim().toLowerCase()
            )
          : undefined;
      if (legacyProfile) {
        alert(
          "Ce profil a été créé avant la mise en place des comptes sécurisés : il n'a pas encore de mot de passe.\n\n" +
          "Créez votre compte avec la même adresse e-mail (vos informations sont pré-remplies), puis choisissez votre mot de passe."
        );
        setNewFirstName(legacyProfile.firstName || "");
        setNewLastName(legacyProfile.lastName || "");
        setNewClub(legacyProfile.club || "");
        if (legacyProfile.role) setNewRole(legacyProfile.role as any);
        if (legacyProfile.preferredSport) setNewPrefSport(legacyProfile.preferredSport as any);
        setNewEmail(legacyProfile.email);
        setNewPassword(loginPassword);
        setNewConfirmPassword("");
        setIsLoginModalOpen(false);
        setIsRegisterModalOpen(true);
        return;
      }
      alert(getAuthErrorMessage(err));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = loginEmail.trim() || prompt("Saisissez l'adresse e-mail de votre compte :", "")?.trim();
    if (!email) return;
    try {
      await resetPassword(email);
    } catch (err: any) {
      // On ne révèle pas si l'adresse existe ou non (sauf adresse invalide)
      if (err?.code === "auth/invalid-email" || err?.code === "auth/too-many-requests") {
        alert(getAuthErrorMessage(err));
        return;
      }
      console.warn("Réinitialisation du mot de passe:", err);
    }
    alert(`Si un compte existe pour ${email}, un e-mail de réinitialisation du mot de passe vient d'être envoyé.`);
  };

  return (
    <main className="premium-shell min-h-screen text-white relative">
      
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
              // Dernier envoi des changements en attente avant de perdre la connexion au compte
              await stopWorkspaceSync();
              await logoutUser();
            } catch (err) {
              console.error("Logout error", err);
            }
            setIsLoggedIn(false);
          }}
          isAdmin={isAdmin}
          blockedSports={blockedSports}
          sportsConfig={sportsConfig}
          onOpenAdminPlatform={handleOpenAdminPlatform}
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
        onOpenSupport={() => {
          // Le support prend le relais : on ferme la FAQ pour qu'il soit seul au premier plan
          setIsLegalModalOpen(false);
          setIsSupportModalOpen(true);
        }}
        isModernSleek={isModernSleek}
      />

      {/* ONBOARDING TUTORIAL MODAL */}
      <OnboardingTutorialModal
        isOpen={isOnboardingTutorialOpen}
        onClose={() => setIsOnboardingTutorialOpen(false)}
        coachName={activeCoach?.firstName || "Coach"}
        sportName={activeSport}
        isModernSleek={isModernSleek}
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
        isModernSleek={isModernSleek}
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
        isModernSleek={isModernSleek}
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
        isModernSleek={isModernSleek}
      />

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
          <div className={`max-w-lg w-full rounded-2xl sm:rounded-3xl shadow-2xl relative my-auto overflow-hidden border ${
            isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
          }`}>
            {/* Glow visual accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* HEADER */}
            <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between relative z-10 ${
              isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#0f141d] border-[#1f293d] text-white"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-gradient-to-br from-[#00E599]/20 to-cyan-500/20 border-[#00E599]/40 text-[#00E599]"
                }`}>
                  <LogoIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-black tracking-wide ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                      Connexion Espace Coach
                    </h3>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-[#00E599]/15 border-[#00E599]/40 text-[#00E599]"
                    }`}>
                      THE BOX
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                    Zone de décision tactique et gestion d&apos;équipe.
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
                }`}
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 relative z-10 space-y-4">
              {/* Google Fast Connect */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs border ${
                    isModernSleek 
                      ? "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800 hover:border-slate-400" 
                      : "bg-[#121926] hover:bg-[#1a253a] border-[#233149] text-white hover:border-slate-500"
                  }`}
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
              <form onSubmit={handleEmailPasswordSubmit} className="space-y-3 pt-2">
                <div className="relative flex items-center my-1">
                  <div className={`flex-grow border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}></div>
                  <span className={`flex-shrink mx-3 text-[9px] font-black uppercase tracking-wider ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                    OU AVEC IDENTIFIANTS
                  </span>
                  <div className={`flex-grow border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}></div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Adresse Email</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="coach@club.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                      isModernSleek 
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white" 
                        : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mot de passe</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                      isModernSleek
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white"
                        : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className={`mt-1.5 text-[11px] font-bold underline-offset-2 hover:underline cursor-pointer ${isModernSleek ? "text-emerald-700" : "text-[#00E599]"}`}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* ACTIONS */}
                <div className={`pt-3 flex items-center justify-between gap-3 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginModalOpen(false);
                      setIsRegisterModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#161c28] hover:bg-[#1e2738] text-white font-bold text-xs transition border border-[#233149] cursor-pointer"
                  >
                    Créer un compte
                  </button>

                  <button
                    type="submit"
                    disabled={isAuthSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E599] to-[#06b87d] hover:brightness-110 text-[#07090e] font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#00E599]/20 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isAuthSubmitting ? "Connexion..." : "Connexion"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* COACH ONBOARDING / CREATION DE COMPTE MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
          <div className={`max-w-lg w-full rounded-2xl sm:rounded-3xl shadow-2xl relative my-auto overflow-hidden border ${
            isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
          }`}>
            {/* Glow visual accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* HEADER */}
            <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between relative z-10 ${
              isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#0f141d] border-[#1f293d] text-white"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-gradient-to-br from-[#00E599]/20 to-cyan-500/20 border-[#00E599]/40 text-[#00E599]"
                }`}>
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-black tracking-wide ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                      Créer un Compte Coach
                    </h3>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-[#00E599]/15 border-[#00E599]/40 text-[#00E599]"
                    }`}>
                      14J OFFERTS
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                    Accès immédiat au tableau tactique The Box.
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
                }`}
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 relative z-10 space-y-4">
              {/* Google Fast Registration Option */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className={`w-full py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs ${
                    isModernSleek 
                      ? "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800 hover:border-slate-400" 
                      : "bg-[#121926] hover:bg-[#1a253a] border-[#233149] text-white hover:border-slate-500"
                  }`}
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

              <div className="relative flex items-center my-2">
                <div className={`flex-grow border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}></div>
                <span className={`flex-shrink mx-3 text-[9px] font-black uppercase tracking-wider ${isModernSleek ? "text-slate-500" : "text-[#62728f]"}`}>
                  OU CRÉER AVEC UN MOT DE PASSE
                </span>
                <div className={`flex-grow border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}></div>
              </div>

              <form onSubmit={handleRegisterCoach} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Prénom <span className="text-[#00E599]">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="Jean"
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                        isModernSleek 
                          ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white" 
                          : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nom <span className="text-[#00E599]">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Dupont"
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                        isModernSleek 
                          ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white" 
                          : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                    Club / Structure <span className="text-[#00E599]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newClub}
                    onChange={(e) => setNewClub(e.target.value)}
                    placeholder="The Box FC, Club Sportif..."
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                      isModernSleek 
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white" 
                        : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                      Fonction au club
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition font-bold border ${
                        isModernSleek 
                          ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" 
                          : "bg-[#121824] border-[#233149] text-white focus:border-[#00E599]"
                      }`}
                    >
                      <option value="Coach Principal">Coach Principal</option>
                      <option value="Entraîneur Adjoint">Entraîneur Adjoint</option>
                      <option value="Analyste Vidéo / Tactique">Analyste Vidéo / Tactique</option>
                      <option value="Préparateur Physique">Préparateur Physique</option>
                      <option value="Responsable Technique">Responsable Technique</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                      Sport Principal
                    </label>
                    <select
                      value={newPrefSport}
                      onChange={(e) => setNewPrefSport(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition capitalize font-bold border ${
                        isModernSleek 
                          ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500" 
                          : "bg-[#121824] border-[#233149] text-white focus:border-[#00E599]"
                      }`}
                    >
                      <option value="football">⚽ Football {!blockedSports.includes("football") ? "(Disponible)" : "(🔒 Bloqué)"}</option>
                      <option value="basketball" disabled={blockedSports.includes("basketball")}>
                        🏀 Basketball {blockedSports.includes("basketball") ? "(🔒 Sur activation admin)" : "(Disponible)"}
                      </option>
                      <option value="rugby" disabled={blockedSports.includes("rugby")}>
                        🏉 Rugby {blockedSports.includes("rugby") ? "(🔒 Sur activation admin)" : "(Disponible)"}
                      </option>
                      <option value="handball" disabled={blockedSports.includes("handball")}>
                        🤾 Handball {blockedSports.includes("handball") ? "(🔒 Sur activation admin)" : "(Disponible)"}
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                    <Mail className="w-3.5 h-3.5 text-[#00E599]" />
                    <span>Adresse E-mail <span className="text-[#00E599]">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="coach@monclub.com"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                      isModernSleek 
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white" 
                        : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                    }`}
                  />
                </div>

                {/* Password Configuration Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mot de passe <span className="text-[#00E599]">*</span></span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Min. 6 caractères"
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                        isModernSleek 
                          ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white" 
                          : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Confirmation <span className="text-[#00E599]">*</span></span>
                    </label>
                    <input
                      type="password"
                      required
                      value={newConfirmPassword}
                      onChange={(e) => setNewConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                        isModernSleek 
                          ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white" 
                          : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                      }`}
                    />
                  </div>
                </div>

                <div className={`rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs border ${
                  isModernSleek 
                    ? "bg-slate-50 border-slate-200 text-slate-700" 
                    : "bg-[#121824] border-[#1f293d] text-slate-400"
                }`}>
                  <CheckCircle className="h-4 w-4 text-[#00E599] flex-shrink-0" />
                  <p>
                    Sport sélectionné : <strong className={isModernSleek ? "text-slate-900 capitalize" : "text-white capitalize"}>{newPrefSport}</strong>
                    {blockedSports.includes(newPrefSport) ? " (basculé automatiquement sur Football car réservé à l'admin)" : " (prêt immédiatement)"}.
                  </p>
                </div>

                {/* ACTIONS */}
                <div className={`pt-3 flex items-center justify-between gap-3 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#161c28] hover:bg-[#1e2738] text-white font-bold text-xs transition border border-[#233149] cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E599] to-[#06b87d] hover:brightness-110 text-[#07090e] font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#00E599]/20 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAuthSubmitting ? "Création..." : "Créer mon Compte"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
