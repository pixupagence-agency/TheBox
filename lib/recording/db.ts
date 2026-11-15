// Module Recording : bibliothèque enregistrée SUR L'APPAREIL (IndexedDB).
// Les fichiers vidéo restent sur l'appareil : rien n'est envoyé en ligne tant qu'on ne partage pas.
import type { LibraryImage, Sequence } from "./types";

const DB_NAME = "thebox_recording";
const DB_VERSION = 2;
const SEQUENCES = "sequences";
const VIDEOS = "videos";
/** Images extraites : fiche (avec vignette) et fichier image complet, séparés pour lister vite */
const IMAGES = "images";
const IMAGE_FILES = "imageFiles";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Stockage local indisponible sur ce navigateur."));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(SEQUENCES)) db.createObjectStore(SEQUENCES, { keyPath: "id" });
        if (!db.objectStoreNames.contains(VIDEOS)) db.createObjectStore(VIDEOS);
        if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES, { keyPath: "id" });
        if (!db.objectStoreNames.contains(IMAGE_FILES)) db.createObjectStore(IMAGE_FILES);
      };
      req.onsuccess = () => {
        const db = req.result;
        // Nouvelle version ouverte dans un autre onglet : on libère la base pour qu'elle puisse se mettre à jour
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => {
        dbPromise = null;
        reject(req.error || new Error("Ouverture du stockage local impossible."));
      };
    });
  }
  return dbPromise;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.onabort = () => reject(tx.error || new Error("Opération annulée (espace de stockage plein ?)."));
      })
  );
}

export const listSequences = async (): Promise<Sequence[]> => {
  const all = await run<Sequence[]>(SEQUENCES, "readonly", (s) => s.getAll() as IDBRequest<Sequence[]>);
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const saveSequence = (seq: Sequence) => run(SEQUENCES, "readwrite", (s) => s.put(seq));

export const deleteSequence = async (seq: Sequence) => {
  await run(SEQUENCES, "readwrite", (s) => s.delete(seq.id));
  if (seq.source.kind === "file") {
    // La vidéo n'est supprimée que si plus aucune séquence ne l'utilise
    const others = await listSequences();
    const videoId = seq.source.videoId;
    if (!others.some((o) => o.source.kind === "file" && o.source.videoId === videoId)) {
      await run(VIDEOS, "readwrite", (s) => s.delete(videoId));
    }
  }
};

export const saveVideoBlob = (videoId: string, blob: Blob) => run(VIDEOS, "readwrite", (s) => s.put(blob, videoId));

export const loadVideoBlob = (videoId: string) => run<Blob | undefined>(VIDEOS, "readonly", (s) => s.get(videoId) as IDBRequest<Blob | undefined>);

export const listImages = async (): Promise<LibraryImage[]> => {
  const all = await run<LibraryImage[]>(IMAGES, "readonly", (s) => s.getAll() as IDBRequest<LibraryImage[]>);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

/** Le fichier est écrit avant la fiche : une fiche listée a toujours son image */
export const saveImage = async (image: LibraryImage, file: Blob) => {
  await run(IMAGE_FILES, "readwrite", (s) => s.put(file, image.id));
  await run(IMAGES, "readwrite", (s) => s.put(image));
};

export const loadImageFile = (id: string) => run<Blob | undefined>(IMAGE_FILES, "readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);

export const deleteImage = async (id: string) => {
  await run(IMAGES, "readwrite", (s) => s.delete(id));
  await run(IMAGE_FILES, "readwrite", (s) => s.delete(id));
};

/** Demande au navigateur de ne pas effacer la bibliothèque en cas de manque d'espace */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* non pris en charge */
  }
}

export async function storageEstimate(): Promise<{ usedMb: number; quotaMb: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    if (!e) return null;
    return { usedMb: Math.round((e.usage || 0) / 1048576), quotaMb: Math.round((e.quota || 0) / 1048576) };
  } catch {
    return null;
  }
}

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
