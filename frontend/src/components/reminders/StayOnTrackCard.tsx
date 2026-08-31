import React from 'react';
import { Clock, History } from 'lucide-react';

interface StayOnTrackCardProps {
  onOpenHistory: () => void;
}

export const StayOnTrackCard: React.FC<StayOnTrackCardProps> = ({
  onOpenHistory,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-3.5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#EEF5FF] border border-[#C3DAFE]/60 text-[#2F80ED] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#102A56]">Stay on Track</h3>
          <p className="text-[11px] text-[#5F6F86] mt-0.5 leading-relaxed">
            Consistent reminders help you maintain better health.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenHistory}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:bg-[#F4F8FC] hover:border-[#0FA3A3]/40 text-xs font-bold transition-all cursor-pointer"
      >
        <History className="w-4 h-4 text-[#0FA3A3]" />
        <span>View Reminder History</span>
      </button>
    </div>
  );
};
