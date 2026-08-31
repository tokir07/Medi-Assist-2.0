import React from 'react';
import { ShieldCheck, FileText, MessageSquareQuote } from 'lucide-react';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
}

const features: FeatureItem[] = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-[#0FA3A3]" />,
    title: 'Secure\n& Private',
  },
  {
    icon: <FileText className="w-5 h-5 text-[#0FA3A3]" />,
    title: 'Access Your\nRecords',
  },
  {
    icon: <MessageSquareQuote className="w-5 h-5 text-[#0FA3A3]" />,
    title: 'AI Health\nAssistant',
  },
];

export const FeatureHighlights: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`grid grid-cols-3 gap-3 sm:gap-4 ${className}`}>
      {features.map((item, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/70 backdrop-blur-xs border border-[#D9E1EA]/60 shadow-[0_4px_12px_rgba(16,42,86,0.03)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EEF5FF] border border-[#D9E1EA]/50 flex items-center justify-center mb-2 shadow-xs">
            {item.icon}
          </div>
          <span className="text-xs font-semibold text-[#102A56] whitespace-pre-line leading-tight">
            {item.title}
          </span>
        </div>
      ))}
    </div>
  );
};
