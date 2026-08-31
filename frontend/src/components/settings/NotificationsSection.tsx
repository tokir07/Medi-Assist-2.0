import React from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Calendar, Pill, Lightbulb } from 'lucide-react';
import type { UserSettings, UserSettingsUpdatePayload } from '../../types/settings';

interface NotificationsSectionProps {
  settings: UserSettings | null;
  onUpdate: (payload: UserSettingsUpdatePayload) => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  settings,
  onUpdate,
}) => {
  const handleToggle = (key: keyof UserSettingsUpdatePayload, currentVal: boolean) => {
    onUpdate({ [key]: !currentVal });
  };

  return (
    <div className="space-y-6">
      {/* Channels Section */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-5">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
          Notification Channels
        </h3>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF5FF] border border-[#C3DAFE]/60 text-[#2F80ED] flex items-center justify-center shrink-0 shadow-2xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Email Notifications
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Receive appointment summaries, records, and prescriptions via email.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('email_notifications', settings?.email_notifications ?? true)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.email_notifications ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.email_notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#B2F5EA]/60 text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Push Notifications
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Receive instant alerts on your desktop browser and mobile device.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('push_notifications', settings?.push_notifications ?? true)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.push_notifications ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.push_notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* SMS Alerts */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#FFFDF5] border border-[#FEF3C7]/60 text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  SMS Notifications
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Receive urgent appointment reminders and authentication OTPs via text.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('sms_notifications', settings?.sms_notifications ?? false)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.sms_notifications ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.sms_notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Categories Section */}
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-5">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
          Alert Preferences
        </h3>

        <div className="space-y-4">
          {/* Appointment Reminders */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF5FF] border border-[#C3DAFE]/60 text-[#2F80ED] flex items-center justify-center shrink-0 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Appointment Reminders
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Alerts before scheduled doctor consultations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('appointment_reminders', settings?.appointment_reminders ?? true)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.appointment_reminders ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.appointment_reminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Medication Reminders */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#F4F0FF] border border-[#E9D8FD]/60 text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Medication Dose Alerts
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Reminders for prescribed medicine timings.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('medication_reminders', settings?.medication_reminders ?? true)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.medication_reminders ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.medication_reminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Health Tip Notifications */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] border border-[#B2F5EA]/60 text-[#1FA774] flex items-center justify-center shrink-0 shadow-2xs">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Daily Health Tips & Wellness
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Curated health advice and seasonal wellness reminders.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('health_tip_notifications', settings?.health_tip_notifications ?? true)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.health_tip_notifications ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.health_tip_notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
