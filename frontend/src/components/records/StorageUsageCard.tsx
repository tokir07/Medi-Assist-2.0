import React from 'react';
import type { RecordSummaryStats } from '../../types/records';

interface StorageUsageCardProps {
  summary: RecordSummaryStats | null;
  onManage?: () => void;
}

export const StorageUsageCard: React.FC<StorageUsageCardProps> = ({
  summary,
  onManage,
}) => {
  const percentage = summary?.storage_percentage ?? 62;
  const usedText = summary?.storage_used_formatted ?? '12.4 GB Used';
  const totalText = summary?.storage_total_formatted ?? '20 GB Total';
  const availableText = summary?.storage_available_formatted ?? '7.6 GB available';

  // SVG Circular gauge calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#102A56]">Storage Usage</h3>
        <button
          type="button"
          onClick={onManage}
          className="text-xs font-semibold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors cursor-pointer"
        >
          Manage
        </button>
      </div>

      {/* Visual Indicator Row */}
      <div className="flex items-center gap-4 py-1">
        {/* Circular Progress Gauge */}
        <div className="relative w-22 h-22 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="text-[#EEF5FF]"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="text-[#0FA3A3] transition-all duration-700 ease-out"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-black text-[#102A56] leading-none">
              {percentage}%
            </span>
            <span className="text-[9px] font-medium text-[#8A98AA] mt-0.5">Used</span>
          </div>
        </div>

        {/* Stats breakdown */}
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-[#102A56] leading-tight">
            {usedText}
          </h4>
          <p className="text-[11px] text-[#8A98AA] font-medium">{totalText}</p>
        </div>
      </div>

      {/* Linear bar */}
      <div className="w-full bg-[#EEF5FF] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#0FA3A3] h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Available bottom label */}
      <div className="flex items-center justify-between text-[11px] text-[#5F6F86] font-medium pt-0.5">
        <span>{availableText}</span>
      </div>
    </div>
  );
};
