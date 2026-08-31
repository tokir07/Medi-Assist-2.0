import React from 'react';
import { Mic, AudioLines, Loader2, MessageSquare } from 'lucide-react';
import type { VoiceStage } from '../../types/voiceAssistant';

interface VoiceProgressTrackerProps {
  currentStage: VoiceStage;
  onSelectStage?: (stage: VoiceStage) => void;
}

interface StageStep {
  key: VoiceStage;
  label: string;
  icon: React.ReactNode;
}

export const VoiceProgressTracker: React.FC<VoiceProgressTrackerProps> = ({ currentStage }) => {
  const steps: StageStep[] = [
    { key: 'speak', label: 'Speak', icon: <Mic className="w-4 h-4" /> },
    { key: 'listening', label: 'Listening', icon: <AudioLines className="w-4 h-4" /> },
    { key: 'processing', label: 'Processing', icon: <Loader2 className="w-4 h-4" /> },
    { key: 'responding', label: 'Responding', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full border-b border-[#E7EDF4] pb-2">
      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto text-center">
        {steps.map((step) => {
          const isActive = currentStage === step.key;
          return (
            <div
              key={step.key}
              className={`flex flex-col items-center pb-3 relative transition-all duration-200 ${
                isActive ? 'text-[#0FA3A3]' : 'text-[#8A98AA]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center mb-1.5 transition-all ${
                  isActive
                    ? 'bg-[#EEF5FF] text-[#0FA3A3] shadow-2xs font-bold'
                    : 'bg-transparent text-[#8A98AA]'
                }`}
              >
                {step.icon}
              </div>
              <span
                className={`text-xs font-semibold tracking-tight ${
                  isActive ? 'text-[#0FA3A3]' : 'text-[#8A98AA]'
                }`}
              >
                {step.label}
              </span>

              {/* Active Bottom Indicator Bar */}
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0FA3A3] rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
