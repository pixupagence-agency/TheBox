"use client";

// Module Convocations : point d'entrée de la route /convocations.
// Module autonome (pas de bouton dans le tableau tactique), utilisable seul sur un téléphone.
// Connexion requise et formule PRO (essai compris, vérifiée par le serveur). Les équipes, effectifs et matchs
// sont ceux du compte, restaurés depuis le cloud ; les convocations sont synchronisées comme le reste des données.
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isWorkspaceSyncActive, restoreWorkspaceFromCloud, startWorkspaceSync } from "@/lib/cloudSync";
import { readConvocationsAccess, readConvocationsWorkspace, type ConvocationsWorkspace } from "@/lib/convocations/workspace";
import ConvocationsModule, { ConvocationsBrandBar } from "./ConvocationsModule";

type Status =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "unknown" }
  | { kind: "free" }
  | { kind: "no-team" }
  | { kind: "ready"; workspace: ConvocationsWorkspace };

function Notice({ eyebrow, title, text, cta, href = "/" }: { eyebrow: string; title: string; text: string; cta: string; href?: string }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0A0E13] text-[#E6EDF3] font-[Inter,system-ui,sans-serif]">
      <ConvocationsBrandBar />
      <div className="flex-1 mx-auto w-full max-w-[460px] flex items-center justify-center px-4 py-8">
        <div className="w-full rounded-2xl border border-[#1F2A36] bg-[#131A22] p-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF8A1F]">{eyebrow}</p>
          <h1 className="text-lg font-black text-[#E6EDF3]">{title}</h1>
          <p className="text-sm text-[#8B98A8]">{text}</p>
          {/* Lien classique : « Réessayer » recharge vraiment la page */}
          <a href={href} className="inline-flex h-12 items-center justify-center rounded-xl bg-[#FF8A1F] px-6 text-sm font-black text-[#1A0E00]">
            {cta}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ConvocationsApp() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!cancelled) setStatus({ kind: "signed-out" });
        return;
      }
      const uid = user.uid;
      // Accès vérifié par le serveur (formule payante, essai, administrateur) : le module fonctionne seul,
      // y compris sur un téléphone où le tableau tactique n'a jamais été ouvert.
      // Serveur injoignable : profil enregistré sur l'appareil, s'il existe.
      let access: "pro" | "free" | "unknown" = "unknown";
      try {
        const res = await fetch("/api/account/status", {
          method: "POST",
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        });
        if (res.status === 410) access = "free"; // compte supprimé
        else if (res.ok) {
          const data = (await res.json()) as { status?: { hasAccess?: boolean } };
          if (typeof data?.status?.hasAccess === "boolean") access = data.status.hasAccess ? "pro" : "free";
        }
      } catch {
        /* hors ligne */
      }
      if (access === "unknown") access = readConvocationsAccess(uid);
      if (access !== "pro") {
        if (!cancelled) setStatus({ kind: access });
        return;
      }
      // Données du compte (équipes, effectifs, matchs, convocations) restaurées, puis synchro démarrée
      if (!isWorkspaceSyncActive(uid)) {
        try {
          await restoreWorkspaceFromCloud(uid);
        } catch (e) {
          const err = e as { code?: string; message?: string };
          console.warn("[Synchro en ligne] Restauration impossible, utilisation des données de l'appareil :", err?.code || err?.message || e);
        }
        startWorkspaceSync(uid);
      }
      if (cancelled) return;
      const workspace = readConvocationsWorkspace();
      setStatus(workspace.teams.length === 0 ? { kind: "no-team" } : { kind: "ready", workspace });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  switch (status.kind) {
    case "loading":
      return (
        <div className="min-h-[100dvh] flex flex-col bg-[#0A0E13] text-[#E6EDF3] font-[Inter,system-ui,sans-serif]">
          <ConvocationsBrandBar />
          <div className="flex-1 flex items-center justify-center text-[#8B98A8] text-sm font-semibold">Chargement des convocations…</div>
        </div>
      );
    case "signed-out":
      return <Notice eyebrow="Convocations" title="Connectez-vous pour convoquer vos joueurs" text="Le module Convocations utilise votre compte The Box." cta="Se connecter" />;
    case "unknown":
      return <Notice eyebrow="Hors ligne" title="Connexion impossible" text="Vérifiez votre connexion internet puis rechargez la page pour retrouver vos convocations." cta="Réessayer" href="/convocations" />;
    case "free":
      return <Notice eyebrow="Formule PRO" title="Les convocations sont réservées aux formules PRO & PRO+" text="Passez à une formule PRO depuis le tableau tactique pour convoquer vos joueurs aux matchs et aux entraînements." cta="Voir les formules" />;
    case "no-team":
      return <Notice eyebrow="Convocations" title="Créez d'abord votre équipe" text="Ajoutez votre équipe et son effectif dans le tableau tactique pour pouvoir convoquer vos joueurs." cta="Ouvrir le tableau tactique" />;
    case "ready": {
      const w = status.workspace;
      return (
        <ConvocationsModule
          isModernSleek={w.isModernSleek}
          teams={w.teams}
          rosters={w.rosters}
          matches={w.matches}
          activeTeamId={w.activeTeamId}
        />
      );
    }
  }
}
