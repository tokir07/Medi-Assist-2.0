import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, List, LayoutGrid } from 'lucide-react';
import type { AppointmentTab } from '../../types/appointments';

interface AppointmentToolbarProps {
  activeTab: AppointmentTab;
  sort: 'earliest' | 'latest' | 'doctor_asc' | 'status';
  onSortChange: (s: 'earliest' | 'latest' | 'doctor_asc' | 'status') => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onOpenFilter: () => void;
  activeFilterCount: number;
}

export const AppointmentToolbar: React.FC<AppointmentToolbarProps> = ({
  activeTab,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenFilter,
  activeFilterCount,
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortLabels = {
    earliest: 'Earliest First',
    latest: 'Latest First',
    doctor_asc: 'Doctor Name',
    status: 'Status',
  };

  const getHeading = () => {
    switch (activeTab) {
      case 'Upcoming':
        return 'Upcoming Appointments';
      case 'Past':
        return 'Past Appointments';
      case 'Cancelled':
        return 'Cancelled Appointments';
      default:
        return 'All Appointments';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
      {/* Title */}
      <h2 className="text-base sm:text-lg font-bold text-[#102A56]">
        {getHeading()}
      </h2>

      {/* Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
        {/* Filter Button */}
        <button
          type="button"
          onClick={onOpenFilter}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            activeFilterCount > 0
              ? 'bg-[#E8F8F5] border-[#0FA3A3] text-[#0FA3A3]'
              : 'bg-white border-[#D9E1EA] text-[#5F6F86] hover:text-[#102A56] hover:bg-[#F4F8FC]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#0FA3A3] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen(!sortOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#D9E1EA] text-xs sm:text-sm font-medium text-[#5F6F86] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            <span>{sortLabels[sort]}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#8A98AA] transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-white border border-[#D9E1EA] rounded-xl shadow-lg py-1 z-30 animate-fade-in">
              {(Object.keys(sortLabels) as (keyof typeof sortLabels)[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onSortChange(key);
                    setSortOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                    sort === key
                      ? 'bg-[#EEF5FF] text-[#0FA3A3] font-semibold'
                      : 'text-[#5F6F86] hover:bg-[#F4F8FC] hover:text-[#102A56]'
                  }`}
                >
                  {sortLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Toggle (List vs Grid) */}
        <div className="inline-flex items-center rounded-xl bg-[#F4F8FC] p-0.5 border border-[#D9E1EA]/80">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-[#0FA3A3] shadow-xs'
                : 'text-[#8A98AA] hover:text-[#102A56]'
            }`}
            title="List View"
            aria-label="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#0FA3A3] shadow-xs'
                : 'text-[#8A98AA] hover:text-[#102A56]'
            }`}
            title="Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
