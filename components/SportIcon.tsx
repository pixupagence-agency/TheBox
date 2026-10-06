"use client";

import React from "react";

interface SportIconProps {
  sport: string;
  className?: string;
  size?: number;
  variant?: "inline" | "badge";
}

export default function SportIcon({ 
  sport, 
  className = "w-6 h-6", 
  size,
  variant = "inline"
}: SportIconProps) {
  const normSport = (sport || "football").toLowerCase();
  const styleProps = size ? { width: `${size}px`, height: `${size}px` } : {};

  const renderSvg = () => {
    switch (normSport) {
      case "football":
      case "soccer":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={styleProps}
          >
            {/* Football circle */}
            <circle cx="12" cy="12" r="9.5" strokeWidth="1.8" />
            
            {/* Center Pentagon */}
            <polygon points="12,7.2 15.6,9.8 14.2,14 9.8,14 8.4,9.8" fill="currentColor" fillOpacity="0.3" strokeWidth="1.8" />
            
            {/* Radial Seams */}
            <line x1="12" y1="7.2" x2="12" y2="2.5" strokeWidth="1.6" />
            <line x1="15.6" y1="9.8" x2="20.5" y2="7.8" strokeWidth="1.6" />
            <line x1="14.2" y1="14" x2="18.2" y2="18.8" strokeWidth="1.6" />
            <line x1="9.8" y1="14" x2="5.8" y2="18.8" strokeWidth="1.6" />
            <line x1="8.4" y1="9.8" x2="3.5" y2="7.8" strokeWidth="1.6" />

            {/* Surrounding Outer Pentagon Patch Edges */}
            <path d="M 7.5 3.5 L 12 2.5 L 16.5 3.5" strokeWidth="1.4" />
            <path d="M 21.2 11.5 L 20.5 7.8 L 18 5.2" strokeWidth="1.4" />
            <path d="M 19.8 16.5 L 18.2 18.8 L 14.5 21" strokeWidth="1.4" />
            <path d="M 4.2 16.5 L 5.8 18.8 L 9.5 21" strokeWidth="1.4" />
            <path d="M 2.8 11.5 L 3.5 7.8 L 6 5.2" strokeWidth="1.4" />
          </svg>
        );

      case "basketball":
      case "basket":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={styleProps}
          >
            <circle cx="12" cy="12" r="9.5" />
            <line x1="2.5" y1="12" x2="21.5" y2="12" />
            <line x1="12" y1="2.5" x2="12" y2="21.5" />
            <path d="M 5.2 5.2 C 9.5 8 9.2 16 5.2 18.8" />
            <path d="M 18.8 5.2 C 14.5 8 14.8 16 18.8 18.8" />
          </svg>
        );

      case "rugby":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={styleProps}
          >
            <g transform="rotate(-40 12 12)">
              <ellipse cx="12" cy="12" rx="9.5" ry="6" />
              <line x1="2.5" y1="12" x2="21.5" y2="12" />
              <line x1="8" y1="9.5" x2="8" y2="14.5" />
              <line x1="12" y1="9" x2="12" y2="15" />
              <line x1="16" y1="9.5" x2="16" y2="14.5" />
            </g>
          </svg>
        );

      case "handball":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={styleProps}
          >
            {/* Handball Ball */}
            <circle cx="11" cy="12" r="8.5" strokeWidth="1.8" />
            
            {/* Panel Lines for Resin Grip Ball */}
            <path d="M 11 3.5 C 14 6.5 14 10.5 11 13.5 C 8 16.5 8 19.5 11 20.5" strokeWidth="1.5" />
            <path d="M 2.5 12 C 5.5 9 9.5 9 12.5 12 C 15.5 15 18.5 15 19.5 12" strokeWidth="1.5" />
            <path d="M 5 6 C 8 9 14 15 17 18" strokeWidth="1.3" strokeDasharray="1.5 2" />

            {/* Stippling Dots for Resin Texture */}
            <circle cx="8" cy="8" r="0.8" fill="currentColor" />
            <circle cx="14" cy="9" r="0.8" fill="currentColor" />
            <circle cx="7" cy="15" r="0.8" fill="currentColor" />
            <circle cx="13" cy="16" r="0.8" fill="currentColor" />
            <circle cx="11" cy="12" r="1" fill="currentColor" />

            {/* Dynamic Throw Arc */}
            <path d="M 18.5 4 C 21.5 7 22.5 11 20.5 15" strokeWidth="1.8" />
          </svg>
        );

      default:
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={styleProps}
          >
            <circle cx="12" cy="12" r="9.5" />
            <polygon points="12,8 14.8,10 13.7,13.2 10.3,13.2 9.2,10" />
          </svg>
        );
    }
  };

  if (variant === "badge") {
    return (
      <div className="w-10 h-10 rounded-xl bg-[#121926] border border-[#233149] text-white flex items-center justify-center shadow-inner">
        {renderSvg()}
      </div>
    );
  }

  return renderSvg();
}
