// Tests des règles de sécurité Firestore (firestore.rules) contre l'émulateur local.
// Lancer avec « npm run test:rules » : démarre l'émulateur Firestore, charge les règles du dépôt,
// puis vérifie ce que chaque profil (anonyme, coach, autre coach, admin) peut lire et écrire.
// Aucune donnée de production n'est lue ni écrite.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  setLogLevel,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const SUPER_ADMIN_EMAIL = "pixup.agence@gmail.com"; // adresse codée en dur dans firestore.rules
const DAY = 24 * 3600 * 1000;

let env;
setLogLevel("silent"); // les refus attendus ne doivent pas encombrer la sortie

before(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");
  env = await initializeTestEnvironment({
    projectId: "thebox-tactique",
    firestore: { host, port: Number(port), rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});

after(async () => {
  await env?.cleanup();
});

// Données de départ, écrites sans règles (comme le ferait le serveur / Admin SDK)
const profiles = {
  trial: { id: "trial", email: "trial@e2e.test", activePlan: "free", trialEndsAt: () => Timestamp.fromMillis(Date.now() + 7 * DAY), createdAt: "2026-01-01" },
  expired: { id: "expired", email: "expired@e2e.test", activePlan: "free", trialEndsAt: () => Timestamp.fromMillis(Date.now() - DAY) },
  resubscribed: { id: "resubscribed", activePlan: "free", hasHadSubscription: true, trialEndsAt: () => Timestamp.fromMillis(Date.now() + 7 * DAY) },
  pro: { id: "pro", activePlan: "pro", stripeCustomerId: "cus_123" },
  free: { id: "free", activePlan: "free" },
  listedAdmin: { id: "listedAdmin", activePlan: "free" },
};

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, p] of Object.entries(profiles)) {
      const data = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === "function" ? v() : v]));
      await setDoc(doc(db, "users", uid), data);
    }
    await setDoc(doc(db, "admins", "listedAdmin"), { email: "listed@e2e.test" });
    await setDoc(doc(db, "users/pro/teams/t1"), { name: "U13", userId: "pro" });
    await setDoc(doc(db, "tactics/tac1"), { userId: "pro", name: "4-4-2" });
    await setDoc(doc(db, "liveMatches/m1"), { ownerUid: "pro", clubSlug: "the-box-fc", homeName: "The Box" });
    await setDoc(doc(db, "liveMatches/m1/commands/c1"), { type: "goal" });
    await setDoc(doc(db, "liveEditorKeys/m1"), { ownerUid: "pro", codeHash: "x" });
    await setDoc(doc(db, "liveClubs/the-box-fc"), { ownerUid: "pro", name: "The Box FC" });
    await setDoc(doc(db, "liveClubs/the-box-fc/matches/m1"), { homeName: "The Box" });
    await setDoc(doc(db, "app_config/general"), { announcement: "" });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid, token = {}) => env.authenticatedContext(uid, token).firestore();
const superAdmin = () => as("boss", { email: SUPER_ADMIN_EMAIL, email_verified: true });

