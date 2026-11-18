"use client";

import LogoIcon from "@/components/LogoIcon";
import { DEFAULT_MAINTENANCE_MESSAGE } from "@/lib/maintenance";

interface MaintenanceScreenProps {
  message: string;
  isLoggedIn: boolean;
  onLogout: () => void;
  /** Connexion du super admin pendant la maintenance */
  onOpenLogin: () => void;
}

// Écran affiché aux visiteurs et aux coachs pendant la maintenance (voir lib/maintenance.ts)
export default function MaintenanceScreen({ message, isLoggedIn, onLogout, onOpenLogin }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center px-4 py-12 text-center">
      <LogoIcon className="w-16 h-16 text-[#00E599]" aria-hidden="true" />
      <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-amber-300">Maintenance en cours</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">The Box revient très vite</h1>
      <p className="mt-6 max-w-md text-base text-slate-300 leading-relaxed whitespace-pre-line">
        {message.trim() || DEFAULT_MAINTENANCE_MESSAGE}
      </p>
      <p className="mt-4 max-w-md text-sm text-slate-500">
        Vos équipes, matchs et schémas sont conservés. Cette page se mettra à jour automatiquement à la fin de la maintenance.
      </p>
      <div className="mt-10 text-xs text-slate-600">
        {isLoggedIn ? (
          <button type="button" onClick={onLogout} className="underline underline-offset-4 hover:text-slate-300 cursor-pointer">
            Se déconnecter
          </button>
        ) : (
          <button type="button" onClick={onOpenLogin} className="underline underline-offset-4 hover:text-slate-300 cursor-pointer">
            Accès administrateur
          </button>
        )}
      </div>
    </div>
  );
}
