import React from 'react';
import { Filter, ChevronDown, List, LayoutGrid } from 'lucide-react';

interface PrescriptionToolbarProps {
  sort: string;
  onSelectSort: (sort: 'latest' | 'oldest' | 'name_asc' | 'name_desc') => void;
  viewMode: 'list' | 'grid';
  onToggleViewMode: (mode: 'list' | 'grid') => void;
  onOpenFilter: () => void;
  hasActiveFilters?: boolean;
}

export const PrescriptionToolbar: React.FC<PrescriptionToolbarProps> = ({
  sort,
  onSelectSort,
  viewMode,
  onToggleViewMode,
  onOpenFilter,
  hasActiveFilters = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-[#102A56]">Recent Prescriptions</h3>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Filter Button */}
        <button
          type="button"
          onClick={onOpenFilter}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer shadow-2xs ${
            hasActiveFilters
              ? 'bg-[#EEF5FF] text-[#0FA3A3] border-[#0FA3A3]'
              : 'bg-white hover:bg-[#F4F8FC] text-[#5F6F86] hover:text-[#102A56] border-[#D9E1EA]'
          }`}
        >
          <Filter className={`w-3.5 h-3.5 ${hasActiveFilters ? 'text-[#0FA3A3]' : 'text-[#8A98AA]'}`} />
          <span>Filter</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#0FA3A3]" />
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative inline-block">
          <select
            value={sort}
            onChange={(e) => onSelectSort(e.target.value as any)}
            className="appearance-none bg-white hover:bg-[#F4F8FC] border border-[#D9E1EA] text-[#5F6F86] hover:text-[#102A56] text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl cursor-pointer focus:outline-none focus:border-[#0FA3A3] shadow-2xs transition-all"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Medicine (A–Z)</option>
            <option value="name_desc">Medicine (Z–A)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8A98AA] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* List / Grid toggle */}
        <div className="flex items-center bg-[#F4F8FC] p-0.5 rounded-xl border border-[#D9E1EA]/80">
          <button
            type="button"
            onClick={() => onToggleViewMode('list')}
            className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-[#0FA3A3] shadow-2xs font-bold'
                : 'text-[#8A98AA] hover:text-[#102A56]'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#0FA3A3] shadow-2xs font-bold'
                : 'text-[#8A98AA] hover:text-[#102A56]'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
