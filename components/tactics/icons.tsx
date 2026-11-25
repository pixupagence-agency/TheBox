// Tableau tactique : icônes des outils et des rôles tactiques.
import type React from "react";
import { Crown, Target, Zap, CornerUpLeft, CornerUpRight, Flag, Users, Shield, CircleDot } from "lucide-react";
import type { RoleIconName, RoleTone } from "@/lib/sportRoles";

// Icônes et couleurs des rôles tactiques (définis par sport dans lib/sportRoles)
export const ROLE_ICONS: Record<RoleIconName, React.ElementType> = {
  crown: Crown, target: Target, zap: Zap, left: CornerUpLeft, right: CornerUpRight, flag: Flag, users: Users, shield: Shield, circle: CircleDot,
};
export const ROLE_TONE_CHIP: Record<RoleTone, string> = {
  gold: "bg-amber-400 text-slate-950 border-amber-200",
  green: "bg-[#00E599] text-[#0d1117] border-emerald-300",
  cyan: "bg-cyan-400 text-slate-950 border-cyan-200",
  rose: "bg-rose-500 text-white border-rose-300",
};

/** Icône de l'outil « Courbe fléchée » */
export function CurveArrowIcon({ className = "", dashed = false }: { className?: string; dashed?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19 C 4 9, 13 5, 17.5 7.5" strokeDasharray={dashed ? "3 3" : undefined} />
      <path d="M15.5 3.8 L 20 8.6 L 13.8 10.2" />
    </svg>
  );
}

/** Icône de l'outil « Lier des joueurs » : trois pastilles reliées */
export function PlayerLinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6.5 17.5 L12 6.5 L17.5 15" />
      <circle cx="5.5" cy="18.5" r="2.5" fill="currentColor" />
      <circle cx="12" cy="5.5" r="2.5" fill="currentColor" />
      <circle cx="18.5" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}
