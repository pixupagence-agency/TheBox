// Modèle de données en ligne du coach (structure v2), sans dépendance à Firebase pour pouvoir être testé seul.
//
// Le tableau tactique continue d'écrire ses données dans le localStorage (clés « thebox_… »).
// Ce module traduit ces clés en documents Firestore structurés, et inversement :
//
//   users/{uid}/teams/{teamId}          équipes            (clé thebox_teams)
//   users/{uid}/players/{teamId__id}    joueurs, 1 doc par joueur (clé thebox_team_rosters)
//   users/{uid}/matches/{matchId}       matchs             (clé thebox_matches_list)
//   users/{uid}/matchData/{matchId__x}  données d'un match : events, notes, state, pitch, setpiece…
//   users/{uid}/settings/{clé}          réglages (équipe / match actifs, notes générales…) + index d'ordre
//
// Chaque document contient :
//   - key : la clé localStorage d'origine ;
//   - raw : la valeur exacte (JSON) qui fait foi pour The Box ;
//   - des champs lisibles (name, teamId, awayTeam, number…) pour les autres applications et l'admin.
// Un « raw » trop gros pour un document (1 Mo) est découpé en documents « …__pN ».

export const CLOUD_COLLECTIONS = ["teams", "players", "matches", "matchData", "settings"] as const;
export type CloudCollection = (typeof CLOUD_COLLECTIONS)[number];

export interface CloudDocSpec {
  coll: CloudCollection;
  id: string;
  data: Record<string, any>;
}

export interface CloudDocRead {
  coll: CloudCollection;
  id: string;
  data: Record<string, any>;
}

export const TEAMS_KEY = "thebox_teams";
export const ROSTERS_KEY = "thebox_team_rosters";
export const MATCHES_KEY = "thebox_matches_list";

/** Document de suivi de la migration (users/{uid}/settings/_migration). */
export const MIGRATION_DOC_ID = "_migration";

// Un caractère accentué occupe jusqu'à 3 octets en UTF-8 : 300 000 caractères restent sous 1 Mo.
export const PART_SIZE = 300_000;

const MATCH_DATA_PREFIXES: Array<[prefix: string, kind: string]> = [
  ["thebox_match_events_", "events"],
  ["thebox_match_notes_", "notes"],
  ["thebox_match_state_", "state"],
  ["thebox_pitch_state_", "pitch"],
  ["thebox_setpiece_roles_", "setpiece"],
  ["thebox_opp_setpiece_roles_", "oppSetpiece"],
  ["thebox_substitutes_", "subs"],
  ["thebox_opp_substitutes_", "oppSubs"],
];

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

