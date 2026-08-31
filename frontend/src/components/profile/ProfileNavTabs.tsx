import React from 'react';
import type { ProfileNavTab } from '../../types/profile';

interface ProfileNavTabsProps {
  activeTab: ProfileNavTab;
  onSelectTab: (tab: ProfileNavTab) => void;
}

const TABS: ProfileNavTab[] = [
  'Personal Information',
  'Security',
  'Preferences',
  'Connected Accounts',
];

export const ProfileNavTabs: React.FC<ProfileNavTabsProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-6 border-b border-[#E7EDF4] pb-1 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSelectTab(tab)}
            className={`relative pb-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
  );
};
