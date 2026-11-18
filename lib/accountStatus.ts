// Statut d'accès d'un compte coach, calculé uniquement côté serveur (Admin SDK).
//
// Cycle de vie :
//  - essai de 14 jours (PRO+) à partir de la création du compte Firebase Auth, une seule fois par compte
//    et par adresse e-mail : un client qui a déjà été abonné n'y a plus droit ;
//  - abonnement PRO / PRO+ (webhook Stripe) ;
//  - sans accès (essai terminé ou abonnement arrêté) : les données du coach (équipes, joueurs, matchs,
//    notes, schémas) sont masquées dans l'application mais conservées en base ; elles reviennent
//    au retour d'un abonnement. Aucune suppression automatique.
//
// Champs écrits dans users/{uid} (interdits au client par les règles Firestore) :
//   trialEndsAt (Timestamp), hasHadSubscription, freeSince (ISO, date de perte d'accès).

import { createHash } from "crypto";
import { FieldValue, Firestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { isSuperAdminEmail } from "@/lib/security";

export const TRIAL_DAYS = 14;
export const PAID_PLANS = ["pro", "mensuel", "pro_plus", "club", "annuel"];
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AccountStatus {
  plan: string;
  isAdmin: boolean;
  isPaid: boolean;
  hasHadSubscription: boolean;
  /** Fin de l'essai (ISO) ; null si le compte n'y a pas (ou plus) droit */
  trialEndsAt: string | null;
  inTrial: boolean;
  /** Accès aux fonctions PRO et aux données enregistrées */
  hasAccess: boolean;
  /** Date de perte d'accès (ISO) */
  freeSince: string | null;
}

export const isPaidPlan = (plan: unknown) => typeof plan === "string" && PAID_PLANS.includes(plan.toLowerCase());

/** Identifiant d'une adresse e-mail ayant déjà souscrit (empêche un nouvel essai avec un compte recréé). */
const subscribedEmailId = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

export async function markEmailAsSubscribed(db: Firestore, email: string | null | undefined): Promise<void> {
  if (!email || !email.includes("@")) return;
  try {
    await db.collection("subscribedEmails").doc(subscribedEmailId(email)).set({ at: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn("[Compte] Enregistrement de l'e-mail abonné impossible :", (err as any)?.message);
  }
}

async function emailHasSubscribed(db: Firestore, email: string | null | undefined): Promise<boolean> {
  if (!email || !email.includes("@")) return false;
  try {
    return (await db.collection("subscribedEmails").doc(subscribedEmailId(email)).get()).exists;
  } catch {
    return false;
  }
}

const toMs = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof (value as any)?.toMillis === "function") return (value as any).toMillis();
  const ms = new Date(value as any).getTime();
  return isNaN(ms) ? null : ms;
};

const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());

/**
 * Recalcule le statut d'un compte, enregistre les changements dans son profil et le renvoie.
 * `data` : contenu actuel de users/{uid} (évite une lecture quand l'appelant l'a déjà).
 */
export async function refreshAccountStatus(
  db: Firestore,
  uid: string,
  data?: Record<string, any> | null
): Promise<AccountStatus | null> {
  const ref = db.collection("users").doc(uid);
  const profile = data ?? (await ref.get()).data();
  if (!profile) return null;
  const now = Date.now();

  const plan = String(profile.activePlan || "free").toLowerCase();
  const isPaid = isPaidPlan(plan);
  const email = profile.email as string | undefined;
  const isAdmin = Boolean(
    profile.isAdmin === true || isSuperAdminEmail(email) || (await db.collection("admins").doc(uid).get()).exists
  );

  const hasHadSubscription = Boolean(
    profile.hasHadSubscription === true ||
    profile.stripeSubscriptionId ||
    isPaid ||
    (await emailHasSubscribed(db, email))
  );

  // Fin d'essai : fixée une fois (création du compte Auth + 14 jours + jours offerts), modifiable par un super admin
  let trialEndMs = toMs(profile.trialEndsAt);
  if (trialEndMs === null) {
    let startMs: number | null = null;
    try {
      startMs = toMs((await getAuth().getUser(uid)).metadata.creationTime);
    } catch {
      /* compte Auth introuvable : date du profil */
    }
    startMs = startMs ?? toMs(profile.createdAt) ?? now;
    trialEndMs = startMs + (TRIAL_DAYS + (Number(profile.trialBonusDays) || 0)) * DAY_MS;
  }

  const inTrial = !hasHadSubscription && trialEndMs > now;
  const hasAccess = isAdmin || isPaid || inTrial;

  // Date de perte d'accès, conservée pour information (aucune suppression n'en découle)
  const freeSinceMs = hasAccess
    ? null
    : toMs(profile.freeSince) ?? (hasHadSubscription ? toMs(profile.accessEndsAt) ?? now : trialEndMs);

  const patch: Record<string, any> = {};
  if (toMs(profile.trialEndsAt) !== trialEndMs) patch.trialEndsAt = Timestamp.fromMillis(trialEndMs);
  if (hasHadSubscription && profile.hasHadSubscription !== true) {
    patch.hasHadSubscription = true;
    await markEmailAsSubscribed(db, email);
  }
  if (iso(freeSinceMs) !== (profile.freeSince ?? null)) patch.freeSince = freeSinceMs === null ? FieldValue.delete() : iso(freeSinceMs);
  if (Object.keys(patch).length > 0) await ref.set(patch, { merge: true });

  return {
    plan,
    isAdmin,
    isPaid,
    hasHadSubscription,
    trialEndsAt: hasHadSubscription ? null : iso(trialEndMs),
    inTrial,
    hasAccess,
    freeSince: iso(freeSinceMs),
  };
}

/** Accès aux fonctions PRO pour une route serveur (lecture seule, sans recalcul). */
export async function hasProAccess(db: Firestore, uid: string, email?: string): Promise<boolean> {
  if (isSuperAdminEmail(email)) return true;
  const profile = (await db.collection("users").doc(uid).get()).data();
  if (!profile) return false;
  if (profile.isAdmin === true || isPaidPlan(profile.activePlan)) return true;
  const trialEndMs = toMs(profile.trialEndsAt);
  if (profile.hasHadSubscription !== true && trialEndMs !== null && trialEndMs > Date.now()) return true;
  return (await db.collection("admins").doc(uid).get()).exists;
}
