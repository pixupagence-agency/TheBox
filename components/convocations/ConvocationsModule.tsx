"use client";

// Module Convocations (route /convocations) : convocations aux MATCHS et aux ENTRAÎNEMENTS d'une équipe.
//  - création / modification d'une convocation (date, horaires, lieu, mot du coach, joueurs convoqués) ;
//  - suivi des réponses : saisies par le coach pour l'instant (réponse donnée de vive voix),
//    l'application mobile joueurs / parents les enverra ensuite ;
//  - entraînements : feuille de présence (présent / retard / excusé / absent) validée par le coach.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, CalendarDays, Check, CheckCircle2, ChevronRight, ClipboardCheck, Clock, Dumbbell, HelpCircle,
  MapPin, MessageSquare, Pencil, Plus, RotateCcw, Trash2, Trophy, UserPlus, Users, X,
} from "lucide-react";
import { confirmAction } from "@/components/ConfirmDialog";
import LogoIcon from "@/components/LogoIcon";
import { getPremiumTheme, premiumLabel } from "@/lib/premiumModalTheme";
import {
  ATTENDANCE_SHORT, ROSTER_STATUS_LABELS, attendanceCounts, convocationTitle, dateBlock, formatDeadline,
  isDeadlinePassed, isUnavailableRosterStatus, isUpcoming, isValidIsoDate, isValidTime, longDate, mergeSelection,
  needsAttendance, newConvocationId, playerAttendanceRate, responseCounts, sortConvocations, sortPlayers,
  suggestedAttendance, todayIso, toConvocationPlayer,
  type AttendanceStatus, type Convocation, type ConvocationKind, type ConvocationPlayer, type ConvocationResponse,
  type RosterPlayerLike,
} from "@/lib/convocations/model";
import { loadConvocations, saveConvocations } from "@/lib/convocations/storage";
import { nearQuotaWarning } from "@/lib/localData";

export interface ConvocationMatchLike {
  id: string;
  teamId?: string;
  homeTeam?: string;
  awayTeam?: string;
  competition?: string;
  date?: string;
  time?: string;
  isFinished?: boolean;
}

export interface ConvocationsModuleProps {
  /** Ignoré : le module suit la charte sombre du Live */
  isModernSleek?: boolean;
  teams: { id: string; name: string; category?: string }[];
  rosters: Record<string, RosterPlayerLike[]>;
  matches: ConvocationMatchLike[];
  activeTeamId: string;
  initialKind?: ConvocationKind;
}

/** Couleur du module Convocations (le Live a son vert, les convocations leur orange) */
export const CONVOCATIONS_ACCENT = "#FF8A1F";

/**
 * Charte du module, alignée sur le Live (fond #0A0E13, cartes #131A22, filets #1F2A36 / #2A3644,
 * texte #E6EDF3, secondaire #C9D3DE, discret #8B98A8) avec l'orange en couleur d'accent.
 */
export const CONVOCATIONS_THEME = {
  ...getPremiumTheme(false),
  panel: "bg-[#0A0E13] text-[#E6EDF3] border-[#1F2A36]",
  sidebar: "bg-[#0A0E13] border-[#1F2A36]",
  border: "border-[#1F2A36]",
  card: "bg-[#131A22] border-[#1F2A36]",
  cardMuted: "bg-[#0F151C] border-[#1F2A36]",
  text: "text-[#E6EDF3]",
  body: "text-[#C9D3DE]",
  sub: "text-[#8B98A8]",
  faint: "text-[#6B7889]",
  input: "bg-[#131A22] border-[#2A3644] text-[#E6EDF3] placeholder-[#6B7889] focus:border-[#FF8A1F]/60 focus:ring-2 focus:ring-[#FF8A1F]/15",
  ghostBtn: "bg-[#131A22] hover:bg-[#1A232D] border-[#2A3644] text-[#E6EDF3]",
  primaryBtn: "bg-[#FF8A1F] hover:bg-[#FF9D42] text-[#1A0E00] shadow-lg shadow-[#FF8A1F]/15",
  tableHead: "bg-[#0F151C] text-[#8B98A8]",
  divide: "divide-[#1F2A36]",
  chip: "bg-[#1A232D] text-[#C9D3DE] border-[#2A3644]",
  accent: "text-[#FF8A1F]",
  accentChip: "bg-[#FF8A1F]/10 text-[#FFA34D] border-[#FF8A1F]/30",
  accentDot: "bg-[#FF8A1F]",
  selected: "bg-[#FF8A1F]/[0.07] border-[#FF8A1F]/60 ring-2 ring-[#FF8A1F]/10",
  selectable: "bg-[#131A22] border-[#1F2A36] hover:border-[#2A3644]",
  segment: "bg-[#131A22] border-[#1F2A36]",
  segmentActive: "bg-[#E6EDF3] text-[#0A0E13]",
  segmentIdle: "text-[#8B98A8] hover:text-[#C9D3DE]",
  option: "[&>option]:bg-[#131A22]",
};

/** Barre du module, identique à celle du Live : logo The Box et pastille du module */
export function ConvocationsBrandBar() {
  return (
    <header
      className="sticky top-0 z-30 h-[52px] shrink-0 border-b border-black/40 shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
      style={{
        // Même pelouse que la barre du Live
        backgroundColor: "#2a7a30",
        backgroundImage: "linear-gradient(90deg, rgba(5,8,11,0.55) 0%, rgba(5,8,11,0.15) 55%, rgba(5,8,11,0.35) 100%), url(/images/live-grass.jpg)",
        backgroundRepeat: "no-repeat, repeat-x",
        backgroundSize: "100% 100%, auto 140px",
        backgroundPosition: "0 0, left center",
      }}
    >
      <div className="mx-auto w-full max-w-[460px] h-full px-4 flex items-center justify-start gap-2.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
        <LogoIcon className="w-7 h-7 text-white shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" aria-hidden />
        <span className="text-[19px] font-black tracking-wider leading-none lowercase text-white select-none">the box</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1" title="Convocations">
          <ClipboardCheck className="w-3 h-3 text-[#FF8A1F]" aria-hidden />
          <span className="text-[10px] font-black tracking-[0.18em] text-[#FFA34D] leading-none">CONVOCATIONS</span>
        </span>
      </div>
    </header>
  );
}

