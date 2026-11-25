// Suppression des données d'un coach, sur demande uniquement (aucune suppression automatique) :
//  - par le coach lui-même : compte complet (données, profil, identifiants de connexion).
//    Avec un abonnement payé en cours, la suppression est programmée à la fin de la période déjà payée :
//    l'abonnement n'est pas renouvelé, le coach garde l'accès jusque-là, puis le compte est supprimé
//    (webhook Stripe customer.subscription.deleted, ou à défaut à la connexion suivant l'échéance).
//    Sans abonnement payé en cours, la suppression est immédiate ;
//  - par un super admin : données seules (le compte et l'abonnement restent actifs).
//
// Conservés après la suppression d'un compte (obligations légales / prévention des abus, voir CGU) :
//  - les factures et paiements chez Stripe (obligation comptable) ;
//  - une empreinte (hash SHA-256) de l'adresse e-mail des anciens abonnés (subscribedEmails),
//    qui empêche de réobtenir l'essai gratuit avec un compte recréé.

import { FieldValue, Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";
import { getStripe, getSubscriptionAccessEnd } from "@/lib/stripe";
import { isSuperAdminEmail } from "@/lib/security";

/** Sous-collections de users/{uid} contenant les données du coach */
const COACH_DATA_COLLECTIONS = ["teams", "players", "matches", "matchData", "settings", "schemas"];

/** Supprime équipes, joueurs, matchs, notes, schémas et lives du coach (y compris les anciennes structures). */
export async function deleteCoachData(db: Firestore, uid: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  for (const coll of COACH_DATA_COLLECTIONS) {
    await db.recursiveDelete(userRef.collection(coll));
  }
  await db.recursiveDelete(db.collection("userData").doc(uid));
  for (const legacy of ["tactics", "matches"]) {
    const snap = await db.collection(legacy).where("userId", "==", uid).get();
    for (const doc of snap.docs) await db.recursiveDelete(doc.ref);
  }
  await deleteCoachLiveData(db, uid);
}

/**
 * Données publiques du mode Live (RGPD, droit à l'effacement) : matchs publiés et leurs actions de
 * télécommande, accès adjoints, page du club et son index de matchs.
 */
export async function deleteCoachLiveData(db: Firestore, uid: string): Promise<void> {
  const matches = await db.collection("liveMatches").where("ownerUid", "==", uid).get();
  for (const doc of matches.docs) await db.recursiveDelete(doc.ref); // + sous-collection commands
  const keys = await db.collection("liveEditorKeys").where("ownerUid", "==", uid).get();
  for (const doc of keys.docs) await doc.ref.delete();
  const clubs = await db.collection("liveClubs").where("ownerUid", "==", uid).get();
  for (const doc of clubs.docs) await db.recursiveDelete(doc.ref); // + sous-collection matches
}

/** Résilie immédiatement les abonnements Stripe en cours du coach (aucun nouveau prélèvement). */
async function cancelActiveSubscriptions(profile: Record<string, any>, email?: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;
  let customerId: string | undefined = profile.stripeCustomerId;
  if (!customerId && email) {
    customerId = (await stripe.customers.list({ email: email.toLowerCase(), limit: 1 })).data[0]?.id;
  }
  if (!customerId) return;
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  for (const sub of subs.data) {
    if (["active", "trialing", "past_due", "unpaid", "incomplete"].includes(sub.status)) {
      await stripe.subscriptions.cancel(sub.id);
    }
  }
}

/** Client Stripe du coach (profil, sinon e-mail du compte). */
async function findCustomerId(stripe: Stripe, profile: Record<string, any>, email?: string): Promise<string | undefined> {
  if (profile.stripeCustomerId) return profile.stripeCustomerId;
  if (!email) return undefined;
  return (await stripe.customers.list({ email: email.toLowerCase(), limit: 1 })).data[0]?.id;
}

/** Abonnement payé et à jour dont la période en cours n'est pas terminée (null sinon). */
async function findPaidSubscription(
  stripe: Stripe,
  profile: Record<string, any>,
  email?: string
): Promise<{ subscription: Stripe.Subscription; periodEnd: Date } | null> {
  const customerId = await findCustomerId(stripe, profile, email);
  if (!customerId) return null;
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 10 });
  for (const subscription of subs.data) {
    const periodEnd = getSubscriptionAccessEnd(subscription);
    if (periodEnd && periodEnd.getTime() > Date.now()) return { subscription, periodEnd };
  }
  return null;
}

