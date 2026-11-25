// Sauvegarde de la base The Box : tout Firestore + comptes Firebase Auth, dans une archive chiffrée.
//
//   npm run backup                → production (lit toute la base : 1 lecture par document)
//   npm run backup -- --emulator  → émulateur local (essais)
//
// Archive : backups/thebox-AAAA-MM-JJ-HHMM.backup (dossier modifiable avec BACKUP_DIR), chiffrée avec
// BACKUP_PASSPHRASE (.env.local). Copiez-la régulièrement hors de ce PC (clé USB, cloud) : chiffrée,
// elle peut être stockée n'importe où. Restauration : scripts/firestore-restore.mjs.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { connect, encode, encrypt, passphrase, projectId, root } from "./backup-lib.mjs";

const emulator = process.argv.includes("--emulator");
// Compteurs de limitation (temporaires, recréés à la volée) : inutile de les sauvegarder
const SKIP_ROOT = new Set(["rateLimits"]);

const pass = passphrase();
const db = connect({ emulator });
const docs = {};
let reads = 0;

/** Parcourt une collection : ses documents, puis leurs sous-collections (même sous un parent absent) */
async function dumpCollection(col) {
  const snap = await col.get();
  reads += Math.max(1, snap.size);
  for (const d of snap.docs) docs[d.ref.path] = encode(d.data());
  // listDocuments inclut les parents absents (ex. userData/{uid} dont seules les entrées existent)
  const refs = await col.listDocuments();
  reads += Math.max(1, refs.length);
  for (const ref of refs) {
    reads += 1;
    for (const sub of await ref.listCollections()) await dumpCollection(sub);
  }
}

const started = Date.now();
const target = emulator ? "émulateur local" : `production (${projectId})`;
console.log(`[backup] Sauvegarde de ${target}…`);

for (const col of await db.listCollections()) {
  if (SKIP_ROOT.has(col.id)) continue;
  await dumpCollection(col);
}
// Résumé par collection (users/*/teams…)
const counts = {};
for (const p of Object.keys(docs)) {
  const col = p.split("/").filter((_, i) => i % 2 === 0).join("/*/");
  counts[col] = (counts[col] || 0) + 1;
}

// Comptes Firebase Auth (e-mails, empreintes des mots de passe) : export du CLI Firebase, sans lecture Firestore
let auth = null;
if (!emulator) {
  const tmp = path.join(os.tmpdir(), `thebox-auth-${process.pid}.json`);
  try {
    execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["firebase", "auth:export", tmp, "--format=json", "--project", projectId], {
      cwd: root,
      stdio: "pipe",
      shell: process.platform === "win32",
    });
    auth = JSON.parse(fs.readFileSync(tmp, "utf8"));
  } catch (err) {
    console.warn("⚠️  Comptes Auth non exportés (connectez-vous avec « npx firebase login ») :", err?.message?.split("\n")[0]);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

const archive = {
  format: "thebox-backup/1",
  projectId,
  source: emulator ? "emulator" : "production",
  createdAt: new Date().toISOString(),
  documents: docs,
  auth,
};

const dir = path.resolve(root, process.env.BACKUP_DIR || "backups");
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
const file = path.join(dir, `thebox-${emulator ? "emulateur-" : ""}${stamp}.backup`);
fs.writeFileSync(file, encrypt(JSON.stringify(archive), pass));

const total = Object.keys(docs).length;
console.log(`[backup] ${total} documents (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ")})` +
  (auth ? `, ${auth.users?.length ?? 0} comptes Auth` : ""));
console.log(`[backup] ≈ ${reads} lectures Firestore, ${((Date.now() - started) / 1000).toFixed(1)} s`);
console.log(`[backup] ✅ ${path.relative(root, file)} (${(fs.statSync(file).size / 1024).toFixed(0)} Ko, chiffré)`);
process.exit(0);
