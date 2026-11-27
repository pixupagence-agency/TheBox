"use client";
// Page /admin : console d'administration de la plateforme, réservée aux super admins (adresse super admin
// confirmée, ou compte inscrit dans la liste admins/). Les données restent protégées par les règles Firestore :
// ce contrôle ne fait qu'éviter d'afficher la console à un autre compte.
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ShieldAlert } from "lucide-react";
import { auth, db, getUserProfileFromFirestore } from "@/lib/firebase";
import { isSuperAdminEmail } from "@/lib/security";
import { MAINTENANCE_OFF, subscribeMaintenance, type MaintenanceState } from "@/lib/maintenance";
import { DEFAULT_SPORTS_ACCESS, subscribeSportsAccess, type SportAccessConfig } from "@/lib/sportsAccess";
import { parseStoredBoolean } from "@/lib/useStoredState";
import AdminPlatform, { ADMIN_TABS, type AdminTab } from "@/components/AdminPlatform";
import type { CoachProfile } from "@/app/page";

type Access = { state: "checking" } | { state: "signed-out" } | { state: "denied"; email: string | null } | { state: "granted"; user: User; profile: CoachProfile };

/** Super admin : adresse super admin confirmée, ou entrée dans admins/ (chacun ne peut lire que la sienne) */
async function isSuperAdmin(user: User): Promise<boolean> {
  if (user.emailVerified && isSuperAdminEmail(user.email)) return true;
  try {
    return (await getDoc(doc(db, "admins", user.uid))).exists();
  } catch {
    return false;
  }
}

async function resolveAccess(user: User | null): Promise<Access> {
  if (!user) return { state: "signed-out" };
  if (!(await isSuperAdmin(user))) return { state: "denied", email: user.email };
  const p = await getUserProfileFromFirestore(user.uid).catch(() => null);
  const [first, ...rest] = (user.displayName || "").split(" ");
  return {
    state: "granted",
    user,
    profile: {
      id: user.uid,
      firstName: p?.firstName || first || "Admin",
      lastName: p?.lastName || rest.join(" "),
      club: p?.club || "",
      role: p?.role || "Administrateur",
      preferredSport: p?.preferredSport || "football",
      email: user.email || p?.email || "",
      isAdmin: true,
      createdAt: p?.createdAt,
    },
  };
}

const readTab = (): AdminTab => {
  const tab = new URLSearchParams(window.location.search).get("tab") as AdminTab | null;
  return tab && ADMIN_TABS.includes(tab) ? tab : "dashboard";
};

/** Anciens comptes de démonstration enregistrés sur l'appareil (gérés par la console comme avant) */
const readLocalCoaches = (): CoachProfile[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem("thebox_coaches") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function AdminConsole() {
  const router = useRouter();
  const [access, setAccess] = useState<Access>({ state: "checking" });
  useEffect(() => {
    let current = 0;
    return onAuthStateChanged(auth, (user) => {
      const run = ++current;
      void resolveAccess(user).then((a) => {
        if (run === current) setAccess(a);
      });
    });
  }, []);

  // Données de la console (chargées une fois l'accès accordé)
  const granted = access.state === "granted";
  const [maintenance, setMaintenance] = useState<MaintenanceState>(MAINTENANCE_OFF);
  const [blockedSports, setBlockedSports] = useState<string[]>(DEFAULT_SPORTS_ACCESS.blockedSports);
  const [sportsConfig, setSportsConfig] = useState<SportAccessConfig[]>(DEFAULT_SPORTS_ACCESS.sportsConfig);
  useEffect(() => {
    if (!granted) return;
    const unsubs = [
      subscribeMaintenance(setMaintenance),
      subscribeSportsAccess((a) => {
        setBlockedSports(a.blockedSports);
        setSportsConfig(a.sportsConfig);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [granted]);

  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [activePlan, setActivePlan] = useState("pro_plus");
  const [isModernSleek, setIsModernSleek] = useState(false);
  const [initialTab, setInitialTab] = useState<AdminTab | null>(null);
  // Préférences de l'appareil lues à l'ouverture de la console (ajusté pendant le rendu, sans effet)
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (granted && loadedFor !== access.user.uid && typeof window !== "undefined") {
    setLoadedFor(access.user.uid);
    setCoaches(readLocalCoaches());
    setInitialTab(readTab());
    try {
      setIsModernSleek(parseStoredBoolean(localStorage.getItem("thebox_modern_sleek") ?? "") ?? false);
    } catch {
      setIsModernSleek(false);
    }
  }

  const shell = "min-h-[100dvh] flex items-center justify-center p-6 bg-[#05070b] text-slate-200";
  if (access.state === "checking") {
    return <div className={shell} role="status"><p className="text-sm font-semibold text-slate-400">Vérification de l&apos;accès…</p></div>;
  }
  if (access.state !== "granted") {
    return (
      <div className={shell}>
        <div className="max-w-sm w-full rounded-3xl border border-[#1a2130] bg-[#0b0f17] p-6 text-center space-y-4" data-testid="admin-denied">
          <ShieldAlert className="w-8 h-8 mx-auto text-amber-400" />
          <h1 className="text-lg font-black text-white">Accès réservé</h1>
          <p className="text-sm text-slate-400">
            {access.state === "signed-out"
              ? "Connectez-vous avec un compte administrateur de la plateforme."
              : `Le compte ${access.email ?? ""} n'a pas accès à la console d'administration.`}
          </p>
          <Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#00E599] px-6 text-sm font-black text-[#04120c]">
            {access.state === "signed-out" ? "Se connecter" : "Retour à l'application"}
          </Link>
        </div>
      </div>
    );
  }
  if (!initialTab) return null;

  return (
      <AdminPlatform
        isOpen
        onClose={() => router.push("/")}
        coaches={coaches}
        setCoaches={setCoaches}
        activeCoach={access.profile}
        blockedSports={blockedSports}
        setBlockedSports={setBlockedSports}
        sportsConfig={sportsConfig}
        setSportsConfig={setSportsConfig}
        activePlan={activePlan}
        setActivePlan={setActivePlan}
        isModernSleek={isModernSleek}
        maintenance={maintenance}
        initialTab={initialTab}
        onTabChange={(tab) => window.history.replaceState(null, "", tab === "dashboard" ? "/admin" : `/admin?tab=${tab}`)}
      />
  );
}
