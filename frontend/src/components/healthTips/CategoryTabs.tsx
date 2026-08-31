import React from 'react';
import {
  Sparkles,
  Utensils,
  Moon,
  Activity,
  Brain,
  ShieldCheck,
  Pill,
  Heart,
  Bookmark,
} from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: string;
  savedOnly?: boolean;
  onSelectCategory: (category: string) => void;
  onToggleSavedOnly: () => void;
}

const CATEGORIES = [
  { id: 'All', label: 'All', icon: Sparkles },
  { id: 'Nutrition', label: 'Nutrition', icon: Utensils },
  { id: 'Sleep', label: 'Sleep', icon: Moon },
  { id: 'Fitness', label: 'Fitness', icon: Activity },
  { id: 'Mental Wellness', label: 'Mental Wellness', icon: Brain },
  { id: 'Preventive Care', label: 'Preventive Care', icon: ShieldCheck },
  { id: 'Medication Awareness', label: 'Medication Awareness', icon: Pill },
  { id: 'General Wellness', label: 'General Wellness', icon: Heart },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  savedOnly = false,
  onSelectCategory,
  onToggleSavedOnly,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive =
          !savedOnly &&
          (activeCategory === cat.id ||
            (cat.id === 'All' && (activeCategory === 'All' || activeCategory === 'All Tips')));

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              isActive
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{cat.label}</span>
          </button>
        );
      })}

      {/* Saved Bookmark Tab */}
      <button
        type="button"
        onClick={onToggleSavedOnly}
        className={`px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ml-auto shrink-0 ${
          savedOnly
            ? 'bg-teal-600 text-white shadow-2xs'
            : 'bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/80 shadow-2xs'
        }`}
      >
        <Bookmark className="w-3.5 h-3.5 text-teal-600" />
        <span>Saved Tips</span>
      </button>
    </div>
  );
};