describe("users/{uid} : profil du coach", () => {
  test("le coach lit son profil, personne d'autre", async () => {
    await assertSucceeds(getDoc(doc(as("trial"), "users/trial")));
    await assertFails(getDoc(doc(as("pro"), "users/trial")));
    await assertFails(getDoc(doc(anon(), "users/trial")));
  });

  test("création du profil : uniquement le sien, en formule gratuite", async () => {
    await assertSucceeds(setDoc(doc(as("newbie"), "users/newbie"), { id: "newbie", activePlan: "free", firstName: "Léa" }));
    await assertSucceeds(setDoc(doc(as("newbie2"), "users/newbie2"), { id: "newbie2", isAdmin: false })); // forme envoyée par l'app
    await assertFails(setDoc(doc(as("newbie"), "users/other"), { id: "other" }));
    await assertFails(setDoc(doc(as("newbie"), "users/newbie"), { id: "intrus" }));
  });

  test("création : impossible de s'attribuer une formule, un essai, des jours offerts ou le statut admin", async () => {
    const db = as("newbie");
    const ref = doc(db, "users/newbie");
    await assertFails(setDoc(ref, { id: "newbie", activePlan: "pro_plus" }));
    await assertFails(setDoc(ref, { id: "newbie", trialEndsAt: Timestamp.fromMillis(Date.now() + 365 * DAY) }));
    await assertFails(setDoc(ref, { id: "newbie", trialBonusDays: 30 }));
    await assertFails(setDoc(ref, { id: "newbie", stripeStatus: "active" }));
    await assertFails(setDoc(ref, { id: "newbie", isAdmin: true }));
  });

  test("mise à jour : le coach modifie ses infos mais pas son abonnement", async () => {
    const ref = doc(as("free"), "users/free");
    await assertSucceeds(updateDoc(ref, { firstName: "Max", showLogoOnPitch: false }));
    await assertFails(updateDoc(ref, { activePlan: "pro" }));
    await assertFails(updateDoc(ref, { trialEndsAt: Timestamp.fromMillis(Date.now() + 30 * DAY) }));
    await assertFails(updateDoc(ref, { hasHadSubscription: false }));
    await assertFails(updateDoc(ref, { isAdmin: true }));
    await assertFails(updateDoc(ref, { id: "autre" }));
  });

  test("mise à jour : un abonné peut repasser en gratuit, pas toucher à Stripe", async () => {
    const ref = doc(as("pro"), "users/pro");
    await assertSucceeds(updateDoc(ref, { activePlan: "free" }));
    await assertFails(updateDoc(ref, { stripeCustomerId: "cus_pirate" }));
  });

  test("mise à jour : createdAt figé, logo limité aux images", async () => {
    const ref = doc(as("trial"), "users/trial");
    await assertFails(updateDoc(ref, { createdAt: "2020-01-01" }));
    await assertSucceeds(updateDoc(ref, { clubLogo: "data:image/png;base64,AAAA" }));
    await assertFails(updateDoc(ref, { clubLogo: "data:text/html;base64,PHNjcmlwdD4=" }));
    await assertFails(updateDoc(ref, { firstName: "x".repeat(101) }));
  });

  test("suppression du profil : réservée au super admin", async () => {
    await assertFails(deleteDoc(doc(as("free"), "users/free")));
    await assertSucceeds(deleteDoc(doc(superAdmin(), "users/free")));
  });
});

describe("super admin", () => {
  test("l'adresse super admin confirmée lit et modifie tous les profils", async () => {
    await assertSucceeds(getDoc(doc(superAdmin(), "users/trial")));
    await assertSucceeds(updateDoc(doc(superAdmin(), "users/free"), { activePlan: "pro_plus" }));
  });

  test("la même adresse non confirmée (compte e-mail créé par un tiers) n'a aucun droit", async () => {
    const spoof = as("spoof", { email: SUPER_ADMIN_EMAIL, email_verified: false });
    await assertFails(getDoc(doc(spoof, "users/trial")));
  });

  test("un compte inscrit dans admins/ a les droits super admin", async () => {
    await assertSucceeds(getDoc(doc(as("listedAdmin"), "users/trial")));
  });

  test("admins/ : seul un super admin peut s'y ajouter", async () => {
    await assertFails(setDoc(doc(as("free"), "admins/free"), { email: "free@e2e.test" }));
    await assertSucceeds(setDoc(doc(superAdmin(), "admins/free"), { email: "free@e2e.test" }));
  });

  test("admins/ : chacun ne voit que sa propre entrée, la liste est réservée aux super admins", async () => {
    await assertFails(getDoc(doc(anon(), "admins/listedAdmin")));
    await assertFails(getDoc(doc(as("free"), "admins/listedAdmin")));
    await assertFails(getDocs(collection(as("free"), "admins")));
    await assertSucceeds(getDoc(doc(as("listedAdmin"), "admins/listedAdmin")));
    await assertSucceeds(getDoc(doc(as("free"), "admins/free"))); // « suis-je admin ? » : non, sans fuite
    await assertSucceeds(getDocs(collection(superAdmin(), "admins")));
    await assertSucceeds(getDocs(collection(as("listedAdmin"), "admins")));
  });
});