function shortHash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Identifiant de document valide pour les règles (lettres, chiffres, _ et -, 128 max). */
export function safeDocId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, "_");
  if (cleaned === raw && raw.length > 0 && raw.length <= 100) return raw;
  return `${cleaned.slice(0, 80) || "id"}_${shortHash(raw)}`;
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}_${n++}`;
  used.add(id);
  return id;
}

/** Champs lisibles : seulement les valeurs simples (Firestore refuse undefined). */
function pick(source: any, fields: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  if (!source || typeof source !== "object") return out;
  for (const f of fields) {
    const v = source[f];
    if (typeof v === "string") out[f] = v.length > 500 ? v.slice(0, 500) : v;
    else if (typeof v === "number" && Number.isFinite(v)) out[f] = v;
    else if (typeof v === "boolean") out[f] = v;
  }
  return out;
}

/** JSON aux clés triées : Firestore ne conserve pas l'ordre des champs. */
export function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function parseJson(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/** Découpe un document dont le « raw » dépasse la taille d'une partie. */
function withParts(spec: CloudDocSpec): CloudDocSpec[] {
  const raw: string = spec.data.raw ?? "";
  if (raw.length <= PART_SIZE) return [spec];
  const chunks: string[] = [];
  for (let i = 0; i < raw.length; i += PART_SIZE) chunks.push(raw.slice(i, i + PART_SIZE));
  const base: CloudDocSpec = { ...spec, data: { ...spec.data, raw: chunks[0], parts: chunks.length } };
  const extra = chunks.slice(1).map((chunk, i) => ({
    coll: spec.coll,
    id: `${spec.id}__p${i + 1}`,
    data: { key: spec.data.key, partOf: spec.id, part: i + 1, raw: chunk },
  }));
  return [base, ...extra];
}

function settingsDoc(key: string, value: string): CloudDocSpec {
  return { coll: "settings", id: safeDocId(key), data: { key, raw: value } };
}

function indexDoc(key: string, index: any): CloudDocSpec {
  return { coll: "settings", id: `index__${key}`, data: { key, role: "index", raw: JSON.stringify(index) } };
}

// ---------------------------------------------------------------------------
// localStorage → documents
// ---------------------------------------------------------------------------

/** Documents représentant une clé localStorage (avant découpage). */
function docsForKeyUnsplit(key: string, value: string): CloudDocSpec[] {
  if (key === TEAMS_KEY || key === MATCHES_KEY) {
    const list = parseJson(value);
    if (!Array.isArray(list)) return [settingsDoc(key, value)];
    const coll: CloudCollection = key === TEAMS_KEY ? "teams" : "matches";
    const fields =
      key === TEAMS_KEY
        ? ["name", "category", "color", "sport"]
        : ["teamId", "homeTeam", "awayTeam", "competition", "date", "time", "dateTime", "isFinished", "homeScore", "awayScore", "score", "finishedAt"];
    const used = new Set<string>();
    const ids: string[] = [];
    const docs: CloudDocSpec[] = list.map((item, order) => {
      const id = uniqueId(safeDocId(String(item?.id ?? `item_${order}`)), used);
      ids.push(id);
      return { coll, id, data: { key, raw: JSON.stringify(item), order, ...pick(item, fields), sourceId: String(item?.id ?? "") } };
    });
    return [...docs, indexDoc(key, ids)];
  }

  if (key === ROSTERS_KEY) {
    const map = parseJson(value);
    if (!map || typeof map !== "object" || Array.isArray(map)) return [settingsDoc(key, value)];
    const used = new Set<string>();
    const index: Record<string, string[]> = {};
    const docs: CloudDocSpec[] = [];
    for (const teamId of Object.keys(map)) {
      const players = Array.isArray(map[teamId]) ? map[teamId] : null;
      if (!players) return [settingsDoc(key, value)]; // forme inattendue : copie brute
      index[teamId] = [];
      players.forEach((p: any, order: number) => {
        const id = uniqueId(safeDocId(`${teamId}__${p?.id ?? order}`), used);
        index[teamId].push(id);
        docs.push({
          coll: "players",
          id,
          data: { key, raw: JSON.stringify(p), order, teamId, ...pick(p, ["name", "number", "role", "status", "isStarter"]) },
        });
      });
    }
    return [...docs, indexDoc(key, index)];
  }

  for (const [prefix, kind] of MATCH_DATA_PREFIXES) {
    if (key.startsWith(prefix)) {
      const matchId = key.slice(prefix.length);
      return [{ coll: "matchData", id: safeDocId(`${matchId}__${kind}`), data: { key, raw: value, matchId, kind } }];
    }
  }

  return [settingsDoc(key, value)];
}

/** Documents (découpés si besoin) représentant une clé localStorage. */
export function docsForKey(key: string, value: string): CloudDocSpec[] {
  return docsForKeyUnsplit(key, value).flatMap(withParts);
}

export const docPath = (coll: string, id: string) => `${coll}/${id}`;

// ---------------------------------------------------------------------------
// documents → localStorage
// ---------------------------------------------------------------------------

export interface CloudKeyValue {
  value: string;
  updatedAt: number;
  paths: string[];
}

/**
 * Reconstruit les valeurs localStorage à partir des documents lus en ligne.
 * Une clé dont une partie manque (envoi interrompu) est ignorée : la version de l'appareil est conservée.
 */
export function rebuildKeysFromDocs(docs: CloudDocRead[]): Map<string, CloudKeyValue> {
  const byPath = new Map<string, CloudDocRead>();
  const partsOf = new Map<string, string[]>();
  const docsByKey = new Map<string, CloudDocRead[]>();

  for (const d of docs) {
    const key = d.data?.key;
    if (typeof key !== "string" || typeof d.data.raw !== "string") continue;
    byPath.set(docPath(d.coll, d.id), d);
    if (typeof d.data.partOf === "string" && typeof d.data.part === "number") {
      const base = docPath(d.coll, d.data.partOf);
      const arr = partsOf.get(base) || [];
      arr[d.data.part] = d.data.raw;
      partsOf.set(base, arr);
    }
    const list = docsByKey.get(key) || [];
    list.push(d);
    docsByKey.set(key, list);
  }

  const fullRaw = (coll: string, id: string): string | null => {
    const d = byPath.get(docPath(coll, id));
    if (!d || typeof d.data.partOf === "string") return null;
    const parts = typeof d.data.parts === "number" ? d.data.parts : 1;
    if (parts <= 1) return d.data.raw;
    const extra = partsOf.get(docPath(coll, id)) || [];
    let out = d.data.raw;
    for (let p = 1; p < parts; p++) {
      if (typeof extra[p] !== "string") return null;
      out += extra[p];
    }
    return out;
  };

  const result = new Map<string, CloudKeyValue>();
  for (const [key, keyDocs] of Array.from(docsByKey.entries())) {
    const updatedAt = Math.max(0, ...keyDocs.map((d) => (typeof d.data.updatedAt === "number" ? d.data.updatedAt : 0)));
    const paths = keyDocs.map((d) => docPath(d.coll, d.id));
    let value: string | null = null;

    const plain = keyDocs.find((d) => d.coll === "settings" && d.data.role !== "index" && typeof d.data.partOf !== "string");
    const index = keyDocs.find((d) => d.coll === "settings" && d.data.role === "index");

    if (plain) {
      value = fullRaw(plain.coll, plain.id);
    } else if (index && (key === TEAMS_KEY || key === MATCHES_KEY)) {
      const coll = key === TEAMS_KEY ? "teams" : "matches";
      const ids = parseJson(index.data.raw);
      if (Array.isArray(ids)) {
        const items: string[] = [];
        let complete = true;
        for (const id of ids) {
          const r = fullRaw(coll, String(id));
          if (r === null) { complete = false; break; }
          items.push(r);
        }
        if (complete) value = `[${items.join(",")}]`;
      }
    } else if (index && key === ROSTERS_KEY) {
      const map = parseJson(index.data.raw);
      if (map && typeof map === "object") {
        const parts: string[] = [];
        let complete = true;
        for (const teamId of Object.keys(map)) {
          const items: string[] = [];
          for (const id of Array.isArray(map[teamId]) ? map[teamId] : []) {
            const r = fullRaw("players", String(id));
            if (r === null) { complete = false; break; }
            items.push(r);
          }
          if (!complete) break;
          parts.push(`${JSON.stringify(teamId)}:[${items.join(",")}]`);
        }
        if (complete) value = `{${parts.join(",")}}`;
      }
    } else {
      const single = keyDocs.find((d) => d.coll === "matchData" && typeof d.data.partOf !== "string");
      if (single) value = fullRaw(single.coll, single.id);
    }

    if (value !== null) result.set(key, { value, updatedAt, paths });
  }
  return result;
}
