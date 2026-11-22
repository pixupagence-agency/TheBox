// Dates affichées dans la langue du navigateur (locale `undefined` = navigator.language).

type MatchDateFields = { date?: string; time?: string; dateTime?: string };

/** Date courte du jour, ex. « 22/11/2026 » (fr) ou « 11/22/2026 » (en-US). */
export const formatToday = (options?: Intl.DateTimeFormatOptions): string =>
  new Date().toLocaleDateString(undefined, options);

/** Date d'un horodatage (ms ou chaîne ISO), dans la langue du navigateur. */
export const formatDate = (value: number | string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString(undefined, options) : "";
};

/**
 * Date et heure d'un match à partir des champs `date` (AAAA-MM-JJ) et `time` (HH:MM).
 * Retombe sur `dateTime` (texte libre ou ancien format) quand la date n'est pas exploitable.
 */
export const formatMatchDateTime = (m: MatchDateFields | null | undefined): string => {
  if (!m) return "";
  const hasDate = !!m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date);
  const hasTime = !!m.time && /^\d{2}:\d{2}$/.test(m.time);
  if (!hasDate) return m.dateTime || (hasTime ? m.time! : "");
  const d = new Date(`${m.date}T${hasTime ? m.time : "00:00"}:00`);
  if (!Number.isFinite(d.getTime())) return m.dateTime || m.date || "";
  const day = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  if (!hasTime) return day;
  const hour = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${day} • ${hour}`;
};