describe("users/{uid}/{coll} : données du coach (accès PRO)", () => {
  const team = { name: "Seniors", userId: "" };

  test("essai en cours, formule payante : écriture autorisée", async () => {
    await assertSucceeds(setDoc(doc(as("trial"), "users/trial/teams/t1"), { ...team, userId: "trial" }));
    await assertSucceeds(setDoc(doc(as("pro"), "users/pro/matches/m1"), { name: "J1", userId: "pro" }));
    await assertSucceeds(setDoc(doc(as("listedAdmin"), "users/listedAdmin/teams/t1"), { name: "Admin" }));
  });

  test("essai expiré, gratuit, ancien abonné : écriture refusée, lecture et suppression possibles", async () => {
    await assertFails(setDoc(doc(as("expired"), "users/expired/teams/t1"), { name: "X" }));
    await assertFails(setDoc(doc(as("free"), "users/free/teams/t1"), { name: "X" }));
    // l'essai ne se cumule pas avec un ancien abonnement
    await assertFails(setDoc(doc(as("resubscribed"), "users/resubscribed/teams/t1"), { name: "X" }));
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/free/teams/old"), { name: "Old" }));
    await assertSucceeds(getDoc(doc(as("free"), "users/free/teams/old")));
    await assertSucceeds(deleteDoc(doc(as("free"), "users/free/teams/old")));
  });

  test("données privées : un autre coach ne lit ni n'écrit", async () => {
    await assertFails(getDoc(doc(as("trial"), "users/pro/teams/t1")));
    await assertFails(setDoc(doc(as("trial"), "users/pro/teams/t2"), { name: "X" }));
    await assertFails(getDoc(doc(anon(), "users/pro/teams/t1")));
  });

  test("collections autorisées, identifiants et tailles contrôlés", async () => {
    const db = as("pro");
    await assertFails(setDoc(doc(db, "users/pro/secrets/s1"), { name: "X" }));
    await assertFails(setDoc(doc(db, "users/pro/teams/t1"), { name: "X", userId: "trial" }));
    await assertFails(setDoc(doc(db, "users/pro/teams/bad.id"), { name: "X" }));
    await assertFails(setDoc(doc(db, "users/pro/teams/t3"), { name: "x".repeat(501) }));
  });
});

describe("tactics/ et userData/ (anciennes données v1)", () => {
  test("tactics : lecture par le propriétaire seulement", async () => {
    await assertSucceeds(getDoc(doc(as("pro"), "tactics/tac1")));
    await assertFails(getDoc(doc(as("trial"), "tactics/tac1")));
    await assertSucceeds(getDocs(query(collection(as("pro"), "tactics"), where("userId", "==", "pro"))));
    await assertFails(getDocs(collection(as("pro"), "tactics")));
  });

  test("userData : format des blocs imposé", async () => {
    const ref = doc(as("pro"), "userData/pro/entries/e1");
    const entry = { key: "teams", part: 0, parts: 1, value: "[]", updatedAt: 1 };
    await assertSucceeds(setDoc(ref, entry));
    await assertFails(setDoc(ref, { ...entry, extra: true }));
    await assertFails(setDoc(ref, { ...entry, parts: 0 }));
    await assertFails(setDoc(doc(as("trial"), "userData/pro/entries/e2"), entry));
  });
});

