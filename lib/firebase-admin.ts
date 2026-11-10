import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import firebaseConfig from "../firebase-applet-config.json";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Initializes and returns the Firebase Admin Firestore instance.
 * Gracefully falls back if service account credentials are not configured in environment.
 */
export function getAdminFirestore(): Firestore | null {
  if (adminDb) {
    return adminDb;
  }

  try {
    if (!getApps().length) {
      const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (rawServiceAccount) {
        let serviceAccount: any;
        try {
          // If stored as JSON string
          serviceAccount = JSON.parse(rawServiceAccount);
        } catch {
          // If stored as base64 or other format
          const decoded = Buffer.from(rawServiceAccount, "base64").toString("utf-8");
          serviceAccount = JSON.parse(decoded);
        }

        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: firebaseConfig.projectId,
        });
      } else {
        // Fallback to Google Application Default Credentials (e.g. Cloud Run, App Engine, GCP)
        adminApp = initializeApp({
          projectId: firebaseConfig.projectId,
        });
      }
    } else {
      adminApp = getApp();
    }

    if (adminApp) {
      // Connect specifically to the custom database if defined
      const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
      adminDb = getFirestore(adminApp, databaseId);
    }
  } catch (err: any) {
    console.warn(
      "⚠️ [Firebase Admin] Non initialisé : aucune clé de compte de service détectée (FIREBASE_SERVICE_ACCOUNT_KEY ou GOOGLE_APPLICATION_CREDENTIALS).",
      err?.message
    );
    return null;
  }

  return adminDb;
}

export interface UpdateCoachPlanParams {
  coachId?: string | null;
  email?: string | null;
  /** Laisser vide pour ne pas modifier le plan actuel (ex : simple mise à jour de statut). */
  planId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeStatus?: "active" | "canceled" | "past_due" | "trialing";
  /** Champs supplémentaires à fusionner dans le profil (ex : date de fin d'accès). */
  extra?: Record<string, any>;
}

/**
 * Updates a user's activePlan and Stripe subscription metadata directly in Firestore.
 * Bypasses client-side security rules via Firebase Admin SDK.
 */
export async function updateCoachPlanInFirestore(params: UpdateCoachPlanParams): Promise<{
  success: boolean;
  userId?: string;
  message: string;
}> {
  const { coachId, email, planId, stripeCustomerId, stripeSubscriptionId, stripeStatus = "active", extra } = params;
  const db = getAdminFirestore();

  if (!db) {
    const msg = "Firebase Admin n'est pas initialisé sur le serveur. La mise à jour automatique en base est reportée au retour client.";
    console.warn(`⚠️ [Stripe Webhook -> Firestore] ${msg}`);
    return { success: false, message: msg };
  }

  const payload: Record<string, any> = {
    ...(extra || {}),
    updatedAt: new Date().toISOString(),
  };
  if (planId) payload.activePlan = planId;

  if (stripeCustomerId) payload.stripeCustomerId = stripeCustomerId;
  if (stripeSubscriptionId) payload.stripeSubscriptionId = stripeSubscriptionId;
  if (stripeStatus) payload.stripeStatus = stripeStatus;

  try {
    // 1. Try direct update by coachId if valid
    if (coachId && coachId !== "coach_demo" && coachId.length > 5) {
      const userDocRef = db.collection("users").doc(coachId);
      const docSnap = await userDocRef.get();

      if (docSnap.exists) {
        await userDocRef.set(payload, { merge: true });
        console.log(`✅ [Stripe Webhook -> Firestore] Plan mis à jour vers "${planId}" pour l'utilisateur ID: ${coachId}`);
        return { success: true, userId: coachId, message: `Plan ${planId} appliqué à l'utilisateur ${coachId}` };
      }
    }

    // 2. Try lookup by email if provided
    if (email && email.includes("@")) {
      const cleanEmail = email.trim().toLowerCase();
      const usersRef = db.collection("users");
      const emailQuery = await usersRef.where("email", "==", cleanEmail).limit(1).get();

      if (!emailQuery.empty) {
        const foundDoc = emailQuery.docs[0];
        await foundDoc.ref.set(payload, { merge: true });
        console.log(`✅ [Stripe Webhook -> Firestore] Plan mis à jour vers "${planId}" pour l'email: ${cleanEmail} (ID: ${foundDoc.id})`);
        return { success: true, userId: foundDoc.id, message: `Plan ${planId} appliqué au compte ${cleanEmail}` };
      }
    }

    // 3. Try lookup by stripeCustomerId if known
    if (stripeCustomerId) {
      const usersRef = db.collection("users");
      const customerQuery = await usersRef.where("stripeCustomerId", "==", stripeCustomerId).limit(1).get();

      if (!customerQuery.empty) {
        const foundDoc = customerQuery.docs[0];
        await foundDoc.ref.set(payload, { merge: true });
        console.log(`✅ [Stripe Webhook -> Firestore] Plan mis à jour vers "${planId}" via stripeCustomerId: ${stripeCustomerId}`);
        return { success: true, userId: foundDoc.id, message: `Plan ${planId} appliqué via stripeCustomerId` };
      }
    }

    console.warn(`⚠️ [Stripe Webhook -> Firestore] Aucun compte utilisateur trouvé pour coachId="${coachId}", email="${email}", customerId="${stripeCustomerId}".`);
    return {
      success: false,
      message: `Compte introuvable pour coachId=${coachId} / email=${email}`,
    };
  } catch (error: any) {
    console.error("❌ [Stripe Webhook -> Firestore Error]:", error);
    return {
      success: false,
      message: error?.message || "Erreur interne lors de la mise à jour Firestore",
    };
  }
}

