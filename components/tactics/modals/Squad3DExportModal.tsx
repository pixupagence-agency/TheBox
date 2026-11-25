"use client";

// Tableau tactique : fenêtre sortie de components/TacticsBoard.tsx (code d'affichage inchangé).
import React from "react";
import Pitch from "../../Pitch";
import { getSmallPitchSpec } from "@/lib/gameFormats";
import { type Token } from "@/lib/tactics/types";
import { Box, CreditCard, Download, Laptop, Maximize2, Share2, Shield, Smartphone, User, X } from "lucide-react";

export interface Squad3DExportModalProps {
  activeFormat: string;
  activeMatch: any;
  activeSport: string;
  autoTransparentCache: Record<string, string>;
  cardTheme: "gold" | "silver" | "black_special" | "emerald";
  clubLogo: string;
  currentTokens: Token[];
  displayClubTitle: any;
  handleDownloadSquad3DImage: () => Promise<void>;
  handleOpenShareSquad3D: () => Promise<void>;
  isModernSleek: boolean;
  setCardTheme: React.Dispatch<React.SetStateAction<"gold" | "silver" | "black_special" | "emerald">>;
  setShowSquad3DModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSquad3DOrientation: React.Dispatch<React.SetStateAction<"landscape" | "portrait">>;
  setSquad3DPitchScale: React.Dispatch<React.SetStateAction<number>>;
  setSquad3DPlayerScale: React.Dispatch<React.SetStateAction<number>>;
  setSquad3DPlayerStyle: React.Dispatch<React.SetStateAction<"card" | "head">>;
  showClubLogoOnPitch: boolean;
  showSquad3DModal: boolean;
  squad3DOrientation: "landscape" | "portrait";
  squad3DPitchScale: number;
  squad3DPlayerScale: number;
  squad3DPlayerStyle: "card" | "head";
  squad3DRef: React.RefObject<HTMLDivElement | null>;
}

