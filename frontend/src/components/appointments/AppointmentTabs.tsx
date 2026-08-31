import React from 'react';
import { Plus } from 'lucide-react';
import type { AppointmentTab } from '../../types/appointments';

interface AppointmentTabsProps {
  activeTab: AppointmentTab;
  onTabChange: (tab: AppointmentTab) => void;
  onBookAppointment: () => void;
}

export const AppointmentTabs: React.FC<AppointmentTabsProps> = ({
  activeTab,
  onTabChange,
  onBookAppointment,
}) => {
  const tabs: AppointmentTab[] = ['Upcoming', 'Past', 'Cancelled'];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EDF4] pb-2">
      {/* Tabs */}
      <div className="flex items-center gap-6 sm:gap-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`relative pb-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#0FA3A3]'
                  : 'text-[#5F6F86] hover:text-[#102A56]'
              }`}
            >
              <span>{tab}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA3A3] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={onBookAppointment}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0FA3A3] hover:bg-[#0D8E8E] active:bg-[#0B7A7A] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer shrink-0"
      >
        <Plus className="w-4 h-4" />
        <span>Book Appointment</span>
      </button>
    </div>
  );
};
