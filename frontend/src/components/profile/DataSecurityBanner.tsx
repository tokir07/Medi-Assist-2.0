import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export const DataSecurityBanner: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-2xl bg-[#EEF5FF] border border-[#C3DAFE]/60 text-[#2F80ED] flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
            Your data is secure with us
          </h4>
          <p className="text-[11px] sm:text-xs text-[#5F6F86]">
            We use industry-standard encryption to protect your personal and health information.
          </p>
        </div>
      </div>

      <a
        href="#security-info"
        onClick={(e) => {
          e.preventDefault();
          alert('MediAssist utilizes AES-256 encryption at rest and TLS 1.3 in transit with strict ABAC role controls.');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F80ED] hover:text-[#1d6cd3] hover:underline shrink-0"
      >
        <span>Learn More</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};
