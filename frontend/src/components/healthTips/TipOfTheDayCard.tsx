import React from 'react';
import { Sparkles, Bookmark, ArrowRight, Clock, ShieldCheck, Check } from 'lucide-react';
import type { HealthTipItem } from '../../types/healthTips';

interface TipOfTheDayCardProps {
  tip: HealthTipItem | null;
  onReadMore: (tip: HealthTipItem) => void;
  onToggleSave: (tipId: string, e: React.MouseEvent) => void;
}

export const TipOfTheDayCard: React.FC<TipOfTheDayCardProps> = ({
  tip,
  onReadMore,
  onToggleSave,
}) => {
  if (!tip) return null;

  return (
    <div className="bg-gradient-to-br from-teal-50/70 via-white to-slate-50 rounded-3xl border border-teal-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
      {/* Background soft element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3.5 max-w-2xl">
          {/* Header Tag */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TIP OF THE DAY</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-teal-800 border border-teal-200">
              {tip.category}
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tip.read_time}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {tip.title}
          </h3>

          {/* Summary */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-3">
            {tip.summary}
          </p>

          {/* Author / Source */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Reviewed by <strong>{tip.reviewed_by || tip.author}</strong></span>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex items-center md:flex-col justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onReadMore(tip)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>Read Tip</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => onToggleSave(tip.id, e)}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 border cursor-pointer ${
              tip.is_saved
                ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-2xs'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            {tip.is_saved ? (
              <>
                <Check className="w-4 h-4 text-teal-600" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-slate-400" />
                <span>Save Tip</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
