import React, { useState } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import type { RecordCategory } from '../../types/records';

interface FilterRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory: RecordCategory;
  currentTag: string;
  onApplyFilters: (category: RecordCategory, tag: string) => void;
  onResetFilters: () => void;
}

const CATEGORIES: RecordCategory[] = [
  'All Records',
  'Lab Reports',
  'Radiology',
  'Prescriptions',
  'Consultation',
  'Discharge Summary',
  'Others',
];

const POPULAR_TAGS = ['Routine', 'Chest', 'Hematology', 'Medication', 'Heart', 'Hospital', 'Follow-up', 'Diabetes'];

export const FilterRecordsModal: React.FC<FilterRecordsModalProps> = ({
  isOpen,
  onClose,
  currentCategory,
  currentTag,
  onApplyFilters,
  onResetFilters,
}) => {
  const [selectedCat, setSelectedCat] = useState<RecordCategory>(currentCategory);
  const [selectedTag, setSelectedTag] = useState(currentTag);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(selectedCat, selectedTag);
    onClose();
  };

  const handleReset = () => {
    setSelectedCat('All Records');
    setSelectedTag('');
    onResetFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-md shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF5FF] text-[#0FA3A3] flex items-center justify-center shadow-2xs">
              <Filter className="w-4 h-4 text-[#0FA3A3]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Filter Records</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Category selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#102A56]">Record Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0FA3A3] text-white shadow-xs'
                        : 'bg-[#F7FAFF] hover:bg-[#EEF5FF] text-[#5F6F86] border border-[#D9E1EA]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Tag Filters */}
          <div className="space-y-2 pt-2 border-t border-[#F0F4F8]">
            <label className="text-xs font-bold text-[#102A56]">Filter by Clinical Tag</label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.map((tag) => {
                const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? '' : tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0FA3A3] text-white'
                        : 'bg-[#F4F8FC] hover:bg-[#EEF5FF] text-[#5F6F86] border border-[#D9E1EA]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E7EDF4] flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#5F6F86] hover:text-[#102A56] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-bold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
