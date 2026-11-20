"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Undo2, StickyNote, ArrowLeftRight, WifiOff, X, Share2, ChevronRight } from "lucide-react";
import { useLiveClub, useLiveMatch, useNow } from "./liveHooks";
import { EventRow, LiveScreen, Message, Spinner, TeamCrest } from "./ui";
import {
  clockSeconds,
  formatClock,
  nextPeriodActionLabel,
  nextPeriodOf,
  normalizeCode,
  periodLabel,
  FINISHED_PERIOD,
  HALFTIME_PERIOD,
  type LiveOp,
  type LivePlayer,
  type LiveTeam,
} from "@/lib/live/model";
import { getSportScoreActions, type SportScoreAction } from "@/lib/sportScoring";

type Creds = { token?: string; code?: string };
type Queued = { cmdId: string; op: LiveOp };
type Sheet =
  | { mode: "score"; team: LiveTeam; action: SportScoreAction }
  | { mode: "assist"; team: LiveTeam; action: SportScoreAction; scorer: LivePlayer }
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
    const undoable = op.kind === "goal" || op.kind === "card" || op.kind === "sub" || op.kind === "note";
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

  const recordGoal = (t: LiveTeam, action: SportScoreAction, scorer?: LivePlayer, assister?: LivePlayer) => {
    const home = match.score.home + (t === "home" ? action.points : 0);
    const away = match.score.away + (t === "away" ? action.points : 0);
    const who = scorer ? (t === "home" ? scorer.name : scorer.name) : t === "home" ? match.home : match.away;
    const minute = `${Math.floor(secs / 60)}'`;
    send(
      { kind: "goal", team: t, scorer, assister, points: action.points, label: action.label, icon: action.icon, subType: action.id },
      `${action.icon} ${action.label} enregistré · ${minute}`,
      t === "home" ? caption(`${action.label.toUpperCase()} ! ${who} (${minute})`, home, away) : undefined
    );
  };

  const pickPlayer = (p: LivePlayer) => {
    if (!sheet) return;
    if (sheet.mode === "score") {
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
      case "score": return sheet.team === "home" ? `${sheet.action.label} · qui a marqué ?` : `${sheet.action.label} adverse · numéro ?`;
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

  const actionBtn = "h-[74px] rounded-2xl border flex flex-col items-center justify-center gap-1 text-[13px] font-black transition active:scale-[0.97] disabled:opacity-35";

  return (
    <LiveScreen>
      {/* En-tête */}
      <header className="pt-4 pb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 text-white px-2.5 py-1 text-[11px] font-black">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
        </span>
        <span className="text-[12px] font-bold text-slate-400">Éditeur</span>
        <span className={`ml-auto inline-flex items-center gap-1.5 text-[11.5px] font-bold ${coachOnline ? "text-[#00E599]" : "text-slate-500"}`}>
          <span className={`w-2 h-2 rounded-full ${coachOnline ? "bg-[#00E599]" : "bg-slate-600"}`} />
          {coachOnline ? "Coach connecté" : "Tableau du coach fermé"}
        </span>
      </header>

      {(!online || queue.length > 0) && (
        <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[12px] font-semibold text-amber-200 flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          {online ? `Envoi en cours… ${queue.length} action(s)` : `Réseau perdu — ${queue.length} action(s) en attente, elles partiront dès le retour du réseau.`}
        </div>
      )}

      {/* Tableau de score */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0B1118] p-3.5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[12px] font-black text-slate-300 uppercase">{periodLabel(match.period, match.sport)}</span>
          {!finished && !notStarted && (
            <button type="button" onClick={nextPeriod} className="h-8 px-3 rounded-full bg-white/[0.06] border border-white/10 text-[11.5px] font-black inline-flex items-center gap-1">
              {nextPeriodActionLabel(match)}<ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 text-center">
            <p className="text-[10.5px] font-black text-[#00E599]">MON ÉQUIPE</p>
            <p className="text-[12px] font-bold truncate text-slate-300">{match.home}</p>
            <p className="text-[40px] leading-none font-black font-mono">{match.score.home}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-2">
            <p className={`font-mono text-[22px] font-black ${running ? "text-white" : "text-slate-400"}`}>{formatClock(secs)}</p>
            {!finished && !notStarted && (
              <button
                type="button"
                onClick={startOrPause}
                aria-label={running ? "Pause" : "Reprendre"}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${running ? "bg-white/10 text-white" : "bg-[#00E599] text-slate-950"}`}
              >
                {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-[10.5px] font-black text-rose-300">ADVERSAIRE</p>
            <p className="text-[12px] font-bold truncate text-slate-300">{match.away}</p>
            <p className="text-[40px] leading-none font-black font-mono">{match.score.away}</p>
          </div>
        </div>
      </div>

      {finished ? (
        <Message title="Match terminé" text="La télécommande est fermée. Le résumé est disponible sur la page publique du match.">
          <a href={`/live/${id}`} className="mt-3 h-11 px-5 rounded-xl bg-[#00E599] text-slate-950 font-black text-[14px] inline-flex items-center">Voir le résumé</a>
        </Message>
      ) : notStarted ? (
        <div className="mt-5 rounded-2xl border border-[#00E599]/30 bg-[#00E599]/[0.06] p-5 text-center">
          <button type="button" onClick={startOrPause} className="w-full h-16 rounded-2xl bg-[#00E599] text-slate-950 text-[18px] font-black inline-flex items-center justify-center gap-2">
            <Play className="w-6 h-6" />Coup d’envoi
          </button>
          <p className="mt-2.5 text-[12px] text-slate-400">Le chrono démarre quand l’arbitre siffle, pas à l’horaire prévu.</p>
        </div>
      ) : (
        <>
          {/* Équipe concernée */}
          <div className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.05]">
            {(["home", "away"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTeam(t)}
                className={`h-10 rounded-lg text-[13px] font-black transition ${team === t ? (t === "home" ? "bg-[#00E599] text-slate-950" : "bg-rose-500 text-white") : "text-slate-300"}`}
              >
                {t === "home" ? "Mon équipe" : "Adversaire"}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {scoreActions.map((a) => (
              <button key={a.id} type="button" onClick={() => setSheet({ mode: "score", team, action: a })} className={`${actionBtn} bg-[#00E599]/10 border-[#00E599]/30 text-[#00E599]`}>
                <span className="text-[22px] leading-none">{a.icon}</span>{a.points > 1 ? `+${a.points}` : a.label}
              </button>
            ))}
            <button type="button" onClick={() => setSheet({ mode: "card", team, color: "yellow" })} className={`${actionBtn} bg-yellow-400/10 border-yellow-400/30 text-yellow-300`}>
              <span className="w-4 h-5 rounded-[3px] bg-yellow-400" />Jaune
            </button>
            <button type="button" onClick={() => setSheet({ mode: "card", team, color: "red" })} className={`${actionBtn} bg-rose-500/10 border-rose-500/30 text-rose-300`}>
              <span className="w-4 h-5 rounded-[3px] bg-rose-500" />Rouge
            </button>
            <button
              type="button"
              disabled={team === "away" || !lineup.onPitch.length || !lineup.bench.length}
              onClick={() => setSheet({ mode: "sub-out" })}
              className={`${actionBtn} bg-sky-400/10 border-sky-400/30 text-sky-300`}
            >
              <ArrowLeftRight className="w-5 h-5" />Remplacer
            </button>
            <button type="button" onClick={() => { setNoteText(""); setSheet({ mode: "note", team }); }} className={`${actionBtn} bg-white/[0.04] border-white/10 text-slate-200`}>
              <StickyNote className="w-5 h-5" />Note
            </button>
            <button type="button" disabled={!events.length} onClick={undoLast} className={`${actionBtn} bg-white/[0.04] border-white/10 text-slate-300`}>
              <Undo2 className="w-5 h-5" />Annuler
            </button>
          </div>
        </>
      )}

      {/* Fil des événements */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-wider">Événements</p>
          <span className="text-[11px] font-black text-slate-500">{events.length}</span>
        </div>
        {events.length === 0 ? (
          <p className="text-[12.5px] text-slate-500 py-4 text-center">Aucun événement pour l’instant.</p>
        ) : (
          <div className="rounded-xl border border-white/[0.08] bg-[#0B1118] px-3">
            {events.slice(0, 8).map((ev) => <EventRow key={ev.id} ev={ev} match={match} compact />)}
          </div>
        )}
      </div>

      {/* Sélection du joueur / note */}
      {sheet && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-end justify-center" onClick={() => setSheet(null)}>
          <div className="w-full max-w-[460px] max-h-[78dvh] overflow-y-auto rounded-t-3xl bg-[#0E1620] border-t border-white/10 p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[15px] font-black">{sheetTitle()}</p>
              <button type="button" onClick={() => setSheet(null)} aria-label="Fermer" className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            {sheet.mode === "note" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {NOTE_TAGS.map((tag) => (
                    <button key={tag} type="button" onClick={() => send({ kind: "note", team: sheet.team, text: tag }, `Note · ${tag}`)} className="h-9 px-3 rounded-full bg-white/[0.06] border border-white/10 text-[12.5px] font-bold">
                      {tag}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); if (noteText.trim()) send({ kind: "note", team: sheet.team, text: noteText.trim() }, "Note enregistrée"); }}
                  className="flex gap-2"
                >
                  <input value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={200} placeholder="Votre note…" className="flex-1 h-11 rounded-xl bg-white/[0.06] border border-white/10 px-3 text-[14px] outline-none focus:border-[#00E599]" />
                  <button type="submit" className="h-11 px-4 rounded-xl bg-[#00E599] text-slate-950 font-black text-[13px]">OK</button>
                </form>
              </div>
            ) : (
              <>
                {sheet.mode === "assist" && (
                  <button type="button" onClick={() => recordGoal(sheet.team, sheet.action, sheet.scorer)} className="w-full h-11 mb-3 rounded-xl bg-white/[0.06] border border-white/10 text-[13px] font-black">
                    Sans passe décisive
                  </button>
                )}
                <div className={`grid gap-2 ${("team" in sheet && sheet.team === "away") || !lineup.onPitch.length ? "grid-cols-5" : "grid-cols-2"}`}>
                  {sheetPlayers().map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pickPlayer(p)}
                      className="min-h-[48px] rounded-xl bg-white/[0.05] border border-white/10 px-2.5 py-2 flex items-center gap-2 text-left active:bg-white/10"
                    >
                      <span className="w-7 h-7 shrink-0 rounded-full bg-[#00E599]/15 text-[#00E599] text-[12px] font-black flex items-center justify-center">{p.n ?? "–"}</span>
                      {p.name !== `N° ${p.n}` && <span className="text-[13px] font-bold truncate">{p.name}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation + annulation + suggestion de publication */}
      {toast && (
        <div className="fixed left-0 right-0 bottom-4 z-50 flex justify-center px-4">
          <div className={`w-full max-w-[430px] rounded-2xl border shadow-2xl p-3 ${toast.error ? "bg-rose-950 border-rose-500/40" : "bg-[#121c28] border-white/10"}`}>
            <div className="flex items-center gap-2">
              <p className="flex-1 text-[13px] font-bold">{toast.text}</p>
              {toast.undoId && (
                <button type="button" onClick={() => { send({ kind: "undo", eventId: toast.undoId! }, "Action annulée"); }} className="h-8 px-3 rounded-lg bg-white/10 text-[12px] font-black">
                  Annuler
                </button>
              )}
            </div>
            {toast.caption && (
              <div className="mt-2.5 pt-2.5 border-t border-white/10">
                <p className="text-[11px] font-black text-[#00E599] uppercase tracking-wider mb-1">Suggestion de post</p>
                <p className="text-[12px] text-slate-300 whitespace-pre-line line-clamp-3">{toast.caption}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setToast(null)} className="flex-1 h-9 rounded-lg bg-white/[0.06] text-[12px] font-bold">Plus tard</button>
                  <button type="button" onClick={() => shareCaption(toast.caption!)} className="flex-1 h-9 rounded-lg bg-[#00E599] text-slate-950 text-[12px] font-black inline-flex items-center justify-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />Publier…
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 flex items-center justify-center gap-2 text-[11px] text-slate-600">
        <TeamCrest name={club?.name || match.clubName} logo={club?.logo} size={18} />
        <span>{club?.name || match.clubName} · télécommande privée, ne partagez pas ce lien</span>
      </div>
    </LiveScreen>
  );
}
