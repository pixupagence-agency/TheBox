"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LiveScreen, Message } from "./ui";
import { normalizeCode } from "@/lib/live/model";

/** Saisie du code adjoint (alternative au QR) : retrouve le match et ouvre la télécommande */
export default function RemoteCodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeCode(code);
    if (clean.length !== 6) { setError("Le code contient 6 caractères"); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/live/remote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", code: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.id) {
        setError(data.error || "Code invalide");
        return;
      }
      try { localStorage.setItem(`thebox_live_remote_${data.id}`, JSON.stringify({ code: clean })); } catch { /* ignore */ }
      router.push(`/live/${data.id}/remote`);
    } catch {
      setError("Pas de réseau : réessayez dans un instant");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LiveScreen>
      <Message title="Télécommande du live" text="Entrez le code à 6 caractères affiché par le coach dans « Partager le live ».">
        <form onSubmit={submit} className="mt-4 w-full max-w-[280px] space-y-3">
          {error && <p className="text-[12.5px] font-bold text-rose-400">{error}</p>}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={7}
            autoFocus
            autoCapitalize="characters"
            autoComplete="one-time-code"
            className="w-full h-14 rounded-xl bg-white/[0.06] border border-white/10 text-center text-[24px] font-black tracking-[0.3em] font-mono outline-none focus:border-[#00E599]"
          />
          <button type="submit" disabled={busy} className="w-full h-12 rounded-xl bg-[#00E599] text-slate-950 font-black text-[14px] disabled:opacity-50">
            {busy ? "Vérification…" : "Ouvrir la télécommande"}
          </button>
        </form>
      </Message>
    </LiveScreen>
  );
}
