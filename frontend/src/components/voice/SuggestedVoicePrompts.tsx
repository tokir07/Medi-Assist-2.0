import React from 'react';
import { Lightbulb, Quote } from 'lucide-react';
import type { SuggestedVoicePrompt } from '../../types/voiceAssistant';

interface SuggestedVoicePromptsProps {
  onSelectPrompt: (text: string) => void;
}

const defaultPrompts: SuggestedVoicePrompt[] = [
  { id: 'p-1', text: 'What could be causing my headache?' },
  { id: 'p-2', text: 'Explain my blood test report' },
  { id: 'p-3', text: 'What are the symptoms of vitamin D deficiency?' },
];

export const SuggestedVoicePrompts: React.FC<SuggestedVoicePromptsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="bg-[#F8FCFB] rounded-2xl border border-[#D9E1EA]/70 p-4 sm:p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-[#0FA3A3]">
        <Lightbulb className="w-4 h-4 text-[#0FA3A3]" />
        <h4 className="text-xs sm:text-sm font-semibold text-[#102A56]">
          You can say something like:
        </h4>
      </div>

      {/* 3 Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {defaultPrompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSelectPrompt(prompt.text)}
            className="p-3.5 rounded-xl bg-white hover:bg-[#EEF5FF] border border-[#D9E1EA]/80 hover:border-[#0FA3A3]/50 text-left transition-all duration-150 cursor-pointer shadow-2xs group flex items-start gap-2.5"
          >
            <Quote className="w-3.5 h-3.5 text-[#0FA3A3] shrink-0 mt-0.5" />
            <p className="text-xs text-[#5F6F86] group-hover:text-[#102A56] leading-snug font-medium">
              &ldquo;{prompt.text}&rdquo;
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
