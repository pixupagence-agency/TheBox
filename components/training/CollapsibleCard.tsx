"use client";

// Module Training : carte de réglages repliable (Terrain, Grille et magnétisme, Calques, Séance…).
// L'état replié est mémorisé sur l'appareil, comme les sections du tableau tactique.
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTrainingTheme } from "@/lib/training/theme";

const COLLAPSED_KEY = "thebox_training_collapsed_sections";

function readCollapsed(id: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]") as string[]).includes(id);
  } catch {
    return false;
  }
}

function storeCollapsed(id: string, collapsed: boolean) {
  try {
    const list = (JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]") as string[]).filter((x) => x !== id);
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed ? [...list, id] : list));
  } catch {
    /* stockage indisponible : l'état vaut pour la session */
  }
}

export default function CollapsibleCard({
  id, title, icon: Icon, actions, children, className = "",
}: {
  id: string;
  title: string;
  icon?: React.ElementType;
  /** Boutons affichés à droite du titre (avant la flèche) */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const th = useTrainingTheme();
  const [collapsed, setCollapsed] = useState(() => readCollapsed(id));
  const toggle = () => setCollapsed((v) => { storeCollapsed(id, !v); return !v; });
  const label = `${collapsed ? "Déplier" : "Réduire"} la section ${title}`;
  return (
    <div className={`${th.card} ${collapsed ? "!space-y-0" : ""} ${className}`}>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={toggle} aria-expanded={!collapsed} title={label} className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer select-none">
          {Icon && <Icon className={`w-4 h-4 shrink-0 ${th.sectionIcon}`} aria-hidden="true" />}
          <span className={`${th.label} !mb-0 truncate`}>{title}</span>
        </button>
        {actions}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={label}
          title={label}
          className={`h-9 w-9 shrink-0 rounded-lg border flex items-center justify-center cursor-pointer transition ${th.idleBtn}`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
}
