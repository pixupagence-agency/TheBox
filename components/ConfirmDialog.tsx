"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";

// Remplace window.confirm() par une fenêtre aux couleurs de l'application :
//   if (await confirmAction({ title: "Supprimer ce joueur ?", ... })) { ... }

export type ConfirmTone = "danger" | "warning";

export interface ConfirmOptions {
  title: string;
  message?: string;
  // Élément concerné (nom du match, de l'équipe...), mis en évidence dans la fenêtre
  subject?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

let showConfirm: ((request: PendingConfirm) => void) | null = null;

export const confirmAction = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    // Fenêtre non montée (cas improbable) : on garde la confirmation native plutôt que d'agir sans demander
    if (!showConfirm) {
      resolve(window.confirm([options.title, options.subject, options.message].filter(Boolean).join("\n\n")));
      return;
    }
    showConfirm({ ...options, resolve });
  });

const readIsModernSleek = (): boolean => {
  try {
    return localStorage.getItem("thebox_modern_sleek") === "true";
  } catch {
    return false;
  }
};

export default function ConfirmDialogHost() {
  const [request, setRequest] = useState<PendingConfirm | null>(null);
  const [isModernSleek, setIsModernSleek] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    showConfirm = (next) => {
      setIsModernSleek(readIsModernSleek());
      setRequest((previous) => {
        previous?.resolve(false); // une seule question à la fois
        return next;
      });
    };
    return () => {
      showConfirm = null;
    };
  }, []);

  const close = (confirmed: boolean) => {
    request?.resolve(confirmed);
    setRequest(null);
  };

  useEffect(() => {
    if (!request) return;
    // Le focus va sur "Annuler" : un appui involontaire sur Entrée ne supprime rien
    cancelButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!request) return null;

  const tone = request.tone || "danger";
  const Icon = tone === "warning" ? RotateCcw : Trash2;
  const toneStyles =
    tone === "warning"
      ? {
          chip: isModernSleek ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-amber-500/15 border-amber-500/40 text-amber-400",
          glow: "bg-amber-500/10",
          button: "bg-amber-500 hover:bg-amber-400 text-[#0d1117] shadow-amber-500/25",
        }
      : {
          chip: isModernSleek ? "bg-rose-100 border-rose-300 text-rose-700" : "bg-rose-500/15 border-rose-500/40 text-rose-400",
          glow: "bg-rose-500/10",
          button: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30",
        };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={request.message ? "confirm-dialog-message" : undefined}
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl ${
          isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
        }`}
      >
        <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${toneStyles.glow}`} />
        <div className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none bg-[#00E599]/10" />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <div className={`shrink-0 p-2.5 rounded-xl border ${toneStyles.chip}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3 id="confirm-dialog-title" className="text-sm sm:text-base font-black uppercase tracking-wide">
                {request.title}
              </h3>
              {request.subject && (
                <p
                  className={`mt-2 inline-block max-w-full truncate rounded-lg border px-2.5 py-1 text-xs font-bold ${
                    isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#0f141d] border-[#1f293d] text-[#00E599]"
                  }`}
                  title={request.subject}
                >
                  {request.subject}
                </p>
              )}
              {request.message && (
                <p
                  id="confirm-dialog-message"
                  className={`mt-2.5 text-xs leading-relaxed ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}
                >
                  {request.message}
                </p>
              )}
            </div>
          </div>

          {tone === "danger" && (
            <p className={`mt-4 flex items-center gap-1.5 text-[10.5px] font-bold ${isModernSleek ? "text-rose-600" : "text-rose-400/90"}`}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Cette action est irréversible.
            </p>
          )}

          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={() => close(false)}
              className={`h-10 px-4 rounded-xl border text-xs font-black uppercase tracking-wide transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]/60 ${
                isModernSleek
                  ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "bg-[#0f141d] border-[#1f293d] text-slate-300 hover:text-white hover:border-slate-500"
              }`}
            >
              {request.cancelLabel || "Annuler"}
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={`h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wide shadow-lg transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${toneStyles.button}`}
            >
              {request.confirmLabel || "Supprimer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
