import React from 'react';
import { Lock, Shield, Smartphone, KeyRound, Download, ChevronRight } from 'lucide-react';
import type { UserSettings } from '../../types/settings';

interface PrivacySecuritySectionProps {
  settings: UserSettings | null;
  onOpenPasswordModal: () => void;
  onOpen2FAModal: () => void;
  onOpenDevicesModal: () => void;
}

export const PrivacySecuritySection: React.FC<PrivacySecuritySectionProps> = ({
  settings,
  onOpenPasswordModal,
  onOpen2FAModal,
  onOpenDevicesModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-5">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
          Security & Access Control
        </h3>

        <div className="space-y-4">
          {/* Change Password */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F4F8]">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF5FF] border border-[#C3DAFE]/60 text-[#2F80ED] flex items-center justify-center shrink-0 shadow-2xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Account Password
                </h4>
                <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                  Regularly updating your password strengthens account protection.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPasswordModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:text-[#2F80ED] hover:border-[#2F80ED]/50 hover:bg-[#F7FAFF] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <span>Change Password</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F4F8]">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#B2F5EA]/60 text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      settings?.two_factor_enabled
                        ? 'bg-[#E8F8F5] text-[#1FA774] border-[#B2F5EA]/60'
                        : 'bg-[#FFFDF5] text-[#D97706] border-[#FEF3C7]/60'
                    }`}
                  >
                    {settings?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                  Add an extra layer of security using an authenticator app.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpen2FAModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:text-[#0FA3A3] hover:border-[#0FA3A3]/50 hover:bg-[#F7FAFF] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <span>Configure 2FA</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Sessions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F4F8]">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#F4F0FF] border border-[#E9D8FD]/60 text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Active Device Sessions
                </h4>
                <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                  View and manage devices currently logged into your account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenDevicesModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:text-[#8B5CF6] hover:border-[#8B5CF6]/50 hover:bg-[#F7FAFF] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <span>Manage Devices</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Data Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#FFFDF5] border border-[#FEF3C7]/60 text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Download Health & Profile Data
                </h4>
                <p className="text-[11px] sm:text-xs text-[#5F6F86]">
                  Request an encrypted archive of your medical records and profile.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Data export initiated. Your encrypted archive will be emailed shortly.')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:text-[#D97706] hover:border-[#D97706]/50 hover:bg-[#FFFDF5] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <span>Export My Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
