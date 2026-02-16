import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "text-ink dark:text-white", size = 32, withText = false }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <title>Ink & Flow Logo</title>
        {/* Main Nib Shape */}
        <path
          d="M16 2C16 2 8 11.5 8 18.5C8 23.5 11 26.5 14 27V29C14 29.55 14.45 30 15 30H17C17.55 30 18 29.55 18 29V27C21 26.5 24 23.5 24 18.5C24 11.5 16 2 16 2Z"
          className="fill-navy dark:fill-blue-500"
        />

        {/* The Shine/Flow Curve on the left */}
        <path
          d="M12.5 16C12.5 16 12 18 12.5 20.5"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-paper dark:text-[#1a1a22]"
        />

        {/* The Ink Slit */}
        <path
          d="M16 10V22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-paper dark:text-[#1a1a22]"
        />

        {/* The Breathing Hole (Heart of the Nib) */}
        <circle cx="16" cy="16" r="1.5" className="fill-paper dark:fill-[#1a1a22]" />

        {/* Decorative Fluid Swirl extending from bottom (Abstract Flow) */}
        <path
          d="M18 29C18 29 22 28 24 30C25.5 31.5 23 33 21.5 32"
          stroke="#98A8A2"
          strokeWidth="2"
          strokeLinecap="round"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
      </svg>

      {withText && (
        <div className="flex flex-col justify-center">
          <span className="font-serif font-bold text-lg leading-none tracking-tight text-ink dark:text-white">Ink & Flow</span>
        </div>
      )}
    </div>
  );
};