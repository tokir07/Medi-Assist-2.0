import React from 'react';
import { Pill, Calendar, CheckSquare, Bell, ChevronRight } from 'lucide-react';
import type { ReminderType } from '../../types/reminders';

interface QuickActionsPanelProps {
  onOpenAddModalWithType: (type: ReminderType) => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onOpenAddModalWithType,
}) => {
  const actions: {
    type: ReminderType;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
  }[] = [
    {
      type: 'Medication',
      title: 'Add Medication Reminder',
      subtitle: 'Set up medication schedule',
      icon: <Pill className="w-4 h-4 text-[#0FA3A3]" />,
      iconBg: 'bg-[#E8F8F5] border-[#B2F5EA]/60',
    },
    {
      type: 'Appointment',
      title: 'Add Appointment Reminder',
      subtitle: 'Schedule upcoming appointment',
      icon: <Calendar className="w-4 h-4 text-[#2F80ED]" />,
      iconBg: 'bg-[#EEF5FF] border-[#C3DAFE]/60',
    },
    {
      type: 'Health Task',
      title: 'Add Health Task',
      subtitle: 'Create a health goal or task',
      icon: <CheckSquare className="w-4 h-4 text-[#1FA774]" />,
      iconBg: 'bg-[#E8F8F5] border-[#B2F5EA]/60',
    },
    {
      type: 'Custom',
      title: 'Add Custom Reminder',
      subtitle: 'Set a custom reminder',
      icon: <Bell className="w-4 h-4 text-[#8B5CF6]" />,
      iconBg: 'bg-[#F4F0FF] border-[#E9D8FD]/60',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Quick Actions</h3>

      <div className="space-y-2">
        {actions.map((act) => (
          <button
            key={act.title}
            type="button"
            onClick={() => onOpenAddModalWithType(act.type)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F7FAFF] border border-transparent hover:border-[#E7EDF4] transition-all duration-150 cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${act.iconBg} shadow-2xs`}>
                {act.icon}
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors block truncate">
                  {act.title}
                </span>
                <span className="text-[11px] text-[#5F6F86] block truncate">
                  {act.subtitle}
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#8A98AA] group-hover:text-[#0FA3A3] shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
