import React from 'react';
import { Sparkles } from 'lucide-react';

interface PersonalizeBannerProps {
  onOpenPersonalize: () => void;
}

export const PersonalizeBanner: React.FC<PersonalizeBannerProps> = ({
  onOpenPersonalize,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left Info */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#B2F5EA]/60 text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
            Want personalized tips?
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6F86] mt-0.5">
            Answer a few questions and get health tips tailored just for you.
          </p>
        </div>
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={onOpenPersonalize}
        className="px-5 py-2.5 bg-[#0FA3A3] hover:bg-[#0D8E8E] active:bg-[#0A7373] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer shrink-0 text-center"
      >
        Get Personalized Tips
      </button>
    </div>
  );
};
