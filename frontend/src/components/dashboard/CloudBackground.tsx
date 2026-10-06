import React from 'react';

/**
 * Subtle, abstract CloudBase cloud-themed visual background.
 * Provides a gentle atmospheric sky/cloud feel behind dashboard content.
 * Supports both Light mode (soft sky blue) and Dark mode (deep nebula indigo/blue).
 * 100% lightweight inline SVG & CSS, offline-ready, non-intrusive.
 */
export const CloudBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 transition-opacity duration-300"
    >
      {/* 1. Soft Atmospheric Sky Gradients (Light & Dark) */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-blue-100/40 dark:bg-blue-900/15 blur-3xl transition-colors duration-300" />
      <div className="absolute top-1/4 -right-24 w-[700px] h-[700px] rounded-full bg-sky-100/35 dark:bg-indigo-900/15 blur-3xl transition-colors duration-300" />
      <div className="absolute -bottom-40 left-1/3 w-[800px] h-[600px] rounded-full bg-indigo-50/40 dark:bg-cyan-950/20 blur-3xl transition-colors duration-300" />

      {/* 2. Abstract Geometric Cloud Pattern Layer */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14] dark:opacity-[0.18] transition-opacity duration-300"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="cloudGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="cloudGrad3" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.1" />
          </linearGradient>

          {/* Subtle Grid Dot Pattern for Developer Infrastructure feel */}
          <pattern id="cloudGrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#3B82F6" opacity="0.18" />
          </pattern>
        </defs>

        {/* Developer Grid Background */}
        <rect width="1440" height="900" fill="url(#cloudGrid)" />

        {/* Abstract Cloud Formation 1 - Top Left */}
        <g transform="translate(-80, -60)">
          <path
            d="M 280 180 
               C 280 110, 360 80, 440 100 
               C 490 50, 600 50, 660 110 
               C 720 80, 810 110, 820 180 
               C 870 190, 900 240, 890 290 
               C 880 340, 830 370, 780 370 
               L 260 370 
               C 200 370, 160 320, 170 260 
               C 180 210, 230 180, 280 180 Z"
            fill="url(#cloudGrad1)"
          />
        </g>

        {/* Abstract Cloud Formation 2 - Right Mid/Upper */}
        <g transform="translate(750, 120)">
          <path
            d="M 220 150 
               C 220 90, 280 60, 350 80 
               C 390 30, 480 30, 530 80 
               C 580 50, 650 80, 660 140 
               C 700 150, 730 190, 720 230 
               C 710 270, 670 300, 630 300 
               L 200 300 
               C 150 300, 120 260, 130 210 
               C 140 170, 180 150, 220 150 Z"
            fill="url(#cloudGrad2)"
          />
        </g>

        {/* Abstract Cloud Formation 3 - Bottom Left/Center */}
        <g transform="translate(100, 480)">
          <path
            d="M 320 200 
               C 320 130, 400 90, 500 120 
               C 560 60, 680 60, 750 130 
               C 820 100, 920 130, 930 210 
               C 990 220, 1030 280, 1010 340 
               C 1000 400, 940 430, 880 430 
               L 280 430 
               C 210 430, 160 370, 180 300 
               C 190 240, 250 200, 320 200 Z"
            fill="url(#cloudGrad3)"
          />
        </g>

        {/* Subtle Modern Outline Floating Clouds */}
        <g opacity="0.6">
          <path
            d="M 520 260 a 25 25 0 0 1 45 -10 a 35 35 0 0 1 65 5 a 25 25 0 0 1 35 25 a 20 20 0 0 1 -15 20 l -120 0 a 20 20 0 0 1 -10 -40 z"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 1150 480 a 20 20 0 0 1 35 -8 a 28 28 0 0 1 52 4 a 20 20 0 0 1 28 20 a 16 16 0 0 1 -12 16 l -95 0 a 16 16 0 0 1 -8 -32 z"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="1.5"
          />
          <path
            d="M 180 430 a 18 18 0 0 1 32 -7 a 25 25 0 0 1 46 3 a 18 18 0 0 1 25 18 a 14 14 0 0 1 -10 14 l -85 0 a 14 14 0 0 1 -8 -28 z"
            fill="none"
            stroke="#2563EB"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </g>

        {/* Modern Connecting Network Lines (Cloud Infrastructure symbol) */}
        <g stroke="#93C5FD" strokeWidth="1" strokeDasharray="3 3" opacity="0.4">
          <line x1="280" y1="210" x2="440" y2="140" />
          <line x1="440" y1="140" x2="660" y2="150" />
          <line x1="660" y1="150" x2="780" y2="280" />
          <line x1="950" y1="220" x2="1100" y2="180" />
          <line x1="1100" y1="180" x2="1250" y2="260" />
        </g>
      </svg>
    </div>
  );
};
