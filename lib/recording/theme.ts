// Module Recording : même habillage que le tableau tactique et le Training (thèmes sombre / clair partagés
// via `thebox_modern_sleek`), avec le ROUGE CORAIL (point REC) comme couleur d'accent.
import { createContext, useContext } from "react";

export const THEME_STORAGE_KEY = "thebox_modern_sleek";

export interface RecordingTheme {
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
    tileIdle: string;
  tileOn: string;
  tileLabel: string;
  logo: string;
  brand: string;
  brandSub: string;
  banner: string;
}

const dark: RecordingTheme = {
  light: false,
  page: "bg-[#07090e] text-white",
  header: "bg-[#11141a] border-[#2a2f37]",
  toolbar: "bg-[#11141a] border-[#2a2f37]",
  toolGroup: "bg-[#090d14] p-0.5 rounded-lg border border-[#1a2130]",
  toolIdle: "bg-[#0c1017] border border-[#1e293b] text-[#8a99b3] hover:text-white hover:bg-[#151e2d]",
  toolOn: "bg-[#2a1614] border border-[#FF5A4E]/70 text-[#FF8A80] shadow-xs",
  separator: "bg-[#2a3344]",
  sidebar: "bg-[#11141a] border-[#2a2f37]",
  sectionBorder: "border-[#2a2f37]",
  sectionTitle: "text-white",
  sectionIcon: "text-[#FF8A80]",
  stage: "bg-[#05070b]",
  card: "rounded-xl border border-[#2a2f37] bg-[#191c21] p-3 space-y-3",
  label: "block text-[12px] font-black uppercase tracking-[0.14em] text-[#8a99b3] mb-1.5",
  input: "w-full h-12 rounded-xl border border-[#2a2f37] bg-[#0b0e13] px-3 text-base font-semibold text-white outline-none focus:border-[#FF5A4E]/70",
  option: "[&>option]:bg-[#0f141d]",
  idleBtn: "border-[#2a2f37] bg-[#0b0e13] text-slate-200 hover:border-[#FF5A4E]/50",
  activeBtn: "border-[#FF5A4E] bg-[#FF5A4E]/12 text-[#FF8A80]",
  dangerBtn: "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
  primaryBtn: "border-[#FF5A4E] bg-[#FF5A4E] text-white hover:bg-[#E8483D]",
  text: "text-white",
  sub: "text-slate-400",
  faint: "text-slate-500",
  hint: "border-[#2a2f37] text-slate-400",
  accentText: "text-[#FF8A80]",
  accentChip: "bg-[#FF5A4E]/10 border-[#FF5A4E]/30 text-[#FECACA]",
  swatchIdle: "border-[#2a2f37]",
  swatchOn: "border-[#FF5A4E]",
  dialog: "border-[#2a2f37] bg-[#11141a] text-white",
  tileIdle: "bg-[#0b0e13] border-[#2a2f37] hover:border-[#FF5A4E]/50 hover:bg-[#1a1012]",
  tileOn: "bg-[#FF5A4E]/15 border-[#FF5A4E] shadow-[0_0_0_2px_rgba(255,90,78,0.25)]",
  tileLabel: "text-slate-300",
  logo: "text-white",
  brand: "text-white",
  brandSub: "text-white/70",
  banner: "border-[#FF5A4E]/40 bg-[#11141a]/95 text-slate-200",
};

const light: RecordingTheme = {
  light: true,
  page: "bg-[#eef1f5] text-slate-800",
  header: "bg-white/95 border-slate-200 shadow-sm",
  toolbar: "bg-white border-slate-200",
  toolGroup: "bg-slate-100 p-0.5 rounded-xl border border-slate-200",
  toolIdle: "bg-slate-200/80 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300/80",
  toolOn: "bg-white border border-rose-400 text-rose-700 shadow-xs",
  separator: "bg-slate-300",
  sidebar: "bg-white border-slate-200",
  sectionBorder: "border-slate-200",
  sectionTitle: "text-slate-900",
  sectionIcon: "text-rose-600",
  stage: "bg-[#dfe5ee]",
  card: "rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3",
  label: "block text-[12px] font-black uppercase tracking-[0.14em] text-slate-500 mb-1.5",
  input: "w-full h-12 rounded-xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 outline-none focus:border-rose-500",
  option: "[&>option]:bg-white",
  idleBtn: "border-slate-300 bg-white text-slate-700 hover:border-rose-400",
  activeBtn: "border-rose-500 bg-rose-50 text-rose-700",
  dangerBtn: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
  primaryBtn: "border-rose-600 bg-rose-600 text-white hover:bg-rose-700",
  text: "text-slate-900",
  sub: "text-slate-500",
  faint: "text-slate-400",
  hint: "border-slate-300 text-slate-500",
  accentText: "text-rose-700",
  accentChip: "bg-rose-50 border-rose-200 text-rose-800",
  swatchIdle: "border-slate-300",
  swatchOn: "border-rose-600",
  dialog: "border-slate-200 bg-white text-slate-900",
  tileIdle: "bg-white border-slate-200 hover:border-rose-400 hover:bg-rose-50/40",
  tileOn: "bg-rose-50 border-rose-500 shadow-[0_0_0_2px_rgba(225,29,72,0.2)]",
  tileLabel: "text-slate-600",
  logo: "text-slate-900",
  brand: "text-slate-900",
  brandSub: "text-slate-500",
  banner: "border-rose-300 bg-white/95 text-slate-700",
};

export const getRecordingTheme = (isLight: boolean): RecordingTheme => (isLight ? light : dark);

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

export const RecordingThemeContext = createContext<RecordingTheme>(dark);
export const useRecordingTheme = () => useContext(RecordingThemeContext);
