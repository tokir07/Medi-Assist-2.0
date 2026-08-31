import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

export const SecurityBanner: React.FC = () => {
  return (
    <div className="w-full rounded-2xl bg-[#E8F8F5] border border-[#0FA3A3]/25 p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-[#0FA3A3]" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
            Your data is secure with MediAssist
          </h4>
          <p className="text-[11px] text-[#5F6F86] mt-0.5">
            We follow industry best practices to keep your health information private and protected.
          </p>
        </div>
      </div>

      <Link
        to="/privacy"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0FA3A3] hover:text-[#0D8E8E] shrink-0 self-end sm:self-center transition-colors"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>Learn More</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
