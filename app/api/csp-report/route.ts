import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Rapports de la politique de sécurité du contenu (next.config.ts) : ce que le navigateur a bloqué,
// ou aurait bloqué en mode signalement. Écrits dans les journaux Vercel (« [CSP] … »), sans base de données.
// Formats : ancien « application/csp-report » (report-uri) et « application/reports+json » (report-to).

const MAX_BODY = 16_000;
/** Un même rapport n'est journalisé qu'une fois par instance et par heure (évite d'inonder les journaux) */
const seen = new Map<string, number>();
const DEDUPE_MS = 3600_000;

type Report = { directive: string; blocked: string; page: string; source?: string };

const trim = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
/** Adresse sans paramètres (pas de jeton ni de donnée personnelle dans les journaux) */
const stripQuery = (u: string) => u.split(/[?#]/)[0];

function normalize(raw: unknown): Report[] {
  const list = Array.isArray(raw) ? raw : [raw];
  const out: Report[] = [];
  for (const item of list.slice(0, 20)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    // report-to : { type: "csp-violation", body: { effectiveDirective, blockedURL, documentURL, sourceFile } }
    const body = (o["csp-report"] || o.body || o) as Record<string, unknown>;
    out.push({
      directive: trim(body["effective-directive"] || body.effectiveDirective || body["violated-directive"], 60),
      blocked: stripQuery(trim(body["blocked-uri"] || body.blockedURL)),
      page: stripQuery(trim(body["document-uri"] || body.documentURL)),
      source: stripQuery(trim(body["source-file"] || body.sourceFile)) || undefined,
    });
  }
  return out;
}

export async function POST(req: NextRequest) {
  const text = (await req.text().catch(() => "")).slice(0, MAX_BODY);
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204 });
  }
  const now = Date.now();
  for (const r of normalize(parsed)) {
    if (!r.directive) continue;
    const key = `${r.directive}|${r.blocked}|${r.page}`;
    if ((seen.get(key) || 0) > now - DEDUPE_MS) continue;
    seen.set(key, now);
    console.warn(`[CSP] ${r.directive} a bloqué « ${r.blocked || "(inline)"} » sur ${r.page}${r.source ? ` (script ${r.source})` : ""}`);
  }
  if (seen.size > 500) seen.clear();
  return new Response(null, { status: 204 });
}
