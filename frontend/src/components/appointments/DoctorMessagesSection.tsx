import React, { useState } from 'react';
import {
  MessageSquareHeart,
  Stethoscope,
  Send,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
} from 'lucide-react';
import type { DoctorHealthMessage } from '../../types/appointments';

interface DoctorMessagesSectionProps {
  messages: DoctorHealthMessage[];
  loading?: boolean;
  onOpenSendMessage: (doctorName?: string) => void;
  onMarkRead?: (messageId: string) => void;
}

export const DoctorMessagesSection: React.FC<DoctorMessagesSectionProps> = ({
  messages,
  loading = false,
  onOpenSendMessage,
  onMarkRead,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string, isRead: boolean) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!isRead && onMarkRead) {
        onMarkRead(id);
      }
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shadow-2xs font-bold">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Doctor's Health Advice & Messages
            </h3>
            <p className="text-xs text-slate-500">
              Post-consultation instructions, care guidelines, and medical notes from your clinicians
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenSendMessage()}
          className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Message Doctor</span>
        </button>
      </div>

      {/* Message List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-pulse h-20" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="py-8 px-4 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center mx-auto shadow-2xs">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">No Doctor Messages Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Clinical care advice, lab report explanations, and prescription follow-up notes from your doctors will appear here.
          </p>
          <button
            type="button"
            onClick={() => onOpenSendMessage()}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Note to Doctor</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            return (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isExpanded
                    ? 'bg-slate-50/90 border-teal-400 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Header Row */}
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => toggleExpand(msg.id, msg.is_read)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {msg.doctor_image ? (
                      <img
                        src={msg.doctor_image}
                        alt={msg.doctor_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold flex items-center justify-center text-xs shrink-0">
                        {msg.doctor_name.replace('Dr.', '').trim().charAt(0) || 'D'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {msg.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(
                            msg.priority
                          )}`}
                        >
                          {msg.priority}
                        </span>
                        {!msg.is_read && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" title="Unread note" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        <span className="font-semibold text-slate-700">{msg.doctor_name}</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span>{msg.doctor_specialty}</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span>{msg.hospital}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      {msg.created_at}
                    </span>
                    <button type="button" className="p-1 text-slate-400 hover:text-slate-700">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Body Preview / Full Content */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs">
                  <p className={`text-slate-700 leading-relaxed ${isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
                    {msg.content}
                  </p>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Received on <strong>{msg.created_at}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSendMessage(msg.doctor_name);
                        }}
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs transition flex items-center gap-1 shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply / Ask Question</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
