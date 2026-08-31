import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Bell } from 'lucide-react';
import type { ReminderItem } from '../../types/dashboard';
import { dashboardService } from '../../services/dashboardService';

interface TodayRemindersCardProps {
  initialReminders?: ReminderItem[];
}

export const TodayRemindersCard: React.FC<TodayRemindersCardProps> = ({
  initialReminders = [],
}) => {
  const [reminders, setReminders] = useState<ReminderItem[]>(initialReminders);

  useEffect(() => {
    setReminders(initialReminders);
  }, [initialReminders]);

  const toggleReminder = async (id: string) => {
    setReminders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );

    try {
      await dashboardService.toggleReminder(id);
    } catch (err) {
      console.error('Failed to toggle reminder on backend:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">Today's Reminders</h3>
        <Link
          to="/patient/reminders"
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      {reminders.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-9 h-9 mx-auto rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Bell className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-900">All caught up!</p>
          <p className="text-[11px] text-slate-500">No active reminders pending for today.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              onClick={() => toggleReminder(rem.id)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  aria-label={rem.completed ? "Mark incomplete" : "Mark complete"}
                  className="text-slate-400 hover:text-teal-600 shrink-0"
                >
                  {rem.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold leading-tight truncate ${
                      rem.completed ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {rem.title}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{rem.time}</p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                {rem.category || 'Medication'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
