"use client";

import React from "react";
import { 
  Play, Activity, BookOpen, Star, AlertTriangle, Users, 
  ArrowRight, Sparkles, Shield, Compass, Calendar, Award 
} from "lucide-react";
import { Token } from "./TacticsBoard";
import { Player } from "./TeamRoster";
import SportIcon from "./SportIcon";

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onSelectSportQuick: (sport: string) => void;
  savedTactics: any[];
  roster: Player[];
  activePlan: string;
}

export default function Dashboard({ 
  onNavigate, 
  onSelectSportQuick, 
  savedTactics, 
  roster,
  activePlan 
}: DashboardProps) {
  
  // Roster status analytics calculations
  const totalPlayers = roster.length;
  const injuredCount = roster.filter(p => p.status === "injured").length;
  const excellentCount = roster.filter(p => p.status === "excellent").length;
  const tiredCount = roster.filter(p => p.status === "tired").length;

  const quickSports = [
    { id: "football", label: "Football", icon: "⚽", color: "from-emerald-500/20 to-emerald-900/10 border-emerald-800/40" },
    { id: "basketball", label: "Basketball", icon: "🏀", color: "from-amber-500/20 to-amber-900/10 border-amber-800/40" },
    { id: "rugby", label: "Rugby", icon: "🏉", color: "from-teal-500/20 to-teal-900/10 border-teal-800/40" },
    { id: "handball", label: "Handball", icon: "🤾", color: "from-rose-500/20 to-rose-900/10 border-rose-800/40" },
  ];

  return (
    <div className="space-y-6 text-brand-ivory" id="dashboard">
      
      {/* Welcome Hero Banner with dark sporty luxury background */}
      <div className="relative bg-gradient-to-r from-brand-pine to-brand-moss border border-brand-border rounded-2xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Subtle decorative lights */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-brand-cream bg-brand-deep/80 border border-brand-border px-2.5 py-1 rounded-full">
            🏟️ THE BOX • ZONE DE DÉCISION TACTIQUE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-3 leading-tight font-sans">
            the box : Maîtrisez Vos Séquences Tactiques
          </h1>
          <p className="text-xs sm:text-sm text-brand-ivory/80 mt-2 max-w-xl leading-relaxed">
            Combinez un tableau blanc interactif de haute précision et une bibliothèque cloud de stratégies de match.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate("whiteboard")}
              className="px-5 py-2.5 bg-brand-cream hover:bg-slate-100 text-brand-deep font-black text-xs rounded-lg shadow-lg shadow-brand-cream/10 flex items-center gap-1.5 transition duration-150"
            >
              <span>Ouvrir le Tableau Blanc</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK SPORT SELECTOR CHIPS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-brand-sage">Créer un nouveau schéma pour :</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickSports.map((sp) => (
            <button
              key={sp.id}
              onClick={() => onSelectSportQuick(sp.id)}
              className={`bg-gradient-to-b ${sp.color} border border-brand-border hover:border-brand-cream rounded-xl p-3.5 text-left transition duration-150 group flex items-center justify-between shadow`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-deep/80 border border-brand-border text-brand-cream group-hover:border-brand-cream group-hover:text-emerald-400 flex items-center justify-center transition shadow-inner">
                  <SportIcon sport={sp.id} className="w-7 h-7 stroke-[1.8]" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-brand-cream transition">{sp.label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-brand-sage group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* TWO COLUMN ROW: Stats & Last Tactics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Playbook Library Overviews */}
        <div className="lg:col-span-7 bg-brand-pine border border-brand-border rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-cream" />
              <span>Derniers Schémas Tactiques</span>
            </h3>
            <button 
              onClick={() => onNavigate("library")} 
              className="text-brand-cream hover:text-brand-ivory text-[11px] font-bold uppercase tracking-wider"
            >
              Voir Tout
            </button>
          </div>

          {savedTactics.length === 0 ? (
            <div className="text-center py-10 bg-brand-deep/30 rounded-lg border border-dashed border-brand-border">
              <span className="text-xl block">📋</span>
              <p className="text-xs text-brand-sage mt-2">Aucun schéma sauvegardé pour le moment.</p>
              <button
                onClick={() => onNavigate("whiteboard")}
                className="text-[11px] font-bold text-brand-cream underline mt-1 block mx-auto"
              >
                Créer une première tactique
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedTactics.slice(0, 3).map((item) => (
                <div 
                  key={item.id}
                  className="bg-brand-deep border border-brand-border/60 p-3.5 rounded-lg flex items-center justify-between hover:border-brand-cream transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg bg-brand-pine p-2 rounded border border-brand-border">
                      {item.sport === "football" ? "⚽" : item.sport === "basketball" ? "🏀" : "🏟️"}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[10px] text-brand-sage mt-0.5 uppercase font-bold tracking-wider">{item.sport} • {item.date}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectSportQuick(item.sport);
                    }}
                    className="px-2.5 py-1 bg-brand-pine hover:bg-brand-moss text-brand-cream text-[10px] font-semibold rounded border border-brand-border transition"
                  >
                    Ouvrir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Squad Performance Overview */}
        <div className="lg:col-span-5 bg-brand-pine border border-brand-border rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-cream" />
              <span>État Général d&apos;Effectif</span>
            </h3>
            <button 
              onClick={() => onNavigate("roster")} 
              className="text-brand-cream hover:text-brand-ivory text-[11px] font-bold uppercase tracking-wider"
            >
              Roster
            </button>
          </div>

          {/* Quick numbers widget */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-deep p-3 rounded-lg border border-brand-border/60 text-center">
              <span className="text-2xl font-black text-white">{totalPlayers}</span>
              <span className="block text-[9px] uppercase font-bold text-brand-sage tracking-wider mt-1">Joueurs Totaux</span>
            </div>
            <div className="bg-brand-deep p-3 rounded-lg border border-brand-border/60 text-center">
              <span className="text-2xl font-black text-rose-500">{injuredCount}</span>
              <span className="block text-[9px] uppercase font-bold text-brand-sage tracking-wider mt-1">Indisponibles</span>
            </div>
          </div>

          {/* Status summary list */}
          <div className="space-y-2 pt-2 text-[11px] text-brand-sage">
            <div className="flex justify-between items-center bg-brand-deep/40 p-2 rounded">
              <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-brand-cream" /> En Pleine Forme</span>
              <span className="font-bold text-brand-ivory bg-brand-deep border border-brand-border px-2 py-0.5 rounded">{excellentCount} joueurs</span>
            </div>
            <div className="flex justify-between items-center bg-brand-deep/40 p-2 rounded">
              <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-amber-500" /> À Ménager (Fatigués)</span>
              <span className="font-bold text-brand-ivory bg-brand-deep border border-brand-border px-2 py-0.5 rounded">{tiredCount} joueurs</span>
            </div>
          </div>

          {/* Alert check if injuries exist */}
          {injuredCount > 0 ? (
            <div className="p-2.5 bg-rose-950/30 border border-rose-900/40 text-rose-400 text-[10px] rounded flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>Attention : {injuredCount} joueurs sont blessés. Revoyez vos charges physiques ou adaptez vos schémas !</span>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-[10px] rounded flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Tout l&apos;effectif est opérationnel et disponible pour les séances tactiques !</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
