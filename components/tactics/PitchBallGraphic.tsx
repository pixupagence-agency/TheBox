// Tableau tactique : ballon de chaque sport (nom, emoji, dessin SVG).

export interface SportBallInfo {
  name: string;
  emoji: string;
  hoverTitle: string;
}

export const getSportBallInfo = (sport?: string): SportBallInfo => {
  switch (sport) {
    case "basketball":
      return {
        name: "Ballon de basketball",
        emoji: "🏀",
        hoverTitle: "Ballon de basketball (Glisser pour déplacer)",
      };
    case "rugby":
      return {
        name: "Ballon de rugby",
        emoji: "🏉",
        hoverTitle: "Ballon de rugby (Glisser pour déplacer)",
      };
    case "handball":
      return {
        name: "Ballon de handball",
        emoji: "🤾",
        hoverTitle: "Ballon de handball (Glisser pour déplacer)",
      };
    case "football":
    default:
      return {
        name: "Ballon de football",
        emoji: "⚽",
        hoverTitle: "Ballon de football (Glisser pour déplacer)",
      };
  }
};

export function PitchBallGraphic({ sport, className = "" }: { sport?: string; className?: string }) {
  switch (sport) {
    case "basketball":
      return (
        <svg
          viewBox="0 0 32 32"
          className={`w-full h-full drop-shadow-md select-none pointer-events-none ${className}`}
          data-testid="ball-basketball"
        >
          <defs>
            <radialGradient id="basketGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="55%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#9a3412" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="14.5" fill="url(#basketGrad)" stroke="#7c2d12" strokeWidth="1.2" />
          <line x1="1.5" y1="16" x2="30.5" y2="16" stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="16" y1="1.5" x2="16" y2="30.5" stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M 5.5 5.5 Q 13.5 16 5.5 26.5" fill="none" stroke="#1c1917" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M 26.5 5.5 Q 18.5 16 26.5 26.5" fill="none" stroke="#1c1917" strokeWidth="1.3" strokeLinecap="round" />
          <ellipse cx="11" cy="9" rx="3.5" ry="2" fill="#ffedd5" opacity="0.45" transform="rotate(-20 11 9)" />
        </svg>
      );

    case "rugby":
      return (
        <svg
          viewBox="0 0 40 26"
          className={`w-full h-full drop-shadow-md select-none pointer-events-none ${className}`}
          data-testid="ball-rugby"
        >
          <defs>
            <radialGradient id="rugbyGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </radialGradient>
          </defs>
          <g transform="rotate(-15 20 13)">
            <ellipse cx="20" cy="13" rx="18" ry="11" fill="url(#rugbyGrad)" stroke="#334155" strokeWidth="1.2" />
            <path d="M 3.5 13 C 10 4, 30 4, 36.5 13" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 3.5 13 C 10 22, 30 22, 36.5 13" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 9 13 C 13 8, 27 8, 31 13" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
            <path d="M 9 13 C 13 18, 27 18, 31 13" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
            <line x1="14" y1="13" x2="26" y2="13" stroke="#475569" strokeWidth="1" />
            <line x1="16" y1="10.5" x2="16" y2="15.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="20" y1="9.5" x2="20" y2="16.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="24" y1="10.5" x2="24" y2="15.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case "handball":
      return (
        <svg
          viewBox="0 0 32 32"
          className={`w-full h-full drop-shadow-md select-none pointer-events-none ${className}`}
          data-testid="ball-handball"
        >
          <defs>
            <radialGradient id="handGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </radialGradient>
            <radialGradient id="handCenterGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <clipPath id="handClip">
              <circle cx="16" cy="16" r="14.5" />
            </clipPath>
          </defs>

          {/* Base 3D sphere */}
          <circle cx="16" cy="16" r="14.5" fill="url(#handGrad)" />

          {/* Symmetrical 32-panel Handball geometry clipped to sphere */}
          <g clipPath="url(#handClip)">
            {/* White/Silver hexagonal accent ring panels (alternating Select/IHF style) */}
            <polygon
              points="16,10.8 20.95,14.39 26.08,12.72 20.5,5.8 16,5.4"
              fill="#f8fafc"
              fillOpacity="0.92"
            />
            <polygon
              points="19.06,20.21 12.94,20.21 9.77,24.58 16,27.8 22.23,24.58"
              fill="#f8fafc"
              fillOpacity="0.92"
            />
            <polygon
              points="11.05,14.39 16,10.8 16,5.4 11.5,5.8 5.92,12.72"
              fill="#38bdf8"
              fillOpacity="0.45"
            />

            {/* Outer 5 pentagonal grip panels (Vibrant Gold/Amber IHF style) */}
            <polygon points="16,5.4 11.5,1.2 20.5,1.2" fill="url(#handCenterGrad)" />
            <polygon points="26.08,12.72 29.5,7.4 31.2,16.4" fill="url(#handCenterGrad)" />
            <polygon points="22.23,24.58 28.4,23.8 21.6,30.6" fill="url(#handCenterGrad)" />
            <polygon points="9.77,24.58 10.4,30.6 3.6,23.8" fill="url(#handCenterGrad)" />
            <polygon points="5.92,12.72 0.8,16.4 2.5,7.4" fill="url(#handCenterGrad)" />

            {/* Central pentagon (Vibrant Gold/Amber with white inner grip chevron) */}
            <polygon
              points="16,10.8 20.95,14.39 19.06,20.21 12.94,20.21 11.05,14.39"
              fill="url(#handCenterGrad)"
            />
            <polygon
              points="16,12.4 19.4,14.9 18.1,18.9 13.9,18.9 12.6,14.9"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.7"
              strokeOpacity="0.85"
            />

            {/* Crisp stitched panel seams */}
            <g stroke="#0f172a" strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round" fill="none">
              {/* Central pentagon */}
              <polygon points="16,10.8 20.95,14.39 19.06,20.21 12.94,20.21 11.05,14.39" />
              {/* 5 radial seams */}
              <line x1="16" y1="10.8" x2="16" y2="5.4" />
              <line x1="20.95" y1="14.39" x2="26.08" y2="12.72" />
              <line x1="19.06" y1="20.21" x2="22.23" y2="24.58" />
              <line x1="12.94" y1="20.21" x2="9.77" y2="24.58" />
              <line x1="11.05" y1="14.39" x2="5.92" y2="12.72" />
              {/* Outer pentagon forks */}
              <polyline points="11.5,1.2 16,5.4 20.5,1.2" />
              <polyline points="29.5,7.4 26.08,12.72 31.2,16.4" />
              <polyline points="28.4,23.8 22.23,24.58 21.6,30.6" />
              <polyline points="10.4,30.6 9.77,24.58 3.6,23.8" />
              <polyline points="0.8,16.4 5.92,12.72 2.5,7.4" />
              {/* Connecting hexagon perimeter seams */}
              <line x1="20.5" y1="5.8" x2="26.08" y2="12.72" />
              <line x1="16" y1="5.4" x2="20.5" y2="5.8" />
              <line x1="11.5" y1="5.8" x2="5.92" y2="12.72" />
              <line x1="16" y1="5.4" x2="11.5" y2="5.8" />
              <line x1="22.23" y1="24.58" x2="16" y2="27.8" />
              <line x1="9.77" y1="24.58" x2="16" y2="27.8" />
            </g>

            {/* Top-left 3D specular shine */}
            <ellipse cx="11" cy="8.5" rx="4.2" ry="2.2" fill="#ffffff" opacity="0.42" transform="rotate(-28 11 8.5)" />
          </g>

          {/* Outer rim stroke */}
          <circle cx="16" cy="16" r="14.5" fill="none" stroke="#0f172a" strokeWidth="1.25" />
        </svg>
      );

    case "football":
    default:
      return (
        <svg
          viewBox="0 0 32 32"
          className={`w-full h-full drop-shadow-md select-none pointer-events-none ${className}`}
          data-testid="ball-football"
        >
          <defs>
            <radialGradient id="footGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="14.5" fill="url(#footGrad)" stroke="#334155" strokeWidth="1.2" />
          <polygon points="16,11 20.8,14.5 19,20 13,20 11.2,14.5" fill="#0f172a" stroke="#0f172a" strokeWidth="0.5" />
          <line x1="16" y1="11" x2="16" y2="1.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="20.8" y1="14.5" x2="29" y2="11.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="19" y1="20" x2="24.5" y2="27.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="13" y1="20" x2="7.5" y2="27.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="11.2" y1="14.5" x2="3" y2="11.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
          <polygon points="13.5,1.5 18.5,1.5 16,3.8" fill="#0f172a" />
          <polygon points="29.5,8 30.5,15 27.5,12" fill="#0f172a" />
          <polygon points="26.5,28.5 21,30.5 24,26.5" fill="#0f172a" />
          <polygon points="5.5,28.5 11,30.5 8,26.5" fill="#0f172a" />
          <polygon points="2.5,8 1.5,15 4.5,12" fill="#0f172a" />
          <ellipse cx="11" cy="9" rx="3.5" ry="2" fill="#ffffff" opacity="0.6" transform="rotate(-30 11 9)" />
        </svg>
      );
  }
}
