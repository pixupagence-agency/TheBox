"use client";

import React from "react";

interface PitchProps {
  sport: string;
  isPortrait?: boolean;
}

export default function Pitch({ sport, isPortrait }: PitchProps) {
  // Render high-fidelity tactical field based on sport type in portrait or landscape
  if (isPortrait) {
    switch (sport.toLowerCase()) {
      case "football":
      case "soccer":
        return (
          <div className="absolute inset-0 w-full h-full bg-emerald-950 overflow-hidden select-none" id="pitch-football">
            {/* Grass stripes - horizontal bands in portrait (parallel to goal lines) */}
            <div className="absolute inset-0 flex flex-col h-full w-full opacity-15 pointer-events-none">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 w-full ${idx % 2 === 0 ? "bg-emerald-900" : "bg-transparent"}`}
                />
              ))}
            </div>

            {/* SVG Field Lines - Exact FIFA proportions with uniform 2.5m run-off margin (73m x 110m viewBox, 68m x 105m playfield) */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 73 110" preserveAspectRatio="none">
              {/* Outer Field Boundary Line */}
              <rect x="2.5" y="2.5" width="68" height="105" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
              
              {/* Midfield line */}
              <line x1="2.5" y1="55" x2="70.5" y2="55" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
              
              {/* Center circle (official 9.15m radius, perfectly circular) */}
              <circle cx="36.5" cy="55" r="9.15" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
              <circle cx="36.5" cy="55" r="0.4" fill="white" />

              {/* The Box Official Logo Emblem on Turf (100% Identical to Navbar) */}
              <svg x="27.35" y="45.85" width="18.3" height="18.3" viewBox="0 0 100 100" className="pointer-events-none">
                <g stroke="white" strokeOpacity="0.4" fill="none">
                  <circle cx="50" cy="50" r="44" strokeWidth="4.5" />
                  <path d="M 19 19 L 81 81" strokeWidth="4.5" strokeLinecap="square" />
                  <path d="M 81 19 L 19 81" strokeWidth="4.5" strokeLinecap="square" />
                  <path d="M 32 21 L 50 39 L 68 21" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                  <path d="M 32 79 L 50 61 L 68 79" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                  <path d="M 21 32 L 39 50 L 21 68" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                  <path d="M 79 32 L 61 50 L 79 68" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                </g>
              </svg>

              {/* Goal nets outside endlines (7.32m wide, 2.2m deep) */}
              <rect x="32.84" y="0.3" width="7.32" height="2.2" fill="rgba(255,255,255,0.06)" stroke="white" strokeWidth="0.2" />
              <rect x="32.84" y="107.5" width="7.32" height="2.2" fill="rgba(255,255,255,0.06)" stroke="white" strokeWidth="0.2" />

              {/* Top Penalty Area (40.32m x 16.5m) */}
              <rect x="16.34" y="2.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
              {/* Top 6-yard box (18.32m x 5.5m) */}
              <rect x="27.34" y="2.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
              {/* Top penalty spot (11m from goal line) */}
              <circle cx="36.5" cy="13.5" r="0.35" fill="white" />
              {/* Top penalty arc (9.15m radius centered at penalty spot) */}
              <path d="M 29.19 19 A 9.15 9.15 0 0 0 43.81 19" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />

              {/* Bottom Penalty Area (40.32m x 16.5m) */}
              <rect x="16.34" y="91" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
              {/* Bottom 6-yard box (18.32m x 5.5m) */}
              <rect x="27.34" y="102" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
              {/* Bottom penalty spot (11m from goal line) */}
              <circle cx="36.5" cy="96.5" r="0.35" fill="white" />
              {/* Bottom penalty arc (9.15m radius centered at penalty spot) */}
              <path d="M 29.19 91 A 9.15 9.15 0 0 1 43.81 91" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />

              {/* Corner arcs (1m radius) */}
              <path d="M 2.5 3.5 A 1 1 0 0 0 3.5 2.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.7" />
              <path d="M 69.5 2.5 A 1 1 0 0 0 70.5 3.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.7" />
              <path d="M 2.5 106.5 A 1 1 0 0 1 3.5 107.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.7" />
              <path d="M 69.5 107.5 A 1 1 0 0 1 70.5 106.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.7" />
            </svg>
          </div>
        );

      case "basketball":
        return (
          <div className="absolute inset-0 w-full h-full bg-amber-900/45 overflow-hidden select-none border-4 border-amber-800" id="pitch-basketball">
            {/* SVG Court Lines - Rotated FIBA dimensions: 15m x 28m */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 15 28" preserveAspectRatio="none">
              {/* Court boundary */}
              <rect x="0.2" y="0.2" width="14.6" height="27.6" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
              
              {/* Center Line */}
              <line x1="0.2" y1="14" x2="14.8" y2="14" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
              {/* Center Circle */}
              <circle cx="7.5" cy="14" r="1.8" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
              
              {/* Top 3-point Line */}
              <path d="M 1.25 0.2 L 1.25 2.99 A 6.75 6.75 0 0 0 13.75 2.99 L 13.75 0.2" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
              {/* Top Key */}
              <rect x="5.05" y="0.2" width="4.9" height="5.8" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
              {/* Top board and hoop */}
              <line x1="6.8" y1="1.2" x2="8.2" y2="1.2" stroke="#fcd34d" strokeWidth="0.15" />
              <circle cx="7.5" cy="1.575" r="0.225" fill="none" stroke="#f59e0b" strokeWidth="0.1" />

              {/* Bottom 3-point Line */}
              <path d="M 1.25 27.8 L 1.25 25.01 A 6.75 6.75 0 0 1 13.75 25.01 L 13.75 27.8" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
              {/* Bottom Key */}
              <rect x="5.05" y="22" width="4.9" height="5.8" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
              {/* Bottom board and hoop */}
              <line x1="6.8" y1="26.8" x2="8.2" y2="26.8" stroke="#fcd34d" strokeWidth="0.15" />
              <circle cx="7.5" cy="26.425" r="0.225" fill="none" stroke="#f59e0b" strokeWidth="0.1" />
            </svg>
          </div>
        );

      case "handball":
        return (
          <div className="absolute inset-0 w-full h-full bg-slate-800 overflow-hidden select-none border-4 border-slate-700" id="pitch-handball">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 20 40" preserveAspectRatio="none">
              <rect x="0.2" y="0.2" width="19.6" height="39.6" fill="none" stroke="#e2e8f0" strokeWidth="0.12" />
              <line x1="0.2" y1="20" x2="19.8" y2="20" stroke="#e2e8f0" strokeWidth="0.12" />
              <circle cx="10" cy="20" r="0.4" fill="#e2e8f0" />
              
              {/* Top 6m zone */}
              <path d="M 4 0.2 A 6 6 0 0 1 10 6 A 6 6 0 0 1 16 0.2" fill="none" stroke="#f43f5e" strokeWidth="0.15" strokeOpacity="0.9" />
              
              {/* Bottom 6m zone */}
              <path d="M 4 39.8 A 6 6 0 0 0 10 34 A 6 6 0 0 0 16 39.8" fill="none" stroke="#f43f5e" strokeWidth="0.15" strokeOpacity="0.9" />
              
              <circle cx="10" cy="7" r="0.15" fill="#e2e8f0" />
              <circle cx="10" cy="33" r="0.15" fill="#e2e8f0" />
            </svg>
          </div>
        );

      default:
        return (
          <div className="absolute inset-0 w-full h-full bg-slate-900" id="pitch-default">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 73 110" preserveAspectRatio="none">
              <rect x="2.5" y="2.5" width="68" height="105" fill="none" stroke="gray" strokeWidth="0.4" strokeDasharray="2,2" />
              <line x1="2.5" y1="55" x2="70.5" y2="55" stroke="gray" strokeWidth="0.4" />
              <circle cx="36.5" cy="55" r="9.15" fill="none" stroke="gray" strokeWidth="0.4" />
            </svg>
          </div>
        );
    }
  }

  // Render original high-fidelity landscape tactical field based on sport type using actual dimensions (meters)
  switch (sport.toLowerCase()) {
    case "football":
    case "soccer":
      return (
        <div className="absolute inset-0 w-full h-full bg-emerald-950 overflow-hidden select-none" id="pitch-football">
          {/* Grass stripes - vertical bands in landscape (parallel to goal lines) */}
          <div className="absolute inset-0 flex flex-row h-full w-full opacity-15 pointer-events-none">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-full ${idx % 2 === 0 ? "bg-emerald-900" : "bg-transparent"}`}
              />
            ))}
          </div>

          {/* SVG Field Lines with Out-Of-Bounds Perimeter Margin (110m x 73m total viewBox, 105m x 68m inner field) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 73" preserveAspectRatio="none">
            {/* Outer Field Boundary Line (Touchlines: y=2.5 & y=70.5; Goal lines: x=2.5 & x=107.5) */}
            <rect x="2.5" y="2.5" width="105" height="68" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
            
            {/* Midfield line */}
            <line x1="55" y1="2.5" x2="55" y2="70.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
            
            {/* Center circle (official 9.15m radius, perfectly circular) */}
            <circle cx="55" cy="36.5" r="9.15" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
            <circle cx="55" cy="36.5" r="0.4" fill="white" />

            {/* The Box Official Logo Emblem on Turf (100% Identical to Navbar) */}
            <svg x="45.85" y="27.35" width="18.3" height="18.3" viewBox="0 0 100 100" className="pointer-events-none">
              <g stroke="white" strokeOpacity="0.4" fill="none">
                <circle cx="50" cy="50" r="44" strokeWidth="4.5" />
                <path d="M 19 19 L 81 81" strokeWidth="4.5" strokeLinecap="square" />
                <path d="M 81 19 L 19 81" strokeWidth="4.5" strokeLinecap="square" />
                <path d="M 32 21 L 50 39 L 68 21" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M 32 79 L 50 61 L 68 79" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M 21 32 L 39 50 L 21 68" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M 79 32 L 61 50 L 79 68" strokeWidth="4.5" strokeLinecap="square" strokeLinejoin="miter" />
              </g>
            </svg>

            {/* Goal nets outside the goal line (7.32m wide, 2.2m deep) */}
            <rect x="0.3" y="32.84" width="2.2" height="7.32" fill="rgba(255,255,255,0.06)" stroke="white" strokeWidth="0.2" />
            <rect x="107.5" y="32.84" width="2.2" height="7.32" fill="rgba(255,255,255,0.06)" stroke="white" strokeWidth="0.2" />

            {/* Left Penalty Area (16.5m x 40.32m) */}
            <rect x="2.5" y="16.34" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
            {/* Left 6-yard box (5.5m x 18.32m) */}
            <rect x="2.5" y="27.34" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
            {/* Left penalty spot (11m from goal line) */}
            <circle cx="13.5" cy="36.5" r="0.35" fill="white" />
            {/* Left penalty arc (9.15m radius centered at penalty spot) */}
            <path d="M 19 29.19 A 9.15 9.15 0 0 1 19 43.81" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />

            {/* Right Penalty Area (16.5m x 40.32m) */}
            <rect x="91" y="16.34" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
            {/* Right 6-yard box (5.5m x 18.32m) */}
            <rect x="102" y="27.34" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />
            {/* Right penalty spot (11m from goal line) */}
            <circle cx="96.5" cy="36.5" r="0.35" fill="white" />
            {/* Right penalty arc (9.15m radius centered at penalty spot) */}
            <path d="M 91 29.19 A 9.15 9.15 0 0 0 91 43.81" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.85" />

            {/* Corner arcs (1m radius) */}
            <path d="M 2.5 3.5 A 1 1 0 0 0 3.5 2.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.7" />
            <path d="M 106.5 2.5 A 1 1 0 0 0 107.5 3.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.7" />
            <path d="M 2.5 69.5 A 1 1 0 0 1 3.5 70.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.7" />
            <path d="M 106.5 70.5 A 1 1 0 0 1 107.5 69.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.7" />
          </svg>
        </div>
      );

    case "basketball":
      return (
        <div className="absolute inset-0 w-full h-full bg-amber-900/45 overflow-hidden select-none border-4 border-amber-800" id="pitch-basketball" style={{ backgroundImage: "linear-gradient(45deg, #78350f 25%, transparent 25%), linear-gradient(-45deg, #78350f 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #78350f 75%), linear-gradient(-45deg, transparent 75%, #78350f 75%)", backgroundSize: "30px 30px" }}>
          {/* Wood grain layout panel effect */}
          <div className="absolute inset-0 w-full h-full bg-amber-950/20 mix-blend-overlay pointer-events-none" />
          
          {/* SVG Court Lines - FIBA standard dimensions: 28m x 15m */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 28 15" preserveAspectRatio="none">
            {/* Court boundary */}
            <rect x="0.2" y="0.2" width="27.6" height="14.6" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            
            {/* Center Line */}
            <line x1="14" y1="0.2" x2="14" y2="14.8" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            {/* Center Circle (official 1.80m radius) */}
            <circle cx="14" cy="7.5" r="1.8" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            <circle cx="14" cy="7.5" r="0.6" fill="none" stroke="#fcd34d" strokeWidth="0.08" strokeOpacity="0.5" />
            
            {/* Left 3-point Line (official FIBA 6.75m from hoop basket) */}
            <path d="M 0.2 1.25 L 2.99 1.25 A 6.75 6.75 0 0 1 2.99 13.75 L 0.2 13.75" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            {/* Left Key (official restricted area: 4.9m wide, 5.8m deep) */}
            <rect x="0.2" y="5.05" width="5.8" height="4.9" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            {/* Free throw circle at the top of the key */}
            <path d="M 6 5.7 A 1.8 1.8 0 0 1 6 9.3" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            <path d="M 6 5.7 A 1.8 1.8 0 0 0 6 9.3" fill="none" stroke="#fcd34d" strokeWidth="0.08" strokeDasharray="0.2,0.2" strokeOpacity="0.8" />
            {/* Left board and hoop */}
            <line x1="1.2" y1="6.8" x2="1.2" y2="8.2" stroke="#fcd34d" strokeWidth="0.15" />
            <circle cx="1.575" cy="7.5" r="0.225" fill="none" stroke="#f59e0b" strokeWidth="0.1" />

            {/* Right 3-point Line */}
            <path d="M 27.8 1.25 L 25.01 1.25 A 6.75 6.75 0 0 0 25.01 13.75 L 27.8 13.75" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            {/* Right Key */}
            <rect x="22" y="5.05" width="5.8" height="4.9" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            {/* Free throw circle right */}
            <path d="M 22 5.7 A 1.8 1.8 0 0 0 22 9.3" fill="none" stroke="#fcd34d" strokeWidth="0.1" strokeOpacity="0.8" />
            <path d="M 22 5.7 A 1.8 1.8 0 0 1 22 9.3" fill="none" stroke="#fcd34d" strokeWidth="0.08" strokeDasharray="0.2,0.2" strokeOpacity="0.8" />
            {/* Right board and hoop */}
            <line x1="26.8" y1="6.8" x2="26.8" y2="8.2" stroke="#fcd34d" strokeWidth="0.15" />
            <circle cx="26.425" cy="7.5" r="0.225" fill="none" stroke="#f59e0b" strokeWidth="0.1" />
          </svg>
        </div>
      );

    case "rugby":
      return (
        <div className="absolute inset-0 w-full h-full bg-emerald-900 overflow-hidden select-none" id="pitch-rugby">
          {/* Subtle field lines */}
          <div className="absolute inset-0 flex flex-row h-full w-full opacity-10 pointer-events-none">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-full ${idx % 2 === 0 ? "bg-emerald-950" : "bg-transparent"}`}
              />
            ))}
          </div>

          {/* SVG Rugby Field - Standard dimensions with try zones: 144m x 70m */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 144 70" preserveAspectRatio="none">
            {/* Goal-to-Goal touchline boundary (100m playfield, 22m try zones at each end) */}
            <rect x="22" y="0.5" width="100" height="69" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
            <rect x="0.5" y="0.5" width="143" height="69" fill="none" stroke="white" strokeWidth="0.25" strokeOpacity="0.6" />
            
            {/* Try Zones (Left/Right margins) */}
            <line x1="22" y1="0.5" x2="22" y2="69.5" stroke="white" strokeWidth="0.35" />
            <line x1="122" y1="0.5" x2="122" y2="69.5" stroke="white" strokeWidth="0.35" />
            <text x="11" y="37" fill="white" fillOpacity="0.25" fontSize="4.5" fontWeight="bold" textAnchor="middle" transform="rotate(-90 11 37)">EN-BUT / TRY ZONE</text>
            <text x="133" y="37" fill="white" fillOpacity="0.25" fontSize="4.5" fontWeight="bold" textAnchor="middle" transform="rotate(90 133 37)">EN-BUT / TRY ZONE</text>

            {/* Halfway line (50m mark) */}
            <line x1="72" y1="0.5" x2="72" y2="69.5" stroke="white" strokeWidth="0.35" />
            
            {/* 22m lines (22m from try lines) */}
            <line x1="44" y1="0.5" x2="44" y2="69.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />
            <line x1="100" y1="0.5" x2="100" y2="69.5" stroke="white" strokeWidth="0.25" strokeOpacity="0.8" />

            {/* 10m dashed lines (10m from midfield) */}
            <line x1="62" y1="0.5" x2="62" y2="69.5" stroke="white" strokeWidth="0.2" strokeDasharray="1.5,1.5" strokeOpacity="0.7" />
            <line x1="82" y1="0.5" x2="82" y2="69.5" stroke="white" strokeWidth="0.2" strokeDasharray="1.5,1.5" strokeOpacity="0.7" />

            {/* 5m / 15m dash marks along side touchlines */}
            <line x1="22" y1="5" x2="122" y2="5" stroke="white" strokeWidth="0.15" strokeDasharray="0.5,2.5" strokeOpacity="0.5" />
            <line x1="22" y1="65" x2="122" y2="65" stroke="white" strokeWidth="0.15" strokeDasharray="0.5,2.5" strokeOpacity="0.5" />

            {/* Rugby Goal posts on try lines */}
            <path d="M 22 32.2 L 20 32.2 L 20 37.8 L 22 37.8 M 20 33 L 20 37" fill="none" stroke="white" strokeWidth="0.6" />
            <path d="M 122 32.2 L 124 32.2 L 124 37.8 L 122 37.8 M 124 33 L 124 37" fill="none" stroke="white" strokeWidth="0.6" />
          </svg>
        </div>
      );

    case "handball":
      return (
        <div className="absolute inset-0 w-full h-full bg-slate-800 overflow-hidden select-none border-4 border-slate-700" id="pitch-handball">
          {/* SVG Handball Court - Standard court dimensions: 40m x 20m */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 20" preserveAspectRatio="none">
            {/* Outer boundary */}
            <rect x="0.2" y="0.2" width="39.6" height="19.6" fill="none" stroke="#e2e8f0" strokeWidth="0.12" />
            
            {/* Halfway line */}
            <line x1="20" y1="0.2" x2="20" y2="19.8" stroke="#e2e8f0" strokeWidth="0.12" />
            <circle cx="20" cy="10" r="0.4" fill="#e2e8f0" />

            {/* Left 6m zone (D-Zone) (official 6m semi-circles centered at goals) */}
            <path d="M 0.2 4 A 6 6 0 0 1 6 10 A 6 6 0 0 1 0.2 16" fill="none" stroke="#f43f5e" strokeWidth="0.15" strokeOpacity="0.9" />
            {/* Left 9m free throw line (dashed, official 9m radius centered at goal) */}
            <path d="M 0.2 1 A 9 9 0 0 1 9 10 A 9 9 0 0 1 0.2 19" fill="none" stroke="#e2e8f0" strokeWidth="0.1" strokeDasharray="0.3,0.3" strokeOpacity="0.8" />

            {/* Right 6m zone (D-Zone) */}
            <path d="M 39.8 4 A 6 6 0 0 0 34 10 A 6 6 0 0 0 39.8 16" fill="none" stroke="#f43f5e" strokeWidth="0.15" strokeOpacity="0.9" />
            {/* Right 9m free throw line */}
            <path d="M 39.8 1 A 9 9 0 0 0 31 10 A 9 9 0 0 0 39.8 19" fill="none" stroke="#e2e8f0" strokeWidth="0.1" strokeDasharray="0.3,0.3" strokeOpacity="0.8" />

            {/* Penalty spots (official 7m from goal line) */}
            <circle cx="7" cy="10" r="0.15" fill="#e2e8f0" />
            <circle cx="33" cy="10" r="0.15" fill="#e2e8f0" />
            
            {/* Goals (3m wide) */}
            <rect x="0.1" y="8.5" width="0.6" height="3" fill="none" stroke="#e2e8f0" strokeWidth="0.2" />
            <rect x="39.3" y="8.5" width="0.6" height="3" fill="none" stroke="#e2e8f0" strokeWidth="0.2" />
          </svg>
        </div>
      );

    default:
      return (
        <div className="absolute inset-0 w-full h-full bg-slate-900" id="pitch-default">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 73" preserveAspectRatio="none">
            <rect x="2.5" y="2.5" width="105" height="68" fill="none" stroke="gray" strokeWidth="0.4" strokeDasharray="2,2" />
            <line x1="55" y1="2.5" x2="55" y2="70.5" stroke="gray" strokeWidth="0.4" />
            <circle cx="55" cy="36.5" r="9.15" fill="none" stroke="gray" strokeWidth="0.4" />
          </svg>
        </div>
      );
  }
}
