import React, { useState } from 'react';
import { X, Bell, Check } from 'lucide-react';

interface AppointmentRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentRemindersModal: React.FC<AppointmentRemindersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [remind24h, setRemind24h] = useState(true);
  const [remind2h, setRemind2h] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#F4F8FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shadow-2xs">
              <Bell className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102A56]">
                Appointment Reminders
              </h3>
              <p className="text-xs text-[#5F6F86]">
                Configure consultation alerts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Options */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <div className="space-y-3">
            <label className="font-bold text-[#102A56] block text-xs">
              Notification Timing
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#D9E1EA] hover:bg-[#F4F8FC] transition-colors cursor-pointer">
              <span className="text-[#102A56] font-semibold">24 hours before appointment</span>
              <input
                type="checkbox"
                checked={remind24h}
                onChange={(e) => setRemind24h(e.target.checked)}
                className="w-4 h-4 accent-[#0FA3A3] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#D9E1EA] hover:bg-[#F4F8FC] transition-colors cursor-pointer">
              <span className="text-[#102A56] font-semibold">2 hours before appointment</span>
              <input
                type="checkbox"
                checked={remind2h}
                onChange={(e) => setRemind2h(e.target.checked)}
                className="w-4 h-4 accent-[#0FA3A3] rounded"
              />
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <label className="font-bold text-[#102A56] block text-xs">
              Channels
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#D9E1EA] hover:bg-[#F4F8FC] transition-colors cursor-pointer">
              <span className="text-[#102A56] font-semibold">SMS & WhatsApp Alerts</span>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#0FA3A3] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#D9E1EA] hover:bg-[#F4F8FC] transition-colors cursor-pointer">
              <span className="text-[#102A56] font-semibold">Email Summary & Directions</span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#0FA3A3] rounded"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#F4F8FC] flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Preferences Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
