import React from 'react';
import { Calendar, Clock, XCircle } from 'lucide-react';
import type { AppointmentSummaryStats } from '../../types/appointments';

interface AppointmentSummaryCardsProps {
  summary: AppointmentSummaryStats | null;
  loading?: boolean;
}

export const AppointmentSummaryCards: React.FC<AppointmentSummaryCardsProps> = ({
  summary,
  loading = false,
}) => {
  const cards = [
    {
      title: 'Upcoming Appointments',
      count: summary?.upcoming_count ?? 0,
      subtitle: 'Next 30 days',
      icon: <Calendar className="w-5 h-5" />,
      iconBg: 'bg-[#E8F8F5]',
      iconColor: 'text-[#0FA3A3]',
    },
    {
      title: 'This Month',
      count: summary?.this_month_count ?? 0,
      subtitle: 'Appointments',
      icon: <Calendar className="w-5 h-5" />,
      iconBg: 'bg-[#EEF2FF]',
      iconColor: 'text-[#6366F1]',
    },
    {
      title: 'Completed',
      count: summary?.completed_count ?? 0,
      subtitle: 'All time',
      icon: <Clock className="w-5 h-5" />,
      iconBg: 'bg-[#FFFBEB]',
      iconColor: 'text-[#D97706]',
    },
    {
      title: 'Cancelled',
      count: summary?.cancelled_count ?? 0,
      subtitle: 'All time',
      icon: <XCircle className="w-5 h-5" />,
      iconBg: 'bg-[#FEF2F2]',
      iconColor: 'text-[#EF4444]',
    },
  ];

  if (loading && !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 sm:p-5 animate-pulse space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
            <div className="h-6 bg-slate-100 rounded w-1/3"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 sm:p-5 shadow-[0_2px_12px_rgba(16,42,86,0.02)] hover:border-[#0FA3A3]/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
            >
              {card.icon}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#5F6F86] truncate">{card.title}</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#102A56] mt-1 tracking-tight">
              {card.count}
            </h3>
            <p className="text-[11px] text-[#8A98AA] mt-0.5">{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
