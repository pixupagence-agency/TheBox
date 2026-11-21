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
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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

let clubSlugCache: { uid: string; slug: string } | null = null;

/** Page publique du club (QR général) : une par compte coach, créée au premier besoin */
export async function ensureLiveClub(name: string, logo?: string): Promise<string | null> {
  const owner = uid();
  if (!owner) return null;
  const payload: LiveClubDoc = stripUndefined({
    ownerUid: owner,
    name: (name || "Mon club").slice(0, 120),
    logo: logo && logo.length <= 300000 ? logo : undefined,
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
    ...state,
    hostSeenAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await setDoc(doc(db, "liveMatches", publicId), data);
  await regenerateEditorAccess(publicId);
  return publicId;
}

export async function updateLiveMatchMeta(publicId: string, meta: LiveMatchMeta, clubSlug: string, clubName: string) {
  await updateDoc(doc(db, "liveMatches", publicId), stripUndefined({ ...meta, clubSlug, clubName, updatedAt: Date.now() }));
}

export async function publishLiveState(publicId: string, state: LiveState, clubSlug: string) {
  const now = Date.now();
  await updateDoc(doc(db, "liveMatches", publicId), stripUndefined({ ...state, clubSlug, hostSeenAt: now, updatedAt: now }));
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
