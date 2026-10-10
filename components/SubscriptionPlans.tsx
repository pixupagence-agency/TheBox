"use client";

import React, { useState, useEffect } from "react";
import { 
  Check, 
  CreditCard, 
  Sparkles, 
  Shield, 
  UserCheck, 
  CheckCircle, 
  Receipt, 
  Lock, 
  Landmark, 
  RotateCcw, 
  ExternalLink, 
  HelpCircle, 
  Copy, 
  CheckCheck, 
  AlertCircle,
  Zap,
  Terminal,
  Server,
  X
} from "lucide-react";

interface SubscriptionPlansProps {
  activePlan: string;
  setActivePlan: (plan: string) => void;
  coachId?: string;
  coachEmail?: string;
  coachName?: string;
  isModernSleek?: boolean;
}

export default function SubscriptionPlans({ 
  activePlan, 
  setActivePlan,
  coachId,
  coachEmail,
  coachName,
  isModernSleek = false
}: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showStripeGuide, setShowStripeGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Stripe configuration check state
  const [stripeStatus, setStripeStatus] = useState<{
    configured: boolean;
    mode: string;
    hasWebhookSecret: boolean;
  }>({ configured: false, mode: "unconfigured", hasWebhookSecret: false });
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);

  // Real Stripe Checkout redirect loading
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Simulated Checkout states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState(coachName || "");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [checkoutMode, setCheckoutMode] = useState<"stripe" | "simulator">("stripe");
  
  // Unsubscription states
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const isPaidPlan = Boolean(
    activePlan &&
    activePlan.toLowerCase() !== "free" &&
    activePlan.toLowerCase() !== "gratuit"
  );

  const handleLaunchStripePortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachEmail,
          returnUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (data?.error) {
        setPortalError(data.error);
        alert(data.error);
      }
    } catch (err: any) {
      console.error("Portal error", err);
      setPortalError("Impossible de joindre le portail client Stripe.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleConfirmUnsubscribe = () => {
    setIsUnsubscribing(true);
    try {
      setActivePlan("free");
      if (typeof window !== "undefined") {
        if (coachId) {
          const savedPlans = localStorage.getItem("thebox_admin_user_plans");
          const parsed = savedPlans ? JSON.parse(savedPlans) : {};
          parsed[coachId] = "free";
          localStorage.setItem("thebox_admin_user_plans", JSON.stringify(parsed));
          localStorage.setItem(`thebox_has_had_subscription_${coachId}`, "true");
        }
        localStorage.setItem("thebox_active_plan", "free");
      }
      setShowUnsubscribeModal(false);
      alert("✅ Votre désabonnement a été pris en compte.\n\nVotre compte est désormais repassé en Version Gratuite.");
    } catch (e) {
      console.error("Unsubscribe error", e);
    } finally {
      setIsUnsubscribing(false);
    }
  };
  
  const plans = [
    {
      id: "free",
      name: "Version Gratuite",
      price: "0",
      description: "Pour découvrir le tableau tactique et préparer ses séances basiques.",
      features: [
        "Tableau blanc tactique 2D & tracés vectoriels",
        "Personnalisation complète de l'effectif",
        "Gestion des rôles des joueurs",
        "Export en PNG du terrain",
        "Visibilité du terrain complet ou à moitié, en portrait ou paysage"
      ],
      cta: "Plan Actif par Défaut",
      popular: false,
      color: "border-slate-800 text-slate-400"
    },
    {
      id: "pro",
      name: "Formule PRO",
      price: "9.90",
      description: "Pour l'entraîneur qui veut gérer ses équipes, matchs, schémas et causeries vocales.",
      features: [
        "Toutes les fonctionnalités Gratuite",
        "Gestion multi-équipes pour un seul utilisateur",
        "Enregistrements des schémas tactiques liés au match sélectionné",
        "Enregistrements vocales et saisies de notes activés",
        "Gestion des matchs",
        "Gestion de l'équipe adverse"
      ],
      cta: "Sélectionner Formule PRO",
      popular: true,
      color: "border-[#00E599] text-[#00E599] ring-2 ring-[#00E599]/20"
    },
    {
      id: "club",
      name: "Formule PRO+",
      price: "14.90",
      description: "Pour le suivi en direct le jour de match avec le mode live interactif.",
      features: [
        "Toutes les fonctionnalités PRO",
        "Activation du mode live match possible",
        "Gestion de banc & changements en temps réel",
        "Chronos et statistiques de possession"
      ],
      cta: "Sélectionner Formule PRO+",
      popular: false,
      color: "border-amber-500/40 text-amber-400"
    }
  ];

  // Check server Stripe status on mount
  useEffect(() => {
    fetch("/api/stripe/config")
      .then((res) => res.json())
      .then((data) => {
        setStripeStatus({
          configured: Boolean(data.configured),
          mode: data.mode || "unconfigured",
          hasWebhookSecret: Boolean(data.hasWebhookSecret),
        });
        setIsCheckingConfig(false);
      })
      .catch(() => {
        setIsCheckingConfig(false);
      });

    // Check return from real Stripe Checkout
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const stripeResult = urlParams.get("stripe_status");
      const upgradedPlan = urlParams.get("plan");

      if (stripeResult === "success" && upgradedPlan) {
        setActivePlan(upgradedPlan);
        alert(`🎉 Paiement confirmé avec succès ! Votre abonnement "${upgradedPlan.toUpperCase()}" est maintenant actif.`);
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [setActivePlan]);

  // Handle Real Stripe Checkout Session Creation
  const handleLaunchStripeCheckout = async (planId: string) => {
    setIsStripeLoading(true);
    setStripeError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          coachId: coachId || "coach_demo",
          coachEmail: coachEmail || "coach@thebox.club",
          returnUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresConfig) {
          setStripeError("Le service de paiement n'est pas encore configuré.");
          setCheckoutMode("simulator");
        } else {
          setStripeError(data.error || "Impossible de contacter le service de paiement.");
        }
        setIsStripeLoading(false);
        return;
      }

      if (data.url) {
        // Redirect directly to hosted checkout page
        window.location.assign(data.url);
      } else {
        throw new Error("URL de redirection non renvoyée.");
      }
    } catch (err: any) {
      console.error("Erreur checkout:", err);
      setStripeError(err?.message || "Erreur réseau lors de la connexion au service de paiement.");
      setIsStripeLoading(false);
    }
  };

  // Simulated checkout submit
  const handleSimulatedCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !expiry || !cvc) {
      alert("Veuillez remplir tous les champs de paiement simulés.");
      return;
    }

    setIsLoadingPayment(true);
    
    setTimeout(() => {
      setIsLoadingPayment(false);
      setPaymentDone(true);
      setTransactionId("TXN_" + Math.floor(Date.now() / 10000));
      setActivePlan(selectedPlan || "free");
    }, 1500);
  };

  const handleCancelCheckout = () => {
    setSelectedPlan(null);
    setCardNumber("");
    setCardName(coachName || "");
    setExpiry("");
    setCvc("");
    setPaymentDone(false);
    setStripeError(null);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://mon-app.run.app";
  const webhookUrl = `${currentOrigin}/api/stripe/webhook`;

  return (
    <div className="space-y-8 text-brand-ivory" id="subscription-plans">
      
      {/* Top title and status banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-pine border border-brand-border rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-deep/50 text-[#00E599] rounded-lg border border-brand-border">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Abonnements & Licences Club</h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-[#00E599] border-emerald-500/30">
                Paiement Sécurisé
              </span>
            </div>
            <p className="text-xs text-brand-sage font-medium mt-0.5">
              Passerelle de paiement sécurisée & Gestion récurrente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-3 py-1.5 ${isModernSleek ? "bg-white border-slate-300 text-slate-800" : "bg-brand-deep border-brand-border text-brand-cream"} border text-xs font-bold rounded-lg`}>
            Plan actuel : <span className={`uppercase font-black ${isPaidPlan ? "text-amber-400" : "text-white"}`}>{activePlan === "free" ? "Gratuit" : activePlan.toUpperCase()}</span>
          </div>

          {isPaidPlan && (
            <button
              type="button"
              onClick={() => setShowUnsubscribeModal(true)}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Se désabonner de l'application et repasser en version gratuite"
            >
              <span>🛑</span>
              <span>Se désabonner</span>
            </button>
          )}
        </div>
      </div>

      {/* PAYMENT CONNECTION GUIDE MODAL / DRAWER */}
      {showStripeGuide && (
        <div className="bg-[#0b101b] border-2 border-[#00E599]/40 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#1f2d45] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center text-[#00E599]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Comment brancher la passerelle de paiement</h3>
                <p className="text-xs text-slate-400">L&apos;infrastructure backend (`/api/stripe/*`) est 100% prête. Voici les 3 étapes pour l&apos;activer :</p>
              </div>
            </div>
            <button
              onClick={() => setShowStripeGuide(false)}
              className="text-slate-400 hover:text-white font-bold text-xs bg-[#162133] px-2.5 py-1.5 rounded-lg border border-[#223350]"
            >
              Fermer ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-[#101726] border border-[#1d2b44] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00E599] text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                <h4 className="text-xs font-black text-white uppercase">Créer le compte marchand</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Créez ou connectez votre compte marchand pour accepter les règlements en ligne.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#101726] border border-[#1d2b44] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00E599] text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                <h4 className="text-xs font-black text-white uppercase">Définir les Clés API</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Dans votre espace administrateur, copiez la <em>Clé Secrète</em> et renseignez la variable d&apos;environnement.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#101726] border border-[#1d2b44] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00E599] text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                <h4 className="text-xs font-black text-white uppercase">Configurer le Webhook</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Ajoutez l&apos;URL de point de terminaison ci-dessous pour valider les paiements :
              </p>
              <div className="bg-[#070b12] p-2 rounded border border-[#1c273c] text-[10px] font-mono text-amber-400 flex items-center justify-between">
                <span className="truncate">{webhookUrl}</span>
                <button
                  onClick={() => copyToClipboard(webhookUrl, "webhook_url")}
                  className="text-slate-400 hover:text-white p-1 shrink-0"
                >
                  {copiedKey === "webhook_url" ? <CheckCheck className="h-3.5 w-3.5 text-[#00E599]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Grid */}
      {!selectedPlan ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = activePlan === p.id;
            return (
              <div 
                key={p.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between relative shadow-lg hover:shadow-xl transition-all ${
                  isModernSleek
                    ? p.popular
                      ? "bg-emerald-50/60 border-2 border-emerald-500 text-slate-900 shadow-emerald-500/10"
                      : "bg-slate-50 border-slate-200 text-slate-900 shadow-slate-200/50"
                    : `bg-brand-pine border-brand-border ${p.color}`
                }`}
              >
                {p.popular && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md ${
                    isModernSleek
                      ? "bg-emerald-500 text-slate-950 border border-emerald-400"
                      : "bg-brand-cream border border-white text-brand-deep"
                  }`}>
                    ⭐ RECOMMANDÉ
                  </span>
                )}

                <div>
                  <h3 className={`text-base font-bold mb-1.5 ${isModernSleek ? "text-slate-900" : "text-white"}`}>{p.name}</h3>
                  <p className={`text-xs mb-4 h-8 line-clamp-2 leading-relaxed ${isModernSleek ? "text-slate-600" : "text-brand-sage"}`}>{p.description}</p>
                  
                  <div className="flex items-baseline gap-1.5 mb-5">
                    <span className={`text-3xl font-black ${isModernSleek ? "text-slate-900" : "text-white"}`}>{p.price}€</span>
                    <span className={`text-xs ${isModernSleek ? "text-slate-500" : "text-brand-sage"}`}>/ mois</span>
                  </div>

                  <ul className={`space-y-2.5 border-t pt-4 mb-6 ${isModernSleek ? "border-slate-200" : "border-brand-border"}`}>
                    {p.features.map((f, idx) => (
                      <li key={idx} className={`flex items-start gap-2 text-xs leading-normal ${isModernSleek ? "text-slate-700" : "text-brand-sage"}`}>
                        <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isModernSleek ? "text-emerald-800" : "text-brand-cream"}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <button
                    disabled={isCurrent}
                    onClick={() => {
                      if (p.id === "free") {
                        setShowUnsubscribeModal(true);
                      } else {
                        setSelectedPlan(p.id);
                        setCheckoutMode(stripeStatus.configured ? "stripe" : "simulator");
                      }
                    }}
                    className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition-all shadow cursor-pointer ${
                      isCurrent 
                        ? isModernSleek
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                          : "bg-brand-deep text-brand-sage/60 cursor-not-allowed border border-brand-border" 
                        : p.id === "free"
                          ? "bg-slate-700 hover:bg-slate-600 text-white font-bold"
                          : p.popular
                            ? "bg-gradient-to-r from-[#00E599] to-[#06b87d] hover:brightness-110 text-slate-950 font-black shadow-lg shadow-[#00E599]/20"
                            : isModernSleek
                              ? "bg-slate-900 hover:bg-slate-800 text-white font-bold"
                              : "bg-brand-moss hover:bg-brand-moss/80 text-brand-cream"
                    }`}
                  >
                    {isCurrent ? "Votre Plan Actuel" : p.id === "free" ? "Repasser en Version Gratuite" : p.cta}
                  </button>

                  {/* Bouton Se désabonner sur le plan actif payant */}
                  {isCurrent && p.id !== "free" && (
                    <button
                      type="button"
                      onClick={() => setShowUnsubscribeModal(true)}
                      className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      title="Résilier cet abonnement et revenir à la formule gratuite"
                    >
                      <span>🛑</span>
                      <span>Se désabonner de cette formule</span>
                    </button>
                  )}

                  {!isCurrent && p.id !== "free" && (
                    <button
                      onClick={() => handleLaunchStripeCheckout(p.id)}
                      disabled={isStripeLoading}
                      className={`w-full py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                        isModernSleek
                          ? "text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300"
                          : "text-slate-300 hover:text-white bg-[#0e1524] hover:bg-[#162238] border-[#1f2e48]"
                      }`}
                    >
                      <Zap className="h-3 w-3 text-[#00E599]" />
                      <span>Payer directement par Carte Bancaire</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section récapitulative de résiliation & portail Stripe pour abonnés */}
        {isPaidPlan && (
          <div className={`mt-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isModernSleek 
              ? "bg-slate-50 border-slate-200 text-slate-800 shadow-sm" 
              : "bg-[#0d131f] border-[#1e2a3f] text-slate-200 shadow-md"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                🛡️
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <span>Abonnement Actif Sans Engagement</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-mono uppercase">
                    {activePlan}
                  </span>
                </p>
                <p className={`text-xs ${isModernSleek ? "text-slate-500" : "text-slate-400"} mt-0.5`}>
                  Vous pouvez vous désabonner à tout moment d&apos;un simple clic. Aucun frais de résiliation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {coachEmail && (
                <button
                  type="button"
                  onClick={handleLaunchStripePortal}
                  disabled={portalLoading}
                  className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isModernSleek
                      ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                      : "bg-[#141b29] hover:bg-[#1a2336] border-[#222f46] text-slate-300"
                  }`}
                  title="Gérer vos factures et coordonnées bancaires sur le portail sécurisé Stripe"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{portalLoading ? "Chargement..." : "Portail Stripe"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowUnsubscribeModal(true)}
                className="flex-1 sm:flex-initial px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-rose-900/20 flex items-center justify-center gap-1.5"
              >
                <span>🛑</span>
                <span>Se désabonner de l&apos;application</span>
              </button>
            </div>
          </div>
        )}
        </>
      ) : (
        /* HIGH-FIDELITY CHECKOUT MODAL */
        <div className="max-w-xl mx-auto bg-brand-pine border border-brand-border rounded-xl overflow-hidden shadow-2xl animate-fade-in">
          
          {/* Header block */}
          <div className="bg-brand-deep p-4 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-brand-cream" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-sage">Passerelle de Paiement Sécurisée</span>
            </div>
            
            <button 
              onClick={handleCancelCheckout}
              className="text-brand-sage hover:text-brand-cream text-xs font-semibold uppercase flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Annuler</span>
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="bg-[#0b101a] border-b border-brand-border px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutMode("stripe")}
                className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  checkoutMode === "stripe" 
                    ? "bg-[#00E599] text-slate-950" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Paiement par Carte Bancaire</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckoutMode("simulator")}
                className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  checkoutMode === "simulator" 
                    ? "bg-[#1d2b44] text-white border border-[#2b3e60]" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Simulateur CB de Test</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-500 font-mono">
              Mode Sécurisé
            </span>
          </div>

          {stripeError && (
            <div className="m-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Information de paiement</p>
                <p className="text-[11px] text-rose-300/90">{stripeError}</p>
              </div>
            </div>
          )}

          {checkoutMode === "stripe" ? (
            /* OFFICIAL CHECKOUT REDIRECT PANEL */
            <div className="p-6 space-y-5 text-center">
              <div className="bg-brand-deep p-4 rounded-xl border border-brand-border space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-brand-border pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-brand-sage">Formule choisie</span>
                    <h4 className="text-base font-bold text-white">
                      {selectedPlan === "pro" ? "Formule PRO" : "Formule PRO+"}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-brand-cream">
                      {selectedPlan === "pro" ? "9.90€" : "14.90€"}
                    </span>
                    <span className="text-xs text-brand-sage block">/ mois</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-[#00E599]" />
                    <span>Facturation récurrente mensuelle sans engagement</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-[#00E599]" />
                    <span>Reçu et facture avec TVA édités automatiquement</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-[#00E599]" />
                    <span>Paiements sécurisés (Apple Pay, Google Pay, CB, Visa, Mastercard)</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  disabled={isStripeLoading}
                  onClick={() => selectedPlan && handleLaunchStripeCheckout(selectedPlan)}
                  className="w-full py-3.5 px-6 bg-[#00E599] hover:bg-[#05be80] disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-xl shadow-[#00e599]/15 cursor-pointer"
                >
                  {isStripeLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Connexion sécurisée en cours...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Continuer vers le paiement sécurisé</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400">
                  Vous serez redirigé vers la page de paiement sécurisée.
                </p>
              </div>
            </div>
          ) : paymentDone ? (
            /* Successful payment Receipt block */
            <div className="p-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-brand-moss/50 border border-brand-cream/40 flex items-center justify-center text-brand-cream mx-auto animate-bounce">
                <CheckCircle className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Félicitations Coach !</h3>
                <p className="text-xs text-brand-sage mt-1 max-w-sm mx-auto">
                  Votre transaction simulée a été validée avec succès. Votre abonnement <span className="text-brand-cream font-bold uppercase">{selectedPlan.toUpperCase()}</span> est désormais activé.
                </p>
              </div>

              {/* Mock Invoice receipt card */}
              <div className="bg-brand-deep p-4 rounded-lg border border-brand-border max-w-sm mx-auto text-left space-y-3">
                <div className="flex items-center justify-between border-b border-brand-border pb-2 text-[11px] font-bold text-brand-sage">
                  <span className="flex items-center gap-1"><Receipt className="h-3.5 w-3.5" /> Reçu de paiement</span>
                  <span>ID: {transactionId || "TXN_4829"}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-brand-sage">
                    <span>Produit souscrit :</span>
                    <span className="text-white font-bold">{selectedPlan === "pro" ? "Formule PRO Coach" : "Formule PRO+ The Box"}</span>
                  </div>
                  <div className="flex justify-between text-brand-sage">
                    <span>Montant réglé :</span>
                    <span className="text-brand-cream font-bold">{selectedPlan === "pro" ? "9.90 €" : "14.90 €"}</span>
                  </div>
                  <div className="flex justify-between text-brand-sage">
                    <span>Titulaire de carte :</span>
                    <span className="text-white font-bold">{cardName || "Coach The Box"}</span>
                  </div>
                  <div className="flex justify-between text-brand-sage">
                    <span>Passerelle de paiement :</span>
                    <span className="text-brand-sage/80 font-semibold flex items-center gap-1">Paiement Sécurisé <Landmark className="h-3 w-3 text-brand-sage" /></span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCancelCheckout}
                className="px-6 py-2 bg-brand-cream hover:bg-slate-100 text-brand-deep font-black text-xs rounded-lg transition cursor-pointer"
              >
                Retourner au tableau de bord
              </button>
            </div>
          ) : (
            /* Secure Credit Card form */
            <form onSubmit={handleSimulatedCheckoutSubmit} className="p-6 space-y-5">
              
              {/* Chosen product brief */}
              <div className="bg-brand-deep p-3 rounded-lg border border-brand-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-sage">Formule sélectionnée</span>
                  <h4 className="text-sm font-bold text-white">{selectedPlan === "pro" ? "Formule PRO" : "Formule PRO+"}</h4>
                </div>
                <span className="text-lg font-black text-brand-cream">{selectedPlan === "pro" ? "9.90€" : "14.90€"}<span className="text-[10px] text-brand-sage font-normal">/m</span></span>
              </div>

              {/* Quick fill button for test card */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber("4242424242424242");
                    setCardName("COACH PIXUP");
                    setExpiry("12/28");
                    setCvc("123");
                  }}
                  className="text-[11px] font-bold text-[#00E599] hover:underline flex items-center gap-1"
                >
                  ⚡ Remplir avec la carte de test (4242...)
                </button>
              </div>

              {/* CARD PREVIEW DESIGN */}
              <div className="bg-gradient-to-br from-[#0c1523] to-[#04080e] rounded-xl p-5 border border-[#1f2e48] shadow-2xl space-y-6 text-brand-ivory select-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00E599]">THE BOX SPORT</span>
                  <span className="text-xs font-bold bg-[#142136] px-2 py-0.5 rounded text-slate-300">Mode Test</span>
                </div>

                <div className="space-y-1">
                  <span className="text-lg font-mono tracking-widest block text-white">
                    {cardNumber ? cardNumber.replace(/(\d{4})/g, "$1 ").trim() : "•••• •••• •••• ••••"}
                  </span>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <span>Titulaire</span>
                    <span>Validité</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{cardName || "COACH SPORTIF"}</span>
                    <span>{expiry || "MM/AA"}</span>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-brand-sage uppercase mb-1">Nom du titulaire de la carte</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="M. LAURENT BLANC"
                    className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory placeholder-brand-sage/40 focus:outline-none focus:border-brand-cream transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-brand-sage uppercase mb-1">Numéro de carte de crédit</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    pattern="\d{16}"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory placeholder-brand-sage/40 focus:outline-none focus:border-brand-cream transition font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-sage uppercase mb-1">Date d&apos;expiration (MM/AA)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory placeholder-brand-sage/40 focus:outline-none focus:border-brand-cream transition text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-sage uppercase mb-1">Code CVC</label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                      placeholder="•••"
                      className="w-full bg-brand-deep border border-brand-border rounded px-3 py-2 text-sm text-brand-ivory placeholder-brand-sage/40 focus:outline-none focus:border-brand-cream transition text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2.5 bg-brand-deep p-2.5 rounded border border-brand-border text-[10px] text-brand-sage">
                <Shield className="h-4 w-4 text-[#00E599] flex-shrink-0" />
                <span>Simulation de cryptage SSL 256 bits. Aucun débit réel ne sera opéré.</span>
              </div>

              {/* Submit transaction buttons */}
              <button
                type="submit"
                disabled={isLoadingPayment}
                className="w-full py-3 bg-[#00E599] hover:bg-[#05be80] disabled:opacity-50 text-slate-950 font-black text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                {isLoadingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Validation de la transaction de test...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Valider le paiement de test</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>
      )}

      {/* MODAL DE CONFIRMATION DE DÉSABONNEMENT */}
      {showUnsubscribeModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
          <div className={`max-w-md w-full rounded-2xl sm:rounded-3xl p-6 shadow-2xl relative overflow-hidden border ${
            isModernSleek ? "bg-white border-rose-300 text-slate-900" : "bg-[#0b0e14] border-rose-500/40 text-white"
          }`}>
            {/* Visual glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-3.5 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl shrink-0 text-rose-500 shadow-md">
                🛑
              </div>
              <div>
                <span className="text-[9px] bg-rose-500/20 text-rose-500 font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-rose-500/30">
                  RÉSILIATION D&apos;ABONNEMENT
                </span>
                <h3 className={`text-base font-black uppercase mt-1 leading-snug ${isModernSleek ? "text-slate-900" : "text-white"}`}>
                  Se désabonner de The Box
                </h3>
                <p className={`text-xs mt-1 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                  Êtes-vous sûr de vouloir résilier votre abonnement actuel (<strong className="uppercase text-amber-500">{activePlan}</strong>) ?
                </p>
              </div>
            </div>

            <div className={`border rounded-xl p-3.5 my-4 space-y-2 text-xs relative z-10 ${
              isModernSleek ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-[#121926] border-[#1f293d] text-slate-300"
            }`}>
              <p className="font-bold text-rose-500 uppercase text-[10px] tracking-wider border-b pb-1">
                Ce que vous perdez en repassant en Version Gratuite :
              </p>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-1.5 text-rose-400">
                  <span>✕</span>
                  <span>Gestion multi-équipes illimitée</span>
                </li>
                <li className="flex items-center gap-1.5 text-rose-400">
                  <span>✕</span>
                  <span>Sauvegarde des schémas tactiques dans vos matchs</span>
                </li>
                <li className="flex items-center gap-1.5 text-rose-400">
                  <span>✕</span>
                  <span>Enregistrements vocaux & dictée de notes audio</span>
                </li>
                <li className="flex items-center gap-1.5 text-rose-400">
                  <span>✕</span>
                  <span>Gestion de l&apos;effectif et des rôles adverses</span>
                </li>
                <li className="flex items-center gap-1.5 text-rose-400">
                  <span>✕</span>
                  <span>Mode Live Match interactif (chronos & stats)</span>
                </li>
              </ul>
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span>✓</span>
                <span>Vous conservez l&apos;accès au tableau 2D, à votre effectif et à l&apos;export PNG.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 relative z-10">
              <button
                type="button"
                onClick={handleConfirmUnsubscribe}
                disabled={isUnsubscribing}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase rounded-xl transition cursor-pointer shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2"
              >
                <span>🛑</span>
                <span>{isUnsubscribing ? "Désabonnement en cours..." : "Confirmer mon désabonnement (Passer en Gratuit)"}</span>
              </button>

              {coachEmail && (
                <button
                  type="button"
                  onClick={handleLaunchStripePortal}
                  disabled={portalLoading}
                  className={`w-full py-2.5 font-bold text-xs rounded-xl transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                    isModernSleek
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                      : "bg-[#141b29] hover:bg-[#1a2336] text-slate-200 border-[#222f46]"
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{portalLoading ? "Chargement..." : "Gérer / Résilier directement sur Stripe"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowUnsubscribeModal(false)}
                className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold text-xs transition cursor-pointer text-center"
              >
                Annuler et garder mon abonnement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
