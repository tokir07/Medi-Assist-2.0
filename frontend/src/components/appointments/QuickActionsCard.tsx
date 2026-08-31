import React from 'react';
import { Calendar, Search, Building2, Bell } from 'lucide-react';

interface QuickActionsCardProps {
  onBookAppointment: () => void;
  onFindDoctor: () => void;
  onViewHospitals: () => void;
  onManageReminders: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onBookAppointment,
  onFindDoctor,
  onViewHospitals,
  onManageReminders,
}) => {
  const actions = [
    {
      title: 'Book Appointment',
      subtitle: 'Schedule a new appointment',
      icon: <Calendar className="w-4 h-4" />,
      iconBg: 'bg-[#EEF5FF]',
      iconColor: 'text-[#2F80ED]',
      onClick: onBookAppointment,
    },
    {
      title: 'Find Doctor',
      subtitle: 'Search doctors & specialists',
      icon: <Search className="w-4 h-4" />,
      iconBg: 'bg-[#E8F8F5]',
      iconColor: 'text-[#0FA3A3]',
      onClick: onFindDoctor,
    },
    {
      title: 'Hospital List',
      subtitle: 'View nearby hospitals',
      icon: <Building2 className="w-4 h-4" />,
      iconBg: 'bg-[#ECFDF5]',
      iconColor: 'text-[#10B981]',
      onClick: onViewHospitals,
    },
    {
      title: 'Appointment Reminders',
      subtitle: 'Manage your reminders',
      icon: <Bell className="w-4 h-4" />,
      iconBg: 'bg-[#EEF2FF]',
      iconColor: 'text-[#6366F1]',
      onClick: onManageReminders,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-5 shadow-[0_2px_12px_rgba(16,42,86,0.02)] space-y-3.5">
      <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Quick Actions</h3>

      <div className="space-y-2">
        {actions.map((act, idx) => (
          <button
            key={idx}
            type="button"
            onClick={act.onClick}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F4F8FC] border border-transparent hover:border-[#D9E1EA]/60 transition-all text-left cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-xl ${act.iconBg} ${act.iconColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
            >
              {act.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-[#102A56] leading-tight group-hover:text-[#0FA3A3] transition-colors truncate">
                {act.title}
              </h4>
              <p className="text-[11px] text-[#5F6F86] truncate mt-0.5">
                {act.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
