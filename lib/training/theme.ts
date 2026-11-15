// Module Training : habillage calqué sur le « cockpit » du tableau tactique (mêmes structures,
// mêmes thèmes sombre / clair, même réglage `thebox_modern_sleek`), avec le BLEU comme couleur d'accent
// à la place du vert de la Zone de Décision Tactique.
import { createContext, useContext } from "react";

export const THEME_STORAGE_KEY = "thebox_modern_sleek";

export interface TrainingTheme {
  light: boolean;
  /** Fond de page et couleur de texte */
  page: string;
  header: string;
  /** Barre d'outils sous l'en-tête */
  toolbar: string;
  /** Conteneur d'un groupe d'outils (segment) */
  toolGroup: string;
  toolIdle: string;
  toolOn: string;
  separator: string;
  /** Colonnes latérales (palette, propriétés) */
  sidebar: string;
  /** Séparation entre deux sections d'une colonne */
  sectionBorder: string;
  sectionTitle: string;
  sectionIcon: string;
  /** Zone du terrain */
  stage: string;
  card: string;
  label: string;
  input: string;
  option: string;
  idleBtn: string;
  activeBtn: string;
  dangerBtn: string;
  primaryBtn: string;
  text: string;
  sub: string;
  faint: string;
  hint: string;
  accentText: string;
  accentChip: string;
  swatchIdle: string;
  swatchOn: string;
  dialog: string;
  /** Tuile de la palette */
  tileIdle: string;
  tileOn: string;
  tileLabel: string;
  logo: string;
  brand: string;
  brandSub: string;
  banner: string;
}

const dark: TrainingTheme = {
  light: false,
  page: "bg-[#07090e] text-white",
  header: "bg-[#11141a] border-[#2a2f37]",
  toolbar: "bg-[#11141a] border-[#2a2f37]",
  toolGroup: "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]",
  toolIdle: "bg-[#0c1017] border border-[#1e293b] text-[#8a99b3] hover:text-white hover:bg-[#151e2d]",
  toolOn: "bg-[#132338] border border-[#3B82F6]/70 text-[#60A5FA] shadow-xs",
  separator: "bg-[#2a3344]",
  sidebar: "bg-[#11141a] border-[#2a2f37]",
  sectionBorder: "border-[#2a2f37]",
  sectionTitle: "text-white",
  sectionIcon: "text-[#60A5FA]",
  stage: "bg-[#05070b]",
  card: "rounded-xl border border-[#2a2f37] bg-[#191c21] p-3 space-y-3",
  label: "block text-[12px] font-black uppercase tracking-[0.14em] text-[#8a99b3] mb-1.5",
  input: "w-full h-12 rounded-xl border border-[#2a2f37] bg-[#0b0e13] px-3 text-base font-semibold text-white outline-none focus:border-[#3B82F6]/70",
  option: "[&>option]:bg-[#0f141d]",
  idleBtn: "border-[#2a2f37] bg-[#0b0e13] text-slate-200 hover:border-[#3B82F6]/50",
  activeBtn: "border-[#3B82F6] bg-[#3B82F6]/12 text-[#60A5FA]",
  dangerBtn: "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
  primaryBtn: "border-[#3B82F6] bg-[#3B82F6] text-white hover:bg-[#2563EB]",
  text: "text-white",
  sub: "text-slate-400",
  faint: "text-slate-500",
  hint: "border-[#2a2f37] text-slate-400",
  accentText: "text-[#60A5FA]",
  accentChip: "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#BFDBFE]",
  swatchIdle: "border-[#2a2f37]",
  swatchOn: "border-[#3B82F6]",
  dialog: "border-[#2a2f37] bg-[#11141a] text-white",
  tileIdle: "bg-[#0b0e13] border-[#2a2f37] hover:border-[#3B82F6]/50 hover:bg-[#101722]",
  tileOn: "bg-[#3B82F6]/15 border-[#3B82F6] shadow-[0_0_0_2px_rgba(59,130,246,0.25)]",
  tileLabel: "text-slate-300",
  logo: "text-white",
  brand: "text-white",
  brandSub: "text-white/70",
  banner: "border-[#3B82F6]/40 bg-[#11141a]/95 text-slate-200",
};

const light: TrainingTheme = {
  light: true,
  page: "bg-[#eef1f5] text-slate-800",
  header: "bg-white/95 border-slate-200 shadow-sm",
  toolbar: "bg-white border-slate-200",
  toolGroup: "bg-slate-100 p-0.5 rounded-xl border border-slate-200",
  toolIdle: "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80",
  toolOn: "bg-white border border-blue-400 text-blue-700 shadow-xs",
  separator: "bg-slate-300",
  sidebar: "bg-white border-slate-200",
  sectionBorder: "border-slate-200",
  sectionTitle: "text-slate-900",
  sectionIcon: "text-blue-600",
  stage: "bg-[#dfe5ee]",
  card: "rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3",
  label: "block text-[12px] font-black uppercase tracking-[0.14em] text-slate-500 mb-1.5",
  input: "w-full h-12 rounded-xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 outline-none focus:border-blue-500",
  option: "[&>option]:bg-white",
  idleBtn: "border-slate-300 bg-white text-slate-700 hover:border-blue-400",
  activeBtn: "border-blue-500 bg-blue-50 text-blue-700",
  dangerBtn: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
  primaryBtn: "border-blue-600 bg-blue-600 text-white hover:bg-blue-700",
  text: "text-slate-900",
  sub: "text-slate-500",
  faint: "text-slate-400",
  hint: "border-slate-300 text-slate-500",
  accentText: "text-blue-700",
  accentChip: "bg-blue-50 border-blue-200 text-blue-800",
  swatchIdle: "border-slate-300",
  swatchOn: "border-blue-600",
  dialog: "border-slate-200 bg-white text-slate-900",
  tileIdle: "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/40",
  tileOn: "bg-blue-50 border-blue-500 shadow-[0_0_0_2px_rgba(37,99,235,0.2)]",
  tileLabel: "text-slate-600",
  logo: "text-slate-900",
  brand: "text-slate-900",
  brandSub: "text-slate-500",
  banner: "border-blue-300 bg-white/95 text-slate-700",
};

export const getTrainingTheme = (isLight: boolean): TrainingTheme => (isLight ? light : dark);

/** Même réglage de thème que le tableau tactique (sombre par défaut) */
export function readThemePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function storeThemePreference(isLight: boolean) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, String(isLight));
  } catch {
    /* stockage indisponible : le thème reste valable pour la session */
  }
}

export const TrainingThemeContext = createContext<TrainingTheme>(dark);
export const useTrainingTheme = () => useContext(TrainingThemeContext);