type Period = "upcoming" | "past";

interface FormState {
  mode: "new" | "edit";
  id?: string;
  kind: ConvocationKind;
  date: string;
  startTime: string;
  endTime: string;
  meetTime: string;
  place: string;
  message: string;
  deadline: string;
  matchId: string;
  opponent: string;
  isHome: boolean;
  competition: string;
  title: string;
  theme: string;
  selected: string[];
}

const RESPONSE_ORDER: ConvocationResponse[] = ["present", "maybe", "absent"];
const ATTENDANCE_ORDER: AttendanceStatus[] = ["present", "late", "excused", "absent"];

export default function ConvocationsModule({
  teams, rosters, matches, activeTeamId, initialKind = "match",
}: ConvocationsModuleProps) {
  const th = CONVOCATIONS_THEME;
  const isModernSleek = false;
  const [list, setList] = useState<Convocation[]>(() => loadConvocations());
  const [kind, setKind] = useState<ConvocationKind>(initialKind);
  const [period, setPeriod] = useState<Period>("upcoming");
  const [teamId, setTeamId] = useState<string>(() => (teams.some((t) => t.id === activeTeamId) ? activeTeamId : teams[0]?.id || ""));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstSave = useRef(true);

  // Enregistrement sur l'appareil (puis synchronisation en ligne) à chaque modification
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    if (!saveConvocations(list)) flash("⚠️ Enregistrement impossible : stockage de l'appareil plein.");
    else { const warning = nearQuotaWarning(); if (warning) flash(warning); }
  }, [list]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Échap : ferme le formulaire, puis le détail
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (form) setForm(null);
      else if (selectedId) setSelectedId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [form, selectedId]);

  const flash = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const team = teams.find((t) => t.id === teamId);
  const roster = useMemo(() => sortPlayers((rosters[teamId] || []).filter((p) => p && typeof p.name === "string")), [rosters, teamId]);
  const today = todayIso();

  const teamConvocations = list.filter((c) => c.teamId === teamId);
  const visible = sortConvocations(
    teamConvocations.filter((c) => c.kind === kind && (period === "upcoming" ? isUpcoming(c, today) : !isUpcoming(c, today))),
    period === "upcoming"
  );
  const upcomingCount = (k: ConvocationKind) => teamConvocations.filter((c) => c.kind === k && isUpcoming(c, today)).length;
  const attendanceTodo = teamConvocations.filter((c) => needsAttendance(c, today)).length;
  const selected = list.find((c) => c.id === selectedId) || null;

  const updateConvocation = (id: string, patch: (c: Convocation) => Convocation) => {
    setList((prev) => prev.map((c) => (c.id === id ? { ...patch(c), updatedAt: new Date().toISOString() } : c)));
  };
  const updatePlayer = (id: string, playerId: string, patch: Partial<ConvocationPlayer>) => {
    updateConvocation(id, (c) => ({ ...c, players: c.players.map((p) => (p.playerId === playerId ? { ...p, ...patch } : p)) }));
  };

  // ---------------------------------------------------------------------------
  // Formulaire
  // ---------------------------------------------------------------------------

  const teamMatches = matches.filter((m) => (m.teamId || "team_1") === teamId);
  const isClubName = (name?: string) => !!name && !!team && name.trim().toLowerCase() === team.name.trim().toLowerCase();

  const defaultSelection = (k: ConvocationKind) =>
    roster.filter((p) => !isUnavailableRosterStatus(p.status) && (k === "training" || p.status !== "reserve")).map((p) => p.id);

  const prefillFromMatch = (f: FormState, matchId: string): FormState => {
    const m = teamMatches.find((x) => x.id === matchId);
    if (!m) return { ...f, matchId: "" };
    const awayIsClub = isClubName(m.awayTeam) && !isClubName(m.homeTeam);
    return {
      ...f,
      matchId,
      isHome: !awayIsClub,
      opponent: (awayIsClub ? m.homeTeam : m.awayTeam) || f.opponent,
      competition: m.competition || f.competition,
      date: isValidIsoDate(m.date) ? m.date : f.date,
      startTime: isValidTime(m.time) ? m.time : f.startTime,
    };
  };

  const openNew = () => {
    if (!team) {
      flash("Créez d'abord une équipe pour convoquer des joueurs.");
      return;
    }
    let f: FormState = {
      mode: "new",
      kind,
      date: today,
      startTime: kind === "match" ? "15:00" : "18:30",
      endTime: kind === "training" ? "20:00" : "",
      meetTime: kind === "match" ? "13:45" : "",
      place: "",
      message: "",
      deadline: "",
      matchId: "",
      opponent: "",
      isHome: true,
      competition: "",
      title: kind === "training" ? "Entraînement" : "",
      theme: "",
      selected: defaultSelection(kind),
    };
    // Match : propose le prochain match du calendrier qui n'a pas encore de convocation
    if (kind === "match") {
      const convoked = new Set(teamConvocations.map((c) => c.matchId).filter(Boolean));
      const next = teamMatches
        .filter((m) => !m.isFinished && !convoked.has(m.id) && (!isValidIsoDate(m.date) || m.date >= today))
        .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))[0];
      if (next) f = prefillFromMatch(f, next.id);
    }
    setForm(f);
  };

  const openEdit = (c: Convocation) => {
    setForm({
      mode: "edit",
      id: c.id,
      kind: c.kind,
      date: c.date,
      startTime: c.startTime || "",
      endTime: c.endTime || "",
      meetTime: c.meetTime || "",
      place: c.place || "",
      message: c.message || "",
      deadline: c.deadline || "",
      matchId: c.matchId || "",
      opponent: c.opponent || "",
      isHome: c.isHome !== false,
      competition: c.competition || "",
      title: c.title || "",
      theme: c.theme || "",
      selected: c.players.filter((p) => !p.addedOnSite).map((p) => p.playerId),
    });
  };

  const submitForm = () => {
    if (!form) return;
    if (!isValidIsoDate(form.date)) { flash("Indiquez la date."); return; }
    if (form.kind === "match" && !form.opponent.trim()) { flash("Indiquez l'adversaire."); return; }
    if (form.selected.length === 0) { flash("Sélectionnez au moins un joueur."); return; }
    const now = new Date().toISOString();
    const fields = {
      kind: form.kind,
      teamId,
      date: form.date,
      startTime: isValidTime(form.startTime) ? form.startTime : undefined,
      endTime: form.kind === "training" && isValidTime(form.endTime) ? form.endTime : undefined,
      meetTime: isValidTime(form.meetTime) ? form.meetTime : undefined,
      place: form.place.trim() || undefined,
      message: form.message.trim() || undefined,
      deadline: form.deadline || undefined,
      matchId: form.kind === "match" ? form.matchId || undefined : undefined,
      opponent: form.kind === "match" ? form.opponent.trim() : undefined,
      isHome: form.kind === "match" ? form.isHome : undefined,
      competition: form.kind === "match" ? form.competition.trim() || undefined : undefined,
      title: form.kind === "training" ? form.title.trim() || "Entraînement" : undefined,
      theme: form.kind === "training" ? form.theme.trim() || undefined : undefined,
    };
    if (form.mode === "new") {
      const players = sortPlayers(roster.filter((p) => form.selected.includes(p.id)).map(toConvocationPlayer));
      const created: Convocation = { id: newConvocationId(), ...fields, players, createdAt: now, updatedAt: now };
      setList((prev) => [...prev, created]);
      setSelectedId(created.id);
      setPeriod(isUpcoming(created, today) ? "upcoming" : "past");
      flash(`✅ Convocation créée · ${players.length} joueur${players.length > 1 ? "s" : ""}`);
    } else if (form.id) {
      updateConvocation(form.id, (c) => ({ ...c, ...fields, players: mergeSelection(c.players, form.selected, roster) }));
      setSelectedId(form.id);
      flash("✅ Convocation mise à jour");
    }
    setForm(null);
  };

  const deleteConvocation = async (c: Convocation) => {
    const ok = await confirmAction({
      title: "Supprimer cette convocation ?",
      message: `${convocationTitle(c, team?.name)} · ${longDate(c.date)}. Les réponses et la feuille de présence seront perdues.`,
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
    setList((prev) => prev.filter((x) => x.id !== c.id));
    setSelectedId(null);
    flash("Convocation supprimée");
  };

  // ---------------------------------------------------------------------------
  // Réponses et présence
  // ---------------------------------------------------------------------------

  const setResponse = (c: Convocation, p: ConvocationPlayer, response: ConvocationResponse) => {
    const next = p.response === response ? "pending" : response;
    updatePlayer(c.id, p.playerId, next === "pending"
      ? { response: "pending", respondedBy: undefined, respondedAt: undefined }
      : { response: next, respondedBy: "coach", respondedAt: new Date().toISOString() });
  };

  const setAttendance = (c: Convocation, p: ConvocationPlayer, status: AttendanceStatus) => {
    updatePlayer(c.id, p.playerId, { attendance: status });
  };

  const markAllPresent = (c: Convocation) => {
    updateConvocation(c.id, (x) => ({ ...x, players: x.players.map((p) => ({ ...p, attendance: suggestedAttendance(p) || "present" })) }));
  };

  const validateAttendance = (c: Convocation) => {
    const players = c.players.map((p) => ({ ...p, attendance: suggestedAttendance(p) }));
    const missing = players.filter((p) => !p.attendance).length;
    if (missing > 0) {
      flash(`Pointez encore ${missing} joueur${missing > 1 ? "s" : ""} avant de valider.`);
      return;
    }
    updateConvocation(c.id, (x) => ({ ...x, players, attendanceValidatedAt: new Date().toISOString() }));
    const counts = attendanceCounts({ ...c, players });
    flash(`✅ Présence validée · ${counts.present + counts.late}/${counts.total} présents`);
  };

  const reopenAttendance = (c: Convocation) => {
    updateConvocation(c.id, (x) => ({ ...x, attendanceValidatedAt: undefined }));
  };

  const addOnSite = (c: Convocation, playerId: string) => {
    const p = roster.find((x) => x.id === playerId);
    if (!p) return;
    updateConvocation(c.id, (x) => ({
      ...x,
      players: sortPlayers([...x.players, { ...toConvocationPlayer(p), attendance: "present", addedOnSite: true }]),
    }));
  };

  const removeOnSite = (c: Convocation, playerId: string) => {
    updateConvocation(c.id, (x) => ({ ...x, players: x.players.filter((p) => p.playerId !== playerId) }));
  };

  // ---------------------------------------------------------------------------
  // Rendu : pensé d'abord pour le téléphone (un écran à la fois, onglets en bas, actions au pouce),
  // puis élargi en deux colonnes (liste + détail) à partir des grands écrans.
  // ---------------------------------------------------------------------------

  const kindLabel = kind === "match" ? "Matchs" : "Entraînements";
  const showDetailOnMobile = !!form || !!selected;

  const changeKind = (k: ConvocationKind) => { setKind(k); setSelectedId(null); setForm(null); };
  const changeTeam = (id: string) => { setTeamId(id); setSelectedId(null); setForm(null); };
  const closePane = () => { if (form) setForm(null); else setSelectedId(null); };
  const openPendingAttendance = () => {
    // Ouvre la plus ancienne séance à valider (celle du jour est dans « À venir »)
    const first = sortConvocations(teamConvocations.filter((c) => needsAttendance(c, today)), true)[0];
    setKind("training");
    setForm(null);
    if (first) {
      setPeriod(isUpcoming(first, today) ? "upcoming" : "past");
      setSelectedId(first.id);
    }
  };

  const segBtn = (active: boolean) =>
    `h-10 px-3 rounded-lg text-sm font-black transition cursor-pointer whitespace-nowrap ${active ? th.segmentActive : th.segmentIdle}`;
  const ghostBtn = `h-11 px-4 rounded-xl border text-sm font-black transition cursor-pointer inline-flex items-center justify-center gap-1.5 ${th.ghostBtn}`;
  const primaryBtn = `h-11 px-4 rounded-xl text-sm font-black transition cursor-pointer inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${th.primaryBtn}`;
  const iconBtn = "h-11 w-11 rounded-xl border inline-flex items-center justify-center transition cursor-pointer shrink-0";
  // 16 px sur téléphone : iOS ne zoome pas sur le champ à la saisie
  const fieldBase = `w-full rounded-xl px-3.5 text-base font-semibold border outline-none transition ${th.input}`;
  const fieldCls = `${fieldBase} h-12`;
  const footerCls = `shrink-0 border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] ${th.border} ${th.sidebar}`;

  const responseTone: Record<ConvocationResponse, string> = isModernSleek
    ? { present: "bg-emerald-600 text-white border-emerald-600", maybe: "bg-amber-500 text-white border-amber-500", absent: "bg-rose-600 text-white border-rose-600", pending: "" }
    : { present: "bg-[#00E599] text-[#04120c] border-[#00E599]", maybe: "bg-amber-400 text-[#1d1300] border-amber-400", absent: "bg-rose-500 text-white border-rose-500", pending: "" };
  const attendanceTone: Record<AttendanceStatus, string> = isModernSleek
    ? { present: "bg-emerald-600 text-white border-emerald-600", late: "bg-sky-600 text-white border-sky-600", excused: "bg-amber-500 text-white border-amber-500", absent: "bg-rose-600 text-white border-rose-600" }
    : { present: "bg-[#00E599] text-[#04120c] border-[#00E599]", late: "bg-sky-400 text-[#03131d] border-sky-400", excused: "bg-amber-400 text-[#1d1300] border-amber-400", absent: "bg-rose-500 text-white border-rose-500" };
  const idleChoice = `border ${th.ghostBtn}`;

  const attendanceSummary = (c: Convocation) => {
    const effective = c.players.map((p) => ({ p, status: suggestedAttendance(p) }));
    const missing = effective.filter((x) => !x.status).length;
    const counts = attendanceCounts({ ...c, players: effective.map(({ p, status }) => ({ ...p, attendance: status })) });
    return { effective, missing, counts };
  };

  /** Entête d'un écran (détail, formulaire) : retour sur téléphone, titre, actions */
  const paneHeader = (eyebrow: string, title: string, actions?: React.ReactNode) => (
    <header className={`shrink-0 flex items-center gap-1.5 px-2 py-2 border-b ${th.border}`}>
      <button type="button" onClick={closePane} className={`${iconBtn} border-transparent ${th.text}`} aria-label="Retour">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex-1 py-1">
        <p className={`text-[10px] font-black uppercase tracking-[0.16em] truncate ${th.accent}`}>{eyebrow}</p>
        <h2 className={`text-lg font-black tracking-tight truncate leading-tight ${th.text}`}>{title}</h2>
      </div>
      {actions}
    </header>
  );

  const renderCard = (c: Convocation) => {
    const b = dateBlock(c.date);
    const counts = responseCounts(c);
    const isSel = c.id === selectedId && !form;
    const todo = needsAttendance(c, today);
    const att = c.attendanceValidatedAt ? attendanceCounts(c) : null;
    return (
      <button
        key={c.id}
        type="button"
        onClick={() => { setForm(null); setSelectedId(c.id); }}
        className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 active:scale-[0.99] ${isSel ? th.selected : th.selectable}`}
      >
        <div className={`w-14 shrink-0 rounded-xl border text-center py-2 ${th.cardMuted}`}>
          <p className={`text-[10px] font-black ${th.faint}`}>{b.weekday}</p>
          <p className={`text-xl font-black leading-none ${th.text}`}>{b.day}</p>
          <p className={`text-[10px] font-black ${th.faint}`}>{b.month}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[15px] font-black truncate ${th.text}`}>{convocationTitle(c, team?.name)}</p>
          <p className={`text-xs font-semibold truncate ${th.sub}`}>
            {[c.kind === "match" ? c.competition : c.theme, c.startTime, c.place].filter(Boolean).join(" · ") || longDate(c.date)}
          </p>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {att ? (
              <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${th.accentChip}`}>
                Présence validée · {att.present + att.late}/{att.total}
              </span>
            ) : todo ? (
              <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${th.goldChip}`}>Présence à valider</span>
            ) : (
              <>
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${th.accentChip}`}>{counts.present} ✓</span>
                {counts.maybe > 0 && <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${th.goldChip}`}>{counts.maybe} ?</span>}
                {counts.absent > 0 && <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${th.danger}`}>{counts.absent} ✗</span>}
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${th.chip}`}>{counts.pending} sans réponse</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 shrink-0 ${th.faint}`} />
      </button>
    );
  };

  const kindTabs = [
    { k: "match" as const, label: "Matchs", icon: Trophy },
    { k: "training" as const, label: "Entraînements", icon: Dumbbell },
  ];

  const renderListPane = () => (
    <section className={`${showDetailOnMobile ? "hidden" : "flex"} relative w-full shrink-0 flex-col min-h-0 ${th.border}`}>
      <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {teams.length > 1 ? (
              <select
                value={teamId}
                onChange={(e) => changeTeam(e.target.value)}
                aria-label="Équipe"
                className={`max-w-full h-8 -ml-0.5 bg-transparent text-xs font-black uppercase tracking-[0.14em] outline-none cursor-pointer ${th.accent} ${th.option}`}
              >
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ) : (
              <p className={`text-xs font-black uppercase tracking-[0.14em] truncate ${th.accent}`}>{team?.name || "Aucune équipe"}</p>
            )}
            <h1 className={`text-2xl font-black tracking-tight leading-tight ${th.text}`}>{kindLabel}</h1>
          </div>
        </div>

        {attendanceTodo > 0 && (
          <button
            type="button"
            onClick={openPendingAttendance}
            className={`w-full min-h-12 px-3 py-2.5 rounded-xl border text-left text-sm font-black cursor-pointer flex items-center gap-2 ${th.goldChip}`}
          >
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span className="flex-1">{attendanceTodo} feuille{attendanceTodo > 1 ? "s" : ""} de présence à valider</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}

        <div role="tablist" aria-label="Période" className={`grid grid-cols-2 p-1 rounded-xl border ${th.segment}`}>
          <button type="button" role="tab" aria-selected={period === "upcoming"} onClick={() => setPeriod("upcoming")} className={segBtn(period === "upcoming")}>À venir</button>
          <button type="button" role="tab" aria-selected={period === "past"} onClick={() => setPeriod("past")} className={segBtn(period === "past")}>Passées</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-thin">
        <div className="space-y-2">
        {visible.length === 0 ? (
          <div className={`col-span-full w-full rounded-2xl border border-dashed p-6 text-center ${th.border}`}>
            <div className={`mx-auto w-12 h-12 rounded-2xl border flex items-center justify-center ${th.accentChip}`}>
              {kind === "match" ? <Trophy className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
            </div>
            <p className={`mt-3 text-sm font-black ${th.text}`}>
              {period === "upcoming" ? "Aucune convocation à venir" : "Aucune convocation passée"}
            </p>
            <p className={`text-xs mt-1 ${th.sub}`}>
              {kind === "match" ? "Convoquez vos joueurs pour un prochain match." : "Planifiez une séance et convoquez vos joueurs."}
            </p>
            {period === "upcoming" && (
              <button type="button" onClick={openNew} className={`${primaryBtn} mt-4`}>
                <Plus className="w-4 h-4" /> Nouvelle convocation
              </button>
            )}
          </div>
        ) : (
          visible.map(renderCard)
        )}
        </div>
      </div>

      {/* Téléphone : bouton flottant et onglets en bas, à portée de pouce */}
      <button
        type="button"
        onClick={openNew}
        className={`absolute right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 w-14 h-14 rounded-2xl inline-flex items-center justify-center shadow-xl cursor-pointer active:scale-95 transition ${th.primaryBtn}`}
        aria-label="Nouvelle convocation"
      >
        <Plus className="w-6 h-6" />
      </button>
      <nav aria-label="Type de convocation" className={`shrink-0 grid grid-cols-2 border-t pb-[env(safe-area-inset-bottom)] ${th.border} ${th.sidebar}`}>
        {kindTabs.map(({ k, label, icon: Icon }) => {
          const active = kind === k;
          const n = upcomingCount(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => changeKind(k)}
              aria-current={active ? "page" : undefined}
              className={`relative h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-black cursor-pointer transition ${active ? th.accent : th.faint}`}
            >
              {active && <span className={`absolute top-0 inset-x-8 h-0.5 rounded-full ${th.accentDot}`} />}
              <span className="relative">
                <Icon className="w-5 h-5" />
                {n > 0 && (
                  <span className={`absolute -top-1.5 -right-3 min-w-4 h-4 px-1 rounded-full text-[9px] leading-4 text-center ${th.primaryBtn}`}>{n}</span>
                )}
              </span>
              {label}
            </button>
          );
        })}
      </nav>
    </section>
  );

  const infoRow = (icon: React.ReactNode, label: string, value?: string) =>
    value ? (
      <div className={`p-3 rounded-xl border ${th.card}`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.14em] flex items-center gap-1 ${th.faint}`}>{icon}{label}</p>
        <p className={`text-[15px] font-bold mt-0.5 ${th.text}`}>{value}</p>
      </div>
    ) : null;

  const renderResponses = (c: Convocation) => {
    const counts = responseCounts(c);
    const answered = counts.total - counts.pending;
    return (
      <section className="space-y-3">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Présents", n: counts.present, tone: th.accent },
            { label: "Incertains", n: counts.maybe, tone: th.gold },
            { label: "Absents", n: counts.absent, tone: isModernSleek ? "text-rose-600" : "text-rose-400" },
            { label: "Sans rép.", n: counts.pending, tone: th.sub },
          ].map((k) => (
            <div key={k.label} className={`px-2 py-2.5 rounded-xl border text-center ${th.card}`}>
              <p className={`text-2xl font-black leading-none ${k.tone}`}>{k.n}</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.08em] mt-1 truncate ${th.faint}`}>{k.label}</p>
            </div>
          ))}
        </div>
        <div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isModernSleek ? "bg-slate-100" : "bg-white/[0.06]"}`}>
            <div className={`h-full ${th.accentDot}`} style={{ width: `${counts.total ? (answered / counts.total) * 100 : 0}%` }} />
          </div>
          <p className={`text-xs font-semibold mt-1 ${th.sub}`}>{answered}/{counts.total} réponses reçues</p>
        </div>

        <div className={`rounded-2xl border overflow-hidden ${th.card}`}>
          <div className={`px-3 py-2.5 ${th.tableHead}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">Réponses des joueurs</p>
            <p className="text-[11px] font-semibold">Touchez une réponse pour l&apos;enregistrer</p>
          </div>
          <ul className={`divide-y ${th.divide}`}>
            {c.players.filter((p) => !p.addedOnSite).map((p) => (
              <li key={p.playerId} className="px-3 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-7 text-center text-xs font-black tabular-nums shrink-0 ${th.sub}`}>{p.number ?? "–"}</span>
                  <div className="min-w-0">
                    <p className={`text-[15px] font-bold truncate ${th.text}`}>{p.name}</p>
                    {p.respondedAt && (
                      <p className={`text-[11px] font-semibold ${th.faint}`}>
                        {p.respondedBy === "parent" ? "Parent" : p.respondedBy === "player" ? "Joueur" : "Saisi par le coach"} ·{" "}
                        {new Date(p.respondedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={`Réponse de ${p.name}`}>
                  {RESPONSE_ORDER.map((r) => {
                    const on = p.response === r;
                    const Icon = r === "present" ? Check : r === "maybe" ? HelpCircle : X;
                    const label = r === "present" ? "Présent" : r === "maybe" ? "Incertain" : "Absent";
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResponse(c, p, r)}
                        aria-pressed={on}
                        className={`h-11 px-2.5 rounded-xl text-xs font-black transition cursor-pointer inline-flex items-center justify-center gap-1 ${on ? `border ${responseTone[r]}` : idleChoice}`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
                {(p.response === "absent" || p.response === "maybe" || p.note) && (
                  <input
                    type="text"
                    value={p.note || ""}
                    onChange={(e) => updatePlayer(c.id, p.playerId, { note: e.target.value.slice(0, 120) || undefined })}
                    placeholder="Précision (blessure, école…)"
                    aria-label={`Précision pour ${p.name}`}
                    className={`${fieldBase} h-11`}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  };

  const renderAttendance = (c: Convocation) => {
    const validated = !!c.attendanceValidatedAt;
    const { effective, missing, counts } = attendanceSummary(c);
    const notListed = roster.filter((r) => !c.players.some((p) => p.playerId === r.id));
    return (
      <section className={`rounded-2xl border overflow-hidden ${th.card}`}>
        <div className={`px-3 py-3 flex items-center justify-between gap-2 border-b ${th.border}`}>
          <div className="min-w-0">
            <p className={`text-[15px] font-black flex items-center gap-1.5 ${th.text}`}>
              <ClipboardCheck className={`w-4 h-4 ${th.accent}`} /> Feuille de présence
            </p>
            <p className={`text-xs font-semibold ${th.sub}`}>
              {validated
                ? `Validée le ${new Date(c.attendanceValidatedAt!).toLocaleDateString(undefined, { day: "numeric", month: "long" })} · ${counts.present + counts.late}/${counts.total} présents`
                : "Pré-remplie d'après les réponses : corrigez puis validez."}
            </p>
          </div>
          {validated && (
            <button type="button" onClick={() => reopenAttendance(c)} className={`${ghostBtn} shrink-0`}>
              <RotateCcw className="w-4 h-4" /> Modifier
            </button>
          )}
        </div>

        <div className={`px-3 py-2 flex flex-wrap gap-1.5 border-b ${th.border}`}>
          {ATTENDANCE_ORDER.map((s) => (
            <span key={s} className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${th.chip}`}>
              {ATTENDANCE_SHORT[s]} · {counts[s]}
            </span>
          ))}
          {!validated && missing > 0 && (
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${th.goldChip}`}>À pointer · {missing}</span>
          )}
        </div>

        <ul className={`divide-y ${th.divide}`}>
          {effective.map(({ p, status }) => {
            const rate = playerAttendanceRate(list, c.teamId, p.playerId);
            return (
              <li key={p.playerId} className="px-3 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-7 text-center text-xs font-black tabular-nums shrink-0 ${th.sub}`}>{p.number ?? "–"}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[15px] font-bold truncate ${th.text}`}>
                      {p.name}
                      {p.addedOnSite && <span className={`ml-1.5 text-[9px] font-black px-1 py-0.5 rounded border align-middle ${th.chip}`}>non convoqué</span>}
                    </p>
                    <p className={`text-[11px] font-semibold ${th.faint}`}>
                      {p.addedOnSite ? "Ajouté sur place" : `Réponse : ${p.response === "pending" ? "aucune" : p.response === "present" ? "présent" : p.response === "maybe" ? "incertain" : "absent"}`}
                      {rate.sessions > 0 && ` · assiduité ${Math.round((rate.attended / rate.sessions) * 100)} % (${rate.attended}/${rate.sessions})`}
                    </p>
                  </div>
                  {!validated && p.addedOnSite && (
                    <button
                      type="button"
                      onClick={() => removeOnSite(c, p.playerId)}
                      className={`${iconBtn} ${idleChoice}`}
                      title="Retirer de la feuille"
                      aria-label={`Retirer ${p.name} de la feuille`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {validated && (
                    <span className={`h-8 px-2.5 rounded-lg text-[11px] font-black inline-flex items-center border shrink-0 ${status ? attendanceTone[status] : th.chip}`}>
                      {status ? ATTENDANCE_SHORT[status] : "—"}
                    </span>
                  )}
                </div>
                {!validated && (
                  <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={`Présence de ${p.name}`}>
                    {ATTENDANCE_ORDER.map((s) => {
                      const on = status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAttendance(c, p, s)}
                          aria-pressed={on}
                          className={`h-11 px-1.5 rounded-xl text-xs font-black transition cursor-pointer ${on ? `border ${attendanceTone[s]}` : idleChoice}`}
                        >
                          {ATTENDANCE_SHORT[s]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!validated && notListed.length > 0 && (
          <div className={`px-3 py-3 border-t space-y-1.5 ${th.border}`}>
            <label htmlFor={`onsite-${c.id}`} className={`text-xs font-bold flex items-center gap-1.5 ${th.sub}`}>
              <UserPlus className="w-4 h-4" /> Joueur présent sans convocation
            </label>
            <select
              id={`onsite-${c.id}`}
              value=""
              onChange={(e) => { if (e.target.value) addOnSite(c, e.target.value); }}
              className={`${fieldCls} cursor-pointer ${th.option}`}
            >
              <option value="">Ajouter un joueur…</option>
              {notListed.map((r) => (
                <option key={r.id} value={r.id}>{r.number ?? "–"} · {r.name}</option>
              ))}
            </select>
          </div>
        )}
      </section>
    );
  };

  const showAttendanceFor = (c: Convocation) => c.kind === "training" && (c.date <= today || !!c.attendanceValidatedAt);

  const renderDetail = (c: Convocation) => {
    const isTraining = c.kind === "training";
    const linkedMatch = c.matchId ? matches.find((m) => m.id === c.matchId) : undefined;
    const showAttendance = showAttendanceFor(c);
    const deadlinePassed = isDeadlinePassed(c);
    const schedule = isTraining
      ? [c.startTime && `${c.startTime}${c.endTime ? ` – ${c.endTime}` : ""}`, c.meetTime && `RDV ${c.meetTime}`].filter(Boolean).join(" · ")
      : [c.startTime && `Coup d'envoi ${c.startTime}`, c.meetTime && `RDV ${c.meetTime}`].filter(Boolean).join(" · ");
    return (
      <div className="space-y-4">
        {isTraining && c.theme && <p className={`text-[15px] font-semibold ${th.body}`}>{c.theme}</p>}

        <div className="grid grid-cols-1 gap-2">
          {infoRow(<CalendarDays className="w-3 h-3" />, "Date", longDate(c.date))}
          {infoRow(<Clock className="w-3 h-3" />, "Horaires", schedule)}
          {infoRow(<MapPin className="w-3 h-3" />, "Lieu", c.place)}
          {c.deadline && infoRow(<AlertTriangle className="w-3 h-3" />, deadlinePassed ? "Réponses closes depuis" : "Réponse attendue avant", formatDeadline(c.deadline))}
          {linkedMatch && infoRow(<Trophy className="w-3 h-3" />, "Match du calendrier", `${linkedMatch.homeTeam || ""} vs ${linkedMatch.awayTeam || ""}`)}
        </div>

        {c.message && (
          <div className={`p-3 rounded-xl border ${th.cardMuted}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.14em] flex items-center gap-1 ${th.faint}`}><MessageSquare className="w-3 h-3" /> Mot du coach</p>
            <p className={`text-[15px] mt-1 whitespace-pre-line ${th.body}`}>{c.message}</p>
          </div>
        )}

        {showAttendance && renderAttendance(c)}
        {renderResponses(c)}

        {isTraining && !showAttendance && (
          <p className={`text-xs font-semibold ${th.sub}`}>
            La feuille de présence s&apos;ouvre le jour de la séance : vous y validerez qui était là.
          </p>
        )}
        <p className={`text-[11px] ${th.faint}`}>
          Les joueurs et les parents pourront bientôt répondre depuis l&apos;application mobile. En attendant, enregistrez ici les réponses reçues.
        </p>
      </div>
    );
  };

  const renderForm = (f: FormState) => {
    const set = (patch: Partial<FormState>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev));
    const isTraining = f.kind === "training";
    const toggle = (id: string) => set({ selected: f.selected.includes(id) ? f.selected.filter((x) => x !== id) : [...f.selected, id] });
    const label = (text: string, htmlFor: string, required = false) => (
      <label htmlFor={htmlFor} className={`${premiumLabel} ${th.sub}`}>
        {text} {required && <span className={th.accent}>*</span>}
      </label>
    );
    const selectableMatches = teamMatches.filter((m) => !m.isFinished || m.id === f.matchId);
    const quickBtn = `h-9 px-3 rounded-lg border text-xs font-black cursor-pointer ${th.ghostBtn}`;
    return (
      <form id="cv-form" className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
        {!isTraining && (
          <>
            {selectableMatches.length > 0 && (
              <div>
                {label("Match du calendrier", "cv-match")}
                <select
                  id="cv-match"
                  value={f.matchId}
                  onChange={(e) => setForm((prev) => (prev ? (e.target.value ? prefillFromMatch(prev, e.target.value) : { ...prev, matchId: "" }) : prev))}
                  className={`${fieldCls} cursor-pointer ${th.option}`}
                >
                  <option value="">Aucun (saisie libre)</option>
                  {selectableMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.homeTeam} vs {m.awayTeam}{m.date ? ` · ${m.date.split("-").reverse().join("/")}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <div>
                {label("Adversaire", "cv-opponent", true)}
                <input id="cv-opponent" type="text" value={f.opponent} onChange={(e) => set({ opponent: e.target.value })} className={fieldCls} placeholder="Nom de l'adversaire" maxLength={80} autoComplete="off" />
              </div>
              <div>
                <span className={`${premiumLabel} ${th.sub}`}>Terrain</span>
                <div className={`grid grid-cols-2 p-1 rounded-xl border ${th.segment}`}>
                  <button type="button" onClick={() => set({ isHome: true })} aria-pressed={f.isHome} className={segBtn(f.isHome)}>Domicile</button>
                  <button type="button" onClick={() => set({ isHome: false })} aria-pressed={!f.isHome} className={segBtn(!f.isHome)}>Extérieur</button>
                </div>
              </div>
            </div>
            <div>
              {label("Compétition", "cv-comp")}
              <input id="cv-comp" type="text" value={f.competition} onChange={(e) => set({ competition: e.target.value })} className={fieldCls} placeholder="Championnat, Coupe, Amical…" maxLength={80} />
            </div>
          </>
        )}

        {isTraining && (
          <div className="grid grid-cols-1 gap-3">
            <div>
              {label("Titre de la séance", "cv-title")}
              <input id="cv-title" type="text" value={f.title} onChange={(e) => set({ title: e.target.value })} className={fieldCls} placeholder="Entraînement" maxLength={80} />
            </div>
            <div>
              {label("Thème / objectif", "cv-theme")}
              <input id="cv-theme" type="text" value={f.theme} onChange={(e) => set({ theme: e.target.value })} className={fieldCls} placeholder="Pressing, finition, vitesse…" maxLength={120} />
            </div>
          </div>
        )}

        <div className={`grid grid-cols-2 ${isTraining ? "" : ""} gap-3`}>
          <div className="col-span-2">
            {label("Date", "cv-date", true)}
            <input id="cv-date" type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className={fieldCls} required />
          </div>
          <div>
            {label(isTraining ? "Début" : "Coup d'envoi", "cv-start")}
            <input id="cv-start" type="time" value={f.startTime} onChange={(e) => set({ startTime: e.target.value })} className={fieldCls} />
          </div>
          {isTraining && (
            <div>
              {label("Fin", "cv-end")}
              <input id="cv-end" type="time" value={f.endTime} onChange={(e) => set({ endTime: e.target.value })} className={fieldCls} />
            </div>
          )}
          <div>
            {label("Rendez-vous", "cv-meet")}
            <input id="cv-meet" type="time" value={f.meetTime} onChange={(e) => set({ meetTime: e.target.value })} className={fieldCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            {label("Lieu", "cv-place")}
            <input id="cv-place" type="text" value={f.place} onChange={(e) => set({ place: e.target.value })} className={fieldCls} placeholder={isTraining ? "Terrain d'entraînement" : "Stade"} maxLength={120} />
          </div>
          <div>
            {label("Réponse attendue avant", "cv-deadline")}
            <input id="cv-deadline" type="datetime-local" value={f.deadline} onChange={(e) => set({ deadline: e.target.value })} className={fieldCls} />
          </div>
        </div>

        <div>
          {label("Mot du coach", "cv-message")}
          <textarea id="cv-message" value={f.message} onChange={(e) => set({ message: e.target.value })} rows={3} className={`${fieldBase} py-3 resize-y`} placeholder="Tenue, matériel, consignes…" maxLength={1000} />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className={`${premiumLabel} !mb-0 ${th.sub}`}>Joueurs convoqués · {f.selected.length}/{roster.length}</span>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => set({ selected: defaultSelection(f.kind) })} className={quickBtn}>Disponibles</button>
              <button type="button" onClick={() => set({ selected: roster.map((p) => p.id) })} className={quickBtn}>Tous</button>
              <button type="button" onClick={() => set({ selected: [] })} className={quickBtn}>Aucun</button>
            </div>
          </div>
          {roster.length === 0 ? (
            <p className={`text-xs font-semibold p-3 rounded-xl border ${th.cardMuted} ${th.sub}`}>
              L&apos;effectif de cette équipe est vide : ajoutez des joueurs depuis la gestion des équipes.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 scrollbar-thin">
              {roster.map((p) => {
                const on = f.selected.includes(p.id);
                const statusLabel = p.status ? ROSTER_STATUS_LABELS[p.status] : undefined;
                return (
                  <label
                    key={p.id}
                    className={`min-h-12 flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition ${on ? th.selected : th.selectable}`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="w-5 h-5 accent-orange-500 cursor-pointer shrink-0" />
                    <span className={`w-6 text-center text-xs font-black tabular-nums ${th.sub}`}>{p.number ?? "–"}</span>
                    <span className={`text-[15px] font-bold truncate flex-1 ${th.text}`}>{p.name}</span>
                    {statusLabel && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${isUnavailableRosterStatus(p.status) ? th.danger : th.chip}`}>{statusLabel}</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </form>
    );
  };

  const renderDetailPane = () => {
    const scrollCls = "flex-1 overflow-y-auto px-4 py-4 scrollbar-thin";
    if (form) {
      return (
        <>
          {paneHeader(form.kind === "training" ? "Entraînement" : "Match", form.mode === "new" ? "Nouvelle convocation" : "Modifier la convocation")}
          {/* Clé : la vue revient en haut à chaque ouverture du formulaire */}
          <div key={`form-${form.id || "new"}`} className={scrollCls}><div className="max-w-4xl mx-auto">{renderForm(form)}</div></div>
          <footer className={`${footerCls} grid grid-cols-[auto_1fr] gap-2`}>
            <button type="button" onClick={() => setForm(null)} className={ghostBtn}>Annuler</button>
            <button type="submit" form="cv-form" className={primaryBtn}>
              <Check className="w-4 h-4" /> {form.mode === "new" ? "Créer la convocation" : "Enregistrer"}
            </button>
          </footer>
        </>
      );
    }
    if (selected) {
      const c = selected;
      const pendingSheet = showAttendanceFor(c) && !c.attendanceValidatedAt;
      const missing = pendingSheet ? attendanceSummary(c).missing : 0;
      return (
        <>
          {paneHeader(
            c.kind === "training" ? "Entraînement" : [c.competition, c.isHome === false ? "Extérieur" : "Domicile"].filter(Boolean).join(" · "),
            convocationTitle(c, team?.name),
            <>
              <button type="button" onClick={() => openEdit(c)} className={`${iconBtn} ${th.ghostBtn}`} title="Modifier" aria-label="Modifier la convocation">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => deleteConvocation(c)} className={`${iconBtn} ${th.danger}`} title="Supprimer" aria-label="Supprimer la convocation">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <div key={c.id} className={scrollCls}><div className="max-w-4xl mx-auto">{renderDetail(c)}</div></div>
          {pendingSheet && (
            <footer className={`${footerCls} grid grid-cols-[auto_1fr] gap-2`}>
              <button type="button" onClick={() => markAllPresent(c)} className={ghostBtn}>
                <Users className="w-4 h-4" /> Tous présents
              </button>
              <button type="button" onClick={() => validateAttendance(c)} disabled={missing > 0} className={primaryBtn}>
                <CheckCircle2 className="w-4 h-4" /> {missing > 0 ? `Encore ${missing} à pointer` : "Valider la présence"}
              </button>
            </footer>
          )}
        </>
      );
    }
    // Rien d'ouvert : la liste occupe tout l'écran, ce panneau est masqué
    return null;
  };

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden font-[Inter,system-ui,sans-serif] ${th.panel}`}>
      <ConvocationsBrandBar />
      <div className="flex-1 min-h-0 mx-auto w-full max-w-[460px] flex">
        {renderListPane()}
        <section className={`${showDetailOnMobile ? "flex" : "hidden"} flex-1 min-w-0 min-h-0 flex-col`}>
          {renderDetailPane()}
        </section>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 -translate-x-1/2 top-[4rem] z-40 w-max max-w-[min(428px,calc(100vw-2rem))] px-4 py-3 rounded-xl border text-sm font-bold shadow-xl ${th.panel}`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
