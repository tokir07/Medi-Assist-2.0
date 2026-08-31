import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ImportantNoteCard: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-2">
      <div className="flex items-center gap-2 text-[#D97706]">
        <AlertCircle className="w-4 h-4" />
        <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">Important Note</h4>
      </div>
      <p className="text-[11px] sm:text-xs text-[#5F6F86] leading-relaxed">
        Reminders are for your convenience. Always follow your doctor's specific prescription and clinical advice.
      </p>
    </div>
  );
};
