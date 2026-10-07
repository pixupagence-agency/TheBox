import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, User } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot 
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId as second argument
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standardized Operation Types & Error Handler
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot (client-side only)
if (typeof window !== "undefined") {
  async function testConnection() {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }
  testConnection();
}

// Firebase Auth helpers
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error("Firebase Google Auth Error:", err);
    if (err?.code === "auth/popup-blocked") {
      console.warn("Popup bloqué par le navigateur. Redirection vers la connexion Google...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    if (err?.code === "auth/unauthorized-domain") {
      const msg = `[Firebase Auth] Le domaine "${typeof window !== 'undefined' ? window.location.hostname : ''}" n'est pas autorisé dans la console Firebase. Veuillez l'ajouter sous Firebase Console > Authentication > Settings > Authorized domains.`;
      console.error(msg);
      alert("Connexion Google impossible : Le domaine Vercel n'est pas autorisé dans la console Firebase (Domaines autorisés). Veuillez suivre les instructions de configuration.");
    }
    throw err;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Firebase Logout Error:", err);
    throw err;
  }
}

// --- Data Sync Services with Firestore ---

// Helper to sanitize data for Firestore (recursively strip undefined values which cause setDoc to crash)
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

export interface FirebaseCoachProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  club: string;
  role: string;
  preferredSport: string;
  isAdmin?: boolean;
  activePlan?: string;
  trialBonusDays?: number;
  welcomeEmailSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function saveUserProfileToFirestore(profile: FirebaseCoachProfile) {
  if (!auth.currentUser) {
    return;
  }
  const currentUid = auth.currentUser.uid;
  const path = `users/${currentUid}`;
  try {
    const rawData = {
      ...profile,
      id: currentUid,
      isAdmin: Boolean(profile.isAdmin),
      updatedAt: new Date().toISOString(),
    };
    const cleaned = cleanFirestoreData(rawData);
    await setDoc(doc(db, "users", currentUid), cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromFirestore(userId: string): Promise<FirebaseCoachProfile | null> {
  if (!auth.currentUser) {
    return null;
  }
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      return snap.data() as FirebaseCoachProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export interface FirebaseTactic {
  id: string;
  userId: string;
  name: string;
  sport: string;
  pitchType?: string;
  notes?: string;
  payload: string;
  createdAt: string;
  updatedAt: string;
}

export async function saveTacticToFirestore(tactic: FirebaseTactic) {
  if (!auth.currentUser) {
    // Unauthenticated sessions store tactics locally in localStorage.
    // Cloud Firestore synchronization requires an active Firebase Auth user.
    return;
  }
  const currentUid = auth.currentUser.uid;
  const path = `tactics/${tactic.id}`;
  try {
    const rawData = {
      ...tactic,
      userId: currentUid,
      updatedAt: new Date().toISOString(),
    };
    const cleaned = cleanFirestoreData(rawData);
    await setDoc(doc(db, "tactics", tactic.id), cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getTacticsForUser(userId: string): Promise<FirebaseTactic[]> {
  if (!auth.currentUser) {
    return [];
  }
  const currentUid = auth.currentUser.uid;
  const path = "tactics";
  try {
    const q = query(collection(db, "tactics"), where("userId", "==", currentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FirebaseTactic);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function deleteTacticFromFirestore(tacticId: string) {
  if (!auth.currentUser) {
    return;
  }
  const path = `tactics/${tacticId}`;
  try {
    await deleteDoc(doc(db, "tactics", tacticId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export interface FirebaseMatch {
  id: string;
  userId: string;
  name: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  date?: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
  matchTimerSeconds?: number;
  isTimerRunning?: boolean;
  tacticalNotes?: string;
  dataPayload?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function saveMatchToFirestore(match: FirebaseMatch) {
  if (!auth.currentUser) {
    return;
  }
  const currentUid = auth.currentUser.uid;
  const path = `matches/${match.id}`;
  try {
    const rawData = {
      ...match,
      userId: currentUid,
      updatedAt: new Date().toISOString(),
    };
    const cleaned = cleanFirestoreData(rawData);
    await setDoc(doc(db, "matches", match.id), cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getMatchesForUser(userId: string): Promise<FirebaseMatch[]> {
  if (!auth.currentUser) {
    return [];
  }
  const currentUid = auth.currentUser.uid;
  const path = "matches";
  try {
    const q = query(collection(db, "matches"), where("userId", "==", currentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FirebaseMatch);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function deleteMatchFromFirestore(matchId: string) {
  if (!auth.currentUser) {
    return;
  }
  const path = `matches/${matchId}`;
  try {
    await deleteDoc(doc(db, "matches", matchId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