/** Champs d'une suppression programmée, retirés quand elle est annulée. */
export const CLEARED_DELETION_FIELDS = {
  deletionScheduledAt: FieldValue.delete(),
  deletionRequestedAt: FieldValue.delete(),
  deletionStoppedRenewal: FieldValue.delete(),
};

export type DeletionRequestResult = { mode: "immediate" } | { mode: "scheduled"; deletionAt: string };

/**
 * Demande de suppression par le coach. Abonnement payé en cours : non renouvelé, accès conservé
 * jusqu'à la fin de la période payée, suppression à cette date. Sinon : suppression immédiate.
 */
export async function requestCoachAccountDeletion(db: Firestore, uid: string, email?: string): Promise<DeletionRequestResult> {
  const userRef = db.collection("users").doc(uid);
  const profile = (await userRef.get()).data() || {};
  const stripe = getStripe();
  const paid = stripe ? await findPaidSubscription(stripe, profile, email) : null;

  if (!stripe || !paid) {
    await deleteCoachAccount(db, uid, email);
    return { mode: "immediate" };
  }

  const alreadyCanceling = Boolean(paid.subscription.cancel_at_period_end || paid.subscription.cancel_at);
  const deletionAt = paid.periodEnd.toISOString();

  // Profil marqué avant l'appel Stripe : le webhook de résiliation qui suit doit savoir qu'il s'agit
  // d'une suppression (e-mail adapté, compte supprimé à la fin de l'abonnement)
  await userRef.set(
    {
      deletionScheduledAt: deletionAt,
      deletionRequestedAt: new Date().toISOString(),
      // Annuler la suppression ne relance l'abonnement que si c'est cette demande qui l'avait arrêté
      deletionStoppedRenewal: !alreadyCanceling,
      cancelAtPeriodEnd: true,
      accessEndsAt: deletionAt,
      stripeSubscriptionId: paid.subscription.id,
    },
    { merge: true }
  );
  if (!alreadyCanceling) {
    try {
      await stripe.subscriptions.update(paid.subscription.id, { cancel_at_period_end: true });
    } catch (err) {
      await userRef.set({ ...CLEARED_DELETION_FIELDS, cancelAtPeriodEnd: false, accessEndsAt: null }, { merge: true });
      throw err;
    }
  }
  return { mode: "scheduled", deletionAt };
}

/** Le coach renonce à la suppression programmée : l'abonnement reprend s'il avait été arrêté par la demande. */
export async function cancelScheduledDeletion(db: Firestore, uid: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const profile = (await userRef.get()).data() || {};
  if (!profile.deletionScheduledAt) return;

  const patch: Record<string, any> = { ...CLEARED_DELETION_FIELDS };
  const stripe = getStripe();
  if (stripe && profile.deletionStoppedRenewal && profile.stripeSubscriptionId) {
    const sub = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
    if (sub.status !== "canceled") {
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: false });
      patch.cancelAtPeriodEnd = false;
      patch.accessEndsAt = null;
    }
  }
  await userRef.set(patch, { merge: true });
}

/** Suppression programmée arrivée à échéance (filet de sécurité si le webhook Stripe n'est pas arrivé). */
export function isScheduledDeletionDue(profile: Record<string, any> | null | undefined): boolean {
  const at = profile?.deletionScheduledAt ? new Date(profile.deletionScheduledAt).getTime() : NaN;
  return !isNaN(at) && at <= Date.now();
}

/** Suppression complète du compte du coach : abonnement résilié, données, profil et identifiants. */
export async function deleteCoachAccount(db: Firestore, uid: string, email?: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const profile = (await userRef.get()).data() || {};
  // Résiliation d'abord : en cas d'échec, rien n'est supprimé et le coach peut réessayer
  await cancelActiveSubscriptions(profile, email);
  await deleteCoachData(db, uid);
  await db.recursiveDelete(userRef);
  try {
    await getAuth().deleteUser(uid);
  } catch (err: any) {
    if (err?.code !== "auth/user-not-found") throw err;
  }
}

/** Le demandeur est-il super admin (adresse de l'éditeur ou liste admins) ? */
export async function isSuperAdminUser(db: Firestore, uid: string, email?: string): Promise<boolean> {
  if (isSuperAdminEmail(email)) return true;
  return (await db.collection("admins").doc(uid).get()).exists;
}