export default function Squad3DExportModal({
  activeFormat,
  activeMatch,
  activeSport,
  autoTransparentCache,
  cardTheme,
  clubLogo,
  currentTokens,
  displayClubTitle,
  handleDownloadSquad3DImage,
  handleOpenShareSquad3D,
  isModernSleek,
  setCardTheme,
  setShowSquad3DModal,
  setSquad3DOrientation,
  setSquad3DPitchScale,
  setSquad3DPlayerScale,
  setSquad3DPlayerStyle,
  showClubLogoOnPitch,
  showSquad3DModal,
  squad3DOrientation,
  squad3DPitchScale,
  squad3DPlayerScale,
  squad3DPlayerStyle,
  squad3DRef,
}: Squad3DExportModalProps) {
  return (
    <>
        {/* MODAL : VUE EXPORT 3D (COMPOSITION & TÊTES 3D) */}
        {/* ========================================================= */}
        {showSquad3DModal && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in backdrop-blur-md overflow-y-auto">
            <div className={`w-full max-w-6xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto space-y-4 max-h-[95vh] overflow-y-auto border overflow-hidden ${isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0f17] border-[#1e293b] text-white"
              }`}>

              {/* Header */}
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-2 relative z-10 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs shrink-0 ${isModernSleek ? "bg-slate-100 border-slate-200 text-slate-800" : "bg-[#131b29] border-[#1f293d] text-[#00E599]"
                    }`}>
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base font-black uppercase tracking-wider flex items-center gap-2 ${isModernSleek ? "text-slate-900" : "text-white"
                      }`}>
                      <span>VUE EXPORT 3D</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isModernSleek
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-[#131b29] text-emerald-400 border-emerald-500/30"
                        }`}>
                        {squad3DPlayerStyle === "head" ? "MODE TÊTE 3D" : "MODE CARTE 3D"}
                      </span>
                    </h3>
                    <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                      Générez et téléchargez votre composition en perspective 3D haute définition.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenShareSquad3D}
                    className={`h-9 px-3.5 border font-bold text-xs rounded-xl inline-flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${isModernSleek
                      ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                      : "bg-[#131b29] hover:bg-[#1f293d] border-[#1f293d] text-slate-200"
                      }`}
                    title="Partager par WhatsApp ou E-mail"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Partager</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSquad3DImage}
                    className="h-9 px-4 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-black text-xs uppercase rounded-xl inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer border border-[#00E599] whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Télécharger PNG HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSquad3DModal(false)}
                    className={`h-9 px-3 border rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap ${isModernSleek
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                      : "bg-[#131b29] hover:bg-[#1a2333] border-[#1f293d] text-slate-300 hover:text-white"
                      }`}
                    title="Fermer"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    <span>Fermer</span>
                  </button>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className={`relative z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border ${isModernSleek ? "bg-slate-50 border-slate-200 text-slate-900 shadow-xs" : "bg-[#0d131f] border-[#1f293d] text-white"
                }`}>

                {/* Left Controls: Representation & Themes */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* 1. Player Representation Selector (Carte vs Tête) */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold uppercase ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                      Vue :
                    </span>
                    <div className={`flex items-center p-0.5 rounded-xl border ${isModernSleek ? "bg-white border-slate-200 shadow-2xs" : "bg-[#131b29] border-[#1f293d]"
                      }`}>
                      <button
                        type="button"
                        onClick={() => setSquad3DPlayerStyle("head")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${squad3DPlayerStyle === "head"
                          ? "bg-[#00E599] text-slate-950 shadow-sm"
                          : isModernSleek ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Têtes 3D</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSquad3DPlayerStyle("card")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${squad3DPlayerStyle === "card"
                          ? "bg-[#00E599] text-slate-950 shadow-sm"
                          : isModernSleek ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Cartes 3D</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Card Theme Selector (only visible in card mode) */}
                  {squad3DPlayerStyle === "card" && (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold uppercase ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                        Thème :
                      </span>
                      <div className={`flex items-center gap-1 p-0.5 rounded-xl border ${isModernSleek ? "bg-white border-slate-200 shadow-2xs" : "bg-[#131b29] border-[#1f293d]"
                        }`}>
                        {[
                          { id: "gold", label: "Or", dot: "bg-amber-400" },
                          { id: "black_special", label: "Onyx", dot: "bg-zinc-900 border border-amber-400/60" },
                          { id: "silver", label: "Argent", dot: "bg-slate-300" },
                          { id: "emerald", label: "Émeraude", dot: "bg-emerald-500" },
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setCardTheme(t.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${cardTheme === t.id
                              ? isModernSleek ? "bg-slate-100 text-slate-900 shadow-xs border border-slate-300" : "bg-[#1f293d] text-white shadow-xs border border-[#2d3d5a]"
                              : isModernSleek ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
                              }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Orientation Format Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold uppercase ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                      Format :
                    </span>
                    <div className={`flex items-center p-0.5 rounded-xl border ${isModernSleek ? "bg-white border-slate-200 shadow-2xs" : "bg-[#131b29] border-[#1f293d]"
                      }`}>
                      <button
                        type="button"
                        onClick={() => setSquad3DOrientation("landscape")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${squad3DOrientation === "landscape"
                          ? "bg-[#00E599] text-slate-950 shadow-sm"
                          : isModernSleek ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        <span>16:9</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSquad3DOrientation("portrait")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${squad3DOrientation === "portrait"
                          ? "bg-[#00E599] text-slate-950 shadow-sm"
                          : isModernSleek ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>9:16</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle Controls: Pitch Scale & Player Scale Sliders */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* 4. Agrandir Terrain */}
                  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${isModernSleek ? "bg-white border-slate-200 shadow-2xs" : "bg-[#131b29] border-[#1f293d]"
                    }`}>
                    <span className={`text-[11px] font-bold uppercase flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"
                      }`}>
                      <Maximize2 className="w-3.5 h-3.5 text-[#00E599]" />
                      <span>Terrain :</span>
                    </span>
                    <input
                      type="range"
                      min="70"
                      max="150"
                      step="5"
                      value={squad3DPitchScale}
                      onChange={(e) => setSquad3DPitchScale(Number(e.target.value))}
                      className="w-16 sm:w-20 accent-[#00E599] cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-emerald-400 w-9 text-right">{squad3DPitchScale}%</span>
                    {squad3DPitchScale !== 100 && (
                      <button
                        onClick={() => setSquad3DPitchScale(100)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${isModernSleek ? "bg-slate-200 hover:bg-slate-300 text-slate-800" : "bg-[#1f293d] hover:bg-[#2c3b55] text-slate-300"
                          }`}
                        title="Réinitialiser"
                      >
                        100%
                      </button>
                    )}
                  </div>

                  {/* 5. Agrandir Joueurs */}
                  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${isModernSleek ? "bg-white border-slate-200 shadow-2xs" : "bg-[#131b29] border-[#1f293d]"
                    }`}>
                    <span className={`text-[11px] font-bold uppercase flex items-center gap-1 ${isModernSleek ? "text-slate-600" : "text-slate-400"
                      }`}>
                      <User className="w-3.5 h-3.5 text-[#00E599]" />
                      <span>Joueurs :</span>
                    </span>
                    <input
                      type="range"
                      min="60"
                      max="160"
                      step="5"
                      value={squad3DPlayerScale}
                      onChange={(e) => setSquad3DPlayerScale(Number(e.target.value))}
                      className="w-16 sm:w-20 accent-[#00E599] cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-emerald-400 w-9 text-right">{squad3DPlayerScale}%</span>
                    {squad3DPlayerScale !== 100 && (
                      <button
                        onClick={() => setSquad3DPlayerScale(100)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${isModernSleek ? "bg-slate-200 hover:bg-slate-300 text-slate-800" : "bg-[#1f293d] hover:bg-[#2c3b55] text-slate-300"
                          }`}
                        title="Réinitialiser"
                      >
                        100%
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Controls: Share & Download Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenShareSquad3D}
                    className={`h-9 px-3.5 border font-bold text-xs rounded-xl inline-flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${isModernSleek
                      ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                      : "bg-[#131b29] hover:bg-[#1f293d] border-[#1f293d] text-slate-200"
                      }`}
                    title="Partager par WhatsApp ou E-mail"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Partager</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSquad3DImage}
                    className="h-9 px-4 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-black text-xs uppercase rounded-xl inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer border border-[#00E599] whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Télécharger PNG HD</span>
                  </button>
                </div>

              </div>

              {/* THE EXPORTABLE 3D STAGE CONTAINER */}
              <div
                ref={squad3DRef}
                className={`bg-[#0a0f18] text-white p-4 sm:p-6 rounded-2xl border border-[#1f293d] relative select-none flex flex-col justify-between shadow-2xl mx-auto transition-all duration-300 ${squad3DOrientation === "portrait"
                  ? "max-w-[540px] min-h-[820px] w-full"
                  : "max-w-[960px] w-full min-h-[600px]"
                  }`}
                style={{
                  backgroundImage: "radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.08) 0%, rgba(13, 19, 31, 0.95) 75%)"
                }}
              >
                {/* Studio Background watermark rings */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

                {/* Stage Top Header */}
                <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#00E599]" />
                      <span>{displayClubTitle}</span>
                    </h2>
                  </div>
                </div>

                {/* 3D Pitch Container */}
                <div className={`relative z-10 my-3 w-full flex items-center justify-center transition-all ${squad3DOrientation === "portrait"
                  ? "h-[660px] sm:h-[690px]"
                  : (squad3DPitchScale > 120 ? "h-[600px] sm:h-[640px]" : squad3DPitchScale > 100 ? "h-[540px] sm:h-[580px]" : "h-[500px]")
                  }`}>

                  {/* Perspective wrapper */}
                  <div
                    className={`relative ${squad3DOrientation === "portrait" ? "w-[96%] h-[100%]" : "w-[92%] h-[100%]"}`}
                    style={{
                      perspective: squad3DOrientation === "portrait" ? "1200px" : "1100px",
                      perspectiveOrigin: squad3DOrientation === "portrait" ? "50% 35%" : "50% 20%",
                    }}
                  >
                    {/* Rotated Pitch Surface */}
                    <div
                      className="w-full h-full relative rounded-2xl border-4 border-white/40 shadow-[0_30px_60px_rgba(0,0,0,0.95)] overflow-hidden bg-emerald-950 transition-transform duration-200"
                      style={{
                        transform: squad3DOrientation === "portrait"
                          ? `rotateX(30deg) rotateZ(0deg) scale(${(0.96 * squad3DPitchScale) / 100})`
                          : `rotateX(42deg) rotateZ(0deg) scale(${(0.92 * squad3DPitchScale) / 100})`,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {/* Terrain du sport de l'utilisateur : rendu 3D détaillé pour le football, tracés officiels du sport sinon */}
                      {activeSport === "basketball" || activeSport === "rugby" || activeSport === "handball" || getSmallPitchSpec(activeSport, activeFormat) ? (
                        <Pitch sport={activeSport} format={activeFormat} isPortrait={squad3DOrientation === "portrait"} centerLogo={showClubLogoOnPitch ? clubLogo : undefined} />
                      ) : (
                      <>
                      {/* Mower Stripes parallel to goal lines */}
                      {squad3DOrientation === "portrait" ? (
                        <div className="absolute inset-0 flex flex-col h-full w-full opacity-20 pointer-events-none">
                          {Array.from({ length: 12 }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 w-full ${idx % 2 === 0 ? "bg-emerald-900" : "bg-transparent"}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-row h-full w-full opacity-20 pointer-events-none">
                          {Array.from({ length: 12 }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 h-full ${idx % 2 === 0 ? "bg-emerald-900" : "bg-transparent"}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* SVG Pitch Markings with 3D Goals & Corner Flags */}
                      {squad3DOrientation === "portrait" ? (
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 73 110" preserveAspectRatio="none">
                          <defs>
                            <pattern id="squad3DNetPortrait" width="0.8" height="0.8" patternUnits="userSpaceOnUse">
                              <path d="M 0 0 L 0.8 0.8 M 0.8 0 L 0 0.8" stroke="rgba(255,255,255,0.45)" strokeWidth="0.08" />
                            </pattern>
                          </defs>

                          {/* Outer Pitch Boundary Line */}
                          <rect x="2.5" y="2.5" width="68" height="105" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.9" />

                          {/* Midfield line */}
                          <line x1="2.5" y1="55" x2="70.5" y2="55" stroke="white" strokeWidth="0.35" strokeOpacity="0.9" />

                          {/* Center Circle & Spot */}
                          <circle cx="36.5" cy="55" r="9.15" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.9" />
                          <circle cx="36.5" cy="55" r="0.5" fill="white" />

                          {/* The Box Official Logo Emblem on 3D Turf */}
                          <svg x="27.35" y="45.85" width="18.3" height="18.3" viewBox="0 0 100 100" className="pointer-events-none">
                            <g stroke="white" strokeOpacity="0.4" fill="none">
                              <circle cx="50" cy="50" r="44" strokeWidth="4" />
                              <path d="M 19 19 L 81 81" strokeWidth="4" strokeLinecap="square" />
                              <path d="M 81 19 L 19 81" strokeWidth="4" strokeLinecap="square" />
                              <path d="M 32 21 L 50 39 L 68 21" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                              <path d="M 32 79 L 50 61 L 68 79" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                              <path d="M 21 32 L 39 50 L 21 68" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                              <path d="M 79 32 L 61 50 L 79 68" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                            </g>
                          </svg>

                          {/* --- BUT HAUT (TOP GOAL 3D) --- */}
                          <polygon points="32.84,2.5 33.4,0.5 39.6,0.5 40.16,2.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.25" />
                          <polygon points="32.84,2.5 33.4,0.5 39.6,0.5 40.16,2.5" fill="url(#squad3DNetPortrait)" opacity="0.8" />
                          <line x1="33.4" y1="0.5" x2="32.84" y2="2.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="39.6" y1="0.5" x2="40.16" y2="2.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="33.4" y1="0.5" x2="39.6" y2="0.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="32.84" y1="2.5" x2="40.16" y2="2.5" stroke="white" strokeWidth="0.75" strokeLinecap="round" />
                          <circle cx="32.84" cy="2.5" r="0.55" fill="white" stroke="#1e293b" strokeWidth="0.1" />
                          <circle cx="40.16" cy="2.5" r="0.55" fill="white" stroke="#1e293b" strokeWidth="0.1" />

                          {/* --- BUT BAS (BOTTOM GOAL 3D) --- */}
                          <polygon points="32.84,107.5 33.4,109.5 39.6,109.5 40.16,107.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.25" />
                          <polygon points="32.84,107.5 33.4,109.5 39.6,109.5 40.16,107.5" fill="url(#squad3DNetPortrait)" opacity="0.8" />
                          <line x1="33.4" y1="109.5" x2="32.84" y2="107.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="39.6" y1="109.5" x2="40.16" y2="107.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="33.4" y1="109.5" x2="39.6" y2="109.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="32.84" y1="107.5" x2="40.16" y2="107.5" stroke="white" strokeWidth="0.75" strokeLinecap="round" />
                          <circle cx="32.84" cy="107.5" r="0.55" fill="white" stroke="#1e293b" strokeWidth="0.1" />
                          <circle cx="40.16" cy="107.5" r="0.55" fill="white" stroke="#1e293b" strokeWidth="0.1" />

                          {/* Top Penalty Box & Arc */}
                          <rect x="16.34" y="2.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                          <rect x="27.34" y="2.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                          <circle cx="36.5" cy="13.5" r="0.45" fill="white" />
                          <path d="M 29.19 19 A 9.15 9.15 0 0 0 43.81 19" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />

                          {/* Bottom Penalty Box & Arc */}
                          <rect x="16.34" y="91" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                          <rect x="27.34" y="102" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                          <circle cx="36.5" cy="96.5" r="0.45" fill="white" />
                          <path d="M 29.19 91 A 9.15 9.15 0 0 1 43.81 91" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />

                          {/* --- POTEAUX DE CORNER (4 CORNER FLAGS) --- */}
                          {/* Corner Top-Left */}
                          <path d="M 2.5 4.5 A 2 2 0 0 0 4.5 2.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
                          <ellipse cx="2.5" cy="2.5" rx="0.5" ry="0.25" fill="rgba(0,0,0,0.5)" />
                          <circle cx="2.5" cy="2.5" r="0.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.08" />
                          <line x1="2.5" y1="2.5" x2="2.5" y2="0.6" stroke="#fef08a" strokeWidth="0.3" strokeLinecap="round" />
                          <line x1="2.5" y1="2.5" x2="2.5" y2="0.6" stroke="#f59e0b" strokeWidth="0.12" strokeDasharray="0.4,0.4" strokeLinecap="round" />
                          <polygon points="2.5,0.6 4.3,1.2 2.5,1.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.08" />

                          {/* Corner Top-Right */}
                          <path d="M 68.5 2.5 A 2 2 0 0 0 70.5 4.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
                          <ellipse cx="70.5" cy="2.5" rx="0.5" ry="0.25" fill="rgba(0,0,0,0.5)" />
                          <circle cx="70.5" cy="2.5" r="0.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.08" />
                          <line x1="70.5" y1="2.5" x2="70.5" y2="0.6" stroke="#fef08a" strokeWidth="0.3" strokeLinecap="round" />
                          <line x1="70.5" y1="2.5" x2="70.5" y2="0.6" stroke="#f59e0b" strokeWidth="0.12" strokeDasharray="0.4,0.4" strokeLinecap="round" />
                          <polygon points="70.5,0.6 68.7,1.2 70.5,1.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.08" />

                          {/* Corner Bottom-Left */}
                          <path d="M 2.5 105.5 A 2 2 0 0 1 4.5 107.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
                          <ellipse cx="2.5" cy="107.5" rx="0.5" ry="0.25" fill="rgba(0,0,0,0.5)" />
                          <circle cx="2.5" cy="107.5" r="0.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.08" />
                          <line x1="2.5" y1="107.5" x2="2.5" y2="105.6" stroke="#fef08a" strokeWidth="0.3" strokeLinecap="round" />
                          <line x1="2.5" y1="107.5" x2="2.5" y2="105.6" stroke="#f59e0b" strokeWidth="0.12" strokeDasharray="0.4,0.4" strokeLinecap="round" />
                          <polygon points="2.5,105.6 4.3,106.2 2.5,106.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.08" />

                          {/* Corner Bottom-Right */}
                          <path d="M 68.5 107.5 A 2 2 0 0 1 70.5 105.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
                          <ellipse cx="70.5" cy="107.5" rx="0.5" ry="0.25" fill="rgba(0,0,0,0.5)" />
                          <circle cx="70.5" cy="107.5" r="0.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.08" />
                          <line x1="70.5" y1="107.5" x2="70.5" y2="105.6" stroke="#fef08a" strokeWidth="0.3" strokeLinecap="round" />
                          <line x1="70.5" y1="107.5" x2="70.5" y2="105.6" stroke="#f59e0b" strokeWidth="0.12" strokeDasharray="0.4,0.4" strokeLinecap="round" />
                          <polygon points="70.5,105.6 68.7,106.2 70.5,106.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.08" />
                        </svg>
                      ) : (
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 73" preserveAspectRatio="none">
                          <defs>
                            <pattern id="squad3DNetLandscape" width="0.8" height="0.8" patternUnits="userSpaceOnUse">
                              <path d="M 0 0 L 0.8 0.8 M 0.8 0 L 0 0.8" stroke="rgba(255,255,255,0.45)" strokeWidth="0.08" />
                            </pattern>
                          </defs>

                          {/* Outer Pitch Boundary Line */}
                          <rect x="2.5" y="2.5" width="105" height="68" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.9" />

                          {/* Midfield line */}
                          <line x1="55" y1="2.5" x2="55" y2="70.5" stroke="white" strokeWidth="0.35" strokeOpacity="0.9" />

                          {/* Center Circle & Spot */}
                          <circle cx="55" cy="36.5" r="9.15" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.9" />
                          <circle cx="55" cy="36.5" r="0.5" fill="white" />

                          {/* The Box Official Logo Emblem on 3D Turf */}
                          <svg x="45.85" y="27.35" width="18.3" height="18.3" viewBox="0 0 100 100" className="pointer-events-none">
                            <g stroke="white" strokeOpacity="0.4" fill="none">
                              <circle cx="50" cy="50" r="44" strokeWidth="4" />
                              <path d="M 19 19 L 81 81" strokeWidth="4" strokeLinecap="square" />
                              <path d="M 81 19 L 19 81" strokeWidth="4" strokeLinecap="square" />
                              <path d="M 32 21 L 50 39 L 68 21" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                              <path d="M 32 79 L 50 61 L 68 79" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
                              <path d="M 21 32 L 39 50 L 21 68" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                              <path d="M 79 32 L 61 50 L 79 68" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                            </g>
                          </svg>

                          {/* --- BUT GAUCHE (LEFT GOAL 3D) --- */}
                          <polygon points="2.5,32.84 0.5,33.4 0.5,39.6 2.5,40.16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.25" />
                          <polygon points="2.5,32.84 0.5,33.4 0.5,39.6 2.5,40.16" fill="url(#squad3DNetLandscape)" opacity="0.8" />
                          <line x1="0.5" y1="33.4" x2="2.5" y2="32.84" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="0.5" y1="39.6" x2="2.5" y2="40.16" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="0.5" y1="33.4" x2="0.5" y2="39.6" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="2.5" y1="32.84" x2="2.5" y2="40.16" stroke="white" strokeWidth="0.75" strokeLinecap="round" />
                          <circle cx="2.5" cy="32.84" r="0.55" fill="white" stroke="#1e293b" strokeWidth="0.1" />
                          <circle cx="2.5" cy="40.16" r="0.55" fill="white" stroke="#1e293b" strokeWidth="0.1" />

                          {/* --- BUT DROIT (RIGHT GOAL 3D) --- */}
                          <polygon points="107.5,32.84 109.5,33.4 109.5,39.6 107.5,40.16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.7)" strokeWidth="0.25" />
                          <polygon points="107.5,32.84 109.5,33.4 109.5,39.6 107.5,40.16" fill="url(#squad3DNetLandscape)" opacity="0.8" />
                          <line x1="109.5" y1="33.4" x2="107.5" y2="32.84" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="109.5" y1="39.6" x2="107.5" y2="40.16" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="109.5" y1="33.4" x2="109.5" y2="39.6" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
                          <line x1="107.5" y1="32.84" x2="107.5" y2="40.16" stroke="white" strokeWidth="0.75" strokeLinecap="round" />
                          <circle cx="107.5" cy="32.84" r="0.55" fill="white" stroke="#1e293b" strokeWidth="0.1" />
                          <circle cx="107.5" cy="40.16" r="0.55" fill="white" stroke="#1e293b" strokeWidth="0.1" />

                          {/* Left Penalty Box & Arc */}
                          <rect x="2.5" y="16.34" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                          <rect x="2.5" y="27.34" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                          <circle cx="13.5" cy="36.5" r="0.45" fill="white" />
                          <path d="M 19 29.19 A 9.15 9.15 0 0 1 19 43.81" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />

                          {/* Right Penalty Box & Arc */}
                          <rect x="91" y="16.34" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                          <rect x="102" y="27.34" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />
                          <circle cx="96.5" cy="36.5" r="0.45" fill="white" />
                          <path d="M 91 29.19 A 9.15 9.15 0 0 0 91 43.81" fill="none" stroke="white" strokeWidth="0.35" strokeOpacity="0.85" />

                          {/* --- POTEAUX DE CORNER (4 CORNER FLAGS) --- */}
                          {/* Corner Top-Left */}
                          <path d="M 2.5 4.5 A 2 2 0 0 0 4.5 2.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
                          <ellipse cx="2.5" cy="2.5" rx="0.5" ry="0.25" fill="rgba(0,0,0,0.5)" />
                          <circle cx="2.5" cy="2.5" r="0.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.08" />
                          <line x1="2.5" y1="2.5" x2="2.5" y2="0.6" stroke="#fef08a" strokeWidth="0.3" strokeLinecap="round" />
                          <line x1="2.5" y1="2.5" x2="2.5" y2="0.6" stroke="#f59e0b" strokeWidth="0.12" strokeDasharray="0.4,0.4" strokeLinecap="round" />
                          <polygon points="2.5,0.6 4.3,1.2 2.5,1.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.08" />

                          {/* Corner Top-Right */}
                          <path d="M 105.5 2.5 A 2 2 0 0 0 107.5 4.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
                          <ellipse cx="107.5" cy="2.5" rx="0.5" ry="0.25" fill="rgba(0,0,0,0.5)" />
                          <circle cx="107.5" cy="2.5" r="0.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.08" />
                          <line x1="107.5" y1="2.5" x2="107.5" y2="0.6" stroke="#fef08a" strokeWidth="0.3" strokeLinecap="round" />
                          <line x1="107.5" y1="2.5" x2="107.5" y2="0.6" stroke="#f59e0b" strokeWidth="0.12" strokeDasharray="0.4,0.4" strokeLinecap="round" />
                          <polygon points="107.5,0.6 105.7,1.2 107.5,1.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.08" />

                          {/* Corner Bottom-Left */}
                          <path d="M 2.5 68.5 A 2 2 0 0 1 4.5 70.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
                          <ellipse cx="2.5" cy="70.5" rx="0.5" ry="0.25" fill="rgba(0,0,0,0.5)" />
                          <circle cx="2.5" cy="70.5" r="0.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.08" />
                          <line x1="2.5" y1="70.5" x2="2.5" y2="68.6" stroke="#fef08a" strokeWidth="0.3" strokeLinecap="round" />
                          <line x1="2.5" y1="70.5" x2="2.5" y2="68.6" stroke="#f59e0b" strokeWidth="0.12" strokeDasharray="0.4,0.4" strokeLinecap="round" />
                          <polygon points="2.5,68.6 4.3,69.2 2.5,69.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.08" />

                          {/* Corner Bottom-Right */}
                          <path d="M 105.5 70.5 A 2 2 0 0 1 107.5 68.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
                          <ellipse cx="107.5" cy="70.5" rx="0.5" ry="0.25" fill="rgba(0,0,0,0.5)" />
                          <circle cx="107.5" cy="70.5" r="0.3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.08" />
                          <line x1="107.5" y1="70.5" x2="107.5" y2="68.6" stroke="#fef08a" strokeWidth="0.3" strokeLinecap="round" />
                          <line x1="107.5" y1="70.5" x2="107.5" y2="68.6" stroke="#f59e0b" strokeWidth="0.12" strokeDasharray="0.4,0.4" strokeLinecap="round" />
                          <polygon points="107.5,68.6 105.7,69.2 107.5,69.8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.08" />
                        </svg>
                      )}
                      </>
                      )}
                    </div>

                    {/* Player Overlay (Cards or 3D Heads) */}
                    <div
                      className="absolute inset-0 z-20 pointer-events-none transition-transform duration-200"
                      style={{
                        transform: `scale(${squad3DPitchScale / 100})`,
                        transformOrigin: "center center",
                      }}
                    >
                      {currentTokens
                        .filter(t => t.type === "player_a")
                        .map(p => {
                          // Position calculation based on orientation - safely mapped within visible 3D turf
                          const posX = squad3DOrientation === "portrait" ? (12 + (p.y * 0.76)) : p.x;
                          const posY = squad3DOrientation === "portrait" ? (14 + ((100 - p.x) * 0.72)) : p.y;
                          const role = p.role || "ST";
                          const isGK = activeSport !== "basketball" && activeSport !== "rugby" && (p.role === "G" || p.role === "GK" || p.role === "GB" || p.role === "Gardien" || p.number === 1);
                          const defaultHeadSrc = activeSport === "basketball"
                            ? "/images/avatars/basket_player_green.png"
                            : activeSport === "handball"
                              ? isGK
                                ? "/images/avatars/handball_goalkeeper_yellow.png"
                                : "/images/avatars/handball_player_green.png"
                              : activeSport === "rugby"
                                ? "/images/avatars/rugby_player_green.png"
                                : isGK
                                  ? "/images/avatars/goalkeeper_yellow.png"
                                  : "/images/avatars/player_green.png";
                          const photoSrc = p.photo ? (autoTransparentCache[p.photo] || p.photo) : defaultHeadSrc;

                          return (
                            <div
                              key={p.id}
                              className="absolute transition-all duration-300"
                              style={{
                                left: `${posX}%`,
                                top: `${posY}%`,
                                transform: `translate(-50%, -50%) scale(${squad3DPlayerScale / 100})`,
                                transformOrigin: "center center",
                              }}
                            >
                              {squad3DPlayerStyle === "head" ? (
                                /* ========================================================= */
                                /* VUE 1 : TÊTE DU JOUEUR 3D (AVATAR PUR DÉTOURÉ SANS FOND) */
                                /* ========================================================= */
                                <div className="flex flex-col items-center select-none pointer-events-none">
                                  {/* 3D Avatar Head */}
                                  <div className={`${squad3DOrientation === "portrait" ? "w-12 h-12 sm:w-14 sm:h-14" : "w-14 h-14 sm:w-16 sm:h-16"
                                    } relative flex items-center justify-center`}>
                                    <img
                                      src={photoSrc}
                                      alt={p.name}
                                      className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.85)]"
                                    />
                                  </div>

                                  {/* Turf Drop Shadow */}
                                  <div className="w-9 h-2 bg-black/50 rounded-full blur-[2px] -mt-1 mb-1" />

                                  {/* Tactical Pill Badge */}
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-xl border backdrop-blur-md bg-[#0b101b]/95 border-emerald-500/40 text-slate-100">
                                    <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded-full leading-tight bg-[#00E599] text-slate-950">
                                      #{p.number || 1}
                                    </span>
                                    <span className="text-[8px] font-bold uppercase tracking-tight truncate max-w-[65px]">
                                      {p.name || role}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                /* ========================================================= */
                                /* VUE 2 : CARTE DU JOUEUR (STYLE SQUAD CARD)               */
                                /* ========================================================= */
                                <div
                                  className={`${squad3DOrientation === "portrait" ? "w-13 sm:w-15 p-1" : "w-15 sm:w-18 p-1.5"
                                    } rounded-xl shadow-2xl text-center border-2 flex flex-col items-center justify-between transition-all ${cardTheme === "gold"
                                      ? "bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-amber-200 text-amber-950 shadow-amber-950/60"
                                      : cardTheme === "silver"
                                        ? "bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 border-slate-100 text-slate-950 shadow-slate-950/60"
                                        : cardTheme === "black_special"
                                          ? "bg-gradient-to-b from-zinc-800 via-zinc-950 to-black border-amber-400 text-amber-300 shadow-black/90"
                                          : "bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-950 border-emerald-300 text-white shadow-emerald-950/60"
                                    }`}
                                >
                                  {/* Top bar: Number & Role */}
                                  <div className="w-full flex items-center justify-between px-0.5 text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-tight leading-none mb-0.5">
                                    <span className="bg-black/50 text-white px-1 py-0.5 rounded font-black">#{p.number || 1}</span>
                                    <span className="bg-white/20 text-white px-1 py-0.5 rounded font-extrabold">{role}</span>
                                  </div>

                                  {/* Photo or Avatar */}
                                  <div className="relative my-0.5">
                                    <img
                                      src={photoSrc}
                                      alt={p.name}
                                      className={`${squad3DOrientation === "portrait" ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-10 sm:h-10"
                                        } rounded-full object-cover border-2 border-white/80 shadow-md bg-black/40`}
                                    />
                                  </div>

                                  {/* Player Name Banner */}
                                  <div className="w-full bg-black/85 mt-0.5 py-0.5 px-0.5 rounded border border-white/20 text-center">
                                    <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-tight text-white truncate">
                                      {p.name || `JOUEUR #${p.number}`}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                  </div>

                </div>

                {/* Stage Footer */}
                <div className="relative z-10 flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-500 font-semibold">
                  <span>Composition 3D • {displayClubTitle} {activeMatch?.awayTeam ? `vs ${activeMatch.awayTeam}` : ""}</span>
                  <span>The Box 3D Tactical Studio</span>
                </div>

              </div>

              {/* Modal Footer: Export, Share & Close Buttons */}
              <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 relative z-10 ${isModernSleek ? "border-slate-200" : "border-[#1f293d]"}`}>
                <span className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                  Export haute définition prêt pour WhatsApp, E-mail et réseaux sociaux.
                </span>
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleOpenShareSquad3D}
                    className={`h-10 px-4 border font-bold text-xs rounded-xl inline-flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${isModernSleek
                      ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                      : "bg-[#131b29] hover:bg-[#1f293d] border-[#1f293d] text-slate-200"
                      }`}
                  >
                    <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Partager</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSquad3DImage}
                    className="h-10 px-4 bg-[#00E599] hover:bg-[#00c985] text-slate-950 font-black text-xs uppercase rounded-xl inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer border border-[#00E599] whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Télécharger PNG HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSquad3DModal(false)}
                    className={`h-10 px-5 border rounded-xl font-bold text-xs inline-flex items-center justify-center transition cursor-pointer whitespace-nowrap ${isModernSleek
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                      : "bg-[#131b29] hover:bg-[#1a2333] border-[#1f293d] text-slate-300 hover:text-white"
                      }`}
                  >
                    Fermer
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
    </>
  );
}
