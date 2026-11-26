"use client";
// État mémorisé sur l'appareil (localStorage) : lu une fois au premier rendu, réécrit à chaque changement.
// Stockage indisponible (navigation privée, quota) : l'état fonctionne normalement, sans être mémorisé.
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function useStoredState<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T | undefined,
  serialize: (value: T) => string = String
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw === null ? undefined : parse(raw);
      return parsed === undefined ? fallback : parsed;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(value));
    } catch {
      /* stockage indisponible */
    }
  }, [key, value, serialize]);

  return [value, setValue];
}

/** Lecture d'un booléen enregistré par String(true / false) */
export const parseStoredBoolean = (raw: string): boolean | undefined =>
  raw === "true" ? true : raw === "false" ? false : undefined;
