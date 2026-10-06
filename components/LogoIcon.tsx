import React from "react";

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className = "w-8 h-8 text-white", ...props }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Outer Circle Ring */}
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6.5" fill="none" />

      {/* Main Diagonal 'X' Cross Lines */}
      <path d="M 19 19 L 81 81" stroke="currentColor" strokeWidth="6.5" strokeLinecap="square" />
      <path d="M 81 19 L 19 81" stroke="currentColor" strokeWidth="6.5" strokeLinecap="square" />

      {/* Top Quadrant Inward Chevron */}
      <path d="M 32 21 L 50 39 L 68 21" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="square" strokeLinejoin="miter" />

      {/* Bottom Quadrant Inward Chevron */}
      <path d="M 32 79 L 50 61 L 68 79" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="square" strokeLinejoin="miter" />

      {/* Left Quadrant Inward Chevron */}
      <path d="M 21 32 L 39 50 L 21 68" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="square" strokeLinejoin="miter" />

      {/* Right Quadrant Inward Chevron */}
      <path d="M 79 32 L 61 50 L 79 68" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
};

export default LogoIcon;
