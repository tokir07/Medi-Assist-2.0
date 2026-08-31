import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface ContinueConversationCardProps {
  conversation?: {
    last_user_message: string;
    last_ai_response: string;
    timestamp: string;
  };
}

export const ContinueConversationCard: React.FC<ContinueConversationCardProps> = ({
  conversation = {
    last_user_message: 'How can I manage mild joint soreness after workouts?',
    last_ai_response: 'Gentle stretching, proper hydration, and warm compresses can support recovery...',
    timestamp: 'Today, 09:15 AM',
  },
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Recent AI Consultation
          </h3>
        </div>
        <Link
          to="/patient/consultation"
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 transition"
        >
          <span>Open Chat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Message Preview Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <div className="space-y-1">
          <p className="text-slate-700 leading-relaxed">
            <strong className="text-slate-900">You:</strong> {conversation.last_user_message}
          </p>
          <p className="text-slate-600 leading-relaxed">
            <strong className="text-teal-700">MediAssist:</strong> {conversation.last_ai_response}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-medium">{conversation.timestamp}</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={() => navigate('/patient/consultation')}
        className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
      >
        <span>Continue Discussion</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
