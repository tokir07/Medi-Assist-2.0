import React, { useState, useEffect } from 'react';
import { X, History, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { remindersService } from '../../services/remindersService';
import type { ReminderHistoryItem } from '../../types/reminders';

interface ReminderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACTION_FILTERS = ['All', 'Completed', 'Taken', 'Skipped', 'Missed'];

export const ReminderHistoryModal: React.FC<ReminderHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<ReminderHistoryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      const fetchLogs = async () => {
        try {
          setLoading(true);
          const data = await remindersService.getHistory(
            activeFilter === 'All' ? undefined : activeFilter
          );
          setLogs(data.logs || []);
        } catch (err) {
          console.error('Failed to load reminder history:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchLogs();
    }
  }, [isOpen, activeFilter]);

  if (!isOpen) return null;

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'completed':
      case 'taken':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1FA774] bg-[#E8F8F5] border border-[#B2F5EA]/60 px-2.5 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3" />
            <span>{action}</span>
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FFFDF5] border border-[#FEF3C7]/60 px-2.5 py-0.5 rounded-md">
            <Clock className="w-3 h-3" />
            <span>Skipped</span>
          </span>
        );
      case 'missed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E53E3E] bg-[#FFF5F5] border border-[#FED7D7]/60 px-2.5 py-0.5 rounded-md">
            <XCircle className="w-3 h-3" />
            <span>Missed</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold text-[#5F6F86] bg-[#F4F8FC] px-2 py-0.5 rounded-md">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102A56]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-[#D9E1EA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EDF4] flex items-center justify-between bg-[#F7FAFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF5FF] text-[#2F80ED] flex items-center justify-center shrink-0 shadow-2xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#102A56]">
                Reminder History
              </h2>
              <p className="text-[11px] text-[#5F6F86]">
                Past completion and adherence records
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5F6F86] hover:text-[#102A56] hover:bg-[#E7EDF4] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 border-b border-[#F0F4F8] flex items-center gap-2 overflow-x-auto bg-white">
          {ACTION_FILTERS.map((filter) => {
            const isSel = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSel
                    ? 'bg-[#102A56] text-white shadow-2xs'
                    : 'bg-[#F7FAFF] text-[#5F6F86] hover:bg-[#EEF5FF] border border-[#E7EDF4]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* List Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] space-y-2 animate-pulse"
                >
                  <div className="w-1/2 h-4 bg-[#E8EEF5] rounded" />
                  <div className="w-1/4 h-3 bg-[#E8EEF5] rounded" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-[#8A98AA] mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-[#102A56]">
                No history entries found
              </p>
              <p className="text-[11px] text-[#5F6F86]">
                Completed and skipped reminders will be logged here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#102A56] truncate">
                        {log.reminder_title}
                      </span>
                      <span className="text-[10px] text-[#8A98AA] font-semibold">
                        ({log.reminder_type})
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5F6F86]">
                      Scheduled at {log.scheduled_time} • {new Date(log.logged_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="shrink-0">{getActionBadge(log.action)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E7EDF4] bg-[#F7FAFF] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#D9E1EA] text-xs font-semibold text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
