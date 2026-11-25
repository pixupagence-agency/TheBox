"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Undo2, StickyNote, ArrowLeftRight, WifiOff, X, Share2, ChevronRight, Crosshair, CircleSlash } from "lucide-react";
import { useLiveClub, useLiveMatch, useNow } from "./liveHooks";
import { EventRow, LiveScreen, Message, SegmentTabs, Spinner, TeamCrest } from "./ui";
import {
  clockSeconds,
  formatClock,
  nextPeriodActionLabel,
  nextPeriodOf,
  normalizeCode,
  periodLabel,
  FINISHED_PERIOD,
  HALFTIME_PERIOD,
  GOAL_OWN,
  GOAL_PENALTY,
  gameActionInfo,
  hasPenaltyGoals,
  penaltyName,
  type LiveGameAction,
  type LiveOp,
  type LivePlayer,
  type LiveTeam,
} from "@/lib/live/model";
import { getSportScoreActions, type SportScoreAction } from "@/lib/sportScoring";

type Creds = { token?: string; code?: string };
type Queued = { cmdId: string; op: LiveOp };
type Sheet =
  /** Choix du buteur ; `penalty` : but sur penalty (ou jet de 7 m), sans passe décisive */
  | { mode: "score"; team: LiveTeam; action: SportScoreAction; penalty?: boolean }
  | { mode: "assist"; team: LiveTeam; action: SportScoreAction; scorer: LivePlayer }
  /** Occasion ou penalty manqué : joueur facultatif */
  | { mode: "action"; team: LiveTeam; action: LiveGameAction }
  | { mode: "card"; team: LiveTeam; color: "yellow" | "red" }
  | { mode: "sub-out" }
  | { mode: "sub-in"; out: LivePlayer }
  | { mode: "note"; team: LiveTeam };
type Toast = { text: string; undoId?: string; caption?: string; error?: boolean };

