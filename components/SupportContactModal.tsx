"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  Sparkles,
  Clock,
  ShieldCheck,
  MessageSquare,
  User,
  Building,
  Tag
} from "lucide-react";
import { getPremiumTheme, premiumOverlay, premiumShell, premiumLabel } from "@/lib/premiumModalTheme";

interface SupportContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  userClub?: string;
  userSport?: string;
  userPlan?: string;
  initialSubject?: string;
  isAdmin?: boolean;
  isModernSleek?: boolean;
}

const SUPPORT_EMAIL_TARGET = "support@thebox-tactique.com";

const PRESET_CATEGORIES = [
  { id: "tech", label: "Problème technique / Bug", prefix: "[Support] Bug :" },
  { id: "billing", label: "Abonnement & Facturation", prefix: "[Support] Facturation :" },
  { id: "feature", label: "Suggestion d'amélioration", prefix: "[Support] Suggestion :" },
  { id: "general", label: "Question générale", prefix: "[Support] Question :" },
];

export default function SupportContactModal({
  isOpen,
  onClose,
  userEmail = "",
  userName = "",
  userClub = "",
  userSport = "",
  userPlan = "",
  initialSubject = "",
  isAdmin = false,
  isModernSleek = false
}: SupportContactModalProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [category, setCategory] = useState<string>("tech");
  const [subjectText, setSubjectText] = useState(initialSubject);
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync props when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (userName && !name) setName(userName);
      if (userEmail && !email) setEmail(userEmail);
      if (initialSubject && !subjectText) setSubjectText(initialSubject);
      setErrorMessage(null);
      setSubmitSuccess(false);
    }
  }, [isOpen, userName, userEmail, initialSubject]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Veuillez renseigner votre adresse e-mail.");
      return;
    }
    if (!message.trim()) {
      setErrorMessage("Veuillez saisir votre message.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Build the final subject starting strictly with [Support]
    const activeCategoryObj = PRESET_CATEGORIES.find((c) => c.id === category);
    const cleanSubjectText = subjectText.trim() || activeCategoryObj?.label || "Demande d'assistance";

    // Ensure it starts with [Support]
    const finalSubject = cleanSubjectText.startsWith("[Support]")
      ? cleanSubjectText
      : `[Support] ${cleanSubjectText}`;

    try {
      const res = await fetch("/api/send-support-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Coach The Box",
          email: email.trim(),
          subject: finalSubject,
          message: message.trim(),
          club: userClub,
          sport: userSport,
          plan: userPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Impossible d'envoyer votre message pour le moment.");
      }

      setSubmitSuccess(true);
      setMessage("");
    } catch (err: any) {
      console.error("Support form error:", err);
      setErrorMessage(err.message || "Une erreur s'est produite lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const th = getPremiumTheme(isModernSleek);
  const inputBase = `w-full rounded-xl px-3 py-2.5 text-xs border outline-none transition ${th.input}`;
  const labelBase = `${premiumLabel} ${th.sub}`;

  return (
    <div
      className={`${premiumOverlay} z-[130]`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className={`${premiumShell} w-full max-w-4xl max-h-[94vh] sm:max-h-[88vh] ${th.panel}`}>
        {!isModernSleek && (
          <div className="absolute -top-40 left-32 w-[460px] h-[300px] bg-[#00E599]/[0.05] rounded-full blur-3xl pointer-events-none" />
        )}

        {/* ================= SIDEBAR ================= */}
        <aside className={`hidden md:flex w-64 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${th.accentChip}`}>
                <Mail className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.accent}`}>The Box</p>
                <p className={`text-sm font-black ${th.text}`}>Support</p>
              </div>
            </div>
          </div>

          <div className="px-3 space-y-2">
            {[
              { icon: Clock, title: "Réponse sous 24 h", desc: "Par e-mail, 7 j / 7." },
              { icon: ShieldCheck, title: isAdmin ? SUPPORT_EMAIL_TARGET : "Support technique The Box", desc: isAdmin ? "Destinataire officiel" : "Votre demande arrive directement à l'équipe." },
              { icon: Sparkles, title: "Vos idées comptent", desc: "Suggestions d'amélioration bienvenues." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.desc} className={`p-3 rounded-2xl border flex items-start gap-3 ${th.card}`}>
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${th.accentChip}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-black truncate ${th.text}`}>{item.title}</p>
                    <p className={`text-[11px] leading-snug ${th.sub}`}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {(userClub || userSport || userPlan) && (
            <div className="mt-auto p-3">
              <div className={`p-3 rounded-2xl border ${th.cardMuted}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] mb-2 ${th.faint}`}>Joint à votre demande</p>
                <dl className="space-y-1 text-[11px]">
                  {userClub && <div className="flex justify-between gap-2"><dt className={th.sub}>Club</dt><dd className={`font-bold truncate ${th.text}`}>{userClub}</dd></div>}
                  {userSport && <div className="flex justify-between gap-2"><dt className={th.sub}>Sport</dt><dd className={`font-bold capitalize ${th.text}`}>{userSport}</dd></div>}
                  {userPlan && <div className="flex justify-between gap-2"><dt className={th.sub}>Formule</dt><dd className={`font-bold uppercase ${th.text}`}>{userPlan}</dd></div>}
                </dl>
              </div>
            </div>
          )}
        </aside>

        {/* ================= MAIN ================= */}
        <main className="flex-1 min-w-0 flex flex-col relative z-10 min-h-0">
          <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${th.border}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={`md:hidden text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${th.accent}`}>Support</p>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight ${th.text}`}>Contacter le support</h2>
                <p className={`text-xs mt-1 ${th.sub}`}>Notre équipe vous répond directement à votre adresse e-mail.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`p-2 rounded-xl border transition cursor-pointer shrink-0 disabled:opacity-50 ${th.ghostBtn}`}
                title="Fermer (Échap)"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {submitSuccess ? (
            /* ---------- SUCCÈS ---------- */
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-10 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${th.accentChip}`}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className={`mt-5 text-xl font-black tracking-tight ${th.text}`}>Message envoyé</h3>
              <p className={`mt-2 text-sm max-w-md leading-relaxed ${th.sub}`}>
                Votre demande a bien été transmise à l&apos;équipe support The Box{isAdmin ? <> (<span className={`font-mono font-bold ${th.accent}`}>{SUPPORT_EMAIL_TARGET}</span>)</> : null}.
              </p>
              <div className={`mt-5 w-full max-w-md p-4 rounded-2xl border text-left space-y-2 ${th.cardMuted}`}>
                <p className={`text-xs flex items-center gap-2 ${th.body}`}>
                  <Clock className={`w-4 h-4 shrink-0 ${th.accent}`} />
                  Délai de réponse habituel : moins de 24 heures
                </p>
                <p className={`text-xs flex items-center gap-2 min-w-0 ${th.body}`}>
                  <Mail className={`w-4 h-4 shrink-0 ${th.accent}`} />
                  <span className="truncate">Réponse envoyée à <strong className={`font-mono ${th.text}`}>{email}</strong></span>
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitSuccess(false);
                    setMessage("");
                  }}
                  className={`h-10 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${th.ghostBtn}`}
                >
                  Envoyer un autre message
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`h-10 px-5 rounded-xl text-xs font-black transition cursor-pointer ${th.primaryBtn}`}
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            /* ---------- FORMULAIRE ---------- */
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 space-y-4 scrollbar-thin">
                {errorMessage && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-shake ${th.danger}`}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelBase}>Votre nom</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Coach Martin" className={inputBase} />
                  </div>
                  <div>
                    <label className={labelBase}>Votre email <span className={th.accent}>*</span></label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="martin.coach@gmail.com" className={inputBase} />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Type de demande</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {PRESET_CATEGORIES.map((cat) => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategory(cat.id);
                            if (!subjectText || PRESET_CATEGORIES.some((c) => c.label === subjectText)) {
                              setSubjectText(cat.label);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left text-[11px] font-bold leading-snug transition cursor-pointer ${isSelected ? `${th.selected} ${th.text}` : `${th.selectable} ${th.sub}`}`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Objet</label>
                  <div className="relative flex items-center">
                    <span className={`absolute left-2.5 font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md border pointer-events-none ${th.accentChip}`}>
                      [Support]
                    </span>
                    <input
                      type="text"
                      value={subjectText}
                      onChange={(e) => {
                        // Retire un éventuel [Support] tapé à la main pour éviter le doublon
                        const val = e.target.value.replace(/^\[Support\]\s*/i, "");
                        setSubjectText(val);
                      }}
                      placeholder="Ex : problème d'export de schéma, question licence…"
                      className={`${inputBase} pl-[5.5rem]`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`${labelBase} flex items-center justify-between`}>
                    <span>Votre message <span className={th.accent}>*</span></span>
                    <span className={`normal-case tracking-normal font-bold tabular-nums ${th.faint}`}>{message.length} caractères</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez votre question, le problème rencontré ou vos besoins en détail…"
                    className={`${inputBase} resize-none leading-relaxed`}
                  />
                </div>
              </div>

              <footer className={`px-5 sm:px-8 py-4 border-t flex items-center justify-end gap-2 ${th.border}`}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`h-10 px-4 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-50 ${th.ghostBtn}`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim() || !email.trim()}
                  className={`h-10 px-5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${th.primaryBtn}`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Envoyer
                    </>
                  )}
                </button>
              </footer>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
