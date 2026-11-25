// Restauration d'une sauvegarde The Box (scripts/firestore-backup.mjs).
//
//   node scripts/firestore-restore.mjs <fichier.backup> --list
//       contenu de l'archive (nombre de documents par collection), sans rien écrire
//   node scripts/firestore-restore.mjs <fichier.backup> --emulator
//       écrit la sauvegarde dans l'émulateur local (vérifier une sauvegarde, rejouer un incident)
//   node scripts/firestore-restore.mjs <fichier.backup> --production --confirm=thebox-tactique [--only=users/abc]
//       réécrit les documents dans la base de PRODUCTION (écrase les documents existants du même chemin,
//       ne supprime rien). --only limite la restauration à un chemin (ex. les données d'un coach).
//   node scripts/firestore-restore.mjs <fichier.backup> --extract-auth=comptes.json
//       extrait les comptes Auth (à réimporter avec « firebase auth:import », voir le message affiché)
import fs from "node:fs";
import { connect, decode, decrypt, passphrase, projectId } from "./backup-lib.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
/** Valeur d'une option : undefined si absente, "" sans valeur, sinon le texte après « = » */
const flag = (name) => {
  const a = args.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!a) return undefined;
  const i = a.indexOf("=");
  return i < 0 ? "" : a.slice(i + 1);
};

if (!file || !fs.existsSync(file)) {
  console.error("Usage : node scripts/firestore-restore.mjs <fichier.backup> --list | --emulator | --production --confirm=" + projectId);
  process.exit(1);
}

const archive = JSON.parse(decrypt(fs.readFileSync(file), passphrase()));
const paths = Object.keys(archive.documents);
console.log(`[restore] Sauvegarde du ${archive.createdAt} (${archive.source}), ${paths.length} documents` +
  (archive.auth ? `, ${archive.auth.users?.length ?? 0} comptes Auth` : ""));

if (flag("list") !== undefined) {
  const byCol = {};
  for (const p of paths) {
    const col = p.split("/").filter((_, i) => i % 2 === 0).join("/*/");
    byCol[col] = (byCol[col] || 0) + 1;
  }
  for (const [col, n] of Object.entries(byCol).sort()) console.log(`  ${col.padEnd(40)} ${n}`);
  process.exit(0);
}

const extract = flag("extract-auth");
if (extract) {
  if (!archive.auth) throw new Error("Cette sauvegarde ne contient pas les comptes Auth.");
  fs.writeFileSync(extract, JSON.stringify(archive.auth));
  console.log(`[restore] Comptes Auth écrits dans ${extract} (fichier NON chiffré : supprimez-le après usage).`);
  console.log("  Réimport : paramètres de hachage dans la console Firebase (Authentication > Utilisateurs > ⋮ > Paramètres de hachage du mot de passe), puis :");
  console.log(`  npx firebase auth:import ${extract} --project ${projectId} --hash-algo=SCRYPT --hash-key=<clé> --salt-separator=<séparateur> --rounds=<rounds> --mem-cost=<mem-cost>`);
  process.exit(0);
}

const production = flag("production") !== undefined;
const emulator = flag("emulator") !== undefined;
if (production === emulator) {
  console.error("Choisissez la cible : --emulator ou --production --confirm=" + projectId);
  process.exit(1);
}
if (production && flag("confirm") !== projectId) {
  console.error(`Restauration en production : ajoutez --confirm=${projectId} pour confirmer.`);
  process.exit(1);
}

const only = flag("only");
const selected = only ? paths.filter((p) => p === only || p.startsWith(`${only}/`)) : paths;
const db = connect({ emulator });
const writer = db.bulkWriter();
for (const p of selected) writer.set(db.doc(p), decode(archive.documents[p], db));
await writer.close();
console.log(`[restore] ✅ ${selected.length} documents écrits dans ${production ? `la PRODUCTION (${projectId})` : "l'émulateur"}.`);
process.exit(0);