describe("liveMatches/ : page publique d'un match", () => {
  test("lecture d'un match par son lien, sans compte ; impossible de lister tous les matchs", async () => {
    await assertSucceeds(getDoc(doc(anon(), "liveMatches/m1")));
    await assertFails(getDocs(collection(anon(), "liveMatches")));
    await assertFails(getDocs(query(collection(as("pro"), "liveMatches"), where("ownerUid", "==", "pro"))));
  });

  test("création par un coach avec accès PRO, à son nom", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "liveClubs/fc-essai"), { ownerUid: "trial", name: "FC Essai" });
      await setDoc(doc(ctx.firestore(), "liveClubs/fc-free"), { ownerUid: "free", name: "FC Free" });
    });
    await assertSucceeds(setDoc(doc(as("trial"), "liveMatches/m2"), { ownerUid: "trial", clubSlug: "fc-essai" }));
    await assertFails(setDoc(doc(as("trial"), "liveMatches/m3"), { ownerUid: "pro", clubSlug: "fc-essai" }));
    await assertFails(setDoc(doc(as("free"), "liveMatches/m4"), { ownerUid: "free", clubSlug: "fc-free" }));
    await assertFails(setDoc(doc(anon(), "liveMatches/m5"), { ownerUid: "x", clubSlug: "x" }));
  });

  test("un match ne peut être rattaché qu'à un club du même coach", async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "liveClubs/fc-essai"), { ownerUid: "trial", name: "FC Essai" }));
    // club d'un autre coach (son nom et son logo s'afficheraient sur le match) ou club inexistant
    await assertFails(setDoc(doc(as("trial"), "liveMatches/m6"), { ownerUid: "trial", clubSlug: "the-box-fc" }));
    await assertFails(setDoc(doc(as("trial"), "liveMatches/m7"), { ownerUid: "trial", clubSlug: "inconnu" }));
    await assertFails(setDoc(doc(as("trial"), "liveMatches/m8"), { ownerUid: "trial", clubSlug: "" }));
    // changement de club après coup
    await assertSucceeds(setDoc(doc(as("trial"), "liveMatches/m9"), { ownerUid: "trial", clubSlug: "fc-essai" }));
    await assertFails(updateDoc(doc(as("trial"), "liveMatches/m9"), { clubSlug: "the-box-fc" }));
    await assertSucceeds(updateDoc(doc(as("trial"), "liveMatches/m9"), { score: { home: 2, away: 0 }, clubSlug: "fc-essai" }));
  });

  test("mise à jour et suppression par le propriétaire seulement", async () => {
    await assertSucceeds(updateDoc(doc(as("pro"), "liveMatches/m1"), { score: { home: 1, away: 0 } }));
    await assertFails(updateDoc(doc(as("pro"), "liveMatches/m1"), { ownerUid: "trial" }));
    await assertFails(updateDoc(doc(as("trial"), "liveMatches/m1"), { score: { home: 9, away: 0 } }));
    await assertFails(deleteDoc(doc(as("trial"), "liveMatches/m1")));
    await assertSucceeds(deleteDoc(doc(as("pro"), "liveMatches/m1")));
  });

  test("commandes de la télécommande : créées par le serveur, lues par le coach propriétaire", async () => {
    await assertSucceeds(getDoc(doc(as("pro"), "liveMatches/m1/commands/c1")));
    await assertFails(getDoc(doc(as("trial"), "liveMatches/m1/commands/c1")));
    await assertFails(getDoc(doc(anon(), "liveMatches/m1/commands/c1")));
    await assertFails(setDoc(doc(as("pro"), "liveMatches/m1/commands/c2"), { type: "goal" }));
  });

  test("clés de la télécommande : privées au coach", async () => {
    await assertSucceeds(getDoc(doc(as("pro"), "liveEditorKeys/m1")));
    await assertFails(getDoc(doc(as("trial"), "liveEditorKeys/m1")));
    await assertFails(getDoc(doc(anon(), "liveEditorKeys/m1")));
    await assertSucceeds(getDoc(doc(as("trial"), "liveEditorKeys/absent")));
    await assertFails(getDocs(collection(as("pro"), "liveEditorKeys")));
    await assertFails(updateDoc(doc(as("trial"), "liveEditorKeys/m1"), { ownerUid: "trial" }));
  });
});

describe("liveClubs/ : page publique du club", () => {
  test("lecture par l'adresse du club ; liste limitée à ses propres clubs", async () => {
    await assertSucceeds(getDoc(doc(anon(), "liveClubs/the-box-fc")));
    await assertSucceeds(getDocs(query(collection(as("pro"), "liveClubs"), where("ownerUid", "==", "pro"))));
    await assertFails(getDocs(collection(as("pro"), "liveClubs")));
    await assertFails(getDocs(collection(anon(), "liveClubs")));
  });

  test("seul le propriétaire modifie ou supprime le club", async () => {
    await assertSucceeds(updateDoc(doc(as("pro"), "liveClubs/the-box-fc"), { name: "The Box" }));
    await assertFails(updateDoc(doc(as("trial"), "liveClubs/the-box-fc"), { name: "Volé" }));
    await assertFails(setDoc(doc(as("trial"), "liveClubs/the-box-fc"), { ownerUid: "trial" }));
    await assertFails(deleteDoc(doc(as("trial"), "liveClubs/the-box-fc")));
    await assertFails(updateDoc(doc(as("pro"), "liveClubs/the-box-fc"), { logo: "x".repeat(300001) }));
  });

  test("index des matchs du club : public en lecture, écrit par le propriétaire du club", async () => {
    await assertSucceeds(getDocs(collection(anon(), "liveClubs/the-box-fc/matches")));
    await assertSucceeds(setDoc(doc(as("pro"), "liveClubs/the-box-fc/matches/m2"), { home: "The Box" }));
    await assertFails(setDoc(doc(as("trial"), "liveClubs/the-box-fc/matches/m3"), { home: "Faux" }));
    await assertFails(deleteDoc(doc(as("trial"), "liveClubs/the-box-fc/matches/m1")));
  });
});

