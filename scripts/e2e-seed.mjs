// Tests e2e : crée les comptes de test dans les émulateurs Firebase (Auth + Firestore).
// Lancé par « npm run test:e2e » (firebase emulators:exec) avant Playwright : les émulateurs démarrent
// vides à chaque passage, aucune donnée de production n'est lue ni écrite.
//
// Comptes : E2E_EMAIL / E2E_PASSWORD (coach en période d'essai) et E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
// (administrateur, formule PRO+), lus dans .env.local ; à défaut, comptes fictifs @e2e.test.
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try {
  process.loadEnvFile(path.join(root, ".env.local"));
} catch {
  // pas de .env.local : comptes fictifs
}

// Garde-fou : ce script ne doit jamais viser la production
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

const require = createRequire(path.join(root, "package.json"));
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { projectId } = require(path.join(root, "firebase-config.json"));

const app = initializeApp({ projectId });
const auth = getAuth(app);
const db = getFirestore(app);

const coach = {
  email: process.env.E2E_EMAIL || "coach@e2e.test",
  password: process.env.E2E_PASSWORD || "e2e-coach-password",
};
const admin = {
  email: process.env.E2E_ADMIN_EMAIL || process.env.E2E_EMAIL || "admin@e2e.test",
  password: process.env.E2E_ADMIN_PASSWORD || process.env.E2E_PASSWORD || "e2e-admin-password",
};

async function createAccount({ email, password }, profile, { isAdmin }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, emailVerified: true, displayName: `${profile.firstName} ${profile.lastName}` });
  }
  const now = new Date();
  await db.collection("users").doc(user.uid).set({
    id: user.uid,
    email,
    club: "The Box FC",
    role: "Coach Principal",
    preferredSport: "football",
    language: "fr",
    createdAt: now.toISOString(),
    welcomeEmailSent: true,
    showLogoOnPitch: true,
    ...profile,
    ...(isAdmin
      ? { isAdmin: true, activePlan: "pro_plus" }
      : { activePlan: "free", trialEndsAt: Timestamp.fromMillis(now.getTime() + 14 * 24 * 3600 * 1000) }),
  }, { merge: true });
  if (isAdmin) await db.collection("admins").doc(user.uid).set({ email, createdAt: now.toISOString() });
  return user.uid;
}

const sameAccount = coach.email === admin.email;
const coachUid = await createAccount(coach, { firstName: "Coach", lastName: "Test" }, { isAdmin: sameAccount });
if (!sameAccount) await createAccount(admin, { firstName: "Admin", lastName: "Test" }, { isAdmin: true });
console.log(`[e2e] émulateurs prêts : ${sameAccount ? "1 compte (coach administrateur)" : "2 comptes (coach en essai, administrateur)"} (${coachUid.slice(0, 6)}…)`);
process.exit(0);
