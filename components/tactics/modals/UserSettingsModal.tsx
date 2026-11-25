"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import { getSportBallInfo } from "@/components/tactics/PitchBallGraphic";
import { CLUB_LOGO_ACCEPT, prepareClubLogo } from "@/lib/clubLogo";
import { auth } from "@/lib/firebase";
import { type Language, type translations } from "@/lib/i18n";
import { Award, Check, CheckCircle, CreditCard, Globe, Lock, Save, Settings, Shield, Target, Upload, User, X, type Box } from "lucide-react";

export interface UserSettingsModalProps {
  activePlan: string;
  blockedSports: string[];
  clubLogoError: string | null;
  currentLang: Language;
  deleteAccountConfirm: string;
  deleteAccountError: string | null;
  editClub: string;
  editClubLogo: string;
  editEmail: string;
  editFirstName: string;
  editLanguage: Language;
  editLastName: string;
  editRole: string;
  editShowLogoOnPitch: boolean;
  editSport: string;
  handleCancelAccountDeletion: () => Promise<void>;
  handleDeleteOwnAccount: () => Promise<void>;
  handleSaveUserConfig: (e: React.FormEvent<Element>) => void;
  isDeleteAccountOpen: boolean;
  isDeletingAccount: boolean;
  isModernSleek: boolean;
  isUserAdmin: boolean;
  isUserConfigModalOpen: boolean;
  scheduledDeletionAt: string | null;
  setActivePlan: (plan: string) => void;
  setClubLogoError: React.Dispatch<React.SetStateAction<string | null>>;
  setDeleteAccountConfirm: React.Dispatch<React.SetStateAction<string>>;
  setDeleteAccountError: React.Dispatch<React.SetStateAction<string | null>>;
  setEditClub: React.Dispatch<React.SetStateAction<string>>;
  setEditClubLogo: React.Dispatch<React.SetStateAction<string>>;
  setEditEmail: React.Dispatch<React.SetStateAction<string>>;
  setEditFirstName: React.Dispatch<React.SetStateAction<string>>;
  setEditLanguage: React.Dispatch<React.SetStateAction<Language>>;
  setEditLastName: React.Dispatch<React.SetStateAction<string>>;
  setEditRole: React.Dispatch<React.SetStateAction<string>>;
  setEditShowLogoOnPitch: React.Dispatch<React.SetStateAction<boolean>>;
  setEditSport: React.Dispatch<React.SetStateAction<string>>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDeleteAccountOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUserConfigModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUserConfigSection: React.Dispatch<React.SetStateAction<"profile" | "preferences" | "sport" | "billing">>;
  t: (typeof translations)[Language];
  toggleModernSleek: () => void;
  userConfigSection: "profile" | "preferences" | "sport" | "billing";
}

