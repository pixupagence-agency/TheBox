"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  Building,
  User,
  Phone,
  MessageSquare,
  Trophy,
  HelpCircle
} from "lucide-react";
import { Language, getStoredLanguage, translations } from "@/lib/i18n";

const TARGET_CONTACT_EMAIL = "pixup.agence@gmail.com";

interface LandingContactSectionProps {
  isAdmin?: boolean;
  language?: Language;
}

export default function LandingContactSection({ isAdmin = false, language: propLang }: LandingContactSectionProps) {
  const [currentLang, setCurrentLang] = useState<Language>(() => propLang || getStoredLanguage());

  useEffect(() => {
    if (propLang) setCurrentLang(propLang);
  }, [propLang]);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      const newLang = e.detail?.language as Language;
      if (newLang) setCurrentLang(newLang);
    };
    window.addEventListener("thebox_language_change", handleLangChange);
    return () => window.removeEventListener("thebox_language_change", handleLangChange);
  }, []);

  const t = translations[currentLang].landing.contactSection;

  const contactReasons = [
    { id: "info", label: t.reasons.info },
    { id: "club", label: t.reasons.club },
    { id: "demo", label: t.reasons.demo },
    { id: "partnership", label: t.reasons.partnership },
    { id: "other", label: t.reasons.other },
  ];

  const sportsOptions = [
    { id: "football", label: t.sportsOptions.football },
    { id: "basketball", label: t.sportsOptions.basketball },
    { id: "rugby", label: t.sportsOptions.rugby },
    { id: "handball", label: t.sportsOptions.handball },
    { id: "multisport", label: t.sportsOptions.multisport },
  ];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [club, setClub] = useState("");
  const [sport, setSport] = useState("football");
  const [reason, setReason] = useState("info");
  const [subjectText, setSubjectText] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage(t.errorsEmail);
      return;
    }

    if (!message.trim()) {
      setErrorMessage(t.errorsMessage);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Build the final subject strictly starting with [Contact]
    const activeReasonObj = contactReasons.find((r) => r.id === reason);
    const cleanSubjectInput = subjectText.trim() || activeReasonObj?.label || "Prise de contact";

    // Ensure [Contact] prefix
    const finalSubject = cleanSubjectInput.startsWith("[Contact]")
      ? cleanSubjectInput
      : `[Contact] ${cleanSubjectInput}`;

    try {
      const res = await fetch("/api/send-contact-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Visiteur Landing Page",
          email: email.trim(),
          phone: phone.trim() || undefined,
          club: club.trim() || undefined,
          sport,
          subject: finalSubject,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || t.errorsGeneric);
      }

      setIsSuccess(true);
      setMessage("");
      setSubjectText("");
    } catch (err: any) {
      console.error("Landing contact form error:", err);
      setErrorMessage(err.message || t.errorsFallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 relative border-t border-[#1b2436] bg-[#080b11] overflow-hidden">

      {/* Visual background accents */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#00E599]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00E599]/10 border border-[#00E599]/30 text-[#00E599] text-[11px] font-black uppercase tracking-wider mb-4">
            <Mail className="w-3.5 h-3.5" />
            <span>{t.tag}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {t.title1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E599] via-emerald-400 to-cyan-400">
              {t.titleHighlight}
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* 2-COLUMN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* LEFT COLUMN: INFORMATIONS & ASSURANCES */}
          <div className="lg:col-span-5 space-y-6">

            <div className="bg-[#0d1117] border border-[#1f293d] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#00E599]/20 to-cyan-500/20 border border-[#00E599]/30 text-[#00E599]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{t.whyTitle}</h3>
                  <p className="text-xs text-slate-400">{t.whySubtitle}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#161c28] border border-[#233149] text-[#00E599] shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.guaranteeTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {t.guaranteeDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#161c28] border border-[#233149] text-cyan-400 shrink-0 mt-0.5">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.clubTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {t.clubDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#161c28] border border-[#233149] text-amber-400 shrink-0 mt-0.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.demoTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {t.demoDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct email card */}
              <div className="bg-[#121824] border border-[#1f293d] rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#00E599]" />
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                      {isAdmin ? t.channelAdmin : t.channelSecure}
                    </span>
                    {isAdmin ? (
                      <a
                        href={`mailto:${TARGET_CONTACT_EMAIL}?subject=%5BContact%5D%20Demande%20de%20renseignements`}
                        className="text-xs font-mono font-bold text-[#00E599] hover:underline"
                      >
                        {TARGET_CONTACT_EMAIL}
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {t.channelDirectBox}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] bg-[#00E599]/15 text-[#00E599] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {isAdmin ? t.badgeAdmin : t.badgeSecure}
                </span>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: THE CONTACT FORM */}
          <div className="lg:col-span-7">
            <div className="bg-[#0d1117] border border-[#1f293d] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl relative">

              {/* Badge info header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1b2436] flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="w-4 h-4 text-[#00E599]" />
                  <span>{t.directSending}</span>
                  {isAdmin ? (
                    <strong className="text-white font-mono">{TARGET_CONTACT_EMAIL}</strong>
                  ) : (
                    <strong className="text-white">{t.teamTheBox}</strong>
                  )}
                </div>
              </div>

              {isSuccess ? (
                /* SUCCESS STATE */
                <div className="text-center py-10 space-y-5 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-[#00E599]/15 border-2 border-[#00E599] text-[#00E599] mx-auto flex items-center justify-center shadow-lg shadow-[#00E599]/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{t.successTitle}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                      {t.successDesc}{isAdmin ? <> (<span className="text-[#00E599] font-mono font-bold">{TARGET_CONTACT_EMAIL}</span>)</> : null}
                    </p>
                    <div className="bg-[#121824] border border-[#1f293d] rounded-xl p-3.5 max-w-md mx-auto mt-4 text-left text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#00E599]" />
                        <span>{t.guaranteeDesc}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{currentLang === "fr" ? "Réponse par email à :" : "Email reply to:"} <strong className="text-white font-mono">{email}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false);
                      setMessage("");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#161c28] hover:bg-[#1e2738] text-slate-200 font-bold text-xs transition border border-[#233149] cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>{t.sendAnother}</span>
                  </button>
                </div>
              ) : (
                /* FORM */
                <form onSubmit={handleSubmit} className="space-y-4">

                  {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                  )}

                  {/* Row 1: Nom & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.fieldFullName}</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.placeholderFullName}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#00E599]" />
                        <span>{t.fieldEmail}</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.placeholderEmail}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Row 2: Téléphone & Club */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.fieldPhone}</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.placeholderPhone}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.fieldClub}</span>
                      </label>
                      <input
                        type="text"
                        value={club}
                        onChange={(e) => setClub(e.target.value)}
                        placeholder={t.placeholderClub}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Row 3: Sport & Motif */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        {t.fieldSport}
                      </label>
                      <select
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                      >
                        {sportsOptions.map((sp) => (
                          <option key={sp.id} value={sp.id} className="bg-[#0d1117] text-white">
                            {sp.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        {t.fieldReason}
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value);
                          const found = contactReasons.find((r) => r.id === e.target.value);
                          if (found && (!subjectText || contactReasons.some((r) => r.label === subjectText))) {
                            setSubjectText(found.label);
                          }
                        }}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                      >
                        {contactReasons.map((r) => (
                          <option key={r.id} value={r.id} className="bg-[#0d1117] text-white">
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Objet du Message with visual [Contact] badge */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.fieldSubject}</span>
                      </span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 bg-[#00E599]/20 text-[#00E599] font-mono text-[10px] font-black px-1.5 py-0.5 rounded pointer-events-none border border-[#00E599]/30">
                        [Contact]
                      </span>
                      <input
                        type="text"
                        value={subjectText}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^\[Contact\]\s*/i, "");
                          setSubjectText(val);
                        }}
                        placeholder={t.placeholderSubject}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl pl-22 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>{t.fieldMessage}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {message.length} {currentLang === "fr" ? "car." : "chars"}
                      </span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t.placeholderMessage}
                      className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition resize-none leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-[11px] text-slate-500">
                      {t.secureTransmission}
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting || !message.trim() || !email.trim()}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00E599] to-[#06b87d] hover:brightness-110 text-[#07090e] font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#00E599]/20 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#07090e] border-t-transparent rounded-full animate-spin" />
                          <span>{t.submitting}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{t.submitBtn}</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
