// Tableau tactique : écriture locale tolérante (quota dépassé, navigation privée).

export const safeLocalStorageSetItem = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[localStorage] Quota dépassé ou enregistrement impossible pour '${key}':`, err);
  }
};
