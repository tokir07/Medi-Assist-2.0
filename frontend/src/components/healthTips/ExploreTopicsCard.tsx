import React from 'react';
import {
  Compass,
  Utensils,
  Moon,
  Activity,
  Brain,
  ShieldCheck,
  Pill,
  Heart,
  ChevronRight,
} from 'lucide-react';
import type { CategoryCountItem } from '../../types/healthTips';

interface ExploreTopicsCardProps {
  categories: CategoryCountItem[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  nutrition: Utensils,
  sleep: Moon,
  fitness: Activity,
  'mental wellness': Brain,
  'mental health': Brain,
  'preventive care': ShieldCheck,
  'disease prevention': ShieldCheck,
  'medication awareness': Pill,
  'general wellness': Heart,
  lifestyle: Heart,
};

export const ExploreTopicsCard: React.FC<ExploreTopicsCardProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold shadow-2xs">
          <Compass className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Explore Health Topics
          </h3>
          <p className="text-[11px] text-slate-500">
            Browse educational collections by topic
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {categories.map((cat) => {
          const key = cat.category.toLowerCase();
          const Icon = ICON_MAP[key] || Compass;
          const isSelected = activeCategory.toLowerCase() === key;

          return (
            <div
              key={cat.category}
              onClick={() => onSelectCategory(cat.category)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-teal-50 border-teal-300 shadow-2xs'
                  : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-white text-teal-700 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {cat.category}
                  </h4>
                  {cat.description && (
                    <p className="text-[10px] text-slate-500 truncate">{cat.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                  {cat.count}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