export default function UserSettingsModal({
  activePlan,
  blockedSports,
  clubLogoError,
  currentLang,
  deleteAccountConfirm,
  deleteAccountError,
  editClub,
  editClubLogo,
  editEmail,
  editFirstName,
  editLanguage,
  editLastName,
  editRole,
  editShowLogoOnPitch,
  editSport,
  handleCancelAccountDeletion,
  handleDeleteOwnAccount,
  handleSaveUserConfig,
  isDeleteAccountOpen,
  isDeletingAccount,
  isModernSleek,
  isUserAdmin,
  isUserConfigModalOpen,
  scheduledDeletionAt,
  setActivePlan,
  setClubLogoError,
  setDeleteAccountConfirm,
  setDeleteAccountError,
  setEditClub,
  setEditClubLogo,
  setEditEmail,
  setEditFirstName,
  setEditLanguage,
  setEditLastName,
  setEditRole,
  setEditShowLogoOnPitch,
  setEditSport,
  setIsCheckoutOpen,
  setIsDeleteAccountOpen,
  setIsUserConfigModalOpen,
  setUserConfigSection,
  t,
  toggleModernSleek,
  userConfigSection,
}: UserSettingsModalProps) {
  return (
    <>
        {/* MODAL : CONFIGURATION DE L'UTILISATEUR (même gabarit que la console admin) */}
        {/* ========================================================= */}
        {isUserConfigModalOpen && (() => {
          const en = currentLang === "en";
          const th = isModernSleek
            ? {
              panel: "bg-white text-slate-900 border-slate-200",
              sidebar: "bg-slate-50 border-slate-200",
              border: "border-slate-200",
              card: "bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
              cardMuted: "bg-slate-50 border-slate-200",
              text: "text-slate-900",
              sub: "text-slate-500",
              faint: "text-slate-400",
              input: "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15",
              navActive: "bg-white text-slate-900 border-slate-200 shadow-sm",
              navIdle: "text-slate-500 border-transparent hover:text-slate-900 hover:bg-white/70",
              ghostBtn: "bg-white hover:bg-slate-50 border-slate-200 text-slate-700",
              primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20",
              chip: "bg-slate-100 text-slate-600 border-slate-200",
              gold: "text-amber-600",
              goldChip: "bg-amber-50 text-amber-700 border-amber-200",
              goldTile: "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200 text-amber-600",
              accent: "text-emerald-600",
              accentChip: "bg-emerald-50 text-emerald-700 border-emerald-200",
              selected: "bg-white border-emerald-500 ring-2 ring-emerald-500/15",
              selectable: "bg-white border-slate-200 hover:border-slate-300",
              segment: "bg-slate-100 border-slate-200",
              segmentActive: "bg-white text-slate-900 shadow-sm",
              segmentIdle: "text-slate-500 hover:text-slate-800",
              option: "",
            }
            : {
              panel: "bg-[#0a0d13] text-white border-white/[0.08]",
              sidebar: "bg-[#07090e] border-white/[0.06]",
              border: "border-white/[0.06]",
              card: "bg-white/[0.025] border-white/[0.07]",
              cardMuted: "bg-white/[0.02] border-white/[0.06]",
              text: "text-white",
              sub: "text-slate-400",
              faint: "text-slate-500",
              input: "bg-white/[0.03] border-white/10 text-white placeholder-slate-500 focus:border-[#00E599]/50 focus:ring-2 focus:ring-[#00E599]/10",
              navActive: "bg-white/[0.06] text-white border-white/10",
              navIdle: "text-slate-400 border-transparent hover:text-white hover:bg-white/[0.03]",
              ghostBtn: "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200",
              primaryBtn: "bg-[#00E599] hover:bg-[#33edad] text-[#04120c] shadow-lg shadow-[#00E599]/10",
              chip: "bg-white/[0.05] text-slate-300 border-white/10",
              gold: "text-[#e9c349]",
              goldChip: "bg-[#d4af37]/10 text-[#e9c349] border-[#d4af37]/30",
              goldTile: "bg-gradient-to-br from-[#d4af37]/25 to-[#d4af37]/5 border-[#d4af37]/30 text-[#e9c349]",
              accent: "text-[#00E599]",
              accentChip: "bg-[#00E599]/10 text-[#00E599] border-[#00E599]/25",
              selected: "bg-[#00E599]/[0.06] border-[#00E599]/60 ring-2 ring-[#00E599]/10",
              selectable: "bg-white/[0.025] border-white/[0.08] hover:border-white/20",
              segment: "bg-white/[0.03] border-white/[0.07]",
              segmentActive: "bg-white/[0.09] text-white",
              segmentIdle: "text-slate-400 hover:text-slate-200",
              option: "[&>option]:bg-[#0f141d]",
            };

          const inputBase = `w-full rounded-xl px-3 py-2.5 text-xs font-semibold border outline-none transition ${th.input}`;
          const labelBase = `block text-[10px] font-black uppercase tracking-[0.14em] mb-1.5 ${th.sub}`;
          const cleanLabel = (s: string) => s.replace(/\s*\*$/, "");

          const sections: { id: "profile" | "preferences" | "sport" | "billing"; label: string; desc: string; icon: React.ElementType }[] = [
            { id: "profile", label: en ? "Profile" : "Profil", desc: en ? "Your identity and role within the club." : "Votre identité et votre fonction au sein du club.", icon: User },
            { id: "preferences", label: en ? "Preferences" : "Préférences", desc: en ? "Interface language and display theme." : "Langue de l'interface et thème d'affichage.", icon: Settings },
            { id: "sport", label: en ? "Sport" : "Sport", desc: isUserAdmin ? (en ? "Admin view: every sport is available." : "Vue administrateur : tous les sports sont disponibles.") : (en ? "Choose the discipline you coach." : "Choisissez la discipline que vous entraînez."), icon: Target },
            { id: "billing", label: en ? "Subscription" : "Abonnement", desc: t.userModal.billingNote, icon: CreditCard },
          ];
          const current = sections.find((s) => s.id === userConfigSection) || sections[0];

          const initials = `${editFirstName.charAt(0)}${editLastName.charAt(0)}`.toUpperCase() || "CO";
          const isProPlus = activePlan === "pro_plus" || activePlan === "annuel" || activePlan === "club";
          const isPro = activePlan === "pro" || activePlan === "mensuel";
          const planName = isUserAdmin ? (en ? "Admin licence" : "Licence admin") : isProPlus ? "PRO+" : isPro ? "PRO" : (en ? "Free" : "Gratuit");

          const sportOptions = [
            { id: "football", label: t.sports.football },
            { id: "basketball", label: t.sports.basketball },
            { id: "rugby", label: t.sports.rugby },
            { id: "handball", label: t.sports.handball },
          ].filter((sport) => isUserAdmin || !blockedSports.includes(sport.id));

          return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-6 z-50 animate-fade-in backdrop-blur-md">
              <form
                onSubmit={handleSaveUserConfig}
                className={`w-full max-w-4xl h-[94vh] sm:h-[min(720px,90vh)] rounded-[28px] border shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] flex flex-col md:flex-row overflow-hidden relative ${th.panel}`}
              >
                {!isModernSleek && (
                  <div className="absolute -top-40 left-32 w-[460px] h-[300px] bg-[#00E599]/[0.05] rounded-full blur-3xl pointer-events-none" />
                )}

                {/* ================= SIDEBAR ================= */}
                <aside className={`hidden md:flex w-60 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
                  <div className="px-5 pt-6 pb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${th.accentChip}`}>
                        <Settings className="h-5 w-5" />
                      </div>
                      <div className="leading-tight">
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.accent}`}>The Box</p>
                        <p className={`text-sm font-black ${th.text}`}>{en ? "Settings" : "Paramètres"}</p>
                      </div>
                    </div>
                  </div>

                  <nav className="px-3 space-y-1">
                    <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>{en ? "Account" : "Compte"}</p>
                    {sections.map((s) => {
                      const Icon = s.icon;
                      const isActive = current.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setUserConfigSection(s.id)}
                          className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? th.navActive : th.navIdle}`}
                        >
                          {isActive && <span className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${isModernSleek ? "bg-emerald-500" : "bg-[#00E599]"}`} />}
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? th.accent : ""}`} />
                          <span className="flex-1 text-left">{s.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className="mt-auto p-3">
                    <div className={`p-3 rounded-2xl border ${th.card}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${isUserAdmin
                          ? "bg-gradient-to-br from-[#e9c349] to-[#b8912a] text-[#1a1300] ring-2 ring-[#d4af37]/30"
                          : isModernSleek ? "bg-emerald-600 text-white" : "bg-[#00E599] text-[#04120c]"
                          }`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-black truncate ${th.text}`}>{editFirstName} {editLastName}</p>
                          <p className={`text-[10px] font-mono truncate ${th.sub}`}>{editEmail}</p>
                        </div>
                      </div>
                      <div className={`mt-2.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${isUserAdmin || isProPlus ? th.goldChip : isPro ? th.accentChip : th.chip}`}>
                        {isUserAdmin ? <Award className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />} {planName}
                      </div>
                    </div>
                  </div>
                </aside>

                {/* ================= MAIN ================= */}
                <div className="flex-1 min-w-0 flex flex-col relative z-10">
                  {/* Header */}
                  <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${th.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className={`md:hidden text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${th.accent}`}>{en ? "Settings" : "Paramètres"}</p>
                        <h2 className={`text-lg sm:text-xl font-black tracking-tight ${th.text}`}>{current.label}</h2>
                        <p className={`text-xs mt-1 ${th.sub}`}>{current.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsUserConfigModalOpen(false)}
                        className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${th.ghostBtn}`}
                        title={t.userModal.close}
                        aria-label={t.userModal.close}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Onglets mobiles */}
                    <div className={`md:hidden mt-4 flex gap-1 p-1 rounded-xl border overflow-x-auto ${th.segment}`}>
                      {sections.map((s) => {
                        const Icon = s.icon;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setUserConfigSection(s.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${current.id === s.id ? th.segmentActive : th.segmentIdle}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </header>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 space-y-4 scrollbar-thin">

                    {/* ---------- PROFIL ---------- */}
                    {current.id === "profile" && (
                      <>
                        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${th.card}`}>
                          <div className={`w-14 h-14 rounded-2xl text-lg font-black flex items-center justify-center shrink-0 ${isUserAdmin
                            ? "bg-gradient-to-br from-[#e9c349] to-[#b8912a] text-[#1a1300] shadow-lg shadow-[#d4af37]/20"
                            : isModernSleek ? "bg-emerald-600 text-white" : "bg-[#00E599] text-[#04120c]"
                            }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-base font-black truncate ${th.text}`}>{editFirstName} {editLastName}</p>
                            <p className={`text-xs truncate ${th.sub}`}>{editClub || (en ? "No club yet" : "Aucun club renseigné")} · {editRole}</p>
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl border space-y-4 ${th.card}`}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelBase}>{cleanLabel(t.userModal.firstName)} <span className={th.accent}>*</span></label>
                              <input type="text" required value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className={inputBase} />
                            </div>
                            <div>
                              <label className={labelBase}>{cleanLabel(t.userModal.lastName)} <span className={th.accent}>*</span></label>
                              <input type="text" required value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className={inputBase} />
                            </div>
                          </div>

                          <div>
                            <label className={`${labelBase} flex items-center justify-between`}>
                              <span>{cleanLabel(t.userModal.email)} <span className={th.accent}>*</span></span>
                              <span className={`normal-case tracking-normal text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${th.accentChip}`}>{en ? "Primary account" : "Compte principal"}</span>
                            </label>
                            <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="ex: coach@monclub.fr" className={inputBase} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelBase}>{t.userModal.club}</label>
                              <input type="text" value={editClub} onChange={(e) => setEditClub(e.target.value)} placeholder={t.userModal.clubPlaceholder} className={inputBase} />
                            </div>
                            <div>
                              <label className={labelBase}>{t.userModal.role}</label>
                              <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={`${inputBase} cursor-pointer ${th.option}`}>
                                <option value="Coach Principal">{t.userModal.roles.principal}</option>
                                <option value="Entraîneur Adjoint">{t.userModal.roles.adjoint}</option>
                                <option value="Analyste Vidéo / Tactique">{t.userModal.roles.analyst}</option>
                                <option value="Préparateur Physique">{t.userModal.roles.fitness}</option>
                                <option value="Responsable Technique">{t.userModal.roles.techDirector}</option>
                              </select>
                            </div>
                          </div>

                          {/* Logo du club : carte du match, rond central, exports image et PDF */}
                          <div>
                            <label className={labelBase}>{en ? "Club logo" : "Logo du club"}</label>
                            <div className={`p-3 rounded-2xl border flex items-center gap-3 flex-wrap ${th.selectable}`}>
                              <div className={`w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden shrink-0 ${th.chip}`}>
                                {editClubLogo ? (
                                  <img src={editClubLogo} alt={en ? "Club logo" : "Logo du club"} className="w-full h-full object-contain p-1" />
                                ) : (
                                  <Shield className={`w-6 h-6 ${th.faint}`} aria-hidden="true" />
                                )}
                              </div>
                              <div className="flex-1 min-w-[180px] space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <label className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${th.ghostBtn}`}>
                                    <Upload className="w-3.5 h-3.5" />
                                    {editClubLogo ? (en ? "Replace" : "Remplacer") : (en ? "Add a logo" : "Ajouter un logo")}
                                    <input
                                      type="file"
                                      accept={CLUB_LOGO_ACCEPT}
                                      className="sr-only"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        e.target.value = "";
                                        if (!file) return;
                                        try {
                                          setClubLogoError(null);
                                          setEditClubLogo(await prepareClubLogo(file));
                                        } catch (err) {
                                          setClubLogoError(err instanceof Error ? err.message : "Logo invalide.");
                                        }
                                      }}
                                    />
                                  </label>
                                  {editClubLogo && (
                                    <button type="button" onClick={() => setEditClubLogo("")} className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}>
                                      {en ? "Remove" : "Retirer"}
                                    </button>
                                  )}
                                </div>
                                <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${editClubLogo ? "" : "opacity-50"}`}>
                                  <input
                                    type="checkbox"
                                    checked={editShowLogoOnPitch}
                                    disabled={!editClubLogo}
                                    onChange={(e) => setEditShowLogoOnPitch(e.target.checked)}
                                    className="w-4 h-4 accent-[#00E599] cursor-pointer"
                                  />
                                  {en ? "Show in the pitch centre circle" : "Afficher dans le rond central du terrain"}
                                </label>
                                <p className={`text-[11px] ${clubLogoError ? "text-rose-400 font-semibold" : th.faint}`}>
                                  {clubLogoError || (en ? "PNG, JPG, WebP or SVG. Used on the match card, the pitch and image / PDF exports." : "PNG, JPG, WebP ou SVG. Utilisé sur la carte du match, le terrain et les exports image / PDF.")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Zone de danger : suppression définitive du compte (droit à l'effacement) */}
                        {!isUserAdmin && auth.currentUser && (
                          <div className={`mt-6 rounded-2xl border p-4 ${isModernSleek ? "border-rose-200 bg-rose-50/60" : "border-rose-500/25 bg-rose-500/[0.04]"}`}>
                            <p className={`text-xs font-black ${isModernSleek ? "text-rose-700" : "text-rose-300"}`}>
                              {en ? "Delete my account" : "Supprimer mon compte"}
                            </p>
                            {scheduledDeletionAt ? (
                              <>
                                <p className={`mt-1 text-[11px] leading-relaxed ${th.sub}`}>
                                  {(() => {
                                    const date = new Date(scheduledDeletionAt).toLocaleDateString(en ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
                                    return en
                                      ? `Deletion scheduled on ${date}, at the end of your paid period. Your subscription will not renew and you keep full access until then. On that date, your account, teams, players, matches, notes and diagrams will be permanently deleted.`
                                      : `Suppression programmée le ${date}, à la fin de votre période payée. Votre abonnement ne sera pas renouvelé et vous gardez l'accès complet d'ici là. À cette date, votre compte, vos équipes, joueurs, matchs, notes et schémas seront supprimés définitivement.`;
                                  })()}
                                </p>
                                {deleteAccountError && <p className="mt-2 text-[11px] font-semibold text-rose-400">{deleteAccountError}</p>}
                                <button
                                  type="button"
                                  onClick={() => void handleCancelAccountDeletion()}
                                  disabled={isDeletingAccount}
                                  className={`mt-3 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-40 ${th.ghostBtn}`}
                                >
                                  {isDeletingAccount ? "…" : en ? "Cancel the deletion" : "Annuler la suppression"}
                                </button>
                              </>
                            ) : (
                            <>
                            <p className={`mt-1 text-[11px] leading-relaxed ${th.sub}`}>
                              {en
                                ? "Permanently deletes your account, teams, players, matches, notes and diagrams. With a running subscription, it will not renew: you keep access until the end of the period already paid, then your account is deleted. Without a subscription, deletion is immediate. This cannot be undone."
                                : "Supprime définitivement votre compte, vos équipes, joueurs, matchs, notes et schémas. Avec un abonnement en cours, celui-ci n'est pas renouvelé : vous gardez l'accès jusqu'à la fin de la période déjà payée, puis le compte est supprimé. Sans abonnement, la suppression est immédiate. Cette action est irréversible."}
                            </p>
                            {!isDeleteAccountOpen ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsDeleteAccountOpen(true);
                                  setDeleteAccountConfirm("");
                                  setDeleteAccountError(null);
                                }}
                                className={`mt-3 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${isModernSleek ? "border-rose-300 text-rose-700 hover:bg-rose-100" : "border-rose-500/40 text-rose-300 hover:bg-rose-500/10"}`}
                              >
                                {en ? "Delete my account…" : "Supprimer mon compte…"}
                              </button>
                            ) : (
                              <div className="mt-3 space-y-2">
                                <label className={labelBase} htmlFor="delete-account-confirm">
                                  {en ? "Type SUPPRIMER to confirm" : "Tapez SUPPRIMER pour confirmer"}
                                </label>
                                <input
                                  id="delete-account-confirm"
                                  type="text"
                                  autoComplete="off"
                                  value={deleteAccountConfirm}
                                  onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                                  onKeyDown={(e) => {
                                    // Entrée ne doit pas soumettre le formulaire du profil
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      void handleDeleteOwnAccount();
                                    }
                                  }}
                                  placeholder="SUPPRIMER"
                                  className={inputBase}
                                  disabled={isDeletingAccount}
                                />
                                {deleteAccountError && <p className="text-[11px] font-semibold text-rose-400">{deleteAccountError}</p>}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteOwnAccount()}
                                    disabled={deleteAccountConfirm.trim().toUpperCase() !== "SUPPRIMER" || isDeletingAccount}
                                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {isDeletingAccount
                                      ? (en ? "Deleting…" : "Suppression…")
                                      : (en ? "Permanently delete" : "Supprimer définitivement")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsDeleteAccountOpen(false)}
                                    disabled={isDeletingAccount}
                                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}
                                  >
                                    {en ? "Cancel" : "Annuler"}
                                  </button>
                                </div>
                              </div>
                            )}
                            </>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* ---------- PRÉFÉRENCES ---------- */}
                    {current.id === "preferences" && (
                      <>
                        <div className={`p-5 rounded-2xl border ${th.card}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Globe className={`h-4 w-4 ${th.accent}`} />
                            <p className={`text-sm font-black ${th.text}`}>{t.userModal.languageTitle}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {([
                              { id: "fr", flag: "🇫🇷", name: "Français", desc: t.userModal.languageFrDesc },
                              { id: "en", flag: "🇬🇧", name: "English", desc: t.userModal.languageEnDesc },
                            ] as const).map((lang) => {
                              const isSel = editLanguage === lang.id;
                              return (
                                <button
                                  key={lang.id}
                                  type="button"
                                  onClick={() => setEditLanguage(lang.id)}
                                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${isSel ? th.selected : th.selectable}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl leading-none">{lang.flag}</span>
                                    <div>
                                      <p className={`text-xs font-black ${th.text}`}>{lang.name}</p>
                                      <p className={`text-[10px] ${th.sub}`}>{lang.desc}</p>
                                    </div>
                                  </div>
                                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? (isModernSleek ? "bg-emerald-600 border-emerald-600 text-white" : "bg-[#00E599] border-[#00E599] text-[#04120c]") : th.border}`}>
                                    {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className={`p-5 rounded-2xl border ${th.card}`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${th.cardMuted}`}>
                                {isModernSleek ? "☀️" : "🌙"}
                              </div>
                              <div>
                                <p className={`text-sm font-black ${th.text}`}>{en ? "Light theme" : "Thème clair"}</p>
                                <p className={`text-[11px] ${th.sub}`}>{isModernSleek ? t.userModal.lightDesc : t.userModal.darkDesc}</p>
                              </div>
                            </div>
                            {/* Interrupteur thème (appliqué immédiatement) */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isModernSleek}
                              aria-label={en ? "Light theme" : "Thème clair"}
                              onClick={toggleModernSleek}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition cursor-pointer ${isModernSleek ? "bg-emerald-500 border-emerald-500" : "bg-white/10 border-white/10"}`}
                            >
                              <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${isModernSleek ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ---------- SPORT ---------- */}
                    {current.id === "sport" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sportOptions.map((sport) => {
                          const isSel = editSport === sport.id;
                          const isBlocked = blockedSports.includes(sport.id);
                          return (
                            <button
                              key={sport.id}
                              type="button"
                              onClick={() => setEditSport(sport.id)}
                              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${isSel ? th.selected : th.selectable}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl ${th.cardMuted}`}>
                                  {getSportBallInfo(sport.id).emoji}
                                </div>
                                <div>
                                  <p className={`text-sm font-black ${th.text}`}>{sport.label}</p>
                                  {isBlocked ? (
                                    <p className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${isModernSleek ? "text-rose-600" : "text-rose-300"}`}>
                                      <Lock className="h-3 w-3" /> {en ? "Locked for users" : "Verrouillé pour les coachs"}
                                    </p>
                                  ) : (
                                    <p className={`text-[10px] font-bold mt-0.5 ${th.sub}`}>{en ? "Available" : "Disponible"}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? (isModernSleek ? "bg-emerald-600 border-emerald-600 text-white" : "bg-[#00E599] border-[#00E599] text-[#04120c]") : th.border}`}>
                                {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* ---------- ABONNEMENT ---------- */}
                    {current.id === "billing" && (
                      <>
                        <div className={`relative p-5 rounded-2xl border overflow-hidden ${isModernSleek
                          ? "bg-gradient-to-br from-amber-50 via-white to-white border-amber-200"
                          : "bg-gradient-to-br from-[#d4af37]/[0.10] via-white/[0.02] to-transparent border-[#d4af37]/25"
                          }`}>
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${th.goldTile}`}>
                                {isUserAdmin ? <Award className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${th.gold}`}>{en ? "Current plan" : "Formule actuelle"}</p>
                                <p className={`text-lg font-black tracking-tight ${th.text}`}>{planName}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserConfigModalOpen(false);
                                setIsCheckoutOpen(true);
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-br from-[#e9c349] to-[#c9a032] hover:brightness-105 text-[#1a1300] shadow-lg shadow-[#d4af37]/20 transition cursor-pointer"
                            >
                              {t.userModal.changePlan}
                            </button>
                          </div>
                          <p className={`text-[11px] mt-3 flex items-center gap-1.5 ${th.sub}`}>
                            <Lock className="h-3 w-3" /> {en ? "Secure payment via Stripe • No commitment" : "Paiement sécurisé via Stripe • Sans engagement"}
                          </p>
                        </div>

                        <div>
                          <p className={labelBase}>{en ? "Plans" : "Formules"}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {[
                              { id: "gratuit", name: t.userModal.freeDemo, price: "0 €", active: !isPro && !isProPlus, msg: "Formule Gratuit sélectionnée." },
                              { id: "pro", name: t.userModal.proPlanCard, price: "9,90 €", active: isPro, msg: "Formule PRO (9.90 €/mois) sélectionnée !" },
                              { id: "pro_plus", name: t.userModal.proPlusPlanCard, price: "14,90 €", active: isProPlus, msg: "Formule PRO+ (14.90 €/mois) sélectionnée !", premium: true },
                            ].map((plan) => (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => {
                                  setActivePlan(plan.id);
                                  alert(plan.msg);
                                }}
                                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${plan.active ? th.selected : th.selectable}`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${plan.premium ? th.gold : plan.id === "pro" ? th.accent : th.sub}`}>{plan.name}</p>
                                  {plan.active && <CheckCircle className={`h-4 w-4 ${th.accent}`} />}
                                </div>
                                <p className={`text-xl font-black tracking-tight mt-1 tabular-nums ${th.text}`}>
                                  {plan.price}
                                  {plan.id !== "gratuit" && <span className={`text-[11px] font-bold ${th.sub}`}>{en ? " /mo" : " /mois"}</span>}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer actions */}
                  <footer className={`px-5 sm:px-8 py-4 border-t flex items-center justify-end gap-2 ${th.border}`}>
                    <button
                      type="button"
                      onClick={() => setIsUserConfigModalOpen(false)}
                      className={`h-10 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}
                    >
                      {t.userModal.cancel}
                    </button>
                    <button
                      type="submit"
                      className={`h-10 px-5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${th.primaryBtn}`}
                    >
                      <Save className="h-4 w-4" />
                      {en ? "Save" : "Enregistrer"}
                    </button>
                  </footer>
                </div>
              </form>
            </div>
          );
        })()}

    </>
  );
}
