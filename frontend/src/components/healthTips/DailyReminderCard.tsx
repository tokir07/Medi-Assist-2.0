import React, { useState } from 'react';
import { Bell, Loader2, Check } from 'lucide-react';
import type { DailyTipReminderSettings } from '../../types/healthTips';

interface DailyReminderCardProps {
  settings: DailyTipReminderSettings;
  onUpdateSettings: (updated: { is_enabled?: boolean; preferred_time?: string }) => Promise<void>;
  loading?: boolean;
}

const timeOptions = [
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '12:00 PM',
  '02:00 PM',
  '05:00 PM',
  '08:00 PM',
];

export const DailyReminderCard: React.FC<DailyReminderCardProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [updating, setUpdating] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleToggle = async () => {
    try {
      setUpdating(true);
      await onUpdateSettings({ is_enabled: !settings.is_enabled });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTime = e.target.value;
    try {
      setUpdating(true);
      await onUpdateSettings({ preferred_time: newTime });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error('Failed to change reminder time:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-4">
      {/* Header & Toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-[#102A56]">Daily Tip Reminder</h3>
            <p className="text-[11px] text-[#5F6F86] mt-0.5 leading-relaxed">
              Get daily health tips and stay on track with your goals.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={updating}
          aria-label="Toggle daily tip reminder"
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            settings.is_enabled ? 'bg-[#0FA3A3]' : 'bg-[#D9E1EA]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              settings.is_enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Preferred Time Selector */}
      {settings.is_enabled && (
        <div className="pt-2 border-t border-[#F0F4F8] space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="preferred-time-select" className="text-[11px] font-semibold text-[#5F6F86]">
              Preferred Time
            </label>
            {updating ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#0FA3A3]">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Saving...
              </span>
            ) : justSaved ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#1FA774] font-medium">
                <Check className="w-2.5 h-2.5" />
                Saved
              </span>
            ) : null}
          </div>

          <select
            id="preferred-time-select"
            value={settings.preferred_time || '08:00 AM'}
            onChange={handleTimeChange}
            disabled={updating}
            className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm font-semibold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
