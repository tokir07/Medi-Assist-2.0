import React from 'react';
import { ShieldAlert, Phone } from 'lucide-react';

export const SupportPanel: React.FC = () => {
  const supportPhoneNumber = '+91 98765 43210';

  return (
    <div className="space-y-4">
      {/* Important Note Card */}
      <div className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-5 shadow-[0_2px_12px_rgba(16,42,86,0.02)] space-y-2">
        <div className="flex items-center gap-2.5 text-[#2F80ED]">
          <div className="w-7 h-7 rounded-lg bg-[#EEF5FF] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-[#2F80ED]" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">Important Note</h4>
        </div>
        <p className="text-xs text-[#5F6F86] leading-relaxed pl-0.5">
          Please arrive 15 minutes before your scheduled time. Carry your ID and relevant
          medical documents.
        </p>
      </div>

      {/* Need Help? Card */}
      <div className="bg-[#FFF8F8] rounded-2xl border border-[#FEE2E2] p-5 space-y-2.5 shadow-[0_2px_12px_rgba(16,42,86,0.02)]">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">Need Help?</h4>
          <p className="text-[11px] text-[#5F6F86] mt-0.5">
            Call us for <span className="font-semibold text-[#D64545]">appointment</span> support
          </p>
        </div>

        <a
          href={`tel:${supportPhoneNumber.replace(/\s+/g, '')}`}
          className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#D64545] hover:text-[#B91C1C] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-white shadow-2xs flex items-center justify-center shrink-0 border border-[#FEE2E2]">
            <Phone className="w-3.5 h-3.5 text-[#D64545]" />
          </div>
          <span>{supportPhoneNumber}</span>
        </a>
      </div>
    </div>
  );
};
