import React from 'react';
import { ReminderItemRow } from './ReminderItemRow';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReminderItem } from '../../types/reminders';

interface UpcomingRemindersSectionProps {
  reminders: ReminderItem[];
  onComplete: (id: string) => void;
  onSnooze?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (reminder: ReminderItem) => void;
  onViewAppointmentDetails?: (reminder: ReminderItem) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}

export const UpcomingRemindersSection: React.FC<UpcomingRemindersSectionProps> = ({
  reminders,
  onComplete,
  onSnooze,
  onDismiss,
  onEdit,
  onDelete,
  onViewAppointmentDetails,
  showAll,
  onToggleShowAll,
}) => {
  if (reminders.length === 0) return null;

  const displayList = showAll ? reminders : reminders.slice(0, 4);

  return (
    <div className="space-y-3.5 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Upcoming Reminders
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
            {reminders.length}
          </span>
        </div>

        {reminders.length > 4 && (
          <button
            type="button"
            onClick={onToggleShowAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 transition cursor-pointer"
          >
            <span>{showAll ? 'Show Less' : `View All (${reminders.length})`}</span>
            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {displayList.map((r) => (
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
    </div>
  );
};
