import React from 'react';

export const HealthcareIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-[440px] aspect-4/3 flex items-center justify-center select-none pointer-events-none ${className}`}>
      {/* Background Soft Glow & Grid Patterns */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-[#2F80ED]/15 to-[#0FA3A3]/20 blur-2xl transform -translate-y-4"></div>
      </div>

      {/* Decorative Floating Medical Crosses and Dots */}
      <div className="absolute top-4 right-8 text-[#2F80ED]/20 font-bold text-2xl animate-float-slow">+</div>
      <div className="absolute top-16 left-4 text-[#0FA3A3]/25 font-bold text-xl animate-float-slow" style={{ animationDelay: '1.5s' }}>+</div>
      <div className="absolute bottom-12 right-12 text-[#2F80ED]/20 font-bold text-lg animate-float-slow" style={{ animationDelay: '2.5s' }}>+</div>

      {/* Dot Grid Pattern (Subtle) */}
      <div className="absolute top-8 right-2 grid grid-cols-4 gap-2 opacity-30">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-[#2F80ED]"></div>
        ))}
      </div>

      <svg
        viewBox="0 0 500 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_12px_24px_rgba(16,42,86,0.08)]"
      >
        <defs>
          {/* Shield Gradients */}
          <linearGradient id="shieldGrad" x1="140" y1="60" x2="300" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E3F0FF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#CBE2FE" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#A8D0FE" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="shieldBorder" x1="140" y1="60" x2="300" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7FB7F7" stopOpacity="0.6" />
          </linearGradient>

          {/* Clipboard Gradients */}
          <linearGradient id="clipBoardGrad" x1="210" y1="130" x2="360" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F4F8FC" />
          </linearGradient>

          {/* Bottle Gradients */}
          <linearGradient id="bottleGrad" x1="330" y1="230" x2="390" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E8F1FC" />
          </linearGradient>
          <linearGradient id="tealCapGrad" x1="330" y1="220" x2="380" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0FA3A3" />
          </linearGradient>

          {/* Stethoscope Gradients */}
          <linearGradient id="tubeGrad" x1="80" y1="240" x2="280" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Shadow Filter */}
          <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#102A56" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Soft Background Wave Base */}
        <path
          d="M30 340C120 310 220 370 340 330C400 310 450 330 480 350"
          stroke="#E2EDFB"
          strokeWidth="32"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* 1. Large 3D Medical Shield */}
        <g transform="translate(130, 60)" filter="url(#softShadow)">
          <path
            d="M80 15C130 15 155 0 160 0C165 0 190 15 240 15C240 110 200 180 160 215C120 180 80 110 80 15Z"
            fill="url(#shieldGrad)"
            stroke="url(#shieldBorder)"
            strokeWidth="3.5"
          />
          {/* Inner Shield Bevel / White Cross */}
          <path
            d="M95 30C135 30 155 18 160 18C165 18 185 30 225 30C225 105 192 165 160 195C128 165 95 105 95 30Z"
            fill="#FFFFFF"
            fillOpacity="0.35"
          />
          {/* Medical Cross on Shield */}
          <path
            d="M150 75H170V100H195V120H170V145H150V120H125V100H150V75Z"
            fill="#FFFFFF"
            fillOpacity="0.85"
          />
        </g>

        {/* 2. Medical Records Clipboard */}
        <g transform="translate(205, 125)" filter="url(#softShadow)">
          {/* Clipboard Board */}
          <rect x="0" y="15" width="135" height="185" rx="14" fill="#2B4D78" />
          {/* White Paper Sheet */}
          <rect x="6" y="22" width="123" height="172" rx="10" fill="url(#clipBoardGrad)" stroke="#E2E8F0" strokeWidth="1.5" />
          
          {/* Metallic Clip at Top */}
          <rect x="36" y="8" width="63" height="20" rx="5" fill="url(#metalGrad)" stroke="#94A3B8" strokeWidth="1" />
          <rect x="52" y="3" width="31" height="8" rx="4" fill="#64748B" />

          {/* Paper Content: Patient Avatar Header */}
          <rect x="18" y="44" width="28" height="28" rx="6" fill="#EBF4FE" stroke="#CBD5E1" strokeWidth="1" />
          <circle cx="32" cy="54" r="5" fill="#3B82F6" />
          <path d="M24 67C24 62 28 60 32 60C36 60 40 62 40 67" fill="#3B82F6" />

          {/* Header Lines */}
          <rect x="54" y="48" width="58" height="6" rx="3" fill="#1E3A8A" fillOpacity="0.8" />
          <rect x="54" y="60" width="40" height="4" rx="2" fill="#94A3B8" />

          {/* Divider */}
          <line x1="18" y1="84" x2="117" y2="84" stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Form Check-rows */}
          <rect x="18" y="96" width="99" height="14" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <rect x="23" y="100" width="6" height="6" rx="1.5" fill="#0FA3A3" />
          <rect x="35" y="101" width="65" height="4" rx="2" fill="#64748B" fillOpacity="0.7" />

          <rect x="18" y="116" width="99" height="14" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <rect x="23" y="120" width="6" height="6" rx="1.5" fill="#0FA3A3" />
          <rect x="35" y="121" width="52" height="4" rx="2" fill="#64748B" fillOpacity="0.7" />

          <rect x="18" y="136" width="99" height="14" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
          <rect x="23" y="140" width="6" height="6" rx="1.5" fill="#0FA3A3" />
          <rect x="35" y="141" width="70" height="4" rx="2" fill="#64748B" fillOpacity="0.7" />

          {/* Bottom Teal Highlight Bar */}
          <rect x="80" y="162" width="37" height="12" rx="4" fill="#0FA3A3" />
          <circle cx="87" cy="168" r="2" fill="#FFFFFF" />
          <rect x="92" y="166" width="18" height="3" rx="1.5" fill="#FFFFFF" />
        </g>

        {/* 3. Medicine Bottle */}
        <g transform="translate(325, 230)" filter="url(#softShadow)">
          {/* Bottle Body */}
          <rect x="0" y="24" width="46" height="64" rx="8" fill="url(#bottleGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Teal Label */}
          <rect x="2" y="44" width="42" height="32" rx="4" fill="#0FA3A3" />
          <rect x="8" y="52" width="22" height="3" rx="1.5" fill="#FFFFFF" />
          <rect x="8" y="59" width="14" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.7" />
          <circle cx="34" cy="60" r="4" fill="#FFFFFF" fillOpacity="0.3" />
          
          {/* Bottle Neck & Cap */}
          <rect x="7" y="14" width="32" height="12" rx="3" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="3" y="0" width="40" height="16" rx="4" fill="url(#tealCapGrad)" stroke="#0D9488" strokeWidth="1" />
          {/* Cap ridges */}
          <line x1="12" y1="4" x2="12" y2="12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          <line x1="23" y1="4" x2="23" y2="12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          <line x1="34" y1="4" x2="34" y2="12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
        </g>

        {/* 4. Realistic Healthcare Stethoscope */}
        <g filter="url(#softShadow)">
          {/* Stethoscope Tubing Shadow & Tube */}
          <path
            d="M130 220 C100 240 70 270 90 310 C105 340 150 340 170 300 C185 270 205 285 225 315 C240 335 250 345 280 345"
            stroke="#1D4ED8"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M130 220 C100 240 70 270 90 310 C105 340 150 340 170 300 C185 270 205 285 225 315 C240 335 250 345 280 345"
            stroke="url(#tubeGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Stethoscope Binaural Metal Tubes */}
          <path
            d="M100 185 C105 200 120 215 130 220"
            stroke="url(#metalGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M160 185 C155 200 140 215 130 220"
            stroke="url(#metalGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Earpieces */}
          <ellipse cx="100" cy="183" rx="5" ry="4" fill="#1E293B" />
          <ellipse cx="160" cy="183" rx="5" ry="4" fill="#1E293B" />

          {/* Metal Spring connector */}
          <circle cx="130" cy="220" r="5" fill="url(#metalGrad)" stroke="#64748B" strokeWidth="1" />

          {/* Chestpiece / Diaphragm at end of tube */}
          <g transform="translate(280, 335)">
            <circle cx="12" cy="10" r="20" fill="url(#metalGrad)" stroke="#94A3B8" strokeWidth="2" />
            <circle cx="12" cy="10" r="14" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
            <circle cx="12" cy="10" r="5" fill="#3B82F6" />
          </g>
        </g>
      </svg>
    </div>
  );
};
