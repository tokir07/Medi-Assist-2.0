import React from 'react';
import { Bell, Pill, Calendar, CheckSquare, CheckCircle2 } from 'lucide-react';
import type { ReminderSummaryStats } from '../../types/reminders';

interface ReminderSummaryCardsProps {
  summary: ReminderSummaryStats | null;
  loading?: boolean;
}

export const ReminderSummaryCards: React.FC<ReminderSummaryCardsProps> = ({
  summary,
  loading = false,
}) => {
  const cards = [
    {
      title: 'All Reminders',
      count: summary?.all_active_count ?? 0,
      subtitle: 'Active',
      icon: <Bell className="w-4 h-4 text-teal-600" />,
      iconBg: 'bg-teal-50 border-teal-200',
      tagColor: 'text-teal-700',
    },
    {
      title: 'Medications',
      count: summary?.medications_active_count ?? 0,
      subtitle: 'Active',
      icon: <Pill className="w-4 h-4 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-200',
      tagColor: 'text-purple-700',
    },
    {
      title: 'Appointments',
      count: summary?.appointments_upcoming_count ?? 0,
      subtitle: 'Upcoming',
      icon: <Calendar className="w-4 h-4 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-200',
      tagColor: 'text-blue-700',
    },
    {
      title: 'Health Tasks',
      count: summary?.health_tasks_active_count ?? 0,
      subtitle: 'Active',
      icon: <CheckSquare className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-200',
      tagColor: 'text-amber-700',
    },
    {
      title: 'Completed',
      count: summary?.completed_this_month_count ?? 0,
      subtitle: 'Logged',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-200',
      tagColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm transition-all flex items-start gap-3 justify-between"
        >
          <div className="space-y-1 min-w-0">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">
              {loading ? '-' : c.count}
            </div>
            <div className="text-xs font-bold text-slate-900 truncate">
              {c.title}
            </div>
            <div className={`text-[11px] font-bold ${c.tagColor}`}>
              {c.subtitle}
            </div>
          </div>

          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${c.iconBg} shadow-2xs`}
          >
            {c.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
