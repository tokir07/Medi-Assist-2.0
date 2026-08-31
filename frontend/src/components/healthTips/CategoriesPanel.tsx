import React from 'react';
import { Apple, Dumbbell, Brain, Sparkles, Shield, ChevronRight } from 'lucide-react';
import type { CategoryCountItem } from '../../types/healthTips';

interface CategoriesPanelProps {
  categories: CategoryCountItem[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'nutrition':
      return <Apple className="w-4 h-4 text-[#0FA3A3]" />;
    case 'fitness':
      return <Dumbbell className="w-4 h-4 text-[#2F80ED]" />;
    case 'mental health':
      return <Brain className="w-4 h-4 text-[#8B5CF6]" />;
    case 'lifestyle':
      return <Sparkles className="w-4 h-4 text-[#D97706]" />;
    case 'disease prevention':
      return <Shield className="w-4 h-4 text-[#E53E3E]" />;
    default:
      return <Apple className="w-4 h-4 text-[#0FA3A3]" />;
  }
};

const getCategoryIconBg = (category: string) => {
  switch (category.toLowerCase()) {
    case 'nutrition':
      return 'bg-[#E8F8F5] border-[#B2F5EA]/60';
    case 'fitness':
      return 'bg-[#EEF5FF] border-[#C3DAFE]/60';
    case 'mental health':
      return 'bg-[#F4F0FF] border-[#E9D8FD]/60';
    case 'lifestyle':
      return 'bg-[#FFFDF5] border-[#FEF3C7]/60';
    case 'disease prevention':
      return 'bg-[#FFF5F5] border-[#FED7D7]/60';
    default:
      return 'bg-[#F4F8FC] border-[#D9E1EA]/60';
  }
};

export const CategoriesPanel: React.FC<CategoriesPanelProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-3">
      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Categories</h3>

      {/* Category List */}
      <div className="space-y-1.5">
        {categories.map((item) => {
          const isSelected = selectedCategory.toLowerCase() === item.category.toLowerCase();
          const iconBg = getCategoryIconBg(item.category);

          return (
            <button
              key={item.category}
              type="button"
              onClick={() => onSelectCategory(item.category)}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all duration-150 cursor-pointer text-left ${
                isSelected
                  ? 'bg-[#EEF5FF] border border-[#0FA3A3]/30'
                  : 'hover:bg-[#F7FAFF] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${iconBg} shadow-2xs`}>
                  {getCategoryIcon(item.category)}
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#102A56] block truncate">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-[#8A98AA] font-medium block">
                    {item.count} {item.count === 1 ? 'tip' : 'tips'}
                  </span>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isSelected ? 'text-[#0FA3A3]' : 'text-[#8A98AA]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
