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

const SUPPORT_EMAIL_TARGET = "pixup.agence@gmail.com";

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

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className={`max-w-xl w-full rounded-2xl sm:rounded-3xl shadow-2xl relative my-auto overflow-hidden border ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
        }`}>

        {/* Glow visual accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER */}
        <div className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between relative z-10 ${isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#0f141d] border-[#1f293d] text-white"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-gradient-to-br from-[#00E599]/20 to-cyan-500/20 border-[#00E599]/40 text-[#00E599]"
            }`}>
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-black tracking-wide ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                  Contacter le Support
                </h3>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-[#00E599]/15 border-[#00E599]/40 text-[#00E599]"
                }`}>
                  7j / 7
                </span>
              </div>
              <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                Notre équipe vous répond directement à votre adresse e-mail.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-1.5 rounded-xl transition cursor-pointer disabled:opacity-50 ${isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
              }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 relative z-10">
          {submitSuccess ? (
            /* SUCCESS VIEW */
            <div className="text-center py-6 sm:py-8 space-y-4 animate-fade-in">
              <div className={`w-16 h-16 rounded-full border-2 mx-auto flex items-center justify-center shadow-lg animate-scale-up ${
                isModernSleek ? "bg-emerald-100 border-emerald-400 text-emerald-800 shadow-emerald-500/10" : "bg-[#00E599]/15 border-[#00E599] text-[#00E599] shadow-[#00E599]/20"
              }`}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className={`text-lg font-black ${isModernSleek ? "text-slate-900" : "text-white"}`}>Message transmis avec succès !</h4>
                <p className={`text-xs max-w-md mx-auto mt-2 leading-relaxed ${isModernSleek ? "text-slate-600" : "text-slate-300"}`}>
                  Votre demande a bien été envoyée à l&apos;équipe support The Box{isAdmin ? <> (<span className={`font-mono font-bold ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`}>{SUPPORT_EMAIL_TARGET}</span>)</> : null}.
                </p>
                <div className={`border rounded-xl p-3 max-w-md mx-auto mt-4 text-left ${
                  isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#121824] border-[#1f293d]"
                }`}>
                  <div className={`flex items-center gap-2 text-[11px] mb-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                    <Clock className={`w-3.5 h-3.5 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
                    <span>Délai de réponse habituel : moins de 24 heures</span>
                  </div>
                  <div className={`flex items-center gap-2 text-[11px] ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>
                    <Mail className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Une réponse vous sera envoyée à : <strong className={`font-mono ${isModernSleek ? "text-slate-900" : "text-white"}`}>{email}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitSuccess(false);
                    setMessage("");
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition border cursor-pointer ${
                    isModernSleek ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300" : "bg-[#161c28] hover:bg-[#1e2738] text-slate-300 border-[#233149]"
                  }`}
                >
                  Envoyer un autre message
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#00E599] hover:bg-[#06b87d] text-[#07090e] font-black text-xs transition cursor-pointer shadow-lg shadow-[#00E599]/20"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            /* FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Recipient info badge */}
              <div className={`rounded-xl px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs border ${
                isModernSleek ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-[#121824] border-[#1f293d] text-slate-400"
              }`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
                  <span>{isAdmin ? "Destinataire officiel :" : "Assistance :"}</span>
                  {isAdmin ? (
                    <strong className={`font-mono ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`}>{SUPPORT_EMAIL_TARGET}</strong>
                  ) : (
                    <strong className={isModernSleek ? "text-slate-900" : "text-white"}>Support Technique The Box</strong>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Two columns: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Votre Nom</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Coach Martin"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                      isModernSleek 
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500" 
                        : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                    <Mail className="w-3.5 h-3.5 text-[#00E599]" />
                    <span>Votre Email <span className="text-[#00E599]">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="martin.coach@gmail.com"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition border ${
                      isModernSleek 
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500" 
                        : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                    }`}
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Type de Demande</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition text-left cursor-pointer truncate ${
                          isSelected
                            ? isModernSleek ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-[#00E599]/15 border-[#00E599] text-[#00E599]"
                            : isModernSleek ? "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300" : "bg-[#121824] border-[#1f293d] text-slate-400 hover:text-white hover:border-[#2d3a52]"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Input with visual [Support] prefix badge */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Objet du Message</span>
                  </span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 bg-[#00E599]/20 text-[#00E599] font-mono text-[10px] font-black px-1.5 py-0.5 rounded pointer-events-none border border-[#00E599]/30">
                    [Support]
                  </span>
                  <input
                    type="text"
                    value={subjectText}
                    onChange={(e) => {
                      // Strip leading [Support] if user types it manually to avoid duplicate
                      const val = e.target.value.replace(/^\[Support\]\s*/i, "");
                      setSubjectText(val);
                    }}
                    placeholder="Ex: Problème d'export de schéma, Question licence..."
                    className={`w-full rounded-xl pl-22 pr-3 py-2 text-xs focus:outline-none transition border ${
                      isModernSleek 
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500" 
                        : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                    }`}
                  />
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                  <span>Votre Message <span className="text-[#00E599]">*</span></span>
                  <span className="text-[10px] text-slate-500">
                    {message.length} caractères
                  </span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre question, le problème rencontré ou vos besoins en détail..."
                  className={`w-full rounded-xl p-3 text-xs focus:outline-none transition resize-none leading-relaxed border ${
                    isModernSleek 
                      ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500" 
                      : "bg-[#121824] border-[#233149] text-white placeholder-slate-500 focus:border-[#00E599]"
                  }`}
                />
              </div>

              {/* Context Summary Footer if available */}
              {(userClub || userSport || userPlan) && (
                <div className="text-[10px] text-slate-500 flex items-center gap-3 flex-wrap pt-0.5">
                  <span className="text-slate-400 font-semibold">Infos de session :</span>
                  {userClub && <span>Club : <strong className={isModernSleek ? "text-slate-800" : "text-slate-300"}>{userClub}</strong></span>}
                  {userSport && <span>Sport : <strong className={isModernSleek ? "text-slate-800" : "text-slate-300"}>{userSport.toUpperCase()}</strong></span>}
                  {userPlan && <span>Offre : <strong className={isModernSleek ? "text-slate-800" : "text-slate-300"}>{userPlan.toUpperCase()}</strong></span>}
                </div>
              )}

              {/* ACTIONS */}
              <div className={`pt-2 flex items-center justify-between gap-3 border-t ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#161c28] hover:bg-[#1e2738] text-slate-300 font-bold text-xs transition border border-[#233149] cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim() || !email.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E599] to-[#06b87d] hover:brightness-110 text-[#07090e] font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#00E599]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#07090e] border-t-transparent rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer au Support</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
