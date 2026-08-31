import React from 'react';
import { Clock, Bookmark } from 'lucide-react';
import type { HealthTipItem } from '../../types/healthTips';

interface HealthTipCardProps {
  tip: HealthTipItem;
  onSelectTip: (tip: HealthTipItem) => void;
  onToggleSave: (tipId: string, e: React.MouseEvent) => void;
  saving?: boolean;
}

export const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'nutrition':
      return { bg: 'bg-[#E8F8F5]', text: 'text-[#0FA3A3]', border: 'border-[#B2F5EA]/60' };
    case 'fitness':
      return { bg: 'bg-[#EEF5FF]', text: 'text-[#2F80ED]', border: 'border-[#C3DAFE]/60' };
    case 'mental health':
      return { bg: 'bg-[#F4F0FF]', text: 'text-[#8B5CF6]', border: 'border-[#E9D8FD]/60' };
    case 'lifestyle':
      return { bg: 'bg-[#FFFDF5]', text: 'text-[#D97706]', border: 'border-[#FEF3C7]/60' };
    case 'disease prevention':
      return { bg: 'bg-[#FFF5F5]', text: 'text-[#E53E3E]', border: 'border-[#FED7D7]/60' };
    default:
      return { bg: 'bg-[#F4F8FC]', text: 'text-[#5F6F86]', border: 'border-[#D9E1EA]/60' };
  }
};

export const HealthTipCard: React.FC<HealthTipCardProps> = ({
  tip,
  onSelectTip,
  onToggleSave,
}) => {
  const catStyles = getCategoryColor(tip.category);

  return (
    <div
      onClick={() => onSelectTip(tip)}
      className="flex flex-col bg-white rounded-2xl border border-[#D9E1EA]/80 hover:border-[#0FA3A3]/50 shadow-[0_2px_12px_rgba(16,42,86,0.03)] hover:shadow-[0_6px_20px_rgba(16,42,86,0.07)] transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      {/* Thumbnail Container */}
      <div className="relative w-full h-36 sm:h-40 bg-[#EEF5FF] overflow-hidden">
        <img
          src={tip.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'}
          alt={tip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Body Info */}
      <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
        <div className="space-y-2">
          {/* Category Badge */}
          <div>
            <span
              className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${catStyles.bg} ${catStyles.text} ${catStyles.border}`}
            >
              {tip.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors leading-snug line-clamp-2">
            {tip.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#5F6F86] line-clamp-2 leading-relaxed">
            {tip.summary}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F0F4F8]">
          <div className="flex items-center gap-1.5 text-xs text-[#8A98AA] font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{tip.read_time || '3 min read'}</span>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => onToggleSave(tip.id, e)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              tip.is_saved
                ? 'text-[#0FA3A3] hover:bg-[#E6F7F7]'
                : 'text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC]'
            }`}
            title={tip.is_saved ? 'Remove from Saved Tips' : 'Save Tip'}
            aria-label={tip.is_saved ? 'Remove from Saved Tips' : 'Save Tip'}
          >
            <Bookmark className={`w-4 h-4 ${tip.is_saved ? 'fill-[#0FA3A3]' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
