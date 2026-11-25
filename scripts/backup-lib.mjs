// Outils partagés par scripts/firestore-backup.mjs et scripts/firestore-restore.mjs :
// connexion Admin SDK, encodage des types Firestore en JSON, chiffrement des archives.
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
export const { projectId } = require(path.join(root, "firebase-config.json"));

try {
  process.loadEnvFile(path.join(root, ".env.local"));
} catch {
  // pas de .env.local : variables d'environnement du shell
}

/** Admin SDK : émulateur (--emulator) ou production (clé FIREBASE_SERVICE_ACCOUNT_KEY, sinon gcloud) */
export function connect({ emulator }) {
  const { initializeApp, cert } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");
  if (emulator) {
    process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
    return getFirestore(initializeApp({ projectId }));
  }
  delete process.env.FIRESTORE_EMULATOR_HOST;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return getFirestore(initializeApp({ projectId })); // identifiants gcloud
  let key;
  try {
    key = JSON.parse(raw);
  } catch {
    key = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  }
  return getFirestore(initializeApp({ credential: cert(key), projectId }));
}

// --- Types Firestore <-> JSON ---
export function encode(value) {
  const { Timestamp, GeoPoint, DocumentReference } = require("firebase-admin/firestore");
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Timestamp) return { __type: "timestamp", seconds: value.seconds, nanoseconds: value.nanoseconds };
  if (value instanceof GeoPoint) return { __type: "geopoint", latitude: value.latitude, longitude: value.longitude };
  if (value instanceof DocumentReference) return { __type: "ref", path: value.path };
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return { __type: "bytes", base64: Buffer.from(value).toString("base64") };
  if (Array.isArray(value)) return value.map(encode);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
}

export function decode(value, db) {
  const { Timestamp, GeoPoint } = require("firebase-admin/firestore");
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => decode(v, db));
  switch (value.__type) {
    case "timestamp": return new Timestamp(value.seconds, value.nanoseconds);
    case "geopoint": return new GeoPoint(value.latitude, value.longitude);
    case "ref": return db.doc(value.path);
    case "bytes": return Buffer.from(value.base64, "base64");
    default: return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v, db)]));
  }
}

// --- Chiffrement : AES-256-GCM, clé dérivée de BACKUP_PASSPHRASE (scrypt) ---
const MAGIC = Buffer.from("THEBOXBK1");

export function passphrase() {
  const p = process.env.BACKUP_PASSPHRASE || "";
  if (p.length < 16) {
    console.error("❌ BACKUP_PASSPHRASE manquante ou trop courte (16 caractères minimum) dans .env.local.");
    console.error("   Choisissez une phrase secrète et gardez-en une copie hors de ce PC : sans elle, les sauvegardes sont illisibles.");
    process.exit(1);
  }
  return p;
}

export function encrypt(json, pass) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(pass, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(gzipSync(Buffer.from(json, "utf8"))), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]);
}

export function decrypt(buf, pass) {
  if (!buf.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("Ce fichier n'est pas une sauvegarde The Box.");
  let o = MAGIC.length;
  const salt = buf.subarray(o, (o += 16));
  const iv = buf.subarray(o, (o += 12));
  const tag = buf.subarray(o, (o += 16));
  const decipher = createDecipheriv("aes-256-gcm", scryptSync(pass, salt, 32), iv);
  decipher.setAuthTag(tag);
  try {
    return gunzipSync(Buffer.concat([decipher.update(buf.subarray(o)), decipher.final()])).toString("utf8");
  } catch {
    throw new Error("Phrase secrète incorrecte ou fichier abîmé.");
  }
}