/**
 * Vérifie un jeton d'identification Firebase (envoyé par le client) et renvoie l'utilisateur.
 */
export async function verifyFirebaseIdToken(idToken: string | null | undefined): Promise<{ uid: string; email?: string } | null> {
  if (!idToken) return null;
  if (!getAdminFirestore()) return null; // initialise l'app admin
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err: any) {
    console.warn("⚠️ [Firebase Admin] Jeton d'identification invalide :", err?.message);
    return null;
  }
}

/**
 * Retrouve le profil d'un coach (id + données) par id, identifiant client Stripe ou email.
 */
export async function findCoachProfile(params: {
  coachId?: string | null;
  email?: string | null;
  stripeCustomerId?: string | null;
}): Promise<{ id: string; data: Record<string, any> } | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    if (params.coachId) {
      const snap = await db.collection("users").doc(params.coachId).get();
      if (snap.exists) return { id: snap.id, data: snap.data() || {} };
    }
    if (params.stripeCustomerId) {
      const q = await db.collection("users").where("stripeCustomerId", "==", params.stripeCustomerId).limit(1).get();
      if (!q.empty) return { id: q.docs[0].id, data: q.docs[0].data() };
    }
    if (params.email && params.email.includes("@")) {
      const q = await db.collection("users").where("email", "==", params.email.trim().toLowerCase()).limit(1).get();
      if (!q.empty) return { id: q.docs[0].id, data: q.docs[0].data() };
    }
  } catch (err) {
    console.error("❌ [Firebase Admin] findCoachProfile:", err);
  }
  return null;
}

/**
 * Marque un événement Stripe comme traité. Renvoie false s'il l'a déjà été
 * (Stripe peut renvoyer le même événement plusieurs fois : évite les e-mails en double).
 */
export async function claimStripeEvent(eventId: string): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return true;
  try {
    await db.collection("stripeEvents").doc(eventId).create({ processedAt: new Date().toISOString() });
    return true;
  } catch (err: any) {
    // Code gRPC 6 = ALREADY_EXISTS
    if (err?.code === 6 || /already exists/i.test(err?.message || "")) return false;
    console.warn("⚠️ [Firebase Admin] claimStripeEvent:", err?.message);
    return true;
  }
}

/** Libère un événement en cas d'erreur, pour que la nouvelle tentative de Stripe soit bien traitée. */
export async function releaseStripeEvent(eventId: string): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection("stripeEvents").doc(eventId).delete();
  } catch {
    /* ignore */
  }
}
