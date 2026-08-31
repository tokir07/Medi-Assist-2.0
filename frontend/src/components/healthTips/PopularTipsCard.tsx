import React from 'react';
import { ArrowRight, Bookmark } from 'lucide-react';
import type { HealthTipItem } from '../../types/healthTips';

interface PopularTipsCardProps {
  popularTips: HealthTipItem[];
  onSelectTip: (tip: HealthTipItem) => void;
  onToggleSave: (tipId: string, e: React.MouseEvent) => void;
  onViewAllPopular?: () => void;
}

export const PopularTipsCard: React.FC<PopularTipsCardProps> = ({
  popularTips,
  onSelectTip,
  onToggleSave,
  onViewAllPopular,
}) => {
  if (!popularTips || popularTips.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-3.5">
      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Popular Tips</h3>

      {/* Ranked List */}
      <div className="space-y-2.5">
        {popularTips.slice(0, 3).map((tip, index) => {
          const rank = tip.popularity_rank || index + 1;
          return (
            <div
              key={tip.id}
              onClick={() => onSelectTip(tip)}
              className="flex items-start justify-between p-2.5 rounded-2xl hover:bg-[#F7FAFF] border border-transparent hover:border-[#E7EDF4] transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <div className="w-6 h-6 rounded-lg bg-[#F4F8FC] border border-[#E7EDF4] text-xs font-bold text-[#102A56] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {rank}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors leading-snug line-clamp-2">
                    {tip.title}
                  </h4>
                  <span className="text-[11px] text-[#8A98AA] font-medium mt-1 block">
                    {tip.read_time || '4 min read'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => onToggleSave(tip.id, e)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  tip.is_saved
                    ? 'text-[#0FA3A3] hover:bg-[#E6F7F7]'
                    : 'text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC]'
                }`}
                title={tip.is_saved ? 'Remove from Saved' : 'Save Tip'}
                aria-label={tip.is_saved ? 'Remove from Saved' : 'Save Tip'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${tip.is_saved ? 'fill-[#0FA3A3]' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {onViewAllPopular && (
        <div className="pt-2 border-t border-[#F0F4F8] text-center">
          <button
            type="button"
            onClick={onViewAllPopular}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors cursor-pointer"
          >
            <span>View All Popular Tips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
