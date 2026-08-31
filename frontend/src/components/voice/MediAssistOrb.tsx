import React, { useEffect, useState } from 'react';
import { Mic, Activity, Loader2, Volume2, Sparkles, MessageSquare, ShieldCheck, Calendar, RefreshCw } from 'lucide-react';
import type { ConversationalState } from '../../services/voiceAssistantService';
import mediassistEmblem from '../../assets/image.png';

interface MediAssistOrbProps {
  state: ConversationalState;
  amplitude?: number;
  frequencies?: number[];
  onOrbClick: () => void;
  isMuted?: boolean;
}

export const MediAssistOrb: React.FC<MediAssistOrbProps> = ({
  state,
  amplitude = 0,
  frequencies = [],
  onOrbClick,
  isMuted = false,
}) => {
  const [animatedBars, setAnimatedBars] = useState<number[]>(new Array(16).fill(0.25));

  // Frequency wave calculations for the side aura
  useEffect(() => {
    if (state === 'USER_SPEAKING' || state === 'ACTIVE_LISTENING') {
      if (frequencies.length > 0) {
        setAnimatedBars(frequencies.slice(0, 16));
      } else {
        const interval = setInterval(() => {
          setAnimatedBars(
            Array.from({ length: 16 }, (_, i) => {
              const base = 0.2 + (amplitude * 0.8) + Math.sin(Date.now() / 160 + i * 0.45) * 0.3;
              return Math.max(0.15, Math.min(1.0, base));
            })
          );
        }, 75);
        return () => clearInterval(interval);
      }
    } else if (state === 'AI_SPEAKING') {
      const interval = setInterval(() => {
        setAnimatedBars(
          Array.from({ length: 16 }, (_, i) => {
            const wave = 0.35 + Math.sin(Date.now() / 130 + i * 0.4) * 0.5 + Math.random() * 0.15;
            return Math.max(0.2, Math.min(0.95, wave));
          })
        );
      }, 85);
      return () => clearInterval(interval);
    } else {
      setAnimatedBars(new Array(16).fill(0.18));
    }
  }, [state, frequencies, amplitude]);

  // Floating Speech Bubble atop the Orb (Matching Reference Image)
  const getBubbleConfig = () => {
    switch (state) {
      case 'USER_SPEAKING':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />,
          text: 'Listening...',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          shadowColor: 'shadow-emerald-100',
        };
      case 'ACTIVE_LISTENING':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />,
          text: 'Listening...',
          textColor: 'text-teal-700',
          borderColor: 'border-teal-200',
          shadowColor: 'shadow-teal-100',
        };
      case 'AI_PROCESSING':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />,
          text: 'Thinking...',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          shadowColor: 'shadow-blue-100',
        };
      case 'AI_SPEAKING':
        return {
          icon: <Volume2 className="w-3.5 h-3.5 text-purple-600 animate-bounce" />,
          text: 'Speaking...',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200',
          shadowColor: 'shadow-purple-100',
        };
      case 'ENDED':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-teal-600" />,
          text: 'Start New Conversation',
          textColor: 'text-[#102A56]',
          borderColor: 'border-[#E2E8F0]',
          shadowColor: 'shadow-slate-100',
        };
      default:
        return {
          icon: <Mic className="w-3.5 h-3.5 text-[#0FA3A3]" />,
          text: 'Tap to speak',
          textColor: 'text-[#102A56]',
          borderColor: 'border-[#E2E8F0]',
          shadowColor: 'shadow-slate-100',
        };
    }
  };

  const bubble = getBubbleConfig();

  // Dynamic visual styling for orb states
  const getOrbStateStyling = () => {
    switch (state) {
      case 'USER_SPEAKING':
        return {
          auraGlow: 'bg-emerald-400/40',
          ring1Border: 'border-emerald-300 ring-emerald-100/90',
          ring2Gradient: 'from-emerald-200/60 via-teal-100/40 to-transparent',
          buttonRing: 'ring-emerald-400/40 border-emerald-400 shadow-[0_12px_45px_rgba(16,185,129,0.4)]',
          waveformColor: 'from-emerald-500 via-teal-400 to-cyan-400',
        };
      case 'ACTIVE_LISTENING':
        return {
          auraGlow: 'bg-teal-400/30',
          ring1Border: 'border-teal-300 ring-teal-100/70',
          ring2Gradient: 'from-teal-200/50 via-cyan-100/30 to-transparent',
          buttonRing: 'ring-teal-400/30 border-teal-400 shadow-[0_12px_36px_rgba(15,163,163,0.3)]',
          waveformColor: 'from-teal-500 via-cyan-400 to-sky-400',
        };
      case 'AI_PROCESSING':
        return {
          auraGlow: 'bg-blue-400/35',
          ring1Border: 'border-blue-300 ring-blue-100/80',
          ring2Gradient: 'from-blue-200/60 via-indigo-100/40 to-transparent',
          buttonRing: 'ring-blue-400/30 border-blue-400 shadow-[0_12px_40px_rgba(59,130,246,0.35)]',
          waveformColor: 'from-blue-500 via-sky-400 to-teal-400',
        };
      case 'AI_SPEAKING':
        return {
          auraGlow: 'bg-purple-400/40',
          ring1Border: 'border-purple-300 ring-purple-100/90',
          ring2Gradient: 'from-purple-200/60 via-purple-100/40 to-transparent',
          buttonRing: 'ring-purple-400/30 border-purple-300 shadow-[0_12px_45px_rgba(168,85,247,0.4)]',
          waveformColor: 'from-purple-500 via-indigo-400 to-cyan-400',
        };
      default:
        return {
          auraGlow: 'bg-[#0FA3A3]/20',
          ring1Border: 'border-[#0FA3A3]/30 ring-[#E6F7F7]',
          ring2Gradient: 'from-[#0FA3A3]/20 via-[#38BDF8]/10 to-transparent',
          buttonRing: 'ring-[#0FA3A3]/20 border-[#D9E1EA] hover:border-[#0FA3A3] shadow-[0_12px_36px_rgba(15,163,163,0.2)]',
          waveformColor: 'from-[#0FA3A3] via-[#38BDF8] to-[#818CF8]',
        };
    }
  };

  const orbStyle = getOrbStateStyling();

  // Dynamic Scale calculation based on audio amplitude (Smoothed & Jitter-free)
  const dynamicScale =
    state === 'USER_SPEAKING' || state === 'AI_SPEAKING'
      ? 1.0 + Math.min(amplitude * 0.35, 0.25)
      : state === 'ACTIVE_LISTENING'
      ? 1.02
      : 1.0;

  const getSubtext = () => {
    switch (state) {
      case 'USER_SPEAKING':
      case 'ACTIVE_LISTENING':
        return "I'm listening. Speak naturally about your health or MediAssist.";
      case 'AI_PROCESSING':
        return 'Analyzing your message...';
      case 'AI_SPEAKING':
        return "Here's my response. (You can speak anytime to interrupt)";
      case 'ENDED':
        return 'Voice conversation ended. Click orb to talk again.';
      default:
        return "I'm here to listen and help you with your health";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 select-none w-full">
      {/* 1. Floating Speech Bubble Tooltip atop the Orb */}
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`px-4 py-1.5 rounded-full bg-white border ${bubble.borderColor} ${bubble.shadowColor} shadow-md flex items-center gap-2 text-xs font-bold ${bubble.textColor} transition-all duration-200`}
        >
          {bubble.icon}
          <span>{bubble.text}</span>
        </div>
        <div className={`w-2 h-2 bg-white border-r border-b ${bubble.borderColor} rotate-45 -mt-1 shadow-2xs`} />
      </div>

      {/* 2. Main Central AI Orb with Dynamic Audio-Reactive Waveforms */}
      <div className="relative flex items-center justify-center w-full max-w-2xl py-2">
        {/* Left Audio Waveform / Dot Matrix Aura */}
        <div className="flex items-center gap-1 sm:gap-1.5 h-32 justify-end flex-1 pr-2 sm:pr-4">
          {animatedBars.slice(0, 12).map((height, i) => (
            <div
              key={`left-wave-${i}`}
              className={`w-1 sm:w-1.5 rounded-full bg-linear-to-t ${orbStyle.waveformColor} transition-all duration-100 shadow-2xs`}
              style={{
                height: `${Math.max(6, height * 88)}px`,
                opacity: 0.2 + (i / 12) * 0.8,
              }}
            />
          ))}
        </div>

        {/* The Central Multilayered AI Orb */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Ambient Glow Aura */}
          <div
            className={`absolute -inset-8 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${orbStyle.auraGlow}`}
            style={{ transform: `scale(${dynamicScale * 1.15})` }}
          />

          {/* Outer Ring 1 (Large halo boundary) */}
          <div
            className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 ${orbStyle.ring1Border} bg-linear-to-tr ${orbStyle.ring2Gradient} flex items-center justify-center transition-all duration-300 shadow-inner`}
            style={{ transform: `scale(${dynamicScale})` }}
          >
            {/* Inner Ring 2 (Glass bezel ring) */}
            <div className="w-44 h-44 sm:w-50 sm:h-50 rounded-full border border-white/80 bg-white/40 backdrop-blur-xs flex items-center justify-center shadow-lg transition-all duration-300">
              {/* Central White Dome Button holding MediAssist Logo */}
              <button
                type="button"
                onClick={onOrbClick}
                className={`relative w-36 h-36 sm:w-42 sm:h-42 rounded-full bg-white p-3 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border-2 hover:scale-105 active:scale-95 ${orbStyle.buttonRing}`}
                aria-label="MediAssist AI Voice Assistant Orb"
              >
                {/* MediAssist Emblem */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                  <img
                    src={mediassistEmblem}
                    alt="MediAssist Emblem"
                    className="w-full h-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${state === 'USER_SPEAKING' || state === 'AI_SPEAKING' ? 1.08 : 1.0})` }}
                  />

                  {/* Processing Spinner Overlay */}
                  {state === 'AI_PROCESSING' && (
                    <div className="absolute inset-0 bg-white/75 backdrop-blur-2xs rounded-full flex items-center justify-center">
                      <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>

                {/* MediAssist Brand Wordmark */}
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#102A56] mt-0.5">
                  Medi<span className="text-[#0FA3A3]">Assist</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Audio Waveform / Dot Matrix Aura */}
        <div className="flex items-center gap-1 sm:gap-1.5 h-32 justify-start flex-1 pl-2 sm:pr-4">
          {animatedBars
            .slice(0, 12)
            .reverse()
            .map((height, i) => (
              <div
                key={`right-wave-${i}`}
                className={`w-1 sm:w-1.5 rounded-full bg-linear-to-t ${orbStyle.waveformColor} transition-all duration-100 shadow-2xs`}
                style={{
                  height: `${Math.max(6, height * 88)}px`,
                  opacity: 1.0 - (i / 12) * 0.8,
                }}
              />
            ))}
        </div>
      </div>

      {/* 3. Dynamic Subtitle */}
      <div className="text-center space-y-1">
        <p className="text-xs sm:text-sm font-semibold text-[#5F6F86] max-w-md">
          {getSubtext()}
        </p>
      </div>

      {/* 4. Three Healthcare Feature Badges (Matching Reference Image) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-2 w-full max-w-lg">
        <div className="flex flex-col items-center text-center space-y-1.5 p-2.5 rounded-2xl bg-[#FCFDFE] border border-[#E7EDF4]/80 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-[#E6F4F4] text-[#0FA3A3] flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-[#102A56] leading-tight">
            Natural<br />Conversation
          </span>
        </div>

        <div className="flex flex-col items-center text-center space-y-1.5 p-2.5 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#E7EDF4]/80 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-white text-[#2563EB] flex items-center justify-center shadow-2xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-[#102A56] leading-tight">
            Health<br />Insights
          </span>
        </div>

        <div className="flex flex-col items-center text-center space-y-1.5 p-2.5 rounded-2xl bg-[#F0FDF4] text-[#16A34A] border border-[#E7EDF4]/80 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-white text-[#16A34A] flex items-center justify-center shadow-2xs">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-[#102A56] leading-tight">
            Appointments<br />& More
          </span>
        </div>
      </div>
    </div>
  );
};
