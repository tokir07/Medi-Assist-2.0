import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const PrescriptionImportantNoteCard: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <ShieldAlert className="w-4 h-4 text-[#0FA3A3]" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">Important Note</h4>
          <p className="text-[11px] text-[#5F6F86] mt-1 leading-relaxed">
            Always follow your doctor&apos;s instructions and do not stop or change your medication
            without consulting them.
          </p>
        </div>
      </div>
    </div>
  );
};
