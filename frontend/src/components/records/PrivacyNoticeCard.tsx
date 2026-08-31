import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface PrivacyNoticeCardProps {
  onLearnMore?: () => void;
}

export const PrivacyNoticeCard: React.FC<PrivacyNoticeCardProps> = ({ onLearnMore }) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3">
      {/* Icon & Title */}
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <ShieldCheck className="w-4 h-4 text-[#0FA3A3]" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">Important Note</h4>
          <p className="text-[11px] text-[#5F6F86] mt-1 leading-relaxed">
            Your medical records are private and secure. Only you and the doctors you share with
            can access them.
          </p>
        </div>
      </div>

      {/* Learn More link */}
      <button
        type="button"
        onClick={onLearnMore}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors cursor-pointer pt-1"
      >
        <span>Learn more about data security</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