describe("app_config/ : configuration globale", () => {
  const maintenance = { enabled: true, message: "Mise à jour", updatedAt: "2026-11-25T10:00:00Z", updatedBy: "boss" };

  test("lecture publique, écriture par un super admin", async () => {
    await assertSucceeds(getDoc(doc(anon(), "app_config/general")));
    await assertFails(setDoc(doc(as("pro"), "app_config/general"), { announcement: "pub" }));
    await assertSucceeds(setDoc(doc(as("listedAdmin"), "app_config/general"), { announcement: "ok" }));
  });

  test("mode maintenance : réservé à l'adresse super admin confirmée, format imposé", async () => {
    await assertSucceeds(setDoc(doc(superAdmin(), "app_config/maintenance"), maintenance));
    await assertFails(setDoc(doc(as("listedAdmin"), "app_config/maintenance"), maintenance));
    await assertFails(setDoc(doc(as("spoof", { email: SUPER_ADMIN_EMAIL, email_verified: false }), "app_config/maintenance"), maintenance));
    await assertFails(setDoc(doc(superAdmin(), "app_config/maintenance"), { ...maintenance, extra: 1 }));
    await assertFails(setDoc(doc(superAdmin(), "app_config/maintenance"), { ...maintenance, message: "x".repeat(501) }));
  });
});

describe("refus par défaut", () => {
  test("une collection non prévue par les règles est inaccessible", async () => {
    await assertFails(getDoc(doc(superAdmin(), "rateLimits/ip_1")));
    await assertFails(setDoc(doc(as("pro"), "rateLimits/ip_1"), { count: 0 }));
    await assertFails(setDoc(doc(as("pro"), "inconnue/x"), { a: 1 }));
  });
});

