// Mode Live déporté : opérations Firestore côté coach (app tactique)
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { clubMatchSummary, toPublicLive } from "@/lib/live/privacy";
import {
  newClubSlug,
  newEditorCode,
  newEditorToken,
  newPublicId,
  sha256Hex,
  stripUndefined,
  type LiveClubDoc,
  type LiveCommand,
  type LiveMatchDoc,
} from "@/lib/live/model";

export type LiveMatchMeta = Pick<
  LiveMatchDoc,
  "teamId" | "teamName" | "home" | "away" | "competition" | "date" | "time" | "dateTime" | "venue" | "coachNote" | "sport" | "periods" | "periodSeconds" | "breakAfterIndex"
>;

export type LiveState = Pick<LiveMatchDoc, "status" | "period" | "score" | "clock" | "events" | "lineup"> & { finishedAt?: number | null };

export interface EditorAccess {
  token: string;
  code: string;
  revoked: boolean;
}

export const liveUrls = (origin: string, publicId: string, clubSlug?: string, token?: string) => ({
  match: `${origin}/live/${publicId}`,
  remote: token ? `${origin}/live/${publicId}/remote#t=${token}` : "",
  remoteEntry: `${origin}/telecommande`,
  club: clubSlug ? `${origin}/club/${clubSlug}` : "",
});

const uid = () => auth.currentUser?.uid || null;

/**
 * Index des matchs d'un club (page du club, QR général) : liveClubs/{slug}/matches/{publicId}.
 * La collection liveMatches n'est pas listable (RGPD : pas d'accès à tous les matchs de tous les clubs) ;
 * la page d'un club lit cet index, accessible seulement en connaissant l'adresse du club.
 */
const clubMatchRef = (clubSlug: string, publicId: string) => doc(db, "liveClubs", clubSlug, "matches", publicId);

/**
 * Attestation du coach (RGPD) : les joueurs, ou leurs parents pour les mineurs, ont donné leur accord
 * pour l'affichage de leur prénom et de l'initiale de leur nom sur les pages publiques du Live.
 * Demandée au premier partage ; sans elle, aucun match n'est publié automatiquement.
 */
const LIVE_ATTESTATION_KEY = "thebox_live_attestation_v1";

export function hasLiveAttestation(): boolean {
  try {
    const owner = uid();
    const raw = typeof window !== "undefined" ? localStorage.getItem(LIVE_ATTESTATION_KEY) : null;
    if (!raw || !owner) return false;
    return (JSON.parse(raw) as { uid?: string }).uid === owner;
  } catch {
    return false;
  }
}

export function recordLiveAttestation() {
  try {
    const owner = uid();
    if (owner) localStorage.setItem(LIVE_ATTESTATION_KEY, JSON.stringify({ uid: owner, at: new Date().toISOString() }));
  } catch { /* stockage indisponible : l'attestation sera redemandée */ }
}

let clubSlugCache: { uid: string; slug: string } | null = null;

/** Page publique du club (QR général) : une par compte coach, créée au premier besoin */
export async function ensureLiveClub(name: string, logo?: string): Promise<string | null> {
  const owner = uid();
  if (!owner) return null;
  const payload: LiveClubDoc = stripUndefined({
    ownerUid: owner,
    name: (name || "Mon club").slice(0, 120),
    // Image intégrée uniquement (règles Firestore) : jamais une adresse externe
    logo: logo && logo.length <= 300000 && /^data:image\/(png|jpeg|webp);base64,/.test(logo) ? logo : undefined,
    updatedAt: Date.now(),
  });
  if (clubSlugCache?.uid === owner) {
    const ref = doc(db, "liveClubs", clubSlugCache.slug);
    const snap = await getDoc(ref);
    const cur = snap.data() as LiveClubDoc | undefined;
    if (cur && (cur.name !== payload.name || (cur.logo || "") !== (payload.logo || ""))) {
      await setDoc(ref, payload);
    }
    return clubSlugCache.slug;
  }
  const q = await getDocs(query(collection(db, "liveClubs"), where("ownerUid", "==", owner), limit(1)));
  let slug: string;
  if (!q.empty) {
    slug = q.docs[0].id;
    const cur = q.docs[0].data() as LiveClubDoc;
    if (cur.name !== payload.name || (cur.logo || "") !== (payload.logo || "")) {
      await setDoc(doc(db, "liveClubs", slug), payload);
    }
  } else {
    slug = newClubSlug();
    await setDoc(doc(db, "liveClubs", slug), payload);
  }
  clubSlugCache = { uid: owner, slug };
  return slug;
}

