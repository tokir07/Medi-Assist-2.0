import React, { useState } from 'react';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HealthTipItem } from '../../types/healthTips';

interface FeaturedTipCardProps {
  featuredTips: HealthTipItem[];
  onSelectTip: (tip: HealthTipItem) => void;
}

export const FeaturedTipCard: React.FC<FeaturedTipCardProps> = ({
  featuredTips,
  onSelectTip,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!featuredTips || featuredTips.length === 0) {
    return null;
  }

  const currentTip = featuredTips[currentIndex] || featuredTips[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? featuredTips.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === featuredTips.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-7 shadow-[0_4px_24px_rgba(16,42,86,0.04)] overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Info Column */}
        <div className="md:col-span-7 space-y-3.5 sm:space-y-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F7F7] text-[#0FA3A3] text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Tip</span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#102A56] leading-tight">
            {currentTip.title}
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#5F6F86] leading-relaxed line-clamp-3">
            {currentTip.summary}
          </p>

          {/* Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onSelectTip(currentTip)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0FA3A3] text-[#0FA3A3] hover:bg-[#E6F7F7] active:bg-[#D2F2F2] text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer group"
            >
              <span>Read Full Tip</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Hero Image Column */}
        <div className="md:col-span-5 relative flex items-center justify-center">
          <div className="w-full h-44 sm:h-52 md:h-56 rounded-2xl overflow-hidden shadow-sm bg-[#EEF5FF] border border-[#E7EDF4]">
            <img
              src={currentTip.image_url || 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80'}
              alt={currentTip.title}
              className="w-full h-full object-cover transform hover:scale-103 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Carousel Dots & Controls (Only if multiple featured tips) */}
      {featuredTips.length > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#F0F4F8]">
          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5">
            {featuredTips.map((tip, idx) => (
              <button
                key={tip.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  idx === currentIndex ? 'w-5 bg-[#0FA3A3]' : 'w-2 bg-[#D9E1EA] hover:bg-[#8A98AA]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              className="w-7 h-7 rounded-full bg-[#F4F8FC] hover:bg-[#E6F7F7] text-[#5F6F86] hover:text-[#0FA3A3] flex items-center justify-center transition-colors cursor-pointer border border-[#E7EDF4]"
              aria-label="Previous Featured Tip"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-7 h-7 rounded-full bg-[#F4F8FC] hover:bg-[#E6F7F7] text-[#5F6F86] hover:text-[#0FA3A3] flex items-center justify-center transition-colors cursor-pointer border border-[#E7EDF4]"
              aria-label="Next Featured Tip"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
