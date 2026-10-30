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
            {/* Handball sphere */}
            <circle cx="12" cy="12" r="9.5" strokeWidth="1.8" />

            {/* Central grip pentagon with inner chevron */}
            <polygon points="12,7.8 15.8,10.5 14.3,15 9.7,15 8.2,10.5" fill="currentColor" fillOpacity="0.22" strokeWidth="1.6" />
            <polygon points="12,9.4 14.3,11 13.4,13.7 10.6,13.7 9.7,11" strokeWidth="1.1" />

            {/* Symmetrical 32-panel seams */}
            <line x1="12" y1="7.8" x2="12" y2="4.2" strokeWidth="1.5" />
            <line x1="15.8" y1="10.5" x2="19.2" y2="9.3" strokeWidth="1.5" />
            <line x1="14.3" y1="15" x2="16.8" y2="18.3" strokeWidth="1.5" />
            <line x1="9.7" y1="15" x2="7.2" y2="18.3" strokeWidth="1.5" />
            <line x1="8.2" y1="10.5" x2="4.8" y2="9.3" strokeWidth="1.5" />

            {/* Outer panel forks */}
            <path d="M 8.8 3.1 L 12 4.2 L 15.2 3.1" strokeWidth="1.4" />
            <path d="M 20.4 6.6 L 19.2 9.3 L 21.3 11.8" strokeWidth="1.4" />
            <path d="M 20.1 17.5 L 16.8 18.3 L 15.8 20.8" strokeWidth="1.4" />
            <path d="M 8.2 20.8 L 7.2 18.3 L 3.9 17.5" strokeWidth="1.4" />
            <path d="M 2.7 11.8 L 4.8 9.3 L 3.6 6.6" strokeWidth="1.4" />
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
