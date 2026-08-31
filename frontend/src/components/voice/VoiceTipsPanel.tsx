import React from 'react';
import { Mic, Clock, Volume2, Shield } from 'lucide-react';
import type { VoiceTipItem } from '../../types/voiceAssistant';

const defaultTips: VoiceTipItem[] = [
  {
    id: 'tip-1',
    title: 'Speak Clearly',
    description: 'Speak in a clear and calm voice for better understanding.',
    icon: 'mic',
  },
  {
    id: 'tip-2',
    title: 'One Question at a Time',
    description: 'Ask one question at a time to get accurate responses.',
    icon: 'clock',
  },
  {
    id: 'tip-3',
    title: 'Background Noise',
    description: 'Try to find a quiet place for the best experience.',
    icon: 'volume',
  },
  {
    id: 'tip-4',
    title: 'Your Privacy Matters',
    description: 'Your voice data is secure and never shared.',
    icon: 'shield',
  },
];

export const VoiceTipsPanel: React.FC = () => {
  const getIcon = (type: VoiceTipItem['icon']) => {
    switch (type) {
      case 'mic':
        return (
          <div className="w-7 h-7 rounded-xl bg-[#E8F8F8] text-[#0FA3A3] flex items-center justify-center shrink-0">
            <Mic className="w-3.5 h-3.5" />
          </div>
        );
      case 'clock':
        return (
          <div className="w-7 h-7 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        );
      case 'volume':
        return (
          <div className="w-7 h-7 rounded-xl bg-[#EFF6FF] text-[#2F80ED] flex items-center justify-center shrink-0">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
        );
      case 'shield':
        return (
          <div className="w-7 h-7 rounded-xl bg-[#E6F4F4] text-[#0FA3A3] flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3.5">
      <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Voice Tips</h3>

      <div className="space-y-3">
        {defaultTips.map((tip) => (
          <div key={tip.id} className="flex items-start gap-3">
            {getIcon(tip.icon)}
            <div>
              <h4 className="text-xs font-bold text-[#102A56] leading-tight">
                {tip.title}
              </h4>
              <p className="text-[11px] text-[#5F6F86] leading-relaxed mt-0.5">
                {tip.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
