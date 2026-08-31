import React from 'react';
import { History, ArrowRight, Clock, Bookmark, Check } from 'lucide-react';
import type { HealthTipItem } from '../../types/healthTips';

interface RecentlyViewedSectionProps {
  tips: HealthTipItem[];
  onReadMore: (tip: HealthTipItem) => void;
  onToggleSave: (tipId: string, e: React.MouseEvent) => void;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  tips,
  onReadMore,
  onToggleSave,
}) => {
  if (tips.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold shadow-2xs">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Recently Viewed
            </h3>
            <p className="text-[11px] text-slate-500">
              Pick up where you left off
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tips.map((tip) => (
          <div
            key={tip.id}
            onClick={() => onReadMore(tip)}
            className="p-3.5 bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="min-w-0 space-y-1">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                {tip.category}
              </span>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition truncate">
                {tip.title}
              </h4>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tip.read_time}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => onToggleSave(tip.id, e)}
              className={`p-1.5 rounded-xl border transition shrink-0 cursor-pointer ${
                tip.is_saved
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {tip.is_saved ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
