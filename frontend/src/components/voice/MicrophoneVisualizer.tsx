import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, Volume2 } from 'lucide-react';
import type { VoiceStage } from '../../types/voiceAssistant';
import mediassistLogo from '../../assets/image.png';

interface MicrophoneVisualizerProps {
  stage: VoiceStage;
  recordingSeconds: number;
  frequencies?: number[];
  onToggleRecord: () => void;
}

export const MicrophoneVisualizer: React.FC<MicrophoneVisualizerProps> = ({
  stage,
  recordingSeconds,
  frequencies = [],
  onToggleRecord,
}) => {
  const [animatedBars, setAnimatedBars] = useState<number[]>(new Array(14).fill(0.25));

  // Dynamic live frequency bar calculation
  useEffect(() => {
    if (stage === 'listening') {
      const interval = setInterval(() => {
        if (frequencies.length > 0) {
          setAnimatedBars(frequencies.slice(0, 14));
        } else {
          setAnimatedBars(
            Array.from({ length: 14 }, (_, i) => {
              const base = 0.2 + Math.sin(Date.now() / 200 + i * 0.5) * 0.4 + Math.random() * 0.3;
              return Math.max(0.15, Math.min(1.0, base));
            })
          );
        }
      }, 80);
      return () => clearInterval(interval);
    } else if (stage === 'responding') {
      const interval = setInterval(() => {
        setAnimatedBars(
          Array.from({ length: 14 }, (_, i) => {
            const wave = 0.3 + Math.sin(Date.now() / 150 + i * 0.4) * 0.5;
            return Math.max(0.2, Math.min(0.9, wave));
          })
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAnimatedBars(new Array(14).fill(0.2));
    }
  }, [stage, frequencies]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStageBadge = () => {
    switch (stage) {
      case 'listening':
        return {
          label: 'Listening to your voice...',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500 animate-ping',
        };
      case 'processing':
        return {
          label: 'Understanding & analyzing context...',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          dot: 'bg-teal-500 animate-spin',
        };
      case 'responding':
        return {
          label: 'MediAssist AI is speaking...',
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          dot: 'bg-cyan-500 animate-pulse',
        };
      default:
        return {
          label: 'Ready — Click logo to speak',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const badge = getStageBadge();

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-6 select-none">
      {/* 1. Status Pill with live indicator */}
      <div className="flex items-center gap-2">
        <div className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all ${badge.bg}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* 2. Modern Central Visualizer Stage */}
      <div className="relative flex items-center justify-center gap-2 sm:gap-6 w-full max-w-2xl py-4">
        {/* Left Audio Waveform Bars (Mirror gradient) */}
        <div className="flex items-center gap-1 sm:gap-1.5 h-24 justify-end flex-1">
          {animatedBars.slice(0, 10).map((height, i) => (
            <div
              key={`left-bar-${i}`}
              className="w-1 sm:w-1.5 rounded-full bg-linear-to-t from-[#0FA3A3] via-[#38BDF8] to-[#818CF8] transition-all duration-100 shadow-2xs"
              style={{
                height: `${Math.max(8, height * 72)}px`,
                opacity: 0.3 + (i / 10) * 0.7,
              }}
            />
          ))}
        </div>

        {/* Central Logo Sphere with Multi-layered Auras */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Ambient Glow Halo */}
          <div
            className={`absolute -inset-6 rounded-full blur-xl transition-all duration-500 pointer-events-none ${
              stage === 'listening'
                ? 'bg-[#0FA3A3]/40 scale-125 animate-pulse'
                : stage === 'responding'
                ? 'bg-[#38BDF8]/40 scale-115 animate-pulse'
                : stage === 'processing'
                ? 'bg-[#818CF8]/30 scale-110'
                : 'bg-[#0FA3A3]/15 scale-90'
            }`}
          />

          {/* Outer Pulsating Ripple 1 */}
          <div
            className={`absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 border-[#0FA3A3]/25 transition-all duration-700 pointer-events-none ${
              stage === 'listening' ? 'scale-125 opacity-70 animate-ping' : 'scale-100 opacity-20'
            }`}
          />

          {/* Outer Pulsating Ripple 2 */}
          <div
            className={`absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-linear-to-tr from-[#0FA3A3]/10 to-[#38BDF8]/20 flex items-center justify-center transition-all duration-300 pointer-events-none ${
              stage === 'listening' ? 'scale-110' : 'scale-100'
            }`}
          />

          {/* Rotating Glowing Gradient Ring when Processing */}
          {stage === 'processing' && (
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#0FA3A3] animate-spin pointer-events-none" />
          )}

          {/* Interactive Central MediAssist Logo Button */}
          <button
            type="button"
            onClick={onToggleRecord}
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-2.5 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-[0_12px_36px_rgba(15,163,163,0.3)] hover:shadow-[0_16px_45px_rgba(15,163,163,0.45)] hover:scale-105 active:scale-95 border-2 ${
              stage === 'listening'
                ? 'border-[#0FA3A3] ring-4 ring-[#0FA3A3]/20 shadow-[0_0_30px_rgba(15,163,163,0.5)]'
                : stage === 'responding'
                ? 'border-[#38BDF8] ring-4 ring-[#38BDF8]/20'
                : 'border-[#D9E1EA] hover:border-[#0FA3A3]'
            }`}
            aria-label={stage === 'listening' ? 'Stop listening' : 'Start speaking with MediAssist'}
          >
            {/* Logo Image */}
            <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
              <img
                src={mediassistLogo}
                alt="MediAssist AI"
                className={`w-full h-full object-contain transition-transform duration-300 ${
                  stage === 'listening' ? 'scale-110' : 'scale-100'
                }`}
              />

              {/* Status Overlay Icon Badge */}
              {stage === 'processing' && (
                <div className="absolute inset-0 bg-[#102A56]/60 backdrop-blur-2xs flex items-center justify-center rounded-full animate-fade-in">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              {stage === 'responding' && (
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#0FA3A3] text-white flex items-center justify-center shadow-md animate-bounce">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Right Audio Waveform Bars (Mirror gradient) */}
        <div className="flex items-center gap-1 sm:gap-1.5 h-24 justify-start flex-1">
          {animatedBars.slice(0, 10).reverse().map((height, i) => (
            <div
              key={`right-bar-${i}`}
              className="w-1 sm:w-1.5 rounded-full bg-linear-to-t from-[#0FA3A3] via-[#38BDF8] to-[#818CF8] transition-all duration-100 shadow-2xs"
              style={{
                height: `${Math.max(8, height * 72)}px`,
                opacity: 1.0 - (i / 10) * 0.7,
              }}
            />
          ))}
        </div>
      </div>

      {/* 3. Timer & Action Helper */}
      <div className="flex flex-col items-center space-y-1">
        <div className="text-sm font-mono font-bold text-[#0FA3A3] tracking-widest px-3 py-1 rounded-lg bg-[#F4F8FC] border border-[#E7EDF4]">
          {formatTimer(recordingSeconds)}
        </div>
        <p className="text-xs text-[#8A98AA] pt-1">
          {stage === 'listening' ? 'Click logo when done speaking' : 'Tap logo anytime to talk'}
        </p>
      </div>
    </div>
  );
};
