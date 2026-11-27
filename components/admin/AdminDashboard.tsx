"use client";
// Console admin : tableau de bord (indicateurs calculés à partir des profils des coachs et de l'état des
// contenus publiés). Les comptes administrateurs sont exclus des indicateurs commerciaux.
import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, CreditCard, FileText, HelpCircle, BookOpen, Lock, TrendingUp, UserPlus, Users, Wrench, XCircle } from "lucide-react";
import type { FirebaseCoachProfile } from "@/lib/firebase";
import { isSuperAdminEmail } from "@/lib/security";
import { LEGAL_DOC_IDS, LEGAL_DOC_META, countPlaceholders, type LegalDocId, type LegalDocument } from "@/lib/legal/documents";
import { subscribeLegalDocument } from "@/lib/legal/store";
import { subscribeGuide, type PublishedGuide } from "@/lib/guide/store";
import { subscribeFaq, type PublishedFaq } from "@/lib/faq";

type Theme = Record<"card" | "cardMuted" | "text" | "sub" | "faint" | "accent" | "chip" | "border" | "goldTile" | "gold", string>;

interface Props {
  th: Theme;
  isModernSleek: boolean;
  profiles: FirebaseCoachProfile[];
  status: "loading" | "ok" | "error";
  maintenanceEnabled: boolean;
  blockedSportsCount: number;
  sportsCount: number;
  onNavigate: (tab: "subscriptions" | "sports" | "legal" | "guide" | "faq" | "maintenance") => void;
}

const DAY = 24 * 3600 * 1000;
const PRICE = { pro: 9.9, proplus: 14.9 };
const SPORT_LABEL: Record<string, string> = { football: "Football", basketball: "Basketball", rugby: "Rugby", handball: "Handball" };

const toDate = (v: unknown): Date | null => {
  const raw = v as { toDate?: () => Date } | string | number | undefined | null;
  if (!raw) return null;
  const d = typeof raw === "object" && typeof raw.toDate === "function" ? raw.toDate() : new Date(raw as string);
  return d instanceof Date && !isNaN(d.getTime()) ? d : null;
};
const planKind = (plan?: string) => (plan === "pro" ? "pro" : plan === "pro_plus" || plan === "club" || plan === "annuel" ? "proplus" : "free");
const euro = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }) + " €";
const pct = (n: number) => `${Math.round(n * 100)} %`;
/** Lundi 0 h de la semaine d'une date (heure locale) */
const weekStart = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

