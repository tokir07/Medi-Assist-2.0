import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, Activity } from 'lucide-react';

export const VoiceInteractionCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Voice Assistant</h3>
            <p className="text-[10px] text-slate-500">Hands-free clinical voice triage</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
          Ready
        </span>
      </div>

      {/* Voice Visualizer Preview */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
          <Mic className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">Natural Voice Consultation</p>
          <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
            Speak naturally to describe symptoms, request medication guidelines, or ask follow-up questions.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => navigate('/patient/voice')}
        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
      >
        <span>Open Voice Assistant</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
