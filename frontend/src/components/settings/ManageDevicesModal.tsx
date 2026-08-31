import React, { useState, useEffect } from 'react';
import { X, Smartphone, Laptop, AlertCircle, Loader2 } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import type { DeviceSessionItem } from '../../types/settings';

interface ManageDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageDevicesModal: React.FC<ManageDevicesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [devices, setDevices] = useState<DeviceSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getDevices();
      setDevices(data || []);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRevoke = async (id: string) => {
    try {
      setRevokingId(id);
      await settingsService.revokeDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to revoke device session:', err);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102A56]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[#D9E1EA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EDF4] flex items-center justify-between bg-[#F7FAFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F4F0FF] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#102A56]">
                Manage Devices
              </h2>
              <p className="text-[11px] text-[#5F6F86]">
                Devices and active sessions authorized on your account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5F6F86] hover:text-[#102A56] hover:bg-[#E7EDF4] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] space-y-2 animate-pulse"
                >
                  <div className="w-1/2 h-4 bg-[#E8EEF5] rounded" />
                  <div className="w-1/3 h-3 bg-[#E8EEF5] rounded" />
                </div>
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-[#8A98AA] mx-auto" />
              <p className="text-xs font-bold text-[#102A56]">No active device sessions</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#D9E1EA] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs">
                      {dev.device_name.toLowerCase().includes('mobile') ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Laptop className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#102A56] truncate">
                          {dev.device_name}
                        </span>
                        {dev.is_current && (
                          <span className="text-[10px] font-bold text-[#1FA774] bg-[#E8F8F5] px-2 py-0.5 rounded-md border border-[#B2F5EA]/60">
                            Current Session
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#5F6F86] block">
                        {dev.location} • {dev.browser}
                      </span>
                      <span className="text-[10px] text-[#8A98AA] block">
                        Last active {new Date(dev.last_active).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!dev.is_current && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(dev.id)}
                      disabled={revokingId === dev.id}
                      className="px-3 py-1.5 rounded-xl border border-[#FED7D7] bg-white text-xs font-bold text-[#E53E3E] hover:bg-[#FFF5F5] transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {revokingId === dev.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Revoke'
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E7EDF4] bg-[#F7FAFF] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#D9E1EA] text-xs font-semibold text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
