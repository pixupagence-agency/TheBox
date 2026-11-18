// Suppression des données d'un coach, sur demande uniquement (aucune suppression automatique) :
//  - par le coach lui-même : compte complet (données, profil, identifiants de connexion) ;
//  - par un super admin : données seules (le compte et l'abonnement restent actifs).
//
// Conservés après la suppression d'un compte (obligations légales / prévention des abus, voir CGU) :
//  - les factures et paiements chez Stripe (obligation comptable) ;
//  - une empreinte (hash SHA-256) de l'adresse e-mail des anciens abonnés (subscribedEmails),
//    qui empêche de réobtenir l'essai gratuit avec un compte recréé.

import { Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStripe } from "@/lib/stripe";
import { isSuperAdminEmail } from "@/lib/security";

/** Sous-collections de users/{uid} contenant les données du coach */
const COACH_DATA_COLLECTIONS = ["teams", "players", "matches", "matchData", "settings", "schemas"];

/** Supprime équipes, joueurs, matchs, notes et schémas du coach (y compris les anciennes structures). */
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

/** Suppression complète du compte du coach : abonnement résilié, données, profil et identifiants. */
export async function deleteCoachAccount(db: Firestore, uid: string, email?: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const profile = (await userRef.get()).data() || {};
  // Résiliation d'abord : en cas d'échec, rien n'est supprimé et le coach peut réessayer
  await cancelActiveSubscriptions(profile, email || profile.email);
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
