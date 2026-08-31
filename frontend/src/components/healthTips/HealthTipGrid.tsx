import React from 'react';
import { HealthTipCard } from './HealthTipCard';
import { Lightbulb, Bookmark, AlertCircle, RefreshCw } from 'lucide-react';
import type { HealthTipItem } from '../../types/healthTips';

interface HealthTipGridProps {
  tips: HealthTipItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectTip: (tip: HealthTipItem) => void;
  onToggleSave: (tipId: string, e: React.MouseEvent) => void;
  savedOnly?: boolean;
  onResetFilters?: () => void;
}

export const HealthTipGrid: React.FC<HealthTipGridProps> = ({
  tips,
  loading,
  error,
  onRetry,
  onSelectTip,
  onToggleSave,
  savedOnly,
  onResetFilters,
}) => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-[#102A56]">
          {savedOnly ? 'Saved Health Tips' : 'Latest Health Tips'}
        </h2>
        {tips.length > 0 && !savedOnly && (
          <span className="text-xs font-semibold text-[#0FA3A3]">
            Showing {tips.length} tips
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#E7EDF4] overflow-hidden p-4 space-y-3 animate-pulse"
            >
              <div className="w-full h-36 bg-[#E8EEF5] rounded-xl" />
              <div className="w-20 h-4 bg-[#E8EEF5] rounded-md" />
              <div className="w-full h-5 bg-[#E8EEF5] rounded-md" />
              <div className="w-3/4 h-4 bg-[#E8EEF5] rounded-md" />
              <div className="pt-2 flex justify-between">
                <div className="w-16 h-4 bg-[#E8EEF5] rounded-md" />
                <div className="w-6 h-6 bg-[#E8EEF5] rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-8 rounded-2xl bg-white border border-[#FED7D7] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FFF5F5] text-[#E53E3E] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#102A56]">Unable to load health tips</h3>
          <p className="text-xs sm:text-sm text-[#5F6F86] max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0FA3A3] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#0D8E8E] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tips.length === 0 && (
        <div className="p-10 rounded-2xl bg-white border border-[#D9E1EA]/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#EEF5FF] text-[#0FA3A3] flex items-center justify-center mx-auto">
            {savedOnly ? <Bookmark className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
          </div>
          <h3 className="text-base font-bold text-[#102A56]">
            {savedOnly ? 'No Saved Tips Yet' : 'No Health Tips Found'}
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6F86] max-w-md mx-auto">
            {savedOnly
              ? 'Click the bookmark icon on any health tip to save it for quick reference.'
              : 'Try selecting another category or searching for a different keyword.'}
          </p>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#0FA3A3] bg-[#E6F7F7] hover:bg-[#D2F2F2] transition-colors cursor-pointer"
            >
              <span>View All Health Tips</span>
            </button>
          )}
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && tips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip) => (
            <HealthTipCard
              key={tip.id}
              tip={tip}
              onSelectTip={onSelectTip}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};