const credsKey = (id: string) => `thebox_live_remote_${id}`;
const queueKey = (id: string) => `thebox_live_remote_queue_${id}`;
const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
};
const newCmdId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const NOTE_TAGS = ["Pressing haut", "Bonne séquence", "Blessure", "À revoir en vidéo", "Problème défensif", "Occasion franche"];
const AWAY_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function LiveRemote({ id }: { id: string }) {
  const { match, state } = useLiveMatch(id);
  const { club } = useLiveClub(match?.clubSlug);
  const now = useNow(1000);

  const [creds, setCreds] = useState<Creds | null>(null);
  const [auth, setAuth] = useState<"init" | "checking" | "ok" | "need" | "denied">("init");
  const [authError, setAuthError] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [queue, setQueue] = useState<Queued[]>([]);
  const [online, setOnline] = useState(true);
  const [team, setTeam] = useState<LiveTeam>("home");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  /** Texte proposé à la publication (feuille « Publier sur les réseaux ») */
  const [shareText, setShareText] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushing = useRef(false);

  // Identifiants : lien secret (#t=…) ou code mémorisé sur cet appareil
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hash.get("t");
    let c: Creds | null = readJson<Creds | null>(credsKey(id), null);
    if (token) {
      c = { token };
      writeJson(credsKey(id), c);
      // Le jeton ne reste pas dans la barre d'adresse (captures d'écran, historique partagé)
      window.history.replaceState(null, "", window.location.pathname);
    }
    setQueue(readJson<Queued[]>(queueKey(id), []));
    setOnline(navigator.onLine);
    if (c && (c.token || c.code)) {
      setCreds(c);
      setAuth("checking");
    } else {
      setAuth("need");
    }
  }, [id]);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/live/remote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...creds, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok && data.ok, error: (data.error as string) || "" };
  }, [id, creds]);

  // Vérifie l'accès éditeur
  useEffect(() => {
    if (auth !== "checking" || !creds) return;
    let alive = true;
    post({ action: "check" })
      .then((r) => {
        if (!alive) return;
        if (r.ok) setAuth("ok");
        else {
          setAuthError(r.error || "Accès refusé");
          setAuth(r.status === 403 ? "denied" : "need");
          if (r.status === 403) { try { localStorage.removeItem(credsKey(id)); } catch { /* ignore */ } }
        }
      })
      .catch(() => {
        // Hors ligne : on garde l'accès mémorisé, les saisies partiront au retour du réseau
        if (alive) setAuth("ok");
      });
    return () => { alive = false; };
  }, [auth, creds, post, id]);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), t.caption ? 9000 : 5000);
  }, []);

  // Envoi des actions dans l'ordre ; en cas de coupure elles restent en file d'attente
  const flush = useCallback(async () => {
    if (flushing.current || !creds) return;
    flushing.current = true;
    try {
      let current = readJson<Queued[]>(queueKey(id), []);
      while (current.length) {
        const item = current[0];
        let r: { status: number; ok: boolean; error: string };
        try {
          r = await post({ cmdId: item.cmdId, op: item.op });
        } catch {
          setOnline(false);
          break;
        }
        setOnline(true);
        if (!r.ok && r.status >= 500) break;
        // Trop d'essais de code sur ce match : l'action reste en file d'attente et repartira plus tard
        if (r.status === 429) {
          showToast({ text: r.error || "Trop d'essais, réessayez dans quelques minutes", error: true });
          break;
        }
        current = current.slice(1);
        writeJson(queueKey(id), current);
        setQueue(current);
        if (!r.ok) {
          if (r.status === 403 && /révoqué|expiré|invalide/.test(r.error)) {
            setAuthError(r.error);
            setAuth("denied");
          }
          showToast({ text: r.error || "Action refusée", error: true });
        }
      }
    } finally {
      flushing.current = false;
    }
  }, [creds, id, post, showToast]);

  useEffect(() => {
    if (auth !== "ok") return;
    flush();
    const retry = setInterval(flush, 5000);
    const goOnline = () => { setOnline(true); flush(); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      clearInterval(retry);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [auth, flush]);

  // Écran toujours allumé pendant la saisie
  useEffect(() => {
    if (auth !== "ok") return;
    type WakeLock = { release: () => Promise<void> };
    let lock: WakeLock | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLock> } };
    const request = () => {
      if (document.visibilityState !== "visible" || !nav.wakeLock) return;
      nav.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      lock?.release().catch(() => {});
    };
  }, [auth]);

  const send = (op: LiveOp, toastText?: string, caption?: string) => {
    const cmdId = newCmdId();
    const next = [...readJson<Queued[]>(queueKey(id), []), { cmdId, op }];
    writeJson(queueKey(id), next);
    setQueue(next);
    if ("vibrate" in navigator) navigator.vibrate?.(30);
    const undoable = op.kind === "goal" || op.kind === "card" || op.kind === "sub" || op.kind === "note" || op.kind === "action";
    if (toastText) showToast({ text: toastText, undoId: undoable ? `r_${cmdId}` : undefined, caption });
    setSheet(null);
    flush();
  };

  const scoreActions = useMemo(() => getSportScoreActions(match?.sport || "football"), [match?.sport]);

  // ---------- Écrans d'accès ----------
  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeCode(codeInput);
    if (code.length !== 6) { setAuthError("Le code contient 6 caractères"); return; }
    const c = { code };
    writeJson(credsKey(id), c);
    setAuthError("");
    setCreds(c);
    setAuth("checking");
  };

  if (auth === "init" || auth === "checking" || state === "loading") return <LiveScreen><Spinner label="Connexion à la télécommande…" /></LiveScreen>;
  if (state !== "ready" || !match) return <LiveScreen><Message title="Match introuvable" text="Ce lien n'est plus valide ou le match a été supprimé." /></LiveScreen>;

  if (auth === "need" || auth === "denied") {
    return (
      <LiveScreen>
        <Message title="Télécommande du live" text={`${match.home} vs ${match.away}`}>
          <form onSubmit={submitCode} className="mt-4 w-full max-w-[280px] space-y-3">
            {authError && <p className="text-[12.5px] font-bold text-rose-400">{authError}</p>}
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={7}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              className="w-full h-14 rounded-xl bg-white/[0.06] border border-white/10 text-center text-[24px] font-black tracking-[0.3em] font-mono outline-none focus:border-[#00E599]"
            />
            <button type="submit" className="w-full h-12 rounded-xl bg-[#00E599] text-slate-950 font-black text-[14px]">Ouvrir la télécommande</button>
            <p className="text-[11.5px] text-slate-500">Le code est affiché par le coach dans « Partager le live ».</p>
          </form>
        </Message>
      </LiveScreen>
    );
  }

  // ---------- Télécommande ----------
  const secs = clockSeconds(match.clock, now);
  const running = Boolean(match.clock?.runningSince);
  const finished = match.status === "finished" || match.period === FINISHED_PERIOD;
  const notStarted = match.status === "scheduled";
  const halftime = match.period === HALFTIME_PERIOD;
  const coachOnline = typeof match.hostSeenAt === "number" && now - match.hostSeenAt < 100000;
  const events = (match.events || []).filter((e) => e.type !== "assist");
  const lineup = match.lineup || { onPitch: [], bench: [] };
  const awayPlayer = (n: number): LivePlayer => ({ id: `n${n}`, n, name: `N° ${n}` });
  const publicUrl = `${window.location.origin}/live/${id}`;
  const caption = (head: string, home = match.score.home, away = match.score.away) =>
    `${head}\n${match.home} ${home} - ${away} ${match.away}\n${match.competition ? `${match.competition} · ` : ""}Suivez le live : ${publicUrl}`;

  const startOrPause = () => {
    if (running) return send({ kind: "pause" }, "Chrono en pause");
    if (halftime) return send({ kind: "start" }, "Reprise du match", caption("C'est reparti pour la seconde période !"));
    if (notStarted) return send({ kind: "start" }, "Coup d'envoi !", caption("C'est parti ! Coup d'envoi du match."));
    send({ kind: "start" }, "Chrono relancé");
  };

  const nextPeriod = () => {
    const next = nextPeriodOf(match);
    if (next === FINISHED_PERIOD) {
      if (!window.confirm("Terminer le match ? La télécommande sera fermée.")) return;
      return send({ kind: "next" }, "Match terminé", caption("Coup de sifflet final !"));
    }
    if (next === HALFTIME_PERIOD) return send({ kind: "next" }, periodLabel(HALFTIME_PERIOD, match.sport), caption("Mi-temps. On fait le point au vestiaire."));
    send({ kind: "next" }, `Début : ${periodLabel(next, match.sport)}`);
  };

  const sport = match.sport || "football";
  const withPenalty = hasPenaltyGoals(sport);
  const penaltyLabel = penaltyName(sport);

  /** variant : but normal, sur penalty (jet de 7 m) ou contre son camp */
  const recordGoal = (t: LiveTeam, action: SportScoreAction, scorer?: LivePlayer, assister?: LivePlayer, variant?: "penalty" | "own_goal") => {
    const home = match.score.home + (t === "home" ? action.points : 0);
    const away = match.score.away + (t === "away" ? action.points : 0);
    const who = scorer ? scorer.name : t === "home" ? match.home : match.away;
    const minute = `${Math.floor(secs / 60)}'`;
    const label = variant === "penalty" ? `${action.label} sur ${penaltyLabel.toLowerCase()}` : variant === "own_goal" ? "But contre son camp" : action.label;
    send(
      { kind: "goal", team: t, scorer, assister, points: action.points, label, icon: action.icon, subType: variant === "penalty" ? GOAL_PENALTY : variant === "own_goal" ? GOAL_OWN : action.id },
      `${action.icon} ${label} enregistré · ${minute}`,
      t === "home"
        ? caption(variant === "own_goal" ? `BUT ! Contre son camp adverse (${minute})` : `${label.toUpperCase()} ! ${who} (${minute})`, home, away)
        : undefined
    );
  };

  /** But contre son camp : marqué par l'équipe d'en face dans son propre but */
  const recordOwnGoal = (t: LiveTeam, action: SportScoreAction) =>
    recordGoal(t, action, { id: "csc", name: t === "home" ? "CSC adverse" : "CSC" }, undefined, "own_goal");

  const recordGameAction = (t: LiveTeam, action: LiveGameAction, player?: LivePlayer) => {
    const info = gameActionInfo(action, sport);
    send({ kind: "action", action, team: t, player }, `${info.icon} ${info.label} · ${Math.floor(secs / 60)}'`);
  };

  const pickPlayer = (p: LivePlayer) => {
    if (!sheet) return;
    if (sheet.mode === "action") return recordGameAction(sheet.team, sheet.action, p);
    if (sheet.mode === "score") {
      if (sheet.penalty) return recordGoal(sheet.team, sheet.action, p, undefined, "penalty");
      if (sheet.team === "home" && sheet.action.requiresAssisterModal) {
        setSheet({ mode: "assist", team: sheet.team, action: sheet.action, scorer: p });
        return;
      }
      return recordGoal(sheet.team, sheet.action, p);
    }
    if (sheet.mode === "assist") return recordGoal(sheet.team, sheet.action, sheet.scorer, p);
    if (sheet.mode === "card") {
      return send({ kind: "card", color: sheet.color, team: sheet.team, player: p }, `${sheet.color === "yellow" ? "Carton jaune" : "Carton rouge"} · ${p.name}`);
    }
    if (sheet.mode === "sub-out") return setSheet({ mode: "sub-in", out: p });
    if (sheet.mode === "sub-in") return send({ kind: "sub", outId: sheet.out.id, inId: p.id }, `Remplacement · ${sheet.out.name} ➔ ${p.name}`);
  };

  const undoLast = () => {
    const last = events[0];
    if (!last) return;
    if (!window.confirm(`Annuler « ${last.player} » (${last.time}) ?`)) return;
    send({ kind: "undo", eventId: last.id }, "Action annulée");
  };

  const shareCaption = async (text: string) => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ text }); } catch { /* annulé */ }
    } else {
      try { await navigator.clipboard.writeText(text); showToast({ text: "Texte copié : collez-le sur vos réseaux" }); } catch { /* ignore */ }
    }
  };

  const sheetTitle = () => {
    if (!sheet) return "";
    switch (sheet.mode) {
      case "score": {
        const what = sheet.penalty ? `${sheet.action.label} sur ${penaltyLabel.toLowerCase()}` : sheet.action.label;
        return sheet.team === "home" ? `${what} · qui a marqué ?` : `${what} adverse · numéro ?`;
      }
      case "action": {
        const info = gameActionInfo(sheet.action, sport);
        return sheet.team === "home" ? `${info.label} · quel joueur ?` : `${info.label} adverse · numéro ?`;
      }
      case "assist": return "Passe décisive ?";
      case "card": return sheet.color === "yellow" ? "Carton jaune · quel joueur ?" : "Carton rouge · quel joueur ?";
      case "sub-out": return "Qui sort ?";
      case "sub-in": return `Qui entre à la place de ${sheet.out.name} ?`;
      case "note": return "Note rapide";
    }
  };

  const sheetPlayers = (): LivePlayer[] => {
    if (!sheet) return [];
    if (sheet.mode === "sub-out") return lineup.onPitch;
    if (sheet.mode === "sub-in") return lineup.bench;
    const t = "team" in sheet ? sheet.team : "home";
    if (t === "away") return AWAY_NUMBERS.map(awayPlayer);
    const players = sheet.mode === "assist" ? lineup.onPitch.filter((p) => p.id !== sheet.scorer.id) : lineup.onPitch;
    return players.length ? players : AWAY_NUMBERS.map((n) => ({ id: `n${n}`, n, name: `N° ${n}` }));
  };

  // ---------- Rendu (maquette « Télécommande — saisie live (adjoint) ») ----------
  const actionBtn = "h-[76px] rounded-2xl flex flex-col items-center justify-center gap-[5px] text-[13px] font-semibold transition active:scale-[0.97] disabled:opacity-35";
  const neutralBtn = `${actionBtn} border border-[#2A3644] bg-[#131A22] text-[#E6EDF3]`;
  const clockColor = running ? "text-[#E6EDF3]" : notStarted ? "text-[#8B98A8]" : "text-[#FDBA74]";
  const sheetSub = sheet && "team" in sheet ? `${sheet.team === "home" ? "Mon équipe" : "Adversaire"} · ${Math.floor(secs / 60)}'` : `${Math.floor(secs / 60)}'`;

  return (
    <LiveScreen>
      <div className="flex flex-col gap-3 pt-4">
        {/* En-tête de session */}
        <header className="flex items-center justify-between gap-2 min-h-9">
          <span className="text-[12px] text-[#8B98A8]">Télécommande · <strong className="text-[#E6EDF3] font-semibold">Éditeur</strong></span>
          <span className={`inline-flex items-center gap-1.5 text-[12px] ${coachOnline ? "text-[#8B98A8]" : "text-[#FDBA74]"}`}>
            <span className={`w-2 h-2 rounded-full ${coachOnline ? "bg-[#00E599]" : "bg-[#FDBA74]"}`} />
            {coachOnline ? "Coach connecté" : "Tableau du coach fermé"}
          </span>
        </header>

        {(!online || queue.length > 0) && (
          <div role="status" className="-mt-1 px-3 py-2 rounded-[10px] bg-[#2B1A08] text-[#FDBA74] text-[12px] leading-snug flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            {online ? `Envoi en cours… ${queue.length} action(s)` : `Réseau perdu — ${queue.length} action(s) en attente, elles partiront dès le retour du réseau.`}
          </div>
        )}

        {/* Tableau de score + chrono */}
        <section aria-label="Score et chrono" className="bg-[#131A22] border border-[#1F2A36] rounded-[20px] px-4 pt-3.5 pb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8B98A8]">{notStarted ? "Avant-match" : periodLabel(match.period, match.sport)}</span>
            {!finished && !notStarted && (
              <button type="button" onClick={nextPeriod} className="min-h-8 px-2.5 rounded-lg border border-[#2A3644] text-[#C9D3DE] text-[12px] font-semibold inline-flex items-center gap-1">
                {nextPeriodActionLabel(match)}<ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="flex flex-col items-center gap-0.5 min-w-0">
              <span className="text-[11px] font-semibold tracking-[0.04em] text-[#8B98A8]">MON ÉQUIPE</span>
              <span className="w-full text-center text-[12px] text-[#C9D3DE] truncate">{match.home}</span>
              <span className="tb-num text-[52px] font-bold leading-none">{match.score.home}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className={`tb-num text-[30px] font-semibold ${clockColor}`}>{formatClock(secs)}</span>
              {!finished && !notStarted && (
                <button
                  type="button"
                  onClick={startOrPause}
                  aria-label={running ? "Mettre le chrono en pause" : "Lancer le chrono"}
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${running ? "bg-[#E6EDF3] text-[#0A0E13]" : "bg-[#00E599] text-[#04120C]"}`}
                >
                  {running ? <Pause className="w-[22px] h-[22px]" fill="currentColor" /> : <Play className="w-[22px] h-[22px] ml-0.5" fill="currentColor" />}
                </button>
              )}
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-0">
              <span className="text-[11px] font-semibold tracking-[0.04em] text-[#8B98A8]">ADVERSAIRE</span>
              <span className="w-full text-center text-[12px] text-[#C9D3DE] truncate">{match.away}</span>
              <span className="tb-num text-[52px] font-bold leading-none">{match.score.away}</span>
            </div>
          </div>
          {notStarted && (
            <div className="flex flex-col gap-1.5">
              <button type="button" onClick={startOrPause} className="min-h-14 rounded-[14px] bg-[#00E599] text-[#04120C] text-[17px] font-bold inline-flex items-center justify-center gap-2.5">
                <Play className="w-5 h-5" fill="currentColor" />Coup d’envoi
              </button>
              <span className="text-[12px] text-[#8B98A8] text-center">Le chrono démarre quand l’arbitre siffle, pas à l’horaire prévu.</span>
            </div>
          )}
        </section>

        {finished ? (
          <Message title="Match terminé" text="La télécommande est fermée. Le résumé est disponible sur la page publique du match.">
            <a href={`/live/${id}`} className="mt-3 min-h-11 px-5 rounded-xl bg-[#00E599] text-[#04120C] font-bold text-[14px] inline-flex items-center">Voir le résumé</a>
          </Message>
        ) : !notStarted && (
          <>
            {/* Équipe concernée */}
            <SegmentTabs label="Équipe concernée" value={team} onChange={setTeam} tabs={[["home", "Mon équipe"], ["away", "Adversaire"]]} />

            {/* Actions */}
            <div className="grid grid-cols-4 gap-2">
              {scoreActions.map((a) => (
                <button key={a.id} type="button" onClick={() => setSheet({ mode: "score", team, action: a })} className={`${actionBtn} bg-[#00E599] text-[#04120C] font-bold`}>
                  <span className="text-[22px] leading-none" aria-hidden>{a.icon}</span>{a.points > 1 ? `+${a.points}` : a.label}
                </button>
              ))}
              <button type="button" onClick={() => setSheet({ mode: "action", team, action: "chance" })} className={`${actionBtn} border border-[#5A3A12] bg-[#22180C] text-[#FDBA74]`}>
                <Crosshair className="w-6 h-6" />Occasion
              </button>
              {withPenalty && (
                <button type="button" onClick={() => setSheet({ mode: "action", team, action: "missed_penalty" })} className={`${neutralBtn} text-[12px] leading-tight text-center px-1`}>
                  <CircleSlash className="w-6 h-6 text-[#F87171]" />{penaltyLabel} manqué
                </button>
              )}
              <button type="button" onClick={() => setSheet({ mode: "card", team, color: "yellow" })} className={neutralBtn}>
                <span className="w-[10px] h-[17px] rounded-[2px] bg-[#FACC15]" aria-hidden />Jaune
              </button>
              <button type="button" onClick={() => setSheet({ mode: "card", team, color: "red" })} className={neutralBtn}>
                <span className="w-[10px] h-[17px] rounded-[2px] bg-[#EF4444]" aria-hidden />Rouge
              </button>
              <button type="button" disabled={team === "away" || !lineup.onPitch.length || !lineup.bench.length} onClick={() => setSheet({ mode: "sub-out" })} className={neutralBtn}>
                <ArrowLeftRight className="w-6 h-6 text-[#60A5FA]" />Remplacer
              </button>
              <button type="button" onClick={() => { setNoteText(""); setSheet({ mode: "note", team }); }} className={neutralBtn}>
                <StickyNote className="w-6 h-6 text-[#C4B5FD]" />Note
              </button>
              <button type="button" disabled={!events.length} onClick={undoLast} className={`${actionBtn} border border-dashed border-[#2A3644] text-[#C9D3DE]`}>
                <Undo2 className="w-6 h-6" />Annuler
              </button>
            </div>
          </>
        )}

        {/* Fil des événements */}
        <section aria-label="Événements" className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#8B98A8]">Événements</span>
            <span className="text-[12px] text-[#8B98A8]">{events.length} événement{events.length > 1 ? "s" : ""}</span>
          </div>
          {events.length === 0 ? (
            <div className="px-3.5 py-[18px] border border-dashed border-[#2A3644] rounded-xl text-[13px] text-[#8B98A8] text-center">Aucun événement pour l’instant.</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {events.slice(0, 8).map((ev) => <EventRow key={ev.id} ev={ev} match={match} />)}
            </div>
          )}
        </section>
      </div>

      {/* Feuille de sélection : joueur, note, partage */}
      {(sheet || shareText) && (
        <div className="fixed inset-0 z-40 bg-[rgba(2,5,8,0.72)] flex flex-col justify-end" onClick={() => { setSheet(null); setShareText(null); }}>
          <div
            role="dialog"
            aria-label={shareText ? "Publier sur les réseaux" : sheetTitle()}
            className="mx-auto w-full max-w-[460px] max-h-[82dvh] overflow-y-auto bg-[#131A22] border-t border-[#2A3644] rounded-t-3xl px-4 pt-2.5 pb-6 flex flex-col gap-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="self-center w-10 h-1 rounded-sm bg-[#2A3644]" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="tb-num text-[20px] font-semibold">{shareText ? "Publier sur les réseaux" : sheetTitle()}</span>
                <span className="text-[13px] text-[#8B98A8]">{shareText ? "Image et texte générés automatiquement" : sheetSub}</span>
              </div>
              <button type="button" onClick={() => { setSheet(null); setShareText(null); }} aria-label="Fermer" className="shrink-0 w-11 h-11 rounded-xl border border-[#2A3644] text-[#C9D3DE] flex items-center justify-center">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            {shareText ? (
              <div className="flex flex-col gap-3">
                <div className="self-center w-[230px] h-[230px] rounded-2xl bg-[#0A0E13] border border-[#2A3644] flex flex-col items-center justify-center gap-2 p-4">
                  <span className="px-2.5 py-1 rounded-md bg-[#00E599] text-[#04120C] text-[12px] font-bold tracking-[0.08em] uppercase">{shareText.split("\n")[0].split("!")[0].slice(0, 22) || "Live"}</span>
                  <span className="tb-num text-[54px] font-bold leading-none">{match.score.home} – {match.score.away}</span>
                  <span className="w-full text-center text-[11px] font-semibold text-[#8B98A8] tracking-[0.06em] uppercase truncate">{match.home} · {match.away}</span>
                  <span className="mt-1.5 text-[10px] text-[#8B98A8] tracking-[0.08em] uppercase truncate max-w-full">{club?.name || match.clubName} · The Box</span>
                </div>
                <div className="bg-[#0A0E13] border border-[#1F2A36] rounded-xl p-3 text-[13px] leading-relaxed text-[#C9D3DE] whitespace-pre-line">{shareText}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setShareText(null)} className="min-h-[52px] rounded-[14px] border border-[#2A3644] text-[15px] font-semibold">Plus tard</button>
                  <button type="button" onClick={() => { shareCaption(shareText); setShareText(null); }} className="min-h-[52px] rounded-[14px] bg-[#00E599] text-[#04120C] text-[15px] font-bold inline-flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />Publier…
                  </button>
                </div>
              </div>
            ) : sheet?.mode === "note" ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {NOTE_TAGS.map((tag) => (
                    <button key={tag} type="button" onClick={() => send({ kind: "note", team: sheet.team, text: tag }, `Note · ${tag}`)} className="min-h-12 px-4 rounded-xl border border-[#2A3644] bg-[#0A0E13] text-[14px] font-medium">
                      {tag}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); if (noteText.trim()) send({ kind: "note", team: sheet.team, text: noteText.trim() }, "Note enregistrée"); }}
                  className="flex gap-2"
                >
                  <label htmlFor="remote-note" className="sr-only">Votre note</label>
                  <input id="remote-note" value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={200} placeholder="Votre note…" className="flex-1 min-h-12 rounded-xl bg-[#0A0E13] border border-[#2A3644] px-3 text-[14px] outline-none focus:border-[#00E599]" />
                  <button type="submit" className="min-h-12 px-4 rounded-xl bg-[#00E599] text-[#04120C] font-bold text-[14px]">OK</button>
                </form>
              </div>
            ) : sheet && (
              <>
                {/* But : normal ou sur penalty, puis le buteur… ou contre son camp */}
                {sheet.mode === "score" && withPenalty && (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-[14px] bg-[#0A0E13] border border-[#1F2A36]" role="radiogroup" aria-label="Type de but">
                      {([false, true] as const).map((pen) => (
                        <button
                          key={String(pen)}
                          type="button"
                          role="radio"
                          aria-checked={Boolean(sheet.penalty) === pen}
                          onClick={() => setSheet({ ...sheet, penalty: pen })}
                          className={`min-h-11 rounded-[10px] text-[14px] font-semibold transition ${Boolean(sheet.penalty) === pen ? "bg-[#00E599] text-[#04120C]" : "text-[#8B98A8]"}`}
                        >
                          {pen ? penaltyLabel : "But"}
                        </button>
                      ))}
                    </div>
                    {!sheet.penalty && (
                      <button type="button" onClick={() => recordOwnGoal(sheet.team, sheet.action)} className="min-h-12 rounded-xl border border-[#2A3644] text-[14px] font-semibold">
                        {sheet.team === "home" ? "CSC · contre son camp de l’adversaire" : "CSC · contre notre camp"}
                      </button>
                    )}
                    <span className="text-[12px] font-semibold text-[#8B98A8]">{sheet.team === "home" ? "Ou choisis le buteur :" : "Ou choisis le numéro du buteur :"}</span>
                  </div>
                )}
                {sheet.mode === "action" && (
                  <button type="button" onClick={() => recordGameAction(sheet.team, sheet.action)} className="min-h-12 rounded-xl border border-[#2A3644] text-[14px] font-semibold">
                    Sans préciser le joueur
                  </button>
                )}
                {sheet.mode === "assist" && (
                  <button type="button" onClick={() => recordGoal(sheet.team, sheet.action, sheet.scorer)} className="min-h-[52px] rounded-[14px] border border-[#2A3644] text-[15px] font-semibold">
                    Sans passe décisive
                  </button>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {sheetPlayers().map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pickPlayer(p)}
                      className="h-[66px] rounded-[14px] border border-[#2A3644] bg-[#0A0E13] flex flex-col items-center justify-center gap-0.5 px-1 active:bg-white/10"
                    >
                      <span className="tb-num text-[22px] font-bold leading-none">{p.n ?? "–"}</span>
                      <span className="max-w-full text-[11px] text-[#8B98A8] truncate">{p.name !== `N° ${p.n}` ? p.name : "Adv."}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation : annuler, publier */}
      {toast && !sheet && !shareText && (
        <div role="status" className={`fixed left-4 right-4 bottom-5 z-50 mx-auto max-w-[430px] flex items-center justify-between gap-3 py-3 pr-3 pl-4 rounded-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ${toast.error ? "bg-rose-950 text-white border border-rose-500/40" : "bg-[#E6EDF3] text-[#0A0E13]"}`}>
          <span className="text-[14px] font-semibold min-w-0">{toast.text}</span>
          <div className="flex gap-1.5 shrink-0">
            {toast.caption && (
              <button type="button" onClick={() => { setShareText(toast.caption!); setToast(null); }} className="min-h-10 px-3 rounded-[10px] bg-[#00E599] text-[#04120C] text-[13px] font-bold">Publier</button>
            )}
            {toast.undoId && (
              <button type="button" onClick={() => send({ kind: "undo", eventId: toast.undoId! }, "Action annulée")} className="min-h-10 px-3 rounded-[10px] bg-[#0A0E13] text-[#E6EDF3] text-[13px] font-bold">Annuler</button>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 flex items-center justify-center gap-2 text-[11px] text-[#8B98A8]">
        <TeamCrest name={club?.name || match.clubName} logo={club?.logo} size={18} />
        <span>{club?.name || match.clubName} · télécommande privée, ne partagez pas ce lien</span>
      </div>
    </LiveScreen>
  );
}