export default function AdminDashboard({ th, isModernSleek, profiles, status, maintenanceEnabled, blockedSportsCount, sportsCount, onNavigate }: Props) {
  // Indicateurs calculés au chargement des profils (l'heure courante est figée à ce moment-là)
  const [computedAt] = useState(() => Date.now());
  const stats = useMemo(() => {
    const now = computedAt;
    const customers = profiles.filter((p) => !p.isAdmin && !isSuperAdminEmail(p.email));
    let pro = 0, proplus = 0, trial = 0, trialExpired = 0, former = 0, deletion = 0, new7 = 0, new30 = 0, en = 0;
    const sports: Record<string, number> = {};
    // Inscriptions des 12 dernières semaines (semaine en cours incluse)
    const thisWeek = weekStart(new Date(now)).getTime();
    const weeks = Array.from({ length: 12 }, (_, i) => ({ start: thisWeek - (11 - i) * 7 * DAY, count: 0 }));
    for (const p of customers) {
      const x = p as FirebaseCoachProfile & Record<string, unknown>;
      const kind = planKind(p.activePlan);
      const trialEnd = toDate(x.trialEndsAt);
      if (kind === "pro") pro++;
      else if (kind === "proplus") proplus++;
      else if (trialEnd && trialEnd.getTime() > now) trial++;
      else if (x.hasHadSubscription) former++;
      else trialExpired++;
      if (x.deletionScheduledAt) deletion++;
      if (p.language === "en") en++;
      const sport = p.preferredSport && SPORT_LABEL[p.preferredSport] ? p.preferredSport : "football";
      sports[sport] = (sports[sport] || 0) + 1;
      const created = toDate(p.createdAt);
      if (created) {
        const age = now - created.getTime();
        if (age <= 7 * DAY) new7++;
        if (age <= 30 * DAY) new30++;
        const w = weeks.find((wk) => created.getTime() >= wk.start && created.getTime() < wk.start + 7 * DAY);
        if (w) w.count++;
      }
    }
    const paying = pro + proplus;
    const decided = paying + trialExpired + former; // comptes dont l'essai est terminé
    return {
      total: customers.length,
      admins: profiles.length - customers.length,
      pro, proplus, paying, trial, trialExpired, former, deletion, new7, new30, en,
      mrr: pro * PRICE.pro + proplus * PRICE.proplus,
      conversion: decided > 0 ? paying / decided : null,
      weeks,
      sports: Object.entries(sports).sort((a, b) => b[1] - a[1]),
    };
  }, [profiles, computedAt]);

  // Contenus publiés : documents légaux, guide, FAQ
  const [legal, setLegal] = useState<Partial<Record<LegalDocId, LegalDocument>>>({});
  const [guide, setGuide] = useState<PublishedGuide | null>(null);
  const [faq, setFaq] = useState<PublishedFaq | null>(null);
  useEffect(() => {
    const unsubs = [
      ...LEGAL_DOC_IDS.map((id) => subscribeLegalDocument(id, (d) => setLegal((prev) => ({ ...prev, [id]: d })))),
      subscribeGuide(setGuide),
      subscribeFaq(setFaq),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // Santé du service (/api/health : serveur + base de données)
  const [health, setHealth] = useState<{ ok: boolean; firestore: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((h) => { if (!cancelled) setHealth({ ok: Boolean(h?.ok), firestore: String(h?.firestore || "error") }); })
      .catch(() => { if (!cancelled) setHealth({ ok: false, firestore: "error" }); });
    return () => { cancelled = true; };
  }, []);

  const goodTone = isModernSleek ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[#00E599]/10 border-[#00E599]/25 text-[#00E599]";
  const warnTone = isModernSleek ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-amber-500/10 border-amber-500/30 text-amber-300";
  const badTone = isModernSleek ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-rose-500/10 border-rose-500/30 text-rose-300";
  const bar = isModernSleek ? "#059669" : "#00E599";

  const kpis = [
    { label: "Coachs inscrits", value: String(stats.total), hint: `+${stats.new7} sur 7 j · +${stats.new30} sur 30 j`, icon: Users },
    { label: "Abonnés payants", value: String(stats.paying), hint: `${stats.pro} PRO · ${stats.proplus} PRO+`, icon: CreditCard },
    { label: "Revenu mensuel estimé", value: euro(stats.mrr), hint: "Tarifs en vigueur, hors taxes non déduites", icon: TrendingUp },
    { label: "Essais en cours", value: String(stats.trial), hint: `${stats.trialExpired} essai${stats.trialExpired > 1 ? "s" : ""} terminé${stats.trialExpired > 1 ? "s" : ""} sans abonnement`, icon: Clock },
    { label: "Conversion des essais", value: stats.conversion === null ? "—" : pct(stats.conversion), hint: "Payants / comptes dont l'essai est terminé", icon: UserPlus },
    { label: "Anciens abonnés", value: String(stats.former), hint: `${stats.deletion} suppression${stats.deletion > 1 ? "s" : ""} de compte programmée${stats.deletion > 1 ? "s" : ""}`, icon: Activity },
  ];

  const legalTodo = LEGAL_DOC_IDS.map((id) => ({ id, doc: legal[id], todo: legal[id] ? countPlaceholders(legal[id]!) : 0 }));
  const maxWeek = Math.max(1, ...stats.weeks.map((w) => w.count));
  const maxSport = Math.max(1, ...stats.sports.map(([, n]) => n));

  const statusRow = (ok: boolean | null, warn: boolean, label: string, detail: string, icon: React.ElementType, onClick?: () => void) => {
    const Icon = icon;
    const tone = ok === null ? th.chip : ok ? (warn ? warnTone : goodTone) : badTone;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${th.cardMuted} ${onClick ? "cursor-pointer hover:opacity-90" : "cursor-default"}`}
      >
        <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-xs font-black ${th.text}`}>{label}</span>
          <span className={`block text-[11px] truncate ${th.sub}`}>{detail}</span>
        </span>
        {ok !== null && (ok && !warn ? <CheckCircle2 className={`h-4 w-4 shrink-0 ${th.accent}`} /> : ok ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-400" />)}
      </button>
    );
  };
  const pubDate = (iso: string | null | undefined) => (iso ? `publié le ${new Date(iso).toLocaleDateString("fr-FR")}` : "version d'origine, jamais publiée");

  return (
    <div className="space-y-5" data-testid="admin-dashboard">
      {status === "error" && (
        <p className={`p-3 rounded-xl border text-xs font-semibold ${badTone}`}>Les comptes n&apos;ont pas pu être chargés : les indicateurs ci-dessous sont incomplets.</p>
      )}

      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`p-4 rounded-2xl border ${th.card}`}>
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.sub}`}>{k.label}</p>
                <Icon className={`h-4 w-4 shrink-0 ${th.faint}`} />
              </div>
              <p className={`mt-2 text-2xl font-black tabular-nums ${th.text}`} data-testid="kpi-value">{status === "loading" ? "…" : k.value}</p>
              <p className={`mt-1 text-[11px] ${th.faint}`}>{k.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-3">
        {/* Inscriptions par semaine */}
        <section className={`lg:col-span-3 p-4 rounded-2xl border ${th.card}`} aria-label="Inscriptions par semaine">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={`text-sm font-black ${th.text}`}>Inscriptions par semaine</h3>
            <p className={`text-[11px] ${th.faint}`}>12 dernières semaines</p>
          </div>
          <div className="mt-4 flex items-end gap-[2px] h-36" role="list">
            {stats.weeks.map((w) => {
              const label = new Date(w.start).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
              return (
                <div key={w.start} role="listitem" className="group relative flex-1 h-full flex flex-col justify-end" aria-label={`Semaine du ${label} : ${w.count} inscription${w.count > 1 ? "s" : ""}`}>
                  <div
                    className="w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
                    style={{ height: w.count ? `${Math.max(4, (w.count / maxWeek) * 100)}%` : "2px", background: w.count ? bar : "currentColor", opacity: w.count ? 1 : 0.15 }}
                  />
                  <span className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap px-2 py-1 rounded-md border text-[10px] font-bold z-10 ${th.card} ${th.text}`}>
                    Sem. du {label} · {w.count}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={`mt-1.5 flex justify-between text-[10px] tabular-nums ${th.faint}`}>
            <span>{new Date(stats.weeks[0].start).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
            <span>Cette semaine</span>
          </div>
        </section>

        {/* Sports des coachs */}
        <section className={`lg:col-span-2 p-4 rounded-2xl border ${th.card}`} aria-label="Sport des coachs">
          <h3 className={`text-sm font-black ${th.text}`}>Sport des coachs</h3>
          <div className="mt-4 space-y-3">
            {stats.sports.length === 0 && <p className={`text-xs ${th.sub}`}>Aucun coach inscrit.</p>}
            {stats.sports.map(([sport, n]) => (
              <div key={sport} title={`${SPORT_LABEL[sport]} : ${n} coach${n > 1 ? "s" : ""}`}>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className={th.text}>{SPORT_LABEL[sport]}</span>
                  <span className={`tabular-nums ${th.sub}`}>{n} · {pct(n / Math.max(1, stats.total))}</span>
                </div>
                <div className="mt-1 h-2 rounded-full overflow-hidden" style={{ background: isModernSleek ? "#e2e8f0" : "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(n / maxSport) * 100}%`, background: bar }} />
                </div>
              </div>
            ))}
          </div>
          <p className={`mt-4 text-[11px] ${th.faint}`}>
            Langue : {stats.total - stats.en} en français · {stats.en} en anglais{stats.admins > 0 ? ` · ${stats.admins} compte${stats.admins > 1 ? "s" : ""} admin exclu${stats.admins > 1 ? "s" : ""}` : ""}
          </p>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* État de la plateforme */}
        <section className={`p-4 rounded-2xl border space-y-2 ${th.card}`} aria-label="État de la plateforme">
          <h3 className={`text-sm font-black mb-3 ${th.text}`}>État de la plateforme</h3>
          {statusRow(
            health === null ? null : health.ok,
            false,
            "Service et base de données",
            health === null ? "Vérification…" : health.ok ? "En ligne" : health.firestore === "quota" ? "Quota Firestore du jour épuisé" : "Problème détecté (voir /api/health)",
            Activity
          )}
          {statusRow(true, maintenanceEnabled, "Mode maintenance", maintenanceEnabled ? "Actif : l'application est fermée au public" : "Inactif : l'application est ouverte", Wrench, () => onNavigate("maintenance"))}
          {statusRow(true, blockedSportsCount > 0, "Accès aux sports", `${sportsCount - blockedSportsCount} ouvert${sportsCount - blockedSportsCount > 1 ? "s" : ""} · ${blockedSportsCount} verrouillé${blockedSportsCount > 1 ? "s" : ""}`, Lock, () => onNavigate("sports"))}
        </section>

        {/* Contenus publiés */}
        <section className={`p-4 rounded-2xl border space-y-2 ${th.card}`} aria-label="Contenus publiés">
          <h3 className={`text-sm font-black mb-3 ${th.text}`}>Contenus publiés</h3>
          {legalTodo.map(({ id, doc, todo }) =>
            <React.Fragment key={id}>
              {statusRow(
                doc ? true : null,
                todo > 0 || !doc?.updatedAt,
                LEGAL_DOC_META[id].label,
                !doc ? "Chargement…" : todo > 0 ? `${todo} information${todo > 1 ? "s" : ""} à compléter · ${pubDate(doc.updatedAt)}` : pubDate(doc.updatedAt) + (doc.version ? ` (version ${doc.version})` : ""),
                FileText,
                () => onNavigate("legal")
              )}
            </React.Fragment>
          )}
          {statusRow(guide ? true : null, !guide?.updatedAt, "Guide d'utilisation", guide ? `${guide.sections.length} articles · ${pubDate(guide.updatedAt)}` : "Chargement…", BookOpen, () => onNavigate("guide"))}
          {statusRow(faq ? true : null, !faq?.updatedAt, "FAQ", faq ? `${faq.items.length} questions · ${pubDate(faq.updatedAt)}` : "Chargement…", HelpCircle, () => onNavigate("faq"))}
        </section>
      </div>
    </div>
  );
}
