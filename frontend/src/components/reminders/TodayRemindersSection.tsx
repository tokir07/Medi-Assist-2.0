import React from 'react';
import { ReminderItemRow } from './ReminderItemRow';
import { CheckCheck, CheckCircle2, Plus } from 'lucide-react';
import type { ReminderItem } from '../../types/reminders';

interface TodayRemindersSectionProps {
  reminders: ReminderItem[];
  onComplete: (id: string) => void;
  onSnooze?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (reminder: ReminderItem) => void;
  onViewAppointmentDetails?: (reminder: ReminderItem) => void;
  onMarkAllCompleted: () => void;
  onOpenAddModal: () => void;
  loading?: boolean;
}

export const TodayRemindersSection: React.FC<TodayRemindersSectionProps> = ({
  reminders,
  onComplete,
  onSnooze,
  onDismiss,
  onEdit,
  onDelete,
  onViewAppointmentDetails,
  onMarkAllCompleted,
  onOpenAddModal,
}) => {
  const pendingCount = reminders.filter((r) => !r.is_completed).length;

  return (
    <div className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Today's Reminders
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold flex items-center justify-center">
            {reminders.length}
          </span>
        </div>

        {/* Mark All as Completed Action */}
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllCompleted}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 transition cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Completed</span>
          </button>
        )}
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">No reminders scheduled for today</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up with your scheduled medications, appointments, and health tasks.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Reminder</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((r) => (
            <ReminderItemRow
              key={r.id}
              reminder={r}
              onComplete={onComplete}
              onSnooze={onSnooze}
              onDismiss={onDismiss}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewAppointmentDetails={onViewAppointmentDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
