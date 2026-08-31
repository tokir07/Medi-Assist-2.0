import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { HealthTipItem } from '../../types/dashboard';

interface HealthTipsCardProps {
  tips?: HealthTipItem[];
}

export const HealthTipsCard: React.FC<HealthTipsCardProps> = ({ tips = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayTips =
    tips.length > 0
      ? tips
      : [
          {
            id: '1',
            title: 'Hydration & Digestion',
            content: 'Drinking warm water in the morning aids gentle digestion and rehydrates after sleep.',
            category: 'Nutrition',
          },
          {
            id: '2',
            title: 'Circadian Sleep Hygiene',
            content: 'Consistent bedtimes and dim evening lighting optimize melatonin production and deep sleep.',
            category: 'Sleep',
          },
        ];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayTips.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayTips.length - 1 ? 0 : prev + 1));
  };

  const currentTip = displayTips[currentIndex] || displayTips[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">Health & Wellness Tips</h3>
        <Link
          to="/patient/tips"
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 transition"
        >
          <span>Explore All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tip Card Body */}
      <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/70 flex items-start gap-3.5 min-h-[96px]">
        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-teal-800 border border-teal-200">
              {currentTip.category || 'General Health'}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {currentTip.title}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {currentTip.content}
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
        <span>
          Tip {currentIndex + 1} of {displayTips.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            aria-label="Previous tip"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            aria-label="Next tip"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
