"use client";

import React, { useState } from "react";
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

const TARGET_CONTACT_EMAIL = "pixup.agence@gmail.com";

const CONTACT_REASONS = [
  { id: "info", label: "Renseignements généraux" },
  { id: "club", label: "Offre Club / Multi-équipes" },
  { id: "demo", label: "Demande de démonstration" },
  { id: "partnership", label: "Partenariat / Presse" },
  { id: "other", label: "Autre demande" },
];

const SPORTS_OPTIONS = [
  { id: "football", label: "Football ⚽" },
  { id: "basketball", label: "Basketball 🏀" },
  { id: "rugby", label: "Rugby 🏉" },
  { id: "handball", label: "Handball 🤾" },
  { id: "multisport", label: "Multi-sports 🏆" },
];

interface LandingContactSectionProps {
  isAdmin?: boolean;
}

export default function LandingContactSection({ isAdmin = false }: LandingContactSectionProps) {
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
      setErrorMessage("Veuillez renseigner votre adresse email.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Veuillez renseigner votre message.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Build the final subject strictly starting with [Contact]
    const activeReasonObj = CONTACT_REASONS.find((r) => r.id === reason);
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
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      setIsSuccess(true);
      setMessage("");
      setSubjectText("");
    } catch (err: any) {
      console.error("Landing contact form error:", err);
      setErrorMessage(err.message || "Impossible d'envoyer votre message pour le moment. Veuillez réessayer.");
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
            <span>Formulaire de Contact</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Une question ou un projet ? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E599] via-emerald-400 to-cyan-400">
              Échangez avec l&apos;équipe The Box
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Vous souhaitez équiper votre club, planifier une démonstration privée ou obtenir des informations techniques ? Remplissez ce formulaire et recevez une réponse directement par email.
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
                  <h3 className="text-base font-black text-white">Pourquoi nous contacter ?</h3>
                  <p className="text-xs text-slate-400">Une écoute attentive pour vos besoins sportifs</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#161c28] border border-[#233149] text-[#00E599] shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Réponse rapide garantie</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Notre équipe pédagogique et technique s&apos;engage à vous répondre sous 24h ouvrées.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#161c28] border border-[#233149] text-cyan-400 shrink-0 mt-0.5">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Solutions Clubs & Académies</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Tarifs groupés, multi-licences et accompagnement pour harmoniser le projet de jeu de toutes vos équipes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-[#161c28] border border-[#233149] text-amber-400 shrink-0 mt-0.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Démonstration personnalisée</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Découvrez en visio toutes les fonctionnalités avancées (Live Match, causerie, exports HD) avec nos experts.
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
                      {isAdmin ? "Email de contact direct (Admin)" : "Canal officiel & sécurisé"}
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
                        Formulaire Direct The Box
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] bg-[#00E599]/15 text-[#00E599] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {isAdmin ? "Admin" : "Sécurisé"}
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
                  <span>Envoi direct :</span>
                  {isAdmin ? (
                    <strong className="text-white font-mono">{TARGET_CONTACT_EMAIL}</strong>
                  ) : (
                    <strong className="text-white">Équipe The Box</strong>
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
                    <h3 className="text-xl font-black text-white">Merci pour votre message !</h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                      Votre demande a été transmise avec succès à l&apos;équipe The Box{isAdmin ? <> (<span className="text-[#00E599] font-mono font-bold">{TARGET_CONTACT_EMAIL}</span>)</> : null}.
                    </p>
                    <div className="bg-[#121824] border border-[#1f293d] rounded-xl p-3.5 max-w-md mx-auto mt-4 text-left text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#00E599]" />
                        <span>Délai de prise en charge : moins de 24h ouvrées</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Réponse par email à : <strong className="text-white font-mono">{email}</strong></span>
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
                    <span>Envoyer un nouveau message</span>
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
                        <span>Votre Nom & Prénom <span className="text-[#00E599]">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: David Dupont"
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#00E599]" />
                        <span>Adresse Email <span className="text-[#00E599]">*</span></span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="coach.dupont@gmail.com"
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Row 2: Téléphone & Club */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Téléphone (Optionnel)</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="06 12 34 56 78"
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Club / Structure (Optionnel)</span>
                      </label>
                      <input
                        type="text"
                        value={club}
                        onChange={(e) => setClub(e.target.value)}
                        placeholder="Ex: FC Étoile, US Métro..."
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Row 3: Sport & Motif */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Sport de prédilection
                      </label>
                      <select
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                      >
                        {SPORTS_OPTIONS.map((sp) => (
                          <option key={sp.id} value={sp.id} className="bg-[#0d1117] text-white">
                            {sp.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Motif de contact
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => {
                          setReason(e.target.value);
                          const found = CONTACT_REASONS.find((r) => r.id === e.target.value);
                          if (found && (!subjectText || CONTACT_REASONS.some((r) => r.label === subjectText))) {
                            setSubjectText(found.label);
                          }
                        }}
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                      >
                        {CONTACT_REASONS.map((r) => (
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
                        <span>Objet du Message</span>
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
                        placeholder="Ex: Renseignements pour nos équipes U17 et Seniors..."
                        className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl pl-22 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Votre Message <span className="text-[#00E599]">*</span></span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {message.length} car.
                      </span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez votre projet, vos questions sur les fonctionnalités ou vos besoins..."
                      className="w-full bg-[#121824] border border-[#233149] focus:border-[#00E599] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition resize-none leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-[11px] text-slate-500">
                      Vos données personnelles restent strictement confidentielles.
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting || !message.trim() || !email.trim()}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00E599] to-[#06b87d] hover:brightness-110 text-[#07090e] font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#00E599]/20 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#07090e] border-t-transparent rounded-full animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer le Message</span>
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