describe("Live : structure des documents publics", () => {
  // Match tel que le publie l'app tactique (lib/live/client.ts, createLiveMatch)
  const liveDoc = (over = {}) => ({
    ownerUid: "pro", clubSlug: "the-box-fc", clubName: "The Box FC", teamId: "team_1", teamName: "U13",
    home: "The Box", away: "FC Rival", competition: "Championnat", date: "2026-11-29", time: "10:30",
    dateTime: "2026-11-29T10:30", coachNote: "", sport: "football", periods: ["1MT", "2MT"],
    periodSeconds: 2700, breakAfterIndex: 0, status: "scheduled", period: "1MT",
    score: { home: 0, away: 0 }, clock: { elapsed: 0, runningSince: null },
    events: [{ id: "e1", type: "goal", team: "home", time: "3'", player: "Lucas M.", points: 1 }],
    lineup: { onPitch: [{ id: "p1", n: 9, name: "Lucas M.", x: 50, y: 50 }], bench: [] },
    hostSeenAt: 1, createdAt: 1, updatedAt: 1, ...over,
  });
  const db = () => as("pro");

  test("un match publié par l'app est accepté, avec ses mises à jour habituelles", async () => {
    await assertSucceeds(setDoc(doc(db(), "liveMatches/s1"), liveDoc()));
    await assertSucceeds(updateDoc(doc(db(), "liveMatches/s1"), { score: { home: 1, away: 0 }, status: "live", clock: { elapsed: 10, runningSince: 5 } }));
    await assertSucceeds(updateDoc(doc(db(), "liveMatches/s1"), { status: "finished", period: "FIN", finishedAt: 9, coachNote: "Bravo à tous" }));
    await assertSucceeds(updateDoc(doc(db(), "liveMatches/s1"), { hostSeenAt: 99 }));
    // ancien champ déjà présent (m1 en contient un) : les mises à jour restent possibles
    await assertSucceeds(updateDoc(doc(db(), "liveMatches/m1"), { hostSeenAt: 99 }));
  });

  test("champs inconnus, réactions et date de création refusés", async () => {
    await assertFails(setDoc(doc(db(), "liveMatches/s2"), liveDoc({ pub: "<script>" })));
    await assertFails(setDoc(doc(db(), "liveMatches/s3"), liveDoc({ reactions: { clap: 9999 } })));
    await assertSucceeds(setDoc(doc(db(), "liveMatches/s4"), liveDoc()));
    await assertFails(updateDoc(doc(db(), "liveMatches/s4"), { reactions: { clap: 9999 } }));
    await assertFails(updateDoc(doc(db(), "liveMatches/s4"), { createdAt: 5 }));
    await assertFails(updateDoc(doc(db(), "liveMatches/s4"), { extra: true }));
  });

  test("types et tailles bornés", async () => {
    const bad = [
      { coachNote: "x".repeat(601) },
      { home: "x".repeat(201) },
      { status: "hacked" },
      { score: { home: "1", away: 0 } },
      { score: { home: 1, away: 0, bonus: 3 } },
      { clock: { elapsed: 0, runningSince: null, x: 1 } },
      { events: Array.from({ length: 1001 }, (_, i) => ({ id: `e${i}` })) },
      { lineup: { onPitch: [], bench: [], staff: [] } },
      { periods: "1MT" },
      { finishedAt: "demain" },
    ];
    for (const [i, over] of bad.entries()) {
      await assertFails(setDoc(doc(db(), `liveMatches/bad${i}`), liveDoc(over)));
    }
    await assertSucceeds(setDoc(doc(db(), "liveMatches/s5"), liveDoc()));
    await assertFails(updateDoc(doc(db(), "liveMatches/s5"), { coachNote: "x".repeat(601) }));
  });

  test("index du club : résumé sans composition ni identifiant du coach", async () => {
    const { ownerUid: _o, lineup: _l, hostSeenAt: _h, ...summary } = liveDoc();
    await assertSucceeds(setDoc(doc(db(), "liveClubs/the-box-fc/matches/s6"), summary));
    await assertFails(setDoc(doc(db(), "liveClubs/the-box-fc/matches/s7"), { ...summary, lineup: liveDoc().lineup }));
    await assertFails(setDoc(doc(db(), "liveClubs/the-box-fc/matches/s8"), { ...summary, ownerUid: "pro" }));
    await assertFails(setDoc(doc(db(), "liveClubs/the-box-fc/matches/s9"), { ...summary, pub: "x" }));
    await assertSucceeds(setDoc(doc(db(), "liveClubs/the-box-fc/matches/s6"), { score: { home: 2, away: 1 } }, { merge: true }));
  });

  test("logo du club : image intégrée uniquement, jamais une adresse externe", async () => {
    const club = doc(db(), "liveClubs/the-box-fc");
    await assertSucceeds(setDoc(club, { ownerUid: "pro", name: "The Box FC", logo: "data:image/png;base64,AAAA", updatedAt: 1 }));
    await assertSucceeds(setDoc(club, { ownerUid: "pro", name: "The Box FC", updatedAt: 1 }));
    await assertFails(setDoc(club, { ownerUid: "pro", name: "The Box FC", logo: "https://pisteur.example/p.gif", updatedAt: 1 }));
    await assertFails(setDoc(club, { ownerUid: "pro", name: "The Box FC", extra: 1 }));
    await assertFails(setDoc(club, { ownerUid: "pro", name: "x".repeat(201) }));
  });

  test("accès télécommande : format du code et de l'empreinte", async () => {
    const key = { ownerUid: "pro", token: "a".repeat(32), tokenHash: "0".repeat(64), code: "AB23CD", revoked: false, createdAt: 1 };
    await assertSucceeds(setDoc(doc(db(), "liveEditorKeys/m1"), key));
    await assertSucceeds(updateDoc(doc(db(), "liveEditorKeys/m1"), { ownerUid: "pro", revoked: true }));
    await assertFails(setDoc(doc(db(), "liveEditorKeys/m1"), { ...key, code: "A" }));
    await assertFails(setDoc(doc(db(), "liveEditorKeys/m1"), { ...key, tokenHash: "x" }));
    await assertFails(setDoc(doc(db(), "liveEditorKeys/m1"), { ...key, expiresAt: 9e15 }));
  });
});
