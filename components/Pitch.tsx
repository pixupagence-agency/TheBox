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
          <div
            className="absolute inset-0 w-full h-full overflow-hidden select-none bg-[#ea8626]"
            id="pitch-basketball"
          >
            {/* SVG Court Lines - Exact match to user basketball wood court reference with all-white lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 15 28" preserveAspectRatio="none">
              <defs>
                <pattern id="basket-parquet-portrait" width="2.0" height="14" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="0.5" height="14" fill="#f6a445" />
                  <rect x="0.5" y="0" width="0.5" height="14" fill="#e78524" />
                  <rect x="1.0" y="0" width="0.5" height="14" fill="#f19535" />
                  <rect x="1.5" y="0" width="0.5" height="14" fill="#df7819" />

                  <line x1="0.5" y1="0" x2="0.5" y2="14" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.45" />
                  <line x1="1.0" y1="0" x2="1.0" y2="14" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.45" />
                  <line x1="1.5" y1="0" x2="1.5" y2="14" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.45" />
                  <line x1="2.0" y1="0" x2="2.0" y2="14" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.45" />

                  <line x1="0" y1="3.5" x2="0.5" y2="3.5" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                  <line x1="0" y1="10.5" x2="0.5" y2="10.5" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                  <line x1="0.5" y1="7.0" x2="1.0" y2="7.0" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                  <line x1="1.0" y1="1.8" x2="1.5" y2="1.8" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                  <line x1="1.0" y1="8.8" x2="1.5" y2="8.8" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                  <line x1="1.5" y1="5.2" x2="2.0" y2="5.2" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                  <line x1="1.5" y1="12.2" x2="2.0" y2="12.2" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                </pattern>
              </defs>

              {/* Full parquet floor background */}
              <rect x="0" y="0" width="15" height="28" fill="url(#basket-parquet-portrait)" />

              {/* Outer white boundary rectangle */}
              <rect x="0.5" y="0.6" width="14.0" height="26.8" fill="none" stroke="white" strokeWidth="0.16" />

              {/* Center Line (crisp white) */}
              <line x1="0.5" y1="14" x2="14.5" y2="14" stroke="white" strokeWidth="0.16" />

              {/* Center Circle (full crisp white circle) */}
              <circle cx="7.5" cy="14" r="1.85" fill="none" stroke="white" strokeWidth="0.16" />

              {/* Top Key (white rectangle - placed completely inside the 3-point arc) */}
              <rect x="5.4" y="0.6" width="4.2" height="4.6" fill="none" stroke="white" strokeWidth="0.16" />
              {/* Top Free Throw Line */}
              <line x1="5.4" y1="5.2" x2="9.6" y2="5.2" stroke="white" strokeWidth="0.16" />
              {/* Top Free Throw Circle (full white circle inside the 3-point arc) */}
              <circle cx="7.5" cy="5.2" r="1.5" fill="none" stroke="white" strokeWidth="0.16" />

              {/* Top Key Rebound Blocks (4 white teeth on left, 4 on right) */}
              <rect x="5.15" y="1.8" width="0.25" height="0.35" fill="white" />
              <rect x="5.15" y="2.6" width="0.25" height="0.35" fill="white" />
              <rect x="5.15" y="3.4" width="0.25" height="0.35" fill="white" />
              <rect x="5.15" y="4.2" width="0.25" height="0.35" fill="white" />
              <rect x="9.6" y="1.8" width="0.25" height="0.35" fill="white" />
              <rect x="9.6" y="2.6" width="0.25" height="0.35" fill="white" />
              <rect x="9.6" y="3.4" width="0.25" height="0.35" fill="white" />
              <rect x="9.6" y="4.2" width="0.25" height="0.35" fill="white" />

              {/* Top 3-point Line (grand rond - curves well beyond the key and free throw circle) */}
              <path d="M 1.2 0.6 L 1.2 4.42 A 6.75 6.75 0 0 0 13.8 4.42 L 13.8 0.6" fill="none" stroke="white" strokeWidth="0.16" />

              {/* Top Backboard & Hoop */}
              <line x1="6.4" y1="1.6" x2="8.6" y2="1.6" stroke="white" strokeWidth="0.35" strokeLinecap="square" />
              <line x1="7.5" y1="1.6" x2="7.5" y2="2.0" stroke="white" strokeWidth="0.16" />
              <circle cx="7.5" cy="2.45" r="0.45" fill="none" stroke="white" strokeWidth="0.18" />

              {/* Bottom Key (white rectangle - placed completely inside the 3-point arc) */}
              <rect x="5.4" y="22.8" width="4.2" height="4.6" fill="none" stroke="white" strokeWidth="0.16" />
              {/* Bottom Free Throw Line */}
              <line x1="5.4" y1="22.8" x2="9.6" y2="22.8" stroke="white" strokeWidth="0.16" />
              {/* Bottom Free Throw Circle */}
              <circle cx="7.5" cy="22.8" r="1.5" fill="none" stroke="white" strokeWidth="0.16" />

              {/* Bottom Key Rebound Blocks (4 white teeth on left, 4 on right) */}
              <rect x="5.15" y="23.45" width="0.25" height="0.35" fill="white" />
              <rect x="5.15" y="24.25" width="0.25" height="0.35" fill="white" />
              <rect x="5.15" y="25.05" width="0.25" height="0.35" fill="white" />
              <rect x="5.15" y="25.85" width="0.25" height="0.35" fill="white" />
              <rect x="9.6" y="23.45" width="0.25" height="0.35" fill="white" />
              <rect x="9.6" y="24.25" width="0.25" height="0.35" fill="white" />
              <rect x="9.6" y="25.05" width="0.25" height="0.35" fill="white" />
              <rect x="9.6" y="25.85" width="0.25" height="0.35" fill="white" />

              {/* Bottom 3-point Line (grand rond - curves well beyond the key and free throw circle) */}
              <path d="M 1.2 27.4 L 1.2 23.58 A 6.75 6.75 0 0 1 13.8 23.58 L 13.8 27.4" fill="none" stroke="white" strokeWidth="0.16" />

              {/* Bottom Backboard & Hoop */}
              <line x1="6.4" y1="26.4" x2="8.6" y2="26.4" stroke="white" strokeWidth="0.35" strokeLinecap="square" />
              <line x1="7.5" y1="26.4" x2="7.5" y2="26.0" stroke="white" strokeWidth="0.16" />
              <circle cx="7.5" cy="25.55" r="0.45" fill="none" stroke="white" strokeWidth="0.18" />
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
        <div
          className="absolute inset-0 w-full h-full overflow-hidden select-none bg-[#ea8626]"
          id="pitch-basketball"
        >
          {/* SVG Court Lines - Exact match to user basketball wood court reference with all-white lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 28 15" preserveAspectRatio="none">
            <defs>
              <pattern id="basket-parquet-landscape" width="14" height="2.0" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="14" height="0.5" fill="#f6a445" />
                <rect x="0" y="0.5" width="14" height="0.5" fill="#e78524" />
                <rect x="0" y="1.0" width="14" height="0.5" fill="#f19535" />
                <rect x="0" y="1.5" width="14" height="0.5" fill="#df7819" />

                <line x1="0" y1="0.5" x2="14" y2="0.5" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.45" />
                <line x1="0" y1="1.0" x2="14" y2="1.0" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.45" />
                <line x1="0" y1="1.5" x2="14" y2="1.5" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.45" />
                <line x1="0" y1="2.0" x2="14" y2="2.0" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.45" />

                <line x1="3.5" y1="0" x2="3.5" y2="0.5" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                <line x1="10.5" y1="0" x2="10.5" y2="0.5" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                <line x1="7.0" y1="0.5" x2="7.0" y2="1.0" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                <line x1="1.8" y1="1.0" x2="1.8" y2="1.5" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                <line x1="8.8" y1="1.0" x2="8.8" y2="1.5" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                <line x1="5.2" y1="1.5" x2="5.2" y2="2.0" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
                <line x1="12.2" y1="1.5" x2="12.2" y2="2.0" stroke="#bf5e10" strokeWidth="0.02" strokeOpacity="0.4" />
              </pattern>
            </defs>

            {/* Full parquet floor background */}
            <rect x="0" y="0" width="28" height="15" fill="url(#basket-parquet-landscape)" />

            {/* Outer white boundary rectangle */}
            <rect x="0.6" y="0.5" width="26.8" height="14.0" fill="none" stroke="white" strokeWidth="0.16" />

            {/* Center Line (crisp white) */}
            <line x1="14" y1="0.5" x2="14" y2="14.5" stroke="white" strokeWidth="0.16" />

            {/* Center Circle (full crisp white circle) */}
            <circle cx="14" cy="7.5" r="1.85" fill="none" stroke="white" strokeWidth="0.16" />

            {/* Left Key (white rectangle - placed completely inside the 3-point arc) */}
            <rect x="0.6" y="5.4" width="4.6" height="4.2" fill="none" stroke="white" strokeWidth="0.16" />
            {/* Left Free throw line */}
            <line x1="5.2" y1="5.4" x2="5.2" y2="9.6" stroke="white" strokeWidth="0.16" />
            {/* Left Free throw circle (full white circle inside the 3-point arc) */}
            <circle cx="5.2" cy="7.5" r="1.5" fill="none" stroke="white" strokeWidth="0.16" />

            {/* Left Key Rebound Blocks (4 white teeth on top, 4 on bottom) */}
            <rect x="1.8" y="5.15" width="0.35" height="0.25" fill="white" />
            <rect x="2.6" y="5.15" width="0.35" height="0.25" fill="white" />
            <rect x="3.4" y="5.15" width="0.35" height="0.25" fill="white" />
            <rect x="4.2" y="5.15" width="0.35" height="0.25" fill="white" />
            <rect x="1.8" y="9.6" width="0.35" height="0.25" fill="white" />
            <rect x="2.6" y="9.6" width="0.35" height="0.25" fill="white" />
            <rect x="3.4" y="9.6" width="0.35" height="0.25" fill="white" />
            <rect x="4.2" y="9.6" width="0.35" height="0.25" fill="white" />

            {/* Left 3-point Line (grand rond - curves well beyond the key and free throw circle) */}
            <path d="M 0.6 1.2 L 4.42 1.2 A 6.75 6.75 0 0 1 4.42 13.8 L 0.6 13.8" fill="none" stroke="white" strokeWidth="0.16" />

            {/* Left board and hoop */}
            <line x1="1.6" y1="6.4" x2="1.6" y2="8.6" stroke="white" strokeWidth="0.35" strokeLinecap="square" />
            <line x1="1.6" y1="7.5" x2="2.0" y2="7.5" stroke="white" strokeWidth="0.16" />
            <circle cx="2.45" cy="7.5" r="0.45" fill="none" stroke="white" strokeWidth="0.18" />

            {/* Right Key (white rectangle - placed completely inside the 3-point arc) */}
            <rect x="22.8" y="5.4" width="4.6" height="4.2" fill="none" stroke="white" strokeWidth="0.16" />
            {/* Right Free throw line */}
            <line x1="22.8" y1="5.4" x2="22.8" y2="9.6" stroke="white" strokeWidth="0.16" />
            {/* Right Free throw circle (full white circle inside the 3-point arc) */}
            <circle cx="22.8" cy="7.5" r="1.5" fill="none" stroke="white" strokeWidth="0.16" />

            {/* Right Key Rebound Blocks (4 white teeth on top, 4 on bottom) */}
            <rect x="23.45" y="5.15" width="0.35" height="0.25" fill="white" />
            <rect x="24.25" y="5.15" width="0.35" height="0.25" fill="white" />
            <rect x="25.05" y="5.15" width="0.35" height="0.25" fill="white" />
            <rect x="25.85" y="5.15" width="0.35" height="0.25" fill="white" />
            <rect x="23.45" y="9.6" width="0.35" height="0.25" fill="white" />
            <rect x="24.25" y="9.6" width="0.35" height="0.25" fill="white" />
            <rect x="25.05" y="9.6" width="0.35" height="0.25" fill="white" />
            <rect x="25.85" y="9.6" width="0.35" height="0.25" fill="white" />

            {/* Right 3-point Line (grand rond - curves well beyond the key and free throw circle) */}
            <path d="M 27.4 1.2 L 23.58 1.2 A 6.75 6.75 0 0 0 23.58 13.8 L 27.4 13.8" fill="none" stroke="white" strokeWidth="0.16" />

            {/* Right board and hoop */}
            <line x1="26.4" y1="6.4" x2="26.4" y2="8.6" stroke="white" strokeWidth="0.35" strokeLinecap="square" />
            <line x1="26.4" y1="7.5" x2="26.0" y2="7.5" stroke="white" strokeWidth="0.16" />
            <circle cx="25.55" cy="7.5" r="0.45" fill="none" stroke="white" strokeWidth="0.18" />
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
