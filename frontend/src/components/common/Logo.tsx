import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, className = '' }) => {
  const sizeMap = {
    sm: { img: 'h-8', text: 'text-lg', sub: 'text-xs' },
    md: { img: 'h-10', text: 'text-xl', sub: 'text-xs' },
    lg: { img: 'h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="MediAssist Logo"
        className={`${currentSize.img} w-auto object-contain flex-shrink-0`}
        onError={(e) => {
          // Fallback if image path fails
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="flex flex-col justify-center">
        <div className="flex items-center">
          <span className={`font-bold tracking-tight ${currentSize.text} text-[#0F2C59]`}>
            Medi<span className="text-[#0D9488]">Assist</span>
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-medium ${currentSize.sub} text-slate-500 tracking-wide`}>
            AI-Powered Clinical Pre-Consultation
          </span>
        )}
      </div>
    </div>
  );
};
