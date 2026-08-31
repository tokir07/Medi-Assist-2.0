import React, { useState, useRef, useEffect } from 'react';
import {
  Pill,
  Calendar,
  Droplet,
  Footprints,
  HeartPulse,
  Bell,
  Check,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import type { ReminderItem } from '../../types/reminders';

interface ReminderItemRowProps {
  reminder: ReminderItem;
  onComplete: (reminderId: string) => void;
  onSnooze?: (reminderId: string) => void;
  onDismiss?: (reminderId: string) => void;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (reminder: ReminderItem) => void;
  onViewAppointmentDetails?: (reminder: ReminderItem) => void;
  completing?: boolean;
}

export const getReminderTypeIcon = (type: string, iconType?: string | null) => {
  if (iconType === 'water') return <Droplet className="w-4 h-4 text-teal-600" />;
  if (iconType === 'walk') return <Footprints className="w-4 h-4 text-amber-600" />;
  if (iconType === 'blood') return <HeartPulse className="w-4 h-4 text-rose-600" />;

  switch (type.toLowerCase()) {
    case 'medication':
      return <Pill className="w-4 h-4 text-purple-600" />;
    case 'appointment':
      return <Calendar className="w-4 h-4 text-blue-600" />;
    case 'health task':
      return <Droplet className="w-4 h-4 text-teal-600" />;
    default:
      return <Bell className="w-4 h-4 text-teal-600" />;
  }
};

export const getReminderIconBg = (type: string, iconType?: string | null) => {
  if (iconType === 'water') return 'bg-teal-50 border-teal-200';
  if (iconType === 'walk') return 'bg-amber-50 border-amber-200';
  if (iconType === 'blood') return 'bg-rose-50 border-rose-200';

  switch (type.toLowerCase()) {
    case 'medication':
      return 'bg-purple-50 border-purple-200';
    case 'appointment':
      return 'bg-blue-50 border-blue-200';
    case 'health task':
      return 'bg-teal-50 border-teal-200';
    default:
      return 'bg-slate-50 border-slate-200';
  }
};

export const getCategoryBadgeStyle = (type: string) => {
  switch (type.toLowerCase()) {
    case 'medication':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'appointment':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'health task':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

export const ReminderItemRow: React.FC<ReminderItemRowProps> = ({
  reminder,
  onComplete,
  onSnooze,
  onDismiss,
  onEdit,
  onDelete,
  onViewAppointmentDetails,
  completing = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAppointment = reminder.reminder_type.toLowerCase() === 'appointment';
  const isMedication = reminder.reminder_type.toLowerCase() === 'medication';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 hover:border-teal-300 shadow-2xs hover:shadow-sm transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
      {/* Left Icon & Info */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${getReminderIconBg(
            reminder.reminder_type,
            reminder.icon_type
          )} shadow-2xs`}
        >
          {getReminderTypeIcon(reminder.reminder_type, reminder.icon_type)}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-xs sm:text-sm font-bold leading-tight ${
                reminder.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {reminder.title}
            </h4>

            {reminder.priority && reminder.priority !== 'Normal' && (
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  reminder.priority === 'Urgent'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {reminder.priority}
              </span>
            )}
          </div>

          {reminder.subtitle && (
            <p className="text-[11px] text-slate-500 truncate">{reminder.subtitle}</p>
          )}

          <div>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeStyle(
                reminder.reminder_type
              )}`}
            >
              {reminder.reminder_type}
            </span>
          </div>
        </div>
      </div>

      {/* Right Time, Action & Menu */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {/* Time / Scheduled */}
        <div className="text-left sm:text-right pr-1">
          <div className="text-xs sm:text-sm font-bold text-slate-900">
            {reminder.time_str}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {reminder.date_str ? reminder.date_str : reminder.recurrence || 'Daily'}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          {reminder.is_completed ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
          ) : isAppointment ? (
            <button
              type="button"
              onClick={() => onViewAppointmentDetails && onViewAppointmentDetails(reminder)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <span>View Visit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : isMedication ? (
            <button
              type="button"
              onClick={() => onComplete(reminder.id)}
              disabled={completing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Taken</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onComplete(reminder.id)}
              disabled={completing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
          )}

          {/* Overflow Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-20 animate-fadeIn text-xs">
                {!reminder.is_completed && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onComplete(reminder.id);
                      }}
                      className="w-full px-3.5 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      <span>Mark Completed</span>
                    </button>

                    {onSnooze && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onSnooze(reminder.id);
                        }}
                        className="w-full px-3.5 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Snooze (15 mins)</span>
                      </button>
                    )}

                    {onDismiss && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDismiss(reminder.id);
                        }}
                        className="w-full px-3.5 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dismiss Reminder</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(reminder);
                  }}
                  className="w-full px-3.5 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Reminder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(reminder);
                  }}
                  className="w-full px-3.5 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Reminder</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
