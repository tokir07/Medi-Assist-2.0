import React from 'react';
import { Upload } from 'lucide-react';
import type { RecordCategory } from '../../types/records';

const CATEGORIES: RecordCategory[] = [
  'All Records',
  'Lab Reports',
  'Radiology',
  'Prescriptions',
  'Consultation',
  'Discharge Summary',
  'Others',
];

interface RecordCategoryTabsProps {
  activeCategory: RecordCategory;
  onSelectCategory: (category: RecordCategory) => void;
  onOpenUpload: () => void;
}

export const RecordCategoryTabs: React.FC<RecordCategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenUpload,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 overflow-x-auto pb-1 custom-scrollbar">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#0FA3A3] text-white shadow-xs'
                  : 'bg-white hover:bg-[#F4F8FC] text-[#5F6F86] hover:text-[#102A56] border border-[#D9E1EA]'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Upload Record CTA */}
      <button
        type="button"
        onClick={onOpenUpload}
        className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] active:scale-98 text-white font-bold text-xs sm:text-sm transition-all duration-150 shrink-0 shadow-xs cursor-pointer"
      >
        <Upload className="w-4 h-4 text-white stroke-[2.5]" />
        <span>Upload Record</span>
      </button>
    </div>
  );
};
