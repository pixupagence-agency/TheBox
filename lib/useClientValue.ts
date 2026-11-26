// Valeur qui n'existe que dans le navigateur (window, localStorage, matchMedia…), lue sans effet ni
// second rendu : la valeur `serverValue` sert au rendu serveur et à l'hydratation, puis React relit
// `getSnapshot` côté navigateur. `getSnapshot` doit renvoyer une valeur stable (texte, nombre, booléen).
import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

export function useClientValue<T>(getSnapshot: () => T, serverValue: T, subscribe: (onChange: () => void) => () => void = noSubscription): T {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}
