"use client";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LiveClubDoc, LiveMatchDoc } from "@/lib/live/model";

export type LiveMatchWithId = LiveMatchDoc & { id: string };

/** Document public d'un match, en temps réel */
export function useLiveMatch(id: string) {
  const [match, setMatch] = useState<LiveMatchWithId | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, "liveMatches", id),
      (snap) => {
        if (!snap.exists()) {
          setMatch(null);
          setState("missing");
          return;
        }
        setMatch({ id: snap.id, ...(snap.data() as LiveMatchDoc) });
        setState("ready");
      },
      () => setState("error")
    );
  }, [id]);
  return { match, state };
}

/** Nom et logo du club */
export function useLiveClub(slug: string | undefined) {
  const [club, setClub] = useState<LiveClubDoc | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  useEffect(() => {
    if (!slug) return;
    return onSnapshot(
      doc(db, "liveClubs", slug),
      (snap) => {
        setClub(snap.exists() ? (snap.data() as LiveClubDoc) : null);
        setState(snap.exists() ? "ready" : "missing");
      },
      () => setState("error")
    );
  }, [slug]);
  return { club, state };
}

/** Tous les matchs publiés d'un club */
export function useClubMatches(slug: string) {
  const [matches, setMatches] = useState<LiveMatchWithId[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    if (!slug) return;
    return onSnapshot(
      query(collection(db, "liveMatches"), where("clubSlug", "==", slug)),
      (snap) => {
        setMatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LiveMatchDoc) })));
        setState("ready");
      },
      () => setState("error")
    );
  }, [slug]);
  return { matches, state };
}

/** Horloge qui avance (chrono affiché, comptes à rebours) */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