/** Publie un nouveau match (QR du match) et crée son accès adjoint */
export async function createLiveMatch(
  meta: LiveMatchMeta,
  clubSlug: string,
  clubName: string,
  state: LiveState
): Promise<string | null> {
  const owner = uid();
  if (!owner) return null;
  const publicId = newPublicId();
  const now = Date.now();
  const data: LiveMatchDoc = stripUndefined({
    ownerUid: owner,
    clubSlug,
    clubName,
    ...meta,
    ...toPublicLive(state),
    hostSeenAt: now,
    createdAt: now,
    updatedAt: now,
  });
  const batch = writeBatch(db);
  batch.set(doc(db, "liveMatches", publicId), data);
  batch.set(clubMatchRef(clubSlug, publicId), clubMatchSummary(data));
  await batch.commit();
  await regenerateEditorAccess(publicId);
  return publicId;
}

export async function updateLiveMatchMeta(publicId: string, meta: LiveMatchMeta, clubSlug: string, clubName: string) {
  const patch = stripUndefined({ ...meta, clubSlug, clubName, updatedAt: Date.now() });
  // L'index du club reçoit le résumé complet (match publié avant la création de l'index compris)
  const current = (await getDoc(doc(db, "liveMatches", publicId))).data() as LiveMatchDoc | undefined;
  // Live supprimé entre-temps (par le coach sur un autre appareil, ou avec ses données) : rien à mettre à jour
  if (!current) return;
  const batch = writeBatch(db);
  batch.update(doc(db, "liveMatches", publicId), patch);
  batch.set(clubMatchRef(clubSlug, publicId), clubMatchSummary(toPublicLive({ ...(current || {}), ...patch })), { merge: true });
  await batch.commit();
}

export async function publishLiveState(publicId: string, state: LiveState, clubSlug: string) {
  const now = Date.now();
  const published = stripUndefined({ ...toPublicLive(state), clubSlug, hostSeenAt: now, updatedAt: now });
  const batch = writeBatch(db);
  batch.update(doc(db, "liveMatches", publicId), published);
  batch.set(clubMatchRef(clubSlug, publicId), clubMatchSummary(published), { merge: true });
  await batch.commit();
}

export async function touchLiveHost(publicId: string) {
  await updateDoc(doc(db, "liveMatches", publicId), { hostSeenAt: Date.now() });
}

export async function deleteLiveMatch(publicId: string) {
  const owner = uid();
  if (!owner) return;
  try {
    const cmds = await getDocs(collection(db, "liveMatches", publicId, "commands"));
    await Promise.all(cmds.docs.map((d) => deleteDoc(d.ref)));
  } catch { /* ignore */ }
  await deleteDoc(doc(db, "liveEditorKeys", publicId)).catch(() => {});
  const slug = ((await getDoc(doc(db, "liveMatches", publicId)).catch(() => null))?.data() as LiveMatchDoc | undefined)?.clubSlug;
  if (slug) await deleteDoc(clubMatchRef(slug, publicId)).catch(() => {});
  await deleteDoc(doc(db, "liveMatches", publicId)).catch(() => {});
}

export async function getEditorAccess(publicId: string): Promise<EditorAccess | null> {
  const snap = await getDoc(doc(db, "liveEditorKeys", publicId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { token: d.token || "", code: d.code || "", revoked: Boolean(d.revoked) };
}

/** Nouveau lien et nouveau code adjoint : les anciens cessent de fonctionner */
export async function regenerateEditorAccess(publicId: string): Promise<EditorAccess | null> {
  const owner = uid();
  if (!owner) return null;
  const token = newEditorToken();
  const code = newEditorCode();
  await setDoc(doc(db, "liveEditorKeys", publicId), {
    ownerUid: owner,
    token,
    tokenHash: await sha256Hex(token),
    code,
    revoked: false,
    createdAt: Date.now(),
  });
  return { token, code, revoked: false };
}

export async function revokeEditorAccess(publicId: string) {
  const owner = uid();
  if (!owner) return;
  await updateDoc(doc(db, "liveEditorKeys", publicId), { ownerUid: owner, revoked: true });
}

/** Actions de la télécommande en attente d'application par l'app tactique */
export function watchLiveCommands(
  publicId: string,
  onCommands: (cmds: Array<{ id: string } & LiveCommand>) => void,
  onError?: () => void
) {
  return onSnapshot(
    query(collection(db, "liveMatches", publicId, "commands"), where("applied", "==", false)),
    (snap) => {
      const cmds = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as LiveCommand) }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      onCommands(cmds);
    },
    (err) => {
      console.warn("[Live] commandes :", err?.message);
      onError?.();
    }
  );
}

export async function markCommandApplied(publicId: string, cmdId: string) {
  await updateDoc(doc(db, "liveMatches", publicId, "commands", cmdId), { applied: true });
}
