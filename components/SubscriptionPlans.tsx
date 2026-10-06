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
  Server
} from "lucide-react";

interface SubscriptionPlansProps {
  activePlan: string;
  setActivePlan: (plan: string) => void;
  coachId?: string;
  coachEmail?: string;
  coachName?: string;
}

export default function SubscriptionPlans({ 
  activePlan, 
  setActivePlan,
  coachId,
  coachEmail,
  coachName 
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
        alert(`🎉 Paiement Stripe confirmé avec succès ! Votre abonnement "${upgradedPlan.toUpperCase()}" est maintenant actif.`);
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
          setStripeError("Stripe n'est pas encore configuré : ajoutez votre clé secrète STRIPE_SECRET_KEY dans les variables d'environnement.");
          setShowStripeGuide(true);
          setCheckoutMode("simulator");
        } else {
          setStripeError(data.error || "Impossible de contacter l'API Stripe.");
        }
        setIsStripeLoading(false);
        return;
      }

      if (data.url) {
        // Redirect directly to Stripe hosted checkout page
        window.location.assign(data.url);
      } else {
        throw new Error("URL de redirection Stripe non renvoyée.");
      }
    } catch (err: any) {
      console.error("Erreur checkout:", err);
      setStripeError(err?.message || "Erreur réseau lors de la connexion à Stripe.");
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
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                stripeStatus.configured
                  ? "bg-emerald-500/10 text-[#00E599] border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}>
                {stripeStatus.configured ? `Stripe ${stripeStatus.mode.toUpperCase()}` : "Stripe Prêt à brancher"}
              </span>
            </div>
            <p className="text-xs text-brand-sage font-medium mt-0.5">
              Passerelle de paiement officielle Stripe Checkout & Gestion récurrente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStripeGuide(!showStripeGuide)}
            className="px-3 py-1.5 bg-[#121926] hover:bg-[#1a233a] border border-[#233149] hover:border-[#00E599] text-xs font-bold rounded-lg text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-[#00E599]" />
            <span>Guide de Connexion Stripe</span>
          </button>

          <div className="px-3 py-1.5 bg-brand-deep border border-brand-border text-xs font-bold rounded-lg text-brand-cream">
            Plan actuel : <span className="text-white uppercase font-black">{activePlan === "free" ? "Gratuit" : activePlan.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* STRIPE CONNECTION GUIDE MODAL / DRAWER */}
      {showStripeGuide && (
        <div className="bg-[#0b101b] border-2 border-[#00E599]/40 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#1f2d45] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center text-[#00E599]">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Comment brancher Stripe sur The Box</h3>
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
                <h4 className="text-xs font-black text-white uppercase">Créer le compte Stripe</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Rendez-vous sur <a href="https://stripe.com" target="_blank" rel="noreferrer" className="text-[#00E599] underline inline-flex items-center gap-0.5 font-bold">stripe.com <ExternalLink className="h-2.5 w-2.5" /></a> et créez ou connectez votre compte (gratuit).
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#101726] border border-[#1d2b44] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00E599] text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                <h4 className="text-xs font-black text-white uppercase">Définir les Clés API</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Dans <strong>Stripe &gt; Développeurs &gt; Clés API</strong>, copiez la <em>Clé Secrète</em> et renseignez la variable d&apos;environnement :
              </p>
              <div className="bg-[#070b12] p-2 rounded border border-[#1c273c] text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                <span>STRIPE_SECRET_KEY=sk_test_...</span>
                <button
                  onClick={() => copyToClipboard("STRIPE_SECRET_KEY", "secret_key_label")}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {copiedKey === "secret_key_label" ? <CheckCheck className="h-3.5 w-3.5 text-[#00E599]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#101726] border border-[#1d2b44] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00E599] text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                <h4 className="text-xs font-black text-white uppercase">Configurer le Webhook</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Dans <strong>Stripe &gt; Webhooks</strong>, ajoutez l&apos;URL de point de terminaison ci-dessous pour valider les paiements :
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

          <div className="bg-[#121c2d] border border-[#233550] rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
            <Server className="h-4 w-4 text-[#00E599] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white">Événements Stripe recommandés pour le Webhook :</p>
              <p className="text-[11px] text-slate-400">
                <code className="bg-[#0b101b] px-1.5 py-0.5 rounded text-emerald-400">checkout.session.completed</code> (mise à jour immédiate de l&apos;abonnement),{" "}
                <code className="bg-[#0b101b] px-1.5 py-0.5 rounded text-amber-400">customer.subscription.deleted</code> (retour en gratuit si résilié), et{" "}
                <code className="bg-[#0b101b] px-1.5 py-0.5 rounded text-cyan-400">invoice.payment_succeeded</code> (renouvellement mensuel).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Grid */}
      {!selectedPlan ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = activePlan === p.id;
            return (
              <div 
                key={p.id}
                className={`bg-brand-pine border-brand-border border rounded-xl p-5 flex flex-col justify-between relative shadow-lg hover:shadow-xl transition-all ${p.color}`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-cream border border-white text-brand-deep text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    ⭐ RECOMMANDÉ
                  </span>
                )}

                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{p.name}</h3>
                  <p className="text-xs text-brand-sage mb-4 h-8 line-clamp-2 leading-relaxed">{p.description}</p>
                  
                  <div className="flex items-baseline gap-1.5 mb-5">
                    <span className="text-3xl font-black text-white">{p.price}€</span>
                    <span className="text-xs text-brand-sage">/ mois</span>
                  </div>

                  <ul className="space-y-2.5 border-t border-brand-border pt-4 mb-6">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-brand-sage leading-normal">
                        <Check className="h-4 w-4 text-brand-cream flex-shrink-0 mt-0.5" />
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
                        if (typeof window !== "undefined" && window.confirm("Voulez-vous repasser sur la version gratuite ?")) {
                          setActivePlan("free");
                        }
                      } else {
                        setSelectedPlan(p.id);
                        setCheckoutMode(stripeStatus.configured ? "stripe" : "simulator");
                      }
                    }}
                    className={`w-full py-2.5 px-4 font-bold text-xs rounded-lg transition-all shadow cursor-pointer ${
                      isCurrent 
                        ? "bg-brand-deep text-brand-sage/60 cursor-not-allowed border border-brand-border" 
                        : p.id === "free"
                          ? "bg-slate-700 hover:bg-slate-600 text-white font-bold"
                          : p.popular
                            ? "bg-brand-cream hover:bg-slate-100 text-brand-deep font-black"
                            : "bg-brand-moss hover:bg-brand-moss/80 text-brand-cream"
                    }`}
                  >
                    {isCurrent ? "Votre Plan Actuel" : p.id === "free" ? "Repasser en Version Gratuite" : p.cta}
                  </button>

                  {!isCurrent && p.id !== "free" && (
                    <button
                      onClick={() => handleLaunchStripeCheckout(p.id)}
                      disabled={isStripeLoading}
                      className="w-full py-1.5 text-[11px] font-bold text-slate-300 hover:text-white bg-[#0e1524] hover:bg-[#162238] border border-[#1f2e48] rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Zap className="h-3 w-3 text-[#00E599]" />
                      <span>Payer directement via Stripe</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* HIGH-FIDELITY STRIPE CHECKOUT MODAL */
        <div className="max-w-xl mx-auto bg-brand-pine border border-brand-border rounded-xl overflow-hidden shadow-2xl animate-fade-in">
          
          {/* Header block */}
          <div className="bg-brand-deep p-4 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-brand-cream" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-sage">Passerelle Stripe Sécurisée</span>
            </div>
            
            <button 
              onClick={handleCancelCheckout}
              className="text-brand-sage hover:text-brand-cream text-xs font-semibold uppercase flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Annuler</span>
            </button>
          </div>

          {/* Mode Switch Tabs: Real Stripe vs Sandbox Simulator */}
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
                <span>Stripe Officiel (Checkout)</span>
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
              {stripeStatus.configured ? "API Prête" : "Mode Test/Démo"}
            </span>
          </div>

          {stripeError && (
            <div className="m-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Information Stripe</p>
                <p className="text-[11px] text-rose-300/90">{stripeError}</p>
              </div>
            </div>
          )}

          {checkoutMode === "stripe" ? (
            /* OFFICIAL STRIPE CHECKOUT REDIRECT PANEL */
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
                    <span>Reçu et facture avec TVA édités par Stripe</span>
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
                      <span>Connexion sécurisée avec Stripe...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Continuer vers Stripe Checkout</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400">
                  Vous serez redirigé vers la page de paiement sécurisée hébergée par Stripe.
                </p>
              </div>

              {!stripeStatus.configured && (
                <div className="bg-[#111927] p-3 rounded-xl border border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between text-left">
                  <span>Vous n&apos;avez pas encore saisi votre clé secrète Stripe ?</span>
                  <button
                    onClick={() => setShowStripeGuide(true)}
                    className="underline font-bold text-[#00E599] ml-2 shrink-0 cursor-pointer"
                  >
                    Voir le guide
                  </button>
                </div>
              )}
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
                    <span className="text-brand-sage/80 font-semibold flex items-center gap-1">Stripe Sandbox <Landmark className="h-3 w-3 text-brand-sage" /></span>
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
                  ⚡ Remplir avec la carte de test Stripe (4242...)
                </button>
              </div>

              {/* CARD PREVIEW DESIGN */}
              <div className="bg-gradient-to-br from-[#0c1523] to-[#04080e] rounded-xl p-5 border border-[#1f2e48] shadow-2xl space-y-6 text-brand-ivory select-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00E599]">THE BOX SPORT</span>
                  <span className="text-xs font-bold bg-[#142136] px-2 py-0.5 rounded text-slate-300">Stripe Test</span>
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

    </div>
  );
}
