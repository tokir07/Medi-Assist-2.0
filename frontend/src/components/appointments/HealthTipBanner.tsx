import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HealthTipBanner: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 sm:p-5 shadow-[0_2px_12px_rgba(16,42,86,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#E8F8F5] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
          <Lightbulb className="w-5 h-5 text-[#0FA3A3]" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">Health Tip</h4>
          <p className="text-xs text-[#5F6F86] mt-0.5 leading-relaxed">
            Regular checkups help detect potential health issues early and keep you healthy.
          </p>
        </div>
      </div>

      <Link
        to="/patient/tips"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors shrink-0"
      >
        <span>View All Health Tips</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
