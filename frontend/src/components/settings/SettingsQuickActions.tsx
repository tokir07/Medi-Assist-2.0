import React from 'react';
import { Lock, Shield, Clock, Smartphone, ChevronRight } from 'lucide-react';

interface SettingsQuickActionsProps {
  onOpenPasswordModal: () => void;
  onOpen2FAModal: () => void;
  onOpenLoginHistoryModal: () => void;
  onOpenDevicesModal: () => void;
}

export const SettingsQuickActions: React.FC<SettingsQuickActionsProps> = ({
  onOpenPasswordModal,
  onOpen2FAModal,
  onOpenLoginHistoryModal,
  onOpenDevicesModal,
}) => {
  const actions = [
    {
      title: 'Change Password',
      subtitle: 'Update your account password',
      icon: <Lock className="w-4 h-4 text-[#2F80ED]" />,
      iconBg: 'bg-[#EEF5FF] border-[#C3DAFE]/60',
      onClick: onOpenPasswordModal,
    },
    {
      title: 'Two-Factor Authentication',
      subtitle: 'Add an extra layer of security',
      icon: <Shield className="w-4 h-4 text-[#0FA3A3]" />,
      iconBg: 'bg-[#E6F7F7] border-[#B2F5EA]/60',
      onClick: onOpen2FAModal,
    },
    {
      title: 'Login History',
      subtitle: 'View your recent login activity',
      icon: <Clock className="w-4 h-4 text-[#2F80ED]" />,
      iconBg: 'bg-[#EEF5FF] border-[#C3DAFE]/60',
      onClick: onOpenLoginHistoryModal,
    },
    {
      title: 'Manage Devices',
      subtitle: 'View and manage trusted devices',
      icon: <Smartphone className="w-4 h-4 text-[#8B5CF6]" />,
      iconBg: 'bg-[#F4F0FF] border-[#E9D8FD]/60',
      onClick: onOpenDevicesModal,
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
            onClick={act.onClick}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F7FAFF] border border-transparent hover:border-[#E7EDF4] transition-all duration-150 cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${act.iconBg} shadow-2xs`}
              >
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
