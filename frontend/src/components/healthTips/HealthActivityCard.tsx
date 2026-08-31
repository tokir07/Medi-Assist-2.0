import React from 'react';
import { Bookmark, Eye, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import type { HealthActivityData } from '../../types/healthTips';

interface HealthActivityCardProps {
  activity: HealthActivityData | null;
  onViewSaved: () => void;
}

export const HealthActivityCard: React.FC<HealthActivityCardProps> = ({
  activity,
  onViewSaved,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Your Health Activity</h3>
            <p className="text-[11px] text-slate-500">Saved tips & explored topics</p>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div
          onClick={onViewSaved}
          className="p-3.5 bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-2xl transition cursor-pointer space-y-1"
        >
          <div className="flex items-center gap-1.5 text-slate-400">
            <Bookmark className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Saved Tips</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {activity?.saved_tips_count || 0}
          </p>
          <span className="text-[10px] text-teal-700 font-bold block">View saved →</span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Eye className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Explored</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {activity?.recently_viewed_count || 0}
          </p>
          <span className="text-[10px] text-slate-500 block">Articles read</span>
        </div>
      </div>

      {/* Active Interests */}
      {activity?.active_interests && activity.active_interests.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Your Active Interests
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {activity.active_interests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
