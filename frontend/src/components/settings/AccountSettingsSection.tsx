import React from 'react';
import {
  User,
  Lock,
  Bell,
  Globe,
  Clock,
  Palette,
  CheckSquare,
  Wifi,
  CloudDownload,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserSettings, UserSettingsUpdatePayload } from '../../types/settings';

interface AccountSettingsSectionProps {
  settings: UserSettings | null;
  onUpdate: (payload: UserSettingsUpdatePayload) => void;
  onOpenSecurityModal: () => void;
  onOpenNotificationsTab: () => void;
  onOpenClearCacheModal: () => void;
}

export const AccountSettingsSection: React.FC<AccountSettingsSectionProps> = ({
  settings,
  onUpdate,
  onOpenSecurityModal,
  onOpenNotificationsTab,
  onOpenClearCacheModal,
}) => {
  const navigate = useNavigate();

  const handleToggle = (key: keyof UserSettingsUpdatePayload, currentVal: boolean) => {
    onUpdate({ [key]: !currentVal });
  };

  return (
    <div className="space-y-6">
      {/* Account Settings Main List */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-5">
        {/* Row 1: Profile Settings */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F4F8]">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#B2F5EA]/60 text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                Profile Settings
              </h4>
              <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                Update your personal information, profile picture and contact details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/patient/profile')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:text-[#0FA3A3] hover:border-[#0FA3A3]/50 hover:bg-[#F7FAFF] text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <span>Manage Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Row 2: Login & Security */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F4F8]">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF5FF] border border-[#C3DAFE]/60 text-[#2F80ED] flex items-center justify-center shrink-0 shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                Login & Security
              </h4>
              <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                Manage your password, two-factor authentication and active sessions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSecurityModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:text-[#2F80ED] hover:border-[#2F80ED]/50 hover:bg-[#F7FAFF] text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <span>Manage Security</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Row 3: Notification Preferences */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F4F8]">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#F4F0FF] border border-[#E9D8FD]/60 text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                Notification Preferences
              </h4>
              <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                Choose how and when you want to receive notifications.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenNotificationsTab}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:text-[#8B5CF6] hover:border-[#8B5CF6]/50 hover:bg-[#F7FAFF] text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            <span>Manage Notifications</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Row 4: Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F4F8]">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#B2F5EA]/60 text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                Language
              </h4>
              <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                Select your preferred language.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={settings?.language || 'English (US)'}
              onChange={(e) => onUpdate({ language: e.target.value })}
              className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs font-bold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
            >
              <option value="English (US)">English (US)</option>
              <option value="English (UK)">English (UK)</option>
              <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
              <option value="Spanish (Español)">Spanish (Español)</option>
            </select>
          </div>
        </div>

        {/* Row 5: Time Zone */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F4F8]">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FFFDF5] border border-[#FEF3C7]/60 text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                Time Zone
              </h4>
              <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                Select your current time zone.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-56">
            <select
              value={settings?.time_zone || '(GMT+05:30) Asia/Kolkata'}
              onChange={(e) => onUpdate({ time_zone: e.target.value })}
              className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs font-bold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
            >
              <option value="(GMT+05:30) Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>
              <option value="(GMT+00:00) UTC">(GMT+00:00) UTC</option>
              <option value="(GMT-05:00) Eastern Time (US)">(GMT-05:00) Eastern Time</option>
              <option value="(GMT-08:00) Pacific Time (US)">(GMT-08:00) Pacific Time</option>
              <option value="(GMT+01:00) London / GMT">(GMT+01:00) London / GMT</option>
              <option value="(GMT+04:00) Dubai / Gulf">(GMT+04:00) Dubai / Gulf</option>
              <option value="(GMT+08:00) Singapore">(GMT+08:00) Singapore</option>
            </select>
          </div>
        </div>

        {/* Row 6: Appearance */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7]/60 text-[#E53E3E] flex items-center justify-center shrink-0 shadow-2xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                Appearance
              </h4>
              <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                Customize the look and feel of the application.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={settings?.appearance || 'Light Mode'}
              onChange={(e) => onUpdate({ appearance: e.target.value })}
              className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs font-bold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
            >
              <option value="Light Mode">Light Mode</option>
            </select>
          </div>
        </div>
      </div>

      {/* Application Preferences Section */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-5">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
          Application Preferences
        </h3>

        <div className="space-y-4">
          {/* Toggle 1: Auto-save Data */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] border border-[#B2F5EA]/60 text-[#1FA774] flex items-center justify-center shrink-0 shadow-2xs">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Auto-save Data
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Automatically save your data while you work.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('auto_save', settings?.auto_save ?? true)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.auto_save ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
              aria-label="Toggle Auto-save Data"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.auto_save ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Low Data Mode */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#F4F0FF] border border-[#E9D8FD]/60 text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Low Data Mode
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Reduce data usage for a better experience on slow connections.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('low_data_mode', settings?.low_data_mode ?? false)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.low_data_mode ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
              aria-label="Toggle Low Data Mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.low_data_mode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 3: Download over Wi-Fi Only */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF5FF] border border-[#C3DAFE]/60 text-[#2F80ED] flex items-center justify-center shrink-0 shadow-2xs">
                <CloudDownload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Download over Wi-Fi Only
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Prevent downloads when using mobile data.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('download_wifi_only', settings?.download_wifi_only ?? true)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.download_wifi_only ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
              aria-label="Toggle Download over Wi-Fi Only"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.download_wifi_only ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Row 4: Clear Cache */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#FFFDF5] border border-[#FEF3C7]/60 text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Clear Cache
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Clear temporary files and cached data.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenClearCacheModal}
              className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:text-[#D97706] hover:border-[#D97706]/50 hover:bg-[#FFFDF5] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
