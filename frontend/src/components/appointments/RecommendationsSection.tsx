import React from 'react';
import { Heart, Smile } from 'lucide-react';
import type { RecommendationItem } from '../../types/appointments';

interface RecommendationsSectionProps {
  recommendations: RecommendationItem[];
  onBookRecommendation: (rec: RecommendationItem) => void;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations,
  onBookRecommendation,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
        Recommended for You
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const isTooth = rec.icon_type === 'tooth' || rec.title.toLowerCase().includes('dental');
          return (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 sm:p-5 shadow-[0_2px_12px_rgba(16,42,86,0.02)] hover:border-[#0FA3A3]/40 transition-all flex items-start gap-4"
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                  isTooth
                    ? 'bg-[#F5F3FF] text-[#8B5CF6]'
                    : 'bg-[#E8F8F5] text-[#0FA3A3]'
                }`}
              >
                {isTooth ? (
                  <Smile className="w-6 h-6" />
                ) : (
                  <Heart className="w-6 h-6" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56] leading-snug">
                  {rec.title}
                </h4>
                <p className="text-xs text-[#5F6F86] mt-1 leading-relaxed">
                  {rec.description}
                </p>
                <button
                  type="button"
                  onClick={() => onBookRecommendation(rec)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors mt-2.5 cursor-pointer"
                >
                  <span>{rec.action_text || 'Book Now →'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
