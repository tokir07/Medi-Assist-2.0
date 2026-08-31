import React, { useState } from 'react';
import { Sparkles, HelpCircle, Bookmark, ArrowRight, Clock, Check, Info } from 'lucide-react';
import type { HealthTipItem } from '../../types/healthTips';

interface RecommendedSectionProps {
  tips: HealthTipItem[];
  loading?: boolean;
  onReadMore: (tip: HealthTipItem) => void;
  onToggleSave: (tipId: string, e: React.MouseEvent) => void;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  tips,
  loading = false,
  onReadMore,
  onToggleSave,
}) => {
  const [activeWhyTipId, setActiveWhyTipId] = useState<string | null>(null);

  if (!loading && tips.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Recommended For You
            </h3>
            <p className="text-[11px] text-slate-500">
              Educational health guidance matched with your wellness interests
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Recommended Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2].map((i) => (
            <div
              key={i}
              className="p-5 bg-white rounded-3xl border border-slate-200 animate-pulse h-44 shadow-2xs"
            />
          ))
        ) : (
          tips.map((tip) => {
            const isWhyOpen = activeWhyTipId === tip.id;
            return (
              <div
                key={tip.id}
                onClick={() => onReadMore(tip)}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-teal-300 p-5 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative"
              >
                <div className="space-y-2.5">
                  {/* Category & Why Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                      {tip.category}
                    </span>

                    {/* "Why am I seeing this?" Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWhyTipId(isWhyOpen ? null : tip.id);
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-teal-700 flex items-center gap-1 transition cursor-pointer"
                        title="Why was this recommended?"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Why this?</span>
                      </button>

                      {/* Explanation Popover */}
                      {isWhyOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-6 z-20 w-64 p-3 bg-slate-900 text-white rounded-2xl shadow-xl text-[11px] space-y-1 animate-fadeIn"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-teal-300">
                            <Info className="w-3.5 h-3.5" />
                            <span>Recommendation Note</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[10px]">
                            {tip.recommendation_reason ||
                              'This educational tip was selected based on your recent activity and general health topics.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition leading-snug line-clamp-2">
                    {tip.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {tip.summary}
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {tip.read_time}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => onToggleSave(tip.id, e)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                        tip.is_saved
                          ? 'bg-teal-50 border-teal-300 text-teal-700'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                      title={tip.is_saved ? 'Saved' : 'Save Tip'}
                    >
                      {tip.is_saved ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onReadMore(tip)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-0.5"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
