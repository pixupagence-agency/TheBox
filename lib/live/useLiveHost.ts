"use client";
// App tactique = hôte du live : applique les actions de la télécommande à son état local,
// puis publie l'état (score, chrono, événements, compo) dans le document public du match.
import { useEffect, useRef, useState } from "react";
import {
  markCommandApplied,
  publishLiveState,
  touchLiveHost,
  watchLiveCommands,
  type LiveState,
} from "@/lib/live/client";
import type { LiveCommand } from "@/lib/live/model";

interface Options {
  publicId: string | null;
  clubSlug: string | null;
  enabled: boolean;
  state: LiveState;
  /** Applique une action de la télécommande à l'état local du tableau tactique */
  onCommand: (cmdId: string, cmd: LiveCommand) => void;
}

/** Clé de comparaison : le chrono qui tourne n'entraîne pas de publication à chaque seconde */
const stateKey = (s: LiveState) =>
  JSON.stringify({
    ...s,
    clock: s.clock.runningSince ? { running: true } : { elapsed: s.clock.elapsed },
  });

export function useLiveHost({ publicId, clubSlug, enabled, state, onCommand }: Options) {
  const [ready, setReady] = useState(false);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastKeyRef = useRef<string | null>(null);

  // Actions de la télécommande en attente : appliquées une à une, dans l'ordre de saisie
  useEffect(() => {
    setReady(false);
    lastKeyRef.current = null;
    if (!enabled || !publicId) return;
    let cancelled = false;
    let first = true;
    const seen = new Set<string>();
    let queue: Promise<void> = Promise.resolve();
    const unsub = watchLiveCommands(publicId, (cmds) => {
      const fresh = cmds.filter((c) => !seen.has(c.id));
      fresh.forEach((c) => seen.add(c.id));
      const isFirst = first;
      first = false;
      queue = queue.then(async () => {
        for (const c of fresh) {
          if (cancelled) return;
          try {
            onCommandRef.current(c.id, c);
          } catch (err) {
            console.warn("[Live] action non appliquée :", err);
          }
          // Laisse React appliquer la mise à jour avant l'action suivante
          await new Promise((r) => setTimeout(r, 120));
          markCommandApplied(publicId, c.id).catch((err) => console.warn("[Live] marquage :", err?.message));
        }
        if (isFirst && !cancelled) setReady(true);
      });
    }, () => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [publicId, enabled]);

  // Publication de l'état (regroupée, uniquement quand il change)
  const key = stateKey(state);
  useEffect(() => {
    if (!enabled || !publicId || !clubSlug || !ready) return;
    if (key === lastKeyRef.current) return;
    const timer = setTimeout(() => {
      lastKeyRef.current = key;
      publishLiveState(publicId, stateRef.current, clubSlug).catch((err) => {
        lastKeyRef.current = null;
        console.warn("[Live] publication :", err?.message);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [key, enabled, publicId, clubSlug, ready]);

  // Signe de vie : « Coach connecté » sur la télécommande
  useEffect(() => {
    if (!enabled || !publicId || !ready) return;
    const beat = () => {
      if (document.visibilityState === "visible") touchLiveHost(publicId).catch(() => {});
    };
    const interval = setInterval(beat, 45000);
    return () => clearInterval(interval);
  }, [enabled, publicId, ready]);

  return { ready };
}
