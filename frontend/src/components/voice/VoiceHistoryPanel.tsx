import React from 'react';
import { Play, ArrowRight } from 'lucide-react';
import type { VoiceHistoryItem } from '../../types/voiceAssistant';

interface VoiceHistoryPanelProps {
  history: VoiceHistoryItem[];
  onSelectHistory: (item: VoiceHistoryItem) => void;
}

export const VoiceHistoryPanel: React.FC<VoiceHistoryPanelProps> = ({
  history,
  onSelectHistory,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Voice History</h3>
        <button
          type="button"
          onClick={() => {}}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7FAFF] hover:bg-[#EEF5FF] border border-[#E7EDF4] transition-all duration-150 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-xl bg-white border border-[#D9E1EA] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5">
              <Play className="w-3 h-3 fill-[#0FA3A3]" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors leading-tight line-clamp-2">
                {item.title}
              </h4>
              <p className="text-[10px] text-[#8A98AA] font-medium mt-1">
                {item.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
