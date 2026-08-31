import React from 'react';
import { Plus } from 'lucide-react';
import type { ReminderTab } from '../../types/reminders';

interface ReminderTabsProps {
  activeTab: ReminderTab;
  onSelectTab: (tab: ReminderTab) => void;
  onOpenAddModal: () => void;
}

const TABS: ReminderTab[] = [
  'All Reminders',
  'Medications',
  'Appointments',
  'Health Tasks',
  'Custom',
];

export const ReminderTabs: React.FC<ReminderTabsProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EDF4] pb-1">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`relative pb-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-[#0FA3A3] font-bold'
                  : 'text-[#5F6F86] hover:text-[#102A56]'
              }`}
            >
              <span>{tab}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA3A3] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Add Reminder CTA */}
      <div className="pb-2 sm:pb-0">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0FA3A3] hover:bg-[#0D8E8E] active:bg-[#0A7373] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>
    </div>
  );
};
